// ============================================================================
// 🧪 COGNITO JWT AUTH MIDDLEWARE TESTS
// ============================================================================
// Unit Tests für cognitoJwtAuth.ts
//
// WICHTIGE TEST-KONZEPTE:
// 1️⃣ MOCKING: Wir mocken aws-jwt-verify und Environment Variables
// 2️⃣ MIDDLEWARE TESTING: Testen von next() Aufrufen und Response Handling
// 3️⃣ AAA PATTERN: Arrange (Setup) → Act (Ausführen) → Assert (Prüfen)
// 4️⃣ SECURITY: Testen von Auth und Admin-Checks
// ============================================================================

import { Request, Response, NextFunction } from 'express';
import { verifyJwtToken, requireAuth, requireAdmin } from '../cognitoJwtAuth';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MOCK SETUP - aws-jwt-verify mocken
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

jest.mock('aws-jwt-verify');

// Mock-Daten für Tests
const mockValidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItMTIzIn0.test';

const mockTokenPayload = {
  sub: 'test-user-123',
  email: 'test@example.com',
  email_verified: true,
  'cognito:username': 'test@example.com',
  'custom:role': 'customer',
  iat: Date.now() / 1000,
  exp: (Date.now() / 1000) + 3600,
  token_use: 'id' as const
};

const mockAdminTokenPayload = {
  ...mockTokenPayload,
  sub: 'admin-user-456',
  email: 'admin@example.com',
  'custom:role': 'admin'
};

// Mock JWT Verifier
const mockVerify = jest.fn();
const mockJwtVerifier = {
  verify: mockVerify
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPER: Mock Request, Response, NextFunction
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const mockRequest = (overrides = {}) => {
  return {
    headers: {},
    path: '/api/test',
    method: 'GET',
    user: undefined,
    ...overrides
  } as unknown as Request;
};

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn() as NextFunction;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEST SUITE: verifyJwtToken
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('Middleware - verifyJwtToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Environment Variables
    process.env.COGNITO_USER_POOL_ID = 'eu-central-1_test123';
    process.env.COGNITO_CLIENT_ID = 'test-client-id-123';

    // Mock CognitoJwtVerifier.create
    (CognitoJwtVerifier.create as jest.Mock).mockReturnValue(mockJwtVerifier);

    // Suppress console.log/error during tests
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should verify valid token and set req.user', async () => {
    // ARRANGE
    const req = mockRequest({
      headers: { authorization: `Bearer ${mockValidToken}` }
    });
    const res = mockResponse();
    const next = mockNext;

    mockVerify.mockResolvedValue(mockTokenPayload);

    // ACT
    await verifyJwtToken(req, res, next);

    // ASSERT
    expect(mockVerify).toHaveBeenCalledWith(mockValidToken);
    expect(req.user).toEqual({
      userId: 'test-user-123',
      email: 'test@example.com',
      role: 'customer',
      emailVerified: true
    });
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should use default role "customer" if custom:role not set', async () => {
    // ARRANGE
    const payloadWithoutRole = {
      sub: mockTokenPayload.sub,
      email: mockTokenPayload.email,
      email_verified: mockTokenPayload.email_verified,
      'cognito:username': mockTokenPayload['cognito:username'],
      iat: mockTokenPayload.iat,
      exp: mockTokenPayload.exp,
      token_use: mockTokenPayload.token_use
      // custom:role is NOT included
    };

    const req = mockRequest({
      headers: { authorization: `Bearer ${mockValidToken}` }
    });
    const res = mockResponse();
    const next = mockNext;

    mockVerify.mockResolvedValue(payloadWithoutRole);

    // ACT
    await verifyJwtToken(req, res, next);

    // ASSERT
    expect(req.user).toEqual({
      userId: 'test-user-123',
      email: 'test@example.com',
      role: 'customer', // Default role
      emailVerified: true
    });
    expect(next).toHaveBeenCalled();
  });

  it('should return 401 if Authorization header is missing', async () => {
    // ARRANGE
    const req = mockRequest(); // No authorization header
    const res = mockResponse();
    const next = mockNext;

    // ACT
    await verifyJwtToken(req, res, next);

    // ASSERT
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'Kein Authorization Token gefunden. Bitte melde dich an.'
    });
    expect(next).not.toHaveBeenCalled();
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it('should return 401 if Authorization header does not start with Bearer', async () => {
    // ARRANGE
    const req = mockRequest({
      headers: { authorization: 'InvalidFormat token123' }
    });
    const res = mockResponse();
    const next = mockNext;

    // ACT
    await verifyJwtToken(req, res, next);

    // ASSERT
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'Kein Authorization Token gefunden. Bitte melde dich an.'
    });
    expect(next).not.toHaveBeenCalled();
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it('should return 401 if token verification fails (invalid token)', async () => {
    // ARRANGE
    const req = mockRequest({
      headers: { authorization: `Bearer invalid-token` }
    });
    const res = mockResponse();
    const next = mockNext;

    mockVerify.mockRejectedValue(new Error('Token verification failed'));

    // ACT
    await verifyJwtToken(req, res, next);

    // ASSERT
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'Invalid or expired token. Bitte melde dich erneut an.'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token is expired', async () => {
    // ARRANGE
    const req = mockRequest({
      headers: { authorization: `Bearer ${mockValidToken}` }
    });
    const res = mockResponse();
    const next = mockNext;

    mockVerify.mockRejectedValue(new Error('Token expired'));

    // ACT
    await verifyJwtToken(req, res, next);

    // ASSERT
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'Invalid or expired token. Bitte melde dich erneut an.'
    });
    expect(next).not.toHaveBeenCalled();
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEST SUITE: requireAuth
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('Middleware - requireAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Environment Variables
    process.env.COGNITO_USER_POOL_ID = 'eu-central-1_test123';
    process.env.COGNITO_CLIENT_ID = 'test-client-id-123';

    // Mock CognitoJwtVerifier.create
    (CognitoJwtVerifier.create as jest.Mock).mockReturnValue(mockJwtVerifier);

    // Suppress console.log/error during tests
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should allow access if user is authenticated', async () => {
    // ARRANGE
    const req = mockRequest({
      headers: { authorization: `Bearer ${mockValidToken}` }
    });
    const res = mockResponse();
    const next = mockNext;

    mockVerify.mockResolvedValue(mockTokenPayload);

    // ACT
    await requireAuth(req, res, next);

    // ASSERT
    expect(req.user).toBeDefined();
    expect(req.user?.userId).toBe('test-user-123');
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 401 if Authorization header is missing', async () => {
    // ARRANGE
    const req = mockRequest(); // No authorization header
    const res = mockResponse();
    const next = mockNext;

    // ACT
    await requireAuth(req, res, next);

    // ASSERT
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid', async () => {
    // ARRANGE
    const req = mockRequest({
      headers: { authorization: `Bearer invalid-token` }
    });
    const res = mockResponse();
    const next = mockNext;

    mockVerify.mockRejectedValue(new Error('Invalid token'));

    // ACT
    await requireAuth(req, res, next);

    // ASSERT
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEST SUITE: requireAdmin
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('Middleware - requireAdmin', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Environment Variables
    process.env.COGNITO_USER_POOL_ID = 'eu-central-1_test123';
    process.env.COGNITO_CLIENT_ID = 'test-client-id-123';

    // Mock CognitoJwtVerifier.create
    (CognitoJwtVerifier.create as jest.Mock).mockReturnValue(mockJwtVerifier);

    // Suppress console.log/error during tests
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should allow access if user is admin', async () => {
    // ARRANGE
    const req = mockRequest({
      headers: { authorization: `Bearer ${mockValidToken}` }
    });
    const res = mockResponse();
    const next = mockNext;

    mockVerify.mockResolvedValue(mockAdminTokenPayload);

    // ACT
    await requireAdmin(req, res, next);

    // ASSERT
    expect(req.user).toBeDefined();
    expect(req.user?.role).toBe('admin');
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 403 if user is not admin (customer role)', async () => {
    // ARRANGE
    const req = mockRequest({
      headers: { authorization: `Bearer ${mockValidToken}` }
    });
    const res = mockResponse();
    const next = mockNext;

    mockVerify.mockResolvedValue(mockTokenPayload); // customer role

    // ACT
    await requireAdmin(req, res, next);

    // ASSERT
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Forbidden',
      message: 'Diese Aktion ist nur für Admins erlaubt'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if user is not authenticated', async () => {
    // ARRANGE
    const req = mockRequest(); // No authorization header
    const res = mockResponse();
    const next = mockNext;

    // ACT
    await requireAdmin(req, res, next);

    // ASSERT
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid', async () => {
    // ARRANGE
    const req = mockRequest({
      headers: { authorization: `Bearer invalid-token` }
    });
    const res = mockResponse();
    const next = mockNext;

    mockVerify.mockRejectedValue(new Error('Invalid token'));

    // ACT
    await requireAdmin(req, res, next);

    // ASSERT
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});

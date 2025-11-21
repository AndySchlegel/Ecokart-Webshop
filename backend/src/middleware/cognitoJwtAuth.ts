// ============================================================================
// 🔐 COGNITO JWT AUTHENTICATION MIDDLEWARE (Direct Validation)
// ============================================================================
//
// Was macht diese Datei?
// - Validiert Cognito JWT Tokens DIREKT im Backend (ohne API Gateway)
// - Nutzt aws-jwt-verify Library (AWS offiziell)
// - Extrahiert User-Informationen aus validiertem Token
// - Stellt User-Daten in Express Requests bereit
//
// Warum nicht cognitoAuth.ts?
// - cognitoAuth.ts erwartet Claims vom API Gateway Authorizer
// - ABER: API Gateway Authorizer ist auf NONE (blockiert öffentliche Routes)
// - Daher: Backend muss JWT selbst validieren
//
// Wie funktioniert es?
// 1. Client sendet Token im Authorization Header
// 2. Backend validiert Token mit Cognito Public Keys
// 3. Bei Erfolg: User-Info wird in req.user gespeichert
// 4. Bei Fehler: 401 Unauthorized
//
// Autor: Andy Schlegel & Claude
// Datum: 21. November 2025
// ============================================================================

import { Request, Response, NextFunction } from 'express';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

// ============================================================================
// TYPESCRIPT TYPES
// ============================================================================

/**
 * Cognito JWT Token Payload
 */
export interface CognitoTokenPayload {
  sub: string;                    // User ID (UUID)
  email: string;                  // Email
  email_verified: boolean;        // Email verifiziert?
  'cognito:username': string;     // Username (= Email)
  'custom:role'?: string;         // Optional: Role
  iat: number;                    // Issued At
  exp: number;                    // Expires At
  token_use: 'id' | 'access';     // Token Type
}

/**
 * Vereinfachtes User-Objekt für Express
 */
export interface AuthUser {
  userId: string;
  email: string;
  role: string;
  emailVerified: boolean;
}

// Extend Express Request Type
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// ============================================================================
// JWT VERIFIER SETUP
// ============================================================================

/**
 * Cognito JWT Verifier
 *
 * WICHTIG: Diese Werte müssen mit deinem Cognito User Pool übereinstimmen!
 * - userPoolId: Aus Terraform Output oder AWS Console
 * - clientId: Aus Terraform Output oder AWS Console
 * - tokenUse: "id" (wir nutzen ID Token, nicht Access Token)
 */
let jwtVerifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;

/**
 * Initialisiert JWT Verifier mit Cognito Config
 *
 * Wird beim ersten Request automatisch aufgerufen
 */
function getJwtVerifier() {
  if (jwtVerifier) {
    return jwtVerifier;
  }

  // Cognito Config aus Environment Variables
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const clientId = process.env.COGNITO_CLIENT_ID;

  if (!userPoolId || !clientId) {
    throw new Error(
      '❌ Cognito Config fehlt! ' +
      'Setze COGNITO_USER_POOL_ID und COGNITO_CLIENT_ID in Environment Variables.'
    );
  }

  console.log('🔐 Initializing Cognito JWT Verifier...');
  console.log(`   User Pool ID: ${userPoolId}`);
  console.log(`   Client ID: ${clientId}`);

  jwtVerifier = CognitoJwtVerifier.create({
    userPoolId,
    clientId,
    tokenUse: 'id',  // ID Token validation
  });

  return jwtVerifier;
}

// ============================================================================
// MIDDLEWARE: VERIFY JWT TOKEN
// ============================================================================

/**
 * Express Middleware: JWT Token aus Authorization Header validieren
 *
 * Erwartetes Header Format:
 *   Authorization: Bearer <token>
 *
 * Bei erfolgreicher Validation:
 *   - req.user wird gesetzt
 *   - next() wird aufgerufen
 *
 * Bei Fehler:
 *   - 401 Unauthorized Response
 */
export async function verifyJwtToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Token aus Authorization Header extrahieren
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Kein Authorization Token gefunden. Bitte melde dich an.',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // 2. Token validieren mit Cognito Public Keys
    const verifier = getJwtVerifier();
    const payload = await verifier.verify(token) as CognitoTokenPayload;

    // 3. User-Info extrahieren
    const user: AuthUser = {
      userId: payload.sub,
      email: payload.email,
      role: payload['custom:role'] || 'customer',
      emailVerified: payload.email_verified === true,
    };

    // 4. User in Request speichern
    req.user = user;

    console.log(`✅ JWT validated for user: ${user.email} (${user.role})`);

    next();
  } catch (error: any) {
    // JWT Validation fehlgeschlagen
    console.error('❌ JWT validation failed:', error.message);

    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token. Bitte melde dich erneut an.',
    });
    return;
  }
}

// ============================================================================
// MIDDLEWARE: REQUIRE AUTH (mit JWT Validation)
// ============================================================================

/**
 * Express Middleware: Route benötigt Login
 *
 * Kombiniert JWT Validation + User Check
 * Nutze das für geschützte Routes:
 *   router.post('/api/cart', requireAuth, cartController.addToCart);
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Erst JWT validieren
  await verifyJwtToken(req, res, () => {
    // Dann prüfen ob User gesetzt wurde
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Du musst eingeloggt sein um diese Aktion durchzuführen',
      });
      return;
    }

    next();
  });
}

// ============================================================================
// MIDDLEWARE: REQUIRE ADMIN (mit JWT Validation)
// ============================================================================

/**
 * Express Middleware: Route benötigt Admin-Role
 *
 * Nutze das für Admin-Routes:
 *   router.post('/api/products', requireAdmin, productController.create);
 */
export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Erst JWT validieren + User check
  await requireAuth(req, res, () => {
    // Dann Admin-Role prüfen
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Diese Aktion ist nur für Admins erlaubt',
      });
      return;
    }

    next();
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  verifyJwtToken,
  requireAuth,
  requireAdmin,
};

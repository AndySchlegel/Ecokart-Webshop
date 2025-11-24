// ============================================================================
// 🧪 CART CONTROLLER TESTS
// ============================================================================
// Unit Tests für cartController.ts
//
// WICHTIGE TEST-KONZEPTE:
// 1️⃣ MOCKING: Wir mocken database-adapter (keine echten DynamoDB Calls)
// 2️⃣ ISOLATION: Jeder Test ist unabhängig (beforeEach cleared mocks)
// 3️⃣ AAA PATTERN: Arrange (Setup) → Act (Ausführen) → Assert (Prüfen)
// 4️⃣ EDGE CASES: Testen von Happy Path UND Error Cases
// ============================================================================

import { Request, Response } from 'express';
import { getCart, addToCart, removeFromCart, updateCartItem, clearCart } from '../cartController';
import database from '../../config/database-adapter';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MOCK SETUP - database-adapter mocken (keine echten AWS Calls!)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

jest.mock('../../config/database-adapter');

// Mock-Daten für Tests
const mockUserId = 'test-user-123';
const mockCartId = 'cart-abc-123';
const mockProductId = 'product-xyz-456';

const mockCart = {
  id: mockCartId,
  userId: mockUserId,
  items: [],
  createdAt: '2025-11-23T12:00:00Z',
  updatedAt: '2025-11-23T12:00:00Z'
};

const mockProduct = {
  id: mockProductId,
  name: 'Test Product',
  price: 19.99,
  stock: 100,
  reserved: 5,
  imageUrl: 'https://example.com/image.jpg',
  category: 'Test',
  description: 'A test product'
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPER: Mock Request & Response erstellen
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const mockRequest = (overrides = {}) => {
  return {
    user: { userId: mockUserId },
    body: {},
    params: {},
    ...overrides
  } as unknown as Request;
};

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEST SUITE: getCart
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('CartController - getCart', () => {
  // beforeEach: Läuft VOR jedem Test → Mocks zurücksetzen
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 1: Happy Path - Cart existiert bereits
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  it('should return existing cart for authenticated user', async () => {
    // ARRANGE: Setup
    const req = mockRequest();
    const res = mockResponse();
    (database.getCartByUserId as jest.Mock).mockResolvedValue(mockCart);

    // ACT: Funktion ausführen
    await getCart(req, res);

    // ASSERT: Prüfen ob korrekt
    expect(database.getCartByUserId).toHaveBeenCalledWith(mockUserId);
    expect(res.status).not.toHaveBeenCalled(); // 200 OK ist default
    expect(res.json).toHaveBeenCalledWith(mockCart);
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 2: Cart existiert NICHT → neuer Cart wird erstellt
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  it('should create new cart if cart does not exist', async () => {
    // ARRANGE
    const req = mockRequest();
    const res = mockResponse();
    (database.getCartByUserId as jest.Mock).mockResolvedValue(null);
    (database.createCart as jest.Mock).mockResolvedValue(undefined);

    // ACT
    await getCart(req, res);

    // ASSERT
    expect(database.getCartByUserId).toHaveBeenCalledWith(mockUserId);
    expect(database.createCart).toHaveBeenCalled();

    // Prüfen ob neuer Cart die richtige Struktur hat
    const createdCart = (database.createCart as jest.Mock).mock.calls[0][0];
    expect(createdCart).toMatchObject({
      userId: mockUserId,
      items: []
    });
    expect(createdCart.id).toBeDefined();
    expect(createdCart.createdAt).toBeDefined();
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 3: Error Case - Kein User authenticated (401)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  it('should return 401 if user is not authenticated', async () => {
    // ARRANGE: Request OHNE req.user
    const req = mockRequest({ user: undefined });
    const res = mockResponse();

    // ACT
    await getCart(req, res);

    // ASSERT
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(database.getCartByUserId).not.toHaveBeenCalled(); // DB nicht aufgerufen!
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 4: Error Case - Database Error (500)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  it('should return 500 if database throws error', async () => {
    // ARRANGE
    const req = mockRequest();
    const res = mockResponse();
    (database.getCartByUserId as jest.Mock).mockRejectedValue(new Error('DB Error'));

    // ACT
    await getCart(req, res);

    // ASSERT
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to get cart' });
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEST SUITE: addToCart (EXAMPLE - mehr Tests folgen)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('CartController - addToCart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add product to cart successfully', async () => {
    // ARRANGE
    const req = mockRequest({
      body: { productId: mockProductId, quantity: 2 }
    });
    const res = mockResponse();

    const updatedCart = { ...mockCart, items: [{
      productId: mockProductId,
      name: mockProduct.name,
      price: mockProduct.price,
      imageUrl: mockProduct.imageUrl,
      quantity: 2
    }]};

    (database.getCartByUserId as jest.Mock).mockResolvedValue(mockCart);
    (database.getProductById as jest.Mock).mockResolvedValue(mockProduct);
    (database.updateCart as jest.Mock).mockResolvedValue(updatedCart);
    (database.reserveStock as jest.Mock).mockResolvedValue(undefined); // ← FIX: reserveStock mocken!

    // ACT
    await addToCart(req, res);

    // ASSERT
    expect(database.getProductById).toHaveBeenCalledWith(mockProductId);
    expect(database.reserveStock).toHaveBeenCalledWith(mockProductId, 2); // Reserved erhöht
    expect(database.updateCart).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(updatedCart);
  });

  it('should return 401 if user not authenticated', async () => {
    // ARRANGE
    const req = mockRequest({
      user: undefined,
      body: { productId: mockProductId, quantity: 1 }
    });
    const res = mockResponse();

    // ACT
    await addToCart(req, res);

    // ASSERT
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('should return 400 if product is out of stock', async () => {
    // ARRANGE
    const outOfStockProduct = { ...mockProduct, stock: 5, reserved: 5 }; // 5-5 = 0 available
    const req = mockRequest({
      body: { productId: mockProductId, quantity: 1 }
    });
    const res = mockResponse();

    (database.getCartByUserId as jest.Mock).mockResolvedValue(mockCart);
    (database.getProductById as jest.Mock).mockResolvedValue(outOfStockProduct);

    // ACT
    await addToCart(req, res);

    // ASSERT
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Product is out of stock',
      availableStock: 0 // ← FIX: availableStock wird auch zurückgegeben!
    });
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// WEITERE TEST SUITES (folgen)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// TODO: Tests für:
// - updateCartItem (quantity ändern)
// - removeFromCart (Produkt entfernen)
// - clearCart (ganzen Cart löschen)
//
// Jede Funktion braucht:
// ✅ Happy Path Test
// ✅ 401 Unauthorized Test
// ✅ 404 Not Found Test (wenn applicable)
// ✅ 400 Bad Request Test (invalid input)
// ✅ 500 Server Error Test
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

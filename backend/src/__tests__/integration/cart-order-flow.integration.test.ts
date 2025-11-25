// ============================================================================
// Integration Test: Cart → Order Flow
// ============================================================================
// Tests complete user journey with real DynamoDB (LocalStack)
// This test verifies the entire flow:
//   1. Add products to cart
//   2. Create order
//   3. Cart is cleared
//   4. Stock is decremented
// ============================================================================

import request from 'supertest';
import express from 'express';
import { getDocClient } from '../helpers/localstack';
import { GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

// Import your Express app
import cartRoutes from '../../routes/cartRoutes';
import orderRoutes from '../../routes/orderRoutes';

// ============================================================================
// Test App Setup
// ============================================================================

const app = express();
app.use(express.json());

// Mock auth middleware for testing
app.use((req, res, next) => {
  // Simulate authenticated user
  req.user = {
    userId: 'integration-test-user',
    email: 'test@ecokart.com',
    role: 'customer',
    emailVerified: true
  };
  next();
});

// Add routes
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// ============================================================================
// Integration Tests
// ============================================================================

describe('Integration: Cart → Order Flow', () => {
  const testUserId = 'integration-test-user';
  let docClient: any;

  beforeAll(() => {
    // Initialize docClient AFTER globalSetup has run
    docClient = getDocClient();
  });

  // ============================================================================
  // Test 1: Complete Happy Path
  // ============================================================================

  it('should complete full cart → order flow with stock management', async () => {
    // ----------------------------------------------------------------
    // Step 1: Add product to cart
    // ----------------------------------------------------------------
    const addToCartResponse = await request(app)
      .post('/api/cart')
      .send({
        productId: 'test-product-1',
        quantity: 2
      });

    expect(addToCartResponse.status).toBe(200);
    expect(addToCartResponse.body.items).toHaveLength(1);
    expect(addToCartResponse.body.items[0].quantity).toBe(2);

    // Verify cart in DynamoDB
    const cartInDb = await docClient.send(new GetCommand({
      TableName: 'ecokart-carts',
      Key: { userId: testUserId }
    }));

    expect(cartInDb.Item).toBeDefined();
    expect(cartInDb.Item?.items).toHaveLength(1);

    // ----------------------------------------------------------------
    // Step 2: Get cart (verify persistence)
    // ----------------------------------------------------------------
    const getCartResponse = await request(app)
      .get('/api/cart');

    expect(getCartResponse.status).toBe(200);
    expect(getCartResponse.body.items).toHaveLength(1);
    expect(getCartResponse.body.items[0].productId).toBe('test-product-1');

    // ----------------------------------------------------------------
    // Step 3: Get product stock before order
    // ----------------------------------------------------------------
    const productBeforeOrder = await docClient.send(new GetCommand({
      TableName: 'ecokart-products',
      Key: { id: 'test-product-1' }
    }));

    const stockBefore = productBeforeOrder.Item?.stock || 0;
    expect(stockBefore).toBeGreaterThanOrEqual(2);

    // ----------------------------------------------------------------
    // Step 4: Create order
    // ----------------------------------------------------------------
    const createOrderResponse = await request(app)
      .post('/api/orders')
      .send({
        items: [
          {
            productId: 'test-product-1',
            productName: 'Test Product 1',
            quantity: 2,
            price: 29.99
          }
        ],
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          postalCode: '12345',
          country: 'Germany'
        },
        total: 59.98
      });

    expect(createOrderResponse.status).toBe(201);
    expect(createOrderResponse.body.id).toBeDefined();
    expect(createOrderResponse.body.status).toBe('pending');

    const orderId = createOrderResponse.body.id;

    // ----------------------------------------------------------------
    // Step 5: Verify cart is cleared
    // ----------------------------------------------------------------
    const cartAfterOrder = await docClient.send(new GetCommand({
      TableName: 'ecokart-carts',
      Key: { userId: testUserId }
    }));

    // Cart should be empty or not exist
    expect(
      !cartAfterOrder.Item || cartAfterOrder.Item.items.length === 0
    ).toBe(true);

    // ----------------------------------------------------------------
    // Step 6: Verify stock was decremented
    // ----------------------------------------------------------------
    const productAfterOrder = await docClient.send(new GetCommand({
      TableName: 'ecokart-products',
      Key: { id: 'test-product-1' }
    }));

    const stockAfter = productAfterOrder.Item?.stock || 0;
    expect(stockAfter).toBe(stockBefore - 2);

    // ----------------------------------------------------------------
    // Step 7: Verify order exists in database
    // ----------------------------------------------------------------
    const orderInDb = await docClient.send(new GetCommand({
      TableName: 'ecokart-orders',
      Key: { id: orderId }
    }));

    expect(orderInDb.Item).toBeDefined();
    expect(orderInDb.Item?.userId).toBe(testUserId);
    expect(orderInDb.Item?.status).toBe('pending');
    expect(orderInDb.Item?.total).toBe(59.98);

    // ----------------------------------------------------------------
    // Step 8: Get order via API
    // ----------------------------------------------------------------
    const getOrderResponse = await request(app)
      .get(`/api/orders/${orderId}`);

    expect(getOrderResponse.status).toBe(200);
    expect(getOrderResponse.body.id).toBe(orderId);
    expect(getOrderResponse.body.items).toHaveLength(1);
  }, 30000); // 30 second timeout for integration test

  // ============================================================================
  // Test 2: Multiple Products
  // ============================================================================

  it('should handle cart with multiple products', async () => {
    // Add first product
    await request(app)
      .post('/api/cart')
      .send({
        productId: 'test-product-1',
        quantity: 1
      });

    // Add second product
    await request(app)
      .post('/api/cart')
      .send({
        productId: 'test-product-2',
        quantity: 3
      });

    // Get cart
    const getCartResponse = await request(app)
      .get('/api/cart');

    expect(getCartResponse.status).toBe(200);
    expect(getCartResponse.body.items).toHaveLength(2);

    // Create order with both products
    const createOrderResponse = await request(app)
      .post('/api/orders')
      .send({
        items: [
          {
            productId: 'test-product-1',
            productName: 'Test Product 1',
            quantity: 1,
            price: 29.99
          },
          {
            productId: 'test-product-2',
            productName: 'Test Product 2',
            quantity: 3,
            price: 49.99
          }
        ],
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          postalCode: '12345',
          country: 'Germany'
        },
        total: 179.96
      });

    expect(createOrderResponse.status).toBe(201);

    // Verify cart is cleared
    const cartAfterOrder = await request(app)
      .get('/api/cart');

    expect(cartAfterOrder.body.items).toHaveLength(0);
  }, 30000);

  // ============================================================================
  // Test 3: Out of Stock Handling
  // ============================================================================

  it('should reject order if product is out of stock', async () => {
    // Try to add out-of-stock product
    const addToCartResponse = await request(app)
      .post('/api/cart')
      .send({
        productId: 'test-product-out-of-stock',
        quantity: 1
      });

    // Should fail because stock is 0
    expect(addToCartResponse.status).toBe(400);
    expect(addToCartResponse.body.error).toMatch(/out of stock/i);
  }, 30000);

  // ============================================================================
  // Test 4: Get User Orders
  // ============================================================================

  it('should retrieve all orders for authenticated user', async () => {
    // Create first order
    await request(app)
      .post('/api/cart')
      .send({ productId: 'test-product-1', quantity: 1 });

    await request(app)
      .post('/api/orders')
      .send({
        items: [{
          productId: 'test-product-1',
          productName: 'Test Product 1',
          quantity: 1,
          price: 29.99
        }],
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          postalCode: '12345',
          country: 'Germany'
        },
        total: 29.99
      });

    // Get all orders
    const getOrdersResponse = await request(app)
      .get('/api/orders');

    expect(getOrdersResponse.status).toBe(200);
    expect(Array.isArray(getOrdersResponse.body)).toBe(true);
    expect(getOrdersResponse.body.length).toBeGreaterThan(0);

    // All orders should belong to test user
    getOrdersResponse.body.forEach((order: any) => {
      expect(order.userId).toBe(testUserId);
    });
  }, 30000);

  // ============================================================================
  // Cleanup: Clear test data after each test
  // ============================================================================

  afterEach(async () => {
    // Clear cart
    try {
      await request(app).delete('/api/cart');
    } catch (error) {
      // Ignore errors - cart might already be empty
    }

    // Note: We don't delete orders or reset stock here
    // because each test should be independent with test data seeded fresh
  });
});

// ============================================================================
// Database Verification Tests
// ============================================================================

describe('Integration: Database State Verification', () => {
  let docClient: any;

  beforeAll(() => {
    // Initialize docClient AFTER globalSetup has run
    docClient = getDocClient();
  });

  it('should have test products in database', async () => {
    const products = await docClient.send(new ScanCommand({
      TableName: 'ecokart-products'
    }));

    expect(products.Items).toBeDefined();
    expect(products.Items!.length).toBeGreaterThan(0);

    // Verify test products exist
    const productIds = products.Items!.map((p: any) => p.id);
    expect(productIds).toContain('test-product-1');
    expect(productIds).toContain('test-product-2');
  });

  it('should have all required tables', async () => {
    const tables = ['ecokart-products', 'ecokart-carts', 'ecokart-orders', 'ecokart-users'];

    for (const tableName of tables) {
      // Try to scan table (will fail if table doesn't exist)
      const result = await docClient.send(new ScanCommand({
        TableName: tableName,
        Limit: 1
      }));

      expect(result).toBeDefined();
    }
  });
});

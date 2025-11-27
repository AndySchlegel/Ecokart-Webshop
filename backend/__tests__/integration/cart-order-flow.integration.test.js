"use strict";
// ============================================================================
// Integration Test: Cart → Order Flow
// ============================================================================
// Tests complete user journey with real DynamoDB (LocalStack)
// This test verifies the entire flow:
//   1. Add products to cart
//   2. Create order
//   3. Cart is cleared
//   4. Stock is decremented
//
// NOTE: This test runs in CI/CD via GitHub Actions with Docker-based LocalStack
// ============================================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const localstack_1 = require("../helpers/localstack");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
// ============================================================================
// Mock Authentication Middleware
// ============================================================================
// Mock the requireAuth middleware to bypass JWT validation in integration tests
jest.mock('../../middleware/cognitoJwtAuth', () => ({
    requireAuth: (req, res, next) => {
        // Set a test user on the request
        req.user = {
            userId: 'integration-test-user',
            email: 'test@ecokart.com',
            role: 'customer',
            emailVerified: true
        };
        next();
    }
}));
// Import routes AFTER mocking auth (important!)
const cartRoutes_1 = __importDefault(require("../../routes/cartRoutes"));
const orderRoutes_1 = __importDefault(require("../../routes/orderRoutes"));
// ============================================================================
// Test App Setup
// ============================================================================
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Add routes (auth is mocked at module level above)
app.use('/api/cart', cartRoutes_1.default);
app.use('/api/orders', orderRoutes_1.default);
// ============================================================================
// Integration Tests
// ============================================================================
describe('Integration: Cart → Order Flow', () => {
    const testUserId = 'integration-test-user';
    let docClient;
    beforeAll(() => {
        // Initialize docClient AFTER globalSetup has run
        docClient = (0, localstack_1.getDocClient)();
    });
    // ============================================================================
    // Test 1: Complete Happy Path
    // ============================================================================
    it('should complete full cart → order flow with stock management', async () => {
        // ----------------------------------------------------------------
        // Step 1: Add product to cart
        // ----------------------------------------------------------------
        const addToCartResponse = await (0, supertest_1.default)(app)
            .post('/api/cart/items')
            .send({
            productId: 'test-product-1',
            quantity: 2
        });
        expect(addToCartResponse.status).toBe(200);
        expect(addToCartResponse.body.items).toHaveLength(1);
        expect(addToCartResponse.body.items[0].quantity).toBe(2);
        // Verify cart in DynamoDB
        const cartInDb = await docClient.send(new lib_dynamodb_1.GetCommand({
            TableName: 'ecokart-carts',
            Key: { userId: testUserId }
        }));
        expect(cartInDb.Item).toBeDefined();
        expect(cartInDb.Item?.items).toHaveLength(1);
        // ----------------------------------------------------------------
        // Step 2: Get cart (verify persistence)
        // ----------------------------------------------------------------
        const getCartResponse = await (0, supertest_1.default)(app)
            .get('/api/cart');
        expect(getCartResponse.status).toBe(200);
        expect(getCartResponse.body.items).toHaveLength(1);
        expect(getCartResponse.body.items[0].productId).toBe('test-product-1');
        // ----------------------------------------------------------------
        // Step 3: Get product stock before order
        // ----------------------------------------------------------------
        const productBeforeOrder = await docClient.send(new lib_dynamodb_1.GetCommand({
            TableName: 'ecokart-products',
            Key: { id: 'test-product-1' }
        }));
        const stockBefore = productBeforeOrder.Item?.stock || 0;
        expect(stockBefore).toBeGreaterThanOrEqual(2);
        // ----------------------------------------------------------------
        // Step 4: Create order
        // ----------------------------------------------------------------
        const createOrderResponse = await (0, supertest_1.default)(app)
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
        const cartAfterOrder = await docClient.send(new lib_dynamodb_1.GetCommand({
            TableName: 'ecokart-carts',
            Key: { userId: testUserId }
        }));
        // Cart should be empty or not exist
        expect(!cartAfterOrder.Item || cartAfterOrder.Item.items.length === 0).toBe(true);
        // ----------------------------------------------------------------
        // Step 6: Verify stock was decremented
        // ----------------------------------------------------------------
        const productAfterOrder = await docClient.send(new lib_dynamodb_1.GetCommand({
            TableName: 'ecokart-products',
            Key: { id: 'test-product-1' }
        }));
        const stockAfter = productAfterOrder.Item?.stock || 0;
        expect(stockAfter).toBe(stockBefore - 2);
        // ----------------------------------------------------------------
        // Step 7: Verify order exists in database
        // ----------------------------------------------------------------
        const orderInDb = await docClient.send(new lib_dynamodb_1.GetCommand({
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
        const getOrderResponse = await (0, supertest_1.default)(app)
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
        await (0, supertest_1.default)(app)
            .post('/api/cart/items')
            .send({
            productId: 'test-product-1',
            quantity: 1
        });
        // Add second product
        await (0, supertest_1.default)(app)
            .post('/api/cart/items')
            .send({
            productId: 'test-product-2',
            quantity: 3
        });
        // Get cart
        const getCartResponse = await (0, supertest_1.default)(app)
            .get('/api/cart');
        expect(getCartResponse.status).toBe(200);
        expect(getCartResponse.body.items).toHaveLength(2);
        // Create order with both products
        const createOrderResponse = await (0, supertest_1.default)(app)
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
        const cartAfterOrder = await (0, supertest_1.default)(app)
            .get('/api/cart');
        expect(cartAfterOrder.body.items).toHaveLength(0);
    }, 30000);
    // ============================================================================
    // Test 3: Out of Stock Handling
    // ============================================================================
    it('should reject order if product is out of stock', async () => {
        // Try to add out-of-stock product
        const addToCartResponse = await (0, supertest_1.default)(app)
            .post('/api/cart/items')
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
        await (0, supertest_1.default)(app)
            .post('/api/cart/items')
            .send({ productId: 'test-product-1', quantity: 1 });
        await (0, supertest_1.default)(app)
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
        const getOrdersResponse = await (0, supertest_1.default)(app)
            .get('/api/orders');
        expect(getOrdersResponse.status).toBe(200);
        expect(Array.isArray(getOrdersResponse.body)).toBe(true);
        expect(getOrdersResponse.body.length).toBeGreaterThan(0);
        // All orders should belong to test user
        getOrdersResponse.body.forEach((order) => {
            expect(order.userId).toBe(testUserId);
        });
    }, 30000);
    // ============================================================================
    // Cleanup: Clear test data after each test
    // ============================================================================
    afterEach(async () => {
        // Clear cart
        try {
            await (0, supertest_1.default)(app).delete('/api/cart');
        }
        catch (error) {
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
    let docClient;
    beforeAll(() => {
        // Initialize docClient AFTER globalSetup has run
        docClient = (0, localstack_1.getDocClient)();
    });
    it('should have test products in database', async () => {
        const products = await docClient.send(new lib_dynamodb_1.ScanCommand({
            TableName: 'ecokart-products'
        }));
        expect(products.Items).toBeDefined();
        expect(products.Items.length).toBeGreaterThan(0);
        // Verify test products exist
        const productIds = products.Items.map((p) => p.id);
        expect(productIds).toContain('test-product-1');
        expect(productIds).toContain('test-product-2');
    });
    it('should have all required tables', async () => {
        const tables = ['ecokart-products', 'ecokart-carts', 'ecokart-orders', 'ecokart-users'];
        for (const tableName of tables) {
            // Try to scan table (will fail if table doesn't exist)
            const result = await docClient.send(new lib_dynamodb_1.ScanCommand({
                TableName: tableName,
                Limit: 1
            }));
            expect(result).toBeDefined();
        }
    });
});

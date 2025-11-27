"use strict";
// ============================================================================
// 🧪 ORDER CONTROLLER TESTS
// ============================================================================
// Unit Tests für orderController.ts
//
// WICHTIGE TEST-KONZEPTE:
// 1️⃣ MOCKING: Wir mocken database-adapter (keine echten DynamoDB Calls)
// 2️⃣ ISOLATION: Jeder Test ist unabhängig (beforeEach cleared mocks)
// 3️⃣ AAA PATTERN: Arrange (Setup) → Act (Ausführen) → Assert (Prüfen)
// 4️⃣ SECURITY: Testen dass User nur eigene Orders sehen/ändern können (403)
// ============================================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const orderController_1 = require("../orderController");
const database_adapter_1 = __importDefault(require("../../config/database-adapter"));
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MOCK SETUP - database-adapter mocken (keine echten AWS Calls!)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
jest.mock('../../config/database-adapter');
// Mock-Daten für Tests
const mockUserId = 'test-user-123';
const mockOtherUserId = 'other-user-456';
const mockOrderId = 'order-abc-123';
const mockProductId = 'product-xyz-456';
const mockCartId = 'cart-abc-123';
const mockOrder = {
    id: mockOrderId,
    userId: mockUserId,
    items: [
        {
            productId: mockProductId,
            name: 'Test Product',
            price: 19.99,
            imageUrl: 'https://example.com/image.jpg',
            quantity: 2
        }
    ],
    total: 39.98,
    shippingAddress: {
        street: '123 Test St',
        city: 'Test City',
        postalCode: '12345',
        country: 'Germany'
    },
    status: 'pending',
    createdAt: '2025-11-24T12:00:00Z',
    updatedAt: '2025-11-24T12:00:00Z'
};
const mockCart = {
    id: mockCartId,
    userId: mockUserId,
    items: [],
    createdAt: '2025-11-24T12:00:00Z',
    updatedAt: '2025-11-24T12:00:00Z'
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
    };
};
const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEST SUITE: createOrder
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('OrderController - createOrder', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should create order successfully and clear cart', async () => {
        // ARRANGE
        const orderInput = {
            items: [
                {
                    productId: mockProductId,
                    name: 'Test Product',
                    price: 19.99,
                    imageUrl: 'https://example.com/image.jpg',
                    quantity: 2
                }
            ],
            total: 39.98,
            shippingAddress: {
                street: '123 Test St',
                city: 'Test City',
                postalCode: '12345',
                country: 'Germany'
            }
        };
        const req = mockRequest({ body: orderInput });
        const res = mockResponse();
        database_adapter_1.default.createOrder.mockResolvedValue(mockOrder);
        database_adapter_1.default.decreaseStock.mockResolvedValue(undefined);
        database_adapter_1.default.getCartByUserId.mockResolvedValue(mockCart);
        database_adapter_1.default.updateCart.mockResolvedValue({ ...mockCart, items: [] });
        // ACT
        await (0, orderController_1.createOrder)(req, res);
        // ASSERT
        expect(database_adapter_1.default.createOrder).toHaveBeenCalledWith(expect.objectContaining({
            userId: mockUserId,
            items: orderInput.items,
            total: orderInput.total,
            shippingAddress: orderInput.shippingAddress,
            status: 'pending'
        }));
        expect(database_adapter_1.default.decreaseStock).toHaveBeenCalledWith(mockProductId, 2);
        expect(database_adapter_1.default.getCartByUserId).toHaveBeenCalledWith(mockUserId);
        expect(database_adapter_1.default.updateCart).toHaveBeenCalledWith(mockUserId, { items: [] });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(mockOrder);
    });
    it('should return 401 if user not authenticated', async () => {
        // ARRANGE
        const req = mockRequest({ user: undefined });
        const res = mockResponse();
        // ACT
        await (0, orderController_1.createOrder)(req, res);
        // ASSERT
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        expect(database_adapter_1.default.createOrder).not.toHaveBeenCalled();
    });
    it('should return 400 if items array is empty', async () => {
        // ARRANGE
        const req = mockRequest({
            body: {
                items: [],
                total: 0,
                shippingAddress: {
                    street: '123 Test St',
                    city: 'Test City',
                    postalCode: '12345',
                    country: 'Germany'
                }
            }
        });
        const res = mockResponse();
        // ACT
        await (0, orderController_1.createOrder)(req, res);
        // ASSERT
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Order must contain at least one item' });
        expect(database_adapter_1.default.createOrder).not.toHaveBeenCalled();
    });
    it('should return 400 if shipping address is incomplete', async () => {
        // ARRANGE
        const req = mockRequest({
            body: {
                items: [{ productId: mockProductId, quantity: 1 }],
                total: 19.99,
                shippingAddress: {
                    street: '123 Test St'
                    // Missing city, postalCode, country
                }
            }
        });
        const res = mockResponse();
        // ACT
        await (0, orderController_1.createOrder)(req, res);
        // ASSERT
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Complete shipping address is required' });
        expect(database_adapter_1.default.createOrder).not.toHaveBeenCalled();
    });
    it('should return 400 if total is invalid', async () => {
        // ARRANGE
        const req = mockRequest({
            body: {
                items: [{ productId: mockProductId, quantity: 1 }],
                total: 0,
                shippingAddress: {
                    street: '123 Test St',
                    city: 'Test City',
                    postalCode: '12345',
                    country: 'Germany'
                }
            }
        });
        const res = mockResponse();
        // ACT
        await (0, orderController_1.createOrder)(req, res);
        // ASSERT
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Valid total is required' });
        expect(database_adapter_1.default.createOrder).not.toHaveBeenCalled();
    });
    it('should return 500 if database throws error', async () => {
        // ARRANGE
        const orderInput = {
            items: [
                {
                    productId: mockProductId,
                    name: 'Test Product',
                    price: 19.99,
                    imageUrl: 'https://example.com/image.jpg',
                    quantity: 2
                }
            ],
            total: 39.98,
            shippingAddress: {
                street: '123 Test St',
                city: 'Test City',
                postalCode: '12345',
                country: 'Germany'
            }
        };
        const req = mockRequest({ body: orderInput });
        const res = mockResponse();
        database_adapter_1.default.createOrder.mockRejectedValue(new Error('DB Error'));
        // ACT
        await (0, orderController_1.createOrder)(req, res);
        // ASSERT
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Failed to create order' });
    });
});
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEST SUITE: getOrders
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('OrderController - getOrders', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should return all orders for authenticated user', async () => {
        // ARRANGE
        const req = mockRequest();
        const res = mockResponse();
        const mockOrders = [mockOrder];
        database_adapter_1.default.getOrdersByUserId.mockResolvedValue(mockOrders);
        // ACT
        await (0, orderController_1.getOrders)(req, res);
        // ASSERT
        expect(database_adapter_1.default.getOrdersByUserId).toHaveBeenCalledWith(mockUserId);
        expect(res.json).toHaveBeenCalledWith(mockOrders);
    });
    it('should return 401 if user not authenticated', async () => {
        // ARRANGE
        const req = mockRequest({ user: undefined });
        const res = mockResponse();
        // ACT
        await (0, orderController_1.getOrders)(req, res);
        // ASSERT
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        expect(database_adapter_1.default.getOrdersByUserId).not.toHaveBeenCalled();
    });
    it('should return 500 if database throws error', async () => {
        // ARRANGE
        const req = mockRequest();
        const res = mockResponse();
        database_adapter_1.default.getOrdersByUserId.mockRejectedValue(new Error('DB Error'));
        // ACT
        await (0, orderController_1.getOrders)(req, res);
        // ASSERT
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Failed to get orders' });
    });
});
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEST SUITE: getOrderById
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('OrderController - getOrderById', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should return order for authenticated user who owns the order', async () => {
        // ARRANGE
        const req = mockRequest({ params: { id: mockOrderId } });
        const res = mockResponse();
        database_adapter_1.default.getOrderById.mockResolvedValue(mockOrder);
        // ACT
        await (0, orderController_1.getOrderById)(req, res);
        // ASSERT
        expect(database_adapter_1.default.getOrderById).toHaveBeenCalledWith(mockOrderId);
        expect(res.json).toHaveBeenCalledWith(mockOrder);
    });
    it('should return 401 if user not authenticated', async () => {
        // ARRANGE
        const req = mockRequest({ user: undefined, params: { id: mockOrderId } });
        const res = mockResponse();
        // ACT
        await (0, orderController_1.getOrderById)(req, res);
        // ASSERT
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        expect(database_adapter_1.default.getOrderById).not.toHaveBeenCalled();
    });
    it('should return 404 if order not found', async () => {
        // ARRANGE
        const req = mockRequest({ params: { id: 'non-existent-id' } });
        const res = mockResponse();
        database_adapter_1.default.getOrderById.mockResolvedValue(null);
        // ACT
        await (0, orderController_1.getOrderById)(req, res);
        // ASSERT
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Order not found' });
    });
    it('should return 403 if user tries to access another users order', async () => {
        // ARRANGE
        const req = mockRequest({ params: { id: mockOrderId } });
        const res = mockResponse();
        const otherUsersOrder = { ...mockOrder, userId: mockOtherUserId };
        database_adapter_1.default.getOrderById.mockResolvedValue(otherUsersOrder);
        // ACT
        await (0, orderController_1.getOrderById)(req, res);
        // ASSERT
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: 'Access denied' });
    });
    it('should return 500 if database throws error', async () => {
        // ARRANGE
        const req = mockRequest({ params: { id: mockOrderId } });
        const res = mockResponse();
        database_adapter_1.default.getOrderById.mockRejectedValue(new Error('DB Error'));
        // ACT
        await (0, orderController_1.getOrderById)(req, res);
        // ASSERT
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Failed to get order' });
    });
});
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEST SUITE: updateOrderStatus
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('OrderController - updateOrderStatus', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should update order status successfully', async () => {
        // ARRANGE
        const req = mockRequest({
            params: { id: mockOrderId },
            body: { status: 'shipped' }
        });
        const res = mockResponse();
        const updatedOrder = { ...mockOrder, status: 'shipped' };
        database_adapter_1.default.getOrderById.mockResolvedValue(mockOrder);
        database_adapter_1.default.updateOrder.mockResolvedValue(updatedOrder);
        // ACT
        await (0, orderController_1.updateOrderStatus)(req, res);
        // ASSERT
        expect(database_adapter_1.default.getOrderById).toHaveBeenCalledWith(mockOrderId);
        expect(database_adapter_1.default.updateOrder).toHaveBeenCalledWith(mockOrderId, { status: 'shipped' });
        expect(res.json).toHaveBeenCalledWith(updatedOrder);
    });
    it('should return 401 if user not authenticated', async () => {
        // ARRANGE
        const req = mockRequest({
            user: undefined,
            params: { id: mockOrderId },
            body: { status: 'shipped' }
        });
        const res = mockResponse();
        // ACT
        await (0, orderController_1.updateOrderStatus)(req, res);
        // ASSERT
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        expect(database_adapter_1.default.getOrderById).not.toHaveBeenCalled();
    });
    it('should return 400 if status is invalid', async () => {
        // ARRANGE
        const req = mockRequest({
            params: { id: mockOrderId },
            body: { status: 'invalid-status' }
        });
        const res = mockResponse();
        // ACT
        await (0, orderController_1.updateOrderStatus)(req, res);
        // ASSERT
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Valid status is required',
            validStatuses: ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
        });
        expect(database_adapter_1.default.getOrderById).not.toHaveBeenCalled();
    });
    it('should return 404 if order not found', async () => {
        // ARRANGE
        const req = mockRequest({
            params: { id: 'non-existent-id' },
            body: { status: 'shipped' }
        });
        const res = mockResponse();
        database_adapter_1.default.getOrderById.mockResolvedValue(null);
        // ACT
        await (0, orderController_1.updateOrderStatus)(req, res);
        // ASSERT
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Order not found' });
        expect(database_adapter_1.default.updateOrder).not.toHaveBeenCalled();
    });
    it('should return 403 if user tries to update another users order', async () => {
        // ARRANGE
        const req = mockRequest({
            params: { id: mockOrderId },
            body: { status: 'shipped' }
        });
        const res = mockResponse();
        const otherUsersOrder = { ...mockOrder, userId: mockOtherUserId };
        database_adapter_1.default.getOrderById.mockResolvedValue(otherUsersOrder);
        // ACT
        await (0, orderController_1.updateOrderStatus)(req, res);
        // ASSERT
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: 'Access denied' });
        expect(database_adapter_1.default.updateOrder).not.toHaveBeenCalled();
    });
    it('should return 500 if database throws error', async () => {
        // ARRANGE
        const req = mockRequest({
            params: { id: mockOrderId },
            body: { status: 'shipped' }
        });
        const res = mockResponse();
        database_adapter_1.default.getOrderById.mockResolvedValue(mockOrder);
        database_adapter_1.default.updateOrder.mockRejectedValue(new Error('DB Error'));
        // ACT
        await (0, orderController_1.updateOrderStatus)(req, res);
        // ASSERT
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Failed to update order status' });
    });
});

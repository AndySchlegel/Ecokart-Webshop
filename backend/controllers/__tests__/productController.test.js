"use strict";
// ============================================================================
// 🧪 PRODUCT CONTROLLER TESTS
// ============================================================================
// Unit Tests für productController.ts - CRUD operations für Products
// ============================================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const productController_1 = require("../productController");
const database_adapter_1 = __importDefault(require("../../config/database-adapter"));
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MOCK SETUP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
jest.mock('../../config/database-adapter');
const mockProduct = {
    id: 'product-123',
    name: 'Test Product',
    price: 19.99,
    description: 'A test product',
    imageUrl: 'https://example.com/image.jpg',
    category: 'Electronics',
    stock: 100,
    reserved: 5,
    createdAt: '2025-11-24T12:00:00Z',
    updatedAt: '2025-11-24T12:00:00Z'
};
const mockRequest = (overrides = {}) => {
    return {
        body: {},
        params: {},
        ...overrides
    };
};
const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
};
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEST SUITE: getAllProducts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('ProductController - getAllProducts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation();
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    it('should return all products', async () => {
        // ARRANGE
        const req = mockRequest();
        const res = mockResponse();
        const mockProducts = [mockProduct];
        database_adapter_1.default.getAllProducts.mockResolvedValue(mockProducts);
        // ACT
        await (0, productController_1.getAllProducts)(req, res);
        // ASSERT
        expect(database_adapter_1.default.getAllProducts).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({ items: mockProducts, count: 1 });
    });
    it('should return 500 if database throws error', async () => {
        // ARRANGE
        const req = mockRequest();
        const res = mockResponse();
        database_adapter_1.default.getAllProducts.mockRejectedValue(new Error('DB Error'));
        // ACT
        await (0, productController_1.getAllProducts)(req, res);
        // ASSERT
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch products' });
    });
});
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEST SUITE: getProductById
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('ProductController - getProductById', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation();
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    it('should return product by id', async () => {
        // ARRANGE
        const req = mockRequest({ params: { id: 'product-123' } });
        const res = mockResponse();
        database_adapter_1.default.getProductById.mockResolvedValue(mockProduct);
        // ACT
        await (0, productController_1.getProductById)(req, res);
        // ASSERT
        expect(database_adapter_1.default.getProductById).toHaveBeenCalledWith('product-123');
        expect(res.json).toHaveBeenCalledWith(mockProduct);
    });
    it('should return 404 if product not found', async () => {
        // ARRANGE
        const req = mockRequest({ params: { id: 'non-existent' } });
        const res = mockResponse();
        database_adapter_1.default.getProductById.mockResolvedValue(null);
        // ACT
        await (0, productController_1.getProductById)(req, res);
        // ASSERT
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Product not found' });
    });
    it('should return 500 if database throws error', async () => {
        // ARRANGE
        const req = mockRequest({ params: { id: 'product-123' } });
        const res = mockResponse();
        database_adapter_1.default.getProductById.mockRejectedValue(new Error('DB Error'));
        // ACT
        await (0, productController_1.getProductById)(req, res);
        // ASSERT
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch product' });
    });
});
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEST SUITE: createProduct
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('ProductController - createProduct', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation();
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    it('should create product successfully', async () => {
        // ARRANGE
        const productInput = {
            name: 'New Product',
            price: 29.99,
            description: 'A new product',
            imageUrl: 'https://example.com/new.jpg',
            category: 'Test',
            stock: 50
        };
        const req = mockRequest({ body: productInput });
        const res = mockResponse();
        database_adapter_1.default.createProduct.mockResolvedValue({ ...mockProduct, ...productInput });
        // ACT
        await (0, productController_1.createProduct)(req, res);
        // ASSERT
        expect(database_adapter_1.default.createProduct).toHaveBeenCalledWith(expect.objectContaining({
            name: productInput.name,
            price: productInput.price,
            description: productInput.description,
            imageUrl: productInput.imageUrl
        }));
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalled();
    });
    it('should return 400 if required fields are missing', async () => {
        // ARRANGE
        const req = mockRequest({
            body: {
                name: 'Incomplete Product'
                // Missing price, description, imageUrl
            }
        });
        const res = mockResponse();
        // ACT
        await (0, productController_1.createProduct)(req, res);
        // ASSERT
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Missing required fields: name, price, description, imageUrl'
        });
        expect(database_adapter_1.default.createProduct).not.toHaveBeenCalled();
    });
    it('should return 500 if database throws error', async () => {
        // ARRANGE
        const productInput = {
            name: 'New Product',
            price: 29.99,
            description: 'A new product',
            imageUrl: 'https://example.com/new.jpg'
        };
        const req = mockRequest({ body: productInput });
        const res = mockResponse();
        database_adapter_1.default.createProduct.mockRejectedValue(new Error('DB Error'));
        // ACT
        await (0, productController_1.createProduct)(req, res);
        // ASSERT
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Failed to create product' });
    });
});
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEST SUITE: updateProduct
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('ProductController - updateProduct', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation();
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    it('should update product successfully', async () => {
        // ARRANGE
        const updates = { price: 24.99, stock: 75 };
        const req = mockRequest({
            params: { id: 'product-123' },
            body: updates
        });
        const res = mockResponse();
        const updatedProduct = { ...mockProduct, ...updates };
        database_adapter_1.default.updateProduct.mockResolvedValue(updatedProduct);
        // ACT
        await (0, productController_1.updateProduct)(req, res);
        // ASSERT
        expect(database_adapter_1.default.updateProduct).toHaveBeenCalledWith('product-123', updates);
        expect(res.json).toHaveBeenCalledWith(updatedProduct);
    });
    it('should return 404 if product not found', async () => {
        // ARRANGE
        const req = mockRequest({
            params: { id: 'non-existent' },
            body: { price: 24.99 }
        });
        const res = mockResponse();
        database_adapter_1.default.updateProduct.mockResolvedValue(null);
        // ACT
        await (0, productController_1.updateProduct)(req, res);
        // ASSERT
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Product not found' });
    });
    it('should return 500 if database throws error', async () => {
        // ARRANGE
        const req = mockRequest({
            params: { id: 'product-123' },
            body: { price: 24.99 }
        });
        const res = mockResponse();
        database_adapter_1.default.updateProduct.mockRejectedValue(new Error('DB Error'));
        // ACT
        await (0, productController_1.updateProduct)(req, res);
        // ASSERT
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Failed to update product' });
    });
});
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEST SUITE: deleteProduct
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('ProductController - deleteProduct', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation();
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    it('should delete product successfully', async () => {
        // ARRANGE
        const req = mockRequest({ params: { id: 'product-123' } });
        const res = mockResponse();
        database_adapter_1.default.deleteProduct.mockResolvedValue(true);
        // ACT
        await (0, productController_1.deleteProduct)(req, res);
        // ASSERT
        expect(database_adapter_1.default.deleteProduct).toHaveBeenCalledWith('product-123');
        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.send).toHaveBeenCalled();
    });
    it('should return 404 if product not found', async () => {
        // ARRANGE
        const req = mockRequest({ params: { id: 'non-existent' } });
        const res = mockResponse();
        database_adapter_1.default.deleteProduct.mockResolvedValue(false);
        // ACT
        await (0, productController_1.deleteProduct)(req, res);
        // ASSERT
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Product not found' });
    });
    it('should return 500 if database throws error', async () => {
        // ARRANGE
        const req = mockRequest({ params: { id: 'product-123' } });
        const res = mockResponse();
        database_adapter_1.default.deleteProduct.mockRejectedValue(new Error('DB Error'));
        // ACT
        await (0, productController_1.deleteProduct)(req, res);
        // ASSERT
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Failed to delete product' });
    });
});

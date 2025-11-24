// ============================================================================
// 🧪 PRODUCT CONTROLLER TESTS
// ============================================================================
// Unit Tests für productController.ts - CRUD operations für Products
// ============================================================================

import { Request, Response } from 'express';
import { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../productController';
import database from '../../config/database-adapter';

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
  } as unknown as Request;
};

const mockResponse = () => {
  const res = {} as Response;
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

    (database.getAllProducts as jest.Mock).mockResolvedValue(mockProducts);

    // ACT
    await getAllProducts(req, res);

    // ASSERT
    expect(database.getAllProducts).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ items: mockProducts, count: 1 });
  });

  it('should return 500 if database throws error', async () => {
    // ARRANGE
    const req = mockRequest();
    const res = mockResponse();

    (database.getAllProducts as jest.Mock).mockRejectedValue(new Error('DB Error'));

    // ACT
    await getAllProducts(req, res);

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

    (database.getProductById as jest.Mock).mockResolvedValue(mockProduct);

    // ACT
    await getProductById(req, res);

    // ASSERT
    expect(database.getProductById).toHaveBeenCalledWith('product-123');
    expect(res.json).toHaveBeenCalledWith(mockProduct);
  });

  it('should return 404 if product not found', async () => {
    // ARRANGE
    const req = mockRequest({ params: { id: 'non-existent' } });
    const res = mockResponse();

    (database.getProductById as jest.Mock).mockResolvedValue(null);

    // ACT
    await getProductById(req, res);

    // ASSERT
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Product not found' });
  });

  it('should return 500 if database throws error', async () => {
    // ARRANGE
    const req = mockRequest({ params: { id: 'product-123' } });
    const res = mockResponse();

    (database.getProductById as jest.Mock).mockRejectedValue(new Error('DB Error'));

    // ACT
    await getProductById(req, res);

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

    (database.createProduct as jest.Mock).mockResolvedValue({ ...mockProduct, ...productInput });

    // ACT
    await createProduct(req, res);

    // ASSERT
    expect(database.createProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        name: productInput.name,
        price: productInput.price,
        description: productInput.description,
        imageUrl: productInput.imageUrl
      })
    );
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
    await createProduct(req, res);

    // ASSERT
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Missing required fields: name, price, description, imageUrl'
    });
    expect(database.createProduct).not.toHaveBeenCalled();
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

    (database.createProduct as jest.Mock).mockRejectedValue(new Error('DB Error'));

    // ACT
    await createProduct(req, res);

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
    (database.updateProduct as jest.Mock).mockResolvedValue(updatedProduct);

    // ACT
    await updateProduct(req, res);

    // ASSERT
    expect(database.updateProduct).toHaveBeenCalledWith('product-123', updates);
    expect(res.json).toHaveBeenCalledWith(updatedProduct);
  });

  it('should return 404 if product not found', async () => {
    // ARRANGE
    const req = mockRequest({
      params: { id: 'non-existent' },
      body: { price: 24.99 }
    });
    const res = mockResponse();

    (database.updateProduct as jest.Mock).mockResolvedValue(null);

    // ACT
    await updateProduct(req, res);

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

    (database.updateProduct as jest.Mock).mockRejectedValue(new Error('DB Error'));

    // ACT
    await updateProduct(req, res);

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

    (database.deleteProduct as jest.Mock).mockResolvedValue(true);

    // ACT
    await deleteProduct(req, res);

    // ASSERT
    expect(database.deleteProduct).toHaveBeenCalledWith('product-123');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it('should return 404 if product not found', async () => {
    // ARRANGE
    const req = mockRequest({ params: { id: 'non-existent' } });
    const res = mockResponse();

    (database.deleteProduct as jest.Mock).mockResolvedValue(false);

    // ACT
    await deleteProduct(req, res);

    // ASSERT
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Product not found' });
  });

  it('should return 500 if database throws error', async () => {
    // ARRANGE
    const req = mockRequest({ params: { id: 'product-123' } });
    const res = mockResponse();

    (database.deleteProduct as jest.Mock).mockRejectedValue(new Error('DB Error'));

    // ACT
    await deleteProduct(req, res);

    // ASSERT
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to delete product' });
  });
});

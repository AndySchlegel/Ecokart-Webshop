import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import database from '../config/database-adapter';
import { Product, ProductCreateInput, ProductUpdateInput } from '../models/Product';

export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await database.getAllProducts();
    res.json({ items: products, count: products.length });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await database.getProductById(id);

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const input: ProductCreateInput = req.body;

    if (!input.name || !input.price || !input.description || !input.imageUrl) {
      res.status(400).json({ error: 'Missing required fields: name, price, description, imageUrl' });
      return;
    }

    const newProduct: Product = {
      id: uuidv4(),
      ...input,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const created = await database.createProduct(newProduct);
    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates: ProductUpdateInput = req.body;

    const updated = await database.updateProduct(id, updates);

    if (!updated) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await database.deleteProduct(id);

    if (!deleted) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

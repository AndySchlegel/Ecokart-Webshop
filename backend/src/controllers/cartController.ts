import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import database from '../config/database-adapter';
import { AuthRequest } from '../middleware/auth';
import { Cart, AddToCartInput, UpdateCartItemInput } from '../models/Cart';

export const getCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    let cart = await database.getCartByUserId(userId);

    // Create cart if doesn't exist
    if (!cart) {
      cart = {
        id: uuidv4(),
        userId,
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await database.createCart(cart);
    }

    res.json(cart);
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Failed to get cart' });
  }
};

export const addToCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { productId, quantity }: AddToCartInput = req.body;

    if (!productId || !quantity || quantity < 1) {
      res.status(400).json({ error: 'Product ID and valid quantity are required' });
      return;
    }

    // Get product details
    const product = await database.getProductById(productId);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // Get or create cart
    let cart = await database.getCartByUserId(userId);
    if (!cart) {
      cart = {
        id: uuidv4(),
        userId,
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      cart = await database.createCart(cart);
    }

    // Check if item already in cart
    const existingItemIndex = cart.items.findIndex(item => item.productId === productId);

    if (existingItemIndex >= 0) {
      // Update quantity
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.items.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        quantity
      });
    }

    const updated = await database.updateCart(userId, { items: cart.items });
    res.json(updated);
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
};

export const updateCartItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { productId, quantity }: UpdateCartItemInput = req.body;

    if (!productId || quantity < 0) {
      res.status(400).json({ error: 'Product ID and valid quantity are required' });
      return;
    }

    const cart = await database.getCartByUserId(userId);
    if (!cart) {
      res.status(404).json({ error: 'Cart not found' });
      return;
    }

    if (quantity === 0) {
      // Remove item
      cart.items = cart.items.filter(item => item.productId !== productId);
    } else {
      // Update quantity
      const itemIndex = cart.items.findIndex(item => item.productId === productId);
      if (itemIndex === -1) {
        res.status(404).json({ error: 'Item not in cart' });
        return;
      }
      cart.items[itemIndex].quantity = quantity;
    }

    const updated = await database.updateCart(userId, { items: cart.items });
    res.json(updated);
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ error: 'Failed to update cart' });
  }
};

export const removeFromCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { productId } = req.params;

    const cart = await database.getCartByUserId(userId);
    if (!cart) {
      res.status(404).json({ error: 'Cart not found' });
      return;
    }

    cart.items = cart.items.filter(item => item.productId !== productId);
    const updated = await database.updateCart(userId, { items: cart.items });
    res.json(updated);
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Failed to remove from cart' });
  }
};

export const clearCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const cart = await database.getCartByUserId(userId);
    if (!cart) {
      res.status(404).json({ error: 'Cart not found' });
      return;
    }

    const updated = await database.updateCart(userId, { items: [] });
    res.json(updated);
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
};

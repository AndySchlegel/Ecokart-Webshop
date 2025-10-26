import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import database from '../config/database-adapter';
import { AuthRequest } from '../middleware/auth';
import { Order, CreateOrderInput } from '../models/Order';

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { items, shippingAddress, total }: CreateOrderInput = req.body;

    if (!items || items.length === 0) {
      res.status(400).json({ error: 'Order must contain at least one item' });
      return;
    }

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.postalCode || !shippingAddress.country) {
      res.status(400).json({ error: 'Complete shipping address is required' });
      return;
    }

    if (!total || total <= 0) {
      res.status(400).json({ error: 'Valid total is required' });
      return;
    }

    const newOrder: Order = {
      id: uuidv4(),
      userId,
      items,
      total,
      shippingAddress,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const created = await database.createOrder(newOrder);

    // Clear the user's cart after successful order
    const cart = await database.getCartByUserId(userId);
    if (cart) {
      await database.updateCart(cart.id, { items: [] });
    }

    res.status(201).json(created);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

export const getOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const orders = await database.getOrdersByUserId(userId);
    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const order = await database.getOrderById(id);

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Ensure user can only access their own orders
    if (order.userId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to get order' });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ error: 'Valid status is required', validStatuses });
      return;
    }

    const order = await database.getOrderById(id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Ensure user can only update their own orders
    if (order.userId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const updated = await database.updateOrder(id, { status });
    res.json(updated);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

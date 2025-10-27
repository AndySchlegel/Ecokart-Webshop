import { GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { dynamodb, TableNames } from './client';
import { Cart } from '../../models/Cart';

export class CartsService {
  /**
   * Get cart by userId (userId is the partition key)
   */
  async getByUserId(userId: string): Promise<Cart | null> {
    const result = await dynamodb.send(new GetCommand({
      TableName: TableNames.CARTS,
      Key: { userId },
    }));

    return result.Item as Cart || null;
  }

  /**
   * Create new cart
   */
  async create(cart: Cart): Promise<Cart> {
    await dynamodb.send(new PutCommand({
      TableName: TableNames.CARTS,
      Item: cart,
    }));

    return cart;
  }

  /**
   * Update cart (uses userId as primary key)
   */
  async update(userId: string, updates: Partial<Cart>): Promise<Cart> {
    const existing = await this.getByUserId(userId);
    if (!existing) {
      throw new Error('Cart not found');
    }

    const updated = { ...existing, ...updates, userId, updatedAt: new Date().toISOString() };

    await dynamodb.send(new PutCommand({
      TableName: TableNames.CARTS,
      Item: updated,
    }));

    return updated;
  }

  /**
   * Delete cart (uses userId as primary key)
   */
  async delete(userId: string): Promise<void> {
    await dynamodb.send(new DeleteCommand({
      TableName: TableNames.CARTS,
      Key: { userId },
    }));
  }
}

export const cartsService = new CartsService();

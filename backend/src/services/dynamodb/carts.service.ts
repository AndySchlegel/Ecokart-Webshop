import { GetCommand, PutCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamodb, TableNames } from './client';
import { Cart } from '../../models/Cart';

export class CartsService {
  /**
   * Get cart by userId
   */
  async getByUserId(userId: string): Promise<Cart | null> {
    const result = await dynamodb.send(new QueryCommand({
      TableName: TableNames.CARTS,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    }));

    const items = result.Items || [];
    return items.length > 0 ? (items[0] as Cart) : null;
  }

  /**
   * Get cart by ID
   */
  async getById(id: string): Promise<Cart | null> {
    const result = await dynamodb.send(new GetCommand({
      TableName: TableNames.CARTS,
      Key: { id },
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
   * Update cart
   */
  async update(id: string, updates: Partial<Cart>): Promise<Cart> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Cart not found');
    }

    const updated = { ...existing, ...updates, id, updatedAt: new Date().toISOString() };

    await dynamodb.send(new PutCommand({
      TableName: TableNames.CARTS,
      Item: updated,
    }));

    return updated;
  }

  /**
   * Delete cart
   */
  async delete(id: string): Promise<void> {
    await dynamodb.send(new DeleteCommand({
      TableName: TableNames.CARTS,
      Key: { id },
    }));
  }
}

export const cartsService = new CartsService();

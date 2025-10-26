import { GetCommand, PutCommand, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamodb, TableNames } from './client';
import { Order } from '../../models/Order';

export class OrdersService {
  /**
   * Get all orders
   */
  async getAll(): Promise<Order[]> {
    const result = await dynamodb.send(new ScanCommand({
      TableName: TableNames.ORDERS,
    }));

    return (result.Items || []) as Order[];
  }

  /**
   * Get order by ID
   */
  async getById(id: string): Promise<Order | null> {
    const result = await dynamodb.send(new GetCommand({
      TableName: TableNames.ORDERS,
      Key: { id },
    }));

    return result.Item as Order || null;
  }

  /**
   * Get orders by userId using GSI
   */
  async getByUserId(userId: string): Promise<Order[]> {
    const result = await dynamodb.send(new QueryCommand({
      TableName: TableNames.ORDERS,
      IndexName: 'UserOrdersIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      ScanIndexForward: false, // Sort by createdAt descending
    }));

    return (result.Items || []) as Order[];
  }

  /**
   * Create new order
   */
  async create(order: Order): Promise<Order> {
    await dynamodb.send(new PutCommand({
      TableName: TableNames.ORDERS,
      Item: order,
    }));

    return order;
  }

  /**
   * Update order
   */
  async update(id: string, updates: Partial<Order>): Promise<Order> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Order not found');
    }

    const updated = { ...existing, ...updates, id, updatedAt: new Date().toISOString() };

    await dynamodb.send(new PutCommand({
      TableName: TableNames.ORDERS,
      Item: updated,
    }));

    return updated;
  }
}

export const ordersService = new OrdersService();

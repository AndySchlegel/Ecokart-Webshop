import { GetCommand, PutCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { dynamodb, TableNames } from './client';
import { User } from '../../models/User';

export class UsersService {
  /**
   * Get all users
   */
  async getAll(): Promise<User[]> {
    const result = await dynamodb.send(new ScanCommand({
      TableName: TableNames.USERS,
    }));

    return (result.Items || []) as User[];
  }

  /**
   * Get user by ID
   */
  async getById(id: string): Promise<User | null> {
    const result = await dynamodb.send(new GetCommand({
      TableName: TableNames.USERS,
      Key: { id },
    }));

    return result.Item as User || null;
  }

  /**
   * Get user by email using GSI
   */
  async getByEmail(email: string): Promise<User | null> {
    const result = await dynamodb.send(new QueryCommand({
      TableName: TableNames.USERS,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email.toLowerCase(),
      },
    }));

    const items = result.Items || [];
    return items.length > 0 ? (items[0] as User) : null;
  }

  /**
   * Create new user
   */
  async create(user: User): Promise<User> {
    await dynamodb.send(new PutCommand({
      TableName: TableNames.USERS,
      Item: user,
    }));

    return user;
  }

  /**
   * Update user
   */
  async update(id: string, updates: Partial<User>): Promise<User> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('User not found');
    }

    const updated = { ...existing, ...updates, id, updatedAt: new Date().toISOString() };

    await dynamodb.send(new PutCommand({
      TableName: TableNames.USERS,
      Item: updated,
    }));

    return updated;
  }
}

export const usersService = new UsersService();

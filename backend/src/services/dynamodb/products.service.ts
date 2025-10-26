import { GetCommand, PutCommand, DeleteCommand, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamodb, TableNames } from './client';
import { Product } from '../../models/Product';

export class ProductsService {
  /**
   * Get all products
   */
  async getAll(): Promise<Product[]> {
    const result = await dynamodb.send(new ScanCommand({
      TableName: TableNames.PRODUCTS,
    }));

    return (result.Items || []) as Product[];
  }

  /**
   * Get products by category using GSI
   */
  async getByCategory(category: string): Promise<Product[]> {
    const result = await dynamodb.send(new QueryCommand({
      TableName: TableNames.PRODUCTS,
      IndexName: 'CategoryIndex',
      KeyConditionExpression: 'category = :category',
      ExpressionAttributeValues: {
        ':category': category,
      },
    }));

    return (result.Items || []) as Product[];
  }

  /**
   * Get product by ID
   */
  async getById(id: string): Promise<Product | null> {
    const result = await dynamodb.send(new GetCommand({
      TableName: TableNames.PRODUCTS,
      Key: { id },
    }));

    return result.Item as Product || null;
  }

  /**
   * Create new product
   */
  async create(product: Product): Promise<Product> {
    await dynamodb.send(new PutCommand({
      TableName: TableNames.PRODUCTS,
      Item: product,
    }));

    return product;
  }

  /**
   * Update product
   */
  async update(id: string, updates: Partial<Product>): Promise<Product> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Product not found');
    }

    const updated = { ...existing, ...updates, id };

    await dynamodb.send(new PutCommand({
      TableName: TableNames.PRODUCTS,
      Item: updated,
    }));

    return updated;
  }

  /**
   * Delete product
   */
  async delete(id: string): Promise<void> {
    await dynamodb.send(new DeleteCommand({
      TableName: TableNames.PRODUCTS,
      Key: { id },
    }));
  }
}

export const productsService = new ProductsService();

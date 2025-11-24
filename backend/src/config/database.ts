import fs from 'fs';
import path from 'path';
import { Product } from '../models/Product';
import { logger } from '../utils/logger';

interface Database {
  products: Product[];
}

class JSONDatabase {
  private dbPath: string;

  constructor() {
    this.dbPath = path.join(__dirname, '../data/products.json');
  }

  private readDatabase(): Database {
    try {
      const data = fs.readFileSync(this.dbPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      logger.error('Failed to read database file', { dbPath: this.dbPath }, error as Error);
      return { products: [] };
    }
  }

  private writeDatabase(data: Database): void {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      logger.error('Failed to write database file', { dbPath: this.dbPath }, error as Error);
      throw new Error('Database write failed');
    }
  }

  getAllProducts(): Product[] {
    const db = this.readDatabase();
    return db.products;
  }

  getProductById(id: string): Product | undefined {
    const db = this.readDatabase();
    return db.products.find(p => p.id === id);
  }

  createProduct(product: Product): Product {
    const db = this.readDatabase();
    db.products.push(product);
    this.writeDatabase(db);
    return product;
  }

  updateProduct(id: string, updates: Partial<Product>): Product | null {
    const db = this.readDatabase();
    const index = db.products.findIndex(p => p.id === id);

    if (index === -1) {
      return null;
    }

    db.products[index] = {
      ...db.products[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.writeDatabase(db);
    return db.products[index];
  }

  deleteProduct(id: string): boolean {
    const db = this.readDatabase();
    const initialLength = db.products.length;
    db.products = db.products.filter(p => p.id !== id);

    if (db.products.length === initialLength) {
      return false;
    }

    this.writeDatabase(db);
    return true;
  }
}

export default new JSONDatabase();

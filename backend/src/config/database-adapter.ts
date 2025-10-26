/**
 * Database Adapter
 *
 * Unified interface that switches between JSON and DynamoDB
 * based on DB_TYPE environment variable
 */

import { Product } from '../models/Product';
import { User } from '../models/User';
import { Cart } from '../models/Cart';
import { Order } from '../models/Order';

import jsonDatabase from './database';
import jsonExtendedDatabase from './database-extended';

import {
  productsService,
  usersService,
  cartsService,
  ordersService
} from '../services/dynamodb';

class DatabaseAdapter {
  private useDynamoDB: boolean;

  constructor() {
    this.useDynamoDB = process.env.DB_TYPE === 'dynamodb';
    console.log(`Database mode: ${this.useDynamoDB ? 'DynamoDB' : 'JSON'}`);
  }

  // ========== PRODUCTS ==========

  async getAllProducts(): Promise<Product[]> {
    if (this.useDynamoDB) {
      return await productsService.getAll();
    } else {
      return jsonDatabase.getAllProducts();
    }
  }

  async getProductById(id: string): Promise<Product | undefined> {
    if (this.useDynamoDB) {
      const product = await productsService.getById(id);
      return product || undefined;
    } else {
      return jsonDatabase.getProductById(id);
    }
  }

  async createProduct(product: Product): Promise<Product> {
    if (this.useDynamoDB) {
      return await productsService.create(product);
    } else {
      return jsonDatabase.createProduct(product);
    }
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    if (this.useDynamoDB) {
      try {
        return await productsService.update(id, updates);
      } catch (error) {
        return null;
      }
    } else {
      return jsonDatabase.updateProduct(id, updates);
    }
  }

  async deleteProduct(id: string): Promise<boolean> {
    if (this.useDynamoDB) {
      try {
        await productsService.delete(id);
        return true;
      } catch (error) {
        return false;
      }
    } else {
      return jsonDatabase.deleteProduct(id);
    }
  }

  // ========== USERS ==========

  async getAllUsers(): Promise<User[]> {
    if (this.useDynamoDB) {
      return await usersService.getAll();
    } else {
      return jsonExtendedDatabase.getAllUsers();
    }
  }

  async getUserById(id: string): Promise<User | undefined> {
    if (this.useDynamoDB) {
      const user = await usersService.getById(id);
      return user || undefined;
    } else {
      return jsonExtendedDatabase.getUserById(id);
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (this.useDynamoDB) {
      const user = await usersService.getByEmail(email);
      return user || undefined;
    } else {
      return jsonExtendedDatabase.getUserByEmail(email);
    }
  }

  async createUser(user: User): Promise<User> {
    if (this.useDynamoDB) {
      return await usersService.create(user);
    } else {
      return jsonExtendedDatabase.createUser(user);
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    if (this.useDynamoDB) {
      try {
        return await usersService.update(id, updates);
      } catch (error) {
        return null;
      }
    } else {
      return jsonExtendedDatabase.updateUser(id, updates);
    }
  }

  // ========== CARTS ==========

  async getCartByUserId(userId: string): Promise<Cart | undefined> {
    if (this.useDynamoDB) {
      const cart = await cartsService.getByUserId(userId);
      return cart || undefined;
    } else {
      return jsonExtendedDatabase.getCartByUserId(userId);
    }
  }

  async createCart(cart: Cart): Promise<Cart> {
    if (this.useDynamoDB) {
      return await cartsService.create(cart);
    } else {
      return jsonExtendedDatabase.createCart(cart);
    }
  }

  async updateCart(id: string, updates: Partial<Cart>): Promise<Cart | null> {
    if (this.useDynamoDB) {
      try {
        return await cartsService.update(id, updates);
      } catch (error) {
        return null;
      }
    } else {
      return jsonExtendedDatabase.updateCart(id, updates);
    }
  }

  async deleteCart(id: string): Promise<boolean> {
    if (this.useDynamoDB) {
      try {
        await cartsService.delete(id);
        return true;
      } catch (error) {
        return false;
      }
    } else {
      return jsonExtendedDatabase.deleteCart(id);
    }
  }

  // ========== ORDERS ==========

  async getAllOrders(): Promise<Order[]> {
    if (this.useDynamoDB) {
      return await ordersService.getAll();
    } else {
      return jsonExtendedDatabase.getAllOrders();
    }
  }

  async getOrdersByUserId(userId: string): Promise<Order[]> {
    if (this.useDynamoDB) {
      return await ordersService.getByUserId(userId);
    } else {
      return jsonExtendedDatabase.getOrdersByUserId(userId);
    }
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    if (this.useDynamoDB) {
      const order = await ordersService.getById(id);
      return order || undefined;
    } else {
      return jsonExtendedDatabase.getOrderById(id);
    }
  }

  async createOrder(order: Order): Promise<Order> {
    if (this.useDynamoDB) {
      return await ordersService.create(order);
    } else {
      return jsonExtendedDatabase.createOrder(order);
    }
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
    if (this.useDynamoDB) {
      try {
        return await ordersService.update(id, updates);
      } catch (error) {
        return null;
      }
    } else {
      return jsonExtendedDatabase.updateOrder(id, updates);
    }
  }
}

export default new DatabaseAdapter();

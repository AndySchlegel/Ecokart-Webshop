import fs from 'fs';
import path from 'path';
import { User } from '../models/User';
import { Cart } from '../models/Cart';
import { Order } from '../models/Order';

interface UsersDatabase {
  users: User[];
}

interface CartsDatabase {
  carts: Cart[];
}

interface OrdersDatabase {
  orders: Order[];
}

class ExtendedDatabase {
  private usersPath: string;
  private cartsPath: string;
  private ordersPath: string;

  constructor() {
    this.usersPath = path.join(__dirname, '../data/users.json');
    this.cartsPath = path.join(__dirname, '../data/carts.json');
    this.ordersPath = path.join(__dirname, '../data/orders.json');
  }

  // ========== USERS ==========

  private readUsers(): UsersDatabase {
    try {
      const data = fs.readFileSync(this.usersPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return { users: [] };
    }
  }

  private writeUsers(data: UsersDatabase): void {
    fs.writeFileSync(this.usersPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  getAllUsers(): User[] {
    return this.readUsers().users;
  }

  getUserById(id: string): User | undefined {
    const db = this.readUsers();
    return db.users.find(u => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    const db = this.readUsers();
    return db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  createUser(user: User): User {
    const db = this.readUsers();
    db.users.push(user);
    this.writeUsers(db);
    return user;
  }

  updateUser(id: string, updates: Partial<User>): User | null {
    const db = this.readUsers();
    const index = db.users.findIndex(u => u.id === id);
    if (index === -1) return null;

    db.users[index] = {
      ...db.users[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.writeUsers(db);
    return db.users[index];
  }

  // ========== CARTS ==========

  private readCarts(): CartsDatabase {
    try {
      const data = fs.readFileSync(this.cartsPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return { carts: [] };
    }
  }

  private writeCarts(data: CartsDatabase): void {
    fs.writeFileSync(this.cartsPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  getCartByUserId(userId: string): Cart | undefined {
    const db = this.readCarts();
    return db.carts.find(c => c.userId === userId);
  }

  createCart(cart: Cart): Cart {
    const db = this.readCarts();
    db.carts.push(cart);
    this.writeCarts(db);
    return cart;
  }

  updateCart(id: string, updates: Partial<Cart>): Cart | null {
    const db = this.readCarts();
    const index = db.carts.findIndex(c => c.id === id);
    if (index === -1) return null;

    db.carts[index] = {
      ...db.carts[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.writeCarts(db);
    return db.carts[index];
  }

  deleteCart(id: string): boolean {
    const db = this.readCarts();
    const initialLength = db.carts.length;
    db.carts = db.carts.filter(c => c.id !== id);
    if (db.carts.length === initialLength) return false;
    this.writeCarts(db);
    return true;
  }

  // ========== ORDERS ==========

  private readOrders(): OrdersDatabase {
    try {
      const data = fs.readFileSync(this.ordersPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return { orders: [] };
    }
  }

  private writeOrders(data: OrdersDatabase): void {
    fs.writeFileSync(this.ordersPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  getAllOrders(): Order[] {
    return this.readOrders().orders;
  }

  getOrdersByUserId(userId: string): Order[] {
    const db = this.readOrders();
    return db.orders.filter(o => o.userId === userId);
  }

  getOrderById(id: string): Order | undefined {
    const db = this.readOrders();
    return db.orders.find(o => o.id === id);
  }

  createOrder(order: Order): Order {
    const db = this.readOrders();
    db.orders.push(order);
    this.writeOrders(db);
    return order;
  }

  updateOrder(id: string, updates: Partial<Order>): Order | null {
    const db = this.readOrders();
    const index = db.orders.findIndex(o => o.id === id);
    if (index === -1) return null;

    db.orders[index] = {
      ...db.orders[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.writeOrders(db);
    return db.orders[index];
  }
}

export default new ExtendedDatabase();

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class ExtendedDatabase {
    usersPath;
    cartsPath;
    ordersPath;
    constructor() {
        this.usersPath = path_1.default.join(__dirname, '../data/users.json');
        this.cartsPath = path_1.default.join(__dirname, '../data/carts.json');
        this.ordersPath = path_1.default.join(__dirname, '../data/orders.json');
    }
    // ========== USERS ==========
    readUsers() {
        try {
            const data = fs_1.default.readFileSync(this.usersPath, 'utf-8');
            return JSON.parse(data);
        }
        catch (error) {
            return { users: [] };
        }
    }
    writeUsers(data) {
        fs_1.default.writeFileSync(this.usersPath, JSON.stringify(data, null, 2), 'utf-8');
    }
    getAllUsers() {
        return this.readUsers().users;
    }
    getUserById(id) {
        const db = this.readUsers();
        return db.users.find(u => u.id === id);
    }
    getUserByEmail(email) {
        const db = this.readUsers();
        return db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    }
    createUser(user) {
        const db = this.readUsers();
        db.users.push(user);
        this.writeUsers(db);
        return user;
    }
    updateUser(id, updates) {
        const db = this.readUsers();
        const index = db.users.findIndex(u => u.id === id);
        if (index === -1)
            return null;
        db.users[index] = {
            ...db.users[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        this.writeUsers(db);
        return db.users[index];
    }
    // ========== CARTS ==========
    readCarts() {
        try {
            const data = fs_1.default.readFileSync(this.cartsPath, 'utf-8');
            return JSON.parse(data);
        }
        catch (error) {
            return { carts: [] };
        }
    }
    writeCarts(data) {
        fs_1.default.writeFileSync(this.cartsPath, JSON.stringify(data, null, 2), 'utf-8');
    }
    getCartByUserId(userId) {
        const db = this.readCarts();
        return db.carts.find(c => c.userId === userId);
    }
    createCart(cart) {
        const db = this.readCarts();
        db.carts.push(cart);
        this.writeCarts(db);
        return cart;
    }
    updateCart(id, updates) {
        const db = this.readCarts();
        const index = db.carts.findIndex(c => c.id === id);
        if (index === -1)
            return null;
        db.carts[index] = {
            ...db.carts[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        this.writeCarts(db);
        return db.carts[index];
    }
    deleteCart(id) {
        const db = this.readCarts();
        const initialLength = db.carts.length;
        db.carts = db.carts.filter(c => c.id !== id);
        if (db.carts.length === initialLength)
            return false;
        this.writeCarts(db);
        return true;
    }
    // ========== ORDERS ==========
    readOrders() {
        try {
            const data = fs_1.default.readFileSync(this.ordersPath, 'utf-8');
            return JSON.parse(data);
        }
        catch (error) {
            return { orders: [] };
        }
    }
    writeOrders(data) {
        fs_1.default.writeFileSync(this.ordersPath, JSON.stringify(data, null, 2), 'utf-8');
    }
    getAllOrders() {
        return this.readOrders().orders;
    }
    getOrdersByUserId(userId) {
        const db = this.readOrders();
        return db.orders.filter(o => o.userId === userId);
    }
    getOrderById(id) {
        const db = this.readOrders();
        return db.orders.find(o => o.id === id);
    }
    createOrder(order) {
        const db = this.readOrders();
        db.orders.push(order);
        this.writeOrders(db);
        return order;
    }
    updateOrder(id, updates) {
        const db = this.readOrders();
        const index = db.orders.findIndex(o => o.id === id);
        if (index === -1)
            return null;
        db.orders[index] = {
            ...db.orders[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        this.writeOrders(db);
        return db.orders[index];
    }
}
exports.default = new ExtendedDatabase();

"use strict";
/**
 * Database Adapter
 *
 * Unified interface that switches between JSON and DynamoDB
 * based on DB_TYPE environment variable
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../utils/logger");
const database_1 = __importDefault(require("./database"));
const database_extended_1 = __importDefault(require("./database-extended"));
const dynamodb_1 = require("../services/dynamodb");
class DatabaseAdapter {
    useDynamoDB;
    constructor() {
        this.useDynamoDB = process.env.DB_TYPE === 'dynamodb';
        logger_1.logger.info('Database adapter initialized', {
            mode: this.useDynamoDB ? 'DynamoDB' : 'JSON',
            dbType: process.env.DB_TYPE
        });
    }
    // ========== PRODUCTS ==========
    async getAllProducts() {
        if (this.useDynamoDB) {
            return await dynamodb_1.productsService.getAll();
        }
        else {
            return database_1.default.getAllProducts();
        }
    }
    async getProductById(id) {
        if (this.useDynamoDB) {
            const product = await dynamodb_1.productsService.getById(id);
            return product || undefined;
        }
        else {
            return database_1.default.getProductById(id);
        }
    }
    async createProduct(product) {
        if (this.useDynamoDB) {
            return await dynamodb_1.productsService.create(product);
        }
        else {
            return database_1.default.createProduct(product);
        }
    }
    async updateProduct(id, updates) {
        if (this.useDynamoDB) {
            try {
                return await dynamodb_1.productsService.update(id, updates);
            }
            catch (error) {
                return null;
            }
        }
        else {
            return database_1.default.updateProduct(id, updates);
        }
    }
    async deleteProduct(id) {
        if (this.useDynamoDB) {
            try {
                await dynamodb_1.productsService.delete(id);
                return true;
            }
            catch (error) {
                return false;
            }
        }
        else {
            return database_1.default.deleteProduct(id);
        }
    }
    // ✅ INVENTORY: Reserve stock
    async reserveStock(id, quantity) {
        if (this.useDynamoDB) {
            await dynamodb_1.productsService.reserveStock(id, quantity);
        }
        // JSON mode: No-op (not implemented for local dev)
    }
    // ✅ INVENTORY: Release reserved stock
    async releaseReservedStock(id, quantity) {
        if (this.useDynamoDB) {
            await dynamodb_1.productsService.releaseReservedStock(id, quantity);
        }
        // JSON mode: No-op (not implemented for local dev)
    }
    // ✅ INVENTORY: Decrease stock when order is placed
    async decreaseStock(id, quantity) {
        if (this.useDynamoDB) {
            await dynamodb_1.productsService.decreaseStock(id, quantity);
        }
        // JSON mode: No-op (not implemented for local dev)
    }
    // ========== USERS ==========
    async getAllUsers() {
        if (this.useDynamoDB) {
            return await dynamodb_1.usersService.getAll();
        }
        else {
            return database_extended_1.default.getAllUsers();
        }
    }
    async getUserById(id) {
        if (this.useDynamoDB) {
            const user = await dynamodb_1.usersService.getById(id);
            return user || undefined;
        }
        else {
            return database_extended_1.default.getUserById(id);
        }
    }
    async getUserByEmail(email) {
        if (this.useDynamoDB) {
            const user = await dynamodb_1.usersService.getByEmail(email);
            return user || undefined;
        }
        else {
            return database_extended_1.default.getUserByEmail(email);
        }
    }
    async createUser(user) {
        if (this.useDynamoDB) {
            return await dynamodb_1.usersService.create(user);
        }
        else {
            return database_extended_1.default.createUser(user);
        }
    }
    async updateUser(id, updates) {
        if (this.useDynamoDB) {
            try {
                return await dynamodb_1.usersService.update(id, updates);
            }
            catch (error) {
                return null;
            }
        }
        else {
            return database_extended_1.default.updateUser(id, updates);
        }
    }
    // ========== CARTS ==========
    async getCartByUserId(userId) {
        if (this.useDynamoDB) {
            const cart = await dynamodb_1.cartsService.getByUserId(userId);
            return cart || undefined;
        }
        else {
            return database_extended_1.default.getCartByUserId(userId);
        }
    }
    async createCart(cart) {
        if (this.useDynamoDB) {
            return await dynamodb_1.cartsService.create(cart);
        }
        else {
            return database_extended_1.default.createCart(cart);
        }
    }
    async updateCart(userIdOrId, updates) {
        if (this.useDynamoDB) {
            try {
                // For DynamoDB, userIdOrId is the userId (partition key)
                return await dynamodb_1.cartsService.update(userIdOrId, updates);
            }
            catch (error) {
                return null;
            }
        }
        else {
            // For JSON database, userIdOrId is the cart id
            return database_extended_1.default.updateCart(userIdOrId, updates);
        }
    }
    async deleteCart(userIdOrId) {
        if (this.useDynamoDB) {
            try {
                // For DynamoDB, userIdOrId is the userId (partition key)
                await dynamodb_1.cartsService.delete(userIdOrId);
                return true;
            }
            catch (error) {
                return false;
            }
        }
        else {
            // For JSON database, userIdOrId is the cart id
            return database_extended_1.default.deleteCart(userIdOrId);
        }
    }
    // ========== ORDERS ==========
    async getAllOrders() {
        if (this.useDynamoDB) {
            return await dynamodb_1.ordersService.getAll();
        }
        else {
            return database_extended_1.default.getAllOrders();
        }
    }
    async getOrdersByUserId(userId) {
        if (this.useDynamoDB) {
            return await dynamodb_1.ordersService.getByUserId(userId);
        }
        else {
            return database_extended_1.default.getOrdersByUserId(userId);
        }
    }
    async getOrderById(id) {
        if (this.useDynamoDB) {
            const order = await dynamodb_1.ordersService.getById(id);
            return order || undefined;
        }
        else {
            return database_extended_1.default.getOrderById(id);
        }
    }
    async createOrder(order) {
        if (this.useDynamoDB) {
            return await dynamodb_1.ordersService.create(order);
        }
        else {
            return database_extended_1.default.createOrder(order);
        }
    }
    async updateOrder(id, updates) {
        if (this.useDynamoDB) {
            try {
                return await dynamodb_1.ordersService.update(id, updates);
            }
            catch (error) {
                return null;
            }
        }
        else {
            return database_extended_1.default.updateOrder(id, updates);
        }
    }
}
exports.default = new DatabaseAdapter();

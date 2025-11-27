"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../utils/logger");
class JSONDatabase {
    dbPath;
    constructor() {
        this.dbPath = path_1.default.join(__dirname, '../data/products.json');
    }
    readDatabase() {
        try {
            const data = fs_1.default.readFileSync(this.dbPath, 'utf-8');
            return JSON.parse(data);
        }
        catch (error) {
            logger_1.logger.error('Failed to read database file', { dbPath: this.dbPath }, error);
            return { products: [] };
        }
    }
    writeDatabase(data) {
        try {
            fs_1.default.writeFileSync(this.dbPath, JSON.stringify(data, null, 2), 'utf-8');
        }
        catch (error) {
            logger_1.logger.error('Failed to write database file', { dbPath: this.dbPath }, error);
            throw new Error('Database write failed');
        }
    }
    getAllProducts() {
        const db = this.readDatabase();
        return db.products;
    }
    getProductById(id) {
        const db = this.readDatabase();
        return db.products.find(p => p.id === id);
    }
    createProduct(product) {
        const db = this.readDatabase();
        db.products.push(product);
        this.writeDatabase(db);
        return product;
    }
    updateProduct(id, updates) {
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
    deleteProduct(id) {
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
exports.default = new JSONDatabase();

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductById = exports.getAllProducts = void 0;
const uuid_1 = require("uuid");
const database_adapter_1 = __importDefault(require("../config/database-adapter"));
const logger_1 = require("../utils/logger");
const getAllProducts = async (req, res) => {
    try {
        const products = await database_adapter_1.default.getAllProducts();
        res.json({ items: products, count: products.length });
    }
    catch (error) {
        logger_1.logger.error('Failed to fetch products', { action: 'getAllProducts' }, error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};
exports.getAllProducts = getAllProducts;
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await database_adapter_1.default.getProductById(id);
        if (!product) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }
        res.json(product);
    }
    catch (error) {
        logger_1.logger.error('Failed to fetch product', { action: 'getProductById', productId: req.params.id }, error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
};
exports.getProductById = getProductById;
const createProduct = async (req, res) => {
    try {
        const input = req.body;
        if (!input.name || !input.price || !input.description || !input.imageUrl) {
            res.status(400).json({ error: 'Missing required fields: name, price, description, imageUrl' });
            return;
        }
        const newProduct = {
            id: (0, uuid_1.v4)(),
            ...input,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const created = await database_adapter_1.default.createProduct(newProduct);
        res.status(201).json(created);
    }
    catch (error) {
        logger_1.logger.error('Failed to create product', { action: 'createProduct', input: req.body }, error);
        res.status(500).json({ error: 'Failed to create product' });
    }
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const updated = await database_adapter_1.default.updateProduct(id, updates);
        if (!updated) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }
        res.json(updated);
    }
    catch (error) {
        logger_1.logger.error('Failed to update product', { action: 'updateProduct', productId: req.params.id }, error);
        res.status(500).json({ error: 'Failed to update product' });
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await database_adapter_1.default.deleteProduct(id);
        if (!deleted) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }
        res.status(204).send();
    }
    catch (error) {
        logger_1.logger.error('Failed to delete product', { action: 'deleteProduct', productId: req.params.id }, error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
};
exports.deleteProduct = deleteProduct;

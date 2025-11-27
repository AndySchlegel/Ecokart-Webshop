"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productsService = exports.ProductsService = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client_1 = require("./client");
class ProductsService {
    /**
     * Get all products
     */
    async getAll() {
        const result = await client_1.dynamodb.send(new lib_dynamodb_1.ScanCommand({
            TableName: client_1.TableNames.PRODUCTS,
        }));
        return (result.Items || []);
    }
    /**
     * Get products by category using GSI
     */
    async getByCategory(category) {
        const result = await client_1.dynamodb.send(new lib_dynamodb_1.QueryCommand({
            TableName: client_1.TableNames.PRODUCTS,
            IndexName: 'CategoryIndex',
            KeyConditionExpression: 'category = :category',
            ExpressionAttributeValues: {
                ':category': category,
            },
        }));
        return (result.Items || []);
    }
    /**
     * Get product by ID
     */
    async getById(id) {
        const result = await client_1.dynamodb.send(new lib_dynamodb_1.GetCommand({
            TableName: client_1.TableNames.PRODUCTS,
            Key: { id },
        }));
        return result.Item || null;
    }
    /**
     * Create new product
     */
    async create(product) {
        await client_1.dynamodb.send(new lib_dynamodb_1.PutCommand({
            TableName: client_1.TableNames.PRODUCTS,
            Item: product,
        }));
        return product;
    }
    /**
     * Update product
     */
    async update(id, updates) {
        const existing = await this.getById(id);
        if (!existing) {
            throw new Error('Product not found');
        }
        const updated = { ...existing, ...updates, id };
        await client_1.dynamodb.send(new lib_dynamodb_1.PutCommand({
            TableName: client_1.TableNames.PRODUCTS,
            Item: updated,
        }));
        return updated;
    }
    /**
     * Delete product
     */
    async delete(id) {
        await client_1.dynamodb.send(new lib_dynamodb_1.DeleteCommand({
            TableName: client_1.TableNames.PRODUCTS,
            Key: { id },
        }));
    }
    /**
     * ✅ INVENTORY: Reserve stock (increment reserved field)
     * Used when adding items to cart
     */
    async reserveStock(id, quantity) {
        await client_1.dynamodb.send(new lib_dynamodb_1.UpdateCommand({
            TableName: client_1.TableNames.PRODUCTS,
            Key: { id },
            UpdateExpression: 'ADD reserved :quantity',
            ExpressionAttributeValues: {
                ':quantity': quantity,
            },
        }));
    }
    /**
     * ✅ INVENTORY: Release reserved stock (decrement reserved field)
     * Used when removing items from cart or cart expires
     */
    async releaseReservedStock(id, quantity) {
        await client_1.dynamodb.send(new lib_dynamodb_1.UpdateCommand({
            TableName: client_1.TableNames.PRODUCTS,
            Key: { id },
            UpdateExpression: 'ADD reserved :quantity',
            ExpressionAttributeValues: {
                ':quantity': -quantity, // Negative value to decrement
            },
        }));
    }
    /**
     * ✅ INVENTORY: Decrease actual stock (when order is placed)
     * Decreases both stock and reserved
     */
    async decreaseStock(id, quantity) {
        await client_1.dynamodb.send(new lib_dynamodb_1.UpdateCommand({
            TableName: client_1.TableNames.PRODUCTS,
            Key: { id },
            UpdateExpression: 'ADD stock :negQuantity, reserved :negQuantity',
            ExpressionAttributeValues: {
                ':negQuantity': -quantity, // Decrease both stock and reserved
            },
        }));
    }
}
exports.ProductsService = ProductsService;
exports.productsService = new ProductsService();

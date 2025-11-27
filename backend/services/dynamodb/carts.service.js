"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartsService = exports.CartsService = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client_1 = require("./client");
class CartsService {
    /**
     * Get cart by userId (userId is the partition key)
     */
    async getByUserId(userId) {
        const result = await client_1.dynamodb.send(new lib_dynamodb_1.GetCommand({
            TableName: client_1.TableNames.CARTS,
            Key: { userId },
        }));
        return result.Item || null;
    }
    /**
     * Create new cart
     */
    async create(cart) {
        await client_1.dynamodb.send(new lib_dynamodb_1.PutCommand({
            TableName: client_1.TableNames.CARTS,
            Item: cart,
        }));
        return cart;
    }
    /**
     * Update cart (uses userId as primary key)
     */
    async update(userId, updates) {
        const existing = await this.getByUserId(userId);
        if (!existing) {
            throw new Error('Cart not found');
        }
        const updated = { ...existing, ...updates, userId, updatedAt: new Date().toISOString() };
        await client_1.dynamodb.send(new lib_dynamodb_1.PutCommand({
            TableName: client_1.TableNames.CARTS,
            Item: updated,
        }));
        return updated;
    }
    /**
     * Delete cart (uses userId as primary key)
     */
    async delete(userId) {
        await client_1.dynamodb.send(new lib_dynamodb_1.DeleteCommand({
            TableName: client_1.TableNames.CARTS,
            Key: { userId },
        }));
    }
}
exports.CartsService = CartsService;
exports.cartsService = new CartsService();

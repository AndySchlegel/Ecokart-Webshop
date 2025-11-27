"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ordersService = exports.OrdersService = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client_1 = require("./client");
class OrdersService {
    /**
     * Get all orders
     */
    async getAll() {
        const result = await client_1.dynamodb.send(new lib_dynamodb_1.ScanCommand({
            TableName: client_1.TableNames.ORDERS,
        }));
        return (result.Items || []);
    }
    /**
     * Get order by ID
     */
    async getById(id) {
        const result = await client_1.dynamodb.send(new lib_dynamodb_1.GetCommand({
            TableName: client_1.TableNames.ORDERS,
            Key: { id },
        }));
        return result.Item || null;
    }
    /**
     * Get orders by userId using GSI
     */
    async getByUserId(userId) {
        const result = await client_1.dynamodb.send(new lib_dynamodb_1.QueryCommand({
            TableName: client_1.TableNames.ORDERS,
            IndexName: 'UserOrdersIndex',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId,
            },
            ScanIndexForward: false, // Sort by createdAt descending
        }));
        return (result.Items || []);
    }
    /**
     * Create new order
     */
    async create(order) {
        await client_1.dynamodb.send(new lib_dynamodb_1.PutCommand({
            TableName: client_1.TableNames.ORDERS,
            Item: order,
        }));
        return order;
    }
    /**
     * Update order
     */
    async update(id, updates) {
        const existing = await this.getById(id);
        if (!existing) {
            throw new Error('Order not found');
        }
        const updated = { ...existing, ...updates, id, updatedAt: new Date().toISOString() };
        await client_1.dynamodb.send(new lib_dynamodb_1.PutCommand({
            TableName: client_1.TableNames.ORDERS,
            Item: updated,
        }));
        return updated;
    }
}
exports.OrdersService = OrdersService;
exports.ordersService = new OrdersService();

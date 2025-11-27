"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersService = exports.UsersService = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client_1 = require("./client");
class UsersService {
    /**
     * Get all users
     */
    async getAll() {
        const result = await client_1.dynamodb.send(new lib_dynamodb_1.ScanCommand({
            TableName: client_1.TableNames.USERS,
        }));
        return (result.Items || []);
    }
    /**
     * Get user by ID
     */
    async getById(id) {
        const result = await client_1.dynamodb.send(new lib_dynamodb_1.GetCommand({
            TableName: client_1.TableNames.USERS,
            Key: { id },
        }));
        return result.Item || null;
    }
    /**
     * Get user by email using GSI
     */
    async getByEmail(email) {
        const result = await client_1.dynamodb.send(new lib_dynamodb_1.QueryCommand({
            TableName: client_1.TableNames.USERS,
            IndexName: 'EmailIndex',
            KeyConditionExpression: 'email = :email',
            ExpressionAttributeValues: {
                ':email': email.toLowerCase(),
            },
        }));
        const items = result.Items || [];
        return items.length > 0 ? items[0] : null;
    }
    /**
     * Create new user
     */
    async create(user) {
        await client_1.dynamodb.send(new lib_dynamodb_1.PutCommand({
            TableName: client_1.TableNames.USERS,
            Item: user,
        }));
        return user;
    }
    /**
     * Update user
     */
    async update(id, updates) {
        const existing = await this.getById(id);
        if (!existing) {
            throw new Error('User not found');
        }
        const updated = { ...existing, ...updates, id, updatedAt: new Date().toISOString() };
        await client_1.dynamodb.send(new lib_dynamodb_1.PutCommand({
            TableName: client_1.TableNames.USERS,
            Item: updated,
        }));
        return updated;
    }
}
exports.UsersService = UsersService;
exports.usersService = new UsersService();

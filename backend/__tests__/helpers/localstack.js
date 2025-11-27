"use strict";
// ============================================================================
// LocalStack Test Helper
// ============================================================================
// Sets up LocalStack container for integration testing with DynamoDB
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.startLocalStack = startLocalStack;
exports.stopLocalStack = stopLocalStack;
exports.createTestTables = createTestTables;
exports.deleteTestTables = deleteTestTables;
exports.seedTestData = seedTestData;
exports.getDynamoClient = getDynamoClient;
exports.getDocClient = getDocClient;
exports.getEndpoint = getEndpoint;
const testcontainers_1 = require("testcontainers");
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
// Global container instance (shared across test suites)
let localstackContainer = null;
let dynamoClient = null;
let docClient = null;
// ============================================================================
// LocalStack Container Setup
// ============================================================================
/**
 * Starts LocalStack container with DynamoDB service
 * Container is reused across all test suites for performance
 */
async function startLocalStack() {
    if (localstackContainer) {
        console.log('✅ LocalStack already running');
        return;
    }
    console.log('🚀 Starting LocalStack container...');
    localstackContainer = await new testcontainers_1.GenericContainer('localstack/localstack:latest')
        .withExposedPorts(4566)
        .withEnvironment({
        SERVICES: 'dynamodb',
        DEBUG: '0',
        EAGER_SERVICE_LOADING: '1'
    })
        .start();
    const port = localstackContainer.getMappedPort(4566);
    const endpoint = `http://localhost:${port}`;
    // Initialize DynamoDB clients
    dynamoClient = new client_dynamodb_1.DynamoDBClient({
        region: 'us-east-1', // LocalStack default
        endpoint,
        credentials: {
            accessKeyId: 'test',
            secretAccessKey: 'test'
        }
    });
    docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient);
    // Set environment variable for tests
    process.env.DYNAMODB_ENDPOINT = endpoint;
    console.log(`✅ LocalStack started on ${endpoint}`);
}
/**
 * Stops LocalStack container
 * Should be called in global teardown
 */
async function stopLocalStack() {
    if (localstackContainer) {
        console.log('🛑 Stopping LocalStack container...');
        await localstackContainer.stop();
        localstackContainer = null;
        dynamoClient = null;
        docClient = null;
        delete process.env.DYNAMODB_ENDPOINT;
        console.log('✅ LocalStack stopped');
    }
}
// ============================================================================
// DynamoDB Table Management
// ============================================================================
/**
 * Creates DynamoDB tables for testing
 * Tables mimic production schema
 */
async function createTestTables() {
    if (!dynamoClient) {
        throw new Error('LocalStack not started. Call startLocalStack() first.');
    }
    console.log('📊 Creating test tables...');
    // Table definitions (same as production)
    const tables = [
        {
            TableName: 'ecokart-products',
            KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
            AttributeDefinitions: [
                { AttributeName: 'id', AttributeType: 'S' },
                { AttributeName: 'category', AttributeType: 'S' }
            ],
            GlobalSecondaryIndexes: [{
                    IndexName: 'CategoryIndex',
                    KeySchema: [{ AttributeName: 'category', KeyType: 'HASH' }],
                    Projection: { ProjectionType: 'ALL' }
                }],
            BillingMode: 'PAY_PER_REQUEST'
        },
        {
            TableName: 'ecokart-users',
            KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
            AttributeDefinitions: [
                { AttributeName: 'id', AttributeType: 'S' },
                { AttributeName: 'email', AttributeType: 'S' }
            ],
            GlobalSecondaryIndexes: [{
                    IndexName: 'EmailIndex',
                    KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
                    Projection: { ProjectionType: 'ALL' }
                }],
            BillingMode: 'PAY_PER_REQUEST'
        },
        {
            TableName: 'ecokart-carts',
            KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
            AttributeDefinitions: [
                { AttributeName: 'userId', AttributeType: 'S' }
            ],
            BillingMode: 'PAY_PER_REQUEST'
        },
        {
            TableName: 'ecokart-orders',
            KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
            AttributeDefinitions: [
                { AttributeName: 'id', AttributeType: 'S' },
                { AttributeName: 'userId', AttributeType: 'S' }
            ],
            GlobalSecondaryIndexes: [{
                    IndexName: 'UserOrdersIndex',
                    KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
                    Projection: { ProjectionType: 'ALL' }
                }],
            BillingMode: 'PAY_PER_REQUEST'
        }
    ];
    // Create tables
    for (const table of tables) {
        try {
            await dynamoClient.send(new client_dynamodb_1.CreateTableCommand(table));
            console.log(`  ✅ Created table: ${table.TableName}`);
        }
        catch (error) {
            if (error.name === 'ResourceInUseException') {
                console.log(`  ⏭️  Table already exists: ${table.TableName}`);
            }
            else {
                throw error;
            }
        }
    }
    console.log('✅ Test tables created');
}
/**
 * Deletes all test tables
 * Useful for cleanup between test suites
 */
async function deleteTestTables() {
    if (!dynamoClient) {
        return;
    }
    console.log('🗑️  Deleting test tables...');
    const { TableNames } = await dynamoClient.send(new client_dynamodb_1.ListTablesCommand({}));
    if (TableNames) {
        for (const tableName of TableNames) {
            try {
                await dynamoClient.send(new client_dynamodb_1.DeleteTableCommand({ TableName: tableName }));
                console.log(`  ✅ Deleted table: ${tableName}`);
            }
            catch (error) {
                console.error(`  ❌ Failed to delete table: ${tableName}`, error);
            }
        }
    }
    console.log('✅ Test tables deleted');
}
// ============================================================================
// Test Data Seeding
// ============================================================================
/**
 * Seeds test data into DynamoDB tables
 * Creates sample products, users, etc. for testing
 */
async function seedTestData() {
    if (!docClient) {
        throw new Error('LocalStack not started. Call startLocalStack() first.');
    }
    console.log('🌱 Seeding test data...');
    // Seed Products
    const products = [
        {
            id: 'test-product-1',
            name: 'Test Product 1',
            description: 'A test product',
            price: 29.99,
            category: 'test-category',
            stock: 100,
            reserved: 0,
            imageUrl: 'https://example.com/product1.jpg'
        },
        {
            id: 'test-product-2',
            name: 'Test Product 2',
            description: 'Another test product',
            price: 49.99,
            category: 'test-category',
            stock: 50,
            reserved: 0,
            imageUrl: 'https://example.com/product2.jpg'
        },
        {
            id: 'test-product-out-of-stock',
            name: 'Out of Stock Product',
            description: 'Product with no stock',
            price: 19.99,
            category: 'test-category',
            stock: 0,
            reserved: 0,
            imageUrl: 'https://example.com/product-oos.jpg'
        }
    ];
    for (const product of products) {
        await docClient.send(new lib_dynamodb_1.PutCommand({
            TableName: 'ecokart-products',
            Item: product
        }));
    }
    console.log(`  ✅ Seeded ${products.length} products`);
    console.log('✅ Test data seeded');
}
// ============================================================================
// Exports
// ============================================================================
function getDynamoClient() {
    if (!dynamoClient) {
        // Lazy initialization: Create client from environment variable
        // (globalSetup runs in different process, so we recreate client here)
        const endpoint = process.env.DYNAMODB_ENDPOINT;
        if (!endpoint) {
            throw new Error('DYNAMODB_ENDPOINT not set. globalSetup may not have run.');
        }
        dynamoClient = new client_dynamodb_1.DynamoDBClient({
            region: 'us-east-1',
            endpoint,
            credentials: {
                accessKeyId: 'test',
                secretAccessKey: 'test'
            }
        });
    }
    return dynamoClient;
}
function getDocClient() {
    if (!docClient) {
        // Lazy initialization: Create document client from regular client
        const client = getDynamoClient(); // This will lazy-init if needed
        docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
    }
    return docClient;
}
function getEndpoint() {
    return process.env.DYNAMODB_ENDPOINT || 'http://localhost:4566';
}

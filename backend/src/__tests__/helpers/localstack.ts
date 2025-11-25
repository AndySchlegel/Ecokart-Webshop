// ============================================================================
// LocalStack Test Helper
// ============================================================================
// Sets up LocalStack container for integration testing with DynamoDB
// ============================================================================

import { StartedTestContainer, GenericContainer } from 'testcontainers';
import { DynamoDBClient, CreateTableCommand, DeleteTableCommand, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

// Global container instance (shared across test suites)
let localstackContainer: StartedTestContainer | null = null;
let dynamoClient: DynamoDBClient | null = null;
let docClient: DynamoDBDocumentClient | null = null;

// ============================================================================
// LocalStack Container Setup
// ============================================================================

/**
 * Starts LocalStack container with DynamoDB service
 * Container is reused across all test suites for performance
 */
export async function startLocalStack(): Promise<void> {
  if (localstackContainer) {
    console.log('✅ LocalStack already running');
    return;
  }

  console.log('🚀 Starting LocalStack container...');

  localstackContainer = await new GenericContainer('localstack/localstack:latest')
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
  dynamoClient = new DynamoDBClient({
    region: 'us-east-1', // LocalStack default
    endpoint,
    credentials: {
      accessKeyId: 'test',
      secretAccessKey: 'test'
    }
  });

  docClient = DynamoDBDocumentClient.from(dynamoClient);

  // Set environment variable for tests
  process.env.DYNAMODB_ENDPOINT = endpoint;

  console.log(`✅ LocalStack started on ${endpoint}`);
}

/**
 * Stops LocalStack container
 * Should be called in global teardown
 */
export async function stopLocalStack(): Promise<void> {
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
export async function createTestTables(): Promise<void> {
  if (!dynamoClient) {
    throw new Error('LocalStack not started. Call startLocalStack() first.');
  }

  console.log('📊 Creating test tables...');

  // Table definitions (same as production)
  const tables = [
    {
      TableName: 'ecokart-products',
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' as const }],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' as const },
        { AttributeName: 'category', AttributeType: 'S' as const }
      ],
      GlobalSecondaryIndexes: [{
        IndexName: 'CategoryIndex',
        KeySchema: [{ AttributeName: 'category', KeyType: 'HASH' as const }],
        Projection: { ProjectionType: 'ALL' as const }
      }],
      BillingMode: 'PAY_PER_REQUEST' as const
    },
    {
      TableName: 'ecokart-users',
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' as const }],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' as const },
        { AttributeName: 'email', AttributeType: 'S' as const }
      ],
      GlobalSecondaryIndexes: [{
        IndexName: 'EmailIndex',
        KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' as const }],
        Projection: { ProjectionType: 'ALL' as const }
      }],
      BillingMode: 'PAY_PER_REQUEST' as const
    },
    {
      TableName: 'ecokart-carts',
      KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' as const }],
      AttributeDefinitions: [
        { AttributeName: 'userId', AttributeType: 'S' as const }
      ],
      BillingMode: 'PAY_PER_REQUEST' as const
    },
    {
      TableName: 'ecokart-orders',
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' as const }],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' as const },
        { AttributeName: 'userId', AttributeType: 'S' as const }
      ],
      GlobalSecondaryIndexes: [{
        IndexName: 'UserOrdersIndex',
        KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' as const }],
        Projection: { ProjectionType: 'ALL' as const }
      }],
      BillingMode: 'PAY_PER_REQUEST' as const
    }
  ];

  // Create tables
  for (const table of tables) {
    try {
      await dynamoClient.send(new CreateTableCommand(table));
      console.log(`  ✅ Created table: ${table.TableName}`);
    } catch (error: any) {
      if (error.name === 'ResourceInUseException') {
        console.log(`  ⏭️  Table already exists: ${table.TableName}`);
      } else {
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
export async function deleteTestTables(): Promise<void> {
  if (!dynamoClient) {
    return;
  }

  console.log('🗑️  Deleting test tables...');

  const { TableNames } = await dynamoClient.send(new ListTablesCommand({}));

  if (TableNames) {
    for (const tableName of TableNames) {
      try {
        await dynamoClient.send(new DeleteTableCommand({ TableName: tableName }));
        console.log(`  ✅ Deleted table: ${tableName}`);
      } catch (error) {
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
export async function seedTestData(): Promise<void> {
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
    await docClient.send(new PutCommand({
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

export function getDynamoClient(): DynamoDBClient {
  if (!dynamoClient) {
    // Lazy initialization: Create client from environment variable
    // (globalSetup runs in different process, so we recreate client here)
    const endpoint = process.env.DYNAMODB_ENDPOINT;
    if (!endpoint) {
      throw new Error('DYNAMODB_ENDPOINT not set. globalSetup may not have run.');
    }

    dynamoClient = new DynamoDBClient({
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

export function getDocClient(): DynamoDBDocumentClient {
  if (!docClient) {
    // Lazy initialization: Create document client from regular client
    const client = getDynamoClient(); // This will lazy-init if needed
    docClient = DynamoDBDocumentClient.from(client);
  }
  return docClient;
}

export function getEndpoint(): string {
  return process.env.DYNAMODB_ENDPOINT || 'http://localhost:4566';
}

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');
const { fromSSO } = require('@aws-sdk/credential-providers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const config = {
  region: process.env.AWS_REGION || 'us-east-1',
};

// Use DynamoDB Local if endpoint is set
if (process.env.DYNAMODB_ENDPOINT) {
  config.endpoint = process.env.DYNAMODB_ENDPOINT;

  // For local development, use dummy credentials
  if (process.env.NODE_ENV === 'development') {
    config.credentials = {
      accessKeyId: 'local',
      secretAccessKey: 'local',
    };
  }
} else if (process.env.AWS_PROFILE) {
  // Use AWS SSO credentials from profile
  config.credentials = fromSSO({
    profile: process.env.AWS_PROFILE,
  });
}

const client = new DynamoDBClient(config);
const dynamodb = DynamoDBDocumentClient.from(client);

async function migrateProducts() {
  try {
    const productsPath = path.join(__dirname, '../src/data/products.json');
    const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    const products = productsData.products || productsData;

    console.log(`📦 Migrating ${products.length} products...`);

    // BatchWrite can only handle 25 items at a time
    const batchSize = 25;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);

      const putRequests = batch.map(product => ({
        PutRequest: {
          Item: {
            id: product.id,
            name: product.name,
            price: product.price,
            description: product.description || '',
            imageUrl: product.imageUrl,
            category: product.category || 'uncategorized',
            stock: product.stock || 0,        // ← NEU: Stock-Feld
            reserved: product.reserved || 0,  // ← NEU: Reserved-Feld
            rating: product.rating || 0,
            reviewCount: product.reviewCount || 0,
          }
        }
      }));

      await dynamodb.send(new BatchWriteCommand({
        RequestItems: {
          'ecokart-products': putRequests
        }
      }));

      console.log(`  ✅ Batch ${Math.floor(i / batchSize) + 1} migrated (${batch.length} items)`);
    }

    console.log(`✅ All products migrated successfully!\n`);
  } catch (error) {
    console.error('❌ Error migrating products:', error);
    throw error;
  }
}

async function migrateUsers() {
  try {
    const usersPath = path.join(__dirname, '../src/data/users.json');

    if (!fs.existsSync(usersPath)) {
      console.log('ℹ️  No users.json found, skipping users migration\n');
      return;
    }

    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    const users = usersData.users || usersData;

    console.log(`👥 Migrating ${users.length} users...`);

    for (const user of users) {
      await dynamodb.send(new PutCommand({
        TableName: 'ecokart-users',
        Item: {
          id: user.id,
          email: user.email,
          password: user.password, // Already hashed
          name: user.name,
          createdAt: user.createdAt,
        }
      }));
    }

    console.log(`✅ All users migrated successfully!\n`);
  } catch (error) {
    console.error('❌ Error migrating users:', error);
    throw error;
  }
}

async function migrateCarts() {
  try {
    const cartsPath = path.join(__dirname, '../src/data/carts.json');

    if (!fs.existsSync(cartsPath)) {
      console.log('ℹ️  No carts.json found, skipping carts migration\n');
      return;
    }

    const cartsData = JSON.parse(fs.readFileSync(cartsPath, 'utf8'));
    const carts = cartsData.carts || cartsData;

    console.log(`🛒 Migrating ${carts.length} carts...`);

    for (const cart of carts) {
      await dynamodb.send(new PutCommand({
        TableName: 'ecokart-carts',
        Item: {
          userId: cart.userId,
          items: cart.items || [],
          updatedAt: cart.updatedAt || new Date().toISOString(),
        }
      }));
    }

    console.log(`✅ All carts migrated successfully!\n`);
  } catch (error) {
    console.error('❌ Error migrating carts:', error);
    throw error;
  }
}

async function migrateOrders() {
  try {
    const ordersPath = path.join(__dirname, '../src/data/orders.json');

    if (!fs.existsSync(ordersPath)) {
      console.log('ℹ️  No orders.json found, skipping orders migration\n');
      return;
    }

    const ordersData = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
    const orders = ordersData.orders || ordersData;

    console.log(`📋 Migrating ${orders.length} orders...`);

    for (const order of orders) {
      await dynamodb.send(new PutCommand({
        TableName: 'ecokart-orders',
        Item: {
          id: order.id,
          userId: order.userId,
          items: order.items,
          total: order.total,
          shippingAddress: order.shippingAddress,
          status: order.status || 'pending',
          createdAt: order.createdAt,
        }
      }));
    }

    console.log(`✅ All orders migrated successfully!\n`);
  } catch (error) {
    console.error('❌ Error migrating orders:', error);
    throw error;
  }
}

async function migrate() {
  console.log('🚀 Starting migration to DynamoDB...\n');
  console.log(`Endpoint: ${process.env.DYNAMODB_ENDPOINT || 'AWS Cloud'}\n`);

  try {
    await migrateProducts();
    await migrateUsers();
    await migrateCarts();
    await migrateOrders();

    console.log('✨ Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

migrate();

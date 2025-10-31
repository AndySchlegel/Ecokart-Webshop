const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { fromSSO } = require('@aws-sdk/credential-providers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Parse command line arguments for region
const args = process.argv.slice(2);
const regionIndex = args.indexOf('--region');
const region = regionIndex >= 0 && args[regionIndex + 1] ? args[regionIndex + 1] : 'eu-north-1';

const config = {
  region: region,
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

    console.log(`📦 Migrating ${products.length} products (using PutCommand to avoid SCP restrictions)...`);

    // Use individual PutCommand instead of BatchWriteCommand
    let successCount = 0;
    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      try {
        await dynamodb.send(new PutCommand({
          TableName: 'ecokart-products',
          Item: {
            id: product.id,
            name: product.name,
            price: product.price,
            description: product.description || '',
            imageUrl: product.imageUrl,
            category: product.category || 'uncategorized',
            rating: product.rating || 0,
            reviewCount: product.reviewCount || 0,
          }
        }));

        successCount++;

        // Progress indicator every 5 items
        if ((i + 1) % 5 === 0 || i === products.length - 1) {
          console.log(`  ✅ Progress: ${successCount}/${products.length} products migrated`);
        }
      } catch (error) {
        console.error(`  ❌ Failed to migrate product ${product.id}:`, error.message);
      }
    }

    console.log(`✅ Products migration complete! (${successCount}/${products.length} successful)\n`);
  } catch (error) {
    console.error('❌ Error migrating products:', error.message);
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

    let successCount = 0;
    for (const user of users) {
      try {
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
        successCount++;
      } catch (error) {
        console.error(`  ❌ Failed to migrate user ${user.email}:`, error.message);
      }
    }

    console.log(`✅ Users migration complete! (${successCount}/${users.length} successful)\n`);
  } catch (error) {
    console.error('❌ Error migrating users:', error.message);
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

    let successCount = 0;
    for (const cart of carts) {
      try {
        await dynamodb.send(new PutCommand({
          TableName: 'ecokart-carts',
          Item: {
            userId: cart.userId,
            items: cart.items || [],
            updatedAt: cart.updatedAt || new Date().toISOString(),
          }
        }));
        successCount++;
      } catch (error) {
        console.error(`  ❌ Failed to migrate cart for user ${cart.userId}:`, error.message);
      }
    }

    console.log(`✅ Carts migration complete! (${successCount}/${carts.length} successful)\n`);
  } catch (error) {
    console.error('❌ Error migrating carts:', error.message);
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

    let successCount = 0;
    for (const order of orders) {
      try {
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
        successCount++;
      } catch (error) {
        console.error(`  ❌ Failed to migrate order ${order.id}:`, error.message);
      }
    }

    console.log(`✅ Orders migration complete! (${successCount}/${orders.length} successful)\n`);
  } catch (error) {
    console.error('❌ Error migrating orders:', error.message);
    throw error;
  }
}

async function migrate() {
  console.log('🚀 Starting migration to DynamoDB...\n');
  console.log(`Region: ${region}`);
  console.log(`Endpoint: ${process.env.DYNAMODB_ENDPOINT || 'AWS Cloud'}\n`);
  console.log('⚠️  Using PutCommand instead of BatchWriteCommand to comply with SCP restrictions\n');

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

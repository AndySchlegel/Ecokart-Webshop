const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { fromSSO } = require('@aws-sdk/credential-providers');
require('dotenv').config();

const config = {
  region: process.env.AWS_REGION || 'us-east-1',
};

if (process.env.DYNAMODB_ENDPOINT) {
  config.endpoint = process.env.DYNAMODB_ENDPOINT;
  if (process.env.NODE_ENV === 'development') {
    config.credentials = {
      accessKeyId: 'local',
      secretAccessKey: 'local',
    };
  }
} else if (process.env.AWS_PROFILE) {
  config.credentials = fromSSO({
    profile: process.env.AWS_PROFILE,
  });
}

const client = new DynamoDBClient(config);
const dynamodb = DynamoDBDocumentClient.from(client);

async function testRead() {
  console.log('🧪 Testing DynamoDB reads...\n');

  try {
    // Test 1: Read products
    const productsResponse = await dynamodb.send(new ScanCommand({
      TableName: 'ecokart-products',
      Limit: 5
    }));
    console.log(`✅ Products: ${productsResponse.Items.length} items read (showing first 5)`);
    if (productsResponse.Items.length > 0) {
      console.log(`   Sample: ${productsResponse.Items[0].name}`);
    }
    console.log('');

    // Test 2: Read users
    const usersResponse = await dynamodb.send(new ScanCommand({
      TableName: 'ecokart-users'
    }));
    console.log(`✅ Users: ${usersResponse.Items.length} items read`);
    if (usersResponse.Items.length > 0) {
      console.log(`   Sample: ${usersResponse.Items[0].email}`);
    }
    console.log('');

    // Test 3: Read carts
    const cartsResponse = await dynamodb.send(new ScanCommand({
      TableName: 'ecokart-carts'
    }));
    console.log(`✅ Carts: ${cartsResponse.Items.length} items read`);
    console.log('');

    // Test 4: Read orders
    const ordersResponse = await dynamodb.send(new ScanCommand({
      TableName: 'ecokart-orders'
    }));
    console.log(`✅ Orders: ${ordersResponse.Items.length} items read`);
    if (ordersResponse.Items.length > 0) {
      console.log(`   Sample: Order ${ordersResponse.Items[0].id} - Total: €${ordersResponse.Items[0].total}`);
    }
    console.log('');

    // Test 5: Test CategoryIndex
    const categoryResponse = await dynamodb.send(new QueryCommand({
      TableName: 'ecokart-products',
      IndexName: 'CategoryIndex',
      KeyConditionExpression: 'category = :category',
      ExpressionAttributeValues: {
        ':category': 'shoes'
      },
      Limit: 3
    }));
    console.log(`✅ CategoryIndex: ${categoryResponse.Items.length} shoes found`);
    if (categoryResponse.Items.length > 0) {
      console.log(`   Sample: ${categoryResponse.Items[0].name} - €${categoryResponse.Items[0].price}`);
    }
    console.log('');

    console.log('✨ All tests passed! Data is successfully stored in DynamoDB!\n');

  } catch (error) {
    console.error('❌ Error reading from DynamoDB:', error.message);
    process.exit(1);
  }
}

testRead();

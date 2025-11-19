const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { fromSSO } = require('@aws-sdk/credential-providers');
require('dotenv').config();

/**
 * Migration Script: Add stock and reserved fields to existing products
 *
 * This script adds inventory management fields to all products in DynamoDB:
 * - stock: Available inventory (default: 50 for existing products)
 * - reserved: Inventory reserved in carts (default: 0)
 */

const config = {
  region: process.env.AWS_REGION || 'eu-north-1',
};

// Use SSO credentials only if AWS_PROFILE is set (local development)
// Otherwise use default credential chain (works with GitHub Actions OIDC)
if (process.env.AWS_PROFILE) {
  config.credentials = fromSSO({ profile: process.env.AWS_PROFILE });
}

const client = new DynamoDBClient(config);
const dynamodb = DynamoDBDocumentClient.from(client);

async function addStockFields() {
  try {
    console.log('🔍 Scanning for products without stock fields...\n');

    // Scan all products
    const result = await dynamodb.send(new ScanCommand({
      TableName: 'ecokart-products'
    }));

    const products = result.Items || [];
    console.log(`📦 Found ${products.length} products\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const product of products) {
      // Check if product already has stock field
      if (product.stock !== undefined && product.reserved !== undefined) {
        console.log(`  ⏭️  Skipping ${product.name} (already has stock fields)`);
        skippedCount++;
        continue;
      }

      // Update product with stock and reserved fields
      const updateExpression = [];
      const expressionAttributeValues = {};
      const expressionAttributeNames = {};

      // Add stock if missing
      if (product.stock === undefined) {
        updateExpression.push('#stock = :stock');
        expressionAttributeNames['#stock'] = 'stock';
        expressionAttributeValues[':stock'] = 50; // Default: 50 units
      }

      // Add reserved if missing
      if (product.reserved === undefined) {
        updateExpression.push('#reserved = :reserved');
        expressionAttributeNames['#reserved'] = 'reserved';
        expressionAttributeValues[':reserved'] = 0; // Default: 0 reserved
      }

      if (updateExpression.length > 0) {
        await dynamodb.send(new UpdateCommand({
          TableName: 'ecokart-products',
          Key: { id: product.id },
          UpdateExpression: `SET ${updateExpression.join(', ')}`,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: expressionAttributeValues
        }));

        console.log(`  ✅ Updated ${product.name} (stock: 50, reserved: 0)`);
        updatedCount++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`  ✅ Updated: ${updatedCount} products`);
    console.log(`  ⏭️  Skipped: ${skippedCount} products (already had stock fields)`);
    console.log(`  📦 Total:   ${products.length} products`);
    console.log('\n✨ Migration completed successfully!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

addStockFields();

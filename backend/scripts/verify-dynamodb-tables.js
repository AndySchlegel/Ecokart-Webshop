const { DynamoDBClient, ListTablesCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');
const { fromSSO } = require('@aws-sdk/credential-providers');
require('dotenv').config();

const config = {
  region: process.env.AWS_REGION || 'us-east-1',
};

// Use DynamoDB Local if endpoint is set
if (process.env.DYNAMODB_ENDPOINT) {
  config.endpoint = process.env.DYNAMODB_ENDPOINT;

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

const expectedTables = [
  'ecokart-products',
  'ecokart-users',
  'ecokart-carts',
  'ecokart-orders'
];

async function verifyTables() {
  try {
    console.log('🔍 Checking DynamoDB tables...\n');
    console.log(`Endpoint: ${process.env.DYNAMODB_ENDPOINT || 'AWS Cloud'}`);
    console.log(`Region: ${config.region}\n`);

    // List all tables
    const listResponse = await client.send(new ListTablesCommand({}));
    const existingTables = listResponse.TableNames || [];

    console.log('📋 Expected Tables:\n');

    for (const tableName of expectedTables) {
      const exists = existingTables.includes(tableName);

      if (exists) {
        try {
          // Get table details
          const describeResponse = await client.send(
            new DescribeTableCommand({ TableName: tableName })
          );

          const table = describeResponse.Table;
          const status = table.TableStatus;
          const itemCount = table.ItemCount || 0;
          const gsis = table.GlobalSecondaryIndexes || [];

          console.log(`✅ ${tableName}`);
          console.log(`   Status: ${status}`);
          console.log(`   Items: ${itemCount}`);

          if (gsis.length > 0) {
            console.log(`   GSIs: ${gsis.map(g => g.IndexName).join(', ')}`);
          }
          console.log('');

        } catch (error) {
          console.log(`⚠️  ${tableName} exists but couldn't get details`);
          console.log(`   Error: ${error.message}\n`);
        }
      } else {
        console.log(`❌ ${tableName} - NOT FOUND\n`);
      }
    }

    const missingTables = expectedTables.filter(t => !existingTables.includes(t));

    if (missingTables.length === 0) {
      console.log('✨ All tables exist and are ready!');
      console.log('\n📝 Next step: Run migration to populate tables');
      console.log('   npm run dynamodb:migrate\n');
    } else {
      console.log(`⚠️  Missing ${missingTables.length} table(s):`);
      missingTables.forEach(t => console.log(`   - ${t}`));
      console.log('\n📝 Create missing tables before running migration\n');
    }

  } catch (error) {
    console.error('❌ Error verifying tables:', error.message);

    if (error.name === 'CredentialsProviderError') {
      console.log('\n💡 Tip: Make sure you\'re logged in to AWS SSO:');
      console.log('   aws sso login --profile Teilnehmer-729403197965\n');
    }

    process.exit(1);
  }
}

verifyTables();

const { DynamoDBClient, CreateTableCommand } = require('@aws-sdk/client-dynamodb');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const config = {
  region: process.env.AWS_REGION || 'us-east-1',
};

// Use local DynamoDB if endpoint is set
if (process.env.DYNAMODB_ENDPOINT) {
  config.endpoint = process.env.DYNAMODB_ENDPOINT;
}

const client = new DynamoDBClient(config);

async function createTables() {
  try {
    const tablesConfig = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../aws/dynamodb-tables.json'), 'utf8')
    );

    console.log('🚀 Creating DynamoDB tables...\n');

    for (const tableConfig of tablesConfig.tables) {
      try {
        console.log(`Creating table: ${tableConfig.TableName}`);

        await client.send(new CreateTableCommand(tableConfig));

        console.log(`✅ ${tableConfig.TableName} created successfully\n`);
      } catch (error) {
        if (error.name === 'ResourceInUseException') {
          console.log(`ℹ️  ${tableConfig.TableName} already exists\n`);
        } else {
          throw error;
        }
      }
    }

    console.log('✅ All tables created/verified successfully!');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    process.exit(1);
  }
}

createTables();

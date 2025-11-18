const bcrypt = require('bcryptjs');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { fromSSO } = require('@aws-sdk/credential-providers');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

async function createTestUser() {
  // Use SSO credentials only if AWS_PROFILE is set (local development)
  // Otherwise use default credential chain (works with GitHub Actions OIDC)
  const clientConfig = {
    region: process.env.AWS_REGION || 'eu-north-1'
  };

  if (process.env.AWS_PROFILE) {
    clientConfig.credentials = fromSSO({ profile: process.env.AWS_PROFILE });
  }

  const client = new DynamoDBClient(clientConfig);
  const dynamodb = DynamoDBDocumentClient.from(client);

  console.log('🔐 Erstelle Testuser...\n');

  const hashedPassword = await bcrypt.hash('Demo1234!', 10);

  const user = {
    id: uuidv4(),
    email: 'demo@ecokart.com',
    password: hashedPassword,
    name: 'Demo User',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await dynamodb.send(new PutCommand({
    TableName: 'ecokart-users',
    Item: user
  }));

  console.log('✅ Testuser erfolgreich erstellt!\n');
  console.log('╔═══════════════════════════════════════╗');
  console.log('║        LOGIN TESTDATEN                ║');
  console.log('╠═══════════════════════════════════════╣');
  console.log('║ Email:    demo@ecokart.com            ║');
  console.log('║ Passwort: Demo1234!                   ║');
  console.log('╚═══════════════════════════════════════╝\n');
}

createTestUser().catch(err => {
  console.error('❌ Fehler beim Erstellen des Testusers:', err.message);
  process.exit(1);
});

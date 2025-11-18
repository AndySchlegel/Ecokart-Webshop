const bcrypt = require('bcryptjs');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { fromSSO } = require('@aws-sdk/credential-providers');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

async function createAdminUser() {
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

  console.log('🔐 Erstelle Admin-User...\n');

  const hashedPassword = await bcrypt.hash('ecokart2025', 10);

  const user = {
    id: uuidv4(),
    email: 'admin@ecokart.com',
    password: hashedPassword,
    name: 'Admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await dynamodb.send(new PutCommand({
    TableName: 'ecokart-users',
    Item: user
  }));

  console.log('✅ Admin-User erfolgreich erstellt!\n');
  console.log('╔═══════════════════════════════════════╗');
  console.log('║        ADMIN LOGIN DATEN              ║');
  console.log('╠═══════════════════════════════════════╣');
  console.log('║ Email:    admin@ecokart.com           ║');
  console.log('║ Passwort: ecokart2025                 ║');
  console.log('╚═══════════════════════════════════════╝\n');
}

createAdminUser().catch(err => {
  console.error('❌ Fehler beim Erstellen des Admin-Users:', err.message);
  process.exit(1);
});

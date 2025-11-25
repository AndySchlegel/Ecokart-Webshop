// ============================================================================
// Jest Global Setup for Integration Tests
// ============================================================================
// Starts LocalStack container before all tests
// Runs ONCE for entire test suite
// ============================================================================

import { startLocalStack, createTestTables, seedTestData } from './src/__tests__/helpers/localstack';

export default async function globalSetup() {
  console.log('\n🚀 ========================================');
  console.log('   Jest Integration Tests - Global Setup');
  console.log('   ========================================\n');

  try {
    // Set Docker socket for Testcontainers (Colima compatibility)
    if (!process.env.DOCKER_HOST) {
      process.env.DOCKER_HOST = 'unix:///Users/macbookwork/.colima/default/docker.sock';
      console.log('✅ Set DOCKER_HOST for Colima\n');
    }

    // Start LocalStack container
    await startLocalStack();

    // Create DynamoDB tables
    await createTestTables();

    // Seed test data
    await seedTestData();

    console.log('\n✅ Global setup complete!\n');
  } catch (error) {
    console.error('\n❌ Global setup failed:', error);
    throw error;
  }
}

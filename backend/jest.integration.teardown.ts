// ============================================================================
// Jest Global Teardown for Integration Tests
// ============================================================================
// Stops LocalStack container after all tests
// Runs ONCE for entire test suite
// ============================================================================

import { stopLocalStack } from './src/__tests__/helpers/localstack';

export default async function globalTeardown() {
  console.log('\n🛑 ========================================');
  console.log('   Jest Integration Tests - Global Teardown');
  console.log('   ==========================================\n');

  try {
    // Stop LocalStack container
    await stopLocalStack();

    console.log('\n✅ Global teardown complete!\n');
  } catch (error) {
    console.error('\n❌ Global teardown failed:', error);
    // Don't throw - teardown errors shouldn't fail tests
  }
}

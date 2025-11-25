// ============================================================================
// Jest Configuration for Integration Tests
// ============================================================================
// Separate config for integration tests that use LocalStack
// Run with: npm run test:integration
// ============================================================================

module.exports = {
  // Use ts-jest preset for TypeScript
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Only run integration tests
  testMatch: [
    '**/__tests__/integration/**/*.test.ts',
    '**/*.integration.test.ts'
  ],

  // Global setup/teardown for LocalStack
  globalSetup: '<rootDir>/jest.integration.setup.ts',
  globalTeardown: '<rootDir>/jest.integration.teardown.ts',

  // Longer timeout for integration tests (LocalStack startup takes time)
  testTimeout: 60000, // 60 seconds

  // Coverage configuration
  collectCoverage: false, // Integration tests don't need coverage

  // Module paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Verbose output for better debugging
  verbose: true,

  // Don't transform node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(testcontainers)/)'
  ]
};

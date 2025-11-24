/** @type {import('jest').Config} */
module.exports = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',

  // Test environment (Node.js for backend)
  testEnvironment: 'node',

  // Root directory for tests
  roots: ['<rootDir>/src'],

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],

  // Transform TypeScript files
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },

  // Module file extensions
  moduleFileExtensions: ['ts', 'js', 'json'],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/index.ts', // Entry point, meist nur Server-Start
    '!src/lambda.ts', // Lambda wrapper, nur Adapter
    '!src/routes/**', // Route definitions, dünne Wrapper
    '!src/services/dynamodb/**', // DynamoDB services, nur DB-Wrapper
    '!src/config/database*.ts', // Database adapters, nur Wrapper
    '!src/middleware/cognitoAuth.ts', // Deprecated middleware
    '!src/models/**' // Type definitions
  ],

  // Coverage thresholds (realistic targets)
  coverageThreshold: {
    global: {
      branches: 75,     // Realistic for complex conditionals
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Coverage output directory
  coverageDirectory: 'coverage',

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Setup files (wenn wir später brauchen)
  // setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
};

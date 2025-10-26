import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { fromSSO } from '@aws-sdk/credential-providers';

const config: any = {
  region: process.env.AWS_REGION || 'us-east-1',
};

// Use DynamoDB Local if endpoint is set
if (process.env.DYNAMODB_ENDPOINT) {
  config.endpoint = process.env.DYNAMODB_ENDPOINT;

  // For local development, use dummy credentials
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

// Create DocumentClient for easier data manipulation
export const dynamodb = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true, // Remove undefined values
    convertEmptyValues: false,   // Don't convert empty strings
  },
});

export const TableNames = {
  PRODUCTS: 'ecokart-products',
  USERS: 'ecokart-users',
  CARTS: 'ecokart-carts',
  ORDERS: 'ecokart-orders',
};

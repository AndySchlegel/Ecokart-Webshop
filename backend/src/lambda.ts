import serverless from 'serverless-http';
import app from './index';

// Wrap Express app for Lambda
export const handler = serverless(app, {
  binary: ['image/*', 'application/octet-stream'],
});

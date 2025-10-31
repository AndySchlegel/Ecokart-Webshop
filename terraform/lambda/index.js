/**
 * Minimal Lambda Handler für Terraform Deployment
 *
 * Dieser Handler dient als Platzhalter/Beispiel.
 * Für Production sollte der komplette Backend-Code aus ../backend verwendet werden.
 *
 * Funktionalität:
 * - Einfacher Health Check Endpoint
 * - Minimale DynamoDB Integration
 * - Zeigt Struktur für Express.js Integration
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

// DynamoDB Client initialisieren
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

/**
 * Lambda Handler
 * @param {Object} event - API Gateway Event
 * @param {Object} context - Lambda Context
 * @returns {Object} API Gateway Response
 */
exports.handler = async (event, context) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    // Health Check Endpoint
    if (event.path === '/health' || event.path === '/') {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          status: 'ok',
          message: 'Ecokart Lambda is running',
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'development',
        }),
      };
    }

    // Products Endpoint - Beispiel DynamoDB Scan
    if (event.path === '/api/products' && event.httpMethod === 'GET') {
      const tableName = process.env.PRODUCTS_TABLE || 'ecokart-products';

      const result = await docClient.send(
        new ScanCommand({
          TableName: tableName,
          Limit: 20, // Nur erste 20 Items für Demo
        })
      );

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          items: result.Items || [],
          count: result.Count || 0,
        }),
      };
    }

    // 404 für unbekannte Pfade
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Not Found',
        message: `Path ${event.path} not found`,
      }),
    };
  } catch (error) {
    console.error('Error:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error.message,
      }),
    };
  }
};

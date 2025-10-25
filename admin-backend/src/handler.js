import { DynamoDBClient, DeleteItemCommand, PutItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { randomUUID } from 'node:crypto';

const TABLE_NAME = process.env.TABLE_NAME ?? 'Articles';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY ?? '';

const dynamoDbClient = new DynamoDBClient({});

const baseHeaders = {
  'Content-Type': 'application/json; charset=utf-8'
};

function buildResponse(statusCode, payload) {
  // Einheitlicher Response-Wrapper mit JSON-Body und CORS-Headern.
  return {
    statusCode,
    headers: baseHeaders,
    body: JSON.stringify(payload)
  };
}

function detectMethod(event) {
  // Methode sowohl aus REST-API als auch aus HTTP-API Event erkennen.
  if (event.httpMethod) {
    return event.httpMethod;
  }
  return event.requestContext?.http?.method ?? 'GET';
}

function validateArticlePayload(payload) {
  // Prüft Pflichtfelder und gibt valide Daten plus Fehlermeldungen zurück.
  const errors = [];
  if (!payload?.name || typeof payload.name !== 'string') {
    errors.push('name ist erforderlich.');
  }
  if (typeof payload?.price !== 'number') {
    errors.push('price muss eine Zahl sein.');
  }
  if (!payload?.description || typeof payload.description !== 'string') {
    errors.push('description ist erforderlich.');
  }
  if (!payload?.imageUrl || typeof payload.imageUrl !== 'string') {
    errors.push('imageUrl ist erforderlich.');
  }
  return {
    isValid: errors.length === 0,
    errors
  };
}

async function handleGet() {
  // Liest alle Artikel aus DynamoDB und liefert sie für das Frontend zurück.
  const command = new ScanCommand({
    TableName: TABLE_NAME
  });
  const result = await dynamoDbClient.send(command);
  const items = (result.Items ?? []).map((item) => unmarshall(item));
  return buildResponse(200, { items });
}

async function handlePost(event) {
  // Legt einen neuen Artikel in DynamoDB an und vergibt eine UUID.
  if (!event.body) {
    return buildResponse(400, { message: 'Request-Body fehlt.' });
  }
  const incomingKey = event.headers?.['x-api-key'] ?? event.headers?.['X-Api-Key'] ?? event.headers?.['X-API-KEY'];
  if (!ADMIN_API_KEY) {
    console.warn('ADMIN_API_KEY ist nicht gesetzt. Anfrage wird abgelehnt.');
    return buildResponse(500, { message: 'Admin-API ist falsch konfiguriert.' });
  }
  if (incomingKey !== ADMIN_API_KEY) {
    return buildResponse(401, { message: 'API-Schlüssel fehlt oder ist ungültig.' });
  }
  const payload = JSON.parse(event.body);
  const validation = validateArticlePayload(payload);
  if (!validation.isValid) {
    return buildResponse(422, { message: 'Eingabe unvollständig.', errors: validation.errors });
  }
  const item = {
    id: randomUUID(),
    ...payload
  };
  const command = new PutItemCommand({
    TableName: TABLE_NAME,
    Item: marshall(item)
  });
  await dynamoDbClient.send(command);
  return buildResponse(201, { item });
}

async function handleDelete(event) {
  if (!event.body) {
    return buildResponse(400, { message: 'Request-Body fehlt.' });
  }
  const incomingKey = event.headers?.['x-api-key'] ?? event.headers?.['X-Api-Key'] ?? event.headers?.['X-API-KEY'];
  if (!ADMIN_API_KEY) {
    console.warn('ADMIN_API_KEY ist nicht gesetzt. Anfrage wird abgelehnt.');
    return buildResponse(500, { message: 'Admin-API ist falsch konfiguriert.' });
  }
  if (incomingKey !== ADMIN_API_KEY) {
    return buildResponse(401, { message: 'API-Schlüssel fehlt oder ist ungültig.' });
  }
  const payload = JSON.parse(event.body);
  if (!payload?.id || typeof payload.id !== 'string') {
    return buildResponse(400, { message: 'id ist erforderlich.' });
  }
  const command = new DeleteItemCommand({
    TableName: TABLE_NAME,
    Key: marshall({ id: payload.id })
  });
  await dynamoDbClient.send(command);
  return {
    statusCode: 204,
    headers: baseHeaders,
    body: ''
  };
}

export async function handler(event) {
  // Routed je nach HTTP-Methode auf die passende Funktion.
  const method = detectMethod(event);
  if (method === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: baseHeaders,
      body: ''
    };
  }
  try {
    if (method === 'GET') {
      return await handleGet();
    }
    if (method === 'POST') {
      return await handlePost(event);
    }
    if (method === 'DELETE') {
      return await handleDelete(event);
    }
    return buildResponse(405, { message: `Methode ${method} wird nicht unterstützt.` });
  } catch (error) {
    console.error('Lambda Fehler', error);
    return buildResponse(500, {
      message: 'Unerwarteter Fehler im Admin-Backend.',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

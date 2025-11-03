import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcryptjs';

import { createSessionToken, setSessionCookie } from '@/lib/auth';

const client = new DynamoDBClient({ region: 'eu-north-1' });
const dynamodb = DynamoDBDocumentClient.from(client);

export async function POST(request: Request) {
  const body = await request.json() as { username?: string; password?: string };
  if (!body?.username || !body?.password) {
    return NextResponse.json({ message: 'Bitte E-Mail und Passwort angeben.' }, { status: 400 });
  }

  try {
    // Query user by email (username field contains email)
    const result = await dynamodb.send(new QueryCommand({
      TableName: 'ecokart-users',
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': body.username
      }
    }));

    const user = result.Items?.[0];
    if (!user) {
      return NextResponse.json({ message: 'Ungültige Zugangsdaten.' }, { status: 401 });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(body.password, user.password);
    if (!isValidPassword) {
      return NextResponse.json({ message: 'Ungültige Zugangsdaten.' }, { status: 401 });
    }

    const token = await createSessionToken(user.email);
    const response = NextResponse.json({ message: 'Login erfolgreich.' });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Login fehlgeschlagen.' }, { status: 500 });
  }
}

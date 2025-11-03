import { NextResponse } from 'next/server';

import { createSessionToken, setSessionCookie } from '@/lib/auth';

const ADMIN_EMAIL = process.env.ADMIN_APP_EMAIL || 'admin@ecokart.com';
const ADMIN_PASSWORD = process.env.ADMIN_APP_PASSWORD || 'ecokart2025';

export async function POST(request: Request) {
  try {
    const body = await request.json() as { username?: string; password?: string };

    console.log('[LOGIN] Received credentials:', {
      username: body?.username,
      passwordLength: body?.password?.length,
      expectedEmail: ADMIN_EMAIL,
      expectedPasswordLength: ADMIN_PASSWORD.length
    });

    if (!body?.username || !body?.password) {
      return NextResponse.json({ message: 'Bitte E-Mail und Passwort angeben.' }, { status: 400 });
    }

    // Simple email/password check for admin login
    if (body.username !== ADMIN_EMAIL || body.password !== ADMIN_PASSWORD) {
      console.log('[LOGIN] Credentials mismatch:', {
        usernameMatch: body.username === ADMIN_EMAIL,
        passwordMatch: body.password === ADMIN_PASSWORD
      });
      return NextResponse.json({ message: 'Ungültige Zugangsdaten.' }, { status: 401 });
    }

    const token = await createSessionToken(body.username);
    const response = NextResponse.json({ message: 'Login erfolgreich.' });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error('[LOGIN] Error:', error);
    return NextResponse.json({
      message: 'Serverfehler beim Login.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

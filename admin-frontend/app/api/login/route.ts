import { NextResponse } from 'next/server';

import { createSessionToken, setSessionCookie } from '@/lib/auth';

const ADMIN_EMAIL = process.env.ADMIN_APP_EMAIL || 'admin@ecokart.com';
const ADMIN_PASSWORD = process.env.ADMIN_APP_PASSWORD || 'ecokart2025';

export async function POST(request: Request) {
  try {
    console.log('[LOGIN] Environment check:', {
      hasEmail: !!process.env.ADMIN_APP_EMAIL,
      hasPassword: !!process.env.ADMIN_APP_PASSWORD,
      hasSecret: !!process.env.ADMIN_SESSION_SECRET,
      email: ADMIN_EMAIL,
      nodeEnv: process.env.NODE_ENV
    });

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

    console.log('[LOGIN] Creating session token...');
    const token = await createSessionToken(body.username);
    console.log('[LOGIN] Session token created successfully');

    const response = NextResponse.json({ message: 'Login erfolgreich.' });
    setSessionCookie(response, token);
    console.log('[LOGIN] Cookie set, returning response');
    return response;
  } catch (error) {
    console.error('[LOGIN] Error:', error);
    console.error('[LOGIN] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json({
      message: 'Serverfehler beim Login.',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

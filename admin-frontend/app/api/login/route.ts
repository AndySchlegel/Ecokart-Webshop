import { NextResponse } from 'next/server';

import { createSessionToken, setSessionCookie } from '@/lib/auth';

const ADMIN_EMAIL = process.env.ADMIN_APP_EMAIL || 'admin@ecokart.com';
const ADMIN_PASSWORD = process.env.ADMIN_APP_PASSWORD || 'ecokart2025';

export async function POST(request: Request) {
  const body = await request.json() as { username?: string; password?: string };
  if (!body?.username || !body?.password) {
    return NextResponse.json({ message: 'Bitte E-Mail und Passwort angeben.' }, { status: 400 });
  }

  // Simple email/password check for admin login
  if (body.username !== ADMIN_EMAIL || body.password !== ADMIN_PASSWORD) {
    return NextResponse.json({ message: 'Ungültige Zugangsdaten.' }, { status: 401 });
  }

  const token = await createSessionToken(body.username);
  const response = NextResponse.json({ message: 'Login erfolgreich.' });
  setSessionCookie(response, token);
  return response;
}

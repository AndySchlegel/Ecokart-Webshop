import { NextResponse } from 'next/server';

import { createSessionToken, setSessionCookie } from '@/lib/auth';

const ADMIN_USERNAME = process.env.ADMIN_APP_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_APP_PASSWORD;

export async function POST(request: Request) {
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    return NextResponse.json({ message: 'Admin-Zugang ist nicht konfiguriert.' }, { status: 500 });
  }
  const body = await request.json() as { username?: string; password?: string };
  if (!body?.username || !body?.password) {
    return NextResponse.json({ message: 'Bitte Benutzername und Passwort angeben.' }, { status: 400 });
  }
  if (body.username !== ADMIN_USERNAME || body.password !== ADMIN_PASSWORD) {
    return NextResponse.json({ message: 'Ungültige Zugangsdaten.' }, { status: 401 });
  }
  const token = await createSessionToken(body.username);
  const response = NextResponse.json({ message: 'Login erfolgreich.' });
  setSessionCookie(response, token);
  return response;
}

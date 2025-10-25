import { NextResponse } from 'next/server';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

const SESSION_COOKIE_NAME = 'admin_session';

function getJwtSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET ist nicht gesetzt.');
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(username: string) {
  const token = await new SignJWT({ username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(getJwtSecret());
  return token;
}

export async function verifySessionToken(token: string) {
  try {
    const result = await jwtVerify(token, getJwtSecret());
    return result.payload as JWTPayload & { username: string };
  } catch {
    return null;
  }
}

function readCookie(request: Request, name: string) {
  const raw = request.headers.get('cookie');
  if (!raw) {
    return null;
  }
  const prefix = `${name}=`;
  const entry = raw.split(';').find((item) => item.trim().startsWith(prefix));
  if (!entry) {
    return null;
  }
  return entry.trim().slice(prefix.length);
}

export async function requireSessionCookie(request: Request) {
  const existing = readCookie(request, SESSION_COOKIE_NAME);
  if (!existing) {
    return null;
  }
  return verifySessionToken(existing);
}

const isProduction = process.env.NODE_ENV === 'production';

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/'
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
    maxAge: 0
  });
}

export const sessionCookieName = SESSION_COOKIE_NAME;

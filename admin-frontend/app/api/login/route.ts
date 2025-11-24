import { NextResponse } from 'next/server';

import { createSessionToken, setSessionCookie } from '@/lib/auth';
import { logger } from '@/lib/logger';

const ADMIN_EMAIL = process.env.ADMIN_APP_EMAIL || 'admin@ecokart.com';
const ADMIN_PASSWORD = process.env.ADMIN_APP_PASSWORD || 'ecokart2025';

export async function POST(request: Request) {
  try {
    logger.debug('Admin login environment check', {
      hasEmail: !!process.env.ADMIN_APP_EMAIL,
      hasPassword: !!process.env.ADMIN_APP_PASSWORD,
      hasSecret: !!process.env.ADMIN_SESSION_SECRET,
      nodeEnv: process.env.NODE_ENV,
      component: 'admin-login'
    });

    const body = await request.json() as { username?: string; password?: string };

    logger.debug('Admin login attempt', {
      username: body?.username,
      passwordLength: body?.password?.length,
      component: 'admin-login'
    });

    if (!body?.username || !body?.password) {
      return NextResponse.json({ message: 'Bitte E-Mail und Passwort angeben.' }, { status: 400 });
    }

    // Simple email/password check for admin login
    if (body.username !== ADMIN_EMAIL || body.password !== ADMIN_PASSWORD) {
      logger.warn('Admin login credentials mismatch', {
        usernameMatch: body.username === ADMIN_EMAIL,
        component: 'admin-login'
      });
      return NextResponse.json({ message: 'Ungültige Zugangsdaten.' }, { status: 401 });
    }

    logger.debug('Creating admin session token', { component: 'admin-login' });
    const token = await createSessionToken(body.username);
    logger.info('Admin session token created successfully', {
      username: body.username,
      component: 'admin-login'
    });

    const response = NextResponse.json({ message: 'Login erfolgreich.' });
    setSessionCookie(response, token);
    logger.debug('Admin session cookie set', { component: 'admin-login' });
    return response;
  } catch (error) {
    logger.error('Admin login error', { component: 'admin-login' }, error as Error);
    return NextResponse.json({
      message: 'Serverfehler beim Login.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

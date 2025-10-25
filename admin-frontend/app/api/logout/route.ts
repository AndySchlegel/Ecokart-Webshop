import { NextResponse } from 'next/server';

import { clearSessionCookie } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ message: 'Logout erfolgreich.' });
  clearSessionCookie(response);
  return response;
}

import { NextResponse } from 'next/server';

import { createArticle, deleteArticle, fetchArticles, type ArticlePayload } from '@/lib/articles';
import { requireSessionCookie } from '@/lib/auth';

async function ensureAuthenticated(request: Request) {
  const session = await requireSessionCookie(request);
  if (!session) {
    return null;
  }
  return session;
}

export async function GET(request: Request) {
  const session = await ensureAuthenticated(request);
  if (!session) {
    return NextResponse.json({ message: 'Nicht autorisiert.' }, { status: 401 });
  }
  try {
    const items = await fetchArticles();
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Fehler beim Laden.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await ensureAuthenticated(request);
  if (!session) {
    return NextResponse.json({ message: 'Nicht autorisiert.' }, { status: 401 });
  }
  const body = await request.json() as Partial<ArticlePayload>;
  if (!body.name || !body.description || !body.imageUrl || typeof body.price !== 'number' || Number.isNaN(body.price)) {
    return NextResponse.json({ message: 'Alle Felder müssen korrekt gefüllt werden.' }, { status: 400 });
  }
  try {
    const localRoot = '/Users/his4irness23/GitHub/Repositories/Ecokart-Webshop/pics/';
    let imageUrl = body.imageUrl.trim();
    if (imageUrl.startsWith(localRoot)) {
      imageUrl = `/pics/${imageUrl.slice(localRoot.length)}`;
    } else if (!imageUrl.startsWith('http')) {
      if (imageUrl.startsWith('pics/')) {
        imageUrl = `/${imageUrl}`;
      } else if (!imageUrl.startsWith('/pics/') && imageUrl) {
        imageUrl = `/pics/${imageUrl}`;
      }
    }

    const item = await createArticle({
      name: body.name,
      description: body.description,
      imageUrl,
      price: body.price,
      category: body.category || 'uncategorized',
      rating: body.rating ?? 0,
      reviewCount: body.reviewCount ?? 0
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Speichern fehlgeschlagen.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await ensureAuthenticated(request);
  if (!session) {
    return NextResponse.json({ message: 'Nicht autorisiert.' }, { status: 401 });
  }
  const body = await request.json() as { id?: string };
  if (!body?.id) {
    return NextResponse.json({ message: 'id fehlt.' }, { status: 400 });
  }
  try {
    await deleteArticle(body.id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Löschen fehlgeschlagen.' }, { status: 500 });
  }
}

export type Article = {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  category: string;
  rating: number;
  reviewCount: number;
};

export type ArticlePayload = Omit<Article, 'id'>;

const API_URL = process.env.ADMIN_API_URL || process.env.NEXT_PUBLIC_API_URL;
const API_KEY = process.env.ADMIN_API_KEY;

export async function fetchArticles() {
  if (!API_URL) {
    throw new Error('ADMIN_API_URL ist nicht gesetzt.');
  }
  const response = await fetch(API_URL, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    throw new Error(`Artikel können nicht geladen werden: ${response.status}`);
  }
  const body = await response.json() as { items?: Article[] } | Article[];
  const items = Array.isArray(body) ? body : body.items ?? [];
  return items;
}

export async function createArticle(article: ArticlePayload) {
  if (!API_URL) {
    throw new Error('ADMIN_API_URL ist nicht gesetzt.');
  }
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(article)
  });
  if (!response.ok) {
    const reason = await response.text();
    throw new Error(`POST fehlgeschlagen: ${response.status} ${reason}`);
  }
  const body = await response.json() as Article;
  return body;
}

export async function deleteArticle(id: string) {
  if (!API_URL) {
    throw new Error('ADMIN_API_URL ist nicht gesetzt.');
  }
  // Backend erwartet DELETE /api/products/:id
  const deleteUrl = `${API_URL}/${id}`;
  const response = await fetch(deleteUrl, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    const reason = await response.text();
    throw new Error(`DELETE fehlgeschlagen: ${response.status} ${reason}`);
  }
}

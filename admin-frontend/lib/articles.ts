export type Article = {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
};

export type ArticlePayload = Omit<Article, 'id'>;

const API_URL = process.env.ADMIN_API_URL;
const API_KEY = process.env.ADMIN_API_KEY;

function ensureConfig() {
  if (!API_URL) {
    throw new Error('ADMIN_API_URL ist nicht gesetzt.');
  }
  if (!API_KEY) {
    throw new Error('ADMIN_API_KEY ist nicht gesetzt.');
  }
}

export async function fetchArticles() {
  if (!API_URL) {
    throw new Error('ADMIN_API_URL ist nicht gesetzt.');
  }
  const response = await fetch(API_URL, {
    cache: 'no-store'
  });
  if (!response.ok) {
    throw new Error(`Artikel können nicht geladen werden: ${response.status}`);
  }
  const body = await response.json() as { items?: Article[] } | Article[];
  const items = Array.isArray(body) ? body : body.items ?? [];
  return items;
}

export async function createArticle(article: ArticlePayload) {
  ensureConfig();
  const response = await fetch(API_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY!
    },
    body: JSON.stringify(article)
  });
  if (!response.ok) {
    const reason = await response.text();
    throw new Error(`POST fehlgeschlagen: ${response.status} ${reason}`);
  }
  const body = await response.json() as { item: Article };
  return body.item;
}

export async function deleteArticle(id: string) {
  ensureConfig();
  const response = await fetch(API_URL!, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY!
    },
    body: JSON.stringify({ id })
  });
  if (!response.ok) {
    const reason = await response.text();
    throw new Error(`DELETE fehlgeschlagen: ${response.status} ${reason}`);
  }
}

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { Article } from '@/lib/articles';
import { ArticleForm } from './components/ArticleForm';
import { ArticleTable } from './components/ArticleTable';

export default function DashboardPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadArticles() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/articles', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message ?? 'Artikel konnten nicht geladen werden.');
      }
      setArticles((payload as { items: Article[] }).items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler beim Laden.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadArticles();
  }, []);

  async function handleAddArticle(values: { name: string; price: string; description: string; imageUrl: string }) {
    const payload = {
      name: values.name,
      price: Number.parseFloat(values.price),
      description: values.description,
      imageUrl: values.imageUrl
    };
    if (Number.isNaN(payload.price)) {
      throw new Error('Bitte einen gültigen Preis hinterlegen.');
    }
    const request = await fetch('/api/articles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const body = await request.json();
    if (!request.ok) {
      throw new Error(body.message ?? 'Der Artikel konnte nicht gespeichert werden.');
    }
    await loadArticles();
  }

  async function handleDeleteArticle(id: string) {
    const request = await fetch('/api/articles', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id })
    });
    if (!request.ok) {
      const payload = await request.json();
      throw new Error(payload.message ?? 'Der Artikel konnte nicht gelöscht werden.');
    }
    await loadArticles();
  }

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <main className="page">
      <header>
        <div className="page__content">
          <div>
            <strong>ECOKART ADMIN</strong>
          </div>
          <button onClick={handleLogout} className="button button--logout">
            Abmelden
          </button>
        </div>
      </header>
      <section className="page__content" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {isLoading && (
          <div className="card loading">
            Lade Produkte
          </div>
        )}
        {error && (
          <div className="message message--error">
            {error}
          </div>
        )}
        {!isLoading && !error && (
          <ArticleTable
            articles={articles}
            onDelete={async (id) => {
              setError(null);
              try {
                await handleDeleteArticle(id);
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Löschen fehlgeschlagen.');
              }
            }}
          />
        )}
        <ArticleForm onSubmit={handleAddArticle} />
      </section>
    </main>
  );
}

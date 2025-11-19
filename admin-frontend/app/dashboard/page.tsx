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
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

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

  async function handleAddArticle(values: { name: string; price: string; description: string; imageUrl: string; category: string; rating: string; reviewCount: string; stock: string }, articleId?: string) {
    const localRoot = '/Users/his4irness23/GitHub/Repositories/Ecokart-Webshop/pics/';
    let imageUrl = values.imageUrl.trim();
    if (imageUrl.startsWith(localRoot)) {
      imageUrl = `/pics/${imageUrl.slice(localRoot.length)}`;
    } else if (!imageUrl.startsWith('http')) {
      if (imageUrl.startsWith('pics/')) {
        imageUrl = `/${imageUrl}`;
      } else if (!imageUrl.startsWith('/pics/') && imageUrl) {
        imageUrl = `/pics/${imageUrl}`;
      }
    }

    const payload = {
      name: values.name,
      price: Number.parseFloat(values.price),
      description: values.description,
      imageUrl,
      category: values.category,
      rating: Number.parseFloat(values.rating),
      reviewCount: Number.parseInt(values.reviewCount, 10),
      stock: Number.parseInt(values.stock, 10)
    };
    if (Number.isNaN(payload.price)) {
      throw new Error('Bitte einen gültigen Preis hinterlegen.');
    }
    if (Number.isNaN(payload.rating) || payload.rating < 0 || payload.rating > 5) {
      throw new Error('Bitte ein gültiges Rating zwischen 0 und 5 hinterlegen.');
    }
    if (Number.isNaN(payload.reviewCount) || payload.reviewCount < 0) {
      throw new Error('Bitte eine gültige Anzahl an Reviews hinterlegen.');
    }
    if (Number.isNaN(payload.stock) || payload.stock < 0) {
      throw new Error('Bitte einen gültigen Lagerbestand hinterlegen.');
    }
    const request = await fetch('/api/articles', {
      method: articleId ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(articleId ? { ...payload, id: articleId } : payload)
    });
    const body = await request.json();
    if (!request.ok) {
      throw new Error(body.message ?? 'Der Artikel konnte nicht gespeichert werden.');
    }
    if (articleId) {
      setEditingArticle(null);  // Clear editing state after successful update
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
            <strong>AIR LEGACY ADMIN</strong>
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
            onEdit={(article) => {
              setEditingArticle(article);
              // Scroll to form
              setTimeout(() => {
                const form = document.querySelector('.card:last-child');
                form?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 100);
            }}
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
        <ArticleForm
          onSubmit={handleAddArticle}
          editingArticle={editingArticle}
          onCancelEdit={() => setEditingArticle(null)}
        />
      </section>
    </main>
  );
}

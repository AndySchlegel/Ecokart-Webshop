'use client';

import React, { useEffect, useState } from 'react';

import { ArticleList } from '@/components/ArticleList';
import { Article } from '@/components/types';

const demoArticles: Article[] = [
  {
    id: 'demo-001',
    name: 'Bambus Lunchbox',
    price: 24.9,
    description: 'Nachhaltige Lunchbox aus Bambusfasern mit Silikonband für unterwegs.',
    imageUrl: 'https://images.unsplash.com/photo-1505575967455-40e256f73376?auto=format&fit=crop&w=640&q=80'
  },
  {
    id: 'demo-002',
    name: 'Recycelter Turnbeutel',
    price: 19.5,
    description: 'Leichter Rucksack aus recycelten PET-Flaschen, ideal für den Alltag.',
    imageUrl: 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?auto=format&fit=crop&w=640&q=80'
  },
  {
    id: 'demo-003',
    name: 'Bio Baumwoll-Shirt',
    price: 29.95,
    description: 'Weiches Shirt aus 100% GOTS-zertifizierter Bio-Baumwolle.',
    imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=640&q=80'
  }
];

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function HomePage() {
  const [articles, setArticles] = useState<Article[]>(demoArticles);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiUrl) {
      return;
    }
    let cancelled = false;
    const endpoint = apiUrl;

    // Wir laden Demo-Daten aus der Admin-API nach und mergen sie in die lokale Liste.
    async function loadArticles() {
      try {
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`Request fehlgeschlagen: ${response.status}`);
        }
        const payload = await response.json() as { items?: Article[] } | Article[];
        const items = Array.isArray(payload) ? payload : payload.items ?? [];
        if (cancelled) {
          return;
        }
        setArticles((current) => {
          const merged = [...current];
          const indexById = new Map(current.map((item) => [item.id, item]));
          items.forEach((item) => {
            if (indexById.has(item.id)) {
              const updateIndex = merged.findIndex((match) => match.id === item.id);
              if (updateIndex >= 0) {
                merged[updateIndex] = item;
              }
            } else {
              merged.push(item);
            }
          });
          return merged;
        });
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError('Live-Aktualisierung fehlgeschlagen. Bitte Demo-API prüfen.');
        }
      }
    }

    void loadArticles();

    return () => {
      cancelled = true;
    };
  }, [apiUrl]);

  return (
    <main className="page">
      <header className="page__header">
        <p className="page__hint">
          Schritt 1: Drei vorbereitete Artikel laden sofort. Schritt 2: Admin legt weitere Artikel an und aktualisiert die Ansicht.
        </p>
        <h1>EcoKart Produktüberblick</h1>
        <p className="page__hint">
          Die Liste aktualisiert sich automatisch, sobald neue Artikel über das Admin-Backend in DynamoDB gespeichert werden.
        </p>
        {error && (
          <p className="page__hint">
            {error}
          </p>
        )}
      </header>
      <ArticleList articles={articles} />
    </main>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

import { ArticleList } from '@/components/ArticleList';
import { Article } from '@/components/types';

const demoArticles: Article[] = [
  {
    id: 'demo-001',
    name: 'Air Performance Runner',
    price: 149.99,
    description: 'Hochleistungs-Laufschuh mit atmungsaktivem Mesh und reaktionsfreudiger Dämpfung.',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'demo-002',
    name: 'Pro Training Set',
    price: 89.99,
    description: 'Premium Trainingsausrüstung für maximale Performance im Fitnessstudio.',
    imageUrl: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'demo-003',
    name: 'Elite Sport Jacket',
    price: 129.99,
    description: 'Leichte, wasserabweisende Jacke mit ergonomischem Schnitt für aktive Sportler.',
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'demo-004',
    name: 'Urban Street Sneaker',
    price: 119.99,
    description: 'Stylischer Lifestyle-Sneaker mit modernem Design und ganztägigem Komfort.',
    imageUrl: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'demo-005',
    name: 'Performance Backpack',
    price: 79.99,
    description: 'Ergonomischer Sportrucksack mit wasserabweisendem Material und Laptop-Fach.',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'demo-006',
    name: 'Tech Training Shirt',
    price: 49.99,
    description: 'Atmungsaktives Funktionsshirt mit Feuchtigkeitstransport-Technologie.',
    imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80'
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
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero__background">
          <Image
            src="https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=1920&q=80"
            alt="Sport Background"
            fill
            style={{ objectFit: 'cover', opacity: 0.3 }}
            priority
          />
        </div>
        <div className="hero__content">
          <h1 className="hero__title">Just Do It</h1>
          <p className="hero__subtitle">
            Erreiche deine Ziele mit der neuesten Performance-Ausrüstung
          </p>
          <button className="hero__cta" type="button">
            Jetzt Entdecken
          </button>
        </div>
      </section>

      {/* Featured Products */}
      <main className="page">
        <header className="page__header">
          <h1>Featured Products</h1>
          <p className="page__hint">
            Unsere neuesten Highlights für maximale Performance
          </p>
          {error && (
            <p className="page__hint" style={{ color: '#dc2626' }}>
              {error}
            </p>
          )}
        </header>
        <ArticleList articles={articles} />
      </main>
    </>
  );
}

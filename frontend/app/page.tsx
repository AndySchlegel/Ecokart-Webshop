"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

import Navigation from '../components/Navigation';
import { ArticleList } from '@/components/ArticleList';
import { Article } from '@/components/types';

export default function HomePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const productsRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadArticles() {
      try {
        const response = await fetch('http://localhost:4000/api/products');
        if (!response.ok) {
          throw new Error(`Request fehlgeschlagen: ${response.status}`);
        }
        const data = await response.json();
        if (cancelled) {
          return;
        }
        // Backend gibt {items: [...], count: ...} zurück
        setArticles(data.items || []);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError('Fehler beim Laden der Produkte. Bitte Backend starten.');
        }
      } finally {
        setIsLoading(false);
      }
    }

    void loadArticles();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleExploreClick = useCallback(() => {
    if (productsRef.current) {
      productsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <>
      <Navigation />

      {/* Hero Section */}
      <section className="hero" id="hero">
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
          <button className="hero__cta" type="button" onClick={handleExploreClick}>
            Jetzt Entdecken
          </button>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="trust-badges">
        <div className="trust-container">
          <div className="trust-badge">
            <div className="trust-icon">🚚</div>
            <div className="trust-text">
              <h3>Kostenloser Versand</h3>
              <p>Ab 50€ Bestellwert</p>
            </div>
          </div>
          <div className="trust-badge">
            <div className="trust-icon">🔒</div>
            <div className="trust-text">
              <h3>Sichere Zahlung</h3>
              <p>SSL verschlüsselt</p>
            </div>
          </div>
          <div className="trust-badge">
            <div className="trust-icon">↩️</div>
            <div className="trust-text">
              <h3>30 Tage Rückgabe</h3>
              <p>Kostenloser Rückversand</p>
            </div>
          </div>
          <div className="trust-badge">
            <div className="trust-icon">⚡</div>
            <div className="trust-text">
              <h3>Schnelle Lieferung</h3>
              <p>2-3 Werktage</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <Suspense
        fallback={
          <main className="page" id="featured-products" ref={productsRef}>
            <header className="page__header">
              <h1>Featured Products</h1>
              <p className="page__hint">
                Unsere neuesten Highlights für maximale Performance
              </p>
              <p className="page__hint" style={{ color: '#999' }}>
                Laden...
              </p>
            </header>
          </main>
        }
      >
        <FeaturedProducts
          articles={articles}
          error={error}
          isLoading={isLoading}
          productsRef={productsRef}
        />
      </Suspense>
    </>
  );
}

type FeaturedProductsProps = {
  articles: Article[];
  error: string | null;
  isLoading: boolean;
  productsRef: React.RefObject<HTMLElement>;
};

function FeaturedProducts({ articles, error, isLoading, productsRef }: FeaturedProductsProps) {
  const searchParams = useSearchParams();
  const normalizedCategory = searchParams.get('category')?.toLowerCase() ?? null;
  const hasScrolledToHash = useRef<string | null>(null);

  const filteredArticles = useMemo(() => {
    if (!normalizedCategory || normalizedCategory === 'all') {
      return articles;
    }
    return articles.filter((article) => {
      const articleCategory = article.category?.toLowerCase() ?? '';
      if (articleCategory && articleCategory.includes(normalizedCategory)) {
        return true;
      }
      const articleName = article.name.toLowerCase();
      return articleName.includes(normalizedCategory);
    });
  }, [articles, normalizedCategory]);

  const categoryLabelMap: Record<string, string> = {
    shoes: 'Schuhe',
    shoe: 'Schuhe',
    sneakers: 'Sneaker',
    apparel: 'Bekleidung',
    clothing: 'Bekleidung',
    bekleidung: 'Bekleidung',
    equipment: 'Equipment',
    accessories: 'Accessoires',
    sale: 'Sale'
  };

  const activeCategoryLabel =
    normalizedCategory && normalizedCategory !== 'all'
      ? categoryLabelMap[normalizedCategory] ?? normalizedCategory
      : null;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if (isLoading) {
      return;
    }

    const hash = window.location.hash.replace('#', '');
    if (!hash) {
      return;
    }

    if (hasScrolledToHash.current === hash) {
      return;
    }

    const targetElement = hash === 'featured-products'
      ? productsRef.current
      : document.getElementById(hash);

    if (targetElement) {
      hasScrolledToHash.current = hash;
      requestAnimationFrame(() => {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [isLoading, filteredArticles, productsRef]);

  return (
    <main className="page" id="featured-products" ref={productsRef}>
      <header className="page__header">
        <h1>Featured Products</h1>
        <p className="page__hint">
          Unsere neuesten Highlights für maximale Performance
        </p>
        {activeCategoryLabel && (
          <p className="page__hint page__hint--filter">
            Kategorie: {activeCategoryLabel}
          </p>
        )}
        {error && (
          <p className="page__hint" style={{ color: '#dc2626' }}>
            {error}
          </p>
        )}
        {isLoading && (
          <p className="page__hint" style={{ color: '#999' }}>
            Laden...
          </p>
        )}
      </header>
      {!isLoading && (
        filteredArticles.length > 0 ? (
          <ArticleList articles={filteredArticles} />
        ) : (
          <p className="page__hint" style={{ color: '#dc2626', marginTop: '2rem' }}>
            Keine Produkte für diese Kategorie gefunden.
          </p>
        )
      )}
    </main>
  );
}

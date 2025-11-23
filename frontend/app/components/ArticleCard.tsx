'use client';

import Image from 'next/image';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

import { Article } from './types';

type ArticleCardProps = {
  article: Article;
};

export function ArticleCard({ article }: ArticleCardProps) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleAddToCart = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setIsAdding(true);
    try {
      await addToCart(article.id, 1);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error: any) {
      // Error-Message ist bereits auf Deutsch (aus CartContext)
      alert(error.message || 'Produkt konnte nicht hinzugefügt werden');
    } finally {
      setIsAdding(false);
    }
  };

  // Generate star rating display
  const renderStars = () => {
    const rating = article.rating || 0;
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<span key={i} className="star star--full">★</span>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<span key={i} className="star star--half">★</span>);
      } else {
        stars.push(<span key={i} className="star star--empty">★</span>);
      }
    }
    return stars;
  };

  const detailHrefWithAnchor = `/product/${article.id}?from=${encodeURIComponent(`product-${article.id}`)}`;

  // ✅ INVENTORY: Calculate available stock
  const availableStock = article.stock !== undefined
    ? article.stock - (article.reserved || 0)
    : null;
  const isOutOfStock = availableStock !== null && availableStock <= 0;
  const isLowStock = availableStock !== null && availableStock > 0 && availableStock <= 5;

  return (
    <article className="card" id={`product-${article.id}`}>
      <Link href={detailHrefWithAnchor} className="card__link">
        <div className="card__image">
          <Image
            alt={`Produktbild von ${article.name}`}
            src={article.imageUrl}
            fill
            sizes="(max-width: 768px) 100vw, 320px"
            style={{ objectFit: 'cover' }}
          />
        </div>
      </Link>
      <div className="card__content">
        <Link href={detailHrefWithAnchor} className="card__link">
          <h3>{article.name}</h3>
        </Link>

        {/* Star Rating */}
        {article.rating && (
          <div className="card__rating">
            <div className="stars">
              {renderStars()}
            </div>
            <span className="rating-text">
              {article.rating.toFixed(1)} {article.reviewCount && `(${article.reviewCount})`}
            </span>
          </div>
        )}

        <p className="card__description">
          {article.description}
        </p>

        {/* ✅ INVENTORY: Stock Display */}
        {availableStock !== null && (
          <div className="card__stock" style={{
            marginTop: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            {isOutOfStock ? (
              <span style={{ color: '#dc2626' }}>❌ Ausverkauft</span>
            ) : isLowStock ? (
              <span style={{ color: '#f59e0b' }}>⚠️ Nur noch {availableStock} auf Lager</span>
            ) : (
              <span style={{ color: '#10b981' }}>✅ {availableStock} auf Lager</span>
            )}
          </div>
        )}

        <div className="card__footer">
          <span className="card__price">
            €{article.price.toFixed(2)}
          </span>
          <button
            className="card__cta"
            type="button"
            onClick={handleAddToCart}
            disabled={isAdding || isOutOfStock}
            style={isOutOfStock ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
          >
            {isAdding ? (
              <>
                <span className="spinner"></span>
                Wird hinzugefügt...
              </>
            ) : showSuccess ? (
              '✓ Hinzugefügt!'
            ) : isOutOfStock ? (
              'Ausverkauft'
            ) : (
              'In den Warenkorb'
            )}
          </button>

          {/* Loading Spinner Style */}
          <style jsx>{`
            .spinner {
              display: inline-block;
              width: 12px;
              height: 12px;
              border: 2px solid rgba(255, 255, 255, 0.3);
              border-top-color: white;
              border-radius: 50%;
              animation: spin 0.6s linear infinite;
              margin-right: 8px;
            }

            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    </article>
  );
}

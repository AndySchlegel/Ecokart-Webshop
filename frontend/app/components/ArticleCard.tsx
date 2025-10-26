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
      alert(error.message || 'Fehler beim Hinzufügen zum Warenkorb');
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
        <div className="card__footer">
          <span className="card__price">
            €{article.price.toFixed(2)}
          </span>
          <button
            className="card__cta"
            type="button"
            onClick={handleAddToCart}
            disabled={isAdding}
          >
            {isAdding ? 'Wird hinzugefügt...' : showSuccess ? '✓ Hinzugefügt!' : 'In den Warenkorb'}
          </button>
        </div>
      </div>
    </article>
  );
}

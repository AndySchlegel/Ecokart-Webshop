import Image from 'next/image';
import React from 'react';

import { Article } from './types';

type ArticleCardProps = {
  article: Article;
};

export function ArticleCard({ article }: ArticleCardProps) {
  // Die Karte visualisiert einen einzelnen Artikel mit Bild und Kerndaten.
  return (
    <article className="card">
      <div className="card__image">
        <Image
          alt={`Produktbild von ${article.name}`}
          src={article.imageUrl}
          fill
          sizes="(max-width: 768px) 100vw, 320px"
          style={{ objectFit: 'cover' }}
        />
      </div>
      <div className="card__content">
        <h3>{article.name}</h3>
        <p className="card__description">
          {article.description}
        </p>
        <div className="card__footer">
          <span className="card__price">
            {article.price.toFixed(2)} €
          </span>
          <button className="card__cta" type="button">
            Details
          </button>
        </div>
      </div>
    </article>
  );
}

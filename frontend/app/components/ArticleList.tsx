import React from 'react';

import { Article } from './types';
import { ArticleCard } from './ArticleCard';

type ArticleListProps = {
  articles: Article[];
};

export function ArticleList({ articles }: ArticleListProps) {
  // Die Liste durchläuft alle Artikel und rendert jeweils eine Karte.
  return (
    <section>
      <div className="card-grid">
        {articles.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
          />
        ))}
      </div>
    </section>
  );
}

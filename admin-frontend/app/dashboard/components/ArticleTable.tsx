import React from 'react';

import type { Article } from '@/lib/articles';

type ArticleTableProps = {
  articles: Article[];
  onDelete: (id: string) => Promise<void>;
  onEdit: (article: Article) => void;
};

export function ArticleTable({ articles, onDelete, onEdit }: ArticleTableProps) {
  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Wirklich "${name}" löschen?`)) {
      return;
    }
    await onDelete(id);
  }

  if (articles.length === 0) {
    return (
      <div className="card">
        <h2>Keine Produkte</h2>
        <p>Noch keine Produkte vorhanden. Nutze das Formular unten, um neue anzulegen.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Produkte verwalten</h2>
      <p style={{ color: 'var(--text-gray)', marginBottom: '2rem' }}>
        {articles.length} {articles.length === 1 ? 'Produkt' : 'Produkte'} gefunden
      </p>
      <table>
        <thead>
          <tr>
            <th>Bild</th>
            <th>Name</th>
            <th>Preis</th>
            <th>Kategorie</th>
            <th>Rating</th>
            <th>Reviews</th>
            <th>Lager</th>
            <th>Beschreibung</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {articles.map((article) => (
            <tr key={article.id}>
              <td data-label="Bild">
                <img src={article.imageUrl} alt={article.name} />
              </td>
              <td data-label="Name">{article.name}</td>
              <td data-label="Preis">{article.price.toFixed(2)} €</td>
              <td data-label="Kategorie">{article.category ? article.category : '–'}</td>
              <td data-label="Rating">
                {article.rating ? `⭐ ${article.rating.toFixed(1)}` : '-'}
              </td>
              <td data-label="Reviews">
                {article.reviewCount || 0}
              </td>
              <td data-label="Lager">
                {article.stock !== undefined ? (
                  <span style={{
                    color: article.stock <= 0 ? '#dc2626' : article.stock <= 10 ? '#f59e0b' : '#10b981',
                    fontWeight: '600'
                  }}>
                    {article.stock} {article.reserved ? `(${article.reserved} res.)` : ''}
                  </span>
                ) : '–'}
              </td>
              <td data-label="Beschreibung">{article.description}</td>
              <td data-label="Aktionen">
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => onEdit(article)}
                    className="button button--secondary"
                    type="button"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => void handleDelete(article.id, article.name)}
                    className="button button--delete"
                    type="button"
                  >
                    Löschen
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

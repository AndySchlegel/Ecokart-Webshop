import React from 'react';

import type { Article } from '@/lib/articles';

type ArticleTableProps = {
  articles: Article[];
  onDelete: (id: string) => Promise<void>;
};

export function ArticleTable({ articles, onDelete }: ArticleTableProps) {
  async function handleDelete(id: string) {
    if (!window.confirm('Soll dieser Artikel wirklich entfernt werden?')) {
      return;
    }
    await onDelete(id);
  }

  return (
    <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ marginBottom: '0.5rem' }}>Artikelübersicht</h2>
        <p style={{ margin: 0 }}>Alle Einträge stammen direkt aus DynamoDB (Demo-Tabelle).</p>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #d7e3d7' }}>
              <th style={{ padding: '0.75rem' }}>Name</th>
              <th style={{ padding: '0.75rem' }}>Preis</th>
              <th style={{ padding: '0.75rem' }}>Beschreibung</th>
              <th style={{ padding: '0.75rem' }}>Bild-URL</th>
              <th style={{ padding: '0.75rem', width: '120px' }}>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article) => (
              <tr key={article.id} style={{ borderBottom: '1px solid #edf4ed' }}>
                <td style={{ padding: '0.75rem', fontWeight: 600 }}>{article.name}</td>
                <td style={{ padding: '0.75rem' }}>
                  {article.price.toFixed(2)} €
                </td>
                <td style={{ padding: '0.75rem' }}>
                  {article.description}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <a href={article.imageUrl} target="_blank" rel="noreferrer">
                    Bild anzeigen
                  </a>
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <button
                    type="button"
                    className="button"
                    style={{ background: '#b03a2e', width: '100%' }}
                    onClick={() => {
                      void handleDelete(article.id);
                    }}
                  >
                    Entfernen
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {articles.length === 0 && (
          <p style={{ padding: '1rem 0', color: '#4d624d' }}>
            Noch keine Artikel vorhanden.
          </p>
        )}
      </div>
    </section>
  );
}

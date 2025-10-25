import React, { useState } from 'react';

type ArticleFormValues = {
  name: string;
  price: string;
  description: string;
  imageUrl: string;
};

type ArticleFormProps = {
  onSubmit: (values: ArticleFormValues) => Promise<void>;
};

export function ArticleForm({ onSubmit }: ArticleFormProps) {
  const [values, setValues] = useState<ArticleFormValues>({
    name: '',
    price: '',
    description: '',
    imageUrl: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof ArticleFormValues>(field: K, value: ArticleFormValues[K]) {
    setValues((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await onSubmit(values);
      setValues({
        name: '',
        price: '',
        description: '',
        imageUrl: ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler beim Speichern.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ marginBottom: '0.5rem' }}>Neuen Artikel anlegen</h2>
        <p style={{ margin: 0 }}>Die Eingaben werden direkt an das bestehende Admin-Backend weitergeleitet.</p>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <span>Produktname</span>
          <input
            value={values.name}
            onChange={(event) => updateField('name', event.target.value)}
            required
            style={{ padding: '0.65rem 1rem', borderRadius: '0.75rem', border: '1px solid #d4e1d4' }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <span>Preis (€)</span>
          <input
            value={values.price}
            onChange={(event) => updateField('price', event.target.value)}
            type="number"
            step="0.01"
            required
            style={{ padding: '0.65rem 1rem', borderRadius: '0.75rem', border: '1px solid #d4e1d4' }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <span>Kurzbeschreibung</span>
          <textarea
            value={values.description}
            onChange={(event) => updateField('description', event.target.value)}
            rows={4}
            required
            style={{ padding: '0.65rem 1rem', borderRadius: '0.75rem', border: '1px solid #d4e1d4', resize: 'vertical' }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <span>Bild-URL</span>
          <input
            value={values.imageUrl}
            onChange={(event) => updateField('imageUrl', event.target.value)}
            type="url"
            required
            placeholder="https://..."
            style={{ padding: '0.65rem 1rem', borderRadius: '0.75rem', border: '1px solid #d4e1d4' }}
          />
        </label>
        {error && (
          <div style={{ color: '#9b1c1c' }}>
            {error}
          </div>
        )}
        <button className="button" type="submit" disabled={isLoading}>
          {isLoading ? 'Speichere ...' : 'Artikel anlegen'}
        </button>
      </form>
    </section>
  );
}

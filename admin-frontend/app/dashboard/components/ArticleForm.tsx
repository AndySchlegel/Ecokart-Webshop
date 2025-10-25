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
  const [success, setSuccess] = useState(false);

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
    setSuccess(false);
    try {
      await onSubmit(values);
      setValues({
        name: '',
        price: '',
        description: '',
        imageUrl: ''
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler beim Speichern.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>Neues Produkt anlegen</h2>
      <p style={{ color: 'var(--text-gray)', marginBottom: '2rem' }}>
        Füge ein neues Produkt zum Shop hinzu
      </p>

      {error && (
        <div className="message message--error">
          {error}
        </div>
      )}

      {success && (
        <div className="message message--success">
          Produkt erfolgreich angelegt!
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            <span>Produktname</span>
            <input
              value={values.name}
              onChange={(event) => updateField('name', event.target.value)}
              required
              placeholder="z.B. Air Performance Runner"
            />
          </label>

          <label>
            <span>Preis (€)</span>
            <input
              value={values.price}
              onChange={(event) => updateField('price', event.target.value)}
              type="number"
              step="0.01"
              required
              placeholder="99.99"
            />
          </label>

          <label className="form-grid--full">
            <span>Kurzbeschreibung</span>
            <textarea
              value={values.description}
              onChange={(event) => updateField('description', event.target.value)}
              rows={4}
              required
              placeholder="Beschreibe das Produkt..."
            />
          </label>

          <label className="form-grid--full">
            <span>Bild-URL</span>
            <input
              value={values.imageUrl}
              onChange={(event) => updateField('imageUrl', event.target.value)}
              type="url"
              required
              placeholder="https://images.unsplash.com/..."
            />
          </label>
        </div>

        <button className="button" type="submit" disabled={isLoading} style={{ marginTop: '2rem' }}>
          {isLoading ? 'Speichere...' : 'Produkt anlegen'}
        </button>
      </form>
    </div>
  );
}

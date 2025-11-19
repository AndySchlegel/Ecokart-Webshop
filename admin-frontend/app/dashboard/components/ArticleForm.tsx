import React, { useState } from 'react';

const LOCAL_IMAGES = [
  {
    label: 'Air Legacy Sky Dunk',
    value: '/pics/jordan-4657349_1280.jpg'
  },
  {
    label: 'Urban Flight Pack',
    value: '/pics/jordan-shoes-1777572_1280.jpg'
  },
  {
    label: 'Court Legends Jersey',
    value: '/pics/nba-8176216_1280.png'
  },
  {
    label: 'Velocity Sprint Runner',
    value: '/pics/nike-5418992_1280.jpg'
  },
  {
    label: 'Street Pulse Sneaker',
    value: '/pics/sneakers-5578127_1280.jpg'
  }
] as const;

type ArticleFormValues = {
  name: string;
  price: string;
  description: string;
  imageUrl: string;
  imageSource: 'url' | 'local';
  localImage: string;
  category: string;
  rating: string;
  reviewCount: string;
  stock: string;
};

type ArticleFormSubmitValues = {
  name: string;
  price: string;
  description: string;
  imageUrl: string;
  category: string;
  rating: string;
  reviewCount: string;
  stock: string;
};

type ArticleFormProps = {
  onSubmit: (values: ArticleFormSubmitValues, articleId?: string) => Promise<void>;
  editingArticle?: {
    id: string;
    name: string;
    price: number;
    description: string;
    imageUrl: string;
    category: string;
    rating: number;
    reviewCount: number;
    stock?: number;
  } | null;
  onCancelEdit?: () => void;
};

export function ArticleForm({ onSubmit, editingArticle, onCancelEdit }: ArticleFormProps) {
  const isLocalImage = editingArticle?.imageUrl.startsWith('/pics') ?? false;
  const [values, setValues] = useState<ArticleFormValues>({
    name: editingArticle?.name ?? '',
    price: editingArticle?.price.toString() ?? '',
    description: editingArticle?.description ?? '',
    imageUrl: isLocalImage ? '' : (editingArticle?.imageUrl ?? ''),
    imageSource: isLocalImage ? 'local' : 'url',
    localImage: isLocalImage ? (editingArticle?.imageUrl ?? LOCAL_IMAGES[0]?.value ?? '') : LOCAL_IMAGES[0]?.value ?? '',
    category: editingArticle?.category ?? 'shoes',
    rating: editingArticle?.rating.toString() ?? '4.5',
    reviewCount: editingArticle?.reviewCount.toString() ?? '0',
    stock: editingArticle?.stock?.toString() ?? '0'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const previewSrc = (values.imageSource === 'local' ? values.localImage : values.imageUrl).trim();

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
      const finalImageUrl = values.imageSource === 'local' ? values.localImage : values.imageUrl;
      await onSubmit({
        name: values.name,
        price: values.price,
        description: values.description,
        imageUrl: finalImageUrl,
        category: values.category,
        rating: values.rating,
        reviewCount: values.reviewCount,
        stock: values.stock
      }, editingArticle?.id);

      if (!editingArticle) {
        // Only reset form if creating a new article
        setValues({
          name: '',
          price: '',
          description: '',
          imageUrl: '',
          imageSource: 'url',
          localImage: LOCAL_IMAGES[0]?.value ?? '',
          category: 'shoes',
          rating: '4.5',
          reviewCount: '0',
          stock: '0'
        });
      }
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
      <h2>{editingArticle ? 'Produkt bearbeiten' : 'Neues Produkt anlegen'}</h2>
      <p style={{ color: 'var(--text-gray)', marginBottom: '2rem' }}>
        {editingArticle ? `Bearbeite "${editingArticle.name}"` : 'Füge ein neues Produkt zum Shop hinzu'}
      </p>

      {editingArticle && onCancelEdit && (
        <button
          type="button"
          onClick={onCancelEdit}
          className="button button--secondary"
          style={{ marginBottom: '1rem' }}
        >
          Abbrechen
        </button>
      )}

      {error && (
        <div className="message message--error">
          {error}
        </div>
      )}

      {success && (
        <div className="message message--success">
          {editingArticle ? 'Produkt erfolgreich aktualisiert!' : 'Produkt erfolgreich angelegt!'}
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

          <label>
            <span>Rating (0-5)</span>
            <input
              value={values.rating}
              onChange={(event) => updateField('rating', event.target.value)}
              type="number"
              step="0.1"
              min="0"
              max="5"
              required
              placeholder="4.5"
            />
          </label>

          <label>
            <span>Kategorie</span>
            <select
              value={values.category}
              onChange={(event) => updateField('category', event.target.value)}
              required
            >
              <option value="shoes">Schuhe</option>
              <option value="apparel">Bekleidung</option>
              <option value="equipment">Equipment</option>
              <option value="accessories">Accessoires</option>
            </select>
          </label>

          <label>
            <span>Anzahl Reviews</span>
            <input
              value={values.reviewCount}
              onChange={(event) => updateField('reviewCount', event.target.value)}
              type="number"
              min="0"
              required
              placeholder="100"
            />
          </label>

          <label>
            <span>Lagerbestand</span>
            <input
              value={values.stock}
              onChange={(event) => updateField('stock', event.target.value)}
              type="number"
              min="0"
              required
              placeholder="50"
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

          <div className="form-grid--full image-field">
            <span>Produktbild</span>
            <div className="image-source-selector">
              <div className="image-source-options">
                <label className="image-source-option">
                  <input
                    type="radio"
                    name="imageSource"
                    value="url"
                    checked={values.imageSource === 'url'}
                    onChange={() => updateField('imageSource', 'url')}
                  />
                  <span>Externe URL</span>
                </label>
                <label className="image-source-option">
                  <input
                    type="radio"
                    name="imageSource"
                    value="local"
                    checked={values.imageSource === 'local'}
                    onChange={() => updateField('imageSource', 'local')}
                  />
                  <span>Lokale Datei aus /pics</span>
                </label>
              </div>

              {values.imageSource === 'url' ? (
                <input
                  value={values.imageUrl}
                  onChange={(event) => updateField('imageUrl', event.target.value)}
                  type="url"
                  required={values.imageSource === 'url'}
                  disabled={values.imageSource !== 'url'}
                  placeholder="https://images.unsplash.com/..."
                />
              ) : (
                <select
                  value={values.localImage}
                  onChange={(event) => updateField('localImage', event.target.value)}
                  required={values.imageSource === 'local'}
                  disabled={values.imageSource !== 'local'}
                >
                  {LOCAL_IMAGES.map((image) => (
                    <option key={image.value} value={image.value}>
                      {image.label}
                    </option>
                  ))}
                </select>
              )}

              {values.imageSource === 'local' && (
                <p className="image-hint">
                  Bilder liegen unter <code>/pics</code>. Neue Dateien bitte in <code>frontend/public/pics</code> ablegen.
                </p>
              )}

              {previewSrc && (
                <div className="image-preview">
                  <img src={previewSrc} alt="Produktbild Vorschau" />
                </div>
              )}
            </div>
          </div>
        </div>

        <button className="button" type="submit" disabled={isLoading} style={{ marginTop: '2rem' }}>
          {isLoading ? 'Speichere...' : (editingArticle ? 'Änderungen speichern' : 'Produkt anlegen')}
        </button>
      </form>
    </div>
  );
}

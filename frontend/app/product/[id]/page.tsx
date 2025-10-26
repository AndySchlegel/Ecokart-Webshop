'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Navigation from '../../../components/Navigation';
import { useCart } from '../../../contexts/CartContext';
import { useAuth } from '../../../contexts/AuthContext';
import { Article } from '../../components/types';
import { API_BASE_URL } from '../../../lib/config';

// Sneaker sizes (US sizes)
const SHOE_SIZES = ['7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '13'];

// Colors for clothing (placeholder - can be extended later)
const COLORS = [
  { name: 'Schwarz', hex: '#000000' },
  { name: 'Weiß', hex: '#FFFFFF' },
  { name: 'Rot', hex: '#FF0000' },
  { name: 'Blau', hex: '#0000FF' },
  { name: 'Grün', hex: '#00FF00' },
];

function isShoeProduct(article: Article | null) {
  if (!article) {
    return false;
  }
  const category = article.category?.toLowerCase() ?? '';
  if (category === 'shoes' || category === 'shoe' || category === 'sneakers') {
    return true;
  }
  return /sneaker|runner|shoe/i.test(article.name);
}

function isApparelProduct(article: Article | null) {
  if (!article) {
    return false;
  }
  const category = article.category?.toLowerCase() ?? '';
  if (category === 'apparel' || category === 'clothing' || category === 'bekleidung') {
    return true;
  }
  return /hoodie|jacket|shirt|tee|trikot|shorts|sweat/i.test(article.name);
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0].name);
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromAnchor, setFromAnchor] = useState<string | null>(null);

  // Get search params on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setFromAnchor(params.get('from'));
    }
  }, []);

  useEffect(() => {
    async function loadProduct() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/products/${params.id}`);
        if (!response.ok) {
          throw new Error('Produkt nicht gefunden');
        }
        const data = await response.json();
        setProduct(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler beim Laden');
      } finally {
        setIsLoading(false);
      }
    }
    loadProduct();
  }, [params.id]);

  const handleAddToCart = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Check if size is selected for shoes
    if (isShoeProduct(product) && !selectedSize) {
      alert('Bitte wähle eine Größe aus');
      return;
    }

    setIsAdding(true);
    try {
      await addToCart(product!.id, 1);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error: any) {
      alert(error.message || 'Fehler beim Hinzufügen zum Warenkorb');
    } finally {
      setIsAdding(false);
    }
  };

  const renderStars = (rating: number) => {
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

  if (isLoading) {
    return (
      <>
        <Navigation />
        <div className="product-detail-page">
          <div className="product-loading">Lade Produkt...</div>
        </div>
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <Navigation />
        <div className="product-detail-page">
          <div className="product-error">
            <h2>Fehler</h2>
            <p>{error || 'Produkt nicht gefunden'}</p>
            <button onClick={() => router.push('/')} className="back-button">
              Zurück zum Shop
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="product-detail-page">
        <button
          onClick={() => {
            if (fromAnchor) {
              router.push(`/#${fromAnchor}`);
            } else {
              router.push('/#featured-products');
            }
          }}
          className="back-button"
        >
          ← Zurück zum Shop
        </button>

        <div className="product-detail-container">
          {/* Product Image */}
          <div className="product-image-section">
            <div className="product-image-wrapper">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: 'cover' }}
                priority
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="product-info-section">
            <h1 className="product-title">{product.name}</h1>

            {/* Rating */}
            {product.rating && (
              <div className="product-rating">
                <div className="stars">
                  {renderStars(product.rating)}
                </div>
                <span className="rating-text">
                  {product.rating.toFixed(1)} {product.reviewCount && `(${product.reviewCount} Bewertungen)`}
                </span>
              </div>
            )}

            {/* Price */}
            <div className="product-price">€{product.price.toFixed(2)}</div>

            {/* Description */}
            <p className="product-description">{product.description}</p>

            {/* Size Selection for Shoes */}
            {isShoeProduct(product) && (
              <div className="product-option">
                <label className="option-label">Größe auswählen:</label>
                <div className="size-grid">
                  {SHOE_SIZES.map((size) => (
                    <button
                      key={size}
                      className={`size-button ${selectedSize === size ? 'selected' : ''}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection for Apparel */}
            {isApparelProduct(product) && (
              <div className="product-option">
                <label className="option-label">Farbe: {selectedColor}</label>
                <div className="color-grid">
                  {COLORS.map((color) => (
                    <button
                      key={color.name}
                      className={`color-button ${selectedColor === color.name ? 'selected' : ''}`}
                      onClick={() => setSelectedColor(color.name)}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      {selectedColor === color.name && <span className="checkmark">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            <button
              className="add-to-cart-button"
              onClick={handleAddToCart}
              disabled={isAdding}
            >
              {isAdding ? 'Wird hinzugefügt...' : showSuccess ? '✓ Zum Warenkorb hinzugefügt!' : 'In den Warenkorb'}
            </button>

            {/* Product Details */}
            <div className="product-details">
              <h3>Produktdetails</h3>
              <ul>
                <li>Artikel-ID: {product.id}</li>
                {product.category && <li>Kategorie: {product.category}</li>}
                <li>Kostenloser Versand ab 50€</li>
                <li>30 Tage Rückgaberecht</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .product-detail-page {
          min-height: 100vh;
          background: #000;
          padding: 2rem 5vw;
          color: white;
        }

        .back-button {
          background: none;
          border: 2px solid var(--accent-orange);
          color: var(--accent-orange);
          padding: 0.75rem 1.5rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: 2rem;
          font-size: 1rem;
        }

        .back-button:hover {
          background: var(--accent-orange);
          color: #000;
          transform: translateX(-5px);
        }

        .product-loading,
        .product-error {
          text-align: center;
          padding: 4rem 2rem;
          font-size: 1.25rem;
        }

        .product-error h2 {
          color: var(--accent-orange);
          margin-bottom: 1rem;
        }

        .product-detail-container {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: start;
        }

        .product-image-section {
          position: sticky;
          top: 100px;
        }

        .product-image-wrapper {
          position: relative;
          width: 100%;
          aspect-ratio: 1;
          background: #1a1a1a;
          border: 2px solid #222;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .product-image-wrapper:hover {
          border-color: var(--accent-orange);
          box-shadow: 0 0 40px rgba(255, 107, 0, 0.3);
        }

        .product-info-section {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .product-title {
          font-size: 3rem;
          font-weight: 900;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, var(--accent-orange), var(--accent-green));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .product-rating {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stars {
          display: flex;
          gap: 0.25rem;
        }

        .star {
          font-size: 1.5rem;
        }

        .star--full {
          color: var(--accent-orange);
          text-shadow: 0 0 10px rgba(255, 107, 0, 0.5);
        }

        .star--half {
          background: linear-gradient(90deg, var(--accent-orange) 50%, #444 50%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .star--empty {
          color: #444;
        }

        .rating-text {
          color: #999;
          font-size: 1rem;
        }

        .product-price {
          font-size: 2.5rem;
          font-weight: 900;
          color: var(--accent-orange);
          letter-spacing: -0.02em;
        }

        .product-description {
          font-size: 1.125rem;
          line-height: 1.8;
          color: #ccc;
          margin: 0;
        }

        .product-option {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .option-label {
          font-size: 1.125rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: 0.5px;
        }

        .size-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
          gap: 0.75rem;
        }

        .size-button {
          padding: 1rem;
          background: transparent;
          border: 2px solid #333;
          color: #fff;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .size-button:hover {
          border-color: var(--accent-orange);
          background: rgba(255, 107, 0, 0.1);
        }

        .size-button.selected {
          border-color: var(--accent-orange);
          background: var(--accent-orange);
          color: #000;
        }

        .color-grid {
          display: flex;
          gap: 1rem;
        }

        .color-button {
          width: 50px;
          height: 50px;
          border: 3px solid #333;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .color-button:hover {
          border-color: var(--accent-orange);
          transform: scale(1.1);
        }

        .color-button.selected {
          border-color: var(--accent-orange);
          box-shadow: 0 0 20px rgba(255, 107, 0, 0.5);
        }

        .checkmark {
          color: var(--accent-orange);
          font-size: 1.5rem;
          font-weight: 900;
          text-shadow: 0 0 10px rgba(0, 0, 0, 0.8);
        }

        .add-to-cart-button {
          width: 100%;
          padding: 1.5rem;
          background: var(--accent-orange);
          border: none;
          color: #000;
          font-size: 1.25rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 2px;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 1rem;
        }

        .add-to-cart-button:hover:not(:disabled) {
          background: var(--accent-green);
          transform: translateY(-3px);
          box-shadow: 0 10px 30px rgba(0, 255, 135, 0.4);
        }

        .add-to-cart-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .product-details {
          margin-top: 2rem;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid #333;
        }

        .product-details h3 {
          margin: 0 0 1rem 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--accent-orange);
        }

        .product-details ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .product-details li {
          padding: 0.75rem 0;
          color: #ccc;
          border-bottom: 1px solid #222;
        }

        .product-details li:last-child {
          border-bottom: none;
        }

        @media (max-width: 1024px) {
          .product-detail-container {
            grid-template-columns: 1fr;
            gap: 2rem;
          }

          .product-image-section {
            position: relative;
            top: 0;
          }

          .product-title {
            font-size: 2rem;
          }

          .product-price {
            font-size: 2rem;
          }
        }

        @media (max-width: 640px) {
          .product-detail-page {
            padding: 1rem;
          }

          .product-title {
            font-size: 1.75rem;
          }

          .size-grid {
            grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
          }
        }
      `}</style>
    </>
  );
}

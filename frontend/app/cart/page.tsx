'use client';

import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, isLoading, cartTotal, cartItemCount } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  if (!user) {
    return (
      <div className="cart-container">
        <div className="cart-empty">
          <h1>ANMELDUNG ERFORDERLICH</h1>
          <p>Melde dich an, um deinen Warenkorb zu sehen</p>
          <Link href="/login" className="btn-primary">
            JETZT ANMELDEN
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading && !cart) {
    return (
      <div className="cart-container">
        <div className="cart-empty">
          <h1>LADEN...</h1>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="cart-container">
        <div className="cart-empty">
          <h1>DEIN WARENKORB<br/>IST LEER</h1>
          <p>Zeit, ihn mit den besten Produkten zu füllen</p>
          <Link href="/" className="btn-primary">
            JETZT SHOPPEN
          </Link>
        </div>
      </div>
    );
  }

  const handleQuantityChange = async (productId: string, newQuantity: number) => {
    try {
      await updateQuantity(productId, newQuantity);
    } catch (error) {
      alert('Fehler beim Aktualisieren der Menge');
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      await removeFromCart(productId);
    } catch (error) {
      alert('Fehler beim Entfernen des Artikels');
    }
  };

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h1>DEIN<br/>WARENKORB</h1>
        <p>{cartItemCount} {cartItemCount === 1 ? 'Artikel' : 'Artikel'}</p>
      </div>

      <div className="cart-content">
        <div className="cart-items">
          {cart.items.map((item) => (
            <div key={item.productId} className="cart-item">
              <div className="item-image">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  width={120}
                  height={120}
                  style={{ objectFit: 'cover' }}
                />
              </div>

              <div className="item-details">
                <h3>{item.name}</h3>
                <p className="item-price">€{item.price.toFixed(2)}</p>
              </div>

              <div className="item-quantity">
                <button
                  onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                  disabled={isLoading || item.quantity <= 1}
                  className="qty-btn"
                >
                  -
                </button>
                <span className="qty-value">{item.quantity}</span>
                <button
                  onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                  disabled={isLoading}
                  className="qty-btn"
                >
                  +
                </button>
              </div>

              <div className="item-total">
                <p>€{(item.price * item.quantity).toFixed(2)}</p>
              </div>

              <button
                onClick={() => handleRemove(item.productId)}
                disabled={isLoading}
                className="item-remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h2>ZUSAMMENFASSUNG</h2>

          <div className="summary-row">
            <span>Zwischensumme</span>
            <span>€{cartTotal.toFixed(2)}</span>
          </div>

          <div className="summary-row">
            <span>Versand</span>
            <span>Kostenlos</span>
          </div>

          <div className="summary-divider"></div>

          <div className="summary-row summary-total">
            <span>Gesamtsumme</span>
            <span>€{cartTotal.toFixed(2)}</span>
          </div>

          <button
            onClick={() => router.push('/checkout')}
            className="btn-checkout"
            disabled={isLoading}
          >
            ZUR KASSE
          </button>

          <Link href="/" className="btn-continue">
            ← Weiter shoppen
          </Link>
        </div>
      </div>

      <style jsx>{`
        .cart-container {
          min-height: 100vh;
          background: #000;
          padding: 4rem 2rem;
        }

        .cart-header {
          text-align: center;
          margin-bottom: 3rem;
          animation: fadeInUp 0.6s ease;
        }

        .cart-header h1 {
          font-size: 3.5rem;
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, var(--accent-orange), var(--accent-green));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .cart-header p {
          color: #999;
          font-size: 1.2rem;
        }

        .cart-empty {
          text-align: center;
          padding: 4rem 2rem;
          animation: fadeInUp 0.6s ease;
        }

        .cart-empty h1 {
          font-size: 3rem;
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, var(--accent-orange), var(--accent-green));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .cart-empty p {
          color: #999;
          font-size: 1.2rem;
          margin-bottom: 2rem;
        }

        .cart-content {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 3rem;
          animation: fadeInUp 0.6s ease;
        }

        .cart-items {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .cart-item {
          background: rgba(255, 255, 255, 0.03);
          border: 2px solid #222;
          padding: 1.5rem;
          border-radius: 4px;
          display: grid;
          grid-template-columns: 120px 1fr auto auto auto;
          gap: 1.5rem;
          align-items: center;
          transition: all 0.3s ease;
        }

        .cart-item:hover {
          border-color: var(--accent-orange);
          transform: translateY(-2px);
        }

        .item-image {
          border-radius: 4px;
          overflow: hidden;
          background: #111;
        }

        .item-details h3 {
          font-size: 1.2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .item-price {
          color: var(--accent-green);
          font-weight: 700;
          font-size: 1.1rem;
        }

        .item-quantity {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: rgba(255, 255, 255, 0.05);
          padding: 0.5rem;
          border-radius: 4px;
          border: 2px solid #333;
        }

        .qty-btn {
          background: none;
          border: none;
          color: white;
          font-size: 1.5rem;
          font-weight: 700;
          cursor: pointer;
          padding: 0.25rem 0.75rem;
          transition: all 0.3s ease;
        }

        .qty-btn:hover:not(:disabled) {
          color: var(--accent-orange);
        }

        .qty-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .qty-value {
          font-weight: 700;
          font-size: 1.1rem;
          min-width: 30px;
          text-align: center;
        }

        .item-total {
          font-size: 1.3rem;
          font-weight: 900;
          color: var(--accent-orange);
        }

        .item-remove {
          background: rgba(255, 0, 0, 0.1);
          border: 2px solid #ff0000;
          color: #ff6666;
          width: 40px;
          height: 40px;
          border-radius: 4px;
          font-size: 1.2rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .item-remove:hover:not(:disabled) {
          background: rgba(255, 0, 0, 0.2);
          transform: scale(1.1);
        }

        .item-remove:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .cart-summary {
          background: rgba(255, 255, 255, 0.03);
          border: 2px solid var(--accent-green);
          padding: 2rem;
          border-radius: 4px;
          height: fit-content;
          position: sticky;
          top: 2rem;
        }

        .cart-summary h2 {
          font-size: 1.5rem;
          font-weight: 900;
          margin-bottom: 1.5rem;
          color: var(--accent-green);
          letter-spacing: 2px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
          font-size: 1rem;
        }

        .summary-row span:first-child {
          color: #999;
        }

        .summary-row span:last-child {
          font-weight: 700;
        }

        .summary-divider {
          height: 2px;
          background: linear-gradient(90deg, var(--accent-orange), var(--accent-green));
          margin: 1.5rem 0;
        }

        .summary-total {
          font-size: 1.5rem;
          font-weight: 900;
          margin-bottom: 2rem;
        }

        .summary-total span:first-child {
          color: white;
        }

        .summary-total span:last-child {
          color: var(--accent-orange);
        }

        .btn-checkout {
          width: 100%;
          padding: 1.25rem;
          background: var(--accent-orange);
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1.1rem;
          font-weight: 900;
          letter-spacing: 2px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          margin-bottom: 1rem;
        }

        .btn-checkout:hover:not(:disabled) {
          background: #ff8533;
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(255, 107, 0, 0.4);
        }

        .btn-checkout:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-continue {
          display: block;
          text-align: center;
          color: #999;
          text-decoration: none;
          padding: 1rem;
          transition: color 0.3s ease;
        }

        .btn-continue:hover {
          color: var(--accent-green);
        }

        .btn-primary {
          display: inline-block;
          padding: 1.25rem 3rem;
          background: var(--accent-orange);
          color: white;
          text-decoration: none;
          border-radius: 4px;
          font-weight: 900;
          letter-spacing: 2px;
          transition: all 0.3s ease;
        }

        .btn-primary:hover {
          background: #ff8533;
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(255, 107, 0, 0.4);
        }

        @media (max-width: 1024px) {
          .cart-content {
            grid-template-columns: 1fr;
          }

          .cart-summary {
            position: static;
          }
        }

        @media (max-width: 768px) {
          .cart-container {
            padding: 2rem 1rem;
          }

          .cart-header h1 {
            font-size: 2.5rem;
          }

          .cart-item {
            grid-template-columns: 80px 1fr;
            gap: 1rem;
          }

          .item-image {
            grid-column: 1;
            grid-row: 1 / 3;
          }

          .item-details {
            grid-column: 2;
            grid-row: 1;
          }

          .item-quantity {
            grid-column: 2;
            grid-row: 2;
          }

          .item-total {
            grid-column: 1;
            grid-row: 3;
            text-align: center;
          }

          .item-remove {
            grid-column: 2;
            grid-row: 3;
            justify-self: end;
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL } from '../../lib/config';
import { fetchAuthSession } from 'aws-amplify/auth';

export default function CheckoutPage() {
  const { cart, cartTotal, isLoading: cartLoading, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const [shippingAddress, setShippingAddress] = useState({
    name: '', // User gibt Namen im Formular ein
    street: '',
    city: '',
    postalCode: '',
    country: 'Deutschland'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    return (
      <div className="checkout-container">
        <div className="checkout-empty">
          <h1>ANMELDUNG ERFORDERLICH</h1>
          <p>Melde dich an, um zur Kasse zu gehen</p>
          <Link href="/login" className="btn-primary">
            JETZT ANMELDEN
          </Link>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="checkout-container">
        <div className="checkout-empty">
          <h1>WARENKORB LEER</h1>
          <p>Füge Produkte hinzu, um fortzufahren</p>
          <Link href="/" className="btn-primary">
            JETZT SHOPPEN
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Cognito Token holen
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      if (!token) {
        throw new Error('Nicht eingeloggt - bitte melde dich erneut an');
      }

      const orderData = {
        items: cart.items,
        total: cartTotal,
        shippingAddress
      };

      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Bestellung fehlgeschlagen');
      }

      const order = await response.json();

      // Clear cart after successful order
      await clearCart();

      router.push(`/order-confirmation/${order.id}`);
    } catch (err: any) {
      setError(err.message || 'Bestellung konnte nicht abgeschlossen werden');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h1>CHECKOUT</h1>
        <p>Nur noch ein Schritt bis zu deiner Bestellung</p>
      </div>

      <div className="checkout-content">
        <form onSubmit={handleSubmit} className="checkout-form">
          <div className="form-section">
            <h2>LIEFERADRESSE</h2>

            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="name">Vollständiger Name *</label>
              <input
                id="name"
                type="text"
                value={shippingAddress.name}
                onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })}
                placeholder="Max Mustermann"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="street">Straße und Hausnummer *</label>
              <input
                id="street"
                type="text"
                value={shippingAddress.street}
                onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                placeholder="Musterstraße 123"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="postalCode">PLZ *</label>
                <input
                  id="postalCode"
                  type="text"
                  value={shippingAddress.postalCode}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                  placeholder="12345"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="city">Stadt *</label>
                <input
                  id="city"
                  type="text"
                  value={shippingAddress.city}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                  placeholder="Berlin"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="country">Land *</label>
              <select
                id="country"
                value={shippingAddress.country}
                onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                required
                disabled={isSubmitting}
              >
                <option value="Deutschland">Deutschland</option>
                <option value="Österreich">Österreich</option>
                <option value="Schweiz">Schweiz</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="btn-submit"
            disabled={isSubmitting || cartLoading}
          >
            {isSubmitting ? 'BESTELLUNG WIRD VERARBEITET...' : 'JETZT KAUFEN'}
          </button>
        </form>

        <div className="order-summary">
          <h2>BESTELLÜBERSICHT</h2>

          <div className="summary-items">
            {cart.items.map((item) => (
              <div key={item.productId} className="summary-item">
                <div className="item-info">
                  <p className="item-name">{item.name}</p>
                  <p className="item-qty">Menge: {item.quantity}</p>
                </div>
                <p className="item-price">€{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div className="summary-divider"></div>

          <div className="summary-row">
            <span>Zwischensumme</span>
            <span>€{cartTotal.toFixed(2)}</span>
          </div>

          <div className="summary-row">
            <span>Versand</span>
            <span>Kostenlos</span>
          </div>

          <div className="summary-divider"></div>

          <div className="summary-total">
            <span>Gesamtsumme</span>
            <span>€{cartTotal.toFixed(2)}</span>
          </div>

          <Link href="/cart" className="btn-back">
            ← Zurück zum Warenkorb
          </Link>
        </div>
      </div>

      <style jsx>{`
        .checkout-container {
          min-height: 100vh;
          background: #000;
          padding: 4rem 2rem;
        }

        .checkout-header {
          text-align: center;
          margin-bottom: 3rem;
          animation: fadeInUp 0.6s ease;
        }

        .checkout-header h1 {
          font-size: 3.5rem;
          font-weight: 900;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, var(--accent-orange), var(--accent-green));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .checkout-header p {
          color: #999;
          font-size: 1.2rem;
        }

        .checkout-empty {
          text-align: center;
          padding: 4rem 2rem;
          animation: fadeInUp 0.6s ease;
        }

        .checkout-empty h1 {
          font-size: 3rem;
          font-weight: 900;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, var(--accent-orange), var(--accent-green));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .checkout-empty p {
          color: #999;
          font-size: 1.2rem;
          margin-bottom: 2rem;
        }

        .checkout-content {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 3rem;
          animation: fadeInUp 0.6s ease;
        }

        .checkout-form {
          background: rgba(255, 255, 255, 0.03);
          border: 2px solid #222;
          padding: 2.5rem;
          border-radius: 4px;
        }

        .form-section {
          margin-bottom: 2rem;
        }

        .form-section h2 {
          font-size: 1.5rem;
          font-weight: 900;
          margin-bottom: 1.5rem;
          color: var(--accent-green);
          letter-spacing: 2px;
        }

        .form-error {
          background: rgba(255, 0, 0, 0.1);
          border: 2px solid #ff0000;
          color: #ff6666;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1.5rem;
          text-align: center;
          font-weight: 600;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.875rem;
          letter-spacing: 1px;
          color: #999;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid #333;
          border-radius: 4px;
          color: white;
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: var(--accent-orange);
          background: rgba(255, 255, 255, 0.08);
        }

        .form-group input:disabled,
        .form-group select:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .form-group input::placeholder {
          color: #666;
        }

        .btn-submit {
          width: 100%;
          padding: 1.5rem;
          background: var(--accent-orange);
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1.2rem;
          font-weight: 900;
          letter-spacing: 2px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
        }

        .btn-submit:hover:not(:disabled) {
          background: #ff8533;
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(255, 107, 0, 0.4);
        }

        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .order-summary {
          background: rgba(255, 255, 255, 0.03);
          border: 2px solid var(--accent-green);
          padding: 2rem;
          border-radius: 4px;
          height: fit-content;
          position: sticky;
          top: 2rem;
        }

        .order-summary h2 {
          font-size: 1.5rem;
          font-weight: 900;
          margin-bottom: 1.5rem;
          color: var(--accent-green);
          letter-spacing: 2px;
        }

        .summary-items {
          margin-bottom: 1.5rem;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #222;
        }

        .item-info {
          flex: 1;
        }

        .item-name {
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .item-qty {
          font-size: 0.875rem;
          color: #999;
        }

        .item-price {
          font-weight: 700;
          color: var(--accent-orange);
        }

        .summary-divider {
          height: 2px;
          background: linear-gradient(90deg, var(--accent-orange), var(--accent-green));
          margin: 1.5rem 0;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .summary-row span:first-child {
          color: #999;
        }

        .summary-row span:last-child {
          font-weight: 700;
        }

        .summary-total {
          display: flex;
          justify-content: space-between;
          font-size: 1.5rem;
          font-weight: 900;
          margin: 1.5rem 0;
        }

        .summary-total span:last-child {
          color: var(--accent-orange);
        }

        .btn-back {
          display: block;
          text-align: center;
          color: #999;
          text-decoration: none;
          padding: 1rem;
          transition: color 0.3s ease;
        }

        .btn-back:hover {
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
          .checkout-content {
            grid-template-columns: 1fr;
          }

          .order-summary {
            position: static;
          }
        }

        @media (max-width: 768px) {
          .checkout-container {
            padding: 2rem 1rem;
          }

          .checkout-header h1 {
            font-size: 2.5rem;
          }

          .checkout-form {
            padding: 1.5rem;
          }

          .form-row {
            grid-template-columns: 1fr;
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

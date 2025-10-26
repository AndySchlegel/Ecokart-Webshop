'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Order {
  id: string;
  userId: string;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl: string;
  }>;
  total: number;
  shippingAddress: {
    street: string;
    city: string;
    zipCode: string;
    country: string;
  };
  status: string;
  createdAt: string;
}

export default function OrderConfirmationPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { token, user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !orderId) {
      setIsLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const response = await fetch(`http://localhost:4000/api/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Bestellung konnte nicht geladen werden');
        }

        const data = await response.json();
        setOrder(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [token, orderId]);

  if (!user) {
    return (
      <div className="confirmation-container">
        <div className="confirmation-message">
          <h1>ANMELDUNG ERFORDERLICH</h1>
          <p>Melde dich an, um deine Bestellung zu sehen</p>
          <Link href="/login" className="btn-primary">
            JETZT ANMELDEN
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="confirmation-container">
        <div className="confirmation-message">
          <h1>LADEN...</h1>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="confirmation-container">
        <div className="confirmation-message">
          <h1>FEHLER</h1>
          <p>{error || 'Bestellung nicht gefunden'}</p>
          <Link href="/" className="btn-primary">
            ZURÜCK ZUM SHOP
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="confirmation-container">
      <div className="confirmation-success">
        <div className="success-icon">✓</div>
        <h1>BESTELLUNG<br/>ERFOLGREICH</h1>
        <p className="order-number">Bestellnummer: <strong>{order.id}</strong></p>
        <p className="success-message">
          Danke für deine Bestellung! Wir haben eine Bestätigung an deine E-Mail gesendet.
        </p>
      </div>

      <div className="order-details">
        <div className="detail-section">
          <h2>LIEFERADRESSE</h2>
          <div className="address-box">
            <p>{order.shippingAddress.street}</p>
            <p>{order.shippingAddress.zipCode} {order.shippingAddress.city}</p>
            <p>{order.shippingAddress.country}</p>
          </div>
        </div>

        <div className="detail-section">
          <h2>BESTELLTE ARTIKEL</h2>
          <div className="items-list">
            {order.items.map((item) => (
              <div key={item.productId} className="order-item">
                <div className="item-details">
                  <p className="item-name">{item.name}</p>
                  <p className="item-qty">Menge: {item.quantity}</p>
                </div>
                <p className="item-price">€{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="detail-section">
          <h2>BESTELLSUMME</h2>
          <div className="order-total">
            <div className="total-row">
              <span>Zwischensumme</span>
              <span>€{order.total.toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>Versand</span>
              <span>Kostenlos</span>
            </div>
            <div className="total-divider"></div>
            <div className="total-row total-final">
              <span>Gesamtsumme</span>
              <span>€{order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h2>STATUS</h2>
          <div className="status-badge">
            {order.status === 'pending' && '⏳ In Bearbeitung'}
            {order.status === 'processing' && '📦 Wird verarbeitet'}
            {order.status === 'shipped' && '🚚 Versendet'}
            {order.status === 'delivered' && '✓ Zugestellt'}
            {order.status === 'cancelled' && '✕ Storniert'}
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <Link href="/" className="btn-primary">
          WEITER SHOPPEN
        </Link>
      </div>

      <style jsx>{`
        .confirmation-container {
          min-height: 100vh;
          background: #000;
          padding: 4rem 2rem;
        }

        .confirmation-success {
          text-align: center;
          margin-bottom: 3rem;
          animation: fadeInUp 0.6s ease;
        }

        .success-icon {
          width: 100px;
          height: 100px;
          margin: 0 auto 2rem;
          background: var(--accent-green);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
          font-weight: 900;
          color: #000;
          animation: scaleIn 0.6s ease 0.2s both;
        }

        .confirmation-success h1 {
          font-size: 3.5rem;
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, var(--accent-green), var(--accent-orange));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .order-number {
          color: #999;
          margin-bottom: 1rem;
          font-size: 1.1rem;
        }

        .order-number strong {
          color: var(--accent-orange);
          font-weight: 700;
        }

        .success-message {
          color: #ccc;
          font-size: 1.2rem;
          max-width: 600px;
          margin: 0 auto;
        }

        .confirmation-message {
          text-align: center;
          padding: 4rem 2rem;
          animation: fadeInUp 0.6s ease;
        }

        .confirmation-message h1 {
          font-size: 3rem;
          font-weight: 900;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, var(--accent-orange), var(--accent-green));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .confirmation-message p {
          color: #999;
          font-size: 1.2rem;
          margin-bottom: 2rem;
        }

        .order-details {
          max-width: 800px;
          margin: 0 auto 3rem;
          display: grid;
          gap: 2rem;
          animation: fadeInUp 0.6s ease 0.3s both;
        }

        .detail-section {
          background: rgba(255, 255, 255, 0.03);
          border: 2px solid #222;
          padding: 2rem;
          border-radius: 4px;
        }

        .detail-section h2 {
          font-size: 1.2rem;
          font-weight: 900;
          margin-bottom: 1.5rem;
          color: var(--accent-green);
          letter-spacing: 2px;
        }

        .address-box {
          color: #ccc;
          line-height: 1.8;
        }

        .address-box p {
          margin: 0;
        }

        .items-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .order-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 1rem;
          border-bottom: 1px solid #222;
        }

        .order-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .item-details {
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
          font-size: 1.1rem;
        }

        .order-total {
          color: #ccc;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .total-row span:last-child {
          font-weight: 700;
        }

        .total-divider {
          height: 2px;
          background: linear-gradient(90deg, var(--accent-orange), var(--accent-green));
          margin: 1.5rem 0;
        }

        .total-final {
          font-size: 1.5rem;
          font-weight: 900;
          color: white;
        }

        .total-final span:last-child {
          color: var(--accent-orange);
        }

        .status-badge {
          display: inline-block;
          padding: 1rem 2rem;
          background: rgba(0, 255, 135, 0.1);
          border: 2px solid var(--accent-green);
          border-radius: 4px;
          color: var(--accent-green);
          font-weight: 700;
          font-size: 1.1rem;
        }

        .action-buttons {
          text-align: center;
          animation: fadeInUp 0.6s ease 0.4s both;
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
          text-transform: uppercase;
        }

        .btn-primary:hover {
          background: #ff8533;
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(255, 107, 0, 0.4);
        }

        @media (max-width: 768px) {
          .confirmation-container {
            padding: 2rem 1rem;
          }

          .confirmation-success h1 {
            font-size: 2.5rem;
          }

          .success-icon {
            width: 80px;
            height: 80px;
            font-size: 2.5rem;
          }

          .detail-section {
            padding: 1.5rem;
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

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

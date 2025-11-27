'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL } from '../../../lib/config';
import { fetchAuthSession } from 'aws-amplify/auth';

interface SessionData {
  id: string;
  amount_total: number;
  currency: string;
  customer_email?: string;
  payment_status: string;
  status: string;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionId) {
      setError('Keine Session ID gefunden');
      setLoading(false);
      return;
    }

    const fetchSessionDetails = async () => {
      try {
        // Cognito Token holen
        const authSession = await fetchAuthSession();
        const token = authSession.tokens?.idToken?.toString();

        if (!token) {
          throw new Error('Nicht eingeloggt');
        }

        // Session Details vom Backend holen
        const response = await fetch(`${API_BASE_URL}/api/checkout/session/${sessionId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Session Details konnten nicht geladen werden');
        }

        const data = await response.json();
        setSession(data);
      } catch (err: any) {
        console.error('Error fetching session:', err);
        setError(err.message || 'Fehler beim Laden der Bestelldaten');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionDetails();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="success-container">
        <div className="success-content">
          <div className="loading">
            <div className="spinner"></div>
            <p>Lade Bestelldaten...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !sessionId) {
    return (
      <div className="success-container">
        <div className="success-content">
          <div className="error-box">
            <h1>FEHLER</h1>
            <p>{error || 'Keine gültige Session gefunden'}</p>
            <Link href="/" className="btn-primary">
              Zurück zur Startseite
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="success-container">
      <div className="success-content">
        <div className="success-icon">
          <svg viewBox="0 0 52 52" className="checkmark">
            <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
            <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
        </div>

        <h1 className="success-title">ZAHLUNG ERFOLGREICH!</h1>
        <p className="success-subtitle">
          Vielen Dank für deine Bestellung bei EcoKart
        </p>

        {session && (
          <div className="order-details">
            <h2>BESTELLDETAILS</h2>

            <div className="detail-row">
              <span className="detail-label">Bestellnummer:</span>
              <span className="detail-value">{session.id.substring(0, 16)}...</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Betrag:</span>
              <span className="detail-value highlight">
                €{(session.amount_total / 100).toFixed(2)}
              </span>
            </div>

            {session.customer_email && (
              <div className="detail-row">
                <span className="detail-label">E-Mail:</span>
                <span className="detail-value">{session.customer_email}</span>
              </div>
            )}

            <div className="detail-row">
              <span className="detail-label">Zahlungsstatus:</span>
              <span className="detail-value status-badge">
                {session.payment_status === 'paid' ? 'Bezahlt' : session.payment_status}
              </span>
            </div>

            <div className="info-box">
              <p>
                📧 Du erhältst in Kürze eine Bestätigungs-E-Mail mit allen Details zu deiner Bestellung.
              </p>
              <p>
                📦 Deine Artikel werden in den nächsten 2-3 Werktagen versandt.
              </p>
            </div>
          </div>
        )}

        <div className="action-buttons">
          <Link href="/" className="btn-primary">
            Weiter shoppen
          </Link>
          <Link href="/cart" className="btn-secondary">
            Zurück zum Warenkorb
          </Link>
        </div>
      </div>

      <style jsx>{`
        .success-container {
          min-height: 100vh;
          background: #000;
          padding: 4rem 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .success-content {
          max-width: 600px;
          width: 100%;
          background: rgba(255, 255, 255, 0.03);
          border: 2px solid var(--accent-green);
          padding: 3rem;
          border-radius: 8px;
          text-align: center;
          animation: fadeInUp 0.6s ease;
        }

        .success-icon {
          margin: 0 auto 2rem;
        }

        .checkmark {
          width: 100px;
          height: 100px;
          margin: 0 auto;
          animation: scaleIn 0.5s ease-in-out;
        }

        .checkmark-circle {
          stroke-dasharray: 166;
          stroke-dashoffset: 166;
          stroke-width: 2;
          stroke: var(--accent-green);
          animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }

        .checkmark-check {
          transform-origin: 50% 50%;
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          stroke-width: 3;
          stroke: var(--accent-green);
          animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.6s forwards;
        }

        .success-title {
          font-size: 2.5rem;
          font-weight: 900;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, var(--accent-green), var(--accent-orange));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .success-subtitle {
          color: #999;
          font-size: 1.2rem;
          margin-bottom: 3rem;
        }

        .order-details {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid #333;
          border-radius: 4px;
          padding: 2rem;
          margin-bottom: 2rem;
          text-align: left;
        }

        .order-details h2 {
          font-size: 1.2rem;
          font-weight: 900;
          margin-bottom: 1.5rem;
          color: var(--accent-green);
          letter-spacing: 2px;
          text-align: center;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #222;
        }

        .detail-row:last-of-type {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }

        .detail-label {
          color: #999;
          font-size: 0.95rem;
        }

        .detail-value {
          font-weight: 700;
          color: white;
        }

        .detail-value.highlight {
          color: var(--accent-orange);
          font-size: 1.2rem;
        }

        .status-badge {
          background: var(--accent-green);
          color: #000;
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          font-size: 0.875rem;
          font-weight: 900;
        }

        .info-box {
          margin-top: 1.5rem;
          padding: 1.5rem;
          background: rgba(0, 255, 136, 0.05);
          border-left: 4px solid var(--accent-green);
          border-radius: 4px;
          text-align: left;
        }

        .info-box p {
          color: #ccc;
          line-height: 1.6;
          margin-bottom: 0.75rem;
        }

        .info-box p:last-child {
          margin-bottom: 0;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .btn-primary,
        .btn-secondary {
          padding: 1rem 2rem;
          border-radius: 4px;
          font-weight: 900;
          letter-spacing: 1px;
          text-decoration: none;
          transition: all 0.3s ease;
          font-size: 0.95rem;
        }

        .btn-primary {
          background: var(--accent-green);
          color: #000;
        }

        .btn-primary:hover {
          background: #00ff88;
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0, 255, 136, 0.4);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid #333;
          color: white;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: var(--accent-orange);
        }

        .loading {
          text-align: center;
          padding: 3rem;
        }

        .spinner {
          width: 50px;
          height: 50px;
          margin: 0 auto 1rem;
          border: 4px solid rgba(255, 255, 255, 0.1);
          border-top: 4px solid var(--accent-green);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .loading p {
          color: #999;
        }

        .error-box {
          padding: 2rem;
          text-align: center;
        }

        .error-box h1 {
          font-size: 2rem;
          font-weight: 900;
          color: #ff6666;
          margin-bottom: 1rem;
        }

        .error-box p {
          color: #999;
          margin-bottom: 2rem;
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
          0% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes stroke {
          100% {
            stroke-dashoffset: 0;
          }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .success-container {
            padding: 2rem 1rem;
          }

          .success-content {
            padding: 2rem 1.5rem;
          }

          .success-title {
            font-size: 2rem;
          }

          .action-buttons {
            flex-direction: column;
          }

          .btn-primary,
          .btn-secondary {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="success-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Lade...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

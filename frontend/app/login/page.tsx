'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>WILLKOMMEN<br/>ZURÜCK</h1>
          <p>Melde dich an, um weiterzumachen</p>
        </div>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">E-Mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="beispiel@gmail.com"
              required
              disabled={isLoading}
              title="Bitte gib eine gültige E-Mail-Adresse ein (z.B. name@gmail.com)"
            />
            <small style={{ color: '#999', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
              Vergiss das @ nicht! (z.B. deinname@gmail.com)
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="password">Passwort</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Wird geladen...' : 'ANMELDEN'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Noch kein Konto?</p>
          <Link href="/register" className="auth-link">
            JETZT REGISTRIEREN
          </Link>
        </div>

        <div className="auth-back">
          <Link href="/">← Zurück zum Shop</Link>
        </div>
      </div>

      <style jsx>{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
        }

        .auth-card {
          background: rgba(255, 255, 255, 0.03);
          border: 2px solid var(--accent-orange);
          padding: 3rem;
          border-radius: 4px;
          width: 100%;
          max-width: 450px;
          box-shadow: 0 20px 60px rgba(255, 107, 0, 0.2);
          animation: slideInUp 0.5s ease;
        }

        .auth-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .auth-header h1 {
          font-size: 2.5rem;
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, var(--accent-orange), var(--accent-green));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .auth-header p {
          color: #999;
          font-size: 1rem;
        }

        .auth-error {
          background: rgba(255, 0, 0, 0.1);
          border: 2px solid #ff0000;
          color: #ff6666;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1.5rem;
          text-align: center;
          font-weight: 600;
        }

        .auth-form {
          margin-bottom: 2rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.875rem;
          letter-spacing: 1px;
          color: var(--accent-green);
        }

        .form-group input {
          width: 100%;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid #333;
          border-radius: 4px;
          color: white;
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        .form-group input:focus {
          outline: none;
          border-color: var(--accent-orange);
          background: rgba(255, 255, 255, 0.08);
        }

        .form-group input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .form-group input::placeholder {
          color: #666;
        }

        .btn-primary {
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
        }

        .btn-primary:hover:not(:disabled) {
          background: #ff8533;
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(255, 107, 0, 0.4);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auth-footer {
          text-align: center;
          padding-top: 1.5rem;
          border-top: 1px solid #333;
        }

        .auth-footer p {
          color: #999;
          margin-bottom: 0.75rem;
        }

        .auth-link {
          color: var(--accent-green);
          font-weight: 700;
          text-decoration: none;
          letter-spacing: 1px;
          transition: all 0.3s ease;
        }

        .auth-link:hover {
          color: var(--accent-orange);
        }

        .auth-back {
          text-align: center;
          margin-top: 1.5rem;
        }

        .auth-back a {
          color: #666;
          text-decoration: none;
          font-size: 0.875rem;
          transition: color 0.3s ease;
        }

        .auth-back a:hover {
          color: var(--accent-green);
        }

        @media (max-width: 768px) {
          .auth-container {
            padding: 1rem;
          }

          .auth-card {
            padding: 2rem;
          }

          .auth-header h1 {
            font-size: 2rem;
          }
        }

        @keyframes slideInUp {
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

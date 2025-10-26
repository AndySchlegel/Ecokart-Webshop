'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    setIsLoading(true);

    try {
      await register(email, password, name);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Registrierung fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>WERDE<br/>MITGLIED</h1>
          <p>Erstelle dein Konto und starte durch</p>
        </div>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dein Name"
              required
              disabled={isLoading}
            />
          </div>

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
              pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
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
              placeholder="Mindestens 6 Zeichen"
              required
              disabled={isLoading}
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Passwort bestätigen</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Passwort wiederholen"
              required
              disabled={isLoading}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Wird erstellt...' : 'REGISTRIEREN'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Bereits Mitglied?</p>
          <Link href="/login" className="auth-link">
            JETZT ANMELDEN
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
          border: 2px solid var(--accent-green);
          padding: 3rem;
          border-radius: 4px;
          width: 100%;
          max-width: 450px;
          box-shadow: 0 20px 60px rgba(0, 255, 135, 0.2);
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
          background: linear-gradient(135deg, var(--accent-green), var(--accent-orange));
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
          border-color: var(--accent-green);
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
          background: var(--accent-green);
          color: black;
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
          background: #33ffaa;
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0, 255, 135, 0.4);
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
          color: var(--accent-orange);
          font-weight: 700;
          text-decoration: none;
          letter-spacing: 1px;
          transition: all 0.3s ease;
        }

        .auth-link:hover {
          color: var(--accent-green);
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

'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { confirmSignUp, autoSignIn } from 'aws-amplify/auth';

// Inner component that uses useSearchParams
function VerifyEmailContent() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Email aus URL Query Parameter holen
  const email = searchParams.get('email') || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email) {
      setError('E-Mail fehlt. Bitte registriere dich erneut.');
      setIsLoading(false);
      return;
    }

    try {
      console.log('📧 Versuche Email zu bestätigen für:', email);

      // Cognito Confirmation
      const { isSignUpComplete, nextStep } = await confirmSignUp({
        username: email,
        confirmationCode: code,
      });

      if (isSignUpComplete) {
        console.log('✅ Email erfolgreich bestätigt!');
        setSuccess(true);

        // Auto-Login nach Bestätigung
        try {
          await autoSignIn();
          console.log('✅ Automatischer Login erfolgreich');

          // Nach 2 Sekunden zum Shop
          setTimeout(() => {
            router.push('/');
          }, 2000);
        } catch (error) {
          console.log('⚠️ Auto-Login fehlgeschlagen, manueller Login erforderlich');
          // Redirect zu Login nach 3 Sekunden
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        }
      } else {
        console.warn('⚠️ Confirmation incomplete, next step:', nextStep);
        setError('Bestätigung konnte nicht abgeschlossen werden');
      }
    } catch (err: any) {
      console.error('❌ Verification Error:', err);

      // Benutzerfreundliche Fehlermeldungen
      if (err.name === 'CodeMismatchException') {
        setError('Falscher Code. Bitte prüfe den Code aus deiner E-Mail.');
      } else if (err.name === 'ExpiredCodeException') {
        setError('Code ist abgelaufen. Bitte fordere einen neuen Code an.');
      } else if (err.name === 'LimitExceededException') {
        setError('Zu viele Versuche. Bitte warte einen Moment.');
      } else {
        setError(err.message || 'Bestätigung fehlgeschlagen');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Success Screen
  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card success">
          <div className="auth-header">
            <div className="success-icon">✅</div>
            <h1>ERFOLGREICH<br/>BESTÄTIGT!</h1>
            <p>Deine E-Mail wurde erfolgreich bestätigt.</p>
            <p style={{ marginTop: '1rem', color: '#00ff87' }}>
              Du wirst automatisch eingeloggt...
            </p>
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
            box-shadow: 0 20px 60px rgba(0, 255, 135, 0.4);
            animation: scaleIn 0.5s ease;
          }

          .success-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
          }

          .auth-header {
            text-align: center;
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

          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.9);
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

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="email-icon">📧</div>
          <h1>EMAIL<br/>BESTÄTIGEN</h1>
          <p>Wir haben dir einen Code per E-Mail gesendet</p>
          {email && (
            <p style={{ marginTop: '0.5rem', color: 'var(--accent-green)', fontSize: '0.9rem' }}>
              → {email}
            </p>
          )}
        </div>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="code">Bestätigungscode</label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              required
              disabled={isLoading}
              maxLength={6}
              autoComplete="off"
              style={{
                textAlign: 'center',
                fontSize: '1.5rem',
                letterSpacing: '0.5rem',
                fontWeight: 'bold'
              }}
            />
            <small style={{ color: '#999', fontSize: '0.75rem', marginTop: '0.5rem', display: 'block', textAlign: 'center' }}>
              6-stelliger Code aus deiner E-Mail
            </small>
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Wird bestätigt...' : 'BESTÄTIGEN'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Keinen Code erhalten?</p>
          <a href="#" className="auth-link" onClick={(e) => {
            e.preventDefault();
            alert('Code erneut senden - Feature kommt bald!');
          }}>
            CODE ERNEUT SENDEN
          </a>
        </div>

        <div className="auth-back">
          <Link href="/login">← Zurück zum Login</Link>
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

        .email-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
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
          text-align: center;
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
          cursor: pointer;
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

// Main export with Suspense boundary
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)'
      }}>
        <div style={{ color: '#00ff87', fontSize: '1.5rem' }}>Loading...</div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}

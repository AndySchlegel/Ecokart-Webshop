'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.message ?? 'Login fehlgeschlagen.');
      }
      router.push('/dashboard');
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler beim Login.');
    }
  }

  return (
    <main className="page">
      <section className="page__content">
        <div className="card" style={{ maxWidth: '500px', margin: '6rem auto 0' }}>
          <h1>ADMIN LOGIN</h1>
          <p>
            Melde dich an, um Produkte zu verwalten
          </p>
          <div className="message message--info" style={{ fontSize: '0.875rem' }}>
            <strong>Demo-Login:</strong><br />
            admin@ecokart.com / ecokart2025
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '2rem' }}>
            <label>
              <span>E-Mail</span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                type="email"
                required
                placeholder="admin@ecokart.com"
              />
            </label>
            <label>
              <span>Passwort</span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                required
                placeholder="••••••••"
              />
            </label>
            {error && (
              <div className="message message--error">
                {error}
              </div>
            )}
            <button className="button" type="submit" disabled={isLoading}>
              {isLoading ? 'Anmeldung läuft...' : 'Anmelden'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

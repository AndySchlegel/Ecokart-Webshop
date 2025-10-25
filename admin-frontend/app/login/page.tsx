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
        <div className="card" style={{ maxWidth: '460px', margin: '6rem auto 0' }}>
          <h1>EcoKart Admin Login</h1>
          <p>Bitte mit den Demo-Zugangsdaten anmelden, um Artikel zu pflegen.</p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <span>E-Mail</span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                type="email"
                required
                style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid #d4e1d4' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <span>Passwort</span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                required
                style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid #d4e1d4' }}
              />
            </label>
            {error && (
              <div style={{ color: '#9b1c1c' }}>
                {error}
              </div>
            )}
            <button className="button" type="submit" disabled={isLoading}>
              {isLoading ? 'Bitte warten ...' : 'Anmelden'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

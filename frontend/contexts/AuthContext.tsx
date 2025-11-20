// ============================================================================
// 🔐 AUTH CONTEXT - AWS Cognito Authentication
// ============================================================================
//
// UMGESCHRIEBEN von JWT → Cognito
// Datum: 20. November 2025
// ============================================================================

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCurrentUser, signOut as amplifySignOut, fetchAuthSession } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';

// ============================================================================
// TYPES
// ============================================================================

export interface User {
  userId: string;         // Cognito User ID
  email: string;          // Email
  role: string;           // "admin" oder "customer"
  emailVerified: boolean; // Email bestätigt?
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // ----------------------------------------------------------------
  // Load User von Cognito
  // ----------------------------------------------------------------
  const loadUser = async () => {
    try {
      setIsLoading(true);

      // 1. Prüfe ob User eingeloggt ist
      await getCurrentUser();

      // 2. Hole User-Daten aus Token
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken;

      if (!idToken) {
        setUser(null);
        return;
      }

      // 3. User-Info extrahieren
      const userData: User = {
        userId: idToken.payload.sub as string,
        email: idToken.payload.email as string,
        role: (idToken.payload['custom:role'] as string) || 'customer',
        emailVerified: idToken.payload.email_verified as boolean,
      };

      setUser(userData);
      console.log('✅ User eingeloggt:', userData.email, `(${userData.role})`);

    } catch (error) {
      // Nicht eingeloggt (ist OK)
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // ----------------------------------------------------------------
  // Logout
  // ----------------------------------------------------------------
  const signOut = async () => {
    try {
      await amplifySignOut();
      setUser(null);
      router.push('/auth/login');
      console.log('✅ User ausgeloggt');
    } catch (error) {
      console.error('Logout Error:', error);
      setUser(null);
    }
  };

  // ----------------------------------------------------------------
  // Effects
  // ----------------------------------------------------------------

  // Beim Start: User laden
  useEffect(() => {
    loadUser();
  }, []);

  // Alle 30 Sekunden: User-Status prüfen
  useEffect(() => {
    const interval = setInterval(() => {
      loadUser();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // ----------------------------------------------------------------
  // Context Value
  // ----------------------------------------------------------------
  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    signOut,
    refreshUser: loadUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * useAuth - Nutze das in Komponenten
 *
 * const { user, isAuthenticated, signOut } = useAuth();
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth muss innerhalb von AuthProvider verwendet werden');
  }
  return context;
}

/**
 * useRequireAuth - Automatischer Redirect wenn nicht eingeloggt
 *
 * Nutze das in geschützten Pages:
 *   useRequireAuth();
 */
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      const currentPath = window.location.pathname;
      router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [isAuthenticated, isLoading, router]);

  return { isLoading, isAuthenticated };
}

/**
 * useRequireAdmin - Automatischer Redirect wenn nicht Admin
 *
 * Nutze das in Admin-Pages:
 *   useRequireAdmin();
 */
export function useRequireAdmin() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (user?.role !== 'admin') {
      console.warn('⚠️ Kein Admin-Zugriff');
      router.push('/');
    }
  }, [user, isAuthenticated, isLoading, router]);

  return { user, isLoading, isAdmin: user?.role === 'admin' };
}

export default AuthContext;

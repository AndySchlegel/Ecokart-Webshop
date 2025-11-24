// ============================================================================
// 🔐 AUTH CONTEXT - AWS Cognito Authentication
// ============================================================================
//
// UMGESCHRIEBEN von JWT → Cognito
// Datum: 20. November 2025
// ============================================================================

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  getCurrentUser,
  signOut as amplifySignOut,
  fetchAuthSession,
  signIn,
  signUp,
  confirmSignUp,
  autoSignIn
} from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';

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
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
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
      logger.info('User logged in', {
        email: userData.email,
        role: userData.role,
        userId: userData.userId,
        component: 'AuthContext'
      });

    } catch (error) {
      // Nicht eingeloggt (ist OK)
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // ----------------------------------------------------------------
  // Login mit Cognito
  // ----------------------------------------------------------------
  const login = async (email: string, password: string) => {
    try {
      logger.debug('Attempting login', { email, component: 'AuthContext' });

      // Cognito Sign In
      const { isSignedIn, nextStep } = await signIn({
        username: email, // Bei Cognito ist username = email
        password,
      });

      if (isSignedIn) {
        logger.info('Login successful', { email, component: 'AuthContext' });
        // User-Daten neu laden
        await loadUser();
      } else {
        logger.warn('Login incomplete', { email, nextStep, component: 'AuthContext' });
        throw new Error('Login konnte nicht abgeschlossen werden');
      }
    } catch (error: any) {
      logger.error('Login failed', {
        email,
        errorName: error.name,
        component: 'AuthContext'
      }, error);

      // Benutzerfreundliche Fehlermeldungen (auf Deutsch)
      if (error.name === 'UserNotFoundException' || error.name === 'NotAuthorizedException') {
        throw new Error('E-Mail oder Passwort falsch');
      } else if (error.name === 'UserNotConfirmedException') {
        throw new Error('Bitte bestätige zuerst deine E-Mail');
      } else {
        throw new Error(error.message || 'Login fehlgeschlagen');
      }
    }
  };

  // ----------------------------------------------------------------
  // Registrierung mit Cognito
  // ----------------------------------------------------------------
  const register = async (email: string, password: string, name: string) => {
    try {
      logger.debug('Attempting registration', { email, component: 'AuthContext' });

      // Cognito Sign Up
      const { isSignUpComplete, userId, nextStep } = await signUp({
        username: email, // Bei Cognito ist username = email
        password,
        options: {
          userAttributes: {
            email,
            name, // Optional: Name speichern
            'custom:role': 'customer', // Standard-Role = customer
          },
          autoSignIn: true, // Auto-Login nach Bestätigung
        },
      });

      logger.info('Registration successful', {
        email,
        userId,
        nextStep: nextStep.signUpStep,
        component: 'AuthContext'
      });

      // Bei Cognito mit Email-Verification:
      // User muss Email bestätigen (bekommt Code per Email)
      // Dann automatisch eingeloggt werden
      if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        logger.info('Confirmation email sent', { email, component: 'AuthContext' });
        // Redirect zur Verification-Page
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return; // Funktion beenden, kein Error werfen
      }

      if (isSignUpComplete) {
        logger.info('Sign up complete - user can login', { email, component: 'AuthContext' });
        // User-Daten neu laden
        await loadUser();
      }
    } catch (error: any) {
      logger.error('Registration failed', {
        email,
        errorName: error.name,
        component: 'AuthContext'
      }, error);

      // Benutzerfreundliche Fehlermeldungen (auf Deutsch)
      if (error.name === 'UsernameExistsException') {
        throw new Error('Diese E-Mail ist bereits registriert');
      } else if (error.name === 'InvalidPasswordException') {
        throw new Error('Passwort erfüllt nicht die Anforderungen (min. 8 Zeichen, Groß-/Kleinbuchstaben, Zahlen)');
      } else if (error.name === 'InvalidParameterException') {
        throw new Error('Ungültige Eingabe. Bitte prüfe deine Daten.');
      } else {
        throw new Error(error.message || 'Registrierung fehlgeschlagen');
      }
    }
  };

  // ----------------------------------------------------------------
  // Logout
  // ----------------------------------------------------------------
  const signOut = async () => {
    try {
      await amplifySignOut();
      setUser(null);
      router.push('/login');
      logger.info('User signed out', { component: 'AuthContext' });
    } catch (error) {
      logger.error('Sign out failed', { component: 'AuthContext' }, error as Error);
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
    login,
    register,
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
      logger.warn('Non-admin user attempted admin access', {
        userId: user?.userId,
        role: user?.role,
        component: 'AuthContext'
      });
      router.push('/');
    }
  }, [user, isAuthenticated, isLoading, router]);

  return { user, isLoading, isAdmin: user?.role === 'admin' };
}

export default AuthContext;

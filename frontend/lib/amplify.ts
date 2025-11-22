// ============================================================================
// 🔧 AWS AMPLIFY CONFIGURATION
// ============================================================================
//
// Was macht diese Datei?
// - Konfiguriert Amplify Auth für Cognito
// - Muss EINMAL am Anfang der App aufgerufen werden
// - Verbindet Frontend mit AWS Cognito User Pool
//
// Wo wird das aufgerufen?
// - In app/layout.tsx (Root Layout)
// - Vor allen anderen Komponenten
//
// Autor: Andy Schlegel
// Datum: 20. November 2025
// ============================================================================

import { Amplify } from 'aws-amplify';
import { CookieStorage } from 'aws-amplify/utils';
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';

// ============================================================================
// AMPLIFY KONFIGURATION
// ============================================================================

/**
 * Konfiguriert AWS Amplify mit Cognito Settings
 *
 * WICHTIG: Diese Funktion muss VOR der Nutzung von Auth aufgerufen werden!
 * Am besten in layout.tsx oder _app.tsx
 */
export function configureAmplify() {
  // Prüfe ob alle Environment Variables gesetzt sind
  const userPoolId = process.env.NEXT_PUBLIC_USER_POOL_ID;
  const userPoolClientId = process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID;
  const region = process.env.NEXT_PUBLIC_AWS_REGION || 'eu-north-1';

  // Wenn Cognito nicht konfiguriert → Warnung aber kein Crash
  // Das erlaubt Development ohne Cognito
  if (!userPoolId || !userPoolClientId) {
    console.warn('⚠️ Cognito nicht konfiguriert - Auth-Features werden nicht funktionieren');
    console.warn('Setze NEXT_PUBLIC_USER_POOL_ID und NEXT_PUBLIC_USER_POOL_CLIENT_ID in .env.local');
    return;
  }

  // Amplify konfigurieren
  Amplify.configure({
    Auth: {
      Cognito: {
        // ----------------------------------------------------------------
        // User Pool Configuration
        // ----------------------------------------------------------------
        // Das ist dein Cognito User Pool aus Terraform
        // Die Region ist in der User Pool ID enthalten (z.B. "eu-north-1_...")
        userPoolId,                   // z.B. "eu-north-1_AbCdEfG"
        userPoolClientId,             // z.B. "1a2b3c4d5e..."

        // ----------------------------------------------------------------
        // Login Flow
        // ----------------------------------------------------------------
        // Welche Login-Methoden sind erlaubt?
        loginWith: {
          email: true,                // Login mit Email (Standard)
          username: false,            // Kein separater Username
          phone: false,               // Kein Phone Login
        },

        // ----------------------------------------------------------------
        // Sign Up Configuration
        // ----------------------------------------------------------------
        signUpVerificationMethod: 'code',  // Email mit Code (Standard)

        // ----------------------------------------------------------------
        // User Attributes
        // ----------------------------------------------------------------
        // Welche User-Daten werden bei Sign Up abgefragt?
        userAttributes: {
          email: {
            required: true,           // Email ist Pflicht
          },
          // Später können wir mehr hinzufügen:
          // name, phone_number, etc.
        },

        // ----------------------------------------------------------------
        // Password Policy
        // ----------------------------------------------------------------
        // Muss gleich sein wie in Cognito User Pool!
        // (Das wird im Frontend validiert BEVOR Request an AWS)
        passwordFormat: {
          minLength: 8,               // Minimum 8 Zeichen
          requireLowercase: true,     // Kleinbuchstaben Pflicht
          requireUppercase: true,     // Großbuchstaben Pflicht
          requireNumbers: true,       // Zahlen Pflicht
          requireSpecialCharacters: false,  // Symbole optional
        },
      }
    }
  }, {
    // ----------------------------------------------------------------
    // SSR Configuration (Next.js specific)
    // ----------------------------------------------------------------
    // Amplify soll auch bei Server-Side Rendering funktionieren
    ssr: true
  });

  // ----------------------------------------------------------------
  // Cookie Storage Configuration (für Token Persistence)
  // ----------------------------------------------------------------
  // WICHTIG: Bei Next.js SSR müssen Tokens in Cookies gespeichert werden
  // localStorage funktioniert nicht mit SSR (Server hat kein window)
  // CookieStorage speichert Tokens persistent über Browser-Reloads
  cognitoUserPoolsTokenProvider.setKeyValueStorage(new CookieStorage());

  console.log('✅ Amplify Auth konfiguriert:', {
    userPoolId,
    region,
    environment: process.env.NODE_ENV
  });
}

// ============================================================================
// AUTO-CONFIGURATION
// ============================================================================

// Konfiguriere Amplify automatisch beim Import dieser Datei
// Das stellt sicher dass Amplify immer konfiguriert ist
configureAmplify();

// ============================================================================
// EXPORTS
// ============================================================================

// Wiederexportiere Amplify für einfachen Import in anderen Dateien
export { Amplify };

// Wiederexportiere Auth Functions für einfachen Zugriff
// Statt: import { signIn } from 'aws-amplify/auth'
// Jetzt: import { signIn } from '@/lib/amplify'
export {
  signUp,
  confirmSignUp,
  signIn,
  signOut,
  getCurrentUser,
  fetchAuthSession,
  resendSignUpCode,
  resetPassword,
  confirmResetPassword,
} from 'aws-amplify/auth';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Prüft ob User eingeloggt ist
 *
 * @returns true wenn User eingeloggt, false wenn nicht
 *
 * Nutzung:
 *   const loggedIn = await isAuthenticated();
 *   if (!loggedIn) router.push('/login');
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const { getCurrentUser } = await import('aws-amplify/auth');
    await getCurrentUser();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Holt aktuellen Auth Token (für API Calls)
 *
 * @returns JWT Token String oder null
 *
 * Nutzung:
 *   const token = await getAuthToken();
 *   fetch('/api/cart', {
 *     headers: { 'Authorization': `Bearer ${token}` }
 *   });
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const { fetchAuthSession } = await import('aws-amplify/auth');
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Holt User-Informationen
 *
 * @returns User Object oder null
 *
 * Nutzung:
 *   const user = await getUserInfo();
 *   console.log(user?.email);
 */
export async function getUserInfo() {
  try {
    const { fetchAuthSession } = await import('aws-amplify/auth');
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken;

    if (!idToken) return null;

    // Token Claims enthalten User-Info
    return {
      userId: idToken.payload.sub as string,
      email: idToken.payload.email as string,
      role: idToken.payload['custom:role'] as string || 'customer',
      emailVerified: idToken.payload.email_verified as boolean,
    };
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
}

/**
 * DEBUG HELPER: Zeigt alle Token-Informationen an
 *
 * Verwendung in Browser Console:
 *   import { debugTokenStorage } from '@/lib/amplify'
 *   await debugTokenStorage()
 *
 * ODER direkt in der Console (wenn verfügbar):
 *   window.__debugTokens()
 */
export async function debugTokenStorage() {
  console.log('🔍 === TOKEN STORAGE DEBUG ===');
  console.log('');

  // 1. Prüfe Cookies
  console.log('📦 Browser Cookies:');
  const cookies = document.cookie;
  if (cookies) {
    // Filtere nur Cognito/Amplify relevante Cookies
    const cognitoCookies = cookies.split('; ').filter(c =>
      c.includes('CognitoIdentityServiceProvider') ||
      c.includes('amplify') ||
      c.includes('idToken') ||
      c.includes('accessToken') ||
      c.includes('refreshToken')
    );
    if (cognitoCookies.length > 0) {
      console.log('✅ Cognito Cookies gefunden:');
      cognitoCookies.forEach(cookie => {
        const [name] = cookie.split('=');
        console.log(`  - ${name}`);
      });
    } else {
      console.log('⚠️  KEINE Cognito Cookies gefunden!');
      console.log('Alle Cookies:', cookies);
    }
  } else {
    console.log('❌ KEINE Cookies vorhanden!');
  }
  console.log('');

  // 2. Prüfe localStorage (sollte leer sein bei CookieStorage!)
  console.log('💾 localStorage:');
  console.log(`  Anzahl Items: ${localStorage.length}`);
  if (localStorage.length > 0) {
    console.log('⚠️  localStorage ist NICHT leer (das ist OK wenn du nicht CookieStorage nutzt)');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) console.log(`  - ${key}`);
    }
  } else {
    console.log('✅ localStorage ist leer (ERWARTET bei CookieStorage)');
  }
  console.log('');

  // 3. Prüfe Amplify Session
  console.log('🔐 Amplify Auth Session:');
  try {
    const { fetchAuthSession } = await import('aws-amplify/auth');
    const session = await fetchAuthSession();

    console.log('Session Object:', session);
    console.log('');

    if (session.tokens?.idToken) {
      console.log('✅ ID Token gefunden!');
      console.log('Token Preview:', session.tokens.idToken.toString().substring(0, 50) + '...');
      console.log('Token Payload:', session.tokens.idToken.payload);
    } else {
      console.log('❌ KEIN ID Token in Session!');
    }

    if (session.tokens?.accessToken) {
      console.log('✅ Access Token gefunden!');
    } else {
      console.log('❌ KEIN Access Token in Session!');
    }
  } catch (error) {
    console.log('❌ Fehler beim Abrufen der Session:', error);
  }
  console.log('');

  // 4. Prüfe aktuellen User
  console.log('👤 Aktueller User:');
  try {
    const { getCurrentUser } = await import('aws-amplify/auth');
    const user = await getCurrentUser();
    console.log('✅ User eingeloggt:', user);
  } catch (error) {
    console.log('❌ Kein User eingeloggt:', error);
  }
  console.log('');
  console.log('🔍 === DEBUG ENDE ===');
}

// Mache Debug-Funktion global verfügbar (nur im Browser)
if (typeof window !== 'undefined') {
  (window as any).__debugTokens = debugTokenStorage;
}

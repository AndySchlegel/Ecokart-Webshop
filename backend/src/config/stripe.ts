// ============================================================================
// 💳 STRIPE CONFIGURATION
// ============================================================================
// Initialisiert den Stripe Client für Payment Processing.
//
// 📌 WICHTIGE KONZEPTE:
//
// 1️⃣ Stripe = Payment-Provider für Online-Zahlungen
//    - Akzeptiert Kreditkarten, Debitkarten, etc.
//    - Hosted Checkout = Stripe hostet die Payment-Seite (sehr sicher!)
//    - PCI-Compliant = Wir müssen keine Kreditkarten-Daten speichern
//
// 2️⃣ Test Mode vs. Live Mode
//    - Test Mode: sk_test_... (keine echten Zahlungen)
//    - Live Mode: sk_live_... (echte Zahlungen)
//    - Wir nutzen IMMER Test Mode für dieses Projekt!
//
// 3️⃣ Checkout Session
//    - Temporäre Zahlungs-Session mit Warenkorb-Daten
//    - Leitet User zu Stripe-Hosted Checkout Page
//    - Nach Zahlung: Redirect zurück zu unserer App (Success/Cancel)
//
// 4️⃣ Webhooks
//    - Stripe sendet Events an unseren Server
//    - payment_intent.succeeded = Zahlung erfolgreich!
//    - Wir erstellen dann die Order in DynamoDB
// ============================================================================

import Stripe from 'stripe';

// ============================================================================
// 🔐 STRIPE CLIENT INITIALISIERUNG
// ============================================================================

// Prüfe ob Secret Key gesetzt ist
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error(
    '⚠️  STRIPE_SECRET_KEY is not set in environment variables!\n' +
    'Add STRIPE_SECRET_KEY=sk_test_... to your .env file.'
  );
}

// Erstelle Stripe Client
// 💡 API Version "2025-11-17.clover" ist die neueste stabile Version
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-11-17.clover',
  typescript: true, // TypeScript Support aktivieren
});

// ============================================================================
// 📋 STRIPE CONFIGURATION
// ============================================================================

// Publishable Key (wird im Frontend benötigt)
export const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || '';

// Webhook Secret (wird für Webhook-Signature-Verification benötigt)
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// Frontend URL für Success/Cancel Redirects
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ============================================================================
// 💡 VERWENDUNG
// ============================================================================
//
// In anderen Dateien:
//   import { stripe, FRONTEND_URL } from './config/stripe';
//
//   // Checkout Session erstellen
//   const session = await stripe.checkout.sessions.create({
//     line_items: [...],
//     mode: 'payment',
//     success_url: `${FRONTEND_URL}/checkout/success`,
//     cancel_url: `${FRONTEND_URL}/checkout/cancel`,
//   });
// ============================================================================

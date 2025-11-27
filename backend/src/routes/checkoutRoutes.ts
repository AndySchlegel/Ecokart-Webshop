// ============================================================================
// 💳 CHECKOUT ROUTES - Stripe Payment Endpoints
// ============================================================================
// Definiert alle Routen für Stripe Checkout Integration.
//
// 📌 ENDPOINTS:
//
// POST   /api/checkout
//   - Erstellt Stripe Checkout Session
//   - Auth: Required (JWT Token)
//   - Body: (leer - Cart wird aus DB geholt)
//   - Response: { url: "https://checkout.stripe.com/..." }
//
// GET    /api/checkout/session/:sessionId
//   - Holt Checkout Session Details (für Success Page)
//   - Auth: Required (JWT Token)
//   - Response: { id, amount_total, payment_status, ... }
//
// ============================================================================

import { Router } from 'express';
import { createCheckoutSession, getCheckoutSession } from '../controllers/checkoutController';
import { requireAuth } from '../middleware/cognitoJwtAuth';

const router = Router();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MIDDLEWARE: Alle Checkout Routes erfordern Authentication
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💡 User muss eingeloggt sein um zur Kasse zu gehen
// requireAuth Middleware prüft Cognito JWT Token
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.use(requireAuth);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/checkout
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Erstellt Stripe Checkout Session aus User's Cart.
//
// 💡 ABLAUF:
// 1. User klickt "Zur Kasse" im Frontend
// 2. Frontend ruft POST /api/checkout auf
// 3. Backend erstellt Stripe Session
// 4. Frontend leitet zu session.url weiter (Stripe Checkout Page)
// 5. User zahlt auf Stripe-Seite
// 6. Nach Erfolg: Redirect zu Success Page
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.post('/', createCheckoutSession);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/checkout/session/:sessionId
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Holt Details einer abgeschlossenen Checkout Session.
//
// 💡 VERWENDUNG:
// - Auf Success Page nach erfolgreicher Zahlung
// - Zeigt Bestellbestätigung mit Betrag, Email, etc.
// - Kann auch Order ID anzeigen (nachdem Webhook Order erstellt hat)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.get('/session/:sessionId', getCheckoutSession);

export default router;

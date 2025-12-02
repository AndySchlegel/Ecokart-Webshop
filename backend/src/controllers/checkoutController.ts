// ============================================================================
// 💳 CHECKOUT CONTROLLER - Stripe Payment Integration
// ============================================================================
// Dieser Controller verarbeitet Stripe Checkout Sessions.
//
// 📌 ABLAUF (User Flow):
//
// 1️⃣ User klickt auf "Zur Kasse" im Frontend
//    ↓
// 2️⃣ Frontend ruft POST /api/checkout auf
//    ↓
// 3️⃣ Backend erstellt Stripe Checkout Session
//    - Holt Cart vom User
//    - Erstellt Line Items für Stripe
//    - Generiert Session URL
//    ↓
// 4️⃣ Frontend leitet User zu Stripe Checkout Page
//    ↓
// 5️⃣ User gibt Zahlungsdaten ein (auf Stripe-Seite!)
//    ↓
// 6️⃣ Nach erfolgreicher Zahlung:
//    - Stripe sendet Webhook an /api/webhooks/stripe
//    - Webhook Handler erstellt Order
//    - User wird zu Success-Page weitergeleitet
//
// 💡 Warum Stripe Hosted Checkout?
// - PCI-Compliant (wir speichern KEINE Kreditkarten-Daten!)
// - Sicher & professionell
// - Unterstützt alle Zahlungsmethoden
// - Schnelle Integration
// ============================================================================

import { Request, Response } from 'express';
import { stripe, FRONTEND_URL } from '../config/stripe';
import database from '../config/database-adapter';
import { logger } from '../utils/logger';

// ============================================================================
// 🔐 TYPE DEFINITIONS
// ============================================================================

// 💡 Request ist bereits global erweitert mit AuthUser (siehe cognitoJwtAuth.ts)
// Wir können direkt req.user nutzen mit Typ: { userId, email, role, emailVerified }

// ============================================================================
// 🌐 FRONTEND URL RESOLVER (Origin Header)
// ============================================================================
// Holt die Frontend URL direkt aus dem Origin Header des Requests.
//
// 💡 WARUM Origin Header?
// - ✅ 100% reproduzierbar - keine AWS Dependencies
// - ✅ Keine Circular Dependency in Terraform (Lambda ↔ Amplify)
// - ✅ Browser sendet Origin automatisch mit CORS Requests
// - ✅ Immer die korrekte URL (egal ob localhost, Amplify, Custom Domain)
// - ✅ Keine IAM Permissions nötig (kein SSM)
// - ✅ Keine Environment Variables nötig
//
// 🔄 Fallback-Strategie:
// 1. req.headers.origin (Browser sendet automatisch)
// 2. req.headers.referer (falls Origin fehlt)
// 3. FRONTEND_URL env var (Terraform Fallback)
// 4. localhost:3000 (Development Fallback)
// ============================================================================

/**
 * Holt die Frontend URL für Stripe Redirects aus Request Headers.
 * - Priorität 1: Origin Header (CORS-safe, von Browser gesendet)
 * - Priorität 2: Referer Header (falls Origin fehlt)
 * - Priorität 3: FRONTEND_URL env var
 * - Priorität 4: localhost:3000
 */
function getFrontendUrl(req: Request): string {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FALL 1: Origin Header (Best Option - CORS-safe)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const origin = req.headers.origin;
  if (origin) {
    logger.info('Frontend URL: Using Origin header', { url: origin });
    return origin;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FALL 2: Referer Header (Fallback wenn Origin fehlt)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const referer = req.headers.referer;
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
      logger.info('Frontend URL: Using Referer header', { url: refererOrigin });
      return refererOrigin;
    } catch (error) {
      logger.warn('Failed to parse Referer header', { referer });
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FALL 3: FRONTEND_URL Environment Variable
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (FRONTEND_URL) {
    logger.warn('Frontend URL: Using env var fallback (Origin/Referer missing)', { url: FRONTEND_URL });
    return FRONTEND_URL;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FALL 4: Localhost Fallback
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  logger.error('Frontend URL: All methods failed, using localhost fallback');
  return 'http://localhost:3000';
}

// ============================================================================
// 📝 CREATE CHECKOUT SESSION
// ============================================================================
// Erstellt eine Stripe Checkout Session aus dem User's Cart.
//
// ➡️ Request: POST /api/checkout
// ➡️ Auth: Required (JWT Token)
// ➡️ Body: {
//     shippingAddress: {
//       street: string,
//       city: string,
//       zipCode: string,
//       country: string
//     }
//   }
//
// ⬅️ Response:
// {
//   "url": "https://checkout.stripe.com/c/pay/cs_..."
// }
// ============================================================================

interface ShippingAddress {
  street: string;
  city: string;
  zipCode: string;
  country: string;
}

export const createCheckoutSession = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SCHRITT 1: User Authentication prüfen
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (!req.user?.userId) {
      logger.warn('Checkout attempted without authentication');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.userId;

    // 🔍 DEBUG: Log ALL headers to see what Lambda receives
    logger.info('🔍 CHECKOUT REQUEST DEBUG', {
      userId,
      allHeaders: req.headers,
      origin: req.headers.origin,
      host: req.headers.host,
      referer: req.headers.referer,
      'x-forwarded-proto': req.headers['x-forwarded-proto'],
      'x-forwarded-host': req.headers['x-forwarded-host'],
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SCHRITT 1.5: Shipping Address validieren
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const { shippingAddress } = req.body as {
      shippingAddress?: ShippingAddress;
    };

    if (!shippingAddress) {
      logger.warn('Checkout attempted without shipping address', { userId });
      return res.status(400).json({ error: 'Shipping address is required' });
    }

    // Validiere alle Pflichtfelder
    const requiredFields: (keyof ShippingAddress)[] = ['street', 'city', 'zipCode', 'country'];
    const missingFields = requiredFields.filter(field => !shippingAddress[field]);

    if (missingFields.length > 0) {
      logger.warn('Checkout attempted with incomplete address', { userId, missingFields });
      return res.status(400).json({
        error: 'Incomplete shipping address',
        missingFields
      });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SCHRITT 2: Cart vom User holen
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const cart = await database.getCartByUserId(userId);

    if (!cart) {
      logger.warn('Checkout attempted with no cart', { userId });
      return res.status(404).json({ error: 'Cart not found' });
    }

    // Prüfe ob Cart leer ist
    if (!cart.items || cart.items.length === 0) {
      logger.warn('Checkout attempted with empty cart', { userId });
      return res.status(400).json({ error: 'Cart is empty' });
    }

    logger.info('Creating checkout session', {
      userId,
      cartId: cart.id,
      itemCount: cart.items.length,
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SCHRITT 3: Line Items für Stripe erstellen
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Wandle Cart Items in Stripe Line Items um
    //
    // 💡 Line Item = Ein Produkt in der Checkout Session
    // Struktur:
    // {
    //   price_data: {
    //     currency: 'eur',
    //     product_data: { name: 'Nike Air', images: [...] },
    //     unit_amount: 9999 (in Cents! 99.99€ = 9999 Cents)
    //   },
    //   quantity: 2
    // }
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const lineItems = cart.items.map((item) => {
      return {
        price_data: {
          currency: 'eur', // Euro
          product_data: {
            name: item.name,
            // Images entfernt - verursacht "Not a valid URL" Fehler bei relativen Pfaden
            // Stripe Checkout funktioniert perfekt ohne Bilder
          },
          unit_amount: Math.round(item.price * 100), // €99.99 → 9999 Cents
        },
        quantity: item.quantity,
      };
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SCHRITT 3.5: Frontend URL ermitteln (für Stripe Redirects)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ✅ FINAL SOLUTION: Origin Header (100% reproduzierbar, keine Circular Dependency!)
    // - Nutzt req.headers.origin (Browser sendet automatisch)
    // - Fallback zu Referer Header oder FRONTEND_URL env var
    // - Keine AWS Dependencies, keine IAM Permissions nötig
    // - Bricht Terraform Circular Dependency zwischen Lambda ↔ Amplify
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const frontendUrl = getFrontendUrl(req);
    const normalizedRedirectUrl = frontendUrl.replace(/\/+$/, '');

    logger.info('Checkout redirect URL resolved', {
      userId,
      resolvedUrl: normalizedRedirectUrl,
      environment: process.env.ENVIRONMENT || 'development',
      nodeEnv: process.env.NODE_ENV,
    });

    const session = await stripe.checkout.sessions.create({
      // Line Items (Produkte)
      line_items: lineItems,

      // Payment Mode (einmalige Zahlung, keine Subscription)
      mode: 'payment',

      // Success URL (nach erfolgreicher Zahlung)
      // 💡 {CHECKOUT_SESSION_ID} wird von Stripe automatisch ersetzt
      success_url: `${normalizedRedirectUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,

      // Cancel URL (wenn User abbricht)
      cancel_url: `${normalizedRedirectUrl}/checkout/cancel`,

      // Metadata (für Webhook Handler)
      // 💡 Diese Daten bekommt der Webhook nach erfolgreicher Zahlung
      metadata: {
        userId,
        cartId: cart.id,
        // Shipping Address als JSON String (Stripe Metadata kann nur Strings)
        shippingAddress: JSON.stringify(shippingAddress),
      },

      // Customer Email (falls vorhanden)
      ...(req.user.email && { customer_email: req.user.email }),
    });

    logger.info('Checkout session created', {
      sessionId: session.id,
      userId,
      cartId: cart.id,
      amount: session.amount_total, // Gesamtbetrag in Cents
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SCHRITT 5: Session URL zurückgeben
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Frontend leitet User zu dieser URL weiter (Stripe Checkout Page)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    return res.json({
      url: session.url, // z.B. https://checkout.stripe.com/c/pay/cs_...
    });
  } catch (error) {
    logger.error('Error creating checkout session', { userId: req.user?.userId }, error instanceof Error ? error : undefined);

    // Prüfe auf spezifische Stripe Errors
    if (error instanceof Error) {
      return res.status(500).json({
        error: 'Failed to create checkout session',
        message: error.message,
      });
    }

    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
};

// ============================================================================
// ✅ GET CHECKOUT SESSION (Optional - für Success Page)
// ============================================================================
// Holt Details einer Checkout Session nach erfolgreicher Zahlung.
//
// ➡️ Request: GET /api/checkout/session/:sessionId
// ➡️ Auth: Required (JWT Token)
//
// ⬅️ Response:
// {
//   "id": "cs_...",
//   "amount_total": 9999,
//   "customer_email": "user@example.com",
//   "payment_status": "paid"
// }
// ============================================================================

export const getCheckoutSession = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    // User Authentication prüfen
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    // Session von Stripe holen
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Prüfe ob Session zum User gehört
    if ((session.metadata?.userId as string) !== req.user.userId) {
      logger.warn('User attempted to access another user\'s session', {
        userId: req.user.userId,
        sessionUserId: session.metadata?.userId as string,
      });
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Gib relevante Session-Daten zurück
    return res.json({
      id: session.id,
      amount_total: session.amount_total,
      currency: session.currency,
      customer_email: session.customer_email,
      payment_status: session.payment_status,
      status: session.status,
    });
  } catch (error) {
    logger.error('Error fetching checkout session', { userId: req.user?.userId }, error instanceof Error ? error : undefined);

    return res.status(500).json({ error: 'Failed to fetch checkout session' });
  }
};

// ============================================================================
// 💡 NÄCHSTE SCHRITTE
// ============================================================================
//
// 1️⃣ Webhook Handler implementieren (webhookController.ts)
//    - Verarbeitet payment_intent.succeeded Event
//    - Erstellt Order in DynamoDB
//    - Leert Cart
//    - Zieht Stock ab
//
// 2️⃣ Frontend Integration
//    - "Zur Kasse" Button
//    - Redirect zu session.url
//    - Success/Cancel Pages
//
// 3️⃣ Testing mit Stripe Test Cards
//    - 4242 4242 4242 4242 (Success)
//    - 4000 0000 0000 0002 (Decline)
// ============================================================================

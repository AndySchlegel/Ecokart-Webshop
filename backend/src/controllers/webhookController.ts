// ============================================================================
// 🪝 WEBHOOK CONTROLLER - Stripe Webhook Handler
// ============================================================================
// Dieser Controller verarbeitet Stripe Webhook Events.
//
// 📌 WICHTIG: Webhook Signatur-Verifizierung!
// - Stripe signiert jeden Webhook mit einem Secret
// - Wir müssen die Signatur prüfen um sicherzustellen dass der Request von Stripe kommt
// - Ohne Verifizierung könnte jemand gefälschte Webhooks senden!
//
// 🔐 Webhook Secret:
// - Für lokales Testing: `stripe listen --forward-to localhost:4000/api/webhooks/stripe`
//   gibt uns einen Secret (whsec_...)
// - Für Production: Im Stripe Dashboard unter "Webhooks" → Endpoint erstellen
//
// 🎯 Event Flow:
// 1️⃣ User bezahlt bei Stripe
// 2️⃣ Stripe sendet `checkout.session.completed` Event
// 3️⃣ Wir verifizieren die Signatur
// 4️⃣ Wir holen Session Details
// 5️⃣ Wir erstellen Order aus Cart + Session Data
// 6️⃣ Wir leeren den Cart
// ============================================================================

import { Request, Response } from 'express';
import Stripe from 'stripe';
import { stripe } from '../config/stripe';
import database from '../config/database-adapter';
import { logger } from '../utils/logger';

// Webhook Secret (aus Stripe CLI oder Dashboard)
// Für lokales Development: Set via Environment Variable
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// ============================================================================
// 🪝 HANDLE STRIPE WEBHOOK
// ============================================================================
// Verarbeitet Stripe Webhook Events.
//
// ➡️ Request: POST /api/webhooks/stripe
// ➡️ Auth: NONE (aber Signature Verification!)
// ➡️ Body: Raw body (für Signature Verification)
// ➡️ Headers: stripe-signature
//
// ⬅️ Response:
// {
//   "received": true
// }
// ============================================================================

export const handleStripeWebhook = async (
  req: Request,
  res: Response
): Promise<any> => {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SCHRITT 1: Signature Verification
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Prüfe ob Request wirklich von Stripe kommt!
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const signature = req.headers['stripe-signature'];

  if (!signature) {
    logger.warn('Webhook rejected: No stripe-signature header');
    return res.status(400).json({ error: 'No stripe-signature header' });
  }

  if (!WEBHOOK_SECRET) {
    logger.error('STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event: Stripe.Event;

  try {
    // Verifiziere Stripe Signatur
    // req.body MUSS raw body sein (Buffer), nicht JSON!
    event = stripe.webhooks.constructEvent(
      req.body,
      signature as string,
      WEBHOOK_SECRET
    );

    logger.info('Webhook signature verified', {
      eventId: event.id,
      eventType: event.type,
    });
  } catch (err: any) {
    logger.error('Webhook signature verification failed', {}, err);
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SCHRITT 2: Event Handling
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Verarbeite verschiedene Event Types
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      // Weitere Events können hier hinzugefügt werden
      // case 'payment_intent.succeeded':
      // case 'payment_intent.payment_failed':
      // etc.

      default:
        logger.info('Unhandled webhook event type', { eventType: event.type });
    }

    // Immer 200 zurückgeben, auch wenn wir das Event nicht verarbeiten
    // Sonst versucht Stripe es erneut zu senden
    return res.json({ received: true });
  } catch (err: any) {
    logger.error('Error processing webhook event', { eventType: event.type }, err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// ============================================================================
// 🛒 HANDLE CHECKOUT SESSION COMPLETED
// ============================================================================
// Verarbeitet das "checkout.session.completed" Event.
// Wird aufgerufen wenn User die Zahlung erfolgreich abgeschlossen hat.
//
// Was passiert hier:
// 1️⃣ Session Details holen (inkl. userId, cartId aus Metadata)
// 2️⃣ Cart vom User holen
// 3️⃣ Order erstellen aus Cart + Session Data
// 4️⃣ Cart leeren
// ============================================================================

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  logger.info('Processing checkout.session.completed', {
    sessionId: session.id,
    amount: session.amount_total,
    paymentStatus: session.payment_status,
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SCHRITT 1: Metadata extrahieren
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const { userId, cartId, shippingAddress: shippingAddressJson } = session.metadata || {};

  if (!userId || !cartId) {
    logger.error('Missing metadata in checkout session', {
      sessionId: session.id,
      metadata: session.metadata,
    });
    throw new Error('Missing userId or cartId in session metadata');
  }

  // Parse shipping address (war als JSON String gespeichert)
  let shippingAddress;
  try {
    shippingAddress = shippingAddressJson ? JSON.parse(shippingAddressJson) : null;
  } catch (err) {
    logger.error('Failed to parse shipping address', { shippingAddressJson });
    throw new Error('Invalid shipping address in metadata');
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SCHRITT 2: Cart holen
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const cart = await database.getCartByUserId(userId);

  if (!cart) {
    logger.error('Cart not found for user', { userId, cartId, sessionId: session.id });
    throw new Error('Cart not found');
  }

  if (cart.items.length === 0) {
    logger.warn('Cart is empty, skipping order creation', { userId, cartId });
    return;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SCHRITT 3: Order erstellen
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // Generate Order ID and timestamps
  const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  const order = await database.createOrder({
    id: orderId,
    userId,
    items: cart.items,
    total: (session.amount_total || 0) / 100, // Cents → Euros
    status: 'pending',
    shippingAddress: shippingAddress || {
      name: '',
      street: '',
      city: '',
      postalCode: '',
      country: '',
    },
    createdAt: now,
    updatedAt: now,
  });

  logger.info('Order created from webhook', {
    orderId: order.id,
    userId,
    amount: order.total,
    itemCount: order.items.length,
    sessionId: session.id,
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SCHRITT 4: Cart leeren
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  await database.updateCart(cart.id, { items: [] });

  logger.info('Cart cleared after order creation', { userId, orderId: order.id });

  // Optional: Hier könnten weitere Aktionen stattfinden:
  // - Stock abziehen
  // - Bestätigungs-Email senden
  // - Notification an Admin
  // etc.
}

// ============================================================================
// 💡 NÄCHSTE SCHRITTE
// ============================================================================
//
// 1️⃣ Route registrieren in index.ts:
//    app.post('/api/webhooks/stripe',
//      express.raw({ type: 'application/json' }),
//      webhookController.handleStripeWebhook
//    );
//
//    ⚠️ WICHTIG: express.raw() für Signature Verification!
//
// 2️⃣ Webhook Secret als Environment Variable setzen:
//    STRIPE_WEBHOOK_SECRET=whsec_...
//
// 3️⃣ Testen mit Stripe CLI:
//    stripe listen --forward-to localhost:4000/api/webhooks/stripe
//    stripe trigger checkout.session.completed
//
// 4️⃣ Für Production:
//    - Webhook Endpoint im Stripe Dashboard registrieren
//    - Production Webhook Secret verwenden
//    - HTTPS Endpoint (HTTP wird von Stripe nicht akzeptiert)
// ============================================================================

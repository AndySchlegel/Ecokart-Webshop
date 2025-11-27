"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCheckoutSession = exports.createCheckoutSession = void 0;
const stripe_1 = require("../config/stripe");
const database_adapter_1 = __importDefault(require("../config/database-adapter"));
const logger_1 = require("../utils/logger");
// ============================================================================
// 🔐 TYPE DEFINITIONS
// ============================================================================
// 💡 Request ist bereits global erweitert mit AuthUser (siehe cognitoJwtAuth.ts)
// Wir können direkt req.user nutzen mit Typ: { userId, email, role, emailVerified }
// ============================================================================
// 📝 CREATE CHECKOUT SESSION
// ============================================================================
// Erstellt eine Stripe Checkout Session aus dem User's Cart.
//
// ➡️ Request: POST /api/checkout
// ➡️ Auth: Required (JWT Token)
// ➡️ Body: (leer - Cart wird aus DB geholt)
//
// ⬅️ Response:
// {
//   "url": "https://checkout.stripe.com/c/pay/cs_..."
// }
// ============================================================================
const createCheckoutSession = async (req, res) => {
    try {
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // SCHRITT 1: User Authentication prüfen
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        if (!req.user?.userId) {
            logger_1.logger.warn('Checkout attempted without authentication');
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const userId = req.user.userId;
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // SCHRITT 2: Cart vom User holen
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const cart = await database_adapter_1.default.getCartByUserId(userId);
        if (!cart) {
            logger_1.logger.warn('Checkout attempted with no cart', { userId });
            return res.status(404).json({ error: 'Cart not found' });
        }
        // Prüfe ob Cart leer ist
        if (!cart.items || cart.items.length === 0) {
            logger_1.logger.warn('Checkout attempted with empty cart', { userId });
            return res.status(400).json({ error: 'Cart is empty' });
        }
        logger_1.logger.info('Creating checkout session', {
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
        const lineItems = cart.items.map((item) => ({
            price_data: {
                currency: 'eur', // Euro
                product_data: {
                    name: item.name,
                    images: item.imageUrl ? [item.imageUrl] : [], // Produkt-Bild
                },
                unit_amount: Math.round(item.price * 100), // €99.99 → 9999 Cents
            },
            quantity: item.quantity,
        }));
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // SCHRITT 4: Stripe Checkout Session erstellen
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // Erstelle temporäre Checkout Session bei Stripe.
        //
        // 💡 Session = Temporärer Zahlungs-Link (läuft nach 24h ab)
        // User wird zu Stripe Hosted Checkout Page weitergeleitet.
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const session = await stripe_1.stripe.checkout.sessions.create({
            // Line Items (Produkte)
            line_items: lineItems,
            // Payment Mode (einmalige Zahlung, keine Subscription)
            mode: 'payment',
            // Success URL (nach erfolgreicher Zahlung)
            // 💡 {CHECKOUT_SESSION_ID} wird von Stripe automatisch ersetzt
            success_url: `${stripe_1.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            // Cancel URL (wenn User abbricht)
            cancel_url: `${stripe_1.FRONTEND_URL}/checkout/cancel`,
            // Metadata (für Webhook Handler)
            // 💡 Diese Daten bekommt der Webhook nach erfolgreicher Zahlung
            metadata: {
                userId,
                cartId: cart.id,
            },
            // Customer Email (falls vorhanden)
            ...(req.user.email && { customer_email: req.user.email }),
        });
        logger_1.logger.info('Checkout session created', {
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
    }
    catch (error) {
        logger_1.logger.error('Error creating checkout session', { userId: req.user?.userId }, error instanceof Error ? error : undefined);
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
exports.createCheckoutSession = createCheckoutSession;
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
const getCheckoutSession = async (req, res) => {
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
        const session = await stripe_1.stripe.checkout.sessions.retrieve(sessionId);
        // Prüfe ob Session zum User gehört
        if (session.metadata?.userId !== req.user.userId) {
            logger_1.logger.warn('User attempted to access another user\'s session', {
                userId: req.user.userId,
                sessionUserId: session.metadata?.userId,
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
    }
    catch (error) {
        logger_1.logger.error('Error fetching checkout session', { userId: req.user?.userId }, error instanceof Error ? error : undefined);
        return res.status(500).json({ error: 'Failed to fetch checkout session' });
    }
};
exports.getCheckoutSession = getCheckoutSession;
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

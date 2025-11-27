"use strict";
// ============================================================================
// 🛒 WARENKORB CONTROLLER - Business-Logik für Cart-Operationen
// ============================================================================
// Diese Datei enthält alle Warenkorb-Funktionen (hinzufügen, ändern, löschen).
//
// 📌 WICHTIGE KONZEPTE FÜR DAS VERSTÄNDNIS:
//
// 1️⃣ COGNITO AUTHENTIFIZIERUNG (req.user)
//    - Wir nutzen AWS Cognito für User-Authentifizierung (NICHT Custom JWT!)
//    - Die Middleware `cognitoJwtAuth.ts` validiert das JWT-Token
//    - Nach erfolgreicher Validierung setzt die Middleware: req.user = { userId, email, role, ... }
//    - Deshalb nutzen wir überall: `req.user?.userId` (nicht `req.userId`!)
//    - Das `?` ist wichtig: Optional Chaining verhindert Fehler wenn req.user undefined ist
//
// 2️⃣ STOCK MANAGEMENT (reserved vs stock)
//    - product.stock = Gesamtanzahl verfügbarer Einheiten (z.B. 100 Stück)
//    - product.reserved = Anzahl Einheiten die in Warenkörben liegen (z.B. 15 Stück)
//    - Verfügbar zum Kaufen = stock - reserved (z.B. 100 - 15 = 85 Stück)
//    - WARUM? Verhindert Overselling (mehrere User legen gleiches Produkt in Warenkorb)
//    - Ablauf:
//      a) User legt Produkt in Warenkorb → reserved +1
//      b) User entfernt Produkt → reserved -1
//      c) User kauft Produkt → stock -1, reserved -1
//
// 3️⃣ HTTP ERROR CODES
//    - 200 OK: Request erfolgreich
//    - 400 Bad Request: Ungültige Eingabe (z.B. quantity < 1, nicht genug Stock)
//    - 401 Unauthorized: Kein gültiges Token / User nicht eingeloggt
//    - 404 Not Found: Resource existiert nicht (Produkt/Cart nicht gefunden)
//    - 500 Internal Server Error: Unerwarteter Fehler (z.B. DynamoDB down)
//
// ============================================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCart = exports.removeFromCart = exports.updateCartItem = exports.addToCart = exports.getCart = void 0;
const uuid_1 = require("uuid");
const database_adapter_1 = __importDefault(require("../config/database-adapter"));
const logger_1 = require("../utils/logger");
// ============================================================================
// 📋 FUNKTION 1: Warenkorb abrufen
// ============================================================================
/**
 * GET /api/cart - Warenkorb des aktuellen Users abrufen
 *
 * - Wenn Cart nicht existiert → Erstelle neuen leeren Cart
 * - Gibt alle Items im Cart zurück (mit Produkt-Details)
 */
const getCart = async (req, res) => {
    try {
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // SCHRITT 1: User-Authentifizierung prüfen
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // ⚠️ WICHTIG: req.user wird von cognitoJwtAuth Middleware gesetzt!
        // Optional Chaining (?.) verhindert Fehler falls req.user undefined ist
        const userId = req.user?.userId;
        // Wenn kein User eingeloggt → 401 Unauthorized
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // SCHRITT 2: Cart aus DynamoDB laden (oder erstellen wenn nicht vorhanden)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        let cart = await database_adapter_1.default.getCartByUserId(userId);
        // Falls User noch keinen Cart hat → Erstelle neuen leeren Cart
        if (!cart) {
            cart = {
                id: (0, uuid_1.v4)(),
                userId,
                items: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            await database_adapter_1.default.createCart(cart);
        }
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // SCHRITT 3: Response senden
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        res.json(cart);
    }
    catch (error) {
        logger_1.logger.error('Failed to get cart', { action: 'getCart', userId: req.user?.userId }, error);
        res.status(500).json({ error: 'Failed to get cart' });
    }
};
exports.getCart = getCart;
// ============================================================================
// 📋 FUNKTION 2: Produkt zum Warenkorb hinzufügen
// ============================================================================
/**
 * POST /api/cart - Produkt zum Warenkorb hinzufügen
 *
 * - Prüft Stock-Verfügbarkeit BEVOR Produkt hinzugefügt wird
 * - Reserviert Stock in DynamoDB (verhindert Overselling)
 * - Wenn Produkt bereits im Cart → Erhöhe Quantity
 */
const addToCart = async (req, res) => {
    try {
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // SCHRITT 1: User-Authentifizierung prüfen
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // SCHRITT 2: Request-Daten validieren
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const { productId, quantity } = req.body;
        if (!productId || !quantity || quantity < 1) {
            res.status(400).json({ error: 'Product ID and valid quantity are required' });
            return;
        }
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // SCHRITT 3: Produkt-Details aus DynamoDB laden
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const product = await database_adapter_1.default.getProductById(productId);
        if (!product) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // SCHRITT 4: STOCK VERFÜGBARKEIT PRÜFEN (wichtig!)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        if (product.stock !== undefined) {
            // Berechne verfügbaren Stock: Gesamt-Stock MINUS reservierter Stock
            // Beispiel: stock=100, reserved=15 → availableStock=85
            // ⚠️ WICHTIG: reserved sind Produkte die BEREITS in Warenkörben liegen!
            const availableStock = product.stock - (product.reserved || 0);
            // Fall 1: Produkt ist ausverkauft
            if (availableStock <= 0) {
                res.status(400).json({
                    error: 'Product is out of stock',
                    availableStock: 0
                });
                return;
            }
            // Fall 2: User will mehr kaufen als verfügbar ist
            if (quantity > availableStock) {
                res.status(400).json({
                    error: `Only ${availableStock} units available`,
                    availableStock
                });
                return;
            }
        }
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // SCHRITT 5: Cart laden oder erstellen
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        let cart = await database_adapter_1.default.getCartByUserId(userId);
        if (!cart) {
            cart = {
                id: (0, uuid_1.v4)(),
                userId,
                items: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            cart = await database_adapter_1.default.createCart(cart);
        }
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // SCHRITT 6: Produkt zum Cart hinzufügen (oder Quantity erhöhen)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // Prüfe ob Produkt bereits im Cart ist
        const existingItemIndex = cart.items.findIndex(item => item.productId === productId);
        if (existingItemIndex >= 0) {
            // Produkt bereits im Cart → Erhöhe Quantity
            cart.items[existingItemIndex].quantity += quantity;
        }
        else {
            // Neues Produkt → Füge zum Cart hinzu
            cart.items.push({
                productId: product.id,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl,
                quantity
            });
        }
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // SCHRITT 7: Cart in DynamoDB speichern
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const updated = await database_adapter_1.default.updateCart(userId, { items: cart.items });
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // SCHRITT 8: STOCK RESERVIEREN in DynamoDB
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // ⚠️ WICHTIG: Reserviere Stock damit andere User nicht das gleiche kaufen können!
        // Beispiel: Vorher stock=100, reserved=15 → Nachher stock=100, reserved=16
        // → Nur noch 84 Einheiten für andere User verfügbar
        await database_adapter_1.default.reserveStock(productId, quantity);
        res.json(updated);
    }
    catch (error) {
        logger_1.logger.error('Failed to add to cart', {
            action: 'addToCart',
            userId: req.user?.userId,
            productId: req.body.productId,
            quantity: req.body.quantity
        }, error);
        res.status(500).json({ error: 'Failed to add to cart' });
    }
};
exports.addToCart = addToCart;
// ============================================================================
// 📋 FUNKTION 3: Cart-Item Quantity ändern
// ============================================================================
/**
 * PUT /api/cart - Quantity eines Items im Cart ändern
 * - quantity > 0: Ändere Quantity (prüfe Stock-Verfügbarkeit)
 * - quantity = 0: Entferne Item aus Cart
 * - Passt reserved Stock automatisch an (erhöhen/reduzieren)
 */
const updateCartItem = async (req, res) => {
    try {
        // User-Authentifizierung
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        // Request-Daten validieren
        const { productId, quantity } = req.body;
        if (!productId || quantity < 0) {
            res.status(400).json({ error: 'Product ID and valid quantity are required' });
            return;
        }
        // Cart laden
        const cart = await database_adapter_1.default.getCartByUserId(userId);
        if (!cart) {
            res.status(404).json({ error: 'Cart not found' });
            return;
        }
        // Produkt im Cart finden
        const itemIndex = cart.items.findIndex(item => item.productId === productId);
        if (itemIndex === -1) {
            res.status(404).json({ error: 'Item not in cart' });
            return;
        }
        const oldQuantity = cart.items[itemIndex].quantity;
        const quantityDiff = quantity - oldQuantity; // Differenz: positiv = mehr, negativ = weniger
        if (quantity === 0) {
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            // FALL A: Quantity = 0 → Produkt aus Cart entfernen
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            cart.items = cart.items.filter(item => item.productId !== productId);
            await database_adapter_1.default.releaseReservedStock(productId, oldQuantity); // Gib ALLE reserved Stock frei
        }
        else {
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            // FALL B: Quantity ändern (Stock-Check bei Erhöhung!)
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            const product = await database_adapter_1.default.getProductById(productId);
            if (!product) {
                res.status(404).json({ error: 'Product not found' });
                return;
            }
            // Prüfe Stock-Verfügbarkeit
            if (product.stock !== undefined) {
                const availableStock = product.stock - (product.reserved || 0);
                if (quantity > availableStock) {
                    res.status(400).json({
                        error: `Only ${availableStock} units available`,
                        availableStock
                    });
                    return;
                }
            }
            // Quantity aktualisieren
            cart.items[itemIndex].quantity = quantity;
            // Reserved Stock anpassen
            if (quantityDiff > 0) {
                await database_adapter_1.default.reserveStock(productId, quantityDiff); // Mehr reservieren
            }
            else if (quantityDiff < 0) {
                await database_adapter_1.default.releaseReservedStock(productId, -quantityDiff); // Weniger reservieren
            }
        }
        const updated = await database_adapter_1.default.updateCart(userId, { items: cart.items });
        res.json(updated);
    }
    catch (error) {
        logger_1.logger.error('Failed to update cart', {
            action: 'updateCartItem',
            userId: req.user?.userId,
            productId: req.body.productId
        }, error);
        res.status(500).json({ error: 'Failed to update cart' });
    }
};
exports.updateCartItem = updateCartItem;
// ============================================================================
// 📋 FUNKTION 4: Produkt aus Cart entfernen
// ============================================================================
/**
 * DELETE /api/cart/:productId - Produkt komplett aus Cart löschen
 * - Gibt reserved Stock frei
 */
const removeFromCart = async (req, res) => {
    try {
        // User-Authentifizierung
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { productId } = req.params;
        // Cart laden
        const cart = await database_adapter_1.default.getCartByUserId(userId);
        if (!cart) {
            res.status(404).json({ error: 'Cart not found' });
            return;
        }
        // Produkt finden und reserved Stock freigeben
        const item = cart.items.find(item => item.productId === productId);
        if (item) {
            await database_adapter_1.default.releaseReservedStock(productId, item.quantity);
        }
        // Produkt aus Cart entfernen
        cart.items = cart.items.filter(item => item.productId !== productId);
        const updated = await database_adapter_1.default.updateCart(userId, { items: cart.items });
        res.json(updated);
    }
    catch (error) {
        logger_1.logger.error('Failed to remove from cart', {
            action: 'removeFromCart',
            userId: req.user?.userId,
            productId: req.params.productId
        }, error);
        res.status(500).json({ error: 'Failed to remove from cart' });
    }
};
exports.removeFromCart = removeFromCart;
// ============================================================================
// 📋 FUNKTION 5: Kompletten Cart leeren
// ============================================================================
/**
 * DELETE /api/cart - Alle Produkte aus Cart entfernen
 * - Gibt ALLEN reserved Stock für alle Items frei
 */
const clearCart = async (req, res) => {
    try {
        // User-Authentifizierung
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        // Cart laden
        const cart = await database_adapter_1.default.getCartByUserId(userId);
        if (!cart) {
            res.status(404).json({ error: 'Cart not found' });
            return;
        }
        // ALLE reserved Stock freigeben (für jedes Item im Cart)
        for (const item of cart.items) {
            await database_adapter_1.default.releaseReservedStock(item.productId, item.quantity);
        }
        // Cart leeren
        const updated = await database_adapter_1.default.updateCart(userId, { items: [] });
        res.json(updated);
    }
    catch (error) {
        logger_1.logger.error('Failed to clear cart', { action: 'clearCart', userId: req.user?.userId }, error);
        res.status(500).json({ error: 'Failed to clear cart' });
    }
};
exports.clearCart = clearCart;

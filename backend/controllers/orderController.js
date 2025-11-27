"use strict";
// ============================================================================
// 📦 ORDER CONTROLLER - Business-Logik für Bestellungen
// ============================================================================
// Diese Datei enthält alle Order-Funktionen (erstellen, abrufen, Status ändern).
//
// 📌 HINWEIS: Wichtige Konzepte sind bereits in cartController.ts erklärt:
//    - Cognito Auth (req.user?.userId)
//    - Stock Management (reserved vs stock)
//    - Error Codes (401, 404, 400, 500)
//
// ⚠️ WICHTIG: Bei Order-Erstellung wird Stock DAUERHAFT reduziert!
//    - reserved wird um X reduziert (Produkt nicht mehr im Cart)
//    - stock wird um X reduziert (Produkt verkauft)
//    - Beispiel: stock=100, reserved=15 → Nach Order: stock=99, reserved=14
// ============================================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrderStatus = exports.getOrderById = exports.getOrders = exports.createOrder = void 0;
const uuid_1 = require("uuid");
const database_adapter_1 = __importDefault(require("../config/database-adapter"));
const logger_1 = require("../utils/logger");
// ============================================================================
// 📋 FUNKTION 1: Bestellung erstellen
// ============================================================================
/**
 * POST /api/orders - Neue Bestellung erstellen
 * - Reduziert Stock DAUERHAFT (stock - X, reserved - X)
 * - Leert Cart nach erfolgreicher Bestellung
 */
const createOrder = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { items, shippingAddress, total } = req.body;
        if (!items || items.length === 0) {
            res.status(400).json({ error: 'Order must contain at least one item' });
            return;
        }
        if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.postalCode || !shippingAddress.country) {
            res.status(400).json({ error: 'Complete shipping address is required' });
            return;
        }
        if (!total || total <= 0) {
            res.status(400).json({ error: 'Valid total is required' });
            return;
        }
        const newOrder = {
            id: (0, uuid_1.v4)(),
            userId,
            items,
            total,
            shippingAddress,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const created = await database_adapter_1.default.createOrder(newOrder);
        // ✅ INVENTORY: Decrease stock for each item (stock and reserved)
        for (const item of items) {
            await database_adapter_1.default.decreaseStock(item.productId, item.quantity);
        }
        // Clear the user's cart after successful order
        const cart = await database_adapter_1.default.getCartByUserId(userId);
        if (cart) {
            await database_adapter_1.default.updateCart(userId, { items: [] });
        }
        res.status(201).json(created);
    }
    catch (error) {
        logger_1.logger.error('Failed to create order', {
            action: 'createOrder',
            userId: req.user?.userId,
            itemCount: req.body.items?.length,
            total: req.body.total
        }, error);
        res.status(500).json({ error: 'Failed to create order' });
    }
};
exports.createOrder = createOrder;
// ============================================================================
// 📋 FUNKTION 2: Alle Bestellungen des Users abrufen
// ============================================================================
/**
 * GET /api/orders - Liste aller Bestellungen des aktuellen Users
 */
const getOrders = async (req, res) => {
    try {
        // User-Authentifizierung
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        // Alle Orders des Users aus DynamoDB laden
        const orders = await database_adapter_1.default.getOrdersByUserId(userId);
        res.json(orders);
    }
    catch (error) {
        logger_1.logger.error('Failed to get orders', { action: 'getOrders', userId: req.user?.userId }, error);
        res.status(500).json({ error: 'Failed to get orders' });
    }
};
exports.getOrders = getOrders;
// ============================================================================
// 📋 FUNKTION 3: Einzelne Bestellung abrufen (mit Zugriffskontrolle)
// ============================================================================
/**
 * GET /api/orders/:id - Einzelne Bestellung abrufen
 * - Prüft dass User nur EIGENE Orders abrufen kann (Security!)
 */
const getOrderById = async (req, res) => {
    try {
        // User-Authentifizierung
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { id } = req.params;
        const order = await database_adapter_1.default.getOrderById(id);
        if (!order) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }
        // ⚠️ SICHERHEIT: User darf nur eigene Orders sehen!
        // Wenn order.userId nicht mit eingeloggtem User übereinstimmt → 403 Forbidden
        if (order.userId !== userId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }
        res.json(order);
    }
    catch (error) {
        logger_1.logger.error('Failed to get order', {
            action: 'getOrderById',
            userId: req.user?.userId,
            orderId: req.params.id
        }, error);
        res.status(500).json({ error: 'Failed to get order' });
    }
};
exports.getOrderById = getOrderById;
// ============================================================================
// 📋 FUNKTION 4: Order-Status ändern
// ============================================================================
/**
 * PATCH /api/orders/:id/status - Order-Status aktualisieren
 * - Erlaubte Status: pending, processing, shipped, delivered, cancelled
 * - Prüft dass User nur EIGENE Orders ändern kann
 */
const updateOrderStatus = async (req, res) => {
    try {
        // User-Authentifizierung
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { id } = req.params;
        const { status } = req.body;
        // Status-Validierung
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!status || !validStatuses.includes(status)) {
            res.status(400).json({ error: 'Valid status is required', validStatuses });
            return;
        }
        // Order laden
        const order = await database_adapter_1.default.getOrderById(id);
        if (!order) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }
        // ⚠️ SICHERHEIT: User darf nur eigene Orders ändern!
        if (order.userId !== userId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }
        // Status aktualisieren
        const updated = await database_adapter_1.default.updateOrder(id, { status });
        res.json(updated);
    }
    catch (error) {
        logger_1.logger.error('Failed to update order status', {
            action: 'updateOrderStatus',
            userId: req.user?.userId,
            orderId: req.params.id,
            newStatus: req.body.status
        }, error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
};
exports.updateOrderStatus = updateOrderStatus;

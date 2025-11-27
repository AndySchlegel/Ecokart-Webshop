"use strict";
// ============================================================================
// 🔐 COGNITO AUTHENTICATION MIDDLEWARE
// ============================================================================
//
// Was macht diese Datei?
// - Extrahiert User-Informationen aus Cognito JWT Token
// - Stellt User-Daten in Express Requests bereit
// - Prüft ob User eingeloggt ist (für geschützte Routes)
//
// Wie funktioniert es?
// 1. API Gateway prüft Cognito Token (BEVOR Lambda!)
// 2. API Gateway schreibt User-Info in event.requestContext
// 3. Diese Middleware liest User-Info aus
// 4. User-Info ist verfügbar in req.user
//
// Autor: Andy Schlegel
// Datum: 20. November 2025
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractCognitoUser = extractCognitoUser;
exports.attachCognitoUser = attachCognitoUser;
exports.requireAuth = requireAuth;
exports.requireAdmin = requireAdmin;
exports.getCurrentUser = getCurrentUser;
exports.getUserId = getUserId;
exports.requireAuthLegacy = requireAuthLegacy;
const logger_1 = require("../utils/logger");
// ============================================================================
// COGNITO USER EXTRACTOR
// ============================================================================
/**
 * Extrahiert User-Info aus Lambda Event (von API Gateway)
 *
 * @param event - Lambda Event Object von API Gateway
 * @returns AuthUser oder null (falls nicht eingeloggt)
 *
 * WICHTIG: API Gateway muss Cognito Authorizer haben!
 * Sonst ist event.requestContext.authorizer.claims undefined
 */
function extractCognitoUser(event) {
    // Event Context vorhanden?
    if (!event || !event.requestContext) {
        logger_1.logger.debug('No request context - no Cognito token', { component: 'cognitoAuth' });
        return null;
    }
    // Authorizer Claims vorhanden?
    // Das sind die User-Daten von Cognito
    const claims = event.requestContext.authorizer?.claims;
    if (!claims || !claims.sub) {
        logger_1.logger.debug('No authorizer claims - user not logged in', { component: 'cognitoAuth' });
        return null;
    }
    // User-Daten extrahieren
    const user = {
        userId: claims.sub, // Cognito User ID
        email: claims.email, // Email
        role: claims['custom:role'] || 'customer', // Role (Default: customer)
        emailVerified: claims.email_verified === true // Email verifiziert?
    };
    logger_1.logger.info('User authenticated via Cognito', {
        userId: user.userId,
        email: user.email,
        role: user.role,
        component: 'cognitoAuth'
    });
    return user;
}
// ============================================================================
// MIDDLEWARE: ATTACH COGNITO USER
// ============================================================================
/**
 * Express Middleware: User-Info aus Cognito an Request anhängen
 *
 * Nutze das in index.ts BEVOR die Routes:
 *   app.use(attachCognitoUser);
 *
 * Danach ist in ALLEN Routes req.user verfügbar
 */
function attachCognitoUser(req, res, next) {
    // Lambda Event ist gespeichert in req.apiGateway.event (serverless-http)
    const event = req.apiGateway?.event;
    if (!event) {
        // Kein Lambda Event = lokales Development (npm run dev)
        logger_1.logger.debug('No Lambda event - local development mode', { component: 'cognitoAuth' });
        req.user = undefined;
        return next();
    }
    // User extrahieren
    const user = extractCognitoUser(event);
    // User in Request speichern
    req.user = user || undefined;
    req.cognitoEvent = event; // Original Event für Debugging
    next();
}
// ============================================================================
// MIDDLEWARE: REQUIRE AUTH
// ============================================================================
/**
 * Express Middleware: Route benötigt Login
 *
 * Nutze das für geschützte Routes:
 *   router.post('/api/cart', requireAuth, cartController.addToCart);
 *
 * Falls User nicht eingeloggt: 401 Unauthorized
 */
function requireAuth(req, res, next) {
    if (!req.user) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Du musst eingeloggt sein um diese Aktion durchzuführen'
        });
        return;
    }
    next();
}
// ============================================================================
// MIDDLEWARE: REQUIRE ADMIN
// ============================================================================
/**
 * Express Middleware: Route benötigt Admin-Role
 *
 * Nutze das für Admin-Routes:
 *   router.post('/api/products', requireAdmin, productController.create);
 *
 * Falls User nicht Admin: 403 Forbidden
 */
function requireAdmin(req, res, next) {
    // Erst prüfen ob überhaupt eingeloggt
    if (!req.user) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Du musst eingeloggt sein'
        });
        return;
    }
    // Dann prüfen ob Admin
    if (req.user.role !== 'admin') {
        res.status(403).json({
            error: 'Forbidden',
            message: 'Diese Aktion ist nur für Admins erlaubt'
        });
        return;
    }
    next();
}
// ============================================================================
// UTILITY: GET CURRENT USER
// ============================================================================
/**
 * Gibt aktuellen User zurück (aus Request)
 *
 * Nutze das in Controllern:
 *   const user = getCurrentUser(req);
 *   if (!user) { return res.status(401)... }
 */
function getCurrentUser(req) {
    return req.user;
}
/**
 * Gibt User ID zurück (shortcut)
 *
 * Nutze das wenn du nur die ID brauchst:
 *   const userId = getUserId(req);
 */
function getUserId(req) {
    return req.user?.userId;
}
// ============================================================================
// MIGRATION: JWT COMPATIBILITY
// ============================================================================
/**
 * Temporäre Middleware für Migration von JWT zu Cognito
 *
 * Unterstützt BEIDE:
 * - Cognito Token (neu)
 * - JWT Token (alt)
 *
 * Nutze das während Migration:
 *   router.post('/api/cart', requireAuthLegacy, cartController.addToCart);
 *
 * TODO: Entfernen nach vollständiger Migration zu Cognito
 */
function requireAuthLegacy(req, res, next) {
    // 1. Versuche Cognito User
    if (req.user) {
        return next();
    }
    // 2. Versuche JWT Token (alter Code)
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
        try {
            // TODO: JWT Verification hier
            // const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // req.user = { userId: decoded.userId, email: decoded.email, ... };
            // return next();
            logger_1.logger.debug('Legacy JWT token found but not implemented', { component: 'cognitoAuth' });
        }
        catch (err) {
            logger_1.logger.debug('Invalid JWT token', { component: 'cognitoAuth' });
        }
    }
    // 3. Kein gültiger Token
    res.status(401).json({
        error: 'Unauthorized',
        message: 'Login erforderlich'
    });
    return;
}
// ============================================================================
// EXPORTS
// ============================================================================
exports.default = {
    attachCognitoUser,
    requireAuth,
    requireAdmin,
    getCurrentUser,
    getUserId,
    extractCognitoUser,
    requireAuthLegacy
};

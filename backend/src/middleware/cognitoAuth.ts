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

import { Request, Response, NextFunction } from 'express';

// ============================================================================
// TYPESCRIPT TYPES
// ============================================================================

/**
 * Cognito User Claims (aus JWT Token)
 *
 * Das sind die Daten die Cognito über den User speichert
 */
export interface CognitoUser {
  // Standard Claims (immer vorhanden)
  sub: string;                    // User ID (UUID) - EINDEUTIG!
  email: string;                  // Email-Adresse
  email_verified: boolean;        // Email verifiziert?

  // Custom Claims (von uns definiert)
  'custom:role'?: string;         // "admin" oder "customer"

  // Cognito Metadata
  'cognito:username': string;     // Username (bei uns = Email)
  iat: number;                    // Issued At (Timestamp)
  exp: number;                    // Expires At (Timestamp)
  token_use: string;              // "id" oder "access"
  auth_time: number;              // Wann hat User sich eingeloggt?
}

/**
 * Vereinfachtes User-Objekt für Express
 *
 * Das nutzen wir in unseren Routes (einfacher als Cognito Claims)
 */
export interface AuthUser {
  userId: string;                 // Cognito Sub (UUID)
  email: string;                  // Email
  role: string;                   // "admin" oder "customer"
  emailVerified: boolean;         // Email verifiziert?
}

/**
 * Express Request erweitert um User-Info
 *
 * Jetzt können wir in Routes schreiben: req.user
 */
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;            // User-Info (falls eingeloggt)
      cognitoEvent?: any;         // Original Lambda Event (für Debugging)
    }
  }
}

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
export function extractCognitoUser(event: any): AuthUser | null {
  // Event Context vorhanden?
  if (!event || !event.requestContext) {
    console.log('[Cognito] Kein Request Context - kein Cognito Token');
    return null;
  }

  // Authorizer Claims vorhanden?
  // Das sind die User-Daten von Cognito
  const claims = event.requestContext.authorizer?.claims as CognitoUser;

  if (!claims || !claims.sub) {
    console.log('[Cognito] Keine Authorizer Claims - User nicht eingeloggt');
    return null;
  }

  // User-Daten extrahieren
  const user: AuthUser = {
    userId: claims.sub,                                  // Cognito User ID
    email: claims.email,                                 // Email
    role: claims['custom:role'] || 'customer',           // Role (Default: customer)
    emailVerified: claims.email_verified === true        // Email verifiziert?
  };

  console.log(`[Cognito] User eingeloggt: ${user.email} (${user.role})`);
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
export function attachCognitoUser(req: Request, res: Response, next: NextFunction): void {
  // Lambda Event ist gespeichert in req.apiGateway.event (serverless-http)
  const event = (req as any).apiGateway?.event;

  if (!event) {
    // Kein Lambda Event = lokales Development (npm run dev)
    console.log('[Cognito] Kein Lambda Event - lokales Development?');
    req.user = undefined;
    return next();
  }

  // User extrahieren
  const user = extractCognitoUser(event);

  // User in Request speichern
  req.user = user || undefined;
  req.cognitoEvent = event;  // Original Event für Debugging

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
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Du musst eingeloggt sein um diese Aktion durchzuführen'
    });
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
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  // Erst prüfen ob überhaupt eingeloggt
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Du musst eingeloggt sein'
    });
  }

  // Dann prüfen ob Admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Diese Aktion ist nur für Admins erlaubt'
    });
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
export function getCurrentUser(req: Request): AuthUser | undefined {
  return req.user;
}

/**
 * Gibt User ID zurück (shortcut)
 *
 * Nutze das wenn du nur die ID brauchst:
 *   const userId = getUserId(req);
 */
export function getUserId(req: Request): string | undefined {
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
export function requireAuthLegacy(req: Request, res: Response, next: NextFunction): void {
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
      console.log('[Auth] JWT Token gefunden, aber noch nicht implementiert');
    } catch (err) {
      console.log('[Auth] Ungültiger JWT Token');
    }
  }

  // 3. Kein gültiger Token
  return res.status(401).json({
    error: 'Unauthorized',
    message: 'Login erforderlich'
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  attachCognitoUser,
  requireAuth,
  requireAdmin,
  getCurrentUser,
  getUserId,
  extractCognitoUser,
  requireAuthLegacy
};

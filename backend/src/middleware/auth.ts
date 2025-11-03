// ============================================================================
// 🔐 AUTHENTIFIZIERUNGS-MIDDLEWARE - JWT Token Validierung
// ============================================================================
// Diese Datei enthält Middleware zum Schutz von API-Endpunkten mit JWT-Tokens.
//
// 📌 WICHTIGE KONZEPTE FÜR ANFÄNGER:
//
// 1️⃣ JWT (JSON Web Token) = Standard für sichere Token-basierte Auth
//    - Token enthält verschlüsselte User-Informationen (userId)
//    - Token wird bei Login erstellt und an Frontend geschickt
//    - Frontend sendet Token bei jedem Request mit (im Authorization Header)
//    - Backend validiert Token um User zu identifizieren
//
// 2️⃣ Middleware = Funktion die VOR dem eigentlichen Route-Handler läuft
//    - Prüft ob User authentifiziert ist
//    - Wenn ja: next() → Request geht weiter zur Route
//    - Wenn nein: 401/403 Error → Request wird abgelehnt
//
// 3️⃣ Authorization Header Format
//    - Header: "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
//    - "Bearer" = Token-Type
//    - Danach folgt der eigentliche JWT-Token
//
// 4️⃣ Token-Struktur (JWT besteht aus 3 Teilen getrennt durch Punkte)
//    - Header.Payload.Signature
//    - Beispiel: xxx.yyy.zzz
//    - Payload enthält: { userId: "abc-123", exp: 1234567890 }
//
// 5️⃣ Sicherheit
//    - JWT_SECRET = Geheimer Schlüssel zum Signieren/Validieren
//    - ⚠️ NIEMALS im Code hardcoden! Immer aus Umgebungsvariable laden
//    - In Terraform gesetzt: terraform/main.tf → JWT_SECRET
//
// 💡 BEISPIEL-FLOW:
//    1. User macht Login → Backend erstellt JWT-Token
//    2. Frontend speichert Token (localStorage/cookie)
//    3. User will geschützte Resource (z.B. /api/cart)
//    4. Frontend sendet Request mit Header: "Authorization: Bearer TOKEN"
//    5. authenticateToken() Middleware prüft Token
//    6. Wenn valid: req.userId wird gesetzt, next() aufgerufen
//    7. Route-Handler kann req.userId verwenden (weiß wer User ist)
// ============================================================================

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// ============================================================================
// 📦 KONFIGURATION
// ============================================================================

// JWT Secret Key (aus Umgebungsvariable)
// ⚠️ WICHTIG: In Produktion IMMER einen starken, zufälligen Secret verwenden!
// ⚠️ Terraform setzt dies automatisch: JWT_SECRET variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// ============================================================================
// 🔧 TYPESCRIPT INTERFACES
// ============================================================================

// Erweitert Express Request um userId Property
// 💡 So können wir in geschützten Routes auf req.userId zugreifen
export interface AuthRequest extends Request {
  userId?: string;
}

// ============================================================================
// 🛡️ AUTHENTICATION MIDDLEWARE
// ============================================================================

/**
 * 🔐 Middleware: Token Validierung
 *
 * Diese Middleware schützt API-Endpunkte vor unauthentifizierten Zugriffen.
 * Wird als Parameter in Router verwendet: router.get('/me', authenticateToken, handler)
 *
 * @param req - Express Request (erweitert mit userId)
 * @param res - Express Response
 * @param next - Callback um Request weiterzuleiten
 *
 * @returns void (sendet Error-Response oder ruft next() auf)
 */
export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SCHRITT 1: Token aus Authorization Header extrahieren
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // Hole Authorization Header
  // Beispiel: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  const authHeader = req.headers['authorization'];

  // Extrahiere Token (alles nach "Bearer ")
  // split(' ') teilt String: ["Bearer", "TOKEN"]
  // [1] nimmt zweiten Teil (den eigentlichen Token)
  const token = authHeader && authHeader.split(' ')[1];

  // Wenn kein Token vorhanden → 401 Unauthorized
  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SCHRITT 2: Token validieren und User-ID extrahieren
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  try {
    // jwt.verify() prüft:
    // 1. Ist Token korrekt signiert? (mit JWT_SECRET)
    // 2. Ist Token noch gültig? (nicht abgelaufen)
    // 3. Ist Token-Format korrekt?
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    // Token ist valid! Speichere userId im Request-Object
    // 💡 Jetzt können alle nachfolgenden Handler req.userId verwenden
    req.userId = decoded.userId;

    // Rufe nächste Middleware/Route-Handler auf
    next();

  } catch (error) {
    // Token ist invalid (falsche Signatur, abgelaufen, manipuliert, etc.)
    // → 403 Forbidden
    res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// ============================================================================
// 🎫 TOKEN GENERATION
// ============================================================================

/**
 * 🎫 Funktion: JWT-Token erstellen
 *
 * Erstellt einen neuen JWT-Token für einen User (nach erfolgreichem Login).
 *
 * @param userId - UUID des Users (aus Datenbank)
 * @returns JWT-Token String (zu senden an Frontend)
 *
 * 💡 BEISPIEL:
 *    const token = generateToken("abc-123-def-456");
 *    // Token wird an Frontend geschickt
 *    res.json({ user, token });
 */
export function generateToken(userId: string): string {
  // jwt.sign() erstellt Token mit:
  // 1. Payload: { userId: "..." }
  // 2. Secret: JWT_SECRET (zum Signieren)
  // 3. Options: { expiresIn: '7d' } → Token läuft nach 7 Tagen ab
  return jwt.sign(
    { userId },           // Payload: User-Informationen im Token
    JWT_SECRET,           // Secret: Zum Signieren
    { expiresIn: '7d' }  // Token-Ablauf: 7 Tage Gültigkeit
  );
}

// ============================================================================
// 📝 VERWENDUNG IN ROUTES
// ============================================================================
//
// GESCHÜTZTE Route (nur mit gültigem Token):
//   router.get('/me', authenticateToken, getCurrentUser);
//                      ↑
//                      └─ Middleware prüft Token BEVOR getCurrentUser läuft
//
// ÖFFENTLICHE Route (ohne Token-Prüfung):
//   router.post('/login', login);
//   router.post('/register', register);
//
// ============================================================================

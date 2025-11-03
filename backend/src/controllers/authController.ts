// ============================================================================
// 🔐 AUTH CONTROLLER - User Registration & Login Logic
// ============================================================================
// Diese Datei enthält die Business-Logik für User-Authentifizierung.
//
// 📌 WICHTIGE KONZEPTE FÜR ANFÄNGER:
//
// 1️⃣ Controller = Business-Logic Layer
//    - Routes leiten Requests an Controller weiter
//    - Controller verarbeitet Daten, ruft Database auf, sendet Response
//    - Trennung: Route (URL-Mapping) vs. Controller (Business-Logik)
//
// 2️⃣ Passwort-Hashing mit bcrypt
//    - NIEMALS Passwörter im Klartext speichern!
//    - bcrypt hasht Passwort: "test123" → "$2a$10$abcdef..."
//    - Hash ist NICHT rückrechenbar (one-way function)
//    - Beim Login: Vergleiche Hash mit eingegebenem Passwort
//
// 3️⃣ User Registration Flow
//    1. User sendet: email, password, name
//    2. Prüfe: Existiert User bereits?
//    3. Hash Passwort mit bcrypt
//    4. Speichere User in DynamoDB
//    5. Erstelle JWT-Token
//    6. Sende User + Token zurück
//
// 4️⃣ User Login Flow
//    1. User sendet: email, password
//    2. Hole User aus DynamoDB
//    3. Vergleiche gehashtes Passwort
//    4. Wenn korrekt: Erstelle JWT-Token
//    5. Sende User + Token zurück
//
// 5️⃣ Password Security Best Practices
//    - bcrypt mit Salt (zufällige Ergänzung)
//    - bcrypt ist LANGSAM by design (verhindert Brute-Force)
//    - Rounds=10 (2^10 = 1024 Hash-Iterationen)
//
// 💡 BEISPIEL:
//    POST /api/auth/register
//    Body: {"email": "test@test.com", "password": "Test1234!", "name": "Max"}
//    ↓
//    register() wird aufgerufen
//    ↓
//    Passwort wird gehasht
//    ↓
//    User in DynamoDB gespeichert
//    ↓
//    JWT-Token erstellt
//    ↓
//    Response: {"user": {...}, "token": "eyJhbGc..."}
// ============================================================================

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import database from '../config/database-adapter';
import { generateToken, AuthRequest } from '../middleware/auth';
import { User, UserCreateInput, UserLoginInput, UserResponse } from '../models/User';

// ============================================================================
// 🔧 HELPER FUNCTIONS
// ============================================================================

/**
 * 🛡️ Helper: User zu UserResponse konvertieren
 *
 * Entfernt sensible Daten (Passwort) aus User-Objekt bevor es an Frontend gesendet wird.
 *
 * @param user - User-Objekt aus Datenbank (mit Passwort!)
 * @returns UserResponse - User-Objekt OHNE Passwort
 */
function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt
    // ⚠️ password ist NICHT enthalten! (Security Best Practice)
  };
}

// ============================================================================
// 🆕 ENDPOINT 1: USER REGISTRATION
// ============================================================================

/**
 * 🆕 POST /api/auth/register - Neuen User erstellen
 *
 * Registriert einen neuen User und erstellt JWT-Token.
 *
 * @route POST /api/auth/register
 * @access Public (keine Authentifizierung nötig)
 *
 * @body {email, password, name} - User-Daten
 * @returns {user, token} - User-Object (ohne Passwort) + JWT-Token
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SCHRITT 1: Request-Daten extrahieren und validieren
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Hole Daten aus Request Body
    const { email, password, name }: UserCreateInput = req.body;

    // Validierung: Alle Felder müssen vorhanden sein
    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password and name are required' });
      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SCHRITT 2: Prüfen ob User bereits existiert
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Suche in DynamoDB nach User mit dieser E-Mail
    const existingUser = await database.getUserByEmail(email);

    // Wenn User existiert → 400 Bad Request
    if (existingUser) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SCHRITT 3: Passwort hashen
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // bcrypt.hash(passwort, rounds)
    // - Rounds=10: Hash-Funktion wird 2^10=1024 mal ausgeführt
    // - Je höher Rounds, desto sicherer aber langsamer
    // - Beispiel: "test123" → "$2a$10$abc..."
    const hashedPassword = await bcrypt.hash(password, 10);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SCHRITT 4: User-Objekt erstellen
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const newUser: User = {
      id: uuidv4(),                           // UUID v4: zufällige eindeutige ID
      email,
      password: hashedPassword,                // ⚠️ Nur gehashtes Passwort speichern!
      name,
      createdAt: new Date().toISOString(),    // ISO 8601 Format: "2025-11-03T10:30:45.123Z"
      updatedAt: new Date().toISOString()
    };

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SCHRITT 5: User in DynamoDB speichern
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Speichern in DynamoDB (ecokart-users Tabelle)
    const created = await database.createUser(newUser);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SCHRITT 6: JWT-Token erstellen
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Erstelle JWT-Token mit User-ID (gültig für 7 Tage)
    const token = generateToken(created.id);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SCHRITT 7: Response senden
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // 201 Created: Resource wurde erfolgreich erstellt
    res.status(201).json({
      user: toUserResponse(created),  // User OHNE Passwort!
      token                           // JWT-Token für Frontend
    });

  } catch (error) {
    // Fehlerbehandlung: Logge Error und sende 500 Internal Server Error
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
};

// ============================================================================
// 🔑 ENDPOINT 2: USER LOGIN
// ============================================================================

/**
 * 🔑 POST /api/auth/login - User einloggen
 *
 * Validiert Credentials und erstellt JWT-Token.
 *
 * @route POST /api/auth/login
 * @access Public (keine Authentifizierung nötig)
 *
 * @body {email, password} - Login-Credentials
 * @returns {user, token} - User-Object (ohne Passwort) + JWT-Token
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SCHRITT 1: Request-Daten extrahieren und validieren
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const { email, password }: UserLoginInput = req.body;

    // Validierung: E-Mail und Passwort müssen vorhanden sein
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SCHRITT 2: User aus DynamoDB laden
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Suche User anhand E-Mail
    const user = await database.getUserByEmail(email);

    // Wenn User nicht existiert → 401 Unauthorized
    // ⚠️ WICHTIG: Gib NICHT an ob E-Mail oder Passwort falsch ist (Security!)
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SCHRITT 3: Passwort validieren
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // bcrypt.compare() vergleicht:
    // - Klartext-Passwort (vom User eingegeben)
    // - Gehashtes Passwort (aus Datenbank)
    // Gibt true zurück wenn Passwort korrekt ist
    const isValidPassword = await bcrypt.compare(password, user.password);

    // Wenn Passwort falsch → 401 Unauthorized
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SCHRITT 4: JWT-Token erstellen
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Erstelle JWT-Token mit User-ID (gültig für 7 Tage)
    const token = generateToken(user.id);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SCHRITT 5: Response senden
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    res.json({
      user: toUserResponse(user),  // User OHNE Passwort!
      token                        // JWT-Token für Frontend
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
};

// ============================================================================
// 👤 ENDPOINT 3: GET CURRENT USER
// ============================================================================

/**
 * 👤 GET /api/auth/me - Aktuell eingeloggten User abrufen
 *
 * Gibt User-Informationen basierend auf JWT-Token zurück.
 *
 * @route GET /api/auth/me
 * @access Protected (benötigt gültigen JWT-Token!)
 *
 * @headers Authorization: Bearer <token>
 * @returns {user} - User-Object (ohne Passwort)
 */
export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SCHRITT 1: User-ID aus Request holen
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // req.userId wurde von authenticateToken() Middleware gesetzt
    // (siehe: /routes/authRoutes.ts → router.get('/me', authenticateToken, getCurrentUser))
    const userId = req.userId;

    // Double-Check: Sollte nicht passieren (Middleware prüft bereits Token)
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SCHRITT 2: User aus DynamoDB laden
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Hole User anhand ID
    const user = await database.getUserById(userId);

    // Wenn User nicht gefunden (gelöscht nach Token-Erstellung?)
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SCHRITT 3: Response senden
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // User-Daten OHNE Passwort zurückgeben
    res.json(toUserResponse(user));

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};

// ============================================================================
// 📝 ZUSAMMENFASSUNG
// ============================================================================
//
// ✅ Drei Endpunkte implementiert:
//    1. POST /api/auth/register - Neuen User erstellen
//    2. POST /api/auth/login    - User einloggen
//    3. GET  /api/auth/me       - Aktuellen User abrufen (protected)
//
// 🔐 Sicherheits-Features:
//    - Passwörter werden NIEMALS im Klartext gespeichert (bcrypt Hash)
//    - Passwörter werden NIEMALS in Responses zurückgegeben
//    - JWT-Tokens für sichere Session-Verwaltung
//    - Generische Error-Messages (nicht "E-Mail existiert nicht" sondern "Invalid credentials")
//
// 🗄️ DynamoDB Integration:
//    - database.createUser()     → PutItem in ecokart-users
//    - database.getUserByEmail() → Query mit GSI (Global Secondary Index)
//    - database.getUserById()    → GetItem mit Primary Key
//
// ============================================================================

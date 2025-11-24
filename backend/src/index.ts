// ============================================================================
// 🚀 ECOKART BACKEND - HAUPTDATEI (Express.js Application)
// ============================================================================
// Diese Datei ist das Herzstück des Backends und erstellt die Express.js App.
// Sie läuft sowohl lokal (für Entwicklung) als auch auf AWS Lambda (Produktion).
//
// 📌 WICHTIGE KONZEPTE FÜR ANFÄNGER:
//
// 1️⃣ Express.js = Web-Framework für Node.js
//    - Erstellt einen Web-Server der HTTP-Requests bearbeitet
//    - Definiert Routen (Endpunkte) wie /api/products, /api/auth, etc.
//
// 2️⃣ Middleware = Funktionen die bei jedem Request ausgeführt werden
//    - CORS: Erlaubt Frontend Zugriff auf Backend (Cross-Origin)
//    - express.json(): Wandelt JSON-Daten aus Requests in JavaScript-Objekte
//    - Logging: Protokolliert jeden Request (hilfreich zum Debuggen)
//
// 3️⃣ Routes = URL-Pfade die zu bestimmten Funktionen führen
//    - GET /api/products → Liste alle Produkte auf
//    - POST /api/auth/login → Melde User an
//
// 4️⃣ Lambda-Kompatibilität
//    - Lokal: Server läuft auf Port 4000
//    - AWS: Keine Port-Bindung, Lambda startet Server automatisch
// ============================================================================

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import productRoutes from './routes/productRoutes';
import cartRoutes from './routes/cartRoutes';
import orderRoutes from './routes/orderRoutes';
import { logger } from './utils/logger';

// ============================================================================
// 📦 KONFIGURATION
// ============================================================================

// Lade Umgebungsvariablen aus .env Datei (z.B. JWT_SECRET, AWS_REGION)
dotenv.config();

// Erstelle Express Application (der Web-Server)
const app: Application = express();

// Port für lokale Entwicklung (Standard: 4000)
const PORT = process.env.PORT || 4000;

// ============================================================================
// 🛡️ MIDDLEWARE SETUP
// ============================================================================

// CORS = Cross-Origin Resource Sharing
// 💡 Erlaubt Frontend (auf anderem Port/Domain) Zugriff auf Backend
// ⚠️ WICHTIG: Ohne CORS würde Browser Requests blockieren!
app.use(cors({
  origin: [
    'http://localhost:3000',      // Customer Frontend (lokal)
    'http://localhost:3001',      // Admin Frontend (lokal)
    'http://localhost:3002',      // Alternatives Frontend (lokal)
    'https://main.d1d14e6pdoz4r.amplifyapp.com', // Deine Amplify URL
    /\.amplifyapp\.com$/          // Alle Amplify URLs (Regex-Pattern)
  ],
  credentials: true               // Erlaube Cookies/Authorization Headers
}));

// JSON Parser Middleware
// 💡 Wandelt eingehende JSON-Requests in JavaScript-Objekte um
// Beispiel: {"email": "test@test.com"} → req.body.email
app.use(express.json());

// URL-Encoded Parser Middleware
// 💡 Verarbeitet Form-Daten (z.B. von HTML-Formularen)
app.use(express.urlencoded({ extended: true }));

// Logging Middleware
// 💡 Protokolliert jeden eingehenden Request (hilfreich für Debugging)
// 📝 Nutzt strukturiertes Logging für CloudWatch Integration
app.use((req: Request, res: Response, next) => {
  const startTime = Date.now();

  // Log request after response is sent
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
    });
  });

  next(); // Wichtig! Leitet Request an nächste Middleware/Route weiter
});

// ============================================================================
// 🔗 ROUTES (API ENDPUNKTE)
// ============================================================================

// Health Check Route
// 💡 Prüft ob Backend läuft (wird von AWS LoadBalancer genutzt)
// ➡️ GET /api/health
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 🏷️ Produkt-Routen
// ➡️ Alle Requests zu /api/products/* werden an productRoutes weitergeleitet
// Siehe: ./routes/productRoutes.ts für Details
app.use('/api/products', productRoutes);

// 🛒 Warenkorb-Routen
// ➡️ Produkte hinzufügen, entfernen, anzeigen
// Siehe: ./routes/cartRoutes.ts für Details
app.use('/api/cart', cartRoutes);

// 📦 Bestellungs-Routen
// ➡️ Bestellungen erstellen, anzeigen, Status ändern
// Siehe: ./routes/orderRoutes.ts für Details
app.use('/api/orders', orderRoutes);

// 404 Handler
// 💡 Fängt alle Requests zu nicht existierenden Routen ab
// ⚠️ Muss NACH allen anderen Routen definiert werden!
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// ============================================================================
// 🖥️ SERVER START (NUR FÜR LOKALE ENTWICKLUNG)
// ============================================================================

// 💡 Prüfe ob wir in Lambda laufen oder lokal
// AWS_EXECUTION_ENV existiert nur in Lambda-Umgebung
if (process.env.AWS_EXECUTION_ENV === undefined) {
  // Starte lokalen Server auf Port 4000
  app.listen(PORT, () => {
    logger.info('EcoKart Backend API started', {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      database: 'DynamoDB',
    });

    // Pretty output for development (only in console, not in logs)
    /* eslint-disable no-console */
    console.log('┌─────────────────────────────────────────┐');
    console.log('│  🚀 EcoKart Backend API                 │');
    console.log('├─────────────────────────────────────────┤');
    console.log(`│  📍 Server: http://localhost:${PORT}       │`);
    console.log(`│  🌐 Environment: ${(process.env.NODE_ENV || 'development').padEnd(19)}│`);
    console.log('│  📦 Database: DynamoDB                  │');
    console.log('├─────────────────────────────────────────┤');
    console.log('│  Endpoints:                             │');
    console.log('│                                         │');
    console.log('│  🔐 Authentication:                     │');
    console.log('│  POST   /api/auth/register              │');
    console.log('│  POST   /api/auth/login                 │');
    console.log('│  GET    /api/auth/me                    │');
    console.log('│                                         │');
    console.log('│  🛒 Shopping Cart:                      │');
    console.log('│  GET    /api/cart                       │');
    console.log('│  POST   /api/cart/items                 │');
    console.log('│  PUT    /api/cart/items                 │');
    console.log('│  DELETE /api/cart/items/:productId      │');
    console.log('│  DELETE /api/cart                       │');
    console.log('│                                         │');
    console.log('│  📦 Orders:                             │');
    console.log('│  POST   /api/orders                     │');
    console.log('│  GET    /api/orders                     │');
    console.log('│  GET    /api/orders/:id                 │');
    console.log('│  PATCH  /api/orders/:id/status          │');
    console.log('│                                         │');
    console.log('│  🏷️  Products:                          │');
    console.log('│  GET    /api/products                   │');
    console.log('│  GET    /api/products/:id               │');
    console.log('│  POST   /api/products                   │');
    console.log('│  PUT    /api/products/:id               │');
    console.log('│  DELETE /api/products/:id               │');
    console.log('│                                         │');
    console.log('│  ❤️  Health Check:                      │');
    console.log('│  GET    /api/health                     │');
    console.log('└─────────────────────────────────────────┘');
    /* eslint-enable no-console */
  });
}
// ⚠️ In Lambda wird KEIN Server gestartet!
// Lambda startet/stoppt automatisch bei Requests

// ============================================================================
// 📤 EXPORT
// ============================================================================

// Exportiere App für Lambda-Handler (siehe lambda.ts)
export default app;

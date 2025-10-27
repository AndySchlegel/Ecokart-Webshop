# Ecokart Admin Frontend - Deployment Anleitung

## Status: NUR LOKAL VERFÜGBAR ⚠️

**Letztes Update:** 26. Oktober 2025
**Aktueller Status:** Nur lokal lauffähig, noch nicht auf AWS deployt

---

## Übersicht

Das Admin Frontend ist eine separate Next.js Anwendung zum Verwalten der Produkte im Ecokart Webshop. Es bietet ein einfaches Interface für Admins, um:

- Produkte anzuzeigen
- Neue Produkte zu erstellen
- Bestehende Produkte zu bearbeiten
- Produkte zu löschen

### Technologie Stack

- **Framework:** Next.js 14 (App Router)
- **Runtime:** Node.js 20.x
- **Authentication:** JWT mit jose Library (Session Cookie)
- **Styling:** Styled JSX
- **TypeScript:** 5.4.5

### Warum ein separates Admin Frontend?

Das Admin Frontend ist bewusst getrennt vom Kunden-Frontend, um:
- Bessere Sicherheit (keine Admin-Funktionen im öffentlichen Frontend)
- Unabhängige Deployments
- Unterschiedliche Authentifizierung (Admin Login vs. User Login)
- Separate Build-Pipelines

---

## Teil 1: Lokale Entwicklung

### Voraussetzungen

- Node.js 20.x oder höher
- npm oder yarn
- Backend API muss laufen (lokal oder AWS Lambda)

### Schritt 1: Installation

```bash
cd admin-frontend
npm install
```

### Schritt 2: Environment Variables konfigurieren

Erstelle eine `.env.local` Datei:

```bash
cp .env.example .env.local
```

Bearbeite `.env.local` mit deinen Werten:

```bash
# Admin Login Zugangsdaten
ADMIN_APP_USERNAME=admin@ecokart.com
ADMIN_APP_PASSWORD=dein-sicheres-passwort-hier

# JWT Session Secret (mindestens 32 Zeichen!)
ADMIN_SESSION_SECRET=ersetze-dies-mit-einem-sehr-langen-zufälligen-string-mindestens-32-zeichen

# Backend API URL
# Lokal:
ADMIN_API_URL=http://localhost:4000

# Production (AWS Lambda):
# ADMIN_API_URL=https://ob4yi692if.execute-api.eu-north-1.amazonaws.com/Prod

# Admin API Key (wird aktuell NICHT verwendet, für zukünftige Features)
ADMIN_API_KEY=demo-admin-key-2025
```

#### Environment Variables Erklärung

| Variable | Beschreibung | Beispiel | Erforderlich |
|----------|--------------|----------|--------------|
| `ADMIN_APP_USERNAME` | Email für Admin Login | `admin@ecokart.com` | ✅ |
| `ADMIN_APP_PASSWORD` | Passwort für Admin Login | `EcoKart2025!Secure` | ✅ |
| `ADMIN_SESSION_SECRET` | Secret für JWT Token Signierung | Minimum 32 Zeichen | ✅ |
| `ADMIN_API_URL` | Backend API Base URL | `http://localhost:4000` | ✅ |
| `ADMIN_API_KEY` | API Key für Backend (aktuell ungenutzt) | `demo-admin-key-2025` | ❌ |

**Wichtig:**
- `ADMIN_SESSION_SECRET` muss mindestens 32 Zeichen lang sein!
- Verwende sichere Passwörter in Production!
- `.env.local` ist in `.gitignore` und wird NICHT ins Repository committed!

### Schritt 3: Backend starten (wenn lokal)

Das Admin Frontend benötigt die Backend API. Wenn du lokal entwickelst:

```bash
# In einem separaten Terminal
cd backend
npm run dev
```

Das Backend läuft dann auf `http://localhost:4000`

### Schritt 4: Admin Frontend starten

```bash
npm run dev
```

Das Admin Frontend startet auf **http://localhost:3001** (oder dem nächsten freien Port)

### Schritt 5: Login

Öffne `http://localhost:3001/login` und melde dich mit deinen Credentials an:

- **Username:** `admin@ecokart.com` (oder was du in `.env.local` gesetzt hast)
- **Password:** Dein Passwort aus `.env.local`

Nach erfolgreichem Login wirst du zum Dashboard weitergeleitet.

---

## Teil 2: Deployment auf AWS Amplify

### Übersicht

Das Admin Frontend kann als **separate Amplify App** deployt werden, unabhängig vom Kunden-Frontend.

### Warum AWS Amplify?

- Automatische Deployments bei Git Push
- Server-Side Rendering (SSR) Support für Next.js
- Environment Variables Management
- HTTPS und CloudFront CDN inklusive
- Einfache Skalierung

### Schritt 1: Amplify App erstellen

#### Option A: AWS Console (empfohlen für Anfänger)

1. Gehe zu [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Klicke **"Create new app"** → **"Host web app"**
3. Wähle **GitHub** als Source
4. Autorisiere AWS mit deinem GitHub Account
5. Wähle Repository: `Ecokart-Webshop`
6. Wähle Branch: `main`
7. **WICHTIG:** Bei "App settings" → **"Monorepo"** aktivieren!

#### Option B: AWS CLI

```bash
aws amplify create-app \
  --name ecokart-admin-frontend \
  --repository https://github.com/YOUR_USERNAME/Ecokart-Webshop \
  --platform WEB_COMPUTE \
  --region eu-north-1
```

### Schritt 2: Build Settings konfigurieren

Erstelle `admin-frontend/amplify.yml`:

```yaml
version: 1
applications:
  - appRoot: admin-frontend
    frontend:
      phases:
        preBuild:
          commands:
            - echo "Installing dependencies..."
            - npm ci
        build:
          commands:
            - echo "Building Next.js app..."
            - npm run build
      artifacts:
        baseDirectory: .next
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
          - .next/cache/**/*
    platform: WEB_COMPUTE
```

**Alternativ**: Build Settings in der Amplify Console manuell setzen:

```yaml
Framework: Next.js - SSR
Build Command: npm run build
Output Directory: .next
Node Version: 20
```

### Schritt 3: Environment Variables setzen

In der Amplify Console → **Environment variables** → **Manage variables**:

```bash
AMPLIFY_MONOREPO_APP_ROOT=admin-frontend
AMPLIFY_DIFF_DEPLOY=false

# Admin Credentials
ADMIN_APP_USERNAME=admin@ecokart.com
ADMIN_APP_PASSWORD=EcoKart2025SecurePassword!

# JWT Secret (mindestens 32 Zeichen!)
ADMIN_SESSION_SECRET=production-jwt-secret-change-to-something-very-long-and-random-min-32-chars

# Backend API (AWS Lambda)
ADMIN_API_URL=https://ob4yi692if.execute-api.eu-north-1.amazonaws.com/Prod

# Optional
ADMIN_API_KEY=production-admin-key-2025

# Next.js Production Mode
NODE_ENV=production
```

**Sicherheitshinweise:**
- Verwende **starke, einzigartige Passwörter** für Production!
- `ADMIN_SESSION_SECRET` sollte kryptographisch sicher generiert werden:
  ```bash
  openssl rand -base64 48
  ```
- Speichere Secrets sicher (z.B. AWS Secrets Manager)

### Schritt 4: Access Control (Optional aber empfohlen!)

Um das Admin Frontend vor unbefugtem Zugriff zu schützen, aktiviere Amplify Basic Auth:

1. Amplify Console → **Access control**
2. Klicke **"Manage access"**
3. Aktiviere **"Restrict access"**
4. Wähle **"Username and password"**
5. Setze Credentials:
   - **Username:** `admin`
   - **Password:** `EcoKartAdminAccess2025!` (oder ein anderes sicheres Passwort)

**Wichtig:** Dies ist eine **zusätzliche** Schutzschicht ÜBER dem normalen Admin-Login!

Benutzer müssen dann:
1. Zuerst Basic Auth Credentials eingeben (Browser-Popup)
2. Dann auf der Login-Seite die Admin-Credentials eingeben

### Schritt 5: Deployment starten

#### Automatischer Deploy bei Git Push

Sobald die App konfiguriert ist, triggert jeder Push nach `main` automatisch ein Deployment:

```bash
git add admin-frontend/
git commit -m "Configure admin frontend for Amplify"
git push origin main
```

#### Manueller Deploy über CLI

```bash
aws amplify start-deployment \
  --app-id YOUR_AMPLIFY_APP_ID \
  --branch-name main \
  --region eu-north-1
```

### Schritt 6: Build Status prüfen

Während des Builds kannst du den Fortschritt in der Amplify Console verfolgen:

1. **Provision** - Ressourcen werden vorbereitet (~30 Sekunden)
2. **Build** - Next.js App wird gebaut (~2-3 Minuten)
3. **Deploy** - Upload zu CloudFront CDN (~1 Minute)
4. **Verify** - Deployment wird getestet (~30 Sekunden)

#### Via CLI:

```bash
aws amplify list-jobs \
  --app-id YOUR_AMPLIFY_APP_ID \
  --branch-name main \
  --region eu-north-1
```

### Schritt 7: Live URL abrufen

Nach erfolgreichem Deployment findest du die URL in der Console oder via CLI:

```bash
aws amplify get-branch \
  --app-id YOUR_AMPLIFY_APP_ID \
  --branch-name main \
  --region eu-north-1 \
  | jq -r '.branch.defaultDomain'
```

Beispiel URL: `https://main.d2abc123xyz.amplifyapp.com`

---

## Amplify Build Konfiguration (Detailliert)

### Monorepo Setup

Da Admin Frontend und Kunden-Frontend im gleichen Repository sind, benötigt Amplify spezielle Konfiguration:

**Environment Variable:**
```bash
AMPLIFY_MONOREPO_APP_ROOT=admin-frontend
```

Dies teilt Amplify mit, dass nur das `admin-frontend/` Verzeichnis gebaut werden soll.

### Next.js SSR Platform

Das Admin Frontend verwendet **Server-Side Rendering**, daher muss die Platform auf `WEB_COMPUTE` gesetzt sein:

```yaml
Platform: WEB_COMPUTE
Framework: Next.js - SSR
```

**Nicht verwenden:**
- `WEB` - Nur für statische Sites (SSG)
- `WEB_DYNAMIC` - Legacy, nicht empfohlen

### Caching

Um Build-Zeiten zu reduzieren, aktiviere Caching:

```yaml
cache:
  paths:
    - node_modules/**/*
    - .next/cache/**/*
```

### Custom Domain (Optional)

Wenn du eine eigene Domain verwenden möchtest (z.B. `admin.ecokart.com`):

1. Amplify Console → **Domain management** → **Add domain**
2. Folge dem Wizard um DNS zu konfigurieren
3. Amplify erstellt automatisch SSL Zertifikate

---

## Sicherheitsaspekte

### 1. Doppelte Authentifizierung

Für maximale Sicherheit solltest du beide Auth-Schichten verwenden:

**Layer 1: Amplify Basic Auth** (Browser-Level)
- Schützt die gesamte App vor unbefugtem Zugriff
- Wird von CloudFront durchgesetzt
- Einfaches Username/Password (nicht für Benutzer sichtbar)

**Layer 2: Admin Login** (Application-Level)
- JWT-basierte Session
- Admin-spezifische Credentials
- 2-Stunden Token Expiry
- Middleware-geschützte Routes

### 2. Environment Variables Sicherheit

**Niemals committen:**
- `.env.local`
- Passwörter
- Session Secrets

**Best Practices:**
- Verwende AWS Secrets Manager für Production Secrets
- Rotiere Passwörter regelmäßig
- Verwende unterschiedliche Secrets für Dev/Staging/Prod

### 3. HTTPS erzwingen

Amplify erzwingt automatisch HTTPS. Das `secure` Flag für Cookies ist in Production aktiviert:

```typescript
// lib/auth.ts
const isProduction = process.env.NODE_ENV === 'production';

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction, // ✅ HTTPS only in Production
    path: '/'
  });
}
```

### 4. Session Token Security

- **Expiry:** 2 Stunden
- **Algorithm:** HS256 (HMAC SHA-256)
- **Storage:** HTTP-only Cookie (nicht via JavaScript zugreifbar)
- **SameSite:** Lax (CSRF Protection)

### 5. Middleware Protection

Alle geschützten Routes werden durch Next.js Middleware gesichert:

```typescript
// middleware.ts
const PROTECTED_PATHS = ['/dashboard', '/api/articles'];
```

Ohne gültigen Session Token erfolgt automatisch Redirect zu `/login`.

---

## Unterschiede: Lokal vs. Production

| Aspekt | Lokal (Dev) | Production (Amplify) |
|--------|-------------|----------------------|
| **URL** | `http://localhost:3001` | `https://main.dXYZ.amplifyapp.com` |
| **HTTPS** | Nein | Ja (erzwungen) |
| **Cookie Secure Flag** | `false` | `true` |
| **Backend URL** | `http://localhost:4000` | AWS Lambda API Gateway URL |
| **Build Command** | `npm run dev` | `npm run build` + `npm start` |
| **Environment Variables** | `.env.local` | Amplify Console |
| **Auto-Deploy** | Nein | Ja (bei Git Push) |
| **CDN** | Nein | CloudFront |
| **SSL Zertifikat** | Nein | Automatisch (AWS Certificate Manager) |

---

## Troubleshooting

### Problem 1: "Admin-Zugang ist nicht konfiguriert"

**Symptom:** Login-Seite zeigt Fehler 500

**Ursache:** `ADMIN_APP_USERNAME` oder `ADMIN_APP_PASSWORD` nicht gesetzt

**Lösung:**
```bash
# Lokal: Prüfe .env.local
cat admin-frontend/.env.local

# Amplify: Prüfe Environment Variables
aws amplify get-app --app-id YOUR_APP_ID --region eu-north-1 | jq '.app.environmentVariables'
```

### Problem 2: "ADMIN_SESSION_SECRET ist nicht gesetzt"

**Symptom:** Login schlägt fehl mit 500 Error

**Ursache:** `ADMIN_SESSION_SECRET` fehlt oder ist zu kurz

**Lösung:**
```bash
# Generiere sicheres Secret
openssl rand -base64 48

# Füge zu .env.local hinzu
echo "ADMIN_SESSION_SECRET=$(openssl rand -base64 48)" >> admin-frontend/.env.local
```

### Problem 3: Cookie wird nicht gesetzt (Lokal)

**Symptom:** Nach Login sofort wieder auf Login-Seite

**Ursache:** `secure: true` Cookie kann nicht über HTTP gesetzt werden

**Lösung:** Prüfe `lib/auth.ts`:
```typescript
const isProduction = process.env.NODE_ENV === 'production';
// In Dev sollte NODE_ENV nicht 'production' sein!
```

### Problem 4: Amplify Build schlägt fehl

**Symptom:** Build Error "Module not found" oder "Cannot find module"

**Mögliche Ursachen:**

1. **Falsche App Root:**
   ```bash
   # Prüfe ob AMPLIFY_MONOREPO_APP_ROOT gesetzt ist
   AMPLIFY_MONOREPO_APP_ROOT=admin-frontend
   ```

2. **Node Version Mismatch:**
   ```yaml
   # In Build Settings
   Node Version: 20
   ```

3. **Dependencies fehlen:**
   ```yaml
   # Prüfe package.json
   cd admin-frontend
   npm install
   git add package-lock.json
   git commit -m "Update dependencies"
   ```

**Logs prüfen:**
```bash
aws amplify get-job \
  --app-id YOUR_APP_ID \
  --branch-name main \
  --job-id JOB_ID \
  --region eu-north-1 | jq '.job.steps'
```

### Problem 5: Backend API nicht erreichbar

**Symptom:** Dashboard lädt keine Produkte, Network Error in Console

**Ursachen:**

1. **Falsche API URL:**
   ```bash
   # Prüfe Environment Variable
   ADMIN_API_URL=https://ob4yi692if.execute-api.eu-north-1.amazonaws.com/Prod
   # ❌ Kein trailing slash!
   ```

2. **CORS Probleme:**
   Das Backend muss die Admin Frontend Domain in CORS erlauben.

   Prüfe `backend/src/index.ts`:
   ```typescript
   app.use(cors({
     origin: [
       'http://localhost:3001', // Admin Frontend lokal
       'https://main.dXYZ.amplifyapp.com', // Admin Frontend Amplify
       // ...
     ]
   }));
   ```

3. **Lambda nicht deployed:**
   ```bash
   # Prüfe ob Backend deployed ist
   curl https://ob4yi692if.execute-api.eu-north-1.amazonaws.com/Prod/api/products
   ```

### Problem 6: Deployment triggert nicht automatisch

**Symptom:** Git Push erstellt keinen neuen Build in Amplify

**Lösung:**

1. **Prüfe Branch Connection:**
   ```bash
   aws amplify list-branches --app-id YOUR_APP_ID --region eu-north-1
   ```

2. **Prüfe Webhook:**
   Amplify Console → **Build settings** → **Webhook** sollte aktiv sein

3. **Manueller Trigger:**
   ```bash
   aws amplify start-deployment \
     --app-id YOUR_APP_ID \
     --branch-name main \
     --region eu-north-1
   ```

4. **Diff Deploy deaktivieren:**
   ```bash
   AMPLIFY_DIFF_DEPLOY=false
   ```

---

## Wartung & Updates

### Frontend Code Update

```bash
# 1. Änderungen machen
cd admin-frontend
# ... edit files ...

# 2. Lokal testen
npm run dev

# 3. Committen und pushen
git add .
git commit -m "Update admin frontend: feature XYZ"
git push origin main

# 4. Amplify baut automatisch (2-3 Minuten)
```

### Environment Variables ändern

**Lokal:**
```bash
# Bearbeite .env.local
nano admin-frontend/.env.local

# Restart Dev Server
npm run dev
```

**Production (Amplify):**
```bash
# Via CLI
aws amplify update-app \
  --app-id YOUR_APP_ID \
  --region eu-north-1 \
  --environment-variables ADMIN_APP_PASSWORD=NewPassword123!

# Oder über Amplify Console → Environment variables
```

**Wichtig:** Nach Änderung von Environment Variables muss neu deployed werden!

### Passwort rotieren

```bash
# 1. Neues Passwort generieren
NEW_PASSWORD=$(openssl rand -base64 24)

# 2. In Amplify setzen
aws amplify update-app \
  --app-id YOUR_APP_ID \
  --region eu-north-1 \
  --environment-variables ADMIN_APP_PASSWORD=$NEW_PASSWORD

# 3. Neues Deployment triggern
aws amplify start-deployment \
  --app-id YOUR_APP_ID \
  --branch-name main \
  --region eu-north-1

# 4. Neues Passwort sicher speichern
echo $NEW_PASSWORD | pbcopy  # macOS
```

---

## Features & Einschränkungen

### ✅ Implementiert

- **Authentication:** JWT-basierte Admin-Login
- **Product Management:** CRUD Operationen für Produkte
- **Session Management:** 2-Stunden Token Expiry
- **Protected Routes:** Middleware-basierte Access Control
- **SSR Support:** Server-Side Rendering für bessere Performance
- **Responsive UI:** Funktioniert auf Desktop und Tablet

### ❌ Nicht Implementiert

- **User Management:** Keine Verwaltung von Shop-Kunden
- **Order Management:** Bestellungen können nicht eingesehen werden
- **Multi-User Admin:** Nur ein Admin Account
- **Role-Based Access Control (RBAC):** Keine unterschiedlichen Admin-Rollen
- **Audit Logs:** Keine Nachverfolgung von Admin-Aktionen
- **Image Upload:** Bilder müssen via URL referenziert werden
- **Bulk Operations:** Keine Massen-Bearbeitung von Produkten
- **Dashboard Analytics:** Keine Verkaufsstatistiken

### 🔮 Zukünftige Features (Empfehlungen)

1. **AWS Cognito Integration**
   - Ersetze Custom JWT Auth durch Cognito User Pools
   - Multi-Factor Authentication (MFA)
   - Password Reset Flow

2. **S3 Image Upload**
   - Direkte Bild-Uploads statt URL-Eingabe
   - Automatische Image Optimization
   - CloudFront CDN für Bilder

3. **Order Dashboard**
   - Bestellungen einsehen
   - Status ändern (Pending → Shipped → Delivered)
   - Versand-Labels drucken

4. **User Management**
   - Kunden einsehen und bearbeiten
   - Gesperrte Accounts verwalten
   - Email-Notifications senden

5. **Analytics Dashboard**
   - Verkaufszahlen
   - Top-Produkte
   - Umsatz-Tracking
   - CloudWatch Metrics Integration

6. **Inventory Management**
   - Lagerbestand tracken
   - Low-Stock Alerts
   - Automatische Nachbestellungen

---

## Kosten (Geschätzt)

**Monatliche AWS Kosten bei geringem Traffic:**

- **Amplify Hosting:** ~$0-5/Monat
  - Build-Minuten: ~$0.01/Minute (erste 1000 Minuten gratis)
  - Hosting: ~$0.15/GB gespeichert + $0.15/GB ausgeliefert
  - Geschätzt: ~10 Deployments/Monat × 3 Min = 30 Minuten = $0

- **CloudFront:** Inklusive in Amplify Hosting

- **SSL Zertifikat:** Kostenlos (AWS Certificate Manager)

**Gesamt:** ~$0-5/Monat (bei wenigen Admin-Zugriffen)

**Hinweis:** Bei aktiver Nutzung mit vielen Deployments können zusätzliche Kosten anfallen.

---

## Checklist für Production Deployment

Vor dem Production-Deployment solltest du folgende Punkte prüfen:

- [ ] `ADMIN_APP_PASSWORD` ist ein starkes, einzigartiges Passwort
- [ ] `ADMIN_SESSION_SECRET` wurde mit `openssl rand -base64 48` generiert
- [ ] `ADMIN_API_URL` zeigt auf Production Backend (Lambda URL)
- [ ] Amplify Basic Auth ist aktiviert (zusätzliche Sicherheitsebene)
- [ ] `NODE_ENV=production` ist gesetzt
- [ ] `.env.local` ist in `.gitignore` und wird nicht committed
- [ ] Backend CORS erlaubt Admin Frontend Domain
- [ ] SSL/HTTPS ist aktiviert (automatisch bei Amplify)
- [ ] Session Cookie `secure` Flag ist aktiviert
- [ ] Build Settings verwenden `WEB_COMPUTE` Platform
- [ ] `AMPLIFY_MONOREPO_APP_ROOT=admin-frontend` ist gesetzt
- [ ] Test-Login funktioniert nach Deployment
- [ ] Dashboard lädt Produkte erfolgreich
- [ ] CRUD Operationen funktionieren (Create, Read, Update, Delete)
- [ ] Logout funktioniert korrekt
- [ ] Session Expiry nach 2 Stunden getestet

---

## Wichtige Befehle (Cheat Sheet)

### Lokale Entwicklung

```bash
# Dependencies installieren
cd admin-frontend && npm install

# Environment Variables kopieren
cp .env.example .env.local

# Dev Server starten
npm run dev

# Production Build testen
npm run build
npm start

# Linting
npm run lint
```

### AWS CLI (Amplify)

```bash
# Neue App erstellen
aws amplify create-app --name ecokart-admin --region eu-north-1

# Branch verbinden
aws amplify create-branch --app-id APP_ID --branch-name main

# Environment Variable setzen
aws amplify update-app --app-id APP_ID --environment-variables KEY=VALUE

# Deployment starten
aws amplify start-deployment --app-id APP_ID --branch-name main

# Build Status prüfen
aws amplify list-jobs --app-id APP_ID --branch-name main

# App URL abrufen
aws amplify get-branch --app-id APP_ID --branch-name main | jq -r '.branch.defaultDomain'

# Logs anzeigen
aws amplify get-job --app-id APP_ID --branch-name main --job-id JOB_ID
```

### Sicherheit

```bash
# Sicheres Passwort generieren
openssl rand -base64 24

# Session Secret generieren (mindestens 32 Zeichen)
openssl rand -base64 48

# Environment Variables prüfen
aws amplify get-app --app-id APP_ID | jq '.app.environmentVariables'
```

---

## Support & Weiterführende Ressourcen

### Dokumentation

- **Next.js 14 Docs:** https://nextjs.org/docs
- **AWS Amplify Hosting:** https://docs.aws.amazon.com/amplify/latest/userguide/welcome.html
- **AWS CLI Reference:** https://docs.aws.amazon.com/cli/latest/reference/amplify/

### Repository

- **GitHub:** https://github.com/AndySchlegel/Ecokart-Webshop
- **Admin Frontend:** `/admin-frontend` Directory

### Verwandte Dokumentation

- **Hauptdokumentation:** `/docs/DEPLOYMENT.md`
- **Backend Deployment:** Siehe DEPLOYMENT.md → Backend Section
- **DynamoDB Setup:** Siehe DEPLOYMENT.md → Database Section

---

**Dokumentation erstellt:** 26. Oktober 2025
**Autor:** Claude Code (Anthropic)
**Version:** 1.0

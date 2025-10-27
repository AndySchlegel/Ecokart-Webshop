# Ecokart Webshop - AWS Deployment Dokumentation

## Deployment Status: LIVE ✅

**Deployment Datum:** 26. Oktober 2025
**Status:** Produktionsbereit
**Live URL:** https://main.d1d14e6pdoz4r.amplifyapp.com/

---

## Zugangsdaten

### Frontend (Amplify Basic Auth)
- **Username:** demo
- **Password:** test1234

### Test User Account
- **Email:** checkout@test.com
- **Password:** Test123!

---

## AWS Infrastruktur Übersicht

### 1. Frontend - AWS Amplify

**App ID:** d1d14e6pdoz4r
**Region:** eu-north-1
**Branch:** main
**Framework:** Next.js 13 (App Router mit SSR)

#### Konfiguration
```yaml
Platform: WEB_COMPUTE
Framework: Next.js - SSR
Build Command: npm run build
Output Directory: .next
Node Version: 20
```

#### Environment Variables
```bash
AMPLIFY_MONOREPO_APP_ROOT=frontend
NEXT_PUBLIC_API_URL=https://ob4yi692if.execute-api.eu-north-1.amazonaws.com/Prod
AMPLIFY_DIFF_DEPLOY=false
BASIC_AUTH_USER=demo
BASIC_AUTH_PASS=test1234
```

#### Features
- ✅ Automatic deployment from GitHub
- ✅ Server-Side Rendering (SSR)
- ✅ Basic Authentication
- ✅ CloudFront CDN Distribution
- ✅ Custom domain support (nicht konfiguriert)

---

### 2. Backend - AWS Lambda + API Gateway

**Function Name:** ecokart-backend-api
**Region:** eu-north-1
**Runtime:** Node.js 20.x
**Memory:** 512 MB
**Timeout:** 30 seconds

**API Gateway URL:** https://ob4yi692if.execute-api.eu-north-1.amazonaws.com/Prod/

#### Lambda Configuration
- **Handler:** dist/lambda.handler
- **Architecture:** x86_64
- **Package Type:** Zip
- **Code Size:** ~5 MB

#### Environment Variables
```bash
NODE_ENV=production
DB_TYPE=dynamodb
JWT_SECRET=ecokart-production-jwt-secret-change-me
```

#### IAM Permissions
Lambda hat volle CRUD-Rechte auf alle DynamoDB Tabellen:
- ecokart-products
- ecokart-users
- ecokart-carts
- ecokart-orders

---

### 3. Database - Amazon DynamoDB

Alle Tabellen in Region **eu-north-1**

#### ecokart-products
- **Partition Key:** id (String)
- **Attributes:** name, description, price, imageUrl, category, rating, reviewCount
- **Items:** 31 Produkte
- **GSI:** Keine

#### ecokart-users
- **Partition Key:** id (String)
- **Attributes:** email, password (bcrypt hashed), name, createdAt, updatedAt
- **GSI:** EmailIndex (email als Partition Key)

#### ecokart-carts
- **Partition Key:** userId (String)
- **Attributes:** id, items (List), createdAt, updatedAt
- **GSI:** Keine (userId ist bereits Partition Key)
- **Besonderheit:** Ein Cart pro User

#### ecokart-orders
- **Partition Key:** id (String)
- **Attributes:** userId, items, total, shippingAddress, status, createdAt, updatedAt
- **GSI:** UserOrdersIndex (userId als Partition Key, createdAt als Sort Key)

---

## Deployment-Prozess

### Frontend Deployment (Amplify)

1. **Code pushen:**
   ```bash
   git add .
   git commit -m "message"
   git push origin main
   ```

2. **Amplify baut automatisch:**
   - Detect changes in `frontend/` directory
   - Install dependencies
   - Build Next.js app
   - Deploy to CloudFront
   - ~2-3 Minuten pro Build

3. **Build Status prüfen:**
   ```bash
   aws amplify list-jobs --app-id d1d14e6pdoz4r --branch-name main --region eu-north-1
   ```

### Backend Deployment (Lambda)

1. **Code builden:**
   ```bash
   cd backend
   npm run build
   ```

2. **SAM Build & Deploy:**
   ```bash
   sam build --template template.yaml
   sam deploy --template .aws-sam/build/template.yaml \
     --stack-name ecokart-backend \
     --region eu-north-1 \
     --resolve-s3 \
     --capabilities CAPABILITY_IAM \
     --parameter-overrides JWTSecret=your-secret
   ```

3. **Deployment dauert:** ~1-2 Minuten

---

## Funktionsübersicht

### ✅ Vollständig Funktionsfähig

#### Authentifizierung
- ✅ User Registration (Email + Password)
- ✅ User Login (JWT Token)
- ✅ Password Hashing (bcrypt)
- ✅ Protected Routes (JWT Middleware)

#### Produktkatalog
- ✅ Alle Produkte anzeigen (31 Artikel)
- ✅ Produktdetails anzeigen
- ✅ Kategoriefilter
- ✅ Suchfunktion
- ✅ Preisfilter

#### Warenkorb
- ✅ Produkte hinzufügen
- ✅ Menge aktualisieren
- ✅ Produkte entfernen
- ✅ Warenkorb leeren
- ✅ Persistierung in DynamoDB
- ✅ Ein Warenkorb pro User

#### Checkout & Bestellungen
- ✅ Bestellung erstellen
- ✅ Lieferadresse erfassen
- ✅ Bestellbestätigung
- ✅ Warenkorb wird automatisch geleert
- ✅ Bestellungen in DynamoDB gespeichert

---

## Behobene Probleme während Deployment

### Problem 1: DynamoDB Schema Mismatch (Carts)
**Symptom:** `ValidationException: The table does not have the specified index: UserIdIndex`

**Ursache:** Code versuchte GSI zu verwenden, aber Tabelle hatte `userId` als Partition Key

**Lösung:**
- `CartsService.getByUserId()` - GetCommand statt QueryCommand
- `CartsService.update()` - verwendet `userId` statt `id`
- Alle Controller aktualisiert

**Geänderte Dateien:**
- `backend/src/services/dynamodb/carts.service.ts`
- `backend/src/controllers/cartController.ts`
- `backend/src/controllers/orderController.ts`

### Problem 2: Produktdetailseite 500 Error
**Symptom:** HTTP 500 Internal Server Error bei `/product/[id]`

**Ursache:** `useSearchParams()` Hook erfordert Suspense Boundary in Next.js 13+ App Router

**Lösung:**
- `useSearchParams()` ersetzt durch client-side `URLSearchParams` in `useEffect`
- Params als Props empfangen statt `useParams()`

**Geänderte Dateien:**
- `frontend/app/product/[id]/page.tsx`

### Problem 3: Checkout Schema Mismatch
**Symptom:** "Complete shipping address is required"

**Ursache:** Frontend sendete `zipCode`, Backend erwartete `postalCode` + `name`

**Lösung:**
- Frontend: `zipCode` → `postalCode`
- `name` Feld hinzugefügt (auto-filled von User)

**Geänderte Dateien:**
- `frontend/app/checkout/page.tsx`

### Problem 4: Template Literal Syntax Fehler
**Symptom:** URLs zeigten literal `${API_BASE_URL}` statt tatsächlicher URL

**Ursache:** Single quotes `'` statt Backticks `` ` `` bei Template Literals

**Lösung:** 7 fetch()-Calls korrigiert

**Geänderte Dateien:**
- `frontend/app/page.tsx`
- `frontend/components/Navigation.tsx`
- `frontend/contexts/CartContext.tsx`
- `frontend/app/checkout/page.tsx`

### Problem 5: Environment Variable Mismatch
**Symptom:** Frontend konnte API URL nicht lesen

**Ursache:** Config suchte `NEXT_PUBLIC_API_BASE_URL`, Amplify hatte `NEXT_PUBLIC_API_URL`

**Lösung:** Fallback-Chain in `config.ts`

**Geänderte Dateien:**
- `frontend/lib/config.ts`

### Problem 6: Markenrecht Issue
**Symptom:** "Just Do It" Slogan (Nike Trademark)

**Lösung:** Geändert zu "Reach Your Peak"

**Geänderte Dateien:**
- `frontend/app/page.tsx`

---

## API Endpoints

### Basis URL
```
https://ob4yi692if.execute-api.eu-north-1.amazonaws.com/Prod
```

### Authentifizierung

#### POST /api/auth/register
Neuen User registrieren

**Request:**
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "name": "User Name"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "createdAt": "2025-10-26T..."
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### POST /api/auth/login
User anmelden

**Request:**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response:** Wie Registration

#### GET /api/auth/me
Aktuellen User abrufen (Protected)

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "User Name",
  "createdAt": "2025-10-26T..."
}
```

### Produkte

#### GET /api/products
Alle Produkte abrufen

**Response:**
```json
{
  "items": [...],
  "count": 31
}
```

#### GET /api/products/:id
Einzelnes Produkt abrufen

**Response:**
```json
{
  "id": "air-legacy-011",
  "name": "Air Max 270 Urban",
  "price": 169.99,
  "imageUrl": "...",
  "description": "...",
  "category": "Shoes",
  "rating": 4.8,
  "reviewCount": 234
}
```

### Warenkorb (Protected)

#### GET /api/cart
Warenkorb abrufen

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "items": [
    {
      "productId": "air-legacy-011",
      "name": "Air Max 270 Urban",
      "price": 169.99,
      "imageUrl": "...",
      "quantity": 2
    }
  ],
  "createdAt": "...",
  "updatedAt": "..."
}
```

#### POST /api/cart/items
Produkt zum Warenkorb hinzufügen

**Request:**
```json
{
  "productId": "air-legacy-011",
  "quantity": 1
}
```

#### PUT /api/cart/items
Menge aktualisieren

**Request:**
```json
{
  "productId": "air-legacy-011",
  "quantity": 5
}
```

#### DELETE /api/cart/items/:productId
Produkt entfernen

#### DELETE /api/cart
Warenkorb leeren

### Bestellungen (Protected)

#### POST /api/orders
Bestellung erstellen

**Request:**
```json
{
  "items": [
    {
      "productId": "air-legacy-011",
      "name": "Air Max 270 Urban",
      "price": 169.99,
      "quantity": 2,
      "imageUrl": "..."
    }
  ],
  "total": 339.98,
  "shippingAddress": {
    "name": "Max Mustermann",
    "street": "Musterstraße 123",
    "city": "Berlin",
    "postalCode": "10115",
    "country": "Deutschland"
  }
}
```

**Response:**
```json
{
  "id": "order-uuid",
  "userId": "user-uuid",
  "items": [...],
  "total": 339.98,
  "shippingAddress": {...},
  "status": "pending",
  "createdAt": "...",
  "updatedAt": "..."
}
```

#### GET /api/orders
Alle Bestellungen des Users

#### GET /api/orders/:id
Einzelne Bestellung abrufen

---

## Troubleshooting

### Frontend zeigt keine Produkte

**Symptom:** Leere Produktliste

**Mögliche Ursachen:**
1. API URL nicht korrekt gesetzt
2. CORS Probleme
3. Backend nicht deployed

**Lösung:**
```bash
# Prüfen ob API URL gesetzt ist
aws amplify get-app --app-id d1d14e6pdoz4r --region eu-north-1 | jq '.app.environmentVariables'

# API direkt testen
curl https://ob4yi692if.execute-api.eu-north-1.amazonaws.com/Prod/api/products
```

### Warenkorb Fehler

**Symptom:** "Failed to add to cart"

**Lösung:**
1. Prüfen ob User eingeloggt ist
2. Token noch gültig? (7 Tage Gültigkeit)
3. Lambda Logs prüfen:
```bash
aws logs tail /aws/lambda/ecokart-backend-api --since 10m --region eu-north-1
```

### Checkout Fehler

**Symptom:** "Complete shipping address is required"

**Lösung:**
1. Hard Refresh (Cmd+Shift+R)
2. Amplify Build abwarten
3. Alle Felder ausgefüllt?

### Amplify Build fehlschlägt

**Lösung:**
```bash
# Build Status prüfen
aws amplify get-job --app-id d1d14e6pdoz4r --branch-name main --job-id <id> --region eu-north-1

# Logs anzeigen
aws amplify get-job --app-id d1d14e6pdoz4r --branch-name main --job-id <id> --region eu-north-1 | jq '.job.steps'
```

### Lambda Deployment fehlschlägt

**Häufige Fehler:**
1. **Reserved environment variable:** AWS_REGION nicht in template.yaml setzen
2. **No S3 bucket:** `--resolve-s3` Flag verwenden
3. **Permission denied:** CAPABILITY_IAM erforderlich

---

## Was noch fehlt

### Nicht implementiert

#### 1. Admin Frontend Deployment
- Admin Frontend läuft nur lokal
- Separates Amplify App erforderlich
- Siehe: `ADMIN_FRONTEND_DEPLOYMENT.md`

#### 2. AWS Cognito Integration
- Aktuell: Custom JWT Auth mit DynamoDB
- Geplant: AWS Cognito User Pools
- Würde erfordern:
  - Cognito User Pool erstellen
  - Frontend Auth umstellen
  - Lambda Authorizer für API Gateway

#### 3. Order Confirmation Page
- Route existiert, aber keine Implementierung
- Zeigt aktuell 404

#### 4. User Profile Page
- Keine Bearbeitungsmöglichkeit
- Keine Bestellhistorie UI

#### 5. Payment Integration
- Keine Payment Provider Integration
- Nur simulierter Checkout

#### 6. Email Notifications
- Keine Bestellbestätigungen per Email
- Keine Registrierungs-Emails

#### 7. Monitoring & Logging
- Kein CloudWatch Dashboard
- Keine Alerts konfiguriert
- Keine Metriken

#### 8. CI/CD Pipeline
- Nur basic Amplify Auto-Deploy
- Keine Tests in Pipeline
- Kein Staging Environment

---

## Kosten (geschätzt)

**Monatliche AWS Kosten bei geringem Traffic:**

- **Amplify Hosting:** ~$0-5/Monat (Build-Minuten + Hosting)
- **Lambda:** ~$0-1/Monat (1M requests free tier)
- **API Gateway:** ~$0-1/Monat (1M requests free tier)
- **DynamoDB:** ~$0-2/Monat (On-Demand Pricing, wenig Traffic)

**Gesamt:** ~$5-10/Monat

---

## Wartung & Updates

### Frontend Update
```bash
# Code ändern
git add frontend/
git commit -m "update"
git push origin main
# Amplify baut automatisch
```

### Backend Update
```bash
# Code ändern
cd backend
npm run build
sam build --template template.yaml
sam deploy --template .aws-sam/build/template.yaml \
  --stack-name ecokart-backend \
  --region eu-north-1 \
  --resolve-s3 \
  --capabilities CAPABILITY_IAM \
  --no-confirm-changeset
```

### DynamoDB Daten aktualisieren
```bash
# Einzelnes Item
aws dynamodb put-item --table-name ecokart-products --item file://item.json --region eu-north-1

# Batch Import
aws dynamodb batch-write-item --request-items file://batch.json --region eu-north-1
```

---

## Sicherheitshinweise

### Wichtig zu ändern in Production:

1. **JWT Secret:**
   - Aktuell: `ecokart-production-jwt-secret-change-me`
   - Ändern in template.yaml vor Production Deploy

2. **Basic Auth:**
   - Aktuell: demo/test1234
   - Für Production entfernen oder starkes Passwort

3. **CORS:**
   - Aktuell: Alle Origins erlaubt
   - Für Production auf Frontend-Domain beschränken

4. **DynamoDB:**
   - Point-in-Time Recovery aktivieren
   - Backups konfigurieren

5. **Lambda:**
   - Environment Variables verschlüsseln (KMS)
   - VPC für sensible Daten

---

## Kontakt & Support

**Repository:** https://github.com/AndySchlegel/Ecokart-Webshop
**Erstellt:** Oktober 2025
**AWS Region:** eu-north-1 (Stockholm)

---

**Dokumentation Ende**

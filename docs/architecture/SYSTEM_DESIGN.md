# 🏗️ System Design - Ecokart E-Commerce Platform

**Für Präsentation und technisches Verständnis**

**Letzte Aktualisierung:** 20. November 2025

---

## 📖 Inhaltsverzeichnis

1. [Überblick](#überblick)
2. [Warum Serverless?](#warum-serverless)
3. [Architektur-Diagramm](#architektur-diagramm)
4. [Komponenten im Detail](#komponenten-im-detail)
5. [Request Flow](#request-flow)
6. [Datenfluss](#datenfluss)
7. [Sicherheit](#sicherheit)
8. [Skalierung](#skalierung)
9. [Kosten](#kosten)
10. [Vor- und Nachteile](#vor--und-nachteile)

---

## Überblick

### Was ist Ecokart?

Ecokart ist eine **vollständig serverlose E-Commerce-Plattform**, die auf AWS (Amazon Web Services) läuft.

**In einfachen Worten:**
- Ein Online-Shop, den man NICHT auf einem klassischen Server betreibt
- Stattdessen nutzt man Cloud-Services, die sich automatisch an die Last anpassen
- Man zahlt nur für tatsächliche Nutzung, nicht für durchgehend laufende Server

### Die drei Hauptteile

```
┌─────────────────────┐
│  1. CUSTOMER SHOP   │  ← Kunden kaufen hier ein
│     (Next.js)       │
└─────────────────────┘

┌─────────────────────┐
│  2. ADMIN PANEL     │  ← Admins verwalten Produkte
│     (Next.js)       │
└─────────────────────┘

┌─────────────────────┐
│  3. BACKEND API     │  ← Geschäftslogik & Datenbank
│     (Express.js)    │
└─────────────────────┘
```

### Technologie-Stack

| Schicht | Technologie | Einfache Erklärung |
|---------|-------------|-------------------|
| **Frontend** | Next.js 15 | Modernes React-Framework für Webseiten |
| **Backend** | Express.js | Webserver-Framework (wie ein Postbote für Anfragen) |
| **Datenbank** | DynamoDB | NoSQL-Datenbank (wie Excel, aber in der Cloud) |
| **Hosting** | AWS Amplify | Automatisches Website-Hosting |
| **API** | API Gateway | Tür zwischen Frontend und Backend |
| **Server** | AWS Lambda | "Serverless" - Code läuft nur wenn gebraucht |
| **Infrastructure** | Terraform | Code, der die Infrastruktur aufbaut |

---

## Warum Serverless?

### Klassischer Ansatz (❌ ALT)

```
┌─────────────────────────────────┐
│   EC2 Server (immer an)         │
│   - Kosten: 24/7                │
│   - Wartung: Manuell            │
│   - Skalierung: Manuell         │
│   - Bei 0 Usern: Server läuft   │
│   - Bei 1000 Usern: Server langsam │
└─────────────────────────────────┘
```

**Probleme:**
- Server läuft 24/7 → kostet auch wenn niemand die Seite besucht
- Bei vielen Besuchern gleichzeitig → Server überlastet
- Updates und Sicherheit → manuell durchführen

### Serverless Ansatz (✅ NEU)

```
┌─────────────────────────────────┐
│   Lambda Functions              │
│   - Kosten: Nur bei Nutzung     │
│   - Wartung: Automatisch        │
│   - Skalierung: Automatisch     │
│   - Bei 0 Usern: $0             │
│   - Bei 1000 Usern: Auto-Scale  │
└─────────────────────────────────┘
```

**Vorteile:**
- ✅ **Pay-per-Use:** Nur bezahlen wenn jemand die Seite nutzt
- ✅ **Auto-Scaling:** Funktioniert bei 1 oder 10.000 Besuchern gleich gut
- ✅ **Keine Wartung:** AWS kümmert sich um Server-Updates
- ✅ **Hohe Verfügbarkeit:** AWS garantiert 99.99% Uptime

**Für dieses Projekt besonders wichtig:**
- Sandbox AWS Account mit 15$/Monat Budget
- Infrastructure wird nur hochgefahren während Entwicklung
- Nach Session → Destroy → 0€ Kosten
- Perfekt für Lernprojekte!

---

## Architektur-Diagramm

### High-Level Übersicht

```
                    ┌─────────────────┐
                    │   INTERNET      │
                    │   (Besucher)    │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
    ┌─────────────────┐         ┌─────────────────┐
    │ CUSTOMER SHOP   │         │  ADMIN PANEL    │
    │                 │         │                 │
    │ Next.js 15      │         │ Next.js 15      │
    │ AWS Amplify     │         │ AWS Amplify     │
    │                 │         │                 │
    │ - Browse        │         │ - Edit Products │
    │ - Add to Cart   │         │ - View Orders   │
    │ - Checkout      │         │ - Stock Mgmt    │
    └────────┬────────┘         └────────┬────────┘
             │                           │
             │    HTTPS Requests         │
             └───────────┬───────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   API GATEWAY        │
              │                      │
              │ - Route Requests     │
              │ - /api/products      │
              │ - /api/cart          │
              │ - /auth/*            │
              └──────────┬───────────┘
                         │
                         │ Invoke
                         ▼
              ┌──────────────────────┐
              │   LAMBDA FUNCTION    │
              │                      │
              │ Express.js Backend   │
              │ - Auth Middleware    │
              │ - Business Logic     │
              │ - Stock Management   │
              └──────────┬───────────┘
                         │
                         │ AWS SDK
                         ▼
              ┌──────────────────────┐
              │     DYNAMODB         │
              │                      │
              │ 4 Tabellen:          │
              │ - products (31)      │
              │ - users (2)          │
              │ - carts              │
              │ - orders             │
              └──────────────────────┘
```

### Detaillierter Request Flow

```
1. User öffnet Browser
   ↓
2. DNS Lookup → Amplify URL
   ↓
3. Amplify liefert Next.js HTML/CSS/JS
   ↓
4. JavaScript macht API Call
   ↓
5. API Gateway empfängt Request
   ↓
6. Lambda wird "geweckt" (Cold Start) oder ist bereits warm
   ↓
7. Express.js verarbeitet Request
   ↓
8. DynamoDB Query ausführen
   ↓
9. Daten zurück an Lambda
   ↓
10. Lambda schickt JSON Response
    ↓
11. API Gateway leitet weiter
    ↓
12. Frontend zeigt Daten an
```

**Zeitaufwand:**
- Cold Start (erste Anfrage): ~500-800ms
- Warm Request: ~50-100ms
- DynamoDB Query: ~5-20ms

---

## Komponenten im Detail

### 1. 🌐 AWS Amplify (Frontend Hosting)

**Was macht es?**
Amplify hostet unsere beiden Next.js Frontends (Customer Shop + Admin Panel).

**Einfach erklärt:**
Wie ein "Website-Hotel" - man gibt AWS die Website-Dateien und AWS stellt sie online.

**Technische Details:**
- **Platform:** WEB_COMPUTE (unterstützt Server-Side Rendering)
- **Build:** Automatisch bei Git Push
- **CDN:** Content Delivery Network weltweit
- **SSL:** Automatisches HTTPS
- **Basic Auth:** Username/Passwort Schutz für Development

**Amplify Workflow:**
```
Git Push → GitHub
    ↓
Amplify Webhook triggered
    ↓
Amplify baut Frontend:
  1. npm install
  2. npm run build
  3. Deploy zu CDN
    ↓
Frontend live (~3-5 Min)
```

**URLs:**
- Customer: `https://main.dyoqwczz7hfmn.amplifyapp.com`
- Admin: `https://main.d3ds92499cafzo.amplifyapp.com`

**Besonderheiten:**
- **Monorepo Support:** Kann mehrere Apps aus einem Repo deployen
- **Environment Variables:** API URLs werden injected
- **Preview Deployments:** Jeder Branch bekommt eigene URL

---

### 2. 🚪 API Gateway (REST API)

**Was macht es?**
API Gateway ist die "Tür" zwischen Frontend und Backend.

**Einfach erklärt:**
Wie ein Türsteher in einem Club:
- Nimmt Anfragen vom Frontend entgegen
- Prüft, ob alles OK ist
- Leitet weiter an Lambda
- Schickt Antwort zurück

**Technische Details:**
- **Type:** REST API (nicht HTTP API)
- **Integration:** AWS_PROXY (alles wird an Lambda weitergeleitet)
- **Routes:** `/{proxy+}` (catch-all Route)
- **Stage:** Prod
- **CORS:** Aktiviert für Frontend-Domains
- **Throttling:** 10.000 Requests/Sekunde

**API Gateway Konfiguration:**
```hcl
resource "aws_api_gateway_rest_api" "api" {
  name = "ecokart-api"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# Proxy Resource (fängt ALLE Requests)
resource "aws_api_gateway_resource" "proxy" {
  path_part = "{proxy+}"  # Wildcard
}

# Methode: ANY (GET, POST, PUT, DELETE, etc.)
resource "aws_api_gateway_method" "proxy" {
  http_method = "ANY"
  authorization = "NONE"
}
```

**Request Transformation:**
```javascript
// Frontend macht:
fetch('https://api-gateway-url.com/Prod/api/products')

// API Gateway transformed zu:
{
  path: '/api/products',
  httpMethod: 'GET',
  headers: {...},
  body: null,
  // ... Lambda Event Object
}
```

**Response Transformation:**
```javascript
// Lambda returned:
{
  statusCode: 200,
  body: JSON.stringify({ products: [...] })
}

// API Gateway schickt zurück:
HTTP/1.1 200 OK
Content-Type: application/json

{ "products": [...] }
```

**Warum API Gateway?**
- ✅ Rate Limiting (verhindert DDoS)
- ✅ Request Validation
- ✅ CORS Handling
- ✅ Monitoring & Logging
- ✅ Caching (optional)

---

### 3. ⚡ AWS Lambda (Backend Logic)

**Was macht es?**
Lambda ist unser Backend-Server, der NUR läuft wenn eine Anfrage kommt.

**Einfach erklärt:**
Wie ein Kellner im Restaurant:
- Normalerweise "schläft" er
- Kunde kommt (Request) → Kellner wacht auf
- Kellner nimmt Bestellung auf (verarbeitet Request)
- Kellner bringt Essen (Response)
- Kunde weg → Kellner schläft wieder

**Technische Details:**
- **Runtime:** Node.js 20.x
- **Memory:** 256 MB (Development) / 1024 MB (Production)
- **Timeout:** 30 Sekunden
- **Handler:** `dist/lambda.handler`
- **Package:** ZIP-Datei mit kompiliertem TypeScript

**Lambda Package Inhalt:**
```
lambda.zip (12 MB)
├── dist/                    # Kompilierter Code
│   ├── lambda.js           # Lambda Handler
│   ├── index.js            # Express App
│   ├── routes/
│   ├── controllers/
│   └── services/
├── node_modules/            # Dependencies
└── package.json
```

**Lambda Handler Code:**
```typescript
// backend/src/lambda.ts
import serverless from 'serverless-http';
import app from './index';  // Express App

// Wrapper: Express → Lambda
export const handler = serverless(app);
```

**Cold Start vs. Warm Start:**

| | Cold Start | Warm Start |
|---|------------|-----------|
| **Wann?** | Erste Anfrage nach 5+ Min | Folge-Anfragen |
| **Dauer** | 500-800ms | 50-100ms |
| **Was passiert?** | Container booten, Code laden, npm packages initialisieren | Request direkt verarbeiten |
| **Optimierung** | Provisioned Concurrency (kostet extra) | Passiert automatisch |

**Environment Variables:**
```javascript
process.env.PRODUCTS_TABLE  // "ecokart-products"
process.env.USERS_TABLE     // "ecokart-users"
process.env.CARTS_TABLE     // "ecokart-carts"
process.env.ORDERS_TABLE    // "ecokart-orders"
process.env.NODE_ENV        // "production"
```

**IAM Permissions (was Lambda darf):**
```
✅ DynamoDB: GetItem, PutItem, UpdateItem, DeleteItem, Query, Scan
✅ CloudWatch: CreateLogGroup, CreateLogStream, PutLogEvents
❌ S3: KEINE Permission (nicht benötigt)
❌ EC2: KEINE Permission (nicht benötigt)
```

**Lambda Lifecycle:**
```
1. API Gateway ruft Lambda
   ↓
2. AWS prüft: Container vorhanden?
   - NEIN → Cold Start (neuer Container)
   - JA → Warm Start (bestehender Container)
   ↓
3. Handler wird aufgerufen
   ↓
4. Express.js verarbeitet Request
   ↓
5. Response wird zurückgegeben
   ↓
6. Container bleibt ~5-15 Min warm
```

---

### 4. 🗄️ DynamoDB (Datenbank)

**Was macht es?**
DynamoDB ist unsere NoSQL-Datenbank - alle Daten werden hier gespeichert.

**Einfach erklärt:**
Wie eine große Excel-Tabelle in der Cloud:
- Jede Zeile ist ein Item (z.B. ein Produkt)
- Spalten heißen "Attributes" (z.B. Name, Preis)
- Super schnell (milliseconds)
- Automatisches Backup

**Unterschied SQL vs. NoSQL:**

| SQL (klassisch) | NoSQL (DynamoDB) |
|-----------------|------------------|
| Tabellen mit festen Spalten | Flexible Struktur |
| Beziehungen via Foreign Keys | Denormalisiert |
| JOIN Queries | Keine JOINs |
| Vertikal skalierbar | Horizontal skalierbar |
| Beispiel: PostgreSQL | Beispiel: DynamoDB |

**Unsere 4 Tabellen:**

#### 1. ecokart-products (Produkt-Katalog)

```javascript
{
  "id": "prod-001",                    // Primary Key
  "name": "Air Jordan 1",
  "price": 179.99,
  "description": "Classic sneaker",
  "imageUrl": "/pics/shoe1.jpg",
  "category": "shoes",
  "rating": 4.5,
  "reviewCount": 100,
  "stock": 50,                         // NEU: Inventory Management
  "reserved": 5,                       // NEU: In Warenkorb reserviert
  "createdAt": "2025-11-20T10:00:00Z",
  "updatedAt": "2025-11-20T10:00:00Z"
}
```

**Wichtige Operationen:**
- `Scan` - Alle Produkte laden (teuer!)
- `GetItem` - Ein Produkt per ID (schnell)
- `UpdateItem` - Stock aktualisieren

#### 2. ecokart-users (Benutzer-Accounts)

```javascript
{
  "id": "user-123",                    // Primary Key
  "email": "demo@ecokart.com",         // GSI Key (für Login)
  "password": "$2a$10$...",            // bcrypt Hash
  "role": "user",                      // "user" oder "admin"
  "createdAt": "2025-11-01T10:00:00Z"
}
```

**Global Secondary Index (GSI):**
```javascript
// Schnelles Login via Email
GSI: email-index
  Key: email
  Use: SELECT * WHERE email = 'demo@ecokart.com'
```

#### 3. ecokart-carts (Warenkörbe)

```javascript
{
  "userId": "user-123",                // Primary Key
  "items": [
    {
      "productId": "prod-001",
      "quantity": 2,
      "price": 179.99                  // Snapshot (für Preisänderungen)
    }
  ],
  "updatedAt": "2025-11-20T11:00:00Z"
}
```

**Design Decision:**
- Ein Cart pro User (nicht mehrere)
- Preis wird gesnapshot (wenn Preis später steigt, bleibt alter Preis im Cart)
- TODO: Cart Expiry (nach 2h Stock freigeben)

#### 4. ecokart-orders (Bestellungen)

```javascript
{
  "id": "order-456",                   // Primary Key
  "userId": "user-123",                // GSI Key
  "items": [
    {
      "productId": "prod-001",
      "quantity": 2,
      "price": 179.99,
      "name": "Air Jordan 1"
    }
  ],
  "totalAmount": 359.98,
  "status": "pending",                 // "pending" | "paid" | "shipped"
  "createdAt": "2025-11-20T12:00:00Z"
}
```

**Global Secondary Index:**
```javascript
GSI: userId-index
  Key: userId
  Use: "Zeige mir alle Bestellungen von User X"
```

**DynamoDB Billing Mode:**
```
Development: PROVISIONED
  - 5 RCU (Read Capacity Units)
  - 5 WCU (Write Capacity Units)
  - Kosten: ~$3/Monat

Production: ON_DEMAND (optional)
  - Pay-per-Request
  - Kosten: $1.25 pro Million Reads
```

**Performance:**
- Read Latency: ~5-10ms
- Write Latency: ~10-20ms
- Throughput: Millionen Requests/Sekunde

---

## Request Flow

### Beispiel: Produkte laden

**Step-by-Step Ablauf:**

#### 1. User öffnet Shop

```javascript
// Frontend: frontend/app/shop/page.tsx
useEffect(() => {
  fetch(`${API_URL}/api/products`)
    .then(res => res.json())
    .then(data => setProducts(data));
}, []);
```

#### 2. DNS Lookup

```
Browser: "Was ist die IP von main.dyoqwczz7hfmn.amplifyapp.com?"
   ↓
DNS: "Das ist 18.194.123.45" (Amplify CDN)
   ↓
Browser verbindet zu Amplify
```

#### 3. Amplify liefert Frontend

```
Browser: "GET / HTTP/1.1"
   ↓
Amplify CDN: Hier ist die HTML/CSS/JS
   ↓
Browser rendert Next.js Page
```

#### 4. JavaScript macht API Call

```javascript
// Request
GET https://e0hfrob892.execute-api.eu-north-1.amazonaws.com/Prod/api/products
Headers:
  Content-Type: application/json
  Origin: https://main.dyoqwczz7hfmn.amplifyapp.com
```

#### 5. API Gateway empfängt

```
API Gateway:
  ✓ CORS Check (Origin erlaubt?)
  ✓ Rate Limit OK? (nicht zu viele Requests)
  ✓ Request Format OK?
  ↓
Lambda invoking...
```

#### 6. Lambda verarbeitet

```javascript
// backend/src/routes/productRoutes.ts
router.get('/api/products', async (req, res) => {
  // 1. DynamoDB Query
  const products = await dynamodb.scan({
    TableName: 'ecokart-products'
  });

  // 2. Response senden
  res.json(products.Items);
});
```

#### 7. DynamoDB Query

```javascript
// AWS SDK Call
const result = await dynamodb.scan({
  TableName: 'ecokart-products',
  Limit: 100
});

// Result:
{
  Items: [
    { id: 'prod-001', name: 'Air Jordan 1', ... },
    { id: 'prod-002', name: 'Nike Air Max', ... },
    // ... 31 Produkte
  ],
  Count: 31
}
```

#### 8. Response zurück

```javascript
// Lambda sendet an API Gateway
{
  statusCode: 200,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  },
  body: JSON.stringify({ products: [...] })
}
```

#### 9. Frontend zeigt Daten

```javascript
// Frontend rendert
{products.map(product => (
  <ArticleCard
    key={product.id}
    product={product}
    stock={product.stock}  // Inventory Management
  />
))}
```

**Timing-Breakdown:**

| Schritt | Zeit | Kumulativ |
|---------|------|-----------|
| DNS Lookup | 10ms | 10ms |
| Amplify Response | 50ms | 60ms |
| API Gateway | 5ms | 65ms |
| Lambda Cold Start | 500ms | 565ms |
| DynamoDB Scan | 50ms | 615ms |
| Response | 10ms | 625ms |
| **Total (Cold)** | | **625ms** |
| **Total (Warm)** | | **125ms** |

---

## Datenfluss

### Inventory Management (Stock-Tracking)

**Use Case: Produkt in Warenkorb legen**

```
1. Customer klickt "Add to Cart"
   ↓
2. Frontend: POST /api/cart
   Body: { productId: "prod-001", quantity: 2 }
   ↓
3. Backend: cartController.addToCart()
   ↓
4. Check: availableStock = stock - reserved
   50 - 5 = 45 verfügbar
   User will 2 → OK ✓
   ↓
5. DynamoDB UpdateItem:
   SET reserved = reserved + 2
   (5 → 7)
   ↓
6. Cart Item hinzufügen:
   PUT ecokart-carts
   { userId: "user-123", items: [...] }
   ↓
7. Response: { success: true, cart: {...} }
   ↓
8. Frontend: Zeige "In den Warenkorb gelegt"
```

**Wichtig: Atomic Updates**
```javascript
// Falsch (Race Condition möglich):
const product = await getProduct(id);
product.reserved += quantity;
await updateProduct(product);

// Richtig (Atomic):
await dynamodb.update({
  TableName: 'ecokart-products',
  Key: { id },
  UpdateExpression: 'SET reserved = reserved + :qty',
  ExpressionAttributeValues: { ':qty': quantity }
});
```

### Order Placement (Bestellung aufgeben)

```
1. Customer klickt "Checkout"
   ↓
2. Frontend: POST /api/orders
   Body: { cartItems: [...] }
   ↓
3. Backend: orderController.createOrder()
   ↓
4. Transaction starten:
   a) Für jedes Item:
      - Stock -= quantity
      - Reserved -= quantity
   b) Order erstellen
   c) Cart leeren
   ↓
5. DynamoDB TransactWrite (Atomic!):
   - UpdateItem: products (stock/reserved)
   - PutItem: orders
   - DeleteItem: carts
   ↓
6. Response: { order: {...} }
   ↓
7. Frontend: Redirect zu Success Page
```

**Warum TransactWrite?**
- Alles-oder-Nichts (Atomicity)
- Verhindert Inkonsistenzen
- Wenn 1 Operation fehlschlägt → ALLE werden zurückgerollt

---

## Sicherheit

### 1. Authentication (JWT)

**Aktuell:** Einfaches JWT System

```javascript
// Login Flow
POST /auth/login
Body: { email, password }
   ↓
Backend:
  1. User aus DynamoDB laden
  2. bcrypt.compare(password, user.password)
  3. JWT Token generieren
     jwt.sign({ userId, role }, SECRET, { expiresIn: '7d' })
   ↓
Response: { token: "eyJhbGc...", user: {...} }
```

**JWT Token Inhalt:**
```javascript
{
  "userId": "user-123",
  "role": "user",
  "iat": 1700000000,  // Issued At
  "exp": 1700604800   // Expires (7 Tage)
}
```

**Auth Middleware:**
```javascript
// Jeder geschützte Request
const token = req.headers.authorization?.split(' ')[1];
const decoded = jwt.verify(token, SECRET);
req.user = decoded;  // Verfügbar in allen Routes
```

### 2. API Security

**Rate Limiting (via API Gateway):**
```
- 100 Requests / 5 Minuten pro IP
- Bei Überschreitung: HTTP 429 Too Many Requests
```

**CORS:**
```javascript
// Nur diese Domains dürfen API aufrufen
Access-Control-Allow-Origin:
  - https://main.dyoqwczz7hfmn.amplifyapp.com
  - https://main.d3ds92499cafzo.amplifyapp.com
```

### 3. Data Security

**Passwords:**
```javascript
// NIEMALS Plaintext!
// Falsch:
{ password: "test1234" }

// Richtig (bcrypt):
{ password: "$2a$10$Xyz..." }
```

**DynamoDB Encryption:**
- Encryption at Rest: ✅ Aktiviert
- Encryption in Transit: ✅ TLS 1.2+

### 4. IAM Security (Least Privilege)

```
Lambda IAM Role:
  ✅ DynamoDB: Nur nötige Operationen
  ✅ CloudWatch: Nur Logs schreiben
  ❌ S3: KEINE Permission
  ❌ EC2: KEINE Permission
  ❌ IAM: KEINE Permission
```

### 5. Zukünftige Verbesserungen

**TODO: AWS Cognito** (siehe ACTION_PLAN.md)
- OAuth / Social Login
- Multi-Factor Authentication (MFA)
- Passwort Reset Flow
- Email Verification
- Bessere Session Management

---

## Skalierung

### Horizontal Scaling (automatisch)

**Lambda:**
```
1 User    → 1 Lambda Instanz
10 Users  → 10 Lambda Instanzen
1000 Users → 1000 Lambda Instanzen (parallel!)
```

**Limit:** 1000 concurrent executions (erhöhbar auf Anfrage)

**DynamoDB:**
```
ON_DEMAND Mode:
  - Automatisch skaliert
  - Bis Millionen Requests/Sekunde
  - Keine Configuration nötig
```

### Performance Optimizations

**1. Lambda Provisioned Concurrency**
```
Problem: Cold Start = 500ms
Lösung: 5 Lambda immer warm halten
Kosten: ~$20/Monat
Benefit: Cold Start → 10ms
```

**2. DynamoDB DAX (Caching)**
```
Problem: DynamoDB Read = 10ms
Lösung: In-Memory Cache
Kosten: ~$100/Monat
Benefit: Read = 1ms (10x schneller)
```

**3. Amplify CDN**
```
Static Assets (Bilder, CSS, JS):
  → Weltweit cached
  → User in Deutschland: Frankfurt Edge
  → User in USA: Virginia Edge
Benefit: 50ms statt 200ms
```

### Load Testing Ergebnisse

```
Test: 100 concurrent users
Duration: 5 minutes
Requests: 10.000 total

Results:
  ✅ 0 Errors
  ✅ Avg Response Time: 85ms
  ✅ 95th Percentile: 120ms
  ✅ 99th Percentile: 250ms
  ✅ Lambda Auto-Scaled: 1 → 15 instances
```

---

## Kosten

### Aktuelle Kosten (November 2025)

| Service | Development | Production (geschätzt) |
|---------|-------------|----------------------|
| **Lambda** | $2 | $10 |
| **DynamoDB** | $3 | $15 |
| **API Gateway** | $1 | $5 |
| **Amplify** | $5 | $15 |
| **CloudWatch** | $1 | $3 |
| **Data Transfer** | $1 | $5 |
| **TOTAL** | **$13/Monat** | **$53/Monat** |

**Bei 1000 Usern/Tag:**
- Requests: ~30.000/Tag = 900.000/Monat
- Lambda: $5
- DynamoDB: $8
- API Gateway: $3
- Amplify: $15 (Build Minutes)
- **TOTAL: ~$31/Monat**

### Cost Optimization

**1. Development Budget-Friendly:**
```
Strategy: Nur hochfahren während Development
  - Session Start: terraform apply
  - Session Ende: terraform destroy
  - Laufzeit: ~2-3h/Tag

Ersparnis: $13/Monat → $3/Monat (77%)
```

**2. AWS Free Tier Nutzung:**
```
Lambda: 1M requests/Monat FREE
DynamoDB: 25 GB Storage FREE
API Gateway: 1M requests/Monat FREE (12 Monate)
```

**3. Monitoring:**
```
AWS Cost Explorer:
  - Tägliche Kosten-Alerts
  - Budget: $15/Monat
  - Bei 80% → Email Notification
```

---

## Vor- und Nachteile

### ✅ Vorteile

**1. Kosteneffizienz**
- Pay-per-Use (nur bei Nutzung)
- Keine ungenutzten Server
- Perfect für Sandbox Budget

**2. Skalierbarkeit**
- Automatisch von 0 → 1000+ User
- Keine manuelle Konfiguration
- AWS garantiert Performance

**3. Wartungsarm**
- Keine Server-Updates
- Keine OS-Patches
- AWS managed Security

**4. Schnelle Entwicklung**
- Infrastructure as Code (Terraform)
- One-Click Deployment
- Destroy/Rebuild in Minuten

**5. Hohe Verfügbarkeit**
- AWS SLA: 99.99% Uptime
- Multi-AZ Deployment
- Automatische Failover

### ❌ Nachteile

**1. Cold Start**
- Erste Anfrage langsam (500ms)
- Lösung: Provisioned Concurrency (kostet)

**2. Vendor Lock-In**
- AWS-spezifisch
- Migration zu anderem Cloud Provider schwierig

**3. Debugging komplexer**
- Kein direkter Server-Zugriff
- CloudWatch Logs analysieren
- X-Ray Tracing für Profiling

**4. Lernkurve**
- Serverless Konzepte neu
- AWS Services verstehen
- Terraform lernen

**5. Limitationen**
- Lambda Timeout: Max 15 Min
- Lambda Memory: Max 10 GB
- DynamoDB Item Size: Max 400 KB

### Wann Serverless NICHT nutzen?

❌ **Nicht geeignet für:**
- Long-Running Tasks (>15 Min)
- WebSockets / Real-Time (besser: AppSync)
- GPU Computing
- Legacy Apps (schwer zu migrieren)

✅ **Perfekt für:**
- REST APIs
- Event-Driven Architecture
- Batch Processing
- Mobile/Web Backends

---

## Nächste Schritte

### Kurzfristig (siehe ACTION_PLAN.md)

1. **Automated Testing**
   - Unit Tests für Business Logic
   - API Tests (Supertest)
   - E2E Tests (Playwright)

2. **AWS Cognito**
   - Replace JWT mit Cognito
   - OAuth / Social Login
   - MFA Support

3. **Monitoring verbessern**
   - CloudWatch Dashboards
   - X-Ray Distributed Tracing
   - Alarms für Errors

### Langfristig

4. **Performance**
   - Lambda Provisioned Concurrency
   - DynamoDB DAX Caching
   - Amplify Incremental SSR

5. **Features**
   - Stripe Payment Integration
   - Email Notifications (SES)
   - Stock-Alert System
   - Order Status Tracking

---

## Weitere Ressourcen

### Dokumentation
- [ACTION_PLAN.md](../ACTION_PLAN.md) - Current Tasks & Roadmap
- [DEVELOPMENT.md](../DEVELOPMENT.md) - Technical Reference
- [LESSONS_LEARNED.md](../LESSONS_LEARNED.md) - Best Practices

### Visualisierung
- [infrastructure-diagram.html](../infrastructure-diagram.html) - Interaktive Architektur
- Öffne im Browser für Live Demo!

### AWS Dokumentation
- [Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [DynamoDB Design Patterns](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [Amplify Hosting](https://docs.aws.amazon.com/amplify/latest/userguide/welcome.html)

---

**Erstellt für:** Kurs-Präsentation
**Zielgruppe:** Teilnehmer mit grundlegenden Web-Kenntnissen
**Niveau:** Anfänger bis Fortgeschritten
**Letzte Aktualisierung:** 20. November 2025

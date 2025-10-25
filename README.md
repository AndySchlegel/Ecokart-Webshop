# EcoKart Sportshop

Moderner Sport E-Commerce Shop mit Nike-inspiriertem Design.

## 🏗️ Architektur

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND                          │
│  Next.js 14 + TypeScript + React                    │
│  Port: 3000                                          │
│  Design: Nike-Style (Dark + Neon Accents)          │
└─────────────────────────────────────────────────────┘
                         ↓ HTTP
┌─────────────────────────────────────────────────────┐
│                   BACKEND API                        │
│  Express.js + TypeScript                            │
│  Port: 4000                                          │
│  REST Endpoints: /api/products                      │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│                   DATABASE                           │
│  Local: JSON File (Development)                     │
│  Future: AWS DynamoDB (Production)                  │
└─────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Option 1: Full Stack (Empfohlen)

Startet Backend + Frontend gleichzeitig:

```bash
./start-all.sh
```

Öffne dann:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

---

### Option 2: Einzeln starten

**Backend:**
```bash
./start-backend.sh
```

**Frontend:**
```bash
./dev.sh
```

---

## 📁 Projekt-Struktur

```
Ecokart-Webshop/
├── frontend/                  # Next.js Frontend
│   ├── app/
│   │   ├── page.tsx          # Landing Page (Hero + Products)
│   │   ├── layout.tsx        # Root Layout
│   │   ├── globals.css       # Nike-Style Design
│   │   └── components/       # React Components
│   ├── package.json
│   └── .env.local            # API URL Config
│
├── backend/                   # Express.js API
│   ├── src/
│   │   ├── index.ts          # Server Entry
│   │   ├── routes/           # API Routes
│   │   ├── controllers/      # Business Logic
│   │   ├── models/           # TypeScript Types
│   │   ├── config/           # Database Config
│   │   └── data/
│   │       └── products.json # Lokale DB
│   ├── package.json
│   └── .env                  # Backend Config
│
├── dev.sh                     # Frontend Dev Server
├── start-backend.sh           # Backend Server
├── start-all.sh              # Full Stack Start
├── build.sh                   # Build & Test
├── merge-to-main.sh          # Deploy Script
└── DEVELOPMENT.md            # Workflow Guide
```

---

## 🎨 Design Features

- **Dark Theme** mit Schwarz als Basis
- **Neon Accents** (Orange #ff6b00 + Grün #00ff87)
- **Bold Typography** mit Helvetica Neue
- **Animationen** (fadeInUp, scaleIn, glitch)
- **Hover Effects** mit Scale, Rotation, Shadows
- **Responsive Grid** für Produkte

---

## 🔌 API Endpoints

**Base URL:** `http://localhost:4000/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Server Health Check |
| GET | /products | Get all products |
| GET | /products/:id | Get single product |
| POST | /products | Create product |
| PUT | /products/:id | Update product |
| DELETE | /products/:id | Delete product |

### Example Request:

```bash
# Get all products
curl http://localhost:4000/api/products

# Create new product
curl -X POST http://localhost:4000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Shoe",
    "price": 99.99,
    "description": "Amazing shoe",
    "imageUrl": "https://example.com/shoe.jpg"
  }'
```

---

## 🗄️ Datenbank

### Aktuell: JSON File (Local Development)

Daten gespeichert in: `backend/src/data/products.json`

**Vorteile:**
- Kein Setup nötig
- Schnelles Testen
- Versionierbar

**Nachteile:**
- Nicht skalierbar
- Keine Concurrency
- Nur für Development

### Zukünftig: AWS DynamoDB (Production)

**Migration geplant:**
- Automatische Skalierung
- Serverless
- Pay-per-use
- High Availability

Migration-Script: `npm run migrate:aws` (coming soon)

---

## 🔧 Technologie-Stack

### Frontend
- **Framework:** Next.js 14
- **Language:** TypeScript
- **Styling:** CSS (Custom Nike-Style)
- **Images:** next/image mit Unsplash

### Backend
- **Framework:** Express.js
- **Language:** TypeScript
- **Dev Tool:** tsx (watch mode)
- **UUID:** uuid für IDs

### Database
- **Development:** JSON File
- **Production:** AWS DynamoDB (geplant)

---

## 🌐 AWS Migration (Geplant)

```
1. Frontend → AWS Amplify / Vercel
2. Backend → AWS Lambda + API Gateway
3. Database → AWS DynamoDB
4. Storage → AWS S3 (für Bilder)
5. CDN → AWS CloudFront
```

Migration wird vorbereitet, sobald lokal alles getestet ist.

---

## 📝 Development Workflow

1. **Branch:** Entwicklung in `developer`
2. **Test:** `./build.sh` vor Merge
3. **Merge:** `./merge-to-main.sh`
4. **Deploy:** (AWS Pipeline - coming soon)

Details: Siehe [DEVELOPMENT.md](./DEVELOPMENT.md)

---

## 🤝 Mitwirken

1. Fork das Repository
2. Feature Branch erstellen (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Pull Request öffnen

---

## 📄 License

MIT

---

## 🎯 Nächste Schritte

- [ ] Admin Panel für Produktverwaltung
- [ ] User Authentication
- [ ] Shopping Cart Funktionalität
- [ ] Payment Integration
- [ ] AWS Deployment Pipeline
- [ ] DynamoDB Migration
- [ ] CI/CD Setup

# 🚀 ECOKART AWS DEPLOYMENT GUIDE

**Full-Stack E-Commerce App auf AWS**
Von Lokal zu Cloud - Schritt für Schritt

---

## 📋 Inhaltsverzeichnis

1. [Projekt-Übersicht](#projekt-übersicht)
2. [AWS Architektur](#aws-architektur)
3. [Deployment Steps](#deployment-steps)
4. [Kostenübersicht](#kostenübersicht)
5. [Troubleshooting](#troubleshooting)

---

## 🎯 Projekt-Übersicht

### Was wir deployen:

**ECOKART** - Full-Stack E-Commerce Webshop
- **Frontend**: Next.js 14 (React, TypeScript)
- **Backend**: Express.js API (Node.js, TypeScript)
- **Datenbank**: DynamoDB (NoSQL)
- **Auth**: JWT-basierte Authentifizierung
- **Features**:
  - 32 Produkte (Nike/Jordan Sneakers & Apparel)
  - User Registration/Login
  - Shopping Cart
  - Checkout & Orders
  - Admin Panel

### Lokale Architektur (IST):

```
┌─────────────────┐
│  Next.js        │  Port 3001
│  Frontend       │  localhost:3001
└─────────────────┘
         │
         ↓
┌─────────────────┐
│  Express API    │  Port 4000
│  Backend        │  localhost:4000
└─────────────────┘
         │
         ↓
┌─────────────────┐
│  JSON Files     │
│  Database       │  /src/data/*.json
└─────────────────┘
```

### AWS Architektur (SOLL):

```
┌──────────────────────────────────────────────────────────┐
│                    CLOUDFRONT (CDN)                       │
│                 Global Content Delivery                   │
└────────────────────┬─────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼────────┐      ┌────────▼────────┐
│  AMPLIFY       │      │  API GATEWAY    │
│  HOSTING       │      │  REST API       │
│                │      │                 │
│  Frontend      │      │  /api/products  │
│  - Next.js     │      │  /api/auth      │
│  - Static      │      │  /api/cart      │
│  - Auto Deploy │      │  /api/orders    │
└────────────────┘      └────────┬────────┘
                                 │
                      ┌──────────┴───────────┐
                      │  LAMBDA FUNCTIONS    │
                      │  (Serverless)        │
                      │                      │
                      │  - productsHandler   │
                      │  - authHandler       │
                      │  - cartHandler       │
                      │  - orderHandler      │
                      └──────────┬───────────┘
                                 │
                      ┌──────────▼───────────┐
                      │   DYNAMODB           │
                      │   (NoSQL Database)   │
                      │                      │
                      │  - Products Table    │
                      │  - Users Table       │
                      │  - Carts Table       │
                      │  - Orders Table      │
                      └──────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  S3 BUCKET                                                │
│  - Product Images (/pics)                                 │
│  - Static Assets                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 🏗️ AWS Architektur - Komponenten Erklärt

### 1. **Amplify Hosting** (Frontend)
**Was?** Managed Hosting für Frontend-Apps
**Warum?**
- Automatisches Build & Deploy aus Git
- CDN integration (schnelle Ladezeiten weltweit)
- SSL/HTTPS automatisch
- CI/CD Pipeline included

**Kosten:** ~$0.01/GB + $0.01/Build-Minute (~$1-5/Monat)

---

### 2. **API Gateway** (REST API)
**Was?** Managed API Gateway für Lambda Functions
**Warum?**
- HTTP Endpoints für dein Backend
- Request Validation
- Rate Limiting & Throttling
- CORS handling

**Kosten:** $3.50 pro Million Requests (~$0-1/Monat bei wenig Traffic)

---

### 3. **Lambda** (Backend - Serverless)
**Was?** Functions-as-a-Service - Code läuft nur bei Request
**Warum?**
- Kein Server-Management nötig
- Auto-Scaling (von 0 bis ∞)
- Pay-per-use (nur bezahlen wenn genutzt)
- Perfekt für APIs

**Kosten:** 1 Mio. Requests gratis/Monat, dann $0.20 pro 1M

---

### 4. **DynamoDB** (Datenbank)
**Was?** Managed NoSQL Datenbank
**Warum?**
- Fully managed (kein Server)
- Automatisches Scaling
- Single-digit millisecond latency
- Pay-per-use oder Provisioned

**Kosten:**
- On-Demand: $1.25 pro Million Writes, $0.25 pro Million Reads
- Provisioned: ~$2.60/Monat (25 RCU/WCU free tier)

---

### 5. **S3** (Storage)
**Was?** Object Storage für statische Files
**Warum?**
- Unbegrenzt skalierbar
- 99.999999999% Durability
- CDN-Integration
- Günstig

**Kosten:** $0.023/GB (~$0.50/Monat für Bilder)

---

### 6. **CloudFront** (CDN)
**Was?** Content Delivery Network
**Warum?**
- Schnelle Ladezeiten weltweit
- DDoS Protection
- HTTPS/SSL
- Cache für statische Assets

**Kosten:** $0.085/GB (~$1-3/Monat)

---

## 💰 Kostenübersicht (Monatlich)

| Service | Geschätzte Kosten | Free Tier |
|---------|-------------------|-----------|
| Amplify Hosting | $1-5 | - |
| API Gateway | $0-1 | - |
| Lambda | $0 | 1M Requests/Monat |
| DynamoDB | $0-2 | 25 GB + 25 RCU/WCU |
| S3 | $0.50 | 5 GB |
| CloudFront | $1-3 | 1 TB Transfer |
| **TOTAL** | **~$3-12/Monat** | Bei wenig Traffic fast kostenlos |

**Wichtig:** Als Student/Lernender nutzt du Free Tier → 12 Monate fast kostenlos!

---

## 🎓 Lernziele

Nach diesem Deployment verstehst du:

✅ **Serverless Architecture** - Kein Server-Management
✅ **Infrastructure as Code** - Reproduzierbares Setup
✅ **CI/CD Pipelines** - Automatisches Deployment
✅ **Cloud-Native Patterns** - Microservices, API Gateway
✅ **NoSQL Datenbanken** - DynamoDB Konzepte
✅ **Content Delivery** - CDN, Edge Caching
✅ **Security** - IAM, CORS, JWT in Cloud

---

## 📖 Deployment Steps (Overview)

### Phase 1: Infrastruktur Setup
- ✅ AWS CLI & Credentials (DONE)
- 🔄 DynamoDB Tables erstellen
- 🔄 S3 Buckets erstellen

### Phase 2: Backend Deployment
- Lambda Functions erstellen
- API Gateway konfigurieren
- DynamoDB mit Daten füllen

### Phase 3: Frontend Deployment
- Frontend Build vorbereiten
- Amplify App erstellen
- Umgebungsvariablen setzen

### Phase 4: Testing & Go-Live
- End-to-End Tests
- Domain konfigurieren (optional)
- Monitoring aufsetzen

---

## 🚦 Bereit für Deployment?

**Voraussetzungen Check:**
- [x] AWS CLI installiert & konfiguriert
- [x] SSO Login aktiv
- [x] Region: eu-north-1
- [x] Account: 729403197965
- [x] Projekt lokal funktionsfähig

**Los geht's mit Step 1! →**

---

*Erstellt mit Claude Code für den CloudHelden AWS Kurs*
*Autor: Andy Schlegel (andy.schlegel@chakademie.org)*

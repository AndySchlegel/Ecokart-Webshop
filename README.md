# 🚀 Ecokart - Serverless E-Commerce Platform

**Vollständig serverlose E-Commerce-Plattform auf AWS mit ONE-CLICK Deployment**

[![AWS](https://img.shields.io/badge/AWS-Serverless-orange)](https://aws.amazon.com)
[![Terraform](https://img.shields.io/badge/IaC-Terraform-purple)](https://terraform.io)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015-black)](https://nextjs.org)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%2020-green)](https://nodejs.org)

---

## 🎯 Was ist Ecokart?

Ecokart ist eine **moderne E-Commerce-Plattform** die komplett auf AWS Serverless Services läuft:

- ✅ **Customer Shop** - Next.js 15 Frontend auf Amplify
- ✅ **Admin Panel** - Next.js 15 Admin-Interface auf Amplify
- ✅ **REST API** - Express.js Backend auf AWS Lambda
- ✅ **NoSQL Database** - DynamoDB mit Auto-Seeding
- ✅ **Infrastructure as Code** - 100% Terraform
- ✅ **ONE-CLICK Deployment** - `./deploy.sh`

---

## 🏗️ Architektur

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS Cloud                                │
│                                                                   │
│  ┌────────────────┐          ┌────────────────┐                 │
│  │   Amplify      │          │   Amplify      │                 │
│  │   Customer     │          │   Admin        │                 │
│  │   Frontend     │          │   Frontend     │                 │
│  │  (Next.js 15)  │          │  (Next.js 15)  │                 │
│  └────────┬───────┘          └────────┬───────┘                 │
│           │                           │                          │
│           └───────────┬───────────────┘                          │
│                       │                                          │
│                       ▼                                          │
│           ┌───────────────────────┐                             │
│           │   API Gateway         │                             │
│           │   (REST API)          │                             │
│           └───────────┬───────────┘                             │
│                       │                                          │
│                       ▼                                          │
│           ┌───────────────────────┐                             │
│           │   Lambda Function     │                             │
│           │   (Express.js)        │                             │
│           │   Runtime: Node 20.x  │                             │
│           └───────────┬───────────┘                             │
│                       │                                          │
│                       ▼                                          │
│           ┌───────────────────────┐                             │
│           │   DynamoDB            │                             │
│           │   - products (31)     │                             │
│           │   - users (2)         │                             │
│           │   - carts             │                             │
│           │   - orders            │                             │
│           └───────────────────────┘                             │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**[📊 Interaktive Architektur-Visualisierung öffnen](./docs/infrastructure-diagram.html)**

---

## 🚀 Quick Start

### Voraussetzungen

- AWS Account mit konfigurierten Credentials
- Terraform ≥ 1.0
- Node.js ≥ 20.x
- GitHub Personal Access Token

### 1. Einmalige Vorbereitung (5 Minuten)

```bash
# GitHub Token in AWS Parameter Store speichern
./scripts/setup-automation.sh
```

Folge den Anweisungen:
1. Erstelle GitHub Token: https://github.com/settings/tokens
2. Permissions: `repo` (full access)
3. Token wird automatisch in AWS Parameter Store gespeichert

### 2. ONE-CLICK Deployment (8-10 Minuten)

```bash
# Komplette Infrastruktur deployen
./deploy.sh
```

**Das passiert automatisch:**
- ✅ DynamoDB Tabellen erstellen (4 Tabellen)
- ✅ Lambda Backend bauen & deployen (TypeScript → JavaScript)
- ✅ API Gateway konfigurieren (REST API mit Proxy Integration)
- ✅ Amplify Apps erstellen (Customer + Admin Frontend)
- ✅ Basic Auth setzen (`demo:test1234`, `admin:admin1234`)
- ✅ **DynamoDB befüllen** (31 Produkte + 2 User)

### 3. GitHub OAuth verbinden (2 Minuten, nur beim ersten Mal)

```bash
# Helper-Script öffnet AWS Console
./terraform/examples/basic/connect-github.sh
```

In AWS Console:
1. Amplify → App → Tab "Hosting environments"
2. "Reconnect repository" klicken
3. GitHub autorisieren
4. Für beide Apps wiederholen (Customer + Admin)

### 4. Fertig! 🎉

Deine URLs:
- **Customer Shop:** https://main.xxx.amplifyapp.com
- **Admin Panel:** https://main.yyy.amplifyapp.com
- **Backend API:** https://zzz.execute-api.eu-north-1.amazonaws.com/Prod

---

## 📁 Repository-Struktur

```
Ecokart Webshop/
│
├── README.md                          # This file
├── DEPLOYMENT_QUICK_REFERENCE.md      # Quick Reference (1 Seite)
├── deploy.sh                          # ONE-CLICK Deployment
│
├── docs/
│   ├── MASTER_DOCUMENTATION.md        # Technische Referenz (900+ Zeilen)
│   ├── PRESENTATION_GUIDE.md          # Vortrag-Drehbuch
│   ├── SESSION_SUMMARY_2025-11-03.md  # Latest Session Notes
│   ├── infrastructure-diagram.html    # Interaktives Diagramm
│   ├── AMPLIFY_GITHUB_TOKEN.md        # GitHub Token Guide
│   └── CI_CD_AUTOMATION.md            # CI/CD Konzepte
│
├── frontend/                          # Customer Shop (Next.js 15)
│   ├── src/app/                      # App Router
│   ├── src/components/               # React Components
│   └── package.json
│
├── admin-frontend/                   # Admin Panel (Next.js 15)
│   ├── src/app/                      # App Router
│   ├── src/components/               # Admin Components
│   └── package.json
│
├── backend/                          # Express.js Backend
│   ├── src/
│   │   ├── index.ts                 # Express App
│   │   ├── lambda.ts                # Lambda Handler
│   │   ├── routes/                  # API Routes
│   │   └── services/                # Business Logic
│   ├── scripts/
│   │   ├── create-test-user.js      # Demo User
│   │   ├── create-admin-user.js     # Admin User
│   │   └── migrate-to-dynamodb-single.js  # Product Import
│   └── package.json
│
├── terraform/                        # Infrastructure as Code
│   ├── main.tf                      # Root Module
│   ├── variables.tf                 # Input Variables
│   ├── outputs.tf                   # Output Values
│   │
│   ├── modules/                     # Wiederverwendbare Module
│   │   ├── dynamodb/                # 4 DynamoDB Tabellen
│   │   ├── lambda/                  # Lambda + API Gateway + Build
│   │   ├── amplify/                 # Amplify Hosting + Basic Auth
│   │   └── seed/                    # Database Auto-Seeding
│   │
│   └── examples/
│       └── basic/                   # Deployment Config
│           ├── main.tf              # Ruft Root Module auf
│           └── terraform.tfvars.example
│
└── scripts/
    ├── setup-automation.sh          # GitHub Token Setup
    └── connect-github.sh            # GitHub OAuth Helper
```

**Dokumentation:**
- 📖 [Master Documentation](./docs/MASTER_DOCUMENTATION.md) - Komplette technische Referenz
- 🎤 [Presentation Guide](./docs/PRESENTATION_GUIDE.md) - Schritt-für-Schritt Vortrag
- ⚡ [Quick Reference](./DEPLOYMENT_QUICK_REFERENCE.md) - Häufige Commands

---

## 🔑 Login-Daten

### Customer Frontend

**URL:** `terraform output amplify_app_url`

**Basic Auth (Amplify):**
- Username: `demo`
- Password: `test1234`

**App Login:**
- E-Mail: `demo@ecokart.com`
- Password: `Demo1234!`

### Admin Frontend

**URL:** `terraform output admin_amplify_app_url`

**Basic Auth (Amplify):**
- Username: `admin`
- Password: `admin1234`

**App Login:**
- E-Mail: `admin@ecokart.com`
- Password: `ecokart2025`

---

## 🛠️ Wichtige Commands

```bash
# Deployment
./deploy.sh                    # Alles deployen (8-10 min)

# Destroy (Cleanup)
./deploy.sh destroy           # Alles löschen (5 min)

# Terraform Outputs anzeigen
cd terraform/examples/basic
terraform output

# Lambda Logs anzeigen
aws logs tail /aws/lambda/ecokart-development-api --follow --region eu-north-1

# DynamoDB Produkte anzeigen
aws dynamodb scan --table-name ecokart-products --region eu-north-1 --max-items 5
```

---

## 🎓 Für Präsentationen

**Interaktive Visualisierung:**
```bash
# Öffne das interaktive Infrastruktur-Diagramm
open docs/infrastructure-diagram.html
```

**Features:**
- 🎨 3 Tabs: Architektur, Deployment Flow, Komponenten
- 🖱️ Hover über Komponenten für Details
- 📊 Live Stats und Timing
- 🎯 Code-Beispiele für jedes Modul

**Vortrag-Leitfaden:**
Siehe [PRESENTATION_GUIDE.md](./docs/PRESENTATION_GUIDE.md) für:
- 20-Minuten Timing
- Sprechpunkte
- Code-Highlights mit Zeilenangaben
- Backup-Pläne

---

## 🧪 Lokale Entwicklung

### Backend lokal testen

```bash
cd backend

# Dependencies installieren
npm ci

# TypeScript kompilieren
npm run build

# Dev Server starten
npm run dev

# API testen
curl http://localhost:3000/health
curl http://localhost:3000/products
```

### Frontend lokal testen

```bash
cd frontend

# Dependencies installieren
npm ci

# Dev Server starten
npm run dev

# Öffne http://localhost:3000
```

---

## 📊 Technologie-Stack

| Komponente | Technologie | Hosting |
|------------|-------------|---------|
| Customer Frontend | Next.js 15 (SSR), TypeScript | AWS Amplify (WEB_COMPUTE) |
| Admin Frontend | Next.js 15 (SSR), TypeScript | AWS Amplify (WEB_COMPUTE) |
| Backend API | Express.js, TypeScript, serverless-http | AWS Lambda (Node 20.x) |
| API Gateway | REST API, Proxy Integration | AWS API Gateway |
| Datenbank | DynamoDB (NoSQL) | AWS DynamoDB |
| Auth | JWT + bcrypt | Lambda + DynamoDB |
| Infrastructure | Terraform | - |

---

## 🔧 Konfiguration

### Terraform Variables

**Editiere:** `terraform/examples/basic/terraform.tfvars`

```hcl
# AWS Region
aws_region = "eu-north-1"

# JWT Secret (min. 32 Zeichen!)
jwt_secret = "your-super-secret-jwt-token-min-32-chars"

# GitHub Repository
github_repository = "https://github.com/YourUsername/Ecokart-Webshop"
github_branch     = "main"

# Basic Auth Credentials
basic_auth_user     = "demo"
basic_auth_password = "test1234"

admin_basic_auth_user     = "admin"
admin_basic_auth_password = "admin1234"

# Auto-Seeding
enable_auto_seed = true  # 31 Produkte + 2 User werden automatisch erstellt
```

---

## 🚨 Troubleshooting

### "GitHub OAuth not connected"

**Problem:** GitHub Integration muss manuell autorisiert werden (AWS Platform-Limitation)

**Lösung:**
```bash
./terraform/examples/basic/connect-github.sh
```

### "npm ci failed" oder "tsc: command not found"

**Problem:** Dependencies nicht korrekt installiert

**Lösung:**
```bash
rm -rf backend/node_modules
./deploy.sh
```

### "API Gateway 502 Bad Gateway"

**Prüfen:**
1. Lambda Logs: `aws logs tail /aws/lambda/ecokart-development-api --follow`
2. DynamoDB Permissions in `terraform/modules/lambda/iam.tf`
3. Environment Variables in `terraform/main.tf`

**Mehr:** Siehe [MASTER_DOCUMENTATION.md](./docs/MASTER_DOCUMENTATION.md#troubleshooting)

---

## 💡 Features

- ✅ **Serverless:** Keine Server, kein Patching, Auto-Scaling
- ✅ **Pay-per-Use:** Nur zahlen wenn genutzt
- ✅ **Auto-Scaling:** Von 0 bis Millionen Requests
- ✅ **Infrastructure as Code:** Komplette Automation mit Terraform
- ✅ **ONE-CLICK Deploy:** `./deploy.sh` deployt alles
- ✅ **Auto-Seeding:** Datenbank wird automatisch befüllt
- ✅ **Monorepo:** Frontend, Admin, Backend in einem Repo
- ✅ **TypeScript:** Type-Safe überall

---

## 📈 Roadmap

### ✅ Fertig
- [x] Serverless Architektur (Lambda + DynamoDB)
- [x] ONE-CLICK Deployment
- [x] Auto-Seeding (31 Produkte + 2 User)
- [x] Terraform Module
- [x] Amplify Hosting (Customer + Admin)
- [x] Basic Auth
- [x] JWT Authentication
- [x] Interaktive Dokumentation

### 🚧 In Arbeit
- [ ] GitHub Actions CI/CD Pipeline
- [ ] CloudWatch Alarms & Monitoring
- [ ] AWS WAF für API Security

### 🔮 Geplant
- [ ] AWS Cognito für User Management
- [ ] S3 für Produkt-Bilder
- [ ] CloudFront CDN
- [ ] Multi-Environment (dev, staging, prod)
- [ ] Lambda Provisioned Concurrency (Cold Start Optimierung)

---

## 🤝 Contributing

1. Fork das Repository
2. Feature Branch erstellen (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Pull Request öffnen

---

## 📄 Lizenz

MIT License - siehe LICENSE Datei

---

## 👨‍💻 Autor

**Andy Schlegel**
- GitHub: [@AndySchlegel](https://github.com/AndySchlegel)
- Repository: [Ecokart-Webshop](https://github.com/AndySchlegel/Ecokart-Webshop)

---

## 🙏 Danke

Dieses Projekt nutzt:
- [AWS](https://aws.amazon.com) - Cloud Infrastructure
- [Terraform](https://terraform.io) - Infrastructure as Code
- [Next.js](https://nextjs.org) - React Framework
- [Express.js](https://expressjs.com) - Web Framework
- [DynamoDB](https://aws.amazon.com/dynamodb) - NoSQL Database

---

**🚀 Ready to deploy? Run `./deploy.sh`**

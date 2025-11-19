# 🚀 Ecokart - Serverless E-Commerce Platform

**Vollständig serverlose E-Commerce-Plattform auf AWS mit automatischem Multi-Environment Deployment**

[![AWS](https://img.shields.io/badge/AWS-Serverless-orange)](https://aws.amazon.com)
[![Terraform](https://img.shields.io/badge/IaC-Terraform-purple)](https://terraform.io)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015-black)](https://nextjs.org)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%2020-green)](https://nodejs.org)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-blue)](https://github.com/features/actions)

> **Portfolio-Projekt** von Andy Schlegel - Von Demo zu Production-Ready E-Commerce Platform

---

## 🎯 Was ist Ecokart?

Ecokart ist eine **moderne E-Commerce-Plattform** die komplett auf AWS Serverless Services läuft:

### 🛍️ Features
- ✅ **Customer Shop** - Next.js 15 Frontend auf Amplify
- ✅ **Admin Panel** - Next.js 15 Admin-Interface auf Amplify
- ✅ **REST API** - Express.js Backend auf AWS Lambda
- ✅ **NoSQL Database** - DynamoDB mit Auto-Seeding (31 Produkte)
- ✅ **User Auth** - JWT-basierte Authentifizierung
- ✅ **Cart System** - Vollständiger Warenkorb-Flow
- ✅ **Order Management** - Bestellungen erstellen und verwalten

### 🚀 DevOps & Infrastructure
- ✅ **Infrastructure as Code** - 100% Terraform
- ✅ **Multi-Environment Setup** - Development, Staging, Production
- ✅ **CI/CD Pipeline** - GitHub Actions mit OIDC (keine AWS Keys!)
- ✅ **Automated Deployment** - Push to branch → Auto-Deploy
- ✅ **Cost-Optimized** - Environment-spezifische Ressourcen-Sizing

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

### 🎯 Empfohlener Weg: GitHub Actions (Automatisch!)

**Keine lokale Installation nötig!** Einfach Code pushen → Automatisches Deployment! ✨

1. **Repository forken/clonen**
2. **GitHub Secrets einrichten** (einmalig):
   - `AWS_ROLE_ARN` - IAM Role für OIDC (siehe [Setup-Guide](docs/GITHUB_ACTIONS_SUCCESS.md))
3. **Code zu `develop` pushen:**
   ```bash
   git push origin develop
   ```
4. **Fertig!** GitHub Actions deployt automatisch zu Development Environment (~10-12 Min)

**📚 Ausführliche Anleitung:** [Multi-Environment Setup Guide](docs/MULTI_ENVIRONMENT_SETUP.md)

---

### 🔧 Alternative: Lokales Deployment

**Für lokale Tests oder wenn GitHub Actions nicht verfügbar:**

#### Voraussetzungen
- AWS Account mit konfigurierten Credentials
- Terraform ≥ 1.5
- Node.js ≥ 20.x
- GitHub Personal Access Token

#### Deployment

```bash
# 1. GitHub Token in AWS Parameter Store speichern (einmalig)
./scripts/setup-automation.sh

# 2. Infrastruktur deployen
./deploy.sh
```

**Das passiert automatisch:**
- ✅ DynamoDB Tabellen erstellen (4 Tabellen)
- ✅ Lambda Backend bauen & deployen
- ✅ API Gateway konfigurieren
- ✅ Amplify Apps erstellen (Customer + Admin)
- ✅ Datenbank mit 31 Produkten füllen
- ✅ Test-User erstellen
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
Ecokart-Webshop/
│
├── README.md                          # Projekt-Übersicht
├── deploy.sh                          # Lokales ONE-CLICK Deployment
├── cleanup-dev.sh                     # Cleanup-Script (local)
├── cleanup-amplify-apps.sh            # Amplify Apps cleanup
├── manual-cleanup-lambda.sh           # Lambda cleanup (emergency)
│
├── .github/                           # GitHub Actions CI/CD ⭐ NEW!
│   └── workflows/
│       ├── deploy.yml                 # Automated Deployment
│       ├── destroy.yml                # Automated Cleanup
│       └── cleanup-lambda.yml         # Emergency Lambda Cleanup
│
├── docs/                              # Dokumentation
│   ├── MULTI_ENVIRONMENT_SETUP.md     # Multi-Environment Guide ⭐ NEW!
│   ├── LESSONS_LEARNED.md             # Learnings & Portfolio ⭐ NEW!
│   ├── SESSION_WORKFLOW.md            # Daily Workflow Guide ⭐ NEW!
│   ├── GITHUB_ACTIONS_SUCCESS.md      # CI/CD Setup Documentation
│   ├── ROADMAP_PLANNING.md            # Feature Roadmap
│   ├── MASTER_DOCUMENTATION.md        # Technische Referenz
│   ├── PRESENTATION_GUIDE.md          # Vortrag-Drehbuch
│   └── infrastructure-diagram.html    # Interaktives Diagramm
│
├── frontend/                          # Customer Shop (Next.js 15)
│   ├── src/app/                       # App Router
│   ├── src/components/                # React Components
│   └── package.json
│
├── admin-frontend/                    # Admin Panel (Next.js 15)
│   ├── src/app/                       # App Router
│   ├── src/components/                # Admin Components
│   └── package.json
│
├── backend/                           # Express.js Backend
│   ├── src/
│   │   ├── index.ts                   # Express App
│   │   ├── lambda.ts                  # Lambda Handler
│   │   ├── routes/                    # API Routes
│   │   └── services/                  # Business Logic
│   ├── scripts/
│   │   ├── create-test-user.js        # Demo User (demo@ecokart.com)
│   │   ├── create-admin-user.js       # Admin User (admin@ecokart.com)
│   │   └── migrate-to-dynamodb-single.js  # Product Import (31 products)
│   └── package.json
│
├── terraform/                         # Infrastructure as Code
│   ├── main.tf                        # Root Module
│   ├── variables.tf                   # Input Variables
│   ├── outputs.tf                     # Output Values
│   │
│   ├── environments/                  # Environment Configs ⭐ NEW!
│   │   ├── development.tfvars         # Dev: Small & cheap
│   │   ├── staging.tfvars             # Staging: Production-like
│   │   ├── production.tfvars          # Prod: Full power
│   │   └── README.md                  # Config Guide
│   │
│   ├── github-actions-setup/          # OIDC Setup ⭐ NEW!
│   │   ├── main.tf                    # IAM OIDC Provider + Role
│   │   └── outputs.tf                 # Setup Instructions
│   │
│   ├── modules/                       # Wiederverwendbare Module
│   │   ├── dynamodb/                  # 4 DynamoDB Tabellen
│   │   ├── lambda/                    # Lambda + API Gateway + Build
│   │   ├── amplify/                   # Amplify Hosting + Basic Auth
│   │   └── seed/                      # Database Auto-Seeding
│   │
│   ├── examples/
│   │   └── basic/                     # Deployment Config
│   │       ├── main.tf                # Ruft Root Module auf
│   │       └── terraform.tfvars.example
│   │
│   └── scripts/
│       └── seed-database.js           # Database Seeding
│
└── scripts/
    ├── setup-automation.sh            # GitHub Token Setup
    └── setup-github.sh                # GitHub OAuth Helper
```

**⭐ = Neu im Multi-Environment Setup**

**Wichtige Dokumentation:**
- 🚀 [Multi-Environment Setup](./docs/MULTI_ENVIRONMENT_SETUP.md) - Development/Staging/Production Guide
- 📚 [Lessons Learned](./docs/LESSONS_LEARNED.md) - Learnings & Portfolio-Text
- 🔄 [Session Workflow](./docs/SESSION_WORKFLOW.md) - Daily Workflow für Budget-optimiertes Arbeiten
- ✅ [GitHub Actions Success](./docs/GITHUB_ACTIONS_SUCCESS.md) - CI/CD Pipeline Dokumentation
- 🗺️ [Roadmap](./docs/ROADMAP_PLANNING.md) - Geplante Features
- 📖 [Master Documentation](./docs/MASTER_DOCUMENTATION.md) - Komplette technische Referenz
- 🎤 [Presentation Guide](./docs/PRESENTATION_GUIDE.md) - Vortrag-Drehbuch

---

## 🔑 Login-Daten

**Hinweis:** Die Credentials unterscheiden sich je nach Environment!

### Development Environment

**Basic Auth (Amplify - 1st Layer):**
- Username: `dev`
- Password: `dev1234`

**App Login (Backend - 2nd Layer):**
- Test User: `demo@ecokart.com` / `Demo1234!`
- Admin User: `admin@ecokart.com` / `ecokart2025`

### Staging & Production

**Basic Auth:** Siehe `terraform/environments/staging.tfvars` bzw. `production.tfvars`

**App Login:** Gleiche User wie Development (werden automatisch erstellt)
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

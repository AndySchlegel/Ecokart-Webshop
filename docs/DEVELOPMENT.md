# 🔧 Development Documentation - Ecokart

**Technische Referenz für Entwickler**

**Last Updated:** 20. November 2025

---

## Inhaltsverzeichnis

1. [Projekt-Übersicht](#projekt-übersicht)
2. [Technologie-Stack](#technologie-stack)
3. [Repository-Struktur](#repository-struktur)
4. [Lokale Entwicklung](#lokale-entwicklung)
5. [Architektur](#architektur)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [CI/CD Pipeline](#cicd-pipeline)
9. [Deployment](#deployment)
10. [Testing](#testing)
11. [Troubleshooting](#troubleshooting)

---

## Projekt-Übersicht

### Was ist Ecokart?

Ecokart ist eine **vollständig serverlose E-Commerce-Plattform** auf AWS mit folgenden Features:

**Funktionale Features:**
- 🛍️ Product Catalog mit 31 Produkten
- 🛒 Shopping Cart mit Stock-Reservierung
- 📦 Order Management
- 👨‍💼 Admin Panel für Produktverwaltung
- 📊 **Inventory Management** (Stock + Reserved Tracking)
- 🔐 JWT-basierte Authentifizierung

**Technische Features:**
- ⚡ 100% Serverless (keine Server zu managen)
- 🚀 Auto-Scaling (0 bis Millionen Requests)
- 💰 Pay-per-Use Pricing Model
- 🔒 OIDC für CI/CD (keine AWS Keys in GitHub)
- 📦 Infrastructure as Code (Terraform)
- 🔄 Vollautomatische CI/CD Pipeline

---

## Technologie-Stack

### Frontend

| Komponente | Technologie | Version | Zweck |
|------------|-------------|---------|-------|
| Framework | Next.js | 15.x | SSR, App Router |
| Language | TypeScript | 5.x | Type Safety |
| Styling | Tailwind CSS | 3.x | Utility-First CSS |
| HTTP Client | Fetch API | - | Backend Communication |
| Hosting | AWS Amplify | - | Serverless Hosting |

### Backend

| Komponente | Technologie | Version | Zweck |
|------------|-------------|---------|-------|
| Framework | Express.js | 4.x | REST API |
| Language | TypeScript | 5.x | Type Safety |
| Runtime | Node.js | 20.x | Lambda Runtime |
| Lambda Wrapper | serverless-http | 3.x | Express → Lambda |
| Authentication | jsonwebtoken | 9.x | JWT Auth |
| Password Hashing | bcryptjs | 2.x | Secure Passwords |

### Infrastructure

| Komponente | Technologie | Version | Zweck |
|------------|-------------|---------|-------|
| IaC | Terraform | 1.5+ | Infrastructure Management |
| Database | DynamoDB | - | NoSQL Database |
| API Gateway | REST API | v2 | HTTP Routing |
| Compute | Lambda | - | Serverless Functions |
| CI/CD | GitHub Actions | - | Automated Deployment |

---

## Repository-Struktur

```
Ecokart-Webshop/
│
├── frontend/                      # Customer Shop (Next.js 15)
│   ├── app/
│   │   ├── page.tsx              # Homepage
│   │   ├── shop/                 # Product Catalog
│   │   ├── cart/                 # Shopping Cart
│   │   ├── checkout/             # Checkout Flow
│   │   ├── components/           # React Components
│   │   │   ├── ArticleCard.tsx  # Product Display + Stock Indicator
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   └── lib/
│   │       ├── api.ts            # API Client
│   │       └── types.ts          # TypeScript Types
│   ├── public/pics/              # Product Images
│   ├── package.json
│   └── next.config.js
│
├── admin-frontend/               # Admin Panel (Next.js 15)
│   ├── app/
│   │   ├── dashboard/
│   │   │   ├── components/
│   │   │   │   ├── ArticleTable.tsx   # Product List + Stock Management
│   │   │   │   └── ArticleForm.tsx    # Product Create/Edit Form
│   │   │   └── page.tsx
│   │   ├── api/
│   │   │   └── articles/
│   │   │       └── route.ts      # API Proxy (GET/POST/PUT/DELETE)
│   │   └── lib/
│   │       └── articles.ts       # API Client + Types
│   ├── package.json
│   └── next.config.js
│
├── backend/                      # Express.js Backend (Lambda)
│   ├── src/
│   │   ├── index.ts              # Express App Setup
│   │   ├── lambda.ts             # Lambda Handler (serverless-http)
│   │   │
│   │   ├── routes/               # API Routes
│   │   │   ├── authRoutes.ts    # POST /auth/login, /auth/register
│   │   │   ├── productRoutes.ts # GET/POST/PUT/DELETE /api/products
│   │   │   ├── cartRoutes.ts    # POST /api/cart (Stock Reservierung)
│   │   │   ├── orderRoutes.ts   # POST /api/orders (Stock Decrement)
│   │   │   └── userRoutes.ts    # GET /api/users/me
│   │   │
│   │   ├── controllers/          # Business Logic
│   │   │   ├── productController.ts  # Product CRUD + Stock Validation
│   │   │   ├── cartController.ts     # Cart + reserveStock()
│   │   │   └── orderController.ts    # Orders + decreaseStock()
│   │   │
│   │   ├── services/             # Data Access Layer
│   │   │   └── dynamodb/
│   │   │       ├── products.service.ts  # Stock-Operations
│   │   │       ├── users.service.ts
│   │   │       └── orders.service.ts
│   │   │
│   │   ├── models/               # TypeScript Types
│   │   │   ├── Product.ts       # { stock, reserved, ... }
│   │   │   ├── User.ts
│   │   │   └── Order.ts
│   │   │
│   │   └── database-adapter.ts  # DynamoDB Abstraction Layer
│   │
│   ├── scripts/                  # Utility Scripts
│   │   ├── migrate-to-dynamodb-single.js  # Seed Products (31 items)
│   │   ├── create-test-user.js            # Seed Demo User
│   │   └── create-admin-user.js           # Seed Admin User
│   │
│   ├── dist/                     # Compiled JavaScript (tsc output)
│   ├── package.json
│   └── tsconfig.json
│
├── terraform/                    # Infrastructure as Code
│   ├── modules/                  # Reusable Modules
│   │   ├── lambda/               # Lambda + API Gateway
│   │   ├── dynamodb/             # DynamoDB Tables
│   │   ├── amplify/              # Amplify Apps
│   │   └── iam/                  # IAM Roles
│   │
│   ├── environments/             # Environment Configs
│   │   ├── development.tfvars
│   │   ├── staging.tfvars
│   │   └── production.tfvars
│   │
│   ├── examples/basic/           # Main Terraform Entry
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── terraform.tfvars
│   │
│   └── github-actions-setup/     # OIDC Setup
│       └── main.tf
│
├── .github/workflows/            # CI/CD Pipelines
│   ├── deploy.yml                # Main Deployment
│   ├── destroy.yml               # Infrastructure Teardown
│   ├── reseed-database.yml       # Re-Seed Data
│   └── cleanup-lambda.yml        # Manual Lambda Cleanup
│
├── docs/                         # Documentation
│   ├── ACTION_PLAN.md            # Current Tasks & Roadmap
│   ├── DEVELOPMENT.md            # This Document
│   ├── LESSONS_LEARNED.md        # Best Practices
│   ├── architecture/             # System Design
│   ├── guides/                   # How-To Guides
│   ├── sessions/                 # Development History
│   └── archived/                 # Old Docs
│
├── deploy.sh                     # Local Deployment Script
└── README.md                     # Project Dashboard
```

---

## Lokale Entwicklung

### Prerequisites

```bash
# Required
- Node.js 20.x
- npm oder yarn
- AWS CLI configured
- Terraform 1.5+

# Optional
- Git
- VS Code mit TypeScript Extension
```

### Setup

**1. Repository clonen**
```bash
git clone https://github.com/AndySchlegel/Ecokart-Webshop.git
cd Ecokart-Webshop
```

**2. Dependencies installieren**
```bash
# Frontend
cd frontend
npm install

# Admin Frontend
cd ../admin-frontend
npm install

# Backend
cd ../backend
npm install
```

**3. Backend lokal starten**
```bash
cd backend

# TypeScript kompilieren
npm run build

# Development Mode (mit Auto-Reload)
npm run dev

# Server läuft auf http://localhost:3000
```

**4. Frontend lokal starten**
```bash
cd frontend

# Environment Variable setzen
export NEXT_PUBLIC_API_URL=http://localhost:3000

# Dev Server starten
npm run dev

# Frontend läuft auf http://localhost:3001
```

**5. Admin Frontend lokal starten**
```bash
cd admin-frontend

export NEXT_PUBLIC_API_URL=http://localhost:3000

npm run dev

# Admin läuft auf http://localhost:3002
```

### Environment Variables

#### Frontend (`.env.local`)
```bash
NEXT_PUBLIC_API_URL=https://your-api-gateway-url.amazonaws.com/Prod
```

#### Admin Frontend (`.env.local`)
```bash
NEXT_PUBLIC_API_URL=https://your-api-gateway-url.amazonaws.com/Prod
ADMIN_API_URL=https://your-api-gateway-url.amazonaws.com/Prod
```

#### Backend
Keine `.env` Datei nötig - nutzt AWS SDK Credentials

---

## Architektur

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                              │
└───────────────┬──────────────────────┬──────────────────────┘
                │                      │
                │                      │
    ┌───────────▼──────────┐  ┌────────▼─────────────┐
    │  Customer Frontend   │  │   Admin Frontend     │
    │  (Next.js/Amplify)   │  │  (Next.js/Amplify)   │
    │  - Browse Products   │  │  - Manage Products   │
    │  - Add to Cart       │  │  - Update Stock      │
    │  - Checkout          │  │  - View Orders       │
    └───────────┬──────────┘  └────────┬─────────────┘
                │                      │
                └──────────┬───────────┘
                           │
                           │ HTTPS
                           │
                ┌──────────▼───────────┐
                │   API Gateway        │
                │   (REST API)         │
                │   /api/products      │
                │   /api/cart          │
                │   /api/orders        │
                │   /auth/*            │
                └──────────┬───────────┘
                           │
                           │ Invoke
                           │
                ┌──────────▼───────────┐
                │   Lambda Function    │
                │   (Express.js)       │
                │   - Auth Middleware  │
                │   - Business Logic   │
                │   - Stock Management │
                └──────────┬───────────┘
                           │
                           │ AWS SDK
                           │
                ┌──────────▼───────────┐
                │      DynamoDB        │
                │   - ecokart-products │
                │   - ecokart-users    │
                │   - ecokart-carts    │
                │   - ecokart-orders   │
                └──────────────────────┘
```

### Component Details

#### API Gateway
- **Type:** REST API
- **Base Path:** `/Prod`
- **Routes:** `/{proxy+}` → Lambda
- **CORS:** Enabled für Frontend-Domains
- **Throttling:** 10000 requests/second

#### Lambda Function
- **Runtime:** Node.js 20.x
- **Memory:** 256 MB (Development) / 1024 MB (Production)
- **Timeout:** 30 seconds
- **Handler:** `dist/lambda.handler`
- **Environment:**
  - `NODE_ENV=production`
  - `PRODUCTS_TABLE=ecokart-products`
  - `USERS_TABLE=ecokart-users`
  - `CARTS_TABLE=ecokart-carts`
  - `ORDERS_TABLE=ecokart-orders`

#### DynamoDB Tables

**4 Tables total:**

1. **ecokart-products** (Product Catalog)
2. **ecokart-users** (User Accounts)
3. **ecokart-carts** (Shopping Carts)
4. **ecokart-orders** (Order History)

Siehe [Database Schema](#database-schema) für Details.

---

## Database Schema

### 1. ecokart-products

**Partition Key:** `id` (String)

**Attributes:**
```typescript
{
  id: string;                  // "prod-001"
  name: string;                // "Air Jordan 1"
  price: number;               // 179.99
  description: string;         // Product description
  imageUrl: string;            // "/pics/shoe1.jpg"
  category: string;            // "shoes"
  rating: number;              // 4.5
  reviewCount: number;         // 100
  stock: number;               // 50 (NEW: Inventory Management)
  reserved: number;            // 5 (NEW: In Carts)
  createdAt: string;           // ISO timestamp
  updatedAt: string;           // ISO timestamp
}
```

**Available Stock Calculation:**
```javascript
availableStock = stock - reserved
```

**Stock Operations:**
- **Reserve:** `reserved += quantity` (Add to Cart)
- **Release:** `reserved -= quantity` (Remove from Cart)
- **Decrease:** `stock -= quantity, reserved -= quantity` (Order Placed)

**Indexes:**
- Primary: `id`
- GSI: None yet (TODO: category-index for filtering)

---

### 2. ecokart-users

**Partition Key:** `id` (String)

**Attributes:**
```typescript
{
  id: string;                  // UUID
  email: string;               // "demo@ecokart.com"
  password: string;            // bcrypt hash
  role: string;                // "user" | "admin"
  createdAt: string;
  updatedAt: string;
}
```

**Indexes:**
- Primary: `id`
- GSI: `email-index` (for login lookup)

---

### 3. ecokart-carts

**Partition Key:** `userId` (String)

**Attributes:**
```typescript
{
  userId: string;              // User UUID
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  updatedAt: string;
}
```

**Notes:**
- One cart per user
- Items array stores denormalized price (snapshot)
- TODO: Cart expiry (release reserved stock after 2h)

---

### 4. ecokart-orders

**Partition Key:** `id` (String)

**Attributes:**
```typescript
{
  id: string;                  // UUID
  userId: string;              // User UUID
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
    name: string;
  }>;
  totalAmount: number;
  status: string;              // "pending" | "paid" | "shipped" | "delivered"
  createdAt: string;
  updatedAt: string;
}
```

**Indexes:**
- Primary: `id`
- GSI: `userId-index` (for user's order history)

---

## API Endpoints

### Base URL
```
Development: https://xxx.execute-api.eu-north-1.amazonaws.com/Prod
Staging:     https://yyy.execute-api.eu-north-1.amazonaws.com/Prod
Production:  https://zzz.execute-api.eu-north-1.amazonaws.com/Prod
```

### Authentication

#### POST /auth/register
**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```
**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "user"
  }
}
```

#### POST /auth/login
**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```
**Response:** Same as register

---

### Products

#### GET /api/products
**Auth:** Optional (public endpoint)

**Response:**
```json
[
  {
    "id": "prod-001",
    "name": "Air Jordan 1",
    "price": 179.99,
    "description": "Classic sneaker",
    "imageUrl": "/pics/shoe1.jpg",
    "category": "shoes",
    "rating": 4.5,
    "reviewCount": 100,
    "stock": 50,
    "reserved": 5
  }
]
```

#### GET /api/products/:id
**Auth:** Optional

**Response:** Single product object

#### POST /api/products
**Auth:** Required (Admin only)

**Request:**
```json
{
  "name": "New Product",
  "price": 99.99,
  "description": "Product description",
  "imageUrl": "/pics/product.jpg",
  "category": "shoes",
  "stock": 100
}
```

#### PUT /api/products/:id
**Auth:** Required (Admin only)

**Request:** Same as POST

#### DELETE /api/products/:id
**Auth:** Required (Admin only)

---

### Cart

#### POST /api/cart
**Auth:** Required

**Request:**
```json
{
  "productId": "prod-001",
  "quantity": 2
}
```

**Response:**
```json
{
  "cart": {
    "userId": "uuid",
    "items": [
      {
        "productId": "prod-001",
        "quantity": 2,
        "price": 179.99
      }
    ]
  }
}
```

**Business Logic:**
1. Check `availableStock = stock - reserved >= quantity`
2. If OK: `reserved += quantity`
3. Add to cart
4. Return updated cart

---

### Orders

#### POST /api/orders
**Auth:** Required

**Request:**
```json
{
  "cartItems": [
    {
      "productId": "prod-001",
      "quantity": 2,
      "price": 179.99
    }
  ]
}
```

**Response:**
```json
{
  "order": {
    "id": "order-uuid",
    "userId": "user-uuid",
    "items": [...],
    "totalAmount": 359.98,
    "status": "pending",
    "createdAt": "2025-11-20T10:00:00Z"
  }
}
```

**Business Logic:**
1. Validate cart items
2. For each item: `stock -= quantity, reserved -= quantity`
3. Create order
4. Clear cart
5. Return order

---

## CI/CD Pipeline

### GitHub Actions Workflows

#### 1. deploy.yml
**Trigger:** Manual (workflow_dispatch)

**Parameters:**
- `branch`: develop | staging | main
- `environment`: development | staging | production

**Steps:**
1. Checkout code
2. Configure AWS credentials (OIDC)
3. Build Backend (TypeScript → JavaScript)
4. Terraform Init
5. Terraform Apply
6. Seed Database (if first deploy)
7. Output URLs

**Duration:** ~10-12 minutes

---

#### 2. destroy.yml
**Trigger:** Manual (workflow_dispatch)

**Parameters:**
- `environment`: development | staging | production
- `confirm_destroy`: "yes" (safety check)

**Steps:**
1. Confirm destruction
2. Configure AWS credentials
3. Terraform Destroy
4. Auto Lambda Cleanup (if still exists)

**Duration:** ~5-7 minutes

---

#### 3. reseed-database.yml
**Trigger:** Manual

**Purpose:** Re-seed products without full destroy/deploy

**Steps:**
1. Run `migrate-to-dynamodb-single.js`
2. Run `create-test-user.js`
3. Run `create-admin-user.js`

**Duration:** ~1 minute

---

#### 4. cleanup-lambda.yml
**Trigger:** Manual

**Purpose:** Manually delete Lambda if auto-cleanup failed

**Steps:**
1. Delete Lambda function
2. Delete CloudWatch Log Group

---

### OIDC Authentication

**Configured in:** `terraform/github-actions-setup/`

**AWS IAM Role:**
- Trust Policy: GitHub OIDC Provider
- Permissions: Lambda, DynamoDB, API Gateway, Amplify, IAM

**GitHub Secrets:**
- `AWS_ROLE_ARN` - IAM Role ARN for OIDC
- `AWS_REGION` - eu-north-1

**Benefits:**
- ✅ No long-lived AWS keys in GitHub
- ✅ Automatic token rotation
- ✅ Audit trail via CloudTrail

---

## Deployment

### Option 1: Via GitHub Actions (Empfohlen)

```
1. Go to: https://github.com/AndySchlegel/Ecokart-Webshop/actions
2. Select: "Deploy Ecokart Infrastructure"
3. Click: "Run workflow"
4. Choose:
   - Branch: develop
   - Environment: development
5. Click: "Run workflow"
6. Wait ~10-12 minutes
7. Check outputs for URLs
```

### Option 2: Via Local Script

```bash
# From repository root
./deploy.sh

# Script runs:
# 1. cd terraform/examples/basic
# 2. terraform init
# 3. terraform apply -auto-approve
# 4. cd backend && npm run build
# 5. Run seed scripts
```

### Post-Deployment Checklist

- [ ] API Gateway URL accessible
- [ ] Customer Frontend deployed on Amplify
- [ ] Admin Frontend deployed on Amplify
- [ ] Database seeded with 31 products
- [ ] Test user created: demo@ecokart.com
- [ ] Admin user created: admin@ecokart.com

---

## Testing

### Current State

⚠️ **No automated tests yet** (Technical Debt)

**Manual Testing:**
- Frontend: Browser testing
- Backend: Postman/curl
- E2E: Manual user flows

### Planned Testing Strategy

**Unit Tests (Priority: HIGH)**
```bash
# Backend
cd backend
npm test

# Test: Stock operations
# Test: Auth middleware
# Test: Business logic
```

**Integration Tests**
```bash
# API Tests
npm run test:api

# Test: POST /api/cart → Stock reserved?
# Test: POST /api/orders → Stock decreased?
```

**E2E Tests (Playwright)**
```bash
npm run test:e2e

# Test: User Journey
# 1. Browse products
# 2. Add to cart
# 3. Checkout
# 4. Verify stock updated
```

Siehe [ACTION_PLAN.md](ACTION_PLAN.md) für Testing Roadmap.

---

## Troubleshooting

### Lambda "Already Exists" Error

**Problem:** `ResourceAlreadyExistsException: Function already exists`

**Ursache:** Terraform Destroy hat Lambda nicht vollständig gelöscht

**Lösung:**
```bash
# Option 1: Manual cleanup
aws lambda delete-function --function-name ecokart-development-api

# Option 2: Via GitHub Actions
# Run: cleanup-lambda.yml workflow
```

---

### "Pattern mismatch" Error im Admin

**Problem:** Admin zeigt "Pattern mismatch" beim Speichern

**Ursache:** Fehlende PUT-Route in `admin-frontend/app/api/articles/route.ts`

**Lösung:** PUT-Route bereits implementiert (siehe admin-frontend/app/api/articles/route.ts:65)

---

### Stock-Felder sind `undefined`

**Problem:** Frontend zeigt `undefined` für stock/reserved

**Ursache:** Database wurde mit altem Migration Script geseeded

**Lösung:**
```bash
# Option 1: Re-Seed via GitHub Actions
# Run: reseed-database.yml workflow

# Option 2: Manual re-seed
cd backend
node scripts/migrate-to-dynamodb-single.js
```

---

### Doppelter Slash in API URL (`/Prod//api`)

**Problem:** Backend URL hat trailing slash → `/Prod//api/products`

**Ursache:** `BASE_URL` endet mit `/`

**Lösung:** Bereits gefixt in `admin-frontend/app/api/articles/route.ts:96`
```typescript
const apiUrl = BASE_URL.endsWith('/')
  ? BASE_URL.slice(0, -1)
  : BASE_URL;
```

---

## Weitere Dokumentation

- **[ACTION_PLAN.md](ACTION_PLAN.md)** - Current Sprint & Next Steps
- **[LESSONS_LEARNED.md](LESSONS_LEARNED.md)** - Best Practices & Pitfalls
- **[architecture/](architecture/)** - System Design Details
- **[guides/](guides/)** - How-To Guides
- **[sessions/](sessions/)** - Development History

---

**Letzte Aktualisierung:** 20. November 2025
**Autor:** Andy Schlegel
**Version:** 2.0 (mit Inventory Management)

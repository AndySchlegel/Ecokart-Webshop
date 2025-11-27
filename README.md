# 🚀 Ecokart - Serverless E-Commerce Platform

**Vollständig serverlose E-Commerce-Plattform auf AWS mit Multi-Environment CI/CD**

[![AWS](https://img.shields.io/badge/AWS-Serverless-orange)](https://aws.amazon.com)
[![Terraform](https://img.shields.io/badge/IaC-Terraform-purple)](https://terraform.io)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015-black)](https://nextjs.org)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-blue)](https://github.com/features/actions)

> **Portfolio-Projekt** von Andy Schlegel - Feature-Complete E-Commerce Webshop

---

## 🎯 Projekt-Ziel

**Ein vollständig funktionaler, production-ready E-Commerce Webshop als Bewerbungs-Showcase**

Dieses Projekt demonstriert professionelle Softwareentwicklung nach 6 Monaten intensivem Lernen. Ziel ist ein **theoretisch produktionsreifer Webshop**, der folgende Anforderungen erfüllt:

- ✅ **Feature-Complete** - Alle essentiellen E-Commerce Features implementiert
- ✅ **100% Reproduzierbar** - Von AWS Sandbox zu eigenem Account portierbar
- ✅ **Production-Ready** - Mit Tests, Monitoring, Error Handling & Documentation
- ✅ **Infrastructure as Code** - Komplette Infrastruktur in Terraform definiert
- ✅ **Best Practices** - CI/CD, Security, Cost Optimization, Clean Code

**Status:** Aktuell funktionsfähig (Auth → Cart → Orders → Stock Management) - in aktiver Entwicklung zu Feature-Completeness

---

## 🚦 Current Status

**Last Updated:** 25. November 2025

### ✅ Implemented Features
- ✅ **Authentication** - AWS Cognito JWT (User Registration, Login, Email Verification)
- ✅ **Customer Shop** - Next.js 15 Frontend auf AWS Amplify
- ✅ **Admin Panel** - Product & Inventory Management Dashboard
- ✅ **Inventory System** - Stock tracking mit reserved logic (Overselling Prevention)
- ✅ **REST API** - Express.js Backend auf AWS Lambda
- ✅ **DynamoDB** - 4 Tables mit Auto-Seeding (31 products)
- ✅ **CI/CD Pipeline** - GitHub Actions mit OIDC (Branch-based deployment)
- ✅ **Multi-Environment** - Development, Staging, Production
- ✅ **E2E Workflow** - Products → Cart → Checkout → Stock Deduction
- ✅ **Error Handling** - User-friendly deutsche Error Messages
- ✅ **Loading States** - Visual feedback für Cart Operations
- ✅ **CloudWatch Monitoring** - 9 Alarms für Lambda, DynamoDB, API Gateway (See [docs/guides/MONITORING.md](docs/guides/MONITORING.md))
- ✅ **Code Quality** - ESLint/Prettier configured (0 errors, warnings only)
- ✅ **Unit Tests** - Jest + ts-jest, 63 tests passing, 60-69% coverage (See [backend/jest.config.js](backend/jest.config.js))

### 🚧 In Progress
- 🚧 **E2E Testing** - Playwright für kritische User Journeys (Next Priority)

### 📋 Next Milestones
1. **E2E Testing** - Playwright für 5-10 kritische User Journeys
2. **Payment Integration** - Stripe Checkout & Webhooks
3. **Email Notifications** - Order Confirmation, Shipping Updates
4. **Production Polish** - Performance Optimization, Security Audit

**Detailed Roadmap:** [docs/ACTION_PLAN.md](docs/ACTION_PLAN.md)

---

## 📊 Project Health

| Metric | Status | Target |
|--------|--------|--------|
| **Deployment** | ✅ Automated | - |
| **Authentication** | ✅ Cognito JWT | - |
| **Monitoring** | ✅ CloudWatch Alarms | - |
| **Code Quality** | ✅ ESLint configured | - |
| **Unit Tests** | ✅ 63 passing (60-69%) | - |
| **E2E Tests** | ❌ Missing | 5-10 flows |
| **AWS Costs** | ✅ <$10/month | <$10/month |
| **Documentation** | ✅ 100% complete | 100% |
| **Last Deploy** | 25.11.2025 | - |

---

## 🚀 Quick Start

### For Developers

```bash
# 1. Clone repository
git clone https://github.com/AndySchlegel/Ecokart-Webshop.git
cd Ecokart-Webshop

# 2. Deploy to AWS (via GitHub Actions - recommended)
git push origin develop  # Auto-deploys to development

# 3. Or deploy locally
./scripts/deploy.sh
```

### For Users

**Live URLs** (after deployment):
- 🛍️ **Customer Shop:** https://main.dyoqwczz7hfmn.amplifyapp.com
- 👨‍💼 **Admin Panel:** https://main.d3ds92499cafzo.amplifyapp.com
- 🔌 **API:** https://e0hfrob892.execute-api.eu-north-1.amazonaws.com/Prod/

**Access:** Contact repository owner for test credentials

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                   AWS Cloud                      │
│                                                   │
│  Customer Frontend ─┐                            │
│  (Next.js/Amplify)  │                            │
│                      ├─► API Gateway ─► Lambda   │
│  Admin Frontend ────┘    (REST)       (Express) │
│  (Next.js/Amplify)                       │       │
│                                          │       │
│                                     DynamoDB     │
│                                   (4 Tables)     │
│                                                   │
└─────────────────────────────────────────────────┘
```

**Full Architecture:** [docs/architecture/SYSTEM_DESIGN.md](docs/architecture/SYSTEM_DESIGN.md)

---

## 📚 Documentation

### 📖 Quick Links
| Document | Purpose | Last Updated |
|----------|---------|--------------|
| [ACTION_PLAN.md](docs/ACTION_PLAN.md) | Current tasks & roadmap | 24.11.2025 |
| [DEVELOPMENT.md](docs/DEVELOPMENT.md) | Technical documentation | 20.11.2025 |
| [LESSONS_LEARNED.md](docs/LESSONS_LEARNED.md) | Best practices & pitfalls | 24.11.2025 |
| [STRIPE_SETUP.md](docs/guides/STRIPE_SETUP.md) | Stripe Keys & Deployment Secrets | 25.11.2025 |

### 📂 Documentation Structure

```
docs/
├── ACTION_PLAN.md              # What's next?
├── DEVELOPMENT.md              # Technical deep-dive
├── LESSONS_LEARNED.md          # Best practices
│
├── architecture/               # System design
│   ├── SYSTEM_DESIGN.md
│   ├── DATABASE_SCHEMA.md
│   └── API_ENDPOINTS.md
│
├── guides/                     # How-to guides
│   ├── DEPLOYMENT.md
│   ├── LOCAL_SETUP.md
│   └── TROUBLESHOOTING.md
│
└── sessions/                   # Development history
    ├── 2025-11-19_inventory_management.md
    └── README.md
```

---

## 🛠️ Tech Stack

| Component | Technology | Hosting |
|-----------|------------|---------|
| Customer Frontend | Next.js 15, TypeScript | AWS Amplify |
| Admin Frontend | Next.js 15, TypeScript | AWS Amplify |
| Backend API | Express.js, TypeScript | AWS Lambda |
| Database | DynamoDB (NoSQL) | AWS DynamoDB |
| Infrastructure | Terraform | - |
| CI/CD | GitHub Actions (OIDC) | - |

---

## 📁 Project Structure

```
Ecokart-Webshop/
├── frontend/           # Customer Shop (Next.js 15)
├── admin-frontend/     # Admin Panel (Next.js 15)
├── backend/            # Express API (Lambda)
├── terraform/          # Infrastructure as Code
│   ├── modules/        # Reusable modules
│   ├── environments/   # Dev/Staging/Prod configs
│   └── github-actions-setup/  # OIDC setup
├── .github/workflows/  # CI/CD pipelines
└── docs/               # Documentation
```

---

## 💡 Key Features

### Business Features
- 🛍️ Product catalog with search & filters
- 🛒 Shopping cart with stock reservation
- 📦 Order management
- 📊 **Inventory tracking** (stock + reserved)
- 👨‍💼 Admin dashboard for product management

### Technical Features
- ⚡ **100% Serverless** - No servers to manage
- 🚀 **Auto-scaling** - 0 to millions of requests
- 💰 **Pay-per-use** - Only pay for what you use
- 🔒 **Secure** - JWT auth + OIDC for CI/CD
- 📦 **IaC** - Everything in Terraform
- 🔄 **CI/CD** - Automated deployments via GitHub Actions

---

## 🔧 Common Commands

```bash
# Deploy infrastructure
./scripts/deploy.sh

# Destroy infrastructure
./scripts/deploy.sh destroy

# View logs
aws logs tail /aws/lambda/ecokart-development-api --follow

# Re-seed database
# GitHub Actions → Run "Re-Seed Database" workflow

# View Terraform outputs
cd terraform/examples/basic && terraform output
```

---

## 🐛 Known Issues

See [docs/ACTION_PLAN.md#known-issues](docs/ACTION_PLAN.md#known-issues) for current blockers.

**Quick Fixes:**
- Lambda sometimes requires manual cleanup after destroy
  → Use `.github/workflows/cleanup-lambda.yml`
- AWS Config causing high costs
  → See cost optimization guide in ACTION_PLAN.md

---

## 📈 Roadmap

### Recently Completed (Nov 2025)
- ✅ **Unit Tests** - 63 tests passing, CI/CD integration (25.11.2025)
- ✅ **Error Handling & Code Quality** - ESLint, CloudWatch Monitoring (24.11.2025)
- ✅ **Inventory Management System** - Stock tracking, Admin UI (19.11.2025)
- ✅ **AWS Cognito Authentication** - JWT, Email Verification (20.11.2025)

### Current Sprint
- 🚧 AWS Cost Optimization
- 🚧 Documentation Restructure

### Next Up
- [ ] E2E Testing (Playwright)
- [ ] Payment Integration (Stripe)
- [ ] Email Notifications (AWS SES)

**Full Roadmap:** [docs/ACTION_PLAN.md](docs/ACTION_PLAN.md)

---

## 🎓 Learning Resources

This project demonstrates:
- AWS Serverless Architecture (Lambda, DynamoDB, Amplify)
- Infrastructure as Code with Terraform
- CI/CD with GitHub Actions OIDC
- Monorepo with multiple Next.js apps
- TypeScript full-stack development
- Cost optimization strategies

**Lessons Learned:** [docs/LESSONS_LEARNED.md](docs/LESSONS_LEARNED.md)

---

## 👨‍💻 Developer

**Andy Schlegel**
- GitHub: [@AndySchlegel](https://github.com/AndySchlegel)
- Project: [Ecokart-Webshop](https://github.com/AndySchlegel/Ecokart-Webshop)

---

## 📄 License

MIT License - see LICENSE file

---

**Ready to deploy?** See [docs/guides/DEPLOYMENT.md](docs/guides/DEPLOYMENT.md) for detailed instructions.

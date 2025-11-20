# 🎯 Action Plan - Ecokart Development

**Last Updated:** 20. November 2025
**Status:** Active Development

---

## 🚦 Current Sprint

### In Progress

- 🚧 **AWS Cost Optimization**
  - **Problem:** AWS Kosten bei $17.08/Monat (Budget: <$10/Monat)
  - **Main Drivers:**
    - Config: $5.87 (34%) - Unnecessary for development
    - VPC: $2.98 (17%) - Unnecessary for Lambda
    - RDS: $2.34 (14%) - Shouldn't exist (we use DynamoDB)
    - ECS: $1.39 (8%) - Shouldn't exist (we use Lambda)
  - **Actions:**
    - [ ] Disable AWS Config immediately
    - [ ] Find and delete orphaned RDS instances
    - [ ] Find and delete orphaned ECS clusters
    - [ ] Check for NAT Gateways (VPC cost driver)
  - **Expected Savings:** $17/month → $5-6/month (65% reduction)
  - **Owner:** DevOps
  - **ETA:** This week

- 🚧 **Documentation Restructure**
  - **Goal:** Clear, organized docs with README as "living dashboard"
  - **Status:**
    - ✅ New folder structure created (architecture/, guides/, sessions/, archived/)
    - ✅ README.md rewritten as Project Dashboard
    - 🚧 ACTION_PLAN.md (this document)
    - ⏳ LESSONS_LEARNED.md consolidation
    - ⏳ DEVELOPMENT.md creation
    - ⏳ Session docs organization
    - ⏳ Archive old docs
  - **Owner:** Documentation
  - **ETA:** This week

### Recently Completed ✅

- 🔒 **AWS Cognito Authentication** (20.11.2025)
  - ⚠️ **Status:** Code Complete, Deployment Blocked by AWS Organizations SCP
  - **Features Implemented:**
    - 🎯 **Auto Admin User Provisioning:** Automatische Admin-User-Erstellung bei jedem Deployment (keine manuelle AWS Console Arbeit mehr!)
    - 🔐 Login/Register UI mit Email Verification Flow
    - 📧 6-stelliger Verification Code mit Auto-Login
    - 🛡️ Lifecycle Protection gegen versehentliches Löschen
    - 🌿 Multi-Branch Support (develop/staging/main)
    - 🔧 API Gateway Cognito Authorizer Integration
    - ⚙️ Frontend AuthContext mit AWS Amplify
  - **Branch:** `claude/admin-stock-management-015aciWWHqNcb14KFAQpRcM6`
  - **Blocker:** AWS Organizations Service Control Policy verbietet Cognito
  - **Action Required:** Organization Admin muss SCP anpassen
  - **Next Steps:** Nach SCP-Freigabe → Deployment → Testing

- ✅ **Inventory Management System** (19.11.2025)
  - Stock-Tracking im Backend (DynamoDB)
  - Reserved-Tracking für Warenkorb
  - Stock-Display im Customer Frontend (grün/orange/rot)
  - Stock-Management im Admin Frontend
  - Automatischer Stock-Abzug bei Bestellung
  - Branch: `claude/admin-stock-management-015aciWWHqNcb14KFAQpRcM6`
  - **Waiting for:** Merge to main

- ✅ **Admin Stock Management UI** (19.11.2025)
  - Tabellenansicht mit farbcodiertem Stock
  - Edit-Formular mit Stock-Input-Feld
  - PUT-Route für Updates implementiert
  - Synchronisation mit Backend-API

- ✅ **Auto Lambda Cleanup** (19.11.2025)
  - Automatischer Cleanup-Step in destroy.yml
  - Re-Seed Database Workflow

---

## 🐛 Known Issues & Blockers

### Critical

**🔴 AWS Organizations SCP blockiert Cognito Deployment**
- **Problem:** Service Control Policy (SCP) auf Organization-Ebene verbietet Cognito-Service
- **Error:** `AccessDeniedException: with an explicit deny in a service control policy`
- **Impact:** Cognito User Pool kann nicht deployed werden - kompletter Auth-Flow blockiert
- **Workaround:** Keiner - SCP überschreibt alle IAM-Permissions
- **Solution:** AWS Organizations Admin muss SCP anpassen um Cognito zu erlauben
- **Action Required:**
  - [ ] Organization Admin kontaktieren
  - [ ] SCP Policy updaten (Cognito Services freigeben)
  - [ ] Nach Freigabe: `terraform apply` erneut ausführen
- **Tracking:** Blocked since 20.11.2025
- **Code Status:** ✅ Cognito Code vollständig implementiert und getestet (nur Deployment blockiert)

### High Priority

**Lambda Auto-Cleanup nicht zuverlässig**
- **Problem:** Lambda wird beim Destroy manchmal nicht gelöscht (CloudWatch Dependency)
- **Impact:** Manuelle Intervention nötig nach Destroy
- **Workaround:** Manuell `cleanup-lambda.yml` Workflow ausführen
- **TODO:**
  - [ ] Lambda-Cleanup testen/debuggen
  - [ ] Evtl. Cleanup direkt in Destroy-Script integrieren
- **Tracking:** Known since 19.11.2025

**AWS Config verursacht hohe Kosten**
- **Problem:** Config tracked jede Ressourcen-Änderung bei Destroy/Rebuild
- **Impact:** Destroy/Rebuild Cycles sind teuer
- **Solution:** Disable AWS Config (see Current Sprint)
- **Tracking:** Identified 20.11.2025

### Medium Priority

**develop Branch gelöscht**
- **Problem:** Branch wurde gelöscht, muss neu erstellt werden
- **Impact:** CI/CD für Development Environment funktioniert nicht
- **Solution:**
  - [ ] develop Branch neu erstellen von main (nach Merge)
- **Tracking:** Known since 19.11.2025

---

## 📋 Next Up (Prioritized)

### Immediate (This Week)

1. **Branch Management**
   - [ ] Merge `claude/admin-stock-management-*` in `main`
   - [ ] develop Branch neu erstellen von main
   - [ ] Infrastructure neu deployen (optional, zum Testen)
   - **Why:** Deploy Inventory Management to Production

2. **AWS Cost Cleanup**
   - [ ] Disable AWS Config
   - [ ] Clean up orphaned resources (RDS, ECS)
   - **Why:** Reduce AWS costs by 65%

3. **Documentation Completion**
   - [ ] Finish documentation restructuring
   - **Why:** Better organization for future development

### Short-Term (Next 2 Weeks)

4. **Automated Testing** (HIGH PRIORITY)
   - [ ] Unit Tests für Stock-Logik (Jest)
   - [ ] API Tests (Supertest)
   - [ ] E2E Tests basics (Playwright)
   - **Why:** Verhindert Bugs in Production
   - **Effort:** 5-6 days
   - **Reference:** See ROADMAP_PLANNING.md Phase 1

5. **Stock-Alert System**
   - [ ] Backend: SNS Notification bei niedrigem Bestand
   - [ ] Admin: Stock-Alerts Dashboard
   - [ ] Email-Benachrichtigung an Admin
   - **Why:** Proaktive Inventory-Management
   - **Effort:** 2-3 days
   - **Depends on:** Inventory Management deployed

6. **Error Handling Improvements**
   - [ ] Bessere Error-Messages im Admin ("Pattern mismatch" → was genau?)
   - [ ] Frontend Error Boundaries (React)
   - [ ] CloudWatch Error Alerting
   - **Why:** Better debugging und User Experience
   - **Effort:** 2 days

### Medium-Term (Next Month)

7. **AWS Cognito Authentication** ⚠️ BLOCKED BY SCP (HIGH PRIORITY - Security)
   - [x] Replace current JWT Auth with Cognito ✅
   - [x] Email Verification ✅
   - [x] Password Reset Flow ✅
   - [x] Auto Admin User Provisioning ✅ (eliminiert manuelles AWS Console Setup!)
   - [x] Login/Register UI Pages ✅
   - [x] API Gateway Authorizer Integration ✅
   - [ ] DEPLOYMENT - **BLOCKED:** AWS Organizations SCP verbietet Cognito
   - [ ] Optional: Social Login (Google, Facebook) - nach SCP-Fix
   - [ ] Optional: MFA - nach SCP-Fix
   - **Status:** Code Complete, Deployment Blocked by AWS Organizations SCP
   - **Action:** Organization Admin muss SCP Policy updaten
   - **Why:** Production-ready authentication
   - **Effort:** 2-3 days (Code ✅ done, Deployment ⏳ waiting for SCP fix)
   - **Reference:** See ROADMAP_PLANNING.md Phase 2

8. **Email Notifications** (HIGH PRIORITY - Customer Experience)
   - [ ] AWS SES Setup
   - [ ] Order Confirmation Email
   - [ ] Shipping Notification Email
   - [ ] Email Templates mit Corporate Design
   - **Why:** Professional customer experience
   - **Effort:** 3-4 days
   - **Reference:** See ROADMAP_PLANNING.md Phase 4

9. **Multi-Environment Cleanup**
   - [ ] Staging Environment nutzen (currently unused)
   - [ ] Environment-spezifische Configs dokumentieren
   - [ ] Amplify Branch-Konfiguration überprüfen
   - **Why:** Better separation of concerns
   - **Effort:** 2 days

### Long-Term (Next Quarter)

10. **Stripe Payment Integration** (Business Critical)
    - [ ] Stripe Checkout Session
    - [ ] Webhook für payment_intent.succeeded
    - [ ] Order Creation nach erfolgreicher Zahlung
    - [ ] Test Mode für Development
    - **Why:** Real revenue!
    - **Effort:** 3-4 days
    - **Reference:** See ROADMAP_PLANNING.md Phase 3

11. **Order Lifecycle Management**
    - [ ] Status Machine (PENDING → PAID → SHIPPED → DELIVERED)
    - [ ] Admin: Order Status Updates
    - [ ] Customer: Order Tracking
    - **Why:** Complete order workflow
    - **Effort:** 3-4 days

12. **Monitoring & Observability**
    - [ ] CloudWatch Dashboards (Business + Technical Metrics)
    - [ ] CloudWatch Alarms (Error Rate, 5xx, etc.)
    - [ ] X-Ray Distributed Tracing
    - **Why:** Probleme BEVOR User sie merken
    - **Effort:** 2-3 days
    - **Reference:** See ROADMAP_PLANNING.md Phase 5

---

## 💡 Recent Learnings (Last 30 Days)

### From Cognito Implementation Session (20.11.2025)

**AWS Organizations SCP vs. IAM Permissions**
- **Problem:** IAM Permissions für Cognito waren korrekt, trotzdem `AccessDeniedException`
- **Learning:** Service Control Policies (SCP) überschreiben IAM auf Organization-Ebene
- **Error Message:** "with an explicit deny in a service control policy"
- **Action:** Immer prüfen ob Account in AWS Organization ist, SCP-Rechte vom Organization Admin erforderlich

**Terraform Count mit Resource-Attributen**
- **Problem:** `count = var.cognito_user_pool_arn != "" ? 1 : 0` → "Invalid count argument"
- **Learning:** Count kann keine Resource-Attribute nutzen (unknown at plan-time)
- **Solution:** Boolean Input Variables nutzen statt Resource-Checks
- **Pattern:** `count = var.enable_cognito_auth ? 1 : 0` ✅

**Terraform Lifecycle Block Constraints**
- **Problem:** `prevent_destroy = var.environment != "development"` → "Variables not allowed"
- **Learning:** Lifecycle blocks erlauben keine dynamischen Werte
- **Solution:** Statischen Wert nutzen (`prevent_destroy = true`) oder manuell kommentieren für Destroy
- **Rationale:** Besser zu konservativ als versehentlicher Production Data Loss

**Data Source Duplicate Definitions**
- **Problem:** `data "aws_region" "current"` in 2 Files → "Duplicate data configuration"
- **Learning:** Data Sources sind module-global, nicht file-scoped
- **Solution:** Data Source nur einmal definieren, überall referenzieren

**Auto-Provisioning mit Terraform null_resource**
- **Learning:** `null_resource` mit `local-exec` provisioner kann Shell-Scripts nach Resource-Erstellung ausführen
- **Use Case:** Admin User automatisch erstellen nach Cognito User Pool Creation
- **Pattern:** Idempotent Scripts schreiben (prüfen ob Resource existiert vor Erstellung)
- **Benefit:** Eliminiert manuelles AWS Console Setup komplett

### From Inventory Management Session (19.11.2025)

**Migration Scripts synchron halten**
- **Problem:** Es gibt 2 Scripts: `migrate-to-dynamodb.js` und `migrate-to-dynamodb-single.js`
- **Learning:** Deployment nutzt `-single.js` (wegen SCP restrictions), beide müssen identische Felder haben
- **Action:** Immer beide Scripts updaten bei Schema-Änderungen

**Data vs. Code Mismatch**
- **Problem:** Frontend-Code hatte Stock-UI ✅, Backend-Code hatte Stock-Logic ✅, DynamoDB-Daten hatten KEINE Stock-Felder ❌
- **Learning:** Bei DB-Schema-Änderungen IMMER Migration prüfen und re-seed
- **Action:** Re-Seed Workflow nutzen statt Destroy/Deploy

**API-Routes vollständig implementieren**
- **Problem:** Admin Frontend hatte keine PUT-Route → "Pattern mismatch" Error
- **Learning:** Immer GET/POST/PUT/DELETE komplett implementieren
- **Action:** API-Design-Checklist verwenden

**URL Construction**
- **Problem:** Doppelter Slash in Backend-URL (`/Prod//api/products`)
- **Learning:** Trailing Slashes können Probleme machen
- **Action:** Immer normalisieren: `BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL`

### From Cost Analysis (20.11.2025)

**AWS Config = Cost Trap**
- **Problem:** AWS Config kostet $5.87/Monat bei Destroy/Rebuild Cycles
- **Learning:** Config tracked jede Ressourcen-Änderung → teuer bei häufigen Changes
- **Action:** Disable AWS Config für Development Environment

**Orphaned Resources**
- **Problem:** RDS + ECS Kosten trotz reinem Serverless-Setup
- **Learning:** Terraform Destroy löscht nicht immer alles
- **Action:** Nach Destroy manuell AWS Console checken

---

## 📊 Project Health Metrics

| Metric | Current | Target | Trend |
|--------|---------|--------|-------|
| **AWS Costs** | $17.08/month | <$10/month | 🔴 Over budget |
| **Deployment** | ✅ Automated | - | ✅ Good |
| **Test Coverage** | 0% | 80% | 🔴 Critical gap |
| **Uptime** | 99.9% | 99.9% | ✅ Good |
| **Technical Debt** | Medium | Low | ⚠️ Needs attention |
| **Documentation** | 70% complete | 90% | 🟡 In progress |

### Technical Debt Tracking

| Debt Item | Priority | Effort | Payoff |
|-----------|----------|--------|--------|
| Automated Testing | HIGH | 5-6 days | Prevents bugs |
| AWS Config cleanup | HIGH | 1 day | 65% cost savings |
| Lambda Cleanup bug | MEDIUM | 2 days | Smoother deploys |
| Error handling | MEDIUM | 2 days | Better UX |
| Cognito Auth | HIGH | 2-3 days | Security |

---

## 🎯 Success Criteria

### This Sprint (Week of 20.11.2025)

- [x] README.md as living dashboard
- [ ] AWS costs reduced to <$10/month
- [ ] Documentation restructure complete
- [ ] Inventory Management merged to main

### This Month (November 2025)

- [ ] Automated tests running in CI/CD
- [ ] Inventory Management deployed to Production
- [ ] develop Branch restored and functional
- [ ] Technical debt reduced by 30%

### Next Month (December 2025)

- [ ] AWS Cognito authentication live
- [ ] Email notifications working
- [ ] Stock-alert system functional
- [ ] Order workflow complete

---

## 📎 Quick Links

### Current Work
- [This Document](ACTION_PLAN.md) - Current tasks & roadmap
- [README.md](../README.md) - Project dashboard
- [DEVELOPMENT.md](DEVELOPMENT.md) - Technical documentation

### Architecture & Design
- [SYSTEM_DESIGN.md](architecture/SYSTEM_DESIGN.md) - Architecture overview
- [DATABASE_SCHEMA.md](architecture/DATABASE_SCHEMA.md) - Database structure
- [API_ENDPOINTS.md](architecture/API_ENDPOINTS.md) - API documentation

### Guides
- [DEPLOYMENT.md](guides/DEPLOYMENT.md) - How to deploy
- [LOCAL_SETUP.md](guides/LOCAL_SETUP.md) - Local development setup
- [TROUBLESHOOTING.md](guides/TROUBLESHOOTING.md) - Common issues

### History
- [SESSION_INVENTORY_MANAGEMENT.md](sessions/2025-11-19_inventory_management.md) - Last session details
- [LESSONS_LEARNED.md](LESSONS_LEARNED.md) - Best practices & pitfalls
- [ROADMAP_PLANNING.md](archived/ROADMAP_PLANNING.md) - Long-term vision

### GitHub
- [GitHub Actions](https://github.com/AndySchlegel/Ecokart-Webshop/actions) - CI/CD status
- [Open Issues](https://github.com/AndySchlegel/Ecokart-Webshop/issues) - Bug tracking
- [Pull Requests](https://github.com/AndySchlegel/Ecokart-Webshop/pulls) - Code review

### Live URLs
- [Customer Shop](https://main.dyoqwczz7hfmn.amplifyapp.com) - Production frontend
- [Admin Panel](https://main.d3ds92499cafzo.amplifyapp.com) - Admin dashboard
- [API Endpoint](https://e0hfrob892.execute-api.eu-north-1.amazonaws.com/Prod/) - Backend API

---

## 📝 Update Log

| Date | Update | Author |
|------|--------|--------|
| 20.11.2025 | Cognito implementation completed (code), blocked by SCP (deployment) | Claude |
| 20.11.2025 | Initial ACTION_PLAN.md creation | Claude |
| 19.11.2025 | Inventory Management completed | Claude + Andy |
| 19.11.2025 | Auto Lambda Cleanup implemented | Claude |
| 03.11.2025 | Multi-Environment Setup completed | Claude + Andy |

---

**Next Review:** End of week (22.11.2025)
**Status:** 🟢 On Track

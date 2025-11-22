# 🛒 Claude AI Guidelines - Ecokart Project

**Version:** 1.0
**Created:** 22. November 2025
**Project:** Ecokart - Serverless E-Commerce Platform
**Purpose:** Projekt-spezifische Regeln, Context und Best Practices

**⚠️ WICHTIG:** Dieses Dokument ergänzt `CLAUDE.md` (allgemeine Guidelines)

---

## 🎯 Projekt-Überblick

### Was ist Ecokart?
Vollständiger E-Commerce Shop auf AWS Serverless Infrastructure mit Multi-Environment Support und automatisiertem CI/CD.

### Tech Stack
```
Frontend:     Next.js 15 (SSR), TypeScript, Tailwind CSS, AWS Amplify Hosting
Backend:      Node.js/Express.js, AWS Lambda, API Gateway (REST)
Database:     AWS DynamoDB (NoSQL)
Auth:         Custom JWT (→ AWS Cognito migration planned)
IaC:          Terraform 1.5.0
CI/CD:        GitHub Actions mit OIDC
Monitoring:   CloudWatch Logs
Region:       eu-north-1 (Stockholm)
```

### Repository Structure
```
.
├── frontend/              # Next.js Customer Frontend
├── admin-frontend/        # Next.js Admin Panel
├── backend/              # Express.js Lambda Function
├── terraform/            # Infrastructure as Code
│   ├── modules/         # Reusable Terraform modules
│   └── environments/    # Environment-specific configs
├── .github/workflows/   # CI/CD Pipelines
└── docs/                # Comprehensive documentation
```

---

## 🚨 KRITISCHE REGELN - NIEMALS BRECHEN!

### 1. Terraform State Protection (HÖCHSTE PRIORITÄT!)
**Regel:** Terraform State ist heilig - NIEMALS ohne Backup/Plan ändern

**✅ ERLAUBT:**
- State read-only operations
- Normal terraform plan/apply Workflows
- State Backup BEVOR Changes

**❌ VERBOTEN ohne User-Approval:**
- State-File manuell ändern
- State löschen ohne Backup
- Architektur-Änderungen bei existierendem State
- terraform state mv/rm commands

**Bei State-Problemen:**
```
1. ✋ STOP sofort
2. 📢 User informieren: "State-Problem erkannt"
3. 💾 Backup-Status checken
4. 💡 Optionen präsentieren:
   A) Terraform-basierte Lösung (safe)
   B) Manual State Edit (risky)
   C) Nuclear Cleanup + Fresh Deploy (destructive)
5. ⏸️ Auf User-Entscheidung warten
```

**Learned from:** 21.11.2025 - 4+ Stunden Debugging wegen State Corruption!

---

### 2. Documentation First (HÖCHSTE PRIORITÄT!)
**Regel:** Jede wichtige Änderung MUSS dokumentiert werden

**Pflicht-Dokumentation bei:**
- ✍️ Jeder Session (Session Doc erstellen)
- ✍️ Jedem Error (LESSONS_LEARNED.md)
- ✍️ Jeder Architektur-Entscheidung (ACTION_PLAN.md)
- ✍️ Jedem Deployment (Was deployed, was geändert)
- ✍️ Jedem Workflow-Update (Warum geändert)

**Dokumentations-Hierarchie:**
```
1. LESSONS_LEARNED.md    # Was haben wir gelernt? (Chronologisch)
2. ACTION_PLAN.md        # Was machen wir als nächstes? (Living Roadmap)
3. sessions/             # Detaillierte Session-Logs
4. guides/               # How-To Dokumentation
5. README.md             # Project Dashboard (Overview)
```

**Live-Dokumentation:**
- Wichtige Schritte SOFORT dokumentieren (nicht am Ende vergessen!)
- Format: Timestamp + Action + Result
- Bei Errors: Vollständiger Error + Ursache + Lösung

---

### 3. Kosten-Bewusstsein
**Regel:** AWS Kosten IMMER im Blick behalten

**Budget:**
- Development: ~20-30 EUR/Monat (max!)
- AWS Sandbox: 15 USD/Monat limit
- Nach Destroy: Orphaned Resources checken!

**Warnen bei:**
- 🔴 Neuen teuren Services (NAT Gateway, RDS, etc.)
- 🔴 Provisioned Capacity statt On-Demand
- 🔴 Vergessenen Ressourcen nach Destroy
- 🔴 AWS Config aktivieren (teuer bei Destroy/Rebuild!)

**Cost Optimization Checks:**
```bash
# Nach jedem Destroy:
aws ec2 describe-nat-gateways    # $32/Monat!
aws rds describe-db-instances    # Sollte leer sein
aws ecs list-clusters            # Sollte leer sein
aws configservice describe-configuration-recorders  # Sollte gestoppt sein (Dev)
```

**Learned from:** 20.11.2025 - Unerwartete $17/Monat wegen AWS Config + Orphaned Resources

---

## 📁 Kritische Files - Besondere Vorsicht!

### NIEMALS ohne Fragen ändern:
```
terraform/
├── main.tf                    # Root Terraform config
├── backend.tf                 # S3 State Backend config
├── environments/*.tfvars      # Environment configs
└── modules/*/main.tf          # Module definitions

.github/workflows/
├── deploy.yml                 # Main deployment workflow
├── destroy.yml                # Destruction workflow
└── nuclear-cleanup.yml        # Emergency cleanup

backend/
└── migrations/
    └── migrate-to-dynamodb-single.js  # Used by CI/CD!
```

### Wichtig aber änderbar:
```
frontend/src/
admin-frontend/src/
backend/src/
docs/                          # Dokumentation (IMMER aktuell halten!)
```

### Auto-Generated (nicht editieren):
```
*.tfstate                      # Terraform State
*.tfstate.backup              # State Backups
terraform.tfplan              # Terraform Plans
node_modules/                 # Dependencies
.next/                        # Next.js Build
```

---

## 🌍 Multi-Environment Setup

### Environments
```
develop  (Branch: develop)  → Development Environment  → Quick & Cheap
staging  (Branch: staging)  → Staging Environment     → Production-like
main     (Branch: main)     → Production Environment  → Full Power
```

### Environment-Specific Configs
```
terraform/environments/
├── development.tfvars        # 256MB Lambda, PAY_PER_REQUEST DynamoDB
├── staging.tfvars           # 512MB Lambda, Low Provisioned DynamoDB
└── production.tfvars        # 1024MB Lambda, High Provisioned DynamoDB
```

### Deployment Flow
```
1. Push to develop  → Auto-Deploy to Development
2. Test in Development
3. PR to staging    → Auto-Deploy to Staging
4. Test in Staging (production-like)
5. PR to main       → Auto-Deploy to Production
```

**Regel:** Niemals direkt in main pushen!

---

## 🔧 Deployment Workflows

### 1. Standard Deployment
**Trigger:** Push to develop/staging/main
**Workflow:** `.github/workflows/deploy.yml`

**Was passiert:**
```
1. Checkout code
2. Determine environment (develop→development, main→production)
3. AWS OIDC Authentication
4. Setup Terraform S3 Backend (idempotent)
5. Setup Terraform & Node.js
6. Get GitHub Token from Parameter Store
7. Generate JWT Secret
8. Clean backend dependencies (race condition prevention)
9. ⚠️ Force Clear State & Lock (aggressive, for fresh deploys)
10. Terraform Init
11. Verify environment config exists
12. Terraform Plan
13. Terraform Apply
14. Deployment Summary
```

**Kritische Steps:**
- **Step 9:** Force Clear State & Lock
  - Nur aktiv für Fresh Deploys nach Nuclear Cleanup
  - Bei normalen Updates: Kann zu Data Loss führen!
  - Kommentieren wenn nicht gewünscht

### 2. Destruction
**Trigger:** Manual (workflow_dispatch)
**Workflow:** `.github/workflows/destroy.yml`

**Requires:** Typing "destroy" to confirm

**Was passiert:**
```
1. Validate confirmation
2. Determine environment
3. AWS OIDC Authentication
4. Terraform Init
5. Terraform Plan Destroy
6. Delete Amplify Apps (optional)
7. Terraform Destroy
8. Wait for AWS deletion propagation (60s)
9. Cleanup Lambda (if still exists)
10. Cleanup DynamoDB Tables (if still exist)
11. Cleanup Cognito User Pools
12. Cleanup API Gateways (REST APIs!)
13. Cleanup IAM Roles
14. Cleanup CloudWatch Logs
```

**Known Issues:**
- Manchmal schlägt Terraform Destroy fehl → Nuclear Cleanup nutzen
- API Gateway Cleanup: REST APIs (apigateway), nicht HTTP APIs (apigatewayv2)!

### 3. Nuclear Cleanup (Emergency)
**Trigger:** Manual (workflow_dispatch)
**Workflow:** `.github/workflows/nuclear-cleanup.yml`

**Requires:** Typing "NUCLEAR" to confirm

**Wann nutzen:**
- ✅ Terraform Destroy schlägt fehl
- ✅ State Corruption
- ✅ Complete Fresh Start nötig
- ❌ NIEMALS in Production ohne Backup!

**Was passiert:**
- Komplett AWS CLI-basiert (kein Terraform)
- Löscht ALLE Resources des Environments
- Löscht auch Terraform State File
- Idempotent (läuft mehrfach ohne Fehler)

**Nach Nuclear Cleanup:**
```
1. Warte 2-3 Minuten (AWS braucht Zeit!)
2. Deploy Workflow triggern
3. Fresh Infrastructure wird erstellt
```

---

## 🐛 Bekannte Issues & Lösungen

### Issue 1: Terraform State Corruption
**Symptom:** "Provider configuration not present" Errors
**Ursache:** Architektur-Änderung bei existierendem State
**Lösung:**
```
1. STOP - nicht weiterprobieren
2. Nach 1-2 Fehlversuchen: Nuclear Cleanup vorschlagen
3. User entscheiden lassen
4. Nuclear Cleanup → Fresh Deploy
```
**Learned:** 21.11.2025

### Issue 2: API Gateway Double Slash
**Symptom:** `/dev//api/cart` → 401 Unauthorized
**Ursache:** Trailing slash in `NEXT_PUBLIC_API_URL`
**Lösung:**
```bash
# Amplify Environment Variable OHNE trailing slash:
NEXT_PUBLIC_API_URL=https://xxx.amazonaws.com/dev
# NICHT: .../dev/
```
**Learned:** 21.11.2025

### Issue 3: Frontend Token Storage Bug
**Symptom:** Login funktioniert, aber Cart/Orders geben 401
**Ursache:** Tokens nicht in localStorage gespeichert
**Lösung:** Frontend Auth Code muss Tokens persistieren
**Status:** UNRESOLVED (Stand 22.11.2025)
**Learned:** 21.11.2025

### Issue 4: Lambda Auto-Cleanup unreliable
**Symptom:** Lambda bleibt manchmal nach Destroy
**Ursache:** CloudWatch Log Groups blockieren Deletion
**Lösung:**
```bash
# Manual cleanup:
aws lambda delete-function --function-name ecokart-ENV-api --region eu-north-1
aws logs delete-log-group --log-group-name /aws/lambda/ecokart-ENV-api --region eu-north-1
```
**Workaround:** Nuclear Cleanup Workflow nutzen

### Issue 5: Duplicate Amplify Apps
**Symptom:** Mehrere Amplify Apps nach Failed Deployments
**Lösung:**
```bash
# Liste alle Apps:
aws amplify list-apps --region eu-north-1

# Lösche duplicates:
aws amplify delete-app --app-id XXX --region eu-north-1
```
**Prevention:** Nach Failed Deployment aufräumen

### Issue 6: AWS Parameter Store Token gelöscht
**Symptom:** Deploy schlägt fehl: "Parameter /ecokart/github-token not found"
**Ursache:** AWS Budget Cleanup löscht Parameter Store
**Lösung:**
```bash
# Token wieder herstellen:
aws ssm put-parameter \
  --name "/ecokart/github-token" \
  --value "ghp_YOUR_TOKEN" \
  --type "SecureString" \
  --overwrite \
  --region eu-north-1
```
**Frequency:** Täglich nötig bei AWS Sandbox Budget Cleanup

---

## 🔐 Security & Secrets

### Secrets Management
```
GitHub Secrets (für CI/CD):
├── AWS_ROLE_ARN           # OIDC Role (kein Access Key!)

AWS Parameter Store (für Runtime):
└── /ecokart/github-token  # Amplify GitHub Integration

Environment Variables (Generated):
├── JWT_SECRET             # Generated per deployment
└── COGNITO_*              # Created by Terraform
```

**Regel:** Niemals Secrets in Code committen!
- ✅ AWS Parameter Store für Runtime Secrets
- ✅ GitHub Secrets für CI/CD
- ✅ Generated Secrets für temporäre Werte
- ❌ Niemals in .tfvars (außer non-sensitive configs)
- ❌ Niemals in Code
- ❌ Niemals in Git

### OIDC statt Access Keys
**Warum:** Sicherer, automatische Rotation, granulare Permissions
**Setup:** AWS Role ARN in GitHub Secrets
**Usage:** `aws-actions/configure-aws-credentials@v4`

---

## 🧪 Testing Protocol

### Vor jedem Deploy (Development):
- [ ] Lokaler Build erfolgreich? (`npm run build`)
- [ ] TypeScript Errors behoben?
- [ ] Keine Syntax Errors?

### Nach jedem Deploy:
- [ ] Amplify Build erfolgreich?
- [ ] Frontend lädt?
- [ ] API Gateway erreichbar?
- [ ] DynamoDB Tables existieren?
- [ ] Sample API Call funktioniert? (GET /api/products)

### Vor Production Deploy:
- [ ] Alle Tests in Development erfolgreich?
- [ ] Staging Deployment erfolgreich?
- [ ] User Acceptance Testing abgeschlossen?
- [ ] Breaking Changes dokumentiert?
- [ ] Rollback-Plan vorhanden?

---

## 📊 Monitoring & Debugging

### CloudWatch Logs Locations
```
Lambda:           /aws/lambda/ecokart-ENV-api
Amplify:          AWS Console → Amplify → App → Logs
API Gateway:      Disabled (Dev), Enabled (Prod)
```

### Debugging Checklist
```
Problem: API gibt 401 Unauthorized

1. Check Backend Logs:
   CloudWatch → /aws/lambda/ecokart-ENV-api
   → JWT validation successful?

2. Check Network Request:
   Browser DevTools → Network
   → Authorization header present?
   → URL correct? (kein //)

3. Check Frontend Storage:
   Browser DevTools → Application → Storage
   → localStorage/sessionStorage empty?

4. Check API Gateway:
   AWS Console → API Gateway
   → Routes configured?
   → CORS enabled?
```

### Common Error Patterns
```
401 Unauthorized:
→ Check JWT token (Backend Logs)
→ Check Authorization header (Network Tab)
→ Check localStorage (Application Tab)

404 Not Found:
→ Check URL (trailing slash?)
→ Check API Gateway routes
→ Check Lambda proxy integration

500 Internal Server Error:
→ Check Lambda Logs (CloudWatch)
→ Check Lambda Environment Variables
→ Check DynamoDB Table exists
```

---

## 🏗️ Architektur-Entscheidungen

### Warum REST API statt HTTP API?
**Decision:** AWS REST API (nicht HTTP API)
**Reasoning:**
- Mehr Features (Authorizers, Models, etc.)
- Besser dokumentiert
- Existierende Terraform Module nutzen REST
**CLI Commands:** `aws apigateway` (nicht `apigatewayv2`)

### Warum Custom JWT statt Cognito?
**Current:** Custom JWT Auth
**Future:** Migration zu AWS Cognito geplant
**Reason für Delay:** AWS Organizations SCP blockiert Cognito
**Action Required:** Organization Admin muss SCP anpassen

### Warum terraform/ root statt examples/basic/?
**Decision:** Deploy direkt von terraform/ root
**Previous:** terraform/examples/basic/ wrapper
**Reason:** Einfacherer Workflow, weniger Abstraktions-Layer
**Learned:** Bei Umstellung State komplett neu erstellen (Nuclear Cleanup!)

### Warum PAY_PER_REQUEST für Development?
**Decision:** DynamoDB PAY_PER_REQUEST Mode für Development
**Reasoning:**
- Development hat wenig Traffic
- Nur zahlen für tatsächliche Zugriffe
- ~25 EUR/Monat statt ~50 EUR mit Provisioned
**Production:** Provisioned Capacity (vorhersagbare Kosten)

---

## 🚀 Workflow Best Practices

### Bei neuen Features:
```
1. Branch erstellen: feature/description
2. Lokal entwickeln & testen
3. Commit mit aussagekräftigen Messages
4. Push → Auto-Deploy to Development
5. Testen in Development Environment
6. PR erstellen mit Description
7. Review → Merge to develop
8. Nach Testing: PR to staging
9. Final Testing in Staging
10. PR to main → Production Deploy
```

### Bei Bugs:
```
1. Bug in LESSONS_LEARNED.md dokumentieren
2. Branch erstellen: fix/description
3. Fix implementieren
4. Test lokal
5. Deploy to Development
6. Verify Fix
7. PR mit "Fixes #issue"
8. Fast-track to Production (bei kritischen Bugs)
```

### Bei Infrastruktur-Änderungen:
```
1. ⚠️ User informieren: "Plane Infrastruktur-Änderung"
2. Terraform Plan lokal erstellen
3. Changes mit User besprechen
4. Approval einholen
5. Backup erstellen (State, wichtige Daten)
6. Terraform Apply
7. Verify + Test
8. Dokumentieren in ACTION_PLAN.md
```

---

## 📞 Communication Patterns für dieses Projekt

### Daily Standup Format (Session Start)
```
Guten Morgen! 🌅

📊 Status Check:
- Infrastructure: [✅ Deployed / ❌ Down / ⚠️ Issues]
- Last Session: [Was wurde gemacht]
- Known Issues: [Aktuelle Blocker]

🎯 Heute geplant:
1. [Top Priority Task]
2. [Secondary Task]
3. [Nice to Have]

Bereit zu starten?
```

### Progress Updates
```
✅ [Task] abgeschlossen
   - [Was genau gemacht]
   - [Ergebnis]
   - [Next Step]
```

### Error Reports
```
❌ Problem erkannt: [Kurzbeschreibung]

🔍 Details:
- Error: [Genaue Fehlermeldung]
- Context: [Was wurde versucht]
- Root Cause: [Vermutete Ursache]

💡 Lösungsoptionen:
  A) [Quick & Dirty]
  B) [Proper Fix]
  C) [Nuclear Option]

🎯 Empfehlung: [Welche und warum]

Wie möchtest du vorgehen?
```

### Session End Format
```
📊 Session Summary:
- ✅ Completed: [Tasks]
- ⏳ In Progress: [Tasks]
- 🔴 Blocked: [Tasks + Reason]

📝 Dokumentation:
- [Updated Docs]
- [New Learnings]

🎯 Next Session:
1. [Priority 1]
2. [Priority 2]

Alles dokumentiert, ready für morgen! 🚀
```

---

## 🎓 Project-Specific Learnings

### Von den ersten Sessions
1. **Multi-Environment Setup ist essential** (03.11.2025)
2. **Migration Scripts BEIDE updaten** (19.11.2025)
   - migrate-to-dynamodb.js UND -single.js!
3. **AWS Config ist teuer bei Dev** (20.11.2025)
   - Disable für Development

### Von der State Corruption Crisis (21.11.2025)
1. **Architektur NIEMALS bei existierendem State ändern**
2. **Nach 1-2 Fehlversuchen eskalieren, nicht weiterprobieren**
3. **Nuclear Cleanup als Backup-Plan ist essentiell**
4. **API Gateway routet // nicht korrekt**
5. **Browser Storage IMMER checken bei Auth-Problemen**

### Allgemeine Patterns
1. **Destroy → Warten (2-3 Min) → Deploy**
   - AWS braucht Zeit für Cleanup
2. **Nach Destroy: Orphaned Resources checken**
   - NAT Gateways, RDS, ECS, etc.
3. **Amplify Environment Variables ohne trailing slash**
   - Sonst double slash in URLs!

---

## 🔄 Maintenance Tasks

### Täglich (bei aktiver Entwicklung):
- [ ] GitHub Token in Parameter Store checken (Sandbox!)
- [ ] AWS Costs checken
- [ ] Orphaned Resources checken nach Destroy

### Wöchentlich:
- [ ] Documentation Review (LESSONS_LEARNED, ACTION_PLAN)
- [ ] Technical Debt Review
- [ ] Backup wichtiger Configs

### Monatlich:
- [ ] Dependency Updates (npm audit)
- [ ] Terraform Version Update (wenn stable)
- [ ] AWS Cost Optimization Review
- [ ] Diese Guidelines updaten

---

## 📚 Quick Reference

### Important URLs (Development)
```
Customer Frontend:  https://develop.d14gvmewz6x56p.amplifyapp.com
Admin Frontend:     https://develop.db6fx5pmh4si2.amplifyapp.com
API Gateway:        https://ctykw3bvyg.execute-api.eu-north-1.amazonaws.com/dev/

AWS Region:         eu-north-1
S3 State Bucket:    ecokart-terraform-state-729403197965
DynamoDB Lock:      ecokart-terraform-state-lock
```

### Critical Commands
```bash
# Restore GitHub Token (täglich nötig bei Sandbox!)
aws ssm put-parameter \
  --name "/ecokart/github-token" \
  --value "ghp_YOUR_TOKEN" \
  --type "SecureString" \
  --overwrite \
  --region eu-north-1

# Check orphaned resources
aws ec2 describe-nat-gateways --region eu-north-1
aws rds describe-db-instances --region eu-north-1
aws ecs list-clusters --region eu-north-1

# Delete Amplify app
aws amplify delete-app --app-id XXX --region eu-north-1
```

### Workflow Triggers
```bash
# Deploy
git push origin develop    # → Auto-Deploy to Development

# Destroy
GitHub Actions → Destroy Infrastructure → Type "destroy"

# Nuclear Cleanup
GitHub Actions → Nuclear Cleanup → Type "NUCLEAR"
```

---

## 🎯 Quick Decision Matrix

| Situation | Action | Approval Needed? |
|-----------|--------|------------------|
| Bug-Fix (klar definiert) | Direkt fixen | ❌ Nein |
| Dokumentation Update | Direkt machen | ❌ Nein |
| Code Refactoring (non-breaking) | Direkt machen | ❌ Nein |
| Terraform State löschen | STOP + präsentieren | ✅ JA! |
| Architektur-Änderung | STOP + präsentieren | ✅ JA! |
| AWS Resource löschen | Info + Vorschlag | ✅ JA! |
| Production Deploy | Info + Vorschlag | ✅ JA! |
| Error nach 2 Versuchen | Optionen präsentieren | ✅ JA! |
| Mehrere Lösungswege | Alle zeigen | ✅ JA! |

---

**Version History:**
- 1.0 (22.11.2025): Initial creation nach State Corruption Crisis
- Nächstes Review: Nach Frontend Token Storage Fix

**Remember:**
- 🔐 **State Protection ist Top-Priorität**
- 📝 **Documentation First, Code Second**
- 💰 **AWS Costs im Blick behalten**
- 🚨 **Früh eskalieren, nicht stundenlang probieren**

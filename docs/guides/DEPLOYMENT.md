# 🚀 Deployment Guide - Ecokart Webshop

**Vollständiger Guide für Deployment, Destroy & Troubleshooting**

---

## 🎯 Überblick

Ecokart nutzt ein **100% reproduzierbares Deployment-System**:
- ✅ **Infrastructure as Code** (Terraform)
- ✅ **Automated CI/CD** (GitHub Actions mit OIDC)
- ✅ **Multi-Environment** (Development, Staging, Production)
- ✅ **Branch-based Deployment** (develop → dev, staging → staging, main → prod)

**Das System kann komplett neu aufgebaut werden, selbst wenn ALLES gelöscht ist!**

---

## 📋 Quick Reference

### Deployment via GitHub Actions (Empfohlen)

```bash
# 1. Push Code zu Branch
git push origin develop  # → Auto-deploys to development

# 2. Beobachte Deployment
# https://github.com/AndySchlegel/Ecokart-Webshop/actions

# 3. URLs checken (nach ~8-10 Minuten)
# - Customer Shop: https://main.dyoqwczz7hfmn.amplifyapp.com
# - Admin Panel: https://main.d3ds92499cafzo.amplifyapp.com
# - API: https://e0hfrob892.execute-api.eu-north-1.amazonaws.com/Prod/
```

### Destroy via GitHub Actions

```bash
# 1. Gehe zu GitHub Actions
# https://github.com/AndySchlegel/Ecokart-Webshop/actions

# 2. Wähle Workflow: "Destroy Infrastructure"
# 3. Klicke "Run workflow"
# 4. Gib "destroy" ein zur Bestätigung
# 5. Warte 3-5 Minuten

# 6. Verifiziere (optional)
aws lambda list-functions --region eu-north-1 | grep ecokart
# → Sollte NICHTS anzeigen
```

---

## 🏗️ Initial Setup (Einmalig)

### Voraussetzungen

- ✅ AWS Account (Sandbox oder eigener Account)
- ✅ AWS CLI konfiguriert (`aws sso login`)
- ✅ Terraform installiert (v1.x)
- ✅ Node.js 20.x
- ✅ GitHub Account

### 1. Bootstrap OIDC Infrastructure (Einmalig)

**Nur nötig beim allerersten Setup oder nach komplettem Löschen der IAM Role!**

#### Option A: Via GitHub Actions (Einfacher)

```bash
# 1. Gehe zu GitHub Actions
https://github.com/AndySchlegel/Ecokart-Webshop/actions

# 2. Wähle Workflow: "Bootstrap OIDC Infrastructure"
# 3. Klicke "Run workflow"
# 4. Gib "bootstrap" ein zur Bestätigung
# 5. Klicke "Run workflow"

# Warte ~2-3 Minuten
```

**Was wird erstellt:**
- ✅ GitHub OIDC Provider
- ✅ IAM Role für GitHub Actions (`ecokart-github-actions-role`)
- ✅ 10 IAM Policies (Terraform, DynamoDB, Lambda, etc.)

**Voraussetzung:** AWS Bootstrap Credentials müssen in GitHub Secrets sein (siehe [BOOTSTRAP.md](../BOOTSTRAP.md))

#### Option B: Lokal via Terraform

```bash
# 1. AWS Login
aws sso login
aws sts get-caller-identity  # Verifizieren

# 2. Navigate to OIDC Setup
cd terraform/github-actions-setup

# 3. Initialize & Apply
terraform init
terraform apply

# 4. Copy Output (für GitHub Secret)
# github_actions_role_arn = "arn:aws:iam::729403197965:role/ecokart-github-actions-role"
```

### 2. GitHub Personal Access Token Setup

**Wird für Amplify GitHub Integration benötigt.**

#### Token erstellen

```bash
# 1. Öffne im Browser:
https://github.com/settings/tokens/new

# 2. Einstellungen:
# - Note: "Ecokart Amplify Deployment"
# - Expiration: "No expiration"
# - Scope: ✅ repo (Full control)

# 3. Generiere Token und kopiere: ghp_xxxxxxxxxxxxx
```

#### Token in AWS Parameter Store speichern

```bash
# WICHTIG: Ersetze ghp_YOUR_TOKEN mit deinem echten Token!
aws ssm put-parameter \
  --name "/ecokart/github-token" \
  --value "ghp_YOUR_TOKEN_HERE" \
  --type "SecureString" \
  --region eu-north-1

# Verifizieren:
aws ssm get-parameter \
  --name "/ecokart/github-token" \
  --with-decryption \
  --query 'Parameter.Value' \
  --output text \
  --region eu-north-1
```

**⚠️ AWS Sandbox-Accounts:** Token wird täglich durch Budget-Cleanup gelöscht und muss täglich wiederhergestellt werden!

### 3. GitHub Secret hinzufügen

```bash
# 1. Öffne im Browser:
https://github.com/AndySchlegel/Ecokart-Webshop/settings/secrets/actions

# 2. Klicke "New repository secret"

# 3. Fülle aus:
# - Name: AWS_ROLE_ARN
# - Secret: arn:aws:iam::729403197965:role/ecokart-github-actions-role

# 4. Klicke "Add secret"
```

### 4. Erster Deployment

```bash
# 1. Code committen
git add .
git commit -m "Initial deployment setup"

# 2. Push zu develop (oder main für Production)
git push origin develop

# 3. Beobachte Deployment
https://github.com/AndySchlegel/Ecokart-Webshop/actions

# 4. Warte ~8-10 Minuten

# 5. URLs checken (aus Workflow Summary oder Terraform Output)
```

---

## 🔄 Deployment Workflows

### Automatisches Deployment (GitHub Actions)

**Branch-based Deployment:**

```
develop → Development Environment
staging → Staging Environment
main    → Production Environment
```

**Workflow:**

```bash
# 1. Entwickle auf Feature-Branch
git checkout -b feature/my-feature
# ... Code ändern ...
git commit -m "Add feature"

# 2. Merge zu develop (Testing)
git checkout develop
git merge feature/my-feature
git push origin develop  # → Auto-deploys to development

# 3. Teste in Development
# → https://main.dyoqwczz7hfmn.amplifyapp.com

# 4. Merge zu main (Production)
git checkout main
git merge develop
git push origin main  # → Auto-deploys to production
```

**Was passiert automatisch:**
- ✅ AWS Credentials via OIDC
- ✅ Terraform Backend Setup (S3 + DynamoDB Lock)
- ✅ Backend Build (`npm ci` + `npm run build`)
- ✅ Terraform Apply
- ✅ DynamoDB Auto-Seeding (31 Produkte)
- ✅ Amplify Deployment (Frontend)

**Dauer:** ~8-10 Minuten

### Manuelles Deployment (Lokal)

**Nur für Testing/Debugging!**

```bash
# 1. AWS Login
aws sso login

# 2. GitHub Token aus Parameter Store
export TF_VAR_github_access_token=$(aws ssm get-parameter \
  --name "/ecokart/github-token" \
  --with-decryption \
  --query 'Parameter.Value' \
  --output text \
  --region eu-north-1)

# 3. Navigate to Terraform
cd terraform

# 4. Deploy
terraform init
terraform apply

# 5. URLs anzeigen
terraform output
```

**Dauer:** ~5-10 Minuten

---

## 🗑️ Destroy Infrastructure

> **⚠️ WICHTIG - Destroy Strategy (Stand: Nov 2025):**
>
> **Aktuell:** Nutze **Nuclear Cleanup Workflow** für zuverlässiges Löschen
>
> **Grund:** Terraform State Issues nach Architektur-Änderungen
> - `destroy.yml` kann Resources nicht korrekt zuordnen (State out-of-sync)
> - `nuclear-cleanup.yml` bypassed Terraform komplett (AWS CLI direct)
> - Funktioniert 100% zuverlässig, unabhängig von State
>
> **Best Practice für Production (TODO am Projekt-Ende):**
> - `destroy.yml` fixen mit State Refresh vor Destroy
> - Nuclear Cleanup nur als Emergency Fallback behalten
> - Siehe: Phase 5 in ACTION_PLAN.md → Reproducibility Test
>
> **Für Development/Sandbox:** Nuclear Cleanup ist akzeptabel ✅

### Option 1: Nuclear Cleanup (EMPFOHLEN - funktioniert immer)

**Komplett zuverlässiges Löschen via AWS CLI:**

```bash
# 1. Gehe zu GitHub Actions
https://github.com/AndySchlegel/Ecokart-Webshop/actions

# 2. Wähle Workflow: "Nuclear Cleanup - Delete Everything"

# 3. Klicke "Run workflow"

# 4. Gib "NUCLEAR" ein zur Bestätigung (Großbuchstaben!)

# 5. Wähle Environment (development/staging/production)

# 6. Klicke "Run workflow"

# 7. Warte ~3-5 Minuten
```

**Was wird gelöscht:**
- ✅ Alle AWS Ressourcen via AWS CLI (komplett außerhalb Terraform)
- ✅ Terraform State File in S3
- ✅ DynamoDB Lock Table Entry
- ✅ Lambda, API Gateway, DynamoDB, Cognito, IAM, CloudWatch

**Dauer:** ~3-5 Minuten

### Option 2: Terraform Destroy (kann State-Issues haben)

**Automatisches Löschen via Terraform:**

```bash
# 1. Gehe zu GitHub Actions
https://github.com/AndySchlegel/Ecokart-Webshop/actions

# 2. Wähle Workflow: "Destroy Infrastructure"

# 3. Klicke "Run workflow"

# 4. Gib "destroy" ein zur Bestätigung

# 5. Wähle Environment (development/staging/production)

# 6. Optional: Delete Amplify Apps? (Ja/Nein)

# 7. Klicke "Run workflow"

# 8. Warte ~3-5 Minuten
```

**Was wird automatisch gelöscht:**
- ✅ Lambda Functions
- ✅ API Gateways (REST APIs)
- ✅ DynamoDB Tables (alle 4: products, users, carts, orders)
- ✅ Cognito User Pools
- ✅ IAM Roles & Policies
- ✅ CloudWatch Log Groups
- ✅ Amplify Apps (optional)

**⚠️ WICHTIG:** Nach Destroy **3-5 Minuten warten** bevor Re-Deploy! AWS braucht Zeit zum tatsächlichen Löschen.

**Dauer:** ~3-5 Minuten

### Via Terraform (Manuell)

```bash
# 1. Navigate to Terraform
cd terraform

# 2. Destroy
terraform destroy -auto-approve

# 3. ⏰ WICHTIG: Warten!
sleep 300  # 5 Minuten

# 4. Verifizieren (optional)
aws lambda list-functions --region eu-north-1 | grep ecokart
aws dynamodb list-tables --region eu-north-1 | grep ecokart
aws cognito-idp list-user-pools --max-results 60 --region eu-north-1 | grep ecokart
```

### Option 3: Manuell via Terraform CLI

**Lokales Destroy (für Testing/Debugging):**

```bash
# 1. Navigate to Terraform
cd terraform

# 2. Destroy
terraform destroy -auto-approve

# 3. ⏰ WICHTIG: Warten!
sleep 300  # 5 Minuten

# 4. Verifizieren (optional)
aws lambda list-functions --region eu-north-1 | grep ecokart
aws dynamodb list-tables --region eu-north-1 | grep ecokart
aws cognito-idp list-user-pools --max-results 60 --region eu-north-1 | grep ecokart
```

**⚠️ Hinweis:** Kann bei State-Issues fehlschlagen → dann Nuclear Cleanup nutzen

---

## 🔁 Destroy & Rebuild (Complete Cycle)

**Für Fresh Start oder Testing:**

```bash
# 1. Destroy via GitHub Actions
# (siehe oben - Destroy Infrastructure Workflow)

# 2. ⏰ Warten (3-5 Minuten!)
# AWS braucht Zeit zum tatsächlichen Löschen

# 3. Parameter Store Token prüfen (täglich nötig in Sandbox!)
aws ssm get-parameter \
  --name "/ecokart/github-token" \
  --with-decryption \
  --region eu-north-1

# Falls nicht vorhanden: Token wiederherstellen
aws ssm put-parameter \
  --name "/ecokart/github-token" \
  --value "ghp_YOUR_TOKEN" \
  --type "SecureString" \
  --overwrite \
  --region eu-north-1

# 4. Re-Deploy via GitHub Actions
# (Deploy Infrastructure Workflow ausführen)

# 5. Warte ~8-10 Minuten

# 6. Fertig! ✅
```

**Gesamtdauer:** ~15-20 Minuten (inkl. Wait Time)

---

## 🔍 Verifizierung nach Deployment

### URLs checken

```bash
# Option 1: Aus Terraform Output
cd terraform
terraform output

# Option 2: Aus GitHub Actions Workflow Summary
# https://github.com/AndySchlegel/Ecokart-Webshop/actions
# → Letzter Deploy Run → Summary Tab
```

### Ressourcen checken

```bash
# Lambda Functions
aws lambda list-functions --region eu-north-1 | grep ecokart

# DynamoDB Tables
aws dynamodb list-tables --region eu-north-1 | grep ecokart

# Cognito User Pools
aws cognito-idp list-user-pools --max-results 60 --region eu-north-1 | grep ecokart

# API Gateways
aws apigateway get-rest-apis --region eu-north-1 | grep ecokart

# Amplify Apps
aws amplify list-apps --region eu-north-1 | grep -i ecokart
```

### Test Login

```bash
# 1. Öffne Customer Shop
# https://main.dyoqwczz7hfmn.amplifyapp.com

# 2. Registriere neuen User
# Email: deine-email@example.com
# Password: Test1234!

# 3. Check Email für Verification Code

# 4. Login
# → Sollte zum Shop führen

# 5. Teste Add to Cart
# → Sollte funktionieren (200 OK in Network Tab)
```

---

## 🔐 Login-Daten

### Customer Frontend

- **URL:** Aus `terraform output amplify_app_url`
- **Registration:** Eigene Email-Adresse verwenden
- **Test-User:** `demo@ecokart.com` / `Demo1234!` (auto-created)

### Admin Frontend

- **URL:** Aus `terraform output admin_amplify_app_url`
- **Registration:** Eigene Email-Adresse verwenden
- **Admin-User:** Wird automatisch bei Deployment erstellt (Email aus Terraform Var)

### API Endpoint

- **URL:** Aus `terraform output api_url`
- **Auth:** Bearer Token (JWT von Cognito nach Login)

---

## 🆘 Troubleshooting

### "github_access_token not set"

**Problem:** Token fehlt in Terraform

```bash
# Lösung: Token aus Parameter Store holen
export TF_VAR_github_access_token=$(aws ssm get-parameter \
  --name "/ecokart/github-token" \
  --with-decryption \
  --query 'Parameter.Value' \
  --output text \
  --region eu-north-1)

# Verifizieren
echo $TF_VAR_github_access_token
```

### "Parameter /ecokart/github-token not found"

**Problem:** AWS Sandbox Budget-Cleanup hat Token gelöscht (täglich)

```bash
# Lösung: Token wiederherstellen
aws ssm put-parameter \
  --name "/ecokart/github-token" \
  --value "ghp_YOUR_TOKEN_HERE" \
  --type "SecureString" \
  --overwrite \
  --region eu-north-1
```

### "Lambda already exists" nach Destroy

**Problem:** AWS braucht Zeit zum Löschen

```bash
# Lösung 1: Warten (3-5 Minuten)
sleep 300

# Lösung 2: Manuell löschen
aws lambda delete-function \
  --function-name ecokart-development-api \
  --region eu-north-1

# Lösung 3: Cleanup Workflow ausführen
# GitHub Actions → "Manual Lambda Cleanup"
```

### "npm ci failed" in Workflow

**Problem:** Node.js Version Mismatch

```bash
# Lokales Debugging:
node --version  # Sollte 20.x sein

# Falls falsch: nvm nutzen
nvm install 20
nvm use 20

# Backend neu bauen
cd backend
npm ci
npm run build
```

### "Terraform State Lock" Error

**Problem:** Vorheriger Apply/Destroy wurde unterbrochen

```bash
# Lösung 1: Via AWS CLI (schnell)
aws dynamodb delete-item \
  --table-name ecokart-terraform-state-lock \
  --key '{"LockID": {"S": "ecokart-terraform-state-729403197965/development/terraform.tfstate"}}' \
  --region eu-north-1

# Lösung 2: Via Terraform (langsam)
cd terraform
terraform force-unlock <LOCK_ID>
```

### "Provider configuration not present" (State Corruption)

**Problem:** Terraform State ist korrupt (z.B. nach Architektur-Änderung)

```bash
# Lösung: Nuclear Cleanup verwenden
# GitHub Actions → "Nuclear Cleanup - Delete Everything"
# → Gib "NUCLEAR" ein
# → Warte 5 Minuten
# → Fresh Deploy ausführen
```

**Lesson Learned:** Niemals Terraform-Architektur ändern wenn State existiert! Erst Destroy, dann Architektur ändern, dann Deploy.

### Auto-Seeding funktioniert nicht

**Problem:** Migration Script schlägt fehl

```bash
# Debugging:
cd terraform
terraform apply

# Logs checken:
# → Terraform Output zeigt Fehler bei "null_resource.seed_dynamodb"

# Manuelle Ausführung:
cd backend/scripts
npm ci
node migrate-to-dynamodb-single.js

# Falls erfolgreich: Re-run Terraform Apply
```

### Amplify Build Failed

**Problem:** Frontend Build schlägt fehl

```bash
# 1. Amplify Logs checken
aws amplify list-jobs \
  --app-id <APP_ID> \
  --branch-name main \
  --region eu-north-1 \
  --max-items 1

# 2. Build Log URL öffnen (aus Output)

# 3. Häufige Ursachen:
# - Missing Environment Variables
# - npm ci failed (package-lock.json Mismatch)
# - Build script error

# 4. Lokaler Test:
cd frontend  # oder admin-frontend
npm ci
npm run build  # Sollte ohne Fehler durchlaufen
```

### 401 Unauthorized nach Login

**Problem:** Tokens werden nicht gespeichert oder sind abgelaufen

```bash
# 1. Browser DevTools → Console
localStorage  # Sollte Tokens enthalten (idToken, accessToken, refreshToken)

# Falls leer:
# → Frontend Auth Code hat Bug (siehe LESSONS_LEARNED.md #18)

# 2. Network Tab → Request Headers
# Authorization: Bearer <token>  # Sollte vorhanden sein

# 3. Lambda Logs checken
aws logs tail /aws/lambda/ecokart-development-api --follow --region eu-north-1

# Erwarte: "JWT validated successfully"
```

### DynamoDB Tables leer nach Deployment

**Problem:** Auto-Seeding fehlgeschlagen

```bash
# 1. Manuell re-seed via Workflow
# GitHub Actions → "Re-Seed Database" → Run workflow

# 2. Oder lokal:
cd backend/scripts
node migrate-to-dynamodb-single.js

# 3. Verifizieren:
aws dynamodb scan \
  --table-name ecokart-products \
  --region eu-north-1 \
  --limit 5
```

---

## 📖 Weitere Dokumentation

### Guides
- **Multi-Environment Setup:** [MULTI_ENVIRONMENT_SETUP.md](MULTI_ENVIRONMENT_SETUP.md)
- **Cognito Authentication:** [COGNITO_IMPLEMENTATION.md](COGNITO_IMPLEMENTATION.md)
- **Local Development:** [LOCAL_SETUP.md](LOCAL_SETUP.md) (TODO)
- **Troubleshooting:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md) (TODO)

### Architecture
- **System Design:** [../architecture/SYSTEM_DESIGN.md](../architecture/SYSTEM_DESIGN.md)
- **Database Schema:** [../architecture/DATABASE_SCHEMA.md](../architecture/DATABASE_SCHEMA.md) (TODO)
- **API Endpoints:** [../architecture/API_ENDPOINTS.md](../architecture/API_ENDPOINTS.md) (TODO)

### Development
- **Technical Documentation:** [../DEVELOPMENT.md](../DEVELOPMENT.md)
- **Lessons Learned:** [../LESSONS_LEARNED.md](../LESSONS_LEARNED.md)
- **Action Plan:** [../ACTION_PLAN.md](../ACTION_PLAN.md)

---

## 🎯 100% Reproduzierbarkeit

**Das System ist designed um komplett neu aufgebaut zu werden:**

### Szenario: "Alles ist weg!"

```bash
# 1. Bootstrap OIDC (einmalig)
# GitHub Actions → "Bootstrap OIDC Infrastructure"

# 2. GitHub Token wiederherstellen
aws ssm put-parameter --name "/ecokart/github-token" --value "ghp_XXX" --type "SecureString" --region eu-north-1

# 3. Deploy
git push origin develop

# 4. Warte 8-10 Minuten

# 5. ✅ FERTIG! Komplette Infrastruktur neu deployed
```

**Keine manuellen AWS Console-Schritte nötig!**

### Portierbar zu anderem AWS Account

```bash
# 1. Neuer AWS Account
aws configure --profile new-account

# 2. Bootstrap OIDC im neuen Account
cd terraform/github-actions-setup
terraform init
terraform apply

# 3. GitHub Secret updaten (neue Role ARN)
# GitHub Settings → Secrets → AWS_ROLE_ARN

# 4. Token im neuen Account speichern
aws ssm put-parameter --name "/ecokart/github-token" ...

# 5. Deploy
git push origin develop

# ✅ Webshop läuft im neuen Account!
```

**Dauer:** ~20 Minuten für komplette Migration

---

**Erstellt:** 22. November 2025
**Letzte Aktualisierung:** 22. November 2025
**Autor:** Andy Schlegel
**Status:** Living Document

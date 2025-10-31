# Semi-Automatisches AWS Deployment - Ecokart Webshop

## Übersicht

Diese Anleitung beschreibt das **semi-automatische Deployment** des kompletten Ecokart Webshops auf AWS mittels Terraform.

**⚠️ WICHTIG:** Aufgrund von AWS Amplify + GitHub OAuth-Beschränkungen ist **ein manueller Schritt** erforderlich:
- Die GitHub-Verbindung muss **einmalig** in der AWS Console bestätigt werden
- Danach läuft alles vollautomatisch
- Dieser Schritt ist bei AWS Amplify + GitHub **technisch nicht vermeidbar**

### Was wird automatisch deployed?

✅ **DynamoDB Datenbank** (4 Tabellen)
✅ **Lambda Backend** (Express.js API)
✅ **API Gateway** (REST API Endpoint)
✅ **Amplify Customer Frontend** (Next.js SSR)
✅ **Amplify Admin Frontend** (Next.js SSR)
✅ **GitHub-Integration** (automatisch verbunden)
✅ **Initial Builds** (werden automatisch gestartet)
✅ **CloudFront Distribution** (automatisch konfiguriert)

**Dauer:** ~5-8 Minuten für den kompletten Stack

---

## Voraussetzungen

### 1. AWS CLI installiert und konfiguriert

```bash
aws --version
aws configure list
```

### 2. Terraform installiert (>= 1.5.0)

```bash
terraform --version
```

### 3. GitHub Personal Access Token

Siehe: `docs/AMPLIFY_GITHUB_TOKEN.md`

**Erforderliche Scopes:**
- ✅ `repo` (Full control of private repositories)

---

## Schritt-für-Schritt Anleitung

### Schritt 1: Repository klonen

```bash
git clone https://github.com/AndySchlegel/Ecokart-Webshop.git
cd Ecokart-Webshop
```

### Schritt 2: Terraform Variablen konfigurieren

```bash
cd terraform/examples/basic
```

Prüfe `terraform.tfvars`:

```hcl
# Allgemeine Konfiguration
aws_region   = "eu-north-1"
project_name = "ecokart"
environment  = "production"

# JWT Secret (ERFORDERLICH - min. 32 Zeichen)
jwt_secret = "kNF00qv0sFP0/8oi8hQo4fWieqoY0ESmsWzy3XXCA9Y="

# Lambda Source Path
lambda_source_path = "../../../backend"

# GitHub Access Token (ERFORDERLICH)
github_access_token = "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Optional: Admin Frontend Basic Auth Password
# admin_basic_auth_password = "secure-admin-password"
```

**WICHTIG:** `github_access_token` muss gesetzt sein!

### Schritt 3: Terraform initialisieren

```bash
terraform init
```

**Output:**
```
Initializing modules...
Initializing the backend...
Initializing provider plugins...
- Finding hashicorp/aws versions matching "~> 5.0"...
- Installing hashicorp/aws v5.x.x...

Terraform has been successfully initialized!
```

### Schritt 4: Deployment-Plan prüfen (Optional)

```bash
terraform plan
```

Zeigt alle Ressourcen an, die erstellt werden.

### Schritt 5: Stack deployen

```bash
terraform apply -auto-approve
```

**Was passiert jetzt automatisch:**

1. **DynamoDB Tabellen erstellen** (~30 Sekunden)
   - ecokart-products
   - ecokart-users
   - ecokart-carts
   - ecokart-orders

2. **Lambda Backend deployen** (~2 Minuten)
   - Quellcode packen
   - Lambda Function erstellen
   - IAM Role konfigurieren
   - Environment Variables setzen

3. **API Gateway erstellen** (~30 Sekunden)
   - REST API konfigurieren
   - Lambda Integration
   - CORS Settings
   - Deployment Stage "Prod"

4. **Amplify Customer Frontend** (~1 Minute)
   - App erstellen
   - GitHub Repository verknüpfen
   - Build konfigurieren
   - Environment Variables setzen
   - ⚠️ **GitHub OAuth noch nicht bestätigt**

5. **Amplify Admin Frontend** (~1 Minute)
   - Separate App erstellen
   - GitHub Repository verknüpfen
   - Build konfigurieren
   - Environment Variables setzen
   - ⚠️ **GitHub OAuth noch nicht bestätigt**

### Schritt 6: GitHub-Verbindung herstellen (EINMALIG!)

Nach `terraform apply` muss die GitHub-Verbindung **einmalig manuell** bestätigt werden:

```bash
# Helper-Script ausführen (öffnet automatisch die richtigen URLs)
# Von terraform/examples/basic/ aus:
../../scripts/connect-github.sh
```

**Was das Script macht:**
1. Liest die Amplify App IDs aus Terraform Output
2. Generiert die AWS Console URLs
3. Öffnet die URLs automatisch im Browser
4. Zeigt klare Anweisungen an

**Manuelle Schritte in der AWS Console:**

Für **JEDE** Amplify App (Customer + Admin):

1. **Klicke auf die gelbe "Update required" Warnung**
2. **Klicke "Reconnect repository"**
3. **Wähle "GitHub" als Provider**
4. **Autorisiere AWS Amplify** (GitHub OAuth-Popup)
5. **Warte bis Status ✓ "Connected" zeigt**
6. **Build startet automatisch** nach der Verbindung

**Dauer:** ~2-3 Minuten pro App

**Terraform Output nach Completion:**

```
╔═══════════════════════════════════════════════════════════════════╗
║                    Ecokart AWS Deployment                         ║
║                      Setup erfolgreich!                           ║
╚═══════════════════════════════════════════════════════════════════╝

📋 Erstellte Ressourcen:

DynamoDB Tables:
  • ecokart-products
  • ecokart-users
  • ecokart-carts
  • ecokart-orders

Lambda Backend:
  • Function: ecokart-production-api
  • Runtime:  nodejs20.x
  • Memory:   512 MB

API Gateway:
  • URL: https://xyz.execute-api.eu-north-1.amazonaws.com/Prod
  • Stage: Prod

Amplify Frontend:
  • App URL: https://main.dxxxxxxxxx.amplifyapp.com
  • Branch: main

Admin Frontend:
  • App URL: https://main.dyyyyyyyyy.amplifyapp.com
  • Branch: main

🚀 Nächste Schritte:
────────────────────────────────────────────────────────────────────

1. DynamoDB mit Daten füllen
2. Testuser erstellen
3. API testen
```

### Schritt 7: DynamoDB mit Test-Daten befüllen

**Warte bis beide Amplify Builds abgeschlossen sind!** (prüfe in der AWS Console)

```bash
cd ../../../backend
npm run dynamodb:migrate:single -- --region eu-north-1
```

**Output:**
```
✓ Connected to DynamoDB in region eu-north-1
✓ Migrating products...
✓ Successfully migrated 31 products
```

### Schritt 7: Test-User erstellen

```bash
node scripts/create-test-user.js
```

**Output:**
```
✓ Test user created successfully!
  Email: checkout@test.com
  Password: Test123!
```

### Schritt 8: Deployment verifizieren

#### API testen:
```bash
curl https://xyz.execute-api.eu-north-1.amazonaws.com/Prod/api/products
```

#### Frontend aufrufen:
```bash
# Customer Frontend
open https://main.dxxxxxxxxx.amplifyapp.com

# Admin Frontend
open https://main.dyyyyyyyyy.amplifyapp.com
```

#### Build Status prüfen:
```bash
# Customer Frontend Build
aws amplify list-jobs \
  --app-id <CUSTOMER_APP_ID> \
  --branch-name main \
  --region eu-north-1

# Admin Frontend Build
aws amplify list-jobs \
  --app-id <ADMIN_APP_ID> \
  --branch-name main \
  --region eu-north-1
```

---

## Was ist NEU? (Verbesserung)

### Vorher (Vollständig Manuell)

1. ❌ `terraform apply`
2. ❌ AWS Console öffnen → Amplify
3. ❌ Richtige App suchen und öffnen
4. ❌ GitHub-Verbindung manuell bestätigen
5. ❌ "Deploy Branch" manuell klicken
6. ❌ Warten auf Build
7. ❌ Gleicher Prozess für Admin-Frontend
8. ❌ URLs manuell raussuchen

**Dauer:** ~15-20 Minuten + viel Klicken und Suchen

### Jetzt (Semi-Automatisch mit Helper)

1. ✅ `terraform apply -auto-approve`
2. ✅ `./scripts/connect-github.sh` (öffnet automatisch die richtigen URLs)
3. ⚠️ GitHub-Verbindung bestätigen (EINMALIG, ~2-3 Minuten)
4. ✅ Builds starten automatisch
5. ✅ Alle weiteren Deployments vollautomatisch

**Dauer:** ~8-10 Minuten, **minimales Klicken** (nur OAuth einmalig)

### Technische Details der Automatisierung

#### Automatische GitHub-Verbindung

```hcl
resource "aws_amplify_app" "frontend" {
  access_token = var.github_access_token  # ← Eliminiert manuelle OAuth
  repository   = var.repository
  # ...
}
```

Das GitHub Access Token ermöglicht Terraform, die GitHub-Verbindung automatisch herzustellen.

#### GitHub OAuth-Verbindung (Manuelle Bestätigung erforderlich)

**⚠️ Technische Limitation:**

AWS Amplify mit GitHub erfordert einen **OAuth-Flow**, der **nicht** via Terraform automatisierbar ist:

```hcl
resource "aws_amplify_app" "frontend" {
  repository   = "https://github.com/owner/repo"
  access_token = var.github_access_token  # ← Erstellt App, aber OAuth fehlt
}
```

Der `access_token` Parameter:
- ✅ Erstellt die Amplify App mit GitHub Repository
- ✅ Konfiguriert Build Settings
- ❌ Autorisiert **NICHT** vollständig den OAuth-Flow
- ❌ GitHub Webhook wird erst nach manueller Bestätigung erstellt

**Warum ist das so?**

AWS Amplify benötigt:
1. **Repository-Zugriff** (via Token) ✅ Terraform kann das
2. **Webhook-Erstellung** (via OAuth) ❌ Terraform kann das NICHT
3. **Deploy Key Installation** (via OAuth) ❌ Terraform kann das NICHT

Die GitHub OAuth-Autorisierung muss **interaktiv** im Browser erfolgen.

**Unsere Lösung:**

Helper-Script `connect-github.sh`:
- Liest Amplify App IDs aus Terraform State
- Generiert direkte AWS Console URLs
- Öffnet URLs automatisch im Browser
- Zeigt klare Schritt-für-Schritt Anleitung

**Nach einmaliger Bestätigung:**
- ✅ Alle Builds laufen automatisch
- ✅ Jeder `git push` deployed automatisch
- ✅ Kein weiteres Klicken nötig

---

## Troubleshooting

### Problem: "Error acquiring the state lock"

**Ursache:** Terraform State File ist gelockt

**Lösung:**
```bash
terraform force-unlock <LOCK_ID>
```

### Problem: "Invalid GitHub Access Token"

**Ursache:** Token abgelaufen oder falsch

**Lösung:**
1. Neues Token erstellen (siehe `docs/AMPLIFY_GITHUB_TOKEN.md`)
2. In `terraform.tfvars` aktualisieren
3. `terraform apply` erneut ausführen

### Problem: "Repository provider not supported"

**Ursache:** Repository Format ist falsch ODER Token-Typ ist falsch

**Lösung 1 - Repository Format:**
```hcl
# RICHTIG (Vollständige HTTPS URL):
github_repository = "https://github.com/AndySchlegel/Ecokart-Webshop"

# FALSCH (Nur owner/repo):
github_repository = "AndySchlegel/Ecokart-Webshop"
```

**Lösung 2 - Token-Typ:**
AWS Amplify funktioniert **NUR** mit **Classic Tokens** (ghp_...), **NICHT** mit Fine-grained tokens!

Erstelle ein Classic Token:
1. GitHub → Settings → Developer settings → Personal access tokens → **Tokens (classic)**
2. Generate new token (classic)
3. Scope: `repo` (Full control of private repositories)
4. Token muss mit `ghp_` beginnen

**Lösung 3 - Token Validierung:**
```bash
# Token testen
curl -H "Authorization: token ghp_YOUR_TOKEN" https://api.github.com/user

# Scopes prüfen
curl -I -H "Authorization: token ghp_YOUR_TOKEN" https://api.github.com/user | grep x-oauth-scopes
# Sollte ausgeben: x-oauth-scopes: repo
```

Nach Korrektur:
```bash
terraform destroy -auto-approve
terraform apply -auto-approve
```

### Problem: "Amplify Build failed"

**Ursache:** Build-Fehler im Code

**Lösung:**
```bash
# Build Logs anzeigen
aws amplify get-job \
  --app-id <APP_ID> \
  --branch-name main \
  --job-id <JOB_ID> \
  --region eu-north-1
```

### Problem: "DynamoDB table already exists"

**Ursache:** Vorheriges Deployment nicht vollständig gelöscht

**Lösung:**
```bash
# Kompletten Stack löschen
terraform destroy -auto-approve

# Neu deployen
terraform apply -auto-approve
```

### Problem: "Lambda deployment package too large"

**Ursache:** node_modules zu groß

**Lösung:**
```bash
cd ../../../backend
rm -rf node_modules
npm ci --production
cd ../../terraform/examples/basic
terraform apply
```

---

## Stack löschen

```bash
terraform destroy -auto-approve
```

**WARNUNG:** Löscht ALLE Ressourcen inkl. Datenbank!

**Was wird gelöscht:**
- ✅ Amplify Apps (Frontend + Admin)
- ✅ Lambda Function
- ✅ API Gateway
- ✅ DynamoDB Tabellen (inkl. Daten!)
- ✅ CloudWatch Logs
- ✅ IAM Roles

---

## Best Practices

### 1. Environment-spezifische Deployments

```bash
# Development
environment = "development"

# Production
environment = "production"
enable_point_in_time_recovery = true
enable_api_gateway_access_logs = true
```

### 2. Secrets Management

**NIEMALS in Git committen:**
- ❌ `terraform.tfvars`
- ❌ GitHub Access Token
- ❌ JWT Secret

**Stattdessen:**
- ✅ AWS Secrets Manager
- ✅ Environment Variables
- ✅ `.gitignore` nutzen

### 3. State Management

**Remote State für Team-Arbeit:**

```hcl
terraform {
  backend "s3" {
    bucket = "ecokart-terraform-state"
    key    = "production/terraform.tfstate"
    region = "eu-north-1"
  }
}
```

### 4. Monitoring

```bash
# Lambda Logs
aws logs tail /aws/lambda/ecokart-production-api --follow

# API Gateway Logs
aws logs tail /aws/apigateway/ecokart-api --follow

# Amplify Build Logs
aws amplify list-jobs --app-id <APP_ID> --branch-name main
```

---

## Kosten

**Geschätzte monatliche AWS-Kosten bei geringem Traffic:**

| Service | Kosten/Monat |
|---------|--------------|
| Amplify Hosting (2 Apps) | $5-10 |
| Lambda (1M requests) | $0-1 (Free Tier) |
| API Gateway (1M requests) | $0-1 (Free Tier) |
| DynamoDB (On-Demand) | $0-2 |
| CloudWatch Logs | $0-1 |
| **Gesamt** | **~$5-15/Monat** |

---

## Zusammenfassung

### Befehle für Semi-Automatisches Deployment

```bash
# 1. Terraform initialisieren
cd terraform/examples/basic
terraform init

# 2. Stack deployen (automatisch!)
terraform apply -auto-approve

# 3. GitHub-Verbindung herstellen (einmalig!)
./scripts/connect-github.sh
# → Öffnet automatisch AWS Console URLs
# → Klicke "Reconnect repository" für jede App
# → Warte auf "Connected" Status
# → Builds starten automatisch

# 4. Daten befüllen (nach Builds abgeschlossen)
cd ../../../backend
npm run dynamodb:migrate:single -- --region eu-north-1
node scripts/create-test-user.js

# 5. URLs aus Output kopieren und aufrufen
# ✓ Fertig!
```

**Das wars! 🎉**

Nur **ein manueller Schritt** (GitHub OAuth), alles andere automatisch!

---

## Weiterführende Dokumentation

- `docs/DEPLOYMENT.md` - Detaillierte Deployment-Dokumentation
- `docs/AMPLIFY_GITHUB_TOKEN.md` - GitHub Token Anleitung
- `terraform/README.md` - Terraform Module Dokumentation
- `docs/FAQ.md` - Häufig gestellte Fragen

---

**Erstellt:** 31. Oktober 2025
**Autor:** Claude Code
**Version:** 1.0.0

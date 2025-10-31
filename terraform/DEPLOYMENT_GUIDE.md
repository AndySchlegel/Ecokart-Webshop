# Ecokart AWS Deployment - Schritt-für-Schritt Anleitung

Diese Anleitung führt dich durch das komplette Deployment der Ecokart AWS-Infrastruktur mit Terraform.

## 📋 Inhaltsverzeichnis

- [Voraussetzungen prüfen](#voraussetzungen-prüfen)
- [GitHub Token erstellen](#github-token-erstellen)
- [AWS SSO Login](#aws-sso-login)
- [Backend vorbereiten](#backend-vorbereiten)
- [Terraform konfigurieren](#terraform-konfigurieren)
- [Infrastruktur deployen](#infrastruktur-deployen)
- [Daten migrieren](#daten-migrieren)
- [Deployment testen](#deployment-testen)
- [Troubleshooting](#troubleshooting)

---

## ✅ Voraussetzungen prüfen

### 1. Software-Versionen prüfen

```bash
# Terraform Version prüfen (>= 1.5.0)
terraform version

# AWS CLI Version prüfen (>= 2.0)
aws --version

# Node.js Version prüfen (>= 20.x)
node --version

# Git Version prüfen
git --version
```

**Erwartete Ausgaben:**
```
Terraform v1.5.0 (oder höher)
aws-cli/2.x.x (oder höher)
v20.x.x (oder höher)
git version 2.x.x
```

### 2. AWS Account Zugriff prüfen

```bash
# AWS SSO Status prüfen
aws sts get-caller-identity --profile Teilnehmer-729403197965
```

**Erwartete Ausgabe:**
```json
{
    "UserId": "...",
    "Account": "729403197965",
    "Arn": "arn:aws:sts::729403197965:assumed-role/..."
}
```

Falls **Fehler**: Siehe [AWS SSO Login](#aws-sso-login)

---

## 🔑 GitHub Token erstellen

### Schritt 1: GitHub öffnen

Gehe zu: https://github.com/settings/tokens

### Schritt 2: "Generate new token (classic)" klicken

![GitHub Token erstellen](../docs/github-token-screenshot.png)

### Schritt 3: Token konfigurieren

**Note:** `Terraform Amplify Deployment`

**Expiration:** `90 days` (oder länger)

**Select scopes:**
- ✅ **repo** (Full control of private repositories)
  - ✅ repo:status
  - ✅ repo_deployment
  - ✅ public_repo

### Schritt 4: Token generieren & kopieren

Klicke **"Generate token"**

⚠️ **WICHTIG:** Token wird nur EINMAL angezeigt!

**Kopiere den Token:** `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**Sichere ihn temporär**, z.B. in Notizen-App.

---

## 🔐 AWS SSO Login

### Login durchführen

```bash
# AWS SSO Login
aws sso login --profile Teilnehmer-729403197965
```

**Was passiert:**
1. Browser öffnet sich automatisch
2. AWS SSO Login-Seite erscheint
3. Login mit deinen AWS Credentials
4. "Allow" klicken
5. Browser-Tab kann geschlossen werden

**Erfolgs-Meldung in Terminal:**
```
Successfully logged in to the AWS SSO session
```

### Login-Status prüfen

```bash
# Prüfe ob Login funktioniert hat
aws sts get-caller-identity --profile Teilnehmer-729403197965
```

**Session-Dauer:** 8 Stunden (danach erneut `aws sso login` ausführen)

---

## 📦 Backend vorbereiten

### Dependencies installieren

```bash
# Ins Backend-Verzeichnis wechseln
cd backend

# Node.js Dependencies installieren (ca. 30 Sekunden)
npm install

# TypeScript zu JavaScript kompilieren (ca. 5 Sekunden)
npm run build
```

**Erwartete Ausgabe:**
```
added 234 packages in 28s

> ecokart-backend@1.0.0 build
> tsc

# Keine Fehler = Erfolg!
```

**Prüfe Build-Output:**
```bash
# Prüfe ob dist/ Verzeichnis existiert
ls -la dist/

# Sollte zeigen:
# index.js
# lambda.js
# routes/
# ...
```

---

## ⚙️ Terraform konfigurieren

### Schritt 1: Ins Terraform-Verzeichnis wechseln

```bash
# Von Repository-Root aus:
cd terraform/examples/basic
```

### Schritt 2: terraform.tfvars erstellen

```bash
# Kopiere Beispiel-Datei
cp terraform.tfvars.example terraform.tfvars

# Öffne mit Editor
nano terraform.tfvars
# oder
code terraform.tfvars
```

### Schritt 3: terraform.tfvars ausfüllen

**Minimale Konfiguration:**

```hcl
# ============================================================================
# Ecokart Terraform Konfiguration
# ============================================================================

# ----------------------------------------------------------------------------
# Allgemeine Einstellungen
# ----------------------------------------------------------------------------
project_name = "ecokart"
environment  = "development"
aws_region   = "eu-north-1"

# ----------------------------------------------------------------------------
# Sicherheit (PFLICHT)
# ----------------------------------------------------------------------------

# JWT Secret für Token-Signierung (mindestens 32 Zeichen!)
# Generiere mit: openssl rand -base64 32
jwt_secret = "DEIN-SUPER-SICHERES-SECRET-HIER-MINDESTENS-32-ZEICHEN-LANG"

# GitHub Personal Access Token (siehe Schritt "GitHub Token erstellen")
github_access_token = "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# ----------------------------------------------------------------------------
# GitHub Repository
# ----------------------------------------------------------------------------
github_repository = "https://github.com/AndySchlegel/Ecokart-Webshop"
github_branch     = "main"

# ----------------------------------------------------------------------------
# DynamoDB Einstellungen
# ----------------------------------------------------------------------------
dynamodb_billing_mode   = "PROVISIONED"    # Für Entwicklung (günstiger)
dynamodb_read_capacity  = 5                # Read Capacity Units
dynamodb_write_capacity = 5                # Write Capacity Units

# ----------------------------------------------------------------------------
# Lambda Einstellungen
# ----------------------------------------------------------------------------
lambda_runtime     = "nodejs20.x"
lambda_memory_size = 512                   # MB
lambda_timeout     = 30                    # Sekunden
lambda_source_path = "../../../backend"    # Relativer Pfad zum Backend

# ----------------------------------------------------------------------------
# Amplify Frontend
# ----------------------------------------------------------------------------
enable_amplify           = true
amplify_framework        = "Next.js - SSR"
amplify_monorepo_app_root = "frontend"

# Basic Auth für Demo-Umgebung (optional)
basic_auth_enabled  = true
basic_auth_user     = "demo"
basic_auth_password = "test1234"

# ----------------------------------------------------------------------------
# API Gateway
# ----------------------------------------------------------------------------
api_gateway_stage_name = "Prod"

# ----------------------------------------------------------------------------
# Tags (optional, für bessere Organisation)
# ----------------------------------------------------------------------------
additional_tags = {
  Example    = "Basic"
  Deployment = "Terraform"
  Owner      = "AndySchlegel"
}
```

**⚠️ Wichtig:**
- `jwt_secret`: Mindestens 32 Zeichen, am besten generiert mit `openssl rand -base64 32`
- `github_access_token`: Dein GitHub Token von vorher

**Speichern:** `Ctrl+O` → Enter → `Ctrl+X` (nano) oder `Cmd+S` (VS Code)

### Schritt 4: Terraform initialisieren

```bash
# Terraform initialisieren (lädt Provider herunter)
terraform init
```

**Erwartete Ausgabe:**
```
Initializing the backend...
Initializing modules...
Initializing provider plugins...
- Finding hashicorp/aws versions matching "~> 5.0"...
- Installing hashicorp/aws v5.x.x...
- Installed hashicorp/aws v5.x.x

Terraform has been successfully initialized!
```

---

## 🚀 Infrastruktur deployen

### Schritt 1: Deployment-Plan ansehen

```bash
# Zeige was Terraform erstellen wird
terraform plan
```

**Was du sehen solltest:**
```
Plan: 19 to add, 0 to change, 0 to destroy.

Terraform will perform the following actions:

  # module.ecokart.module.dynamodb.aws_dynamodb_table.products will be created
  # module.ecokart.module.dynamodb.aws_dynamodb_table.users will be created
  # module.ecokart.module.dynamodb.aws_dynamodb_table.carts will be created
  # module.ecokart.module.dynamodb.aws_dynamodb_table.orders will be created
  # module.ecokart.module.lambda.aws_lambda_function.api will be created
  # module.ecokart.module.lambda.aws_api_gateway_rest_api.api will be created
  # module.ecokart.module.amplify[0].aws_amplify_app.frontend will be created
  # ... und weitere Ressourcen
```

**Prüfe:**
- ✅ Keine Fehler in der Ausgabe
- ✅ Ressourcenanzahl passt (ca. 19 Ressourcen)
- ✅ Module names sehen korrekt aus

### Schritt 2: Deployment starten

```bash
# Infrastruktur erstellen (5-7 Minuten)
terraform apply
```

**Terraform fragt nach Bestätigung:**
```
Do you want to perform these actions?
  Terraform will perform the actions described above.
  Only 'yes' will be accepted to approve.

  Enter a value:
```

**Eingabe:** `yes` + Enter

**Was passiert (ca. 5-7 Minuten):**

```
Schritt 1: DynamoDB Tables (10 Sekunden)
  ✅ ecokart-products erstellt
  ✅ ecokart-users erstellt
  ✅ ecokart-carts erstellt
  ✅ ecokart-orders erstellt

Schritt 2: Lambda & API Gateway (30 Sekunden)
  ⏳ Backend wird gebaut (TypeScript → JavaScript)
  ⏳ ZIP-Archiv wird erstellt
  ✅ Lambda Function deployed
  ✅ API Gateway konfiguriert

Schritt 3: Amplify (3-4 Minuten)
  ✅ Amplify App erstellt
  ⏳ GitHub verbunden
  ⏳ Frontend wird gebaut (Next.js Build)
  ⏳ Deployment läuft...
  ✅ Frontend deployed
```

### Schritt 3: Deployment-Output prüfen

**Nach erfolgreichem Deployment siehst du:**

```
Apply complete! Resources: 19 added, 0 changed, 0 destroyed.

Outputs:

╔═══════════════════════════════════════════════════════════════════╗
║                    Ecokart AWS Deployment                         ║
║                      Setup erfolgreich!                           ║
╚═══════════════════════════════════════════════════════════════════╝

📋 Erstellte Ressourcen:
────────────────────────────────────────────────────────────────────

DynamoDB Tables:
  • ecokart-products  (ecokart-products)
  • ecokart-users     (ecokart-users)
  • ecokart-carts     (ecokart-carts)
  • ecokart-orders    (ecokart-orders)

Lambda Backend:
  • Function: ecokart-development-api
  • Runtime:  nodejs20.x
  • Memory:   512 MB

API Gateway:
  • URL: https://abc123xyz.execute-api.eu-north-1.amazonaws.com/Prod/
  • Stage: Prod

Amplify Frontend:
  • App URL: https://main.d1a2b3c4d5.amplifyapp.com
  • Branch: main

🚀 Nächste Schritte:
────────────────────────────────────────────────────────────────────

1. DynamoDB mit Daten füllen:
   cd ../../../backend
   npm run dynamodb:migrate:single -- --region eu-north-1

2. Testuser erstellen (optional):
   cd ../../../backend
   node scripts/create-test-user.js
   → Login: demo@ecokart.com / Demo1234!

3. API testen:
   curl https://abc123xyz.execute-api.eu-north-1.amazonaws.com/Prod/api/products
```

**⚠️ Wichtig:** Kopiere die URLs (API Gateway + Amplify), du brauchst sie später!

---

## 💾 Daten migrieren

### Schritt 1: DynamoDB-Daten migrieren

```bash
# Von terraform/examples/basic zurück ins Backend-Verzeichnis
cd ../../../backend

# Daten migrieren (ca. 30 Sekunden)
npm run dynamodb:migrate:single -- --region eu-north-1
```

**Erwartete Ausgabe:**
```
🚀 Starting migration to DynamoDB...

Region: eu-north-1
Endpoint: AWS Cloud

⚠️  Using PutCommand instead of BatchWriteCommand to comply with SCP restrictions

📦 Migrating 31 products (using PutCommand to avoid SCP restrictions)...
  ✅ Progress: 5/31 products migrated
  ✅ Progress: 10/31 products migrated
  ✅ Progress: 15/31 products migrated
  ✅ Progress: 20/31 products migrated
  ✅ Progress: 25/31 products migrated
  ✅ Progress: 31/31 products migrated
✅ Products migration complete! (31/31 successful)

👥 Migrating 2 users...
✅ Users migration complete! (2/2 successful)

🛒 Migrating 2 carts...
✅ Carts migration complete! (2/2 successful)

📋 Migrating 7 orders...
✅ Orders migration complete! (7/7 successful)

✨ Migration completed successfully!
```

**✅ Erfolg:** Alle 42 Items wurden migriert (31 + 2 + 2 + 7)

### Schritt 2: Testuser erstellen

```bash
# Testuser für Demo-Login erstellen (5 Sekunden)
node scripts/create-test-user.js
```

**Erwartete Ausgabe:**
```
🔐 Erstelle Testuser...

✅ Testuser erfolgreich erstellt!

╔═══════════════════════════════════════╗
║        LOGIN TESTDATEN                ║
╠═══════════════════════════════════════╣
║ Email:    demo@ecokart.com            ║
║ Passwort: Demo1234!                   ║
╚═══════════════════════════════════════╝
```

**Notiere dir die Login-Daten!**

---

## ✅ Deployment testen

### Test 1: API testen (Backend)

```bash
# API Health Check
curl https://DEINE-API-ID.execute-api.eu-north-1.amazonaws.com/Prod/health

# Erwartete Ausgabe:
# {"status":"ok","message":"Ecokart Lambda is running"}
```

```bash
# Produkte abfragen (sollte 31 Produkte zurückgeben)
curl https://DEINE-API-ID.execute-api.eu-north-1.amazonaws.com/Prod/api/products | jq '.items | length'

# Erwartete Ausgabe:
# 31
```

```bash
# Einzelnes Produkt abfragen
curl https://DEINE-API-ID.execute-api.eu-north-1.amazonaws.com/Prod/api/products/air-legacy-011 | jq '.name'

# Erwartete Ausgabe:
# "Air Max 270 Urban"
```

**✅ API funktioniert:** Wenn du JSON-Daten siehst

### Test 2: Frontend testen (Amplify)

**Browser öffnen:**
```bash
# macOS
open https://main.DEINE-APP-ID.amplifyapp.com

# Linux
xdg-open https://main.DEINE-APP-ID.amplifyapp.com

# Windows
start https://main.DEINE-APP-ID.amplifyapp.com
```

**Basic Auth Dialog:**
- Username: `demo`
- Passwort: `test1234`

**Was du sehen solltest:**
1. ✅ Hero Section: "Reach Your Peak"
2. ✅ Trust Badges (Versand, Zahlung, etc.)
3. ✅ Featured Products mit **31 Produkten**
4. ✅ Produktbilder laden korrekt
5. ✅ Navigation funktioniert

**⚠️ Falls 404 Error:**
- Mache Hard Refresh: `Ctrl+Shift+R` (Windows/Linux) oder `Cmd+Shift+R` (Mac)
- Oder öffne Inkognito-Tab

### Test 3: Login testen

```bash
# Frontend Login-Seite öffnen
open https://main.DEINE-APP-ID.amplifyapp.com/login
```

**Login-Daten:**
- Email: `demo@ecokart.com`
- Passwort: `Demo1234!`

**Nach erfolgreichem Login:**
- ✅ Weiterleitung zur Homepage
- ✅ "Logout" Button in Navigation
- ✅ Produkte zum Warenkorb hinzufügen möglich
- ✅ Checkout-Prozess funktioniert

---

## 🎉 Deployment erfolgreich!

**Du hast erfolgreich deployed:**
- ✅ 4 DynamoDB Tables mit 42 Items
- ✅ Lambda Function mit Express.js Backend
- ✅ API Gateway mit Public Endpoint
- ✅ Amplify Frontend mit Next.js SSR
- ✅ CloudFront CDN (automatisch via Amplify)
- ✅ Basic Authentication
- ✅ Automatisches GitHub Deployment

**Nächste Schritte:**
1. Custom Domain einrichten (optional)
2. SSL-Zertifikat hinzufügen (optional)
3. CloudWatch Monitoring aktivieren
4. Production-Secrets in AWS Secrets Manager verschieben

---

## 🔄 Destroy & Re-Deploy testen

**Um zu testen ob alles reproduzierbar ist:**

```bash
# 1. Ins Terraform-Verzeichnis
cd terraform/examples/basic

# 2. Alles löschen (2-3 Minuten)
terraform destroy -auto-approve

# 3. Neu deployen (5-7 Minuten)
terraform apply -auto-approve

# 4. Daten migrieren (30 Sekunden)
cd ../../../backend
npm run dynamodb:migrate:single -- --region eu-north-1
node scripts/create-test-user.js

# ✅ Identischer Stand wiederhergestellt!
```

---

## 🐛 Troubleshooting

### Problem: "terraform: command not found"

**Lösung:**
```bash
# Terraform installieren (macOS)
brew install terraform

# Terraform installieren (Linux)
wget https://releases.hashicorp.com/terraform/1.5.0/terraform_1.5.0_linux_amd64.zip
unzip terraform_1.5.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/
```

### Problem: "AWS SSO session expired"

**Symptome:**
```
Error: error getting caller identity: operation error STS: GetCallerIdentity
```

**Lösung:**
```bash
# Erneut einloggen
aws sso login --profile Teilnehmer-729403197965
```

### Problem: "DynamoDB BatchWriteItem denied"

**Symptome:**
```
Error: User is not authorized to perform: dynamodb:BatchWriteItem
```

**Lösung:**
- ✅ Bereits gelöst! Verwende `npm run dynamodb:migrate:single`
- Dieses Skript nutzt `PutCommand` statt `BatchWriteCommand`

### Problem: "Amplify Build failed"

**Symptome:**
```
Build status: FAILED
Error: Monorepo spec provided without "applications" key
```

**Lösung:**
- ✅ Bereits im Terraform gefixt!
- Falls trotzdem Fehler: `terraform apply` erneut ausführen

### Problem: "Frontend zeigt 404"

**Symptome:**
- Homepage zeigt "404 - Page not found"

**Lösung:**
```bash
# Hard Refresh im Browser
# Windows/Linux: Ctrl + Shift + R
# macOS: Cmd + Shift + R

# Oder Inkognito-Tab öffnen
```

### Problem: "Lambda Build schlägt fehl"

**Symptome:**
```
Error: error building Lambda function
```

**Lösung:**
```bash
cd backend
npm install
npm run build  # Manuell testen

# Prüfe ob dist/ existiert
ls -la dist/
```

### Problem: "GitHub Token ungültig"

**Symptome:**
```
Error: Repository provider not supported
Error: Bad credentials
```

**Lösung:**
1. Neuen GitHub Token erstellen (siehe Anleitung oben)
2. `terraform.tfvars` aktualisieren
3. `terraform apply` erneut ausführen

---

## 📊 Was wurde erstellt? (Ressourcen-Übersicht)

### DynamoDB (4 Tables)
```
ecokart-products     → 31 Items
ecokart-users        → 3 Items (2 migriert + 1 Testuser)
ecokart-carts        → 2 Items
ecokart-orders       → 7 Items
```

### Lambda & API Gateway
```
Lambda Function: ecokart-development-api
  - Runtime: Node.js 20.x
  - Memory: 512 MB
  - Timeout: 30 Sekunden
  - Handler: dist/lambda.handler

API Gateway: https://xxx.execute-api.eu-north-1.amazonaws.com/Prod/
  - Stage: Prod
  - Integration: AWS_PROXY → Lambda
  - CORS: Enabled
```

### Amplify & CloudFront
```
Amplify App: ecokart-development-frontend
  - Platform: WEB_COMPUTE (SSR)
  - Framework: Next.js 14.x
  - Branch: main
  - Auto-Deploy: Enabled
  - Basic Auth: demo / test1234

CloudFront Distribution (managed by Amplify)
  - Domain: https://main.xxx.amplifyapp.com
  - SSL/TLS: Automatic
```

### IAM Rollen
```
Lambda Execution Role: ecokart-development-api-exec-role
  - DynamoDB: GetItem, PutItem, UpdateItem, DeleteItem, Query, Scan
  - CloudWatch Logs: CreateLogGroup, CreateLogStream, PutLogEvents
```

### CloudWatch Logs
```
Log Group: /aws/lambda/ecokart-development-api
  - Retention: 7 Tage
```

---

## 💰 Kosten-Transparenz

### Development Environment (geschätzt)

| Service | Kosten/Monat |
|---------|--------------|
| DynamoDB (4 Tables, PROVISIONED 5 RCU/WCU) | ~€3-5 |
| Lambda (512 MB, 100k Requests) | ~€0.50 |
| API Gateway (100k Requests) | ~€0.50 |
| Amplify (10 Builds, 10 GB Transfer) | ~€2-3 |
| **TOTAL** | **~€6-9** |

**AWS Free Tier berücksichtigt!**

---

**Letzte Aktualisierung:** 30. Oktober 2025
**Autor:** Andy Schlegel
**Terraform Version:** >= 1.5.0

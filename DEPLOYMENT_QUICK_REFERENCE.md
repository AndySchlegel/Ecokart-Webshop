# 🚀 Deployment Quick Reference

## S3 Backend für Terraform State

**S3 Backend wird AUTOMATISCH beim ersten Deploy erstellt:**

- ✅ S3 Bucket für Terraform State Storage (idempotent)
- ✅ DynamoDB Table für State Locking (idempotent)
- ✅ Encryption & Versioning aktiviert
- ✅ Public Access blockiert

**Warum wichtig:**
- Verhindert duplicate User Pools/API Gateways
- State bleibt persistent über Deploys
- Destroy → Deploy funktioniert sauber

**Kein manueller Schritt nötig!** Das Deploy Workflow prüft automatisch ob Backend existiert und erstellt es falls nötig.

---

## Parameter Store Token Setup (Täglich in Sandbox)

```bash
# Automation Setup ausführen
./scripts/setup-automation.sh

# Folge den Anweisungen:
# 1. GitHub Token erstellen (https://github.com/settings/tokens)
# 2. Token wird automatisch in AWS Parameter Store gespeichert
# 3. Auto-Seeding wird aktiviert
```

---

## Normales Deployment (Mit Automatisierung)

```bash
cd terraform/examples/basic

# 1. Token aus Parameter Store holen (automatisch)
export TF_VAR_github_access_token=$(aws ssm get-parameter \
  --name "/ecokart/development/github-token" \
  --with-decryption \
  --query 'Parameter.Value' \
  --output text \
  --region eu-north-1)

# 2. Deploy (alles automatisch!)
terraform apply -auto-approve

# 3. GitHub OAuth verbinden (nur beim ERSTEN Deployment)
./connect-github.sh
# → AWS Console öffnet sich
# → "Reconnect repository" klicken (2x für Customer + Admin)
# → Fertig!
```

**Dauer:** ~5-10 Minuten (davon 2-3 min GitHub OAuth beim ersten Mal)

**Was passiert automatisch:**
- ✅ Infrastruktur deployed (DynamoDB, Lambda, API Gateway, Amplify)
- ✅ Basic Auth gesetzt (`demo:test1234`, `admin:admin1234`)
- ✅ DynamoDB mit 31 Produkten befüllt
- ✅ Test-User erstellt (`demo@ecokart.com / Demo1234!`)

**Was noch manuell ist:**
- ⚠️ GitHub OAuth Reconnect (nur beim ERSTEN Deployment, dann nie wieder)

---

## Destroy Infrastructure

### Via GitHub Actions (Empfohlen)

**Automatisches Löschen aller Ressourcen:**

1. Gehe zu [GitHub Actions](https://github.com/AndySchlegel/Ecokart-Webshop/actions)
2. Wähle Workflow: **"Destroy Infrastructure"**
3. Klicke **"Run workflow"**
4. Gib `destroy` ein zur Bestätigung
5. Wähle ob Amplify Apps gelöscht werden sollen
6. Klicke **"Run workflow"**

**Was wird automatisch gelöscht:**
- ✅ Lambda Functions
- ✅ **API Gateways** (alle ecokart-* Gateways) - NEU seit 21.11.2025!
- ✅ DynamoDB Tables (alle 4)
- ✅ IAM Roles & Policies
- ✅ CloudWatch Log Groups
- ✅ **Cognito User Pools** (NEU seit 21.11.2025!)
- ✅ Amplify Apps (optional)

**Dauer:** ~3-5 Minuten

**Wichtig:** Danach 3-5 Minuten warten bevor Re-Deploy (AWS braucht Zeit zum Löschen!)

---

### Via Terraform (Manuell)

```bash
cd terraform/examples/basic

# Alles löschen
terraform destroy -auto-approve

# ⏰ WICHTIG: 3-5 Minuten warten!
# AWS braucht Zeit zum tatsächlichen Löschen
```

**Dauer:** ~2-3 Minuten + 3-5 Min Wait Time

---

### Verifizierung nach Destroy

**Checke ob wirklich alles weg ist:**

```bash
# Cognito User Pools
aws cognito-idp list-user-pools --max-results 60 --region eu-north-1

# Lambda Functions
aws lambda list-functions --region eu-north-1 | grep ecokart

# DynamoDB Tables
aws dynamodb list-tables --region eu-north-1 | grep ecokart

# API Gateways
aws apigatewayv2 get-apis --region eu-north-1 | grep ecokart
```

**Alle Commands sollten KEINE ecokart-Ressourcen mehr zeigen!**

---

## Destroy & Rebuild (Complete Cycle)

```bash
# 1. Destroy via GitHub Actions
# (siehe oben)

# 2. ⏰ Warten (3-5 Minuten!)
sleep 300

# 3. Parameter Store Token prüfen (täglich nötig in Sandbox)
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
# (Deploy Workflow ausführen)
```

**Gesamtdauer:** ~15-20 Minuten (inkl. Wait Time)

---

## URLs anzeigen

```bash
cd terraform/examples/basic
terraform output
```

---

## Login-Daten

### Customer Frontend
- **URL:** `terraform output amplify_app_url`
- **Basic Auth:** `demo` / `test1234`
- **App Login:** Registriere dich mit deiner Email-Adresse

### Admin Frontend
- **URL:** `terraform output admin_amplify_app_url`
- **Basic Auth:** `admin` / `admin1234`
- **App Login:** Registriere dich mit deiner Email-Adresse

---

## Troubleshooting

### "github_access_token not set"

```bash
# Token aus Parameter Store holen
export TF_VAR_github_access_token=$(aws ssm get-parameter \
  --name "/ecokart/development/github-token" \
  --with-decryption \
  --query 'Parameter.Value' \
  --output text \
  --region eu-north-1)
```

### "npm ci failed"

```bash
# Node.js Version prüfen (sollte 20.x sein)
node --version

# Falls falsch: nvm installieren und Node 20 verwenden
nvm install 20
nvm use 20
```

### Auto-Seeding deaktivieren

```bash
# In terraform/examples/basic/main.tf:
enable_auto_seed = false
```

### Build failed in Amplify

```bash
# Warte 2-3 Minuten, dann prüfen:
aws amplify list-jobs \
  --app-id $(terraform output -raw amplify_app_id) \
  --branch-name main \
  --region eu-north-1 \
  --max-items 1
```

---

## Weitere Dokumentation

- **CI/CD Automation:** `docs/CI_CD_AUTOMATION.md`
- **Terraform Module:** `terraform/README.md`
- **Quickstart:** `QUICKSTART.md`

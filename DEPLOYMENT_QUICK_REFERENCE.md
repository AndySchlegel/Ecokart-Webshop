# 🚀 Deployment Quick Reference

## Setup (Einmalig - 5 Minuten)

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
- ✅ Admin-User erstellt (`admin@ecokart.com / ecokart2025`)

**Was noch manuell ist:**
- ⚠️ GitHub OAuth Reconnect (nur beim ERSTEN Deployment, dann nie wieder)

---

## Destroy & Rebuild

```bash
cd terraform/examples/basic

# 1. Alles löschen
terraform destroy -auto-approve

# 2. Neu deployen (mit Automatisierung)
export TF_VAR_github_access_token=$(aws ssm get-parameter \
  --name "/ecokart/development/github-token" \
  --with-decryption \
  --query 'Parameter.Value' \
  --output text \
  --region eu-north-1)

terraform apply -auto-approve

# 3. GitHub OAuth verbinden
./connect-github.sh
```

**Dauer:** ~5-10 Minuten

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
- **App Login:** `demo@ecokart.com` / `Demo1234!`

### Admin Frontend
- **URL:** `terraform output admin_amplify_app_url`
- **Basic Auth:** `admin` / `admin1234`
- **App Login:** `admin@ecokart.com` / `ecokart2025`

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

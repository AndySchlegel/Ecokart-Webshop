# 🚀 Ecokart Webshop - Quick Start

## Aktueller Stand

✅ **Terraform Code ist fertig!**
- Automatisches Deployment für Backend, DynamoDB, API Gateway
- Semi-automatisches Deployment für Customer + Admin Frontend
- Helper-Script für GitHub-Verbindung

⚠️ **Ein manueller Schritt ist erforderlich:**
- GitHub OAuth-Verbindung muss einmalig in AWS Console bestätigt werden
- Dies ist eine technische Limitation von AWS Amplify + GitHub
- Nach der Bestätigung läuft alles automatisch

---

## 🎯 Was du jetzt tun musst

### 1. Stack deployen

```bash
cd terraform/examples/basic
terraform apply -auto-approve
```

**Dauer:** ~3-5 Minuten

**Was passiert:**
- ✅ DynamoDB Tabellen werden erstellt
- ✅ Lambda Backend wird deployed
- ✅ API Gateway wird konfiguriert
- ✅ Amplify Apps werden erstellt (Customer + Admin)
- ⚠️ GitHub OAuth ist noch NICHT bestätigt

---

### 2. GitHub-Verbindung herstellen (EINMALIG!)

Nach erfolgreichem `terraform apply`:

```bash
# Option 1: Shortcut (einfacher!)
./connect-github.sh

# Option 2: Voller Pfad
../../scripts/connect-github.sh
```

**Was das Script macht:**
1. Liest die Amplify App IDs aus Terraform Output
2. Generiert die AWS Console URLs
3. Öffnet beide URLs automatisch im Browser
4. Zeigt dir klare Anweisungen

**Was DU machen musst (in AWS Console):**

Für **JEDE** Amplify App (2 Browser-Tabs):

1. ✅ Klicke auf die gelbe **"Update required"** Warnung
2. ✅ Klicke **"Reconnect repository"**
3. ✅ Wähle **"GitHub"** als Provider
4. ✅ **Autorisiere AWS Amplify** im GitHub OAuth-Popup
5. ✅ Warte bis Status **✓ "Connected"** zeigt
6. ✅ **Build startet automatisch!**

**Dauer:** ~2-3 Minuten pro App (insgesamt ~5 Minuten)

---

### 3. Auf Build-Completion warten

Prüfe in der AWS Console ob die Builds abgeschlossen sind:

```bash
# Oder warte einfach ~3-5 Minuten
aws amplify list-jobs \
  --app-id <CUSTOMER_APP_ID> \
  --branch-name main \
  --region eu-north-1
```

---

### 4. Daten befüllen

```bash
cd ../../../backend

# Produkte migrieren
npm run dynamodb:migrate:single -- --region eu-north-1

# Test-User erstellen
node scripts/create-test-user.js
```

**Output sollte sein:**
```
✓ Successfully migrated 31 products
✓ Test user created successfully!
  Email: checkout@test.com
  Password: Test123!
```

---

### 5. ✅ FERTIG! Testen

```bash
# API testen
curl https://YOUR_API_URL/api/products

# Frontend URLs aus Terraform Output
terraform output amplify_app_url
terraform output admin_amplify_app_url
```

**Öffne im Browser:**
- Customer Frontend: https://main.dXXXXXXXXX.amplifyapp.com
- Admin Frontend: https://main.dYYYYYYYYY.amplifyapp.com

**Login:**
- Customer: `checkout@test.com` / `Test123!`
- Admin Basic Auth: `admin` / `admin1234` (ÄNDERN für Production!)

---

## 🔄 Weitere Deployments

Nach dem initialen Setup ist **alles vollautomatisch**:

```bash
# Code ändern
git add .
git commit -m "update"
git push origin main

# ✅ Amplify baut und deployed automatisch!
# ✅ Kein Klicken mehr nötig!
```

---

## 📋 Zusammenfassung der Schritte

```bash
# 1. Infrastruktur deployen (automatisch)
cd terraform/examples/basic
terraform apply -auto-approve

# 2. GitHub verbinden (einmalig, semi-manuell)
./connect-github.sh
# → AWS Console öffnet sich
# → "Reconnect repository" klicken für jede App
# → GitHub OAuth autorisieren

# 3. Warte auf Builds (~3-5 Minuten)

# 4. Daten befüllen
cd ../../../backend
npm run dynamodb:migrate:single -- --region eu-north-1
node scripts/create-test-user.js

# 5. Frontend URLs öffnen und testen ✓
```

**Gesamtdauer:** ~10-15 Minuten

---

## 💡 Warum ist ein manueller Schritt nötig?

**Technische Realität:**

AWS Amplify + GitHub benötigt:
- ✅ **Repository-Zugriff** (via GitHub Token) → Terraform kann das
- ❌ **Webhook-Installation** (via GitHub OAuth) → Terraform kann das NICHT
- ❌ **Deploy Key** (via GitHub OAuth) → Terraform kann das NICHT

Die GitHub OAuth-Autorisierung **muss interaktiv** im Browser erfolgen - das ist eine AWS/GitHub-Limitation, kein Terraform-Problem.

**Unsere Lösung:** Helper-Script öffnet automatisch die richtigen URLs, du klickst nur noch "Autorisieren".

---

## 🐛 Troubleshooting

### "Repository provider not supported"

**Lösung:** Token muss ein **Classic Token** sein (`ghp_...`), NICHT Fine-grained!

Erstelle neues Token:
1. GitHub → Settings → Developer settings → **Personal access tokens → Tokens (classic)**
2. Generate new token (classic)
3. Scope: `repo`

### "Build failed"

**Lösung:** Prüfe Build Logs in AWS Console oder:

```bash
aws amplify get-job \
  --app-id <APP_ID> \
  --branch-name main \
  --job-id <JOB_ID> \
  --region eu-north-1
```

### Helper-Script findet keine Apps

**Lösung:** Prüfe ob `terraform apply` erfolgreich war:

```bash
terraform output amplify_app_id
terraform output admin_amplify_app_id
```

---

## 📚 Dokumentation

- **`docs/AUTOMATED_DEPLOYMENT.md`** - Detaillierte Anleitung mit allen Schritten
- **`docs/DEPLOYMENT.md`** - Deployment-Dokumentation
- **`docs/AMPLIFY_GITHUB_TOKEN.md`** - GitHub Token erstellen
- **`terraform/README.md`** - Terraform Module Dokumentation

---

**Viel Erfolg! 🚀**

Bei Fragen oder Problemen: Siehe Troubleshooting in `docs/AUTOMATED_DEPLOYMENT.md`

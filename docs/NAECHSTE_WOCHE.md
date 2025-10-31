# 📋 Nächste Woche - GitHub OAuth Verbindung

## Aktueller Stand (31. Oktober 2025)

### ✅ Was fertig ist:

1. **Komplette Terraform-Infrastruktur**
   - DynamoDB Tabellen deployed ✅
   - Lambda Backend läuft ✅
   - API Gateway konfiguriert ✅
   - Amplify Apps erstellt (Customer + Admin) ✅

2. **Dokumentation**
   - `QUICKSTART.md` - Schritt-für-Schritt Anleitung
   - `docs/AUTOMATED_DEPLOYMENT.md` - Detaillierte Dokumentation
   - `docs/AMPLIFY_GITHUB_TOKEN.md` - GitHub Token Setup
   - `terraform/README.md` - Terraform Module Docs

3. **Helper-Scripts**
   - `terraform/scripts/connect-github.sh` - Automatisches Öffnen der AWS Console URLs
   - `terraform/examples/basic/connect-github.sh` - Shortcut

### ⚠️ Was noch fehlt:

**Nur ein Schritt:** GitHub OAuth-Verbindung für Auto-Deploys

---

## 🎯 To-Do für nächste Woche

### Schritt 1: GitHub-Verbindung herstellen (~5 Minuten)

```bash
# 1. Ins richtige Verzeichnis
cd terraform/examples/basic

# 2. Helper-Script ausführen
./connect-github.sh
```

**Was passiert:**
- Script öffnet automatisch AWS Console URLs
- Für JEDE Amplify App (Customer + Admin):

**In der AWS Console:**

1. ✅ Gehe zu: AWS Amplify Service
2. ✅ Klicke auf die App (z.B. "ecokart-development-frontend")
3. ✅ Klicke auf Tab "Hosting environments"
4. ✅ Du siehst gelbe Warnung "Update required"
5. ✅ Klicke "Reconnect repository"
6. ✅ Wähle "GitHub"
7. ✅ Autorisiere im GitHub OAuth-Popup
8. ✅ Warte bis "✓ Connected" erscheint
9. ✅ Build startet automatisch

**Wiederhole für Admin App!**

---

## ⚠️ WICHTIG: Was NICHT zu tun ist

❌ **NICHT** in Amplify Studio gehen
❌ **NICHT** "Admin UI setup" klicken
❌ **NICHT** Cognito User Pool erstellen
❌ **NICHT** irgendwelche Permissions anfragen

**NUR:**
✅ "Reconnect repository" im Hosting Tab
✅ GitHub OAuth autorisieren
✅ Fertig!

---

## 📋 Aktueller Infrastruktur-Status

### Amplify Apps (deployed, aber GitHub nicht verbunden):

```bash
# Customer Frontend
App ID: dwd9a20l6thhs (siehe terraform output)
Status: Deployed, GitHub OAuth fehlt

# Admin Frontend
App ID: (siehe terraform output admin_amplify_app_id)
Status: Deployed, GitHub OAuth fehlt
```

### Was funktioniert JETZT schon:

- ✅ Backend API läuft
- ✅ DynamoDB mit Daten gefüllt
- ✅ Frontends sind deployed und erreichbar
- ⚠️ Auto-Deploy bei git push fehlt noch (braucht GitHub OAuth)

---

## 🔍 Wo finde ich die URLs?

```bash
cd terraform/examples/basic

# Alle URLs anzeigen
terraform output

# Einzelne URLs
terraform output amplify_app_url        # Customer Frontend
terraform output admin_amplify_app_url  # Admin Frontend
terraform output api_gateway_url        # Backend API
```

---

## 🚀 Nach der GitHub-Verbindung

**Dann läuft alles vollautomatisch:**

```bash
# Code ändern
git add .
git commit -m "update"
git push origin main

# ✅ Amplify baut und deployed automatisch!
# ✅ Kein weiteres Klicken nötig!
```

---

## 📚 Dokumentation für später

Wenn du nochmal von vorne deployen willst:

```bash
# 1. Stack löschen (optional)
cd terraform/examples/basic
terraform destroy -auto-approve

# 2. Neu deployen
terraform apply -auto-approve

# 3. GitHub verbinden (mit Helper-Script)
./connect-github.sh

# 4. Daten befüllen
cd ../../../backend
npm run dynamodb:migrate:single -- --region eu-north-1
node scripts/create-test-user.js
```

**Dauer:** ~10-15 Minuten total

---

## 🐛 Falls Probleme auftreten

### Problem: "Repository provider not supported"

**Lösung:** Token muss Classic Token sein (ghp_...)

Erstelle neues Token:
1. GitHub → Settings → Developer settings
2. Personal access tokens → **Tokens (classic)**
3. Generate new token (classic)
4. Scope: `repo`

### Problem: "Script findet keine Apps"

**Lösung:** Stelle sicher dass du im richtigen Verzeichnis bist:

```bash
cd terraform/examples/basic
pwd  # Sollte .../terraform/examples/basic sein
./connect-github.sh
```

### Problem: "Terraform output funktioniert nicht"

**Lösung:** Führe das Script dort aus wo terraform.tfstate liegt:

```bash
cd terraform/examples/basic  # WICHTIG!
./connect-github.sh
```

---

## 📞 Zusammenfassung

**Was du nächste Woche machen musst:**

1. ✅ `cd terraform/examples/basic`
2. ✅ `./connect-github.sh` ausführen
3. ✅ AWS Console öffnet sich automatisch
4. ✅ "Reconnect repository" klicken (2x für Customer + Admin)
5. ✅ GitHub OAuth autorisieren
6. ✅ Fertig! 🎉

**Zeitaufwand:** ~5-10 Minuten

**Danach:** Alles läuft vollautomatisch bei jedem `git push`

---

**Erstellt:** 31. Oktober 2025
**Letztes Update:** Nach terraform destroy/apply Session

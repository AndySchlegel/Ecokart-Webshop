# Step 2: AWS Amplify - Status & Quick Start

## ✅ Was ist fertig vorbereitet

### 1. Next.js Build konfiguriert
- ✅ `next.config.mjs` für Amplify optimiert
- ✅ Dynamische Routes funktionieren (/product/[id])
- ✅ SSR aktiviert
- ✅ Build erfolgreich getestet

### 2. Dokumentation erstellt
- ✅ `docs/step-02-amplify-hosting.md` - Vollständige Anleitung
- ✅ Schritt-für-Schritt Console Guide
- ✅ Troubleshooting Section

---

## 🚀 Quick Start (30 Min)

### Voraussetzung: GitHub Repository

**Falls noch nicht vorhanden:**

```bash
# Im Projekt-Root:
git init
git add .
git commit -m "Initial commit - Ready for Amplify"

# Erstelle Repo auf GitHub (github.com)
# Name: Ecokart-Webshop

# Verbinde local mit GitHub:
git remote add origin https://github.com/DEIN-USERNAME/Ecokart-Webshop.git
git branch -M main
git push -u origin main
```

---

### Deployment in 5 Schritten:

#### 1. Amplify Console öffnen
```
https://eu-north-1.console.aws.amazon.com/amplify
```

#### 2. GitHub verbinden
- "Host your web app" → "GitHub"
- Repository auswählen: `Ecokart-Webshop`
- Branch: `main`
- Monorepo Folder: `frontend`

#### 3. Environment Variables setzen
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NODE_ENV=production
```

#### 4. Deploy klicken
→ Warte ~4 Minuten

#### 5. Live-URL kopieren
```
https://main.d1a2b3c4d5e6f7.amplifyapp.com
```

---

## 📊 Was funktioniert nach Deployment?

| Feature | Status | Warum? |
|---------|--------|--------|
| Website lädt | ✅ | Auf Amplify CDN |
| React Router | ✅ | Next.js SSR |
| Dynamische Routes | ✅ | /product/[id] |
| Styling | ✅ | CSS geladen |
| Auto-Deploy | ✅ | Git Push → Live |
| HTTPS | ✅ | Automatisch |
| API Calls | ❌ | Backend noch lokal (Step 4!) |
| Login | ❌ | Backend noch lokal |
| Products laden | ❌ | Backend noch lokal |

---

## 🔄 Automatisches Deployment testen

```bash
cd frontend

# Kleine Änderung:
echo "# Updated $(date)" >> README.md

# Commit & Push:
git add .
git commit -m "Test auto-deploy"
git push

# → Amplify startet automatisch neuen Build!
# → Check Console: Neue Version nach ~4 Min
```

---

## 💡 Pause-Punkte

Du kannst **jederzeit pausieren** nach:

✅ **Punkt 1:** GitHub Repo erstellt
- Code ist online
- Kann später mit Amplify verbinden

✅ **Punkt 2:** Amplify App erstellt
- App existiert in AWS
- Kann später konfigurieren

✅ **Punkt 3:** Erfolgreich deployed
- Website ist live
- Fertig mit Step 2!

---

## 🐛 Häufige Probleme

### "Repository not found"
→ GitHub Authorization erneuern in Amplify Settings

### Build schlägt fehl
```bash
# Lokal testen:
cd frontend
npm run build

# Falls erfolgreich → Problem ist in Amplify Config
# Check: Environment Variables gesetzt?
```

### "Module not found"
```bash
# Dependencies aktualisieren:
cd frontend
npm install
git add package-lock.json
git commit -m "Update dependencies"
git push
```

---

## 📝 Für Präsentation

**Zeige folgendes:**
1. ✅ GitHub Repository (Code online)
2. ✅ Amplify Console (Build Pipeline)
3. ✅ Successful Deployment (grüne Checkmarks)
4. ✅ Live Website (Amplify URL)
5. ✅ Auto-Deployment (Git Push → neue Version)

**Bonus-Punkte:**
- Erkläre CI/CD Pipeline
- Zeige Build Logs
- Demo: Code-Änderung → Live in 4 Min

---

## ⏭️ Nach Step 2

### Step 3: Backend zu Lambda
- Express → Lambda Function
- DynamoDB Connection
- SAM Framework Setup

### Step 4: API Gateway
- REST API erstellen
- Lambda Integration
- CORS konfigurieren

### Step 5: Frontend Update
- `NEXT_PUBLIC_API_URL` ändern
- Redeploy auf Amplify
- Full-Stack funktioniert! 🎉

---

## 📊 Kosten-Tracking

**Nach Step 2:**

```
✅ DynamoDB:   $0/Monat (Free Tier)
✅ Amplify:    $0/Monat (Free Tier)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total:         $0/Monat
```

**Free Tier Nutzung:**
- Amplify: ~4 Builds (von 1000 erlaubt)
- Traffic: ~1GB (von 15GB erlaubt)

---

**Status:** Bereit für Deployment! 🚀
**Zeit:** ~30 Minuten
**Schwierigkeit:** ⭐⭐ (Mittel - hauptsächlich Console Clicks)

*Ready when you are!*

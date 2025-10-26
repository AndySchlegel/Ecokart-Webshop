# Step 2: Frontend Hosting mit AWS Amplify

**Ziel:** Next.js Frontend auf AWS Amplify deployen
**Dauer:** ~30 Minuten
**Lernziel:** AWS Amplify Hosting verstehen & CI/CD Setup
**Kosten:** ~$0/Monat (Free Tier: 15GB Traffic, 1000 Build Minutes)

---

## 📚 Was du hier lernst

### Konzepte die du verstehst nach diesem Step:

1. **AWS Amplify Hosting** - Managed Hosting für moderne Webapps
2. **Next.js SSR auf AWS** - Server-Side Rendering in der Cloud
3. **CI/CD Pipeline** - Automatisches Deployment bei Git Push
4. **GitHub Integration** - Verbindung zwischen Code & AWS
5. **Environment Variables** - Secrets & Config Management

---

## 🏗️ Was ist AWS Amplify?

**AWS Amplify** = Hosting-Service für moderne Webapps

**Perfekt für:**
- ✅ Next.js, React, Vue, Angular
- ✅ Server-Side Rendering (SSR)
- ✅ Dynamische Routes (/product/[id])
- ✅ API Routes
- ✅ Automatisches HTTPS

**Vorteile vs. S3:**
| Feature | S3 Static | Amplify |
|---------|-----------|---------|
| Statische HTML/CSS/JS | ✅ | ✅ |
| Next.js SSR | ❌ | ✅ |
| Dynamische Routes | ❌ | ✅ |
| API Routes | ❌ | ✅ |
| Auto-Deploy from Git | ❌ | ✅ |
| HTTPS | Manual (CloudFront) | ✅ Automatisch |

---

## 🎯 Deployment-Flow

### Was passiert:

```
1. Code Push → GitHub
2. AWS Amplify erkennt neuen Commit
3. Automatischer Build (npm run build)
4. Deployment zur AWS CDN
5. Website ist live!
```

**Jeder Git Push = Automatisches Update!** 🚀

---

## 📋 Voraussetzungen

### 1. GitHub Repository

**Option A: Existierendes Repo nutzen**
- Dein Code ist bereits auf GitHub

**Option B: Neues Repo erstellen** (falls noch nicht geschehen)

```bash
# Im Projekt-Root:
git add .
git commit -m "Prepare for AWS Amplify deployment"
git push
```

**Repository URL notieren:**
```
https://github.com/DEIN-USERNAME/Ecokart-Webshop
```

---

### 2. AWS Account vorbereiten

- ✅ AWS SSO eingeloggt
- ✅ Region: Stockholm (eu-north-1)
- ✅ Rechte: Amplify nutzen können

---

## 🚀 Teil A: AWS Amplify App erstellen

### Schritt 2.1: Amplify Console öffnen

1. **Browser öffnen:** https://eu-north-1.console.aws.amazon.com/amplify
2. **Region prüfen:** Oben rechts sollte **Stockholm (eu-north-1)** stehen
3. **Klicke:** "Get started" unter **"Host your web app"**

❓ **Was ist Amplify Console?**
- Management-Interface für deine Apps
- Zeigt Deployments, Logs, Settings
- Wie ein CI/CD Dashboard

---

### Schritt 2.2: GitHub verbinden

**Get started with Amplify Hosting:**
- Wähle **"GitHub"**
- Klicke **"Continue"**

**GitHub Authorization:**
- AWS öffnet GitHub-Login
- Klicke **"Authorize AWS Amplify"**
- Wähle **dein Repository** aus
- Erlaubnis erteilen

❓ **Ist das sicher?**
- Ja! AWS bekommt nur READ-Zugriff
- Kann Code lesen & Deployments triggern
- KEIN Schreib-Zugriff auf deinen Code

---

### Schritt 2.3: Repository & Branch auswählen

**Select repository:**
- Dropdown: Wähle **"Ecokart-Webshop"** (oder dein Repo-Name)

**Select branch:**
- Wähle **"main"** (oder dein Main-Branch)

**Monorepo (optional):**
- ✅ Hake an: **"Connecting a monorepo? Pick a folder"**
- Eingabe: `frontend`

❓ **Was ist ein Monorepo?**
- Ein Repo mit mehreren Projekten
- Bei uns: `/backend` + `/frontend`
- Amplify deployed nur den `/frontend` Ordner

Klicke **"Next"**

---

### Schritt 2.4: Build Settings konfigurieren

**App name:**
```
ecokart-frontend
```

**Environment:**
- Wähle **"production"**

**Build settings auto-detected:**

Amplify erkennt automatisch Next.js und zeigt:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

✅ **Das ist perfekt!** Lass es so.

---

### Schritt 2.5: Advanced Settings (WICHTIG!)

**Scrolle runter zu "Advanced settings"**

**Environment variables hinzufügen:**

Klicke **"Add environment variable"**

**Variable 1:**
```
Key: NEXT_PUBLIC_API_URL
Value: http://localhost:4000
```

❓ **Warum localhost?**
- Backend läuft noch lokal
- Wird später in Step 4 auf API Gateway URL geändert
- Für jetzt: Website funktioniert, aber API Calls scheitern (okay!)

**Variable 2 (Optional):**
```
Key: NODE_ENV
Value: production
```

---

### Schritt 2.6: Service Role

**Amplify service role:**

**Falls keine Role existiert:**
- Wähle **"Create new service role"**
- AWS erstellt automatisch Role mit nötigen Permissions

**Falls Role existiert:**
- Wähle existierende Role aus Dropdown

❓ **Was ist eine Service Role?**
- IAM Role für AWS Amplify
- Gibt Amplify Rechte zum Deployen
- Zugriff auf S3, CloudFront, etc.

---

### Schritt 2.7: Review & Deploy

**Review deiner Einstellungen:**

```
Repository: github.com/DEIN-USERNAME/Ecokart-Webshop
Branch: main
Build command: npm run build
App name: ecokart-frontend
Environment: production
```

✅ **Alles korrekt?**

Klicke **"Save and deploy"**

---

## ⏱️ Teil B: Warten auf Deployment

### Was passiert jetzt:

**Amplify startet 4 Phasen:**

```
1. Provision   [~1 Min]  - Server starten
2. Build       [~2 Min]  - npm ci + npm run build
3. Deploy      [~30 Sek] - Upload zu CDN
4. Verify      [~10 Sek] - Health Check
```

**Gesamt: ~3-4 Minuten** ☕

---

### Schritt 2.8: Build-Log verfolgen (optional)

**In der Amplify Console:**

1. Klicke auf **"Provision"** → Siehst du Server-Setup Logs
2. Klicke auf **"Build"** → Siehst du npm install + build output
3. Klicke auf **"Deploy"** → Siehst du Upload-Progress

**Häufige Ausgaben:**
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Generating static pages (8/8)
✓ Build completed successfully
```

---

### Schritt 2.9: Deployment erfolgreich! 🎉

**Wenn alles grün ist:**
```
✓ Provision   Complete
✓ Build       Complete
✓ Deploy      Complete
✓ Verify      Complete
```

**Du siehst jetzt:**
- ✅ Deployment Status: **Deployed**
- ✅ Deine Live-URL!

---

## 🌐 Teil C: Website aufrufen & testen

### Schritt 2.10: URL kopieren

**In der Amplify Console:**

Oben rechts siehst du deine URL:
```
https://main.d1a2b3c4d5e6f7.amplifyapp.com
```

✏️ **Kopiere diese URL!**

---

### Schritt 2.11: Website im Browser öffnen

**Öffne die URL in deinem Browser**

✅ **Du solltest sehen:**
- Landing Page mit Hero Section
- Featured Products Grid
- Navigation funktioniert
- Styling ist korrekt

❌ **Was NICHT funktioniert (normal!):**
- Login (Backend noch lokal)
- Products laden (Backend noch lokal)
- Cart (Backend noch lokal)

**Warum?**
- `NEXT_PUBLIC_API_URL` zeigt noch auf `localhost:4000`
- Wird in Step 4 gefixed!

---

## 🔍 Teil D: Deployment verwalten

### Schritt 2.12: Custom Domain (Optional)

**Falls du eine eigene Domain hast:**

1. In Amplify Console → **"Domain management"**
2. Klicke **"Add domain"**
3. Eingabe: `ecokart.deine-domain.com`
4. AWS erstellt automatisch SSL-Zertifikat
5. DNS Records zu deiner Domain hinzufügen

**Kosten:** $0 (SSL Zertifikat inklusive!)

**Für heute:** Überspringen! AWS URL reicht.

---

### Schritt 2.13: Automatisches Deployment testen

**Lass uns testen ob CI/CD funktioniert:**

```bash
# Im Frontend-Ordner:
cd frontend

# Kleine Änderung machen:
echo "# Updated" >> README.md

# Commit & Push:
git add .
git commit -m "Test automatic deployment"
git push
```

**Was passiert:**
1. Amplify erkennt neuen Commit (~10 Sek)
2. Startet automatisch neuen Build
3. Deployed neue Version

**Check Amplify Console:**
- Neuer Build sollte starten!
- Nach ~4 Min: Neue Version live!

---

## 📊 Teil E: Environment Variables updaten

### Später (in Step 4) aktualisieren:

**Wenn API Gateway läuft:**

1. Amplify Console → **"Environment variables"**
2. Bearbeite `NEXT_PUBLIC_API_URL`
3. Neuer Wert: `https://api.ecokart.example.com`
4. **"Redeploy this version"** klicken
5. Neuer Build mit neuer API URL!

---

## 🐛 Troubleshooting

### Problem: Build schlägt fehl

**Check Build Logs:**
- Amplify Console → Letzter Build → "Build" klicken
- Suche nach Errors

**Häufige Ursachen:**
```bash
# TypeScript Errors
→ Lösung: npm run build lokal testen

# Missing dependencies
→ Lösung: package.json prüfen

# Environment Variables fehlen
→ Lösung: In Amplify Settings hinzufügen
```

### Problem: "Module not found"

**Prüfe package.json:**
```bash
cd frontend
npm install
git add package-lock.json
git commit -m "Update dependencies"
git push
```

### Problem: White Screen nach Deployment

**Check Browser Console:** (F12)
- API Errors? → Normal! Backend noch lokal
- JavaScript Errors? → Build-Problem

**Lösung:**
```bash
# Lokal testen:
npm run build
npm run start
# Wenn's lokal funktioniert → Sollte auch auf Amplify klappen
```

---

## 📊 Kosten-Update

**Aktueller Stand:**

| Service | Usage | Kosten/Monat |
|---------|-------|--------------|
| **DynamoDB** | 4 Tables, ~42 Items | $0 (Free Tier) |
| **Amplify Hosting** | 1 App, ~100 Builds/Monat | $0 (Free Tier) |
| **Amplify Traffic** | ~5GB/Monat | $0 (Free Tier) |
| **Total** | | **$0** |

**Free Tier Limits:**
- ✅ 1000 Build Minutes/Monat
- ✅ 15 GB Traffic/Monat
- ✅ Unbegrenzte Apps

---

## ✅ Step 2 Erfolgreich!

Du hast gelernt:
- ✅ AWS Amplify Hosting Setup
- ✅ GitHub Integration & CI/CD
- ✅ Next.js SSR auf AWS deployen
- ✅ Environment Variables Management
- ✅ Automatisches Deployment bei Git Push

---

## 🎯 Was funktioniert jetzt?

| Feature | Status | Beschreibung |
|---------|--------|--------------|
| Website lädt | ✅ | Amplify CDN weltweit |
| Next.js SSR | ✅ | Server-Side Rendering |
| Dynamische Routes | ✅ | /product/[id] funktioniert |
| Automatisches Deploy | ✅ | Git Push → Live |
| HTTPS | ✅ | Automatisches SSL |
| API Calls | ❌ | Backend noch lokal (Step 4!) |

---

## ⏭️ Nächster Schritt: Backend zu Lambda

**Step 3:** Express Backend zu AWS Lambda migrieren

Was kommt:
- Express App → Lambda Function konvertieren
- DynamoDB Connection konfigurieren
- SAM (Serverless Application Model) Setup
- Deployment zu AWS

---

## 📸 Screenshots für Präsentation

**Wichtige Screenshots:**
1. ✅ Amplify Console - Main Dashboard
2. ✅ GitHub Repository Selection
3. ✅ Build Settings (amplify.yml)
4. ✅ Successful Deployment (alle grün)
5. ✅ Live Website mit Amplify URL
6. ✅ Automatic Deployment nach Git Push

---

**Status:** Ready für Production! 🚀
**Next:** Backend Migration zu Lambda

*Step 2 - AWS Amplify Hosting*
*Geschätzte Zeit: 30 Minuten*
*Kosten: $0/Monat (Free Tier)*

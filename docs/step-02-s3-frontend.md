# Step 2: S3 Bucket für Frontend Hosting

**Ziel:** React Frontend auf S3 hosten + Static Website aktivieren
**Dauer:** ~30-40 Minuten
**Lernziel:** S3 Static Website Hosting verstehen
**Kosten:** ~$0.50-2/Monat (Free Tier: 5GB Storage, 20k GET Requests)

---

## 📚 Was du hier lernst

### Konzepte die du verstehst nach diesem Step:

1. **S3 Bucket** - Object Storage für statische Files
2. **Static Website Hosting** - Webseiten ohne Server
3. **Bucket Policies** - Public Access konfigurieren
4. **CORS** - Cross-Origin Resource Sharing
5. **Frontend Build Process** - React Production Build

---

## 🏗️ Was passiert in Step 2?

### Teil A: S3 Bucket erstellen (15 Min)
- Bucket erstellen mit korrektem Namen
- Static Website Hosting aktivieren
- Public Access konfigurieren

### Teil B: Frontend bauen & hochladen (15 Min)
- React App production build
- Upload zu S3
- Testen der Website

### Teil C: Optional - CloudFront CDN (10 Min)
- CDN für schnellere Auslieferung
- HTTPS aktivieren
- Global verfügbar machen

---

## 🎯 Teil A: S3 Bucket erstellen

### Was ist S3?

**Amazon S3** (Simple Storage Service) = Cloud-Speicher für Files

**Beispiele:**
- Bilder, Videos, PDFs
- Statische Websites (HTML, CSS, JS)
- Backups, Logs
- Jede Art von File

**Kosten:**
- Storage: $0.023/GB/Monat
- Requests: $0.0004/1000 GET Requests
- **Free Tier:** 5GB Storage + 20k GET/Monat gratis

---

### Schritt 2.1: Console öffnen

1. **Browser öffnen:** https://s3.console.aws.amazon.com/s3
2. **Region prüfen:** Oben rechts sollte **Stockholm (eu-north-1)** stehen
3. **Klicke:** "Create bucket" (oranger Button)

---

### Schritt 2.2: Bucket Basics

**Bucket name:**
```
ecokart-frontend-<dein-name>
```

❓ **Warum <dein-name>?**
- Bucket-Namen sind **global einzigartig** (weltweit!)
- Muss eindeutig sein über alle AWS Accounts
- Beispiel: `ecokart-frontend-andy` oder `ecokart-frontend-demo`

**AWS Region:**
```
Europe (Stockholm) eu-north-1
```

❓ **Warum gleiche Region wie DynamoDB?**
- Niedrigere Latenz
- Günstiger (kein Cross-Region Traffic)
- Einfacher zu managen

---

### Schritt 2.3: Object Ownership

**Object Ownership:**
- Wähle **"ACLs disabled (recommended)"**

❓ **Was sind ACLs?**
- **ACL** = Access Control List (altes System)
- **Bucket Policies** = Modernes System (nutzen wir)
- Disabled = Einfacher + Sicherer

---

### Schritt 2.4: Block Public Access

**WICHTIG:** Hier kommt ein Trick!

**Block Public Access settings:**
- ❌ **DEAKTIVIERE** "Block all public access"
- Checkbox RAUS!

**Warnung erscheint:**
"⚠️ Turning off block all public access..."

✅ **Hake an:** "I acknowledge that the current settings..."

❓ **Ist das sicher?**
- Ja! Wir wollen eine **öffentliche Website**
- Jeder soll die Website sehen können
- Wir machen NUR die Website public, nicht alles

---

### Schritt 2.5: Bucket Settings

**Bucket Versioning:**
- Lass **"Disable"** ausgewählt
- (Versioning = Alte Versionen behalten, nicht nötig für uns)

**Tags (optional):**
```
Key: Project, Value: Ecokart
Key: Environment, Value: Production
```

**Default encryption:**
- Lass **"Server-side encryption with Amazon S3 managed keys (SSE-S3)"** ausgewählt
- Kostenlos + Automatisch

---

### Schritt 2.6: Bucket erstellen

Klicke **"Create bucket"** (ganz unten)

✅ Du siehst jetzt: "Successfully created bucket: ecokart-frontend-..."

---

## 🌐 Teil B: Static Website Hosting aktivieren

### Schritt 2.7: Bucket-Settings öffnen

1. **Klicke** auf deinen Bucket-Namen
2. **Klicke** auf Tab **"Properties"** (oben)
3. **Scrolle runter** zu **"Static website hosting"** (ganz unten)
4. **Klicke** "Edit"

---

### Schritt 2.8: Static Website aktivieren

**Static website hosting:**
- Wähle **"Enable"**

**Hosting type:**
- Wähle **"Host a static website"**

**Index document:**
```
index.html
```

❓ **Was ist das?**
- Die Hauptdatei deiner Website
- Wird automatisch geladen bei `http://bucket-url.com/`
- React erstellt automatisch eine `index.html`

**Error document (optional):**
```
index.html
```

❓ **Warum index.html auch hier?**
- React ist eine **Single Page App** (SPA)
- Alle Routes (z.B. `/products`) sind clientseitig
- Bei 404 Errors → Lade index.html → React Router übernimmt

Klicke **"Save changes"**

---

### Schritt 2.9: Website URL kopieren

**Scrolle runter zu "Static website hosting"**

Du siehst jetzt:
```
Bucket website endpoint:
http://ecokart-frontend-andy.s3-website.eu-north-1.amazonaws.com
```

✏️ **Kopiere diese URL** (brauchst du später!)
http://air-legacy-frontend.s3-website.eu-north-1.amazonaws.com
---

## 🔓 Teil C: Public Access aktivieren

### Schritt 2.10: Bucket Policy erstellen

1. **Klicke** auf Tab **"Permissions"** (oben)
2. **Scrolle runter** zu **"Bucket policy"**
3. **Klicke** "Edit"

---

### Schritt 2.11: Policy einfügen

**Füge folgende Policy ein:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::DEIN-BUCKET-NAME/*"
    }
  ]
}
```

**WICHTIG:** Ersetze `DEIN-BUCKET-NAME` mit deinem echten Bucket-Namen!

Beispiel:
```json
"Resource": "arn:aws:s3:::ecokart-frontend-andy/*"
```

❓ **Was macht diese Policy?**

```
Principal: "*"           → Jeder (öffentlich)
Action: "s3:GetObject"   → Darf Files LESEN (nicht schreiben!)
Resource: ".../*"        → Alle Files im Bucket
```

= Jeder darf alle Files im Bucket **lesen** (perfekt für Website!)

Klicke **"Save changes"**

---

## 📦 Teil D: Frontend Build erstellen

### Schritt 2.12: Environment Variables prüfen

**Öffne:** `frontend/.env`

```bash
REACT_APP_API_URL=http://localhost:4000
```

❓ **Problem?**
- Dein Frontend auf S3 kann nicht `localhost:4000` erreichen
- Backend läuft noch lokal!

**Lösung für JETZT:**
```bash
# Für lokalen Test:
REACT_APP_API_URL=http://localhost:4000

# Später in Step 4 (API Gateway):
# REACT_APP_API_URL=https://api.ecokart.example.com
```

**→ Lass erstmal localhost!** (Ändern wir in Step 4)

---

### Schritt 2.13: Production Build erstellen

```bash
cd frontend
npm run build
```

**Was passiert?**
- React kompiliert TypeScript → JavaScript
- Optimiert + Minified Code
- Erstellt `build/` Ordner mit allen Files

**Output:**
```
✓ Compiled successfully!
✓ 145 KB → build/static/js/main.abc123.js
✓ 12 KB → build/static/css/main.def456.css
```

---

### Schritt 2.14: Build-Ordner prüfen

```bash
ls -la build/
```

Du solltest sehen:
```
build/
  ├── index.html          ← Haupt-HTML
  ├── favicon.ico         ← Icon
  ├── manifest.json       ← PWA Config
  ├── static/
      ├── css/            ← Styles
      ├── js/             ← JavaScript
      └── media/          ← Images/Fonts
```

✅ **Perfect!** Bereit zum Upload!

---

## ☁️ Teil E: Upload zu S3

### Option A: Via AWS Console (GUI)

1. **S3 Console:** https://s3.console.aws.amazon.com/s3
2. **Klicke** auf deinen Bucket
3. **Klicke** "Upload"
4. **Drag & Drop** alle Files aus `build/` Ordner
   - **WICHTIG:** Alle Files/Folders, nicht den `build/` Ordner selbst!
   - Also: `index.html`, `manifest.json`, `static/` Folder
5. **Klicke** "Upload"

⏱️ **Wartezeit:** 1-2 Minuten je nach Internet

---

### Option B: Via AWS CLI (Schneller!)

```bash
cd frontend

aws s3 sync build/ s3://ecokart-frontend-andy/ \
  --profile Teilnehmer-729403197965 \
  --region eu-north-1 \
  --delete
```

❓ **Was macht das?**
- `sync` = Upload + Aktualisiert nur geänderte Files
- `--delete` = Löscht alte Files die nicht mehr existieren
- `--profile` = Nutzt deine AWS SSO Credentials

**Output:**
```
upload: build/index.html to s3://ecokart-frontend-andy/index.html
upload: build/static/js/main.abc123.js to s3://...
...
✓ 34 files uploaded
```

---

## 🎉 Teil F: Website testen!

### Schritt 2.15: Website öffnen

**Nutze die URL von Schritt 2.9:**

```
http://ecokart-frontend-andy.s3-website.eu-north-1.amazonaws.com
```

✅ **Du solltest sehen:** Deine React App!

---

### Schritt 2.16: Funktionstest

**Teste folgende Dinge:**

❌ **FUNKTIONIERT NICHT:**
- Login (Backend noch lokal)
- Products laden (Backend noch lokal)
- Cart (Backend noch lokal)

✅ **FUNKTIONIERT:**
- Website lädt
- React Router funktioniert
- Styling ist korrekt
- Console-Errors zeigen CORS-Probleme (normal!)

---

## 🐛 Troubleshooting

### Problem: "AccessDenied" beim Öffnen der Website

**Lösung:**
- Prüfe Bucket Policy (Schritt 2.11)
- Prüfe "Block Public Access" ist AUS (Schritt 2.4)

### Problem: "NoSuchKey" Error

**Lösung:**
- Prüfe ob `index.html` direkt im Bucket liegt
- NICHT in `build/` Subfolder!

### Problem: Blank Page / White Screen

**Lösung:**
- Check Browser Console: F12
- React Build korrekt erstellt?
- `npm run build` ohne Errors?

---

## 📊 Kosten-Update

**Aktueller Stand:**

| Service | Usage | Kosten/Monat |
|---------|-------|--------------|
| **DynamoDB** | 4 Tables, ~42 Items | $0 (Free Tier) |
| **S3 Storage** | ~5MB Frontend | $0 (Free Tier) |
| **S3 Requests** | ~100 GET/Tag | $0 (Free Tier) |
| **Total** | | **$0** |

---

## ✅ Step 2 Erfolgreich!

Du hast gelernt:
- ✅ S3 Bucket erstellen
- ✅ Static Website Hosting aktivieren
- ✅ Bucket Policies konfigurieren
- ✅ React Production Build erstellen
- ✅ Files zu S3 hochladen

---

## 🚀 Optional: CloudFront CDN

**CloudFront** = AWS CDN (Content Delivery Network)

**Vorteile:**
- 🚀 Schneller (Caching weltweit)
- 🔒 HTTPS automatisch
- 🌍 Globale Verfügbarkeit

**Kosten:** ~$0.50/Monat (Free Tier: 1TB Traffic)

**Setup-Zeit:** ~15 Minuten

**Brauchen wir das?**
- **Nein** für Development/Testing
- **Ja** für Production

**→ Überspringen für jetzt, machen wir später!**

---

## ⏭️ Nächster Schritt: Backend zu Lambda

**Step 3:** Backend auf AWS Lambda deployen

Was kommt:
- Express App → Lambda Function konvertieren
- Lokaler Test mit SAM Local
- Deployment zu AWS
- DynamoDB Permissions konfigurieren

**Pause hier?** Oder weitermachen? 🚀

---

*Step 2 - S3 Frontend Hosting*
*Geschätzte Zeit: 30-40 Minuten*
*Kosten: $0/Monat (Free Tier)*

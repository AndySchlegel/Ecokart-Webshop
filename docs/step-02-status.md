# Step 2: S3 Frontend Hosting - Status & Next Steps

## 📋 Übersicht

**Ziel:** React Frontend auf S3 hosten
**Status:** 📝 Dokumentation erstellt, bereit zu starten
**Dauer:** ~30-40 Minuten (kann unterbrochen werden!)
**Kosten:** $0/Monat (Free Tier)

---

## 🎯 Was wird gemacht?

### Teil A: S3 Bucket erstellen (15 Min)
- [ ] Bucket erstellen: `ecokart-frontend-<name>`
- [ ] Static Website Hosting aktivieren
- [ ] Public Access konfigurieren (Bucket Policy)

### Teil B: Frontend Build & Upload (15 Min)
- [ ] React Production Build erstellen
- [ ] Files zu S3 hochladen (via Console oder CLI)
- [ ] Website URL testen

### Teil C: CloudFront (Optional - später)
- [ ] CDN für globale Performance
- [ ] HTTPS automatisch
- [ ] → Überspringen für jetzt!

---

## 🚀 Quick Start

### Option 1: Manuelle Erstellung (Empfohlen für Lernen)

📖 **Folge der Anleitung:**
`docs/step-02-s3-frontend.md`

Schritt für Schritt mit Console-Screenshots!

---

### Option 2: Schnelle Erstellung (CLI)

```bash
# 1. Bucket erstellen
aws s3 mb s3://ecokart-frontend-andy \
  --profile Teilnehmer-729403197965 \
  --region eu-north-1

# 2. Static Website Hosting aktivieren
aws s3 website s3://ecokart-frontend-andy \
  --profile Teilnehmer-729403197965 \
  --region eu-north-1 \
  --index-document index.html \
  --error-document index.html

# 3. Bucket Policy anwenden
aws s3api put-bucket-policy \
  --bucket ecokart-frontend-andy \
  --profile Teilnehmer-729403197965 \
  --region eu-north-1 \
  --policy file://bucket-policy.json

# 4. Build & Deploy
cd frontend
npm run build
./scripts/deploy-to-s3.sh ecokart-frontend-andy
```

---

## 📦 Deployment Script

**Erstellt:** `frontend/scripts/deploy-to-s3.sh`

```bash
cd frontend
chmod +x scripts/deploy-to-s3.sh
./scripts/deploy-to-s3.sh ecokart-frontend-andy
```

**Was macht es?**
- ✅ Prüft ob `build/` existiert
- ✅ Erstellt Build falls nötig
- ✅ Uploaded alle Files zu S3
- ✅ Zeigt Website URL an

---

## 🐛 Häufige Probleme

### "AccessDenied" beim Website-Zugriff
```bash
# Prüfe Bucket Policy:
aws s3api get-bucket-policy \
  --bucket ecokart-frontend-andy \
  --profile Teilnehmer-729403197965
```

### "NoSuchBucket"
```bash
# Prüfe ob Bucket existiert:
aws s3 ls --profile Teilnehmer-729403197965
```

### CORS Errors in Browser Console
→ **Normal!** Backend läuft noch lokal
→ Wird in Step 4 (API Gateway) gefixed

---

## 📊 Was funktioniert nach Step 2?

| Feature | Status | Warum? |
|---------|--------|--------|
| Website lädt | ✅ | Auf S3 gehostet |
| React Router | ✅ | SPA mit index.html |
| Styling | ✅ | CSS geladen |
| API Calls | ❌ | Backend noch lokal |
| Login | ❌ | Backend noch lokal |
| Products | ❌ | Backend noch lokal |

**→ Wird in Step 3+4 gefixed!**

---

## ⏭️ Nächste Steps

### Nach erfolgreichem Step 2:

**Step 3:** Backend zu Lambda migrieren
**Step 4:** API Gateway Setup
**Step 5:** Frontend API_URL aktualisieren + Re-Deploy

---

## 💡 Pause-Punkte

Du kannst **jederzeit pausieren** nach:

✅ **Punkt 1:** Bucket erstellt + Website Hosting aktiviert
- Bucket existiert
- Kann später fortfahren

✅ **Punkt 2:** Build erstellt
- `build/` Ordner bleibt erhalten
- Upload später möglich

✅ **Punkt 3:** Upload abgeschlossen
- Website online
- Fertig mit Step 2!

---

## 📸 Screenshots für Präsentation

**Wichtige Screenshots:**
1. ✅ S3 Bucket List (zeigt ecokart-frontend-...)
2. ✅ Static Website Hosting Settings
3. ✅ Bucket Policy JSON
4. ✅ Files in S3 (index.html, static/...)
5. ✅ Website im Browser mit S3 URL

---

## 📝 Lernziele - Checkup

Nach Step 2 verstehst du:
- [ ] Was ist S3 Object Storage?
- [ ] Wie funktioniert Static Website Hosting?
- [ ] Was sind Bucket Policies?
- [ ] Wie deployed man eine React App?
- [ ] Unterschied zwischen localhost und Production

---

**Status:** Bereit zum Start! 🚀
**Empfehlung:** Starte mit Teil A (Bucket erstellen) wenn du 15-20 Min Zeit hast

*Step 2 Status - Ready to deploy*
*Kosten: $0/Monat*

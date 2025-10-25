# EcoKart Development Guide

## Workflow-Scripts

Wir haben 3 Helper-Scripts für wiederkehrende Prozesse:

### 1. Development Server starten

```bash
./dev.sh
```

**Was macht es:**
- Prüft ob du im `developer` Branch bist
- Installiert Dependencies (falls nötig)
- Startet den Dev-Server auf `http://localhost:3000`
- Hot-Reload ist aktiviert

---

### 2. Build & Test

```bash
./build.sh
```

**Was macht es:**
- Führt Linting aus
- Baut das Projekt
- Zeigt Build-Statistiken
- Prüft ob alles bereit für Production ist

**Nutze dies vor dem Merge nach main!**

---

### 3. Merge zu Main & Push

```bash
./merge-to-main.sh
```

**Was macht es:**
- Prüft auf uncommitted changes
- Zeigt alle Änderungen seit dem letzten Merge
- Merged `developer` → `main`
- Optional: Push zu Remote Repository
- Kehrt automatisch zu `developer` zurück

---

## Branch-Strategie

```
developer (Development)
    ↓
    merge (nach Testing)
    ↓
main (Production-ready)
    ↓
    push
    ↓
origin/main (Remote Repository)
```

### Workflow:

1. **Entwicklung:** Immer im `developer` Branch arbeiten
2. **Testing:** `./build.sh` ausführen
3. **Merge:** `./merge-to-main.sh` nutzen
4. **Deploy:** Push zu Remote

---

## Manuelle Befehle

Falls du die Scripts nicht nutzen möchtest:

### Dev Server
```bash
cd frontend
npm install
npm run dev
```

### Build
```bash
cd frontend
npm run build
```

### Branch wechseln
```bash
git checkout developer  # Entwicklung
git checkout main       # Production
```

### Manueller Merge
```bash
git checkout main
git merge developer --no-ff
git push origin main
git checkout developer
```

---

## Tipps

- **Immer in `developer` entwickeln** - niemals direkt in `main`
- **Regelmäßig committen** - kleine, atomare Commits
- **Vor Merge testen** - `./build.sh` ausführen
- **Beschreibende Commit-Messages** - erkläre das "Warum"

---

## Projekt-Struktur

```
Ecokart-Webshop/
├── frontend/               # Next.js Frontend
│   ├── app/
│   │   ├── page.tsx       # Landing Page
│   │   ├── layout.tsx     # Root Layout
│   │   ├── globals.css    # Global Styles
│   │   └── components/    # React Components
│   ├── package.json
│   └── next.config.js
├── dev.sh                 # Development Script
├── build.sh               # Build & Test Script
├── merge-to-main.sh       # Merge & Deploy Script
└── DEVELOPMENT.md         # Diese Datei
```

---

## Troubleshooting

### "command not found"
```bash
chmod +x dev.sh build.sh merge-to-main.sh
```

### Port 3000 bereits belegt
```bash
# Finde den Prozess
lsof -i :3000
# Oder nutze anderen Port
PORT=3001 npm run dev
```

### Node modules Probleme
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

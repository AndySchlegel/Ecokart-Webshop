# Repository Cleanup Plan

## Analyse: 41 Markdown-Dateien gefunden!

### ❌ ZU LÖSCHEN (28 Dateien)

#### Obsolete Session Summaries
- `docs/session-2025-10-25.md` ❌
- `docs/SESSION_SUMMARY_2025-10-30.md` ❌

#### Obsolete Step-by-Step Guides (veraltet)
- `docs/step-01-dynamodb-console.md` ❌
- `docs/step-01-dynamodb.md` ❌
- `docs/step-01-status.md` ❌
- `docs/step-02-amplify-hosting.md` ❌
- `docs/step-02-amplify-status.md` ❌
- `docs/step-02-s3-frontend.md` ❌
- `docs/step-02-status.md` ❌

#### Doppelte/Obsolete Deployment Guides
- `AWS-DEPLOYMENT-GUIDE.md` ❌ (veraltet)
- `docs/DEPLOYMENT.md` ❌ (veraltet)
- `docs/AUTOMATED_DEPLOYMENT.md` ❌ (in Master Doc)
- `docs/ADMIN_FRONTEND_DEPLOYMENT.md` ❌ (in Master Doc)
- `terraform/DEPLOYMENT_GUIDE.md` ❌ (veraltet)
- `QUICKSTART.md` ❌ (in Quick Reference integrieren)

#### Alte Demo/Speaker Notes
- `docs/aws-demo-plan.md` ❌
- `docs/aws-demo-summary.md` ❌
- `ecokart-speaker-notes.md` ❌

#### Obsolete Planning Docs
- `docs/NAECHSTE_WOCHE.md` ❌

#### Redundante Content
- `docs/FAQ.md` ❌ (in Master Doc integrieren)
- `DEVELOPMENT.md` ❌ (in Master Doc integrieren)
- `docs/NEXT_STEPS.md` ❌ (in Master Doc integrieren)

#### Redundante Terraform Docs
- `terraform/QUICK_START.md` ❌ (in Root Quick Reference)
- `terraform/CHANGELOG.md` ❌ (nicht gepflegt)
- `terraform/lambda/README.md` ❌ (alter Ordner, Module sind in modules/)

#### Redundante README.md
- `admin-backend/README.md` ❌ (Admin Backend existiert nicht mehr)
- `backend/aws/README.md` ❌ (alter Ordner)

---

### ✅ BEHALTEN & AKTUALISIEREN (5 Kern-Dokumente)

1. **README.md** (Root) ✅
   - Projekt-Übersicht
   - Quick Start
   - Link zu detaillierten Docs

2. **docs/MASTER_DOCUMENTATION.md** ✅
   - Technische Referenz
   - Code-Highlights
   - Architektur

3. **docs/PRESENTATION_GUIDE.md** ✅
   - Vortrag-Drehbuch
   - Timing
   - Sprechpunkte

4. **DEPLOYMENT_QUICK_REFERENCE.md** ✅
   - One-Pager
   - Häufige Commands
   - Troubleshooting

5. **docs/SESSION_SUMMARY_2025-11-03.md** ✅
   - Latest Session
   - Kontext für nächstes Mal

---

### ✅ MODUL-SPEZIFISCHE DOCS (3 Dateien)

1. **frontend/README.md** ✅
2. **admin-frontend/README.md** ✅
3. **backend/README.md** ✅

---

### ✅ TERRAFORM DOCS (3 Dateien)

1. **terraform/README.md** ✅ (Main Terraform Doc)
2. **terraform/examples/basic/README.md** ✅ (Example Config)
3. **terraform/examples/basic/CHEATSHEET.md** ✅ (Quick Commands)
4. **terraform/modules/seed/README.md** ✅ (Seeding Module)

---

## Bilder zu löschen

### ❌ Unnötige Screenshots
- `docs/Bildschirmfoto 2025-10-26 um 23.34.00.png` ❌

### ❌ Doppelte Bilder im Root
Löschen (existieren bereits in frontend/admin-frontend):
- `pics/Air Legacy Sky Dunk.jpg` ❌
- `pics/jordan-shoes-1777572_1280.jpg` ❌
- `pics/nba-8176216_1280.png` ❌
- `pics/nike-5418992_1280.jpg` ❌
- `pics/sneakers-5578127_1280.jpg` ❌

**Kompletten `pics/` Ordner löschen** ❌

---

## Scripts zu löschen

### ❌ Obsolete Dev Scripts (nicht mehr genutzt)
- `build.sh` ❌
- `dev.sh` ❌
- `start-admin.sh` ❌
- `start-all.sh` ❌
- `start-backend.sh` ❌
- `merge-to-main.sh` ❌

### ✅ BEHALTEN
- `deploy.sh` ✅ (ONE-CLICK Deployment)
- `scripts/setup-automation.sh` ✅
- `scripts/connect-github.sh` ✅

---

## Ordner zu löschen

### ❌ Komplett entfernen
- `admin-backend/` ❌ (existiert nicht mehr, nur noch `backend/`)
- `backend/aws/` ❌ (alte Deployment-Scripts)
- `terraform/lambda/` ❌ (alter Ordner, Module sind in `modules/`)
- `pics/` ❌ (Duplikate)

---

## Neue konsolidierte Struktur

```
Ecokart Webshop/
│
├── README.md                          # Projekt-Übersicht + Quick Start
├── DEPLOYMENT_QUICK_REFERENCE.md      # One-Pager Quick Reference
│
├── docs/
│   ├── MASTER_DOCUMENTATION.md        # Komplette technische Referenz
│   ├── PRESENTATION_GUIDE.md          # Vortrag-Drehbuch
│   ├── SESSION_SUMMARY_2025-11-03.md  # Latest Session Notes
│   ├── AMPLIFY_GITHUB_TOKEN.md        # Spezifisch: GitHub Token
│   └── CI_CD_AUTOMATION.md            # Spezifisch: CI/CD Konzept
│
├── frontend/
│   └── README.md                      # Frontend-spezifisch
│
├── admin-frontend/
│   └── README.md                      # Admin-Frontend-spezifisch
│
├── backend/
│   └── README.md                      # Backend-spezifisch
│
├── terraform/
│   ├── README.md                      # Terraform Overview
│   ├── modules/
│   │   └── seed/
│   │       └── README.md              # Seeding Module
│   └── examples/
│       └── basic/
│           ├── README.md              # Example Config
│           └── CHEATSHEET.md          # Quick Commands
│
├── scripts/
│   ├── setup-automation.sh
│   └── connect-github.sh
│
└── deploy.sh                          # ONE-CLICK Deployment
```

**Reduktion:** Von 41 auf 13 Markdown-Dateien! (-68%)

---

## Zusammenfassung

### Zahlen
- **Markdown-Dateien:** 41 → 13 (-68%)
- **Images:** 6 (doppelte) → 0
- **Scripts:** 6 obsolete → 0
- **Ordner:** 4 obsolete → 0

### Vorteile
- ✅ Klare Struktur
- ✅ Keine Redundanz
- ✅ Einfach zu navigieren
- ✅ Wartbar

### Konsolidierung

**In MASTER_DOCUMENTATION.md integrieren:**
- FAQ.md
- DEVELOPMENT.md
- NEXT_STEPS.md
- AUTOMATED_DEPLOYMENT.md

**In DEPLOYMENT_QUICK_REFERENCE.md integrieren:**
- QUICKSTART.md
- terraform/QUICK_START.md

**Komplett löschen:**
- Alle veralteten Session Summaries (außer latest)
- Alle step-*.md
- Alte Demo-Pläne
- Obsolete Deployment Guides

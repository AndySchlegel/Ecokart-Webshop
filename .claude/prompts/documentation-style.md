# 📚 Documentation Style Guide - Andy

**Version:** 1.0
**Created:** 22. November 2025
**Purpose:** Wie Dokumentation strukturiert und geschrieben werden soll

---

## 🌍 Zweisprachigkeit in Dokumentation

### Grundregel
**Deutsch für Erklärungen + Englisch für technische Begriffe**

**Ziel:** Verständlichkeit UND Englisch lernen

---

## ✍️ Schreibstil

### Technische Begriffe
**Format:** `**EN-Begriff** (DE-Übersetzung)`

```markdown
✅ Das **State Management** (Zustandsverwaltung) ist kritisch...
✅ Wir nutzen einen **Circuit Breaker** (Unterbrechungsmechanismus)...
✅ Der **Deployment Workflow** (Bereitstellungsprozess) läuft...
```

**Beim ersten Vorkommen in Dokument:**
```markdown
Das **Terraform State** (Terraform-Zustand) speichert den aktuellen
Status der Infrastruktur. Der State wird in einem S3 Bucket gesichert.

Später im Dokument kann dann nur noch "State" verwendet werden,
da bereits erklärt.
```

### Wichtige EN-Begriffe hervorheben
```markdown
✅ Das **State Management** ist kritisch...
✅ Der **Circuit Breaker** stoppt nach 3 Versuchen...

❌ Das State Management ist kritisch...  (nicht bold)
```

### Beide Sprachen im Fließtext
```markdown
✅ Der **Deployment Workflow** (Bereitstellungsprozess) startet automatisch
    bei jedem Push auf den develop Branch. Der Workflow nutzt GitHub Actions
    und deployed via Terraform zur AWS Cloud.

✅ Nach einem **State Corruption** (Zustandsbeschädigung) muss ein
    **Nuclear Cleanup** durchgeführt werden.
```

---

## 📋 Session Docs Format

### Grundstruktur
**"Fokus auf Learnings"** (nicht chronologisch)

```markdown
# Session Title - Kurzbeschreibung

**Date:** YYYY-MM-DD
**Duration:** X hours
**Status:** ✅ Success / ⚠️ Blocked / 🔴 Failed

---

## 🎯 Ziel der Session
Was wollten wir erreichen?

## ✅ Was funktioniert hat
- [Erfolgreiche Tasks]
- [Neue Features]

## ❌ Probleme & Lösungen
### Problem 1: [Name]
**Symptom:** [Was war sichtbar]
**Ursache:** [Root Cause]
**Lösung:** [Wie gefixt]
**Learning:** [Was gelernt]

### Problem 2: [Name]
[Gleiche Struktur]

## 🎓 Key Learnings
1. [Learning mit Begründung]
2. [Learning mit Begründung]

## 🎯 Next Steps
1. [Priorität 1]
2. [Priorität 2]

---

**Updated Docs:**
- LESSONS_LEARNED.md: #15, #16
- ACTION_PLAN.md: Critical issues section
```

### Detaillierte Debugging-Session (bei komplexen Problemen)
**Muster vom 21.11.2025:**

```markdown
# 🔥 Critical Session Title

## 📊 Summary
[Kurze Zusammenfassung in 3-5 Sätzen]

## 🐛 Das Problem
[Ausführliche Beschreibung]

**Symptome:**
- [Liste]

**Root Cause:**
- [Detaillierte Ursachen-Analyse]

## 🔄 Lösungsversuche (Überblick)
1. ❌ Versuch 1: [Was, Warum gescheitert]
2. ❌ Versuch 2: [Was, Warum gescheitert]
3. ✅ Lösung: [Was, Warum erfolgreich]

## ✅ Die finale Lösung
[Step-by-Step mit Code/Commands]

## 🎓 Key Learnings
1. [Learning]
2. [Learning]

## 🔧 Permanente Verbesserungen
[Was wurde erstellt um zukünftig zu helfen]

## 🎯 Next Session
[Klare Prioritäten für morgen]
```

---

## 📊 LESSONS_LEARNED.md Format

### Neues Learning hinzufügen
```markdown
### [Nummer]. [Titel des Learnings]

**Herausforderung:** [Kurze Beschreibung]

**Das Problem:**
[Ausführlich was schiefgelaufen ist]

**Die Ursache:**
- [Grund 1]
- [Grund 2]

**Die Lösung:**
```bash
# Code oder Commands
```

**Was ich gelernt habe:**
- **[Hauptlearning in Bold]** - Erklärung
- [Weitere Learnings]

**Best Practice:**
[Für die Zukunft]

**Learned from:** [Datum - Session]

---
```

### Beispiel (vollständig):
```markdown
### 15. Terraform State Corruption durch Architektur-Änderungen

**Herausforderung:** Der schwierigste Debugging-Tag

**Das Problem:**
Nach Änderung der Deployment-Architektur von `terraform/examples/basic/`
zu `terraform/` root konnte Terraform State nicht mehr aufgelöst werden.

**Die Ursache:**
- Alter **State**: Ressourcen unter `module.ecokart.*` Präfix
- Neuer **Code**: Ressourcen direkt unter `module.dynamodb.*`
- **Terraform** konnte Resources nicht zuordnen → **State korrupt**

**Die Lösung:**
```bash
# Kompletter Nuclear Cleanup via AWS CLI
aws s3 rm s3://bucket/state.tfstate
# ... weitere Commands
```

**Was ich gelernt habe:**
- **Terraform State ist EXTREM fragil** bei Architektur-Änderungen
- **Lesson:** Architektur NICHT ändern wenn State existiert
- **Best Practice:** Bei Architektur-Änderungen:
  1. Destroy mit alter Architektur
  2. Architektur ändern
  3. Deploy mit neuer Architektur

**Learned from:** 21.11.2025 - State Corruption Crisis

---
```

---

## 📝 ACTION_PLAN.md Format

### Current Sprint Section
```markdown
## 🚦 Current Sprint

### In Progress

- 🚧 **Task Name**
  - **Problem:** [Beschreibung]
  - **Status:** [Details]
  - **Actions:**
    - [ ] Todo 1
    - [ ] Todo 2
  - **Owner:** [Wer]
  - **ETA:** [Wann]
```

### Known Issues Section
```markdown
## 🐛 Known Issues & Blockers

### Critical

**🔴 Issue Name** (NEW - Datum)
- **Problem:** [Beschreibung]
- **Symptoms:**
  - ✅ [Was funktioniert]
  - ❌ [Was nicht funktioniert]
- **Root Cause:** [Ursache]
- **Impact:** [Auswirkung]
- **Solution:** [Lösungsansatz]
- **Priority:** 🔴 HIGHEST
- **Status:** [Identified/In Progress/Blocked]
- **ETA:** [Wann Fix erwartet]
```

### Recent Learnings Section
```markdown
## 💡 Recent Learnings (Last 30 Days)

### From [Session Name] (Datum)

**Learning Title**
- **Problem:** [Was war das Problem]
- **Learning:** [Was gelernt]
- **Solution:** [Wie gelöst]
- **Pattern:** [Wiederverwendbares Muster]
```

---

## 🔗 README.md Format

### Project Dashboard Style
```markdown
# 🛒 Ecokart - Serverless E-Commerce Platform

**Status:** ✅ Active Development
**Version:** 1.0.0
**Last Updated:** [Datum]

---

## 📊 Quick Status

| Metric | Status | Details |
|--------|--------|---------|
| **Infrastructure** | ✅ Deployed | Development environment |
| **CI/CD** | ✅ Automated | GitHub Actions + OIDC |
| **Auth** | ⚠️ In Progress | Token storage bug |
| **AWS Costs** | 🔴 Over Budget | $17/month (target: <$10) |

---

## 🚀 Quick Start

[Step-by-step für neuen Developer]

## 🏗️ Architecture

[High-level Overview mit Diagram]

## 📚 Documentation

- [LESSONS_LEARNED.md](docs/LESSONS_LEARNED.md) - Was gelernt
- [ACTION_PLAN.md](docs/ACTION_PLAN.md) - Roadmap
- [DEVELOPMENT.md](docs/DEVELOPMENT.md) - How to develop

## 🎯 Current Focus

1. [Top Priority]
2. [Secondary Priority]

---

**Need Help?** Check [TROUBLESHOOTING.md](docs/guides/TROUBLESHOOTING.md)
```

---

## 🎨 Formatierung & Style

### Emojis in Dokumentation
**Nutze für:**
- ✅ Section Headers (📊 📚 🎯 🔧 📋)
- ✅ Status Indicators (✅ ❌ ⚠️ 🔴 🟡 🟢)
- ✅ Kategorien (🐛 💡 🚀 📝)

**Struktur-Beispiel:**
```markdown
## 🐛 Bekannte Probleme
### 🔴 Critical
### 🟡 Medium
### 🟢 Low Priority

## 💡 Learnings
### 🎓 Technical
### 📊 Process
```

### Code-Blöcke
**IMMER mit Sprach-Identifier:**
```markdown
✅ ```typescript
   const user = await getUser(id);
   ```

✅ ```bash
   aws s3 ls
   ```

❌ ```
   const user = await getUser(id);
   ```
```

### Hervorhebungen
```markdown
**Bold:** Für wichtige Begriffe, EN-Techterms
*Italic:* Für Betonung im Fließtext
`Code:` Für Variablen, Commands, Dateinamen
> Quote: Für wichtige Hinweise

⚠️ Warnungen mit Emoji
💡 Tipps mit Emoji
📝 Notizen mit Emoji
```

### Listen
```markdown
Unordered (für Aufzählungen):
- Item
- Item
  - Sub-item
  - Sub-item

Ordered (für Steps):
1. Schritt 1
2. Schritt 2
3. Schritt 3

Checklists (für TODOs):
- [ ] Todo
- [x] Erledigt
```

---

## 📐 Dokumentations-Hierarchie

### Ebene 1: Top-Level Docs (Root)
```
README.md               - Project Dashboard (Status, Quick Links)
CLAUDE.md              - AI Collaboration Guidelines (allgemein)
CLAUDE_ECOKART.md      - Project-specific AI Guidelines
```

### Ebene 2: Main Docs (docs/)
```
docs/
├── LESSONS_LEARNED.md     - Chronologische Learnings
├── ACTION_PLAN.md         - Living Roadmap
└── DEVELOPMENT.md         - How to develop
```

### Ebene 3: Kategorien (docs/*/

)
```
docs/
├── guides/                - How-To Dokumentation
│   ├── DEPLOYMENT.md
│   ├── LOCAL_SETUP.md
│   └── TROUBLESHOOTING.md
├── architecture/          - System Design
│   ├── SYSTEM_DESIGN.md
│   ├── DATABASE_SCHEMA.md
│   └── API_ENDPOINTS.md
└── sessions/              - Session Logs
    └── YYYY-MM-DD_topic.md
```

---

## 🔄 Update-Frequenz

### Täglich (bei aktiver Arbeit):
- [ ] Session Doc erstellen/updaten
- [ ] ACTION_PLAN.md (Status Update)

### Bei jedem Learning:
- [ ] LESSONS_LEARNED.md erweitern
- [ ] Glossary.md updaten (neue EN-Begriffe)

### Wöchentlich:
- [ ] README.md Status aktualisieren
- [ ] Alte Session Docs archivieren

### Bei Breaking Changes:
- [ ] DEVELOPMENT.md updaten
- [ ] Architecture Docs updaten
- [ ] Migration Guide schreiben

---

## ✅ Quick Checklist für Dokumentation

Vor Session-Ende:
- [ ] Session Doc erstellt? (Learnings-Format)
- [ ] LESSONS_LEARNED.md aktualisiert? (bei neuem Learning)
- [ ] ACTION_PLAN.md aktualisiert? (Status + Next Steps)
- [ ] Glossary.md erweitert? (neue EN-Begriffe)
- [ ] Code-Änderungen kommentiert? (siehe code-style.md)
- [ ] Alle EN-Begriffe beim ersten Mal erklärt?
- [ ] Zweisprachigkeit durchgängig?

---

## 🚫 Was VERMEIDEN

### In Dokumentation:
- ❌ Nur Englisch (keine DE Erklärungen)
- ❌ Nur Deutsch (keine EN Fachbegriffe)
- ❌ EN-Begriffe ohne Erklärung beim ersten Mal
- ❌ Veraltete Docs (IMMER aktuell halten!)
- ❌ Code-Blöcke ohne Syntax-Highlighting
- ❌ Lange Textwüsten (Struktur mit Headers/Listen!)
- ❌ TODOs ohne Datum/Owner
- ❌ Broken Links

### Stattdessen:
- ✅ Zweisprachig: DE Erklärung + EN Fachbegriff
- ✅ EN-Begriffe erklären: **Term** (Übersetzung)
- ✅ Glossar pflegen für wiederkehrende Begriffe
- ✅ Docs bei jeder Änderung updaten
- ✅ Immer ```language für Code-Blöcke
- ✅ Struktur mit Emojis, Headers, Listen
- ✅ TODOs mit `- [ ] Task (Owner, ETA)`
- ✅ Links regelmäßig prüfen

---

## 📚 Beispiel: Vollständiges Learning Entry

```markdown
### 18. Frontend Token Storage Bug - Das unsichtbare Problem

**Herausforderung:** User logged in, aber keine Tokens

**Das Problem:**
```
✅ User **Registration** (Registrierung) funktioniert
✅ **Login** funktioniert
✅ Console zeigt "User eingeloggt"
✅ Lambda Logs: "**JWT validated** successfully"
❌ **localStorage**: LEER
❌ **sessionStorage**: LEER
❌ **Cart** requests: 401 Unauthorized
```

**Diagnostik:**
```javascript
// Chrome DevTools Console:
console.log(window.localStorage);   // Storage {length: 0}
console.log(window.sessionStorage); // Storage {length: 0}
```

**Die Ursache:**
Frontend **Authentication Code** persistiert **Tokens** NICHT
nach Login/Registration!

- **Token** wird von Backend empfangen
- Token wird für ersten **Request** verwendet
- Token wird NICHT in **Storage** gespeichert
- Folge-Requests haben keinen Token → 401

**Warum schwer zu finden:**
- ✅ Keine **Errors** in Console
- ✅ Login scheint zu funktionieren
- ✅ Backend **JWT Validation** funktioniert
- ❌ Problem ist im Frontend **Auth Flow**

**Die Lösung (für morgen):**
```typescript
// Nach erfolgreicher Login/Registration:
const { idToken, accessToken, refreshToken } = authResult;

// Tokens MÜSSEN gespeichert werden:
localStorage.setItem('idToken', idToken);
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);

// Später bei Requests:
const token = localStorage.getItem('idToken');
headers.Authorization = `Bearer ${token}`;
```

**Was ich gelernt habe:**
- **State Management** ist kritisch bei **Authentication**
- Frontend kann "funktionieren" ohne zu funktionieren
- Immer **Storage** checken bei Auth-Problemen
- Console-Logs allein reichen nicht
- **Next Step:** AuthContext prüfen

**Status:** UNRESOLVED - Morgen fixen!

**Learned from:** 21.11.2025 - Debugging Session

---
```

---

**Remember:**
- 🌍 **Zweisprachig:** DE Erklärung + EN Fachbegriff
- 📚 **Fokus auf Learnings** in Session Docs
- 📊 **Emojis für Struktur**
- 💡 **EN-Begriffe beim ersten Mal erklären**
- ✅ **Immer aktuell halten**

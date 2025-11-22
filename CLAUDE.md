# 🤖 Claude AI Collaboration Guidelines

**Version:** 1.0
**Created:** 22. November 2025
**Purpose:** Allgemeine Best Practices für effiziente Zusammenarbeit mit Claude Code
**Scope:** Project-agnostic, wiederverwendbar für alle Projekte

---

## 🎯 Grundprinzipien

### 1. Kommunikation vor Aktion
- **Bei kritischen Änderungen:** Informieren → Vorschlag machen → auf Bestätigung warten
- **Bei mehreren Lösungswegen:** ALLE Optionen mit Vor-/Nachteilen präsentieren
- **Bei Unsicherheit:** Lieber einmal zu viel fragen als blind handeln

### 2. Dokumentation ist Pflicht
- **Live-Dokumentation:** Wichtige Schritte SOFORT dokumentieren
- **Nachvollziehbar:** Jede Änderung muss später verständlich sein
- **Strukturiert:** Lessons Learned, Action Plan, Session Docs aktuell halten

### 3. Fehler sind Lernchancen
- **Systematisch debuggen:** Nicht wild probieren
- **Früh eskalieren:** Nach 1-2 Fehlversuchen alternative Wege zeigen
- **Dokumentieren:** Jeden Error in LESSONS_LEARNED.md aufnehmen

---

## 🛑 Circuit Breaker - Wann STOPPEN

Claude STOPPT die Arbeit und informiert den User bei:

### Automatische Stop-Bedingungen
1. ✋ **Nach 3 fehlgeschlagenen Versuchen** derselben Lösung
   - Nicht stur weitermachen
   - Alternative Ansätze präsentieren
   - User entscheiden lassen

2. ✋ **Bei Architektur-Änderungen**
   - Fundamental structure changes
   - State-Management-Änderungen
   - Breaking Changes in der Projekt-Struktur

3. ✋ **Bei unerwarteten Errors** die nicht dokumentiert sind
   - Neue Error-Typen
   - Unbekannte AWS-Fehlermeldungen
   - Mysteriöse Verhaltensweisen

4. ✋ **Nach 30 Minuten ohne Fortschritt**
   - Pause einlegen
   - Strategie überdenken
   - User informieren

### Wann NICHT stoppen
- ✅ Bei bekannten Issues (dokumentiert in LESSONS_LEARNED.md)
- ✅ Bei klaren Bug-Fixes (eindeutig definiert)
- ✅ Bei Dokumentations-Updates
- ✅ Bei Code-Formatierung

---

## 🚨 Kritische Änderungen - Approval erforderlich

Claude MUSS User informieren und auf Bestätigung warten bei:

### Infrastructure & State
- 🔴 Terraform State löschen/ändern
- 🔴 AWS Ressourcen manuell löschen
- 🔴 Datenbank-Schema-Änderungen
- 🔴 Architektur-Umbauten

### Deployments & Releases
- 🔴 Production Deployments
- 🔴 Breaking Changes
- 🔴 Version Bumps (major)

### Security & Costs
- 🔴 IAM Permissions ändern
- 🔴 Änderungen die AWS-Kosten beeinflussen
- 🔴 Security-relevante Konfigurationen
- 🔴 Secrets/Credentials-Management

### Process
**Bei kritischen Änderungen:**
1. 📢 **Informieren:** "Ich habe folgendes Problem erkannt: ..."
2. 💡 **Vorschlag:** "Ich schlage folgende Lösung vor: ..."
3. ⚖️ **Optionen:** "Alternative Wege wären: ..."
4. ⏸️ **Warten:** Auf User-Entscheidung warten
5. ✅ **Ausführen:** Nach Bestätigung handeln

---

## 🔧 Error Handling Protokoll

### Bei Errors - das 5-Schritte-Protokoll

```
1. STOP ✋
   - Nicht blind weitermachen
   - Aktuellen Versuch abbrechen

2. LOG 📝
   - Error vollständig dokumentieren
   - Kontext erfassen (was wurde versucht)
   - Screenshots/Logs speichern

3. ANALYZE 🔍
   - Root Cause finden
   - Ähnliche bekannte Issues checken (LESSONS_LEARNED.md)
   - Mögliche Ursachen identifizieren

4. PRESENT 💬
   - User informieren über:
     * Was ist schiefgelaufen
     * Warum ist es schiefgelaufen
     * Welche Optionen gibt es jetzt
   - WICHTIG: Nach 1-2 Fehlversuchen bereits Nuclear/Manual-Optionen zeigen

5. DOCUMENT 📚
   - In LESSONS_LEARNED.md aufnehmen
   - Für zukünftige Sessions verfügbar machen
```

### Eskalations-Strategie

**Timing:** Früher eskalieren statt stundenlang probieren!

```
Versuch 1: Automated Solution A
  ↓ (scheitert)
Versuch 2: Automated Solution B
  ↓ (scheitert)
→ STOP & INFORM USER:
  "Automated approaches scheitern. Optionen:
   A) Manual/Nuclear Cleanup (schnell, destruktiv)
   B) Deep Debugging (langsam, lehrreich)
   C) Alternative Architektur
  Welchen Weg möchtest du gehen?"
```

**Nicht:** 5+ Versuche ohne User-Input (wie gestern bei State Corruption!)

---

## 📋 Session Management

### Pre-Session Checklist
Vor jeder Arbeits-Session:
- [ ] README.md lesen (aktueller Projekt-Status)
- [ ] ACTION_PLAN.md checken (next priorities)
- [ ] LESSONS_LEARNED.md überfliegen (bekannte Issues)
- [ ] Letzten Session Doc lesen (wo sind wir stehen geblieben)
- [ ] Git status checken (uncommitted changes?)

### During Session
- [ ] TodoWrite tool nutzen für Task-Tracking
- [ ] Wichtige Schritte SOFORT dokumentieren
- [ ] Bei Blockern: Circuit Breaker beachten
- [ ] Regelmäßige Status-Updates an User

### End-of-Session Checklist
- [ ] Alle Änderungen committed?
- [ ] Dokumentation aktualisiert?
  - [ ] LESSONS_LEARNED.md (neue Learnings)
  - [ ] ACTION_PLAN.md (Status + Next Steps)
  - [ ] Session Doc erstellt/aktualisiert
- [ ] Offene TODOs dokumentiert?
- [ ] Nächste Session vorbereitet? (Clear next steps)

---

## 💡 Entscheidungs-Framework

### Claude FRAGT bei:
- ❓ Mehreren gleichwertigen Lösungswegen
- ❓ Architektur-Entscheidungen
- ❓ Trade-offs (Performance vs. Cost vs. Complexity)
- ❓ Security-relevanten Änderungen
- ❓ Löschen von Daten/Ressourcen
- ❓ Breaking Changes

### Claude HANDELT direkt bei:
- ✅ Klaren Bug-Fixes (eindeutig definiert)
- ✅ Code-Formatierung & Linting
- ✅ Dokumentations-Updates
- ✅ Known Issues (dokumentiert, Lösung bekannt)
- ✅ Non-Breaking Refactorings
- ✅ Test-Erweiterungen

### Claude PRÄSENTIERT Optionen bei:
- 💭 Mehreren technischen Ansätzen
- 💭 Unsicherheit über beste Lösung
- 💭 Komplexen Trade-offs
- 💭 Neuen/unbekannten Problemen

**Format für Optionen-Präsentation:**
```markdown
## Problem: [Kurze Beschreibung]

### Option A: [Name]
**Vorteile:** ...
**Nachteile:** ...
**Aufwand:** ...
**Risiko:** ...

### Option B: [Name]
**Vorteile:** ...
**Nachteile:** ...
**Aufwand:** ...
**Risiko:** ...

### Empfehlung: [Welche und warum]
```

---

## 📚 Dokumentations-Standards

### Live-Dokumentation während Session
Dokumentiere SOFORT bei:
- ✍️ Kritischen Errors (mit Lösung)
- ✍️ Architektur-Entscheidungen
- ✍️ Neuen Learnings
- ✍️ Unerwarteten Verhaltensweisen
- ✍️ Workarounds & Hacks

### Dokumentations-Struktur

```
docs/
├── LESSONS_LEARNED.md     # Was haben wir gelernt?
├── ACTION_PLAN.md         # Was machen wir als nächstes?
├── DEVELOPMENT.md         # Wie entwickeln wir?
├── sessions/              # Session-spezifische Docs
│   └── YYYY-MM-DD_topic.md
├── guides/                # How-To Guides
└── architecture/          # Architektur-Dokumentation
```

### Session Docs Format
```markdown
# Session Title - Kurze Beschreibung

**Date:** YYYY-MM-DD
**Duration:** X hours
**Status:** Success/Blocked/In Progress

## Problem/Goal
Was wollten wir erreichen?

## What Happened
Chronologischer Ablauf

## Errors & Solutions
Welche Probleme, welche Lösungen

## Learnings
Was nehmen wir mit?

## Next Steps
Was kommt als nächstes?
```

---

## 🛠️ Tool Usage Guidelines

### Bevorzuge spezialisierte Tools
- ✅ **Read** statt `cat`
- ✅ **Edit** statt `sed`
- ✅ **Write** statt `echo >`
- ✅ **Grep** statt `grep` command
- ✅ **Glob** statt `find`

### Bash nur für echte Shell-Operationen
- ✅ Git commands
- ✅ AWS CLI
- ✅ npm/build commands
- ✅ System commands
- ❌ File operations (use specialized tools!)
- ❌ Communication with user (output text directly!)

### Task Tool für komplexe Suchen
Bei open-ended Exploration:
- ✅ Use Task tool mit Explore agent
- ❌ Nicht multiple grep/glob Runden manuell

---

## ⚡ Effizienz-Prinzipien

### Parallel wo möglich
- ✅ Multiple file reads parallel
- ✅ Independent searches parallel
- ✅ Independent bash commands parallel (wenn kein Dependency)
- ❌ Sequential wenn Dependencies existieren

### Minimiere Context Usage
- ✅ Task tool für große Suchen (reduziert Context)
- ✅ Nur relevante Files lesen
- ✅ Grep mit head_limit wenn viele Results erwartet

### Don't Repeat Yourself
- ✅ Bekannte Lösungen aus LESSONS_LEARNED nutzen
- ✅ Wiederverwendbare Patterns dokumentieren
- ✅ Templates für häufige Tasks

---

## 🎓 Best Practices aus echten Sessions

### Learning: Terraform State ist heilig
**Regel:** Niemals State ändern ohne Backup/Plan
**Bei State-Problemen:**
1. Backup erstellen
2. Mehrere Lösungswege zeigen (Automated vs. Manual)
3. Nach 2 Fehlversuchen Nuclear Option vorschlagen
4. User entscheiden lassen

### Learning: Früh eskalieren spart Zeit
**Regel:** Nach 1-2 Fehlversuchen alternative Wege zeigen
**Nicht:** Stundenlang automatisierte Lösungen probieren
**Sondern:** "Automated scheitert, hier sind manuelle Optionen"

### Learning: AWS braucht Zeit
**Regel:** Nach Destroy/Cleanup immer Wartezeit einplanen
**Best Practice:**
- Nach Resource Deletion: `wait` commands nutzen
- Zwischen großen Operations: 30-60 Sekunden warten
- User über Wartezeiten informieren

### Learning: Double-Check kritische Operationen
**Regel:** Vor kritischen Operationen nochmal verifizieren
**Pattern:**
```bash
# FALSCH:
aws dynamodb delete-table --table-name xyz

# RICHTIG:
# 1. Check if exists
if aws dynamodb describe-table --table-name xyz; then
  echo "Table exists, will delete"
  # 2. Delete
  aws dynamodb delete-table --table-name xyz
  # 3. Wait
  aws dynamodb wait table-not-exists --table-name xyz
  echo "Table deleted successfully"
fi
```

---

## 🔄 Continuous Improvement

### Dieses Dokument ist "Living Document"
- Nach jeder schwierigen Session: Learnings hier eintragen
- Alle 2-4 Wochen: Review und Optimierung
- Bei neuen Patterns: Guidelines erweitern

### Feedback Loop
- User-Feedback sammeln (was hat gut/schlecht funktioniert)
- Erfolgreiche Patterns dokumentieren
- Gescheiterte Ansätze als "Avoid" notieren

---

## 📞 Communication Style

### Status Updates
- Regelmäßig informieren über Fortschritt
- Bei längeren Operations: Progress-Updates
- Bei Blockern: Sofort kommunizieren

### Error Communication
**Format:**
```
❌ Problem erkannt: [Kurzbeschreibung]

🔍 Root Cause: [Was ist die Ursache]

💡 Lösungsoptionen:
  A) [Schnell aber riskant]
  B) [Langsam aber sicher]
  C) [Manual/Nuclear]

Welchen Weg möchtest du gehen?
```

### Success Communication
- ✅ Klar kommunizieren was funktioniert hat
- 📊 Ergebnisse zeigen (URLs, Status, etc.)
- 📝 Nächste Schritte vorschlagen

---

## 🚀 Quick Reference

### Bei einem Error:
1. ✋ STOP - nicht weitermachen
2. 📝 LOG - Error dokumentieren
3. 🔍 ANALYZE - Root Cause finden
4. 💬 PRESENT - User informieren + Optionen zeigen
5. 📚 DOCUMENT - In LESSONS_LEARNED aufnehmen

### Bei kritischen Änderungen:
1. 📢 Informieren über Problem
2. 💡 Lösung vorschlagen
3. ⚖️ Alternativen zeigen
4. ⏸️ Auf User-Bestätigung warten
5. ✅ Nach Go ausführen

### Bei mehreren Lösungswegen:
1. 📊 ALLE Optionen präsentieren
2. ➕ Vor-/Nachteile aufzeigen
3. 💰 Aufwand/Risiko/Kosten bewerten
4. 🎯 Empfehlung aussprechen
5. 👤 User entscheiden lassen

---

**Remember:**
- 🎯 **Kommunikation vor Aktion**
- 📝 **Dokumentation ist Pflicht**
- 🛑 **Früh eskalieren, nicht stundenlang probieren**
- 💬 **Alle Optionen präsentieren, User entscheidet**

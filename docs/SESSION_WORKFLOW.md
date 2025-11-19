# 🔄 Session Workflow - Arbeiten mit Budget-Limit

**Für:** Andy's Ecokart Projekt
**Situation:** Sandbox AWS Account mit 15$/Monat Budget
**Strategie:** Infrastruktur nur hochfahren wenn aktiv entwickelt wird

---

## 💡 Die Strategie

**Problem:** Development Environment kostet ~20-30 EUR/Monat wenn 24/7 läuft → sprengt Budget!

**Lösung:** Infrastruktur **nur** hochfahren während aktiver Entwicklung, danach sofort destroyen!

**Ergebnis:** Kosten von ~25 EUR/Monat → **~5-10 EUR/Monat** (75-80% gespart!)

---

## 📋 Workflow: Session STARTEN

### Schritt 1: Code & Doku checken (2 Min)

```bash
# Repository aktualisieren
git checkout develop
git pull origin develop

# Überblick verschaffen
git log --oneline -5

# Was war mein letzter Stand?
cat docs/SESSION_NOTES.txt  # Deine persönlichen Notizen
```

---

### Schritt 2: Infrastruktur hochfahren (10-12 Min)

**Option A: Via GitHub Actions (empfohlen!)**

```
1. Gehe zu: https://github.com/AndySchlegel/Ecokart-Webshop/actions
2. Klicke: "Deploy Ecokart Infrastructure"
3. Klicke: "Run workflow"
4. Wähle:
   - Branch: develop
   - Environment: development
5. Klicke: "Run workflow" (grün)
6. ☕ Warte 10-12 Minuten
7. ✅ Fertig! URLs im Workflow-Output
```

**Option B: Lokal (falls GitHub down ist)**

```bash
./deploy.sh
# Dann manuell in Amplify Console: GitHub verbinden (einmalig)
```

---

### Schritt 3: URLs notieren & testen (2 Min)

**Nach erfolgreichem Deployment:**

```
Development URLs:
- Customer: https://main.d...amplifyapp.com
- Admin: https://main.d...amplifyapp.com
- API: https://...execute-api.eu-north-1.amazonaws.com/dev/

Credentials:
- Basic Auth: dev / dev1234
- Test User: demo@ecokart.com / Demo1234!
- Admin User: admin@ecokart.com / ecokart2025
```

**Quick Test:**
1. Öffne Customer URL
2. Login mit Test User
3. Check: Produkte werden angezeigt?
4. ✅ Alles funktioniert!

---

## 🛠️ Workflow: ENTWICKELN

### Während der Session

```bash
# Branch erstellen (falls neues Feature)
git checkout -b feature/inventory-management

# Code schreiben...
# ... entwickeln ...
# ... testen ...

# Regelmäßig committen
git add .
git commit -m "Add stock field to products table"

# Nach jedem größeren Schritt pushen (Backup!)
git push origin feature/inventory-management
```

---

### Live-Testing in Development

**Jede Code-Änderung testen:**

1. **Backend-Änderung:** Push zu develop → Auto-Deploy (~10 Min)
2. **Frontend-Änderung:** Push zu develop → Amplify baut neu (~5 Min)
3. **Terraform-Änderung:** Push zu develop → Infrastructure Update (~8 Min)

**Wichtig:** Du kannst während Deployment weiterarbeiten lokal!

---

## 🗑️ Workflow: Session BEENDEN

### Schritt 1: Code committen & pushen (5 Min)

```bash
# Stelle sicher ALLES ist committed
git status
# Sollte zeigen: "nothing to commit, working tree clean"

# Falls noch Änderungen da sind:
git add .
git commit -m "Session end: [was du gemacht hast]"
git push origin develop  # Oder dein Feature-Branch
```

---

### Schritt 2: Session Notes schreiben (3 Min)

```bash
# Schnelle Notizen für nächste Session
echo "
=== Session $(date +%Y-%m-%d) ===
Was gemacht:
- [z.B. Inventory Management: Stock-Feld hinzugefügt]
- [z.B. Frontend: Stock-Anzeige implementiert]

Nächster Schritt:
- [z.B. Reserved-Feld für Cart implementieren]
- [z.B. Stock-Check beim Add-to-Cart]

Offene Probleme:
- [z.B. Keine - alles läuft!]
" >> docs/SESSION_NOTES.txt
```

---

### Schritt 3: Infrastruktur destroyen (5-7 Min)

**WICHTIG: Immer destroyen vor Session-Ende!** 💰

```
1. Gehe zu: https://github.com/AndySchlegel/Ecokart-Webshop/actions
2. Klicke: "Destroy Infrastructure"
3. Klicke: "Run workflow"
4. Eingaben:
   - Branch: develop
   - Confirm: "destroy" (genau so tippen!)
   - Delete Amplify apps: ☑ true (Haken setzen)
5. Klicke: "Run workflow" (grün)
6. ⏰ Warte bis fertig (~5-7 Min)
7. ✅ Check: "All resources have been destroyed!"
```

---

### Schritt 4: Verify Cleanup (2 Min)

**Optional aber empfohlen:** Manuell in AWS checken

```
AWS Lambda Console:
https://eu-north-1.console.aws.amazon.com/lambda/home?region=eu-north-1#/functions
→ Sollte LEER sein (keine ecokart-Functions)

DynamoDB Console:
https://eu-north-1.console.aws.amazon.com/dynamodbv2/home?region=eu-north-1#tables
→ Sollte LEER sein (keine ecokart-Tables)

Amplify Console:
https://eu-north-1.console.aws.amazon.com/amplify/home?region=eu-north-1
→ Sollte LEER sein (keine Apps)
```

**Falls noch Ressourcen da sind:**
- Warte 2-3 Minuten (AWS braucht Zeit!)
- Reload die Seite
- Immer noch da? → Emergency Lambda Cleanup Workflow nutzen

---

## ⏰ Typische Session-Zeiten

### Kurze Session (1-2 Stunden)
```
00:00 - Start: Deploy (~10 Min)
00:10 - Entwickeln (1-1.5h)
01:40 - Code committen & pushen (5 Min)
01:45 - Destroy (~7 Min)
01:52 - Fertig!
```

**Kosten:** ~0,50 EUR (2 Stunden Runtime)

---

### Normale Session (3-4 Stunden)
```
00:00 - Start: Deploy (~10 Min)
00:10 - Entwickeln (3-3.5h)
03:40 - Code committen & pushen (5 Min)
03:45 - Destroy (~7 Min)
03:52 - Fertig!
```

**Kosten:** ~1,00 EUR (4 Stunden Runtime)

---

### Lange Session (6+ Stunden)
```
00:00 - Start: Deploy (~10 Min)
00:10 - Entwickeln (6h)
06:10 - Code committen & pushen (5 Min)
06:15 - Destroy (~7 Min)
06:22 - Fertig!
```

**Kosten:** ~1,50 EUR (6 Stunden Runtime)

---

## 💰 Budget-Übersicht

### Monatliches Budget: 15 USD (~14 EUR)

**Bei regelmäßigen Sessions:**

| Sessions/Woche | Std/Session | Kosten/Monat | Budget OK? |
|----------------|-------------|--------------|------------|
| 2-3 | 2h | ~4-6 EUR | ✅ Ja (40%) |
| 3-4 | 3h | ~8-10 EUR | ✅ Ja (70%) |
| 5+ | 3h | ~12-15 EUR | ⚠️ Knapp (100%) |
| Täglich | 4h+ | ~20+ EUR | ❌ Zu viel! |

**Fix-Kosten (immer da):**
- AWS Account: 0 EUR (Free Tier)
- GitHub Actions: 0 EUR (Public Repo)
- Domain/SSL: 0 EUR (Amplify inkl.)

**Variable Kosten (nur während Sessions):**
- Lambda Executions
- DynamoDB Read/Writes
- API Gateway Requests
- Amplify Hosting
- **~0,25-0,30 EUR pro Stunde**

---

## 🚨 Notfall-Szenarien

### Szenario 1: "Vergessen zu destroyen über Nacht!"

**Situation:** Du hast vergessen zu destroyen, Infrastruktur läuft seit 12 Stunden!

**Kosten:** ~3-4 EUR (statt 0,50 EUR)

**Lösung:**
1. **SOFORT** Destroy Workflow starten
2. AWS Console checken: Alles weg?
3. Lesson learned: Alarm setzen vor Session-Ende!

**Tipp:** GitHub Actions Notification aktivieren → Email wenn Workflow läuft

---

### Szenario 2: "Budget-Warnung von AWS!"

**Situation:** AWS sendet Email "80% of budget used"

**Lösung:**
1. **Check:** Was läuft gerade?
   ```bash
   # Amplify Apps
   aws amplify list-apps --region eu-north-1

   # Lambda Functions
   aws lambda list-functions --region eu-north-1

   # DynamoDB Tables
   aws dynamodb list-tables --region eu-north-1
   ```

2. **Emergency Cleanup:**
   - Destroy Workflow SOFORT laufen lassen
   - Falls Workflow failet: Manuell in AWS Console löschen

3. **Pause einlegen:**
   - Nächste Session erst in 1-2 Wochen
   - Budget regeneriert sich monatlich

---

### Szenario 3: "Deploy schlägt fehl, Resources bleiben hängen"

**Situation:** Deployment failed, aber manche Resources wurden schon erstellt

**Kosten:** Laufen weiter und kosten Geld!

**Lösung:**
1. **Destroy Workflow** laufen lassen (löscht alles)
2. **Warten** 5 Minuten
3. **AWS Console checken** ob wirklich alles weg ist
4. **Falls nicht:** Emergency Lambda Cleanup Workflow

---

## ✅ Best Practices

### 1. Immer am Session-Ende destroyen

```
✅ Entwickeln fertig → Sofort Destroy starten
❌ "Mach ich später" → Vergessen → Geld weg!
```

**Trick:** Alarm auf Handy stellen "In 2 Stunden: Destroy!"

---

### 2. Code regelmäßig committen & pushen

```
✅ Alle 30-60 Min committen
✅ Vor Destroy IMMER pushen
❌ Ganzen Tag lokal arbeiten → Verlust bei PC-Crash!
```

**Trick:** GitHub ist dein Backup!

---

### 3. Session Notes schreiben

```
✅ Kurze Notizen am Ende jeder Session
✅ "Was gemacht" + "Was als nächstes"
❌ Keine Notizen → Nächste Session: "Was wollte ich nochmal?"
```

**Trick:** docs/SESSION_NOTES.txt fortlaufend führen

---

### 4. Nicht parallel mehrere Environments laufen lassen

```
✅ Nur develop während Development
❌ develop + staging + prod gleichzeitig → 3x Kosten!
```

**Ausnahme:** Production läuft separat (aber nicht in Sandbox-Account!)

---

### 5. Große Features in kleine Schritte teilen

```
✅ Inventory Management:
   - Tag 1: Stock-Feld hinzufügen
   - Tag 2: Frontend Stock-Anzeige
   - Tag 3: Cart Reserve-Logik

❌ Komplettes Feature an einem Tag → 8h Session → zu teuer!
```

---

## 📊 Cost Monitoring

### AWS Cost Explorer nutzen

```
https://console.aws.amazon.com/cost-management/home
```

**Check wöchentlich:**
1. **Daily Costs** anschauen
2. **Service-Breakdown:** Was kostet am meisten?
3. **Trends:** Steigen Kosten?

**Alert setzen:**
- Bei 10 EUR → Warning Email
- Bei 12 EUR → Critical Email

---

### Typische Kosten-Verteilung

```
Development Environment (pro Stunde):

Lambda: ~0,05 EUR (20%)
DynamoDB: ~0,08 EUR (32%)
API Gateway: ~0,03 EUR (12%)
Amplify: ~0,09 EUR (36%)
---------------------------------
Total: ~0,25 EUR/Stunde
```

---

## 🎯 Checkliste: Session-Ende

Bevor du Laptop zuklappst:

- [ ] Code committed & gepusht?
- [ ] Session Notes geschrieben?
- [ ] Destroy Workflow gestartet?
- [ ] Destroy fertig & grün?
- [ ] (Optional) AWS Console gecheckt?

**Wenn alle 5 Haken:** ✅ Du bist safe! Bis zur nächsten Session!

---

## 📚 Weiterführende Links

- **Multi-Environment Guide:** [docs/MULTI_ENVIRONMENT_SETUP.md](MULTI_ENVIRONMENT_SETUP.md)
- **Lessons Learned:** [docs/LESSONS_LEARNED.md](LESSONS_LEARNED.md)
- **GitHub Actions Success:** [docs/GITHUB_ACTIONS_SUCCESS.md](GITHUB_ACTIONS_SUCCESS.md)
- **Roadmap:** [docs/ROADMAP_PLANNING.md](ROADMAP_PLANNING.md)

---

**Erstellt:** 19. November 2025
**Für:** Andy's Budget-optimiertes Development
**Ziel:** Professionell entwickeln trotz 15$/Monat Budget! 💪

---

**Remember:** Destroy am Session-Ende ist NICHT optional - es ist PFLICHT! 🗑️💰

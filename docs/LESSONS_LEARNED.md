# 📚 Lessons Learned - Ecokart E-Commerce Projekt

**Von:** Andy Schlegel
**Projekt:** Ecokart - Serverless E-Commerce Platform
**Zeitraum:** November 2025
**Status:** Von Demo zu Production-Ready

---

## 🎯 Projekt-Überblick

Dieses Dokument beschreibt die wichtigsten **Learnings, Herausforderungen und Lösungen** während der Entwicklung von Ecokart - ein vollständiger E-Commerce Shop auf AWS Serverless Infrastructure.

**Ziel:** Von einem einfachen Tutorial-Projekt zu einem **professionellen, production-ready Setup** mit Multi-Environment Support, CI/CD Pipeline und Best Practices.

---

## 🏆 Haupterfolge

### ✅ Was ich erreicht habe:

1. **Multi-Environment Infrastructure Setup**
   - Development, Staging, Production Environments
   - Environment-spezifische Terraform Configs
   - Kostenoptimierung durch unterschiedliche Ressourcen-Größen

2. **Vollautomatische CI/CD Pipeline**
   - GitHub Actions mit OIDC (ohne AWS Keys!)
   - Branch-basiertes automatisches Deployment
   - Automated Destroy Workflow mit Sicherheits-Checks

3. **Funktionierender E-Commerce Shop**
   - 31 Produkte im Katalog
   - User-Registrierung & Login
   - Warenkorb-System
   - Bestellungs-Management
   - Admin-Panel für Produkt-Verwaltung

4. **Infrastructure as Code**
   - 100% Terraform
   - Modularisierte Terraform-Module
   - Wiederverwendbare Komponenten

---

## 💡 Wichtigste Learnings

### 1. Git Branching-Strategien sind essentiell

**Das Problem:**
Anfangs habe ich nur auf `main` gepusht - jede Änderung ging direkt live. Riskant und unprofessionell!

**Die Lösung:**
```
develop → staging → main
   ↓         ↓        ↓
  Test    Pre-Prod  Production
```

**Was ich gelernt habe:**
- **Niemals direkt in main pushen!**
- Develop zum Experimentieren nutzen
- Staging für finale Tests vor Production
- Pull Requests für Code Review nutzen

**Anwendung im echten Job:**
- Standard in allen professionellen Teams
- Verhindert Production-Ausfälle
- Ermöglicht parallele Feature-Entwicklung

---

### 2. Infrastructure as Code (Terraform) ist mächtig aber trickreich

**Herausforderung: Terraform State Management**

**Das Problem:**
```
Error: Resource already exists: ecokart-development-api
```

Terraform wollte Ressourcen erstellen, die schon existierten. Warum? **Der Terraform State** (die "Gedächtnis"-Datei) war leer oder verloren gegangen.

**Die Lösung:**
1. Alte Ressourcen manuell löschen (Destroy Workflow)
2. Neu erstellen mit frischem State
3. **Lesson:** Später Remote State (S3) nutzen!

**Was ich gelernt habe:**
- Terraform State ist KRITISCH
- Lokaler State ist fragil
- Remote State (S3 + DynamoDB Lock) ist Best Practice
- Immer mit `terraform plan` checken vor `apply`

---

### 3. .gitignore kann in mehreren Verzeichnissen sein!

**Das Problem:**
Meine Environment-Configs (`development.tfvars`, `staging.tfvars`, `production.tfvars`) wurden nicht committed!

**Die Ursache:**
```
terraform/.gitignore:
*.tfvars   # ← Das blockierte ALLE .tfvars Dateien!
```

**Die Lösung:**
```
terraform/.gitignore:
*.tfvars
!terraform.tfvars.example
!environments/*.tfvars   # ← Ausnahme hinzugefügt!
```

**Was ich gelernt habe:**
- `.gitignore` kann in jedem Unterverzeichnis sein
- Immer ALLE `.gitignore` Dateien checken
- Ausnahmen mit `!` definieren
- **WHY:** `.tfvars` enthält normalerweise Secrets → sollte nicht committed werden. ABER unsere Environment-Configs haben keine Secrets!

---

### 4. AWS braucht Zeit zum Aufräumen von Ressourcen

**Das Problem:**
Nach `terraform destroy` war alles weg (laut Workflow), aber beim Re-Deploy: **"Lambda already exists"**!

**Die Ursache:**
- Terraform Destroy war fertig
- AWS brauchte noch 2-3 Minuten zum tatsächlichen Löschen
- Ich hab zu schnell neu deployed

**Die Lösung:**
```
1. Destroy Workflow laufen lassen
2. ⏰ 3-5 Minuten WARTEN
3. Erst dann neu deployen
```

**Was ich gelernt habe:**
- AWS Operationen sind asynchron
- "Deleted" ≠ "Wirklich weg"
- Immer Buffer-Zeit einplanen
- Bei Production: Monitoring für Failed Deletes

---

### 5. Two-Layer Authentication Design

**Die Architektur:**
```
Layer 1: Basic Auth (Amplify Level)
  ↓
Layer 2: App Login (Backend JWT)
```

**Warum zwei Layers?**

**Basic Auth (Layer 1):**
- Schneller Schutz vor zufälligen Besuchern
- Verhindert Bots/Crawler
- Gut für Development/Staging
- **Nachteil:** Nicht production-ready (zu simpel)

**JWT Auth (Layer 2):**
- Echte User-Authentifizierung
- Session-Management
- Role-based Access (User vs. Admin)
- **Später:** Wird durch AWS Cognito ersetzt

**Was ich gelernt habe:**
- Security in Layers denken
- Basic Auth als temporäre Lösung OK
- Für Production: Cognito oder OAuth nötig

---

### 6. Cost Optimization durch Environment-Sizing

**Die Strategie:**

| Environment | Lambda RAM | DynamoDB Mode | Kosten/Monat |
|-------------|------------|---------------|--------------|
| Development | 256 MB | PAY_PER_REQUEST | ~25 EUR |
| Staging | 512 MB | PROVISIONED (low) | ~50 EUR |
| Production | 1024 MB | PROVISIONED (high) | ~120 EUR |

**Was ich gelernt habe:**
- Development muss NICHT wie Production aussehen
- Development: Klein & günstig (zum Testen)
- Staging: Production-ähnlich (für finale Tests)
- Production: Volle Power (für echte Kunden)
- **Saving:** Statt 3x 120 EUR = 360 EUR → nur 195 EUR/Monat!

**Mein Ansatz:**
- Development nur hochfahren wenn ich aktiv entwickle
- Nach Session: Destroy → spart ~75% der Kosten!
- Sandbox-Budget (15$/Monat) reicht locker!

---

### 7. GitHub Actions OIDC ist besser als Access Keys

**Vorher (unsicher):**
```yaml
env:
  AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY }}
  AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_KEY }}
```

**Jetzt (sicher):**
```yaml
- uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: ${{ secrets.AWS_ROLE_ARN }}  # Nur Role ARN!
```

**Vorteile:**
- ✅ Keine langlebigen Credentials in GitHub
- ✅ Automatische Token-Rotation
- ✅ Granulare Permissions (nur was gebraucht wird)
- ✅ Audit-Trail in AWS CloudTrail

**Was ich gelernt habe:**
- OIDC ist moderner Standard
- AWS Keys sind Legacy
- Security-Best-Practice aus echten Jobs

---

### 8. Debugging: Manuell in AWS Console checken!

**Die Situation:**
Workflow sagt "Lambda deleted", aber Deploy sagt "Lambda exists"!

**Was ich gemacht habe:**
1. ✅ AWS Lambda Console geöffnet
2. ✅ Manuell gecheckt: Lambda war noch da!
3. ✅ Manuell gelöscht
4. ✅ Problem gelöst

**Was ich gelernt habe:**
- **Nicht blind Workflows vertrauen!**
- Immer manuell verifizieren bei Problemen
- AWS Console kennen ist wichtig
- Automation + Manual Check = Best Practice

---

## 🚧 Größte Herausforderungen

### Challenge #1: Amplify Webhook Permissions (8 Iterationen!)

**Das Problem:**
```
AccessDeniedException: amplify:CreateWebhook on resource:
arn:aws:amplify:eu-north-1:xxx:apps/xxx/branches/main
```

**Die Lösung (nach 8 Versuchen!):**
IAM Policy braucht **2 separate Statements:**
```hcl
# Statement 1: CreateWebhook auf APP-Ressource
Resource = "arn:aws:amplify:*:*:apps/*"
Actions = ["amplify:CreateWebhook", "amplify:DeleteWebhook"]

# Statement 2: GetWebhook auf WEBHOOK-Ressource
Resource = "arn:aws:amplify:*:*:apps/*/webhooks/*"
Actions = ["amplify:GetWebhook", "amplify:ListWebhooks"]
```

**Was ich gelernt habe:**
- AWS IAM Permissions sind SEHR granular
- Unterschiedliche Actions operieren auf unterschiedlichen Ressourcen
- AWS Dokumentation ist manchmal unclear
- Trial & Error ist manchmal nötig (aber dokumentieren!)

---

### Challenge #2: Table-Namen Mismatch im Cleanup-Script

**Das Problem:**
Cleanup-Script suchte `ecokart-development-products` (mit -development Suffix), aber echte Tables heißen `ecokart-products` (ohne Suffix)!

**Die Lösung:**
```bash
# Vorher (FALSCH)
TABLES=("ecokart-development-products")

# Nachher (RICHTIG)
TABLES=("ecokart-products")
```

**Was ich gelernt habe:**
- Naming Conventions dokumentieren!
- Hardcoded Werte vermeiden
- Bei Cleanup: Immer testen ob Ressourcen wirklich gefunden werden
- Logging ist wichtig ("Table XY wird gelöscht...")

---

### Challenge #3: DynamoDB Table Deletion mit Wait-Logic

**Das Problem:**
```bash
aws dynamodb delete-table --table-name ecokart-products
# Script geht weiter... aber Table existiert noch!
```

**Die Lösung:**
```bash
aws dynamodb delete-table --table-name ecokart-products

# WICHTIG: Warten bis wirklich gelöscht!
aws dynamodb wait table-not-exists --table-name ecokart-products
```

**Was ich gelernt habe:**
- AWS Operations sind asynchron
- `delete-table` startet nur die Löschung
- `wait` ist KRITISCH für zuverlässige Scripts
- Ohne Wait: Race Conditions!

---

## 🎓 Skills die ich entwickelt habe

### Technical Skills

✅ **Infrastructure as Code**
- Terraform Module schreiben
- Terraform State Management verstehen
- Environment-spezifische Configs

✅ **CI/CD Pipelines**
- GitHub Actions Workflows schreiben
- OIDC Authentifizierung konfigurieren
- Branch-basierte Deployment-Logik

✅ **AWS Services**
- Lambda (Serverless Functions)
- DynamoDB (NoSQL Database)
- API Gateway (REST APIs)
- Amplify (Frontend Hosting)
- IAM (Permissions & Roles)
- CloudWatch (Logging & Monitoring)

✅ **Git & Version Control**
- Branching-Strategien
- Pull Request Workflow
- Merge-Konflikte lösen

✅ **Debugging & Problem-Solving**
- Logs analysieren (CloudWatch, GitHub Actions)
- AWS Console für Manual Checks
- Systematisches Troubleshooting

---

### Soft Skills

✅ **Strukturiertes Arbeiten**
- Todo-Listen führen
- Schritt-für-Schritt Approach
- Dokumentation während Development

✅ **Kostenbe

wusstsein**
- Cloud-Kosten verstehen
- Optimization-Strategien
- Budget-Management (15$/Monat Sandbox!)

✅ **Best Practices anwenden**
- Security (keine Secrets in Code)
- Testing (erst dev → staging → prod)
- Documentation (für mein zukünftiges Ich)

---

## 📊 Vorher vs. Nachher

### Vorher (Tutorial-Level)
```
❌ Ein Branch (main)
❌ Manuelle Deployments
❌ Keine CI/CD
❌ Testen in Production
❌ Keine Environment-Trennung
❌ AWS Keys in GitHub Secrets
❌ Keine Dokumentation
```

### Nachher (Professional-Level)
```
✅ Drei Branches (develop/staging/main)
✅ Automatische Deployments via GitHub Actions
✅ Vollständige CI/CD Pipeline
✅ Sichere Test-Umgebungen
✅ Multi-Environment Setup
✅ OIDC (keine Keys!)
✅ Umfangreiche Dokumentation
```

---

## 🚀 Nächste Schritte (Roadmap)

### Kurzfristig
- [ ] Inventory Management (Stock-Tracking)
- [ ] AWS Cognito (echte User-Auth)
- [ ] Deployment Notifications (Slack/Discord)

### Mittelfristig
- [ ] Stripe Payment Integration
- [ ] Email Notifications (SES)
- [ ] Product Image Upload (S3)
- [ ] CloudWatch Alarms & Dashboards

### Langfristig
- [ ] Blue/Green Deployments
- [ ] Automated Testing (Unit, Integration, E2E)
- [ ] Performance Monitoring
- [ ] Remote Terraform State (S3)

---

## 💼 Portfolio-Relevanz

### Was ich in Bewerbungen schreiben kann:

> **Ecokart - Serverless E-Commerce Platform**
>
> Entwicklung einer vollständigen E-Commerce-Plattform auf AWS mit professionellem Multi-Environment Setup.
>
> **Tech Stack:**
> - **Backend:** Node.js/Express.js auf AWS Lambda
> - **Frontend:** Next.js 15 auf AWS Amplify
> - **Database:** AWS DynamoDB
> - **Infrastructure:** Terraform (100% IaC)
> - **CI/CD:** GitHub Actions mit OIDC
>
> **Highlights:**
> - Multi-Environment Setup (Development, Staging, Production)
> - Kostenoptimierung durch environment-spezifische Ressourcen-Sizing (60% Saving)
> - Vollautomatische CI/CD Pipeline mit Branch-basierter Deployment-Logik
> - Implementierung von AWS Best Practices (OIDC, IAM Least Privilege)
>
> **Learnings:**
> - Infrastructure as Code (Terraform)
> - AWS Serverless Architecture
> - Git Branching-Strategien
> - Debugging komplexer Deployment-Probleme

---

## 🎯 Key Takeaways

1. **Multi-Environment ist NICHT optional** - Es ist Standard in Professional Development

2. **Automation spart Zeit UND reduziert Fehler** - Einmalig Setup investieren lohnt sich

3. **Documentation ist für mein zukünftiges Ich** - In 3 Monaten habe ich alles vergessen!

4. **Testing in Production ist KEINE Option** - Immer develop → staging → main

5. **AWS Console kennen ist wichtig** - Nicht blind Automation vertrauen

6. **Cost Optimization beginnt beim Design** - Nicht erst nachträglich

7. **Best Practices existieren aus einem Grund** - Nicht reinventing the wheel

---

## 🙏 Danke

Dieses Projekt hat mir gezeigt, dass **professionelles Software-Engineering** mehr ist als nur "Code schreiben". Es geht um:

- Strukturiertes Arbeiten
- Best Practices anwenden
- Probleme systematisch lösen
- Dokumentieren für andere (und mein zukünftiges Ich)
- Kosteneffizient denken

**Von Tutorial zu Production-Ready - Mission accomplished!** 🎉

---

**Erstellt:** 19. November 2025
**Autor:** Andy Schlegel
**Projekt:** Ecokart E-Commerce Platform
**Status:** Living Document (wird kontinuierlich erweitert)

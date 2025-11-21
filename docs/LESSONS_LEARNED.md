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

✅ **Kostenbewusstsein**
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

## 🆕 Recent Learnings (November 2025)

### 9. Migration Scripts müssen synchron sein

**Herausforderung: Stock-Felder fehlten in DynamoDB**

**Das Problem:**
Nach Implementierung des Inventory Management Systems im Frontend funktionierte nichts - Stock-Felder waren in DynamoDB leer!

**Die Ursache:**
```
Es gibt 2 Migration Scripts:
1. migrate-to-dynamodb.js (original)
2. migrate-to-dynamodb-single.js (für CI/CD)

Stock/Reserved Felder waren nur in Script #1 → CI/CD nutzt Script #2!
```

**Die Lösung:**
```javascript
// BEIDE Scripts müssen identisch sein!
// migrate-to-dynamodb-single.js
Item: {
  id: product.id,
  name: product.name,
  price: product.price,
  stock: product.stock || 0,      // ← NEU
  reserved: product.reserved || 0, // ← NEU
  // ...
}
```

**Was ich gelernt habe:**
- Bei Duplicate Scripts: IMMER beide updaten
- Scripts die von CI/CD genutzt werden extra markieren
- Re-Seed Workflow spart Zeit vs. Destroy/Deploy
- Dokumentieren welches Script wofür verwendet wird

---

### 10. Data vs. Code Mismatches sind schwer zu finden

**Das Problem:**
- ✅ Frontend-Code hatte Stock-UI
- ✅ Backend-Code hatte Stock-Logic
- ❌ DynamoDB-Daten hatten KEINE Stock-Felder

**Die Symptome:**
- Keine offensichtlichen Errors
- UI zeigte "undefined" oder "0"
- Backend-Logs zeigten keine Fehler
- Schwer zu debuggen!

**Was ich gelernt habe:**
- Schema-Änderungen brauchen 3 Updates:
  1. **Code** (Frontend + Backend)
  2. **Database Schema** (Terraform/Models)
  3. **Data Migration** (Seed Scripts!)
- Bei Schema-Änderungen IMMER re-seed testen
- Database-First oder Code-First Approach konsequent durchziehen

---

### 11. URL Construction ist wichtiger als gedacht

**Das Problem:**
```
Backend URL: https://api.example.com/Prod/
API Call: /api/products
Result: /Prod//api/products  ← Doppelter Slash!
```

**Die Lösung:**
```typescript
const apiUrl = BASE_URL.endsWith('/')
  ? BASE_URL.slice(0, -1)
  : BASE_URL;
const fullUrl = `${apiUrl}/api/products`;
```

**Was ich gelernt habe:**
- Trailing Slashes IMMER normalisieren
- URL-Construction als eigene Util-Function
- Debug-Logging für API-Calls hilft enorm
- Testen mit/ohne Trailing Slash

---

### 12. AWS Config ist ein Cost-Trap

**Herausforderung: Unerwartete AWS-Kosten**

**Das Problem:**
AWS Kosten: $17.08/Monat statt erwartet <$10/Monat
```
AWS Config:  $5.87 (34%)
VPC:         $2.98 (17%)
RDS:         $2.34 (14%) ← Sollte nicht existieren!
ECS:         $1.39 (8%)  ← Sollte nicht existieren!
```

**Die Ursache:**
- **AWS Config** tracked jede Ressourcen-Änderung
- Destroy/Rebuild Cycles → Hunderte von Config Changes
- **RDS + ECS:** Orphaned Resources von früherem Setup
- **VPC:** NAT Gateway von nicht gelöschter Infrastruktur

**Die Lösung:**
```bash
# 1. AWS Config deaktivieren (für Development)
aws configservice stop-configuration-recorder

# 2. Orphaned Resources finden
aws rds describe-db-instances
aws ecs list-clusters

# 3. Manuell löschen
aws rds delete-db-instance --db-instance-identifier xxx
aws ecs delete-cluster --cluster xxx

# 4. NAT Gateways checken (teuer!)
aws ec2 describe-nat-gateways
```

**Was ich gelernt habe:**
- **AWS Config ist teuer** bei Destroy/Rebuild Workflows
- Für Development: Disable Config → spart ~$6/Monat
- Für Production: Config ist sinnvoll (Compliance/Audit)
- **Terraform Destroy ≠ Alles gelöscht**
  - Immer manuell AWS Console checken
  - Orphaned Resources können teuer sein
- NAT Gateways kosten $32/Monat → nur wenn wirklich nötig!

**Cost Optimization:**
```
Vorher: $17.08/Monat
Nachher (erwartet): $5-6/Monat (65% Reduction!)
```

---

### 13. Lambda Cleanup braucht besseres Error Handling

**Das Problem:**
Trotz Auto-Cleanup Step in `.github/workflows/destroy.yml` musste Lambda mehrfach manuell gelöscht werden.

**Die Ursache:**
- CloudWatch Log Groups blockieren Lambda Deletion
- Lambda kann gelöscht werden, aber CloudWatch bleibt
- Beim Re-Deploy: "Lambda already exists" Error

**Die Lösung (teilweise):**
```yaml
# .github/workflows/destroy.yml
- name: 🧹 Cleanup Lambda Function
  run: |
    aws lambda delete-function --function-name "$LAMBDA_NAME" || true
    aws logs delete-log-group --log-group-name "/aws/lambda/$LAMBDA_NAME" || true
```

**Was ich gelernt habe:**
- AWS Resource Dependencies sind komplex
- Reihenfolge beim Löschen ist wichtig
- `|| true` für fehlertolerante Scripts
- Manueller Workflow als Backup ist gut
- **TODO:** Weitere Verbesserung nötig

---

### 14. AWS Parameter Store Tokens werden bei Budget-Cleanup gelöscht

**Herausforderung: Tägliche Token-Wiederherstellung nötig**

**Das Problem:**
- AWS Sandbox-Account hat Budget-Limit
- Über Nacht werden ALLE Ressourcen gelöscht (Cost-Protection)
- **ABER:** Auch AWS Systems Manager Parameter Store wird geleert!
- GitHub Token (`/ecokart/github-token`) ist weg
- Deploy Workflow schlägt fehl: "Parameter /ecokart/github-token not found"

**Die Symptome:**
```bash
# GitHub Actions Deploy Workflow
Error: Parameter /ecokart/github-token not found
```

**Die Lösung (täglich nötig bis Monatsende):**
```bash
# Token manuell wieder einfügen
aws ssm put-parameter \
  --name "/ecokart/github-token" \
  --value "ghp_DEIN_TOKEN_HIER" \
  --type "SecureString" \
  --overwrite \
  --region eu-north-1
```

**Was ich gelernt habe:**
- **Budget-Cleanup ist aggressiv** - löscht mehr als erwartet
- Parameter Store ist NICHT immun gegen Cleanup
- Secrets müssen täglich wiederhergestellt werden
- **Workaround für Sandbox-Accounts:**
  - Token lokal in `.env` backup halten
  - Jeden Morgen vor Deploy: Parameter Store Check
  - Script für schnelle Token-Wiederherstellung
- **Production-Lösung:**
  - AWS Account ohne Budget-Limits verwenden
  - ODER: Secrets in GitHub Secrets statt Parameter Store

**Script für schnelle Wiederherstellung:**
```bash
#!/bin/bash
# restore-github-token.sh

TOKEN="ghp_YOUR_TOKEN_HERE"  # Aus .env oder 1Password

echo "🔑 Restoring GitHub Token to Parameter Store..."

aws ssm put-parameter \
  --name "/ecokart/github-token" \
  --value "$TOKEN" \
  --type "SecureString" \
  --overwrite \
  --region eu-north-1

echo "✅ Token restored!"
echo "ℹ️  Verify with: aws ssm get-parameter --name /ecokart/github-token --with-decryption"
```

**Best Practice für Production:**
- GitHub Secrets für CI/CD Tokens verwenden (nicht Parameter Store)
- Parameter Store nur für Application Runtime Secrets
- Backup-Strategie für kritische Secrets

**Zeitaufwand:**
- Manuell: ~2 Minuten pro Tag
- Mit Script: ~30 Sekunden pro Tag
- **Bis Monatsende:** Täglich nötig

---

## 🚀 Roadmap

Für aktuelle Tasks und Roadmap siehe: **[docs/ACTION_PLAN.md](ACTION_PLAN.md)**

Die ACTION_PLAN.md ist das Living Document für:
- Current Sprint (was läuft gerade)
- Next Up (was kommt als nächstes)
- Known Issues (aktuelle Blocker)
- Metrics (Project Health)

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

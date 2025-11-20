# Presentation Guide - Ecokart Live Demo

**Für Vortrag/Training: Serverless E-Commerce auf AWS**

**Gesamtdauer:** 20-25 Minuten

---

## Vorbereitung (VOR dem Vortrag)

### 1. Technische Vorbereitung (10 Minuten vor Beginn)

```bash
# 1. Repository Status prüfen
git status  # Sollte clean sein

# 2. AWS Credentials prüfen
aws sts get-caller-identity

# 3. GitHub Token prüfen
aws ssm get-parameter --name "/ecokart/development/github-token" --region eu-north-1

# 4. Von sauberem Zustand starten
./deploy.sh destroy
```

### 2. Browser Tabs vorbereiten

Öffne folgende Tabs:
1. GitHub Repository: `https://github.com/AndySchlegel/Ecokart-Webshop`
2. AWS Console - Amplify: `https://eu-north-1.console.aws.amazon.com/amplify/`
3. AWS Console - Lambda: `https://eu-north-1.console.aws.amazon.com/lambda/`
4. AWS Console - DynamoDB: `https://eu-north-1.console.aws.amazon.com/dynamodb/`
5. Code Editor (VS Code) mit Projekt geöffnet

### 3. Terminal vorbereiten

Zwei Terminal-Fenster:
- **Terminal 1:** Für Deployment (`./deploy.sh`)
- **Terminal 2:** Für Code-Anzeige und Erklärungen

---

## Teil 1: Einführung (3 Minuten)

### Folie: Projekt-Übersicht

**Sprechpunkte:**

"Heute zeige ich euch Ecokart - eine vollständig serverlose E-Commerce-Plattform auf AWS."

**Architektur zeigen:**
```
Amplify Frontend → API Gateway → Lambda → DynamoDB
```

**Vorteile hervorheben:**
- ✅ **Serverless:** Keine Server-Verwaltung
- ✅ **Skalierbar:** Automatisch (von 0 bis Millionen Requests)
- ✅ **Kosteneffizient:** Pay per Request
- ✅ **Infrastructure as Code:** Komplette Automation mit Terraform

**Technologie-Stack:**
- Frontend: Next.js 15 (React)
- Backend: Express.js auf Lambda
- Datenbank: DynamoDB
- Deployment: Terraform

---

## Teil 2: Repository-Struktur (2 Minuten)

### Terminal 1: Struktur zeigen

```bash
# Repository-Struktur anzeigen
tree -L 2 -I 'node_modules|.next|dist'
```

**Sprechpunkte:**

"Die Repository-Struktur ist als **Monorepo** aufgebaut:"

```
├── frontend/              # Customer Shop (Next.js 15)
├── admin-frontend/        # Admin Panel (Next.js 15)
├── backend/               # Express.js Backend (Lambda)
├── terraform/             # Infrastructure as Code
│   ├── main.tf           # Root Module
│   └── modules/          # Wiederverwendbare Module
│       ├── dynamodb/     # DynamoDB Tabellen
│       ├── lambda/       # Lambda + API Gateway
│       ├── amplify/      # Amplify Hosting
│       └── seed/         # Database Seeding
└── deploy.sh             # ONE-CLICK Deployment
```

**Highlight:**

"Besonders wichtig: Alles ist **modular** aufgebaut. Jede AWS-Komponente ist ein eigenes Terraform-Modul. Das macht es wiederverwendbar und testbar."

---

## Teil 3: Code-Highlights (7 Minuten)

### 3.1 Lambda Handler (1 Minute)

**VS Code öffnen:** `backend/src/lambda.ts`

```typescript
import serverless from 'serverless-http';
import app from './index';

export const handler = serverless(app);
```

**Sprechpunkte:**

"Der Lambda Handler ist extrem einfach. Mit `serverless-http` konvertieren wir eine normale Express.js App in eine Lambda Function. Das bedeutet: **Wir schreiben Standard-Express-Code, kein Lambda-spezifischer Code!**"

---

### 3.2 Express.js Backend (1 Minute)

**VS Code öffnen:** `backend/src/index.ts` (Zeilen 1-30)

```typescript
import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRouter);
app.use('/products', productsRouter);
app.use('/cart', cartRouter);
app.use('/orders', ordersRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});
```

**Sprechpunkte:**

"Das ist eine **ganz normale Express.js App**. Sie funktioniert lokal UND auf Lambda. Keine Magie, kein Vendor Lock-in!"

---

### 3.3 Terraform Lambda Module (2 Minuten)

**VS Code öffnen:** `terraform/modules/lambda/main.tf` (Zeilen 12-43)

```hcl
# TypeScript Build
resource "null_resource" "build_lambda" {
  triggers = {
    source_hash = sha256(join("", [
      for f in fileset(var.source_path, "src/**/*.ts") :
        filesha256("${var.source_path}/${f}")
    ]))
  }

  provisioner "local-exec" {
    command     = "npm ci && npm run build"
    working_dir = var.source_path
  }
}

# ZIP Package erstellen
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/builds/${var.function_name}.zip"
  source_dir  = var.source_path

  excludes = ["src", "*.md", "scripts"]
  depends_on = [null_resource.build_lambda]
}
```

**Sprechpunkte:**

"Terraform baut automatisch unser Lambda Package:

1. **Trigger:** Re-build nur bei Code-Änderungen (SHA256 Hash)
2. **Build:** TypeScript wird zu JavaScript kompiliert
3. **Package:** ZIP-Datei mit nur Production-Code
4. **Deploy:** Zu AWS Lambda hochgeladen

**Das passiert AUTOMATISCH bei jedem Terraform Apply!**"

---

### 3.4 Database Seeding (1 Minute)

**VS Code öffnen:** `terraform/modules/seed/main.tf` (Zeilen 49-65)

```hcl
provisioner "local-exec" {
  command = <<EOF
    npm ci
    npm run dynamodb:migrate:single -- --region ${var.aws_region}
    node scripts/create-test-user.js
    node scripts/create-admin-user.js
  EOF
}
```

**Sprechpunkte:**

"Nach jedem Deployment wird die Datenbank **automatisch befüllt**:

- ✅ 31 Produkte aus JSON importiert
- ✅ Test-User: `demo@ecokart.com`
- ✅ Admin-User: `admin@ecokart.com`

**Das heißt: Deploy fertig → Shop sofort nutzbar!**"

---

### 3.5 API Gateway Proxy Integration (1 Minute)

**VS Code öffnen:** `terraform/modules/lambda/main.tf` (Zeilen 129-151)

```hcl
resource "aws_api_gateway_resource" "proxy" {
  path_part = "{proxy+}"
}

resource "aws_api_gateway_method" "proxy_method" {
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "proxy_integration" {
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api.invoke_arn
}
```

**Sprechpunkte:**

"API Gateway nutzt **Proxy Integration**:

- `{proxy+}` leitet ALLE Pfade an Lambda weiter
- `ANY` unterstützt ALLE HTTP-Methoden
- Lambda übernimmt das komplette Request/Response Handling

**Das bedeutet: Express.js Routing funktioniert 1:1!**"

---

### 3.6 ONE-CLICK Deploy Script (1 Minute)

**VS Code öffnen:** `deploy.sh` (Zeilen 72-100)

```bash
# Clean Backend Dependencies (prevent race condition)
rm -rf backend/node_modules

# Deploy
terraform apply -auto-approve
```

**Sprechpunkte:**

"Der Deploy-Prozess wurde auf **EINEN Befehl** reduziert:

```bash
./deploy.sh
```

**Was passiert automatisch:**
1. GitHub Token aus Parameter Store laden
2. Dependencies bereinigen (Race Condition vermeiden!)
3. Terraform deployt komplette Infrastruktur
4. Datenbank wird automatisch befüllt

**Destroy ist genauso einfach:**
```bash
./deploy.sh destroy
```

Perfekt für **Demos, Testing und Cleanup!**"

---

## Teil 4: Live Deployment (10 Minuten)

### Terminal 1: Deployment starten

```bash
# ONE-CLICK Deployment
./deploy.sh
```

**Sprechpunkte (während es läuft):**

"Jetzt deployen wir die komplette Infrastruktur. Das dauert ca. 8-10 Minuten."

**Während Terraform läuft, folgendes erklären:**

---

### Terraform Output beobachten

**Bei "Terraform will perform the following actions":**

"Terraform zeigt uns **exakt** was gemacht wird:

- **16 Ressourcen** werden erstellt
- **0 Änderungen** (Clean Deployment)
- **0 Löschungen**"

---

**Bei "module.ecokart.module.dynamodb":**

"DynamoDB Tabellen werden erstellt:
- `ecokart-products`
- `ecokart-users`
- `ecokart-carts`
- `ecokart-orders`

**Wichtig:** Provisioned Capacity Mode (5 RCU, 5 WCU) - günstig für Demo!"

---

**Bei "module.ecokart.module.lambda.null_resource.build_lambda":**

"Lambda Build läuft:

1. `npm ci` - Dependencies installieren
2. `npm run build` - TypeScript kompilieren
3. ZIP Package erstellen
4. Zu AWS hochladen

**Das ist Infrastructure as Code in Aktion!**"

---

**Bei "module.ecokart.module.database_seeding":**

"Datenbank wird automatisch befüllt:

```
📦 Installing backend dependencies...
📋 Migrating products to DynamoDB...
👤 Creating test user...
👑 Creating admin user...
✅ Database seeding completed!
```

**31 Produkte + 2 User = Shop sofort einsatzbereit!**"

---

**Bei "module.ecokart.module.amplify":**

"Amplify Apps werden erstellt:
- **Customer Frontend** (Next.js SSR)
- **Admin Frontend** (Next.js SSR)

**Platform:** WEB_COMPUTE (unterstützt Server-Side Rendering!)"

---

### Deployment abgeschlossen

**Terminal Output:**

```
Apply complete! Resources: 16 added, 0 changed, 0 destroyed.

Outputs:

amplify_app_url = "https://main.xxx.amplifyapp.com"
admin_amplify_app_url = "https://main.yyy.amplifyapp.com"
api_gateway_url = "https://zzz.execute-api.eu-north-1.amazonaws.com/Prod"
```

**Sprechpunkte:**

"Deployment erfolgreich! Jetzt haben wir:

1. ✅ **Backend API** läuft auf Lambda
2. ✅ **DynamoDB** mit Produkten gefüllt
3. ✅ **Amplify** Apps erstellt
4. ⚠️ **GitHub OAuth** muss noch verbunden werden (manuell, AWS-Limitation)"

---

### GitHub OAuth Reconnect (2 Minuten)

**Terminal 1:**

```bash
./terraform/examples/basic/connect-github.sh
```

**Browser öffnet automatisch AWS Console**

**Sprechpunkte:**

"Ein Schritt ist noch manuell: GitHub OAuth autorisieren.

**Warum manuell?** AWS Platform-Limitation - OAuth kann nicht per API autorisiert werden.

**Wie lange?** 2 Minuten für beide Apps.

**Wie oft?** Nur beim ERSTEN Deployment. Danach läuft Auto-Deploy bei Git Push."

**In AWS Console:**
1. Tab "Hosting environments" öffnen
2. "Reconnect repository" klicken
3. GitHub autorisieren
4. Warten bis Status "✓ Connected"

**Für zweite App wiederholen**

---

## Teil 5: Ergebnis zeigen (3 Minuten)

### 5.1 Customer Frontend

**Browser öffnen:** Amplify Customer URL

**Sprechpunkte:**

"Das ist der **Customer Shop**. Geschützt mit Basic Auth:

- Username: `demo`
- Password: `test1234`

Nach Login:
- E-Mail: `demo@ecokart.com`
- Password: `Demo1234!`"

**Zeigen:**
- Produktliste (31 Produkte)
- Produktdetails
- Warenkorb
- Checkout

---

### 5.2 Admin Frontend

**Browser öffnen:** Amplify Admin URL

**Sprechpunkte:**

"Das **Admin Panel** für Produktverwaltung:

- Basic Auth: `admin` / `admin1234`
- App Login: `admin@ecokart.com` / `ecokart2025`"

**Zeigen:**
- Produktverwaltung
- Bestellübersicht

---

### 5.3 Backend API

**Terminal 2:**

```bash
# Health Check
curl https://xxx.execute-api.eu-north-1.amazonaws.com/Prod/health

# Products Endpoint
curl https://xxx.execute-api.eu-north-1.amazonaws.com/Prod/products
```

**Sprechpunkte:**

"Die **REST API** läuft auf Lambda:

- Health Check: `/health`
- Products: `/products`
- Auth: `/auth/login`
- Cart: `/cart`
- Orders: `/orders`"

---

### 5.4 AWS Console - DynamoDB

**Browser öffnen:** DynamoDB Console

**Sprechpunkte:**

"In DynamoDB sehen wir die **geseedeten Daten**:"

**Tabelle `ecokart-products` öffnen:**
- 31 Items
- Scan durchführen
- Produktdaten zeigen

**Tabelle `ecokart-users` öffnen:**
- 2 Items (demo + admin)
- Passwörter sind bcrypt-gehashed

---

### 5.5 AWS Console - Lambda

**Browser öffnen:** Lambda Console

**Sprechpunkte:**

"Die Lambda Function:

- **Runtime:** Node.js 20.x
- **Memory:** 512 MB
- **Timeout:** 30 Sekunden
- **Handler:** `dist/lambda.handler`"

**Monitoring Tab zeigen:**
- Invocations
- Duration
- Error Rate

---

## Teil 6: Destroy demonstrieren (1 Minute)

**Terminal 1:**

```bash
# Alles löschen
./deploy.sh destroy
```

**Sprechpunkte:**

"Zum Cleanup einfach:

```bash
./deploy.sh destroy
```

**Was passiert:**
- Alle AWS-Ressourcen werden gelöscht
- Repository bleibt unverändert
- Kann jederzeit neu deployed werden

**Perfekt für:**
- Testing-Umgebungen
- Kosten sparen (nur bezahlen wenn deployed)
- Live-Demos (Destroy → Deploy → Destroy)"

---

## Teil 7: Q&A und Zusammenfassung (3 Minuten)

### Zusammenfassung

**Sprechpunkte:**

"Was haben wir gesehen?

1. ✅ **Serverless E-Commerce** auf AWS
2. ✅ **Infrastructure as Code** mit Terraform
3. ✅ **ONE-CLICK Deployment** (`./deploy.sh`)
4. ✅ **Automatisches DB Seeding**
5. ✅ **Destroy & Rebuild** in Minuten

**Vorteile:**
- Keine Server-Verwaltung
- Auto-Scaling (0 bis Millionen)
- Pay per Request
- Komplett automatisiert

**Production-Ready?**
- ⚠️ Basic Auth durch Cognito ersetzen
- ⚠️ Secrets in AWS Secrets Manager
- ⚠️ CloudWatch Alarms hinzufügen
- ⚠️ WAF für API Gateway

**Code verfügbar:**
https://github.com/AndySchlegel/Ecokart-Webshop"

---

## Häufige Fragen (vorbereiten!)

### "Wie viel kostet das?"

"**AWS Free Tier:**
- Lambda: 1 Million Requests/Monat free
- DynamoDB: 25 GB Storage free
- API Gateway: 1 Million Requests/Monat free
- Amplify: Build-Minuten (100 free)

**Demo-Umgebung:** ~5-10€/Monat
**Production (100k Users/Monat):** ~50-100€/Monat"

---

### "Wie performant ist das?"

"**Lambda Cold Start:** 200-500ms
**Lambda Warm:** 10-50ms
**DynamoDB:** < 10ms

**Optimierungen möglich:**
- Provisioned Concurrency (Lambda warm halten)
- DynamoDB DAX (Caching)
- CloudFront (CDN vor Amplify)"

---

### "Was ist mit Security?"

"**Aktuell (Demo):**
- Basic Auth für Amplify
- JWT für API
- Passwords bcrypt-hashed

**Production:**
- AWS Cognito (OAuth, MFA)
- AWS Secrets Manager (für Secrets)
- WAF vor API Gateway
- VPC für Lambda (optional)"

---

### "Kann das auch ohne Terraform?"

"Ja, mit:
- **AWS CDK** (TypeScript-basiert)
- **Serverless Framework**
- **AWS SAM**
- **AWS Console** (manuell, nicht empfohlen!)

**Warum Terraform?**
- Cloud-agnostisch
- Große Community
- State Management
- Mature Tooling"

---

## Backup-Slides (falls mehr Zeit)

### Lambda Monitoring

**CloudWatch zeigen:**
- Invocations Graph
- Duration Graph
- Error Rate
- Logs Live Tail

---

### DynamoDB Single-Table Design

"**Alternative:** Alle Daten in EINER Tabelle

**Vorteile:**
- Weniger Tabellen
- Transaktionen möglich
- Bessere Performance

**Nachteil:**
- Komplexer
- Schwerer zu verstehen

**Ecokart nutzt 4 Tabellen** (einfacher für Demo)"

---

### CI/CD Pipeline

"**Nächster Schritt:** GitHub Actions

```yaml
on: push
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - terraform apply
```

**Auto-Deploy bei Git Push!**"

---

## Checkliste vor Vortrag

- [ ] `./deploy.sh destroy` ausgeführt
- [ ] AWS Credentials funktionieren
- [ ] GitHub Token im Parameter Store
- [ ] Browser-Tabs vorbereitet
- [ ] VS Code geöffnet mit Projekt
- [ ] Terminal-Fenster vorbereitet
- [ ] Internet-Verbindung stabil
- [ ] Backup: Mobile Hotspot bereit

---

## Timing-Übersicht

| Teil | Dauer | Kumulativ |
|------|-------|-----------|
| 1. Einführung | 3 min | 3 min |
| 2. Repository-Struktur | 2 min | 5 min |
| 3. Code-Highlights | 7 min | 12 min |
| 4. Live Deployment | 10 min | 22 min |
| 5. Ergebnis zeigen | 3 min | 25 min |
| 6. Destroy Demo | 1 min | 26 min |
| 7. Q&A | variabel | - |

**Gesamt:** 25-30 Minuten

---

## Notfall-Plan

### "Deployment schlägt fehl"

**Vorbereitete Umgebung:**
Halte eine bereits deployete Umgebung als Backup:

```bash
# Vor Vortrag
./deploy.sh  # In separatem AWS Account deployen
# URLs notieren
```

**Im Notfall:**
Zeige die vorbereitete Umgebung statt Live-Deployment

---

### "Internet-Verbindung bricht ab"

**Lösung:**
- Mobile Hotspot nutzen
- Oder: Offline-Modus → Nur Code zeigen, kein Deployment

---

### "GitHub OAuth funktioniert nicht"

**Lösung:**
"Das ist eine bekannte AWS-Limitation. Der Rest funktioniert! Amplify baut trotzdem, nur Auto-Deploy bei Git Push fehlt."

---

**Viel Erfolg! 🚀**

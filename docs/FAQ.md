# Ecokart Webshop - Häufig gestellte Fragen (FAQ)

**Letzte Aktualisierung:** 26. Oktober 2025

---

## Inhaltsverzeichnis

1. [Admin Frontend mit AWS Deployment verbinden](#admin-frontend-mit-aws-deployment-verbinden)
2. [Kosten für Test-Betrieb (2 Wochen)](#kosten-für-test-betrieb-2-wochen)
3. [Weitere häufige Fragen](#weitere-häufige-fragen)

---

## Admin Frontend mit AWS Deployment verbinden

### Frage: Funktioniert mein lokales Admin Frontend mit dem AWS Deployment?

**Antwort: Ja! ✅**

Das lokale Admin Frontend kann problemlos mit dem auf AWS deployed Backend kommunizieren. Du musst nur die API URL in der Konfiguration ändern.

### Schritt-für-Schritt Anleitung:

#### 1. `.env.local` bearbeiten

```bash
cd admin-frontend
nano .env.local
```

#### 2. API URL ändern

**Aktuell (zeigt auf lokales Backend):**
```bash
ADMIN_API_URL=http://localhost:4000/api/products
```

**Ändern zu (AWS Lambda Backend):**
```bash
ADMIN_API_URL=https://ob4yi692if.execute-api.eu-north-1.amazonaws.com/Prod
```

**⚠️ Wichtig:**
- Entferne `/api/products` am Ende - nur die Base URL verwenden!
- Stelle sicher, dass die URL mit `Prod` endet (ohne trailing slash)

#### 3. Komplette `.env.local` Konfiguration

```bash
# Admin Panel Configuration
ADMIN_APP_USERNAME=admin@ecokart.com
ADMIN_APP_PASSWORD=ecokart2025
ADMIN_SESSION_SECRET=local-dev-secret-change-in-production-12345678

# AWS Production Backend
ADMIN_API_URL=https://ob4yi692if.execute-api.eu-north-1.amazonaws.com/Prod

# API Key (aktuell nicht verwendet)
ADMIN_API_KEY=local-dev-key
```

#### 4. Admin Frontend neu starten

```bash
# Im admin-frontend Verzeichnis
npm run dev
```

#### 5. Testen

- Öffne http://localhost:3001
- Melde dich an mit `admin@ecokart.com` / `ecokart2025`
- Produkte werden jetzt aus DynamoDB geladen
- Änderungen werden direkt in AWS gespeichert!

### Vorteile dieser Konfiguration:

✅ **Lokale Entwicklung mit Production-Daten**
- Schnelle UI-Änderungen ohne Deployment
- Sofortige Reload bei Code-Änderungen
- Debugging-Tools im Browser

✅ **Gemeinsame Datenbasis**
- Kunden-Frontend (Amplify) und Admin-Frontend (lokal) arbeiten auf gleichen Daten
- Produktänderungen sind sofort live sichtbar
- Keine Sync-Probleme zwischen Umgebungen

✅ **Sicher**
- Keine öffentliche Admin-URL nötig
- Admin-Interface nur auf deinem Rechner erreichbar
- AWS Backend bereits mit CORS und Auth geschützt

### Zurück zu lokalem Backend wechseln:

```bash
# .env.local wieder ändern zu:
ADMIN_API_URL=http://localhost:4000

# Backend lokal starten
cd backend
npm run dev

# Admin Frontend neu starten
cd admin-frontend
npm run dev
```

---

## Kosten für Test-Betrieb (2 Wochen)

### Frage: Wie hoch sind die Kosten, wenn die Architektur 2 Wochen läuft mit Test-Clicks?

**Antwort: Praktisch kostenlos (~$0-1) dank AWS Free Tier! 💰**

### Detaillierte Kostenaufschlüsselung (2 Wochen Test-Traffic)

Annahme: **~1000 Test-Requests** (10-50 Clicks pro Tag)

| AWS Service | Nutzung (2 Wochen) | Kosten | Free Tier Status |
|-------------|-------------------|--------|------------------|
| **AWS Amplify** | 2-3 Builds, 500 MB Traffic | **$0.00** | ✅ 1000 Build-Minuten/Monat gratis |
| **Lambda** | ~1000 Function Calls | **$0.00** | ✅ 1M Requests/Monat gratis (dauerhaft) |
| **API Gateway** | ~1000 API Requests | **$0.00** | ✅ 1M Calls/Monat gratis (erste 12 Monate) |
| **DynamoDB** | ~500 Reads, ~100 Writes | **$0.25** | ⚠️ On-Demand Pricing |
| **CloudFront** | ~500 MB Traffic | **$0.00** | ✅ Inklusive in Amplify |
| **CloudWatch Logs** | ~100 MB Logs | **$0.00** | ✅ 5 GB gratis/Monat |

**Gesamtkosten für 2 Wochen:** **~$0.25 - $1.00**

### Was ist dauerhaft kostenlos (AWS Free Tier)?

#### ✅ Immer gratis (kein Ablaufdatum):
- **Lambda:** 1M Requests + 400.000 GB-Sekunden pro Monat
- **DynamoDB:** 25 GB Speicher + 25 Read/Write Capacity Units (Provisioned, nicht On-Demand)
- **CloudWatch:** 10 Custom Metrics, 5 GB Log Ingestion, 1M API Requests

#### ✅ 12 Monate gratis (ab Account-Erstellung):
- **API Gateway:** 1M API Calls pro Monat
- **CloudFront:** 50 GB Datenausgang
- **S3:** 5 GB Speicher, 20.000 GET Requests, 2.000 PUT Requests

#### ⚠️ Kostenpflichtig (aber minimal bei geringem Traffic):
- **DynamoDB On-Demand:**
  - $0.25 pro 1M Read Requests
  - $1.25 pro 1M Write Requests
  - $0.25 pro GB Speicher/Monat
- **Amplify Hosting:**
  - $0.01 pro Build-Minute (nach 1000 gratis Minuten)
  - $0.15 pro GB Traffic (nach gratis Kontingent)

### Kostenvergleich: Verschiedene Szenarien

| Szenario | Requests/Monat | Produkte in DB | Storage | Geschätzte Kosten/Monat |
|----------|----------------|----------------|---------|-------------------------|
| **Test (2 Wochen)** | 1.000 | 31 | < 1 MB | **$0.25 - $1** |
| **Leichte Nutzung** | 10.000 | 50 | < 5 MB | **$2 - $3** |
| **Moderate Nutzung** | 100.000 | 100 | 10 MB | **$5 - $10** |
| **Hohe Nutzung** | 1.000.000 | 500 | 50 MB | **$20 - $30** |

### Wo fallen die Kosten konkret an?

#### 1. DynamoDB (größter Kostenblock bei geringem Traffic)

**On-Demand Pricing:**
```
Read Requests: 500 × $0.00000025 = $0.000125
Write Requests: 100 × $0.00000125 = $0.000125
Storage: 0.001 GB × $0.25 = $0.00025

Gesamt DynamoDB (2 Wochen): ~$0.25
```

**So sparst du:**
- Verwende `BatchGetItem` statt einzelne `GetItem` Calls
- Lösche alte Logs und Test-Daten
- Nutze DynamoDB Streams nur wenn nötig

#### 2. Amplify (Build-Kosten)

**Kostenlos bis 1000 Minuten/Monat:**
```
Durchschnittlicher Build: 3 Minuten
2 Wochen Test: ~3 Deployments = 9 Minuten

Kosten: $0 (weit unter Free Tier)
```

**So sparst du:**
- Teste lokal bevor du pushst (`npm run build` lokal)
- Nutze `git commit --amend` statt viele kleine Commits
- Deaktiviere Auto-Deploy für Feature-Branches

#### 3. Lambda (praktisch immer kostenlos)

**Free Tier: 1M Requests + 400.000 GB-Sekunden/Monat**
```
1000 Requests × 200ms Laufzeit × 512 MB = 100 GB-Sekunden

Kosten: $0 (weit unter Free Tier)
```

### Kosten überwachen

#### AWS Cost Explorer (empfohlen)

```bash
# Browser öffnen
https://console.aws.amazon.com/cost-management/home

# Oder via CLI (letzte 7 Tage)
aws ce get-cost-and-usage \
  --time-period Start=2025-10-19,End=2025-10-26 \
  --granularity DAILY \
  --metrics BlendedCost \
  --region us-east-1 \
  | jq '.ResultsByTime[].Total.BlendedCost.Amount'
```

#### Billing Alerts einrichten (empfohlen!)

```bash
# 1. Erstelle SNS Topic für Alerts
aws sns create-topic --name billing-alerts --region us-east-1

# 2. Abonniere deine Email
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:billing-alerts \
  --protocol email \
  --notification-endpoint deine@email.com \
  --region us-east-1

# 3. Erstelle CloudWatch Alarm (bei $10 Überschreitung)
aws cloudwatch put-metric-alarm \
  --alarm-name billing-alert-10usd \
  --alarm-description "Alert wenn Kosten $10 überschreiten" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 21600 \
  --evaluation-periods 1 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --region us-east-1
```

### Tipps zum Kosten sparen

#### ✅ DynamoDB optimieren
```bash
# CloudWatch Logs Retention reduzieren
aws logs put-retention-policy \
  --log-group-name /aws/lambda/ecokart-backend-api \
  --retention-in-days 7 \
  --region eu-north-1

# Alte Test-Daten löschen
aws dynamodb delete-item \
  --table-name ecokart-orders \
  --key '{"id": {"S": "test-order-123"}}' \
  --region eu-north-1
```

#### ✅ Amplify Builds reduzieren
- Nur `main` Branch auto-deployen
- Feature-Branches manuell deployen
- `.git` und `node_modules` aus Build excluden (automatisch)

#### ✅ Lambda optimieren
- Memory auf 512 MB (optimal für Node.js)
- Timeout nicht höher als nötig (aktuell 30s ist OK)
- Code-Bundle klein halten (aktuell ~5 MB ist gut)

### Kostenschätzung für verschiedene Zeiträume

| Zeitraum | Test-Traffic | Production-Traffic | Maximale Kosten |
|----------|--------------|-------------------|-----------------|
| **2 Wochen** | $0.25 - $1 | $1 - $3 | **$3** |
| **1 Monat** | $0.50 - $2 | $2 - $5 | **$5** |
| **3 Monate** | $1.50 - $6 | $6 - $15 | **$15** |
| **12 Monate** | $6 - $24 | $24 - $60 | **$60** |

**Wichtig:** Dies sind **Maximal-Schätzungen**. Bei reinem Test-Traffic bleibst du sehr wahrscheinlich unter $1/Monat!

### Worst-Case Szenario (wenn Free Tier abgelaufen)

Nach 12 Monaten läuft API Gateway Free Tier aus. Dann:

```
API Gateway: 1000 Requests × $0.0000035 = $0.0035
Lambda: 1000 Requests × $0.0000002 = $0.0002
DynamoDB: (wie oben) = $0.25
Amplify: (wie oben) = $0

Gesamt: ~$0.50 - $2/Monat
```

**Fazit:** Auch nach Free Tier bleibt es bei geringem Traffic sehr günstig!

---

## Weitere häufige Fragen

### Kann ich die Architektur später einfach abbauen?

**Ja!** Alle Ressourcen können gelöscht werden:

```bash
# 1. Amplify App löschen
aws amplify delete-app --app-id d1d14e6pdoz4r --region eu-north-1

# 2. Lambda Stack löschen
aws cloudformation delete-stack --stack-name ecokart-backend --region eu-north-1

# 3. DynamoDB Tabellen löschen (Vorsicht: Daten gehen verloren!)
aws dynamodb delete-table --table-name ecokart-products --region eu-north-1
aws dynamodb delete-table --table-name ecokart-users --region eu-north-1
aws dynamodb delete-table --table-name ecokart-carts --region eu-north-1
aws dynamodb delete-table --table-name ecokart-orders --region eu-north-1
```

**Tipp:** Erstelle vorher ein Backup mit `aws dynamodb create-backup`!

### Wie kann ich zwischen lokalem und AWS Backend wechseln?

**Für das Kunden-Frontend:**
- Kunden-Frontend läuft nur auf Amplify und zeigt immer auf AWS Backend
- Für lokales Testen: Environment Variable in `frontend/lib/config.ts` anpassen

**Für das Admin-Frontend:**
- Einfach `ADMIN_API_URL` in `.env.local` ändern (siehe oben)
- Zwischen `http://localhost:4000` und AWS Lambda URL wechseln

### Was passiert wenn ich das Free Tier überschreite?

- AWS berechnet automatisch die zusätzlichen Kosten
- Billing Alerts warnen dich rechtzeitig (siehe oben)
- Bei Test-Traffic sehr unwahrscheinlich!
- Selbst bei Überschreitung: Kosten bleiben minimal (<$5/Monat)

### Wie sehe ich meine aktuellen Kosten?

**Option 1: AWS Console**
```
https://console.aws.amazon.com/billing/home
→ Bills → Current month
```

**Option 2: CLI**
```bash
aws ce get-cost-and-usage \
  --time-period Start=2025-10-01,End=2025-10-26 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --region us-east-1
```

**Option 3: Cost Explorer App**
- Detaillierte Breakdown nach Service
- Forecasts für kommende Monate
- Custom Reports

### Kann ich einen Kostendeckel setzen?

**Leider nein direkt**, aber:
- ✅ Billing Alerts warnen bei Schwellenwerten
- ✅ AWS Budgets können Actions triggern (z.B. Email, SNS)
- ⚠️ AWS stoppt Services NICHT automatisch bei Limit

**Best Practice:**
1. Billing Alert bei $5 setzen
2. Wöchentlich Cost Explorer checken
3. Nicht benötigte Ressourcen sofort löschen

### Werden Daten zwischen Umgebungen synchronisiert?

**Nein, standardmäßig nicht:**
- Lokales Backend → Nutzt JSON Files in `backend/data/`
- AWS Backend → Nutzt DynamoDB Tabellen

**Um lokale Daten nach AWS zu migrieren:**
```bash
# Export aus JSON
cd backend/data

# Import nach DynamoDB
aws dynamodb batch-write-item \
  --request-items file://products-import.json \
  --region eu-north-1
```

**Um AWS Daten lokal zu testen:**
```bash
# Export aus DynamoDB
aws dynamodb scan --table-name ecokart-products --region eu-north-1 \
  | jq '.Items' > local-products.json
```

---

## Support & Weitere Ressourcen

**Dokumentation:**
- [Haupt-Deployment Guide](DEPLOYMENT.md)
- [Admin Frontend Deployment](ADMIN_FRONTEND_DEPLOYMENT.md)

**AWS Dokumentation:**
- [AWS Free Tier Details](https://aws.amazon.com/free/)
- [DynamoDB Pricing](https://aws.amazon.com/dynamodb/pricing/)
- [Lambda Pricing](https://aws.amazon.com/lambda/pricing/)
- [Amplify Pricing](https://aws.amazon.com/amplify/pricing/)

**Kostenkontrolle:**
- [AWS Cost Explorer](https://console.aws.amazon.com/cost-management/home)
- [AWS Budgets](https://console.aws.amazon.com/billing/home#/budgets)
- [AWS Cost Anomaly Detection](https://console.aws.amazon.com/cost-management/home#/anomaly-detection)

---

**Letzte Aktualisierung:** 26. Oktober 2025
**Version:** 1.0

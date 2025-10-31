# Ecokart Terraform - Basic Example

Dieses Beispiel zeigt die **einfachste Nutzung** des Ecokart Terraform Moduls.

## Was wird erstellt?

- ✅ 4 DynamoDB Tables (Products, Users, Carts, Orders)
- ✅ Lambda Function (Backend API)
- ✅ API Gateway (REST API)
- ✅ IAM Roles & Policies
- ❌ Amplify (deaktiviert für dieses Beispiel)

## Voraussetzungen

1. **Terraform >= 1.5**
   ```bash
   terraform --version
   ```

2. **AWS CLI konfiguriert**
   ```bash
   aws configure
   # oder mit SSO:
   aws sso login --profile your-profile
   ```

3. **Node.js & npm** (für Backend Build)
   ```bash
   node --version  # >= 20.x
   npm --version
   ```

4. **Backend Dependencies installiert**
   ```bash
   cd ../../../backend
   npm install
   npm run build
   ```

## Schnellstart

### 1. terraform.tfvars erstellen

```bash
cd terraform/examples/basic
cp terraform.tfvars.example terraform.tfvars
```

### 2. terraform.tfvars anpassen

Öffne `terraform.tfvars` und setze:

```hcl
# JWT Secret (min. 32 Zeichen)
jwt_secret = "euer-super-geheimer-jwt-key-mindestens-32-zeichen-lang"

# Optional: Andere Werte anpassen
aws_region   = "eu-north-1"
project_name = "ecokart"
environment  = "development"
```

**JWT Secret generieren:**
```bash
openssl rand -base64 32
```

### 3. Terraform initialisieren

```bash
terraform init
```

### 4. Plan prüfen

```bash
terraform plan
```

**Erwartete Ressourcen:** ~15-20 (DynamoDB Tables, Lambda, API Gateway, IAM, etc.)

### 5. Apply ausführen

```bash
terraform apply
```

Bestätige mit `yes`.

**Dauer:** ~2-3 Minuten

## Nach dem Deployment

### 1. API testen

```bash
# API Gateway URL aus Output holen
terraform output api_gateway_url

# Health Check
curl https://YOUR-API-ID.execute-api.eu-north-1.amazonaws.com/Prod/health

# Products abrufen (nach Migration)
curl https://YOUR-API-ID.execute-api.eu-north-1.amazonaws.com/Prod/api/products
```

### 2. DynamoDB mit Daten füllen

```bash
cd ../../../backend
npm run dynamodb:migrate -- --region eu-north-1
```

### 3. API erneut testen

```bash
curl https://YOUR-API-ID.execute-api.eu-north-1.amazonaws.com/Prod/api/products
# Sollte jetzt 31 Produkte zurückgeben
```

## Konfiguration

### DynamoDB Billing Mode ändern

**On-Demand (empfohlen für variablen Traffic):**

```hcl
# In main.tf
module "ecokart" {
  # ...
  dynamodb_billing_mode = "PAY_PER_REQUEST"
}
```

**Provisioned (Free Tier):**

```hcl
module "ecokart" {
  # ...
  dynamodb_billing_mode   = "PROVISIONED"
  dynamodb_read_capacity  = 5
  dynamodb_write_capacity = 5
}
```

### Lambda Memory/Timeout anpassen

```hcl
module "ecokart" {
  # ...
  lambda_memory_size = 1024  # Default: 512 MB
  lambda_timeout     = 60    # Default: 30 Sekunden
}
```

### Amplify aktivieren

```hcl
module "ecokart" {
  # ...
  enable_amplify      = true
  github_repository   = "username/Ecokart-Webshop"
  github_branch       = "main"
  github_access_token = var.github_access_token
}
```

## Outputs

Nach `terraform apply` erhältst du:

| Output | Beschreibung |
|--------|--------------|
| `api_gateway_url` | API Endpoint URL für Frontend |
| `lambda_function_name` | Name der Lambda Function |
| `dynamodb_tables` | Namen aller DynamoDB Tables |
| `next_steps` | Hilfreiche Anleitung für nächste Schritte |

## Cleanup

**ACHTUNG:** Löscht ALLE Ressourcen und Daten!

```bash
terraform destroy
```

Bestätige mit `yes`.

## Troubleshooting

### Problem: "Invalid JWT Secret length"

**Lösung:** JWT Secret muss mindestens 32 Zeichen lang sein.

```bash
# Neuen Secret generieren
openssl rand -base64 32
# In terraform.tfvars eintragen
```

### Problem: "Backend build failed"

**Lösung:** Backend builden vor Terraform apply

```bash
cd ../../../backend
npm install
npm run build
cd -
terraform apply
```

### Problem: "No such file or directory"

**Lösung:** Pfade prüfen

```bash
# Stelle sicher dass du in examples/basic/ bist
pwd
# Sollte enden mit: /terraform/examples/basic

# Lambda Source Path prüfen
ls -la ../../../backend/dist/
# Sollte dist/lambda.js zeigen
```

### Problem: Lambda Deployment Package zu groß

**Lösung:** node_modules cleanen

```bash
cd ../../../backend
rm -rf node_modules
npm install --production
npm run build
cd -
terraform apply
```

## Kosten

**Geschätzte monatliche Kosten (Free Tier):**

| Service | Usage | Kosten |
|---------|-------|--------|
| DynamoDB | Provisioned 5 RCU/WCU | $0 (Free Tier) |
| Lambda | <1M requests | $0 (Free Tier) |
| API Gateway | <1M requests | $0 (Free Tier) |
| **GESAMT** | | **~$0/Monat** |

**Nach Free Tier:**
- DynamoDB On-Demand: ~$2-5/Monat
- Lambda: ~$1/Monat
- API Gateway: ~$3.50 pro 1M Requests

## Nächste Schritte

1. **Frontend deployen** - Amplify in main.tf aktivieren
2. **Custom Domain** - Route53 + ACM konfigurieren
3. **Monitoring** - CloudWatch Dashboards erstellen
4. **Backups** - Point-in-Time Recovery aktivieren
5. **CI/CD** - GitHub Actions für Terraform

## Support

Siehe Haupt-README für Details: `../../README.md`

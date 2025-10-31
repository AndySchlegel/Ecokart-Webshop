# Lambda Minimal Code

Dieser Ordner enthält **minimalen Lambda-Code** für Terraform Deployment.

## Zweck

- **Platzhalter** für schnelles Terraform Testing
- **Beispiel** für Lambda Handler Struktur
- **Minimal** - nur Health Check + Basic DynamoDB Scan

## Production Deployment

Für **Production** sollte der komplette Backend-Code verwendet werden:

```hcl
# In terraform/main.tf
module "lambda" {
  source = "./modules/lambda"

  # WICHTIG: Zeige auf komplettes Backend
  source_path = "../backend"

  # Nicht: "./lambda" (minimal code)
}
```

## Struktur

```
lambda/
├── package.json         # Minimal Dependencies (AWS SDK v3)
├── index.js             # Handler mit Health Check + /api/products
├── README.md            # Diese Datei
└── build.sh             # Build Script (npm install)
```

## Endpoints

### GET /health
Health Check

**Response:**
```json
{
  "status": "ok",
  "message": "Ecokart Lambda is running",
  "timestamp": "2025-10-30T..."
}
```

### GET /api/products
Liste erste 20 Produkte aus DynamoDB

**Response:**
```json
{
  "items": [...],
  "count": 20
}
```

## Installation

```bash
cd terraform/lambda
npm install
```

## Deployment

Terraform nutzt diesen Code automatisch:

```bash
cd terraform
terraform init
terraform apply
```

## Migration zu Production Code

Sobald bereit für Production:

1. In `terraform/main.tf` ändern:
   ```hcl
   module "lambda" {
     source_path = "../backend"  # Statt "./lambda"
   }
   ```

2. Backend builden:
   ```bash
   cd ../backend
   npm run build
   ```

3. Terraform apply:
   ```bash
   cd ../terraform
   terraform apply
   ```

## Unterschied zu Production Backend

| Feature | Minimal Code | Production Backend |
|---------|--------------|-------------------|
| Framework | Vanilla Lambda | Express.js + serverless-http |
| Endpoints | 2 (health, products) | 20+ (auth, cart, orders, ...) |
| Authentication | ❌ | ✅ JWT Middleware |
| Validation | ❌ | ✅ Request Validation |
| Error Handling | Basic | Comprehensive |
| Database | Scan only | Full CRUD + GSI Queries |
| Size | ~50 KB | ~5 MB |

## Warum Minimal Code?

- **Schnelles Testing** - Terraform kann ohne kompletten Build getestet werden
- **Dependency Management** - Minimale Dependencies, schnellerer Deploy
- **Debugging** - Einfacher Code zum Verstehen der Lambda/API Gateway Integration
- **Demonstration** - Zeigt Struktur ohne Business Logic

## Nächste Schritte

1. Teste Terraform mit diesem Code
2. Verifiziere dass API Gateway funktioniert
3. Migriere zu Production Backend (../backend)
4. Teste komplette Anwendung

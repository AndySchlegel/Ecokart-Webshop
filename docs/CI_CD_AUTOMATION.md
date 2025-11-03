# 🚀 CI/CD Automation für Ecokart

## Übersicht der Automatisierungs-Optionen

### Aktueller Stand
- ❌ GitHub OAuth: **Manuell** (Klicks in AWS Console)
- ✅ Basic Auth: **Automatisch** (bereits in Terraform)
- ❌ DynamoDB Seed: **Manuell** (CLI Befehle)
- ❌ Test-User: **Manuell** (CLI Befehle)

### Nach Automatisierung
- ✅ GitHub OAuth: **Einmalig** (Token in Parameter Store)
- ✅ Basic Auth: **Automatisch** (Terraform)
- ✅ DynamoDB Seed: **Automatisch** (null_resource)
- ✅ Test-User: **Automatisch** (null_resource)

---

## 🎯 Option 1: Terraform Local-Exec (Empfohlen)

**Vorteile:**
- ✅ Einfache Umsetzung
- ✅ Keine zusätzlichen Services
- ✅ Läuft lokal + in CI/CD
- ✅ 0€ Kosten

**Nachteile:**
- ⚠️ Benötigt Node.js auf der Maschine
- ⚠️ Läuft bei jedem `terraform apply`

### Umsetzung

#### 1. GitHub Token einmalig erstellen

```bash
# 1. Erstelle Token: https://github.com/settings/tokens
#    - Scope: ✅ repo (Full control)
#    - Kopiere Token: ghp_xxxxxxxxxxxx

# 2. Speichere in AWS Parameter Store
aws ssm put-parameter \
  --name "/ecokart/development/github-token" \
  --value "ghp_YOUR_TOKEN_HERE" \
  --type "SecureString" \
  --region eu-north-1
```

#### 2. Terraform erweitern

**Datei: `terraform/modules/seed/main.tf`** (Neu erstellen)

```hcl
# ============================================================================
# Database Seeding Module
# ============================================================================

variable "aws_region" {
  type = string
}

variable "depends_on_resources" {
  description = "List of resources to wait for"
  type        = any
  default     = []
}

variable "backend_path" {
  description = "Pfad zum Backend-Verzeichnis"
  type        = string
}

variable "enable_seeding" {
  description = "DB Seeding aktivieren"
  type        = bool
  default     = true
}

# DynamoDB Seeding
resource "null_resource" "seed_database" {
  count = var.enable_seeding ? 1 : 0

  depends_on = [var.depends_on_resources]

  provisioner "local-exec" {
    command = <<EOF
      cd ${var.backend_path}
      npm ci --production=false
      npm run dynamodb:migrate:single -- --region ${var.aws_region}
      node scripts/create-test-user.js
      node scripts/create-admin-user.js
    EOF

    environment = {
      AWS_REGION = var.aws_region
    }
  }

  # Trigger: Bei Änderungen neu ausführen
  triggers = {
    always_run = timestamp()
  }
}

output "seeding_completed" {
  value = var.enable_seeding ? null_resource.seed_database[0].id : null
}
```

#### 3. Im Haupt-Terraform einbinden

**Datei: `terraform/main.tf`** (Erweitern)

```hcl
# Nach dem DynamoDB Module hinzufügen:

module "database_seeding" {
  source = "./modules/seed"

  aws_region            = var.aws_region
  backend_path          = "${path.module}/../backend"
  enable_seeding        = var.enable_auto_seed
  depends_on_resources  = [module.dynamodb]
}
```

#### 4. Variable hinzufügen

**Datei: `terraform/variables.tf`** (Erweitern)

```hcl
variable "enable_auto_seed" {
  description = "Automatisches DynamoDB Seeding aktivieren"
  type        = bool
  default     = true
}
```

#### 5. Deployment

```bash
cd terraform/examples/basic

# 1. Token aus Parameter Store holen
export TF_VAR_github_access_token=$(aws ssm get-parameter \
  --name "/ecokart/development/github-token" \
  --with-decryption \
  --query 'Parameter.Value' \
  --output text \
  --region eu-north-1)

# 2. Deploy mit Auto-Seeding
terraform apply -auto-approve

# ✅ Fertig! Alles automatisch:
#    - Infrastruktur deployed
#    - Basic Auth gesetzt
#    - DynamoDB gefüllt
#    - Test-User erstellt
```

---

## 🔄 Option 2: GitHub Actions (100% Cloud)

**Vorteile:**
- ✅ 100% in der Cloud
- ✅ Kein lokales Setup nötig
- ✅ Bei jedem Push automatisch
- ✅ 0€ Kosten (GitHub Actions Free Tier)

**Nachteile:**
- ⚠️ Benötigt GitHub Secrets Setup
- ⚠️ AWS Credentials in GitHub

### Umsetzung

**Datei: `.github/workflows/deploy.yml`** (Neu erstellen)

```yaml
name: Deploy Ecokart Infrastructure

on:
  push:
    branches: [main]
    paths:
      - 'terraform/**'
      - 'backend/**'
      - '.github/workflows/deploy.yml'
  workflow_dispatch:
    inputs:
      destroy:
        description: 'Destroy infrastructure'
        type: boolean
        default: false

env:
  AWS_REGION: eu-north-1
  TF_VERSION: 1.5.0

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write   # Für OIDC
      contents: read

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Configure AWS Credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Get GitHub Token from Parameter Store
        id: github-token
        run: |
          TOKEN=$(aws ssm get-parameter \
            --name "/ecokart/development/github-token" \
            --with-decryption \
            --query 'Parameter.Value' \
            --output text)
          echo "::add-mask::$TOKEN"
          echo "token=$TOKEN" >> $GITHUB_OUTPUT

      - name: Terraform Init
        working-directory: terraform/examples/basic
        run: terraform init

      - name: Terraform Plan
        if: github.event.inputs.destroy != 'true'
        working-directory: terraform/examples/basic
        env:
          TF_VAR_github_access_token: ${{ steps.github-token.outputs.token }}
        run: terraform plan -out=tfplan

      - name: Terraform Apply
        if: github.event.inputs.destroy != 'true'
        working-directory: terraform/examples/basic
        env:
          TF_VAR_github_access_token: ${{ steps.github-token.outputs.token }}
        run: terraform apply -auto-approve tfplan

      - name: Terraform Destroy
        if: github.event.inputs.destroy == 'true'
        working-directory: terraform/examples/basic
        env:
          TF_VAR_github_access_token: ${{ steps.github-token.outputs.token }}
        run: terraform destroy -auto-approve

      - name: Output URLs
        if: github.event.inputs.destroy != 'true'
        working-directory: terraform/examples/basic
        run: |
          echo "### 🚀 Deployment Successful!" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "**Customer Frontend:** $(terraform output -raw amplify_app_url)" >> $GITHUB_STEP_SUMMARY
          echo "**Admin Frontend:** $(terraform output -raw admin_amplify_app_url)" >> $GITHUB_STEP_SUMMARY
          echo "**API Gateway:** $(terraform output -raw api_gateway_url)" >> $GITHUB_STEP_SUMMARY
```

#### GitHub Secrets einrichten

```bash
# 1. AWS OIDC Role erstellen (einmalig)
# Siehe: https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services

# 2. In GitHub Repository → Settings → Secrets and variables → Actions:
# Neues Secret: AWS_ROLE_ARN = arn:aws:iam::729403197965:role/GitHubActionsRole
```

---

## 🎯 Option 3: Lambda Seed Function (Production-Ready)

**Vorteile:**
- ✅ Läuft nur einmal (beim ersten Deploy)
- ✅ Idempotent (kann mehrfach ausgeführt werden)
- ✅ Keine lokalen Dependencies
- ✅ Production-Ready

**Nachteile:**
- ⚠️ Komplexer
- ⚠️ +2€/Monat (Lambda + CloudWatch)

### Umsetzung

**Datei: `terraform/modules/seed-lambda/main.tf`** (Neu erstellen)

```hcl
# Lambda Function die DynamoDB einmalig befüllt
resource "aws_lambda_function" "seed" {
  filename      = "${path.module}/seed-lambda.zip"
  function_name = "${var.project_name}-${var.environment}-seed"
  role          = aws_iam_role.seed_lambda.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 300

  environment {
    variables = {
      REGION = var.aws_region
    }
  }
}

# CloudFormation Custom Resource Trigger
resource "aws_cloudformation_stack" "seed_trigger" {
  name = "${var.project_name}-${var.environment}-seed-trigger"

  template_body = jsonencode({
    Resources = {
      SeedTrigger = {
        Type = "Custom::SeedDatabase"
        Properties = {
          ServiceToken = aws_lambda_function.seed.arn
        }
      }
    }
  })
}
```

**Code würde ich auf Anfrage erstellen.**

---

## 📝 Zusammenfassung & Empfehlung

### Für Entwicklung (Lokal)
→ **Option 1: Terraform Local-Exec**
- Schnell, einfach, keine zusätzliche Infrastruktur

### Für Production (Team)
→ **Option 2: GitHub Actions**
- Automatisch bei jedem Push
- Team-freundlich
- Audit Trail

### Für Enterprise
→ **Option 3: Lambda Seed Function**
- Professionell
- Idempotent
- Skalierbar

---

## ⚡ Quick Start

**Minimal-Setup (5 Minuten):**

```bash
# 1. GitHub Token erstellen & speichern
aws ssm put-parameter \
  --name "/ecokart/development/github-token" \
  --value "ghp_YOUR_TOKEN" \
  --type "SecureString" \
  --region eu-north-1

# 2. Deployment mit Auto-Seeding
cd terraform/examples/basic
export TF_VAR_github_access_token=$(aws ssm get-parameter \
  --name "/ecokart/development/github-token" \
  --with-decryption \
  --query 'Parameter.Value' \
  --output text \
  --region eu-north-1)

terraform apply -auto-approve

# ✅ Fertig! GitHub OAuth läuft jetzt automatisch
# ✅ Basic Auth ist gesetzt
# ✅ DynamoDB ist befüllt (wenn Option 1 umgesetzt)
```

**Noch offener Punkt:**
- GitHub OAuth Reconnect in AWS Console (1x klicken nach erstem Deploy)

---

## 🔮 Zukunft: 100% Click-Free

Wenn du **NIE WIEDER** klicken willst:

→ **Migration zu ECS + GitHub Actions**
- Kosten: +15€/Monat
- Aufwand: 2-3 Stunden Migration
- Ergebnis: 100% automatisch, 0 Klicks

Soll ich das als separate Option detaillieren?

# Database Seeding Module

Automatisches Befüllen der DynamoDB Tabellen mit Test-Daten beim `terraform apply`.

## Features

- ✅ Automatisches Seeding bei Deployment
- ✅ Erstellt Test-User (`demo@ecokart.com`)
- ✅ Erstellt Admin-User (`admin@ecokart.com`)
- ✅ Befüllt Products Tabelle (31 Produkte)
- ✅ Optional aktivierbar/deaktivierbar
- ✅ Unterstützt AWS Profile

## Usage

```hcl
module "database_seeding" {
  source = "./modules/seed"

  aws_region            = "eu-north-1"
  backend_path          = "${path.module}/../backend"
  enable_seeding        = true
  depends_on_resources  = [module.dynamodb]
}
```

## Requirements

- Node.js 20.x oder höher
- npm
- AWS Credentials konfiguriert

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| aws_region | AWS Region | `string` | n/a | yes |
| backend_path | Pfad zum Backend-Verzeichnis | `string` | n/a | yes |
| enable_seeding | DB Seeding aktivieren | `bool` | `true` | no |
| aws_profile | AWS Profile für CLI | `string` | `""` | no |
| depends_on_resources | Resources to wait for | `any` | `[]` | no |

## Outputs

| Name | Description |
|------|-------------|
| seeding_completed | Seeding completed timestamp |

## Was wird erstellt?

### DynamoDB Daten:
- **31 Produkte** (Shoes, Running, etc.)
- **2 Test-User:**
  - `demo@ecokart.com` / `Demo1234!`
  - `test@ecokart.com` / `Test1234!`
- **1 Admin-User:**
  - `admin@ecokart.com` / `ecokart2025`
- **2 Test-Warenkörbe**
- **7 Test-Bestellungen**

## Troubleshooting

### Error: "npm ci failed"

**Lösung:** Node.js Version prüfen

```bash
node --version  # Sollte v20.x.x sein
```

### Error: "AWS credentials not found"

**Lösung:** AWS Profile setzen

```hcl
module "database_seeding" {
  # ...
  aws_profile = "Teilnehmer-729403197965"
}
```

### Seeding deaktivieren

```hcl
module "database_seeding" {
  # ...
  enable_seeding = false
}
```

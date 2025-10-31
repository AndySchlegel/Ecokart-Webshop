# Changelog

Alle wichtigen Änderungen an diesem Terraform-Modul werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/lang/de/).

## [1.0.0] - 2025-10-30

### Hinzugefügt

#### Terraform Haupt-Module
- Terraform >= 1.5.0 Unterstützung
- AWS Provider ~> 5.0 Konfiguration
- Vollständige variable Konfiguration (variables.tf)
- Umfassende Outputs (outputs.tf)
- Standard-Tags für alle Ressourcen

#### DynamoDB Module
- `ecokart-products` Table mit CategoryIndex GSI
- `ecokart-users` Table mit EmailIndex GSI
- `ecokart-carts` Table (userId als Partition Key)
- `ecokart-orders` Table mit UserOrdersIndex GSI
- Konfigurierbare Billing Modes (PROVISIONED / PAY_PER_REQUEST)
- Optional: Point-in-Time Recovery
- Server-Side Encryption (Standard aktiviert)

#### Lambda Module
- Lambda Function mit Node.js 20.x Runtime
- Express.js Integration via serverless-http
- API Gateway REST API (ANY /, ANY /{proxy+})
- IAM Role mit DynamoDB CRUD Permissions
- CloudWatch Log Group mit 14 Tage Retention
- Automatischer TypeScript Build (via null_resource)
- ZIP Deployment Package Erstellung
- Environment Variables Support

#### Amplify Module (Optional)
- AWS Amplify App für Next.js SSR Hosting
- GitHub Integration mit Auto-Deploy
- Build Spec für Next.js (Monorepo Support)
- Environment Variables Injection
- Optional: Basic Authentication
- Optional: Custom Headers (Security)
- Webhook für manuelle Deployments

#### Lambda Minimal Code
- Health Check Endpoint (/)
- Products Endpoint (/api/products)
- DynamoDB Integration (AWS SDK v3)
- Minimal Dependencies (~50 KB)
- Build Script (build.sh)

#### Examples
- Basic Deployment Beispiel (examples/basic/)
- Vollständige Dokumentation
- terraform.tfvars.example Template
- Schnellstart-Anleitung

#### Dokumentation
- Haupt-README mit Architektur-Diagramm
- Module-READMEs (DynamoDB, Lambda, Amplify)
- Beispiel-README (basic/)
- Lambda Minimal Code README
- Umfassende Troubleshooting-Sektion
- Kosten-Kalkulation
- Sicherheitshinweise

#### Hilfsdateien
- .gitignore (Terraform-spezifisch)
- terraform.tfvars.example (Template)
- CHANGELOG.md (diese Datei)

### Technische Details

#### Unterstützte Terraform Provider
- `hashicorp/aws` ~> 5.0
- `hashicorp/archive` ~> 2.4
- `hashicorp/random` ~> 3.5
- `hashicorp/null` ~> 3.2

#### Unterstützte AWS Regionen
- Alle Regionen (getestet mit eu-north-1)
- Multi-Account Support via Provider Configuration

#### Unterstützte Node.js Versionen
- Node.js 20.x (Lambda Runtime)
- Node.js >= 18.x (Lokale Entwicklung)

### Besonderheiten

#### Module Struktur
- Vollständig modular (DynamoDB, Lambda, Amplify getrennt)
- Re-usable als Terraform Registry Module
- Gut dokumentierte Inputs/Outputs
- for_each wo sinnvoll (Best Practices)

#### Sicherheit
- Sensitive Variables markiert (jwt_secret, github_access_token)
- Minimale IAM Permissions (Least Privilege)
- Server-Side Encryption aktiviert
- Optional: PITR für DynamoDB
- Optional: API Gateway Access Logs

#### Kosten-Optimierung
- Free Tier kompatibel (PROVISIONED Mode)
- Optional: On-Demand für variable Workloads
- Konfigurierbare Memory/Timeout (Lambda)
- CloudWatch Logs Retention konfigurierbar

### Bekannte Einschränkungen

1. **Lambda Build**: Benötigt npm und Node.js auf der Maschine die terraform apply ausführt
2. **Amplify**: GitHub Access Token erforderlich für Auto-Deploy
3. **DynamoDB**: Schema-Änderungen können Datenverlust verursachen (Backup empfohlen)
4. **Amplify Custom Domain**: Aktuell nicht im Module implementiert (manuell hinzufügbar)

### Migration von SAM

Dieses Modul reproduziert die SAM-Template Infrastruktur (`backend/template.yaml`) mit folgenden Verbesserungen:

- ✅ Modular statt monolithisch
- ✅ Wiederverwendbar
- ✅ Variablen statt Hard-coded Values
- ✅ DynamoDB Creation integriert (SAM erforderte manuelle Creation)
- ✅ Amplify Integration (SAM hatte keine Frontend-Unterstützung)
- ✅ Besseres Tagging

### Breaking Changes

Keine - Erste Version

### Deprecated

Keine - Erste Version

### Removed

Keine - Erste Version

### Fixed

Keine - Erste Version

### Security

- Alle sensible Variablen sind als `sensitive = true` markiert
- .gitignore verhindert versehentliches Commiten von Secrets
- terraform.tfvars.example zeigt sichere Konfiguration

---

## Versionierung

**Format:** MAJOR.MINOR.PATCH

- **MAJOR**: Breaking Changes (Inkompatibel mit vorheriger Version)
- **MINOR**: Neue Features (Rückwärtskompatibel)
- **PATCH**: Bugfixes (Rückwärtskompatibel)

## Zukünftige Versionen

### [1.1.0] - Geplant

- [ ] VPC Module (optional, für Lambda in VPC)
- [ ] CloudWatch Dashboards Module
- [ ] SNS/SES Integration für Email-Benachrichtigungen
- [ ] Cognito User Pools Module (Alternative zu Custom JWT Auth)
- [ ] Route53 + ACM Module (Custom Domain Support)
- [ ] Backup Module (Automated Backups für DynamoDB)
- [ ] Multi-Region Support

### [2.0.0] - Geplant

- [ ] Migration zu AWS CDK (optional alternative)
- [ ] Kubernetes Support (EKS statt Lambda)
- [ ] GraphQL API (AppSync Integration)

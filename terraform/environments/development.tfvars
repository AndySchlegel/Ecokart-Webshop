# ============================================================================
# Ecokart - Development Environment Configuration
# ============================================================================
# Diese Config wird für den "develop" Branch verwendet.
# Ziel: Günstig, schnell, zum Experimentieren
# AWS Kosten: ~20-30 EUR/Monat
# ============================================================================

# ----------------------------------------------------------------------------
# Allgemeine Konfiguration
# ----------------------------------------------------------------------------

aws_region   = "eu-north-1"  # Stockholm (günstigste EU-Region)
project_name = "ecokart"
environment  = "development"

# ----------------------------------------------------------------------------
# DynamoDB Konfiguration - KOSTENGÜNSTIG
# ----------------------------------------------------------------------------

# PAY_PER_REQUEST = Du zahlst nur für tatsächliche Zugriffe
# Perfekt für Development, weil oft wenig Traffic
dynamodb_billing_mode = "PAY_PER_REQUEST"

# Point-in-Time Recovery = Backup-Feature
# Development: AUS (spart Kosten, Daten sind nicht kritisch)
enable_point_in_time_recovery = false

# ----------------------------------------------------------------------------
# Lambda Konfiguration - KLEIN
# ----------------------------------------------------------------------------

lambda_runtime     = "nodejs20.x"
lambda_memory_size = 256        # Halbe Power von Production (spart Geld)
lambda_timeout     = 30         # 30 Sekunden reichen für Development
lambda_source_path = "../backend"  # Relativer Pfad von terraform/

# ----------------------------------------------------------------------------
# API Gateway Konfiguration
# ----------------------------------------------------------------------------

api_gateway_stage_name = "dev"  # Stage heißt "dev" statt "Prod"

# Access Logs = Detaillierte Anfrage-Logs in CloudWatch
# Development: AUS (spart Kosten, weniger Logs-Spam)
enable_api_gateway_access_logs = false

# ----------------------------------------------------------------------------
# Amplify Konfiguration
# ----------------------------------------------------------------------------

enable_amplify    = true
github_repository = "https://github.com/AndySchlegel/Ecokart-Webshop"
github_branch     = "develop"  # WICHTIG: Dieser Branch!
amplify_framework = "Next.js - SSR"
amplify_build_command = "npm run build"
amplify_monorepo_app_root = "frontend"

# Basic Auth - Schutz vor neugierigen Augen (nicht Production-ready!)
basic_auth_enabled  = true
basic_auth_user     = "demo"
basic_auth_password = "test1234"  # Schwaches Passwort OK für Dev

# ----------------------------------------------------------------------------
# Admin Frontend Amplify Konfiguration
# ----------------------------------------------------------------------------

enable_admin_amplify          = true
admin_amplify_framework       = "Next.js - SSR"
admin_amplify_build_command   = "npm run build"
admin_amplify_monorepo_app_root = "admin-frontend"

admin_basic_auth_enabled  = true
admin_basic_auth_user     = "admin"
admin_basic_auth_password = "admin1234"

# ----------------------------------------------------------------------------
# Cognito Konfiguration
# ----------------------------------------------------------------------------

enable_cognito_auth = true

# ----------------------------------------------------------------------------
# Database Seeding
# ----------------------------------------------------------------------------

enable_auto_seed = true

# ----------------------------------------------------------------------------
# Zusätzliche Tags
# ----------------------------------------------------------------------------

additional_tags = {
  Environment  = "development"
  CostCenter   = "development"
  ManagedBy    = "terraform"
  AutoShutdown = "true"  # Könnte für automatisches Herunterfahren genutzt werden
}

# ============================================================================
# WICHTIG FÜR DICH, ANDY:
# ============================================================================
# Diese Config macht die Infrastruktur BEWUSST klein und günstig.
#
# Vorteile:
# - ✅ Niedrige Kosten (~20-30 EUR/Monat)
# - ✅ Schnelles Deployment (weniger Ressourcen)
# - ✅ Du kannst hier "kaputt machen" ohne Drama
#
# Nachteile:
# - ⚠️ Langsamer als Production (256 MB statt 512 MB Lambda)
# - ⚠️ Kein Backup (Point-in-Time Recovery aus)
# - ⚠️ Nicht für echte Kunden geeignet
#
# DAS IST GUT SO! Development soll günstig zum Testen sein! 🚀
# ============================================================================

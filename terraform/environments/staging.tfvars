# ============================================================================
# Ecokart - Staging Environment Configuration
# ============================================================================
# Diese Config wird für den "staging" Branch verwendet.
# Ziel: Production-ähnlich für FINALE TESTS vor Go-Live
# AWS Kosten: ~40-60 EUR/Monat
# ============================================================================

# ----------------------------------------------------------------------------
# Allgemeine Konfiguration
# ----------------------------------------------------------------------------

aws_region   = "eu-north-1"
project_name = "ecokart"
environment  = "staging"

# ----------------------------------------------------------------------------
# DynamoDB Konfiguration - PRODUCTION-ÄHNLICH
# ----------------------------------------------------------------------------

# PROVISIONED = Feste Kapazität (vorhersehbare Kosten)
# Staging: Wie Production, aber niedriger (reicht für Tests)
dynamodb_billing_mode = "PROVISIONED"

# Read/Write Capacity für moderaten Traffic
# Production wird später höher sein (z.B. 10/10)
dynamodb_read_capacity  = 3
dynamodb_write_capacity = 3

# Point-in-Time Recovery = Backup
# Staging: AN (weil wir Production-Setup testen wollen!)
enable_point_in_time_recovery = true

# ----------------------------------------------------------------------------
# Lambda Konfiguration - MITTEL
# ----------------------------------------------------------------------------

lambda_runtime     = "nodejs20.x"
lambda_memory_size = 512        # Wie Production (wichtig für realistische Tests!)
lambda_timeout     = 30

# ----------------------------------------------------------------------------
# API Gateway Konfiguration
# ----------------------------------------------------------------------------

api_gateway_stage_name = "staging"

# Access Logs = Logging aktivieren
# Staging: AN (wir wollen Production-Setup testen!)
enable_api_gateway_access_logs = true

# ----------------------------------------------------------------------------
# Amplify Konfiguration
# ----------------------------------------------------------------------------

enable_amplify    = true
github_repository = "https://github.com/AndySchlegel/Ecokart-Webshop"
github_branch     = "staging"  # WICHTIG: Dieser Branch!

# Basic Auth - Schutz vor Öffentlichkeit
basic_auth_enabled  = true
basic_auth_user     = "staging"
basic_auth_password = "staging2024"  # Etwas stärker als Dev

# Admin Frontend
enable_admin_amplify      = true
admin_basic_auth_enabled  = true
admin_basic_auth_user     = "admin"
admin_basic_auth_password = "staging2024"

# ----------------------------------------------------------------------------
# Zusätzliche Tags
# ----------------------------------------------------------------------------

additional_tags = {
  Environment = "staging"
  CostCenter  = "staging"
  ManagedBy   = "terraform"
  Purpose     = "pre-production-testing"
}

# ============================================================================
# WICHTIG FÜR DICH, ANDY:
# ============================================================================
# Staging = Die "Generalprobe" vor Production!
#
# Unterschied zu Development:
# - ✅ Gleiche Performance wie Production (512 MB Lambda)
# - ✅ Backups aktiviert (Point-in-Time Recovery)
# - ✅ Logging aktiviert (wie in Production)
# - ✅ Realistische Tests möglich
#
# Unterschied zu Production:
# - 💰 Etwas günstiger (niedrigere DynamoDB Capacity: 3 statt 10)
# - 🔒 Basic Auth noch aktiv (Production hat später Cognito)
#
# USE CASE:
# - Feature ist in Development fertig → Merge zu Staging
# - In Staging: Finale Tests mit echten Daten (aber fake!)
# - Alles OK? → Merge zu Main (Production)
#
# REGEL: Niemals direkt von develop zu main! Immer über staging! 🚦
# ============================================================================

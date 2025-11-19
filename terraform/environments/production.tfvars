# ============================================================================
# Ecokart - Production Environment Configuration
# ============================================================================
# Diese Config wird für den "main" Branch verwendet.
# Ziel: ECHTE KUNDEN - Maximale Zuverlässigkeit & Performance
# AWS Kosten: ~100-150 EUR/Monat (abhängig von Traffic)
# ============================================================================

# ----------------------------------------------------------------------------
# Allgemeine Konfiguration
# ----------------------------------------------------------------------------

aws_region   = "eu-north-1"  # Stockholm (DSGVO-konform, gute Latenz für EU)
project_name = "ecokart"
environment  = "production"

# ----------------------------------------------------------------------------
# DynamoDB Konfiguration - PRODUCTION GRADE
# ----------------------------------------------------------------------------

# PROVISIONED = Feste Kapazität (vorhersehbare Performance & Kosten)
# Production: Höhere Kapazität für echten Traffic
dynamodb_billing_mode = "PROVISIONED"

# Read/Write Capacity für echten Traffic
# Diese Werte kannst du später erhöhen wenn mehr Kunden kommen
dynamodb_read_capacity  = 10  # Höher als Staging!
dynamodb_write_capacity = 10

# Point-in-Time Recovery = Kontinuierliche Backups
# Production: PFLICHT! Damit du bei Datenverlust wiederherstellen kannst
enable_point_in_time_recovery = true

# ----------------------------------------------------------------------------
# Lambda Konfiguration - VOLLE POWER
# ----------------------------------------------------------------------------

lambda_runtime     = "nodejs20.x"
lambda_memory_size = 1024       # Doppelt so viel wie Staging! (schnellere Antworten)
lambda_timeout     = 30         # Könnte sogar höher sein (z.B. 60) für komplexe Orders

# ----------------------------------------------------------------------------
# API Gateway Konfiguration
# ----------------------------------------------------------------------------

api_gateway_stage_name = "prod"  # Oder "v1" für API-Versionierung

# Access Logs = PFLICHT in Production
# Du willst wissen wer wann was aufruft (für Debugging & Security)
enable_api_gateway_access_logs = true

# ----------------------------------------------------------------------------
# Amplify Konfiguration
# ----------------------------------------------------------------------------

enable_amplify    = true
github_repository = "https://github.com/AndySchlegel/Ecokart-Webshop"
github_branch     = "main"  # WICHTIG: Production Branch!

# Basic Auth - NUR FÜR SOFT-LAUNCH!
# SPÄTER: Entfernen wenn du Cognito implementiert hast
basic_auth_enabled  = true
basic_auth_user     = "customer"
basic_auth_password = "EcoKart2024!Secure"  # STARKES Passwort!

# Admin Frontend
enable_admin_amplify      = true
admin_basic_auth_enabled  = true
admin_basic_auth_user     = "admin"
admin_basic_auth_password = "AdminEcoKart2024!VerySecure"  # SEHR starkes Passwort!

# ----------------------------------------------------------------------------
# Zusätzliche Tags
# ----------------------------------------------------------------------------

additional_tags = {
  Environment  = "production"
  CostCenter   = "production"
  ManagedBy    = "terraform"
  BusinessUnit = "e-commerce"
  Compliance   = "gdpr"
  Backup       = "daily"
  Critical     = "true"
}

# ============================================================================
# WICHTIG FÜR DICH, ANDY - PRODUCTION CHECKLIST:
# ============================================================================
#
# ✅ Vor dem ersten Production-Deployment PRÜFEN:
#
# 1. Backups aktiviert? → ✅ enable_point_in_time_recovery = true
# 2. Logging aktiviert? → ✅ enable_api_gateway_access_logs = true
# 3. Starke Passwörter? → ✅ Oben ändern (nicht die Beispiel-Werte nutzen!)
# 4. Monitoring Setup? → ⏳ CloudWatch Alarms (kommt in späterer Phase)
# 5. Secrets Manager? → ⏳ JWT Secret & Stripe Keys (kommt in späterer Phase)
#
# 💰 KOSTEN-OPTIMIERUNG:
# - Wenn wenig Traffic: dynamodb_billing_mode = "PAY_PER_REQUEST" (günstiger)
# - Wenn viel Traffic: PROVISIONED (wie jetzt) ist günstiger
# - Lambda Memory: 1024 MB ist gut, aber bei Bedarf auf 512 MB reduzieren
#
# 🚀 SKALIERUNG:
# - Wenn die App langsam wird:
#   1. Erhöhe dynamodb_read_capacity / write_capacity (z.B. auf 20/20)
#   2. Erhöhe lambda_memory_size (z.B. auf 2048 MB)
#   3. Aktiviere DynamoDB Auto-Scaling (kommt in späterer Phase)
#
# 🔒 SECURITY:
# - Basic Auth ist nur TEMPORÄR! (bis Cognito implementiert ist)
# - Später: enable_waf = true (kommt in Security-Phase der Roadmap)
# - Später: enable_cognito = true (kommt in Auth-Phase der Roadmap)
#
# REGEL FÜR PRODUCTION:
# - ⛔ NIEMALS direkt zu main pushen!
# - ✅ Immer: develop → staging → main (mit Pull Requests & Reviews)
# - ✅ Immer: Tests laufen lassen vor Merge
# - ✅ Immer: Backup vor großen Changes
#
# DU BAUST HIER EINEN ECHTEN SHOP - BEHANDLE PRODUCTION WIE EIN PROFI! 💪
# ============================================================================

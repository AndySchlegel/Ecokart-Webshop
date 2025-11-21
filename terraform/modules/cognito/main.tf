# ================================================================
# AWS Cognito User Pool - User-Authentifizierung
# ================================================================
#
# Was macht dieses Modul?
# - Erstellt eine Cognito User Pool (= User-Datenbank)
# - Konfiguriert Email-Verification
# - Erstellt einen App Client (für Frontend)
# - Optional: Hosted UI Domain
#
# Autor: Andy Schlegel
# Datum: 20. November 2025
# ================================================================

# ----------------------------------------------------------------
# Data Source - Aktuelle AWS Region
# ----------------------------------------------------------------
data "aws_region" "current" {}

# ----------------------------------------------------------------
# 1. COGNITO USER POOL (Haupt-Komponente)
# ----------------------------------------------------------------
# Das ist wie eine Datenbank für User-Accounts
# AWS managed alles: Passwords, Email-Verification, etc.

resource "aws_cognito_user_pool" "main" {
  # Name des User Pools (z.B. "ecokart-development-users")
  name = "${var.project_name}-${var.environment}-users"

  # ----------------------------------------------------------------
  # 🚨 LIFECYCLE PROTECTION
  # ----------------------------------------------------------------
  # PROBLEM: Bei "terraform destroy" werden ALLE User gelöscht!
  # - Alle Emails, Passwörter, Admin-User weg!
  # - Muss nach Redeploy alles neu erstellt werden
  #
  # LÖSUNG: prevent_destroy verhindert versehentliches Löschen
  #
  # ⚠️ Für Development/Testing:
  # Wenn du den User Pool wirklich destroyen willst, kommentiere
  # den lifecycle Block temporär aus.
  #
  # ✅ Für Production: NIEMALS auskommentieren!
  # ----------------------------------------------------------------
  lifecycle {
    prevent_destroy = true
  }

  # ----------------------------------------------------------------
  # Username Configuration
  # ----------------------------------------------------------------
  # Email als Username nutzen (statt separatem Username)
  # Vorteil: User muss sich nur Email merken
  username_attributes = ["email"]

  # Username darf nicht geändert werden nach Erstellung
  username_configuration {
    case_sensitive = false  # Max@example.com = max@example.com
  }

  # ----------------------------------------------------------------
  # Auto-Verification
  # ----------------------------------------------------------------
  # Welche Attribute müssen verifiziert werden?
  # "email" = User bekommt Email mit Code
  auto_verified_attributes = ["email"]

  # ----------------------------------------------------------------
  # Email Configuration
  # ----------------------------------------------------------------
  # Wie werden Emails verschickt?
  # "COGNITO_DEFAULT" = AWS schickt Emails (bis 50/Tag FREE)
  # "DEVELOPER" = Eigenes SES nutzen (später wenn mehr Emails)
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  # ----------------------------------------------------------------
  # Password Policy
  # ----------------------------------------------------------------
  # Wie stark muss das Password sein?
  password_policy {
    minimum_length    = 8              # Mindestens 8 Zeichen
    require_lowercase = true           # Muss Kleinbuchstaben haben
    require_uppercase = true           # Muss Großbuchstaben haben
    require_numbers   = true           # Muss Zahlen haben
    require_symbols   = false          # Symbole optional (!, @, #)
  }

  # ----------------------------------------------------------------
  # User Attributes
  # ----------------------------------------------------------------
  # Welche Daten speichern wir über User?
  # Standard: email (automatisch)
  # Custom: role (für "admin" oder "customer")
  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true         # Email ist Pflicht
    mutable             = true         # Email kann geändert werden

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  # Custom Attribute: Role (admin oder customer)
  schema {
    name                = "role"
    attribute_data_type = "String"
    required            = false        # Optional (Default: customer)
    mutable             = true         # Kann später geändert werden

    string_attribute_constraints {
      min_length = 1
      max_length = 20
    }
  }

  # ----------------------------------------------------------------
  # Verification Messages
  # ----------------------------------------------------------------
  # Welche Email wird bei Sign Up geschickt?
  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"  # Code in Email
    email_subject        = "Dein Ecokart Verification Code"
    email_message        = "Willkommen bei Ecokart! Dein Verification Code ist: {####}"
  }

  # ----------------------------------------------------------------
  # Account Recovery
  # ----------------------------------------------------------------
  # Wie kann User sein Password zurücksetzen?
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"  # Email mit Reset-Code
      priority = 1                 # Primäre Methode
    }
  }

  # ----------------------------------------------------------------
  # MFA Configuration (OPTIONAL)
  # ----------------------------------------------------------------
  # Multi-Factor Authentication
  # OFF = Kein MFA (für Development)
  # OPTIONAL = User kann MFA aktivieren
  # ON = MFA Pflicht
  mfa_configuration = "OFF"  # Für unser Showcase: OFF

  # ----------------------------------------------------------------
  # User Pool Tags
  # ----------------------------------------------------------------
  # Für AWS Cost Explorer & Organization
  tags = {
    Name        = "${var.project_name}-user-pool"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# ----------------------------------------------------------------
# 2. COGNITO USER POOL CLIENT (App Client)
# ----------------------------------------------------------------
# Das ist wie ein "API Key" für unsere Frontend-App
# Frontend nutzt diesen Client um mit Cognito zu sprechen

resource "aws_cognito_user_pool_client" "frontend" {
  # Name des Clients (z.B. "ecokart-development-frontend-client")
  name         = "${var.project_name}-${var.environment}-frontend-client"
  user_pool_id = aws_cognito_user_pool.main.id

  # ----------------------------------------------------------------
  # Client Permissions
  # ----------------------------------------------------------------
  # Was darf dieser Client machen?
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",      # Email + Password Login
    "ALLOW_REFRESH_TOKEN_AUTH",      # Token erneuern ohne Re-Login
    "ALLOW_USER_SRP_AUTH"            # Secure Remote Password (sicherer)
  ]

  # ----------------------------------------------------------------
  # Token Settings
  # ----------------------------------------------------------------
  # Wie lange sind Tokens gültig?
  id_token_validity      = 60        # ID Token: 60 Minuten
  access_token_validity  = 60        # Access Token: 60 Minuten
  refresh_token_validity = 7         # Refresh Token: 7 Tage

  # Einheit für Token Validity
  token_validity_units {
    id_token      = "minutes"
    access_token  = "minutes"
    refresh_token = "days"
  }

  # ----------------------------------------------------------------
  # Prevent User Existence Errors
  # ----------------------------------------------------------------
  # Sicherheit: Nicht verraten ob Email existiert oder nicht
  # "ENABLED" = Immer gleiche Error Message
  # Verhindert: Angreifer testen ob Email registriert ist
  prevent_user_existence_errors = "ENABLED"

  # ----------------------------------------------------------------
  # OAuth Settings (für Social Login - später)
  # ----------------------------------------------------------------
  # Aktuell: Nur Email/Password
  # Später: Google, Facebook Login möglich
  # allowed_oauth_flows = ["code"]
  # allowed_oauth_scopes = ["email", "openid", "profile"]

  # Kein Client Secret nötig (Public Client = Frontend App)
  generate_secret = false
}

# ----------------------------------------------------------------
# 3. COGNITO USER POOL DOMAIN (OPTIONAL)
# ----------------------------------------------------------------
# Erstellt eine Hosted UI für Login/Sign Up
# URL: https://{domain}.auth.{region}.amazoncognito.com
#
# Aktuell: NICHT genutzt (wir bauen eigene UI)
# Später: Nützlich für Quick Prototyping

# Auskommentiert - nur wenn Hosted UI gewünscht
# resource "aws_cognito_user_pool_domain" "main" {
#   domain       = "${var.project_name}-${var.environment}"
#   user_pool_id = aws_cognito_user_pool.main.id
# }

# ----------------------------------------------------------------
# 4. DEFAULT ADMIN USER (OPTIONAL)
# ----------------------------------------------------------------
# Erstellt einen Admin-User automatisch
# Nützlich für Testing
#
# WICHTIG: Nur für Development!
# Production: Admin wird manuell erstellt

# TODO: Später hinzufügen via null_resource + AWS CLI
# resource "null_resource" "create_admin_user" {
#   provisioner "local-exec" {
#     command = <<EOF
#       aws cognito-idp admin-create-user \
#         --user-pool-id ${aws_cognito_user_pool.main.id} \
#         --username admin@ecokart.com \
#         --user-attributes Name=email,Value=admin@ecokart.com Name=custom:role,Value=admin \
#         --temporary-password "TempPass123!" \
#         --message-action SUPPRESS
#     EOF
#   }
#
#   depends_on = [aws_cognito_user_pool.main]
# }

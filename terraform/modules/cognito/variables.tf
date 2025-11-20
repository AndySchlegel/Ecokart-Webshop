# ================================================================
# Cognito Module - Input Variables
# ================================================================
#
# Diese Variablen werden beim Aufruf des Moduls übergeben
#
# Beispiel Nutzung:
# module "cognito" {
#   source       = "./modules/cognito"
#   project_name = "ecokart"
#   environment  = "development"
# }
# ================================================================

# ----------------------------------------------------------------
# Projekt-Name
# ----------------------------------------------------------------
# Wird für Naming verwendet: {project_name}-{environment}-users
# Beispiel: "ecokart" → "ecokart-development-users"

variable "project_name" {
  description = "Name des Projekts (z.B. 'ecokart')"
  type        = string

  validation {
    condition     = length(var.project_name) > 0 && length(var.project_name) <= 20
    error_message = "Project name muss zwischen 1 und 20 Zeichen sein"
  }
}

# ----------------------------------------------------------------
# Environment
# ----------------------------------------------------------------
# Welche Umgebung? development, staging, production
# Wird für Naming und Tagging verwendet

variable "environment" {
  description = "Environment (development, staging, production)"
  type        = string

  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment muss development, staging oder production sein"
  }
}

# ----------------------------------------------------------------
# Optional: Custom Domain für Hosted UI
# ----------------------------------------------------------------
# Falls du die Cognito Hosted UI nutzen willst
# Beispiel: "ecokart-dev" → https://ecokart-dev.auth.eu-north-1.amazoncognito.com
#
# Aktuell nicht genutzt (eigene Login-UI)

variable "cognito_domain_prefix" {
  description = "Domain Prefix für Cognito Hosted UI (optional)"
  type        = string
  default     = ""  # Leer = keine Hosted UI
}

# ----------------------------------------------------------------
# Optional: MFA Configuration
# ----------------------------------------------------------------
# Multi-Factor Authentication
# OFF, OPTIONAL, ON

variable "mfa_configuration" {
  description = "MFA Configuration (OFF, OPTIONAL, ON)"
  type        = string
  default     = "OFF"  # Standard: Kein MFA

  validation {
    condition     = contains(["OFF", "OPTIONAL", "ON"], var.mfa_configuration)
    error_message = "MFA muss OFF, OPTIONAL oder ON sein"
  }
}

# ----------------------------------------------------------------
# Optional: Email Sending Limit
# ----------------------------------------------------------------
# COGNITO_DEFAULT = 50 Emails/Tag (FREE)
# DEVELOPER = Eigenes SES (unbegrenzt aber Setup nötig)

variable "email_sending_account" {
  description = "Email Sending Account (COGNITO_DEFAULT oder DEVELOPER)"
  type        = string
  default     = "COGNITO_DEFAULT"

  validation {
    condition     = contains(["COGNITO_DEFAULT", "DEVELOPER"], var.email_sending_account)
    error_message = "Muss COGNITO_DEFAULT oder DEVELOPER sein"
  }
}

# ----------------------------------------------------------------
# Optional: Password Policy
# ----------------------------------------------------------------
# Falls du andere Password Requirements willst

variable "password_minimum_length" {
  description = "Minimale Password-Länge"
  type        = number
  default     = 8

  validation {
    condition     = var.password_minimum_length >= 6 && var.password_minimum_length <= 99
    error_message = "Password muss zwischen 6 und 99 Zeichen sein"
  }
}

variable "password_require_symbols" {
  description = "Password muss Symbole enthalten? (!@#$%)"
  type        = bool
  default     = false  # Für bessere UX: false
}

# ----------------------------------------------------------------
# Optional: Tags
# ----------------------------------------------------------------
# Zusätzliche AWS Tags für Cognito Resources

variable "tags" {
  description = "Zusätzliche Tags für Cognito Resources"
  type        = map(string)
  default     = {}
}

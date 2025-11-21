# ============================================================================
# Terraform Variables - Ecokart AWS Infrastruktur
# ============================================================================
# Diese Variablen definieren alle konfigurierbaren Parameter des Moduls.
# Sinnvolle Defaults sind gesetzt, kritische Werte müssen vom Nutzer ergänzt werden.

# ----------------------------------------------------------------------------
# Allgemeine Konfiguration
# ----------------------------------------------------------------------------

variable "aws_region" {
  description = "AWS Region für die Infrastruktur (Stockholm empfohlen für EU-Compliance)"
  type        = string
  default     = "eu-north-1"
}

variable "project_name" {
  description = "Name des Projekts (wird für Resource-Naming verwendet)"
  type        = string
  default     = "ecokart"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]*$", var.project_name))
    error_message = "Projekt-Name muss mit Kleinbuchstaben beginnen und darf nur a-z, 0-9 und - enthalten."
  }
}

variable "environment" {
  description = "Umgebung (development, staging, production)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment muss development, staging oder production sein."
  }
}

# ----------------------------------------------------------------------------
# DynamoDB Konfiguration
# ----------------------------------------------------------------------------

variable "dynamodb_billing_mode" {
  description = "DynamoDB Billing Mode (PROVISIONED oder PAY_PER_REQUEST)"
  type        = string
  default     = "PROVISIONED"

  validation {
    condition     = contains(["PROVISIONED", "PAY_PER_REQUEST"], var.dynamodb_billing_mode)
    error_message = "Billing Mode muss PROVISIONED oder PAY_PER_REQUEST sein."
  }
}

variable "dynamodb_read_capacity" {
  description = "Read Capacity Units für DynamoDB (nur bei PROVISIONED Mode)"
  type        = number
  default     = 5
}

variable "dynamodb_write_capacity" {
  description = "Write Capacity Units für DynamoDB (nur bei PROVISIONED Mode)"
  type        = number
  default     = 5
}

variable "enable_point_in_time_recovery" {
  description = "Point-in-Time Recovery für DynamoDB aktivieren (empfohlen für Production)"
  type        = bool
  default     = false # In Production auf true setzen!
}

# ----------------------------------------------------------------------------
# Lambda Konfiguration
# ----------------------------------------------------------------------------

variable "lambda_runtime" {
  description = "Node.js Runtime Version für Lambda"
  type        = string
  default     = "nodejs20.x"
}

variable "lambda_memory_size" {
  description = "Memory Size in MB für Lambda Function"
  type        = number
  default     = 512

  validation {
    condition     = var.lambda_memory_size >= 128 && var.lambda_memory_size <= 10240
    error_message = "Lambda Memory muss zwischen 128 und 10240 MB liegen."
  }
}

variable "lambda_timeout" {
  description = "Timeout in Sekunden für Lambda Function"
  type        = number
  default     = 30

  validation {
    condition     = var.lambda_timeout >= 1 && var.lambda_timeout <= 900
    error_message = "Lambda Timeout muss zwischen 1 und 900 Sekunden liegen."
  }
}

variable "jwt_secret" {
  description = "JWT Secret für Token-Signierung (ERFORDERLICH - Production-Wert verwenden!)"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.jwt_secret) >= 32
    error_message = "JWT Secret muss mindestens 32 Zeichen lang sein."
  }
}

variable "lambda_source_path" {
  description = "Pfad zum Lambda-Quellcode (relativ zum Terraform-Root)"
  type        = string
  default     = "../backend"
}

# ----------------------------------------------------------------------------
# API Gateway Konfiguration
# ----------------------------------------------------------------------------

variable "api_gateway_stage_name" {
  description = "API Gateway Stage Name"
  type        = string
  default     = "Prod"
}

variable "enable_api_gateway_access_logs" {
  description = "CloudWatch Access Logs für API Gateway aktivieren"
  type        = bool
  default     = false # In Production auf true setzen!
}

# ----------------------------------------------------------------------------
# Amplify Konfiguration
# ----------------------------------------------------------------------------

variable "enable_amplify" {
  description = "AWS Amplify Hosting erstellen (benötigt GitHub Zugriff)"
  type        = bool
  default     = false # Nur aktivieren wenn GitHub Token verfügbar ist
}

variable "github_repository" {
  description = "GitHub Repository URL (z.B. 'https://github.com/AndySchlegel/Ecokart-Webshop')"
  type        = string
  default     = ""

  validation {
    condition     = can(regex("^https://github\\.com/[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+$", var.github_repository)) || var.github_repository == ""
    error_message = "Repository muss eine vollständige GitHub URL sein (z.B. 'https://github.com/AndySchlegel/Ecokart-Webshop')"
  }
}

variable "github_branch" {
  description = <<-EOT
    GitHub Branch für Amplify Auto-Deploy (Fallback-Wert).

    HINWEIS: Wird automatisch überschrieben durch Environment-Mapping:
    - development → develop
    - staging     → staging
    - production  → main

    Dieser Wert wird nur verwendet wenn Environment nicht gemappt ist.
  EOT
  type        = string
  default     = "main"
}

variable "github_access_token" {
  description = "GitHub Personal Access Token für Amplify (ERFORDERLICH wenn enable_amplify=true)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "amplify_framework" {
  description = "Frontend Framework für Amplify"
  type        = string
  default     = "Next.js - SSR"
}

variable "amplify_build_command" {
  description = "Build Command für Amplify"
  type        = string
  default     = "npm run build"
}

variable "amplify_monorepo_app_root" {
  description = "Monorepo App Root (wenn Frontend in Unterordner liegt)"
  type        = string
  default     = "frontend"
}

variable "basic_auth_enabled" {
  description = "Basic Authentication für Amplify aktivieren (Demo-Schutz)"
  type        = bool
  default     = false
}

variable "basic_auth_user" {
  description = "Basic Auth Username"
  type        = string
  default     = "demo"
}

variable "basic_auth_password" {
  description = "Basic Auth Password"
  type        = string
  sensitive   = true
  default     = ""
}

# ----------------------------------------------------------------------------
# Admin Frontend Amplify Konfiguration
# ----------------------------------------------------------------------------

variable "enable_admin_amplify" {
  description = "AWS Amplify Hosting für Admin Frontend erstellen"
  type        = bool
  default     = false # Nur aktivieren wenn Admin-Frontend deployed werden soll
}

variable "admin_amplify_framework" {
  description = "Frontend Framework für Admin Amplify"
  type        = string
  default     = "Next.js - SSR"
}

variable "admin_amplify_build_command" {
  description = "Build Command für Admin Amplify"
  type        = string
  default     = "npm run build"
}

variable "admin_amplify_monorepo_app_root" {
  description = "Monorepo App Root für Admin Frontend"
  type        = string
  default     = "admin-frontend"
}

variable "admin_basic_auth_enabled" {
  description = "Basic Authentication für Admin Amplify aktivieren (STARK EMPFOHLEN)"
  type        = bool
  default     = true # Standard: aktiviert für Admin-Schutz
}

variable "admin_basic_auth_user" {
  description = "Basic Auth Username für Admin Frontend"
  type        = string
  default     = "admin"
}

variable "admin_basic_auth_password" {
  description = "Basic Auth Password für Admin Frontend"
  type        = string
  sensitive   = true
  default     = ""
}

# ============================================================================
# COGNITO USER AUTHENTICATION
# ============================================================================
# AWS Cognito User Pool für User-Management und Authentication
# Ersetzt JWT-basierte Authentication durch AWS-managed Lösung
# ============================================================================

# ----------------------------------------------------------------------------
# Cognito API Gateway Integration
# ----------------------------------------------------------------------------

variable "enable_cognito_auth" {
  description = <<-EOT
    API Gateway Cognito Authorizer aktivieren?

    true  = Cognito Token-Validation auf API Gateway Ebene
    false = Keine Cognito-Auth (nur für Development/Testing)

    Empfehlung: true für alle Environments
    (nur false wenn du reines Public API ohne Auth testen willst)
  EOT
  type        = bool
  default     = true
}

# ----------------------------------------------------------------------------
# Database Seeding
# ----------------------------------------------------------------------------

variable "enable_auto_seed" {
  description = "Automatisches DynamoDB Seeding aktivieren (erstellt Test-Daten beim Deploy)"
  type        = bool
  default     = true
}

# ----------------------------------------------------------------------------
# Tagging
# ----------------------------------------------------------------------------

variable "additional_tags" {
  description = "Zusätzliche Tags für alle Ressourcen"
  type        = map(string)
  default     = {}
}

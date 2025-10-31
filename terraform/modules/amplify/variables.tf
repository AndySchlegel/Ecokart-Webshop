# ============================================================================
# Amplify Module Variables
# ============================================================================

variable "project_name" {
  description = "Name des Projekts"
  type        = string
}

variable "environment" {
  description = "Umgebung (development, staging, production)"
  type        = string
}

variable "app_name" {
  description = "Name der Amplify App"
  type        = string
}

# ----------------------------------------------------------------------------
# GitHub Integration
# ----------------------------------------------------------------------------

variable "repository" {
  description = "GitHub Repository URL (vollständige HTTPS URL, z.B. 'https://github.com/AndySchlegel/Ecokart-Webshop')"
  type        = string

  validation {
    condition     = can(regex("^https://github\\.com/[a-zA-Z0-9_-]+/[a-zA-Z0-9_.-]+$", var.repository))
    error_message = "Repository muss eine vollständige GitHub HTTPS URL sein (z.B. 'https://github.com/owner/repo')"
  }
}

variable "branch_name" {
  description = "GitHub Branch für Auto-Deploy"
  type        = string
  default     = "main"
}

variable "github_access_token" {
  description = "GitHub Personal Access Token"
  type        = string
  sensitive   = true
}

# ----------------------------------------------------------------------------
# Build Configuration
# ----------------------------------------------------------------------------

variable "framework" {
  description = "Frontend Framework"
  type        = string
  default     = "Next.js - SSR"
}

variable "build_command" {
  description = "Build Command"
  type        = string
  default     = "npm run build"
}

variable "monorepo_app_root" {
  description = "Monorepo App Root (wenn Frontend in Unterordner)"
  type        = string
  default     = "frontend"
}

# ----------------------------------------------------------------------------
# Environment Variables
# ----------------------------------------------------------------------------

variable "environment_variables" {
  description = "Environment Variables für Amplify App"
  type        = map(string)
  default     = {}
}

# ----------------------------------------------------------------------------
# Basic Authentication
# ----------------------------------------------------------------------------

variable "enable_basic_auth" {
  description = "Basic Authentication aktivieren"
  type        = bool
  default     = false
}

variable "basic_auth_credentials" {
  description = "Basic Auth Credentials (username + password)"
  type = object({
    username = string
    password = string
  })
  sensitive = true
  default   = null
}

# ----------------------------------------------------------------------------
# AWS Region
# ----------------------------------------------------------------------------

variable "aws_region" {
  description = "AWS Region für Amplify (benötigt für Auto-Build Trigger)"
  type        = string
  default     = "eu-north-1"
}

# ----------------------------------------------------------------------------
# Tagging
# ----------------------------------------------------------------------------

variable "tags" {
  description = "Tags für alle Amplify Ressourcen"
  type        = map(string)
  default     = {}
}

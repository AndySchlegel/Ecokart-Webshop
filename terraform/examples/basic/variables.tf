# ============================================================================
# Beispiel: Variables
# ============================================================================

variable "aws_region" {
  description = "AWS Region"
  type        = string
  default     = "eu-north-1"
}

variable "project_name" {
  description = "Projekt Name"
  type        = string
  default     = "ecokart"
}

variable "environment" {
  description = "Environment (development, staging, production)"
  type        = string
  default     = "development"
}

variable "jwt_secret" {
  description = "JWT Secret für Token-Signierung (min. 32 Zeichen)"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.jwt_secret) >= 32
    error_message = "JWT Secret muss mindestens 32 Zeichen lang sein."
  }
}

variable "lambda_source_path" {
  description = "Pfad zum Lambda Source Code"
  type        = string
  default     = "../../../backend"  # Relativer Pfad von examples/basic/
}

# Optional: Amplify Variables (wenn enable_amplify=true)
variable "github_access_token" {
  description = "GitHub Access Token (nur benötigt wenn Amplify aktiviert)"
  type        = string
  sensitive   = true
  default     = ""
}

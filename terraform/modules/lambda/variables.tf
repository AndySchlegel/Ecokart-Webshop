# ============================================================================
# Lambda Module Variables
# ============================================================================

variable "project_name" {
  description = "Name des Projekts"
  type        = string
}

variable "environment" {
  description = "Umgebung (development, staging, production)"
  type        = string
}

variable "function_name" {
  description = "Name der Lambda Function"
  type        = string
}

# ----------------------------------------------------------------------------
# Lambda Configuration
# ----------------------------------------------------------------------------

variable "runtime" {
  description = "Lambda Runtime (z.B. nodejs20.x)"
  type        = string
  default     = "nodejs20.x"
}

variable "memory_size" {
  description = "Memory Size in MB"
  type        = number
  default     = 512
}

variable "timeout" {
  description = "Timeout in Sekunden"
  type        = number
  default     = 30
}

variable "source_path" {
  description = "Pfad zum Lambda Source Code (Backend-Verzeichnis)"
  type        = string
}

variable "environment_variables" {
  description = "Environment Variables für Lambda Function"
  type        = map(string)
  default     = {}
}

# ----------------------------------------------------------------------------
# IAM Configuration
# ----------------------------------------------------------------------------

variable "dynamodb_table_arns" {
  description = "ARNs der DynamoDB Tables (für IAM Permissions)"
  type        = list(string)
}

# ----------------------------------------------------------------------------
# API Gateway Configuration
# ----------------------------------------------------------------------------

variable "api_stage_name" {
  description = "API Gateway Stage Name"
  type        = string
  default     = "Prod"
}

variable "enable_access_logs" {
  description = "CloudWatch Access Logs für API Gateway aktivieren"
  type        = bool
  default     = false
}

# ----------------------------------------------------------------------------
# Tagging
# ----------------------------------------------------------------------------

variable "tags" {
  description = "Tags für alle Ressourcen"
  type        = map(string)
  default     = {}
}

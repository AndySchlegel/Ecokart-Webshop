# ============================================================================
# Variables for GitHub Actions OIDC Setup
# ============================================================================

variable "aws_account_id" {
  description = "AWS Account ID"
  type        = string
  default     = "729403197965"
}

variable "aws_region" {
  description = "AWS Region for deployment"
  type        = string
  default     = "eu-north-1"
}

variable "project_name" {
  description = "Project name (used for resource naming)"
  type        = string
  default     = "ecokart"
}

variable "github_repo" {
  description = "GitHub repository in format 'owner/repo'"
  type        = string
  default     = "AndySchlegel/Ecokart-Webshop"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "all"
}

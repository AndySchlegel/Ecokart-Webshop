# ============================================================================
# Variables for GitHub Actions IAM Role Module
# ============================================================================

variable "role_name" {
  description = "Name of the IAM role for GitHub Actions"
  type        = string
  default     = "ecokart-github-actions-role"
}

variable "github_repo" {
  description = "GitHub repository in format 'owner/repo' (e.g., 'AndySchlegel/Ecokart-Webshop')"
  type        = string
}

variable "aws_region" {
  description = "AWS region for resource ARNs"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

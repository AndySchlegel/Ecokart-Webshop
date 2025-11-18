# ============================================================================
# AWS Provider Configuration
# ============================================================================

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      ManagedBy   = "Terraform"
      Purpose     = "GitHub Actions OIDC Setup"
      Repository  = var.github_repo
    }
  }
}

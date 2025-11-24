# ============================================================================
# GitHub Actions IAM Role
# ============================================================================
# This role is used by GitHub Actions workflows via OIDC authentication
# to deploy and manage Ecokart infrastructure.
# ============================================================================

data "aws_caller_identity" "current" {}

# GitHub OIDC Provider ARN
# Hardcoded instead of data source to avoid needing iam:ListOpenIDConnectProviders permission
# The OIDC Provider must already exist in AWS (created via Bootstrap workflow)
locals {
  github_oidc_provider_arn = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/token.actions.githubusercontent.com"
}

# IAM Role for GitHub Actions
resource "aws_iam_role" "github_actions" {
  name        = var.role_name
  description = "IAM Role for GitHub Actions to deploy Ecokart infrastructure"

  # Trust relationship - allows GitHub Actions to assume this role
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = local.github_oidc_provider_arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = "repo:${var.github_repo}:*"
          }
        }
      }
    ]
  })

  max_session_duration = 3600 # 1 hour

  tags = merge(
    var.tags,
    {
      Name        = var.role_name
      ManagedBy   = "Terraform"
      Description = "GitHub Actions deployment role"
    }
  )
}

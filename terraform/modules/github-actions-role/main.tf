# ============================================================================
# GitHub Actions IAM Role
# ============================================================================
# This role is used by GitHub Actions workflows via OIDC authentication
# to deploy and manage Ecokart infrastructure.
# ============================================================================

data "aws_caller_identity" "current" {}

# GitHub OIDC Provider (must exist already)
data "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
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
          Federated = data.aws_iam_openid_connect_provider.github.arn
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

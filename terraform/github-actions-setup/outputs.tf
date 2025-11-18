# ============================================================================
# Outputs - Diese Werte brauchst du für GitHub Secrets!
# ============================================================================

output "github_actions_role_arn" {
  description = "ARN der IAM Role für GitHub Actions (füge das als GitHub Secret hinzu)"
  value       = aws_iam_role.github_actions.arn
}

output "github_actions_role_name" {
  description = "Name der IAM Role"
  value       = aws_iam_role.github_actions.name
}

output "oidc_provider_arn" {
  description = "ARN des GitHub OIDC Providers"
  value       = aws_iam_openid_connect_provider.github_actions.arn
}

output "next_steps" {
  description = "Nächste Schritte nach dem Apply"
  value       = <<-EOT

  ✅ OIDC Setup erfolgreich!

  📋 NÄCHSTE SCHRITTE:

  1️⃣ Gehe zu GitHub Repository Settings:
     https://github.com/${var.github_repo}/settings/secrets/actions

  2️⃣ Füge dieses Secret hinzu:
     Name:  AWS_ROLE_ARN
     Value: ${aws_iam_role.github_actions.arn}

  3️⃣ GitHub Token in AWS Parameter Store speichern:
     aws ssm put-parameter \
       --name "/${var.project_name}/github-token" \
       --value "ghp_YOUR_TOKEN_HERE" \
       --type "SecureString" \
       --region ${var.aws_region}

  4️⃣ Push zu develop Branch → Automatisches Deployment! 🚀

  EOT
}

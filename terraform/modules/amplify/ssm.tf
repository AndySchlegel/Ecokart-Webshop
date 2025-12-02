# ============================================================================
# SSM Parameter for Frontend URL
# ============================================================================
# Schreibt Amplify URL in SSM Parameter Store für Lambda Stripe Redirects
# Terraform setzt das automatisch statt Amplify Build postBuild Script

resource "aws_ssm_parameter" "frontend_url" {
  name        = "/ecokart/${var.environment}/frontend-url"
  description = "Amplify Frontend URL for Stripe redirects"
  type        = "String"
  value       = "https://${var.branch_name}.${aws_amplify_app.frontend.id}.amplifyapp.com"

  tags = var.tags

  # Depends on: App muss existieren bevor URL gesetzt wird
  depends_on = [aws_amplify_app.frontend]
}

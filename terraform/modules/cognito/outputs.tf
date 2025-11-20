# ================================================================
# Cognito Module - Outputs
# ================================================================
#
# Diese Werte werden vom Modul zurückgegeben
# und können in anderen Modulen verwendet werden
#
# Beispiel Nutzung:
# module.cognito.user_pool_id
# module.cognito.user_pool_client_id
# ================================================================

# ----------------------------------------------------------------
# User Pool ID
# ----------------------------------------------------------------
# Die ID des erstellten Cognito User Pools
# Format: eu-north-1_XXXXXXXXX
#
# Wird gebraucht für:
# - API Gateway Authorizer
# - Frontend Configuration
# - AWS CLI Commands

output "user_pool_id" {
  description = "ID des Cognito User Pools"
  value       = aws_cognito_user_pool.main.id
}

# ----------------------------------------------------------------
# User Pool ARN
# ----------------------------------------------------------------
# Amazon Resource Name (vollständiger AWS-Pfad)
# Format: arn:aws:cognito-idp:eu-north-1:123456789:userpool/eu-north-1_XXXX
#
# Wird gebraucht für:
# - API Gateway Authorizer
# - IAM Policies

output "user_pool_arn" {
  description = "ARN des Cognito User Pools"
  value       = aws_cognito_user_pool.main.arn
}

# ----------------------------------------------------------------
# User Pool Client ID
# ----------------------------------------------------------------
# Die ID des App Clients (für Frontend)
# Format: XXXXXXXXXXXXXXXXXXXXXXXXXXX (26 Zeichen)
#
# Wird gebraucht für:
# - Frontend Amplify Configuration
# - Mobile Apps
#
# WICHTIG: Das ist KEIN Secret! Client ID ist public.

output "user_pool_client_id" {
  description = "ID des Cognito User Pool Clients (für Frontend)"
  value       = aws_cognito_user_pool_client.frontend.id
}

# ----------------------------------------------------------------
# User Pool Endpoint
# ----------------------------------------------------------------
# Die URL des Cognito Endpoints
# Format: cognito-idp.eu-north-1.amazonaws.com/eu-north-1_XXXX
#
# Wird gebraucht für:
# - Custom API Calls
# - Debugging

output "user_pool_endpoint" {
  description = "Endpoint URL des Cognito User Pools"
  value       = aws_cognito_user_pool.main.endpoint
}

# ----------------------------------------------------------------
# User Pool Name
# ----------------------------------------------------------------
# Der Name wie in main.tf definiert
# Beispiel: "ecokart-development-users"
#
# Nützlich für:
# - Logging
# - AWS Console Navigation

output "user_pool_name" {
  description = "Name des Cognito User Pools"
  value       = aws_cognito_user_pool.main.name
}

# ----------------------------------------------------------------
# Region
# ----------------------------------------------------------------
# In welcher AWS Region liegt der User Pool?
# Beispiel: "eu-north-1"
#
# WICHTIG für Frontend Configuration!

output "region" {
  description = "AWS Region des User Pools"
  value       = data.aws_region.current.name
}

# Data Source für Region
data "aws_region" "current" {}

# ----------------------------------------------------------------
# Optional: Hosted UI URL
# ----------------------------------------------------------------
# Falls Hosted UI aktiviert ist
# Format: https://{domain}.auth.{region}.amazoncognito.com
#
# Aktuell auskommentiert (eigene Login-UI)

# output "hosted_ui_url" {
#   description = "URL der Cognito Hosted UI"
#   value       = aws_cognito_user_pool_domain.main != null ? "https://${aws_cognito_user_pool_domain.main.domain}.auth.${data.aws_region.current.name}.amazoncognito.com" : null
# }

# ----------------------------------------------------------------
# Frontend Environment Variables (Hilfe)
# ----------------------------------------------------------------
# Zusammenfassung aller Werte die das Frontend braucht
# Kann kopiert werden in .env.local

output "frontend_env_vars" {
  description = "Environment Variables für Frontend (.env.local)"
  value = <<-EOT
    # Cognito Configuration
    NEXT_PUBLIC_USER_POOL_ID=${aws_cognito_user_pool.main.id}
    NEXT_PUBLIC_USER_POOL_CLIENT_ID=${aws_cognito_user_pool_client.frontend.id}
    NEXT_PUBLIC_AWS_REGION=${data.aws_region.current.name}
  EOT
}

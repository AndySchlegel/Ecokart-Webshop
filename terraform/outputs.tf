# ============================================================================
# Terraform Outputs - Ecokart AWS Infrastruktur
# ============================================================================
# Diese Outputs liefern wichtige Informationen über die erstellten Ressourcen.

# ----------------------------------------------------------------------------
# DynamoDB Outputs
# ----------------------------------------------------------------------------

output "dynamodb_table_names" {
  description = "Namen aller erstellten DynamoDB Tabellen"
  value       = module.dynamodb.table_names
}

output "dynamodb_table_arns" {
  description = "ARNs aller erstellten DynamoDB Tabellen"
  value       = module.dynamodb.table_arns
}

output "products_table_name" {
  description = "Name der Products Tabelle"
  value       = module.dynamodb.products_table_name
}

output "users_table_name" {
  description = "Name der Users Tabelle"
  value       = module.dynamodb.users_table_name
}

output "carts_table_name" {
  description = "Name der Carts Tabelle"
  value       = module.dynamodb.carts_table_name
}

output "orders_table_name" {
  description = "Name der Orders Tabelle"
  value       = module.dynamodb.orders_table_name
}

# ----------------------------------------------------------------------------
# Lambda Outputs
# ----------------------------------------------------------------------------

output "lambda_function_name" {
  description = "Name der Lambda Function"
  value       = module.lambda.function_name
}

output "lambda_function_arn" {
  description = "ARN der Lambda Function"
  value       = module.lambda.function_arn
}

output "lambda_invoke_arn" {
  description = "Invoke ARN der Lambda Function"
  value       = module.lambda.invoke_arn
}

output "lambda_role_arn" {
  description = "ARN der Lambda Execution Role"
  value       = module.lambda.role_arn
}

# ----------------------------------------------------------------------------
# API Gateway Outputs
# ----------------------------------------------------------------------------

output "api_gateway_url" {
  description = "API Gateway Endpoint URL (Basis-URL für Frontend)"
  value       = module.lambda.api_gateway_url
}

output "api_gateway_id" {
  description = "ID des API Gateway REST API"
  value       = module.lambda.api_gateway_id
}

output "api_gateway_stage" {
  description = "API Gateway Stage Name"
  value       = var.api_gateway_stage_name
}

# ----------------------------------------------------------------------------
# Amplify Outputs (conditional)
# ----------------------------------------------------------------------------

output "amplify_app_id" {
  description = "Amplify App ID (nur wenn enable_amplify=true)"
  value       = var.enable_amplify ? module.amplify[0].app_id : null
}

output "amplify_app_url" {
  description = "Amplify App URL (nur wenn enable_amplify=true)"
  value       = var.enable_amplify ? module.amplify[0].default_domain : null
}

output "amplify_branch_url" {
  description = "Amplify Branch URL (nur wenn enable_amplify=true)"
  value       = var.enable_amplify ? module.amplify[0].branch_url : null
}

# ----------------------------------------------------------------------------
# Admin Amplify Outputs (conditional)
# ----------------------------------------------------------------------------

output "admin_amplify_app_id" {
  description = "Admin Amplify App ID (nur wenn enable_admin_amplify=true)"
  value       = var.enable_admin_amplify ? module.amplify_admin[0].app_id : null
}

output "admin_amplify_app_url" {
  description = "Admin Amplify App URL (nur wenn enable_admin_amplify=true)"
  value       = var.enable_admin_amplify ? module.amplify_admin[0].default_domain : null
}

output "admin_amplify_branch_url" {
  description = "Admin Amplify Branch URL (nur wenn enable_admin_amplify=true)"
  value       = var.enable_admin_amplify ? module.amplify_admin[0].branch_url : null
}

# ----------------------------------------------------------------------------
# Setup Instructions
# ----------------------------------------------------------------------------

output "setup_complete" {
  description = "Nächste Schritte nach Terraform Apply"
  value = <<-EOT

    ╔═══════════════════════════════════════════════════════════════════╗
    ║                    Ecokart AWS Deployment                         ║
    ║                      Setup erfolgreich!                           ║
    ╚═══════════════════════════════════════════════════════════════════╝

    📋 Erstellte Ressourcen:
    ────────────────────────────────────────────────────────────────────

    DynamoDB Tables:
      • ecokart-products  (${module.dynamodb.products_table_name})
      • ecokart-users     (${module.dynamodb.users_table_name})
      • ecokart-carts     (${module.dynamodb.carts_table_name})
      • ecokart-orders    (${module.dynamodb.orders_table_name})

    Lambda Backend:
      • Function: ${module.lambda.function_name}
      • Runtime:  ${var.lambda_runtime}
      • Memory:   ${var.lambda_memory_size} MB

    API Gateway:
      • URL: ${module.lambda.api_gateway_url}
      • Stage: ${var.api_gateway_stage_name}

    ${var.enable_amplify ? "Amplify Frontend:\n      • App URL: ${module.amplify[0].default_domain}\n      • Branch: ${var.github_branch}" : ""}

    ${var.enable_admin_amplify ? "Admin Frontend:\n      • App URL: ${module.amplify_admin[0].default_domain}\n      • Branch: ${var.github_branch}" : ""}

    🚀 Nächste Schritte:
    ────────────────────────────────────────────────────────────────────

    1. DynamoDB mit Daten füllen:
       cd ../../../backend
       npm run dynamodb:migrate:single -- --region ${var.aws_region}

    2. Testuser erstellen (optional):
       cd ../../../backend
       node scripts/create-test-user.js
       → Login: demo@ecokart.com / Demo1234!

    3. API testen:
       curl ${module.lambda.api_gateway_url}api/products

    4. Frontend Environment Variable setzen:
       NEXT_PUBLIC_API_URL=${module.lambda.api_gateway_url}

    ${var.enable_amplify || var.enable_admin_amplify ? "5. GitHub-Verbindung herstellen (EINMALIG!):\n       ../../scripts/connect-github.sh\n       → Öffnet automatisch die AWS Console URLs\n       → Klicke \"Reconnect repository\" für jede App\n       → Nach Verbindung starten Builds automatisch\n" : ""}
    📚 Dokumentation:
    ────────────────────────────────────────────────────────────────────
    Siehe terraform/README.md für Details

    ⚠️  Sicherheitshinweise:
    ────────────────────────────────────────────────────────────────────
    • JWT Secret in Production ändern!
    • Point-in-Time Recovery aktivieren (DynamoDB)
    • CloudWatch Logs aktivieren (API Gateway)
    • CORS auf Frontend-Domain beschränken

  EOT
}

# ----------------------------------------------------------------------------
# Quick Reference
# ----------------------------------------------------------------------------

output "quick_reference" {
  description = "Schnellreferenz für wichtige Befehle"
  value = {
    api_base_url          = module.lambda.api_gateway_url
    test_api              = "curl ${module.lambda.api_gateway_url}api/products"
    lambda_logs           = "aws logs tail /aws/lambda/${module.lambda.function_name} --follow --region ${var.aws_region}"
    dynamodb_scan         = "aws dynamodb scan --table-name ${module.dynamodb.products_table_name} --region ${var.aws_region}"
    amplify_app_id        = var.enable_amplify ? module.amplify[0].app_id : "N/A (enable_amplify=false)"
    admin_amplify_app_id  = var.enable_admin_amplify ? module.amplify_admin[0].app_id : "N/A (enable_admin_amplify=false)"
    update_lambda         = "cd ../backend && npm run build && terraform apply -target=module.lambda"
    connect_github        = "../../scripts/connect-github.sh (from terraform/examples/basic/)"
  }
}

# ----------------------------------------------------------------------------
# AWS Console URLs
# ----------------------------------------------------------------------------

output "aws_console_urls" {
  description = "AWS Console URLs für manuelle Schritte"
  value = {
    customer_amplify_console = var.enable_amplify ? "https://${var.aws_region}.console.aws.amazon.com/amplify/home?region=${var.aws_region}#/${module.amplify[0].app_id}" : "N/A"
    admin_amplify_console    = var.enable_admin_amplify ? "https://${var.aws_region}.console.aws.amazon.com/amplify/home?region=${var.aws_region}#/${module.amplify_admin[0].app_id}" : "N/A"
    lambda_console           = "https://${var.aws_region}.console.aws.amazon.com/lambda/home?region=${var.aws_region}#/functions/${module.lambda.function_name}"
    dynamodb_console         = "https://${var.aws_region}.console.aws.amazon.com/dynamodbv2/home?region=${var.aws_region}#tables"
  }
}

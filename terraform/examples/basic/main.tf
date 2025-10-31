# ============================================================================
# Beispiel: Ecokart Terraform Module - Basic Deployment
# ============================================================================
# Dieses Beispiel zeigt die einfachste Nutzung des Ecokart Terraform Moduls.

# ----------------------------------------------------------------------------
# Terraform Settings
# ----------------------------------------------------------------------------

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# ----------------------------------------------------------------------------
# Provider Configuration
# ----------------------------------------------------------------------------

provider "aws" {
  region = var.aws_region

  # Optional: AWS Profile für lokale Entwicklung
  # profile = "Teilnehmer-729403197965"
}

# ----------------------------------------------------------------------------
# Ecokart Module
# ----------------------------------------------------------------------------

module "ecokart" {
  source = "../../"  # Zeigt auf terraform/ Root

  # Allgemeine Konfiguration
  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region

  # DynamoDB Konfiguration
  dynamodb_billing_mode         = "PROVISIONED"
  dynamodb_read_capacity        = 5
  dynamodb_write_capacity       = 5
  enable_point_in_time_recovery = false  # In Production: true

  # Lambda Konfiguration
  lambda_runtime      = "nodejs20.x"
  lambda_memory_size  = 512
  lambda_timeout      = 30
  jwt_secret          = var.jwt_secret
  lambda_source_path  = var.lambda_source_path

  # API Gateway
  api_gateway_stage_name         = "Prod"
  enable_api_gateway_access_logs = false  # In Production: true

  # Amplify - Frontend Hosting
  enable_amplify      = true
  github_repository   = "https://github.com/AndySchlegel/Ecokart-Webshop"
  github_branch       = "main"
  github_access_token = var.github_access_token

  # Optional: Basic Auth für Demo-Schutz
  basic_auth_enabled  = true
  basic_auth_user     = "demo"
  basic_auth_password = "test1234"

  # Amplify - Admin Frontend Hosting (Optional)
  enable_admin_amplify      = true
  admin_basic_auth_enabled  = true
  admin_basic_auth_user     = "admin"
  admin_basic_auth_password = "admin1234"  # ÄNDERN für Production!

  # Tags
  additional_tags = {
    Example     = "Basic"
    Deployment  = "Terraform"
  }
}

# ----------------------------------------------------------------------------
# Outputs
# ----------------------------------------------------------------------------

output "api_gateway_url" {
  description = "API Gateway Endpoint URL"
  value       = module.ecokart.api_gateway_url
}

output "lambda_function_name" {
  description = "Name der Lambda Function"
  value       = module.ecokart.lambda_function_name
}

output "dynamodb_tables" {
  description = "DynamoDB Table Names"
  value       = module.ecokart.dynamodb_table_names
}

output "next_steps" {
  description = "Nächste Schritte nach Deployment"
  value       = module.ecokart.setup_complete
}

output "amplify_app_url" {
  description = "Amplify Frontend URL"
  value       = module.ecokart.amplify_app_url
}

output "amplify_app_id" {
  description = "Amplify App ID"
  value       = module.ecokart.amplify_app_id
}

output "admin_amplify_app_url" {
  description = "Admin Amplify Frontend URL"
  value       = module.ecokart.admin_amplify_app_url
}

output "admin_amplify_app_id" {
  description = "Admin Amplify App ID"
  value       = module.ecokart.admin_amplify_app_id
}

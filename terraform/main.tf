# ============================================================================
# Terraform Main Configuration - Ecokart AWS Infrastruktur
# ============================================================================
# Dieses Modul orchestriert die gesamte AWS-Infrastruktur für den Ecokart Webshop.
# Es verwendet Sub-Module für DynamoDB, Lambda und Amplify.

# ----------------------------------------------------------------------------
# Lokale Variablen
# ----------------------------------------------------------------------------

locals {
  # Naming Convention: {project}-{resource}-{environment}
  name_prefix = "${var.project_name}-${var.environment}"

  # Alle Ressourcen erhalten diese Standard-Tags
  common_tags = merge(
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    },
    var.additional_tags
  )
}

# ----------------------------------------------------------------------------
# DynamoDB Module - Alle Tables
# ----------------------------------------------------------------------------
# Erstellt 4 DynamoDB Tabellen:
# - ecokart-products (mit CategoryIndex GSI)
# - ecokart-users (mit EmailIndex GSI)
# - ecokart-carts (kein GSI, userId als Partition Key)
# - ecokart-orders (mit UserOrdersIndex GSI)

module "dynamodb" {
  source = "./modules/dynamodb"

  project_name                 = var.project_name
  environment                  = var.environment
  billing_mode                 = var.dynamodb_billing_mode
  read_capacity                = var.dynamodb_read_capacity
  write_capacity               = var.dynamodb_write_capacity
  enable_point_in_time_recovery = var.enable_point_in_time_recovery

  tags = local.common_tags
}

# ----------------------------------------------------------------------------
# Lambda Module - Backend API + API Gateway
# ----------------------------------------------------------------------------
# Erstellt:
# - Lambda Function (Express.js App via serverless-http)
# - API Gateway REST API
# - IAM Role mit DynamoDB Permissions
# - CloudWatch Log Group

module "lambda" {
  source = "./modules/lambda"

  project_name  = var.project_name
  environment   = var.environment
  function_name = "${local.name_prefix}-api"

  # Lambda Configuration
  runtime       = var.lambda_runtime
  memory_size   = var.lambda_memory_size
  timeout       = var.lambda_timeout
  source_path   = var.lambda_source_path

  # Environment Variables für Lambda
  environment_variables = {
    NODE_ENV   = "production"
    DB_TYPE    = "dynamodb"
    JWT_SECRET = var.jwt_secret
  }

  # DynamoDB Table Names für IAM Permissions
  dynamodb_table_arns = module.dynamodb.table_arns

  # API Gateway
  api_stage_name         = var.api_gateway_stage_name
  enable_access_logs     = var.enable_api_gateway_access_logs

  tags = local.common_tags

  depends_on = [module.dynamodb]
}

# ----------------------------------------------------------------------------
# Amplify Module - Frontend Hosting (Optional)
# ----------------------------------------------------------------------------
# Erstellt nur wenn enable_amplify=true:
# - Amplify App
# - Branch-Konfiguration
# - GitHub Integration
# - Environment Variables

module "amplify" {
  count  = var.enable_amplify ? 1 : 0
  source = "./modules/amplify"

  project_name = var.project_name
  environment  = var.environment
  app_name     = "${local.name_prefix}-frontend"

  # GitHub Integration
  repository          = var.github_repository
  branch_name         = var.github_branch
  github_access_token = var.github_access_token

  # Build Settings
  framework              = var.amplify_framework
  build_command          = var.amplify_build_command
  monorepo_app_root      = var.amplify_monorepo_app_root

  # AWS Region (für Auto-Build Trigger)
  aws_region = var.aws_region

  # Environment Variables (an Frontend übergeben)
  # AMPLIFY_MONOREPO_APP_ROOT ist erforderlich für Monorepo-Setup
  # Amplify nutzt dies um package.json im richtigen Pfad zu finden
  environment_variables = {
    AMPLIFY_MONOREPO_APP_ROOT = var.amplify_monorepo_app_root
    NEXT_PUBLIC_API_URL       = module.lambda.api_gateway_url
    AMPLIFY_DIFF_DEPLOY       = "false"
  }

  # Basic Auth (optional)
  enable_basic_auth = var.basic_auth_enabled
  basic_auth_credentials = var.basic_auth_enabled ? {
    username = var.basic_auth_user
    password = var.basic_auth_password
  } : null

  tags = local.common_tags

  depends_on = [module.lambda]
}

# ----------------------------------------------------------------------------
# Amplify Module - Admin Frontend Hosting (Optional)
# ----------------------------------------------------------------------------
# Erstellt nur wenn enable_admin_amplify=true:
# - Separate Amplify App für Admin Frontend
# - Branch-Konfiguration
# - GitHub Integration
# - Environment Variables
# - Automatischer Initial Build

module "amplify_admin" {
  count  = var.enable_admin_amplify ? 1 : 0
  source = "./modules/amplify"

  project_name = var.project_name
  environment  = var.environment
  app_name     = "${local.name_prefix}-admin-frontend"

  # GitHub Integration
  repository          = var.github_repository
  branch_name         = var.github_branch
  github_access_token = var.github_access_token

  # Build Settings (Admin-Frontend spezifisch)
  framework              = var.admin_amplify_framework
  build_command          = var.admin_amplify_build_command
  monorepo_app_root      = var.admin_amplify_monorepo_app_root

  # AWS Region (für Auto-Build Trigger)
  aws_region = var.aws_region

  # Environment Variables (an Admin Frontend übergeben)
  # AMPLIFY_MONOREPO_APP_ROOT ist erforderlich für Monorepo-Setup
  # Admin Frontend nutzt Backend API für Admin-Operationen
  environment_variables = {
    AMPLIFY_MONOREPO_APP_ROOT = var.admin_amplify_monorepo_app_root
    NEXT_PUBLIC_API_URL       = module.lambda.api_gateway_url
    AMPLIFY_DIFF_DEPLOY       = "false"
  }

  # Basic Auth für Admin (empfohlen!)
  enable_basic_auth = var.admin_basic_auth_enabled
  basic_auth_credentials = var.admin_basic_auth_enabled ? {
    username = var.admin_basic_auth_user
    password = var.admin_basic_auth_password
  } : null

  tags = local.common_tags

  depends_on = [module.lambda]
}

# ----------------------------------------------------------------------------
# CloudWatch Log Groups (optional)
# ----------------------------------------------------------------------------
# Lambda Log Group wird automatisch von Lambda-Module erstellt
# Zusätzliche Log Groups können hier hinzugefügt werden

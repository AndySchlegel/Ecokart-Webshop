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

  # Automatisches Branch-Mapping basierend auf Environment
  # Das stellt sicher dass GitHub Actions automatisch den richtigen Branch deployed:
  # - development → develop Branch
  # - staging     → staging Branch
  # - production  → main Branch
  branch_map = {
    development = "develop"
    staging     = "staging"
    production  = "main"
  }

  # Verwende gemappten Branch oder Fallback auf var.github_branch
  github_branch = lookup(local.branch_map, var.environment, var.github_branch)

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
# GitHub Actions IAM Role - CI/CD Permissions
# ----------------------------------------------------------------------------
# TEMPORARILY DISABLED: Chicken-egg problem with IAM permissions
#
# Die IAM Role existiert in AWS (erstellt via Bootstrap Workflow).
# Management via Terraform führt zu Permission-Problemen (Role kann sich
# nicht selbst verwalten ohne Permissions, die wir ihr geben wollen).
#
# TODO: Später mit permanent AWS Credentials oder manueller IAM Console-Änderung lösen
#
# module "github_actions_role" {
#   source = "./modules/github-actions-role"
#
#   role_name   = "ecokart-github-actions-role"
#   github_repo = "AndySchlegel/Ecokart-Webshop"
#   aws_region  = var.aws_region
#
#   tags = local.common_tags
# }

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
# Cognito Module - User Authentication
# ----------------------------------------------------------------------------
# Erstellt:
# - Cognito User Pool (User-Datenbank)
# - User Pool Client (für Frontend)
# - Auto Admin User Provisioning (optional)
#
# Features:
# - Email als Username
# - Automatische Email-Verification
# - Custom Attribute "role" (admin/customer)
# - Lifecycle Protection (prevent_destroy für staging/production)

module "cognito" {
  source = "./modules/cognito"

  project_name = var.project_name
  environment  = var.environment

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
    NODE_ENV                = "production"
    ENVIRONMENT             = var.environment
    AWS_REGION              = var.aws_region
    DB_TYPE                 = "dynamodb"
    JWT_SECRET              = var.jwt_secret
    # Cognito Configuration for JWT Validation
    COGNITO_USER_POOL_ID    = module.cognito.user_pool_id
    COGNITO_CLIENT_ID       = module.cognito.user_pool_client_id
    # Stripe Payment Integration
    STRIPE_SECRET_KEY       = var.stripe_secret_key
    STRIPE_WEBHOOK_SECRET   = var.stripe_webhook_secret
    # FRONTEND_URL: Use provided URL or fallback to localhost
    # NOTE: Backend will auto-detect the actual frontend URL from request headers (origin, x-frontend-url)
    # This is just a fallback for local development
    FRONTEND_URL            = var.frontend_url != "" ? var.frontend_url : "http://localhost:3000"
  }

  # DynamoDB Table Names für IAM Permissions
  dynamodb_table_arns = module.dynamodb.table_arns

  # Cognito Integration (API Gateway Authorizer)
  cognito_user_pool_arn = module.cognito.user_pool_arn
  enable_cognito_auth   = var.enable_cognito_auth

  # API Gateway
  api_stage_name         = var.api_gateway_stage_name
  enable_access_logs     = var.enable_api_gateway_access_logs

  tags = local.common_tags

  depends_on = [module.dynamodb, module.cognito]
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
  branch_name         = local.github_branch  # Automatisch gemappt basierend auf Environment
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
  # Cognito Credentials für Amplify Auth
  # NOTE: FRONTEND_URL is NOT set here to avoid circular dependency
  # Frontend can determine its own URL at runtime using window.location.origin
  environment_variables = {
    AMPLIFY_MONOREPO_APP_ROOT      = var.amplify_monorepo_app_root
    NEXT_PUBLIC_API_URL            = module.lambda.api_gateway_url
    AMPLIFY_DIFF_DEPLOY            = "false"
    # Cognito Configuration
    NEXT_PUBLIC_USER_POOL_ID       = module.cognito.user_pool_id
    NEXT_PUBLIC_USER_POOL_CLIENT_ID = module.cognito.user_pool_client_id
    NEXT_PUBLIC_AWS_REGION         = var.aws_region
  }

  # Basic Auth (optional)
  enable_basic_auth = var.basic_auth_enabled
  basic_auth_credentials = var.basic_auth_enabled ? {
    username = var.basic_auth_user
    password = var.basic_auth_password
  } : null

  tags = local.common_tags

  depends_on = [module.lambda, module.cognito]
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
  branch_name         = local.github_branch  # Automatisch gemappt basierend auf Environment
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
  # Cognito Credentials für Amplify Auth
  environment_variables = {
    AMPLIFY_MONOREPO_APP_ROOT      = var.admin_amplify_monorepo_app_root
    NEXT_PUBLIC_API_URL            = module.lambda.api_gateway_url
    AMPLIFY_DIFF_DEPLOY            = "false"
    # Cognito Configuration (gleicher User Pool wie Customer Frontend)
    NEXT_PUBLIC_USER_POOL_ID       = module.cognito.user_pool_id
    NEXT_PUBLIC_USER_POOL_CLIENT_ID = module.cognito.user_pool_client_id
    NEXT_PUBLIC_AWS_REGION         = var.aws_region
  }

  # Basic Auth für Admin (empfohlen!)
  enable_basic_auth = var.admin_basic_auth_enabled
  basic_auth_credentials = var.admin_basic_auth_enabled ? {
    username = var.admin_basic_auth_user
    password = var.admin_basic_auth_password
  } : null

  tags = local.common_tags

  depends_on = [module.lambda, module.cognito]
}

# ----------------------------------------------------------------------------
# CloudWatch Log Groups (optional)
# ----------------------------------------------------------------------------
# Lambda Log Group wird automatisch von Lambda-Module erstellt
# Zusätzliche Log Groups können hier hinzugefügt werden

# ----------------------------------------------------------------------------
# Database Seeding (Optional - nur für Development)
# ----------------------------------------------------------------------------

module "database_seeding" {
  source = "./modules/seed"

  aws_region            = var.aws_region
  backend_path          = "${path.module}/../backend"
  enable_seeding        = var.enable_auto_seed
  depends_on_resources  = [module.dynamodb, module.lambda]
}

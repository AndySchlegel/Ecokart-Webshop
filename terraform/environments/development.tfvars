# ============================================================================
# Ecokart - Development Environment Configuration
# ============================================================================
# Diese Config wird für den "develop" Branch verwendet.
# Nur Variablen die in terraform/examples/basic/variables.tf deklariert sind!
# ============================================================================

aws_region   = "eu-north-1"
project_name = "ecokart"
environment  = "development"

# JWT Secret und GitHub Token werden via GitHub Actions Secrets gesetzt:
# TF_VAR_jwt_secret
# TF_VAR_github_access_token

# Alle anderen Konfigurationen (DynamoDB, Lambda, Amplify, etc.)
# sind hardcoded in terraform/examples/basic/main.tf

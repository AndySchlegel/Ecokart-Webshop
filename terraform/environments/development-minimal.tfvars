# ============================================================================
# Minimal Development Configuration
# ============================================================================
# Nur die in examples/basic/variables.tf deklarierten Variablen

aws_region   = "eu-north-1"
project_name = "ecokart"
environment  = "development"

# JWT Secret wird via TF_VAR_jwt_secret gesetzt (GitHub Actions)
# github_access_token wird via TF_VAR_github_access_token gesetzt

# Alle anderen Konfigurationen sind hardcoded in examples/basic/main.tf

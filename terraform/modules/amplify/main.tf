# ============================================================================
# Amplify Module - Frontend Hosting
# ============================================================================
# Erstellt AWS Amplify App für Next.js SSR Hosting mit GitHub Integration.

# ----------------------------------------------------------------------------
# Amplify App
# ----------------------------------------------------------------------------
# Haupt-App Ressource mit Build Settings

resource "aws_amplify_app" "frontend" {
  name        = var.app_name
  description = "Ecokart Frontend - Next.js SSR on Amplify"
  repository  = var.repository

  # GitHub Access Token (für Private Repos oder Auto-Deploy)
  access_token = var.github_access_token

  # IAM Service Role (für Build Operations + SSM Parameter Write)
  iam_service_role_arn = aws_iam_role.amplify_service_role.arn

  # Platform: WEB_COMPUTE (für SSR) vs WEB (für Static)
  platform = "WEB_COMPUTE"

  # Build Settings (Next.js SSR with Monorepo)
  # Amplify Monorepo Format mit "applications" Key
  build_spec = <<-EOT
    version: 1
    applications:
      - appRoot: ${var.monorepo_app_root}
        frontend:
          phases:
            preBuild:
              commands:
                - npm ci
            build:
              commands:
                - npm run build
            postBuild:
              commands:
                - |
                  echo "Writing Amplify URL to SSM Parameter Store..."
                  AMPLIFY_URL="https://$${AWS_BRANCH}.$${AWS_APP_ID}.amplifyapp.com"
                  ENVIRONMENT=$${AWS_BRANCH:-development}
                  PARAM_NAME="/ecokart/$${ENVIRONMENT}/frontend-url"
                  echo "URL: $AMPLIFY_URL"
                  echo "Parameter: $PARAM_NAME"
                  aws ssm put-parameter \
                    --name "$PARAM_NAME" \
                    --value "$AMPLIFY_URL" \
                    --type String \
                    --overwrite \
                    --region $${AWS_REGION:-eu-north-1} || echo "Warning: Could not write to SSM (check IAM permissions)"
          artifacts:
            baseDirectory: .next
            files:
              - '**/*'
          cache:
            paths:
              - node_modules/**/*
              - .next/cache/**/*
  EOT

  # Environment Variables (an Frontend übergeben)
  # Muss als Map übergeben werden, kein dynamic block
  environment_variables = var.environment_variables

  # Keine Custom Rules nötig für Next.js SSR (WEB_COMPUTE)
  # Next.js handled routing automatisch
  # custom_rule für SPA-Redirects würde SSR brechen!

  # Custom Headers (CORS, Security)
  # TEMP disabled - causing "save headers" error with monorepo
  # custom_headers = <<-EOH
  #   customHeaders:
  #     - pattern: '**/*'
  #       headers:
  #         - key: 'Strict-Transport-Security'
  #           value: 'max-age=31536000; includeSubDomains'
  #         - key: 'X-Frame-Options'
  #           value: 'SAMEORIGIN'
  #         - key: 'X-Content-Type-Options'
  #           value: 'nosniff'
  #         - key: 'X-XSS-Protection'
  #           value: '1; mode=block'
  # EOH

  # Auto Branch Creation disabled (wir erstellen Branch manuell)
  enable_auto_branch_creation = false

  # Branch Protection für Main
  enable_branch_auto_build = true

  tags = var.tags
}

# ----------------------------------------------------------------------------
# Amplify Branch (Main/Production)
# ----------------------------------------------------------------------------
# Verbindet GitHub Branch mit Amplify App

resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.frontend.id
  branch_name = var.branch_name
  framework   = var.framework

  # Environment für Branch (production, staging, etc.)
  stage = var.environment == "production" ? "PRODUCTION" : "DEVELOPMENT"

  # Enable Auto-Build (bei Git Push)
  enable_auto_build = true

  # Performance Mode (für bessere Response Times)
  enable_performance_mode = var.environment == "production" ? true : false

  # Basic Authentication (optional)
  enable_basic_auth = var.enable_basic_auth
  basic_auth_credentials = var.enable_basic_auth ? base64encode("${var.basic_auth_credentials.username}:${var.basic_auth_credentials.password}") : null
}

# ----------------------------------------------------------------------------
# Amplify Webhook (optional für CI/CD)
# ----------------------------------------------------------------------------
# Webhook für manuelle Deployments (z.B. via API)

resource "aws_amplify_webhook" "main" {
  app_id      = aws_amplify_app.frontend.id
  branch_name = aws_amplify_branch.main.branch_name
  description = "Webhook for manual deployments"
}

# ----------------------------------------------------------------------------
# Amplify Domain Association (optional)
# ----------------------------------------------------------------------------
# Aktuell nicht implementiert, da Custom Domain optional ist
# Bei Bedarf kann hier aws_amplify_domain_association hinzugefügt werden

# resource "aws_amplify_domain_association" "custom_domain" {
#   count = var.custom_domain != "" ? 1 : 0
#   app_id      = aws_amplify_app.frontend.id
#   domain_name = var.custom_domain
#
#   sub_domain {
#     branch_name = aws_amplify_branch.main.branch_name
#     prefix      = ""
#   }
# }

# ----------------------------------------------------------------------------
# Automatic Initial Build Trigger
# ----------------------------------------------------------------------------
# Startet automatisch den ersten Build nach Terraform Apply
# Eliminiert manuellen "Deploy" Klick in der Amplify Console
#
# Funktionsweise:
# 1. null_resource wird EINMAL beim Apply erstellt
# 2. local-exec provisioner führt AWS CLI Command aus
# 3. Startet RELEASE Job in Amplify (= Production Build)
# 4. Bei erneutem Apply: Keine Änderung (null_resource existiert bereits)
#
# Voraussetzung: AWS CLI muss lokal installiert sein

resource "null_resource" "trigger_initial_build" {
  # Trigger: Wird nur bei Änderung des Branch oder App neu ausgeführt
  triggers = {
    branch_id = aws_amplify_branch.main.arn
  }

  # AWS CLI Command um Build zu starten
  provisioner "local-exec" {
    command = <<-EOT
      aws amplify start-job \
        --app-id ${aws_amplify_app.frontend.id} \
        --branch-name ${aws_amplify_branch.main.branch_name} \
        --job-type RELEASE \
        --region ${var.aws_region}
    EOT
  }

  # Abhängigkeiten: Branch muss existieren bevor Build gestartet wird
  depends_on = [aws_amplify_branch.main]
}

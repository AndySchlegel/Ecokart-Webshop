# ============================================================================
# Lambda Module - Backend API + API Gateway
# ============================================================================
# Erstellt Lambda Function, API Gateway und notwendige IAM Permissions.

# ----------------------------------------------------------------------------
# Lambda Deployment Package
# ----------------------------------------------------------------------------
# Kompiliert TypeScript Backend und erstellt ZIP-Archive

# Zuerst: Build Command ausführen (TypeScript kompilieren)
resource "null_resource" "build_lambda" {
  triggers = {
    # Re-build bei Änderungen im Source Code
    source_hash = sha256(join("", [for f in fileset(var.source_path, "src/**/*.ts") : filesha256("${var.source_path}/${f}")]))
  }

  provisioner "local-exec" {
    command     = "npm ci && npm run build"
    working_dir = var.source_path
  }
}

# ZIP-Archive erstellen (dist/ Ordner + node_modules)
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/builds/${var.function_name}.zip"

  # Nur Production Dependencies
  source_dir  = var.source_path

  excludes = [
    ".git",
    ".gitignore",
    "node_modules/.cache",
    "src",
    "*.md",
    "*.yaml",
    "scripts",
    "aws"
  ]

  depends_on = [null_resource.build_lambda]
}

# ----------------------------------------------------------------------------
# Lambda Function
# ----------------------------------------------------------------------------
# Express.js App als Lambda Function (via serverless-http)

resource "aws_lambda_function" "api" {
  function_name    = var.function_name
  description      = "Ecokart Backend API - Express on Lambda"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "lambda.handler"
  runtime          = var.runtime
  memory_size      = var.memory_size
  timeout          = var.timeout
  architectures    = ["x86_64"]

  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  # Environment Variables
  environment {
    variables = var.environment_variables
  }

  # CloudWatch Logs Retention (14 Tage)
  depends_on = [
    aws_cloudwatch_log_group.lambda_logs,
    aws_iam_role_policy_attachment.lambda_logs
  ]

  tags = merge(
    var.tags,
    {
      Name = var.function_name
    }
  )
}

# ----------------------------------------------------------------------------
# CloudWatch Log Group
# ----------------------------------------------------------------------------
# Lambda Logs mit konfigurierbarer Retention

resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${var.function_name}"
  retention_in_days = 14

  tags = var.tags
}

# ----------------------------------------------------------------------------
# API Gateway REST API
# ----------------------------------------------------------------------------
# REST API mit Proxy-Integration zu Lambda

resource "aws_api_gateway_rest_api" "api" {
  name        = "${var.function_name}-gateway"
  description = "API Gateway for Ecokart Backend"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = var.tags
}

# Root Resource (/)
resource "aws_api_gateway_method" "root_method" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_rest_api.api.root_resource_id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "root_integration" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_rest_api.api.root_resource_id
  http_method = aws_api_gateway_method.root_method.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api.invoke_arn
}

# Proxy Resource (/{proxy+})
resource "aws_api_gateway_resource" "proxy" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "proxy_method" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "proxy_integration" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.proxy.id
  http_method = aws_api_gateway_method.proxy_method.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api.invoke_arn
}

# ----------------------------------------------------------------------------
# API Gateway Deployment
# ----------------------------------------------------------------------------

resource "aws_api_gateway_deployment" "api" {
  rest_api_id = aws_api_gateway_rest_api.api.id

  triggers = {
    # Re-deploy bei API-Änderungen
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.proxy.id,
      aws_api_gateway_method.root_method.id,
      aws_api_gateway_method.proxy_method.id,
      aws_api_gateway_integration.root_integration.id,
      aws_api_gateway_integration.proxy_integration.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_integration.root_integration,
    aws_api_gateway_integration.proxy_integration
  ]
}

# API Gateway Stage
resource "aws_api_gateway_stage" "api" {
  deployment_id = aws_api_gateway_deployment.api.id
  rest_api_id   = aws_api_gateway_rest_api.api.id
  stage_name    = var.api_stage_name

  # CloudWatch Logs (optional)
  dynamic "access_log_settings" {
    for_each = var.enable_access_logs ? [1] : []
    content {
      destination_arn = aws_cloudwatch_log_group.api_gateway_logs[0].arn
      format = jsonencode({
        requestId      = "$context.requestId"
        ip             = "$context.identity.sourceIp"
        caller         = "$context.identity.caller"
        user           = "$context.identity.user"
        requestTime    = "$context.requestTime"
        httpMethod     = "$context.httpMethod"
        resourcePath   = "$context.resourcePath"
        status         = "$context.status"
        protocol       = "$context.protocol"
        responseLength = "$context.responseLength"
      })
    }
  }

  tags = var.tags
}

# API Gateway CloudWatch Log Group (optional)
resource "aws_cloudwatch_log_group" "api_gateway_logs" {
  count             = var.enable_access_logs ? 1 : 0
  name              = "/aws/apigateway/${var.function_name}"
  retention_in_days = 7

  tags = var.tags
}

# ----------------------------------------------------------------------------
# Lambda Permission für API Gateway
# ----------------------------------------------------------------------------

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"

  # API Gateway darf Lambda über ALLE Pfade aufrufen
  source_arn = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}

# ----------------------------------------------------------------------------
# CORS Configuration (optional, falls nötig)
# ----------------------------------------------------------------------------
# CORS wird im Express-Backend via cors-Middleware konfiguriert
# Keine zusätzliche API Gateway CORS-Konfiguration nötig

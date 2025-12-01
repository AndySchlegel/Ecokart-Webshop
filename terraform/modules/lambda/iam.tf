# ============================================================================
# Lambda IAM Permissions
# ============================================================================
# Definiert IAM Role und Policies für Lambda Function.

# ----------------------------------------------------------------------------
# Lambda Execution Role
# ----------------------------------------------------------------------------
# Role die Lambda annimmt beim Ausführen

resource "aws_iam_role" "lambda_exec" {
  name = "${var.function_name}-exec-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# ----------------------------------------------------------------------------
# CloudWatch Logs Policy
# ----------------------------------------------------------------------------
# Erlaubt Lambda Logs zu schreiben

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# ----------------------------------------------------------------------------
# DynamoDB Full Access Policy
# ----------------------------------------------------------------------------
# Gibt Lambda volle CRUD-Rechte auf alle Ecokart Tables

resource "aws_iam_role_policy" "dynamodb_access" {
  name = "${var.function_name}-dynamodb-policy"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem"
        ]
        Resource = concat(
          var.dynamodb_table_arns,
          # Auch GSI-Zugriff erlauben
          [for arn in var.dynamodb_table_arns : "${arn}/index/*"]
        )
      }
    ]
  })
}

# ----------------------------------------------------------------------------
# SSM Parameter Store Access (für Frontend URL)
# ----------------------------------------------------------------------------
# Erlaubt Lambda das Lesen von SSM Parameters unter /ecokart/*
# Wird benötigt für dynamische Frontend URL Resolution (Stripe Redirects)

resource "aws_iam_role_policy" "ssm_access" {
  name = "${var.function_name}-ssm-policy"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Resource = [
          "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/ecokart/*"
        ]
      }
    ]
  })
}

# Data Sources für dynamische ARN-Erstellung
data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

# ----------------------------------------------------------------------------
# Optional: VPC Access (falls Lambda in VPC laufen soll)
# ----------------------------------------------------------------------------
# Aktuell NICHT benötigt, da DynamoDB über Public Endpoint erreichbar ist.
# Bei Bedarf kann hier AWSLambdaVPCAccessExecutionRole attached werden.

# resource "aws_iam_role_policy_attachment" "lambda_vpc" {
#   count      = var.enable_vpc ? 1 : 0
#   role       = aws_iam_role.lambda_exec.name
#   policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
# }

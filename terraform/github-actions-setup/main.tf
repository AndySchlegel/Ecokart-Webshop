# ============================================================================
# GitHub Actions OIDC Setup for Automated Deployment
# ============================================================================
# This module sets up the AWS infrastructure needed for GitHub Actions
# to deploy your Ecokart application automatically without manual steps.
#
# What it creates:
# 1. GitHub OIDC Provider in AWS IAM (allows GitHub to authenticate)
# 2. IAM Role that GitHub Actions will assume
# 3. IAM Policies with permissions for Terraform deployment
# ============================================================================

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# ============================================================================
# 1. GitHub OIDC Provider
# ============================================================================
# This allows GitHub Actions to authenticate with AWS using OpenID Connect
# No need to store AWS credentials in GitHub Secrets!

resource "aws_iam_openid_connect_provider" "github_actions" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = [
    "sts.amazonaws.com"
  ]

  # GitHub's OIDC thumbprints (these are official GitHub values)
  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1",
    "1c58a3a8518e8759bf075b76b750d4f2df264fcd"
  ]

  tags = {
    Name        = "GitHub Actions OIDC Provider"
    Project     = var.project_name
    Environment = "all"
    ManagedBy   = "Terraform"
  }
}

# ============================================================================
# 2. IAM Role for GitHub Actions
# ============================================================================
# This role will be assumed by GitHub Actions during deployment

resource "aws_iam_role" "github_actions" {
  name        = "${var.project_name}-github-actions-role"
  description = "IAM Role for GitHub Actions to deploy Ecokart infrastructure"

  # Trust Policy: Who can assume this role?
  # Only GitHub Actions from YOUR specific repository!
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github_actions.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            # Only allow YOUR repository to assume this role
            # Format: "repo:OWNER/REPO:*"
            "token.actions.githubusercontent.com:sub" = "repo:${var.github_repo}:*"
          }
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-github-actions-role"
    Project     = var.project_name
    Environment = "all"
    ManagedBy   = "Terraform"
  }
}

# ============================================================================
# 3. IAM Policies - What can GitHub Actions do?
# ============================================================================

# Policy 1: DynamoDB Permissions
resource "aws_iam_policy" "dynamodb" {
  name        = "${var.project_name}-github-actions-dynamodb"
  description = "Permissions for DynamoDB operations"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:CreateTable",
          "dynamodb:DeleteTable",
          "dynamodb:DescribeTable",
          "dynamodb:DescribeTimeToLive",
          "dynamodb:DescribeContinuousBackups",
          "dynamodb:UpdateContinuousBackups",
          "dynamodb:ListTables",
          "dynamodb:ListTagsOfResource",
          "dynamodb:TagResource",
          "dynamodb:UntagResource",
          "dynamodb:UpdateTable",
          "dynamodb:UpdateTimeToLive",
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:BatchWriteItem",
          "dynamodb:Scan",
          "dynamodb:Query"
        ]
        Resource = [
          "arn:aws:dynamodb:${var.aws_region}:${var.aws_account_id}:table/${var.project_name}-*"
        ]
      }
    ]
  })
}

# Policy 2: Lambda Permissions
resource "aws_iam_policy" "lambda" {
  name        = "${var.project_name}-github-actions-lambda"
  description = "Permissions for Lambda operations"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:CreateFunction",
          "lambda:DeleteFunction",
          "lambda:GetFunction",
          "lambda:GetFunctionConfiguration",
          "lambda:ListFunctions",
          "lambda:UpdateFunctionCode",
          "lambda:UpdateFunctionConfiguration",
          "lambda:AddPermission",
          "lambda:RemovePermission",
          "lambda:InvokeFunction",
          "lambda:TagResource",
          "lambda:UntagResource",
          "lambda:ListTags",
          "lambda:PublishVersion",
          "lambda:CreateAlias",
          "lambda:DeleteAlias",
          "lambda:GetAlias"
        ]
        Resource = [
          "arn:aws:lambda:${var.aws_region}:${var.aws_account_id}:function:${var.project_name}-*"
        ]
      }
    ]
  })
}

# Policy 3: IAM Permissions (for Lambda execution roles)
resource "aws_iam_policy" "iam" {
  name        = "${var.project_name}-github-actions-iam"
  description = "Permissions for IAM role management"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "iam:CreateRole",
          "iam:DeleteRole",
          "iam:GetRole",
          "iam:GetRolePolicy",
          "iam:ListRolePolicies",
          "iam:ListAttachedRolePolicies",
          "iam:PutRolePolicy",
          "iam:DeleteRolePolicy",
          "iam:AttachRolePolicy",
          "iam:DetachRolePolicy",
          "iam:PassRole",
          "iam:TagRole",
          "iam:UntagRole",
          "iam:ListRoleTags"
        ]
        Resource = [
          "arn:aws:iam::${var.aws_account_id}:role/${var.project_name}-*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "iam:CreatePolicy",
          "iam:DeletePolicy",
          "iam:GetPolicy",
          "iam:GetPolicyVersion",
          "iam:ListPolicyVersions",
          "iam:CreatePolicyVersion",
          "iam:DeletePolicyVersion",
          "iam:TagPolicy",
          "iam:UntagPolicy"
        ]
        Resource = [
          "arn:aws:iam::${var.aws_account_id}:policy/${var.project_name}-*"
        ]
      }
    ]
  })
}

# Policy 4: API Gateway Permissions
resource "aws_iam_policy" "apigateway" {
  name        = "${var.project_name}-github-actions-apigateway"
  description = "Permissions for API Gateway operations"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "apigateway:*"
        ]
        Resource = [
          "arn:aws:apigateway:${var.aws_region}::/*"
        ]
      }
    ]
  })
}

# Policy 5: CloudWatch Logs Permissions
resource "aws_iam_policy" "cloudwatch" {
  name        = "${var.project_name}-github-actions-cloudwatch"
  description = "Permissions for CloudWatch Logs operations"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:PutRetentionPolicy",
          "logs:DeleteRetentionPolicy",
          "logs:DescribeLogStreams",
          "logs:DeleteLogGroup",
          "logs:TagResource",
          "logs:UntagResource",
          "logs:ListTagsForResource"
        ]
        Resource = [
          "arn:aws:logs:${var.aws_region}:${var.aws_account_id}:log-group:/aws/lambda/${var.project_name}-*",
          "arn:aws:logs:${var.aws_region}:${var.aws_account_id}:log-group:/aws/lambda/${var.project_name}-*:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:DescribeLogGroups"
        ]
        Resource = "*"
      }
    ]
  })
}

# Policy 6: Amplify Permissions
resource "aws_iam_policy" "amplify" {
  name        = "${var.project_name}-github-actions-amplify"
  description = "Permissions for AWS Amplify operations"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "amplify:CreateApp",
          "amplify:DeleteApp",
          "amplify:GetApp",
          "amplify:ListApps",
          "amplify:UpdateApp",
          "amplify:CreateBranch",
          "amplify:DeleteBranch",
          "amplify:GetBranch",
          "amplify:ListBranches",
          "amplify:UpdateBranch",
          "amplify:StartJob",
          "amplify:TagResource",
          "amplify:UntagResource",
          "amplify:ListTagsForResource"
        ]
        Resource = [
          "arn:aws:amplify:${var.aws_region}:${var.aws_account_id}:apps/*"
        ]
      }
    ]
  })
}

# Policy 7: SSM Parameter Store (for secrets)
resource "aws_iam_policy" "ssm" {
  name        = "${var.project_name}-github-actions-ssm"
  description = "Permissions for AWS Systems Manager Parameter Store"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = [
          "arn:aws:ssm:${var.aws_region}:${var.aws_account_id}:parameter/${var.project_name}/*"
        ]
      }
    ]
  })
}

# Policy 8: S3 (for Terraform state if needed)
resource "aws_iam_policy" "s3" {
  name        = "${var.project_name}-github-actions-s3"
  description = "Permissions for S3 operations"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetBucketLocation",
          "s3:GetBucketVersioning"
        ]
        Resource = [
          "arn:aws:s3:::${var.project_name}-*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "arn:aws:s3:::${var.project_name}-*/*"
        ]
      }
    ]
  })
}

# Attach all policies to the GitHub Actions role
resource "aws_iam_role_policy_attachment" "dynamodb" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.dynamodb.arn
}

resource "aws_iam_role_policy_attachment" "lambda" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.lambda.arn
}

resource "aws_iam_role_policy_attachment" "iam" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.iam.arn
}

resource "aws_iam_role_policy_attachment" "apigateway" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.apigateway.arn
}

resource "aws_iam_role_policy_attachment" "cloudwatch" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.cloudwatch.arn
}

resource "aws_iam_role_policy_attachment" "amplify" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.amplify.arn
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.ssm.arn
}

resource "aws_iam_role_policy_attachment" "s3" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.s3.arn
}

# ============================================================================
# IAM Policies for GitHub Actions Role
# ============================================================================

# 1. Amplify Policy
resource "aws_iam_policy" "amplify" {
  name        = "${var.role_name}-amplify"
  description = "Permissions for managing AWS Amplify applications"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "amplify:*"
        ]
        Resource = "*"
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "amplify" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.amplify.arn
}

# 2. API Gateway Policy
resource "aws_iam_policy" "apigateway" {
  name        = "${var.role_name}-apigateway"
  description = "Permissions for managing API Gateway"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "apigateway:*"
        ]
        Resource = "*"
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "apigateway" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.apigateway.arn
}

# 3. CloudWatch Policy
resource "aws_iam_policy" "cloudwatch" {
  name        = "${var.role_name}-cloudwatch"
  description = "Permissions for managing CloudWatch logs"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:*"
        ]
        Resource = "*"
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "cloudwatch" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.cloudwatch.arn
}

# 4. DynamoDB Policy
resource "aws_iam_policy" "dynamodb" {
  name        = "${var.role_name}-dynamodb"
  description = "Permissions for managing DynamoDB tables"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:*"
        ]
        Resource = "*"
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "dynamodb" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.dynamodb.arn
}

# 5. IAM Policy (for creating Lambda execution roles, etc.)
resource "aws_iam_policy" "iam" {
  name        = "${var.role_name}-iam"
  description = "Permissions for managing IAM roles and policies"

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
          "iam:PutRolePolicy",
          "iam:DeleteRolePolicy",
          "iam:AttachRolePolicy",
          "iam:DetachRolePolicy",
          "iam:ListAttachedRolePolicies",
          "iam:ListRolePolicies",
          "iam:PassRole",
          "iam:TagRole",
          "iam:UntagRole",
          "iam:CreatePolicy",
          "iam:DeletePolicy",
          "iam:GetPolicy",
          "iam:GetPolicyVersion",
          "iam:ListPolicyVersions"
        ]
        Resource = "*"
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "iam" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.iam.arn
}

# 6. Lambda Policy
resource "aws_iam_policy" "lambda" {
  name        = "${var.role_name}-lambda"
  description = "Permissions for managing Lambda functions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:*"
        ]
        Resource = "*"
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "lambda" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.lambda.arn
}

# 7. S3 Policy (for Lambda code deployment)
resource "aws_iam_policy" "s3" {
  name        = "${var.role_name}-s3"
  description = "Permissions for managing S3 buckets"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:*"
        ]
        Resource = "*"
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "s3" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.s3.arn
}

# 8. SSM Parameter Store Policy
resource "aws_iam_policy" "ssm" {
  name        = "${var.role_name}-ssm"
  description = "Permissions for accessing SSM Parameter Store"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath",
          "ssm:PutParameter",
          "ssm:DeleteParameter"
        ]
        Resource = "*"
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.ssm.arn
}

# 9. NEW: Terraform S3 Backend + State Locking Policy
resource "aws_iam_policy" "terraform_backend" {
  name        = "${var.role_name}-terraform-backend"
  description = "Permissions for Terraform S3 Backend and DynamoDB State Locking"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "TerraformStateS3Backend"
        Effect = "Allow"
        Action = [
          "s3:CreateBucket",
          "s3:ListBucket",
          "s3:GetBucketVersioning",
          "s3:PutBucketVersioning",
          "s3:GetEncryptionConfiguration",
          "s3:PutEncryptionConfiguration",
          "s3:GetBucketPublicAccessBlock",
          "s3:PutBucketPublicAccessBlock",
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "arn:aws:s3:::ecokart-terraform-state-*",
          "arn:aws:s3:::ecokart-terraform-state-*/*"
        ]
      },
      {
        Sid    = "TerraformStateLocking"
        Effect = "Allow"
        Action = [
          "dynamodb:CreateTable",
          "dynamodb:DescribeTable",
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem",
          "dynamodb:DescribeTimeToLive"
        ]
        Resource = "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/ecokart-terraform-state-lock"
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "terraform_backend" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.terraform_backend.arn
}

# 10. Cognito Policy (for User Pool management)
resource "aws_iam_policy" "cognito" {
  name        = "${var.role_name}-cognito"
  description = "Permissions for managing Cognito User Pools"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:*"
        ]
        Resource = "*"
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "cognito" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.cognito.arn
}

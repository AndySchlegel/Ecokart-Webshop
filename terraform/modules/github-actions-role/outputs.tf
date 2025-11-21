# ============================================================================
# Outputs for GitHub Actions IAM Role Module
# ============================================================================

output "role_arn" {
  description = "ARN of the GitHub Actions IAM role"
  value       = aws_iam_role.github_actions.arn
}

output "role_name" {
  description = "Name of the GitHub Actions IAM role"
  value       = aws_iam_role.github_actions.name
}

output "policy_arns" {
  description = "ARNs of all attached policies"
  value = {
    amplify           = aws_iam_policy.amplify.arn
    apigateway        = aws_iam_policy.apigateway.arn
    cloudwatch        = aws_iam_policy.cloudwatch.arn
    dynamodb          = aws_iam_policy.dynamodb.arn
    iam               = aws_iam_policy.iam.arn
    lambda            = aws_iam_policy.lambda.arn
    s3                = aws_iam_policy.s3.arn
    ssm               = aws_iam_policy.ssm.arn
    terraform_backend = aws_iam_policy.terraform_backend.arn
    cognito           = aws_iam_policy.cognito.arn
  }
}

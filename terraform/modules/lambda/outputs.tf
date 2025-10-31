# ============================================================================
# Lambda Module Outputs
# ============================================================================

# ----------------------------------------------------------------------------
# Lambda Function Outputs
# ----------------------------------------------------------------------------

output "function_name" {
  description = "Name der Lambda Function"
  value       = aws_lambda_function.api.function_name
}

output "function_arn" {
  description = "ARN der Lambda Function"
  value       = aws_lambda_function.api.arn
}

output "invoke_arn" {
  description = "Invoke ARN der Lambda Function"
  value       = aws_lambda_function.api.invoke_arn
}

output "function_version" {
  description = "Version der Lambda Function"
  value       = aws_lambda_function.api.version
}

output "function_qualified_arn" {
  description = "Qualified ARN (inkl. Version)"
  value       = aws_lambda_function.api.qualified_arn
}

# ----------------------------------------------------------------------------
# IAM Outputs
# ----------------------------------------------------------------------------

output "role_arn" {
  description = "ARN der Lambda Execution Role"
  value       = aws_iam_role.lambda_exec.arn
}

output "role_name" {
  description = "Name der Lambda Execution Role"
  value       = aws_iam_role.lambda_exec.name
}

# ----------------------------------------------------------------------------
# API Gateway Outputs
# ----------------------------------------------------------------------------

output "api_gateway_id" {
  description = "ID des API Gateway REST API"
  value       = aws_api_gateway_rest_api.api.id
}

output "api_gateway_url" {
  description = "API Gateway Endpoint URL (für Frontend Environment Variable)"
  value       = "${aws_api_gateway_stage.api.invoke_url}/"
}

output "api_gateway_execution_arn" {
  description = "Execution ARN des API Gateway"
  value       = aws_api_gateway_rest_api.api.execution_arn
}

output "api_gateway_stage_name" {
  description = "API Gateway Stage Name"
  value       = aws_api_gateway_stage.api.stage_name
}

# ----------------------------------------------------------------------------
# CloudWatch Outputs
# ----------------------------------------------------------------------------

output "lambda_log_group_name" {
  description = "Name der Lambda CloudWatch Log Group"
  value       = aws_cloudwatch_log_group.lambda_logs.name
}

output "lambda_log_group_arn" {
  description = "ARN der Lambda CloudWatch Log Group"
  value       = aws_cloudwatch_log_group.lambda_logs.arn
}

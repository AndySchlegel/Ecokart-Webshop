# ============================================================================
# CloudWatch Monitoring & Alarms - Production Ready
# ============================================================================
# Dieses Modul erstellt CloudWatch Alarms für Production Monitoring.
#
# Monitored:
# - Lambda Function Errors & Performance
# - DynamoDB Throttling (alle Tables)
# - API Gateway 5xx Errors
#
# Notifications via SNS Topic (Email/Slack)
# ============================================================================

# ----------------------------------------------------------------------------
# SNS Topic für Alarm Notifications
# ----------------------------------------------------------------------------

resource "aws_sns_topic" "monitoring_alerts" {
  name = "${local.name_prefix}-monitoring-alerts"

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-monitoring-alerts"
      Purpose = "CloudWatch Alarm Notifications"
    }
  )
}

# Optional: Email Subscription (kann später via AWS Console oder CLI hinzugefügt werden)
# resource "aws_sns_topic_subscription" "monitoring_email" {
#   topic_arn = aws_sns_topic.monitoring_alerts.arn
#   protocol  = "email"
#   endpoint  = var.monitoring_email  # Email-Adresse in variables.tf definieren
# }

# ----------------------------------------------------------------------------
# Lambda Function Alarms
# ----------------------------------------------------------------------------

# Alarm: Lambda Errors (wenn Error Rate > 5% in 5 Minuten)
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${local.name_prefix}-lambda-errors"
  alarm_description   = "Lambda function error rate exceeded threshold"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300  # 5 Minuten
  statistic           = "Sum"
  threshold           = 5    # 5 Errors in 5 Minuten
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = module.lambda.function_name
  }

  alarm_actions = [aws_sns_topic.monitoring_alerts.arn]
  ok_actions    = [aws_sns_topic.monitoring_alerts.arn]

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-lambda-errors"
      Severity = "HIGH"
    }
  )
}

# Alarm: Lambda Duration (wenn Durchschnitt > 10 Sekunden)
resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  alarm_name          = "${local.name_prefix}-lambda-duration"
  alarm_description   = "Lambda function duration exceeded threshold (performance issue)"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 300  # 5 Minuten
  statistic           = "Average"
  threshold           = 10000  # 10 Sekunden in Millisekunden
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = module.lambda.function_name
  }

  alarm_actions = [aws_sns_topic.monitoring_alerts.arn]
  ok_actions    = [aws_sns_topic.monitoring_alerts.arn]

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-lambda-duration"
      Severity = "MEDIUM"
    }
  )
}

# Alarm: Lambda Throttles (wenn Requests gedrosselt werden)
resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  alarm_name          = "${local.name_prefix}-lambda-throttles"
  alarm_description   = "Lambda function is being throttled (concurrency limit reached)"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 1    # Jeder Throttle ist kritisch
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = module.lambda.function_name
  }

  alarm_actions = [aws_sns_topic.monitoring_alerts.arn]
  ok_actions    = [aws_sns_topic.monitoring_alerts.arn]

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-lambda-throttles"
      Severity = "HIGH"
    }
  )
}

# ----------------------------------------------------------------------------
# DynamoDB Alarms (für alle 4 Tables)
# ----------------------------------------------------------------------------

# Alarm: Products Table - Read Throttles
resource "aws_cloudwatch_metric_alarm" "dynamodb_products_read_throttles" {
  alarm_name          = "${local.name_prefix}-dynamodb-products-read-throttles"
  alarm_description   = "DynamoDB Products table read requests are being throttled"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ReadThrottleEvents"
  namespace           = "AWS/DynamoDB"
  period              = 300
  statistic           = "Sum"
  threshold           = 1
  treat_missing_data  = "notBreaching"

  dimensions = {
    TableName = module.dynamodb.products_table_name
  }

  alarm_actions = [aws_sns_topic.monitoring_alerts.arn]
  ok_actions    = [aws_sns_topic.monitoring_alerts.arn]

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-dynamodb-products-read-throttles"
      Severity = "HIGH"
    }
  )
}

# Alarm: Products Table - Write Throttles
resource "aws_cloudwatch_metric_alarm" "dynamodb_products_write_throttles" {
  alarm_name          = "${local.name_prefix}-dynamodb-products-write-throttles"
  alarm_description   = "DynamoDB Products table write requests are being throttled"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "WriteThrottleEvents"
  namespace           = "AWS/DynamoDB"
  period              = 300
  statistic           = "Sum"
  threshold           = 1
  treat_missing_data  = "notBreaching"

  dimensions = {
    TableName = module.dynamodb.products_table_name
  }

  alarm_actions = [aws_sns_topic.monitoring_alerts.arn]
  ok_actions    = [aws_sns_topic.monitoring_alerts.arn]

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-dynamodb-products-write-throttles"
      Severity = "HIGH"
    }
  )
}

# Alarm: Carts Table - Write Throttles (häufigste Writes)
resource "aws_cloudwatch_metric_alarm" "dynamodb_carts_write_throttles" {
  alarm_name          = "${local.name_prefix}-dynamodb-carts-write-throttles"
  alarm_description   = "DynamoDB Carts table write requests are being throttled"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "WriteThrottleEvents"
  namespace           = "AWS/DynamoDB"
  period              = 300
  statistic           = "Sum"
  threshold           = 1
  treat_missing_data  = "notBreaching"

  dimensions = {
    TableName = module.dynamodb.carts_table_name
  }

  alarm_actions = [aws_sns_topic.monitoring_alerts.arn]
  ok_actions    = [aws_sns_topic.monitoring_alerts.arn]

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-dynamodb-carts-write-throttles"
      Severity = "HIGH"
    }
  )
}

# Alarm: Orders Table - Write Throttles
resource "aws_cloudwatch_metric_alarm" "dynamodb_orders_write_throttles" {
  alarm_name          = "${local.name_prefix}-dynamodb-orders-write-throttles"
  alarm_description   = "DynamoDB Orders table write requests are being throttled"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "WriteThrottleEvents"
  namespace           = "AWS/DynamoDB"
  period              = 300
  statistic           = "Sum"
  threshold           = 1
  treat_missing_data  = "notBreaching"

  dimensions = {
    TableName = module.dynamodb.orders_table_name
  }

  alarm_actions = [aws_sns_topic.monitoring_alerts.arn]
  ok_actions    = [aws_sns_topic.monitoring_alerts.arn]

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-dynamodb-orders-write-throttles"
      Severity = "HIGH"
    }
  )
}

# ----------------------------------------------------------------------------
# API Gateway Alarms
# ----------------------------------------------------------------------------

# Alarm: API Gateway 5xx Server Errors
resource "aws_cloudwatch_metric_alarm" "api_gateway_5xx_errors" {
  alarm_name          = "${local.name_prefix}-api-gateway-5xx-errors"
  alarm_description   = "API Gateway 5xx error rate exceeded threshold"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = 5    # 5+ Server Errors in 5 Minuten
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiId = module.lambda.api_gateway_id
    Stage = module.lambda.api_gateway_stage_name
  }

  alarm_actions = [aws_sns_topic.monitoring_alerts.arn]
  ok_actions    = [aws_sns_topic.monitoring_alerts.arn]

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-api-gateway-5xx-errors"
      Severity = "HIGH"
    }
  )
}

# Alarm: API Gateway 4xx Client Errors (Optional - hohe Rate kann auf Angriffe hindeuten)
resource "aws_cloudwatch_metric_alarm" "api_gateway_4xx_errors" {
  alarm_name          = "${local.name_prefix}-api-gateway-4xx-errors"
  alarm_description   = "API Gateway 4xx error rate is high (potential attack or misuse)"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "4XXError"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = 100  # 100+ Client Errors in 5 Minuten (ungewöhnlich hoch)
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiId = module.lambda.api_gateway_id
    Stage = module.lambda.api_gateway_stage_name
  }

  alarm_actions = [aws_sns_topic.monitoring_alerts.arn]
  ok_actions    = [aws_sns_topic.monitoring_alerts.arn]

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-api-gateway-4xx-errors"
      Severity = "MEDIUM"
    }
  )
}

# ----------------------------------------------------------------------------
# Outputs
# ----------------------------------------------------------------------------

output "monitoring_sns_topic_arn" {
  description = "ARN des SNS Topics für Monitoring Alerts"
  value       = aws_sns_topic.monitoring_alerts.arn
}

output "monitoring_alarms_created" {
  description = "Liste aller erstellten CloudWatch Alarms"
  value = [
    aws_cloudwatch_metric_alarm.lambda_errors.alarm_name,
    aws_cloudwatch_metric_alarm.lambda_duration.alarm_name,
    aws_cloudwatch_metric_alarm.lambda_throttles.alarm_name,
    aws_cloudwatch_metric_alarm.dynamodb_products_read_throttles.alarm_name,
    aws_cloudwatch_metric_alarm.dynamodb_products_write_throttles.alarm_name,
    aws_cloudwatch_metric_alarm.dynamodb_carts_write_throttles.alarm_name,
    aws_cloudwatch_metric_alarm.dynamodb_orders_write_throttles.alarm_name,
    aws_cloudwatch_metric_alarm.api_gateway_5xx_errors.alarm_name,
    aws_cloudwatch_metric_alarm.api_gateway_4xx_errors.alarm_name,
  ]
}

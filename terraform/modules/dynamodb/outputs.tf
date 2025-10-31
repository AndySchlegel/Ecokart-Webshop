# ============================================================================
# DynamoDB Module Outputs
# ============================================================================

# ----------------------------------------------------------------------------
# Table Names
# ----------------------------------------------------------------------------

output "products_table_name" {
  description = "Name der Products Table"
  value       = aws_dynamodb_table.products.name
}

output "users_table_name" {
  description = "Name der Users Table"
  value       = aws_dynamodb_table.users.name
}

output "carts_table_name" {
  description = "Name der Carts Table"
  value       = aws_dynamodb_table.carts.name
}

output "orders_table_name" {
  description = "Name der Orders Table"
  value       = aws_dynamodb_table.orders.name
}

output "table_names" {
  description = "Liste aller Table Names"
  value = [
    aws_dynamodb_table.products.name,
    aws_dynamodb_table.users.name,
    aws_dynamodb_table.carts.name,
    aws_dynamodb_table.orders.name,
  ]
}

# ----------------------------------------------------------------------------
# Table ARNs
# ----------------------------------------------------------------------------

output "products_table_arn" {
  description = "ARN der Products Table"
  value       = aws_dynamodb_table.products.arn
}

output "users_table_arn" {
  description = "ARN der Users Table"
  value       = aws_dynamodb_table.users.arn
}

output "carts_table_arn" {
  description = "ARN der Carts Table"
  value       = aws_dynamodb_table.carts.arn
}

output "orders_table_arn" {
  description = "ARN der Orders Table"
  value       = aws_dynamodb_table.orders.arn
}

output "table_arns" {
  description = "Liste aller Table ARNs"
  value = [
    aws_dynamodb_table.products.arn,
    aws_dynamodb_table.users.arn,
    aws_dynamodb_table.carts.arn,
    aws_dynamodb_table.orders.arn,
  ]
}

# ----------------------------------------------------------------------------
# GSI Informationen
# ----------------------------------------------------------------------------

output "products_gsi_name" {
  description = "Name des Category Index (Products)"
  value       = "CategoryIndex"
}

output "users_gsi_name" {
  description = "Name des Email Index (Users)"
  value       = "EmailIndex"
}

output "orders_gsi_name" {
  description = "Name des UserOrders Index (Orders)"
  value       = "UserOrdersIndex"
}

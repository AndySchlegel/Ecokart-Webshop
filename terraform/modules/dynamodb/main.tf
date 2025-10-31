# ============================================================================
# DynamoDB Module - Ecokart Tables
# ============================================================================
# Erstellt alle 4 DynamoDB Tabellen mit korrekten Keys und GSIs.

# ----------------------------------------------------------------------------
# Products Table
# ----------------------------------------------------------------------------
# Partition Key: id (String)
# GSI: CategoryIndex (category)
# Zweck: Alle Produkte speichern, Abfrage nach Kategorie ermöglichen

resource "aws_dynamodb_table" "products" {
  name           = "${var.project_name}-products"
  billing_mode   = var.billing_mode
  hash_key       = "id"

  # Provisioned Throughput (nur bei PROVISIONED billing_mode)
  read_capacity  = var.billing_mode == "PROVISIONED" ? var.read_capacity : null
  write_capacity = var.billing_mode == "PROVISIONED" ? var.write_capacity : null

  # Attribute Definitionen (nur für Keys/Indices benötigt)
  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "category"
    type = "S"
  }

  # Global Secondary Index für Kategorie-Filter
  global_secondary_index {
    name               = "CategoryIndex"
    hash_key           = "category"
    projection_type    = "ALL"

    # Provisioned Throughput für GSI (nur bei PROVISIONED)
    read_capacity      = var.billing_mode == "PROVISIONED" ? var.read_capacity : null
    write_capacity     = var.billing_mode == "PROVISIONED" ? var.write_capacity : null
  }

  # Point-in-Time Recovery (für Production empfohlen)
  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  # Server-Side Encryption (Standard)
  server_side_encryption {
    enabled = true
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-products"
      TableType = "Products"
    }
  )
}

# ----------------------------------------------------------------------------
# Users Table
# ----------------------------------------------------------------------------
# Partition Key: id (String)
# GSI: EmailIndex (email)
# Zweck: User Accounts speichern, Login via Email ermöglichen

resource "aws_dynamodb_table" "users" {
  name           = "${var.project_name}-users"
  billing_mode   = var.billing_mode
  hash_key       = "id"

  read_capacity  = var.billing_mode == "PROVISIONED" ? var.read_capacity : null
  write_capacity = var.billing_mode == "PROVISIONED" ? var.write_capacity : null

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  # Global Secondary Index für Email-Lookup (Login)
  global_secondary_index {
    name               = "EmailIndex"
    hash_key           = "email"
    projection_type    = "ALL"
    read_capacity      = var.billing_mode == "PROVISIONED" ? var.read_capacity : null
    write_capacity     = var.billing_mode == "PROVISIONED" ? var.write_capacity : null
  }

  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  server_side_encryption {
    enabled = true
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-users"
      TableType = "Users"
    }
  )
}

# ----------------------------------------------------------------------------
# Carts Table
# ----------------------------------------------------------------------------
# Partition Key: userId (String)
# Kein GSI (1:1 Beziehung User -> Cart)
# Zweck: Shopping Carts speichern, ein Cart pro User

resource "aws_dynamodb_table" "carts" {
  name           = "${var.project_name}-carts"
  billing_mode   = var.billing_mode
  hash_key       = "userId"

  read_capacity  = var.billing_mode == "PROVISIONED" ? var.read_capacity : null
  write_capacity = var.billing_mode == "PROVISIONED" ? var.write_capacity : null

  attribute {
    name = "userId"
    type = "S"
  }

  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  server_side_encryption {
    enabled = true
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-carts"
      TableType = "Carts"
    }
  )
}

# ----------------------------------------------------------------------------
# Orders Table
# ----------------------------------------------------------------------------
# Partition Key: id (String)
# GSI: UserOrdersIndex (userId + createdAt)
# Zweck: Bestellungen speichern, Bestellhistorie pro User abrufen

resource "aws_dynamodb_table" "orders" {
  name           = "${var.project_name}-orders"
  billing_mode   = var.billing_mode
  hash_key       = "id"

  read_capacity  = var.billing_mode == "PROVISIONED" ? var.read_capacity : null
  write_capacity = var.billing_mode == "PROVISIONED" ? var.write_capacity : null

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  # Global Secondary Index für User-Order-History (sortiert nach Datum)
  global_secondary_index {
    name               = "UserOrdersIndex"
    hash_key           = "userId"
    range_key          = "createdAt"
    projection_type    = "ALL"
    read_capacity      = var.billing_mode == "PROVISIONED" ? var.read_capacity : null
    write_capacity     = var.billing_mode == "PROVISIONED" ? var.write_capacity : null
  }

  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  server_side_encryption {
    enabled = true
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-orders"
      TableType = "Orders"
    }
  )
}

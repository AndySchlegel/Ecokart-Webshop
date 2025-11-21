# ============================================================================
# Database Seeding Module
# ============================================================================
# Automatisches Befüllen der DynamoDB Tabellen mit Test-Daten

variable "aws_region" {
  description = "AWS Region"
  type        = string
}

variable "depends_on_resources" {
  description = "List of resources to wait for"
  type        = any
  default     = []
}

variable "backend_path" {
  description = "Pfad zum Backend-Verzeichnis (relativ zu terraform root)"
  type        = string
}

variable "enable_seeding" {
  description = "DB Seeding aktivieren"
  type        = bool
  default     = true
}

variable "aws_profile" {
  description = "AWS Profile für CLI (optional)"
  type        = string
  default     = ""
}

# ----------------------------------------------------------------------------
# DynamoDB Seeding via local-exec
# ----------------------------------------------------------------------------

resource "null_resource" "seed_database" {
  count = var.enable_seeding ? 1 : 0

  depends_on = [var.depends_on_resources]

  provisioner "local-exec" {
    command = <<EOF
      set -e
      echo "🌱 Starting database seeding..."
      cd ${var.backend_path}

      # Install dependencies
      echo "📦 Installing backend dependencies..."
      npm ci

      # Migrate products
      echo "📋 Migrating products to DynamoDB..."
      npm run dynamodb:migrate:single -- --region ${var.aws_region}

      # Create test user
      echo "👤 Creating test user..."
      node scripts/create-test-user.js

      echo "✅ Database seeding completed successfully!"
    EOF

    environment = {
      AWS_REGION  = var.aws_region
      AWS_PROFILE = var.aws_profile != "" ? var.aws_profile : ""
    }
  }

  # Trigger: Nur bei Terraform apply ausführen, nicht bei destroy
  # timestamp() sorgt dafür, dass es bei jedem apply läuft
  triggers = {
    timestamp = timestamp()
  }
}

# ----------------------------------------------------------------------------
# Outputs
# ----------------------------------------------------------------------------

output "seeding_completed" {
  description = "Seeding completed timestamp"
  value       = var.enable_seeding ? null_resource.seed_database[0].id : null
}

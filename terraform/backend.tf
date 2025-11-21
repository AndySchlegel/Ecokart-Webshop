# ============================================================================
# Terraform Backend Configuration - S3 + DynamoDB for State Locking
# ============================================================================
#
# Warum S3 Backend?
# - State wird persistent in S3 gespeichert (nicht lokal!)
# - Alle Team-Mitglieder nutzen denselben State
# - GitHub Actions Workflows nutzen denselben State
# - Terraform sieht existierende Ressourcen
# - Kein "User Pool already exists" Problem mehr!
#
# Wie funktioniert es?
# 1. S3 Bucket speichert terraform.tfstate File
# 2. DynamoDB Table verhindert gleichzeitige Änderungen (State Locking)
# 3. Jeder terraform apply/plan liest State aus S3
# 4. Nach Änderungen wird State zurück zu S3 geschrieben
#
# Setup:
# 1. Erstelle S3 Bucket (einmalig, siehe unten)
# 2. Erstelle DynamoDB Table (einmalig, siehe unten)
# 3. terraform init -reconfigure (migriert lokalen State zu S3)
#
# Autor: Andy Schlegel & Claude
# Datum: 21. November 2025
# ============================================================================

terraform {
  backend "s3" {
    # S3 Bucket Name für State Storage
    # WICHTIG: Muss global eindeutig sein!
    bucket = "ecokart-terraform-state-729403197965"

    # Key = Pfad im Bucket wo State gespeichert wird
    # Format: {environment}/terraform.tfstate
    # Erlaubt mehrere Environments im selben Bucket
    key    = "development/terraform.tfstate"

    # AWS Region
    region = "eu-north-1"

    # Encryption at Rest
    encrypt = true

    # DynamoDB Table für State Locking
    # Verhindert dass 2 Workflows gleichzeitig State ändern
    dynamodb_table = "ecokart-terraform-state-lock"

    # ----------------------------------------------------------------
    # Wichtige Features:
    # ----------------------------------------------------------------
    # - versioning: S3 Bucket sollte Versioning aktiviert haben
    # - encryption: State wird verschlüsselt gespeichert
    # - locking: DynamoDB verhindert Race Conditions
    # ----------------------------------------------------------------
  }
}

# ============================================================================
# SETUP ANLEITUNG (Einmalig!)
# ============================================================================
#
# Diese Ressourcen müssen VOR dem Backend Setup existieren!
# Erstelle sie manuell oder mit einem separaten Terraform Config.
#
# Option A: AWS CLI (EMPFOHLEN für schnelles Setup)
# ===================================================
#
# 1. S3 Bucket erstellen:
# -----------------------
# aws s3api create-bucket \
#   --bucket ecokart-terraform-state-729403197965 \
#   --region eu-north-1 \
#   --create-bucket-configuration LocationConstraint=eu-north-1
#
# 2. S3 Versioning aktivieren:
# -----------------------------
# aws s3api put-bucket-versioning \
#   --bucket ecokart-terraform-state-729403197965 \
#   --versioning-configuration Status=Enabled
#
# 3. S3 Encryption aktivieren:
# -----------------------------
# aws s3api put-bucket-encryption \
#   --bucket ecokart-terraform-state-729403197965 \
#   --server-side-encryption-configuration '{
#     "Rules": [{
#       "ApplyServerSideEncryptionByDefault": {
#         "SSEAlgorithm": "AES256"
#       }
#     }]
#   }'
#
# 4. S3 Public Access blockieren:
# --------------------------------
# aws s3api put-public-access-block \
#   --bucket ecokart-terraform-state-729403197965 \
#   --public-access-block-configuration \
#     BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
#
# 5. DynamoDB Table erstellen:
# -----------------------------
# aws dynamodb create-table \
#   --table-name ecokart-terraform-state-lock \
#   --attribute-definitions AttributeName=LockID,AttributeType=S \
#   --key-schema AttributeName=LockID,KeyType=HASH \
#   --billing-mode PAY_PER_REQUEST \
#   --region eu-north-1
#
# ============================================================================
# MIGRATION VON LOKALEM STATE ZU S3
# ============================================================================
#
# Nach Setup der S3/DynamoDB Ressourcen:
#
# cd terraform/examples/basic
# terraform init -reconfigure
#
# Terraform fragt: "Do you want to copy existing state to the new backend?"
# Antwort: yes
#
# ✅ State ist jetzt in S3!
# ✅ Kein Multi-Pool Problem mehr!
#
# ============================================================================
# VERIFY STATE IN S3
# ============================================================================
#
# aws s3 ls s3://ecokart-terraform-state-729403197965/development/
#
# Du solltest sehen:
# terraform.tfstate
#
# ============================================================================

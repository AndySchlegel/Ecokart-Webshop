#!/bin/bash
# ============================================================================
# Setup Terraform S3 Backend - Automated
# ============================================================================
# Dieses Script erstellt automatisch:
# - S3 Bucket für Terraform State
# - DynamoDB Table für State Locking
# - Konfiguriert Security Best Practices
#
# Usage: ./scripts/setup-terraform-backend.sh
# ============================================================================

set -e  # Exit on error

# Configuration
BUCKET_NAME="ecokart-terraform-state-729403197965"
DYNAMODB_TABLE="ecokart-terraform-state-lock"
AWS_REGION="eu-north-1"

echo "========================================="
echo "🚀 Setting up Terraform S3 Backend"
echo "========================================="
echo ""
echo "Configuration:"
echo "  Bucket:        $BUCKET_NAME"
echo "  DynamoDB:      $DYNAMODB_TABLE"
echo "  Region:        $AWS_REGION"
echo ""

# ============================================================================
# 1. CREATE S3 BUCKET
# ============================================================================

echo "📦 Step 1: Creating S3 Bucket..."

if aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
  echo "   ℹ️  Bucket already exists: $BUCKET_NAME"
else
  echo "   - Creating bucket: $BUCKET_NAME"
  aws s3api create-bucket \
    --bucket "$BUCKET_NAME" \
    --region "$AWS_REGION" \
    --create-bucket-configuration LocationConstraint="$AWS_REGION"
  echo "   ✅ Bucket created!"
fi

# ============================================================================
# 2. ENABLE VERSIONING
# ============================================================================

echo ""
echo "🔄 Step 2: Enabling S3 Versioning..."

aws s3api put-bucket-versioning \
  --bucket "$BUCKET_NAME" \
  --versioning-configuration Status=Enabled

echo "   ✅ Versioning enabled!"

# ============================================================================
# 3. ENABLE ENCRYPTION
# ============================================================================

echo ""
echo "🔐 Step 3: Enabling S3 Encryption..."

aws s3api put-bucket-encryption \
  --bucket "$BUCKET_NAME" \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      },
      "BucketKeyEnabled": true
    }]
  }'

echo "   ✅ Encryption enabled!"

# ============================================================================
# 4. BLOCK PUBLIC ACCESS
# ============================================================================

echo ""
echo "🛡️  Step 4: Blocking Public Access..."

aws s3api put-public-access-block \
  --bucket "$BUCKET_NAME" \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

echo "   ✅ Public access blocked!"

# ============================================================================
# 5. CREATE DYNAMODB TABLE
# ============================================================================

echo ""
echo "🔒 Step 5: Creating DynamoDB Table for State Locking..."

if aws dynamodb describe-table --table-name "$DYNAMODB_TABLE" --region "$AWS_REGION" 2>/dev/null >/dev/null; then
  echo "   ℹ️  Table already exists: $DYNAMODB_TABLE"
else
  echo "   - Creating table: $DYNAMODB_TABLE"
  aws dynamodb create-table \
    --table-name "$DYNAMODB_TABLE" \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region "$AWS_REGION" \
    --tags Key=Project,Value=ecokart Key=Purpose,Value=terraform-state-lock

  echo "   ⏰ Waiting for table to be active..."
  aws dynamodb wait table-exists \
    --table-name "$DYNAMODB_TABLE" \
    --region "$AWS_REGION"

  echo "   ✅ Table created and active!"
fi

# ============================================================================
# 6. VERIFY SETUP
# ============================================================================

echo ""
echo "✅ Step 6: Verifying Setup..."

# Check Bucket
if aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
  echo "   ✅ S3 Bucket exists: $BUCKET_NAME"
else
  echo "   ❌ S3 Bucket NOT found!"
  exit 1
fi

# Check Versioning
VERSIONING=$(aws s3api get-bucket-versioning --bucket "$BUCKET_NAME" --query 'Status' --output text)
if [ "$VERSIONING" == "Enabled" ]; then
  echo "   ✅ S3 Versioning enabled"
else
  echo "   ⚠️  S3 Versioning NOT enabled"
fi

# Check Encryption
ENCRYPTION=$(aws s3api get-bucket-encryption --bucket "$BUCKET_NAME" 2>/dev/null)
if [ -n "$ENCRYPTION" ]; then
  echo "   ✅ S3 Encryption enabled"
else
  echo "   ⚠️  S3 Encryption NOT enabled"
fi

# Check DynamoDB Table
TABLE_STATUS=$(aws dynamodb describe-table --table-name "$DYNAMODB_TABLE" --region "$AWS_REGION" --query 'Table.TableStatus' --output text 2>/dev/null)
if [ "$TABLE_STATUS" == "ACTIVE" ]; then
  echo "   ✅ DynamoDB Table active: $DYNAMODB_TABLE"
else
  echo "   ❌ DynamoDB Table NOT active!"
  exit 1
fi

# ============================================================================
# 7. NEXT STEPS
# ============================================================================

echo ""
echo "========================================="
echo "🎉 Backend Setup Complete!"
echo "========================================="
echo ""
echo "Next Steps:"
echo ""
echo "1. Initialize Terraform with S3 Backend:"
echo "   cd terraform/examples/basic"
echo "   terraform init -reconfigure"
echo ""
echo "2. When asked 'Do you want to copy existing state?'"
echo "   Answer: yes (if you have local state to migrate)"
echo "   Answer: no  (if starting fresh)"
echo ""
echo "3. Verify State in S3:"
echo "   aws s3 ls s3://$BUCKET_NAME/development/"
echo ""
echo "4. Test with terraform plan:"
echo "   terraform plan"
echo ""
echo "✅ After this, all deploys will use shared S3 state!"
echo "✅ No more duplicate User Pools!"
echo ""

#!/bin/bash
# ============================================================================
# Create Bootstrap IAM User for GitHub Actions
# ============================================================================
# This script creates a minimal IAM user with permissions to create/update
# the GitHub Actions OIDC infrastructure.
#
# Usage:
#   ./scripts/create-bootstrap-user.sh
#
# Requirements:
#   - AWS CLI configured with admin permissions
#   - jq installed (for JSON parsing)
# ============================================================================

set -e

USER_NAME="ecokart-bootstrap-user"
POLICY_NAME="EcokartBootstrapPolicy"

echo "🔐 Creating Bootstrap IAM User: $USER_NAME"
echo ""

# ============================================================================
# 1. Create IAM User
# ============================================================================
echo "📦 Step 1: Creating IAM User..."

if aws iam get-user --user-name "$USER_NAME" 2>/dev/null; then
  echo "✅ User already exists: $USER_NAME"
else
  aws iam create-user --user-name "$USER_NAME"
  echo "✅ User created: $USER_NAME"
fi

# ============================================================================
# 2. Create Bootstrap Policy
# ============================================================================
echo ""
echo "📜 Step 2: Creating Bootstrap Policy..."

POLICY_DOCUMENT=$(cat <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "OIDCProviderManagement",
      "Effect": "Allow",
      "Action": [
        "iam:CreateOpenIDConnectProvider",
        "iam:GetOpenIDConnectProvider",
        "iam:ListOpenIDConnectProviders",
        "iam:DeleteOpenIDConnectProvider",
        "iam:TagOpenIDConnectProvider"
      ],
      "Resource": "*"
    },
    {
      "Sid": "RoleManagement",
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:GetRole",
        "iam:ListRoles",
        "iam:TagRole",
        "iam:UpdateAssumeRolePolicy"
      ],
      "Resource": "arn:aws:iam::*:role/ecokart-github-actions-role"
    },
    {
      "Sid": "PolicyManagement",
      "Effect": "Allow",
      "Action": [
        "iam:CreatePolicy",
        "iam:GetPolicy",
        "iam:GetPolicyVersion",
        "iam:ListPolicies",
        "iam:ListPolicyVersions",
        "iam:TagPolicy"
      ],
      "Resource": "arn:aws:iam::*:policy/ecokart-github-actions-role-*"
    },
    {
      "Sid": "PolicyAttachment",
      "Effect": "Allow",
      "Action": [
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:ListAttachedRolePolicies"
      ],
      "Resource": "arn:aws:iam::*:role/ecokart-github-actions-role"
    },
    {
      "Sid": "CallerIdentity",
      "Effect": "Allow",
      "Action": [
        "sts:GetCallerIdentity"
      ],
      "Resource": "*"
    }
  ]
}
EOF
)

# Check if policy already exists
POLICY_ARN=$(aws iam list-policies --query "Policies[?PolicyName=='$POLICY_NAME'].Arn" --output text)

if [ -n "$POLICY_ARN" ]; then
  echo "✅ Policy already exists: $POLICY_ARN"
else
  POLICY_ARN=$(aws iam create-policy \
    --policy-name "$POLICY_NAME" \
    --policy-document "$POLICY_DOCUMENT" \
    --query 'Policy.Arn' \
    --output text)
  echo "✅ Policy created: $POLICY_ARN"
fi

# ============================================================================
# 3. Attach Policy to User
# ============================================================================
echo ""
echo "🔗 Step 3: Attaching Policy to User..."

aws iam attach-user-policy \
  --user-name "$USER_NAME" \
  --policy-arn "$POLICY_ARN" 2>/dev/null || echo "✅ Policy already attached"

echo "✅ Policy attached to user"

# ============================================================================
# 4. Create Access Keys
# ============================================================================
echo ""
echo "🔑 Step 4: Creating Access Keys..."
echo ""
echo "⚠️  IMPORTANT: Save these credentials securely!"
echo "⚠️  They will only be shown ONCE!"
echo ""

# Check if user already has access keys
EXISTING_KEYS=$(aws iam list-access-keys --user-name "$USER_NAME" --query 'AccessKeyMetadata[*].AccessKeyId' --output text)

if [ -n "$EXISTING_KEYS" ]; then
  echo "⚠️  User already has access keys:"
  echo "$EXISTING_KEYS"
  echo ""
  read -p "Do you want to create new keys? Old keys will remain active. (y/N): " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Aborted. Use existing keys or delete them first."
    exit 0
  fi
fi

# Create new access keys
CREDENTIALS=$(aws iam create-access-key --user-name "$USER_NAME" --output json)

ACCESS_KEY_ID=$(echo "$CREDENTIALS" | jq -r '.AccessKey.AccessKeyId')
SECRET_ACCESS_KEY=$(echo "$CREDENTIALS" | jq -r '.AccessKey.SecretAccessKey')

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                  🔑 BOOTSTRAP CREDENTIALS                      ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║                                                                ║"
echo "║  AWS_BOOTSTRAP_ACCESS_KEY_ID:                                  ║"
echo "║  $ACCESS_KEY_ID                              ║"
echo "║                                                                ║"
echo "║  AWS_BOOTSTRAP_SECRET_ACCESS_KEY:                              ║"
echo "║  $SECRET_ACCESS_KEY        ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Go to GitHub Repository → Settings → Secrets → Actions"
echo ""
echo "2. Add these 2 secrets:"
echo "   - Name: AWS_BOOTSTRAP_ACCESS_KEY_ID"
echo "     Value: $ACCESS_KEY_ID"
echo ""
echo "   - Name: AWS_BOOTSTRAP_SECRET_ACCESS_KEY"
echo "     Value: $SECRET_ACCESS_KEY"
echo ""
echo "3. Run the Bootstrap workflow in GitHub Actions"
echo ""
echo "✅ Bootstrap user setup complete!"
echo ""
echo "⚠️  SECURITY REMINDER:"
echo "   - These credentials have limited permissions (only IAM Role/Policy management)"
echo "   - They cannot access your application data (DynamoDB, S3, etc.)"
echo "   - Store them securely in GitHub Secrets"
echo "   - Never commit them to git!"
echo ""

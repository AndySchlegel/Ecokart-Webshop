#!/bin/bash
# ================================================================
# Cognito Admin User Auto-Creation Script
# ================================================================
# Was macht dieses Script?
# - Erstellt automatisch einen Admin-User bei Deployment
# - Setzt custom:role = admin
# - Email als verified markieren
# - Temporary password setzen
#
# Wird aufgerufen von: Terraform null_resource Provisioner
# ================================================================

set -e  # Exit bei Fehler

# ----------------------------------------------------------------
# Input Parameter (von Terraform übergeben)
# ----------------------------------------------------------------
USER_POOL_ID="$1"
ADMIN_EMAIL="${2:-admin@ecokart.com}"
TEMP_PASSWORD="${3:-EcokartAdmin2025!}"
AWS_REGION="${4:-eu-north-1}"

# ----------------------------------------------------------------
# Validierung
# ----------------------------------------------------------------
if [ -z "$USER_POOL_ID" ]; then
  echo "❌ ERROR: USER_POOL_ID ist erforderlich!"
  exit 1
fi

echo "================================================================"
echo "🔐 Cognito Admin User Auto-Creation"
echo "================================================================"
echo "User Pool ID: $USER_POOL_ID"
echo "Admin Email:  $ADMIN_EMAIL"
echo "AWS Region:   $AWS_REGION"
echo "================================================================"

# ----------------------------------------------------------------
# Prüfen ob User bereits existiert
# ----------------------------------------------------------------
echo "🔍 Prüfe ob Admin User bereits existiert..."

USER_EXISTS=$(aws cognito-idp list-users \
  --user-pool-id "$USER_POOL_ID" \
  --filter "email = \"$ADMIN_EMAIL\"" \
  --region "$AWS_REGION" \
  --query 'Users[0].Username' \
  --output text 2>/dev/null || echo "None")

if [ "$USER_EXISTS" != "None" ] && [ -n "$USER_EXISTS" ]; then
  echo "✅ Admin User existiert bereits: $ADMIN_EMAIL"
  echo "   Username: $USER_EXISTS"
  echo "   Überspringe Erstellung."
  exit 0
fi

echo "📝 Admin User existiert noch nicht, erstelle jetzt..."

# ----------------------------------------------------------------
# Admin User erstellen
# ----------------------------------------------------------------
echo "🚀 Erstelle Admin User: $ADMIN_EMAIL"

aws cognito-idp admin-create-user \
  --user-pool-id "$USER_POOL_ID" \
  --username "$ADMIN_EMAIL" \
  --user-attributes \
    Name=email,Value="$ADMIN_EMAIL" \
    Name=email_verified,Value=true \
    Name=custom:role,Value=admin \
  --temporary-password "$TEMP_PASSWORD" \
  --message-action SUPPRESS \
  --region "$AWS_REGION"

echo "✅ Admin User erfolgreich erstellt!"

# ----------------------------------------------------------------
# User Status prüfen
# ----------------------------------------------------------------
echo "🔍 Prüfe User Status..."

USER_STATUS=$(aws cognito-idp admin-get-user \
  --user-pool-id "$USER_POOL_ID" \
  --username "$ADMIN_EMAIL" \
  --region "$AWS_REGION" \
  --query 'UserStatus' \
  --output text)

echo "   Status: $USER_STATUS"

# ----------------------------------------------------------------
# Zusammenfassung
# ----------------------------------------------------------------
echo "================================================================"
echo "✅ ADMIN USER SETUP ERFOLGREICH!"
echo "================================================================"
echo ""
echo "📧 Email:    $ADMIN_EMAIL"
echo "🔑 Password: $TEMP_PASSWORD"
echo "👤 Role:     admin"
echo "✉️  Verified: true"
echo ""
echo "⚠️  WICHTIG:"
echo "   Beim ersten Login musst du das Passwort ändern!"
echo ""
echo "🔗 Login:"
echo "   1. Gehe zum Customer Frontend (Amplify URL)"
echo "   2. Klicke auf 'JETZT ANMELDEN'"
echo "   3. Login mit obigen Credentials"
echo "   4. Setze ein neues sicheres Passwort"
echo ""
echo "================================================================"

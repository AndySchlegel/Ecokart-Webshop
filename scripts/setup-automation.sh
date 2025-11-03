#!/bin/bash
# ============================================================================
# Ecokart CI/CD Automation Setup
# ============================================================================
# Dieses Script richtet die Automatisierung für Ecokart ein.
#
# Was wird automatisiert:
# - ✅ GitHub OAuth Token (einmalig in Parameter Store)
# - ✅ Basic Auth (automatisch via Terraform)
# - ✅ DynamoDB Seeding (automatisch via Terraform)
# - ✅ Test-User Creation (automatisch via Terraform)

set -e

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          Ecokart CI/CD Automation Setup                          ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ----------------------------------------------------------------------------
# Step 1: GitHub Token erstellen
# ----------------------------------------------------------------------------

echo -e "${YELLOW}📝 Schritt 1/3: GitHub Token Setup${NC}"
echo ""
echo "Für die vollständige Automatisierung benötigst du einen GitHub Personal Access Token."
echo ""
echo "Bitte folge diesen Schritten:"
echo "  1. Öffne: https://github.com/settings/tokens"
echo "  2. Klicke auf 'Generate new token (classic)'"
echo "  3. Token Name: 'Ecokart Terraform'"
echo "  4. Expiration: 'No expiration' (oder 90 days)"
echo "  5. Scope wählen: ✅ repo (Full control of private repositories)"
echo "  6. Klicke 'Generate token'"
echo "  7. Kopiere den Token (ghp_...)"
echo ""

read -p "Hast du den Token erstellt? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Setup abgebrochen${NC}"
    echo "   Bitte erstelle zuerst den GitHub Token und führe das Script erneut aus."
    exit 1
fi

echo ""
read -p "Bitte füge deinen GitHub Token ein (ghp_...): " GITHUB_TOKEN
echo ""

# Validate token format
if [[ ! $GITHUB_TOKEN =~ ^ghp_ ]]; then
    echo -e "${RED}❌ Ungültiges Token Format${NC}"
    echo "   Token sollte mit 'ghp_' beginnen (Classic Token)"
    exit 1
fi

# Store in AWS Parameter Store
echo -e "${GREEN}💾 Speichere Token in AWS Parameter Store...${NC}"

aws ssm put-parameter \
  --name "/ecokart/development/github-token" \
  --value "$GITHUB_TOKEN" \
  --type "SecureString" \
  --region eu-north-1 \
  --overwrite 2>/dev/null || {
    echo -e "${YELLOW}⚠️  Parameter existiert bereits, wird überschrieben...${NC}"
    aws ssm put-parameter \
      --name "/ecokart/development/github-token" \
      --value "$GITHUB_TOKEN" \
      --type "SecureString" \
      --region eu-north-1 \
      --overwrite
  }

echo -e "${GREEN}✅ Token erfolgreich gespeichert!${NC}"
echo ""

# ----------------------------------------------------------------------------
# Step 2: Terraform Module aktivieren
# ----------------------------------------------------------------------------

echo -e "${YELLOW}📝 Schritt 2/3: Auto-Seeding aktivieren${NC}"
echo ""

# Check if seed module is already included
TERRAFORM_MAIN="../terraform/main.tf"

if grep -q "module \"database_seeding\"" "$TERRAFORM_MAIN"; then
    echo -e "${GREEN}✅ Auto-Seeding Module ist bereits aktiviert${NC}"
else
    echo -e "${YELLOW}⚠️  Auto-Seeding Module noch nicht aktiviert${NC}"
    echo ""
    echo "Füge folgendes zum terraform/main.tf hinzu:"
    echo ""
    cat << 'EOF'
# ----------------------------------------------------------------------------
# Database Seeding (Optional - nur für Development)
# ----------------------------------------------------------------------------

module "database_seeding" {
  source = "./modules/seed"

  aws_region            = var.aws_region
  backend_path          = "${path.module}/../backend"
  enable_seeding        = var.enable_auto_seed
  depends_on_resources  = [module.dynamodb]
}
EOF
    echo ""
    read -p "Soll ich das automatisch hinzufügen? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Backup erstellen
        cp "$TERRAFORM_MAIN" "${TERRAFORM_MAIN}.backup"

        # Module hinzufügen
        cat >> "$TERRAFORM_MAIN" << 'EOF'

# ----------------------------------------------------------------------------
# Database Seeding (Optional - nur für Development)
# ----------------------------------------------------------------------------

module "database_seeding" {
  source = "./modules/seed"

  aws_region            = var.aws_region
  backend_path          = "${path.module}/../backend"
  enable_seeding        = var.enable_auto_seed
  depends_on_resources  = [module.dynamodb]
}
EOF
        echo -e "${GREEN}✅ Module hinzugefügt (Backup: terraform/main.tf.backup)${NC}"
    else
        echo -e "${YELLOW}⚠️  Bitte füge das Module manuell hinzu${NC}"
    fi
fi

echo ""

# ----------------------------------------------------------------------------
# Step 3: Fertig
# ----------------------------------------------------------------------------

echo -e "${YELLOW}📝 Schritt 3/3: Setup abgeschlossen${NC}"
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    ✅ Setup erfolgreich!                          ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Was wurde konfiguriert:"
echo "  ✅ GitHub Token in Parameter Store gespeichert"
echo "  ✅ Auto-Seeding Module (wenn aktiviert)"
echo ""
echo "Nächster Schritt - Deployment:"
echo ""
echo "  cd terraform/examples/basic"
echo ""
echo "  # Token aus Parameter Store holen"
echo "  export TF_VAR_github_access_token=\$(aws ssm get-parameter \\"
echo "    --name \"/ecokart/development/github-token\" \\"
echo "    --with-decryption \\"
echo "    --query 'Parameter.Value' \\"
echo "    --output text \\"
echo "    --region eu-north-1)"
echo ""
echo "  # Deploy mit Automatisierung"
echo "  terraform apply -auto-approve"
echo ""
echo "Das wars! 🎉"
echo ""
echo "Was jetzt automatisch passiert:"
echo "  ✅ Infrastruktur wird deployed"
echo "  ✅ Basic Auth wird gesetzt"
echo "  ✅ GitHub OAuth Token wird verwendet"
echo "  ✅ DynamoDB wird automatisch befüllt"
echo "  ✅ Test-User werden automatisch erstellt"
echo ""
echo "Noch manuell:"
echo "  ⚠️  GitHub OAuth Reconnect (einmalig in AWS Console)"
echo "     → Führe ./connect-github.sh aus"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"

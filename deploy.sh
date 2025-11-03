#!/bin/bash
# ============================================================================
# Ecokart ONE-CLICK Deployment
# ============================================================================
# Dieses Script deployt ALLES mit EINEM Befehl!
#
# Usage:
#   ./deploy.sh          # Normales Deployment
#   ./deploy.sh destroy  # Alles löschen

set -e

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

COMMAND=${1:-apply}

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          Ecokart ONE-CLICK Deployment                            ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ----------------------------------------------------------------------------
# Check: GitHub Token in Parameter Store
# ----------------------------------------------------------------------------

echo -e "${YELLOW}🔍 Prüfe GitHub Token...${NC}"

if ! aws ssm get-parameter --name "/ecokart/development/github-token" --region eu-north-1 &>/dev/null; then
    echo -e "${RED}❌ GitHub Token nicht gefunden!${NC}"
    echo ""
    echo "Bitte führe zuerst das Setup aus:"
    echo "  ${YELLOW}./scripts/setup-automation.sh${NC}"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Token gefunden${NC}"
echo ""

# ----------------------------------------------------------------------------
# Load GitHub Token
# ----------------------------------------------------------------------------

echo -e "${YELLOW}🔑 Lade GitHub Token...${NC}"

export TF_VAR_github_access_token=$(aws ssm get-parameter \
  --name "/ecokart/development/github-token" \
  --with-decryption \
  --query 'Parameter.Value' \
  --output text \
  --region eu-north-1)

echo -e "${GREEN}✅ Token geladen${NC}"
echo ""

# ----------------------------------------------------------------------------
# Terraform Init & Apply or Destroy
# ----------------------------------------------------------------------------

cd terraform/examples/basic

echo -e "${YELLOW}📦 Initialisiere Terraform...${NC}"
terraform init -upgrade
echo -e "${GREEN}✅ Terraform initialisiert${NC}"
echo ""

# ----------------------------------------------------------------------------
# Clean Backend Dependencies (prevent race condition)
# ----------------------------------------------------------------------------

echo -e "${YELLOW}🧹 Lösche alte Backend Dependencies...${NC}"
cd ../../..
rm -rf backend/node_modules
cd terraform/examples/basic
echo -e "${GREEN}✅ Dependencies bereinigt${NC}"
echo ""

if [ "$COMMAND" = "destroy" ]; then
    echo -e "${RED}🗑️  Lösche Infrastruktur...${NC}"
    echo ""
    terraform destroy -auto-approve

    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    ✅ Destroy abgeschlossen!                      ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    exit 0
fi

echo -e "${YELLOW}🚀 Deploye Infrastruktur...${NC}"
echo ""
echo "Das dauert ca. 8-10 Minuten. Folgendes wird automatisch gemacht:"
echo "  ✅ DynamoDB Tabellen erstellen"
echo "  ✅ Lambda Backend deployen"
echo "  ✅ API Gateway konfigurieren"
echo "  ✅ Amplify Apps erstellen"
echo "  ✅ Basic Auth setzen"
echo "  ✅ DynamoDB mit Produkten befüllen (31 Stück)"
echo "  ✅ Test-User erstellen (demo@ecokart.com)"
echo "  ✅ Admin-User erstellen (admin@ecokart.com)"
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

terraform apply -auto-approve

echo ""
echo -e "${GREEN}✅ Terraform Deployment abgeschlossen!${NC}"
echo ""

# ----------------------------------------------------------------------------
# Get Outputs
# ----------------------------------------------------------------------------

CUSTOMER_APP_ID=$(terraform output -raw amplify_app_id 2>/dev/null || echo "")
ADMIN_APP_ID=$(terraform output -raw admin_amplify_app_id 2>/dev/null || echo "")
CUSTOMER_URL=$(terraform output -raw amplify_app_url 2>/dev/null || echo "")
ADMIN_URL=$(terraform output -raw admin_amplify_app_url 2>/dev/null || echo "")
API_URL=$(terraform output -raw api_gateway_url 2>/dev/null || echo "")
AWS_REGION=$(terraform output -raw aws_region 2>/dev/null || echo "eu-north-1")

# ----------------------------------------------------------------------------
# GitHub OAuth Verbindung (nur wenn nötig)
# ----------------------------------------------------------------------------

echo -e "${YELLOW}🔗 Prüfe GitHub Verbindung...${NC}"

# Check if apps are already connected
CUSTOMER_CONNECTED=$(aws amplify get-branch \
  --app-id "$CUSTOMER_APP_ID" \
  --branch-name main \
  --region "$AWS_REGION" \
  --query 'branch.associatedResources' \
  --output text 2>/dev/null || echo "")

if [ -z "$CUSTOMER_CONNECTED" ]; then
    echo -e "${YELLOW}⚠️  GitHub OAuth noch nicht verbunden${NC}"
    echo ""
    echo "WICHTIG: Du musst GitHub OAuth einmalig verbinden!"
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}Für JEDE App (Customer + Admin):${NC}"
    echo ""
    echo "  1️⃣  Öffne die AWS Console URL (siehe unten)"
    echo "  2️⃣  Klicke auf Tab 'Hosting environments'"
    echo "  3️⃣  Klicke 'Reconnect repository'"
    echo "  4️⃣  Wähle 'GitHub' und autorisiere"
    echo "  5️⃣  Warte bis Status '✓ Connected'"
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "AWS Console URLs:"
    echo ""
    echo -e "${GREEN}Customer Frontend:${NC}"
    echo "  https://${AWS_REGION}.console.aws.amazon.com/amplify/home?region=${AWS_REGION}#/${CUSTOMER_APP_ID}"
    echo ""
    echo -e "${GREEN}Admin Frontend:${NC}"
    echo "  https://${AWS_REGION}.console.aws.amazon.com/amplify/home?region=${AWS_REGION}#/${ADMIN_APP_ID}"
    echo ""

    read -p "Sollen die URLs im Browser geöffnet werden? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "https://${AWS_REGION}.console.aws.amazon.com/amplify/home?region=${AWS_REGION}#/${CUSTOMER_APP_ID}" 2>/dev/null || \
        xdg-open "https://${AWS_REGION}.console.aws.amazon.com/amplify/home?region=${AWS_REGION}#/${CUSTOMER_APP_ID}" 2>/dev/null || \
        echo "Bitte öffne manuell: https://${AWS_REGION}.console.aws.amazon.com/amplify/home?region=${AWS_REGION}#/${CUSTOMER_APP_ID}"

        sleep 2

        open "https://${AWS_REGION}.console.aws.amazon.com/amplify/home?region=${AWS_REGION}#/${ADMIN_APP_ID}" 2>/dev/null || \
        xdg-open "https://${AWS_REGION}.console.aws.amazon.com/amplify/home?region=${AWS_REGION}#/${ADMIN_APP_ID}" 2>/dev/null || \
        echo "Bitte öffne manuell: https://${AWS_REGION}.console.aws.amazon.com/amplify/home?region=${AWS_REGION}#/${ADMIN_APP_ID}"
    fi
    echo ""
else
    echo -e "${GREEN}✅ GitHub bereits verbunden${NC}"
    echo ""
fi

# ----------------------------------------------------------------------------
# Final Output
# ----------------------------------------------------------------------------

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    🎉 DEPLOYMENT ERFOLGREICH!                     ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📋 Deine URLs:${NC}"
echo ""
echo -e "${YELLOW}Customer Frontend:${NC}"
echo "  URL:        $CUSTOMER_URL"
echo "  Basic Auth: demo / test1234"
echo "  App Login:  demo@ecokart.com / Demo1234!"
echo ""
echo -e "${YELLOW}Admin Frontend:${NC}"
echo "  URL:        $ADMIN_URL"
echo "  Basic Auth: admin / admin1234"
echo "  App Login:  admin@ecokart.com / ecokart2025"
echo ""
echo -e "${YELLOW}Backend API:${NC}"
echo "  URL:        $API_URL"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Was wurde automatisch gemacht:"
echo "  ✅ Infrastruktur deployed (DynamoDB, Lambda, API Gateway, Amplify)"
echo "  ✅ Basic Auth gesetzt"
echo "  ✅ 31 Produkte in DynamoDB"
echo "  ✅ Test-User erstellt"
echo "  ✅ Admin-User erstellt"
echo ""
if [ -z "$CUSTOMER_CONNECTED" ]; then
    echo -e "${YELLOW}⚠️  Noch zu tun:${NC}"
    echo "  → GitHub OAuth verbinden (siehe URLs oben)"
    echo "  → Dauert 2 Minuten, muss nur 1x gemacht werden"
    echo ""
fi
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo ""

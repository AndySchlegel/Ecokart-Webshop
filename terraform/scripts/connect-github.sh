#!/bin/bash
# ============================================================================
# AWS Amplify GitHub Connection Helper
# ============================================================================
# Dieses Script öffnet automatisch die AWS Console URLs für alle Amplify Apps,
# die eine GitHub-Verbindung benötigen.
#
# Usage: ./connect-github.sh

set -e

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        AWS Amplify GitHub Connection Helper                      ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if terraform is available and has output
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}❌ Error: terraform nicht gefunden${NC}"
    echo "   Bitte installiere Terraform"
    exit 1
fi

# Try to get terraform output
CUSTOMER_APP_ID=$(terraform output -raw amplify_app_id 2>/dev/null)
TERRAFORM_EXIT_CODE=$?

if [ $TERRAFORM_EXIT_CODE -ne 0 ]; then
    echo -e "${RED}❌ Error: Kein Terraform State gefunden${NC}"
    echo ""
    echo "   Bitte führe das Script aus dem Verzeichnis aus, wo du 'terraform apply' ausgeführt hast:"
    echo "   ${YELLOW}cd terraform/examples/basic${NC}"
    echo "   ${YELLOW}./connect-github.sh${NC}"
    echo ""
    exit 1
fi

# Get AWS Region
AWS_REGION=$(terraform output -raw aws_region 2>/dev/null || echo "eu-north-1")

# Re-get Customer Frontend App ID (already fetched above)
if [ -n "$CUSTOMER_APP_ID" ] && [ "$CUSTOMER_APP_ID" != "null" ]; then
    CUSTOMER_URL="https://${AWS_REGION}.console.aws.amazon.com/amplify/home?region=${AWS_REGION}#/${CUSTOMER_APP_ID}"
    echo -e "${YELLOW}📱 Customer Frontend App gefunden${NC}"
    echo "   App ID: $CUSTOMER_APP_ID"
    echo "   Console URL: $CUSTOMER_URL"
    echo ""
fi

# Get Admin Frontend App ID
ADMIN_APP_ID=$(terraform output -raw admin_amplify_app_id 2>/dev/null)
if [ -n "$ADMIN_APP_ID" ] && [ "$ADMIN_APP_ID" != "null" ]; then
    ADMIN_URL="https://${AWS_REGION}.console.aws.amazon.com/amplify/home?region=${AWS_REGION}#/${ADMIN_APP_ID}"
    echo -e "${YELLOW}🔧 Admin Frontend App gefunden${NC}"
    echo "   App ID: $ADMIN_APP_ID"
    echo "   Console URL: $ADMIN_URL"
    echo ""
fi

# Check if any apps were found
if [ -z "$CUSTOMER_APP_ID" ] && [ -z "$ADMIN_APP_ID" ]; then
    echo -e "${RED}❌ Keine Amplify Apps gefunden${NC}"
    echo "   Stelle sicher dass enable_amplify=true oder enable_admin_amplify=true gesetzt ist"
    exit 1
fi

echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  GitHub-Verbindung herstellen - 3 Schritte                        ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Für JEDE App (wird automatisch geöffnet):"
echo ""
echo "  1️⃣  Klicke auf 'Reconnect repository' oder 'Connect repository'"
echo "  2️⃣  Wähle 'GitHub' als Provider"
echo "  3️⃣  Autorisiere AWS Amplify (falls gefragt)"
echo "  4️⃣  Warte bis Status auf '✓ Connected' wechselt"
echo ""
echo -e "${YELLOW}⚠️  Dies muss nur EINMAL gemacht werden!${NC}"
echo "    Nach der Verbindung läuft alles automatisch."
echo ""

# Ask user if they want to open URLs
read -p "Sollen die AWS Console URLs jetzt geöffnet werden? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -n "$CUSTOMER_APP_ID" ]; then
        echo -e "${GREEN}🌐 Öffne Customer Frontend App...${NC}"
        open "$CUSTOMER_URL" || xdg-open "$CUSTOMER_URL" 2>/dev/null || echo "Bitte öffne manuell: $CUSTOMER_URL"
        sleep 2
    fi

    if [ -n "$ADMIN_APP_ID" ]; then
        echo -e "${GREEN}🌐 Öffne Admin Frontend App...${NC}"
        open "$ADMIN_URL" || xdg-open "$ADMIN_URL" 2>/dev/null || echo "Bitte öffne manuell: $ADMIN_URL"
    fi

    echo ""
    echo -e "${GREEN}✅ Browser-Tabs geöffnet!${NC}"
    echo ""
else
    echo ""
    echo "URLs zum manuellen Öffnen:"
    [ -n "$CUSTOMER_APP_ID" ] && echo "  Customer: $CUSTOMER_URL"
    [ -n "$ADMIN_APP_ID" ] && echo "  Admin: $ADMIN_URL"
    echo ""
fi

echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Nach der Verbindung:${NC}"
echo ""
echo "  ✅ Builds starten automatisch"
echo "  ✅ Jeder 'git push' deployed automatisch"
echo "  ✅ Keine weitere manuelle Aktion nötig"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"

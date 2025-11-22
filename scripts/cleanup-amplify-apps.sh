#!/bin/bash
# ============================================================================
# Cleanup Old Amplify Apps
# ============================================================================
# Löscht ALLE alten Amplify Apps

set -e

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

AWS_REGION="eu-north-1"

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          Cleanup Old Amplify Apps                                ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}🔍 Listing all Amplify apps...${NC}"
echo ""

# Get all Amplify app IDs
APP_IDS=$(aws amplify list-apps --region "$AWS_REGION" --query 'apps[*].appId' --output text)

if [ -z "$APP_IDS" ]; then
  echo -e "${GREEN}✅ No Amplify apps found!${NC}"
  exit 0
fi

echo "Found apps:"
for app_id in $APP_IDS; do
  APP_NAME=$(aws amplify get-app --app-id "$app_id" --region "$AWS_REGION" --query 'app.name' --output text)
  echo -e "  - ${YELLOW}$APP_NAME${NC} (ID: $app_id)"
done

echo ""
echo -e "${RED}⚠️  WARNING: This will delete ALL Amplify apps!${NC}"
read -p "Are you sure? Type 'yes' to continue: " -r
echo ""

if [[ ! $REPLY =~ ^yes$ ]]; then
  echo "Aborted."
  exit 0
fi

echo -e "${RED}🗑️  Deleting apps...${NC}"
echo ""

for app_id in $APP_IDS; do
  APP_NAME=$(aws amplify get-app --app-id "$app_id" --region "$AWS_REGION" --query 'app.name' --output text)

  echo -e "${YELLOW}  Deleting: $APP_NAME ($app_id)${NC}"

  aws amplify delete-app --app-id "$app_id" --region "$AWS_REGION"

  echo -e "  ${GREEN}✓ Deleted${NC}"
done

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          ✅ All Amplify apps deleted!                             ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Next steps:"
echo "  1. Run: ./cleanup-dev.sh  # Clean all infrastructure"
echo "  2. Delete Terraform state: rm -rf terraform/examples/basic/.terraform terraform/examples/basic/terraform.tfstate*"
echo "  3. Redeploy via GitHub Actions or ./deploy.sh"
echo ""

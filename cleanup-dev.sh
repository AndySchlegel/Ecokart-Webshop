#!/bin/bash
# ============================================================================
# Ecokart Complete Infrastructure Cleanup
# ============================================================================
# Löscht ALLE Ressourcen: IAM, Lambda, API Gateway, CloudWatch, DynamoDB
# Wartet bis Tables wirklich gelöscht sind!

set -e

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

AWS_REGION="eu-north-1"
PROJECT="ecokart"
ENVIRONMENT="development"

IAM_ROLE_NAME="${PROJECT}-${ENVIRONMENT}-api-exec-role"
IAM_POLICY_NAME="${PROJECT}-${ENVIRONMENT}-api-dynamodb-policy"
LOG_GROUP_NAME="/aws/lambda/${PROJECT}-${ENVIRONMENT}-api"
LAMBDA_FUNCTION_NAME="${PROJECT}-${ENVIRONMENT}-api"

TABLES=(
  "${PROJECT}-${ENVIRONMENT}-products"
  "${PROJECT}-${ENVIRONMENT}-users"
  "${PROJECT}-${ENVIRONMENT}-carts"
  "${PROJECT}-${ENVIRONMENT}-orders"
)

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          Ecokart Complete Cleanup                                ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "🧹 Starting complete cleanup..."
echo ""

# ----------------------------------------------------------------------------
# 1. IAM Role Cleanup
# ----------------------------------------------------------------------------

echo -e "${YELLOW}📝 Checking IAM Role: ${IAM_ROLE_NAME}${NC}"

if aws iam get-role --role-name "$IAM_ROLE_NAME" --region "$AWS_REGION" &>/dev/null; then
  echo "  - Detaching policy: arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  aws iam detach-role-policy \
    --role-name "$IAM_ROLE_NAME" \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
    --region "$AWS_REGION" 2>/dev/null || true

  echo "  - Deleting inline policy: ${IAM_POLICY_NAME}"
  aws iam delete-role-policy \
    --role-name "$IAM_ROLE_NAME" \
    --policy-name "$IAM_POLICY_NAME" \
    --region "$AWS_REGION" 2>/dev/null || true

  echo "  - Deleting role: ${IAM_ROLE_NAME}"
  aws iam delete-role \
    --role-name "$IAM_ROLE_NAME" \
    --region "$AWS_REGION"

  echo -e "  ${GREEN}✅ Role deleted${NC}"
else
  echo -e "  ${YELLOW}⚠️  Role not found (OK)${NC}"
fi

echo ""

# ----------------------------------------------------------------------------
# 2. CloudWatch Log Group Cleanup
# ----------------------------------------------------------------------------

echo -e "${YELLOW}📝 Deleting CloudWatch Log Group...${NC}"

if aws logs describe-log-groups \
  --log-group-name-prefix "$LOG_GROUP_NAME" \
  --region "$AWS_REGION" \
  --query 'logGroups[0].logGroupName' \
  --output text 2>/dev/null | grep -q "$LOG_GROUP_NAME"; then

  aws logs delete-log-group \
    --log-group-name "$LOG_GROUP_NAME" \
    --region "$AWS_REGION"

  echo -e "  ${GREEN}✅ Log group deleted${NC}"
else
  echo -e "  ${YELLOW}⚠️  Log group not found (OK)${NC}"
fi

echo ""

# ----------------------------------------------------------------------------
# 3. DynamoDB Tables Cleanup (WITH WAIT!)
# ----------------------------------------------------------------------------

echo -e "${YELLOW}📝 Deleting DynamoDB Tables...${NC}"

TABLES_TO_DELETE=()

# Check which tables exist
for table in "${TABLES[@]}"; do
  if aws dynamodb describe-table --table-name "$table" --region "$AWS_REGION" &>/dev/null; then
    echo "  - Starting deletion: $table"
    aws dynamodb delete-table --table-name "$table" --region "$AWS_REGION" &>/dev/null
    TABLES_TO_DELETE+=("$table")
  else
    echo -e "  ${YELLOW}⚠️  Not found: $table (OK)${NC}"
  fi
done

# Wait for tables to be deleted
if [ ${#TABLES_TO_DELETE[@]} -gt 0 ]; then
  echo ""
  echo -e "${YELLOW}  ⏳ Waiting for tables to be deleted...${NC}"

  for table in "${TABLES_TO_DELETE[@]}"; do
    MAX_WAIT=60  # 5 minutes
    COUNTER=0

    while [ $COUNTER -lt $MAX_WAIT ]; do
      if ! aws dynamodb describe-table --table-name "$table" --region "$AWS_REGION" &>/dev/null; then
        echo -e "  ${GREEN}✅ Deleted: $table${NC}"
        break
      fi

      COUNTER=$((COUNTER + 1))

      if [ $((COUNTER % 6)) -eq 0 ]; then
        echo "     ...waiting for $table ($((MAX_WAIT - COUNTER)) attempts left)"
      fi

      sleep 5
    done

    if [ $COUNTER -eq $MAX_WAIT ]; then
      echo -e "  ${RED}✗ Timeout waiting for: $table${NC}"
    fi
  done
else
  echo -e "  ${GREEN}✅ All tables already deleted${NC}"
fi

echo ""

# ----------------------------------------------------------------------------
# 4. API Gateway Cleanup
# ----------------------------------------------------------------------------

echo -e "${YELLOW}📝 Deleting API Gateway...${NC}"

API_ID=$(aws apigateway get-rest-apis \
  --region "$AWS_REGION" \
  --query "items[?name=='${PROJECT}-${ENVIRONMENT}-api'].id" \
  --output text 2>/dev/null || echo "")

if [ -n "$API_ID" ]; then
  aws apigateway delete-rest-api \
    --rest-api-id "$API_ID" \
    --region "$AWS_REGION"

  echo -e "  ${GREEN}✅ API Gateway deleted: $API_ID${NC}"
else
  echo -e "  ${YELLOW}⚠️  API Gateway not found (OK)${NC}"
fi

echo ""

# ----------------------------------------------------------------------------
# 5. Lambda Function Cleanup
# ----------------------------------------------------------------------------

echo -e "${YELLOW}📝 Deleting Lambda Function...${NC}"

if aws lambda get-function \
  --function-name "$LAMBDA_FUNCTION_NAME" \
  --region "$AWS_REGION" &>/dev/null; then

  aws lambda delete-function \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --region "$AWS_REGION"

  echo -e "  ${GREEN}✅ Lambda deleted${NC}"
else
  echo -e "  ${YELLOW}⚠️  Lambda not found (OK)${NC}"
fi

echo ""

# ----------------------------------------------------------------------------
# Final
# ----------------------------------------------------------------------------

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          ✅ Cleanup abgeschlossen!                                ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}⏱️  Warte 30 Sekunden damit AWS alles aufräumt...${NC}"
sleep 30
echo ""
echo -e "${GREEN}🚀 Bereit für neuen Deployment!${NC}"
echo ""
echo "Du kannst jetzt deployen:"
echo -e "  ${BLUE}./deploy.sh${NC}"
echo ""
echo "Oder mit GitHub Actions:"
echo -e "  ${BLUE}GitHub → Actions → Deploy Infrastructure → Run workflow${NC}"
echo ""

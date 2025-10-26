#!/bin/bash

# Deploy Frontend to S3
# Usage: ./scripts/deploy-to-s3.sh <bucket-name>

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if bucket name is provided
if [ -z "$1" ]; then
  echo -e "${RED}❌ Error: Bucket name required${NC}"
  echo "Usage: ./scripts/deploy-to-s3.sh <bucket-name>"
  echo "Example: ./scripts/deploy-to-s3.sh ecokart-frontend-andy"
  exit 1
fi

BUCKET_NAME=$1
PROFILE=${AWS_PROFILE:-"Teilnehmer-729403197965"}
REGION=${AWS_REGION:-"eu-north-1"}

echo -e "${YELLOW}🚀 Deploying Frontend to S3...${NC}\n"

# Check if out directory exists (Next.js static export)
if [ ! -d "out" ]; then
  echo -e "${YELLOW}📦 Output directory not found. Running build...${NC}"
  npm run build
  echo ""
fi

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
  echo -e "${RED}❌ AWS CLI not found. Please install it first.${NC}"
  exit 1
fi

# Upload to S3
echo -e "${YELLOW}☁️  Uploading to S3...${NC}"
echo "Bucket: $BUCKET_NAME"
echo "Profile: $PROFILE"
echo "Region: $REGION"
echo ""

aws s3 sync out/ s3://$BUCKET_NAME/ \
  --profile $PROFILE \
  --region $REGION \
  --delete \
  --exclude ".DS_Store"

if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✅ Deployment successful!${NC}\n"
  echo -e "Website URL:"
  echo -e "${GREEN}http://$BUCKET_NAME.s3-website.$REGION.amazonaws.com${NC}"
  echo ""
else
  echo -e "${RED}❌ Deployment failed${NC}"
  exit 1
fi

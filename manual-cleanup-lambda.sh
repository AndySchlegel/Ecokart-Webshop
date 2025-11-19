#!/bin/bash
# Manual Lambda Cleanup Script
# Löscht die Lambda Function die Terraform nicht löschen konnte

set -e

REGION="eu-north-1"
LAMBDA_NAME="ecokart-development-api"

echo "🔍 Checking if Lambda function exists: $LAMBDA_NAME"

if aws lambda get-function --function-name "$LAMBDA_NAME" --region "$REGION" &>/dev/null; then
    echo "❗ Lambda function found! Deleting..."

    aws lambda delete-function \
        --function-name "$LAMBDA_NAME" \
        --region "$REGION"

    echo "✅ Lambda function deleted: $LAMBDA_NAME"
    echo "⏰ Waiting 30 seconds for AWS to process..."
    sleep 30
    echo "✅ Ready for deployment!"
else
    echo "ℹ️  Lambda function not found (already deleted)"
fi

echo ""
echo "🚀 You can now run the Deploy workflow again!"

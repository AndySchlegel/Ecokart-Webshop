#!/bin/bash
# ============================================================================
# Lambda Build Script
# ============================================================================
# Installiert Dependencies für Lambda Deployment

set -e  # Exit bei Fehler

echo "🔨 Building Lambda function..."

# Dependencies installieren
echo "📦 Installing dependencies..."
npm install --production

echo "✅ Build complete!"
echo ""
echo "📋 Contents:"
ls -lh

echo ""
echo "🚀 Ready for deployment via Terraform"

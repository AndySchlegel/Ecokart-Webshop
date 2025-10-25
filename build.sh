#!/bin/bash

# ============================================
# EcoKart Build & Test Script
# ============================================
# Führt Build und Tests aus um sicherzustellen,
# dass alles funktioniert vor dem Merge
# ============================================

set -e  # Exit bei Fehler

echo "🏗️  EcoKart Build & Test"
echo "================================"

# Wechsel ins Frontend-Verzeichnis
cd frontend

# Install dependencies falls nötig
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run Linter
echo ""
echo "🔍 Running Linter..."
npm run lint || {
    echo "❌ Lint Fehler gefunden!"
    read -p "Trotzdem fortfahren? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
}

# Build
echo ""
echo "🏗️  Building Project..."
npm run build

# Check if build was successful
if [ -d ".next" ]; then
    echo "✅ Build erfolgreich!"
    echo ""
    echo "📊 Build Info:"
    du -sh .next
else
    echo "❌ Build fehlgeschlagen!"
    exit 1
fi

echo ""
echo "================================"
echo "✅ Alle Checks bestanden!"
echo "================================"
echo "💡 Bereit für Merge nach main"
echo "🚀 Nutze ./merge-to-main.sh"
echo "================================"

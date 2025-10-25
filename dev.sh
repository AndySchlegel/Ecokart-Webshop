#!/bin/bash

# ============================================
# EcoKart Local Development Script
# ============================================
# Startet die Frontend-Entwicklungsumgebung
# und stellt sicher, dass alle Dependencies
# aktuell sind.
# ============================================

set -e  # Exit bei Fehler

echo "🚀 EcoKart Development Setup"
echo "================================"

# Prüfe ob wir im richtigen Branch sind
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Aktueller Branch: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "developer" ]; then
    echo "⚠️  Du bist nicht im developer Branch!"
    read -p "Möchtest du zu developer wechseln? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout developer
    else
        echo "❌ Abbruch. Bitte wechsle zu developer Branch."
        exit 1
    fi
fi

# Wechsel ins Frontend-Verzeichnis
cd frontend

# Prüfe ob node_modules existiert
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies bereits installiert"
    echo "💡 Tipp: Nutze 'npm install' falls Updates nötig sind"
fi

# Prüfe ob .env.local existiert
if [ ! -f ".env.local" ]; then
    echo "⚙️  Creating .env.local from .env.example..."
    cp .env.example .env.local
    echo "✅ .env.local created"
fi

echo ""
echo "================================"
echo "🎯 Starting Development Server..."
echo "================================"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:4000 (separate starten)"
echo "🔄 Hot Reload: Aktiviert"
echo "⌨️  Stoppen: Ctrl+C"
echo ""
echo "💡 Tipp: Nutze ./start-all.sh für Full Stack"
echo "================================"
echo ""

# Starte Dev Server
npm run dev

#!/bin/bash

# ============================================
# EcoKart Admin Panel Start Script
# ============================================

set -e

echo "🔐 Starting EcoKart Admin Panel..."
echo "================================"

cd admin-frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies bereits installiert"
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  No .env.local found! Creating from .env.example..."
    cp .env.example .env.local
    echo "✅ .env.local created"
fi

echo ""
echo "================================"
echo "🔐 Admin Panel Starting..."
echo "================================"
echo "📍 URL: http://localhost:4001"
echo "👤 Login: admin@ecokart.com"
echo "🔑 Pass: ecokart2025"
echo "⌨️  Stop: Ctrl+C"
echo "================================"
echo ""

# Start admin panel on port 4001
PORT=4001 npm run dev

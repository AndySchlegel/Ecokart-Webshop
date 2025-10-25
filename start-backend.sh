#!/bin/bash

# ============================================
# EcoKart Backend Start Script
# ============================================

set -e

echo "🚀 Starting EcoKart Backend..."
echo "================================"

cd backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found! Creating from .env.example..."
    cp .env.example .env
    echo "✅ .env created. Please configure if needed."
fi

echo ""
echo "================================"
echo "🌐 Backend API Starting..."
echo "================================"
echo "📍 URL: http://localhost:4000"
echo "📊 Health: http://localhost:4000/api/health"
echo "📦 Products: http://localhost:4000/api/products"
echo "⌨️  Stop: Ctrl+C"
echo "================================"
echo ""

npm run dev

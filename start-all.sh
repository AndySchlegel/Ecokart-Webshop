#!/bin/bash

# ============================================
# EcoKart Full Stack Start Script
# ============================================
# Startet Backend + Frontend gleichzeitig
# ============================================

set -e

echo "🚀 EcoKart Full Stack Startup"
echo "================================"

# Prüfe ob im developer Branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "developer" ]; then
    echo "⚠️  Du bist nicht im developer Branch!"
    echo "📍 Aktueller Branch: $CURRENT_BRANCH"
    read -p "Trotzdem fortfahren? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Function um Prozesse zu killen beim Exit
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup INT TERM

# Backend starten
echo "🔧 Starting Backend..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
fi
if [ ! -f ".env" ]; then
    cp .env.example .env
fi
npm run dev &
BACKEND_PID=$!
cd ..

# Warte kurz damit Backend hochfahren kann
echo "⏳ Waiting for backend to initialize..."
sleep 3

# Frontend starten
echo "🎨 Starting Frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
fi
if [ ! -f ".env.local" ]; then
    echo "NEXT_PUBLIC_API_URL=http://localhost:4000/api/products" > .env.local
fi
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "================================"
echo "✅ Full Stack Running!"
echo "================================"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:4000"
echo "📊 API Health: http://localhost:4000/api/health"
echo "📦 Products: http://localhost:4000/api/products"
echo ""
echo "⌨️  Press Ctrl+C to stop all services"
echo "================================"

# Warte auf beide Prozesse
wait $BACKEND_PID $FRONTEND_PID

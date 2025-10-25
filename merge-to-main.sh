#!/bin/bash

# ============================================
# EcoKart Merge & Deploy Script
# ============================================
# Merged developer Branch in main und pushed
# zum Remote Repository
# ============================================

set -e  # Exit bei Fehler

echo "🔀 EcoKart Merge & Deploy"
echo "================================"

# Prüfe ob wir im developer Branch sind
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "developer" ]; then
    echo "❌ Fehler: Dieser Script muss vom developer Branch ausgeführt werden!"
    echo "📍 Aktueller Branch: $CURRENT_BRANCH"
    exit 1
fi

# Prüfe auf uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  Du hast uncommitted changes!"
    git status --short
    echo ""
    read -p "Möchtest du diese Änderungen committen? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "📝 Commit Message: " COMMIT_MSG
        git add -A
        git commit -m "$COMMIT_MSG

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
        echo "✅ Changes committed"
    else
        echo "❌ Abbruch. Bitte committe deine Änderungen erst."
        exit 1
    fi
fi

echo ""
echo "📊 Aktuelle Änderungen im developer Branch:"
git log main..developer --oneline
echo ""

read -p "🚀 Bereit zum Merge nach main? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Merge abgebrochen"
    exit 1
fi

# Wechsel zu main
echo "🔄 Wechsle zu main Branch..."
git checkout main

# Pull latest changes
echo "⬇️  Pulling latest changes from remote..."
git pull origin main || echo "⚠️  Kein Remote oder keine Updates"

# Merge developer
echo "🔀 Merging developer into main..."
git merge developer --no-ff -m "Merge developer into main

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

echo "✅ Merge erfolgreich!"
echo ""

# Optional: Push to remote
read -p "📤 Möchtest du zum Remote Repository pushen? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📤 Pushing to origin/main..."
    git push origin main
    echo "✅ Push erfolgreich!"

    # Push developer branch auch
    read -p "📤 Developer Branch auch pushen? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout developer
        git push origin developer
        echo "✅ Developer Branch gepushed!"
    fi
else
    echo "⏭️  Push übersprungen"
fi

# Zurück zu developer
git checkout developer

echo ""
echo "================================"
echo "✅ Deployment abgeschlossen!"
echo "================================"
echo "📍 Du bist zurück im developer Branch"
echo "🌐 Main Branch ist aktualisiert"
echo "================================"

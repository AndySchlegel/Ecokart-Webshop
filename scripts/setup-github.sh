#!/bin/bash

# Setup GitHub for Amplify Deployment
# Usage: ./scripts/setup-github.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 GitHub Setup für AWS Amplify${NC}\n"

# Check if git is initialized
if [ ! -d ".git" ]; then
  echo -e "${RED}❌ Git ist nicht initialisiert${NC}"
  echo "Führe aus: git init"
  exit 1
fi

# Check if remote exists
REMOTE=$(git remote -v | grep origin || echo "")

if [ -z "$REMOTE" ]; then
  echo -e "${YELLOW}📝 Kein GitHub Remote gefunden${NC}\n"

  echo "Erstelle zuerst ein Repository auf GitHub:"
  echo "1. Gehe zu https://github.com/new"
  echo "2. Repository Name: Ecokart-Webshop"
  echo "3. Private oder Public (deine Wahl)"
  echo "4. NICHT initialisieren mit README"
  echo ""
  echo "Wenn fertig, gib die Repository URL ein:"
  echo "(z.B. https://github.com/username/Ecokart-Webshop.git)"
  echo ""
  read -p "Repository URL: " REPO_URL

  if [ -z "$REPO_URL" ]; then
    echo -e "${RED}❌ Keine URL angegeben${NC}"
    exit 1
  fi

  echo ""
  echo -e "${YELLOW}📡 Füge Remote hinzu...${NC}"
  git remote add origin "$REPO_URL"

  echo -e "${GREEN}✅ Remote hinzugefügt${NC}\n"
else
  echo -e "${GREEN}✅ Remote existiert bereits:${NC}"
  echo "$REMOTE"
  echo ""
fi

# Check current branch
BRANCH=$(git branch --show-current)
echo -e "Current branch: ${GREEN}$BRANCH${NC}"

# Check if there are uncommitted changes
if git status --porcelain | grep -q '^'; then
  echo -e "${YELLOW}⚠️  Es gibt uncommitted changes${NC}\n"

  echo "Möchtest du alle Änderungen committen?"
  read -p "Commit & Push? (y/n): " SHOULD_COMMIT

  if [ "$SHOULD_COMMIT" = "y" ]; then
    echo ""
    echo -e "${YELLOW}📦 Committing changes...${NC}"
    git add .
    git commit -m "Prepare for AWS Amplify deployment

- Next.js build configured for Amplify
- DynamoDB tables created and populated
- Environment variables documented
- Ready for CI/CD deployment" || echo "Nothing to commit"

    echo -e "${GREEN}✅ Changes committed${NC}\n"
  fi
fi

# Push to GitHub
echo -e "${YELLOW}☁️  Pushing to GitHub...${NC}"
git push -u origin "$BRANCH"

if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✅ Code ist auf GitHub!${NC}\n"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo -e "${GREEN}🎉 Bereit für AWS Amplify Deployment!${NC}\n"
  echo "Nächste Schritte:"
  echo "1. Gehe zu: https://eu-north-1.console.aws.amazon.com/amplify"
  echo "2. Klicke 'Host your web app'"
  echo "3. Wähle 'GitHub' und dein Repository"
  echo "4. Monorepo Folder: 'frontend'"
  echo "5. Deploy!"
  echo ""
  echo "📖 Detaillierte Anleitung: docs/step-02-amplify-hosting.md"
  echo ""
else
  echo ""
  echo -e "${RED}❌ Push fehlgeschlagen${NC}"
  echo ""
  echo "Mögliche Ursachen:"
  echo "1. Keine Berechtigung → GitHub Credentials prüfen"
  echo "2. Branch existiert bereits → git pull zuerst"
  echo "3. Remote URL falsch → git remote -v prüfen"
  echo ""
  echo "Für mehr Info: git push -v"
fi

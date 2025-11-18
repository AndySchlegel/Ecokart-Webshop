#!/bin/bash
# ============================================================================
# Ecokart DynamoDB Tables Cleanup
# ============================================================================
# Löscht ALLE DynamoDB Tables zuverlässig und wartet bis sie wirklich weg sind!

set -e

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

AWS_REGION="eu-north-1"

TABLES=(
  "ecokart-products"
  "ecokart-users"
  "ecokart-carts"
  "ecokart-orders"
)

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          Ecokart DynamoDB Cleanup                                ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}🔍 Prüfe welche Tables existieren...${NC}"
echo ""

EXISTING_TABLES=()

for table in "${TABLES[@]}"; do
  if aws dynamodb describe-table --table-name "$table" --region "$AWS_REGION" &>/dev/null; then
    echo -e "  ${RED}✗${NC} $table (existiert - wird gelöscht)"
    EXISTING_TABLES+=("$table")
  else
    echo -e "  ${GREEN}✓${NC} $table (existiert nicht)"
  fi
done

echo ""

if [ ${#EXISTING_TABLES[@]} -eq 0 ]; then
  echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║          ✅ Alle Tables sind bereits gelöscht!                    ║${NC}"
  echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  exit 0
fi

echo -e "${RED}🗑️  Lösche ${#EXISTING_TABLES[@]} Table(s)...${NC}"
echo ""

# Phase 1: Starte das Löschen aller Tables
for table in "${EXISTING_TABLES[@]}"; do
  echo -e "${YELLOW}  → Lösche $table...${NC}"
  if aws dynamodb delete-table --table-name "$table" --region "$AWS_REGION" &>/dev/null; then
    echo -e "    ${GREEN}✓${NC} Löschung gestartet"
  else
    echo -e "    ${RED}✗${NC} Fehler beim Löschen (vielleicht schon gelöscht?)"
  fi
done

echo ""
echo -e "${YELLOW}⏳ Warte bis alle Tables wirklich gelöscht sind...${NC}"
echo ""

# Phase 2: Warte bis ALLE Tables wirklich weg sind
for table in "${EXISTING_TABLES[@]}"; do
  echo -e "${YELLOW}  ⏳ Warte auf $table...${NC}"

  # Warte bis Table nicht mehr existiert (max 5 Minuten)
  MAX_WAIT=60  # 60 * 5 Sekunden = 5 Minuten
  COUNTER=0

  while [ $COUNTER -lt $MAX_WAIT ]; do
    if ! aws dynamodb describe-table --table-name "$table" --region "$AWS_REGION" &>/dev/null; then
      echo -e "    ${GREEN}✓${NC} $table ist gelöscht!"
      break
    fi

    COUNTER=$((COUNTER + 1))

    if [ $((COUNTER % 6)) -eq 0 ]; then
      echo -e "    ${YELLOW}...${NC} noch $((MAX_WAIT - COUNTER)) Versuche übrig"
    fi

    sleep 5
  done

  if [ $COUNTER -eq $MAX_WAIT ]; then
    echo -e "    ${RED}✗${NC} Timeout! Table konnte nicht gelöscht werden."
    exit 1
  fi
done

echo ""

# Phase 3: Finale Prüfung
echo -e "${YELLOW}🔍 Finale Prüfung...${NC}"
echo ""

ALL_DELETED=true

for table in "${TABLES[@]}"; do
  if aws dynamodb describe-table --table-name "$table" --region "$AWS_REGION" &>/dev/null; then
    echo -e "  ${RED}✗${NC} $table (NOCH DA!)"
    ALL_DELETED=false
  else
    echo -e "  ${GREEN}✓${NC} $table (gelöscht)"
  fi
done

echo ""

if [ "$ALL_DELETED" = true ]; then
  echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║          ✅ Alle Tables erfolgreich gelöscht!                     ║${NC}"
  echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo "Du kannst jetzt deployen:"
  echo -e "  ${BLUE}./deploy.sh${NC}"
  echo ""
  echo "Oder mit GitHub Actions:"
  echo -e "  ${BLUE}GitHub Actions → Run workflow${NC}"
  echo ""
else
  echo -e "${RED}╔═══════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║          ❌ Fehler beim Löschen!                                  ║${NC}"
  echo -e "${RED}╚═══════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  exit 1
fi

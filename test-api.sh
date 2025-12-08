#!/bin/bash

# Test script voor Google Apps Script API
# Test de API met curl vanuit de command line

SCRIPT_URL="https://script.google.com/macros/s/AKfycbwa6fZJK0igAsJ2y33jyEYXBgtAn5nyFrGQ20ZVPK_NvQPURLzzWRRT8s4RAMa85Oom/exec"

# Kleuren
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Google Apps Script API Test${NC}"
echo "=================================="
echo ""

# Test data
TEST_DATA='{
  "voornaam": "Test",
  "achternaam": "CLI Gebruiker",
  "email": "thijs@serverless.nl",
  "telefoon": "0612345678",
  "dieetwensen": ["Vegetarisch", "Glutenvrij"],
  "vrijwilligerswerk": "Kaasmarkt: 13:30-18:00",
  "samenMetBuddy": true,
  "buddyNaam": "CLI Buddy",
  "opAfbouw": ["Vrijdag opbouw (met pizza) 18:00-22:00", "Zondag afbouw (met ontbijt) 10:00-14:00"]
}'

echo -e "${YELLOW}📡 Script URL:${NC}"
echo "$SCRIPT_URL"
echo ""

echo -e "${YELLOW}📦 Test Data:${NC}"
echo "$TEST_DATA" | jq '.' 2>/dev/null || echo "$TEST_DATA"
echo ""

echo -e "${YELLOW}🚀 Sending POST request...${NC}"
echo ""

# Voer de request uit en meet de tijd
START_TIME=$(date +%s%N)

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA" \
  "$SCRIPT_URL")

END_TIME=$(date +%s%N)
DURATION=$(( (END_TIME - START_TIME) / 1000000 ))

# Splits response body en status code
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

echo -e "${BLUE}⏱️  Duration: ${DURATION}ms${NC}"
echo ""

# Check HTTP status code
if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 302 ]; then
    echo -e "${GREEN}✅ Success!${NC}"
    echo -e "${GREEN}HTTP Status: $HTTP_CODE${NC}"
else
    echo -e "${RED}❌ Failed!${NC}"
    echo -e "${RED}HTTP Status: $HTTP_CODE${NC}"
fi

echo ""
echo -e "${YELLOW}📄 Response:${NC}"
if [ -n "$RESPONSE_BODY" ]; then
    echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
else
    echo "(empty response - dit is normaal voor Google Apps Script)"
fi

echo ""
echo "=================================="
echo -e "${BLUE}📝 Volgende stappen:${NC}"
echo "1. Check Google Sheets voor de nieuwe rij"
echo "2. Check je email (test-cli@example.com) voor bevestigingsmail"
echo "3. Check organisatie email voor notificatie"
echo ""

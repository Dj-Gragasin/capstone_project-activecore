#!/bin/bash
# Production Deployment Checklist & Verification Script
# Run this before deploying to production

echo "🔍 ActiveCore Production Deployment Verification"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_mark="${GREEN}✓${NC}"
cross_mark="${RED}✗${NC}"

# 1. Backend Build Check
echo -n "1. Backend Build... "
if cd activecore-db && npm run build > /dev/null 2>&1; then
    echo -e "${check_mark}"
else
    echo -e "${cross_mark} FAILED - Check TypeScript errors"
    exit 1
fi
cd ..

# 2. Frontend Build Check
echo -n "2. Frontend Build... "
if npm run build > /dev/null 2>&1; then
    echo -e "${check_mark}"
else
    echo -e "${cross_mark} FAILED - Check TypeScript errors"
    exit 1
fi

# 3. Backend Dependencies
echo -n "3. Backend Dependencies... "
if [ -d "activecore-db/node_modules" ]; then
    echo -e "${check_mark}"
else
    echo -e "${cross_mark} Missing - Run: cd activecore-db && npm install"
fi

# 4. Frontend Dependencies
echo -n "4. Frontend Dependencies... "
if [ -d "node_modules" ]; then
    echo -e "${check_mark}"
else
    echo -e "${cross_mark} Missing - Run: npm install"
fi

# 5. Environment Variables
echo -n "5. JWT_SECRET configured... "
if [ ! -z "$JWT_SECRET" ] && [ ${#JWT_SECRET} -ge 32 ]; then
    echo -e "${check_mark}"
else
    echo -e "${cross_mark} JWT_SECRET missing or too short (min 32 chars)"
fi

echo -n "6. NODE_ENV set to production... "
if [ "$NODE_ENV" = "production" ]; then
    echo -e "${check_mark}"
else
    echo -e "${YELLOW}⚠ Set to: $NODE_ENV (should be 'production' for deployment)${NC}"
fi

echo ""
echo "📋 Pre-Deployment Checklist:"
echo -e "  ${YELLOW}□${NC} Database backups created"
echo -e "  ${YELLOW}□${NC} SSL/TLS certificates installed"
echo -e "  ${YELLOW}□${NC} PayPal live credentials ready (not sandbox)"
echo -e "  ${YELLOW}□${NC} SENTRY_DSN obtained and configured"
echo -e "  ${YELLOW}□${NC} ALLOWED_ORIGINS configured for CORS"
echo -e "  ${YELLOW}□${NC} SMTP credentials verified (if using email)"
echo -e "  ${YELLOW}□${NC} Database migrations run"

echo ""
echo "🚀 Ready to Deploy!"
echo ""
echo "Deployment commands:"
echo "  cd activecore-db && npm start     # Start backend on port 3002"
echo "  # Serve build/ folder with nginx/apache for frontend"
echo ""

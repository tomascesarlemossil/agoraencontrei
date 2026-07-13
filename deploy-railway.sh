#!/usr/bin/env bash
# Deploy AgoraEncontrei API to Railway
# Usage: RAILWAY_TOKEN=<token> ./deploy-railway.sh
set -e

RAILWAY=/Users/tomaslemos/.nvm_local/bin/railway
export PATH="/Users/tomaslemos/bin:$PATH"

if [ -z "$RAILWAY_TOKEN" ]; then
  echo "❌ Set RAILWAY_TOKEN first:"
  echo "   export RAILWAY_TOKEN=<seu-token>"
  echo "   ./deploy-railway.sh"
  exit 1
fi

: "${DB_URL:?Set DB_URL first}"
: "${JWT_SECRET:?Set JWT_SECRET first}"
: "${COOKIE_SECRET:?Set COOKIE_SECRET first}"

echo "→ Criando projeto no Railway..."
PROJECT_JSON=$(RAILWAY_TOKEN=$RAILWAY_TOKEN $RAILWAY projects create \
  --name "agoraencontrei-api" 2>&1 || true)

echo "→ Linkando projeto..."
cd /Users/tomaslemos/Downloads/squads/agoraencontrei/apps/api
RAILWAY_TOKEN=$RAILWAY_TOKEN $RAILWAY link --environment production 2>&1 || true

echo "→ Configurando variáveis de ambiente..."
RAILWAY_TOKEN=$RAILWAY_TOKEN $RAILWAY variables set \
  NODE_ENV=production \
  PORT=3100 \
  DATABASE_URL="$DB_URL" \
  DIRECT_DATABASE_URL="$DB_URL" \
  JWT_SECRET="$JWT_SECRET" \
  JWT_ACCESS_EXPIRES=15m \
  JWT_REFRESH_EXPIRES=30d \
  COOKIE_SECRET="$COOKIE_SECRET" \
  WEB_URL=https://agoraencontrei.vercel.app \
  APP_URL=https://agoraencontrei-api.up.railway.app \
  LOG_LEVEL=info \
  2>&1

echo "→ Fazendo deploy..."
RAILWAY_TOKEN=$RAILWAY_TOKEN $RAILWAY up --detach 2>&1

echo ""
echo "✅ Deploy iniciado!"
echo "   Acompanhe em: railway.app"

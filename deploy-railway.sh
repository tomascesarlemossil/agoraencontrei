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

DB_URL="postgresql://USER:PASSWORD@HOST/neondb?sslmode=require&channel_binding=require"
JWT_SECRET="a3f8d2e1c7b4a9f6e5d0c3b2a1f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0"
COOKIE_SECRET="f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1"

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

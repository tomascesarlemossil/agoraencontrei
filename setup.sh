#!/usr/bin/env bash
# AgoraEncontrei — First-time setup script
set -e

PNPM="/Users/tomaslemos/.nvm_local/bin/pnpm"
NODE="/Users/tomaslemos/bin/node"
export PATH="/Users/tomaslemos/bin:$PATH"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   AgoraEncontrei — Setup Inicial          ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# 1. Install dependencies
echo "→ Instalando dependências..."
"$PNPM" install

# 2. Approve build scripts (prisma, argon2, etc.)
echo "→ Aprovando build scripts..."
"$PNPM" approve-builds --all 2>/dev/null || true

# 3. Generate Prisma client
echo "→ Gerando Prisma Client..."
"$PNPM" db:generate

# 4. Check for .env files
echo ""
echo "→ Verificando arquivos .env..."

if [ ! -f apps/api/.env ]; then
  cp apps/api/.env.example apps/api/.env
  echo "  ✅ Criado apps/api/.env (configure DATABASE_URL e JWT_SECRET)"
else
  echo "  ✅ apps/api/.env já existe"
fi

if [ ! -f apps/web/.env.local ]; then
  cp apps/web/.env.example apps/web/.env.local
  echo "  ✅ Criado apps/web/.env.local"
else
  echo "  ✅ apps/web/.env.local já existe"
fi

if [ ! -f packages/database/.env ]; then
  cp packages/database/.env.example packages/database/.env
  echo "  ✅ Criado packages/database/.env (configure DATABASE_URL)"
else
  echo "  ✅ packages/database/.env já existe"
fi

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   Próximos passos:                        ║"
echo "╠══════════════════════════════════════════╣"
echo "║                                           ║"
echo "║  1. Edite apps/api/.env com:              ║"
echo "║     • DATABASE_URL (Neon PostgreSQL)      ║"
echo "║     • JWT_SECRET   (openssl rand -hex 32) ║"
echo "║                                           ║"
echo "║  2. Edite packages/database/.env com:     ║"
echo "║     • DATABASE_URL (mesma do API)         ║"
echo "║                                           ║"
echo "║  3. Execute as migrações:                 ║"
echo "║     pnpm db:migrate                       ║"
echo "║                                           ║"
echo "║  4. Popule o banco com dados iniciais:    ║"
echo "║     pnpm db:seed                          ║"
echo "║                                           ║"
echo "║  5. Inicie o servidor de desenvolvimento: ║"
echo "║     pnpm dev                              ║"
echo "║                                           ║"
echo "╚══════════════════════════════════════════╝"
echo ""

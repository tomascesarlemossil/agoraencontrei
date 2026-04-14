FROM node:22-slim AS base

# Install OpenSSL (required by Prisma)
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Install pnpm (pinned version to match packageManager field)
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate

WORKDIR /app

# ── Workspace manifests ────────────────────────────────────────────────
# pnpm needs every workspace package.json in place before `pnpm install`,
# otherwise `workspace:*` specifiers (like @agoraencontrei/tomas-knowledge
# pulled by apps/api) cannot be resolved and the symlink in node_modules
# is never created, producing ERR_MODULE_NOT_FOUND at runtime.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/database/package.json ./packages/database/
COPY packages/tomas-knowledge/package.json ./packages/tomas-knowledge/
COPY apps/api/package.json ./apps/api/

# Install dependencies (pnpm.onlyBuiltDependencies in package.json allows build scripts)
RUN pnpm install --frozen-lockfile

# Cache bust — increment to force rebuild: v10
ARG CACHE_BUST=10

# ── Source ─────────────────────────────────────────────────────────────
COPY packages/database ./packages/database
COPY packages/tomas-knowledge ./packages/tomas-knowledge
COPY apps/api ./apps/api

# Generate Prisma client
RUN pnpm --filter @agoraencontrei/database generate

# Build the shared knowledge package BEFORE the API.
# Its package.json points `main`/`exports` at ./dist/index.js, so without
# this step the API starts and Node throws ERR_MODULE_NOT_FOUND the first
# time tomas.service.js is imported.
RUN pnpm --filter @agoraencontrei/tomas-knowledge build

# Build API
RUN pnpm --filter @agoraencontrei/api build

EXPOSE 3100

CMD ["node", "apps/api/dist/server.js"]

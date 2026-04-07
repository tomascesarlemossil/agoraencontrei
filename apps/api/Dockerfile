FROM node:22-slim AS base

# Install OpenSSL (required by Prisma) and other deps
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Install pnpm (pinned version to avoid breaking changes)
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/database/package.json ./packages/database/
COPY apps/api/package.json ./apps/api/

# Install dependencies (pnpm.onlyBuiltDependencies in package.json allows build scripts)
RUN pnpm install --frozen-lockfile

# Cache bust — increment to force rebuild: v1
ARG CACHE_BUST=1

# Copy source
COPY packages/database ./packages/database
COPY apps/api ./apps/api

# Generate Prisma client
RUN pnpm --filter @agoraencontrei/database generate

# Build API
RUN pnpm --filter @agoraencontrei/api build

EXPOSE 3100

CMD ["node", "apps/api/dist/server.js"]

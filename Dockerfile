FROM node:22-slim AS base

# Install OpenSSL (required by Prisma) + Chromium (required by Playwright scrapers)
RUN apt-get update -y && apt-get install -y \
  openssl ca-certificates \
  chromium \
  fonts-liberation \
  libnss3 \
  libatk-bridge2.0-0 \
  libdrm2 \
  libxkbcommon0 \
  libgbm1 \
  libasound2 \
  && rm -rf /var/lib/apt/lists/*

ENV PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/chromium

# Install pnpm (pinned version to avoid breaking changes from pnpm@latest)
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/database/package.json ./packages/database/
COPY apps/api/package.json ./apps/api/

# Install dependencies (pnpm.onlyBuiltDependencies in package.json allows build scripts)
RUN pnpm install --frozen-lockfile

# Cache bust — increment to force rebuild: v6
ARG CACHE_BUST=6

# Copy source
COPY packages/database ./packages/database
COPY apps/api ./apps/api

# Generate Prisma client
RUN pnpm --filter @agoraencontrei/database generate

# Build API
RUN pnpm --filter @agoraencontrei/api build

EXPOSE 3100

CMD ["node", "apps/api/dist/server.js"]

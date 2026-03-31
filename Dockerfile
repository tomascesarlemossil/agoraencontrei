FROM node:22-slim AS base

# Install OpenSSL (required by Prisma) and other deps
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/database/package.json ./packages/database/
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/database ./packages/database
COPY apps/api ./apps/api

# Generate Prisma client
RUN pnpm --filter @agoraencontrei/database generate

# Build API
RUN pnpm --filter @agoraencontrei/api build

EXPOSE 3100

CMD ["node", "apps/api/dist/server.js"]

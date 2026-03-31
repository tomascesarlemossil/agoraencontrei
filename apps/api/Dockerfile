FROM node:22-alpine AS base

# Install pnpm
RUN npm install -g pnpm@10

# ── deps stage ────────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/

RUN pnpm install --frozen-lockfile --prod=false

# ── build stage ───────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules || true
COPY . .

# Generate Prisma client
RUN pnpm --filter @agoraencontrei/database generate

# Build API
RUN pnpm --filter @agoraencontrei/api build

# ── production stage ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 apiuser

# Copy compiled output + node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./.prisma

USER apiuser

EXPOSE 3100

CMD ["node", "dist/server.js"]

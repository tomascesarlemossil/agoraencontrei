# CLAUDE.md — AgoraEncontrei Project Brain

> **Imobiliaria Lemos** — AI-powered real estate platform for the Brazilian market.
> Domain: `agoraencontrei.com.br` | Multi-tenant SaaS with affiliate system.

---

## Architecture Overview

**Monorepo** managed by pnpm workspaces (`pnpm@10.0.0`, Node 22.x):

```
apps/
  api/          → Fastify 5 REST API (port 3100)
  web/          → Next.js 15 App Router (port 3000)
  image-processor/ → Standalone image processing service
packages/
  database/     → Prisma 5.22 ORM (shared schema)
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| API | Fastify 5.8, TypeScript, Zod validation |
| Web | Next.js 15.5, React 18.3, Tailwind CSS, Radix UI, Framer Motion |
| Database | PostgreSQL 16 (Neon in prod) via Prisma 5.22 |
| Queue | BullMQ 5.71 + ioredis 5 (Redis Cloud) |
| Auth | @fastify/jwt (API), next-auth 5 beta (Web) |
| AI | Anthropic SDK, OpenAI SDK, Google Gemini |
| Storage | AWS S3, Cloudinary, Supabase (legacy) |
| Payments | Asaas (boletos, cobranças, webhooks) |
| Signatures | Clicksign (digital contract signing) |
| WhatsApp | Meta Cloud API |
| Scraping | Apify, Playwright |
| Deploy | Railway (auto-deploy from `main` branch) |

---

## Quick Commands

```bash
# Development
pnpm dev                    # Start all apps in parallel
pnpm --filter @agoraencontrei/api dev   # API only
pnpm --filter web dev       # Web only

# Database
pnpm db:generate            # Regenerate Prisma client
pnpm db:migrate             # Run migrations (dev)
pnpm db:push                # Push schema changes (no migration)
pnpm db:seed                # Seed database
pnpm db:studio              # Open Prisma Studio

# Quality
pnpm typecheck              # TypeScript check (both apps)
pnpm lint                   # ESLint (both apps)
pnpm build                  # Build all packages + apps

# Docker (local dev)
docker-compose up -d        # PostgreSQL 16 + Redis 7
```

---

## Project Structure — API (`apps/api`)

### Entry Point
- `src/server.ts` — Fastify app with 40+ route registrations, plugins (CORS, helmet, JWT, Prisma, Redis, Swagger, rate-limit, multipart, compression)

### Route Modules (81+ routes in `src/routes/`)

**Core CRM:**
`auth`, `users`, `properties`, `leads`, `contacts`, `deals`, `activities`, `crm`

**Financial:**
`finance`, `financial`, `billing`, `fiscal`, `financings`, `repasse`, `saas-finance`

**AI/ML:**
`ai-visual`, `ai-marketing`, `auction-ai`, `lead-scoring`, `tomas`, `agents`

**Real Estate Operations:**
`auctions`, `hunter`, `preview`, `specialists`, `properties`, `import`

**Content & Marketing:**
`blog`, `seo`, `seo-programatico`, `social`, `marketing`, `photo-editor`

**Portal Integrations:**
`portals` (ZAP, VivaReal, OLX, Facebook adapters)

**System:**
`health`, `upload`, `automations`, `inbox`, `whatsapp`, `notifications`, `audit-logs`, `documents`, `alerts`, `system-config`, `tenants`, `outbound`, `master`

**Public API:**
`public/` — auctions, free-listing, partner analytics, territory, valuation, streetview, visits, voice-search

### Services (80+ in `src/services/`)

**Key services:**
- `tomas.service.ts` — AI assistant (Tomás) powered by Anthropic Claude
- `sales-funnel.service.ts` — Lead funnel with 2-min delay rule (preview → checkout)
- `ai.service.ts` — Core AI orchestration
- `whatsapp.service.ts` — WhatsApp Cloud API integration
- `asaas.service.ts` — Payment/billing via Asaas
- `automation.worker.ts` + `automation.actions.ts` — Automation engine
- `lead-ingestion.service.ts` — Lead capture from multiple sources
- `outbound-queue.service.ts` — Outbound messaging queue
- `s3.service.ts` — AWS S3 file management
- `cloudinary.service.ts` — Image processing & watermarks
- `auction-ai.service.ts` — Auction analysis AI
- `import.service.ts` — Bulk property import
- `scheduled.jobs.ts` — Cron/scheduled tasks

### Queue Workers (`src/workers/` + `src/jobs/`)
- `automation.worker.ts` — Automation rule execution
- `campaign.worker.ts` — Marketing campaign execution
- `visual-ai.worker.ts` — AI image processing
- `daily-social-post.ts` — Scheduled social media posts

### 4 BullMQ Queues
`automation`, `visual-ai`, `campaigns`, `outbound`

### Environment Config
- `src/utils/env.ts` — Zod-validated env with graceful fallbacks
- API starts even with missing optional vars (Railway health check passes)

---

## Project Structure — Web (`apps/web`)

### Pages (Next.js App Router)

**Auth** (grouped `(auth)/`):
`login`, `register`, `cadastro`

**Dashboard** (grouped `(dashboard)/`):
`clientes`, `imoveis`, `contratos`, `leads`, `deals`, `leiloes`, `crm`, `automations`, `juridico`, `financiamentos`, `fiscal`, `inbox`, `documentos`, `corretor`, `blog`, `ai-visual`

**LemosBank** subsystem:
`boletos`, `cobrancas`, `repasses`, `rescisoes`, `historico`

**Public pages:**
Property listings, auctions, blog, SEO programmatic pages

### Key Components

| Directory | Purpose |
|-----------|---------|
| `components/ui/` | Radix-based UI primitives (Button, Dialog, Input, etc.) |
| `components/dashboard/` | Dashboard-specific (MediaEditorModal, DataTable, etc.) |
| `components/chat/` | FloatingChatbot (secondary chatbot) |
| `components/tomas/` | TomasWidget — AI assistant chat (mobile-optimized) |
| `components/public/` | Public-facing components |
| `components/investor/` | Investor features |

### API Routes (`src/app/api/`)
- `proxy-image/` — Server-side image proxy (Canvas CORS bypass)
- `health/`, `health-check/` — Monitoring
- `caixa-csv/` — Caixa auction CSV processing
- `og/` — Open Graph image generation
- `revalidate/` — ISR revalidation
- `sitemap/*` — Dynamic sitemaps (bairros, blog, cidades, comparacoes, leiloes, properties)

### Middleware (`src/middleware.ts`)
Multi-tenant subdomain routing:
- `{slug}.agoraencontrei.com.br` → rewrites to `/_tenant/{slug}`
- Custom domains → rewrites to `/_tenant/_domain`
- Reserved subdomains: www, api, admin, app, etc.

### Lib/Utils
- `api.ts` — API client with auth
- `financial-engine.ts`, `valuation-engine.ts`, `rental-yield-engine.ts` — Business logic
- `bcb-rates.ts` — Central bank rates
- `seo-content-blocks.ts`, `seo-interlinking.ts` — SEO system
- `site-factory/` — Theme & plan registries for multi-tenant

---

## Database Schema (Prisma)

**68 models**, **23 enums** in `packages/database/prisma/schema.prisma`

### Core Models
`Company`, `User`, `Session`, `RefreshToken`, `OAuthAccount`

### CRM Models
`Contact`, `Property`, `PropertyOwner`, `Lead`, `LeadProperty`, `Deal`, `DealProperty`, `Commission`, `Financing`, `Activity`, `LeadInteraction`

### Financial Models
`Client`, `Contract`, `Rental`, `Transaction`, `FinancialForecast`, `FiscalNote`, `Invoice`, `BillingRule`

### Content Models
`BlogPost`, `BlogCategory`, `BlogCluster`, `Document`, `SocialPost`, `MarketingCampaign`

### AI/Automation Models
`AgentJob`, `AutomationRule`, `AutomationLog`, `VisualAIJob`, `AuctionAIAnalysis`, `TomasChat`, `TomasChatMessage`

### SaaS Models
`Tenant`, `PlanDefinition`, `ModuleDefinition`, `ServiceDefinition`, `TenantModuleActivation`, `NicheTemplate`

### Real Estate Specific
`Auction`, `AuctionBid`, `AuctionAlert`, `PropertyAlert`, `OwnerRepasse`, `PropertyValuation`, `PropertyTour`, `Proposal`, `Specialist`, `Building`

### System
`AuditLog`, `ApiKey`, `SystemConfig`, `GlobalSystemSettings`, `ScraperRun`

### Sales/Outbound
`SalesFunnel`, `OutboundMessage`, `FollowUpSchedule`, `HunterLead`, `PreviewSession`

### Affiliate
`Affiliate`, `AffiliateReferral`, `AffiliateEarning`, `SaasCommissionLog`

### Enums
`UserRole`, `UserStatus`, `PropertyType`, `PropertyPurpose`, `PropertyStatus`, `PropertyCategory`, `LeadStatus`, `DealStatus`, `NegotiationType`, `ContactType`, `CommissionStatus`, `FinancingStage`, `ClientRole`, `ContractStatus`, `RentalStatus`, `TransactionType`, `FiscalNoteStatus`, `AuctionSource`, `AuctionStatus`, `AuctionModality`, `SpecialistCategory`, `SpecialistStatus`, `SpecialistPlan`

---

## Key Business Logic

### Tomás — AI Sales Assistant
- Powered by Anthropic Claude (Sonnet)
- Routes: `apps/api/src/routes/tomas/`
- Service: `apps/api/src/services/tomas.service.ts`
- Frontend: `apps/web/src/components/tomas/TomasWidget.tsx`
- Voice input via MediaRecorder API → `/api/v1/public/voice-search` (Whisper)

### Sales Funnel (Máquina de Aquisição)
- Service: `apps/api/src/services/sales-funnel.service.ts`
- Stages: `captured → engaged → preview_sent → preview_clicked → checkout_sent → converted → lost`
- **Regra Inviolável (2-min delay rule):** Tomás sends property preview first, stores `previewSentAt` in funnel metadata, waits 2 minutes before releasing checkout link

### Automation Engine
- Rule-based automation: `AutomationRule` model
- Worker: `apps/api/src/services/automation.worker.ts`
- Actions: `apps/api/src/services/automation.actions.ts`
- Event emitter: `apps/api/src/services/automation.emitter.ts`

### Portal Integration
- Syncs properties to: ZAP, VivaReal, OLX, Facebook Marketplace
- Adapters in `apps/api/src/services/portals/`

### Auction Intelligence
- Sources: Caixa, Santander, courts
- Scrapers: `apps/api/src/services/scrapers/`
- AI analysis: `apps/api/src/services/auction-ai.service.ts`

---

## Mobile/iOS Safari — Known Patterns & Fixes

These patterns are critical and must NOT be regressed:

1. **Input font-size:** Always `16px` minimum on mobile inputs to prevent iOS Safari auto-zoom
2. **Virtual keyboard:** Use `window.visualViewport` API to resize chat/modals when keyboard appears
3. **Body scroll lock:** `position: fixed; overflow: hidden; top: -${scrollY}px` when modals are open
4. **Safe areas:** Use `env(safe-area-inset-bottom)` for iPhone notch/home indicator
5. **Dynamic viewport:** Use `100dvh` instead of `100vh` for mobile-safe heights
6. **Scroll containment:** `overscroll-contain` on scrollable containers inside modals
7. **Canvas CORS:** External images must go through `/api/proxy-image` server-side proxy for `toDataURL()` to work

### Files with mobile-critical code:
- `apps/web/src/components/tomas/TomasWidget.tsx` — Full mobile chat implementation
- `apps/web/src/components/chat/FloatingChatbot.tsx` — Secondary chatbot
- `apps/web/src/components/ui/VoiceInputButton.tsx` — MediaRecorder voice input
- `apps/web/src/components/dashboard/MediaEditorModal.tsx` — Photo editor with Canvas
- `apps/web/src/app/api/proxy-image/route.ts` — Image proxy for CORS

---

## Deployment

### Production
- **API:** Railway (auto-deploys from `main` branch)
- **Web:** Vercel or Railway (Next.js)
- **Database:** Neon PostgreSQL
- **Redis:** Redis Cloud (`redis://...redis-17213.c257.us-east-1-3.ec2.cloud.redislabs.com:17213`)
- **Storage:** AWS S3 + Cloudinary

### Docker (Local Dev)
```bash
docker-compose up -d    # PostgreSQL 16 + Redis 7
```

### Dockerfile (API)
- Base: `node:22-slim`
- Installs pnpm 10, OpenSSL (Prisma), builds API
- Exposes port 3100

---

## Environment Variables

### Required
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — Min 32 chars
- `COOKIE_SECRET` — Min 32 chars

### Important Optional
- `ANTHROPIC_API_KEY` — AI agents, Tomás, content generation
- `OPENAI_API_KEY` — Whisper (voice), alternative AI
- `REDIS_URL` — BullMQ queues, session cache
- `AWS_S3_BUCKET` + `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` — Photo uploads
- `WHATSAPP_TOKEN` + `WHATSAPP_PHONE_ID` — WhatsApp integration
- `ASAAS_API_KEY` — Payment/billing system
- `SMTP_HOST` + `SMTP_USER` + `SMTP_PASS` — Email notifications
- `APIFY_API_TOKEN` — Web scraping (auctions)
- `CLOUDINARY_CLOUD_NAME` — Image optimization & watermarks
- `GOOGLE_MAPS_API_KEY` — Maps, Street View
- `CLICKSIGN_ACCESS_TOKEN` — Digital signatures

See `apps/api/src/utils/env.ts` for the full Zod schema with defaults.

---

## Git Conventions

- **Main branch:** `main` (Railway auto-deploys)
- **Commit style:** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`)
- **Pre-existing typecheck errors:** API has known errors in `auctions/index.ts`, `cep/index.ts`, `finance/webhook.ts`, `leads/index.ts`, `public/valuation.ts`, `users/index.ts`, `import.service.ts`, `tenant.service.ts`, `tomas.service.ts` — do NOT try to fix these unless specifically asked

---

## Common Pitfalls

1. **Never set input font-size < 16px** on mobile — iOS Safari will auto-zoom the viewport
2. **Canvas `toDataURL()` requires same-origin images** — use the proxy-image API route
3. **BullMQ requires Redis** — without `REDIS_URL`, queues use in-memory fallback
4. **Prisma generate** must run before build (`pnpm db:generate`)
5. **API env validation is forgiving** — server starts with defaults even if vars are missing
6. **Multi-tenant middleware** intercepts all routes — test subdomain routing carefully
7. **Railway auto-deploys main** — never push broken code to `main`
8. **MediaRecorder MIME types** vary by browser — always detect with `isTypeSupported()`

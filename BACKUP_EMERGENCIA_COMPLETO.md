# ============================================================================
# AGORAENCONTREI - BACKUP DE EMERGENCIA COMPLETO
# ============================================================================
# Gerado em: 2026-04-09
# Proposito: Backup completo do sistema para reconstrucao de emergencia
# Contem: Toda a arquitetura, codigo, banco de dados, infraestrutura,
#          decisoes tecnicas, dados e configuracoes do projeto
# ============================================================================

---

# PARTE 1: IDENTIDADE DO NEGOCIO E VISAO GERAL

## 1.1 Dados da Empresa

| Campo | Valor |
|---|---|
| Nome | Imobiliaria Lemos |
| Nome comercial | AgoraEncontrei |
| Cidade | Franca - SP (NAO e Ribeirao Preto) |
| CRECI | PF 279051 |
| CNPJ | 10.962.301/0001-50 |
| CCM | 52525 |
| Fundacao | 2002 (22+ anos de mercado) |
| Telefone fixo | (16) 3723-0045 |
| Vendas/Locacao | (16) 98101-0004 |
| WhatsApp | (16) 98101-0004 -> https://wa.me/5516981010004 |
| Sistema legado | Univen (Visual FoxPro / Uniloc) |
| Instagram | @imobiliarialemos |
| YouTube | @tomaslemosbr (canal de Tomas Lemos) |
| Email admin | tomas@agoraencontrei.com.br |

## 1.2 Design System

- Navy: #1B2B5B
- Gold: #C9A84C
- Fundo: #f8f6f1
- Fontes: Georgia, serif (headings) + Inter (body)

## 1.3 URLs de Producao

- Site publico: https://agoraencontrei.vercel.app
- API: https://api-production-669c.up.railway.app
- Dominio oficial: www.agoraencontrei.com.br (pendente CNAME)

## 1.4 Dados em Producao

| Entidade | Quantidade |
|---|---|
| Imoveis ativos (portal publico) | 991 |
| Imoveis com coordenadas | 3.857 |
| Contacts | 9.551 |
| Leads | 1.852 |
| Documentos | 690 |
| Blog posts/videos | 282 |
| Contratos ativos | 189 |
| Rentals (historico) | 27.898 |
| Clientes legados | 2.664 |
| Contratos legados | 1.169 |
| Transacoes caixa | 36.342 |
| Boletos legados | 25.997 |
| Previsoes financeiras | 22.104 |
| Clusters de mapa com coords | 329/329 |
| Audit logs | 65+ |

## 1.5 Equipe de Corretores

| Nome | WhatsApp |
|---|---|
| Gabriel | (16) 99241-1378 |
| Nadia | (16) 99253-3583 |
| Naira | (16) 98101-0003 |
| Miriam | (16) 99127-5404 |
| Noemia | (16) 98101-0005 |
| Nilton | (16) 99965-4949 |
| Geraldo | (16) 98101-0004 |
| Tomas | (16) 99311-6199 |
| Lorena | (16) 99108-3946 |
| Laura | (16) 99340-4117 |
| Lucas | (16) 99195-7528 |

---

# PARTE 2: STACK TECNICA COMPLETA

## 2.1 Monorepo

```
agoraencontrei/
  apps/api        - Fastify + TypeScript + Prisma (Backend)
  apps/web        - Next.js 14 App Router (Frontend)
  packages/database - Prisma schema + migrations
```

## 2.2 Tecnologias

| Camada | Tecnologia | Versao |
|---|---|---|
| Runtime | Node.js | v22.14.0 |
| Package manager | pnpm | >=9.0.0 (monorepo) |
| Backend | Fastify | ^5.8.4 |
| ORM | Prisma | ^5.22.0 |
| Frontend | Next.js | 14 App Router |
| Auth | JWT + httpOnly cookies + refresh token rotation + Google OAuth | - |
| Filas | Redis + BullMQ | ^5.71.1 |
| Storage | AWS S3 (multipart) | @aws-sdk/client-s3 |
| DB | PostgreSQL (Neon serverless) | 16 |
| Cache | Redis (Upstash) | ioredis ^5.10.1 |
| Deploy API | Railway (Dockerfile) | node:22-slim |
| Deploy Web | Vercel | - |
| Pagamentos | Asaas (boleto + PIX) | - |
| WhatsApp | Meta Cloud API | - |
| IA | Anthropic Claude (claude-3-5-sonnet) | @anthropic-ai/sdk ^0.82.0 |
| Voz | Web Speech API (SpeechRecognition, pt-BR) | - |
| Blog | Sync automatico YouTube + Instagram | - |
| Geocoding | Nominatim (OpenStreetMap) | 1 req/s |
| Validacao | Zod | ^3.23.8 |
| Email | Nodemailer | ^8.0.4 |
| Scrapers | Playwright + Apify | ^1.59.1 |
| CSS | Tailwind CSS | - |
| Compressao | @fastify/compress (gzip/brotli) | - |

## 2.3 Dependencias API (apps/api/package.json)

```json
{
  "name": "@agoraencontrei/api",
  "type": "module",
  "dependencies": {
    "@agoraencontrei/database": "workspace:*",
    "@anthropic-ai/sdk": "^0.82.0",
    "@aws-sdk/client-s3": "^3.1019.0",
    "@aws-sdk/s3-request-presigner": "^3.1019.0",
    "@fastify/compress": "^8.3.1",
    "@fastify/cookie": "^11.0.2",
    "@fastify/cors": "^11.2.0",
    "@fastify/helmet": "^13.0.2",
    "@fastify/jwt": "^9.1.0",
    "@fastify/multipart": "^9.4.0",
    "@fastify/rate-limit": "^10.3.0",
    "@fastify/swagger": "^9.7.0",
    "@fastify/swagger-ui": "^5.2.5",
    "@prisma/client": "^5.22.0",
    "@supabase/supabase-js": "^2.49.4",
    "argon2": "^0.41.1",
    "bcryptjs": "^2.4.3",
    "bullmq": "^5.71.1",
    "dotenv": "^16.4.5",
    "fastify": "^5.8.4",
    "fastify-plugin": "^5.1.0",
    "form-data": "^4.0.5",
    "google-auth-library": "^10.6.2",
    "ioredis": "^5.10.1",
    "nanoid": "^5.0.9",
    "node-fetch": "^3.3.2",
    "nodemailer": "^8.0.4",
    "openai": "^6.33.0",
    "pino-pretty": "^13.0.0",
    "playwright-core": "^1.59.1",
    "zod": "^3.23.8",
    "zod-to-json-schema": "^3.23.5"
  }
}
```

## 2.4 Custos Operacionais Mensais

| Servico | Custo |
|---|---|
| Vercel (frontend) | $20/mes (Pro) |
| Railway (API) | $5-10/mes (usage-based) |
| Neon (database) | $0 (free tier) |
| Apify (scrapers) | $29/mes (Starter) |
| Redis (Upstash) | $0 (free tier) |
| Dominio | ~R$40/ano |
| **TOTAL** | **~$55/mes (~R$300/mes)** |


---

# PARTE 3: INFRAESTRUTURA DE PRODUCAO

## 3.1 Railway (API)

- Projeto ID: 7581a820-3667-48c9-84e6-3b394d326b12
- Servico API: 2b0c086a-2929-4fc9-b7a4-a771c16c7b78
- URL: https://api-production-669c.up.railway.app
- Builder: Dockerfile (node:22-slim + OpenSSL + Chromium)
- Porta: 3100

## 3.2 Vercel (Frontend)

- URL: https://agoraencontrei.vercel.app
- Framework: Next.js 14

## 3.3 Variaveis de Ambiente (Railway)

```
DATABASE_URL              - PostgreSQL Railway/Neon
DIRECT_DATABASE_URL       - PostgreSQL (direct, sem pooler)
JWT_SECRET                - Segredo JWT
COOKIE_SECRET             - Segredo cookies
JWT_ACCESS_EXPIRES        - 15m
JWT_REFRESH_EXPIRES       - 30d
REDIS_URL                 - redis://default:{pass}@redis.railway.internal:6379
ASAAS_API_KEY             - Chave Asaas (boletos/PIX)
PUBLIC_COMPANY_ID         - cmnb3pnpl0000ldqxlw26surr
ANTHROPIC_API_KEY         - Chave Claude AI (CONFIGURADA)
GOOGLE_CLIENT_ID          - Client ID Google OAuth
YOUTUBE_API_KEY           - Chave YouTube Data API
INSTAGRAM_TOKEN_TOMAS     - Token Instagram @tomaslemosbr (CONFIGURADA)
INSTAGRAM_TOKEN_LEMOS     - Token Instagram @imobiliarialemos (CONFIGURADA)
AWS_ACCESS_KEY_ID         - S3 access key
AWS_SECRET_ACCESS_KEY     - S3 secret key
AWS_BUCKET_NAME           - Nome do bucket S3
AWS_REGION                - Regiao AWS
WHATSAPP_TOKEN            - Token Meta Cloud API
WHATSAPP_PHONE_ID         - Phone number ID WhatsApp Business
WHATSAPP_VERIFY_TOKEN     - Token verificacao webhook
SMTP_HOST                 - Host email
SMTP_PORT                 - Porta email
SMTP_USER                 - Usuario email
SMTP_PASS                 - Senha email
NODE_ENV                  - production
PORT                      - 3100
LOG_LEVEL                 - info
APIFY_API_TOKEN           - Token Apify (scrapers)
```

## 3.4 Variaveis de Ambiente (Vercel)

```
NEXT_PUBLIC_API_URL       - https://api-production-669c.up.railway.app
NEXT_PUBLIC_GOOGLE_CLIENT_ID - Client ID Google OAuth
NEXT_PUBLIC_GA_MEASUREMENT_ID - Google Analytics 4
```

## 3.5 Dockerfile

```dockerfile
FROM node:22-slim AS base
RUN apt-get update -y && apt-get install -y \
  openssl ca-certificates chromium \
  fonts-liberation libnss3 libatk-bridge2.0-0 \
  libdrm2 libxkbcommon0 libgbm1 libasound2 \
  && rm -rf /var/lib/apt/lists/*
ENV PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/chromium
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/database/package.json ./packages/database/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile
COPY packages/database ./packages/database
COPY apps/api ./apps/api
RUN pnpm --filter @agoraencontrei/database generate
RUN pnpm --filter @agoraencontrei/api build
EXPOSE 3100
CMD ["node", "apps/api/dist/server.js"]
```

## 3.6 Docker Compose (Dev Local)

```yaml
version: '3.9'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: agoraencontrei
    ports: ['5432:5432']
    volumes: [pgdata:/var/lib/postgresql/data]
  redis:
    image: redis:7-alpine
    ports: ['6379:6379']
volumes:
  pgdata:
```

## 3.7 Deploy Workflow

```bash
# Deploy Web (Vercel)
cd /agoraencontrei && vercel --prod

# Deploy API (Railway)
cd /agoraencontrei && railway up --detach

# Redeploy Railway via GraphQL (sem upload)
curl -X POST https://backboard.railway.app/graphql/v2 \
  -H "Authorization: Bearer {RAILWAY_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { serviceInstanceRedeploy(serviceId: \"2b0c086a-2929-4fc9-b7a4-a771c16c7b78\", environmentId: \"prod\") }"}'
```

## 3.8 Monorepo Config

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

```json
// package.json (root)
{
  "name": "agoraencontrei",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "pnpm --parallel --filter './apps/*' dev",
    "build": "pnpm --filter './packages/*' build && pnpm --filter './apps/*' build",
    "db:generate": "pnpm --filter @agoraencontrei/database generate",
    "db:migrate": "pnpm --filter @agoraencontrei/database migrate:dev",
    "db:push": "pnpm --filter @agoraencontrei/database push",
    "db:seed": "pnpm --filter @agoraencontrei/database seed",
    "db:studio": "pnpm --filter @agoraencontrei/database studio"
  },
  "engines": { "node": "22.x", "pnpm": ">=9.0.0" },
  "packageManager": "pnpm@10.0.0"
}
```

---

# PARTE 4: BANCO DE DADOS - SCHEMA PRISMA COMPLETO

## 4.1 Configuracao

```prisma
generator client {
  provider = "prisma-client-js"
}
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")
}
```

## 4.2 ENUMS

```prisma
enum UserRole { SUPER_ADMIN ADMIN MANAGER BROKER FINANCIAL LAWYER CLIENT }
enum UserStatus { ACTIVE INACTIVE PENDING_VERIFICATION SUSPENDED }
enum PropertyType { HOUSE APARTMENT LAND FARM RANCH WAREHOUSE OFFICE STORE STUDIO PENTHOUSE CONDO KITNET }
enum PropertyPurpose { SALE RENT BOTH SEASON }
enum PropertyStatus { ACTIVE INACTIVE SOLD RENTED PENDING DRAFT }
enum PropertyCategory { RESIDENTIAL COMMERCIAL RURAL INDUSTRIAL }
enum LeadStatus { NEW CONTACTED QUALIFIED VISITING PROPOSAL NEGOTIATING WON LOST ARCHIVED }
enum DealStatus { OPEN IN_PROGRESS PROPOSAL CONTRACT CLOSED_WON CLOSED_LOST }
enum NegotiationType { SALE RENT }
enum ContactType { INDIVIDUAL COMPANY }
enum CommissionStatus { PENDING PARTIAL PAID CANCELLED }
enum FinancingStage { SIMULACAO ANALISE_CREDITO ANALISE_JURIDICA EMISSAO_CONTRATO REGISTRO_CONTRATO CONCLUIDO CANCELADO }
enum ClientRole { TENANT LANDLORD GUARANTOR BENEFICIARY SECONDARY }
enum ContractStatus { ACTIVE FINISHED CANCELED }
enum RentalStatus { PENDING PAID LATE }
enum TransactionType { INCOME EXPENSE }
enum FiscalNoteStatus { DRAFT ISSUED SENT RECEIVED CANCELLED ERROR }
enum AuctionSource { CAIXA BANCO_DO_BRASIL BRADESCO ITAU SANTANDER LEILOEIRO JUDICIAL EXTRAJUDICIAL MANUAL }
enum AuctionStatus { UPCOMING OPEN FIRST_ROUND SECOND_ROUND SOLD DESERTED SUSPENDED CANCELLED CLOSED }
enum AuctionModality { ONLINE PRESENTIAL HYBRID DIRECT_SALE }
enum SpecialistCategory { ARQUITETO ENGENHEIRO CORRETOR AVALIADOR DESIGNER_INTERIORES FOTOGRAFO VIDEOMAKER ADVOGADO_IMOBILIARIO DESPACHANTE OUTRO }
enum SpecialistStatus { PENDING ACTIVE SUSPENDED }
enum SpecialistPlan { START PRIME VIP }
```

## 4.3 MODELOS COMPLETOS (40+ modelos)

### Company
```prisma
model Company {
  id String @id @default(cuid())
  name String
  tradeName String?
  cnpj String? @unique
  creci String?
  phone String?
  email String?
  website String?
  logoUrl String?
  address String?
  city String?
  state String?
  zipCode String?
  plan String @default("starter")
  settings Json @default("{}")
  isActive Boolean @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  // Relations: users, properties, contacts, leads, deals, commissions,
  // financings, portals, conversations, agentJobs, automationRules,
  // clients, contracts, rentals, transactions, financialForecasts,
  // invoices, fiscalNotes, visualAIJobs, marketingCampaigns, blogPosts,
  // documents, legalCases, auctions
  @@map("companies")
}
```
- Company ID de producao: cmnb3pnpl0000ldqxlw26surr

### User
```prisma
model User {
  id String @id @default(cuid())
  companyId String
  name String
  email String @unique
  phone String?
  passwordHash String?
  avatarUrl String?
  role UserRole @default(BROKER)
  status UserStatus @default(PENDING_VERIFICATION)
  creciNumber String?
  bio String?
  settings Json @default("{}")
  emailVerifiedAt DateTime?
  lastLoginAt DateTime?
  // Relations: sessions, oauthAccounts, properties, leads, deals, commissions, etc.
  @@map("users")
}
```

### Property (campo mais complexo - 80+ colunas)
Campos principais:
- id, companyId, userId, reference, externalId, title, slug, description
- type, purpose, category, status
- price, priceRent, priceSeason, priceNegotiable, condoFee, iptu
- zipCode, street, number, complement, neighborhood, city, state, latitude, longitude
- totalArea, builtArea, landArea, bedrooms, suites, bathrooms, parkingSpaces
- coverImage, images[], videoUrl, videos[], virtualTourUrl
- features[], metaTitle, metaDescription, metaKeywords[]
- portalDescriptions Json
- views, favorites, leads (contadores)
- isFeatured, isPremium, isHighlighted
- pricePromo, pricePerM2, allowExchange, valueUnderConsultation
- currentState, occupation, standard
- closedCondo, adminCompany, constructionCompany
- totalFloors, suitesWithCloset, demiSuites, rooms, elevators
- showExactLocation Boolean @default(false) -- PRIVACIDADE
- authorizedPublish Boolean @default(false) -- PUBLICACAO
- captorName, captorCommissionPct, exclusivityContract
- importSource, importedAt

### Contact
Campos: id, companyId, type, name, email, phone, cpf, cnpj, rg, birthDate,
address, neighborhood, city, state, zipCode, notes, tags[],
isOwner, isTenant, isGuarantor, externalId, source, metadata

### Lead
Campos: id, companyId, contactId, brokerId, assignedToId, name, email, phone,
status, source, interest, budget, notes, score, tags[], utmSource/Medium/Campaign,
metadata, lastContactAt

### Deal
Campos: id, companyId, leadId, brokerId, contactId, title, type, status,
value, commission, notes, closedAt, expectedCloseAt

### Commission
Campos: id, companyId, dealId, brokerId, dealValue, commissionRate,
grossValue, splitRate, netValue, status, paidAmount, paidAt, dueAt

### Financing
Campos: id, companyId, brokerId, contactId, propertyId, dealId,
stage, bank, propertyValue, financedValue, downPayment, fgtsValue,
monthlyPayment, term, rate, simulatorLink

### Activity (Timeline unificado)
Campos: id, companyId, userId, contactId, leadId, dealId, propertyId,
type (note/call/email/visit/whatsapp/status_change/system), title, description,
metadata, scheduledAt, completedAt

### Client (Legado - Uniloc/Univen)
Campos extensivos: id, companyId, legacyId, name, document (CPF/CNPJ), rg,
profession, birthDate, email, phones, address, roles[ClientRole],
maritalStatus, nationality, spouseName, income, bankInfo, pixKey,
observations, sex, education, cargo, employer info, guarantor info,
search preferences, contact tracking, import metadata (80+ campos)

### Contract (Legado)
Campos: id, companyId, legacyId, propertyId, landlordId, tenantId, guarantorId,
startDate, duration, rentValue, initialValue, commission%,
tenantDueDay, landlordDueDay, penalty%, adjustmentIndex (IGPM/IPCA),
rescissionDate, status, contractHtml (IA), guaranteeType,
endDate, renewalDate, adminFee, insurance, inspection notes,
rescission details, boleto instructions

### Rental (Alugueis mensais)
Campos: id, companyId, legacyId, contractId, dueDate, rentAmount, condoAmount,
waterAmount, electricAmount, taxAmount, penaltyAmount, totalAmount,
paidAmount, paymentDate, repassePaidAt, status,
interest/discount/insurance/iptu amounts, boleto info,
payment method/bank/ref, estorno info, repasse info, notes

### Transaction (Caixa)
Campos: id, companyId, legacyId, transactionDate, amount, type, description, category

### FinancialForecast (Previsoes Uniloc)
Campos: id, companyId, legacyId, dueDate, amount, fee, tenantName, tenantId,
propertyAddress, landlordName, month, year, source, valor detalhes, forecastStatus

### Invoice (Boletos)
Campos: id, companyId, legacyId, contractId, legacy Uniloc fields,
Asaas integration (asaasId, status, bankSlipUrl, pixCode),
full billing details (rent/condo/water/electric/iptu/insurance amounts),
payment tracking, estorno, repasse, status

### FiscalNote + FiscalNoteLog (NF-e)
NF emitida somente para proprietarios (landlords).
Valor = taxa de servico (100% no 1o mes, 10% nos demais).
Municipio: Franca/SP, IBGE 3516200.
Codigo servico: 10.05, tributacao: 1005001.

### Conversation + Message (WhatsApp/Lemos.chat)
Conversation: companyId, phone (E.164), channel, status (bot/open/assigned/resolved),
assignedToId, leadId, contactId, lastMessage, unreadCount, botState Json
Message: conversationId, whatsappId, direction, type, content, mediaUrl, status

### AgentJob (IA)
Tipos: pdf_extract, audio_transcribe, copywrite, score_lead, documents
Status: pending, processing, done, failed

### AutomationRule + AutomationLog (Motor IFTTT)
Triggers: lead_created, lead_updated, deal_created, deal_status_changed,
whatsapp_message, agent_job_done, schedule
Actions Json array, Conditions Json array

### VisualAIJob
Tipos: render, staging, enhance_batch
Status: PENDING, PROCESSING, DONE, ERROR

### MarketingCampaign
Tipos: email, whatsapp
Segmentos: todos_clientes, proprietarios, inquilinos, leads_frios, custom

### BlogPost
Campos: title, slug, excerpt, content, coverImage, SEO fields,
category, tags, source (auto-imported), published, authorName

### Document
Tipos: BOLETO, EXTRATO, REAJUSTE, FINANCEIRO, CONTRATO, JURIDICO, OUTROS
Campos: companyId, contractId, propertyId, clientId, ownerId, legalCaseId,
type, name, month, year, fileData Bytes, mimeType, fileSize, legacyRef

### LegalCase + LegalCaseUpdate (Juridico)
Tipos: DESPEJO, COBRANCA, REVISIONAL, RESCISAO, DANO, OUTROS
Campos: caseNumber, title, plaintiff/defendant/lawyer info, court info,
dates, values, contractId, clientId, propertyId

### Auction (Leiloes)
Campos extensivos: source, status, modality, title, slug, description,
propertyType, location, areas, values (appraisal, minimumBid, rounds),
costs estimates, dates, legal details, bank info, media,
opportunityScore, estimatedROI, scraper tracking

### AuctionBid, AuctionAlert, AuctionAnalysis
Bid: round, bidValue, bidderName
Alert: email/phone filters, frequency
Analysis: costs breakdown, ROI, score, riskLevel, AI recommendation

### ScraperRun
Tracking de scrapers: source, status, items found/created/updated/removed

### Specialist + Building + SpecialistBuilding (Parceiros)
Specialist: name, email, category, bio, city, crea, plan (START/PRIME/VIP),
Asaas payment integration
Building: name, city, neighborhood, floors, units

### PropertyAlert, PropertyOwner, PortalConfig, PortalPublication
### ApiKey, AuditLog, Session, RefreshToken, OAuthAccount
### EmailVerification, PasswordReset, ContractHistory

## 4.4 Campos Prisma Criticos (Armadilhas)

```
Contract:  sem 'endDate' original -> calcular: addMonths(startDate, duration)
Client:    roles: ClientRole[] (array), document (CPF/CNPJ), sem 'type'
Deal:      brokerId (NAO assignedToId), status 'CLOSED_WON'
Rental:    rentAmount (NAO 'amount')
Property:  totalArea e builtArea (NAO 'area'), showExactLocation Boolean
Contact:   isOwner: Boolean, isTenant: Boolean, sem lastContactAt
Lead:      tem lastContactAt DateTime?
req.user:  .cid para companyId (NAO .companyId)
```

## 4.5 Indices de Performance (Manus recommendations)

```prisma
@@index([companyId, status, authorizedPublish])
@@index([companyId, status, authorizedPublish, type])
@@index([companyId, status, authorizedPublish, isFeatured])
@@index([companyId, status, authorizedPublish, createdAt(sort: Desc)])
@@index([companyId, status, authorizedPublish, neighborhood])
@@index([companyId, status, authorizedPublish, price(sort: Asc)])
@@index([companyId, status, authorizedPublish, priceRent(sort: Asc)])
```


---

# PARTE 5: ARQUITETURA DA API (BACKEND)

## 5.1 Server.ts - Ponto de Entrada

O servidor Fastify e inicializado em apps/api/src/server.ts com:

### Plugins registrados (ordem):
1. corsPlugin - CORS cross-origin
2. helmetPlugin - Security headers (crossOriginResourcePolicy: false)
3. rateLimitPlugin - Rate limiting
4. jwtPlugin - JWT authentication
5. prismaPlugin - Prisma client
6. runMigrations() - Migracao automatica no boot
7. redisPlugin - Redis/BullMQ
8. automationPlugin - Motor de automacao
9. multipart - Upload de arquivos (sem limite de tamanho)
10. compress - gzip/brotli (threshold 1KB)

### Servicos em producao (iniciados no boot):
- ScraperScheduler - Robos 24/7 de leiloes
- AuctionMonitorService - Monitor de lances
- PredatoryProtocol - Protocolo predatorio
- AutoHealingService - Monitora erros 500 e problemas de pagamento

### Keep-Alive:
Ping interno a cada 4 minutos para evitar hibernacao no Railway.

### Error Handler:
- ZodError -> 400 VALIDATION_ERROR
- Outros -> statusCode original ou 500

## 5.2 Mapa Completo de Rotas (48+ route files)

```
ROTA                                    | ARQUIVO
/health                                 | routes/health.ts
/api/v1/auth/*                          | routes/auth/index.ts
/api/v1/users/*                         | routes/users/index.ts
/api/v1/properties/*                    | routes/properties/index.ts
/api/v1/leads/*                         | routes/leads/index.ts
/api/v1/contacts/*                      | routes/contacts/index.ts
/api/v1/deals/*                         | routes/deals/index.ts
/api/v1/activities/*                    | routes/activities/index.ts
/api/v1/reports/*                       | routes/reports/index.ts
/api/v1/portals/*                       | routes/portals/index.ts
/api/v1/whatsapp/*                      | routes/whatsapp/index.ts
/api/v1/inbox/*                         | routes/inbox/index.ts
/api/v1/agents/*                        | routes/agents/index.ts
/api/v1/agents/status (PUBLICO)         | server.ts (escopo raiz)
/api/v1/upload/*                        | routes/upload/index.ts
/api/v1/automations/*                   | routes/automations/index.ts
/api/v1/events/*                        | routes/events/index.ts
/api/v1/public/*                        | routes/public/index.ts
/api/v1/finance/*                       | routes/finance/index.ts
/api/v1/finance/invoices/*              | routes/finance/invoices.ts
/api/v1/finance/automation/*            | routes/finance/automation.ts
/api/v1/fiscal/*                        | routes/fiscal/index.ts
/api/v1/corretor/*                      | routes/users/corretor.ts
/api/v1/ai-visual/*                     | routes/ai-visual/index.ts
/api/v1/crm/renovacoes/*               | routes/crm/renovacoes.ts
/api/v1/marketing/campanhas/*           | routes/marketing/campanhas.ts
/api/v1/financings/*                    | routes/financings/index.ts
/api/v1/blog/*                          | routes/blog/index.ts
/api/v1/social/*                        | routes/social/index.ts
/api/v1/documents/*                     | routes/documents/index.ts
/api/v1/portal/*                        | routes/portal/index.ts
/api/v1/audit-logs/*                    | routes/audit-logs/index.ts
/api/v1/photo-editor/*                  | routes/photo-editor/index.ts
/api/v1/system-config/*                 | routes/system-config/index.ts
/api/v1/legal/*                         | routes/legal/index.ts
/api/v1/public/alerts/*                 | routes/alerts/index.ts
/api/v1/auctions/*                      | routes/auctions/index.ts
/api/v1/specialists/*                   | routes/specialists/index.ts
/api/v1/specialists/payments/*          | routes/specialists/payments.ts
/api/v1/seo/*                           | routes/seo-programatico/index.ts
/api/v1/public/* (free-listing)         | routes/public/free-listing.ts
/api/v1/public/* (partner-register)     | routes/public/partner-register.ts
/api/v1/public/* (partner-analytics)    | routes/public/partner-analytics.ts
/api/v1/public/* (territory)            | routes/public/territory.ts
/api/v1/admin/reset-role (JWT_SECRET)   | server.ts
```

## 5.3 Detalhamento de Rotas Principais

### Auth (/api/v1/auth)
- POST /register - Registro com email/senha (argon2)
- POST /login - Login com email/senha
- POST /refresh - Refresh token rotation
- POST /logout - Logout (invalida refresh token)
- GET /me - Dados do usuario autenticado
- POST /google - Google OAuth (ID token)
- POST /portal/login - Login do portal do cliente (CPF)

### Properties (/api/v1/properties)
- GET / - Lista com filtros (optionalAuth: ACTIVE+authorizedPublish sem token)
- POST / - Criar imovel
- GET /:id - Detalhe
- PUT /:id - Atualizar
- DELETE /:id - Deletar
- PUT /:id/status - Mudar status
- PATCH /:id/show-exact-location - Toggle privacidade

### Public (/api/v1/public)
- GET /properties - Lista publica (cache Redis v2)
- GET /properties/:slug - Detalhe publico
- GET /similar/:id - Imoveis similares
- GET /featured - Destaques
- GET /map-clusters - Centroides de bairro
- GET /search-ai - Busca IA
- POST /avaliacao - Avaliacao gratuita
- GET /auctions - Leiloes publicos

### Finance (/api/v1/finance)
- GET /summary - KPIs financeiros + isLegacy (45d threshold)
- GET /cashflow - Fluxo de caixa
- GET /commissions - Comissoes paginadas
- GET /summary/month - Resumo mensal
- GET /rentals/by-month - Alugueis por mes
- PATCH /rentals/:id/paid - Marcar pago
- PATCH /rentals/:id/estorno - Estornar pagamento
- PATCH /rentals/:id/repasse-paid - Marcar repasse pago
- PATCH /rentals/:id/repasse-estorno - Estornar repasse

### Agents (/api/v1/agents)
- GET /status - Status da IA (PUBLICO, escopo raiz)
- POST /score-lead - Score de lead via IA
- POST /pdf-extract - Extrair dados de PDF
- POST /audio-transcribe - Transcrever audio
- POST /copywrite - Gerar texto
- POST /documents/generate - Gerar contrato HTML
- POST /documents/identify - Identificar documento
- POST /search-ai - Busca inteligente

### Social (/api/v1/social)
- POST /sync - Trigger sincronizacao manual YouTube+Instagram
- GET /status - Status configuracao
- GET /instagram - Posts paginados
- GET /youtube - Videos paginados
- POST /daily-post - Trigger post diario
- POST /post/* - Publicacao automatica

### Documents (/api/v1/documents)
- GET / - Lista documentos
- POST / - Upload documento
- GET /:id - Detalhe
- POST /batch-metadata - Registrar metadados em lote (500)
- POST /:id/file - Upload arquivo para doc existente

### Portal do Cliente (/api/v1/portal)
- POST /login - Login por CPF
- GET /dashboard - Dashboard
- GET /boletos - Cobrancas + historico + forecasts
- GET /extratos - Extratos + historico Uniloc
- GET /contratos - Contratos
- GET /documentos - Documentos

### Legal (/api/v1/legal)
- GET / - Lista processos
- POST / - Criar processo
- GET /:id - Detalhe
- PUT /:id - Atualizar
- POST /:id/updates - Adicionar andamento
- GET /:id/documents - Documentos do processo

### Auctions (/api/v1/auctions)
- GET / - Lista leiloes
- GET /:slug - Detalhe leilao
- POST / - Criar leilao
- PUT /:id - Atualizar
- POST /:id/analyze - Analise IA
- POST /scrape - Trigger scraping

### Specialists (/api/v1/specialists)
- GET / - Lista parceiros
- GET /:slug - Perfil
- POST /register - Cadastro
- POST /payments/checkout - Asaas checkout
- POST /payments/webhook - Webhook Asaas

## 5.4 Servicos (apps/api/src/services/)

| Servico | Funcao |
|---|---|
| ai.service.ts | Integracao Anthropic Claude |
| ai-newsroom.service.ts | Geracao de noticias IA |
| apify-caixa.service.ts | Scraper leiloes Caixa |
| apify-santander.service.ts | Scraper leiloes Santander |
| apify-zap.service.ts | Scraper precos ZAP |
| apify-quintoandar.service.ts | Scraper alugueis QuintoAndar |
| asaas.service.ts | Integracao pagamentos Asaas |
| auction-aggregator.service.ts | Agregador de leiloes |
| auction-alerts.service.ts | Alertas de leiloes |
| auction-monitor.service.ts | Monitor 24/7 de lances |
| audit.service.ts | Trilha de auditoria |
| auth.service.ts | Autenticacao JWT/refresh |
| auto-healing.service.ts | Auto-healing erros 500 |
| automation.actions.ts | Acoes do motor IFTTT |
| automation.emitter.ts | Emissor de eventos |
| automation.types.ts | Tipos de automacao |
| automation.worker.ts | Worker BullMQ |
| bank-scrapers.service.ts | Scrapers generico bancos |
| caption-generator.service.ts | Gerador de legendas |
| email.service.ts | Envio de emails |
| fiscal.service.ts | NF-e / notas fiscais |
| geocoding.service.ts | Geocoding Nominatim |
| instagram-publisher.service.ts | Publicacao Instagram |
| interlinking.service.ts | Links internos SEO |
| market-intelligence.service.ts | Inteligencia de mercado |
| portals/adapter.interface.ts | Interface adaptador portais |
| portals/olx.adapter.ts | Adaptador OLX |
| portals/zap.adapter.ts | Adaptador ZAP |
| portals/vivareal.adapter.ts | Adaptador VivaReal |
| portals/facebook.adapter.ts | Adaptador Facebook |
| portals/webhook.adapter.ts | Adaptador webhook |
| portals/registry.ts | Registro de portais |
| predatory/protocol.ts | Protocolo predatorio |
| s3.service.ts | Upload AWS S3 |
| scheduled.jobs.ts | Jobs agendados |
| scrapers/base-scraper.ts | Scraper base |
| scrapers/caixa-browser.ts | Scraper Caixa (browser) |
| scrapers/caixa-scraper.ts | Scraper Caixa (dados) |
| scrapers/generic-scraper.ts | Scraper generico |
| scrapers/scheduler.ts | Agendador de scrapers |
| seo-generator.service.ts | Gerador conteudo SEO |
| seo-interlinking.service.ts | Interlinking SEO |
| seo-programatico.service.ts | SEO programatico |
| social-sync.service.ts | Sync YouTube+Instagram |
| sse.emitter.ts | Server-Sent Events |
| whatsapp.service.ts | WhatsApp Cloud API |

## 5.5 Plugins (apps/api/src/plugins/)

| Plugin | Funcao |
|---|---|
| cors.ts | CORS com origins dinamicos (Vercel + localhost) |
| helmet.ts | Headers de seguranca (crossOriginResourcePolicy: false) |
| jwt.ts | JWT com app.authenticate e app.optionalAuth decorators |
| prisma.ts | Prisma client singleton |
| rate-limit.ts | Rate limiting por IP |
| redis.ts | Redis client + BullMQ |
| swagger.ts | Documentacao OpenAPI (dev only) |
| automation.ts | Motor de automacao (triggers + actions) |

## 5.6 Workers

| Worker | Funcao |
|---|---|
| campaign.worker.ts | Worker de campanhas marketing |
| visual-ai.worker.ts | Worker de IA visual |

## 5.7 Jobs

| Job | Funcao |
|---|---|
| daily-social-post.ts | Post diario automatico Instagram/YouTube |


---

# PARTE 6: FRONTEND COMPLETO (apps/web)

## 6.1 Estrutura de Rotas Next.js 14 App Router

### Autenticacao (auth)
```
/login                           - Email+senha + Google Sign-In
/register                        - Registro
/cadastro                        - Cadastro alternativo
```

### Dashboard (dashboard) - AREA RESTRITA
```
/dashboard                       - KPIs home + atalhos rapidos
/dashboard/properties            - CRUD imoveis
/dashboard/properties/new        - Novo imovel
/dashboard/properties/[id]       - Detalhe/edicao imovel
/dashboard/imoveis               - Imoveis (portugues)
/dashboard/imoveis/novo          - Novo imovel (portugues)
/dashboard/leads                 - CRM leads
/dashboard/leads/[id]            - Detalhe lead
/dashboard/contacts              - CRM contatos
/dashboard/contacts/[id]         - Detalhe contato
/dashboard/deals                 - CRM negocios
/dashboard/deals/[id]            - Detalhe negocio
/dashboard/clientes              - Clientes legados (Uniloc)
/dashboard/clientes/[id]         - Detalhe cliente
/dashboard/clientes/[id]/editar  - Editar cliente
/dashboard/clientes/novo         - Novo cliente
/dashboard/contratos             - Contratos
/dashboard/contratos/[id]        - Detalhe contrato
/dashboard/contratos/novo        - Wizard novo contrato (IA)
/dashboard/inbox                 - WhatsApp inbox
/dashboard/inbox/[id]            - Conversa individual
/dashboard/automations           - Rule builder IFTTT
/dashboard/automations/[id]      - Detalhe regra
/dashboard/lemosbank             - Dashboard financeiro
/dashboard/lemosbank/cobrancas   - Cobrancas
/dashboard/lemosbank/repasses    - Repasses ao proprietario
/dashboard/lemosbank/rescisoes   - Rescisoes
/dashboard/lemosbank/relatorios  - Relatorios
/dashboard/lemosbank/boletos     - Gestao de boletos
/dashboard/lemosbank/historico   - Historico
/dashboard/lemosbank/historico-financeiro - Historico financeiro
/dashboard/lemosbank/automacao   - Automacao financeira
/dashboard/lemosbank/arquivo-morto - Arquivo morto
/dashboard/lemosbank/arquivo-documentos - Arquivo documentos
/dashboard/fiscal                - NF-e
/dashboard/corretor              - Painel do corretor
/dashboard/crm                   - CRM hub
/dashboard/crm/renovacoes        - Alertas renovacao
/dashboard/documentos            - Agente IA documentos
/dashboard/ai-visual             - IA Visual (Render/Staging/Batch)
/dashboard/portals               - Configuracao portais
/dashboard/reports               - Relatorios
/dashboard/blog                  - Admin blog
/dashboard/marketing             - Marketing hub
/dashboard/marketing/campanhas   - Campanhas
/dashboard/financiamentos        - Financiamentos
/dashboard/leiloes               - Gestao leiloes
/dashboard/juridico              - Modulo juridico
/dashboard/juridico/[id]         - Detalhe caso
/dashboard/juridico/novo         - Novo caso
/dashboard/parceiros             - Parceiros/especialistas
/dashboard/historico-alteracoes  - Audit log
/dashboard/seo-programatico      - SEO programatico
/dashboard/notifications         - Notificacoes
/dashboard/settings              - Configuracoes (6 abas)
```

### Portal do Cliente (portal) - AREA RESTRITA CLIENTE
```
/portal/login                    - Login CPF
/portal/dashboard                - Dashboard cliente
/portal/boletos                  - Boletos (Ativas + Historico)
/portal/extratos                 - Extratos + Historico Uniloc
/portal/contratos                - Contratos
/portal/documentos               - Documentos
```

### Site Publico (public) - SEM AUTH
```
/                                - Homepage hero Navy+Gold
/imoveis                         - Listagem + filtros + voz
/imoveis/[slug]                  - Detalhe do imovel
/imoveis/em/[cidade]             - Imoveis por cidade
/imoveis/em/[cidade]/[bairro]    - Imoveis por bairro
/imoveis/perto-de/[poi]          - Imoveis proximo a POI
/avaliacao                       - Avaliacao gratuita 3 etapas
/blog                            - Blog publico
/blog/[slug]                     - Post do blog
/leiloes                         - Marketplace de leiloes
/leiloes/[slug]                  - Detalhe leilao
/leilao/[estado]/[cidade]        - Pagina SEO leilao
/leilao-imoveis-em/[cidade]      - SEO leiloes cidade
/investor                        - Terminal investidor (Dark Mode)
/oportunidades/melhores-alugueis-brasil - Ranking yield nacional
/comparar                        - Comparacao cidades
/comparar/[cidadeA]-vs-[cidadeB] - Comparacao especifica
/[estado]/[cidade]               - Pagina SEO cidade
/[estado]/[cidade]/[cluster]     - SEO cluster
/[estado]/[cidade]/bairro/[b]    - SEO bairro
/[estado]/[cidade]/guia/[c]      - Guia local
/corretores                      - Equipe
/equipe                          - Equipe (alternativa)
/sobre                           - Sobre nos
/contato                         - Contato
/faq                             - FAQ
/financiamento                   - Financiamento
/financiamentos                  - Simulador
/financiamentos/simulador        - Simulador detalhado
/servicos                        - Servicos
/servicos/2via-boleto            - 2a via boleto
/servicos/avaliacao-imoveis      - Avaliacao
/servicos/edicao-fotos           - Editor de fotos IA
/servicos/engenharia-construcao  - Engenharia
/servicos/extrato-proprietario   - Extratos
/servicos/fichas-cadastrais      - Fichas
/servicos/fotos-imoveis          - Fotos
/servicos/investimento-imobiliario - Investimento
/servicos/leilao-imoveis         - Leiloes
/servicos/reforma-imoveis        - Reforma
/servicos/video-imoveis          - Videos
/parceiros                       - Parceiros
/parceiros/cadastro              - Cadastro parceiro
/parceiros/checkout              - Checkout
/parceiros/planos                - Planos
/parceiros/plano-vip             - Plano VIP
/parceiros/membro-fundador       - Membro fundador
/parceiros/imobiliaria-lemos     - Perfil Lemos
/especialistas/[slug]            - Perfil especialista
/profissionais/franca            - Profissionais Franca
/bairros                         - Lista bairros
/bairros/franca                  - Bairros Franca
/bairros/franca/[bairro]         - Detalhe bairro
/condominios/franca/[condo]      - Detalhe condominio
/custo-de-vida/[cidade]          - Custo de vida
/ruas/franca/[slug]              - Pagina de rua
/alertas                         - Alertas de imoveis
/favoritos                       - Favoritos
/meu-painel                      - Painel usuario
/anunciar                        - Anunciar imovel
/anunciar-gratis                 - Anuncio gratis
/anunciar-imovel                 - Anunciar
/seja-parceiro                   - Seja parceiro
/depoimentos                     - Depoimentos
/imobiliarias                    - Imobiliarias
/verificar-email                 - Verificacao email
/politica-privacidade            - Politica privacidade
/termos-uso                      - Termos de uso
/s/[slug]                        - Short links
```

### Paginas SEO Estaticas (cidades especificas)
```
/imoveis-franca-sp               /casas-a-venda-franca-sp
/imoveis-regiao-franca-sp        /casas-para-alugar-franca-sp
/imoveis-rifaina-sp              /apartamentos-a-venda-franca-sp
/imoveis-altinopolis-sp          /apartamentos-para-alugar-franca-sp
/imoveis-batatais-sp             /terrenos-a-venda-franca-sp
/imoveis-brodowski-sp            /imoveis-comerciais-franca-sp
/imoveis-cristais-paulista-sp    /condominio-fechado-franca-sp
/imoveis-itirapua-sp             /chacaras-e-sitios-franca-sp
/imoveis-jeriquara-sp            /leilao-imoveis-franca-sp
/imoveis-nuporanga-sp            /investimento-imobiliario-franca-sp
/imoveis-patrocinio-paulista-sp  /financiamento-imovel-franca-sp
/imoveis-pedregulho-sp           /avaliacao-imoveis-franca-sp
/imoveis-restinga-sp             /reforma-de-imoveis-franca-sp
/imoveis-sao-paulo-sp            /vistoria-de-imoveis-franca-sp
/imoveis-belo-horizonte-mg       /arquitetura-franca-sp
/imoveis-brasilia-df             /construcao-civil-franca-sp
/imoveis-curitiba-pr             /decoracao-de-interiores-franca-sp
/imoveis-goiania-go              /direito-imobiliario-franca-sp
/imoveis-a-venda/[cidade]        /engenharia-civil-franca-sp
/imoveis-para-alugar/[cidade]
```

### APIs Next.js (Route Handlers)
```
/api/caixa-csv/route.ts          - Proxy CSV Caixa
/api/health-check/route.ts       - Health check
/api/og/route.tsx                - Open Graph images
/api/revalidate/route.ts         - ISR revalidation
/api/sitemap/bairros/route.ts    - Sitemap bairros
/api/sitemap/cidades/route.ts    - Sitemap cidades
/api/sitemap/comparacoes/route.ts - Sitemap comparacoes
/api/sitemap/leiloes/route.ts    - Sitemap leiloes
/sitemap.ts                      - Sitemap principal
/sitemap-index.xml/route.ts      - Sitemap index
/sitemap-franca.xml/route.ts     - Sitemap Franca
/robots.ts                       - robots.txt
```

## 6.2 Componentes Principais

### Componentes Publicos
| Componente | Funcao |
|---|---|
| Navbar | Sticky + scroll-aware + "Area de Acesso" dropdown |
| FloatingChatbot | Chatbot -> WhatsApp handoff |
| HeroSearchForm | Busca IA + voz na homepage |
| HeroBackground | YouTube video + upload direto |
| SmartQuiz | Quiz IA de qualificacao |
| PresentationSection | Secao de apresentacao |
| PropertyFiltersForm | Filtros + voz auto-submit |
| PropertyMap | Mapa com privacidade (showExactLocation) |
| PropertyGallery | Galeria de fotos |
| SimilarProperties | Imoveis similares |
| SystemThemeInjector | Injecao de tema dinamico |
| MembroCard | Card de membro da equipe |
| LeadCaptureForm | Formulario captura de lead |
| JsonLdScript | Schema.org JSON-LD |
| PrintButton | Botao imprimir |
| CopyLinkButton | Copiar link |
| PropostaOnline | Proposta digital |
| BankButton | Simulacao bancaria |
| AIVisualPublicButton | IA visual publica |

### Componentes Dashboard
| Componente | Funcao |
|---|---|
| sidebar.tsx | Sidebar navegacao + items |
| guard.tsx | Route guard autenticacao |
| SSEProvider | Server-Sent Events provider |
| PropertyFeaturesEditor | Editor de features |
| PropertyImageLightbox | Lightbox de imagens |
| PhotoEditorPanel | Editor de fotos |
| MediaEditorModal | Modal editor de midia |
| AdminPropertyMap | Mapa admin |
| RuleBuilderDialog | Dialog builder automacao |
| AuctionMonitor | Monitor de leiloes |
| SocialPostPanel | Painel post social |
| SystemConfigPanel | Configuracao do sistema |

### Componentes UI
| Componente | Funcao |
|---|---|
| VoiceInputButton | Mic pulsante, SpeechRecognition pt-BR |
| SearchInputWithVoice | Search input com voz |
| UserAvatar | Avatar do usuario |
| button, badge, card, dialog, input, label, select | UI primitives |

### Componentes Utilitarios
| Componente | Funcao |
|---|---|
| Breadcrumbs | Navegacao breadcrumb |
| CalculadoraROI | Calculadora ROI vs SELIC |
| CompareBar + CompareButton | Comparador de imoveis |
| ConditionalMetaPixel | Meta Pixel condicional |
| CookieConsent | Consentimento cookies |
| FavoriteButton | Botao favoritar |
| GoogleAnalytics | GA4 tracking |
| InviteModal | Modal convite |
| LegalRiskSeal | Selo risco juridico |
| MarketComparisonWidget | Widget comparacao mercado |
| MarketPriceComparison | Comparacao precos mercado |
| SEOFooterLinks | Links rodape SEO |
| SkipNav | Acessibilidade |
| SocialProofBanner | Banner prova social |
| TopOpportunityCities | Top cidades oportunidade |
| WebVitals | Web Vitals tracking |

## 6.3 Hooks

| Hook | Funcao |
|---|---|
| useAuth.ts | Autenticacao (login, logout, tokens) |
| useSSE.ts | Server-Sent Events |
| useCompare.ts | Comparacao de imoveis |
| useFavorites.ts | Favoritos |

## 6.4 Stores (Zustand)

| Store | Funcao |
|---|---|
| auth.store.ts | Estado de autenticacao |
| notifications.store.ts | Notificacoes |

## 6.5 Lib

| Arquivo | Funcao |
|---|---|
| api.ts | Cliente API (fetch wrapper com auth, todas as APIs) |
| utils.ts | Utilitarios gerais |
| city-resolver.ts | Resolucao de cidades |
| rental-yield-engine.ts | Motor calculo yield |
| revalidate.ts | ISR revalidation |
| seo-content-blocks.ts | Blocos conteudo SEO |
| seo-interlinking.ts | Links internos SEO |
| text-spinner.ts | Spinner de texto (variacao) |

## 6.6 Dados SEO

| Arquivo | Funcao |
|---|---|
| seo-cities.ts | Lista de cidades SEO |
| seo-bairros-franca.ts | Bairros Franca SEO |
| seo-bairros-ribeirao.ts | Bairros Ribeirao SEO |
| seo-clusters.ts | Clusters SEO |
| seo-condo-slugs.ts | Slugs condominios |
| seo-geo-keywords.ts | Keywords geo |
| seo-ibge-all-cities.ts | Todas 5.570 cidades IBGE |
| seo-ibge-cities.ts | Cidades IBGE resumo |
| seo-ibge-cities-expanded.ts | Cidades IBGE expandido |
| seo-locations.ts | Localizacoes SEO |
| seo-slug-maps.ts | Mapas de slugs |
| franca-local-context.ts | Contexto local Franca |


---

# PARTE 7: AUTENTICACAO E SEGURANCA

## 7.1 JWT Auth

- Access token: 15min, localStorage
- Refresh token: 30 dias, httpOnly cookie
- Cross-origin: sameSite: 'none', secure: true (HARDCODED, nunca condicional)
- Fallback: refresh token tambem no body da resposta (browsers que bloqueiam cookies 3rd-party)
- Google OAuth: POST /api/v1/auth/google com Google ID token
- Portal do cliente: login por CPF (document field)

## 7.2 RBAC - 6+1 Roles

```
SUPER_ADMIN - Acesso total
ADMIN - Administrador
MANAGER - Gerente
BROKER - Corretor
FINANCIAL - Financeiro
LAWYER - Advogado
CLIENT - Cliente
```

## 7.3 Privacidade de Localizacao

```
DB (interno): latitude/longitude -> coordenadas precisas
              showExactLocation -> flag autorizacao publica (default: false)

API Publica:
  showExactLocation = false -> lat: null, lng: null na resposta
  showExactLocation = true  -> lat/lng exatos expostos

Mapa Portal:
  /map-clusters -> centroide de bairro (sempre aproximado)
  Pins individuais -> null por padrao
  Se showExactLocation=true -> pin exato (zoom 17, marcador laranja)
  Se showExactLocation=false -> circulo privacidade ~300m (zoom 15) + "Localizacao aproximada"
```

```typescript
function applyLocationPrivacy<T extends WithLocation>(p: T) {
  const { showExactLocation, ...rest } = p
  return {
    ...rest,
    latitude:  showExactLocation ? p.latitude  : null,
    longitude: showExactLocation ? p.longitude : null,
  }
}
```

## 7.4 Admin Reset Role

Endpoint emergencial POST /api/v1/admin/reset-role protegido por JWT_SECRET.
Permite resetar role de qualquer usuario para SUPER_ADMIN.

## 7.5 Admin Role Enforcement (Boot)

No boot do servidor, automaticamente garante que os emails
tomas@agoraencontrei.com.br e tomascesarlemossilva@gmail.com
tem role SUPER_ADMIN e status ACTIVE.

---

# PARTE 8: FASES IMPLEMENTADAS (HISTORICO COMPLETO)

## Phase 1 - Alicerce
Fastify API + Prisma schema + Auth JWT + RBAC + Next.js 14 + dashboard shell

## Phase 2 - CRM + Lemosbank (2026-03-29)
Contacts, Deals, Activities, comissoes, splits, relatorios financeiros (Asaas)

## Phase 3 - Lemos.chat + Agentes IA (2026-03-29)
WhatsApp Cloud API + inbox + agentes: score-lead, PDF, audio Whisper, copywriter, documentos

## Phase 4 - Motor de Automacao (2026-03-29)
7 triggers, 6 actions, BullMQ worker, Rule Builder UI

## Phase 5A - Portal Publico (2026-03-30)
/imoveis listagem+filtros, /imoveis/[slug] detalhe, SSE, portal adapters

## Phase 5B - Site Premium (2026-03-30)
Homepage Navy+Gold, Smart Quiz IA, Google Sign-In, Blog+YouTube, NF-e,
IA Visual UI, avaliacao publica, campanhas marketing, Meta Pixel

## ETL Legado (2026-03-30)
~100.000 registros migrados: clients, contracts, rentals, transactions, invoices, properties

## Data Cleanup (2026-04-01)
991 imoveis ACTIVE, 340 desativados (Univen-only), 599 cidades corrigidas

## Phase 5C - Voice Input + Integracoes (2026-04-02)
VoiceInputButton em TODOS os campos, Settings aba Integracoes, YouTube 267 videos

## Phase 6 - IA Documentos + Lemosbank Wizard (2026-04-02)
Agente IA com history+edit, Lemosbank wizard 6 steps, SEO JSON-LD, KPI cards clicaveis

## Phase 7 - Documentos Historicos (2026-04-02)
693 docs historicos migrados, API /documents, portal-login, UserAvatar

## Phase 8 - Audit Trail + Cross-Reference (2026-04-03)
65+ audit logs, 189 RENTED com inquilino vinculado, Railway Dockerfile fix

## Phase 9 - Testes + Bugs + Geocoding + Privacidade (2026-04-03)
- 64 endpoints testados em producao
- 10+ bugs corrigidos
- Geocoding: 3857 imoveis com coordenadas
- Geocoding preciso por endereco: 3851 imoveis
- Sistema de privacidade de localizacao
- Cache Redis versao v2

---

# PARTE 9: MOTOR DE AUTOMACAO (Phase 4)

## 9.1 Triggers Implementados (7)

```
lemosbank: boleto.vencendo, boleto.vencido, pagamento.recebido,
           repasse.pendente, split.executado
crm:       lead.criado, lead.sem_resposta_48h, deal.status_mudou,
           visita.agendada, contrato.vencendo_30d
whatsapp:  mensagem.recebida
```

## 9.2 Actions Implementadas (6)

```
whatsapp.send_message
email.send
crm.create_activity
crm.update_lead_status
notification.push
automation.delay
```

---

# PARTE 10: MODULO NF-e (FISCAL)

- NF emitida SOMENTE para proprietarios (landlords)
- Valor = taxa de servico (100% no 1o mes, 10% nos demais)
- NUNCA mencionar "aluguel" na NF-e
- Municipio: Franca/SP, codigo IBGE 3516200
- Formato XML: ABRASF (padrao nacional NFS-e)
- CNPJ: 10.962.301/0001-50 | CCM: 52525
- Codigo servico: 10.05 | Codigo tributacao: 1005001
- Simples Nacional: impostos zerados

---

# PARTE 11: BLOG + SOCIAL SYNC

- Canal YouTube: @tomaslemosbr, ID: UCKpTcdWhQZIPMX8EF_nNckw
- 267 videos sincronizados
- Metodo: uploads playlist + RSS fallback (redirect:follow + User-Agent)
- Cron: diariamente as 09h BRT (12h UTC)
- Instagram @tomaslemosbr e @imobiliarialemos
- Servico: apps/api/src/services/social-sync.service.ts

---

# PARTE 12: LEILOES (Manus + Claude)

## 12.1 Funcionalidades Exclusivas

1. COMPARADOR DE MERCADO (3 PORTAIS)
   Cada leilao mostra: Preco ZAP | VivaReal | ImovelWeb
   Badge: "38% ABAIXO DO MERCADO"
   Lucro Estimado em destaque verde neon

2. TERMOMETRO DE YIELD NACIONAL
   Ranking 10 melhores cidades para investir
   Badge "AUTOSSUSTENTAVEL" quando aluguel cobre parcela BNDES

3. TERMINAL DE INVESTIDOR (MODO DARK)
   Dashboard estilo Bloomberg/TradingView
   Spread historico por bairro, Score risco desocupacao, Yield vs SELIC

4. SELO PEROLA
   Imoveis com >40% de desconto brilham em verde neon

5. SCORE DE RISCO JURIDICO
   Verde: Spread >40% | Amarelo: 20-40% | Vermelho: <20%

6. CALCULADORA ROI vs SELIC
   Inclui: ITBI (2%), registro (1%), comissao (5%), reforma (10%)

7. ALERTAS INTELIGENTES
   WhatsApp automatico para novos leiloes com >40% desconto

8. SEO PROGRAMATICO (700K+ PAGINAS)
   Cada cidade x bairro x tipo = pagina unica
   Dados IBGE, precos cruzados, FAQs, Schema.org, links internos

## 12.2 Scrapers

| Scraper | Fonte | Tipo |
|---|---|---|
| caixa-scraper | Caixa Economica | Leiloes |
| caixa-browser | Caixa (browser) | Leiloes |
| apify-caixa | Caixa via Apify | Leiloes |
| apify-santander | Santander via Apify | Leiloes |
| apify-zap | ZAP Imoveis | Precos mercado |
| apify-quintoandar | QuintoAndar | Alugueis |
| generic-scraper | Leiloeiros genericos | Leiloes |
| bank-scrapers | Bancos diversos | Leiloes |

## 12.3 Endpoints Leiloes

```
GET /api/v1/auctions - Lista leiloes
GET /api/v1/public/auctions - Lista publica
GET /api/v1/auctions/:slug - Detalhe
POST /api/v1/auctions - Criar
PUT /api/v1/auctions/:id - Atualizar
POST /api/v1/auctions/:id/analyze - Analise IA
POST /api/v1/auctions/scrape - Trigger scraping
GET /api/v1/public/alerts - Alertas
POST /api/v1/public/alerts - Criar alerta
```

---

# PARTE 13: DECISOES TECNICAS INVARIANTES

| Decisao | Porque | Como |
|---|---|---|
| sameSite: 'none' nos cookies | Cross-origin Vercel->Railway | Hardcoded, nunca condicional |
| crossOriginResourcePolicy: false | Helmet bloqueia cross-origin | Em plugins/helmet.ts |
| Layout publico = server component | 'use client' -> manifest ENOENT | Layout server + Navbar client separado |
| app/page.tsx removido | Conflitava com (public)/page.tsx | / serve homepage publica |
| req.user.cid para companyId | Padrao JWT payload | Nunca usar .companyId |
| client.document = CPF/CNPJ | Schema Prisma | Nunca usar client.cpf |
| Per-route preHandler em Fastify | addHook aplica a todas as rotas | { preHandler: [app.authenticate] } por rota |
| SpeechRecognitionCtor = new () => any | Evita erro TS | Em VoiceInputButton.tsx |
| pnpm monorepo deploy do root | Sem lock file em apps/web/ | Sempre de /agoraencontrei/ |
| Prisma BoolFilter { equals: true } | Prisma v5 ignora booleano direto | Sempre { equals: true } para booleanos |
| Cache key versionado (v1, v2) | Invalida respostas obsoletas | Bump versao ao mudar shape |
| safeParse nas rotas publicas | setErrorHandler nao captura ZodErrors | Nunca .parse() em routes publicas |
| applyLocationPrivacy() antes de cacheSet | Respostas ja mascaradas | Em lista, detalhe, similar, featured |
| agents/status no escopo raiz | addHook propaga para sub-plugins | Registrar em server.ts |

---

# PARTE 14: HISTORICO DE ERROS RESOLVIDOS (CRITICOS)

| Erro | Causa Raiz | Solucao |
|---|---|---|
| Login nao persiste (15min) | Cookie SameSite=Lax cross-origin | sameSite: 'none' hardcoded |
| API bloqueada no browser | Helmet crossOriginResourcePolicy | crossOriginResourcePolicy: false |
| railway up timeout | node_modules 845MB | .railwayignore |
| Vercel ENOENT manifest | Layout 'use client' | Separar layout (server) de Navbar (client) |
| / 404 | app/page.tsx conflitava | Remover app/page.tsx |
| Inadimplencia 2344% | lateRentals sem filtro data | dueDate no where |
| YouTube sync 0 videos | API 403 + RSS sem User-Agent | Chave unrestricted + redirect:follow |
| Blog publico 401 | addHook aplica auth a TODAS | Per-route preHandler |
| SpeechRecognition TS error | typeof em declare global | SpeechRecognitionCtor = new () => any |
| Railway CLI crash | Node.js wrapper assertion | Binario nativo arm64 |
| closedCondo=true ignorado | Prisma v5 ignora booleanos | { equals: true } BoolFilter |
| railway up TS build fail | status: 'ACTIVE' string | 'ACTIVE' as const |
| ZodError -> HTTP 500 | setErrorHandler nao captura | safeParse + reply.status(400) inline |
| Finance isLegacy sempre true | latestTx < now sempre true | isStaleData = age > 45d |
| Finance inadimplencia 1918% | lateRentals all-time vs 1 mes | Ambos all-time |
| /properties sem auth = 3860 | optionalAuth sem defaults | ACTIVE + authorizedPublish |
| Cache com lat/lng pre-mascaramento | Cache key v1 | Bump para v2 |


---

# PARTE 15: PADROES DE CODIGO

## 15.1 Fastify Route com Auth Opcional

```typescript
app.get('/properties', { preHandler: [app.optionalAuth] }, async (req, reply) => {
  const isAuth = !!(req as any).user
  const where: any = {
    ...(isAuth  && { companyId: (req as any).user.cid }),
    ...(!isAuth && { status: 'ACTIVE', authorizedPublish: true }),
  }
})
```

## 15.2 Fastify ZodError

```typescript
const result = MySchema.safeParse(req.query)
if (!result.success) {
  return reply.status(400).send({ error: 'VALIDATION_ERROR', details: result.error.errors })
}
const q = result.data
```

## 15.3 Prisma BoolFilter

```typescript
// ERRADO: where: { closedCondo: true }
// CORRETO:
where: { closedCondo: { equals: true } }
```

## 15.4 TypeScript Literal Types

```typescript
// ERRADO: const baseWhere = { status: 'ACTIVE' }
// CORRETO:
const baseWhere = { status: 'ACTIVE' as const }
```

## 15.5 Finance isLegacy

```typescript
const STALE_THRESHOLD_MS = 45 * 24 * 60 * 60 * 1000
const isStaleData = !latestTx || (now.getTime() - latestTx.transactionDate.getTime()) > STALE_THRESHOLD_MS
```

---

# PARTE 16: DADOS LEGADOS - ESTRUTURA ETL

## 16.1 Fonte Uniloc/Univen

- Arquivo Univen: HTML table (<table w>), NAO Excel real
- Parse: BeautifulSoup + encoding latin-1
- Fotos: CDN https://cdnuso.com/145/{YYYY}/{MM}/{hash}.jpg
- Distribuicao: FRANCA 806 | RIFAINA 33 | outros interior SP
- Ribeirao Preto: DESATIVADOS (nao pertencem a imobiliaria)

## 16.2 Registros Migrados (~100.000)

| Fonte | Registros | Modelo |
|---|---|---|
| PROPRIETARIOS/INQUILINOS/FIADORES XLS | 2.664 | clients |
| lista_contrato.xls | 1.169 | contracts |
| aluguel.dbf | 35.079 | rentals |
| caixa.dbf | 36.342 | transactions |
| boletos.dbf | 25.997 | invoices |
| univen-imoveis XLS | 988 | properties |
| FINANCEIRO PREVISAO | 22.104 | financial_forecasts |

## 16.3 618 Arquivos DBF Convertidos

180.240 registros totais processados do sistema FoxPro.

---

# PARTE 17: GEOCODING

## Script 1 - geocode-properties.py
- Geocoding por cidade/estado via Nominatim
- 84 combinacoes unicas geocodificadas
- 3857 imoveis atualizados (0 null nos ativos)

## Script 2 - geocode-by-address.py
- Geocoding preciso: rua + numero + bairro + cidade
- Fallback progressivo: endereco completo -> rua+cidade -> bairro+cidade
- Rate limit: 1 req/s (Nominatim TOS)
- 3851 imoveis com street address

IMPORTANTE: Coordenadas precisas no DB mas NUNCA expostas publicamente (privacidade).

---

# PARTE 18: SCRIPTS E FERRAMENTAS

## 18.1 Scripts da API (apps/api/scripts/)

| Script | Funcao |
|---|---|
| audit-migration.ts | Auditoria de migracao |
| create-legal-cases-from-docs.ts | Criar casos juridicos de documentos |
| fix-boletos-link.ts | Corrigir links boletos |
| fix-document-types.ts | Corrigir tipos documentos |
| fix-financial-integration.ts | Corrigir integracao financeira |
| fix-metadata.ts | Corrigir metadados |
| generate-seo-content-batch.ts | Gerar conteudo SEO em lote |
| generate-seo-content.ts | Gerar conteudo SEO |
| import-financial-forecast.ts | Importar previsoes financeiras |
| migrate-legacy-data.ts | Migrar dados legados |
| migrate-uniloc-dbf.ts | Migrar DBF Uniloc |
| seed-1m-urls.ts | Gerar 1M URLs SEO |
| upload-documentos.bat / .ps1 | Upload documentos (Windows) |
| upload-documents-supabase.ts | Upload documentos Supabase |
| rodar-upload-backup.bat | Rodar upload backup |

## 18.2 Scripts Root (scripts/)

| Script | Funcao |
|---|---|
| scrape-caixa.ts | Scraper leiloes Caixa |

## 18.3 Deploy Scripts

| Script | Funcao |
|---|---|
| deploy-railway.sh | Deploy Railway |
| setup.sh | Setup inicial do projeto |

---

# PARTE 19: TESTES

## 19.1 E2E (e2e/)
Testes Playwright end-to-end

## 19.2 Unit (tests/)
Testes unitarios

## 19.3 Producao
64 endpoints testados manualmente em producao (Phase 9)

---

# PARTE 20: ESTRUTURA COMPLETA DE ARQUIVOS

## 20.1 Root

```
.claude/launch.json
.env.example
.github/dependabot.yml
.gitignore
.npmrc
.railwayignore
AGORAENCONTREI_COMPLETE_KNOWLEDGE.md
APRESENTACAO_AGORAENCONTREI_2026.txt
BACKUP_EMERGENCIA_COMPLETO.md (este arquivo)
Dockerfile
README.md
SECURITY.md
docker-compose.yml
deploy-railway.sh
index.html
next-env.d.ts
nixpacks.toml
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
postcss.config.js
railway.json
relatorio-impacto-api.md
setup.sh
tailwind.config.js
tsconfig.json
tsconfig.node.json
vite.config.ts
```

## 20.2 apps/api/src/

```
server.ts
lib/prisma.ts
types/bcryptjs.d.ts
utils/brazil-costs.ts
utils/env.ts
utils/slugify.ts
jobs/daily-social-post.ts
workers/campaign.worker.ts
workers/visual-ai.worker.ts
plugins/ (8 plugins - cors, helmet, jwt, prisma, rate-limit, redis, swagger, automation)
routes/ (48 route files em 30+ diretorios)
services/ (45+ services em 6 subdiretorios)
```

## 20.3 apps/web/src/

```
app/layout.tsx (root layout)
app/error.tsx, app/not-found.tsx, app/robots.ts, app/sitemap.ts
app/(auth)/ (login, register, cadastro)
app/(dashboard)/ (60+ paginas)
app/(portal)/ (6 paginas)
app/(public)/ (120+ paginas)
app/api/ (8 route handlers)
components/ (40+ componentes)
hooks/ (4 hooks)
stores/ (2 stores)
lib/ (8 modulos)
data/ (12 arquivos dados SEO)
```

## 20.4 packages/database/

```
prisma/schema.prisma (2085 linhas, 40+ modelos)
prisma/migrations/ (migrações SQL)
generated/client/ (Prisma Client gerado)
```

## 20.5 Outros

```
data/ (dados auxiliares)
docs/ (documentacao)
e2e/ (testes E2E)
tests/ (testes unitarios)
scripts/ (scraper Caixa)
server/ (servidor legado)
src/ (frontend legado Vite)
supabase/ (migrations, functions, config)
public/ (assets estaticos)
relatorios/ (relatorios)
```

---

# PARTE 21: PENDENCIAS CONHECIDAS

| Item | Prioridade |
|---|---|
| Dominio www.agoraencontrei.com.br | ALTA - CNAME no registro.br + Vercel |
| Icones profissionais corretores | MEDIA - fotos originais ja existem |
| Logo + Hero Video | MEDIA - Settings > Empresa |
| Portais API Keys reais | MEDIA - OLX/ZAP/VivaReal |
| NF-e certificado digital A1 | BAIXA |
| Planilhas previsao financeira | BAIXA |
| Upload 2.217 documentos fisicos | MEDIA - pendente |
| Import planilhas FINANCEIRO PREVISAO.xlsx | MEDIA - pendente |

---

# PARTE 22: COMO RECONSTRUIR O SISTEMA DO ZERO

## Passo 1: Clonar repositorio
```bash
git clone https://github.com/tomascesarlemossil/agoraencontrei.git
cd agoraencontrei
```

## Passo 2: Instalar dependencias
```bash
corepack enable && corepack prepare pnpm@10.0.0 --activate
pnpm install
```

## Passo 3: Configurar banco de dados
```bash
# Copiar .env.example para .env e preencher
cp .env.example .env
# Editar DATABASE_URL com PostgreSQL

# Gerar Prisma client
pnpm db:generate

# Rodar migracoes
pnpm db:push
```

## Passo 4: Desenvolvimento local
```bash
# Subir PostgreSQL + Redis via Docker
docker-compose up -d

# Rodar dev
pnpm dev
```

## Passo 5: Deploy

```bash
# API -> Railway
railway up --detach

# Web -> Vercel
vercel --prod
```

## Passo 6: Configurar variaveis
Configurar todas as variaveis listadas na Parte 3.3 no Railway e Vercel.

## Passo 7: Migrar dados legados
Usar scripts em apps/api/scripts/ para migrar dados do Uniloc/Univen.

---

# PARTE 23: CONTATOS E INFORMACOES IMPORTANTES

## Empresa ID: cmnb3pnpl0000ldqxlw26surr
## Admin: tomas@agoraencontrei.com.br (SUPER_ADMIN)
## API Production: https://api-production-669c.up.railway.app
## Site Production: https://agoraencontrei.vercel.app
## Repositorio: github.com/tomascesarlemossil/agoraencontrei
## Railway Project: 7581a820-3667-48c9-84e6-3b394d326b12
## Meta Pixel: 932688306232065

---

# FIM DO BACKUP DE EMERGENCIA
# Total: ~1.369 arquivos | ~585MB de codigo | 40+ modelos Prisma
# 48+ rotas API | 180+ paginas frontend | 45+ servicos backend
# ~100.000 registros legados migrados | 9 fases implementadas
#
# Este documento contem TUDO necessario para reconstruir o sistema
# AgoraEncontrei do zero, incluindo decisoes de arquitetura,
# armadilhas conhecidas, e historico completo de desenvolvimento.
# ============================================================================


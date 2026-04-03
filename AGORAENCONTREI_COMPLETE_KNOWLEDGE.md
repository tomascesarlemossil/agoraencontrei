# AgoraEncontrei — Conhecimento Completo do Projeto
> **Documento de exportação portátil** — Gerado em 2026-04-03
> **Uso:** Copiar/colar em qualquer plataforma IA (ChatGPT, Manus, Inner IA, etc.) para continuar desenvolvimento
> **⚠️ AVISO:** Remove ou substitua as credenciais reais antes de compartilhar publicamente

---

## RESUMO EXECUTIVO

Sistema completo para a **Imobiliária Lemos** (Franca/SP, CRECI 279051, fundada 2002).
Substituiu sistema legado Visual FoxPro (Uniloc/Univen) por plataforma moderna full-stack.

**Fases concluídas:** 9 fases + ETL + Data Cleanup
**Estado atual:** Produção ativa, 991 imóveis, 9.551 contatos, 27.898 aluguéis históricos

**URLs de produção:**
- Site público: `https://agoraencontrei.vercel.app`
- API: `https://api-production-669c.up.railway.app`
- Domínio oficial pendente: `www.agoraencontrei.com.br`

---

## 1. IDENTIDADE DO NEGÓCIO

| Campo | Valor |
|---|---|
| Nome | Imobiliária Lemos |
| Cidade | **Franca — SP** (NÃO é Ribeirão Preto) |
| CRECI | PF 279051 |
| CNPJ | 10.962.301/0001-50 |
| CCM | 52525 |
| Fundação | 2002 (22+ anos de mercado) |
| Telefone fixo | (16) 3723-0045 |
| Vendas/Locação | (16) 98101-0004 |
| WhatsApp | (16) 98101-0004 → `https://wa.me/5516981010004` |
| Sistema legado | Univen (Visual FoxPro / Uniloc) |
| Instagram | @imobiliarialemos |
| YouTube | @tomaslemosbr (canal de Tomas Lemos) |

**Design System:**
- Navy: `#1B2B5B` | Gold: `#C9A84C` | Fundo: `#f8f6f1`
- Fontes: `Georgia, serif` (headings) + Inter (body)

---

## 2. STACK TÉCNICA

```
Monorepo: agoraencontrei/
  apps/api        — Fastify + TypeScript + Prisma
  apps/web        — Next.js 14 App Router
  packages/database — Prisma schema + migrations
```

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js v22.14.0 |
| Package manager | pnpm (monorepo) |
| Backend | Fastify + TypeScript |
| ORM | Prisma + PostgreSQL |
| Frontend | Next.js 14 App Router |
| Auth | JWT + httpOnly cookies + refresh token rotation + Google OAuth |
| Filas | Redis + BullMQ |
| Storage | AWS S3 (multipart para arquivos grandes) |
| Deploy API | Railway (Dockerfile node:22-slim + OpenSSL) |
| Deploy Web | Vercel |
| Pagamentos | Asaas (boleto + PIX) |
| WhatsApp | Meta Cloud API |
| Voz | Web Speech API (SpeechRecognition, pt-BR) |
| Blog | Sync automático YouTube + Instagram → posts |
| Geocoding | Nominatim (OpenStreetMap) — 1 req/s |

---

## 3. INFRAESTRUTURA DE PRODUÇÃO

### Railway
- Projeto ID: `7581a820-3667-48c9-84e6-3b394d326b12`
- Serviço API: `2b0c086a-2929-4fc9-b7a4-a771c16c7b78`
- URL: `https://api-production-669c.up.railway.app`

### Vercel
- URL: `https://agoraencontrei.vercel.app`

### Deploy Workflow (sempre do root do monorepo)
```bash
cd /caminho/para/agoraencontrei

# Deploy Web
node /path/to/vercel/vc.js --prod

# Deploy API
railway up --detach

# Redeploy Railway sem upload (GraphQL)
curl -X POST https://backboard.railway.app/graphql/v2 \
  -H "Authorization: Bearer {RAILWAY_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { serviceInstanceRedeploy(serviceId: \"2b0c086a-2929-4fc9-b7a4-a771c16c7b78\", environmentId: \"prod\") }"}'
```

**REGRA CRÍTICA:** Railway usa `Dockerfile` builder. `.railwayignore` exclui `node_modules/`, `.next/`, `dist/`. TSC roda no build — qualquer erro TypeScript = build fail.

### Variáveis de Ambiente (Railway)
```
DATABASE_URL              — PostgreSQL Railway
JWT_SECRET                — [seu segredo]
COOKIE_SECRET             — [seu segredo]
JWT_ACCESS_EXPIRES        — 15m
JWT_REFRESH_EXPIRES       — 30d
REDIS_URL                 — redis://default:{pass}@redis.railway.internal:6379
ASAAS_API_KEY             — [chave Asaas]
PUBLIC_COMPANY_ID         — cmnb3pnpl0000ldqxlw26surr
ANTHROPIC_API_KEY         — ⚠️ PENDENTE (necessário para agentes IA)
GOOGLE_CLIENT_ID          — [client id Google OAuth]
YOUTUBE_API_KEY           — [chave YouTube]
INSTAGRAM_TOKEN_TOMAS     — ⚠️ pendente
INSTAGRAM_TOKEN_LEMOS     — ⚠️ pendente
```

### Variáveis de Ambiente (Vercel)
```
NEXT_PUBLIC_API_URL       — https://api-production-669c.up.railway.app
NEXT_PUBLIC_GOOGLE_CLIENT_ID — [client id Google OAuth]
```

---

## 4. BANCO DE DADOS — MODELOS PRINCIPAIS

### Empresa
- ID: `cmnb3pnpl0000ldqxlw26surr` — Imobiliária Lemos

### Usuário admin
- Email: `tomas@agoraencontrei.com.br`

### Modelos Prisma (todos com `companyId`)
```
Company         — settings JSON (tokens integração, site config)
User            — RBAC 6 roles + Google OAuth
Session, RefreshToken
Property        — 991 ACTIVE em produção (+ showExactLocation Boolean)
Lead            — CRM leads
Deal            — CRM negociações
Activity        — timeline CRM
Contact         — contatos (isOwner, isTenant flags)
Contract        — 1.169 contratos legados
Client          — 2.664 clientes legados (roles[] array)
Rental          — 35.079 pagamentos mensais
Transaction     — 36.342 transações do caixa
Invoice         — 25.997 boletos Asaas
FiscalNote, FiscalNoteLog — NF-e
AutomationRule, AutomationLog — motor IFTTT
InboxMessage, WhatsAppSession — Lemos.chat
VisualAIJob     — fila IA visual
BlogPost        — blog YouTube+Instagram
Document        — documentos (contratos, fichas, laudos)
Deal, Commission — CRM + Lemosbank
```

### RBAC — 6 roles
```
SUPER_ADMIN | ADMIN | MANAGER | BROKER | FINANCIAL | CLIENT
```

### Campos Prisma críticos (armadilhas)
```
Contract:  sem 'endDate' → calcular: addMonths(startDate, duration)
Client:    roles: ClientRole[] (array), document (CPF/CNPJ), sem 'type'
Deal:      brokerId (não assignedToId), status 'CLOSED_WON'
Rental:    rentAmount (não 'amount')
Property:  totalArea e builtArea (não 'area'), showExactLocation Boolean
Contact:   isOwner: Boolean, isTenant: Boolean, sem lastContactAt
Lead:      tem lastContactAt DateTime?
req.user:  .cid para companyId (não .companyId)
```

### Dados em Produção (pós-Phase 9)
| Entidade | Quantidade |
|---|---|
| Imóveis ativos (portal público) | 991 |
| Imóveis com coordenadas | 3.857 (todos) |
| Contacts | 9.551 |
| Leads | 1.852 |
| Documentos | 690 |
| Blog posts/vídeos | 282 |
| Contratos ativos | 189 |
| Rentals (histórico) | 27.898 |
| Clusters de mapa com coords | 329/329 |
| Audit logs | 65+ |

---

## 5. ARQUITETURA DE ROTAS API

```
/api/v1/auth/*              — register, login, refresh, logout, /me, google
/api/v1/users/*             — CRUD usuários + /company + /site-settings
/api/v1/properties/*        — CRUD imóveis (optionalAuth → ACTIVE+authorizedPublish sem token)
/api/v1/leads/*             — CRM leads + activities
/api/v1/contacts/*          — CRM contacts
/api/v1/deals/*             — CRM deals
/api/v1/activities/*        — timeline
/api/v1/reports/*           — KPI overview + commissions + leads + broker/:id
/api/v1/portals/*           — OLX/ZAP/VivaReal/Facebook/ChavesCasa/ImovelWeb
/api/v1/whatsapp/*          — webhook + inbox
/api/v1/agents/*            — AI agents (requer ANTHROPIC_API_KEY)
/api/v1/upload/*            — S3 multipart + presigned
/api/v1/automations/*       — motor IFTTT
/api/v1/events/stream       — SSE (token via ?token=JWT)
/api/v1/public/*            — portal público sem auth
  /api/v1/public/properties — lista (cache Redis pub:props:v2:)
  /api/v1/public/properties/:slug — detalhe
  /api/v1/public/similar/:id — similares
  /api/v1/public/featured    — destaques
  /api/v1/public/map-clusters — centróides de bairro (_avg lat/lng)
/api/v1/finance/*           — dashboard financeiro legado
  /api/v1/finance/summary   — KPIs + isLegacy (45d threshold)
  /api/v1/finance/cashflow  — fluxo de caixa
  /api/v1/finance/commissions — lista paginada de comissões
/api/v1/fiscal/*            — NFS-e
/api/v1/corretor/*          — painel corretor RBAC
/api/v1/social/*            — Instagram/YouTube sync
  /api/v1/social/sync       — POST: trigger manual
  /api/v1/social/status     — GET: configuração atual
  /api/v1/social/instagram  — GET: posts paginados
  /api/v1/social/youtube    — GET: vídeos paginados
  /api/v1/social/daily-post — POST: trigger diário
  /api/v1/social/post/*     — publicação automática
/api/v1/blog/*              — admin blog
/api/v1/documents/*         — documentos históricos + upload
/api/v1/audit-logs/*        — trilha de auditoria
/health                     — healthcheck
```

---

## 6. ARQUITETURA DE PRIVACIDADE DE LOCALIZAÇÃO

```
DB (interno):
  properties.latitude / longitude     → coordenadas precisas (por endereço)
  properties.showExactLocation        → flag de autorização pública (default: false)

API Pública (/api/v1/public/...):
  showExactLocation = false (padrão)  → lat: null, lng: null na resposta
  showExactLocation = true            → lat/lng exatos expostos

Mapa do Portal:
  /api/v1/public/map-clusters         → centróide de bairro (sempre aproximado)
  Pins individuais                    → null por padrão
  Se showExactLocation=true           → pin exato no imóvel
```

**Função applyLocationPrivacy (em public/index.ts):**
```typescript
type WithLocation = { latitude?: number | null; longitude?: number | null; showExactLocation?: boolean }
function applyLocationPrivacy<T extends WithLocation>(p: T): Omit<T, 'showExactLocation'> {
  const { showExactLocation, ...rest } = p
  return {
    ...rest,
    latitude:  showExactLocation ? p.latitude  : null,
    longitude: showExactLocation ? p.longitude : null,
  }
}
```

---

## 7. FRONTEND — ESTRUTURA DE ROTAS

```
app/
  (auth)/login                — email+senha + Google Sign-In
  (auth)/register
  (dashboard)/
    dashboard/                — KPIs home
    properties/               — CRUD imóveis + new + [id]
    leads/                    — CRM leads + [id] (voice search)
    contacts/                 — CRM contacts + [id]
    deals/                    — CRM deals + [id]
    inbox/                    — WhatsApp inbox
    automations/              — rule builder + [id]
    lemosbank/                — dashboard financeiro
      repasses/ rescisoes/ relatorios/ cobrancas/
    fiscal/                   — NFS-e
    clientes/                 — clientes legados
    contratos/                — contratos legados
    documentos/               — Agente IA documentos
    ai-visual/                — 3-tab: Render/Staging/Batch
    corretor/                 — painel do corretor
    crm/renovacoes/           — alertas renovação
    portals/                  — configuração portais
    reports/                  — relatórios
    blog/                     — admin blog
    settings/                 — 6 abas (Empresa/Equipe/Perfil/Segurança/Site&IA/Integrações)
  (public)/
    page.tsx                  — homepage hero Navy+Gold
    imoveis/                  — listagem + filtros + voz
    imoveis/[slug]/           — detalhe do imóvel
    avaliacao/                — avaliação gratuita 3 etapas
    blog/                     — blog público
```

---

## 8. COMPONENTES REUTILIZÁVEIS

| Componente | Função |
|---|---|
| `VoiceInputButton` | Mic pulsante, SpeechRecognition pt-BR, dark prop |
| `SearchInputWithVoice` | Drop-in wrapper para search input com voice |
| `Navbar` | Sticky + scroll-aware + "Área de Acesso" dropdown |
| `FloatingChatbot` | Chatbot → WhatsApp handoff |
| `HeroSearchForm` | Busca IA + voz na homepage |
| `PropertyFiltersForm` | Filtros + voz auto-submit |

---

## 9. MÓDULO NF-e

- NF emitida **somente para proprietários (landlords)**
- Valor = **taxa de serviço** (100% no 1º mês, 10% nos demais)
- **Nunca mencionar "aluguel"** na NF-e
- Município: **Franca/SP — código IBGE 3516200**
- Formato XML: ABRASF (padrão nacional NFS-e)
- `CNPJ: 10.962.301/0001-50 | CCM: 52525`
- `Código serviço: 10.05 | Código tributação: 1005001`

---

## 10. BLOG + SOCIAL SYNC

- Canal YouTube: `@tomaslemosbr` — ID: `UCKpTcdWhQZIPMX8EF_nNckw`
- 267 vídeos sincronizados
- Método: uploads playlist + RSS fallback (`redirect:follow` + User-Agent)
- Cron: diariamente às 09h BRT (12h UTC)
- Instagram `@tomaslemosbr` e `@imobiliarialemos` — tokens pendentes
- Serviço: `apps/api/src/services/social-sync.service.ts`

---

## 11. AUTENTICAÇÃO

- Access token: 15min, localStorage
- Refresh token: 30 dias, httpOnly cookie
- Cross-origin: `sameSite: 'none'`, `secure: true` (hardcoded — não condicional)
- Fallback: refresh token também no body da resposta (browsers que bloqueiam cookies 3rd-party)
- Google OAuth: `POST /api/v1/auth/google` com Google ID token

---

## 12. FASES IMPLEMENTADAS — RESUMO COMPLETO

### Phase 1 — Alicerce ✅
Fastify API + Prisma schema + Auth JWT + RBAC + Next.js 14 + dashboard shell

### Phase 2 — CRM + Lemosbank ✅ (2026-03-29)
Contacts, Deals, Activities, comissões, splits, relatórios financeiros (Asaas)

### Phase 3 — Lemos.chat + Agentes IA ✅ (2026-03-29)
WhatsApp Cloud API + inbox + agentes: score-lead, PDF, áudio Whisper, copywriter, documentos
⚠️ Agentes desabilitados até `ANTHROPIC_API_KEY` configurada

### Phase 4 — Motor de Automação ✅ (2026-03-29)
7 triggers, 6 actions, BullMQ worker, Rule Builder UI

### Phase 5A — Portal Público ✅ (2026-03-30)
/imoveis listagem+filtros, /imoveis/[slug] detalhe, SSE, portal adapters (OLX/ZAP/VivaReal/Facebook)

### Phase 5B — Site Premium ✅ (2026-03-30)
Homepage Navy+Gold, Smart Quiz IA, Google Sign-In, Blog+YouTube, NF-e, IA Visual UI,
avaliação pública, campanhas marketing, Meta Pixel 932688306232065

### ETL Legado ✅ (2026-03-30)
~100.000 registros migrados: clients, contracts, rentals, transactions, invoices, properties

### Data Cleanup ✅ (2026-04-01)
991 imóveis ACTIVE, 340 desativados (Univen-only), 599 cidades corrigidas

### Phase 5C — Voice Input + Integrações ✅ (2026-04-02)
VoiceInputButton em TODOS os campos, Settings aba Integrações, YouTube 267 vídeos

### Phase 6 — IA Documentos + Lemosbank Wizard ✅ (2026-04-02)
Agente IA com history+edit, Lemosbank wizard 6 steps, SEO JSON-LD, KPI cards clicáveis

### Phase 7 — Documentos Históricos ✅ (2026-04-02)
693 docs históricos migrados, API /documents, portal-login, UserAvatar

### Phase 8 — Audit Trail + Cross-Reference ✅ (2026-04-03)
65+ audit logs, 189 RENTED com inquilino vinculado, Railway Dockerfile fix

### Phase 9 — Testes + Bugs + Geocoding + Privacidade ✅ (2026-04-03)
- 64 endpoints testados em produção
- 10+ bugs corrigidos (ver seção 13)
- Geocoding: 3857 imóveis com coordenadas (Nominatim/OpenStreetMap)
- Geocoding preciso por endereço: 3851 imóveis (processamento background)
- Sistema de privacidade de localização (`showExactLocation` flag)
- Cache Redis versão v2 (invalida lat/lng expostos)
- 4 novas rotas: reports/leads, finance/commissions, social/instagram, social/youtube
- Segurança /properties: sem auth → ACTIVE+authorizedPublish obrigatório

---

## 13. HISTÓRICO DE ERROS RESOLVIDOS (CRÍTICOS)

| Erro | Causa Raiz | Solução |
|---|---|---|
| Login não persiste (15min) | Cookie `SameSite=Lax` bloqueado cross-origin | `sameSite: 'none'` hardcoded |
| API bloqueada no browser | Helmet `crossOriginResourcePolicy: same-origin` | `crossOriginResourcePolicy: false` |
| `railway up` timeout | node_modules 845MB no upload | `.railwayignore` |
| Vercel ENOENT manifest | Layout `'use client'` | Separar layout (server) de Navbar (client) |
| `/` 404 | `app/page.tsx` conflitava com `(public)/page.tsx` | Remover `app/page.tsx` |
| Inadimplência 2344% | `lateRentals` sem filtro de data | `dueDate` no where |
| YouTube sync 0 vídeos | API 403 (key restrita) + RSS sem User-Agent | Chave unrestricted + redirect:follow |
| Blog público 401 | `addHook` aplica auth a TODAS as rotas do plugin | Per-route `preHandler` |
| `SpeechRecognition` TS error | `typeof SpeechRecognition` em `declare global` | `SpeechRecognitionCtor = new () => any` |
| Railway CLI crash | Node.js wrapper assertion failure | Binário nativo arm64 |
| `closedCondo=true` ignorado | Prisma v5 ignora booleanos diretos em WHERE | `{ equals: true }` BoolFilter |
| `railway up` TS build fail | `status: 'ACTIVE'` inferia `string` não literal | `'ACTIVE' as const` |
| ZodError → HTTP 500 | `setErrorHandler` não captura ZodError em plugin-scoped routes | `safeParse` + `reply.status(400)` inline |
| Finance `isLegacy` sempre true | `latestTx < now` sempre true | `isStaleData = age > 45d` |
| Finance inadimplência 1918% | `lateRentals` all-time vs `totalRentals` 1 mês | Ambos all-time |
| `/properties` sem auth = 3860 registros | `optionalAuth` sem defaults | `ACTIVE + authorizedPublish` obrigatório |
| Cache com lat/lng pré-mascaramento | Cache key v1 com coordenadas | Bump para v2 |

---

## 14. DECISÕES TÉCNICAS INVARIANTES

| Decisão | Porquê | Como aplicar |
|---|---|---|
| `sameSite: 'none'` nos cookies | Cross-origin Vercel→Railway | Hardcoded, nunca condicional a NODE_ENV |
| `crossOriginResourcePolicy: false` | Helmet bloqueia respostas cross-origin | Em `plugins/helmet.ts` |
| Layout público = server component | `'use client'` no layout → manifest ENOENT | Layout server + Navbar/Chatbot como client separados |
| `app/page.tsx` removido | Conflitava com `(public)/page.tsx` | Rota `/` serve homepage pública |
| `req.user.cid` para companyId | Padrão JWT payload | Nunca usar `.companyId` |
| `client.document` = CPF/CNPJ | Schema Prisma | Nunca usar `client.cpf` |
| Per-route `preHandler` em Fastify | `addHook` aplica a todas as rotas do scope | `{ preHandler: [app.authenticate] }` por rota |
| `SpeechRecognitionCtor = new () => any` | Evita erro TS | Em `VoiceInputButton.tsx` |
| pnpm monorepo deploy do root | Sem lock file em `apps/web/` | Sempre de `/agoraencontrei/` |
| Prisma BoolFilter `{ equals: true }` | Prisma v5 ignora booleano direto em WHERE | Sempre `{ equals: true }` para booleanos |
| Cache key versionado (`v1`, `v2`) | Invalida respostas obsoletas | Bump versão ao mudar shape da resposta |
| `safeParse` nas rotas públicas | `setErrorHandler` não captura ZodErrors em Fastify plugins | Nunca `.parse()` em routes publicas — usar `safeParse` |
| `applyLocationPrivacy()` antes de `cacheSet` | Respostas em cache já mascaradas | Função aplicada em lista, detalhe, similar, featured |

---

## 15. PENDÊNCIAS CONHECIDAS

| Item | Prioridade |
|---|---|
| `ANTHROPIC_API_KEY` | 🔴 ALTA — desabilita todos os agentes IA |
| Domínio `www.agoraencontrei.com.br` | 🔴 ALTA — CNAME no registro.br + Vercel |
| `INSTAGRAM_TOKEN_LEMOS` | 🟡 MÉDIA — sync @imobiliarialemos |
| Ícones profissionais corretores | 🟡 MÉDIA — Lorena, Laura, Lucas, Miriam, Geraldo, Tomás (fotos originais já existem) |
| Logo + Hero Video | 🟡 MÉDIA — Settings > Empresa (logoUrl, heroVideoUrl) |
| Portais API Keys reais | 🟡 MÉDIA — OLX/ZAP/VivaReal |
| NF-e certificado digital A1 | 🟢 BAIXA |
| Planilhas previsão financeira 2025/2026 | 🟢 BAIXA |

---

## 15.1. HISTÓRICO DE ALTERAÇÕES (2026-04-03) — Commit 92f0a2a

### Corretores
- WhatsApp atualizados: Gabriel (16)99241-1378, Nádia (16)99253-3583, Naira (16)98101-0003, Miriam (16)99127-5404, Noêmia (16)98101-0005, Nilton (16)99965-4949, Geraldo (16)98101-0004, Tomás (16)99311-6199, Lorena (16)99108-3946, Laura (16)99340-4117, Lucas (16)99195-7528
- `EQUIPE_LEMOS` na página de detalhe do imóvel também atualizada

### Formulário de Imóvel
- Checkbox `showExactLocation` adicionado nos formulários de novo imóvel e edição

### LemosBank
- **Cobranças**: filtro por mês + botão de estorno de pagamento
- **Repasses**: botão "Marcar Repasse como Pago" com endpoint `PATCH /api/v1/finance/rentals/:id/repasse-paid`
- **Rescisões**: exibe data de rescisão e duração do contrato na listagem
- **Relatórios**: exportação CSV do relatório de proprietários
- **Backend**: novos endpoints `PATCH /rentals/:id/estorno`, `GET /summary/month`, `GET /rentals/by-month`
- **Audit**: `rental.estorno` adicionado ao union type `AuditAction`

### Agentes IA
- **BUG CRÍTICO CORRIGIDO**: wizard de contratos (`/contratos/novo`) usava `/documents/identify` para gerar HTML do contrato — corrigido para `/documents/generate` com `formData` estruturado
- Mensagens de erro padronizadas via constante `AI_NOT_CONFIGURED_RESPONSE` em todos os endpoints
- Frontend: verifica `res.ok` antes de parsear JSON (evita falhas silenciosas)
- Mensagens amigáveis quando `ANTHROPIC_API_KEY` não está configurada

### UX/Navegação
- Dashboard principal: atalhos rápidos (Novo Imóvel, Novo Contrato, Leads, LemosBank)
- Sidebar: item "Novo Contrato" adicionado na seção LemosBank

### SEO
- Homepage pública: OpenGraph completo, Twitter Cards, keywords, canonical URL

### API (`lib/api.ts`)
- Novos métodos: `financeApi.estornarAluguel()`, `financeApi.summaryMonth()`, `financeApi.rentalsByMonth()`

---

## 16. PADRÕES DE CÓDIGO

### Fastify Route com Auth Opcional (padrão correto)
```typescript
app.get('/properties', { preHandler: [app.optionalAuth] }, async (req, reply) => {
  const isAuth = !!(req as any).user
  const where: any = {
    ...(isAuth  && { companyId: (req as any).user.cid }),
    ...(!isAuth && { status: 'ACTIVE', authorizedPublish: true }),
  }
  // ...
})
```

### Fastify ZodError (padrão correto — NÃO usar .parse() em rotas)
```typescript
const result = MySchema.safeParse(req.query)
if (!result.success) {
  return reply.status(400).send({ error: 'VALIDATION_ERROR', details: result.error.errors })
}
const q = result.data
```

### Prisma BoolFilter (Prisma v5)
```typescript
// ❌ ERRADO — silenciosamente ignorado
where: { closedCondo: true }

// ✅ CORRETO
where: { closedCondo: { equals: true } }
```

### TypeScript Literal Types com Prisma
```typescript
// ❌ ERRADO — TS infere string
const baseWhere = { status: 'ACTIVE' }

// ✅ CORRETO
const baseWhere = { status: 'ACTIVE' as const }
```

### Finance isLegacy (padrão correto)
```typescript
const STALE_THRESHOLD_MS = 45 * 24 * 60 * 60 * 1000
const isStaleData = !latestTx || (now.getTime() - latestTx.transactionDate.getTime()) > STALE_THRESHOLD_MS
const refDate = isStaleData ? now : latestTx!.transactionDate
```

---

## 17. DADOS LEGADOS — ESTRUTURA XLS

- Arquivo Univen: é **HTML table** (`<table w`), NÃO Excel real
- Parse: BeautifulSoup + encoding `latin-1`
- Fotos: CDN `https://cdnuso.com/145/{YYYY}/{MM}/{hash}.jpg`
- Distribuição: FRANCA 806 | RIFAINA 33 | outros interior SP
- Ribeirão Preto: DESATIVADOS (não pertencem à imobiliária)

### ETL Migrado (~100.000 registros)
| Fonte | Registros | Modelo |
|---|---|---|
| PROPRIETARIOS/INQUILINOS/FIADORES XLS | 2.664 | clients |
| lista_contrato.xls | 1.169 | contracts |
| aluguel.dbf | 35.079 | rentals |
| caixa.dbf | 36.342 | transactions |
| boletos.dbf | 25.997 | invoices |
| univen-imoveis XLS | 988 | properties |

---

## 18. GEOCODING

### Script 1 — geocode-properties.py (concluído)
- Geocoding por cidade/estado via Nominatim
- 84 combinações únicas geocodificadas
- 3857 imóveis atualizados (0 null nos ativos)
- 3 cidades falharam (typos no sistema legado)

### Script 2 — geocode-by-address.py (background ~60 min)
- Geocoding preciso: rua + número + bairro + cidade
- Fallback progressivo: endereço completo → rua+cidade → bairro+cidade
- Rate limit: 1 req/s (Nominatim TOS)
- 3851 imóveis com street address

**IMPORTANTE:** Coordenadas precisas armazenadas no DB mas **nunca expostas** publicamente (ver seção 6 — privacidade).

---

## 19. MOTOR DE AUTOMAÇÃO (Phase 4)

### Triggers implementados (7)
```
lemosbank: boleto.vencendo, boleto.vencido, pagamento.recebido, repasse.pendente, split.executado
crm: lead.criado, lead.sem_resposta_48h, deal.status_mudou, visita.agendada, contrato.vencendo_30d
whatsapp: mensagem.recebida
```

### Actions implementadas (6)
```
whatsapp.send_message, email.send, crm.create_activity, crm.update_lead_status,
notification.push, automation.delay
```

---

## 20. NF-e (MÓDULO FISCAL)

### Endpoint
```
GET  /api/v1/fiscal           — listar NFs
POST /api/v1/fiscal           — gerar NF
GET  /api/v1/fiscal/:id/xml   — download XML
```

### Regra
- Simples Nacional: impostos zerados
- ABRASF (padrão nacional NFS-e)
- Código IBGE Franca/SP: `3516200`

---

## 21. COMO USAR ESTE DOCUMENTO

Para continuar o desenvolvimento em outra plataforma IA:

1. **Cole este documento inteiro** na sessão da IA como contexto
2. **Indique a fase atual** (estamos em Phase 9, state: COMPLETE)
3. **Cite as pendências** da seção 15 para priorizar
4. **Use os padrões** da seção 16 para evitar bugs conhecidos
5. **Consulte a seção 13** (erros) para não repetir os mesmos bugs

### Contexto de continuação sugerido
```
Sou Tomas Lemos, da Imobiliária Lemos (Franca/SP).
Estamos trabalhando no sistema AgoraEncontrei — CRM + portal imobiliário full-stack.
Stack: Fastify + TypeScript + Prisma + Next.js 14 + Railway + Vercel.
Fase atual: Phase 9 COMPLETE (2026-04-03).
[COLAR ESTE DOCUMENTO COMPLETO]
O que preciso agora: [DESCREVER TAREFA]
```

---

*Gerado automaticamente em 2026-04-03 a partir de 9 fases de desenvolvimento*
*Projeto: AgoraEncontrei / Imobiliária Lemos — Franca/SP*

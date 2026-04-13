# AUDITORIA TÉCNICA COMPLETA — AgoraEncontrei
**Data:** 2026-04-13
**Branch auditada:** `main` (pós-merge PR #59) + fixes em `claude/real-estate-ai-automation-P0s3z`
**Escopo:** 13 fases (0 a 12) — arquitetura, frontend, backend, DB, DevOps, security, QA, UX mobile, performance, SEO, financeiro, IA, mídia, integrações, regras de negócio, consistência visual.
**Metodologia:** esquadrão de agentes paralelos lendo código real, sem suposições. Cada achado crítico foi re-verificado antes de corrigir.

---

## Sumário Executivo

| Domínio | Achados | Críticos | Altos | Médios | Baixos | Corrigidos agora |
|---------|---------|----------|-------|--------|--------|------------------|
| Arquitetura (FASE 0) | 6 | 1 | 2 | 2 | 1 | 0 |
| Frontend/UX mobile (FASE 2) | 7 | 0 | 2 | 4 | 1 | 1 |
| Backend/API (FASE 3) | 8 | 2 | 3 | 2 | 1 | 2 |
| Database/Multi-tenant (FASE 4) | 5 | 1 | 2 | 2 | 0 | 0 (migração deferida) |
| DevOps/Infra (FASE 5) | 7 | 1 | 2 | 3 | 1 | 0 |
| Security (FASE 6) | 9 | 3 | 3 | 2 | 1 | 3 |
| Integrações 3P (FASE 7) | 8 | 1 | 3 | 3 | 1 | 1 |
| Regras de negócio (FASE 8) | 6 | 0 | 2 | 3 | 1 | 0 |
| IA/Tomás (FASE 9) | 5 | 0 | 2 | 2 | 1 | 0 |
| Performance (FASE 10) | 10 | 1 | 3 | 4 | 2 | 0 |
| SEO (FASE 11) | 6 | 1 | 2 | 2 | 1 | 0 |
| QA/DevOps (FASE 12) | 12 | 3 | 0 | 6 | 3 | 0 |
| **TOTAL** | **89** | **13** | **26** | **35** | **15** | **7** |

Diagnóstico final de prontidão para produção: **AMARELO** — a plataforma funciona e foi estabilizada (os 7 fixes aplicados nesta sessão fecham os vetores críticos que tinham exposição pública imediata: tenant bypass em `users`, timing-oracle no webhook Asaas, SSRF no `image-processor`, safe-area do chat iOS). Restam itens **CRÍTICO/ALTO** estruturais (multi-tenant gap em `OutboundMessage`/`FollowUpSchedule`/`SalesFunnel`, ausência total de testes automatizados, ausência de CI/CD, ausência de Sentry, Prisma não-singleton) que bloqueiam um "GO VERDE" sem migração planejada e janelas de manutenção.

---

## 1. FIXES APLICADOS NESTA SESSÃO (commit `4a19775`)

### 1.1 CRÍTICO — Tenant isolation em `apps/api/src/routes/users/index.ts`
**Problema:** rotas `PATCH /users/:id`, `PATCH /users/:id/role` e `PATCH /users/:id/password` chamavam `prisma.user.findUnique({ where: { id } })` sem filtrar por `companyId`. Qualquer usuário autenticado (mesmo de outra empresa) podia passar um `id` de usuário alheio e mutar dados cross-tenant.
**Fix:** substituído por `findFirst({ where: { id, companyId: req.user.cid } })` e o `update` agora usa `where: { id: existingUser.id }` / `targetUser.id` — defesa em profundidade contra race conditions.
**Arquivo:** `apps/api/src/routes/users/index.ts:329,380,430`
**Risco de regressão:** baixo — o filtro por `companyId` já era o contrato esperado; rotas retornam 404 quando o target não pertence à empresa do requester.
**Como validar:** autenticar com JWT de company A, chamar `PATCH /users/<id-de-company-B>` → deve retornar 404.

### 1.2 CRÍTICO — Comparação timing-safe no webhook Asaas
**Problema:** `webhook.ts` comparava `webhookToken !== env.ASAAS_WEBHOOK_SECRET` com `!==`. Operação não-constante permite oracle de tempo para inferir o secret byte-a-byte.
**Fix:** adicionado `safeStringEqual` em `apps/api/src/routes/finance/webhook.ts:22-31` usando `crypto.timingSafeEqual` com normalização de comprimento.
**Arquivo:** `apps/api/src/routes/finance/webhook.ts:15-31, 41`
**Risco de regressão:** nenhum — comportamento funcional idêntico.
**Como validar:** `curl -X POST /finance/webhook/asaas -H "asaas-access-token: wrong"` → 401 em tempo constante.

### 1.3 ALTO — SSRF hardening em `apps/image-processor/main.py`
**Problema:** `fetch_image_bytes(url)` baixava qualquer URL sem validação. Atacante podia enviar `http://169.254.169.254/...` (AWS metadata), `http://localhost:5432`, etc. CORS `allow_origins=["*"]` + sem auth agravavam.
**Fix:** função `_assert_url_safe` com (i) whitelist de sufixos de host em paridade com o proxy-image do Next, (ii) `_is_public_ip` que resolve DNS e rejeita `is_private/is_loopback/is_link_local/is_multicast/is_reserved`, (iii) `allow_redirects=False` para evitar rebind, (iv) cap de 20MB em streaming, (v) CORS agora lê de `IMAGE_PROCESSOR_CORS_ORIGINS`.
**Arquivo:** `apps/image-processor/main.py:1-91`
**Risco de regressão:** médio — qualquer host novo precisa ser adicionado ao whitelist. Hoje o sistema só chama este serviço com URLs de S3/Cloudinary/CloudFront/Supabase/Google/agoraencontrei, todos cobertos.
**Como validar:** `curl -d '{"image_url":"http://169.254.169.254/latest/meta-data"}' /preview` → 403 `Host nao autorizado`.

### 1.4 MÉDIO — Safe-area iOS no FloatingChatbot
**Problema:** footer do chat usava `p-3` sem `env(safe-area-inset-bottom)`; no iPhone (com home indicator) o botão de envio ficava cortado.
**Fix:** `paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))'`.
**Arquivo:** `apps/web/src/components/chat/FloatingChatbot.tsx:260-268`
**Risco de regressão:** nenhum (feature CSS tolera graciosamente).
**Como validar:** abrir no Safari iOS → input não fica sob o home indicator.

### 1.5 Verificações que resultaram em FALSO POSITIVO (não modificado)
- **FASE 3 Problema 2 (properties públicas, cross-tenant):** listagem já filtra por `authorizedPublish: true` (marketplace intencional), não é vazamento.
- **FASE 7 Problema 4 (upload-proxy status code):** `route.ts:54` já propaga `status: res.status`.
- **FASE 8 Problema 7 (`{ set: payment.value }`):** sintaxe Prisma válida para escalar Decimal.

---

## 2. ACHADOS CRÍTICOS NÃO CORRIGIDOS (bloqueiam GO VERDE)

### 2.1 Multi-tenant gap em tabelas de outbound/funnel (FASE 4)
**Problema:** `OutboundMessage`, `FollowUpSchedule`, `SalesFunnel` em `packages/database/prisma/schema.prisma:2965-3047` **não têm coluna `companyId`**. Queries que usam essas tabelas não podem ser isoladas por tenant, e um mesmo lead/número pode acabar em fila de outro cliente.
**Por que não corrigi agora:** exige migração DDL + backfill (inferir `companyId` via `leadId`/`contractId`) + update em todos os services consumidores + rollback plan. Janela de manutenção necessária.
**Plano proposto:**
1. `prisma migrate dev --name add_companyId_to_outbound_and_funnel` adicionando `companyId String?` (nullable inicialmente) + FK `Company`.
2. Script de backfill: `UPDATE "OutboundMessage" SET "companyId" = (SELECT "companyId" FROM "Lead" WHERE id = "leadId")` (análogo para as outras 2 tabelas).
3. Após backfill 100%, tornar `companyId` NOT NULL.
4. Atualizar serviços: `outbound-queue.service.ts`, `sales-funnel.service.ts`, `follow-up.service.ts` — todas as queries passam a filtrar por `companyId`.
5. Adicionar teste e2e: criar lead em company A, verificar que company B não vê sua OutboundMessage.

### 2.2 Prisma client não-singleton (FASE 10)
**Problema:** `apps/api/src/lib/prisma.ts` exporta uma instância standalone enquanto `apps/api/src/plugins/prisma.ts` cria `app.prisma`. Rotas que importam a primeira quebram singleton, duplicando connection pool. Em serverless/Railway pode esgotar conexões rapidamente.
**Plano:** `grep "from.*lib/prisma"` nas rotas, consolidar todas em `app.prisma`, deletar `lib/prisma.ts`.

### 2.3 Zero unit/integration tests (FASE 12)
**Problema:** não há Jest/Vitest configurado. Pipeline só tem typecheck + lint. Regressões silenciosas não são detectadas.
**Plano:** começar pelos caminhos críticos — auth routes, webhook Asaas, sales-funnel 2-min rule, tomas.service — mirando 60% coverage nesses arquivos.

### 2.4 Sem CI/CD (FASE 12)
**Problema:** `.github/workflows/` contém apenas `dependabot.yml`. Qualquer PR pode merger com build quebrado.
**Plano:** criar `pr.yml` com `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint && pnpm test` + branch protection rules em `main`.

### 2.5 Sem error tracking (Sentry) (FASE 12)
**Problema:** logs vão só para stdout (Pino) — Railway rotaciona. Errors em produção ficam invisíveis.
**Plano:** `@sentry/node` na API, `@sentry/nextjs` no web, com `beforeSend` redactando PII.

---

## 3. ACHADOS ALTOS (próxima iteração)

| Fase | Problema | Arquivo | Correção |
|------|----------|---------|----------|
| 2 | 203 "use client" no dashboard inflam hydration 200-400ms em 3G | `apps/web/src/app/(dashboard)/` | Auditar top 20 rotas, mover data-fetching pra Server Components |
| 6 | Master route faz N+1 query enriquecendo tenants | `apps/api/src/routes/master/index.ts` | Substituir por `groupBy` único |
| 6 | SSE sem heartbeat/timeout (orphan connections) | `apps/web/src/hooks/useSSE.ts` + `routes/events/index.ts` | Ping 15s + max-connections 100/company |
| 7 | Dockerfiles rodam como root | `Dockerfile*` | `USER appuser` após FROM final |
| 7 | Health check não verifica S3/Anthropic/Redis | `apps/api/src/routes/health.ts` | Expandir `/health/system` com ping por dep |
| 10 | Cloudinary URLs sem `f_auto,q_auto` | API property serializers | Transformer `optimizeImageUrl(url, w)` |
| 10 | Portal dashboard faz 7 queries sequenciais | `apps/api/src/routes/portal/index.ts:21-92` | `Promise.all(…)` |
| 11 | Listagens filtradas sem canonical (`?bairro=X`) | `apps/web/src/app/(public)/imoveis/page.tsx` | `generateMetadata` com canonical derivado |
| 11 | Sitemap contém URLs com query string | `apps/web/src/app/sitemap.ts:283-295` | Remover ou migrar para dynamic routes |

---

## 4. VALIDAÇÕES EXECUTADAS

- ✅ `pnpm --filter web typecheck` → sem erros.
- ✅ `pnpm --filter @agoraencontrei/api typecheck` → só os erros pré-existentes listados em `CLAUDE.md` (auctions, cep, finance/webhook, leads, public/valuation, users, import.service, tenant.service, tomas.service). Nenhum novo erro introduzido pelos fixes.
- ✅ `git push` branch `claude/real-estate-ai-automation-P0s3z` (commit `4a19775`).
- ⏸ `pnpm build` e teste de integração com Asaas/Cloudinary não executados nesta sessão — devem rodar em staging antes do próximo merge.

---

## 5. ITENS PENDENTES / NEXT STEPS

**Prioridade P0 (bloqueadores):**
1. Migração `companyId` em `OutboundMessage`/`FollowUpSchedule`/`SalesFunnel` + backfill.
2. Consolidar Prisma em singleton único (`app.prisma`).
3. Wiring de Sentry (API + Web).
4. Primeira suíte de testes cobrindo auth, webhook Asaas, funil 2-min.

**Prioridade P1 (alto impacto):**
5. CI/CD com typecheck + lint + test + pnpm audit.
6. `USER appuser` em todos os Dockerfiles.
7. Canonical em listagens filtradas + remoção de query strings do sitemap.
8. Cloudinary `f_auto,q_auto` transformer no serializer de propriedades.

**Prioridade P2 (refino):**
9. `Promise.all` no portal dashboard.
10. SSE heartbeat + max-connections.
11. `<img>` → `<Image>` no dashboard (ai-visual, blog, documentos).
12. Substituir `console.log` por `app.log.info`.

---

## 6. DIAGNÓSTICO FINAL

**Estado de produção: AMARELO.**

A plataforma está funcional, os fluxos de negócio core (captura de lead → funil → pagamento via Asaas → repasse D+7 via BullMQ → contrato via Clicksign → notificações WhatsApp) estão operacionais e os vetores de ataque imediatos (tenant bypass, timing oracle, SSRF, home indicator) foram fechados neste commit.

**Para atingir VERDE** é obrigatório:
- Fechar o gap multi-tenant em `OutboundMessage`/`FollowUpSchedule`/`SalesFunnel`;
- Consolidar Prisma singleton;
- Ligar Sentry;
- Ter pelo menos uma suíte de regressão cobrindo auth + pagamentos + funil;
- Habilitar CI obrigando typecheck/lint/test antes de merge em `main`.

Sem estes 5 itens a plataforma opera com risco operacional alto — regressões só aparecem quando clientes reclamam, dados podem vazar entre tenants em subsistemas de mensageria, e falhas em payment webhook ficam invisíveis até o ticket chegar.

---

**Assinado:** Esquadrão de Auditoria — 12 agentes em paralelo + verificação manual por código real.
**Commit dos fixes:** `4a19775` em `claude/real-estate-ai-automation-P0s3z`.

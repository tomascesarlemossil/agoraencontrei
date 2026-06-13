# 📦 Triagem de Dependências e PRs Abertos

> Registro do parecer de merge dos PRs de dependência (Dependabot) e dos PRs
> antigos ainda abertos. **Princípio:** não mergear dependência durante o
> lançamento; o **preview/CI do próprio PR é o portão** (se ficar vermelho, não
> mergeie). Majors entram **um de cada vez**, com build + `scripts/smoke-e2e.sh`.
>
> Revisão: 2026-06.

---

## A. Dependabot — 3 baldes

### 🟢 Pode mergear (baixo risco, valioso)
| PR | Bump | Por quê |
|----|------|---------|
| **#159** | Grupo de **segurança** — 29 diretos (anthropic-sdk, aws-sdk, supabase-js, bullmq, ioredis, argon2, nanoid, google-auth, @fastify/swagger-ui…) | **Todos same-major** (minor/patch) e são correções de segurança. Maior valor, menor risco. |
| **#78** | fastify 5.8.4 → 5.8.5 | Patch. |
| **#68** | pillow 12.1 → 12.2 (image-processor) | Minor, Python isolado. |
| **#65** | dotenv 16 → 17 | Major "de número"; `dotenv/config` inalterado. Conferir boot. |

### 🟡 Testar antes (build + smoke) — um de cada vez
| PR | Bump | Risco a checar |
|----|------|----------------|
| **#5**  | @fastify/jwt 9 → 10 | Quebra via fast-jwt 5 → 6 — **auth crítico** (assinar/verificar token). |
| **#64** | bcryptjs 2 → 3 | ESM por padrão — **auth**. Hashes antigos seguem válidos; confirmar import. |
| **#66** | lucide-react 0.462 → **1.8** | v1 pode ter removido/renomeado ícones → `next build` quebra se algum em uso sumiu. |
| **#155**| @hookform/resolvers 3 → 5 | Pula v4; pode mudar assinatura dos resolvers → **validação de formulários**. |
| **#154**| @types/node 22 → **25** | Só tipos, mas pula 3 majors → possíveis erros de typecheck no build. |

### 🔴 Segurar (sprint dedicado — NÃO no lançamento)
| PR | Bump | Por quê |
|----|------|---------|
| **#156** | **prisma 5.22 → 7** | ORM major (pula v6). `@prisma/client` precisa subir junto; seguir guias 5→6 e 6→7. 68 models → alto risco em queries/migrations. |
| **#157** | **typescript 5.9 → 6.0** | TS 6 traz checagens novas → pode cascatear erros de tipo no monorepo e quebrar `next build`. |

### Ordem recomendada
1. **Depois** de promover produção + E2E (não misturar deps com o lançamento).
2. Mergear **#159** → conferir o site.
3. Depois os 🟡 **um a um**, cada um com build + smoke.
4. Agendar **#156** e **#157** como tarefa própria, com QA completo.

---

## B. PRs antigos (não-Dependabot) — veredito

| PR | O que é | Idade | Veredito |
|----|---------|-------|----------|
| **#61** | Regenera `pnpm-lock.yaml` p/ `tomas-knowledge` | abr/2026 (draft) | ❌ **Fechar — OBSOLETO.** `tomas-knowledge` já está no lockfile da `main`. |
| **#41** | SEO 1M URLs (152 cidades IBGE, rotas `[estado]/[cidade]`) | abr/2026 | ✅ **FECHAR — já superado.** Diff vs `main` atual = só **2 arquivos**: 1 linha de schema (`WebPage`→`FinancialProduct` numa página de investimentos) + um `tsconfig.tsbuildinfo` (artefato de build, não deve ir pro git). A substância (rotas/data layer) já está na `main`. Opcional: cherry-pick só a linha do `FinancialProduct`. |
| **#69** | Reliability sprint 2+3 — **30 arquivos / ~1.300 linhas** (retry Asaas em `finance/webhook` +222/-104, observabilidade em `health.ts` +120, idempotência `outbound-queue`, tenant scope `lead-ingestion`, etc.) | abr/2026 | ⚠️ **NÃO mergear.** (a) 2 meses defasado e **conflita pesado** com o trabalho desta sessão: `saas-webhook.ts` (#176/#180), `server.ts` (#173/#180), `env.ts` (#173), `scheduled.jobs.ts` (#170/#171/#180), `finance/webhook.ts`. (b) Commita artefatos (`.pyc`). (c) Parte da intenção (idempotência/segurança de webhook) já foi feita (#161/#176). **Salvar as ideias como PRs novos e focados** sobre a `main` atual: observabilidade (`health.ts`), idempotência do `outbound-queue`, tenant scope do `lead-ingestion`, retry do `finance/webhook`. |
| **#92** | Scraper Caixa (CSV) + validação de token no webhook de especialistas + SEO de bairro | mai/2026 | ✅ **FECHAR — totalmente cherry-picked.** Webhook → **#176** (token + recuperação de `externalReference`); scraper CSV da Caixa → **#179** (como abordagem 0, com fallback). SEO de bairros já superada na `main`. Nada mais a aproveitar — **não mergear #92 inteiro**. |

> ⚠️ **#92 vs #176:** a parte do webhook do #92 **já está no #176** (token +
> recuperação de `externalReference`). Não mergeie o #92 inteiro — resta só
> avaliar o **scraper CSV da Caixa** à parte, com o diff e um teste de scraping.

---

## C. Notas para quando formos fazer os majors 🔴

**Prisma 7 (#156):**
- Subir **`prisma` e `@prisma/client` juntos** para a mesma major.
- Ler os upgrade guides 5→6 e 6→7 (mudanças em config `prisma.config.ts`, full-text search, drivers, Node suportado).
- `pnpm db:generate` + rodar a suíte/`smoke` + testar fluxos de CRM, finance e webhooks (queries pesadas).
- Conferir as migrations existentes em `packages/database/prisma/migrations`.

**TypeScript 6 (#157):**
- Rodar `pnpm typecheck` e `pnpm build` em branch isolada; catalogar e corrigir os novos erros.
- Lembrar: o build da **API** é tolerante (`tsc || true`), mas o **`next build` (web) falha** em erro de tipo.

---

## D. Princípio geral
Lançar primeiro, estabilizar, **depois** modernizar dependências — uma de cada
vez, com o smoke-test e um olho no preview da Vercel. Segurança (#159) é a
exceção que vale priorizar assim que a produção estiver estável.

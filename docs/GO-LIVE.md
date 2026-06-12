# 🚀 Go-Live — Runbook de Lançamento do AgoraEncontrei

> Passo a passo para colocar a plataforma oficialmente à venda ao público,
> com tudo funcionando. Siga na ordem. Itens marcados **[VOCÊ]** são ações de
> painel (Vercel / Railway / Asaas / Neon) que exigem seu login.

---

## Fase 0 — Pré-requisitos (uma vez)

- [ ] **[VOCÊ]** Faturas da Vercel quitadas e conta reativada (sem banner de suspensão).
- [ ] **[VOCÊ]** v0 cancelado (efetivo 07/07, sem nova cobrança).
- [ ] Código de lançamento mergeado na `main` (PRs #160, #161, #162, #163).

---

## Fase 1 — Configuração de produção **[VOCÊ]**

### 1.1 Vercel — colocar a `main` no ar
> ⚠️ Hoje a produção serve um build antigo: o merge na `main` **não** está
> gerando deploy de produção automático (provável resíduo da suspensão).

- [ ] Vercel → projeto **agoraencontrei** → **Deployments** → último build da
      `main` (Ready) → menu **⋯** → **"Promote to Production"**.
- [ ] **Settings → Git** → confirmar **Production Branch = `main`** e auto-deploy
      habilitado, para os próximos merges irem ao ar sozinhos.
- [ ] **Settings → Spend Management** → definir teto de gasto + alerta por e-mail.

### 1.2 Railway (API) — variáveis de ambiente
Setar/conferir (ver `apps/api/src/utils/env.ts` para a lista completa):

- [ ] `DATABASE_URL`, `JWT_SECRET` (≥32), `COOKIE_SECRET` (≥32)
- [ ] `ANTHROPIC_API_KEY` (Tomás/IA) · `OPENAI_API_KEY` (voz/transcrição)
- [ ] **`ASAAS_API_KEY`** — sem ela o checkout retorna 503
- [ ] **`ASAAS_WEBHOOK_SECRET`** — sem ela o webhook agora **rejeita em produção** (fail-closed)
- [ ] `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` — sem isso o assinante **não recebe login**
- [ ] `WHATSAPP_TOKEN` / `WHATSAPP_PHONE_ID` — canal de credenciais/atendimento
- [ ] `AWS_S3_BUCKET` + chaves — upload de fotos/vídeos
- [ ] `REDIS_URL` — filas (BullMQ)

### 1.3 Asaas — webhooks
- [ ] Registrar **os dois** endpoints (senão um fluxo de pagamento nunca ativa):
  - `https://<api>/api/v1/webhooks/asaas` (assinatura SaaS / tenant)
  - `https://<api>/api/v1/specialists/payments/webhook` (especialistas PRIME/VIP)
- [ ] Usar o mesmo segredo do `ASAAS_WEBHOOK_SECRET` no header `asaas-access-token`.

### 1.4 Neon (banco) — migration manual
> Produção **não** roda `prisma migrate deploy` automático.

- [ ] Rodar no SQL do Neon:
  ```sql
  ALTER TYPE "SpecialistCategory" ADD VALUE IF NOT EXISTS 'IMOBILIARIA';
  ALTER TYPE "SpecialistCategory" ADD VALUE IF NOT EXISTS 'LOTEADORA';
  ```

### 1.5 DNS / domínio
- [ ] Confirmar wildcard **`*.agoraencontrei.com.br`** adicionado no projeto da
      Vercel (necessário para os sites dos clientes em subdomínio funcionarem;
      o middleware já roteia `{cliente}.agoraencontrei.com.br`).

---

## Fase 2 — Verificação (smoke test pós-deploy)

### Vitrine pública
- [ ] `https://www.agoraencontrei.com.br` carrega (200) com a **home nova**
      (Leilões → Quiz → Parceiro; badge "Mais de 25 anos…").
- [ ] `/parceiros/planos` mostra a **landing de planos** (não redireciona).
- [ ] `/imoveis`, `/leiloes`, `/avaliacao`, `/anunciar` abrem.
- [ ] `/politica-privacidade`, `/termos-uso`, `/contato`, `/sobre` abrem.
- [ ] Banner de cookies aparece; GA/Pixel só após consentimento.

### Fluxo do assinante (ponta a ponta — use um valor de teste)
- [ ] Cadastro via planos (DynamicPlans) → gera link Asaas.
- [ ] Pagar (sandbox) → webhook ativa o tenant → **credenciais chegam por e-mail/WhatsApp**.
- [ ] Login → cai em **/dashboard** → aparece o checklist **"Primeiros passos"**.
- [ ] Publicar um imóvel → aparece no marketplace; passo do checklist conclui sozinho.
- [ ] Acessar `{subdomínio}.agoraencontrei.com.br` → site do cliente no ar.
- [ ] Especialista: cadastrar como **Imobiliária/Loteadora** → não dá mais 400.

### Segurança
- [ ] POST no webhook **sem** o header de segredo → responde **401/503** (não ativa nada).

---

## Fase 3 — Pós-lançamento (primeiras 48h)
- [ ] Acompanhar **Vercel → Usage** (banda/funções) e **Logs** (Railway/Vercel).
- [ ] Conferir entregas de e-mail (SMTP) e mensagens WhatsApp.
- [ ] Validar 1ª cobrança recorrente real no Asaas.

---

## Rollback
- Vercel → **Deployments** → deployment anterior estável → **"Promote to Production"**
  (rollback instantâneo, sem rebuild). Banco: as migrations desta entrega são
  aditivas (enum), sem necessidade de rollback de schema.

---

## Roadmap pós-lançamento (P1/P2 — não bloqueiam)
- Provisionamento de **domínio próprio** do cliente (TODO Vercel em `saas-webhook.ts`).
- Senha temporária em texto puro → token de 1º acesso.
- Expiração automática de **TRIAL** (`trialEndsAt` sem job).
- Unificar as 3 definições de plano (DB `PlanDefinition` como fonte única).
- Fail-closed também no webhook de especialistas (`payments.ts`, hoje `@ts-nocheck`).
- Monitoramento de erros (Sentry) + página de status.
- Página de **Cookies** dedicada (hoje embutida na Política de Privacidade).
- Tratar PRs do **Dependabot** (majors) com teste — não mesclar às pressas.

---

_Atualize este runbook a cada lançamento. Última revisão: 2026-06._

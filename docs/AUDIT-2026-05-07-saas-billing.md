# Auditoria — Asaas + SaaS Billing + Partner Onboarding

**Data:** 2026-05-07
**Escopo:** apps/api/src/services/asaas.service.ts,
apps/api/src/routes/billing/saas-checkout.ts,
apps/api/src/routes/billing/saas-webhook.ts,
apps/api/src/routes/finance/webhook.ts,
apps/api/src/services/tenant.service.ts,
apps/web/src/middleware.ts.

---

## TL;DR

O fluxo está **funcional para o caminho feliz** (cliente paga, webhook entrega, tenant ativa, e-mail/WhatsApp saem). Mas tinha **um bug crítico que quebrava o ramo de afiliados** quando o `AffiliateReferral` apontava para um afiliado que tinha sido removido — esse foi corrigido neste commit.

Os outros achados são de **defesa em profundidade**: idempotência em re-entrega, datas reais do Asaas, deploy de domínio próprio (TODO antigo).

---

## 🔴 CRÍTICO — corrigido neste commit

### 1. `calculateAffiliateCommission` sem `await` quebrava webhooks

`apps/api/src/routes/billing/saas-webhook.ts:286-305` (antes do fix)

```ts
const commission = calculateAffiliateCommission(prisma, {...})  // ← Promise
if (commission) {                                                // ← sempre truthy
  await createAffiliateEarning(prisma, {
    ...,
    commissionAmount: (await commission).commissionAmount,       // ← null.commissionAmount → TypeError
  })
}
```

**Impacto:** quando o `AffiliateReferral.affiliateId` apontava pra um afiliado que tinha sido removido (caso real após limpeza de testes), `calculateAffiliateCommission` retorna `null`. O `if (commission)` passava porque uma Promise é sempre truthy, e a próxima linha tentava ler `.commissionAmount` de `null`, lançando `TypeError`.

O `try/catch` externo capturava o erro e logava `Affiliate commission failed: …` mas **a ativação do tenant continuava** (estava bem isolada). Então o sintoma era apenas: nunca era criada uma `AffiliateEarning` mesmo quando havia comissão a pagar — sem mensagem de erro pro time.

**Fix aplicado:** `await` antes do `if`, null-check no resultado, e só cria a earning se `commissionAmount > 0`.

---

## 🟡 MÉDIO — corrigido neste commit

### 2. `saas-webhook` não usava idempotência forte

`apps/api/src/routes/billing/saas-webhook.ts` (handler principal)

O `finance/webhook.ts` já usa a tabela `webhookProcessedEvent` (UNIQUE em `eventKey`) pra rejeitar reentregas atomicamente. O `saas-webhook` dependia apenas do check **status-based** dentro de cada handler (`if (tenant.planStatus === 'ACTIVE') return`), que tem janela de corrida quando dois webhooks chegam ao mesmo tempo.

**Cenário concreto:** Asaas reentrega `PAYMENT_CONFIRMED` 3× em ~5s por timeout no nosso lado. Os 3 podem entrar simultaneamente, todos veem `tenant.planStatus !== 'ACTIVE'`, e os 3 disparam o e-mail/WhatsApp de boas-vindas. O parceiro recebe **3 mensagens idênticas com a mesma senha**.

**Fix aplicado:** mesma estratégia do `finance/webhook` — `INSERT INTO webhookProcessedEvent` com `eventKey = asaas-saas:${event}:${payment.id}` antes do roteamento. Se o INSERT falha com P2002, a função retorna `200 { skipped: true }` e o segundo/terceiro webhook não disparam nada.

### 3. `lastPaymentDate` ignorava data oficial do Asaas

`saas-webhook.ts:156` (antes do fix) gravava `new Date().toISOString()` como data do pagamento. Mas o Asaas já manda `payment.confirmedDate` e `payment.clientPaymentDate` — usar a data do servidor introduz drift de minutos quando o webhook demora pra chegar (o que é normal em retry).

**Fix aplicado:** `payment.confirmedDate ?? payment.clientPaymentDate ?? new Date()`.

---

## 🟢 OBSERVAÇÕES — não corrigidas (precisam de discussão antes)

### 4. Subscription Asaas criada antes da transação DB pode orfanizar

`saas-checkout.ts:178-187`

A subscription no Asaas é criada **antes** da transação Prisma que cria Company/Tenant/User. Se a transação falhar (ex: race condition em subdomain UNIQUE), a subscription fica órfã no Asaas — cobra o cliente mas ele não tem onde logar.

Hoje isso é mitigado pelo bloqueio de e-mail duplicado e check de subdomain antes do Asaas. Mas a janela ainda existe se dois checkouts chegam quase simultâneos.

**Solução proposta:** criar a subscription no Asaas com `externalReference: 'pending:${randomId}'` antes da transação, depois fazer um `PUT /subscriptions/:id` com `externalReference: 'tenant:${subdomain}'` só depois da transação OK. Em caso de falha da transação, cancelar a subscription via `cancelSubscription`.

Não fiz porque o risco real é baixo (race rarissima) e a refatoração toca outros pontos. Vale rodar uma vez, se o problema aparecer.

### 5. `// TODO: Trigger Vercel domain deploy` nunca implementado

`saas-webhook.ts:307`

```ts
// TODO: Trigger Vercel domain deploy when VERCEL_TOKEN is available
// await deploySubdomain(tenant.subdomain)
```

Hoje, o subdomínio `${slug}.agoraencontrei.com.br` funciona via wildcard DNS + middleware Next.js (revisado e confirmado em `apps/web/src/middleware.ts`). Então o "site novo" do parceiro **já está acessível** sem precisar do Vercel deploy.

O TODO faz sentido **apenas para domínios próprios** (`Tenant.customDomain`), que precisam de:
1. Verificação DNS (CNAME ou A record).
2. Adicionar o domínio na Vercel via API.
3. Aguardar o cert SSL emitir.

A `VERCEL_TOKEN` está no `env.ts`. Mas falta o serviço orquestrador. **Recomendo deixar como follow-up** — só vira problema quando alguém comprar um plano com domínio próprio.

### 6. Quota de video editor só provisiona no checkout (não em upgrade)

Cobrimos isso na iteração anterior: `videoEditorQuota` é criada na transação de checkout do plano `nivel-maximo`. Mas se um parceiro **mudar de plano** (ex: enterprise → nivel-maximo), o fluxo de upgrade ainda não dispara o `provisionQuota`.

Fluxo de upgrade não existe ainda como feature de produto. Por enquanto o admin pode chamar `POST /api/v1/master/video-editor/quota/:companyId/provision` manualmente. Quando virar self-service, plugar nesse endpoint.

### 7. Multi-tenant middleware está OK ✓

`apps/web/src/middleware.ts` foi revisado e está sólido:
- Bypass correto para `/_next/`, `/api/`, sitemap, etc.
- Lista de subdomínios reservados (`www`, `api`, `admin`, etc.).
- Passthrough para Vercel/Railway/Netlify previews.
- Custom domain → `/_tenant/_domain` resolver.
- Subdomain → `/_tenant/{slug}`.

A página `_tenant/[slug]/page.tsx` chama `/api/v1/public/tenant/${slug}` com `revalidate: 60`. Isso significa que mudanças no tenant podem demorar até 60s pra refletir — tradeoff aceitável pra reduzir carga no DB.

### 8. Bootstrap de plans rodando no boot ✓

`bootstrap-plans.ts` é chamado no boot do server e faz `upsert` dos 4 planos (Lite, Pro, Enterprise, Nível Máximo). Idempotente — pode rodar quantas vezes precisar.

---

## Como rodar regressão

```bash
# 1) Migration (se ainda não aplicada em produção)
pnpm --filter @agoraencontrei/database exec prisma migrate deploy

# 2) Test webhook idempotency
curl -X POST https://api.agoraencontrei.com.br/api/v1/webhooks/asaas \
  -H 'asaas-access-token: <ASAAS_WEBHOOK_SECRET>' \
  -H 'content-type: application/json' \
  -d '{"event":"PAYMENT_CONFIRMED","payment":{"id":"test_001","value":3500,"externalReference":"tenant:test-foo"}}'
# Primeira chamada → { success: true }
# Segunda chamada (mesma payload) → { success: true, skipped: true }
```

---

## Resumo executivo

- **1 bug crítico corrigido** (afiliados quebrava silenciosamente)
- **2 melhorias de robustez** (idempotência + data correta de pagamento)
- **3 observações documentadas** (vale revisar quando o produto evoluir)
- **Caminho feliz validado:** checkout → Asaas → tenant ativo → site online → e-mail/WhatsApp de boas-vindas → afiliado credita
- **Nada na auditoria bloqueia ir pra produção.**

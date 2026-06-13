# ✅ Roteiro de Teste Ponta a Ponta (E2E) — AgoraEncontrei

> Checklist para conferir **tudo** que foi entregue, após promover a produção.
> Marque cada item. O `scripts/smoke-e2e.sh` automatiza a parte pública (rode-o
> primeiro). Cada seção referencia o PR que entregou a feature.

**Pré-requisito:** produção promovida na Vercel + segredos no Railway + webhooks
no Asaas + SQL do enum no Neon (ver `docs/GO-LIVE.md`).

```bash
# Smoke automático primeiro:
WEB_URL=https://www.agoraencontrei.com.br \
API_URL=https://api.agoraencontrei.com.br \
./scripts/smoke-e2e.sh
```

---

## A. Vitrine pública  *(PRs #160, #178)*
- [ ] `/` carrega com a **home reordenada** (Leilões → Quiz → Parceiro; badge "Mais de 25 anos…").
- [ ] Sem `<meta keywords>` gigante no `<head>` (View Source).
- [ ] `/imoveis`, `/leiloes`, `/avaliacao`, `/anunciar` abrem (200).
- [ ] `/politica-privacidade`, `/termos-uso`, `/cookies`, `/contato`, `/sobre` abrem.
- [ ] Banner de cookies aparece e linka **Privacidade e Cookies**; GA/Pixel só disparam após consentimento (DevTools → Network).

## B. Material de vendas  *(PRs #166–#169)*
- [ ] **Navbar** mostra **"💼 Para Imobiliárias"** (desktop e mobile) → leva a `/sistema`.
- [ ] `/sistema`: hero, **banner "Oferta de Fundador"**, 9 ferramentas (só **Leilões** com selo EXCLUSIVO — Tomás **não**), comparativo, conta de economia, planos reais (R$97/297/597), FAQ, CTA.
- [ ] `/pitch`: 9 slides em scroll-snap; slide do Tomás diz "Seu plantão nunca dorme" (não "exclusivo"); slide de leilões diz "Ninguém mais tem".
- [ ] Docs revisados: `PLANO-DE-VENDAS.md` e `ANALISE-CONCORRENTES.md` coerentes (leilões = diferencial nº 1).

## C. Leilões — performance + mapa  *(PRs #165, #171, #175, #179)*
- [ ] `/leiloes` carrega a lista **rápido** (não trava ~12s esperando feeds).
- [ ] Logo após o hero aparece o **mapa por região** (satélite, com pins).
- [ ] **Mapa só mostra leilões:** o mapa de `/leiloes` exibe **apenas pins de leilão** (sem imóveis comuns nem toggle "🏠 Venda"); já o `/imoveis?view=map` mostra **tudo** (imóveis + leilões).
- [ ] Pins de leilão aparecem **espalhados por bairro** (após o job de geocodificação rodar algumas vezes — ver seção H).
- [ ] Filtros, botão 💎 Pérola, calculadora de ROI e criação de alerta funcionam.

## D. Onboarding  *(PRs #162, #163)*
- [ ] Registrar nova conta → verificar e-mail → **cai em `/dashboard`** (não em cadastro de especialista).
- [ ] No dashboard aparece o **checklist "Primeiros passos"** (4 passos; dispensável; some quando concluído).
- [ ] Cadastro de especialista como **Imobiliária** ou **Loteadora** **não dá mais 400** *(requer o SQL do enum aplicado no Neon)*.

## E. Fluxo de assinatura (pagamento) — o mais crítico  *(PRs #161, #162, #180)*
- [ ] `/parceiros/planos` mostra a **landing de planos** (não redireciona p/ cadastro).
- [ ] Escolher plano → checkout → gera cobrança Asaas (PIX/boleto/cartão).
- [ ] Pagar (sandbox) → **webhook ativa o tenant** → chega e-mail/WhatsApp com **link de 1º acesso** (`/primeiro-acesso?token=…`), **sem senha em texto puro**.
- [ ] **Não há mais "sucesso falso"**: se o Asaas não estiver configurado, o checkout mostra erro honesto (não tela de sucesso).
- [ ] Abrir o link → **definir senha** em `/primeiro-acesso` → login com a nova senha → dashboard. (Link expira em 7 dias; link inválido/usado mostra erro amigável.)
- [ ] `{subdomínio}.agoraencontrei.com.br` → site do cliente no ar.

## F. SaaS / Tenant  *(PRs #170, #172)*
- [ ] **Domínio próprio:** `POST /api/v1/tenants/:id/domain` (como dono ou SUPER_ADMIN) registra na Vercel e retorna instruções de DNS *(requer `VERCEL_TOKEN`/`VERCEL_PROJECT_ID`)*.
- [ ] **Permissão:** o mesmo endpoint com usuário **de outro tenant** → **403**.
- [ ] **Expiração de trial:** um tenant com `planStatus=TRIAL` e `trialEndsAt` no passado é **suspenso** automaticamente (após o job rodar) → `planStatus=SUSPENDED`, site fora do ar.
- [ ] Pagar reativa o tenant (webhook → `ACTIVE`).

## G. Segurança  *(PRs #161, #172, #173, #176)*
- [ ] **Webhook SaaS fail-closed:** `POST /api/v1/webhooks/asaas` **sem** o header `asaas-access-token` → **401** (com `ASAAS_WEBHOOK_SECRET` setado). *(O smoke-test verifica isso.)*
- [ ] **Webhook de especialistas fail-closed:** `POST /api/v1/specialists/payments/webhook` **sem** segredo → **401**; e um pagamento **VIP** confirmado ativa **VIP** (não cai em PRIME).
- [ ] **Idempotência:** reenviar o mesmo evento de pagamento não ativa/credita duas vezes.
- [ ] **Sentry (opcional):** após `pnpm --filter @agoraencontrei/api add @sentry/node` + `SENTRY_DSN`, um erro 500 aparece no painel do Sentry. Sem isso, o app funciona normal (no-op).

## H. Jobs agendados + scrapers (backend)  *(PRs #170, #171, #179)*
> Rodam a cada ~30 min via `scheduled.jobs.ts`. Confira nos **logs do Railway**:
- [ ] `[scheduled] trial-expiration: suspended N expired trials` (quando houver trials vencidos).
- [ ] `[scheduled] auction-geocode-bairro: geocoded N/M auctions` (backfill das coordenadas dos leilões).
- [ ] **Scraper Caixa:** novos leilões trazem `source_format: caixa_csv` (usa o CSV oficial como abordagem 0; cai para ASP/HTML se o CSV falhar).
- [ ] Demais jobs sem erro (boleto, follow-ups, lembretes de visita, etc.).

---

## Como reportar um problema
Para cada ✗, anote: **passo**, **o que esperava**, **o que veio** (status/print) e a
**URL/rota**. Se for backend, inclua o trecho de log do Railway. Assim eu corrijo
direcionado, sem precisar reproduzir do zero.

_Última revisão: 2026-06._

# Módulo de Campanhas por WhatsApp (MVP)

Disparo profissional de campanhas de imóveis, lançamentos e oportunidades para
listas de contatos, com validação de telefone, controle LGPD, opt-out, cálculo
de risco, aprovação humana e fila de envio.

> **MVP = envio SIMULADO.** Nenhuma mensagem real é enviada. A integração com o
> WhatsApp Business Platform está isolada atrás de um _provider_ e só é ativada
> conscientemente via variável de ambiente. **Não há automação de navegador /
> WhatsApp Web** — apenas API oficial ou provedor autorizado.

---

## Onde o módulo vive

Multi-tenant, escopo por `companyId` (mesmo padrão de `OutboundMessage`/`SalesFunnel`).

| Camada | Arquivos |
|--------|----------|
| Schema | `packages/database/prisma/schema.prisma` → `WaCampaign`, `WaCampaignRecipient`, `WaOptOut`, `WaProspectResult` |
| Serviços | `apps/api/src/services/wa-campaigns/` (`phone.util`, `wa-optout.service`, `wa-risk.service`, `wa-provider`, `wa-campaigns.service`, `wa-prospect.service`) |
| Worker/Fila | `apps/api/src/workers/wa-campaign.worker.ts` + fila `wa-campaigns` em `apps/api/src/plugins/automation.ts` |
| Rotas | `apps/api/src/routes/wa-campaigns/index.ts` → prefixo `/api/v1/wa-campaigns` |
| Web | `apps/web/src/app/(dashboard)/dashboard/marketing/wa-campanhas/` (lista + detalhe) + `waCampaignsApi` em `apps/web/src/lib/api.ts` |
| Testes | `apps/api/test/wa-*.test.ts` |

---

## Fluxo

1. **Criar campanha** → `POST /api/v1/wa-campaigns` (nome, imóvel/empreendimento, mensagem, template opcional).
2. **Colar/importar lista** → `POST /:id/recipients`. O serviço:
   - normaliza telefones para E.164 (`+55DDDNUMERO`), corrige celular antigo de 8 dígitos;
   - rejeita fixos, DDD inválido, formatos ruins;
   - remove **duplicados** (no lote e contra a campanha);
   - **bloqueia opt-out** (registro por empresa);
   - grava **origem** (`source`) e **base LGPD** (`consentBasis`) por contato.
3. **Risco** é recalculado automaticamente (`POST /:id/risk` para forçar). Fatores: tamanho da lista, % de inválidos, fragilidade LGPD, prospecção, ausência de template, links.
4. **Aprovação humana** (`POST /:id/approve`, perfil gestor/admin) é **obrigatória** quando o risco é médio/alto (`requiresApproval`).
5. **Disparo** → `POST /:id/dispatch`. Enfileira um job por destinatário na fila `wa-campaigns` (ou processa inline sem Redis). No MVP o _provider_ é **simulado**.
6. **Status por destinatário**: `PENDING → QUEUED → SENT → DELIVERED → READ → REPLIED`, além de `FAILED`, `UNSUBSCRIBED`, `SKIPPED`.
7. **Respostas** → `POST /:id/../webhook/inbound` (`/api/v1/wa-campaigns/webhook/inbound`): detecta **SAIR/PARAR** (registra opt-out + `UNSUBSCRIBED`) ou abre **atendimento no CRM** (cria/atualiza `Lead`).
8. **Agente de prospecção** → `POST /:id/prospect/research`: gera candidatos comerciais públicos **SIMULADOS**, sempre em `PENDING_REVIEW`. Exige **fonte** e **revisão humana** (`POST /prospect/:pid/review`) antes de `POST /:id/prospect/import`.

---

## O que ficou simulado (MVP)

- **Envio**: `SimulatedProvider` (`wa-provider.ts`) — retorna id `sim_...` e marca `DELIVERED`, sem chamar a Meta.
- **Webhook de entrega/leitura real**: no simulado, `DELIVERED` é setado direto; `READ` viria do webhook real.
- **Agente de prospecção**: `runResearch()` devolve exemplos determinísticos **sem inventar telefones**; a fonte real (ex.: Google Places, diretórios públicos de CNPJ) é plugada substituindo essa função.

Tudo o mais é real: modelo de dados, validação, dedupe, opt-out, risco, aprovação, fila e status.

---

## Variáveis de ambiente

Já existentes (reaproveitadas para o envio real):

| Var | Uso |
|-----|-----|
| `WHATSAPP_TOKEN` | Token da WhatsApp Cloud API |
| `WHATSAPP_PHONE_ID` | Phone Number ID (WABA) |
| `WHATSAPP_VERIFY_TOKEN` | Verificação do webhook de inbound |
| `WHATSAPP_BUSINESS_ID` | ID da conta WhatsApp Business |
| `REDIS_URL` | Fila `wa-campaigns` (BullMQ). Sem Redis → processamento inline |

Novas (introduzidas por este módulo, em `apps/api/src/utils/env.ts`):

| Var | Default | Uso |
|-----|---------|-----|
| `WA_CAMPAIGNS_PROVIDER` | `simulated` | `simulated` \| `cloud_api` \| `provider` |
| `WA_CAMPAIGNS_LIVE` | `false` | **Trava de segurança.** Só envia mensagem REAL quando `true`. Enquanto `false`, tudo é simulado mesmo com credenciais presentes |
| `WHATSAPP_TEMPLATE_NAMESPACE` | — | Namespace dos templates aprovados na Meta |

Credenciais por tenant também são resolvidas via `getIntegrationConfig(prisma, companyId, 'whatsapp')` (tabela `IntegrationCredential`), com fallback para as env vars.

---

## Como testar

```bash
# Testes unitários do módulo (telefone, opt-out, criação de campanha, fila)
pnpm --filter @agoraencontrei/api exec tsx --test \
  test/wa-phone.test.ts test/wa-optout.test.ts test/wa-campaign.test.ts test/wa-queue.test.ts
```

Manual (API rodando, com JWT de usuário staff):

```bash
# 1) criar campanha
curl -X POST localhost:3100/api/v1/wa-campaigns -H "Authorization: Bearer $T" -H 'Content-Type: application/json' \
  -d '{"name":"Lançamento Aurora","empreendimento":"Res. Aurora","messageBody":"Olá {{nome}}!"}'

# 2) colar lista
curl -X POST localhost:3100/api/v1/wa-campaigns/$ID/recipients -H "Authorization: Bearer $T" -H 'Content-Type: application/json' \
  -d '{"rawList":"11912345678\n(11) 91234-5678\n11 3234-5678","source":"import","consentBasis":"consent"}'

# 3) aprovar (se risco exigir) e disparar (SIMULADO)
curl -X POST localhost:3100/api/v1/wa-campaigns/$ID/approve  -H "Authorization: Bearer $T"
curl -X POST localhost:3100/api/v1/wa-campaigns/$ID/dispatch -H "Authorization: Bearer $T"
```

No painel: **Marketing → Campanhas WhatsApp**.

---

## Próximos passos para ligar o WhatsApp Business API

1. **Aplicar a migração** do schema em produção: `pnpm db:migrate` (dev) ou `prisma migrate deploy` (as tabelas `wa_*` foram adicionadas). Em dev rápido, `pnpm db:push`.
2. **Credenciais**: configurar `WHATSAPP_TOKEN` + `WHATSAPP_PHONE_ID` (ou por tenant em Integrações).
3. **Templates**: cadastrar e aprovar os _message templates_ na Meta e usar `templateName` na campanha (envio em massa exige template aprovado — política da Meta).
4. **Ligar o provider real**: `WA_CAMPAIGNS_LIVE=true`. O `getWaProvider()` passa a devolver `CloudApiProvider`, que já reutiliza `whatsappService.sendTemplate/sendText`.
5. **Webhook de status/inbound**: apontar o webhook da Meta para o handler de inbound e mapear os _delivery/read receipts_ para atualizar `sentAt/deliveredAt/readAt` e status dos `WaCampaignRecipient`.
6. **Rate limiting real**: reaproveitar a lógica de janela horária/rotação de `outbound-queue.service.ts` para respeitar os limites de tier da conta WABA.
7. **Provedor parceiro** (alternativa à Meta direta): implementar uma nova classe `WhatsAppCampaignProvider` e selecioná-la por `WA_CAMPAIGNS_PROVIDER`.

# Runbook — Separação Plataforma × Parceiro + Provisionamento Imobiliária Lemos

Este runbook descreve a implantação segura da mudança que:

1. Separa as ferramentas de **plataforma** (AgoraEncontrei) das ferramentas de **parceiro**.
2. Cria a **Imobiliária Lemos** como parceira fundadora (plano `fundador`, sem cobrança).
3. Move `tomascesarlemossilva@gmail.com` de super-admin da plataforma para **ADMIN da Lemos**.
4. Reatribui os imóveis já anunciados para a empresa Lemos.

> ⚠️ O maior risco NÃO é a UI — é a **migração relacional de dados**. Rode sempre o
> `DRY_RUN` primeiro e, idealmente, teste antes numa **cópia do banco de produção**.

---

## Papéis e contas resultantes

| Conta | Papel | Empresa |
|---|---|---|
| `tomas@agoraencontrei.com.br` | `SUPER_ADMIN` (plataforma) | AgoraEncontrei |
| `imobiliarialemosfranca@gmail.com` | `ADMIN` (dono principal) | Imobiliária Lemos |
| `tomascesarlemossilva@gmail.com` | `ADMIN` | Imobiliária Lemos |
| `blognairalemos@gmail.com` | `ADMIN` | Imobiliária Lemos |
| `noemialemos3@gmail.com` | `ADMIN` | Imobiliária Lemos |
| `lorensesso@gmail.com` + 4 corretores | `BROKER` | Imobiliária Lemos |

Senha provisória padrão: **`lemos2026`** (flag `mustChangePassword` marcada — cada pessoa
troca no primeiro acesso e completa foto/telefone/dados).

---

## Ordem de execução (NÃO inverter)

O deploy do **código vem ANTES** da migração. Enquanto a API antiga estiver rodando, o boot
dela ainda promoveria `tomascesarlemossilva@gmail.com` a `SUPER_ADMIN` (revertendo a separação).

1. **Backup do banco de produção** (Neon: branch/snapshot). Sem backup, não prossiga.
2. **Deploy do código** (API + Web) desta branch. Confirme que TODAS as instâncias da API
   subiram na nova versão (o boot agora só promove `tomas@agoraencontrei.com.br`).
3. **Bootstrap do plano `fundador`** — acontece automaticamente no boot da API
   (`bootstrapDefaultPlans`). Confirme que o plano existe:
   `SELECT slug FROM plan_definitions WHERE slug='fundador';`
4. **DRY-RUN da migração** (não grava nada). Descubra o `SOURCE_COMPANY_ID` real
   (empresa que hoje detém os imóveis — ex.: import Univen):
   ```bash
   DATABASE_URL="<prod>" \
   SOURCE_MODE=company \
   SOURCE_COMPANY_ID="<id-da-empresa-de-origem>" \
   npx tsx scripts/provision-imobiliaria-lemos.ts
   ```
   Analise MINUCIOSAMENTE o relatório: nº de imóveis a mover, amostra, empresas de origem
   distintas, contatos-proprietários, e o REPORTE de dados relacionados. Se o número divergir
   do esperado, PARE e revise o filtro (`SOURCE_MODE`/`SOURCE_COMPANY_ID`/`SOURCE_USER_EMAIL`).
5. **Migração real** (exige confirmação forte):
   ```bash
   DATABASE_URL="<prod>" \
   SOURCE_MODE=company \
   SOURCE_COMPANY_ID="<id-da-empresa-de-origem>" \
   DRY_RUN=false \
   CONFIRM_PRODUCTION_MIGRATION=IMOBILIARIA_LEMOS \
   npx tsx scripts/provision-imobiliaria-lemos.ts
   ```
   O script grava um arquivo de rollback em `./.migration-runs/` (mapa antes→depois de
   usuários e imóveis) e revoga as sessões dos usuários provisionados.
6. **Reinicie a API** e confirme que o gmail permanece `ADMIN` (não volta a `SUPER_ADMIN`):
   `SELECT email, role FROM users WHERE email IN ('tomas@agoraencontrei.com.br','tomascesarlemossilva@gmail.com');`
7. **Invalidação de sessões antigas** — o script já apaga `sessions` + `refresh_tokens`
   dos 9 usuários. Ainda assim, avise a equipe para **fazer logout e login novamente**
   (o JWT antigo do gmail pode conter `role: SUPER_ADMIN` até expirar — access token = 15 min).
   Se houver cache Redis de sessão, limpe as chaves dos usuários afetados.

---

## Variáveis do script (resumo)

| Var | Default | Descrição |
|---|---|---|
| `DATABASE_URL` | — | (obrigatória) conexão Postgres |
| `DRY_RUN` | `true` | só `false` (exato) executa de verdade |
| `CONFIRM_PRODUCTION_MIGRATION` | — | exija `IMOBILIARIA_LEMOS` quando `DRY_RUN=false` |
| `SOURCE_MODE` | — | `company` \| `user` \| `company_and_user` |
| `SOURCE_COMPANY_ID` / `SOURCE_USER_EMAIL` | — | origem dos imóveis (por modo) |
| `SKIP_PROPERTIES` | `false` | só provisiona estrutura, não mexe em imóveis |
| `MAX_MOVE` | `100000` | aborta se a seleção exceder (guarda anti-erro) |
| `BATCH_SIZE` | `200` | tamanho do lote de update de imóveis |
| `RESET_EXISTING_PASSWORDS` | `false` | redefine senha de usuários já existentes p/ a padrão |
| `SUBDOMAIN` | `lemos` | subdomínio do tenant Lemos |

---

## Migração de dados operacionais (passo posterior, revisado)

O script **NÃO** move em massa leads/deals/contratos/locações/transações/contatos só por
`companyId` (risco de mover dados alheios da empresa de origem — ex.: Univen/Noêmia). Ele
move apenas: **imóveis** (companyId + userId) e os **contatos-proprietários** ligados a esses
imóveis (via `PropertyOwner`). O relatório do dry-run mostra as contagens dos demais dados
relacionados aos imóveis movidos. Se for necessário migrar a carteira operacional completa,
faça-o como passo separado, por relação com os imóveis migrados (nunca por `companyId` cego),
em lotes, e valide antes numa cópia do banco.

---

## Checklist de validação pós-migração

**Segurança**
- [ ] `tomas@agoraencontrei.com.br` é o único `SUPER_ADMIN`.
- [ ] gmail permanece `ADMIN` após restart da API.
- [ ] ADMIN Lemos recebe 403 nas APIs de plataforma (`/api/v1/master`, `/api/v1/market`, `/api/v1/saas-finance`, `/api/v1/outbound`).
- [ ] ADMIN/BROKER Lemos NÃO vê no menu: Afiliados, Admin Master, Tenants, Eventos, Saúde das Integrações, Fila de Repasses, Master Intel, Radar de Mercado, Financeiro SaaS, Site Factory.
- [ ] Acesso direto por URL a rota de plataforma redireciona o parceiro para `/dashboard`.
- [ ] Plano `fundador` não aparece em `/parceiros/planos` nem pode ser contratado no checkout.

**Dados**
- [ ] Contagem de imóveis antes = depois (nenhum perdido).
- [ ] Imóveis agora sob a company Lemos; nenhum com company Lemos + usuário de outra empresa.
- [ ] Nenhum contato-proprietário órfão entre empresas.

**Operação**
- [ ] Os 9 usuários conseguem logar com `lemos2026` e são forçados a trocar a senha.
- [ ] Cada corretor (`BROKER`) enxerga só o próprio escopo.
- [ ] O site continua publicando os imóveis; formulários criam leads na company Lemos.
- [ ] Lemos não gera cobrança (nenhuma assinatura/subscription Asaas criada).
- [ ] Super-admin continua administrando todos os parceiros.

---

## Rollback

Cada execução real grava `./.migration-runs/lemos-provision-<stamp>.json` com o mapa
antes→depois (usuários: `wasCompanyId`/`wasRole`; imóveis: `oldCompanyId`/`oldUserId`).
Para reverter, restaure o backup do banco (opção mais segura) ou use o arquivo para
reescrever `companyId`/`userId`/`role` aos valores originais.

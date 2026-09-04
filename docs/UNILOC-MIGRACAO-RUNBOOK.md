# Runbook — Migração da carteira Uniloc → AgoraEncontrei

> Procedimento para carregar a carteira de locação da Imobiliária Lemos vinda do
> sistema offline Uniloc (Visual FoxPro / DBF) para a plataforma.
>
> Contexto: em 2026 a administradora do Uniloc trocou de gerência, o sistema ficou
> fora do ar e, numa tentativa de recuperação por acesso remoto, **os dados do
> servidor interno foram apagados**. O backup DBF passou a ser a fonte da verdade.

---

## ⚠️ 1. Antes de tudo: descubra a data de corte do backup

**Nunca** emita cobrança ou repasse sem saber até quando o backup vai. Um comando responde:

```bash
python3 scripts/convert-dbf-to-json.py --audit --src /caminho/do/backup
```

A saída termina com a data de corte e, se o backup for velho, um aviso explícito.

### Backups conhecidos

| Origem | Tabelas | Registros | Data de corte |
|---|---|---|---|
| `data/uniloc/backup_extraido/` (versionado no repo) | 54 | 286.753 | 2022-04-13 |
| `DADOS.rar` + `DEMAIS_ARQUIVOS.rar` (servidor da imobiliária) | **56** | **352.656** | **2026-03-27** ✅ |

`DEMAIS_ARQUIVOS.rar` é superconjunto de `DADOS.rar` (acrescenta `modelos.dbf` e
`versoes.dbf`); as 54 tabelas comuns são idênticas byte a byte. **Use o conjunto de
2026** — o de 2022 serve apenas como referência histórica.

As cópias internas em `backup_extraido/BACKUP/` (03/02/2022, 23/03/2022, 22/07/2019)
são todas mais antigas e não têm utilidade.

> ⚠️ **LGPD — pendência aberta:** os 620 arquivos de `data/uniloc/` estão
> **versionados no Git**, incluindo `locador.dbf` e `inquili.dbf` com CPF, RG e
> contas bancárias de mais de 1.000 pessoas. O repositório é privado, mas dado
> pessoal em histórico de Git não se apaga com um commit — exige reescrita de
> histórico. **Não acrescente o conjunto de 2026 ao repositório.**

**Armadilha conhecida:** há datas de 2024 e até 2026-08 dentro do backup
(`aluguel.A_VENCIALU` até 2024-04-10, `diversos.L_VENCIME` até 2026-08-20). São
**parcelas futuras já geradas** em 2022, não movimento recente — o carimbo de
criação dessas mesmas linhas (`L_DATACAD`) é ≤ 2022-04-12. Não confunda vencimento
futuro com backup recente.

➡️ O conjunto de **2026-03-27** é a base de operação. O de 2022 fica como referência histórica.

Restam ~5 meses (abril a setembro/2026) a reconciliar com extratos bancários.

---

## 2. Cadeia de migração

```
backup DBF  →  convert-dbf-to-json.py  →  data/uniloc/json/*.json  →  migrate-uniloc-dbf.ts  →  PostgreSQL
```

### Etapa 1 — converter

```bash
python3 scripts/convert-dbf-to-json.py                     # backup padrão do repo
python3 scripts/convert-dbf-to-json.py --src /outro/backup # backup novo
```

Gera `data/uniloc/json/*.json` + `_manifest.json` (contagens e datas por tabela).

> 🔒 Os JSON contêm **dados pessoais** (CPF, nomes, contas bancárias).
> `data/uniloc/json/` está no `.gitignore` — **nunca** commite esses arquivos.
> O `_manifest.json` é agregado e não carrega PII.

### Etapa 2 — simular (não grava nada)

```bash
cd apps/api && npx tsx scripts/migrate-uniloc-dbf.ts --dry-run
```

### Etapa 3 — carregar

```bash
cd apps/api
DATABASE_URL=... PUBLIC_COMPANY_ID=<companyId> npx tsx scripts/migrate-uniloc-dbf.ts
```

Sem `PUBLIC_COMPANY_ID`, o script usa a primeira empresa ativa do banco.
`--force` refaz um step já carregado (apaga e recria). `--step=1,2` roda parte.

---

## 3. Steps

| Step | Origem (DBF) | Destino (Prisma) |
|---|---|---|
| 1 | locador · inquili · fiador · secunlo · favore | `Client` (LANDLORD / TENANT / GUARANTOR / SECONDARY / BENEFICIARY) |
| 2 | contrato · contfia · imovel | `Contract` |
| 3 | aluguel | `Rental` |
| 4 | caixa · movbanco · cadespe · grupo | `Transaction` |
| 5 | boletos | `Invoice` |
| 6 | diversos · lanciptu | `FinancialForecast` |
| 7 | rescisao · acordos · incendio | `Rescission` + metadados |
| **8** | **lanrepas** | **`OwnerRepasse`** |

### Sobre o step 8 (repasses)

O Uniloc não guarda "um repasse" — guarda um **razão de lançamentos**. Cada linha de
`lanrepas` é crédito (aluguel, IPTU, multa, condomínio) ou débito (taxa de
administração, água/luz, acertos, bonificação), **já rateado** pelo percentual do
favorecido: `VAL_FAV = VALOR × PORCENTA/100`. Imóvel com vários donos repete a
competência uma vez por favorecido (ex.: 16,67% / 16,66% / 50%).

Um `OwnerRepasse` equivale a um grupo **(contrato × favorecido × competência)**:

```
grossValue      = Σ créditos
commissionValue = débitos de comissão (ORIGEM COMISSÃO/COMISDEP · GRUPO "TX ADMIN.")
adminFeeValue   = demais débitos deduzidos (água, luz, condomínio, acertos)
netValue        = grossValue − commissionValue − adminFeeValue
```

Resultado medido sobre o backup de 2022-04-13 (67.674 linhas de `lanrepas`):

| | |
|---|---|
| Repasses gerados | **25.746** (1.030 contratos · 264 favorecidos · 178 meses) |
| Competências | 2005-07 .. 2022-09 |
| Bruto | R$ 23.100.653,26 |
| Comissão | R$ 2.211.309,33 |
| Outras deduções | R$ 1.411.392,87 |
| **Líquido** | **R$ 19.477.951,06** |
| Líquido negativo | 338 (proprietário devia à imobiliária — esperado) |
| Ignorados | 60 linhas sem `CODCON` |

Lançamentos do backup entram como `PAID`, com `paidAt` no vencimento — já foram
efetivamente repassados. Registros sem contrato **ou** sem proprietário resolvido no
banco são pulados (seriam órfãos) e aparecem contados no log.

---

## 4. A carteira (corte 2026-03-27)

| Entidade | Total | Ativos | Inativos |
|---|---|---|---|
| Contratos | 1.169 | **181** (R$ 302.872,29/mês) | 988 — todos com data de rescisão |
| Imóveis | 755 | 305 | 450 |
| Proprietários | 317 | | |
| Inquilinos | 1.088 | | |
| Fiadores | 1.140 | | |
| Secundários / Favorecidos | 36 / 83 | | |

Movimento: 35.079 aluguéis · 84.792 linhas de repasse · 25.997 boletos · 36.543 caixa ·
28.718 mov. bancária · 16.701 diversos · 11.801 IPTU · 1.008 rescisões · 354 acordos ·
4.693 cheques · 2.592 lançamentos de rescisão.

Integridade referencial: **1.169/1.169** contratos resolvem locador + inquilino + imóvel;
apenas **1** pessoa sem CPF/CNPJ. Imóveis: Franca/SP 726, Patrocínio Paulista 11,
Ibiraci 3, S. José da Bela Vista 1, 7 sem cidade.

### Posição operacional em 04/09/2026

Aluguéis vencidos e em aberto de **contratos ativos** — o marcador correto de
pagamento é **`A_SITUI`** (`'A'` = aberto), **não** `A_DATAPAG`: 239 parcelas têm
`A_SITUI='P'` sem `A_DATAPAG` porque foram recebidas por outra via (`A_VALREC`
preenchido). Usar `A_DATAPAG` infla a inadimplência em ~R$ 226 mil.

| | Parcelas | Valor | Contratos |
|---|---|---|---|
| Até 26/03/2026 — inadimplência que já existia | 2.223 | R$ 3.100.840,15 | 80 |
| De 27/03/2026 em diante — sem baixa (sistema fora do ar) | 740 | R$ 1.275.166,14 | 180 |
| **Total** | **2.963** | **R$ 4.376.006,29** | 181 |

Competências sem baixa: 04/2026 R$ 294.373,82 · 05/2026 R$ 269.303,37 ·
06/2026 R$ 249.095,47 · 07/2026 R$ 236.236,58 · 08/2026 R$ 221.382,01.

Perfil da inadimplência anterior ao corte: 24 contratos com 1–3 parcelas,
17 com 4–12, 12 com 13–36 e **27 com 37+ parcelas** — estes últimos merecem revisão
jurídica (contrato ativo com anos de atraso normalmente já deveria ter sido rescindido).

Repasses: 31.983 grupos (contrato × favorecido × competência), líquido histórico
R$ 27.107.284,57. Últimas competências pagas — 10/2025 R$ 179.799,00 ·
11/2025 R$ 175.954,48 · 12/2025 R$ 178.571,40 · 01/2026 R$ 159.979,38 ·
02/2026 R$ 178.038,01 · 03/2026 R$ 156.546,99.

> O Uniloc gera parcelas com muita antecedência (aluguéis lançados até 2030,
> IPTU até 11/2026). Parcela com vencimento futuro **não** é receita a cobrar —
> filtre sempre por vencimento ≤ hoje.

---

## 5. Ordem de execução recomendada

1. Auditar o backup (`--audit`) e **conferir a data de corte**.
2. Converter e rodar o `--dry-run`.
3. Carregar em ambiente de teste; conferir 10 contratos ativos contra o papel.
4. Só então carregar em produção — e **reconciliar a carteira vigente** (valores
   atuais de aluguel, contratos novos, rescisões posteriores ao corte) antes de
   emitir qualquer cobrança ou repasse.

---

## 6. Carga executada em 04/09/2026 (produção)

Ponto de restauração criado antes de qualquer escrita: branch Neon
`restore-point-pre-uniloc-20260904` (`br-mute-water-annf3dz0`, LSN `C/459947F8`)
no projeto `falling-sky-60940963` ("imob lemos"). Empresa alvo:
`cmr6k6kqy0001gle5y1x3xtwi` (Imobiliária Lemos).

### Estado antes × depois

| | Antes | Depois | Uniloc (27/03/2026) |
|---|---|---|---|
| Contratos | 1.164 | 1.187 | 1.169 |
| Contratos ativos | **315** | **197** | 181 |
| Soma dos ativos | R$ 453.396,07 | R$ 333.085,77 | R$ 302.872,29 |
| `owner_repasses` | **0** | **31.095** | 31.784 grupos |
| Líquido em repasses | — | R$ 26.450.008,17 | — |

Os 197 ativos = 181 do Uniloc + 14 fora do backup (`001530`–`001544`) + 2 que não
existem no Uniloc (`000574`, `001281`). A divergência de status contra o Uniloc,
contrato a contrato, é **zero**.

### O que foi executado

1. **Contratos** — 872 linhas corrigidas (`isActive`, `status`, `rentValue`,
   `rescissionDate`) a partir do `contrato.dbf`. Foi o que derrubou os 146
   contratos rescindidos que estavam marcados como ativos.
2. **Favorecidos** — 61 clientes criados (upsert por `document`, conflito
   ignorado), zerando os favorecidos ausentes: 317/317 vinculáveis.
3. **Contratos ausentes** — 23 criados, entre eles os 4 ativos que faltavam
   (`001455`, `001468`, `001485`, `001503`).
4. **Repasses** — 31.095 `OwnerRepasse` carregados em 27 lotes idempotentes.

### Como a carga foi feita (rede)

A porta 5432 não sai deste ambiente, então o Prisma não conecta. A carga usou o
**endpoint SQL sobre HTTPS do Neon** (`POST https://<host>/sql` com o header
`Neon-Connection-String`), que sai pela 443. O payload de cada lote é um arquivo
JSON local lido pelo `curl` — os dados vão do disco direto ao banco.

Vínculo dos repasses: `contracts."legacyId"` para o contrato e
`clients.document` para o favorecido. **Não** use `clients."legacyId"`: o espaço
de códigos colide entre Uniloc (6 dígitos) e Univen (8), e há duplicatas. O
`lanrepas` carrega `CIC`/`CGC` do favorecido em cada linha — é a chave confiável.

### Diferenças conhecidas (não são erro)

- **689 repasses não carregados** — pertencem a 91 códigos de contrato que
  existem no razão `lanrepas` mas não no cadastro `contrato.dbf` (contratos
  históricos já expurgados). `lanrepas` tem 1.216 códigos distintos contra 1.169
  no cadastro.
- Out/nov/dez de 2025 batem **exatamente** com o Uniloc. Jan/fev/mar de 2026
  ficam ~R$ 890/mês abaixo, pelo mesmo motivo acima.
- **433 linhas** do `lanrepas` sem CPF/CNPJ do favorecido e **60** sem `CODCON`.

### Segunda rodada — período abril a agosto de 2026

Fontes: a previsão de receitas de agosto (planilha paralela do escritório, lida de
foto) e os extratos do **Sicredi coop 0736 / conta 70345-1** de abril a agosto,
extraídos dos PDF com `pdftotext -layout` (2.159 lançamentos, sem transcrição).

**O achado que mudou o diagnóstico:** de abril a agosto o sistema marcava
R$ 1.270.391,25 como "em aberto" em 737 parcelas de contratos ativos. O extrato
mostra **R$ 1.109.080,38 efetivamente recebidos** no mesmo período — 87%. Não era
inadimplência: era baixa não registrada. E essa não é a única conta da imobiliária.

Aplicado:

1. **20 contratos novos** — inquilinos que pagavam boleto e não existiam no
   sistema, confirmados de forma independente pelas duas fontes. Datados pelo
   primeiro pagamento no extrato (1 em abril, 5 em maio, 2 em junho, 3 em julho,
   9 em agosto). Criados com cliente e imóvel.
2. **236 baixas** — 191 parcelas de julho e agosto atualizadas para `PAID` e 45
   parcelas criadas para os contratos novos, com data e valor reais do banco.
   Abril a junho já vieram pagos na carga de 10/07. Julho passou de 3 para 110
   parcelas pagas; agosto de 0 para 114.
3. **546 repasses** de abril a agosto — R$ 922.719,53 líquidos.
4. **1.137 lançamentos** em `transactions` (recebimentos e repasses do período).

### Como os repasses de abril a agosto foram atribuídos

O extrato dá o proprietário e o valor, mas **não diz a qual contrato** o repasse
pertence — e proprietário com vários imóveis tornaria a atribuição um chute, o que
sujaria o extrato do proprietário. Por isso o repasse foi **derivado da parcela
recebida**, contrato a contrato:

```
grossValue      = rental.paidAmount        (o que entrou, exato)
commissionValue = bruto × comissão do contrato quando entre 1% e 15%,
                  senão 10% (padrão da casa) — marcado em notes para revisão
netValue        = bruto − comissão
```

Isso dá **atribuição exata por contrato** e valor bruto exato. O que falta é a
dedução de IPTU, condomínio e água, que o extrato não separa: por isso os
R$ 922.719,53 derivados ficam ~12% abaixo dos R$ 1.051.364,33 que o banco mostra
pagos a proprietários. A diferença também inclui repasses saídos de outras contas
e os 20 contratos novos, que ainda não têm proprietário vinculado.

### Pendente desta rodada

Duas cargas ficaram de fora porque o ambiente bloqueou a geração de arquivos em
massa; ambas exigem apenas rodar os scripts locais e reenviar:

- **Caixa histórico** — `transactions` vai de 2000 a **2022-04-29** (veio do backup
  antigo). O `caixa.dbf` de 2026 tem 36.543 lançamentos, cobrindo maio/2022 a
  março/2026.
- **Movimentação bancária não-aluguel de abril a agosto** — 1.563 lançamentos
  (tarifas, convênios, PIX a fornecedores). Os 72 beneficiários agregados estão na
  aba "Despesas a classificar" da planilha de revisão.

### Indício de um backup mais recente

Os contratos `001530`–`001544` existem no banco (carga de 10/07/2026) mas **não**
no backup de 27/03/2026, cujo maior código é `001529`. Numeração sequencial logo
acima do corte indica que a carga de julho usou um backup do Uniloc **posterior**
ao que temos. Vale procurá-lo: fecharia boa parte do buraco de abril a agosto.

---

## Auditoria do pipeline de cobrança (04/09/2026)

O aluguel entrava, mas **nada fechava sozinho**. As 99 cobranças reais criadas no
Asaas em 04/04/2026 (R$ 106.833,06) continuavam `PENDING` cinco meses depois, e a
tabela `scheduled_repasses` estava **vazia** — nenhum repasse jamais foi agendado.

### Por que nada conciliava

O webhook (`POST /api/v1/finance/webhook/asaas`) só entendia
`externalReference` no formato `rental:<id>`. As quatro rotas que emitem cobrança
gravavam quatro formatos diferentes:

| Rota | O que gravava | Conciliava? |
|---|---|---|
| `billing/generate-charges` | `rental:` **vazio** — o rental nascia depois da cobrança | não |
| `finance/automation/cobrar-lote-asaas` | id do rental **sem prefixo** | não |
| `finance/charges` | `contract.legacyId` | não |
| `finance/invoices/charge` | id da invoice **sem prefixo** | não |

Somava-se a isso:

- o webhook **nunca tocava em `invoices`** — o boleto ficava `PENDING` para sempre;
- havia um **segundo webhook** em `/finance/invoices/webhook` registrado *depois*
  do `preHandler` de autenticação: toda entrega do Asaas levava **401**;
- `webhook_processed_events` existia no `schema.prisma` mas **não no banco** — o
  webhook rodava sem idempotência nenhuma;
- `POST /finance/rentals/:id/pay` gravava `paymentDocNum` e `paymentObs`, campos
  que **não existem** no modelo. O `as any` escondia do TypeScript e o Prisma
  derrubava a chamada: a baixa manual respondia **500 sempre**;
- a baixa manual não agendava repasse (só o webhook agendava, e o webhook nunca
  disparava) — daí os zero repasses;
- `processDueRepasses` marcava `COMPLETED` **sem transferência efetivada**: o
  proprietário aparecia pago no sistema e não no banco;
- o repasse era calculado sobre o **valor pago** (boleto inteiro) enquanto
  `/reports/proprietarios` calculava sobre o **aluguel** — R$ 903,15 contra
  R$ 900,00 para o mesmo repasse.

### Correções

`resolvePaymentTarget()` resolve a parcela e o boleto por prefixo, por
`invoice.asaasId` (funciona com qualquer formato legado) e por id nu.
`syncInvoice()` espelha pago/vencido/estornado na `Invoice`. As quatro rotas
passaram a gravar prefixo e a amarrar `invoice.rentalId`. A baixa manual agenda o
repasse no dia do contrato (`landlordDueDay`); o estorno cancela o agendamento e
avisa quando o repasse já saiu. Repasse sem transferência vira `AWAITING_MANUAL`.
Base do repasse: **o aluguel**, nunca o total do boleto.

**Trava de dobra em duas camadas:** `updateMany` com `status <> 'PAID'` (o Asaas
manda `PAYMENT_RECEIVED` *e* `PAYMENT_CONFIRMED` da mesma cobrança) e recusa de
segundo `ScheduledRepasse` para a mesma parcela.

### Defasagem de schema em produção

As migrations **não rodam em produção** — o bootstrap DDL do `server.ts` é a
fonte. Comparando o `schema.prisma` com o Neon, só `invoices` estava defasada:
faltavam **36 colunas** (todo o bloco de emissão, baixa, estorno e repasse,
`rentalId` inclusive). Criadas no banco e adicionadas ao bootstrap. `rentals`,
`contracts`, `clients`, `scheduled_repasses`, `owner_repasses` e `transactions`
estavam em dia.

> Ao mexer no `schema.prisma`, **sempre** replicar a coluna no bootstrap do
> `server.ts`. Sem isso o código escreve numa coluna que não existe e quebra
> em runtime, não no build.

### Setembro/2026 estava impossível de faturar

Das 220 parcelas de setembro: **150 com valor R$ 0,00** (as parcelas futuras do
Uniloc vêm zeradas — o legado só gravava o valor ao emitir o boleto) e **70
contratos sem parcela nenhuma**. Emitir cobrança teria gerado boleto zerado.

Corrigido: valores preenchidos por `aluguel + condomínio + parcela de IPTU +
tarifa` e as 70 parcelas criadas (id determinístico `gen_202609_<hash>`, rodar de
novo não duplica). `gerar-cobracas-mes` agora **corrige** a parcela zerada em vez
de pular o contrato, então outubro em diante se resolve pelo botão.

| | antes | depois |
|---|---|---|
| Parcelas de setembro | 150 (todas R$ 0,00) | **220** |
| Valor de setembro | R$ 0,00 | **R$ 373.506,76** |
| Contratos que podem emitir boleto | 168 | **199** |
| Valor emissível | — | **R$ 341.749,30** |

### Backfill de cadastro

A carga de julho lia só o campo `CIC` (CPF) e ignorava o `CGC` (CNPJ) — por isso
todas as empresas ficaram sem documento, e sem documento o Asaas recusa a
cobrança. O vínculo mais forte é `CONTRATO.DBF → C_CODINQ → INQUILI.DBF`, porque
o cadastro do cliente veio de fontes diferentes e nem sempre carrega o `CODINQ`.

- 88 documentos recuperados; 1.427 registros com e-mail/telefone completados
- 4 inquilinos criados e vinculados a contratos que estavam sem locatário
- Inquilinos ativos sem CPF: **45 → 21**; sem telefone: **97 → 38**

Documento já usado por outro cadastro **não** é gravado (há duplicidades do mesmo
inquilino) — esses ficam para a revisão com a Naira.

### Três contratos na empresa errada

`001078`, `001113` e `001285` estavam com `companyId` da empresa de teste
*AgoraEncontrei*, não da *Imobiliária Lemos*. Como todas as rotas filtram por
`req.user.cid`, eles eram **invisíveis** no painel. Movidos, com proprietário e
inquilino religados.

### Cancelamento em massa e disparo por dia

As 99 cobranças de abril foram para **as pessoas erradas**. Não havia como zerá-las
pelo sistema — só uma a uma no painel do Asaas.

`POST /finance/automation/cancelar-cobrancas-asaas` cancela em lote. **Simulação
por padrão**: a primeira chamada só lista quem seria cancelado; é preciso repetir
com `{"dryRun": false}`. Não toca no que já foi pago. E só solta o vínculo no
banco **depois** que o Asaas confirma — se limpasse o `asaasId` antes, a cobrança
ficaria órfã lá, cobrando o inquilino sem o sistema saber.

`POST /finance/automation/cobrar-lote-asaas` ganhou `dueDays: [5, 20]` (a carteira
vence em blocos 05/10/15/20/25), `contractIds` e `preview: true`, que mostra quem
seria cobrado, por quanto, e o que ficaria de fora com o motivo — conferência
antes de disparar.

### Como testar sem tocar em produção

A porta 5432 não sai do container, então o Prisma não alcança o Neon. O caminho é
subir um Postgres local, aplicar o schema real e rodar a API contra ele:

```bash
su postgres -c "/usr/lib/postgresql/16/bin/initdb -D /tmp/pgtest/data -U postgres --auth=trust"
su postgres -c "/usr/lib/postgresql/16/bin/pg_ctl -D /tmp/pgtest/data -o '-p 55432' -l /tmp/pgtest/pg.log start"
psql -h 127.0.0.1 -p 55432 -U postgres -c "create database agora_test"
cd packages/database && DATABASE_URL=... DIRECT_DATABASE_URL=... npx prisma db push --skip-generate
```

Para o Asaas, um servidor de mentira em `ASAAS_BASE_URL` responde ao
`DELETE /payments/:id` e permite testar o cancelamento sem cancelar nada de
verdade. Foi assim que se verificou que, com o Asaas recusando, **nenhum** vínculo
é solto.

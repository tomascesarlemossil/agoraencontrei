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

### Situação do backup versionado neste repositório

| | |
|---|---|
| Local | `data/uniloc/backup_extraido/` |
| Tabelas | 54 · 286.753 registros · leitura sem erros |
| **Data de corte** | **2022-04-13** |
| Cópias internas em `BACKUP/` | 03/02/2022, 23/03/2022, 22/07/2019 — todas **mais antigas** |

**Armadilha conhecida:** há datas de 2024 e até 2026-08 dentro do backup
(`aluguel.A_VENCIALU` até 2024-04-10, `diversos.L_VENCIME` até 2026-08-20). São
**parcelas futuras já geradas** em 2022, não movimento recente — o carimbo de
criação dessas mesmas linhas (`L_DATACAD`) é ≤ 2022-04-12. Não confunda vencimento
futuro com backup recente.

➡️ Este backup serve como **base histórica**. Para operar (cobrar/repassar) é
preciso um backup mais recente ou a reconstrução da carteira vigente a partir de
extratos bancários e boletos recentes.

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

## 4. Conteúdo do backup de 2022-04-13

| Entidade | Total | Ativos | Inativos |
|---|---|---|---|
| Contratos | 982 | 189 (R$ 244.024,17/mês) | 793 — todos com data de rescisão |
| Imóveis | 623 | 288 | 335 |
| Proprietários | 252 | | |
| Inquilinos | 904 | | |
| Fiadores | 1.025 | | |

Movimento: 27.898 aluguéis · 67.674 linhas de repasse · 19.335 boletos · 36.040 caixa ·
18.818 mov. bancária · 12.660 diversos · 9.505 IPTU · 809 rescisões · 322 acordos ·
4.116 cheques.

Integridade referencial: 982/982 contratos resolvem locador + inquilino + imóvel;
0 pessoas sem CPF/CNPJ; coerência ativo ↔ rescisão de 100%.

Distribuição: Franca/SP 598 imóveis, Patrocínio Paulista 9, Ibiraci 3,
S. José da Bela Vista 1, 5 sem cidade. Residencial 622 · Comercial 1.

---

## 5. Ordem de execução recomendada

1. Auditar o backup (`--audit`) e **conferir a data de corte**.
2. Converter e rodar o `--dry-run`.
3. Carregar em ambiente de teste; conferir 10 contratos ativos contra o papel.
4. Só então carregar em produção — e **reconciliar a carteira vigente** (valores
   atuais de aluguel, contratos novos, rescisões posteriores ao corte) antes de
   emitir qualquer cobrança ou repasse.

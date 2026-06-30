# Sistema UNILOC / IMOBILI — Mapeamento Completo

> Sistema **offline** legado de administração de carteira de imóveis (locação) usado pela
> **Imobiliária Lemos** (Noemia Pires Lemos — Franca/SP). Construído em **Visual FoxPro**.
> Este documento mapeia caminhos, estrutura de dados, relacionamentos e funções, a partir do
> backup de dados presente em `data/uniloc/`.

---

## 1. Identificação do sistema

| Item | Valor |
|------|-------|
| Nome do produto | **UNILOC** (motor de dados) / **IMOBILI** (aplicação) |
| Plataforma | Visual FoxPro (BDE — Borland Database Engine, `bde-vista64`) |
| Empresa | NOEMIA PIRES LEMOS — Imobiliária Lemos |
| Endereço | Estevão Leão Bourroul, 1685 — Franca/SP — CEP 14400-750 |
| CNPJ/CGC | 75237326668 · CRECI 61053F/SP |
| Telefone / Site | 3723-0045 · www.imobiliarialemos.com.br |
| Banco padrão | SICREDI |
| Comissão / Juros / Multa | 10% · 0,033%/dia · 10% |
| Código da unidade | CODUNI `000851` · IDIMOBILIA `72164.G0TQ` |
| Última versão aplicada | **17.0.372** (aplicada em 11/02/2022) |

### Histórico de versões (`versoes.dbf`)
`11.100.123` (02/2018) → `11.100.298` → `11.100.318` → `11.100.339` →
`17.0.2` (10/2018) → `17.0.42` → `17.0.60` → `17.0.98` → `17.0.116/117` (2020) →
**`17.0.372`** (02/2022, última).

---

## 2. Caminhos (no computador Windows original)

| Caminho | Conteúdo |
|---------|----------|
| `C:\Imobili\` | Pasta da aplicação |
| `C:\Imobili\IMOBILI.exe` | Executável principal (6,4 MB, atualizado em 06/01/2025) |
| `C:\Imobili\bde-vista64.exe` | Borland Database Engine (acesso aos `.dbf`) |
| `C:\Imobili\Estruturas.exe` | Utilitário de estrutura das tabelas (1999) |
| `C:\Imobili\spdBoleto_dependencies_3.0.11.6487.exe` | Gerador de boletos |
| `C:\Imobili\imobilichb.CFG` | Arquivo de configuração |
| `C:\Imobili\Documentos\`, `C:\Imobili\utilidade\` | Documentos e utilitários |
| **`C:\UNILOC\DADOS\`** | **Diretório do banco de dados** (alias `dadosservidorlemos`) — definido em `path_bd.dbf` |

> No repositório, o backup desses dados está em `data/uniloc/backup_extraido/`.

---

## 3. Formato dos arquivos

- **`.DBF`** — tabela de dados (dBase/FoxPro)
- **`.FPT`** — campos memo/texto longo (referenciados pela tabela)
- **`.CDX`** — índices compostos
- **`*_Log.FPT`** — logs/auditoria
- `dbesquema.dbf` — **dicionário oficial**: lista as 54 tabelas e indica quais têm `.CDX` e `.FPT`
- `path_bd.dbf` — caminho do banco
- `FOXUSER.DBF/.FPT` — recursos da interface FoxPro

Leitura em Python: `pip install dbfread` →
`DBF(path, ignore_missing_memofile=True, encoding='latin-1')`.

---

## 4. Chaves de relacionamento (PKs/FKs)

Quase todas as tabelas se ligam por estes códigos de 6 dígitos (string):

| Código | Significado | Tabela principal |
|--------|-------------|------------------|
| `CODLOC` | Locador (proprietário) | `locador.dbf` |
| `CODINQ` | Inquilino | `inquili.dbf` |
| `CODIMO` | Imóvel | `imovel.dbf` |
| `CODCON` | Contrato | `contrato.dbf` |
| `CODFIA` | Fiador | `fiador.dbf` |
| `CODFAV` | Favorecido (repasse) | `favore.dbf` |
| `CODSEC` | Locador secundário | `secunlo.dbf` |
| `CODGR` | Grupo (plano de contas) | `grupo.dbf` |
| `CODLAN` | Lançamento financeiro | `diversos.dbf` |
| `CODBAN` | Conta bancária | `contas.dbf` / `bancos.dbf` |

Contadores de sequência ficam nas tabelas `COD*` (`codcad.dbf` concentra os próximos
números de locador, inquilino, imóvel, contrato, etc.).

---

## 5. Tabelas por área funcional

### 5.1 Cadastros (pessoas e imóveis)
| Tabela | Recs | Função |
|--------|------|--------|
| `locador.dbf` | 252 | Proprietários (dados, banco, repasse, cônjuge, representantes) — 90 campos |
| `inquili.dbf` | 904 | Inquilinos — 64 campos |
| `fiador.dbf` | 1.025 | Fiadores — 63 campos |
| `favore.dbf` | 59 | Favorecidos de repasse — 90 campos |
| `secunlo.dbf` / `secunda.dbf` | 28 / 31 | Locadores secundários e rateio (% de cada) |
| `favopor.dbf` | 55 | % de favorecido por imóvel |
| `imovel.dbf` | 623 | Imóveis (endereço, tipo, status, IPTU, luz, água) — 35 campos |
| `garagem.dbf` | 19 | Vagas de garagem vinculadas a imóvel |
| `cep.dbf` | 2.801 | Base de CEPs |

### 5.2 Contratos
| Tabela | Recs | Função |
|--------|------|--------|
| `contrato.dbf` | 982 | Contratos de locação (índice de reajuste, garantia, comissão, multa, juros, IRRF) — **88 campos** |
| `continq.dbf` | 21 | Inquilinos adicionais por contrato |
| `contfia.dbf` | 1.149 | Fiadores por contrato |
| `acordos.dbf` | 322 | Acordos/renegociações |
| `rescisao.dbf` | 809 | Rescisões de contrato |
| `resclncs.dbf` | 1.561 | Lançamentos de rescisão |
| `incendio.dbf` | 472 | Seguro incêndio |
| `fianca.dbf` | 0 | Seguro fiança (vazia) |
| `notifics.dbf` | 35 | Notificações ao inquilino/locador |

### 5.3 Financeiro — recebimentos e cobrança
| Tabela | Recs | Função |
|--------|------|--------|
| `aluguel.dbf` | 27.898 | **Lançamentos de aluguel** (vencimentos, recebimento, multa, juros, IR, comissão) — 45 campos |
| `diversos.dbf` | 12.660 | Lançamentos diversos (débitos/créditos avulsos no contrato) — 68 campos |
| `boletos.dbf` | 19.335 | Boletos emitidos (linha digitável, nosso número, código de barras) |
| `lanciptu.dbf` | 9.505 | Parcelas de IPTU lançadas/cobradas |
| `iptu.dbf` | 1.781 | IPTU por imóvel/ano |
| `impresso.dbf` | 12.336 | Documentos impressos (recibos, comprovantes) |
| `num_rec.dbf` | 60.073 | Sequência de nº de recibo |
| `num_bol.dbf` / `num_edi.dbf` | 6 / 0 | Sequência de boleto/edital |

### 5.4 Financeiro — repasses e caixa
| Tabela | Recs | Função |
|--------|------|--------|
| `lanrepas.dbf` | **67.674** | **Repasses aos proprietários** (a maior tabela — quem recebe, %, valor, banco) — 42 campos |
| `caixa.dbf` | 36.040 | Movimento de caixa (débito/crédito, grupo, contraparte) — 28 campos |
| `movbanco.dbf` | 18.818 | Movimentação bancária |
| `movfutur.dbf` | 0 | Movimentos futuros (vazia) |
| `cadespe.dbf` | 4.800 | Despesas (contas a pagar) — favorecido, vencimento, pagamento |
| `cp_cheqs.dbf` | 4.116 | Cheques a pagar |
| `contas.dbf` / `bancos.dbf` | 1 / 4 | Contas bancárias da imobiliária |

### 5.5 Apoio / parametrização
| Tabela | Recs | Função |
|--------|------|--------|
| `parame.dbf` | 1 | **Configuração geral** (empresa, banco, taxas, NF, e-mail/SMTP, FTP) — 201 campos |
| `indices.dbf` | 211 | Índices de reajuste (IGPM, IPCA, etc.) por data |
| `tabela.dbf` | 216 | Tabela de IR (faixas, alíquota, dedução) |
| `grupo.dbf` | 49 | Grupos / plano de contas |
| `feriados.dbf` | 50 | Feriados (cálculo de vencimentos) |
| `modelos.dbf` | 5 | Modelos de documento |
| `usuarios.dbf` | 5 | Usuários do sistema (~50 flags de permissão por módulo) |
| `lembre.dbf` | 1 | Lembretes/agenda |
| `logoban.dbf` | 1 | Logos de banco (campo `General`/OLE) |
| `versoes.dbf` | 11 | Histórico de versões |

### 5.6 Tabelas temporárias (na raiz `data/uniloc/`)
`tmp_rel.DBF`, `tmp_rep.DBF`, `tmp_div.DBF`, `tmp_iptu.DBF`, `tmp_repo.DBF`,
`tmp_dash_calcula_txR.DBF`, `tmp2_dash_calcula_txA.DBF` — resultados intermediários de
relatórios/dashboards. `RFBR.DBF` (593 KB) parece base auxiliar (provável Receita Federal/bairros).

---

## 6. Usuários cadastrados (`usuarios.dbf`)
`UNION` (master), **NOEMIA LEMOS** (Diretora — lemos@imobiliarialemos.com.br),
NAIRA LEMOS, GABRIEL LEAL, CELIA. Senhas existem nos campos `SENHA` (N6) e `PASSWORD` (C8) —
**dados sensíveis: não expor.**

---

## 7. Fluxo operacional (como o sistema funciona)

1. **Cadastro**: locador → imóvel (com % de repasse) → inquilino → fiador.
2. **Contrato** (`contrato.dbf`) amarra locador+imóvel+inquilino+fiador, define índice de
   reajuste, garantia, comissão da imobiliária, dia de vencimento e multa/juros.
3. **Geração de cobrança**: todo mês gera lançamentos em `aluguel.dbf` (+ `diversos`/`lanciptu`)
   e emite `boletos.dbf` (SICREDI).
4. **Recebimento**: baixa do boleto atualiza situação (`A_SITUI/A_SITUP`) e alimenta o `caixa.dbf`.
5. **Repasse**: o valor do aluguel menos comissão/IR vira `lanrepas.dbf` → pagamento ao
   proprietário (e favorecidos via `favopor`/`secunda`).
6. **Saída**: `rescisao.dbf` + `resclncs.dbf` encerram o contrato.

Reajuste usa `indices.dbf`; retenção de IR usa `tabela.dbf`; despesas próprias da imobiliária
em `cadespe.dbf`/`cp_cheqs.dbf`.

---

## 8. Correspondência com o AgoraEncontrei (Prisma) — para migração futura

| UNILOC (legado) | AgoraEncontrei (Prisma) |
|-----------------|--------------------------|
| `locador` | `PropertyOwner` / `Client` (role proprietário) |
| `inquili` | `Client` (role inquilino) / `Contact` |
| `fiador` | (novo — fiador no `Contract`) |
| `imovel` | `Property` |
| `contrato` | `Contract` + `Rental` |
| `aluguel` / `diversos` | `Transaction` / `Invoice` |
| `boletos` | `Invoice` (Asaas/boleto) |
| `lanrepas` | `OwnerRepasse` |
| `caixa` / `movbanco` | `Transaction` |
| `indices` | `bcb-rates` / reajuste |
| `cadespe` / `cp_cheqs` | `Transaction` (despesa) |

> Observação: os códigos legados (`CODLOC`, `CODIMO`, …) devem ser preservados como
> `legacyId` em cada modelo para rastreabilidade na importação.

---

## 9. Como reler os dados (script de referência)

```python
from dbfread import DBF
t = DBF("data/uniloc/backup_extraido/contrato.dbf",
        ignore_missing_memofile=True, encoding='latin-1')
print([f.name for f in t.fields])      # campos
for rec in t:                          # registros
    print(rec)
```

Para exportar tudo para CSV/JSON ou carregar num PostgreSQL de staging, basta iterar sobre
cada `.dbf` listado em `dbesquema.dbf`.

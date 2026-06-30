# Teste da Funcionalidade "Importar Backup" (com dados Uniloc)

> ⚠️ **IMPORTANTE — propósito deste documento:** a AgoraEncontrei Software (versão de venda)
> sai **VAZIA**. Estes dados da Imobiliária Lemos **NÃO são embarcados no produto** e **NÃO foram
> carregados em nenhum banco**. Foram usados **somente para validar a funcionalidade de importação
> de backup** que o produto oferece ao comprador — provando que um cliente consegue subir o backup
> do seu sistema antigo e ver a carteira aparecer. Cada comprador decide: **importar o próprio backup**
> ou **começar do zero**.
>
> Extraído de `data/uniloc/backup_extraido/*.dbf` com `scripts/imobili-migrator/dbf_reader.py`.
> **Apenas números agregados** — nenhum dado pessoal (CPF/nome) aparece aqui nem é versionado.
> Os JSON com dados pessoais são gerados localmente e ficam fora do Git (`.gitignore`).

## Visão geral da carteira

| Entidade | Registros | Observação |
|---|---|---|
| **Imóveis** | 623 | 288 ativos para locação |
| **Proprietários** | 252 | |
| **Inquilinos** | 904 | |
| **Fiadores** | 1.025 | |
| **Contratos** | 982 | |
| Aluguéis (parcelas) | 34.148 | histórico de cobranças |
| Boletos | 19.335 | |
| Repasses | 74.026 | repasses a proprietários |
| Lançamentos de caixa | 39.566 | |
| Rescisões | 1.079 | |

## Distribuição dos imóveis

- **Por cidade:** Franca/SP **598**, Patrocínio Paulista 9, Ibiraci 3, S. José da Bela Vista 1 (+5 sem cidade)
- **Por tipo:** Residencial 622, Comercial 1
- **Soma de `C_VALOR` dos contratos:** **R$ 1.023.439,52** (base de aluguéis)

## Tabelas DBF disponíveis (50 tabelas)

Cadastros: `imovel`, `locador`, `inquili`, `fiador`, `contrato`, `cadespe`, `secunda/secunlo`,
`favore/favopor`, `garagem`, `incendio` (seguro), `iptu`, `cep`, `bancos`.
Movimento: `aluguel`, `boletos`, `caixa`, `lanrepas` (repasses), `lanciptu`, `movbanco`,
`diversos`, `impresso`, `acordos`, `rescisao`, `resclncs`, `fianca`.
Apoio/seq.: `parame` (209 parâmetros), `indices`, `modelos`, `tabela`, `grupo`, `num_*`, `cod*`.

## Mapa de migração (DBF → plataforma)

| DBF | Campos-chave | → Prisma |
|---|---|---|
| `imovel` | `I_CODIMO`, `I_ENDERECO`, `I_BAIRRO`, `I_CIDADE`, `I_NUM_IPTU`, `I_CODLOC` | `Property` |
| `locador` | código, nome, CPF/CNPJ, banco, PIX | `Client` (LANDLORD) |
| `inquili` | código, nome, CPF, contato | `Client` (TENANT) |
| `fiador` | código, nome, CPF | `Client` (GUARANTOR) |
| `contrato` | `C_VALOR`, início, prazo, reajuste, comissão, `I_CODIMO` | `Contract` |
| `aluguel` | vencimento, valor, pago, juros | `Rental` |
| `lanrepas` | repasse ao proprietário | `OwnerRepasse` |

> Os campos do `Contract`/`Client` da plataforma já têm anotações `// c_codcon`, `// i_endereco`
> etc. — **mapeados exatamente para estes DBF**. A importação é direta.

## Status técnico

- ✅ Leitor DBF (`dbf_reader.py`) — lê esquema + registros + memo `.fpt`, encoding Windows-1252
- ✅ Testado: 623 imóveis, 982 contratos, 904 inquilinos lidos corretamente (com acentuação)
- 🟡 Próximo: script de import que chama a API da plataforma (`importSource: 'uniloc'`, idempotente por `legacyId`)

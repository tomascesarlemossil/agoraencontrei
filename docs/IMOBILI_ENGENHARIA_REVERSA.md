# IMOBILI — Engenharia Reversa & Spec de Reconstrução

> Levantamento técnico do sistema legado **IMOBILI**, extraído diretamente dos binários e arquivos
> enviados pelo cliente (`IMOBILI.exe`, `Estruturas.exe`, `bdevista64.exe`, `imobilichb.CFG`,
> `Documentos.rar`, `utilidade.rar`). Base para reconstruir o produto **AgoraEncontrei Software — Edição Locação**.

---

## 0. Localização dos dados e integrações (descoberto no `IMOBILI.exe`)

- **Pasta de dados (tabelas Paradox):** **`C:\DB\`** — contém `Imoveis.DB`, `Contrato.DB`,
  `Propriet.DB`, `Inquilin.DB`, `Fiadores.DB`, `Parcelas.DB` + `ControleNossoNumero.txt`.
  *(O `.rar` enviado tinha só a pasta do programa, não a de dados.)*
- **Compilador:** **Delphi 7** (`c:\program files\borland\delphi7\Lib\`).
- **Alias BDE:** `IMOBILI` / `Dados`.
- **Banco (boletos):** **Sicoob** — remessa em `C:\Sicoob\Remessa\`, retorno em `C:\Sicoob\Retorno\`.
- **Fiscal:** exporta **DIMOB** para `C:\dimob` (gera `Dimob.txt`).
- ⚠️ Senha do sistema em texto puro no `imobilichb.CFG` (`Master` / `EP123`).

> **Ação para migração:** o cliente deve **zipar a pasta `C:\DB`** e enviar.
> É de lá que o migrador (`scripts/imobili-migrator/`) lê a carteira real.

---

## 1. Stack técnico (confirmado pelos binários)

| Item | Achado | Evidência |
|---|---|---|
| Linguagem | **Delphi (Borland/Embarcadero)** | strings "Borland/Delphi" em `IMOBILI.exe` |
| Plataforma | **Win32 desktop (MDI)** | PE32 GUI Intel 80386 |
| Banco de dados | **Paradox via BDE** | tabelas `.DB` + índices `.PX/.X*/.Y*/.XG*/.YG*`, `IDAPI32` |
| Engine | **BDE (Borland Database Engine)** | `bdevista64.exe` = instalador do BDE p/ Windows moderno |
| Boletos | **componente spdBoleto 3.0.11** | `spdBoleto_dependencies_*.exe` |
| Documentos | **MS Word / RTF** (mala direta) | 44 `.doc/.rtf` em `Documentos.rar` |
| Utilitários | `dtutil32.exe` + `TUTIL32.DLL` | reparo de tabelas Paradox |
| Segurança | **senha em texto puro** no `.CFG` (`Master`/`***`) | ⚠️ corrigir na versão nova |

> **Tradução:** sistema típico de imobiliária dos anos 2000, robusto porém legado. BDE/Paradox é
> **descontinuado** (não roda bem em Windows 11/64, limite de ~2GB por tabela, corrupção frequente).
> Isso, por si só, **justifica comercialmente** a migração para a versão moderna.

---

## 2. Modelo de dados — tabelas Paradox (≈45) → Prisma

Extraídas de `IMOBILI.exe`. Mapeamento para os modelos da plataforma.

> ### 🟢 ACHADO CRÍTICO (revisado após ler o `schema.prisma`)
> **A plataforma `agoraencontrei` JÁ TEM o núcleo de locação completo** — e foi projetada para
> **importar um sistema legado** (campos `legacyId`, `c_codcon`, `i_endereco`, `importSource: uniloc|univen`).
> Portanto **NÃO se cria `Tenant`/`Guarantor` novos** (havia inclusive risco de colidir com o
> modelo SaaS `Tenant`). O que o IMOBILI faz já está coberto assim:
> - **Inquilino / Proprietário / Fiador** → modelo `Client` com `roles: ClientRole[]` (TENANT/LANDLORD/GUARANTOR)
> - **Contrato de locação** → `Contract` (já tem reajuste IGPM/IPCA, comissão, multa, fiador, 2º fiador,
>   seguro, vistoria de entrada/saída, rescisão, renovação, boleto)
> - **Parcelas/mensalidades** → `Rental` (já tem boleto, PIX, juros, multa, IPTU, repasse, baixa, estorno)
> - **Repasse ao proprietário** → `OwnerRepasse` + campos de repasse no `Rental`
> - **Movimentação financeira / conta corrente** → `Transaction`
>
> **Consequência comercial:** a plataforma **já é um superconjunto do IMOBILI**. O trabalho restante
> é (a) **migrar os dados** do cliente, (b) **empacotar offline**, (c) fechar lacunas pontuais (DIMOB,
> controle de chaves, cheques pré). Muito menos do que parecia.

### 2.1 Cadastros base
| Tabela IMOBILI | Conteúdo | Modelo destino | Status |
|---|---|---|---|
| `Propriet.DB` | Proprietários | `Client` (role LANDLORD) / `PropertyOwner` | ✅ existe |
| `Imoveis.DB` | Imóveis (carteira de locação) | `Property` | ✅ existe |
| `Inquilin.DB` | Inquilinos / locatários | `Client` (role TENANT) | ✅ existe |
| `Fiadores.DB` | Fiadores / garantidores | `Client` (role GUARANTOR) | ✅ existe |
| `InqFia.DB` | Relação inquilino↔fiador | `Contract.guarantorId`/`guarantor2Id` | ✅ existe |
| `Corretor.DB` | Corretores | `User`/`Specialist` | ✅ existe |
| `Forne.DB` | Fornecedores | `Supplier` (novo) | 🟡 opcional |
| `Empresa.DB` | Dados da imobiliária | `Company` | ✅ existe |
| `Tecnica_Cliente.DB` | Ficha técnica do cliente | campos em `Client` | ✅ |

### 2.2 Contratos & operação de locação
| Tabela | Conteúdo | Destino | Status |
|---|---|---|---|
| `Contrato.DB` | Contratos de locação | `Contract` | ✅ existe (completo) |
| `ControleChaves.DB` | Controle de entrega de chaves | `KeyControl` (novo) | 🔴 criar |
| `Compromiso.DB` | Compromissos / agenda | `Activity` | ✅ existe |
| `Historic.DB` | Histórico de movimentações | `AuditLog`/`Activity` | ✅ existe |
| `Cad_Condicao.DB` | Condições contratuais | config | 🟡 |
| `Cad_Mensagem.DB` | Mensagens padrão | templates | 🟡 |

### 2.3 Financeiro, cobrança & boletos
| Tabela | Conteúdo | Destino | Status |
|---|---|---|---|
| `Parcelas.DB` | Parcelas/mensalidades do aluguel | `Rental` | ✅ existe (completo) |
| `Boletos.DB` | Boletos emitidos | `Invoice`/`Boleto` | 🟡 (Asaas) |
| `Nosso_Numero.db` | Nosso número (banco) | gerado por Asaas | ✅ |
| `Taxa_Boleto.db` | Taxas de boleto | config billing | 🟡 |
| `Banco.DB` | Cadastro de bancos | enum/config | 🟡 |
| `Movim.DB` | Movimentação financeira | `Transaction` | ✅ existe |
| `Conta.DB` | Contas | `Transaction` | ✅ |
| `ComCorre.db` | Conta corrente (proprietário) | `OwnerRepasse`/extrato | 🟡 |
| `Saldo_Bancario.DB` | Saldos bancários | `Transaction` agg | 🟡 |
| `Duplica.DB` | Duplicatas | `Invoice` | 🟡 |
| `Cad_Cheque_Pre.DB`, `Cheque.db` | Cheques pré-datados | `PostDatedCheck` (novo) | 🟡 |
| `Juros.db`, `JuroIPTU.db` | Juros/multa, IPTU | regras de cálculo | 🟡 |
| `Pendencias.DB` | Pendências/inadimplência | view sobre `Installment` | 🟡 |
| `Obriga.DB` | Obrigações | `Transaction` | 🟡 |
| `Cad_Crediario.db` | Crediário | 🟡 opcional | 🟡 |

### 2.4 Fiscal (Receita Federal)
| Tabela | Conteúdo | Destino | Status |
|---|---|---|---|
| `Dimob.DB`, `Dimob_Geral.DB` | **DIMOB** (Declaração de Informações sobre Atividades Imobiliárias) | `FiscalNote`/módulo DIMOB | 🔴 criar |
| `Imposto_Renda.DB` | Informe de IR ao proprietário | relatório | 🔴 criar |
| `ContImp.DB` | Contas/impostos | `Transaction` | 🟡 |

> ⚠️ **DIMOB é obrigação legal anual** das imobiliárias à Receita Federal. Ter isso pronto é um
> **forte diferencial de venda** sobre concorrentes genéricos.

### 2.5 Numeração / mídia
| Tabela | Conteúdo | Destino |
|---|---|---|
| `Contador.DB`, `Num_Seq.db`, `Sequencia.db` | Numeração sequencial | sequência DB |
| `Fotos.DB` | Fotos dos imóveis | S3/Cloudinary (já existe) |
| `Endereco_logo.db`, `Filmes.DB` | Logo/mídia | storage |

---

## 3. Documentos gerados (44 modelos em `Documentos.rar`)

O IMOBILI gera documentos via Word/RTF. Inventário (reconstruir como **templates de PDF/HTML**):

**Contratos:** `CONTRATO.doc`, `Contrato_Residencial[1/2].doc`, `Contrato_Comercial.doc`,
`Contrato_Industrial.doc`, `Contrato_Fianca.doc`, `Contrato_Final.doc`, `Clausula.rtf/.doc`

**Cobrança:** `CartaCobranca.*`, `Cobranca_Inquilino.doc`, `Cobranca_Fiador.doc`,
`Cobranca_Juridico.doc`, `Cabecalho_Cobranca.doc`

**Vistoria / chaves:** `VISTORIA.doc`, `Vistoria2.doc(x)`, `Entrega.doc`, `Entrega_Chaves.doc`,
`Cabecalho_Entrega_Chaves.doc`, `Cabecalho_Chaves.doc`

**Jurídico / avisos:** `Procuracao.doc`, `Cabecalhoprocuracao.doc`, `Cabecalho_Notificacao.doc`,
`Cabecalho_Rescisao.doc`, `Cabecalho_Reajuste.doc`, `Cabecalho_Renovacao.doc`, `Cabecalho_Laudo.doc`

**Recibo / devolução:** `Cabecalho_Recibo.doc`, `Devolucao.doc/.rtf`, `Cancela.doc`

> Conteúdo já capturado (ex.: `CartaCobranca.txt` menciona SPC/SERASA, prazo de 10 dias úteis,
> honorários advocatícios). Os textos reais serão reaproveitados como base dos novos templates.

---

## 4. Mapa de funcionalidades (o que o sistema faz)

1. **Cadastro** de proprietários, imóveis, inquilinos, fiadores, corretores, fornecedores
2. **Contratos** de locação (residencial / comercial / industrial / fiança)
3. **Geração de parcelas** mensais do aluguel + **reajuste** (IGPM/IPCA) + **juros/multa** por atraso
4. **Boletos bancários** (componente spdBoleto, nosso número, taxa) — modernizar via **Asaas**
5. **Cobrança** escalonada (carta → fiador → jurídico) com integração SPC/SERASA
6. **Repasse ao proprietário** (conta corrente, saldo, descontos, comissão da imobiliária)
7. **Controle de chaves** (entrega/devolução)
8. **Vistoria** de entrada/saída (laudo)
9. **Cheques pré-datados**
10. **Fiscal:** DIMOB (Receita) + Informe de IR ao proprietário
11. **Rescisão / renovação** de contrato + procuração + notificações
12. **Fotos** dos imóveis

---

## 5. Plano de reconstrução (Edição Locação) — REVISADO

> O núcleo de locação **já existe** (§2). Logo, **L1–L3 já estão prontos** na plataforma.
> O foco real passa a ser: migração de dados, lacunas pontuais e empacotamento.

| Fase | Entregável | Status |
|---|---|---|
| ~~L1~~ | Modelos de Inquilino/Proprietário/Fiador/Contrato/Parcela | ✅ **já existe** (`Client`+`Contract`+`Rental`) |
| ~~L2~~ | Fluxo de Contrato de Locação | ✅ **já existe** |
| ~~L3~~ | Motor de parcelas + reajuste + juros/multa | ✅ **já existe** (`Rental`) |
| **L4** | Boletos/cobrança via **Asaas** + régua de cobrança | 🟡 existe base; ligar Asaas prod |
| **L5** | Repasse ao proprietário (extrato/conta corrente) | ✅ `OwnerRepasse` |
| **L6** | Gerador de documentos (44 templates `.doc` → PDF) | 🔴 a fazer |
| **L7** | Módulo **DIMOB** + Informe de IR ao proprietário | 🔴 a fazer (verificar `FiscalNote`) |
| **L8** | Lacunas: `KeyControl` (chaves), `PostDatedCheck` (cheque pré) | 🟡 pequeno |
| **L9** | **Migrador Paradox `.DB` → plataforma** (importa a carteira atual) | 🔴 prioridade |
| **L10** | Empacotamento offline (Electron + SQLite) | 🔴 grande |

> **L9 é o item de maior valor comercial:** a plataforma já tem campos `legacyId` e `importSource`
> exatamente para isso. Eu escrevo um conversor que lê as tabelas Paradox e popula `Client`/`Contract`/`Rental`.
> **Para construir e testar o migrador, preciso da pasta de DADOS do IMOBILI** — as tabelas reais:
> `Propriet.DB`, `Imoveis.DB`, `Inquilin.DB`, `Fiadores.DB`, `Contrato.DB`, `Parcelas.DB`
> (e seus índices `.PX/.X*/.Y*`). Ficam na pasta de dados do sistema (perto do `IMOBILI.exe`).

---

## 6. O que ainda ajudaria (opcional, melhora a fidelidade)

- 📸 Prints das telas de cadastro (Imóveis, Contratos, Parcelas) → captura os **campos exatos**
- 🗂️ Cópia das **tabelas de dados** `.DB` (pasta de dados) → habilita o migrador (L9)
- 📄 Já tenho os 44 documentos → reconstruo os impressos

> Mesmo **sem** mais nada, já dá para começar L1–L6 com o que foi levantado aqui.

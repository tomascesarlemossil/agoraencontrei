# Sistema IMOBILI/UNILOC — Mapa de Funcionalidades & Análise de Lacunas

> Referência **funcional** (não de dados) do sistema offline legado de administração de
> carteira de locação **IMOBILI** (motor **UNILOC**, Visual FoxPro). O objetivo deste
> documento é **identificar funções comprovadas** desse sistema (em uso há ~25 anos) que
> podem **faltar ou ser melhoradas** no AgoraEncontrei.
>
> ⚠️ **Sem dados pessoais.** Nenhum dado de cliente, contrato, proprietário ou usuário é
> registrado aqui — apenas a engenharia de funcionalidades do software.

---

## 1. O que é o sistema

Aplicação desktop de **administração de locação** (property management) para imobiliárias.
Cobre todo o ciclo: cadastro → contrato → cobrança mensal → recebimento → repasse ao
proprietário → rescisão, mais o financeiro interno da imobiliária.

- **Aplicação:** `IMOBILI.exe` (Visual FoxPro) · motor de dados **UNILOC**
- **Componentes:** BDE (Borland Database Engine), utilitário `Estruturas.exe`, gerador de
  boletos `spdBoleto`, arquivo de config `.CFG`
- **Dados:** ~54 tabelas DBF/FoxPro

---

## 2. Funcionalidades por módulo (derivadas da estrutura do sistema)

### A. Cadastros
- Proprietário (locador) com dados bancários para repasse
- **Co-proprietários / locador secundário** com **rateio por percentual**
- **Favorecidos de repasse** (terceiros) com **% por imóvel**
- Inquilino, Fiador (até 2 fiadores por contrato), cônjuge e representantes legais
- Imóvel com vínculo de % de propriedade, IPTU, luz, água, garagem
- **Vagas de garagem** cadastradas e vinculáveis a imóveis distintos
- Base de CEP própria

### B. Contratos
- Índice de reajuste (IGPM/IPCA…), data-base e mês de reajuste anual
- Tipo de garantia: fiador / caução / seguro fiança / título de capitalização
- Comissão da imobiliária e taxa de administração configuráveis
- Multa, juros (por dia/mês) e cálculo de IRRF retido
- Encargos inclusos no aluguel (água, luz, condomínio, IPTU)
- **Vistoria de entrada e de saída** (data + observações)
- Renovação com contagem de renovações e próxima data de reajuste

### C. Cobrança mensal (recebimentos)
- Geração de lançamentos de aluguel + encargos + diversos
- **Emissão de boleto** (linha digitável, nosso número, código de barras)
- Lançamentos diversos (débitos/créditos avulsos no contrato)
- **Carnê de IPTU parcelado** lançado por imóvel/ano e rateado ao inquilino
- Sequenciadores de nº de boleto, recibo e edital
- **Baixa por arquivo CNAB de retorno** (campo `BAIXACNAB`) + baixa manual

### D. Repasse ao proprietário
- Cálculo do líquido = aluguel − comissão − IRRF − despesas
- **Rateio do repasse entre múltiplos proprietários/favorecidos** por percentual
- Registro de banco/conta de destino por favorecido

### E. Financeiro interno da imobiliária
- **Caixa** (fluxo de débito/crédito por grupo/plano de contas)
- **Movimentação bancária** por conta + conciliação caixa × banco
- **Contas a pagar (despesas)** com favorecido, vencimento, pagamento e documento
- **Controle de cheques (a pagar / pré-datados)** com situação e favorecido
- Plano de contas (grupos)

### F. Pós-contrato e jurídico
- **Acordos / renegociação** de débitos em atraso (novo cronograma)
- **Rescisão com apuração de saldo**: aluguel proporcional, IPTU pro-rata, multa,
  bonificação, devolução de caução, lançamentos de rescisão
- **Notificações formais** (aviso/extrajudicial) com tipo, assunto e situação

### G. Apoio
- Tabela de **índices de reajuste** por data
- Tabela de **IR** (faixas, alíquota, dedução) para retenção
- Feriados (cálculo de vencimentos em dia útil)
- Modelos de documento
- **Permissões granulares por módulo** (~50 flags por usuário)
- Lembretes/agenda operacional
- Parametrização central (taxas, dados bancários, NF, e-mail/SMTP, FTP)

---

## 3. Cobertura no AgoraEncontrei

Boa parte já existe (o schema Prisma já cita `legacyId` do Uniloc). Comparativo:

| Funcionalidade IMOBILI | AgoraEncontrei | Status |
|------------------------|----------------|--------|
| Cadastro locador/inquilino/fiador/imóvel | `Client`, `Property`, `Contract.guarantor/guarantor2` | ✅ |
| Contrato (reajuste, garantia, comissão, IRRF, vistoria) | `Contract` (campos completos) | ✅ |
| Cobrança mensal + boleto | `Rental`, `Invoice` (Asaas) | ✅ |
| Índices de reajuste | `bcb-rates` | ✅ |
| Repasse simples ao proprietário | `OwnerRepasse`, `ScheduledRepasse` | ✅ |
| Caixa / transações | `Transaction`, `FinancialForecast` | ✅ |
| Nota fiscal de serviço | `FiscalNote` | ✅ |
| **Rateio de repasse multi-proprietário/favorecido** | `RepasseBeneficiary` + `scheduleRepasseWithSplit` | ✅ **Implementado** |
| **Contas a pagar + cheques pré-datados** | `AccountPayable` + `BankCheck` + rota `/payables` | ✅ **Implementado** |
| **Conciliação bancária / CNAB retorno** | parcial (Asaas webhook) | ⚠️ **Parcial** |
| **Acordos / renegociação de dívida** | `Agreement` + `AgreementInstallment` + rota `/agreements` | ✅ **Implementado** |
| **Cálculo automatizado de rescisão** | `calculateRescission` + `Rescission` + rota `/rescission` | ✅ **Implementado** |
| **Notificação formal/extrajudicial** | `legal` + `alerts` (parcial) | ⚠️ **Parcial** |
| Carnê de IPTU parcelado | `Rental.iptuAmount` (sem carnê) | ⚠️ **Parcial** |
| Permissões granulares por módulo | `UserRole` (papéis fixos) | ⚠️ **Parcial** |

---

## 4. Recomendações (caminhos a corrigir/melhorar)

Priorizado por impacto operacional numa imobiliária de locação:

1. ~~**Rateio de repasse multi-proprietário**~~ ✅ **Implementado** — modelo
   `RepasseBeneficiary` (participantes com `%` + dados bancários por favorecido) e função
   `scheduleRepasseWithSplit` que rateia o repasse entre os beneficiários do contrato.
   Sem beneficiários cadastrados, mantém 100% para `Contract.landlordId`. Endpoints:
   `GET/PUT /api/v1/repasse/contracts/:contractId/beneficiaries`. Migration:
   `20260630000000_add_repasse_beneficiaries`.
2. ~~**Módulo Contas a Pagar + Cheques**~~ ✅ **Implementado** — modelos `AccountPayable`
   e `BankCheck`, rota `/api/v1/payables` (CRUD, marcar paga, summary, cheques com
   compensar/cancelar). Migration `20260630000001_add_accounts_payable_checks`.
3. ~~**Motor de rescisão**~~ ✅ **Implementado** — serviço puro `calculateRescission`
   (aluguel/IPTU proporcionais, multa proporcional ao período restante, débitos, bonificação,
   caução), modelo `Rescission`, rota `/api/v1/rescission` (preview/persistir/confirmar).
   Migration `20260630000002_add_rescissions`.
4. ~~**Acordos/renegociação**~~ ✅ **Implementado** — `generateInstallmentPlan` (parcelas
   com reconciliação de centavos), modelos `Agreement`/`AgreementInstallment`, rota
   `/api/v1/agreements`. Migration `20260630000003_add_agreements`.

### Ainda pendente (parcial — próximos passos)
5. **Conciliação bancária** — importar extrato/CNAB de retorno para baixa automática e
   bater caixa × banco.
6. **Notificação formal padronizada** — tipo, assunto, situação e data de resolução
   (cobrança amigável → extrajudicial).
7. **Permissões granulares por módulo** — complementar `UserRole` com flags por recurso.

> Estas recomendações são apenas de **funcionalidade**; nenhuma migração de dados é
> proposta ou necessária.
>
> **Antes do deploy:** rodar `pnpm db:generate && pnpm typecheck` no ambiente de dev
> (o engine do Prisma não funciona neste container) e aplicar as 4 migrations no Neon
> (são idempotentes). A validação aqui foi por checagem de sintaxe (`node strip-types`)
> e testes unitários da matemática (rateio, rescisão e parcelas — todos fecham em centavos).

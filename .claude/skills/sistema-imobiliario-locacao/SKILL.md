---
name: sistema-imobiliario-locacao
description: >-
  Conhecimento de domínio para construir sistemas, sites ou programas de
  imobiliária — especialmente administração de carteira de LOCAÇÃO (property
  management) no mercado brasileiro. Use sempre que for projetar, modelar dados
  ou planejar funcionalidades de: CRM imobiliário, gestão de aluguéis,
  contratos, repasses a proprietários, cobrança/boletos, IPTU, rescisão,
  financeiro de imobiliária. Baseado em sistema legado (IMOBILI/UNILOC)
  comprovado por ~25 anos de operação real. NÃO contém dados pessoais.
---

# Sistema Imobiliário de Locação — Checklist de Domínio

Conhecimento destilado de um sistema desktop de administração de locação em uso real por
~25 anos (IMOBILI/UNILOC, Visual FoxPro). Use como **checklist de funcionalidades** ao
construir qualquer sistema/site/programa imobiliário, para não esquecer regras de negócio
que só aparecem na operação do dia a dia.

## Quando usar
- Modelar banco de dados de imobiliária (locação, vendas, financeiro).
- Planejar telas/módulos de um CRM ou ERP imobiliário.
- Decidir o escopo de um MVP de gestão de aluguéis.
- Avaliar lacunas de um sistema imobiliário existente.

## O ciclo completo da locação (não pule etapas)
```
Cadastro → Contrato → Cobrança mensal → Recebimento/Baixa →
Repasse ao proprietário → (Reajuste anual) → Rescisão/Acordo
```
Em paralelo, sempre existe o **financeiro interno da imobiliária** (caixa, banco,
contas a pagar, comissões, notas fiscais).

## Entidades essenciais (modelo de dados mínimo)
- **Proprietário (locador)** + dados bancários para repasse.
- **Co-proprietários / favorecidos** com **rateio por percentual** (1 imóvel → N donos).
- **Inquilino** e **Fiador** (suportar 2 fiadores; cônjuge e representantes legais PJ).
- **Imóvel** com % de propriedade, IPTU, água, luz, garagem (vaga pode ser unidade própria).
- **Contrato** ligando locador+imóvel+inquilino+garantia.
- **Lançamento de aluguel** (mensal) + **lançamentos diversos** (avulsos).
- **Boleto/Invoice**, **Repasse**, **Transação de caixa**, **Movimento bancário**.

## Regras de negócio que costumam ser esquecidas
1. **Rateio de repasse**: um imóvel pode ter vários donos/favorecidos com % distintos.
   O repasse não é 1:1 — modele uma tabela de participantes.
2. **Reajuste anual por índice** (IGPM/IPCA): guardar índice, data-base, mês de reajuste,
   data do último e do próximo reajuste, e histórico de índices por data.
3. **Garantia locatícia** tem 4 tipos: fiador, caução, seguro fiança, título de
   capitalização — cada um com regras próprias.
4. **IRRF retido** no repasse de pessoa física (tabela progressiva mensal de IR).
5. **Multa + juros de mora**: multa percentual fixa + juros por dia ou por mês; defina
   se cálculo é em dias corridos ou úteis (precisa de tabela de feriados).
6. **IPTU parcelado** (carnê): lançar por imóvel/ano, ratear parcelas ao inquilino.
7. **Encargos inclusos**: marcar se água/luz/condomínio/IPTU já estão no aluguel.
8. **Vistoria de entrada e de saída** (data + laudo) — essencial para rescisão.
9. **Rescisão = apuração de saldo**: aluguel proporcional + IPTU pro-rata + multa
   rescisória + bonificação + devolução de caução. Faça um motor de cálculo, não campos soltos.
10. **Acordos/renegociação**: débitos atrasados viram novo cronograma de parcelas
    vinculado aos lançamentos originais.
11. **Cobrança bancária**: emissão de boleto e **baixa por arquivo CNAB de retorno**
    (ou webhook do gateway). Sempre prever conciliação caixa × banco.
12. **Notificação formal/extrajudicial**: tipo, assunto, situação e data de resolução
    (régua: cobrança amigável → notificação → jurídico).

## Financeiro interno da imobiliária (não esquecer)
- **Caixa** com plano de contas (grupos), débito/crédito.
- **Contas a pagar** (despesas) com favorecido, vencimento, status, documento.
- **Controle de cheques** (a pagar / pré-datados) com situação.
- **Comissões** da imobiliária e da equipe.
- **Notas fiscais de serviço** (NFS-e) sobre a taxa de administração.
- **Conciliação bancária** por conta.

## Operacional / sistema
- **Permissões granulares por módulo** (não só papéis fixos): imobiliárias têm muitos
  perfis (corretor, financeiro, jurídico, diretoria) com acessos finos.
- **Parametrização central**: taxas padrão, dados bancários, e-mail/SMTP, NF, logos.
- **Sequenciadores** de nº de boleto/recibo/edital.
- **Modelos de documento** (contrato, notificação, recibo) com mesclagem de campos.
- **Lembretes/agenda** operacional vinculados a contrato/imóvel/cliente.
- **Auditoria**: registrar usuário e data de criação/alteração em tudo (`userCad`,
  `dataCad`, `userAtua`, `dataAtua`).

## Mercado brasileiro — especificidades
- Documentos: CPF/CNPJ (CIC/CGC), RG, IE, CRECI da imobiliária.
- Bancos: boleto (CNAB 240/400), PIX, e gateways (ex.: Asaas) para split/repasse.
- Índices oficiais via BCB (IGPM, IPCA, taxas).
- Retenções fiscais: IRRF, PIS/COFINS/CSLL, ISS sobre a taxa de administração.

## Anti-padrões a evitar
- Tratar repasse como 1 proprietário por imóvel (quebra em co-propriedade).
- Esquecer rescisão como cálculo (vira planilha manual paralela).
- Não ter contas a pagar/cheques (financeiro fica só "a receber").
- Papéis de acesso rígidos demais (RBAC sem granularidade por módulo).
- Não guardar histórico de reajustes e de baixas (perde rastreabilidade fiscal).

## Implementações de referência (neste repositório)
Padrões já implementados e testados — reaproveite a abordagem ao construir sistemas novos:
- **Rateio de repasse**: `apps/api/src/services/repasse.service.ts` (`scheduleRepasseWithSplit`)
  + modelo `RepasseBeneficiary`. Reconciliação de centavos: o último beneficiário absorve o resto.
- **Motor de rescisão**: `apps/api/src/services/rescission.service.ts` (`calculateRescission`) —
  função PURA, fácil de testar; proporcional por dias + multa proporcional ao período restante.
- **Acordos/parcelas**: `apps/api/src/services/agreement.service.ts` (`generateInstallmentPlan`) —
  clamp de fim de mês + centavos na última parcela.
- **Conciliação bancária**: `apps/api/src/services/reconciliation.service.ts` — parsers CSV/CNAB400
  e `matchEntries` (por nosso número, depois valor+data, sem reusar candidato).
- **Permissões por módulo**: `apps/api/src/utils/permissions.ts` (`requirePermission`, opt-in).
- **Testes**: `apps/api/test/*.test.ts` com `node:test` via `tsx` (sem libs extras).

> Lição-chave: extraia a regra de negócio numa **função pura** (sem I/O) e teste a matemática
> isoladamente — dinheiro deve fechar em centavos sempre (aloque em inteiros de centavos e
> deixe o último item absorver o resto).

---
**Referência de mapeamento detalhada:** `docs/SISTEMA-UNILOC-MAPEAMENTO.md`.

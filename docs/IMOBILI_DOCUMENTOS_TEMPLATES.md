# IMOBILI — Inventário de Documentos & Spec do Gerador

> Os 44 modelos `.doc/.rtf` do IMOBILI (pasta `Documentos`) que o sistema usava como mala direta.
> Aqui viram a especificação do **gerador de documentos** da plataforma (templates → PDF/HTML
> com campos de mesclagem dos modelos `Contract` / `Client` / `Property`).

## 1. Categorias de documento

| Categoria | Modelos originais | Fonte de dados (Prisma) |
|---|---|---|
| **Contratos de locação** | `CONTRATO`, `Contrato_Residencial[1/2]`, `Comercial`, `Industrial`, `Contrato_Fianca`, `Contrato_Final`, `Clausula` | `Contract` + `Client` (locador/locatário/fiador) + `Property` |
| **Cobrança** | `CartaCobranca`, `Cobranca_Inquilino`, `Cobranca_Fiador`, `Cobranca_Juridico`, `Cabecalho_Cobranca` | `Rental` (parcelas em atraso) + `Client` |
| **Vistoria** | `VISTORIA`, `Vistoria2`, `Cabecalho_Laudo` | `Contract.inspection*` |
| **Chaves** | `Entrega_Chaves`, `Cabecalho_Chaves`, `Cabecalho_Entrega_Chaves`, `Entrega` | `Contract` + (futuro `KeyControl`) |
| **Jurídico/avisos** | `Procuracao`, `Cabecalho_Notificacao`, `Cabecalho_Rescisao`, `Cabecalho_Reajuste`, `Cabecalho_Renovacao` | `Contract` + `Client` |
| **Recibo/devolução** | `Cabecalho_Recibo`, `Devolucao`, `Cancela` | `Rental` / `Transaction` |

## 2. Campos de mesclagem (mapa unificado)

Variáveis a expor no editor de templates, já ligadas ao banco:

```
# Imobiliária (Company)
{{empresa.nome}} {{empresa.cnpj}} {{empresa.endereco}} {{empresa.telefone}} {{empresa.creci}}

# Locador / Proprietário (Client role LANDLORD)
{{locador.nome}} {{locador.cpfCnpj}} {{locador.rg}} {{locador.endereco}} {{locador.estadoCivil}}

# Locatário / Inquilino (Client role TENANT)
{{locatario.nome}} {{locatario.cpfCnpj}} {{locatario.rg}} {{locatario.profissao}} {{locatario.endereco}}

# Fiador (Client role GUARANTOR)
{{fiador.nome}} {{fiador.cpfCnpj}} {{fiador.conjuge}} {{fiador.imovelGarantia}}

# Imóvel (Property)
{{imovel.endereco}} {{imovel.numeroIptu}} {{imovel.tipo}} {{imovel.area}}

# Contrato (Contract)
{{contrato.inicio}} {{contrato.prazoMeses}} {{contrato.valorAluguel}} {{contrato.diaVencimento}}
{{contrato.indiceReajuste}} {{contrato.multa}} {{contrato.comissao}} {{contrato.dataReajuste}}

# Parcela / cobrança (Rental)
{{parcela.competencia}} {{parcela.vencimento}} {{parcela.valor}} {{parcela.juros}} {{parcela.multa}}
{{cobranca.totalDevido}} {{cobranca.parcelasEmAberto}}

# Datas / sistema
{{data.hoje}} {{data.extenso}} {{cidade}}
```

## 3. Conteúdo recuperado — Carta de Cobrança (texto real do IMOBILI)

> Recuperado de `CartaCobranca.doc`. Servirá de base para o template padrão de cobrança.

```
Afim de evitar o envio das mesmas para o Departamento Jurídico, o que acarretaria
maiores despesas, tais como: Honorários Advocatícios, custas de cartório, taxa de
oficial de justiça e negativação junto ao SPC e SERASA.
Solicitamos que tome urgentes providências para liquidação das referidas parcelas.
Para tanto V.Sa. tem 10 dias úteis a partir do recebimento desta para o pagamento
ou negociação das mesmas.
No aguardo de vossas urgentes providências.
                                                            Atenciosamente
```

Versão com campos de mesclagem:
```
Prezado(a) {{locatario.nome}},

Constam em aberto as seguintes parcelas do contrato de locação do imóvel
{{imovel.endereco}}: {{cobranca.parcelasEmAberto}}, totalizando {{cobranca.totalDevido}}.

Afim de evitar o envio para o Departamento Jurídico — o que acarretaria maiores
despesas (honorários advocatícios, custas de cartório, taxa de oficial de justiça
e negativação junto ao SPC e SERASA) — solicitamos providências para liquidação.

V.Sa. tem 10 dias úteis a partir do recebimento desta para pagamento ou negociação.

{{empresa.nome}} — {{data.extenso}}
```

## 4. Implementação sugerida (fase L6)

1. Modelo Prisma `DocumentTemplate { id, companyId, category, name, bodyHtml, mergeFields }`.
2. Editor de template (rich text) com a lista de variáveis acima.
3. Renderização: substituir `{{var}}` → gerar **PDF** (ex.: `puppeteer`/`@react-pdf`).
4. Seed com os 44 modelos do IMOBILI já convertidos (este documento é a base).

> Os `.doc` originais ficaram preservados no material enviado; o texto de cada um pode ser
> reconvertido sob demanda quando cada template for montado.

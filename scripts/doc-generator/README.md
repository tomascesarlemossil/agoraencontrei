# Gerador de Documentos — AgoraEncontrei Software

Motor de templates com **merge-fields** que recria os impressos do IMOBILI
(contratos, cobranças, recibos) de forma moderna: HTML → PDF.

## Status: ✅ funcional e testado

```bash
node test-render.mjs
# cobranca.html               → out/cobranca.html  [OK]
# contrato-residencial.html   → out/contrato-residencial.html  [OK]
# 2/2 templates renderizados sem campos pendentes.
```

## Como funciona

`render.mjs` substitui:
- **Campos:** `{{locatario.nome}}`, `{{contrato.valorAluguel|moeda}}`, `{{data.hoje|extenso}}`
- **Filtros:** `moeda` (R$ 1.850,50), `data` (30/06/2026), `extenso` (30 de junho de 2026), `maiusc`
- **Condicionais:** `{{#se fiador.nome}}...{{/se}}`

```js
import { renderFile } from './render.mjs'
const html = renderFile('cobranca', dados)   // → HTML pronto p/ PDF
```

## Templates (derivados dos 44 documentos do IMOBILI)

| Arquivo | Origem IMOBILI |
|---|---|
| `cobranca.html` | `CartaCobranca` / `Cobranca_Inquilino` (texto real recuperado) |
| `contrato-residencial.html` | `Contrato_Residencial` (Lei 8.245/91) |

> Próximos a portar: `contrato-comercial`, `procuracao`, `vistoria`, `recibo`, `rescisao`,
> `notificacao` — basta criar o `.html` com os mesmos merge-fields (mapa em
> `docs/IMOBILI_DOCUMENTOS_TEMPLATES.md`).

## Integração na plataforma (próximo passo)

1. Modelo `DocumentTemplate` no Prisma (companyId, categoria, bodyHtml).
2. Rota `POST /documents/generate` que monta `dados` a partir de `Contract`/`Client`/`Property`
   e chama `render()`.
3. HTML → PDF com puppeteer (já presente no stack) ou `@react-pdf`.

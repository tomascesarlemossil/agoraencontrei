# SEO 1M URLs — Guia de Integração

> Documento de handoff entre **Manus** (PR #41) e **Claude Code** para integração das 1.000.000 de URLs SEO.

## Arquitetura implementada

### Rotas Next.js (Manus — PR #41)

| Rota | Arquivo | Páginas geradas |
|------|---------|----------------|
| `/{estado}/{cidade}` | `[estado]/[cidade]/page.tsx` | 152 |
| `/{estado}/{cidade}/{cluster}` | `[estado]/[cidade]/[cluster]/page.tsx` | 152 × 22 = 3.344 |
| `/{estado}/{cidade}/{cluster}/{modificador}` | `[estado]/[cidade]/[cluster]/[modificador]/page.tsx` | 152 × 10 × 14 = 21.280 |
| `/{estado}/{cidade}/servicos/{cluster}` | `servicos/[cluster]/page.tsx` | 152 × 12 = 1.824 |
| `/{estado}/{cidade}/investimentos/{cluster}` | `investimentos/[cluster]/page.tsx` | 152 × 8 = 1.216 |
| `/{estado}/{cidade}/guia/{cluster}` | `guia/[cluster]/page.tsx` | 152 × 10 = 1.520 |
| **Total estático** | | **~29.336 páginas** |

### Data layer (Manus — PR #41)

Arquivo: `apps/web/src/data/seo-ibge-cities-expanded.ts`

- **152 cidades** com dados IBGE reais (população, PIB per capita, área, salário médio)
- **6 estados**: SP, MG, GO, PR, MS, RJ
- Interface `IbgeCityData` compatível com `CityData` existente
- Índices: `IBGE_CITY_BY_SLUG`, `IBGE_CITIES_BY_STATE`
- Helper: `getIbgeCitySnippet(city)` — gera snippet SEO com dados IBGE

### Scripts de seed (Manus — PR #41)

| Script | Uso |
|--------|-----|
| `apps/api/scripts/seed-1m-urls.ts` | Importa o CSV de 1M URLs para `seo_paginas` |
| `apps/api/scripts/generate-seo-content-batch.ts` | Gera conteúdo AI para páginas pendentes |
| `apps/api/scripts/import-ibge-all-cities.ts` | Importa dados IBGE para todas as cidades |

## O que o Claude Code precisa fazer

### 1. Adicionar coluna `conteudo_ai` na tabela `seo_paginas`

```sql
ALTER TABLE seo_paginas
  ADD COLUMN IF NOT EXISTS conteudo_ai TEXT,
  ADD COLUMN IF NOT EXISTS familia_url VARCHAR(100),
  ADD COLUMN IF NOT EXISTS estado_slug VARCHAR(10),
  ADD COLUMN IF NOT EXISTS cidade_slug VARCHAR(100),
  ADD COLUMN IF NOT EXISTS cluster_slug VARCHAR(100),
  ADD COLUMN IF NOT EXISTS modificador_slug VARCHAR(100),
  ADD COLUMN IF NOT EXISTS prioridade SMALLINT DEFAULT 5,
  ADD COLUMN IF NOT EXISTS indexar BOOLEAN DEFAULT TRUE;
```

### 2. Criar rota de API para servir conteúdo AI

```typescript
// GET /api/v1/seo/page-content?slug={slug}
// Retorna: { titulo, h1, meta_description, conteudo_ai, cidade_data }
```

### 3. Integrar `IBGE_CITIES_152` ao data layer existente

O arquivo `seo-ibge-cities-expanded.ts` exporta `IBGE_CITIES_152` com interface
`IbgeCityData` (superset de `CityData`). Para integrar ao `seo-cities.ts` existente:

```typescript
// Em seo-cities.ts, adicionar ao final:
import { IBGE_CITIES_152 } from './seo-ibge-cities-expanded'
UNIQUE_CITIES.push(
  ...IBGE_CITIES_152
    .filter(c => !seen.has(c.slug) && (seen.add(c.slug), true))
    .map(c => ({ slug: c.slug, name: c.name, state: c.state, stateSlug: c.stateSlug, population: c.populacao, region: c.region }))
)
```

### 4. Adicionar `generateSitemapEntries` para as novas rotas

```typescript
// Em apps/web/src/app/sitemap.ts
import { IBGE_CITIES_152 } from '@/data/seo-ibge-cities-expanded'

// Adicionar entradas para /{estado}/{cidade}
const cityEntries = IBGE_CITIES_152.map(city => ({
  url: `${WEB_URL}/${city.stateSlug}/${city.slug}`,
  lastModified: new Date(),
  changeFrequency: 'weekly' as const,
  priority: 0.8,
}))
```

## Como executar o seed

```bash
# 1. Copiar o CSV para o servidor
scp agoraencontrei_urls_1M.csv.gz user@server:~/

# 2. Executar o seed (por família para controlar)
cd apps/api
CSV_PATH=~/agoraencontrei_urls_1M.csv.gz \
FAMILIA="money pages" \
BATCH_SIZE=500 \
npx tsx scripts/seed-1m-urls.ts

# 3. Gerar conteúdo AI para as money pages primeiro (maior prioridade)
FAMILIA="money pages" \
ESTADO="sp" \
LIMIT=200 \
CONCURRENCY=5 \
npx tsx scripts/generate-seo-content-batch.ts
```

## Potencial total de URLs

| Família | URLs no CSV | Rotas Next.js |
|---------|-------------|---------------|
| money pages | ~300.000 | `/{estado}/{cidade}/{cluster}` |
| bairros | ~200.000 | `/{estado}/{cidade}/{bairro}/{cluster}` |
| guias locais | ~150.000 | `/{estado}/{cidade}/guia/{cluster}` |
| fornecedores/serviços | ~180.000 | `/{estado}/{cidade}/servicos/{cluster}` |
| investimentos/leilões | ~170.000 | `/{estado}/{cidade}/investimentos/{cluster}` |
| **Total** | **~1.000.000** | **~29.336 estáticas + ISR** |

## Divisão de trabalho (sem conflitos)

| Manus (PR #41) | Claude Code |
|----------------|-------------|
| Data layer 152 cidades IBGE | Migration SQL `seo_paginas` |
| Rotas `[estado]/[cidade]/*` | Rota API `/seo/page-content` |
| Scripts seed + AI batch | Integração sitemap.ts |
| Floating CTA em todas as rotas | Dashboard de monitoramento SEO |

# SEO Programático — AgoraEncontrei (Franca/SP)

Pipeline de ingestão e publicação **controlada** de ~52,8 mil posts de blog
gerados por matriz combinatória (20 temas × 40 bairros de Franca × instituições),
a partir dos 4 bancos `.xlsx` fornecidos.

> **Decisão de arquitetura:** implementado no app **Next.js (`apps/web`)** de
> produção, reaproveitando o modelo `BlogPost` (Prisma/Postgres), as rotas
> `blog/[slug]`, `generateMetadata`, sitemaps e `robots.ts` já existentes.
> **Não** seguimos a stack do prompt original do Gemini (Vite + react-router +
> react-helmet + Supabase), que descreve o app legado da raiz do repo e
> duplicaria o que já funciona — melhor — no Next.js.

---

## ⚠️ Aviso de SEO (leia antes de publicar)

Publicar milhares de páginas quase-template de uma vez é o gatilho nº 1 da
política de **"scaled content abuse"** do Google (mar/2024) e pode **desindexar
o domínio inteiro**. Volume ≠ ranqueamento.

Por isso o pipeline é **draft-first + publicação em ondas + dados vivos**:

1. **Ingestão** entra tudo como `draft` / `noindex` — nada vai ao ar.
2. **Dados vivos**: cada página funde o texto com dados reais do inventário
   (nº de imóveis ativos no bairro, mediana do preço/m², 3 anúncios recentes).
   É isso que torna a página única e útil, não o texto combinatório.
3. **Publicação em ondas**, medindo indexação no Search Console entre lotes.

---

## Estrutura

```
scripts/seo-import/extract_seo_xlsx.py        # xlsx -> ndjson.gz (dedup + slug)
packages/database/data/seo-posts/
    franca-seo-posts.ndjson.gz                # dataset versionado (~3,4 MB, 52.770 posts)
packages/database/prisma/import-seo-programmatic.ts   # ingestão (draft-first)
packages/database/prisma/publish-seo-wave.ts          # publicação em ondas
apps/api/src/routes/public/index.ts           # GET /bairro-stats (dados vivos)
apps/web/src/app/(public)/blog/[slug]/BairroLiveData.tsx   # painel dados vivos
```

## Como rodar

### 1. (Opcional) Regerar o dataset a partir dos .xlsx

Os `.xlsx` de origem **não** são versionados (grandes/efêmeros). O artefato
versionado é o `.ndjson.gz`. Para regerar:

```bash
pip install openpyxl
python3 scripts/seo-import/extract_seo_xlsx.py \
  --src <dir-com-os-xlsx> \
  --out packages/database/data/seo-posts/franca-seo-posts.ndjson.gz
```

### 2. Ingestão (tudo como draft / noindex)

```bash
# usa a 1ª company, ou defina SEO_COMPANY_ID (= NEXT_PUBLIC_COMPANY_ID do web)
SEO_COMPANY_ID=<companyId> pnpm --filter @agoraencontrei/database run import:seo

# teste com subconjunto:
SEO_LIMIT=500 pnpm --filter @agoraencontrei/database run import:seo
```

Idempotente: `createMany({ skipDuplicates })` + `@@unique([companyId, slug])`.
Reexecutar não duplica.

### 3. Publicação em ondas (dry-run por padrão)

```bash
# simula (não altera nada):
pnpm --filter @agoraencontrei/database run publish:seo -- --bairro="Centro" --limit=200

# aplica de fato:
pnpm --filter @agoraencontrei/database run publish:seo -- --bairro="Centro" --limit=200 --confirm

# por tema, ou geral:
pnpm --filter @agoraencontrei/database run publish:seo -- --tema="Leilões" --limit=100 --confirm
pnpm --filter @agoraencontrei/database run publish:seo -- --limit=100 --confirm
```

Publicar seta `published=true`, `status='published'`, `publishedAt`, `noindex=false`.

## Rollback

Todos os posts carregam `source='seo-programmatic'` e `sourceUrl='seo:<extId>'`.
Para despublicar uma onda:

```sql
UPDATE blog_posts SET published=false, status='draft', noindex=true
WHERE source='seo-programmatic' AND bairro='Centro';
```

## Estratégia de ondas recomendada

1. **Onda 1** — só bairros com inventário real (dados vivos preenchidos),
   ~100–300 posts, temas de maior intenção comercial (Leilões, Financiamento,
   Primeiro Imóvel). Submeter sitemap no Search Console.
2. **Aguardar** 1–2 semanas: medir indexação, impressões, cliques.
3. **Ondas seguintes** por bairro/tema, ampliando só se a indexação for saudável.
4. Variações fracas (bairro sem inventário) → manter `noindex` ou usar
   `canonical` apontando para a página-mãe do bairro.

## Mapeamento tema → categoria

Ver `TEMA_TO_CATEGORIA` em `extract_seo_xlsx.py`. Duas categorias novas são
criadas na ingestão: **Reformas e Arquitetura** e **Regularização e
Documentação**.

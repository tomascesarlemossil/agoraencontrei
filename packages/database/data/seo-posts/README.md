# data/seo-posts

Dataset versionado do SEO programático.

- `franca-seo-posts.ndjson.gz` — 52.770 posts (NDJSON gzip, ~3,4 MB), um objeto
  por linha: `{ extId, slug, tema, categoria, cidade, uf, bairro, titulo,
  keywords, metaDesc, conteudo }`.

Gerado por `scripts/seo-import/extract_seo_xlsx.py` a partir dos 4 bancos `.xlsx`
(os `.xlsx` de origem **não** são versionados). Consumido por
`packages/database/prisma/import-seo-programmatic.ts`.

Ver `docs/SEO_PROGRAMATICO.md` para o fluxo completo.

# Plano de Dominação SEO — AgoraEncontrei 2026

> Meta: ser **#1 no Google** em qualquer busca relacionada a imóveis, região, bairro,
> rua, serviço, produto ou detalhe — em escala nacional — alimentando o site com um
> universo praticamente infinito de páginas úteis e interligadas.
>
> Modo escolhido: **plano completo + máxima cobertura**.
> Branch de trabalho: `claude/seo-ranking-strategy-ama02o`.

---

## 1. Onde paramos (estado real da máquina — ~75% construída)

A fábrica de SEO programático **já está montada**. O que falta é **ligar as esteiras
em escala** e **ampliar o universo de termos** para os produtos modernos.

### ✅ Pronto e funcionando

| Camada | Arquivo / Rota | Estado |
|--------|----------------|--------|
| Universo de termos (imóveis) | `seo-clusters.ts` (grupos A/B/C/D), `seo-categorias.ts` (~85) | ✅ |
| Keywords semeadas | `seo-programatico.service.ts` — **660+ keywords, 25 categorias** | ✅ |
| Camada geográfica | 152 cidades IBGE + `seo-ibge-all-cities.ts` (5.767 linhas), `seo-locations.ts` (3.311), bairros, condomínios, ruas | ✅ |
| Rotas programáticas | `/[estado]/[cidade]/[cluster]/[modificador]`, `/servicos`, `/investimentos`, `/guia`, `/bairro`, `comparar`, `custo-de-vida` | ✅ |
| Metadata + JSON-LD | `generateMetadata` em todas as rotas + `RealEstateListing` / `ItemList` schema | ✅ |
| Sitemaps | `sitemap.ts` (651 linhas, esqueleto 1M+) + 6 sitemaps segmentados + `robots.ts` (bloqueia bots ruins) | ✅ |
| Motor de IA | `seo-auto`, `seo-generator` (gpt-4.1-mini, 3 variantes), `seo-programatico` (660 kw) | ✅ |
| Interlinking | `seo-interlinking.service.ts` — scoring de qualidade, 24 links/página, 5 blocos | ✅ |
| Blocos de conteúdo | `seo-content-blocks.ts` — dados reais QuintoAndar/ZAP/IBGE/SELIC | ✅ |
| **Google Indexing API** | `google-indexing.service.ts` + `seo/indexing.ts` — **indexação em horas** | ✅ |
| Dashboard | `seo-programatico/page.tsx` (monitoramento) | ✅ |

### ⬜ Onde travou (pendências de execução — nunca rodadas)

1. ⬜ Seed do CSV de 1M URLs (`seed-1m-urls.ts`) — o CSV nunca foi importado
2. ⬜ Migration das colunas `conteudo_ai`, `familia_url`, `prioridade`, `indexar` em `seo_paginas`
3. ⬜ Rota `/api/v1/seo/page-content` para servir o conteúdo gerado
4. ⬜ Rodar a geração de conteúdo IA em lote (money pages primeiro)
5. ⬜ Integrar `IBGE_CITIES_152` ao `seo-cities.ts` e ao `sitemap.ts`
6. ⬜ Disparar a Google Indexing API em massa após publicação

### ❌ O buraco que você apontou agora

Todo o universo de termos hoje é **só tipos de imóvel** (casas, apês, terrenos, leilão,
construção). **Não cobre nada do produto moderno**: avaliação online, imagens/IA,
automações, CRM, pacotes, assinaturas, vendas, gestão de aluguel. Esse é o **Grupo E**
que este plano cria.

---

## 2. Grupo E — Produtos & Serviços Modernos (NOVO)

Mesmo formato `SEOCluster` de `seo-clusters.ts`, pronto para colar. Cada cluster × 152
cidades (depois × 5.570) gera páginas novas. Cobre tudo que a plataforma oferece hoje.

### Bloco E1 — Avaliação & Inteligência de Preço
| slug | keyword | schemaType |
|------|---------|-----------|
| `avaliacao-online-de-imovel` | Avaliação Online de Imóvel | Service |
| `quanto-vale-meu-imovel` | Quanto Vale Meu Imóvel | Service |
| `preco-do-metro-quadrado` | Preço do Metro Quadrado | WebPage |
| `avaliacao-de-imovel-gratis` | Avaliação de Imóvel Grátis | Service |
| `tabela-de-precos-de-imoveis` | Tabela de Preços de Imóveis | WebPage |

### Bloco E2 — Imagens, Mídia & IA Visual
| slug | keyword | schemaType |
|------|---------|-----------|
| `fotos-profissionais-de-imovel` | Fotos Profissionais de Imóvel | Service |
| `fotos-de-imovel-com-ia` | Fotos de Imóvel com IA | Service |
| `tour-virtual-360` | Tour Virtual 360° | Service |
| `video-de-imovel-com-drone` | Vídeo de Imóvel com Drone | Service |
| `home-staging-virtual` | Home Staging Virtual | Service |
| `planta-humanizada` | Planta Humanizada | Service |

### Bloco E3 — Anúncio, Portais & Captação
| slug | keyword | schemaType |
|------|---------|-----------|
| `anunciar-imovel-gratis` | Anunciar Imóvel Grátis | Service |
| `anuncio-de-imovel-com-ia` | Anúncio de Imóvel com IA | Service |
| `divulgar-imovel-em-todos-os-portais` | Divulgar em Todos os Portais (ZAP/VivaReal/OLX) | Service |
| `captacao-de-imoveis` | Captação de Imóveis | Service |
| `portal-de-imoveis` | Portal de Imóveis | WebSite |

### Bloco E4 — CRM, Automação & IA de Atendimento
| slug | keyword | schemaType |
|------|---------|-----------|
| `crm-imobiliario` | CRM Imobiliário | SoftwareApplication |
| `automacao-de-leads-imobiliarios` | Automação de Leads | SoftwareApplication |
| `atendimento-com-ia-imobiliaria` | Atendimento com IA (Tomás) | SoftwareApplication |
| `whatsapp-imobiliario-automatico` | WhatsApp Imobiliário Automático | Service |
| `funil-de-vendas-imobiliario` | Funil de Vendas Imobiliário | Service |
| `lead-scoring-imobiliario` | Lead Scoring com IA | SoftwareApplication |

### Bloco E5 — Gestão de Locação & Financeiro (LemosBank)
| slug | keyword | schemaType |
|------|---------|-----------|
| `software-para-imobiliaria` | Software para Imobiliária | SoftwareApplication |
| `sistema-de-gestao-de-aluguel` | Sistema de Gestão de Aluguel | SoftwareApplication |
| `gestao-de-carteira-de-locacao` | Gestão de Carteira de Locação | Service |
| `repasse-automatico-ao-proprietario` | Repasse Automático ao Proprietário | Service |
| `cobranca-de-aluguel-por-boleto` | Cobrança de Aluguel por Boleto | Service |
| `contrato-digital-com-assinatura` | Contrato Digital com Assinatura | Service |
| `administracao-de-imoveis` | Administração de Imóveis | Service |

### Bloco E6 — Planos, Assinaturas & Parceiros
| slug | keyword | schemaType |
|------|---------|-----------|
| `plano-para-corretor` | Plano para Corretor | Offer |
| `assinatura-corretor-autonomo` | Assinatura Corretor Autônomo | Offer |
| `plano-para-imobiliaria` | Plano para Imobiliária | Offer |
| `site-para-corretor` | Site para Corretor | Service |
| `programa-de-afiliados-imobiliario` | Programa de Afiliados | Offer |
| `seja-um-parceiro` | Seja um Parceiro AgoraEncontrei | Offer |

> **Total Grupo E:** ~34 clusters novos. Cada um herda o motor de conteúdo IA,
> interlinking e indexação já existentes. Schema novo a adicionar: `SoftwareApplication`,
> `Offer`, `Service` (parcialmente já suportados).

---

## 3. Matemática da máxima cobertura

Você escolheu **máxima cobertura**. O potencial combinatório:

```
Termos totais  = clusters imóveis (~50) + categorias (~85) + Grupo E (~34) ≈ 169 termos
Cidades        = 5.570 (IBGE completo) — hoje 152 ativas
Modificadores  = ~14 (alto-padrão, popular, MCMV, para-investidor, baixo-risco, etc.)
Bairros        = milhares (expansível por cidade)

Páginas-base   = 169 termos × 5.570 cidades            ≈ 940.000
+ modificadores= 169 × 5.570 × 14 (top clusters)       → milhões (controlado por prioridade)
+ bairros      = termos × bairros principais            → centenas de milhares
+ comparações  = C(cidades, 2) limitado a vizinhas      ≈ dezenas de milhares
─────────────────────────────────────────────────────────────────────────
ALVO PRÁTICO FASE 1: ~1.000.000 URLs indexáveis (já documentado em seo-1m-urls-integration.md)
TETO TEÓRICO:        dezenas de milhões com modificadores+bairros
```

### Guarda-corpo obrigatório dentro da "máxima cobertura"

Máxima cobertura **não** pode virar *doorway pages* (penalização do Helpful Content /
spam policy do Google = tanque o domínio inteiro). A regra que mantém escala **e**
segurança:

- **`indexar = false` por padrão** em toda página recém-criada (já há coluna `indexar`).
- Página só recebe `indexar = true` quando passa o **quality gate** já implementado em
  `seo-interlinking.service.ts`: `quality_score ≥ 65` (≥500 palavras, ≥3 FAQ, dados reais).
- Páginas sem inventário/dado real entram com **conteúdo IA contextualizado por IBGE**
  (população, PIB, renda, m² regional) → deixam de ser "rasas".
- Só aí dispara a **Google Indexing API**. Assim a escala é ilimitada, mas o Google só
  vê páginas com valor único.

---

## 4. Fases de execução

### Fase 0 — Fundação de dados (1–2 dias)
- [ ] Rodar migration: colunas `conteudo_ai`, `familia_url`, `prioridade`, `indexar` em `seo_paginas`
- [ ] Integrar `IBGE_CITIES_152` → `seo-cities.ts` + `sitemap.ts`
- [ ] `import-ibge-all-cities.ts` → subir de 152 para 5.570 cidades

### Fase 1 — Grupo E + termos modernos (2–3 dias)
- [ ] Criar `seo-clusters-modernos.ts` (Grupo E, ~34 clusters acima)
- [ ] Plugar Grupo E no gerador (`seo-programatico.service.ts`) e no `sitemap.ts`
- [ ] Adicionar schemas `SoftwareApplication` / `Offer` ao `seo-auto.service.ts`
- [ ] Semear as ~34 keywords novas × cidades (status `rascunho`, `indexar=false`)

### Fase 2 — Geração de conteúdo em escala (contínuo)
- [ ] `seed-1m-urls.ts` por família (money pages → bairros → guias → serviços → investimentos)
- [ ] `generate-seo-content-batch.ts` priorizando money pages + Grupo E
- [ ] Aplicar quality gate → flip `indexar=true` só nas aprovadas

### Fase 3 — Indexação & autoridade (contínuo)
- [ ] Disparar Google Indexing API em lote (respeitando cota 200/dia → escalar contas)
- [ ] Ativar interlinking circular (já pronto) entre todas as famílias
- [ ] Submeter sitemaps segmentados no Search Console

### Fase 4 — Monitoramento & iteração
- [ ] Dashboard: páginas publicadas, quality_score médio, status de indexação, posição
- [ ] Rank tracking vs concorrentes por keyword × cidade
- [ ] Loop: refrescar conteúdo das páginas com baixo CTR / posição

---

## 5. Lacunas técnicas a fechar (do inventário)

- Schemas faltantes: `Organization`, `LocalBusiness`, `BreadcrumbList`, `SoftwareApplication`, `Offer`
- Twitter/X card metadata ausente
- Canonical URL em algumas rotas dinâmicas
- Anchor text dos links de rodapé pouco keyword-rich
- Dashboard de performance SEO (indexação/posição) inexistente

---

## 6. Próximo passo imediato

Com o plano aprovado, a primeira entrega de código é a **Fase 1 — Grupo E**
(`seo-clusters-modernos.ts` + wiring no gerador e no sitemap), porque é a peça nova,
bem-delimitada e de maior alavancagem que você pediu nesta rodada.

> ⚠️ Nota de risco registrada: você optou por máxima cobertura. O guarda-corpo da
> Seção 3 (`indexar=false` até passar o quality gate) é o que permite escalar a milhões
> de URLs **sem** ser penalizado pelo Google. Recomendo mantê-lo ligado.

---

## 7. Status de execução

### ✅ Fase 1 — Grupo E ENTREGUE (código no ar ao fazer merge)
- `seo-clusters.ts` → novo `CLUSTERS_GROUP_E` com **31 clusters** de produtos modernos, incluído em `ALL_CLUSTERS`
- `/[estado]/[cidade]/servicos/[cluster]/page.tsx` → `SERVICOS` map estendido (12 → **43** serviços); renderiza + SSG por cidade
- `sitemap.ts` → `SERVICO_SLUGS` com os 31 novos slugs
- **Resultado:** ~31 × 152 cidades ≈ **4.700 páginas novas** já geradas; escala automática para 5.570 cidades quando `IBGE` completo for ativado
- Validado: 43 slugs únicos, sem duplicados, arquivos compilam (esbuild OK)

### ⏳ Fases que dependem de rodar contra PRODUÇÃO (não executadas autonomamente)
Estas exigem credenciais e infraestrutura viva (Neon, Redis, chaves de IA, Service
Account do Google) e o CSV de 1M URLs — não devem ser disparadas sem supervisão:

1. **Migration `seo_paginas`** (colunas `conteudo_ai`, `familia_url`, `prioridade`, `indexar`) → rodar no Neon
2. **`import-ibge-all-cities.ts`** → expandir de 152 → 5.570 cidades no banco
3. **`seed-1m-urls.ts`** → importar o CSV de 1M URLs (CSV precisa ser fornecido)
4. **`generate-seo-content-batch.ts`** → gerar conteúdo IA em lote (consome ANTHROPIC/OPENAI key)
5. **Google Indexing API** → disparar indexação em massa (Service Account)

> Quando você liberar o ambiente (ou aprovar rodar cada script), eu conduzo essas etapas
> uma a uma com o guarda-corpo de qualidade ligado.

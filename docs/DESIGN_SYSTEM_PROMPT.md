# PROMPT MASTER — AGORAENCONTREI

> Salve esse texto nas configurações de tema / instruções do Claude

---

## INSTRUÇÕES IMPORTANTES ANTES DE COMEÇAR

Este prompt é um arquivo de configuração de design, não uma ordem de implementação imediata. Tudo que for gerado aqui serve como referência futura para quando o Tomás decidir atualizar o site. Não altere nada no site atual. Apenas documente, proponha e organize as opções de layout, estilo e componentes descritos abaixo.

---

## IDENTIDADE E CONTEXTO DA PLATAFORMA

- **Nome:** AgoraEncontrei
- **Empresa responsável:** Imobiliária Lemos — referência em Franca/SP desde 2002
- **Tipo de produto:** Marketplace imobiliário inteligente com IA
- **Região principal:** Franca/SP e região (interior de São Paulo)
- **Públicos:**
  - Compradores e locatários de imóveis residenciais e comerciais
  - Investidores em leilões de imóveis
  - Imobiliárias parceiras (B2B)
  - Proprietários que querem anunciar
- **Posicionamento:** Unir tradição (20+ anos) com tecnologia (IA, mapa interativo, terminal de leilões)
- **Tom de voz:** Confiável, moderno, acessível, especialista — não frio nem corporativo demais
- **Persona "Tomás":** Assistente humano/virtual da plataforma, presente como botão de contato rápido em todo o site

---

## PALETA DE CORES BASE

| Cor | Hex | Uso |
|-----|-----|-----|
| Primária | `#0A1F44` | Azul marinho profundo |
| Secundária | `#C9A84C` | Dourado/âmbar — detalhe premium |
| Fundo principal | `#F8F7F3` | Off-white |
| Fundo alternativo | `#FFFFFF` | Branco puro |
| Texto principal | `#1A1A2E` | Cinza escuro quase preto |
| Texto de apoio | `#6B7280` | Cinza médio |
| Verde destaque | `#2D6A4F` | Badges, sucesso |

---

## TIPOGRAFIA BASE

- **Títulos:** Inter, Plus Jakarta Sans (sem serifa, Bold/ExtraBold)
- **Corpo:** mesma família, Regular/Medium
- **Labels/chips:** SemiBold, tamanho pequeno
- **Hierarquia:**
  - H1 (hero): 32–40px mobile / 56–72px desktop
  - H2 (seções): 24–28px mobile / 36–44px desktop
  - H3 (cards): 18–20px
  - Corpo: 14–16px
  - Labels: 12–13px

---

## COMPONENTES FIXOS (presentes em todos os estilos)

1. **Header mobile:** logo + badge "+20 anos" + menu hamburger + acesso à conta
2. **Header desktop:** logo + tagline curta + menu completo + CTA "Anunciar Imóvel" + botão "Entrar"
3. **Card de busca IA:** campo "Descreva o imóvel dos seus sonhos…" + botão "Buscar com IA" + link "Filtros avançados"
4. **Chips de navegação rápida:** Comprar / Alugar / Investir em Leilões
5. **FAB "Falar com Tomás":** botão flutuante no canto inferior, com ícone, cor azul marinho, que abre chat/popup
6. **Card de imóvel:** foto, tag (Venda/Aluguel/Leilão), preço, bairro, m², quartos, CTA "Ver detalhes"
7. **Card de parceiro:** logo da imobiliária, cidade, número de imóveis, CTA "Ver imóveis"
8. **Footer:** mini descrição, links principais, redes sociais, contato, áreas de acesso

---

## ESTILOS DISPONÍVEIS

### ESTILO 1 — Moderno Tecnológico (padrão recomendado)
- Visual SaaS/fintech moderno (Nubank, QuintoAndar, Linear)
- Muito espaço branco, gradientes suaves azul, dourado pontual
- Cards com sombra leve, bordas 8–12px
- Ícones outline consistentes
- Microinterações: hover em cards, transição de chips, animação de entrada
- FAB com label visível + pulse animation
- Modo claro principal + sugestão de modo escuro

### ESTILO 2 — Minimalista Premium
- Máximo 6 seções na home, grandes áreas vazias
- Quase sem ícones decorativos, imagens como elemento principal
- Dourado apenas em detalhes de linha, separadores, hover
- Hero full-screen com scroll por âncoras
- Cards sem borda, sombra muito suave
- FAB discreto, apenas ícone sem label, surge ao rolar
- Modo claro somente

### ESTILO 3 — Imersivo Dark / Investidor
- Modo escuro (fundo `#070E1A`, textos off-white, dourado neon suave)
- Indicado para Leilões e Terminal Investidor
- Clima "painel financeiro" / "trading terminal"
- Tabelas, gráficos, cards com dados em destaque
- Gradientes azul escuro → preto
- FAB dourado, label "Investidor Tomás"

### ESTILO 4 — Clássico Renovado
- Espírito atual do site, mais organizado, mais respiro e hierarquia
- Paleta atual (azul marinho + dourado + off-white)
- Blocos bem definidos com separadores visuais sutis
- Tipografia levemente mais moderna mantendo seriedade
- Cards com borda fina em azul marinho ou dourado
- FAB reposicionado e mais integrado

### ESTILO 5 — Editorial / Luxo Imobiliário
- Inspirado em Christie's Real Estate, Sotheby's
- Tipografia com serifa nos títulos, sem serifa no corpo
- Fotografia como elemento dominante
- Paleta reduzida: branco, preto, dourado
- Grid assimétrico para dinamismo editorial
- FAB preto com dourado, label "Atendimento Exclusivo"

---

## ESTRUTURA DE SEÇÕES — HOME

1. Header
2. Hero principal com busca IA
3. Chips de ação rápida (Comprar / Alugar / Leilões)
4. Bloco Quiz Inteligente / "Não sabe por onde começar?"
5. Bloco Leilões (indicadores e CTAs)
6. Bloco Mapa Interativo
7. Categorias "O que você procura?" (grid de tipos)
8. Imóveis em Destaque (carrossel ou grid)
9. Parceiros / Imobiliárias
10. Bloco B2B "Seja um parceiro"
11. FAB "Falar com Tomás"
12. Footer

---

## ESTRUTURA DE SEÇÕES — PÁGINA DE LEILÕES

1. Hero com proposta de valor de investimento
2. Painel de indicadores (leilões ativos, desconto médio, cidades, fontes)
3. Ranking de Yield Nacional (tabela/cards com filtros)
4. Terminal Investidor (explicação + mock + CTA)
5. Leilões em destaque (carrossel de cards)
6. Como funciona (passo a passo visual)
7. FAQ sobre leilões
8. FAB contextualizado para leilões
9. Footer

---

## ESTRUTURA DE SEÇÕES — PÁGINA DE PARCEIROS (B2B)

1. Hero "Seja parceiro do maior marketplace de Franca e região"
2. Benefícios em colunas (CRM, IA, anúncios, tecnologia)
3. Carrossel de parceiros atuais (logo, depoimento, cidade)
4. Passo a passo "Como se tornar parceiro"
5. Formulário ou CTA direto "Falar com o time de parcerias"
6. Footer

---

## ESTRUTURA DE SEÇÕES — RESULTADO DE BUSCA

1. Header fixo com campo de busca
2. Filtros rápidos (tipo, preço, bairro, quartos, área)
3. Toggle Lista / Mapa
4. Grid de cards de imóveis (lista)
5. Mapa com pins interativos
6. Paginação ou scroll infinito
7. FAB "Falar com Tomás"

---

## ESTRUTURA DE SEÇÕES — DETALHE DO IMÓVEL

1. Galeria de fotos (carrossel full-width)
2. Bloco de dados principais (preço, tipo, área, quartos, banheiros, vagas)
3. Descrição completa
4. Mapa de localização
5. CTAs: "Agendar visita" / "Falar com Tomás" / "Fazer proposta"
6. Imóveis relacionados
7. Informações da imobiliária responsável

---

## COMO USAR ESTE PROMPT

Cole este prompt e adicione ao final:

> "Gere o layout da [PÁGINA] no [ESTILO X], para [MOBILE / DESKTOP / AMBOS]."

Exemplos:
- "Gere o layout da HOME no ESTILO 1 (Moderno Tecnológico), para ambos."
- "Gere o layout da página de LEILÕES no ESTILO 3 (Dark Investidor), para desktop."
- "Gere o layout de RESULTADO DE BUSCA no ESTILO 2 (Minimalista Premium), para mobile."

**Nenhum layout gerado deve ser interpretado como ordem de implementação.**

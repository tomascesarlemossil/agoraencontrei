# PARTE 3: ANÁLISE DAS PLATAFORMAS DE LEILÃO NO BRASIL

## Como o LeilaoImovel Obtém Dados em Tempo Real

### Método Principal: Web Scraping Automatizado (Crawlers/Robôs)
- Robôs visitam **diariamente** 400-800+ sites de leiloeiros
- Cada leiloeiro tem seu próprio site com estrutura HTML diferente
- **NÃO EXISTE API unificada** dos tribunais ou leiloeiros brasileiros
- O ecossistema é altamente fragmentado

### Fontes de Dados (por ordem de importância)
1. **Sites de leiloeiros oficiais** - Crawlers extraem: tipo, datas (1ª e 2ª praça), valores, matrícula, edital, fotos, localização
2. **Portais bancários de imóveis retomados** - Caixa, Santander, Bradesco, BB, Daycoval
3. **Sistemas judiciais (Tribunais de Justiça)** - TJSP, TJDFT, TRT, etc.
4. **Diário Oficial** - Editais publicados obrigatoriamente (fonte secundária/validação)

### Framework Legal
- CPC arts. 882 e 887 exigem ampla publicidade dos editais
- ABRAIM publicou artigo "A Legalidade dos Agregadores de Leilão no Brasil" confirmando a prática
- Resolução CNJ 236/2016 regula leilões eletrônicos mas NÃO fornece API unificada

### Dados Coletados por Scraper
- Tipo do imóvel, endereço, cidade, estado
- Nome e site do leiloeiro
- Datas de leilão (1ª praça, 2ª praça)
- Valores (avaliação, lance mínimo 1ª/2ª praça)
- Percentual de desconto
- Judicial vs extrajudicial
- Ocupado vs desocupado
- Matrícula, nº processo
- Edital (link/PDF)
- Fotos
- Elegibilidade para financiamento

### Ferramentas Open-Source Disponíveis
- GitHub: scrapers targeting Caixa, Zuk, Lance Judicial
- Apify marketplace: APIs de scraping prontas (Caixa Leilões API, Zuk Leilões API)
- 99freelas: projetos freelance de scraping de leilões

---

## Análise por Plataforma

### 1. LeilaoImovel (leilaoimovel.com.br)
**Empresa:** Digital Brokers Tecnologia Imobiliária LTDA (fundada Nov/2019)
- **Maior site agregador de leilões do Brasil**
- 400-800+ leiloeiros | 23 estados
- Credenciado Caixa Econômica Federal
- **Features:** Mapa interativo, filtros avançados (judicial/extrajudicial, financiamento, consórcio), app mobile com push, favoritos, rede de corretores credenciados
- **Monetização:** Gratuito (busca) + Auket PRO (ferramentas avançadas) + comissões de corretagem
- **Integração com Auket** (mesma empresa)

### 2. SpyLeilões (spyleiloes.com.br)
**Fundador:** Luis Kurihara (início em Ribeirão Preto, expandiu nacional)
- Usa "Robôs/IA criados por seus programadores" 
- 99.9% de cobertura dos leiloeiros brasileiros
- **Features:** Filtros avançados, mapa Google Maps, alertas WhatsApp em tempo real, calculadora de viabilidade, dashboard de lucros, export Excel
- **Preço:** R$197/mês (mensal) | R$99/mês (anual) - inclui curso + Excel export
- **Diferencial:** Alertas nativos via WhatsApp

### 3. BidMap (bidmap.com.br)
**Fundada:** Agosto 2019, Londrina/PR
- 50.000+ imóveis de 600-900+ leiloeiros
- **Features:** Mapa interativo como interface PRINCIPAL, filtros, checklist dinâmico, calculadora de viabilidade, dados de leilões ENCERRADOS (inteligência de mercado), alertas
- **Preço:** Freemium + BidMapPRO
- **Diferencial:** Map-first UX + dados de leilões fechados para pesquisa de mercado

### 4. Auket (auket.com.br)
**Empresa:** Digital Brokers (mesma do LeilaoImovel)
- Voltada para investidores profissionais/institucionais
- **Features:** Maior base de dados atualizada diariamente, filtros por matrícula e nº processo, análise financeira (ROI, TIR, valor de venda, lance máximo), **gestão de portfólio Kanban**, log de atividades, divisão de despesas entre sócios, relatórios customizados, integração "Processo Rápido" para documentos judiciais (R$6/doc), alertas WhatsApp + email
- **Preço:** Solo R$89.90/mês (R$75.90 anual) | Plus R$179.90/mês (R$149.90 anual)
- **Diferencial:** Portfolio management com Kanban + análise financeira profissional

### 5. Outros Players Relevantes

| Plataforma | Tipo | Escala | Diferencial |
|-----------|------|--------|-------------|
| **Zukerman/Zuk** | Leiloeiro real | 35+ anos | Parceiro Bradesco, Santander, BB; auditório virtual |
| **Mega Leilões** | Leiloeiro real | 40.000+ leilões | Homologado judicialmente; multi-categoria |
| **SOLD/Superbid** | Leiloeiro real | Maior da LatAm | 3M+ visitas/mês, 8.000+ empresas, 1M+ compradores |
| **Núcleo Leilões** | Agregador | 800+ leiloeiros | 45.000+ imóveis; judicial, extrajudicial, trabalhista |
| **Spot Leilões** | Agregador | 800+ leiloeiros | Apenas leiloeiros verificados |
| **Mapa do Leilão** | Agregador | - | Mapas + alertas; também veículos |
| **Monitor Leilão** | Agregador | - | Alertas diários + serviço de desocupação |
| **Pro Leilão** | Agregador+Tools | - | Calculadoras, templates documentos; R$568.80/ano |

---

## Oportunidade para o AgoraEncontrei

### Por que entrar no mercado de leilões?
1. **Margem alta**: Imóveis de leilão têm desconto de 30-80% sobre valor de mercado
2. **Crescimento explosivo**: Mercado de leilões cresce 20%+ ao ano no Brasil
3. **Diferenciação**: Nenhum marketplace tradicional (ZAP, OLX, VivaReal) agrega leilões
4. **Sinergia**: CRM + leilões = pipeline completo para investidores
5. **Dados exclusivos**: Scraping pode ser barreira de entrada

### O que precisamos construir
1. **Sistema de scraping** - Crawlers para 400+ sites de leiloeiros + portais bancários
2. **Parser/normalizador** - Converter HTML diverso em schema unificado
3. **Atualização diária** - Jobs BullMQ para scraping automatizado
4. **Mapa de leilões** - Leaflet com clusters (já temos Leaflet no stack!)
5. **Calculadora de viabilidade** - ROI, TIR, valor de mercado estimado
6. **Alertas** - WhatsApp (já temos Meta API!) + email + push
7. **Análise financeira** - Dashboard de investimento por imóvel
8. **Integração com CRM** - Lead de leilão → Deal → Comissão

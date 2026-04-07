/**
 * SEO Programático — Motor de Geração de Páginas
 *
 * Gera páginas SEO combinando keywords x cidades para cobertura nacional.
 * Usa dados reais do IBGE + conteúdo IA contextualizado.
 */

import { slugify } from '../utils/slugify.js'

export interface IbgeMunicipio {
  id: number
  nome: string
  microrregiao: {
    mesorregiao: {
      UF: {
        sigla: string
        nome: string
        regiao: {
          nome: string
          sigla: string
        }
      }
    }
  }
}

export async function fetchMunicipiosIBGE(): Promise<IbgeMunicipio[]> {
  const response = await fetch(
    'https://servicodados.ibge.gov.br/api/v1/localidades/municipios'
  )
  if (!response.ok) throw new Error('Falha ao consultar API do IBGE')
  return response.json() as Promise<IbgeMunicipio[]>
}

export function buildSeoPageData(keyword: string, cidade: string, uf: string) {
  const slug = slugify(`${keyword}-${cidade}-${uf}`)

  const capitalize = (t: string) =>
    t.replace(/\b\w/g, (c) => c.toUpperCase())

  const keywordCap = capitalize(keyword)
  const cidadeCap = capitalize(cidade)

  return {
    slug,
    titulo: `${keywordCap} em ${cidadeCap} ${uf.toUpperCase()} | AgoraEncontrei`,
    h1: `${keywordCap} em ${cidadeCap} - ${uf.toUpperCase()}`,
    meta_title: `${keywordCap} em ${cidadeCap} ${uf.toUpperCase()} — Melhores Oportunidades | AgoraEncontrei`,
    meta_description: `Encontre ${keyword.toLowerCase()} em ${cidadeCap} ${uf.toUpperCase()}. Compare opções, preços e detalhes de imóveis. Oportunidades verificadas no AgoraEncontrei.`,
    intro: `Explore as melhores oportunidades de ${keyword.toLowerCase()} em ${cidadeCap}, ${uf.toUpperCase()}. No AgoraEncontrei, você encontra opções verificadas, com informações detalhadas sobre preços, localização e condições de pagamento.`,
    faq: [
      {
        pergunta: `Como encontrar ${keyword.toLowerCase()} em ${cidadeCap} ${uf.toUpperCase()}?`,
        resposta: `No AgoraEncontrei você pode comparar anúncios, localização, faixa de preço e detalhes do imóvel para identificar as melhores oportunidades em ${cidadeCap}.`,
      },
      {
        pergunta: `Quais os preços de ${keyword.toLowerCase()} em ${cidadeCap}?`,
        resposta: `Os preços variam conforme localização, tamanho e estado de conservação. Acesse os anúncios para ver valores atualizados e condições de financiamento.`,
      },
      {
        pergunta: `Vale a pena investir em ${keyword.toLowerCase()} em ${cidadeCap} ${uf.toUpperCase()}?`,
        resposta: `${cidadeCap} ${uf.toUpperCase()} pode oferecer ótimas oportunidades dependendo da localização e do potencial de valorização. Analise os dados do mercado local antes de decidir.`,
      },
      {
        pergunta: `Como financiar ${keyword.toLowerCase()} em ${cidadeCap}?`,
        resposta: `Existem diversas opções de financiamento bancário, incluindo Caixa, Bradesco, Itaú e Santander. Use nosso simulador para comparar taxas e prazos.`,
      },
      {
        pergunta: `O AgoraEncontrei é confiável para buscar ${keyword.toLowerCase()}?`,
        resposta: `Sim. O AgoraEncontrei é um marketplace verificado com imóveis de imobiliárias credenciadas, parceiros e leilões oficiais.`,
      },
    ],
  }
}

/**
 * Prompt para IA gerar conteúdo SEO contextualizado.
 * Pode ser usado com Anthropic, OpenAI, ou qualquer LLM.
 */
export function buildSeoPrompt(keyword: string, cidade: string, uf: string): string {
  return `Atue como um especialista em investimentos imobiliários local.
Crie um conteúdo único, natural e útil para SEO sobre "${keyword}" na cidade de ${cidade} - ${uf}.

Use termos específicos da região de ${cidade}. Não use introduções clichês como "No mundo de hoje..." ou "Nos últimos anos...".
Vá direto ao ponto sobre por que investir em ${keyword} em ${cidade} é estrategicamente vantajoso.

Inclua:
- Visão geral do mercado imobiliário local de ${cidade}
- Oportunidades específicas de ${keyword} na região
- Dicas práticas para quem busca ${keyword} em ${cidade}
- Benefícios e cuidados ao comprar/investir
- Bairros recomendados (se aplicável)
- Conclusão objetiva com call-to-action

Texto entre 600 e 1000 palavras, evitando repetição e linguagem robótica.
Use parágrafos curtos e subtítulos em markdown (##).
NÃO inclua título H1 no início — ele já existe na página.`
}

// ── Keywords Master List ──────────────────────────────────────────────────────
// 300+ keywords reais de alta conversão para SEO imobiliário

export const SEO_KEYWORDS: [string, string][] = [
  // === VENDA GERAL ===
  ['imoveis a venda', 'venda'],
  ['casas a venda', 'venda'],
  ['apartamentos a venda', 'venda'],
  ['terrenos a venda', 'venda'],
  ['sobrados a venda', 'venda'],
  ['kitnet a venda', 'venda'],
  ['cobertura a venda', 'venda'],
  ['flat a venda', 'venda'],
  ['duplex a venda', 'venda'],
  ['triplex a venda', 'venda'],
  ['studio a venda', 'venda'],
  ['loft a venda', 'venda'],
  ['sala comercial a venda', 'venda'],
  ['ponto comercial a venda', 'venda'],
  ['galpao a venda', 'venda'],
  ['galpao industrial a venda', 'venda'],
  ['predio comercial a venda', 'venda'],
  ['imovel comercial a venda', 'venda'],

  // === ALUGUEL ===
  ['casas para alugar', 'aluguel'],
  ['apartamentos para alugar', 'aluguel'],
  ['kitnet para alugar', 'aluguel'],
  ['sala comercial para alugar', 'aluguel'],
  ['galpao para alugar', 'aluguel'],
  ['ponto comercial para alugar', 'aluguel'],
  ['imoveis para alugar', 'aluguel'],
  ['flat para alugar', 'aluguel'],
  ['sobrado para alugar', 'aluguel'],
  ['studio para alugar', 'aluguel'],
  ['loft para alugar', 'aluguel'],
  ['cobertura para alugar', 'aluguel'],
  ['imovel comercial para alugar', 'aluguel'],
  ['loja para alugar', 'aluguel'],

  // === OPORTUNIDADE ===
  ['imoveis baratos', 'oportunidade'],
  ['imoveis em promocao', 'oportunidade'],
  ['oportunidade de imoveis', 'oportunidade'],
  ['imoveis abaixo do mercado', 'oportunidade'],
  ['imoveis com desconto', 'oportunidade'],
  ['imoveis de ocasiao', 'oportunidade'],
  ['imoveis para investir', 'oportunidade'],
  ['investimento imobiliario', 'oportunidade'],
  ['imoveis para renda', 'oportunidade'],
  ['imoveis retomados', 'oportunidade'],

  // === LEILAO ===
  ['leilao de imoveis', 'leilao'],
  ['leilao judicial de imoveis', 'leilao'],
  ['leilao extrajudicial de imoveis', 'leilao'],
  ['imoveis caixa', 'leilao'],
  ['imoveis caixa economica', 'leilao'],
  ['leilao caixa', 'leilao'],
  ['leilao banco do brasil', 'leilao'],
  ['leilao bradesco', 'leilao'],
  ['leilao itau', 'leilao'],
  ['leilao santander', 'leilao'],
  ['imoveis de leilao', 'leilao'],
  ['leilao online de imoveis', 'leilao'],
  ['hasta publica imoveis', 'leilao'],
  ['arrematacao de imoveis', 'leilao'],
  ['imoveis retomados caixa', 'leilao'],
  ['imoveis retomados bancos', 'leilao'],

  // === FINANCIAMENTO ===
  ['casas para financiar', 'financiamento'],
  ['apartamentos para financiar', 'financiamento'],
  ['imoveis para financiar', 'financiamento'],
  ['financiamento imobiliario', 'financiamento'],
  ['financiamento caixa', 'financiamento'],
  ['financiamento minha casa minha vida', 'financiamento'],
  ['financiamento habitacional', 'financiamento'],
  ['simulador de financiamento', 'financiamento'],
  ['taxa de financiamento imobiliario', 'financiamento'],
  ['credito imobiliario', 'financiamento'],
  ['consorcio de imoveis', 'financiamento'],
  ['carta de credito imobiliario', 'financiamento'],
  ['fgts para comprar imovel', 'financiamento'],
  ['subsidio minha casa minha vida', 'financiamento'],

  // === TIPO ESPECIFICO ===
  ['casa com piscina', 'tipo'],
  ['casa em condominio fechado', 'tipo'],
  ['casa terrea', 'tipo'],
  ['casa com quintal', 'tipo'],
  ['casa de esquina', 'tipo'],
  ['casa nova', 'tipo'],
  ['casa reformada', 'tipo'],
  ['casa com edicula', 'tipo'],
  ['casa com varanda gourmet', 'tipo'],
  ['apartamento com varanda', 'tipo'],
  ['apartamento mobiliado', 'tipo'],
  ['apartamento novo', 'tipo'],
  ['apartamento compacto', 'tipo'],
  ['apartamento garden', 'tipo'],
  ['apartamento alto padrao', 'tipo'],
  ['apartamento na planta', 'tipo'],
  ['terreno em condominio', 'tipo'],
  ['terreno comercial', 'tipo'],
  ['terreno plano', 'tipo'],
  ['terreno de esquina', 'tipo'],

  // === RURAL ===
  ['chacara a venda', 'rural'],
  ['sitio a venda', 'rural'],
  ['fazenda a venda', 'rural'],
  ['rancho a venda', 'rural'],
  ['chacara para alugar', 'rural'],
  ['sitio para alugar', 'rural'],
  ['area rural a venda', 'rural'],
  ['terreno rural a venda', 'rural'],

  // === QUARTOS ===
  ['casa 2 quartos', 'quartos'],
  ['casa 3 quartos', 'quartos'],
  ['casa 4 quartos', 'quartos'],
  ['apartamento 1 quarto', 'quartos'],
  ['apartamento 2 quartos', 'quartos'],
  ['apartamento 3 quartos', 'quartos'],
  ['apartamento 4 quartos', 'quartos'],
  ['casa com suite', 'quartos'],
  ['apartamento com suite', 'quartos'],

  // === FAIXA DE PRECO ===
  ['imoveis ate 100 mil', 'preco'],
  ['imoveis ate 150 mil', 'preco'],
  ['imoveis ate 200 mil', 'preco'],
  ['imoveis ate 300 mil', 'preco'],
  ['imoveis ate 500 mil', 'preco'],
  ['imoveis de luxo', 'preco'],
  ['imoveis alto padrao', 'preco'],
  ['imoveis populares', 'preco'],
  ['casa popular', 'preco'],

  // === SERVIÇOS IMOBILIÁRIOS ===
  ['imobiliaria', 'servico'],
  ['corretor de imoveis', 'servico'],
  ['avaliacao de imoveis', 'servico'],
  ['consultoria imobiliaria', 'servico'],
  ['administracao de imoveis', 'servico'],
  ['administradora de condominios', 'servico'],
  ['vistoria de imoveis', 'servico'],
  ['documentacao imobiliaria', 'servico'],
  ['escritura de imovel', 'servico'],
  ['registro de imovel', 'servico'],
  ['inventario de imoveis', 'servico'],
  ['usucapiao', 'servico'],
  ['regularizacao de imoveis', 'servico'],
  ['laudo de avaliacao imobiliaria', 'servico'],

  // === CONSTRUÇÃO ===
  ['casas em construcao', 'construcao'],
  ['apartamento em construcao', 'construcao'],
  ['lancamento imobiliario', 'construcao'],
  ['empreendimento imobiliario', 'construcao'],
  ['condominio em construcao', 'construcao'],
  ['imovel na planta', 'construcao'],
  ['construtora', 'construcao'],
  ['incorporadora', 'construcao'],

  // === LOCALIZAÇÃO ===
  ['imoveis no centro', 'localizacao'],
  ['imoveis perto do metro', 'localizacao'],
  ['imoveis perto de escola', 'localizacao'],
  ['imoveis perto de shopping', 'localizacao'],
  ['imoveis perto de hospital', 'localizacao'],
  ['imoveis em bairro nobre', 'localizacao'],
  ['imoveis em area rural', 'localizacao'],
  ['imoveis na praia', 'localizacao'],
  ['imoveis no litoral', 'localizacao'],

  // === MERCADO ===
  ['mercado imobiliario', 'mercado'],
  ['preco do metro quadrado', 'mercado'],
  ['valorizacao de imoveis', 'mercado'],
  ['tendencia imobiliaria', 'mercado'],
  ['indice fipezap', 'mercado'],
  ['custo de vida', 'mercado'],

  // === TEMPORADA ===
  ['aluguel por temporada', 'temporada'],
  ['casa de temporada', 'temporada'],
  ['apartamento de temporada', 'temporada'],
  ['imovel para temporada', 'temporada'],
  ['airbnb', 'temporada'],

  // === REFORMA ===
  ['imovel para reformar', 'reforma'],
  ['casa para reformar', 'reforma'],
  ['apartamento para reformar', 'reforma'],
  ['reforma de imovel', 'reforma'],
  ['custo de reforma', 'reforma'],

  // === CONDOMÍNIO ===
  ['condominio fechado', 'condominio'],
  ['condominio de casas', 'condominio'],
  ['condominio de lotes', 'condominio'],
  ['condominio com lazer', 'condominio'],
  ['condominio com seguranca', 'condominio'],
  ['taxa de condominio', 'condominio'],

  // === JURÍDICO ===
  ['direito imobiliario', 'juridico'],
  ['advogado imobiliario', 'juridico'],
  ['contrato de compra e venda', 'juridico'],
  ['contrato de aluguel', 'juridico'],
  ['despejo de inquilino', 'juridico'],
  ['lei do inquilinato', 'juridico'],
  ['distrato imobiliario', 'juridico'],

  // === IPTU / IMPOSTOS ===
  ['iptu', 'imposto'],
  ['itbi', 'imposto'],
  ['imposto sobre imovel', 'imposto'],
  ['isencao de iptu', 'imposto'],
  ['calculo iptu', 'imposto'],
  ['certidao negativa de imovel', 'imposto'],

  // === DECORAÇÃO / ARQUITETURA ===
  ['arquitetura', 'decoracao'],
  ['decoracao de interiores', 'decoracao'],
  ['paisagismo', 'decoracao'],
  ['projeto de interiores', 'decoracao'],
  ['design de interiores', 'decoracao'],

  // === ENGENHARIA ===
  ['engenharia civil', 'engenharia'],
  ['laudo tecnico', 'engenharia'],
  ['projeto estrutural', 'engenharia'],
  ['topografia', 'engenharia'],
  ['desmembramento de terreno', 'engenharia'],

  // === SEGURO ===
  ['seguro residencial', 'seguro'],
  ['seguro de imovel', 'seguro'],
  ['seguro incendio', 'seguro'],
  ['seguro condominio', 'seguro'],

  // === MUDANÇA ===
  ['mudanca', 'mudanca'],
  ['empresa de mudanca', 'mudanca'],
  ['frete de mudanca', 'mudanca'],

  // === ENERGIA / SUSTENTABILIDADE ===
  ['energia solar residencial', 'sustentabilidade'],
  ['casa sustentavel', 'sustentabilidade'],
  ['certificacao leed', 'sustentabilidade'],
  ['imovel sustentavel', 'sustentabilidade'],

  // === LOTEAMENTO ===
  ['loteamento', 'loteamento'],
  ['lotes a venda', 'loteamento'],
  ['loteamento aberto', 'loteamento'],
  ['loteamento fechado', 'loteamento'],
  ['terreno em loteamento', 'loteamento'],

  // === COWORKING / COMERCIAL ===
  ['coworking', 'comercial'],
  ['escritorio para alugar', 'comercial'],
  ['sala comercial', 'comercial'],
  ['conjunto comercial', 'comercial'],
  ['andar corporativo', 'comercial'],

  // === PERMUTA ===
  ['permuta de imoveis', 'permuta'],
  ['troca de imoveis', 'permuta'],
  ['imovel aceita permuta', 'permuta'],

  // === PRIMEIRO IMOVEL ===
  ['primeiro imovel', 'primeiro_imovel'],
  ['como comprar primeiro imovel', 'primeiro_imovel'],
  ['dicas para comprar imovel', 'primeiro_imovel'],
  ['guia compra de imovel', 'primeiro_imovel'],
  ['checklist compra de imovel', 'primeiro_imovel'],

  // === HERANÇA ===
  ['imovel de heranca', 'heranca'],
  ['partilha de imovel', 'heranca'],
  ['inventario imobiliario', 'heranca'],

  // === ACESSIBILIDADE ===
  ['imovel acessivel', 'acessibilidade'],
  ['casa adaptada pcd', 'acessibilidade'],
  ['apartamento terreo', 'acessibilidade'],

  // === PET FRIENDLY ===
  ['imovel aceita pet', 'pet'],
  ['condominio pet friendly', 'pet'],
  ['apartamento aceita animais', 'pet'],

  // === GARAGEM ===
  ['imovel com 2 vagas', 'garagem'],
  ['imovel com 3 vagas', 'garagem'],
  ['casa com garagem', 'garagem'],
  ['apartamento com garagem', 'garagem'],

  // === MOBILIADO ===
  ['imovel mobiliado', 'mobiliado'],
  ['casa mobiliada', 'mobiliado'],
  ['apartamento mobiliado a venda', 'mobiliado'],
  ['apartamento semi mobiliado', 'mobiliado'],

  // === NOVO / USADO ===
  ['imovel novo', 'estado'],
  ['imovel usado', 'estado'],
  ['imovel seminovo', 'estado'],
  ['imovel pronto para morar', 'estado'],

  // === IDOSOS ===
  ['imovel para idoso', 'idoso'],
  ['casa terrea para idoso', 'idoso'],
  ['condominio para terceira idade', 'idoso'],

  // === ESTUDANTE ===
  ['kitnet para estudante', 'estudante'],
  ['republica', 'estudante'],
  ['apartamento perto da faculdade', 'estudante'],

  // === SEGURANÇA ===
  ['bairro seguro', 'seguranca'],
  ['condominio com portaria 24h', 'seguranca'],
  ['imovel em condominio com camera', 'seguranca'],

  // === LAZER ===
  ['condominio com piscina', 'lazer'],
  ['condominio com academia', 'lazer'],
  ['condominio com churrasqueira', 'lazer'],
  ['condominio com playground', 'lazer'],
  ['condominio com quadra', 'lazer'],
  ['condominio com salao de festas', 'lazer'],

  // === KEYWORDS LONG TAIL ALTO VALOR ===
  ['comprar casa com fgts', 'longtail'],
  ['como usar fgts para comprar imovel', 'longtail'],
  ['melhor bairro para morar', 'longtail'],
  ['qual melhor investimento imobiliario', 'longtail'],
  ['como avaliar um imovel', 'longtail'],
  ['como negociar preco de imovel', 'longtail'],
  ['documentos para comprar imovel', 'longtail'],
  ['custo cartorio compra imovel', 'longtail'],
  ['quanto custa escritura de imovel', 'longtail'],
  ['como funciona leilao de imovel', 'longtail'],
  ['riscos de comprar imovel em leilao', 'longtail'],
  ['como participar de leilao de imoveis', 'longtail'],
  ['vantagens de comprar imovel na planta', 'longtail'],
  ['quando vale a pena alugar ou comprar', 'longtail'],
  ['rentabilidade aluguel de imovel', 'longtail'],
  ['como calcular valor de aluguel', 'longtail'],
]

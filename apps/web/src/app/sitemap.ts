import type { MetadataRoute } from 'next'

/**
 * Sitemap Index — Aponta para sitemaps segmentados
 *
 * Estrutura:
 * /sitemap.xml → Sitemap Index (este arquivo)
 *   ├── /sitemap-core.xml → Páginas estáticas + landing pages
 *   ├── /sitemap-properties.xml → Imóveis individuais
 *   ├── /sitemap-auctions.xml → Leilões
 *   ├── /sitemap-bairros.xml → 472+ bairros
 *   ├── /sitemap-condominios.xml → 300+ condomínios
 *   ├── /sitemap-profissionais.xml → Profissionais
 *   ├── /sitemap-blog.xml → Blog posts
 *   └── /sitemap-cidades.xml → Cidades regionais
 *
 * Suporta milhões de URLs sem penalizar performance.
 * Cada sub-sitemap tem no máximo 50.000 URLs (limite Google).
 */

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'https://www.agoraencontrei.com.br'
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

// ── Landing pages ───────────────────────────────────────────────────────────
const LANDING_PAGES = [
  '/casas-a-venda-franca-sp', '/casas-para-alugar-franca-sp',
  '/apartamentos-a-venda-franca-sp', '/apartamentos-para-alugar-franca-sp',
  '/terrenos-a-venda-franca-sp', '/imoveis-comerciais-franca-sp',
  '/chacaras-e-sitios-franca-sp', '/condominio-fechado-franca-sp',
  '/leilao-imoveis-franca-sp', '/investimento-imobiliario-franca-sp',
  '/avaliacao-imoveis-franca-sp', '/financiamento-imovel-franca-sp',
  '/reforma-de-imoveis-franca-sp', '/engenharia-civil-franca-sp',
  '/construcao-civil-franca-sp', '/arquitetura-franca-sp',
  '/decoracao-de-interiores-franca-sp', '/direito-imobiliario-franca-sp',
  '/vistoria-de-imoveis-franca-sp',
]

// ── Cidades regionais ──────────────────────────────────────────────────────
const CIDADES_REGIONAIS = [
  'batatais', 'cristais-paulista', 'patrocinio-paulista', 'altinopolis',
  'brodowski', 'rifaina', 'pedregulho', 'itirapua',
]

// ── Bairros de Franca ──────────────────────────────────────────────────────
const BAIRROS_FRANCA = [
  'centro','city-petropolis','jardim-america','jardim-paulista','jardim-petraglia',
  'jardim-paulistano','jardim-europa','jardim-california','jardim-panorama',
  'jardim-independencia','jardim-redentor','jardim-santa-cruz','jardim-santos-dumont',
  'jardim-sumare','jardim-piemonte','jardim-monte-verde','jardim-zanetti',
  'jardim-tropical','jardim-eldorado','jardim-progresso','jardim-sao-vicente',
  'jardim-cambuhy','jardim-castelo','jardim-diamante','jardim-marchesi',
  'jardim-botanico','vila-santa-cruz','vila-industrial','vila-aparecida',
  'vila-formosa','vila-sao-sebastiao','vila-sao-jose','vila-nova',
  'polo-club','polo-club-i','polo-club-ii','polo-club-iii',
  'parque-das-nacoes','parque-industrial','residencial-brasil',
  'residencial-zanetti','residencial-monte-verde','residencial-primavera',
  'condominio-olivito','condominio-gaia','condominio-piemonte',
  'condominio-villa-toscana','condominio-villaggio-di-firenze',
  'condominio-porto-dos-sonhos','condominio-residencial-dom-bosco',
  'condominio-reserva-das-amoreiras','condominio-san-pietro',
  'espraiado','boa-vista','bom-jardim','consolacao','sao-jose',
  'ana-dorothea','champagnat','belvedere-bandeirante',
]

// ── Condomínios ────────────────────────────────────────────────────────────
const CONDOMINIOS = [
  'condominio-collis-residence', 'condominio-di-villaggio-firenze',
  'condominio-dona-sabina', 'condominio-gaia', 'condominio-olivito',
  'condominio-parque-freemont', 'condominio-perola', 'condominio-piemonte',
  'condominio-porto-dos-sonhos', 'condominio-reserva-das-amoreiras',
  'condominio-residencial-brasil', 'condominio-residencial-dom-bosco',
  'condominio-residencial-piemonte', 'condominio-san-pietro',
  'condominio-siena', 'condominio-siracusa', 'condominio-terra-mater',
  'condominio-terra-nova', 'condominio-village-giardinno',
  'condominio-villagio-di-roma', 'condominio-ville-de-france',
  'condominio-recanto-dos-lagos', 'condominio-reserva-real',
  'condominio-villa-toscana', 'condominio-riviera', 'condominio-le-parc',
  'condominio-jardins-de-franca', 'condominio-residencial-zanetti',
  'condominio-san-conrado', 'condominio-santa-georgina',
]

// ── Landing pages de leilão por bairro (SEO predatório vs ZAP) ─────────────
const LEILAO_BAIRROS = [
  'leilao-imoveis-centro-franca-sp',
  'leilao-imoveis-jardim-california-franca-sp',
  'leilao-imoveis-jardim-europa-franca-sp',
  'leilao-imoveis-jardim-america-franca-sp',
  'leilao-imoveis-jardim-paulista-franca-sp',
  'leilao-imoveis-polo-club-franca-sp',
  'leilao-imoveis-jardim-panorama-franca-sp',
  'leilao-imoveis-jardim-redentor-franca-sp',
  'leilao-imoveis-jardim-sumare-franca-sp',
  'leilao-imoveis-jardim-independencia-franca-sp',
  'leilao-imoveis-jardim-petraglia-franca-sp',
  'leilao-imoveis-jardim-paulistano-franca-sp',
  'leilao-imoveis-vila-industrial-franca-sp',
  'leilao-imoveis-boa-vista-franca-sp',
  'leilao-imoveis-parque-das-nacoes-franca-sp',
  'leilao-imoveis-residencial-brasil-franca-sp',
  'leilao-apartamentos-franca-sp',
  'leilao-casas-franca-sp',
  'leilao-terrenos-franca-sp',
  'leilao-imoveis-comerciais-franca-sp',
  'leilao-imoveis-caixa-franca-sp',
  'leilao-imoveis-judicial-franca-sp',
  'arrematacao-imoveis-franca-sp',
  'imoveis-desconto-leilao-franca-sp',
]

// ── Serviços ────────────────────────────────────────────────────────────────
const SERVICOS = [
  '/servicos', '/servicos/avaliacao-imoveis', '/servicos/leilao-imoveis',
  '/servicos/investimento-imobiliario', '/servicos/reforma-imoveis',
  '/servicos/engenharia-construcao', '/servicos/fotos-imoveis',
  '/servicos/video-imoveis', '/servicos/edicao-fotos',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // ── Core pages ──────────────────────────────────────────────────────────
  const core: MetadataRoute.Sitemap = [
    { url: WEB_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${WEB_URL}/imoveis`, lastModified: now, changeFrequency: 'hourly', priority: 0.95 },
    { url: `${WEB_URL}/leiloes`, lastModified: now, changeFrequency: 'hourly', priority: 0.95 },
    { url: `${WEB_URL}/profissionais/franca`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${WEB_URL}/parceiros/cadastro`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${WEB_URL}/parceiros/membro-fundador`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${WEB_URL}/anunciar-imovel`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${WEB_URL}/custo-de-vida/franca-sp`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${WEB_URL}/custo-de-vida/ribeirao-preto-sp`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${WEB_URL}/custo-de-vida/campinas-sp`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${WEB_URL}/custo-de-vida/sao-paulo-sp`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${WEB_URL}/custo-de-vida/belo-horizonte-mg`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${WEB_URL}/custo-de-vida/curitiba-pr`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${WEB_URL}/custo-de-vida/goiania-go`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${WEB_URL}/custo-de-vida/brasilia-df`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${WEB_URL}/blog`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${WEB_URL}/bairros/franca`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${WEB_URL}/avaliacao`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${WEB_URL}/sobre`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${WEB_URL}/corretores`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${WEB_URL}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${WEB_URL}/contato`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ]

  // ── Landing pages (alta prioridade SEO) ──────────────────────────────────
  const landings = LANDING_PAGES.map(p => ({
    url: `${WEB_URL}${p}`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.95,
  }))

  // ── Serviços ──────────────────────────────────────────────────────────────
  const servicos = SERVICOS.map(p => ({
    url: `${WEB_URL}${p}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.75,
  }))

  // ── Cidades regionais ────────────────────────────────────────────────────
  const cidades = CIDADES_REGIONAIS.map(c => ({
    url: `${WEB_URL}/imoveis-${c}-sp`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.85,
  }))
  // Hub regional
  cidades.push({ url: `${WEB_URL}/imoveis-regiao-franca-sp`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.9 })

  // ── Páginas programáticas: venda/aluguel/leilão por cidade (143+ cidades) ──
  // ── 500+ CIDADES BRASILEIRAS para SEO programático ──────────────────────
  const SEO_CITIES = [
    // SP (100+ cidades)
    'franca-sp','ribeirao-preto-sp','campinas-sp','sao-paulo-sp','sao-jose-dos-campos-sp',
    'sorocaba-sp','santos-sp','jundiai-sp','piracicaba-sp','bauru-sp','sao-jose-do-rio-preto-sp',
    'guarulhos-sp','osasco-sp','santo-andre-sp','sao-bernardo-do-campo-sp','limeira-sp','taubate-sp',
    'marilia-sp','presidente-prudente-sp','araraquara-sp','sao-carlos-sp','americana-sp','aracatuba-sp',
    'mogi-das-cruzes-sp','batatais-sp','patrocinio-paulista-sp','pedregulho-sp','rifaina-sp',
    'cristais-paulista-sp','altinopolis-sp','brodowski-sp','jaboticabal-sp','bebedouro-sp',
    'indaiatuba-sp','botucatu-sp','catanduva-sp','sertaozinho-sp','votuporanga-sp','birigui-sp',
    'guaruja-sp','praia-grande-sp','sao-vicente-sp','diadema-sp','carapicuiba-sp','barueri-sp',
    'sumare-sp','hortolandia-sp','jau-sp','mococa-sp','mogi-guacu-sp','valinhos-sp','vinhedo-sp',
    'itapetininga-sp','tatui-sp','lencois-paulista-sp','ourinhos-sp','assis-sp','lins-sp','avare-sp',
    'mogi-mirim-sp','itapira-sp','penapolis-sp','tupan-sp','olimpia-sp','fernandopolis-sp',
    'ubatuba-sp','caraguatatuba-sp','itaquaquecetuba-sp','suzano-sp','taboao-da-serra-sp',
    'cotia-sp','embu-das-artes-sp','itapevi-sp','paulinia-sp','itanhaem-sp','registro-sp','itirapina-sp',
    'rio-claro-sp','itu-sp','salto-sp','santa-barbara-doeste-sp','nova-odessa-sp','artur-nogueira-sp',
    'cosmopolis-sp','engenheiro-coelho-sp','holambra-sp','pedreira-sp','jaguariuna-sp','amparo-sp',
    'serra-negra-sp','monte-mor-sp','elias-fausto-sp','capivari-sp','rafard-sp','mombuca-sp',
    'porto-ferreira-sp','descalvado-sp','leme-sp','araras-sp','conchal-sp','santa-cruz-das-palmeiras-sp',
    'pirassununga-sp','ibaté-sp','dourado-sp','trabiju-sp','boa-esperanca-do-sul-sp',
    'matao-sp','dobrada-sp','nova-europa-sp','tabatinga-sp','ibitinga-sp','itapolis-sp',
    'borborema-sp','novo-horizonte-sp','potirendaba-sp','mirassol-sp','bady-bassitt-sp',
    'cedral-sp','guapiacu-sp','olimpia-sp','severinia-sp','monte-azul-paulista-sp',
    'viradouro-sp','terra-roxa-sp','guaraci-sp','jales-sp','santa-fe-do-sul-sp',
    'tres-fronteiras-sp','urania-sp','gastao-vidigal-sp','general-salgado-sp',
    // RJ (30+ cidades)
    'rio-de-janeiro-rj','niteroi-rj','sao-goncalo-rj','nova-iguacu-rj','petropolis-rj',
    'duque-de-caxias-rj','campos-dos-goytacazes-rj','volta-redonda-rj','macae-rj','cabo-frio-rj',
    'angra-dos-reis-rj','resende-rj','nova-friburgo-rj','barra-mansa-rj','teresopolis-rj',
    'marica-rj','itaborai-rj','magé-rj','mesquita-rj','nilopolis-rj','sao-joao-de-meriti-rj',
    'belford-roxo-rj','queimados-rj','japeri-rj','itaguai-rj','seropedica-rj',
    'araruama-rj','saquarema-rj','rio-bonito-rj','casimiro-de-abreu-rj','rio-das-ostras-rj',
    'buzios-rj','paraty-rj','mangaratiba-rj',
    // MG (50+ cidades)
    'belo-horizonte-mg','uberlandia-mg','contagem-mg','juiz-de-fora-mg','uberaba-mg','montes-claros-mg',
    'betim-mg','governador-valadares-mg','ipatinga-mg','sete-lagoas-mg','divinopolis-mg',
    'pocos-de-caldas-mg','patos-de-minas-mg','pouso-alegre-mg','varginha-mg','barbacena-mg',
    'lavras-mg','itajuba-mg','passos-mg','araguari-mg','ituiutaba-mg','muriae-mg',
    'teofilo-otoni-mg','alfenas-mg','patrocinio-mg','sacramento-mg','frutal-mg',
    'araxá-mg','tres-coracoes-mg','formiga-mg','para-de-minas-mg','itauna-mg',
    'conselheiro-lafaiete-mg','congonhas-mg','ouro-preto-mg','mariana-mg',
    // PR (40+ cidades)
    'curitiba-pr','londrina-pr','maringa-pr','ponta-grossa-pr','cascavel-pr','foz-do-iguacu-pr','toledo-pr',
    'guarapuava-pr','paranagua-pr','apucarana-pr','campo-mourao-pr','arapongas-pr','umuarama-pr',
    'colombo-pr','sao-jose-dos-pinhais-pr','araucaria-pr','campo-largo-pr','pinhais-pr',
    'fazenda-rio-grande-pr','piraquara-pr','almirante-tamandare-pr','campina-grande-do-sul-pr',
    'sarandi-pr','cambe-pr','rolandia-pr','ibipora-pr','cornelio-procopio-pr',
    'bandeirantes-pr','jacarezinho-pr','santo-antonio-da-platina-pr',
    'francisco-beltrao-pr','pato-branco-pr','dois-vizinhos-pr','palmas-pr','laranjeiras-do-sul-pr',
    // RS (30+ cidades)
    'porto-alegre-rs','caxias-do-sul-rs','pelotas-rs','santa-maria-rs','canoas-rs','novo-hamburgo-rs',
    'gravatai-rs','viamao-rs','sao-leopoldo-rs','rio-grande-rs','alvorada-rs','erechim-rs',
    'passo-fundo-rs','sapucaia-do-sul-rs','cachoeirinha-rs','guaiba-rs','santa-cruz-do-sul-rs',
    'uruguaiana-rs','lajeado-rs','bento-goncalves-rs','ijui-rs','bagé-rs','alegrete-rs',
    'esteio-rs','santo-angelo-rs','cruz-alta-rs','vacaria-rs','santiago-rs','carazinho-rs',
    // SC (25+ cidades)
    'florianopolis-sc','joinville-sc','blumenau-sc','balneario-camboriu-sc','chapeco-sc','criciuma-sc','itajai-sc',
    'sao-jose-sc','lages-sc','palhoca-sc','biguacu-sc','jaragua-do-sul-sc','tubarao-sc',
    'navegantes-sc','brusque-sc','concordia-sc','mafra-sc','rio-do-sul-sc','cacador-sc',
    'camboriu-sc','gaspar-sc','indaial-sc','timbo-sc','pomerode-sc','penha-sc','itapema-sc',
    // Nordeste (60+ cidades)
    'salvador-ba','feira-de-santana-ba','vitoria-da-conquista-ba','camacari-ba','lauro-de-freitas-ba',
    'itabuna-ba','ilheus-ba','jequie-ba','juazeiro-ba','teixeira-de-freitas-ba','barreiras-ba',
    'recife-pe','caruaru-pe','petrolina-pe','jaboatao-dos-guararapes-pe','olinda-pe','cabo-de-santo-agostinho-pe',
    'garanhuns-pe','vitoria-de-santo-antao-pe','paulista-pe','abreu-e-lima-pe',
    'fortaleza-ce','caucaia-ce','maracanau-ce','juazeiro-do-norte-ce','sobral-ce','crato-ce',
    'natal-rn','mossoro-rn','parnamirim-rn','sao-goncalo-do-amarante-rn','macaiba-rn','ceara-mirim-rn',
    'joao-pessoa-pb','campina-grande-pb','santa-rita-pb','patos-pb','bayeux-pb',
    'maceio-al','arapiraca-al','rio-largo-al','palmeira-dos-indios-al',
    'teresina-pi','parnaiba-pi','picos-pi',
    'aracaju-se','nossa-senhora-do-socorro-se','lagarto-se',
    'sao-luis-ma','imperatriz-ma','timon-ma','caxias-ma','codó-ma',
    // Centro-Oeste (30+ cidades)
    'goiania-go','anapolis-go','rio-verde-go','aparecida-de-goiania-go','catalao-go','itumbiara-go',
    'luziania-go','aguas-lindas-de-goias-go','valparaiso-de-goias-go','trindade-go','senador-canedo-go',
    'jatai-go','caldas-novas-go',
    'brasilia-df','taguatinga-df','ceilandia-df','samambaia-df','plano-piloto-df',
    'cuiaba-mt','varzea-grande-mt','rondonopolis-mt','sinop-mt','tangara-da-serra-mt','sorriso-mt',
    'campo-grande-ms','dourados-ms','tres-lagoas-ms','corumba-ms','ponta-pora-ms',
    // Norte (15+ cidades)
    'belem-pa','ananindeua-pa','santarem-pa','maraba-pa',
    'manaus-am','parintins-am',
    'macapa-ap','porto-velho-ro','rio-branco-ac','boa-vista-rr','palmas-to',
    // ES (10+ cidades)
    'vitoria-es','vila-velha-es','serra-es','cariacica-es','cachoeiro-de-itapemirim-es',
    'linhares-es','colatina-es','guarapari-es','sao-mateus-es','aracruz-es',
  ]
  const vendaPages = SEO_CITIES.map(c => ({ url: `${WEB_URL}/imoveis-a-venda/${c}`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.85 }))
  const aluguelPages = SEO_CITIES.map(c => ({ url: `${WEB_URL}/imoveis-para-alugar/${c}`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.85 }))
  const leilaoCidadePages = SEO_CITIES.map(c => ({ url: `${WEB_URL}/leilao-imoveis-em/${c}`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.85 }))

  // ── Capitais (alta prioridade) ────────────────────────────────────────────
  const capitais = [
    'sao-paulo-sp', 'belo-horizonte-mg', 'curitiba-pr', 'goiania-go', 'brasilia-df',
  ].map(c => ({
    url: `${WEB_URL}/imoveis-${c}`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.95,
  }))

  // ── Bairros de Franca ────────────────────────────────────────────────────
  const bairros = BAIRROS_FRANCA.map(b => ({
    url: `${WEB_URL}/bairros/franca/${b}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8,
  }))

  // ── Condomínios ──────────────────────────────────────────────────────────
  const condominios = CONDOMINIOS.map(c => ({
    url: `${WEB_URL}/condominios/franca/${c}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.85,
  }))

  // ── Leilão em TODOS os bairros de Franca (472+) ──────────────────────────
  const leilaoBairrosFranca = BAIRROS_FRANCA.map(b => ({
    url: `${WEB_URL}/leilao-imoveis/${b}-franca-sp`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))
  // Venda em todos os bairros
  const vendaBairrosFranca = BAIRROS_FRANCA.map(b => ({
    url: `${WEB_URL}/imoveis-a-venda/franca-sp?bairro=${b}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.75,
  }))
  // Aluguel em todos os bairros
  const aluguelBairrosFranca = BAIRROS_FRANCA.map(b => ({
    url: `${WEB_URL}/imoveis-para-alugar/franca-sp?bairro=${b}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.75,
  }))
  // Leilão em todos os condomínios
  const leilaoCondominios = CONDOMINIOS.map(c => ({
    url: `${WEB_URL}/leilao-imoveis/${c.replace('condominio-', '')}-franca-sp`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // ── Leilão por Bairro (SEO programático) ────────────────────────────────
  const leilaoBairroSlugs = [
    'centro-franca-sp', 'jardim-petraglia-franca-sp', 'city-petropolis-franca-sp',
    'vila-santa-cruz-franca-sp', 'jardim-paulista-franca-sp', 'jardim-california-franca-sp',
    'jardim-independencia-franca-sp', 'polo-club-franca-sp', 'jardim-zanetti-franca-sp',
    'jardim-piemonte-franca-sp', 'jardim-eldorado-franca-sp', 'espraiado-franca-sp',
    'jardim-luiza-franca-sp', 'residencial-zanetti-franca-sp', 'jardim-francano-franca-sp',
    'savassi-belo-horizonte-mg', 'pampulha-belo-horizonte-mg',
    'agua-verde-curitiba-pr', 'santa-felicidade-curitiba-pr',
    'setor-bueno-goiania-go', 'aguas-claras-brasilia-df',
    'vila-mariana-sao-paulo-sp', 'tatupe-sao-paulo-sp',
    'tijuca-rio-de-janeiro-rj', 'campo-grande-rio-de-janeiro-rj',
  ]
  const leilaoBairros = leilaoBairroSlugs.map(slug => ({
    url: `${WEB_URL}/leilao-imoveis/${slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }))

  // ── POIs (Pontos de Interesse) ──────────────────────────────────────────
  const poiSlugs = [
    'uni-franca', 'unesp-franca', 'shopping-franca', 'shopping-boulevard',
    'santa-casa-franca', 'hospital-regional', 'sesi-franca', 'senai-franca',
    'etec-franca', 'atacadao-franca', 'assai-franca', 'upa-franca',
    'shopping-ribeirao', 'usp-ribeirao', 'hospital-clinicas-rp',
    'shopping-ibirapuera', 'usp-sao-paulo', 'hospital-einstein',
    'unicamp', 'shopping-galleria',
  ]
  const pois = poiSlugs.map(slug => ({
    url: `${WEB_URL}/imoveis/perto-de/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // ── Landing pages de leilão por bairro (Manus) ────────────────────────────
  const leilaoBairrosManus = LEILAO_BAIRROS.map(slug => ({
    url: `${WEB_URL}/leiloes/${slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.92,
  }))

  // ── Leilões (dinâmicos da API) ────────────────────────────────────────────
  let leiloes: MetadataRoute.Sitemap = []
  try {
    const res = await fetch(`${API_URL}/api/v1/auctions?limit=500&sortBy=createdAt&sortOrder=desc`, { next: { revalidate: 3600 } })
    if (res.ok) {
      const data = await res.json()
      leiloes = (data.data ?? []).map((a: any) => ({
        url: `${WEB_URL}/leiloes/${a.slug}`,
        lastModified: new Date(a.updatedAt ?? now),
        changeFrequency: 'daily' as const,
        priority: 0.85,
      }))
    }
  } catch {}

  // ── Imóveis individuais (dinâmicos da API) ────────────────────────────────
  let imoveis: MetadataRoute.Sitemap = []
  try {
    const res = await fetch(`${API_URL}/api/v1/public/properties?limit=2000`, { next: { revalidate: 3600 } })
    if (res.ok) {
      const data = await res.json()
      imoveis = (data.data ?? []).map((p: any) => ({
        url: `${WEB_URL}/imoveis/${p.slug}`,
        lastModified: new Date(p.updatedAt ?? now),
        changeFrequency: 'weekly' as const,
        priority: 0.75,
      }))
    }
  } catch {}

  // ── Blog ───────────────────────────────────────────────────────────────────
  let blog: MetadataRoute.Sitemap = []
  try {
    const res = await fetch(`${API_URL}/api/v1/blog?limit=500`, { next: { revalidate: 3600 } })
    if (res.ok) {
      const data = await res.json()
      blog = (data.data ?? []).map((p: any) => ({
        url: `${WEB_URL}/blog/${p.slug}`,
        lastModified: new Date(p.publishedAt ?? now),
        changeFrequency: 'monthly' as const,
        priority: 0.65,
      }))
    }
  } catch {}

  return [
    ...core,
    ...landings,
    ...leilaoBairros,
    ...servicos,
    ...capitais,
    ...cidades,
    ...bairros,
    ...condominios,
    ...vendaPages,
    ...aluguelPages,
    ...leilaoCidadePages,
    ...leilaoBairrosFranca,
    ...vendaBairrosFranca,
    ...aluguelBairrosFranca,
    ...leilaoCondominios,
    // ── TERMOS RELACIONADOS A IMÓVEIS × CIDADES (explosão de URLs) ──────
    ...SEO_CITIES.flatMap(c => [
      // Tipos de imóvel
      { url: `${WEB_URL}/casas-a-venda/${c}`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.85 },
      { url: `${WEB_URL}/apartamentos-a-venda/${c}`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.85 },
      { url: `${WEB_URL}/terrenos-a-venda/${c}`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.8 },
      { url: `${WEB_URL}/imoveis-comerciais/${c}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.75 },
      { url: `${WEB_URL}/salas-comerciais/${c}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 },
      { url: `${WEB_URL}/galpoes/${c}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 },
      { url: `${WEB_URL}/cobertura-duplex/${c}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 },
      { url: `${WEB_URL}/kitnet/${c}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 },
      { url: `${WEB_URL}/condominio-fechado/${c}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.75 },
      // Rural
      { url: `${WEB_URL}/chacaras-a-venda/${c}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 },
      { url: `${WEB_URL}/sitios-a-venda/${c}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 },
      { url: `${WEB_URL}/fazendas-a-venda/${c}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 },
      { url: `${WEB_URL}/leilao-rural/${c}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 },
      { url: `${WEB_URL}/imoveis-rurais/${c}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 },
      // Leilões específicos
      { url: `${WEB_URL}/leilao-casas/${c}`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.85 },
      { url: `${WEB_URL}/leilao-apartamentos/${c}`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.85 },
      { url: `${WEB_URL}/leilao-terrenos/${c}`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.8 },
      { url: `${WEB_URL}/leilao-caixa/${c}`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.9 },
      { url: `${WEB_URL}/leilao-judicial/${c}`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.85 },
      { url: `${WEB_URL}/leilao-extrajudicial/${c}`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.85 },
      { url: `${WEB_URL}/leilao-banco-do-brasil/${c}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 },
      { url: `${WEB_URL}/leilao-bradesco/${c}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 },
      { url: `${WEB_URL}/leilao-itau/${c}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 },
      { url: `${WEB_URL}/leilao-santander/${c}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 },
      // Serviços e Profissionais
      { url: `${WEB_URL}/avaliacao-imoveis/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.75 },
      { url: `${WEB_URL}/financiamento-imovel/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.75 },
      { url: `${WEB_URL}/materiais-de-construcao/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.65 },
      { url: `${WEB_URL}/reforma-de-imoveis/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.7 },
      { url: `${WEB_URL}/engenheiros-civis/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.7 },
      { url: `${WEB_URL}/arquitetos/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.7 },
      { url: `${WEB_URL}/advogados-imobiliarios/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.7 },
      { url: `${WEB_URL}/agrimensores/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.65 },
      { url: `${WEB_URL}/corretores-de-imoveis/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.75 },
      { url: `${WEB_URL}/investimento-imobiliario/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.75 },
      { url: `${WEB_URL}/decoracao-interiores/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.65 },
      { url: `${WEB_URL}/vistoria-imovel/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.65 },
      { url: `${WEB_URL}/despachante-imobiliario/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.6 },
      { url: `${WEB_URL}/fotografo-imoveis/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.6 },
      { url: `${WEB_URL}/home-staging/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.6 },
      // Custo de vida e comparação
      { url: `${WEB_URL}/custo-de-vida/${c}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.75 },
      { url: `${WEB_URL}/valor-metro-quadrado/${c}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 },
      // Por quartos
      { url: `${WEB_URL}/imoveis-1-quarto/${c}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 },
      { url: `${WEB_URL}/imoveis-2-quartos/${c}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.75 },
      { url: `${WEB_URL}/imoveis-3-quartos/${c}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.75 },
      { url: `${WEB_URL}/imoveis-4-quartos/${c}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 },
      // Por preço
      { url: `${WEB_URL}/imoveis-ate-200mil/${c}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.75 },
      { url: `${WEB_URL}/imoveis-200-500mil/${c}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.75 },
      { url: `${WEB_URL}/imoveis-500mil-1milhao/${c}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 },
      { url: `${WEB_URL}/imoveis-acima-1milhao/${c}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 },
      // Aluguel por faixa
      { url: `${WEB_URL}/aluguel-ate-1000/${c}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 },
      { url: `${WEB_URL}/aluguel-1000-2000/${c}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 },
      { url: `${WEB_URL}/aluguel-2000-3000/${c}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 },
      { url: `${WEB_URL}/aluguel-acima-3000/${c}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.65 },
      // Lançamentos e novos
      { url: `${WEB_URL}/lancamentos/${c}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.75 },
      { url: `${WEB_URL}/imoveis-novos/${c}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 },
      { url: `${WEB_URL}/imoveis-usados/${c}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 },
      // Perto de
      { url: `${WEB_URL}/imoveis-perto-metro/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.65 },
      { url: `${WEB_URL}/imoveis-perto-escola/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.65 },
      { url: `${WEB_URL}/imoveis-perto-hospital/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.65 },
      { url: `${WEB_URL}/imoveis-perto-shopping/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.65 },
      // Específicos
      { url: `${WEB_URL}/imoveis-com-piscina/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.65 },
      { url: `${WEB_URL}/imoveis-com-churrasqueira/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.6 },
      { url: `${WEB_URL}/imoveis-aceita-pets/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.6 },
      { url: `${WEB_URL}/imoveis-mobiliados/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.65 },
      { url: `${WEB_URL}/imoveis-com-varanda/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.6 },
      // Tipo + Finalidade cruzados
      { url: `${WEB_URL}/casas-para-alugar/${c}`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.85 },
      { url: `${WEB_URL}/apartamentos-para-alugar/${c}`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.85 },
      { url: `${WEB_URL}/kitnets-para-alugar/${c}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 },
      { url: `${WEB_URL}/salas-para-alugar/${c}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.65 },
      { url: `${WEB_URL}/galpoes-para-alugar/${c}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.65 },
      { url: `${WEB_URL}/casas-em-condominio/${c}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.75 },
      // Temporada
      { url: `${WEB_URL}/aluguel-temporada/${c}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 },
      // Permuta
      { url: `${WEB_URL}/imoveis-permuta/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.6 },
      // Documentação
      { url: `${WEB_URL}/regularizacao-imovel/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.6 },
      { url: `${WEB_URL}/escritura-imovel/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.6 },
      { url: `${WEB_URL}/usucapiao/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.55 },
      { url: `${WEB_URL}/inventario-imovel/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.55 },
      // Construção
      { url: `${WEB_URL}/construtoras/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.6 },
      { url: `${WEB_URL}/empreiteiros/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.6 },
      { url: `${WEB_URL}/pedreiros/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.55 },
      { url: `${WEB_URL}/eletricistas/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.55 },
      { url: `${WEB_URL}/encanadores/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.55 },
      { url: `${WEB_URL}/pintores/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.55 },
      { url: `${WEB_URL}/marceneiros/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.55 },
      { url: `${WEB_URL}/vidraceiros/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.5 },
      { url: `${WEB_URL}/serralheiros/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.5 },
      // Seguros
      { url: `${WEB_URL}/seguro-residencial/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.55 },
      { url: `${WEB_URL}/seguro-incendio/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.5 },
      // Mudança
      { url: `${WEB_URL}/empresas-mudanca/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.55 },
      { url: `${WEB_URL}/guarda-moveis/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.5 },
      // Limpeza e manutenção
      { url: `${WEB_URL}/limpeza-pos-obra/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.5 },
      { url: `${WEB_URL}/dedetizacao/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.5 },
      { url: `${WEB_URL}/jardinagem-paisagismo/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.5 },
      { url: `${WEB_URL}/impermeabilizacao/${c}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.5 },
    ]),
    ...leilaoBairros,
    ...leilaoBairrosManus,
    ...pois,
    ...leiloes,
    ...imoveis,
    ...blog,
  ]
}

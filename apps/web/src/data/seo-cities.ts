/**
 * Base de cidades brasileiras para SEO programático
 * Top 500 cidades por população + todas de SP interior
 * Total: ~2.000 cidades gerando ~40.000 URLs via combinações
 *
 * Cada cidade gera:
 * - /imoveis-a-venda/[slug] (venda)
 * - /imoveis-para-alugar/[slug] (aluguel)
 * - /leilao-imoveis-em/[slug] (leilão)
 * = 3 URLs por cidade = ~6.000 URLs só de cidades
 *
 * + Combinações com tipo (casa, apto, terreno) = mais ~12.000
 * + Bairros de Franca (472) × 4 = ~1.900
 * + Condomínios (300+) = ~300
 * = Total: ~20.000+ URLs base
 */

export interface CityData {
  slug: string
  name: string
  state: string
  stateSlug: string
  population?: number
  region: string
}

// ── São Paulo Interior (top 100) ──────────────────────────────────────────
const SP_INTERIOR: CityData[] = [
  { slug: 'franca-sp', name: 'Franca', state: 'SP', stateSlug: 'sp', population: 355901, region: 'interior-sp' },
  { slug: 'ribeirao-preto-sp', name: 'Ribeirão Preto', state: 'SP', stateSlug: 'sp', population: 720116, region: 'interior-sp' },
  { slug: 'campinas-sp', name: 'Campinas', state: 'SP', stateSlug: 'sp', population: 1223237, region: 'interior-sp' },
  { slug: 'sorocaba-sp', name: 'Sorocaba', state: 'SP', stateSlug: 'sp', population: 695328, region: 'interior-sp' },
  { slug: 'sao-jose-dos-campos-sp', name: 'São José dos Campos', state: 'SP', stateSlug: 'sp', population: 737310, region: 'interior-sp' },
  { slug: 'santos-sp', name: 'Santos', state: 'SP', stateSlug: 'sp', population: 433311, region: 'litoral-sp' },
  { slug: 'jundiai-sp', name: 'Jundiaí', state: 'SP', stateSlug: 'sp', population: 423006, region: 'interior-sp' },
  { slug: 'piracicaba-sp', name: 'Piracicaba', state: 'SP', stateSlug: 'sp', population: 407252, region: 'interior-sp' },
  { slug: 'bauru-sp', name: 'Bauru', state: 'SP', stateSlug: 'sp', population: 379297, region: 'interior-sp' },
  { slug: 'sao-jose-do-rio-preto-sp', name: 'São José do Rio Preto', state: 'SP', stateSlug: 'sp', population: 464983, region: 'interior-sp' },
  { slug: 'mogi-das-cruzes-sp', name: 'Mogi das Cruzes', state: 'SP', stateSlug: 'sp', population: 449782, region: 'grande-sp' },
  { slug: 'guarulhos-sp', name: 'Guarulhos', state: 'SP', stateSlug: 'sp', population: 1404694, region: 'grande-sp' },
  { slug: 'osasco-sp', name: 'Osasco', state: 'SP', stateSlug: 'sp', population: 699944, region: 'grande-sp' },
  { slug: 'santo-andre-sp', name: 'Santo André', state: 'SP', stateSlug: 'sp', population: 721368, region: 'grande-sp' },
  { slug: 'sao-bernardo-do-campo-sp', name: 'São Bernardo do Campo', state: 'SP', stateSlug: 'sp', population: 844483, region: 'grande-sp' },
  { slug: 'limeira-sp', name: 'Limeira', state: 'SP', stateSlug: 'sp', population: 306114, region: 'interior-sp' },
  { slug: 'taubate-sp', name: 'Taubaté', state: 'SP', stateSlug: 'sp', population: 317036, region: 'interior-sp' },
  { slug: 'marilia-sp', name: 'Marília', state: 'SP', stateSlug: 'sp', population: 237130, region: 'interior-sp' },
  { slug: 'presidente-prudente-sp', name: 'Presidente Prudente', state: 'SP', stateSlug: 'sp', population: 230371, region: 'interior-sp' },
  { slug: 'araraquara-sp', name: 'Araraquara', state: 'SP', stateSlug: 'sp', population: 238339, region: 'interior-sp' },
  { slug: 'sao-carlos-sp', name: 'São Carlos', state: 'SP', stateSlug: 'sp', population: 254484, region: 'interior-sp' },
  { slug: 'americana-sp', name: 'Americana', state: 'SP', stateSlug: 'sp', population: 242018, region: 'interior-sp' },
  { slug: 'aracatuba-sp', name: 'Araçatuba', state: 'SP', stateSlug: 'sp', population: 199444, region: 'interior-sp' },
  { slug: 'jaboticabal-sp', name: 'Jaboticabal', state: 'SP', stateSlug: 'sp', population: 77196, region: 'interior-sp' },
  { slug: 'bebedouro-sp', name: 'Bebedouro', state: 'SP', stateSlug: 'sp', population: 77538, region: 'interior-sp' },
  { slug: 'batatais-sp', name: 'Batatais', state: 'SP', stateSlug: 'sp', population: 62598, region: 'interior-sp' },
  { slug: 'patrocinio-paulista-sp', name: 'Patrocínio Paulista', state: 'SP', stateSlug: 'sp', population: 14580, region: 'interior-sp' },
  { slug: 'pedregulho-sp', name: 'Pedregulho', state: 'SP', stateSlug: 'sp', population: 16090, region: 'interior-sp' },
  { slug: 'rifaina-sp', name: 'Rifaina', state: 'SP', stateSlug: 'sp', population: 3944, region: 'interior-sp' },
  { slug: 'cristais-paulista-sp', name: 'Cristais Paulista', state: 'SP', stateSlug: 'sp', population: 8342, region: 'interior-sp' },
  { slug: 'altinopolis-sp', name: 'Altinópolis', state: 'SP', stateSlug: 'sp', population: 16117, region: 'interior-sp' },
  { slug: 'brodowski-sp', name: 'Brodowski', state: 'SP', stateSlug: 'sp', population: 23862, region: 'interior-sp' },
]

// ── Capitais + Grandes Cidades (todos os estados) ──────────────────────────
const CAPITAIS_E_GRANDES: CityData[] = [
  // SP Capital
  { slug: 'sao-paulo-sp', name: 'São Paulo', state: 'SP', stateSlug: 'sp', population: 12396372, region: 'capital' },
  // RJ
  { slug: 'rio-de-janeiro-rj', name: 'Rio de Janeiro', state: 'RJ', stateSlug: 'rj', population: 6775561, region: 'capital' },
  { slug: 'niteroi-rj', name: 'Niterói', state: 'RJ', stateSlug: 'rj', population: 515317, region: 'grande-rj' },
  { slug: 'sao-goncalo-rj', name: 'São Gonçalo', state: 'RJ', stateSlug: 'rj', population: 1098357, region: 'grande-rj' },
  { slug: 'nova-iguacu-rj', name: 'Nova Iguaçu', state: 'RJ', stateSlug: 'rj', population: 823302, region: 'grande-rj' },
  { slug: 'petropolis-rj', name: 'Petrópolis', state: 'RJ', stateSlug: 'rj', population: 306678, region: 'interior-rj' },
  // MG
  { slug: 'belo-horizonte-mg', name: 'Belo Horizonte', state: 'MG', stateSlug: 'mg', population: 2530701, region: 'capital' },
  { slug: 'uberlandia-mg', name: 'Uberlândia', state: 'MG', stateSlug: 'mg', population: 706597, region: 'interior-mg' },
  { slug: 'contagem-mg', name: 'Contagem', state: 'MG', stateSlug: 'mg', population: 668949, region: 'grande-bh' },
  { slug: 'juiz-de-fora-mg', name: 'Juiz de Fora', state: 'MG', stateSlug: 'mg', population: 577532, region: 'interior-mg' },
  { slug: 'uberaba-mg', name: 'Uberaba', state: 'MG', stateSlug: 'mg', population: 340277, region: 'interior-mg' },
  { slug: 'montes-claros-mg', name: 'Montes Claros', state: 'MG', stateSlug: 'mg', population: 413487, region: 'interior-mg' },
  // PR
  { slug: 'curitiba-pr', name: 'Curitiba', state: 'PR', stateSlug: 'pr', population: 1963726, region: 'capital' },
  { slug: 'londrina-pr', name: 'Londrina', state: 'PR', stateSlug: 'pr', population: 580870, region: 'interior-pr' },
  { slug: 'maringa-pr', name: 'Maringá', state: 'PR', stateSlug: 'pr', population: 436472, region: 'interior-pr' },
  { slug: 'ponta-grossa-pr', name: 'Ponta Grossa', state: 'PR', stateSlug: 'pr', population: 358838, region: 'interior-pr' },
  { slug: 'cascavel-pr', name: 'Cascavel', state: 'PR', stateSlug: 'pr', population: 332333, region: 'interior-pr' },
  // RS
  { slug: 'porto-alegre-rs', name: 'Porto Alegre', state: 'RS', stateSlug: 'rs', population: 1492530, region: 'capital' },
  { slug: 'caxias-do-sul-rs', name: 'Caxias do Sul', state: 'RS', stateSlug: 'rs', population: 517451, region: 'interior-rs' },
  // SC
  { slug: 'florianopolis-sc', name: 'Florianópolis', state: 'SC', stateSlug: 'sc', population: 516524, region: 'capital' },
  { slug: 'joinville-sc', name: 'Joinville', state: 'SC', stateSlug: 'sc', population: 604708, region: 'interior-sc' },
  { slug: 'blumenau-sc', name: 'Blumenau', state: 'SC', stateSlug: 'sc', population: 361855, region: 'interior-sc' },
  { slug: 'balneario-camboriu-sc', name: 'Balneário Camboriú', state: 'SC', stateSlug: 'sc', population: 145796, region: 'litoral-sc' },
  // BA
  { slug: 'salvador-ba', name: 'Salvador', state: 'BA', stateSlug: 'ba', population: 2886698, region: 'capital' },
  { slug: 'feira-de-santana-ba', name: 'Feira de Santana', state: 'BA', stateSlug: 'ba', population: 619609, region: 'interior-ba' },
  // PE
  { slug: 'recife-pe', name: 'Recife', state: 'PE', stateSlug: 'pe', population: 1661017, region: 'capital' },
  // CE
  { slug: 'fortaleza-ce', name: 'Fortaleza', state: 'CE', stateSlug: 'ce', population: 2703391, region: 'capital' },
  // GO
  { slug: 'goiania-go', name: 'Goiânia', state: 'GO', stateSlug: 'go', population: 1555626, region: 'capital' },
  { slug: 'aparecida-de-goiania-go', name: 'Aparecida de Goiânia', state: 'GO', stateSlug: 'go', population: 616568, region: 'grande-goiania' },
  // DF
  { slug: 'brasilia-df', name: 'Brasília', state: 'DF', stateSlug: 'df', population: 3094325, region: 'capital' },
  // PA
  { slug: 'belem-pa', name: 'Belém', state: 'PA', stateSlug: 'pa', population: 1506420, region: 'capital' },
  // MA
  { slug: 'sao-luis-ma', name: 'São Luís', state: 'MA', stateSlug: 'ma', population: 1115932, region: 'capital' },
  // AM
  { slug: 'manaus-am', name: 'Manaus', state: 'AM', stateSlug: 'am', population: 2255903, region: 'capital' },
  // MT
  { slug: 'cuiaba-mt', name: 'Cuiabá', state: 'MT', stateSlug: 'mt', population: 623614, region: 'capital' },
  // MS
  { slug: 'campo-grande-ms', name: 'Campo Grande', state: 'MS', stateSlug: 'ms', population: 916001, region: 'capital' },
  // ES
  { slug: 'vitoria-es', name: 'Vitória', state: 'ES', stateSlug: 'es', population: 365855, region: 'capital' },
  { slug: 'vila-velha-es', name: 'Vila Velha', state: 'ES', stateSlug: 'es', population: 501325, region: 'grande-vitoria' },
  // RN
  { slug: 'natal-rn', name: 'Natal', state: 'RN', stateSlug: 'rn', population: 896708, region: 'capital' },
  // PB
  { slug: 'joao-pessoa-pb', name: 'João Pessoa', state: 'PB', stateSlug: 'pb', population: 817511, region: 'capital' },
  // AL
  { slug: 'maceio-al', name: 'Maceió', state: 'AL', stateSlug: 'al', population: 1031597, region: 'capital' },
  // PI
  { slug: 'teresina-pi', name: 'Teresina', state: 'PI', stateSlug: 'pi', population: 871126, region: 'capital' },
  // SE
  { slug: 'aracaju-se', name: 'Aracaju', state: 'SE', stateSlug: 'se', population: 664908, region: 'capital' },
]

// ── Todas as cidades combinadas ──────────────────────────────────────────
export const ALL_CITIES: CityData[] = [...SP_INTERIOR, ...CAPITAIS_E_GRANDES]

// Remover duplicatas
const seen = new Set<string>()
export const UNIQUE_CITIES = ALL_CITIES.filter(c => {
  if (seen.has(c.slug)) return false
  seen.add(c.slug)
  return true
})

// Tipos de imóvel para combinação
export const PROPERTY_TYPES = [
  { slug: 'casas', label: 'Casas', type: 'HOUSE' },
  { slug: 'apartamentos', label: 'Apartamentos', type: 'APARTMENT' },
  { slug: 'terrenos', label: 'Terrenos', type: 'LAND' },
  { slug: 'comercial', label: 'Imóveis Comerciais', type: 'OFFICE' },
  { slug: 'chacaras', label: 'Chácaras e Sítios', type: 'FARM' },
]

// Gerar contagem de URLs
export function countTotalURLs(): number {
  const cities = UNIQUE_CITIES.length
  // venda + aluguel + leilão por cidade = 3 URLs
  const cityPages = cities * 3
  // tipo × cidade (casa, apto, terreno, comercial, chácara) = 5 URLs por cidade
  const typePages = cities * PROPERTY_TYPES.length
  // Total
  return cityPages + typePages
}

/**
 * Total estimado de URLs:
 * - 73 cidades × 3 (venda/aluguel/leilão) = 219
 * - 73 cidades × 5 (tipos) = 365
 * - 472 bairros Franca × 3 = 1.416
 * - 300+ condomínios = 300
 * - 25 leilão bairro = 25
 * - 20 POIs = 20
 * - 8 custo de vida = 8
 * - 42 leilões individuais = 42
 * - 991 imóveis = 991
 * - 282 blog = 282
 * = ~3.668 URLs estáticas
 *
 * Para chegar a 40.000 precisamos de mais cidades.
 * Solução: importar TODAS as 5.570 cidades do IBGE.
 */

// ── EXPANSÃO MASSIVA: Cidades de SP (top 200 por população) ─────────────
const SP_EXPANSION: CityData[] = [
  { slug: 'indaiatuba-sp', name: 'Indaiatuba', state: 'SP', stateSlug: 'sp', population: 256223, region: 'interior-sp' },
  { slug: 'itapetininga-sp', name: 'Itapetininga', state: 'SP', stateSlug: 'sp', population: 164376, region: 'interior-sp' },
  { slug: 'tatui-sp', name: 'Tatuí', state: 'SP', stateSlug: 'sp', population: 125539, region: 'interior-sp' },
  { slug: 'botucatu-sp', name: 'Botucatu', state: 'SP', stateSlug: 'sp', population: 147783, region: 'interior-sp' },
  { slug: 'catanduva-sp', name: 'Catanduva', state: 'SP', stateSlug: 'sp', population: 124127, region: 'interior-sp' },
  { slug: 'lencois-paulista-sp', name: 'Lençóis Paulista', state: 'SP', stateSlug: 'sp', population: 68867, region: 'interior-sp' },
  { slug: 'sertaozinho-sp', name: 'Sertãozinho', state: 'SP', stateSlug: 'sp', population: 124507, region: 'interior-sp' },
  { slug: 'votuporanga-sp', name: 'Votuporanga', state: 'SP', stateSlug: 'sp', population: 95321, region: 'interior-sp' },
  { slug: 'ourinhos-sp', name: 'Ourinhos', state: 'SP', stateSlug: 'sp', population: 113542, region: 'interior-sp' },
  { slug: 'assis-sp', name: 'Assis', state: 'SP', stateSlug: 'sp', population: 104773, region: 'interior-sp' },
  { slug: 'lins-sp', name: 'Lins', state: 'SP', stateSlug: 'sp', population: 77318, region: 'interior-sp' },
  { slug: 'avare-sp', name: 'Avaré', state: 'SP', stateSlug: 'sp', population: 91372, region: 'interior-sp' },
  { slug: 'mogi-guacu-sp', name: 'Mogi Guaçu', state: 'SP', stateSlug: 'sp', population: 153033, region: 'interior-sp' },
  { slug: 'mogi-mirim-sp', name: 'Mogi Mirim', state: 'SP', stateSlug: 'sp', population: 95614, region: 'interior-sp' },
  { slug: 'itapira-sp', name: 'Itapira', state: 'SP', stateSlug: 'sp', population: 75090, region: 'interior-sp' },
  { slug: 'penapolis-sp', name: 'Penápolis', state: 'SP', stateSlug: 'sp', population: 63239, region: 'interior-sp' },
  { slug: 'tupan-sp', name: 'Tupã', state: 'SP', stateSlug: 'sp', population: 67033, region: 'interior-sp' },
  { slug: 'olimpia-sp', name: 'Olímpia', state: 'SP', stateSlug: 'sp', population: 55624, region: 'interior-sp' },
  { slug: 'birigui-sp', name: 'Birigui', state: 'SP', stateSlug: 'sp', population: 121437, region: 'interior-sp' },
  { slug: 'itumbiara-go', name: 'Itumbiara', state: 'GO', stateSlug: 'go', population: 102513, region: 'interior-go' },
  { slug: 'anapolis-go', name: 'Anápolis', state: 'GO', stateSlug: 'go', population: 391772, region: 'interior-go' },
  { slug: 'rio-verde-go', name: 'Rio Verde', state: 'GO', stateSlug: 'go', population: 235647, region: 'interior-go' },
  { slug: 'catalao-go', name: 'Catalão', state: 'GO', stateSlug: 'go', population: 109093, region: 'interior-go' },
  { slug: 'guaruja-sp', name: 'Guarujá', state: 'SP', stateSlug: 'sp', population: 322750, region: 'litoral-sp' },
  { slug: 'praia-grande-sp', name: 'Praia Grande', state: 'SP', stateSlug: 'sp', population: 330845, region: 'litoral-sp' },
  { slug: 'sao-vicente-sp', name: 'São Vicente', state: 'SP', stateSlug: 'sp', population: 370762, region: 'litoral-sp' },
  { slug: 'ubatuba-sp', name: 'Ubatuba', state: 'SP', stateSlug: 'sp', population: 92023, region: 'litoral-sp' },
  { slug: 'caraguatatuba-sp', name: 'Caraguatatuba', state: 'SP', stateSlug: 'sp', population: 121532, region: 'litoral-sp' },
  { slug: 'diadema-sp', name: 'Diadema', state: 'SP', stateSlug: 'sp', population: 426363, region: 'grande-sp' },
  { slug: 'carapicuiba-sp', name: 'Carapicuíba', state: 'SP', stateSlug: 'sp', population: 400927, region: 'grande-sp' },
  { slug: 'itaquaquecetuba-sp', name: 'Itaquaquecetuba', state: 'SP', stateSlug: 'sp', population: 378564, region: 'grande-sp' },
  { slug: 'suzano-sp', name: 'Suzano', state: 'SP', stateSlug: 'sp', population: 303251, region: 'grande-sp' },
  { slug: 'taboao-da-serra-sp', name: 'Taboão da Serra', state: 'SP', stateSlug: 'sp', population: 279634, region: 'grande-sp' },
  { slug: 'barueri-sp', name: 'Barueri', state: 'SP', stateSlug: 'sp', population: 276982, region: 'grande-sp' },
  { slug: 'cotia-sp', name: 'Cotia', state: 'SP', stateSlug: 'sp', population: 261608, region: 'grande-sp' },
  { slug: 'embu-das-artes-sp', name: 'Embu das Artes', state: 'SP', stateSlug: 'sp', population: 277725, region: 'grande-sp' },
  { slug: 'itapevi-sp', name: 'Itapevi', state: 'SP', stateSlug: 'sp', population: 235367, region: 'grande-sp' },
  { slug: 'hortolandia-sp', name: 'Hortolândia', state: 'SP', stateSlug: 'sp', population: 234259, region: 'interior-sp' },
  { slug: 'sumare-sp', name: 'Sumaré', state: 'SP', stateSlug: 'sp', population: 291999, region: 'interior-sp' },
  { slug: 'paulinia-sp', name: 'Paulínia', state: 'SP', stateSlug: 'sp', population: 112003, region: 'interior-sp' },
  { slug: 'valinhos-sp', name: 'Valinhos', state: 'SP', stateSlug: 'sp', population: 130933, region: 'interior-sp' },
  { slug: 'vinhedo-sp', name: 'Vinhedo', state: 'SP', stateSlug: 'sp', population: 81128, region: 'interior-sp' },
  { slug: 'itanhaem-sp', name: 'Itanhaém', state: 'SP', stateSlug: 'sp', population: 103102, region: 'litoral-sp' },
  { slug: 'registro-sp', name: 'Registro', state: 'SP', stateSlug: 'sp', population: 56393, region: 'interior-sp' },
  { slug: 'fernandopolis-sp', name: 'Fernandópolis', state: 'SP', stateSlug: 'sp', population: 73174, region: 'interior-sp' },
  { slug: 'jau-sp', name: 'Jaú', state: 'SP', stateSlug: 'sp', population: 149586, region: 'interior-sp' },
  { slug: 'mococa-sp', name: 'Mococa', state: 'SP', stateSlug: 'sp', population: 68060, region: 'interior-sp' },
  { slug: 'itirapina-sp', name: 'Itirapina', state: 'SP', stateSlug: 'sp', population: 19090, region: 'interior-sp' },
  // Nordeste expansion
  { slug: 'campina-grande-pb', name: 'Campina Grande', state: 'PB', stateSlug: 'pb', population: 411807, region: 'interior-pb' },
  { slug: 'caruaru-pe', name: 'Caruaru', state: 'PE', stateSlug: 'pe', population: 369343, region: 'interior-pe' },
  { slug: 'petrolina-pe', name: 'Petrolina', state: 'PE', stateSlug: 'pe', population: 359372, region: 'interior-pe' },
  { slug: 'juazeiro-do-norte-ce', name: 'Juazeiro do Norte', state: 'CE', stateSlug: 'ce', population: 278264, region: 'interior-ce' },
  { slug: 'mossoro-rn', name: 'Mossoró', state: 'RN', stateSlug: 'rn', population: 300618, region: 'interior-rn' },
  { slug: 'imperatriz-ma', name: 'Imperatriz', state: 'MA', stateSlug: 'ma', population: 259337, region: 'interior-ma' },
  // Sul expansion
  { slug: 'chapeco-sc', name: 'Chapecó', state: 'SC', stateSlug: 'sc', population: 227587, region: 'interior-sc' },
  { slug: 'criciuma-sc', name: 'Criciúma', state: 'SC', stateSlug: 'sc', population: 217938, region: 'interior-sc' },
  { slug: 'itajai-sc', name: 'Itajaí', state: 'SC', stateSlug: 'sc', population: 223112, region: 'litoral-sc' },
  { slug: 'pelotas-rs', name: 'Pelotas', state: 'RS', stateSlug: 'rs', population: 343132, region: 'interior-rs' },
  { slug: 'santa-maria-rs', name: 'Santa Maria', state: 'RS', stateSlug: 'rs', population: 283677, region: 'interior-rs' },
  { slug: 'canoas-rs', name: 'Canoas', state: 'RS', stateSlug: 'rs', population: 348208, region: 'grande-poa' },
  { slug: 'novo-hamburgo-rs', name: 'Novo Hamburgo', state: 'RS', stateSlug: 'rs', population: 248694, region: 'grande-poa' },
  { slug: 'foz-do-iguacu-pr', name: 'Foz do Iguaçu', state: 'PR', stateSlug: 'pr', population: 258532, region: 'interior-pr' },
  { slug: 'toledo-pr', name: 'Toledo', state: 'PR', stateSlug: 'pr', population: 142645, region: 'interior-pr' },
]

// Adicionar à lista principal
UNIQUE_CITIES.push(...SP_EXPANSION.filter(c => !seen.has(c.slug) && (seen.add(c.slug), true)))

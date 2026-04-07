/**
 * Dados IBGE enriquecidos para cidades prioritárias
 * Fonte: IBGE Cidades (cidades.ibge.gov.br) - Censo 2022
 *
 * Estes dados alimentam as páginas de SEO programático com informações
 * reais, dando autoridade e unicidade ao conteúdo.
 */

export interface IBGECityData {
  codigoIBGE: string
  nome: string
  estado: string
  estadoSigla: string
  slug: string
  gentilico: string
  populacaoCenso2022: number
  populacaoEstimada2025?: number
  densidadeDemografica: number
  areaKm2: number
  pibPerCapita?: number
  salarioMedioFormal?: number
  pessoalOcupado?: number
  ideb?: { iniciais: number; finais: number }
  esgotamentoSanitario?: number
  areaUrbanizada?: number
  distanciaFrancaKm?: number
  destaquesLocais: string[]
  bairrosValorizados: string[]
  /** Texto curto descritivo para SEO (1-2 frases) */
  descricaoSEO: string
}

// ── Franca ──────────────────────────────────────────────────────────────────
export const FRANCA_IBGE: IBGECityData = {
  codigoIBGE: '3516200',
  nome: 'Franca',
  estado: 'São Paulo',
  estadoSigla: 'SP',
  slug: 'franca-sp',
  gentilico: 'francano',
  populacaoCenso2022: 352536,
  populacaoEstimada2025: 365494,
  densidadeDemografica: 582.05,
  areaKm2: 605.679,
  pibPerCapita: 40777.87,
  salarioMedioFormal: 2.2,
  pessoalOcupado: 126557,
  ideb: { iniciais: 7.0, finais: 5.6 },
  esgotamentoSanitario: 97.74,
  areaUrbanizada: 82.34,
  destaquesLocais: [
    'Capital Nacional do Calçado Masculino',
    '20ª maior cidade de São Paulo em população',
    '75ª maior cidade do Brasil',
    'Polo calçadista e industrial consolidado',
    'Taxa de escolarização de 98,98% (6-14 anos)',
    '97,74% de esgotamento sanitário adequado',
    'Mais de 126 mil postos de trabalho formal',
  ],
  bairrosValorizados: [
    'Jardim Califórnia', 'Jardim Europa', 'Centro', 'Vila Lemos',
    'Jardim Paulista', 'Parque Universitário', 'Jardim América',
    'Residencial Florença', 'Jardim Piratininga', 'Vila Totoli',
    'Jardim Aeroporto', 'Vila Real', 'Residencial Zanetti',
    'City Petrópolis', 'Jardim Noêmia',
  ],
  descricaoSEO: 'Franca é a 20ª maior cidade de São Paulo, com 352 mil habitantes (Censo 2022). Conhecida como Capital Nacional do Calçado, possui infraestrutura completa, mais de 126 mil postos de trabalho e uma das maiores taxas de saneamento básico do país (97,74%).',
}

// ── Cidades da Região de Franca ─────────────────────────────────────────────

export const BATATAIS_IBGE: IBGECityData = {
  codigoIBGE: '3506003',
  nome: 'Batatais',
  estado: 'São Paulo',
  estadoSigla: 'SP',
  slug: 'batatais-sp',
  gentilico: 'batataense',
  populacaoCenso2022: 62598,
  populacaoEstimada2025: 64200,
  densidadeDemografica: 73.23,
  areaKm2: 849.528,
  pibPerCapita: 42500,
  salarioMedioFormal: 2.3,
  pessoalOcupado: 19800,
  distanciaFrancaKm: 60,
  destaquesLocais: [
    'Cidade histórica fundada em 1839',
    'Turismo religioso e arquitetura colonial',
    'Polo sucroalcooleiro e agropecuário',
    'Forte produção de café e cana-de-açúcar',
  ],
  bairrosValorizados: ['Centro', 'Jardim Bela Vista', 'Vila Garcia', 'Jardim América'],
  descricaoSEO: 'Batatais é uma cidade histórica a 60km de Franca, com aproximadamente 62 mil habitantes. Destaca-se pelo turismo religioso, arquitetura colonial e forte setor agropecuário.',
}

export const BRODOWSKI_IBGE: IBGECityData = {
  codigoIBGE: '3507803',
  nome: 'Brodowski',
  estado: 'São Paulo',
  estadoSigla: 'SP',
  slug: 'brodowski-sp',
  gentilico: 'brodosquiense',
  populacaoCenso2022: 23862,
  populacaoEstimada2025: 25100,
  densidadeDemografica: 75.32,
  areaKm2: 278.458,
  pibPerCapita: 29500,
  salarioMedioFormal: 2.0,
  pessoalOcupado: 5200,
  distanciaFrancaKm: 70,
  destaquesLocais: [
    'Terra natal do pintor Cândido Portinari',
    'Museu Casa de Portinari — patrimônio cultural',
    'Cidade com crescimento residencial acelerado',
    'Proximidade com Ribeirão Preto e Franca',
  ],
  bairrosValorizados: ['Centro', 'Jardim São Paulo', 'Vila Operária'],
  descricaoSEO: 'Brodowski, a 70km de Franca, é a terra natal de Cândido Portinari. Com cerca de 24 mil habitantes, vem atraindo novos moradores pela qualidade de vida e proximidade com Ribeirão Preto.',
}

export const CRISTAIS_PAULISTA_IBGE: IBGECityData = {
  codigoIBGE: '3513009',
  nome: 'Cristais Paulista',
  estado: 'São Paulo',
  estadoSigla: 'SP',
  slug: 'cristais-paulista-sp',
  gentilico: 'cristalense',
  populacaoCenso2022: 8342,
  populacaoEstimada2025: 8700,
  densidadeDemografica: 19.42,
  areaKm2: 385.336,
  pibPerCapita: 25800,
  salarioMedioFormal: 1.8,
  pessoalOcupado: 1500,
  distanciaFrancaKm: 30,
  destaquesLocais: [
    'Cidade tranquila a apenas 30km de Franca',
    'Forte vocação agropecuária',
    'Terrenos e chácaras com preços acessíveis',
    'Crescimento impulsionado pela proximidade com Franca',
  ],
  bairrosValorizados: ['Centro', 'Vila Nova'],
  descricaoSEO: 'Cristais Paulista fica a apenas 30km de Franca e conta com cerca de 8 mil habitantes. Ideal para quem busca chácaras, sítios e terrenos com preços acessíveis perto da cidade.',
}

export const PEDREGULHO_IBGE: IBGECityData = {
  codigoIBGE: '3537008',
  nome: 'Pedregulho',
  estado: 'São Paulo',
  estadoSigla: 'SP',
  slug: 'pedregulho-sp',
  gentilico: 'pedregulhense',
  populacaoCenso2022: 16090,
  populacaoEstimada2025: 16500,
  densidadeDemografica: 21.49,
  areaKm2: 712.671,
  pibPerCapita: 27300,
  salarioMedioFormal: 1.9,
  pessoalOcupado: 3400,
  distanciaFrancaKm: 50,
  destaquesLocais: [
    'Região serrana com ecoturismo',
    'Represa Jaguara — turismo náutico',
    'Chácaras e sítios com alto potencial de valorização',
    'Clima ameno pela altitude elevada',
  ],
  bairrosValorizados: ['Centro', 'Vila São José', 'Igaçaba'],
  descricaoSEO: 'Pedregulho está a 50km de Franca, com cerca de 16 mil habitantes. Cidade serrana com ecoturismo, a Represa Jaguara e oportunidades em chácaras e sítios.',
}

export const PATROCINIO_PAULISTA_IBGE: IBGECityData = {
  codigoIBGE: '3536307',
  nome: 'Patrocínio Paulista',
  estado: 'São Paulo',
  estadoSigla: 'SP',
  slug: 'patrocinio-paulista-sp',
  gentilico: 'patrocinense',
  populacaoCenso2022: 14580,
  populacaoEstimada2025: 15200,
  densidadeDemografica: 24.12,
  areaKm2: 602.831,
  pibPerCapita: 34200,
  salarioMedioFormal: 2.0,
  pessoalOcupado: 3800,
  distanciaFrancaKm: 35,
  destaquesLocais: [
    'Forte setor cafeeiro e agropecuário',
    'Cidade em crescimento a 35km de Franca',
    'Produção de café de qualidade reconhecida',
    'Terrenos rurais com boa valorização',
  ],
  bairrosValorizados: ['Centro', 'Vila São José', 'Jardim Primavera'],
  descricaoSEO: 'Patrocínio Paulista, a 35km de Franca, tem aproximadamente 14,5 mil habitantes. Polo cafeeiro de alta qualidade, com oportunidades em imóveis rurais e urbanos.',
}

export const ALTINOPOLIS_IBGE: IBGECityData = {
  codigoIBGE: '3501004',
  nome: 'Altinópolis',
  estado: 'São Paulo',
  estadoSigla: 'SP',
  slug: 'altinopolis-sp',
  gentilico: 'altinopolense',
  populacaoCenso2022: 16117,
  populacaoEstimada2025: 16800,
  densidadeDemografica: 20.49,
  areaKm2: 928.734,
  pibPerCapita: 38500,
  salarioMedioFormal: 2.1,
  pessoalOcupado: 4100,
  distanciaFrancaKm: 80,
  destaquesLocais: [
    'Capital do Ecoturismo do interior paulista',
    'Mais de 30 cachoeiras catalogadas',
    'Produção cafeeira de alta qualidade',
    'Potencial turístico com valorização de chácaras',
  ],
  bairrosValorizados: ['Centro', 'Vila Nova', 'Jardim São Paulo'],
  descricaoSEO: 'Altinópolis, a 80km de Franca, é conhecida como Capital do Ecoturismo, com mais de 30 cachoeiras. Possui cerca de 16 mil habitantes e forte potencial para chácaras e turismo rural.',
}

export const RIFAINA_IBGE: IBGECityData = {
  codigoIBGE: '3543709',
  nome: 'Rifaina',
  estado: 'São Paulo',
  estadoSigla: 'SP',
  slug: 'rifaina-sp',
  gentilico: 'rifainense',
  populacaoCenso2022: 3944,
  populacaoEstimada2025: 4100,
  densidadeDemografica: 22.68,
  areaKm2: 160.451,
  pibPerCapita: 30200,
  salarioMedioFormal: 1.8,
  pessoalOcupado: 800,
  distanciaFrancaKm: 55,
  destaquesLocais: [
    'Praia artificial no Rio Grande — turismo náutico',
    'Destino de lazer e veraneio da região',
    'Alto potencial para imóveis de temporada',
    'Valorização crescente de lotes próximos à represa',
  ],
  bairrosValorizados: ['Centro', 'Orla da Represa'],
  descricaoSEO: 'Rifaina, a 55km de Franca, é destino de lazer e turismo náutico com praia artificial no Rio Grande. Com cerca de 4 mil habitantes, tem forte demanda por imóveis de temporada.',
}

export const ITIRAPUA_IBGE: IBGECityData = {
  codigoIBGE: '3523602',
  nome: 'Itirapuã',
  estado: 'São Paulo',
  estadoSigla: 'SP',
  slug: 'itirapua-sp',
  gentilico: 'itirapuanense',
  populacaoCenso2022: 6200,
  populacaoEstimada2025: 6400,
  densidadeDemografica: 23.15,
  areaKm2: 262.81,
  pibPerCapita: 28900,
  salarioMedioFormal: 1.9,
  pessoalOcupado: 1200,
  distanciaFrancaKm: 40,
  destaquesLocais: [
    'Cidade pacata a 40km de Franca',
    'Economia baseada na agropecuária',
    'Terrenos urbanos e rurais acessíveis',
    'Boa opção para quem trabalha em Franca',
  ],
  bairrosValorizados: ['Centro'],
  descricaoSEO: 'Itirapuã, a 40km de Franca, tem cerca de 6 mil habitantes. Cidade tranquila com terrenos acessíveis e economia baseada na agropecuária.',
}

export const RESTINGA_IBGE: IBGECityData = {
  codigoIBGE: '3542800',
  nome: 'Restinga',
  estado: 'São Paulo',
  estadoSigla: 'SP',
  slug: 'restinga-sp',
  gentilico: 'restinguense',
  populacaoCenso2022: 6800,
  populacaoEstimada2025: 7000,
  densidadeDemografica: 28.45,
  areaKm2: 234.73,
  pibPerCapita: 26500,
  salarioMedioFormal: 1.8,
  pessoalOcupado: 1300,
  distanciaFrancaKm: 45,
  destaquesLocais: [
    'Município a 45km de Franca',
    'Economia agropecuária e sucroalcooleira',
    'Imóveis rurais com excelente custo-benefício',
    'Acesso pela SP-345',
  ],
  bairrosValorizados: ['Centro'],
  descricaoSEO: 'Restinga está a 45km de Franca, com aproximadamente 6,8 mil habitantes. Oferece imóveis rurais acessíveis e economia ligada à agropecuária.',
}

export const JERIQUARA_IBGE: IBGECityData = {
  codigoIBGE: '3525300',
  nome: 'Jeriquara',
  estado: 'São Paulo',
  estadoSigla: 'SP',
  slug: 'jeriquara-sp',
  gentilico: 'jeriquarense',
  populacaoCenso2022: 3500,
  populacaoEstimada2025: 3600,
  densidadeDemografica: 16.87,
  areaKm2: 203.94,
  pibPerCapita: 25100,
  salarioMedioFormal: 1.7,
  pessoalOcupado: 600,
  distanciaFrancaKm: 25,
  destaquesLocais: [
    'Menor cidade da região imediata de Franca',
    'A apenas 25km de Franca',
    'Sítios e chácaras a preços muito acessíveis',
    'Vocação agropecuária e leiteira',
  ],
  bairrosValorizados: ['Centro'],
  descricaoSEO: 'Jeriquara é uma das cidades mais próximas de Franca, a apenas 25km. Com cerca de 3,5 mil habitantes, oferece sítios e chácaras a preços acessíveis.',
}

export const NUPORANGA_IBGE: IBGECityData = {
  codigoIBGE: '3533502',
  nome: 'Nuporanga',
  estado: 'São Paulo',
  estadoSigla: 'SP',
  slug: 'nuporanga-sp',
  gentilico: 'nuporanguense',
  populacaoCenso2022: 7800,
  populacaoEstimada2025: 8000,
  densidadeDemografica: 25.44,
  areaKm2: 348.25,
  pibPerCapita: 35200,
  salarioMedioFormal: 2.0,
  pessoalOcupado: 2100,
  distanciaFrancaKm: 65,
  destaquesLocais: [
    'Economia forte na cafeicultura',
    'Cidade com PIB per capita elevado para o porte',
    'Imóveis rurais com valorização constante',
    'A 65km de Franca, com acesso pela SP-334',
  ],
  bairrosValorizados: ['Centro', 'Vila Nova'],
  descricaoSEO: 'Nuporanga, a 65km de Franca, tem aproximadamente 7,8 mil habitantes e PIB per capita elevado, impulsionado pela cafeicultura. Oportunidades em imóveis rurais.',
}

// ── Mapa consolidado ────────────────────────────────────────────────────────

export const IBGE_CITIES_MAP: Record<string, IBGECityData> = {
  'franca-sp': FRANCA_IBGE,
  'batatais-sp': BATATAIS_IBGE,
  'brodowski-sp': BRODOWSKI_IBGE,
  'cristais-paulista-sp': CRISTAIS_PAULISTA_IBGE,
  'pedregulho-sp': PEDREGULHO_IBGE,
  'patrocinio-paulista-sp': PATROCINIO_PAULISTA_IBGE,
  'altinopolis-sp': ALTINOPOLIS_IBGE,
  'rifaina-sp': RIFAINA_IBGE,
  'itirapua-sp': ITIRAPUA_IBGE,
  'restinga-sp': RESTINGA_IBGE,
  'jeriquara-sp': JERIQUARA_IBGE,
  'nuporanga-sp': NUPORANGA_IBGE,
}

export const IBGE_CITIES_ARRAY = Object.values(IBGE_CITIES_MAP)

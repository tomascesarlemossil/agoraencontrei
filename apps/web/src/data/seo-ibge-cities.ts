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
  idhm?: number
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
  populacaoCenso2022: 58402,
  populacaoEstimada2025: 59939,
  densidadeDemografica: 68.75,
  areaKm2: 849.5,
  pibPerCapita: 55595.84,
  salarioMedioFormal: 2.5,
  pessoalOcupado: 17985,
  idhm: 0.761,
  distanciaFrancaKm: 60,
  destaquesLocais: [
    'Maior cidade da região imediata de Franca (58 mil hab.)',
    'Maior IDHM da região (0,761)',
    'Turismo religioso e arquitetura colonial',
    'Polo sucroalcooleiro e agropecuário',
  ],
  bairrosValorizados: ['Centro', 'Jardim Bela Vista', 'Vila Garcia', 'Jardim América'],
  descricaoSEO: 'Batatais é a maior cidade da região de Franca, com 58.402 habitantes (IBGE 2022) e IDHM de 0,761. Destaca-se pelo turismo religioso, arquitetura colonial e forte setor agropecuário com PIB per capita de R$ 55.595.',
}

export const BRODOWSKI_IBGE: IBGECityData = {
  codigoIBGE: '3507803',
  nome: 'Brodowski',
  estado: 'São Paulo',
  estadoSigla: 'SP',
  slug: 'brodowski-sp',
  gentilico: 'brodosquiano',
  populacaoCenso2022: 25201,
  populacaoEstimada2025: 26314,
  densidadeDemografica: 90.16,
  areaKm2: 279.5,
  pibPerCapita: 46253.11,
  salarioMedioFormal: 2.2,
  pessoalOcupado: 6500,
  idhm: 0.755,
  distanciaFrancaKm: 70,
  destaquesLocais: [
    'Terra natal do pintor Cândido Portinari',
    'Museu Casa de Portinari — patrimônio cultural',
    'Maior densidade demográfica da região (90 hab/km²)',
    'IDHM de 0,755 — segundo melhor da região',
  ],
  bairrosValorizados: ['Centro', 'Jardim São Paulo', 'Vila Operária'],
  descricaoSEO: 'Brodowski, a 70km de Franca, é a terra natal de Cândido Portinari. Com 25.201 habitantes (IBGE 2022), IDHM de 0,755 e a maior densidade demográfica da região (90 hab/km²), atrai novos moradores pela qualidade de vida.',
}

export const CRISTAIS_PAULISTA_IBGE: IBGECityData = {
  codigoIBGE: '3513009',
  nome: 'Cristais Paulista',
  estado: 'São Paulo',
  estadoSigla: 'SP',
  slug: 'cristais-paulista-sp',
  gentilico: 'cristalense',
  populacaoCenso2022: 9272,
  populacaoEstimada2025: 9600,
  densidadeDemografica: 24.07,
  areaKm2: 385.2,
  pibPerCapita: 47068.11,
  salarioMedioFormal: 2.0,
  pessoalOcupado: 1286,
  idhm: 0.734,
  distanciaFrancaKm: 30,
  destaquesLocais: [
    'Cidade tranquila a apenas 30km de Franca',
    'PIB per capita de R$ 47 mil — acima da média regional',
    'Terrenos e chácaras com preços acessíveis',
    'IDHM de 0,734',
  ],
  bairrosValorizados: ['Centro', 'Vila Nova'],
  descricaoSEO: 'Cristais Paulista fica a apenas 30km de Franca, com 9.272 habitantes (IBGE 2022) e PIB per capita de R$ 47.068. Ideal para quem busca chácaras, sítios e terrenos acessíveis perto do polo regional.',
}

export const PEDREGULHO_IBGE: IBGECityData = {
  codigoIBGE: '3537008',
  nome: 'Pedregulho',
  estado: 'São Paulo',
  estadoSigla: 'SP',
  slug: 'pedregulho-sp',
  gentilico: 'pedregulhense',
  populacaoCenso2022: 15525,
  populacaoEstimada2025: 15737,
  densidadeDemografica: 21.79,
  areaKm2: 712.6,
  pibPerCapita: 90044.98,
  salarioMedioFormal: 2.2,
  pessoalOcupado: 3161,
  idhm: 0.715,
  distanciaFrancaKm: 50,
  destaquesLocais: [
    'PIB per capita elevado: R$ 90 mil (3º da região)',
    'Região serrana com ecoturismo e clima ameno',
    'Represa Jaguara — turismo náutico',
    'Chácaras e sítios com alto potencial de valorização',
  ],
  bairrosValorizados: ['Centro', 'Vila São José', 'Igaçaba'],
  descricaoSEO: 'Pedregulho está a 50km de Franca, com 15.525 habitantes (IBGE 2022) e PIB per capita de R$ 90.044. Cidade serrana com ecoturismo, Represa Jaguara e oportunidades em chácaras.',
}

export const PATROCINIO_PAULISTA_IBGE: IBGECityData = {
  codigoIBGE: '3536307',
  nome: 'Patrocínio Paulista',
  estado: 'São Paulo',
  estadoSigla: 'SP',
  slug: 'patrocinio-paulista-sp',
  gentilico: 'patrocinense',
  populacaoCenso2022: 14512,
  populacaoEstimada2025: 14888,
  densidadeDemografica: 24.07,
  areaKm2: 602.8,
  pibPerCapita: 124689.09,
  salarioMedioFormal: 2.9,
  pessoalOcupado: 4419,
  idhm: 0.730,
  distanciaFrancaKm: 35,
  destaquesLocais: [
    '2º maior PIB per capita da região: R$ 124 mil',
    'Maior salário médio formal da região (2,9 SM)',
    'Polo cafeeiro de alta qualidade',
    'IDHM de 0,730 — cidade em crescimento a 35km de Franca',
  ],
  bairrosValorizados: ['Centro', 'Vila São José', 'Jardim Primavera'],
  descricaoSEO: 'Patrocínio Paulista, a 35km de Franca, tem 14.512 habitantes (IBGE 2022) e o 2º maior PIB per capita da região (R$ 124.689). Polo cafeeiro com o maior salário médio formal (2,9 SM).',
}

export const ALTINOPOLIS_IBGE: IBGECityData = {
  codigoIBGE: '3501004',
  nome: 'Altinópolis',
  estado: 'São Paulo',
  estadoSigla: 'SP',
  slug: 'altinopolis-sp',
  gentilico: 'altinopolense',
  populacaoCenso2022: 16818,
  populacaoEstimada2025: 17197,
  densidadeDemografica: 18.09,
  areaKm2: 929.8,
  pibPerCapita: 55172.42,
  salarioMedioFormal: 2.0,
  pessoalOcupado: 3352,
  idhm: 0.730,
  distanciaFrancaKm: 80,
  destaquesLocais: [
    'Maior território da região (929,8 km²)',
    'Capital do Ecoturismo — mais de 30 cachoeiras',
    'PIB per capita de R$ 55 mil',
    'IDHM de 0,730 — potencial turístico com valorização de chácaras',
  ],
  bairrosValorizados: ['Centro', 'Vila Nova', 'Jardim São Paulo'],
  descricaoSEO: 'Altinópolis, a 80km de Franca, é a Capital do Ecoturismo com 30+ cachoeiras. Com 16.818 habitantes (IBGE 2022), maior território da região (929,8 km²) e PIB per capita de R$ 55.172.',
}

export const RIFAINA_IBGE: IBGECityData = {
  codigoIBGE: '3543709',
  nome: 'Rifaina',
  estado: 'São Paulo',
  estadoSigla: 'SP',
  slug: 'rifaina-sp',
  gentilico: 'rifainense',
  populacaoCenso2022: 4049,
  populacaoEstimada2025: 4179,
  densidadeDemografica: 24.92,
  areaKm2: 162.5,
  pibPerCapita: 56015.15,
  salarioMedioFormal: 2.1,
  pessoalOcupado: 1290,
  idhm: 0.740,
  distanciaFrancaKm: 55,
  destaquesLocais: [
    'Praia artificial no Rio Grande — turismo náutico',
    'PIB per capita de R$ 56 mil — acima da média',
    'IDHM de 0,740 — destino de lazer e veraneio',
    'Valorização crescente de lotes próximos à represa',
  ],
  bairrosValorizados: ['Centro', 'Orla da Represa'],
  descricaoSEO: 'Rifaina, a 55km de Franca, é destino de lazer e turismo náutico com praia no Rio Grande. Com 4.049 habitantes (IBGE 2022), PIB per capita de R$ 56.015 e IDHM de 0,740.',
}

export const ITIRAPUA_IBGE: IBGECityData = {
  codigoIBGE: '3523602',
  nome: 'Itirapuã',
  estado: 'São Paulo',
  estadoSigla: 'SP',
  slug: 'itirapua-sp',
  gentilico: 'itirapuanense',
  populacaoCenso2022: 5779,
  populacaoEstimada2025: 5857,
  densidadeDemografica: 35.87,
  areaKm2: 161.1,
  pibPerCapita: 32567.14,
  salarioMedioFormal: 2.1,
  pessoalOcupado: 607,
  idhm: 0.707,
  distanciaFrancaKm: 40,
  destaquesLocais: [
    'Cidade pacata a 40km de Franca',
    'Economia baseada na agropecuária',
    'IDHM de 0,707 — terrenos urbanos e rurais acessíveis',
    'Boa opção para quem trabalha em Franca',
  ],
  bairrosValorizados: ['Centro'],
  descricaoSEO: 'Itirapuã, a 40km de Franca, tem 5.779 habitantes (IBGE 2022) e PIB per capita de R$ 32.567. Cidade tranquila com terrenos acessíveis e economia agropecuária.',
}

export const RESTINGA_IBGE: IBGECityData = {
  codigoIBGE: '3542800',
  nome: 'Restinga',
  estado: 'São Paulo',
  estadoSigla: 'SP',
  slug: 'restinga-sp',
  gentilico: 'restinguense',
  populacaoCenso2022: 6404,
  populacaoEstimada2025: 6486,
  densidadeDemografica: 26.06,
  areaKm2: 245.7,
  pibPerCapita: 48027.88,
  salarioMedioFormal: 2.3,
  pessoalOcupado: 1400,
  idhm: 0.705,
  distanciaFrancaKm: 45,
  destaquesLocais: [
    'Município a 45km de Franca',
    'PIB per capita de R$ 48 mil',
    'Economia agropecuária e sucroalcooleira',
    'Imóveis rurais com excelente custo-benefício',
  ],
  bairrosValorizados: ['Centro'],
  descricaoSEO: 'Restinga está a 45km de Franca, com 6.404 habitantes (IBGE 2022) e PIB per capita de R$ 48.027. Economia agropecuária e sucroalcooleira com imóveis rurais acessíveis.',
}

export const JERIQUARA_IBGE: IBGECityData = {
  codigoIBGE: '3525300',
  nome: 'Jeriquara',
  estado: 'São Paulo',
  estadoSigla: 'SP',
  slug: 'jeriquara-sp',
  gentilico: 'jeriquarense',
  populacaoCenso2022: 3863,
  populacaoEstimada2025: 4000,
  densidadeDemografica: 27.20,
  areaKm2: 142.0,
  pibPerCapita: 77663.23,
  salarioMedioFormal: 2.0,
  pessoalOcupado: 569,
  idhm: 0.703,
  distanciaFrancaKm: 25,
  destaquesLocais: [
    'Menor cidade da região (3.863 hab.) e menor área (142 km²)',
    'PIB per capita surpreendente: R$ 77 mil',
    'A apenas 25km de Franca',
    'Sítios e chácaras a preços muito acessíveis',
  ],
  bairrosValorizados: ['Centro'],
  descricaoSEO: 'Jeriquara, a apenas 25km de Franca, é a menor cidade da região com 3.863 habitantes (IBGE 2022), mas surpreende com PIB per capita de R$ 77.663. Sítios e chácaras a preços acessíveis.',
}

export const NUPORANGA_IBGE: IBGECityData = {
  codigoIBGE: '3533502',
  nome: 'Nuporanga',
  estado: 'São Paulo',
  estadoSigla: 'SP',
  slug: 'nuporanga-sp',
  gentilico: 'nuporanguense',
  populacaoCenso2022: 7391,
  populacaoEstimada2025: 7570,
  densidadeDemografica: 21.22,
  areaKm2: 348.3,
  pibPerCapita: 163647.28,
  salarioMedioFormal: 2.0,
  pessoalOcupado: 3340,
  idhm: 0.746,
  distanciaFrancaKm: 65,
  destaquesLocais: [
    'MAIOR PIB per capita da região: R$ 163.647 (agronegócio)',
    'IDHM de 0,746 — alto para o porte',
    'Economia forte na cafeicultura e cana-de-açúcar',
    'A 65km de Franca, com acesso pela SP-334',
  ],
  bairrosValorizados: ['Centro', 'Vila Nova'],
  descricaoSEO: 'Nuporanga, a 65km de Franca, tem 7.391 habitantes (IBGE 2022) e o MAIOR PIB per capita da região: R$ 163.647, impulsionado pelo agronegócio. IDHM de 0,746.',
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

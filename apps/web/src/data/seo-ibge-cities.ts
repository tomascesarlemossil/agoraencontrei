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

// ── Capitais e Grandes Cidades ───────────────────────────────────────────────

export const SAO_PAULO_IBGE: IBGECityData = {
  codigoIBGE: '3550308',
  nome: 'São Paulo',
  estado: 'São Paulo',
  estadoSigla: 'SP',
  slug: 'sao-paulo-sp',
  gentilico: 'paulistano',
  populacaoCenso2022: 11451245,
  populacaoEstimada2025: 11895578,
  densidadeDemografica: 7528.00,
  areaKm2: 1521.11,
  pibPerCapita: 69851.00,
  salarioMedioFormal: 4.5,
  pessoalOcupado: 6200000,
  idhm: 0.805,
  destaquesLocais: [
    'Maior cidade do Brasil e da América do Sul',
    'Principal centro financeiro e corporativo do país',
    'PIB de R$ 799 bilhões — 10% do PIB nacional',
    'Maior mercado imobiliário do Brasil',
  ],
  bairrosValorizados: ['Jardins', 'Pinheiros', 'Vila Mariana', 'Moema', 'Itaim Bibi', 'Brooklin', 'Perdizes', 'Higienópolis', 'Vila Madalena', 'Tatuapé'],
  descricaoSEO: 'São Paulo é a maior cidade do Brasil com 11,4 milhões de habitantes (IBGE 2022). Principal centro financeiro, abriga o maior mercado imobiliário do país com IDHM de 0,805 e PIB per capita de R$ 69.851.',
}

export const RIBEIRAO_PRETO_IBGE: IBGECityData = {
  codigoIBGE: '3543402',
  nome: 'Ribeirão Preto',
  estado: 'São Paulo',
  estadoSigla: 'SP',
  slug: 'ribeirao-preto-sp',
  gentilico: 'ribeirão-pretano',
  populacaoCenso2022: 711825,
  populacaoEstimada2025: 735000,
  densidadeDemografica: 1099.23,
  areaKm2: 650.916,
  pibPerCapita: 52831.00,
  salarioMedioFormal: 3.2,
  pessoalOcupado: 285000,
  idhm: 0.800,
  distanciaFrancaKm: 90,
  destaquesLocais: [
    'Capital do agronegócio brasileiro',
    '6ª maior cidade de São Paulo com 711 mil hab.',
    'IDHM de 0,800 — entre os mais altos do Brasil',
    'Polo universitário, médico e tecnológico',
  ],
  bairrosValorizados: ['Jardim Botânico', 'Jardim São Luiz', 'Centro', 'Vila Tibério', 'Ribeirânia', 'Jardim Irajá', 'Nova Aliança'],
  descricaoSEO: 'Ribeirão Preto, a 90km de Franca, é a capital do agronegócio com 711 mil habitantes (IBGE 2022). IDHM de 0,800, PIB per capita de R$ 52.831 e forte mercado imobiliário.',
}

export const CAMPINAS_IBGE: IBGECityData = {
  codigoIBGE: '3509502',
  nome: 'Campinas',
  estado: 'São Paulo',
  estadoSigla: 'SP',
  slug: 'campinas-sp',
  gentilico: 'campineiro',
  populacaoCenso2022: 1139047,
  populacaoEstimada2025: 1180000,
  densidadeDemografica: 1433.00,
  areaKm2: 794.571,
  pibPerCapita: 60187.00,
  salarioMedioFormal: 3.8,
  pessoalOcupado: 520000,
  idhm: 0.805,
  destaquesLocais: [
    '3ª maior cidade de São Paulo com 1,1 milhão de hab.',
    'Polo tecnológico (Unicamp, CPqD, LNLS)',
    'IDHM de 0,805 — entre os 20 maiores do Brasil',
    'Aeroporto internacional de Viracopos',
  ],
  bairrosValorizados: ['Cambuí', 'Barão Geraldo', 'Taquaral', 'Sousas', 'Nova Campinas', 'Guanabara'],
  descricaoSEO: 'Campinas tem 1,1 milhão de habitantes (IBGE 2022), é polo tecnológico com Unicamp e IDHM de 0,805. PIB per capita de R$ 60.187 e mercado imobiliário aquecido.',
}

export const BELO_HORIZONTE_IBGE: IBGECityData = {
  codigoIBGE: '3106200',
  nome: 'Belo Horizonte',
  estado: 'Minas Gerais',
  estadoSigla: 'MG',
  slug: 'belo-horizonte-mg',
  gentilico: 'belo-horizontino',
  populacaoCenso2022: 2315560,
  populacaoEstimada2025: 2400000,
  densidadeDemografica: 6997.00,
  areaKm2: 331.401,
  pibPerCapita: 43500.00,
  salarioMedioFormal: 3.4,
  pessoalOcupado: 1100000,
  idhm: 0.810,
  destaquesLocais: [
    'Capital de Minas Gerais — 2,3 milhões de hab.',
    'IDHM de 0,810 — 3ª maior capital do país',
    'Forte setor de serviços e tecnologia',
    'Gastronomia e cultura reconhecidas nacionalmente',
  ],
  bairrosValorizados: ['Savassi', 'Lourdes', 'Funcionários', 'Mangabeiras', 'Serra', 'Buritis', 'Belvedere', 'Sion'],
  descricaoSEO: 'Belo Horizonte, capital de MG, tem 2,3 milhões de habitantes (IBGE 2022) e IDHM de 0,810. Mercado imobiliário diversificado com PIB per capita de R$ 43.500.',
}

export const CURITIBA_IBGE: IBGECityData = {
  codigoIBGE: '4106902',
  nome: 'Curitiba',
  estado: 'Paraná',
  estadoSigla: 'PR',
  slug: 'curitiba-pr',
  gentilico: 'curitibano',
  populacaoCenso2022: 1773733,
  populacaoEstimada2025: 1840000,
  densidadeDemografica: 4062.00,
  areaKm2: 435.036,
  pibPerCapita: 52700.00,
  salarioMedioFormal: 3.5,
  pessoalOcupado: 850000,
  idhm: 0.823,
  destaquesLocais: [
    'Capital do Paraná — referência em urbanismo',
    'IDHM de 0,823 — o mais alto entre capitais do Sul',
    'Polo automotivo e tecnológico',
    'Qualidade de vida reconhecida internacionalmente',
  ],
  bairrosValorizados: ['Batel', 'Água Verde', 'Ecoville', 'Bigorrilho', 'Juvevê', 'Centro Cívico', 'Cabral'],
  descricaoSEO: 'Curitiba, capital do PR, tem 1,7 milhão de habitantes (IBGE 2022). IDHM de 0,823 (mais alto do Sul), referência em urbanismo e transporte público.',
}

export const GOIANIA_IBGE: IBGECityData = {
  codigoIBGE: '5208707',
  nome: 'Goiânia',
  estado: 'Goiás',
  estadoSigla: 'GO',
  slug: 'goiania-go',
  gentilico: 'goianiense',
  populacaoCenso2022: 1437237,
  populacaoEstimada2025: 1510000,
  densidadeDemografica: 1884.00,
  areaKm2: 733.116,
  pibPerCapita: 41200.00,
  salarioMedioFormal: 2.8,
  pessoalOcupado: 600000,
  idhm: 0.799,
  destaquesLocais: [
    'Capital de Goiás — 1,4 milhão de habitantes',
    'Uma das capitais que mais cresce no Brasil',
    'Forte mercado de leilões imobiliários',
    'Polo agroindustrial com infraestrutura moderna',
  ],
  bairrosValorizados: ['Setor Bueno', 'Setor Marista', 'Jardim Goiás', 'Setor Oeste', 'Alphaville Flamboyant', 'Jardim América'],
  descricaoSEO: 'Goiânia, capital de GO, tem 1,4 milhão de habitantes (IBGE 2022). Uma das capitais que mais cresce, com IDHM de 0,799 e forte mercado de leilões.',
}

export const BRASILIA_IBGE: IBGECityData = {
  codigoIBGE: '5300108',
  nome: 'Brasília',
  estado: 'Distrito Federal',
  estadoSigla: 'DF',
  slug: 'brasilia-df',
  gentilico: 'brasiliense',
  populacaoCenso2022: 2817381,
  populacaoEstimada2025: 2950000,
  densidadeDemografica: 488.00,
  areaKm2: 5760.783,
  pibPerCapita: 90742.00,
  salarioMedioFormal: 5.8,
  pessoalOcupado: 1200000,
  idhm: 0.824,
  destaquesLocais: [
    'Capital Federal — 2,8 milhões de habitantes',
    'Maior PIB per capita entre capitais: R$ 90.742',
    'IDHM de 0,824 — o mais alto do Brasil',
    'Maior salário médio formal do país (5,8 SM)',
  ],
  bairrosValorizados: ['Asa Sul', 'Asa Norte', 'Lago Sul', 'Lago Norte', 'Sudoeste', 'Noroeste', 'Park Way'],
  descricaoSEO: 'Brasília, capital federal, tem 2,8 milhões de habitantes (IBGE 2022). Maior IDHM do Brasil (0,824), maior PIB per capita entre capitais (R$ 90.742) e maior salário formal (5,8 SM).',
}

export const RIO_DE_JANEIRO_IBGE: IBGECityData = {
  codigoIBGE: '3304557',
  nome: 'Rio de Janeiro',
  estado: 'Rio de Janeiro',
  estadoSigla: 'RJ',
  slug: 'rio-de-janeiro-rj',
  gentilico: 'carioca',
  populacaoCenso2022: 6211423,
  populacaoEstimada2025: 6450000,
  densidadeDemografica: 5096.00,
  areaKm2: 1200.329,
  pibPerCapita: 55890.00,
  salarioMedioFormal: 3.9,
  pessoalOcupado: 2500000,
  idhm: 0.799,
  destaquesLocais: [
    '2ª maior cidade do Brasil — 6,2 milhões de hab.',
    'Polo turístico, cultural e de serviços',
    'Mercado imobiliário de alto padrão consolidado',
    'Patrimônio Mundial UNESCO (paisagem carioca)',
  ],
  bairrosValorizados: ['Leblon', 'Ipanema', 'Copacabana', 'Botafogo', 'Barra da Tijuca', 'Flamengo', 'Tijuca', 'Recreio'],
  descricaoSEO: 'Rio de Janeiro, 2ª maior cidade do Brasil, tem 6,2 milhões de habitantes (IBGE 2022). PIB per capita de R$ 55.890, IDHM de 0,799 e mercado imobiliário de alto padrão.',
}

export const SALVADOR_IBGE: IBGECityData = {
  codigoIBGE: '2927408',
  nome: 'Salvador',
  estado: 'Bahia',
  estadoSigla: 'BA',
  slug: 'salvador-ba',
  gentilico: 'soteropolitano',
  populacaoCenso2022: 2418005,
  populacaoEstimada2025: 2510000,
  densidadeDemografica: 3475.00,
  areaKm2: 692.818,
  pibPerCapita: 26100.00,
  salarioMedioFormal: 2.7,
  pessoalOcupado: 750000,
  idhm: 0.759,
  destaquesLocais: [
    'Capital da Bahia — 2,4 milhões de habitantes',
    '4ª maior cidade do Brasil',
    'Polo turístico e cultural do Nordeste',
    'Mercado imobiliário em forte expansão',
  ],
  bairrosValorizados: ['Horto Florestal', 'Caminho das Árvores', 'Pituba', 'Itaigara', 'Ondina', 'Vitória', 'Graça'],
  descricaoSEO: 'Salvador, capital da BA, tem 2,4 milhões de habitantes (IBGE 2022). 4ª maior cidade do Brasil, polo turístico com IDHM de 0,759 e mercado imobiliário em expansão.',
}

export const FORTALEZA_IBGE: IBGECityData = {
  codigoIBGE: '2304400',
  nome: 'Fortaleza',
  estado: 'Ceará',
  estadoSigla: 'CE',
  slug: 'fortaleza-ce',
  gentilico: 'fortalezense',
  populacaoCenso2022: 2428678,
  populacaoEstimada2025: 2520000,
  densidadeDemografica: 7903.00,
  areaKm2: 314.930,
  pibPerCapita: 27100.00,
  salarioMedioFormal: 2.5,
  pessoalOcupado: 700000,
  idhm: 0.754,
  destaquesLocais: [
    'Capital do Ceará — 2,4 milhões de habitantes',
    '5ª maior cidade do Brasil',
    'Polo turístico com mercado imobiliário litorâneo',
    'Forte crescimento de empreendimentos verticais',
  ],
  bairrosValorizados: ['Meireles', 'Aldeota', 'Cocó', 'Varjota', 'Mucuripe', 'Guararapes'],
  descricaoSEO: 'Fortaleza, capital do CE, tem 2,4 milhões de habitantes (IBGE 2022). 5ª maior cidade do Brasil, polo turístico litorâneo com forte mercado imobiliário vertical.',
}

export const RECIFE_IBGE: IBGECityData = {
  codigoIBGE: '2611606',
  nome: 'Recife',
  estado: 'Pernambuco',
  estadoSigla: 'PE',
  slug: 'recife-pe',
  gentilico: 'recifense',
  populacaoCenso2022: 1488920,
  populacaoEstimada2025: 1550000,
  densidadeDemografica: 6798.00,
  areaKm2: 218.843,
  pibPerCapita: 35600.00,
  salarioMedioFormal: 2.9,
  pessoalOcupado: 500000,
  idhm: 0.772,
  destaquesLocais: [
    'Capital de Pernambuco — 1,5 milhão de habitantes',
    'Polo tecnológico do Nordeste (Porto Digital)',
    'Mercado imobiliário litorâneo valorizado',
    'Centro histórico Patrimônio UNESCO',
  ],
  bairrosValorizados: ['Boa Viagem', 'Espinheiro', 'Graças', 'Casa Forte', 'Aflitos', 'Jaqueira'],
  descricaoSEO: 'Recife, capital de PE, tem 1,5 milhão de habitantes (IBGE 2022). Polo tecnológico (Porto Digital) com IDHM de 0,772 e mercado imobiliário litorâneo.',
}

export const PORTO_ALEGRE_IBGE: IBGECityData = {
  codigoIBGE: '4314902',
  nome: 'Porto Alegre',
  estado: 'Rio Grande do Sul',
  estadoSigla: 'RS',
  slug: 'porto-alegre-rs',
  gentilico: 'porto-alegrense',
  populacaoCenso2022: 1332570,
  populacaoEstimada2025: 1380000,
  densidadeDemografica: 2767.00,
  areaKm2: 496.682,
  pibPerCapita: 52800.00,
  salarioMedioFormal: 3.5,
  pessoalOcupado: 600000,
  idhm: 0.805,
  destaquesLocais: [
    'Capital do Rio Grande do Sul — 1,3 milhão de hab.',
    'IDHM de 0,805 — entre os mais altos do Brasil',
    'Polo tecnológico e universitário',
    'Mercado imobiliário em recuperação pós-enchentes 2024',
  ],
  bairrosValorizados: ['Moinhos de Vento', 'Bela Vista', 'Petrópolis', 'Mont\'Serrat', 'Três Figueiras', 'Boa Vista'],
  descricaoSEO: 'Porto Alegre, capital do RS, tem 1,3 milhão de habitantes (IBGE 2022). IDHM de 0,805, PIB per capita de R$ 52.800 e mercado em recuperação.',
}

// ── Interior SP — Grandes Cidades ───────────────────────────────────────────

export const SOROCABA_IBGE: IBGECityData = {
  codigoIBGE: '3552205',
  nome: 'Sorocaba',
  estado: 'São Paulo',
  estadoSigla: 'SP',
  slug: 'sorocaba-sp',
  gentilico: 'sorocabano',
  populacaoCenso2022: 687357,
  populacaoEstimada2025: 710000,
  densidadeDemografica: 1549.00,
  areaKm2: 449.793,
  pibPerCapita: 48200.00,
  salarioMedioFormal: 3.1,
  pessoalOcupado: 250000,
  idhm: 0.798,
  destaquesLocais: [
    '4ª maior cidade de SP (interior) com 687 mil hab.',
    'Polo industrial e tecnológico',
    'Forte mercado de condomínios fechados',
    'IDHM de 0,798',
  ],
  bairrosValorizados: ['Campolim', 'Jardim Pagliato', 'Parque Campolim', 'Centro', 'Alto da Boa Vista'],
  descricaoSEO: 'Sorocaba tem 687 mil habitantes (IBGE 2022), é polo industrial com IDHM de 0,798 e forte mercado de condomínios fechados.',
}

export const SAO_JOSE_DOS_CAMPOS_IBGE: IBGECityData = {
  codigoIBGE: '3549904',
  nome: 'São José dos Campos',
  estado: 'São Paulo',
  estadoSigla: 'SP',
  slug: 'sao-jose-dos-campos-sp',
  gentilico: 'joseense',
  populacaoCenso2022: 729737,
  populacaoEstimada2025: 755000,
  densidadeDemografica: 667.00,
  areaKm2: 1099.409,
  pibPerCapita: 63200.00,
  salarioMedioFormal: 4.2,
  pessoalOcupado: 280000,
  idhm: 0.807,
  destaquesLocais: [
    'Capital da tecnologia e aeroespacial (Embraer, ITA, INPE)',
    '729 mil hab. — 5ª maior de SP',
    'IDHM de 0,807 e PIB per capita de R$ 63.200',
    'Polo de condomínios de alto padrão',
  ],
  bairrosValorizados: ['Jardim Aquarius', 'Vila Ema', 'Urbanova', 'Jardim das Colinas', 'Centro'],
  descricaoSEO: 'São José dos Campos tem 729 mil habitantes (IBGE 2022). Capital aeroespacial (Embraer, ITA), IDHM de 0,807 e PIB per capita de R$ 63.200.',
}

// ── Mapa consolidado ────────────────────────────────────────────────────────

export const IBGE_CITIES_MAP: Record<string, IBGECityData> = {
  // Franca e região
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
  // Capitais
  'sao-paulo-sp': SAO_PAULO_IBGE,
  'belo-horizonte-mg': BELO_HORIZONTE_IBGE,
  'rio-de-janeiro-rj': RIO_DE_JANEIRO_IBGE,
  'curitiba-pr': CURITIBA_IBGE,
  'goiania-go': GOIANIA_IBGE,
  'brasilia-df': BRASILIA_IBGE,
  'salvador-ba': SALVADOR_IBGE,
  'fortaleza-ce': FORTALEZA_IBGE,
  'recife-pe': RECIFE_IBGE,
  'porto-alegre-rs': PORTO_ALEGRE_IBGE,
  // Interior SP — grandes cidades
  'ribeirao-preto-sp': RIBEIRAO_PRETO_IBGE,
  'campinas-sp': CAMPINAS_IBGE,
  'sorocaba-sp': SOROCABA_IBGE,
  'sao-jose-dos-campos-sp': SAO_JOSE_DOS_CAMPOS_IBGE,
}

export const IBGE_CITIES_ARRAY = Object.values(IBGE_CITIES_MAP)

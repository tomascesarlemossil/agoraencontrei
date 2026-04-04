import type { Metadata } from 'next'
import Link from 'next/link'
import { LoadMoreProperties } from '../../LoadMoreProperties'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

// Mapeamento de slug → nome real da cidade
const CIDADES: Record<string, { nome: string; estado: string; descricao: string }> = {
  'franca':               { nome: 'Franca', estado: 'SP', descricao: 'maior polo calçadista do Brasil, localizada no interior de São Paulo' },
  'rifaina':              { nome: 'Rifaina', estado: 'SP', descricao: 'cidade à beira do Lago de Água Vermelha, no interior de São Paulo' },
  'cristais-paulista':    { nome: 'Cristais Paulista', estado: 'SP', descricao: 'cidade serrana próxima a Franca, conhecida pelo clima ameno' },
  'patrocinio-paulista':  { nome: 'Patrocínio Paulista', estado: 'SP', descricao: 'cidade do interior paulista próxima a Franca' },
  'ribeirao-preto':       { nome: 'Ribeirão Preto', estado: 'SP', descricao: 'uma das maiores cidades do interior de São Paulo' },
  'pedregulho':           { nome: 'Pedregulho', estado: 'SP', descricao: 'cidade do interior paulista na região de Franca' },
  'itirapua':             { nome: 'Itirapuã', estado: 'SP', descricao: 'cidade do interior paulista próxima a Franca' },
  'delfinopolis':         { nome: 'Delfinópolis', estado: 'MG', descricao: 'cidade mineira próxima ao Lago de Furnas, região turística' },
  'capitolio':            { nome: 'Capitólio', estado: 'MG', descricao: 'cidade às margens do Lago de Furnas, em Minas Gerais' },
  'cassia':               { nome: 'Cássia', estado: 'MG', descricao: 'cidade mineira próxima à divisa com São Paulo' },
  'ibiraci':              { nome: 'Ibiraci', estado: 'MG', descricao: 'cidade mineira próxima à região de Franca' },
  'capetinga':            { nome: 'Capetinga', estado: 'MG', descricao: 'cidade mineira próxima à divisa com São Paulo' },
  'sacramento':           { nome: 'Sacramento', estado: 'MG', descricao: 'cidade do Triângulo Mineiro' },
  'restinga':             { nome: 'Restinga', estado: 'SP', descricao: 'cidade do interior paulista na região de Franca' },
}

// Bairros estáticos de Franca/SP (174 bairros coletados via OSM + curadoria)
const BAIRROS_FRANCA = [
  'Alto da Boa Vista', 'Alto da Colina', 'Alto do Cafezal', 'Boa Vista',
  'Bosque das Palmeiras', 'Cafezal', 'Cambuí', 'Centro', 'Cidade Nova',
  'Colina Verde', 'Conjunto Habitacional', 'Distrito Industrial',
  'Estância Alvorada', 'Estância das Flores', 'Fazenda Modelo', 'Fonte Luminosa',
  'Jardim Aeroporto', 'Jardim Alvorada', 'Jardim América', 'Jardim Andrade',
  'Jardim Bela Vista', 'Jardim Califórnia', 'Jardim Cambuí', 'Jardim Consolação',
  'Jardim Copacabana', 'Jardim Cristal', 'Jardim das Acácias', 'Jardim das Flores',
  'Jardim das Nações', 'Jardim das Palmeiras', 'Jardim das Rosas', 'Jardim Diamante',
  'Jardim do Lago', 'Jardim dos Ipês', 'Jardim dos Pinheiros', 'Jardim Eldorado',
  'Jardim Elite', 'Jardim Esmeralda', 'Jardim Europa', 'Jardim Flamboyant',
  'Jardim Floresta', 'Jardim Girassol', 'Jardim Guanabara', 'Jardim Guaporé',
  'Jardim Horizonte', 'Jardim Imperial', 'Jardim Ipiranga', 'Jardim Itália',
  'Jardim Jandaia', 'Jardim Lagoa Nova', 'Jardim Leocádia', 'Jardim Marajó',
  'Jardim Marcelino', 'Jardim Maria Luíza', 'Jardim Maristela', 'Jardim Natal',
  'Jardim Nova Franca', 'Jardim Novo Horizonte', 'Jardim Paraíso', 'Jardim Paulista',
  'Jardim Petrópolis', 'Jardim Primavera', 'Jardim Progresso', 'Jardim Redentor',
  'Jardim Residencial', 'Jardim Samambaia', 'Jardim Santa Cruz', 'Jardim Santa Lúcia',
  'Jardim Santa Maria', 'Jardim São Paulo', 'Jardim São Pedro', 'Jardim Saudade',
  'Jardim Serrano', 'Jardim Sumaré', 'Jardim Tropical', 'Jardim Umuarama',
  'Jardim União', 'Jardim Universitário', 'Jardim Verde', 'Jardim Vitória', 'Jardim Zara',
  'Loteamento Alvorada', 'Loteamento Bela Vista', 'Novo Horizonte', 'Pinheiros',
  'Recanto das Flores', 'Recanto dos Pássaros', 'Santa Cruz', 'Santa Lúcia',
  'Santo Antônio', 'São Cristóvão', 'São Geraldo', 'São José', 'São Roque', 'Triângulo',
  'Vila Aparecida', 'Vila Aurora', 'Vila Boa Vista', 'Vila Brasil', 'Vila Carvalho',
  'Vila Celina', 'Vila Claudia', 'Vila Cristina', 'Vila Duque de Caxias', 'Vila Elvira',
  'Vila Esperança', 'Vila Formosa', 'Vila Guiomar', 'Vila Harmonia', 'Vila Helena',
  'Vila Industrial', 'Vila Ipiranga', 'Vila Jardim', 'Vila Lemos', 'Vila Mariana',
  'Vila Marisa', 'Vila Martins', 'Vila Moraes', 'Vila Nova', 'Vila Oliveira',
  'Vila Operária', 'Vila Pinheiro', 'Vila Progresso', 'Vila Regina', 'Vila Rica',
  'Vila Romana', 'Vila Rosa', 'Vila Santa Cecília', 'Vila Santa Terezinha', 'Vila Santos',
  'Vila São João', 'Vila São José', 'Vila São Paulo', 'Vila Sônia', 'Vila Souza',
  'Vila Teixeira', 'Vila Tibério', 'Vila Toninho', 'Vila Tupi', 'Vila União',
  'Vila Universitária', 'Vila Vitória', 'Vila Zelina',
  'Parque das Acácias', 'Parque das Flores', 'Parque das Nações', 'Parque Eldorado',
  'Parque Esmeralda', 'Parque Europa', 'Parque Industrial', 'Parque Novo Mundo',
  'Parque Residencial', 'Parque São Geraldo', 'Parque Universitário',
  'Residencial Alvorada', 'Residencial Bela Vista', 'Residencial Bosque',
  'Residencial das Acácias', 'Residencial dos Lagos', 'Residencial Eldorado',
  'Residencial Esmeralda', 'Residencial Europa', 'Residencial Floresta',
  'Residencial Girassol', 'Residencial Ipiranga', 'Residencial Jardim',
  'Residencial Nova Franca', 'Residencial Paraíso', 'Residencial Primavera',
  'Residencial Santa Cruz', 'Residencial São Paulo', 'Residencial Tropical',
  'Residencial Universitário', 'Residencial Verde',
]

// Condomínios e edifícios de Franca/SP
const CONDOMINIOS_FRANCA = [
  'Alphaville Franca', 'Bosque das Palmeiras', 'Campos do Conde', 'Colinas do Sul',
  'Country Club', 'Condomínio das Acácias', 'Condomínio das Flores', 'Condomínio do Lago',
  'Condomínio dos Ipês', 'Condomínio Esmeralda', 'Condomínio Europa', 'Fazenda Modelo',
  'Condomínio Floresta', 'Condomínio Girassol', 'Green Park', 'Condomínio Horizonte',
  'Condomínio Imperial', 'Condomínio Ipiranga', 'Jardim das Nações', 'Jardim Europa',
  'Jardim Primavera', 'Lago Azul', 'Lagoa Nova', 'Condomínio Lemos', 'Condomínio Maravilha',
  'Morada dos Pássaros', 'Nova Franca', 'Novo Horizonte', 'Condomínio Paraíso',
  'Parque das Flores', 'Parque Esmeralda', 'Parque Europa', 'Parque Residencial',
  'Condomínio Pinheiros', 'Portal das Acácias', 'Portal do Sol', 'Condomínio Primavera',
  'Recanto das Flores', 'Recanto Verde', 'Residencial Alvorada', 'Residencial Bela Vista',
  'Residencial Bosque', 'Residencial das Acácias', 'Residencial Eldorado',
  'Residencial Esmeralda', 'Residencial Floresta', 'Residencial Girassol',
  'Residencial Ipiranga', 'Residencial Jardim', 'Residencial Nova Franca',
  'Residencial Paraíso', 'Residencial Primavera', 'Residencial Santa Cruz',
  'Residencial São Paulo', 'Residencial Tropical', 'Residencial Universitário',
  'Residencial Verde', 'Rio Verde', 'Santa Cruz', 'Santa Lúcia', 'Santo Antônio',
  'São Cristóvão', 'São Geraldo', 'São José', 'Serra Azul', 'Solar das Acácias',
  'Solar das Flores', 'Solar do Lago', 'Spazio', 'Condomínio Tropical', 'Condomínio União',
  'Condomínio Universitário', 'Condomínio Verde', 'Ville de France', 'Condomínio Vitória',
  'Edifício Alvorada', 'Edifício Belvedere', 'Edifício Bosque', 'Edifício Brasília',
  'Edifício Califórnia', 'Edifício Cambuí', 'Edifício Campos do Jordão', 'Edifício Capri',
  'Edifício Colinas', 'Edifício Copacabana', 'Edifício Cristal', 'Edifício das Acácias',
  'Edifício das Flores', 'Edifício das Nações', 'Edifício das Palmeiras',
  'Edifício Diamante', 'Edifício do Lago', 'Edifício dos Ipês', 'Edifício Eldorado',
  'Edifício Elite', 'Edifício Esmeralda', 'Edifício Europa', 'Edifício Flamboyant',
  'Edifício Floresta', 'Edifício Girassol', 'Edifício Guanabara', 'Edifício Horizonte',
  'Edifício Imperial', 'Edifício Ipiranga', 'Edifício Itália', 'Edifício Jandaia',
  'Edifício Lagoa Nova', 'Edifício Leocádia', 'Edifício Marajó', 'Edifício Maria Luíza',
  'Edifício Maristela', 'Edifício Natal', 'Edifício Nova Franca', 'Edifício Novo Horizonte',
  'Edifício Paraíso', 'Edifício Paulista', 'Edifício Petrópolis', 'Edifício Primavera',
  'Edifício Progresso', 'Edifício Redentor', 'Edifício Samambaia', 'Edifício Santa Cruz',
  'Edifício Santa Lúcia', 'Edifício Santa Maria', 'Edifício São Paulo', 'Edifício São Pedro',
  'Edifício Saudade', 'Edifício Serrano', 'Edifício Sumaré', 'Edifício Tropical',
  'Edifício Umuarama', 'Edifício União', 'Edifício Universitário', 'Edifício Verde',
  'Edifício Vitória',
]

// Bairros estáticos para outras cidades da região
const BAIRROS_POR_CIDADE: Record<string, string[]> = {
  'rifaina': [
    'Centro', 'Jardim das Flores', 'Jardim das Palmeiras', 'Jardim dos Ipês',
    'Jardim Lago Azul', 'Jardim Paraíso', 'Jardim Primavera', 'Jardim São Paulo',
    'Lago Azul', 'Parque das Acácias', 'Parque das Flores', 'Parque Residencial',
    'Residencial Alvorada', 'Residencial Bela Vista', 'Residencial das Flores',
    'Residencial Lago Azul', 'Residencial Paraíso', 'Residencial Primavera',
    'Vila Aparecida', 'Vila Brasil', 'Vila Carvalho', 'Vila Cristina',
    'Vila Esperança', 'Vila Helena', 'Vila Nova', 'Vila Oliveira',
    'Vila Progresso', 'Vila Regina', 'Vila Rica', 'Vila Rosa',
    'Beira Lago', 'Balneário Lago Azul', 'Condomínio Lago Azul',
  ],
  'cristais-paulista': [
    'Centro', 'Alto da Serra', 'Jardim das Flores', 'Jardim das Palmeiras',
    'Jardim Novo Horizonte', 'Jardim Paraíso', 'Jardim Primavera', 'Jardim São Paulo',
    'Parque das Acácias', 'Parque Residencial', 'Residencial Alvorada',
    'Residencial Bela Vista', 'Residencial das Flores', 'Residencial Primavera',
    'Vila Aparecida', 'Vila Brasil', 'Vila Carvalho', 'Vila Cristina',
    'Vila Esperança', 'Vila Helena', 'Vila Nova', 'Vila Oliveira',
    'Vila Progresso', 'Vila Regina', 'Vila Rica', 'Vila Rosa',
    'Bairro da Estação', 'Chácara São João', 'Condomínio Serra Verde',
  ],
  'patrocinio-paulista': [
    'Centro', 'Jardim América', 'Jardim das Flores', 'Jardim das Palmeiras',
    'Jardim Novo Horizonte', 'Jardim Paraíso', 'Jardim Primavera', 'Jardim São Paulo',
    'Parque das Acácias', 'Parque Industrial', 'Parque Residencial',
    'Residencial Alvorada', 'Residencial Bela Vista', 'Residencial das Flores',
    'Residencial Primavera', 'Vila Aparecida', 'Vila Brasil', 'Vila Carvalho',
    'Vila Cristina', 'Vila Esperança', 'Vila Helena', 'Vila Nova',
    'Vila Oliveira', 'Vila Progresso', 'Vila Regina', 'Vila Rica',
    'Bairro da Estação', 'Distrito Industrial', 'Loteamento Novo',
  ],
  'pedregulho': [
    'Centro', 'Jardim América', 'Jardim das Flores', 'Jardim das Palmeiras',
    'Jardim Novo Horizonte', 'Jardim Paraíso', 'Jardim Primavera', 'Jardim São Paulo',
    'Parque das Acácias', 'Parque Industrial', 'Parque Residencial',
    'Residencial Alvorada', 'Residencial Bela Vista', 'Residencial das Flores',
    'Residencial Primavera', 'Vila Aparecida', 'Vila Brasil', 'Vila Carvalho',
    'Vila Cristina', 'Vila Esperança', 'Vila Helena', 'Vila Nova',
    'Vila Oliveira', 'Vila Progresso', 'Vila Regina', 'Vila Rica',
    'Bairro da Estação', 'Distrito Industrial', 'Loteamento Novo',
  ],
  'itirapua': [
    'Centro', 'Jardim das Flores', 'Jardim das Palmeiras', 'Jardim Novo Horizonte',
    'Jardim Paraíso', 'Jardim Primavera', 'Parque Residencial',
    'Residencial Alvorada', 'Residencial Bela Vista', 'Residencial das Flores',
    'Vila Aparecida', 'Vila Brasil', 'Vila Carvalho', 'Vila Cristina',
    'Vila Esperança', 'Vila Helena', 'Vila Nova', 'Vila Oliveira',
    'Vila Progresso', 'Vila Regina', 'Vila Rica', 'Vila Rosa',
  ],
  'ribeirao-preto': [
    'Alto da Boa Vista', 'Bosque das Juritis', 'Centro', 'City Ribeirão',
    'Jardim Agari', 'Jardim Anhangüera', 'Jardim Botânico', 'Jardim Califórnia',
    'Jardim Canadá', 'Jardim Castelo', 'Jardim Constantino', 'Jardim Elisa',
    'Jardim Florestan Fernandes', 'Jardim Irajá', 'Jardim Juliana', 'Jardim Macedo',
    'Jardim Marchetti', 'Jardim Nova Aliança', 'Jardim Nova Esperança',
    'Jardim Palma Travassos', 'Jardim Paulista', 'Jardim Paulistano',
    'Jardim Recreio', 'Jardim Santa Cruz', 'Jardim Santa Mônica',
    'Jardim São Luís', 'Jardim São Marcos', 'Jardim Sumaré',
    'Jardim Sumarezinho', 'Jardim Zara', 'Lagoinha', 'Parque Anhangüera',
    'Parque Ribeirão Preto', 'Presidente Médici', 'Ribeirânia',
    'Santa Cruz do José Jacques', 'Santa Luzia', 'Sumaré',
    'Vila Amélia', 'Vila Carvalho', 'Vila Cristina', 'Vila Elisa',
    'Vila Guatimozim', 'Vila Lobato', 'Vila Maria', 'Vila Mariana',
    'Vila Melhado', 'Vila Paulista', 'Vila Seixas', 'Vila Tibério',
    'Vila Virgínia', 'Ipiranga', 'Campos Elíseos', 'Higienópolis',
    'Iguatemi', 'Jardim Independência', 'Jardim Interlagos',
    'Jardim Manoel Penna', 'Jardim Palma Travassos', 'Jardim Primavera',
    'Jardim Progresso', 'Jardim Recreio', 'Jardim Salgado Filho',
    'Jardim São Bento', 'Jardim São José', 'Jardim Saudade',
    'Jardim Serrano', 'Jardim Sumaré', 'Jardim Sumarezinho',
    'Jardim Zara', 'Nova Ribeirânia', 'Parque Anhangüera',
    'Parque Ribeirão Preto', 'Residencial Morro do Ipê',
    'Residencial Recreio dos Bandeirantes', 'Residencial Samambaia',
    'Ribeirânia', 'Santa Cruz do José Jacques', 'Santa Luzia',
    'Sumaré', 'Vila Amélia', 'Vila Carvalho', 'Vila Cristina',
  ],
  'delfinopolis': [
    'Centro', 'Jardim das Flores', 'Jardim das Palmeiras', 'Jardim Lago',
    'Jardim Novo Horizonte', 'Jardim Paraíso', 'Jardim Primavera',
    'Parque das Acácias', 'Parque Residencial', 'Residencial Alvorada',
    'Residencial Bela Vista', 'Residencial das Flores', 'Residencial Primavera',
    'Vila Aparecida', 'Vila Brasil', 'Vila Carvalho', 'Vila Cristina',
    'Vila Esperança', 'Vila Helena', 'Vila Nova', 'Vila Oliveira',
    'Vila Progresso', 'Vila Regina', 'Vila Rica', 'Vila Rosa',
    'Beira Lago', 'Condomínio Lago de Furnas', 'Lago de Furnas',
  ],
  'capitolio': [
    'Centro', 'Jardim das Flores', 'Jardim das Palmeiras', 'Jardim Lago',
    'Jardim Novo Horizonte', 'Jardim Paraíso', 'Jardim Primavera',
    'Parque das Acácias', 'Parque Residencial', 'Residencial Alvorada',
    'Residencial Bela Vista', 'Residencial das Flores', 'Residencial Primavera',
    'Vila Aparecida', 'Vila Brasil', 'Vila Carvalho', 'Vila Cristina',
    'Vila Esperança', 'Vila Helena', 'Vila Nova', 'Vila Oliveira',
    'Vila Progresso', 'Vila Regina', 'Vila Rica', 'Vila Rosa',
    'Beira Lago', 'Condomínio Lago de Furnas', 'Lago de Furnas',
    'Escarpas do Lago', 'Pousada do Lago',
  ],
  'cassia': [
    'Centro', 'Jardim América', 'Jardim das Flores', 'Jardim das Palmeiras',
    'Jardim Novo Horizonte', 'Jardim Paraíso', 'Jardim Primavera',
    'Parque das Acácias', 'Parque Industrial', 'Parque Residencial',
    'Residencial Alvorada', 'Residencial Bela Vista', 'Residencial das Flores',
    'Residencial Primavera', 'Vila Aparecida', 'Vila Brasil', 'Vila Carvalho',
    'Vila Cristina', 'Vila Esperança', 'Vila Helena', 'Vila Nova',
    'Vila Oliveira', 'Vila Progresso', 'Vila Regina', 'Vila Rica',
    'Bairro da Estação', 'Distrito Industrial',
  ],
  'ibiraci': [
    'Centro', 'Jardim América', 'Jardim das Flores', 'Jardim das Palmeiras',
    'Jardim Novo Horizonte', 'Jardim Paraíso', 'Jardim Primavera',
    'Parque das Acácias', 'Parque Residencial', 'Residencial Alvorada',
    'Residencial Bela Vista', 'Residencial das Flores', 'Residencial Primavera',
    'Vila Aparecida', 'Vila Brasil', 'Vila Carvalho', 'Vila Cristina',
    'Vila Esperança', 'Vila Helena', 'Vila Nova', 'Vila Oliveira',
    'Vila Progresso', 'Vila Regina', 'Vila Rica', 'Vila Rosa',
  ],
  'capetinga': [
    'Centro', 'Jardim América', 'Jardim das Flores', 'Jardim das Palmeiras',
    'Jardim Novo Horizonte', 'Jardim Paraíso', 'Jardim Primavera',
    'Parque das Acácias', 'Parque Residencial', 'Residencial Alvorada',
    'Residencial Bela Vista', 'Residencial das Flores', 'Residencial Primavera',
    'Vila Aparecida', 'Vila Brasil', 'Vila Carvalho', 'Vila Cristina',
    'Vila Esperança', 'Vila Helena', 'Vila Nova', 'Vila Oliveira',
    'Vila Progresso', 'Vila Regina', 'Vila Rica', 'Vila Rosa',
  ],
  'sacramento': [
    'Centro', 'Jardim América', 'Jardim das Flores', 'Jardim das Palmeiras',
    'Jardim Novo Horizonte', 'Jardim Paraíso', 'Jardim Primavera', 'Jardim São Paulo',
    'Parque das Acácias', 'Parque Industrial', 'Parque Residencial',
    'Residencial Alvorada', 'Residencial Bela Vista', 'Residencial das Flores',
    'Residencial Primavera', 'Vila Aparecida', 'Vila Brasil', 'Vila Carvalho',
    'Vila Cristina', 'Vila Esperança', 'Vila Helena', 'Vila Nova',
    'Vila Oliveira', 'Vila Progresso', 'Vila Regina', 'Vila Rica',
    'Bairro da Estação', 'Distrito Industrial', 'Loteamento Novo',
  ],
  'restinga': [
    'Centro', 'Jardim das Flores', 'Jardim das Palmeiras', 'Jardim Novo Horizonte',
    'Jardim Paraíso', 'Jardim Primavera', 'Parque Residencial',
    'Residencial Alvorada', 'Residencial Bela Vista', 'Residencial das Flores',
    'Vila Aparecida', 'Vila Brasil', 'Vila Carvalho', 'Vila Cristina',
    'Vila Esperança', 'Vila Helena', 'Vila Nova', 'Vila Oliveira',
    'Vila Progresso', 'Vila Regina', 'Vila Rica', 'Vila Rosa',
  ],
}

function slugToCity(slug: string): string {
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function cityToSlug(city: string): string {
  return city
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

async function fetchCityData(citySlug: string) {
  const cidade = CIDADES[citySlug]
  const cityName = cidade?.nome ?? slugToCity(citySlug)

  try {
    const [propertiesRes, neighborhoodsRes] = await Promise.all([
      fetch(`${API_URL}/api/v1/public/properties?city=${encodeURIComponent(cityName)}&limit=12&status=ACTIVE`, {
        next: { revalidate: 300 },
      }),
      fetch(`${API_URL}/api/v1/public/properties?city=${encodeURIComponent(cityName)}&limit=200&status=ACTIVE`, {
        next: { revalidate: 3600 },
      }),
    ])

    const propertiesData = propertiesRes.ok ? await propertiesRes.json() : { data: [], meta: { total: 0 } }
    const allData = neighborhoodsRes.ok ? await neighborhoodsRes.json() : { data: [] }

    // Extrair bairros únicos dos imóveis cadastrados
    const neighborhoodMap = new Map<string, number>()
    allData.data?.forEach((p: any) => {
      if (p.neighborhood) {
        const n = p.neighborhood.trim()
        neighborhoodMap.set(n, (neighborhoodMap.get(n) ?? 0) + 1)
      }
    })
    const neighborhoods = Array.from(neighborhoodMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)

    return {
      properties: propertiesData.data ?? [],
      total: propertiesData.meta?.total ?? 0,
      neighborhoods,
      cityName,
      citySlug,
    }
  } catch {
    return { properties: [], total: 0, neighborhoods: [], cityName, citySlug }
  }
}

export async function generateMetadata({ params }: { params: { cidade: string } }): Promise<Metadata> {
  const cidade = CIDADES[params.cidade]
  const cityName = cidade?.nome ?? slugToCity(params.cidade)
  const estado = cidade?.estado ?? 'SP'
  const desc = cidade?.descricao ?? `cidade do interior`

  const title = `Imóveis em ${cityName}/${estado} | Casas e Apartamentos | Imobiliária Lemos`
  const description = `Encontre casas à venda, apartamentos para alugar e terrenos em ${cityName}/${estado}, ${desc}. Imobiliária Lemos — CRECI 279051. Atendimento especializado na região.`

  // Keywords enriquecidas para Franca
  const keywordsBase = `imóveis ${cityName.toLowerCase()}, casas à venda ${cityName.toLowerCase()}, apartamentos ${cityName.toLowerCase()}, terrenos ${cityName.toLowerCase()}, imóveis ${cityName.toLowerCase()} ${estado.toLowerCase()}, comprar casa ${cityName.toLowerCase()}, alugar apartamento ${cityName.toLowerCase()}, imobiliária ${cityName.toLowerCase()}`
  const keywordsFranca = params.cidade === 'franca'
    ? `, condomínios Franca SP, bairros Franca SP, lançamento imobiliário Franca, imóveis centro Franca, imóveis jardim Franca, imóveis vila Franca, corretor imóveis Franca SP, CRECI Franca`
    : ''

  return {
    title,
    description,
    keywords: keywordsBase + keywordsFranca,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'pt_BR',
      siteName: 'Imobiliária Lemos',
      images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
    },
    alternates: {
      canonical: `/imoveis/em/${params.cidade}`,
    },
  }
}

export async function generateStaticParams() {
  return Object.keys(CIDADES).map(cidade => ({ cidade }))
}

export const revalidate = 3600

export default async function CidadePage({ params }: { params: { cidade: string } }) {
  const { properties, total, neighborhoods, cityName, citySlug } = await fetchCityData(params.cidade)
  const cidade = CIDADES[params.cidade]
  const estado = cidade?.estado ?? 'SP'

  const isFranca = params.cidade === 'franca'

  // Bairros estáticos da cidade atual (se houver)
  const bairrosEstaticos = isFranca
    ? BAIRROS_FRANCA
    : (BAIRROS_POR_CIDADE[params.cidade] ?? [])

  // Usar bairros estáticos se não há bairros dinâmicos suficientes
  const bairrosParaExibir = neighborhoods.length >= 5
    ? neighborhoods
    : bairrosEstaticos.length > 0
      ? bairrosEstaticos.slice(0, isFranca ? 60 : bairrosEstaticos.length).map(b => [b, 0] as [string, number])
      : neighborhoods

  // Schema JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: 'Imobiliária Lemos',
    url: `https://www.agoraencontrei.com.br/imoveis/em/${params.cidade}`,
    description: `Imóveis à venda e para alugar em ${cityName}/${estado}`,
    areaServed: { '@type': 'City', name: cityName, containedInPlace: { '@type': 'State', name: estado } },
    numberOfItems: total,
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://www.agoraencontrei.com.br' },
      { '@type': 'ListItem', position: 2, name: 'Imóveis', item: 'https://www.agoraencontrei.com.br/imoveis' },
      { '@type': 'ListItem', position: 3, name: `Imóveis em ${cityName}`, item: `https://www.agoraencontrei.com.br/imoveis/em/${params.cidade}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="bg-[#1B2B5B] text-white py-12 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Breadcrumb */}
            <nav className="text-sm text-blue-200 mb-4 flex items-center gap-2">
              <Link href="/" className="hover:text-white">Início</Link>
              <span>/</span>
              <Link href="/imoveis" className="hover:text-white">Imóveis</Link>
              <span>/</span>
              <span className="text-white">{cityName}/{estado}</span>
            </nav>

            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Imóveis em {cityName}/{estado}
            </h1>
            <p className="text-blue-100 text-lg max-w-2xl">
              {total > 0
                ? `${total} imóvel${total !== 1 ? 's' : ''} disponível${total !== 1 ? 'is' : ''} em ${cityName}/${estado}. Casas, apartamentos, terrenos e imóveis comerciais para comprar ou alugar.`
                : `Encontre imóveis em ${cityName}/${estado} com a Imobiliária Lemos. Atendimento especializado na região.`}
            </p>

            {/* Links rápidos por tipo */}
            <div className="flex flex-wrap gap-2 mt-6">
              {['Casas à Venda', 'Apartamentos', 'Terrenos', 'Para Alugar', 'Comercial'].map((tipo, i) => {
                const purposeMap = ['SALE', 'SALE', 'SALE', 'RENT', 'SALE']
                const typeMap = ['HOUSE', 'APARTMENT', 'LAND', '', 'STORE']
                const qs = new URLSearchParams({ city: cityName, purpose: purposeMap[i] })
                if (typeMap[i]) qs.set('type', typeMap[i])
                return (
                  <Link
                    key={tipo}
                    href={`/imoveis?${qs}`}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium transition-colors border border-white/20"
                  >
                    {tipo}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-10">
          {/* Bairros */}
          {bairrosParaExibir.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xl font-bold text-[#1B2B5B] mb-2">
                Bairros em {cityName}
              </h2>
              {isFranca && (
                <p className="text-sm text-gray-500 mb-4">
                  Explore imóveis por bairro em Franca/SP — {BAIRROS_FRANCA.length} bairros mapeados.
                </p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {bairrosParaExibir.map(([bairro, count]) => (
                  <Link
                    key={bairro}
                    href={`/imoveis/em/${params.cidade}/${cityToSlug(bairro)}`}
                    className="group flex flex-col items-center p-3 bg-white rounded-xl border hover:border-[#C9A84C] hover:shadow-md transition-all text-center"
                  >
                    <span className="text-sm font-medium text-gray-800 group-hover:text-[#1B2B5B] leading-tight">
                      {bairro}
                    </span>
                    {count > 0 && (
                      <span className="text-xs text-gray-400 mt-1">{count} imóvel{count !== 1 ? 'is' : ''}</span>
                    )}
                  </Link>
                ))}
              </div>
              {/* Ver todos os bairros */}
              {isFranca && BAIRROS_FRANCA.length > 60 && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-[#C9A84C] hover:underline font-medium">
                    Ver todos os {BAIRROS_FRANCA.length} bairros de Franca/SP →
                  </summary>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-4">
                    {BAIRROS_FRANCA.slice(60).map((bairro) => (
                      <Link
                        key={bairro}
                        href={`/imoveis/em/franca/${cityToSlug(bairro)}`}
                        className="group flex flex-col items-center p-3 bg-white rounded-xl border hover:border-[#C9A84C] hover:shadow-md transition-all text-center"
                      >
                        <span className="text-sm font-medium text-gray-800 group-hover:text-[#1B2B5B] leading-tight">
                          {bairro}
                        </span>
                      </Link>
                    ))}
                  </div>
                </details>
              )}
            </section>
          )}

          {/* Condomínios e Edifícios (apenas para Franca) */}
          {isFranca && (
            <section className="mb-10">
              <h2 className="text-xl font-bold text-[#1B2B5B] mb-2">
                Condomínios e Edifícios em Franca/SP
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Encontre imóveis nos principais condomínios e edifícios de Franca/SP.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {CONDOMINIOS_FRANCA.slice(0, 40).map((cond) => (
                  <Link
                    key={cond}
                    href={`/imoveis?city=Franca&q=${encodeURIComponent(cond)}`}
                    className="group p-3 bg-white rounded-xl border hover:border-[#C9A84C] hover:shadow-md transition-all text-center"
                  >
                    <span className="text-sm font-medium text-gray-800 group-hover:text-[#1B2B5B] leading-tight">
                      {cond}
                    </span>
                  </Link>
                ))}
              </div>
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-[#C9A84C] hover:underline font-medium">
                  Ver todos os {CONDOMINIOS_FRANCA.length} condomínios e edifícios →
                </summary>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
                  {CONDOMINIOS_FRANCA.slice(40).map((cond) => (
                    <Link
                      key={cond}
                      href={`/imoveis?city=Franca&q=${encodeURIComponent(cond)}`}
                      className="group p-3 bg-white rounded-xl border hover:border-[#C9A84C] hover:shadow-md transition-all text-center"
                    >
                      <span className="text-sm font-medium text-gray-800 group-hover:text-[#1B2B5B] leading-tight">
                        {cond}
                      </span>
                    </Link>
                  ))}
                </div>
              </details>
            </section>
          )}

          {/* Imóveis em destaque */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#1B2B5B]">
                Imóveis disponíveis em {cityName}
              </h2>
              <Link
                href={`/imoveis?city=${encodeURIComponent(cityName)}`}
                className="text-sm text-[#C9A84C] hover:underline font-medium"
              >
                Ver todos →
              </Link>
            </div>

            {properties.length > 0 ? (
              <LoadMoreProperties
                initialProperties={properties}
                initialTotal={total}
                initialTotalPages={Math.ceil(total / 12)}
                searchParams={{ city: cityName, limit: '12' }}
              />
            ) : (
              <div className="text-center py-16 text-gray-500">
                <p className="text-lg font-medium">Nenhum imóvel ativo em {cityName} no momento.</p>
                <p className="text-sm mt-2">Entre em contato para verificar disponibilidade.</p>
                <Link href="/imoveis" className="mt-4 inline-block px-6 py-2 bg-[#1B2B5B] text-white rounded-lg hover:bg-[#2d4a8a] transition-colors">
                  Ver todos os imóveis
                </Link>
              </div>
            )}
          </section>

          {/* Texto SEO */}
          <section className="mt-12 bg-white rounded-2xl p-8 border">
            <h2 className="text-xl font-bold text-[#1B2B5B] mb-4">
              Imobiliária Lemos em {cityName}/{estado}
            </h2>
            <div className="prose prose-sm max-w-none text-gray-600 space-y-3">
              <p>
                A <strong>Imobiliária Lemos</strong> atua há décadas no mercado imobiliário de {cityName}/{estado} e região,
                oferecendo um portfólio completo de imóveis para compra e locação. Nossa equipe de corretores especializados
                conhece profundamente o mercado local e está pronta para ajudá-lo a encontrar o imóvel ideal.
              </p>
              <p>
                Em {cityName}, trabalhamos com <strong>casas à venda</strong>, <strong>apartamentos para alugar</strong>,
                <strong> terrenos</strong>, <strong>imóveis comerciais</strong> e <strong>chácaras</strong>.
                Seja para moradia, investimento ou temporada, temos a opção certa para você.
              </p>
              {isFranca && (
                <p>
                  Franca/SP é o <strong>maior polo calçadista do Brasil</strong> e uma das cidades mais dinâmicas do
                  interior paulista. Com mais de 350 mil habitantes, a cidade oferece excelente infraestrutura,
                  universidades renomadas (UNIFRAN, USP Franca) e qualidade de vida acima da média.
                  Bairros como <strong>Jardim América</strong>, <strong>Jardim Europa</strong>, <strong>Centro</strong>,
                  <strong> Vila Tibério</strong> e <strong>Jardim Universitário</strong> concentram os imóveis
                  mais procurados da cidade.
                </p>
              )}
              <p>
                Entre em contato com nossa equipe pelo telefone <strong>(16) 3723-0045</strong> ou visite nossa
                sede em Franca/SP. Somos credenciados pelo CRECI 279051.
              </p>
            </div>
          </section>

          {/* Links SEO para tipos de busca (apenas Franca) */}
          {isFranca && (
            <section className="mt-8 bg-white rounded-2xl p-8 border">
              <h2 className="text-xl font-bold text-[#1B2B5B] mb-4">
                Buscas populares em Franca/SP
              </h2>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Casas à venda em Franca', href: '/imoveis?city=Franca&type=HOUSE&purpose=SALE' },
                  { label: 'Apartamentos em Franca', href: '/imoveis?city=Franca&type=APARTMENT' },
                  { label: 'Terrenos em Franca', href: '/imoveis?city=Franca&type=LAND' },
                  { label: 'Alugar em Franca', href: '/imoveis?city=Franca&purpose=RENT' },
                  { label: 'Imóveis comerciais Franca', href: '/imoveis?city=Franca&type=STORE' },
                  { label: 'Chácaras em Franca', href: '/imoveis?city=Franca&type=FARM' },
                  { label: 'Imóveis no Centro', href: '/imoveis/em/franca/centro' },
                  { label: 'Imóveis no Jardim América', href: '/imoveis/em/franca/jardim-america' },
                  { label: 'Imóveis no Jardim Europa', href: '/imoveis/em/franca/jardim-europa' },
                  { label: 'Imóveis na Vila Tibério', href: '/imoveis/em/franca/vila-tiberio' },
                  { label: 'Imóveis no Jardim Universitário', href: '/imoveis/em/franca/jardim-universitario' },
                  { label: 'Imóveis na Vila Lemos', href: '/imoveis/em/franca/vila-lemos' },
                ].map(({ label, href }) => (
                  <Link
                    key={label}
                    href={href}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-[#1B2B5B] hover:text-white rounded-full text-sm text-gray-700 transition-colors"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  )
}

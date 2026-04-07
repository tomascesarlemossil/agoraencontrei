/**
 * Contexto hiper-local de Franca/SP
 * Entidades, vias, pontos turísticos e referências geográficas
 * Usado pelo text-spinner e páginas de bairro para autoridade local
 */

export interface ZonaContext {
  vias: string[]
  pontos: string[]
  vibe: string
  keywords: string[]
}

export const FRANCA_ZONES: Record<string, ZonaContext> = {
  centro: {
    vias: ['Rua Marechal Deodoro', 'Rua Voluntários da Franca', 'Rua General Telles'],
    pontos: ['Praça Nossa Senhora da Conceição', 'Santa Casa de Franca', 'Fórum de Franca', 'Terminal Rodoviário'],
    vibe: 'coração comercial e histórico de Franca',
    keywords: ['leilão judicial franca', 'retrofit prédio comercial', 'sala comercial centro franca'],
  },
  zona_sul: {
    vias: ['Av. Dr. Armando Salles Oliveira', 'Av. Santos Dumont', 'Rodovia Cândido Portinari'],
    pontos: ['Aeroporto de Franca', 'Distrito Industrial', 'ETEC Alcídio de Souza Prado'],
    vibe: 'região com forte expansão industrial e residencial',
    keywords: ['leilão caixa franca', 'terreno industrial franca', 'casa jardim aeroporto'],
  },
  zona_leste: {
    vias: ['Av. Rio Amazonas', 'Av. Alonso y Alonso', 'Av. Champagnat'],
    pontos: ['Franca Shopping', 'UNIFRAN', 'Havan', 'Colégio Anglo'],
    vibe: 'eixo nobre e universitário de alta valorização',
    keywords: ['investimento unifran', 'apartamento franca shopping', 'condomínio fechado franca'],
  },
  zona_norte: {
    vias: ['Av. Abraão Brickmann', 'Av. Dr. Flávio Rocha', 'Av. Paulo VI'],
    pontos: ['Poliesportivo', 'Pedrocão', 'Franca do Imperador'],
    vibe: 'região populosa com alto giro de leilões populares',
    keywords: ['casa barata franca', 'leilão popular franca', 'imóvel financiado franca'],
  },
  zona_oeste: {
    vias: ['Av. Paulo VI', 'Av. Chico Júlio', 'Estrada Municipal'],
    pontos: ['Parque Fernando Costa (Expoagro)', 'Sesi Franca Basquete', 'Uni-FACEF'],
    vibe: 'região tradicional ligada ao lazer e esportes',
    keywords: ['casa perto sesi franca', 'imóvel expoagro franca', 'apartamento uni-facef'],
  },
}

/** Mapeia bairro para zona */
export const BAIRRO_ZONA_MAP: Record<string, string> = {
  'centro': 'centro',
  'estacao': 'centro',
  'jardim-aeroporto': 'zona_sul',
  'jardim-aeroporto-ii': 'zona_sul',
  'jardim-aeroporto-iii': 'zona_sul',
  'santa-cruz': 'zona_sul',
  'residencial-amazonas': 'zona_leste',
  'city-petropolis': 'zona_leste',
  'jardim-california': 'zona_leste',
  'jardim-europa': 'zona_leste',
  'jardim-lima': 'zona_leste',
  'residencial-florenca': 'zona_leste',
  'residencial-zanetti': 'zona_leste',
  'parque-universitario': 'zona_oeste',
  'jardim-america': 'zona_oeste',
  'vila-lemos': 'zona_norte',
  'vila-totoli': 'zona_norte',
  'jardim-piratininga': 'zona_norte',
  'jardim-paulista': 'zona_norte',
  'vila-real': 'zona_norte',
  'jardim-noemia': 'zona_norte',
  'sao-jose': 'zona_norte',
}

/** Entidades locais de Franca para Schema.org e SEO */
export const FRANCA_ENTITIES = {
  esportes: {
    name: 'Sesi Franca Basquete',
    desc: 'Time de basquete da NBB com ginásio no Pedrocão',
    type: 'SportsTeam',
  },
  educacao: [
    { name: 'Uni-FACEF', type: 'CollegeOrUniversity' },
    { name: 'UNIFRAN', type: 'CollegeOrUniversity' },
    { name: 'ETEC Prof. Alcídio de Souza Prado', type: 'School' },
  ],
  saude: [
    { name: 'Santa Casa de Franca', type: 'Hospital' },
    { name: 'Hospital Regional de Franca', type: 'Hospital' },
  ],
  industria: [
    { name: 'Polo Calçadista de Franca', desc: 'Capital Nacional do Calçado Masculino' },
    { name: 'Democrata Calçados', desc: 'Uma das maiores fábricas da cidade' },
  ],
  eventos: [
    { name: 'Expoagro Franca', local: 'Parque Fernando Costa' },
  ],
  lazer: [
    { name: 'Parque Fernando Costa', type: 'Park' },
    { name: 'Franca Shopping', type: 'ShoppingCenter' },
  ],
}

/**
 * Gera texto de contexto local para um bairro
 */
export function getLocalContext(bairroSlug: string): string {
  const zonaKey = BAIRRO_ZONA_MAP[bairroSlug]
  if (!zonaKey) return ''
  const zona = FRANCA_ZONES[zonaKey]
  if (!zona) return ''

  return `Localizado na ${zona.vibe}, com acesso facilitado pela ${zona.vias[0]} e proximidade de marcos locais como o ${zona.pontos[0]}${zona.pontos[1] ? ` e ${zona.pontos[1]}` : ''}.`
}

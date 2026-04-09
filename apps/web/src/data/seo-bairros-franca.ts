/**
 * Bairros de Franca/SP com classificação por zona e dados de mercado
 * Fonte: Imobiliária Lemos + dados públicos do mercado imobiliário local
 *
 * Cada bairro tem:
 * - Classificação: expansão, nobre, comercial, popular, rural
 * - Estimativa de m² (venda e aluguel)
 * - Pontos de interesse próximos
 * - Score de comodidade (0-100)
 */

export interface BairroFranca {
  slug: string
  name: string
  zona: 'expansao' | 'nobre' | 'comercial' | 'popular' | 'rural' | 'misto'
  /** Estimativa m² venda (R$) */
  m2Venda: number
  /** Estimativa m² aluguel (R$/mês) */
  m2Aluguel: number
  /** Score de comodidade (escolas, hospitais, comércio) 0-100 */
  scoreComodidade: number
  /** Distância do centro (km) */
  distanciaCentroKm: number
  /** Pontos de interesse próximos */
  pontosInteresse: string[]
  /** Descrição curta para SEO */
  descricao: string
  /** Se tem leilões frequentes */
  temLeiloes: boolean
}

export const BAIRROS_FRANCA: BairroFranca[] = [
  // ── ZONAS DE EXPANSÃO (Leilões frequentes) ────────────────────────────
  {
    slug: 'jardim-aeroporto',
    name: 'Jardim Aeroporto',
    zona: 'expansao',
    m2Venda: 2800,
    m2Aluguel: 12,
    scoreComodidade: 65,
    distanciaCentroKm: 5.2,
    pontosInteresse: ['Aeroporto Municipal', 'ETEC Prof. Alcídio de Souza Prado', 'UBS Jardim Aeroporto'],
    descricao: 'Bairro em expansão próximo ao aeroporto municipal. Alta concentração de imóveis em leilão com potencial de valorização.',
    temLeiloes: true,
  },
  {
    slug: 'jardim-aeroporto-ii',
    name: 'Jardim Aeroporto II',
    zona: 'expansao',
    m2Venda: 2600,
    m2Aluguel: 11,
    scoreComodidade: 60,
    distanciaCentroKm: 5.8,
    pontosInteresse: ['Aeroporto Municipal', 'Parque Linear'],
    descricao: 'Extensão do Jardim Aeroporto com terrenos acessíveis e leilões frequentes da Caixa Econômica.',
    temLeiloes: true,
  },
  {
    slug: 'jardim-aeroporto-iii',
    name: 'Jardim Aeroporto III',
    zona: 'expansao',
    m2Venda: 2400,
    m2Aluguel: 10,
    scoreComodidade: 55,
    distanciaCentroKm: 6.2,
    pontosInteresse: ['Aeroporto Municipal'],
    descricao: 'Área de expansão com lotes acessíveis. Ideal para primeiro imóvel e investidores em leilão.',
    temLeiloes: true,
  },
  {
    slug: 'parque-universitario',
    name: 'Parque Universitário',
    zona: 'expansao',
    m2Venda: 3200,
    m2Aluguel: 14,
    scoreComodidade: 72,
    distanciaCentroKm: 4.5,
    pontosInteresse: ['Uni-FACEF', 'UNIFRAN', 'Shopping Franca'],
    descricao: 'Bairro universitário com forte demanda de aluguel. Proximidade com faculdades garante ocupação constante.',
    temLeiloes: false,
  },
  {
    slug: 'santa-cruz',
    name: 'Santa Cruz',
    zona: 'expansao',
    m2Venda: 2500,
    m2Aluguel: 10,
    scoreComodidade: 58,
    distanciaCentroKm: 6.0,
    pontosInteresse: ['UBS Santa Cruz', 'Escola Municipal'],
    descricao: 'Bairro residencial em crescimento com infraestrutura em desenvolvimento e preços acessíveis.',
    temLeiloes: true,
  },

  // ── ZONAS NOBRES (Investidores) ───────────────────────────────────────
  {
    slug: 'residencial-amazonas',
    name: 'Residencial Amazonas',
    zona: 'nobre',
    m2Venda: 5500,
    m2Aluguel: 22,
    scoreComodidade: 85,
    distanciaCentroKm: 3.0,
    pontosInteresse: ['Clube de Campo', 'Escola Objetivo', 'Hospital Regional'],
    descricao: 'Condomínio fechado de alto padrão. Um dos endereços mais valorizados de Franca com segurança 24h.',
    temLeiloes: false,
  },
  {
    slug: 'city-petropolis',
    name: 'City Petrópolis',
    zona: 'nobre',
    m2Venda: 5000,
    m2Aluguel: 20,
    scoreComodidade: 82,
    distanciaCentroKm: 2.5,
    pontosInteresse: ['Franca Shopping', 'Hospital São Joaquim', 'Colégio Anglo'],
    descricao: 'Bairro nobre com comércio diversificado, próximo ao Franca Shopping. Alto padrão residencial.',
    temLeiloes: false,
  },
  {
    slug: 'jardim-california',
    name: 'Jardim Califórnia',
    zona: 'nobre',
    m2Venda: 4500,
    m2Aluguel: 18,
    scoreComodidade: 80,
    distanciaCentroKm: 3.5,
    pontosInteresse: ['Supermercado Savegnago', 'UBS Jardim Califórnia', 'Escola Sesi'],
    descricao: 'Bairro residencial consolidado com infraestrutura completa. Referência para famílias.',
    temLeiloes: false,
  },
  {
    slug: 'jardim-europa',
    name: 'Jardim Europa',
    zona: 'nobre',
    m2Venda: 4800,
    m2Aluguel: 19,
    scoreComodidade: 78,
    distanciaCentroKm: 3.2,
    pontosInteresse: ['Clube Francano', 'Escola COC', 'Parque Fernando Costa'],
    descricao: 'Um dos bairros mais desejados de Franca. Residencial tranquilo com excelente valorização.',
    temLeiloes: false,
  },
  {
    slug: 'jardim-lima',
    name: 'Jardim Lima',
    zona: 'nobre',
    m2Venda: 4200,
    m2Aluguel: 17,
    scoreComodidade: 75,
    distanciaCentroKm: 2.8,
    pontosInteresse: ['Praça Jardim Lima', 'Padaria Dona Deôla'],
    descricao: 'Bairro nobre tradicional com ruas arborizadas e casas de alto padrão.',
    temLeiloes: false,
  },
  {
    slug: 'residencial-florenca',
    name: 'Residencial Florença',
    zona: 'nobre',
    m2Venda: 6000,
    m2Aluguel: 25,
    scoreComodidade: 88,
    distanciaCentroKm: 4.0,
    pontosInteresse: ['Condomínio Fechado', 'Área de Lazer Completa'],
    descricao: 'Condomínio fechado premium com lazer completo. O m² mais valorizado de Franca.',
    temLeiloes: false,
  },

  // ── ZONAS COMERCIAIS ──────────────────────────────────────────────────
  {
    slug: 'centro',
    name: 'Centro',
    zona: 'comercial',
    m2Venda: 4000,
    m2Aluguel: 25,
    scoreComodidade: 95,
    distanciaCentroKm: 0,
    pontosInteresse: ['Calçadão', 'Prefeitura', 'Fórum', 'Santa Casa', 'Terminal Rodoviário', 'Bancos'],
    descricao: 'Centro comercial e histórico de Franca. Máxima infraestrutura com comércio, bancos, hospitais e serviços públicos.',
    temLeiloes: true,
  },
  {
    slug: 'estacao',
    name: 'Estação',
    zona: 'comercial',
    m2Venda: 3500,
    m2Aluguel: 18,
    scoreComodidade: 80,
    distanciaCentroKm: 1.0,
    pontosInteresse: ['Terminal Rodoviário', 'Antiga Estação Ferroviária', 'Polo Industrial Calçadista'],
    descricao: 'Zona comercial e industrial próxima ao polo calçadista. Oportunidades em galpões e imóveis comerciais.',
    temLeiloes: true,
  },

  // ── ZONAS POPULARES (Primeiro imóvel) ─────────────────────────────────
  {
    slug: 'vila-lemos',
    name: 'Vila Lemos',
    zona: 'popular',
    m2Venda: 2800,
    m2Aluguel: 12,
    scoreComodidade: 70,
    distanciaCentroKm: 2.0,
    pontosInteresse: ['UBS Vila Lemos', 'Escola Estadual', 'Supermercado'],
    descricao: 'Bairro tradicional de Franca com boa infraestrutura e preços acessíveis. Ideal para primeiro imóvel.',
    temLeiloes: false,
  },
  {
    slug: 'vila-totoli',
    name: 'Vila Totoli',
    zona: 'popular',
    m2Venda: 2600,
    m2Aluguel: 11,
    scoreComodidade: 65,
    distanciaCentroKm: 3.0,
    pontosInteresse: ['UBS Vila Totoli', 'Escola Municipal'],
    descricao: 'Bairro residencial com preços acessíveis e boa localização. Crescimento constante.',
    temLeiloes: true,
  },
  {
    slug: 'jardim-piratininga',
    name: 'Jardim Piratininga',
    zona: 'popular',
    m2Venda: 2500,
    m2Aluguel: 10,
    scoreComodidade: 62,
    distanciaCentroKm: 4.0,
    pontosInteresse: ['Escola Estadual Piratininga', 'UBS'],
    descricao: 'Bairro em desenvolvimento com terrenos acessíveis e leilões frequentes.',
    temLeiloes: true,
  },
  {
    slug: 'jardim-paulista',
    name: 'Jardim Paulista',
    zona: 'misto',
    m2Venda: 3500,
    m2Aluguel: 15,
    scoreComodidade: 75,
    distanciaCentroKm: 1.5,
    pontosInteresse: ['Avenida Major Nicácio', 'Comércio Local', 'Escola Sesi'],
    descricao: 'Bairro misto residencial/comercial próximo ao centro. Excelente localização e infraestrutura.',
    temLeiloes: false,
  },
  {
    slug: 'jardim-america',
    name: 'Jardim América',
    zona: 'misto',
    m2Venda: 3200,
    m2Aluguel: 14,
    scoreComodidade: 72,
    distanciaCentroKm: 2.5,
    pontosInteresse: ['Parque dos Coqueiros', 'UBS Jardim América'],
    descricao: 'Bairro residencial consolidado com infraestrutura completa e parques.',
    temLeiloes: false,
  },
  {
    slug: 'vila-real',
    name: 'Vila Real',
    zona: 'popular',
    m2Venda: 2700,
    m2Aluguel: 11,
    scoreComodidade: 64,
    distanciaCentroKm: 3.5,
    pontosInteresse: ['UBS Vila Real', 'Escola Estadual'],
    descricao: 'Bairro residencial popular com preços acessíveis e boa estrutura básica.',
    temLeiloes: true,
  },
  {
    slug: 'residencial-zanetti',
    name: 'Residencial Zanetti',
    zona: 'nobre',
    m2Venda: 5200,
    m2Aluguel: 21,
    scoreComodidade: 80,
    distanciaCentroKm: 4.0,
    pontosInteresse: ['Condomínio Fechado', 'Área Verde'],
    descricao: 'Condomínio residencial de alto padrão com segurança e infraestrutura de lazer.',
    temLeiloes: false,
  },
  {
    slug: 'jardim-noemia',
    name: 'Jardim Noêmia',
    zona: 'popular',
    m2Venda: 2400,
    m2Aluguel: 10,
    scoreComodidade: 60,
    distanciaCentroKm: 5.0,
    pontosInteresse: ['UBS', 'Escola Municipal'],
    descricao: 'Bairro residencial com preços entre os mais acessíveis de Franca.',
    temLeiloes: true,
  },
  {
    slug: 'sao-jose',
    name: 'São José',
    zona: 'popular',
    m2Venda: 2500,
    m2Aluguel: 10,
    scoreComodidade: 63,
    distanciaCentroKm: 4.5,
    pontosInteresse: ['Igreja São José', 'UBS São José', 'Comércio Local'],
    descricao: 'Bairro tradicional residencial com comunidade consolidada e comércio de bairro.',
    temLeiloes: true,
  },
]

// ── Índices ─────────────────────────────────────────────────────────────

export const BAIRRO_BY_SLUG: Record<string, BairroFranca> = Object.fromEntries(
  BAIRROS_FRANCA.map(b => [b.slug, b])
)

export const BAIRROS_POR_ZONA: Record<string, BairroFranca[]> = BAIRROS_FRANCA.reduce(
  (acc, b) => { (acc[b.zona] = acc[b.zona] || []).push(b); return acc },
  {} as Record<string, BairroFranca[]>
)

export const BAIRROS_COM_LEILOES = BAIRROS_FRANCA.filter(b => b.temLeiloes)

// ── Helpers ─────────────────────────────────────────────────────────────

export function getMarketInsight(bairro: BairroFranca): string {
  const zonaLabel: Record<string, string> = {
    expansao: 'Zona de Expansão',
    nobre: 'Zona Nobre',
    comercial: 'Zona Comercial',
    popular: 'Zona Popular',
    rural: 'Zona Rural',
    misto: 'Zona Mista',
  }
  return `${bairro.name} é classificado como ${zonaLabel[bairro.zona]} em Franca/SP. O m² médio para venda é R$ ${bairro.m2Venda.toLocaleString('pt-BR')} e para aluguel R$ ${bairro.m2Aluguel}/m². Score de comodidade: ${bairro.scoreComodidade}/100. Distância do centro: ${bairro.distanciaCentroKm}km.`
}

// Estatísticas
// Total: 22 bairros | Nobres: 7 | Expansão: 5 | Comerciais: 2 | Populares: 7 | Mistos: 2

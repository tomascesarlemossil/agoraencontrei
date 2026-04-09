/**
 * Bairros de Ribeirão Preto/SP com classificação por zona e dados de mercado
 * Complementa seo-bairros-franca.ts para expansão regional
 */
import type { BairroFranca } from './seo-bairros-franca'

// Reuso da mesma interface de Franca para compatibilidade
export type BairroRibeirao = BairroFranca

export const BAIRROS_RIBEIRAO: BairroRibeirao[] = [
  // ── ZONA SUL (Elite) ──────────────────────────────────────────────────
  { slug: 'jardim-olhos-dagua', name: "Jardim Olhos d'Água", zona: 'nobre', m2Venda: 11000, m2Aluguel: 45, scoreComodidade: 90, distanciaCentroKm: 6.0, pontosInteresse: ['Prolongamento da Fiúsa', 'Loteamentos de Altíssimo Padrão'], descricao: "O m² mais caro de Ribeirão Preto. Loteamentos de altíssimo padrão com valorização constante.", temLeiloes: false },
  { slug: 'jardim-botanico', name: 'Jardim Botânico', zona: 'nobre', m2Venda: 9500, m2Aluguel: 38, scoreComodidade: 88, distanciaCentroKm: 5.5, pontosInteresse: ['Parque Raya', 'RibeirãoShopping'], descricao: 'Desejado por famílias e investidores de locação. Próximo ao RibeirãoShopping.', temLeiloes: false },
  { slug: 'vila-do-golf', name: 'Vila do Golf', zona: 'nobre', m2Venda: 10500, m2Aluguel: 42, scoreComodidade: 85, distanciaCentroKm: 7.0, pontosInteresse: ['Shopping Iguatemi', 'Ipê Golf Club'], descricao: 'Exclusividade e proximidade com escolas de elite e o Shopping Iguatemi.', temLeiloes: false },
  { slug: 'jardim-santa-angela', name: 'Jardim Santa Ângela', zona: 'nobre', m2Venda: 9000, m2Aluguel: 35, scoreComodidade: 87, distanciaCentroKm: 4.5, pontosInteresse: ['Avenida João Fiúsa', 'Edifícios de Luxo'], descricao: 'Consolidado como o centro do poder econômico de Ribeirão Preto.', temLeiloes: false },
  { slug: 'bonfim-paulista', name: 'Bonfim Paulista', zona: 'nobre', m2Venda: 8500, m2Aluguel: 32, scoreComodidade: 82, distanciaCentroKm: 8.0, pontosInteresse: ['Alphaville', 'Royal Park'], descricao: 'Expansão de condomínios fechados e alta valorização no eixo sul.', temLeiloes: false },

  // ── ZONA LESTE (Comercial) ────────────────────────────────────────────
  { slug: 'jardim-paulista-rp', name: 'Jardim Paulista', zona: 'misto', m2Venda: 6500, m2Aluguel: 25, scoreComodidade: 80, distanciaCentroKm: 3.0, pontosInteresse: ['Avenida Treze de Maio', 'Faculdade Barão de Mauá'], descricao: 'Mix perfeito entre residencial e comercial forte em Ribeirão.', temLeiloes: false },
  { slug: 'lagoinha', name: 'Lagoinha', zona: 'comercial', m2Venda: 5500, m2Aluguel: 22, scoreComodidade: 75, distanciaCentroKm: 4.0, pontosInteresse: ['Novo Shopping', 'Entrada Anhanguera'], descricao: 'Excelente para logística e profissionais do agronegócio.', temLeiloes: true },
  { slug: 'ribeirania', name: 'Ribeirânia', zona: 'misto', m2Venda: 6000, m2Aluguel: 24, scoreComodidade: 78, distanciaCentroKm: 3.5, pontosInteresse: ['Hospital Electro Bonini', 'UNAERP'], descricao: 'Foco total em locação para estudantes e profissionais de saúde.', temLeiloes: false },
  { slug: 'santa-cruz-rp', name: 'Santa Cruz', zona: 'comercial', m2Venda: 5800, m2Aluguel: 23, scoreComodidade: 76, distanciaCentroKm: 3.0, pontosInteresse: ['Av. Maurílio Biagi', 'Havan'], descricao: 'Eixo de ligação com prédios corporativos e comércio forte.', temLeiloes: true },

  // ── ZONA OESTE (Universitária) ────────────────────────────────────────
  { slug: 'vila-virginia', name: 'Vila Virgínia', zona: 'popular', m2Venda: 3800, m2Aluguel: 15, scoreComodidade: 65, distanciaCentroKm: 4.0, pontosInteresse: ['Avenida Primeiro de Maio', 'Proximidade Centro'], descricao: 'Bairro histórico com alto volume de leilões judiciais.', temLeiloes: true },
  { slug: 'jardim-paiva', name: 'Jardim Paiva', zona: 'misto', m2Venda: 5500, m2Aluguel: 22, scoreComodidade: 78, distanciaCentroKm: 5.0, pontosInteresse: ['Campus USP', 'Hospital das Clínicas (HC)'], descricao: 'Público-alvo: médicos e acadêmicos. Proximidade com a USP e HC.', temLeiloes: false },
  { slug: 'monte-alegre', name: 'Monte Alegre', zona: 'misto', m2Venda: 5000, m2Aluguel: 20, scoreComodidade: 72, distanciaCentroKm: 4.5, pontosInteresse: ['Museu do Café', 'Entorno USP'], descricao: 'Charme histórico com alta demanda de kitinets universitárias.', temLeiloes: true },
  { slug: 'ipiranga-rp', name: 'Ipiranga', zona: 'popular', m2Venda: 4200, m2Aluguel: 17, scoreComodidade: 70, distanciaCentroKm: 3.0, pontosInteresse: ['Avenida Dom Pedro I', 'Comércio de Rua'], descricao: 'Coração da Zona Norte/Oeste com giro rápido de imóveis.', temLeiloes: true },
  { slug: 'sumarezinho', name: 'Sumarezinho', zona: 'popular', m2Venda: 4000, m2Aluguel: 16, scoreComodidade: 68, distanciaCentroKm: 4.5, pontosInteresse: ['Rua Paranapanema'], descricao: 'Região tradicional com imóveis de grandes metragens e leilões.', temLeiloes: true },

  // ── CENTRO E TRADICIONAIS ─────────────────────────────────────────────
  { slug: 'centro-rp', name: 'Centro', zona: 'comercial', m2Venda: 5500, m2Aluguel: 30, scoreComodidade: 95, distanciaCentroKm: 0, pontosInteresse: ['Choperia Pinguim', 'Theatro Pedro II', 'Rodoviária'], descricao: 'Reurbanização e Retrofit de prédios antigos. Máxima infraestrutura.', temLeiloes: true },
  { slug: 'vila-tiberio', name: 'Vila Tibério', zona: 'popular', m2Venda: 4500, m2Aluguel: 18, scoreComodidade: 72, distanciaCentroKm: 1.5, pontosInteresse: ['Câmara Municipal', 'Proximidade Rodoviária'], descricao: 'Bairro boêmio e tradicional de Ribeirão Preto.', temLeiloes: true },
  { slug: 'campos-eliseos-rp', name: 'Campos Elíseos', zona: 'comercial', m2Venda: 4800, m2Aluguel: 20, scoreComodidade: 73, distanciaCentroKm: 2.0, pontosInteresse: ['Avenida Saudade', 'Comércio Atacadista'], descricao: 'Foco em galpões e prédios comerciais. Alto potencial de retrofit.', temLeiloes: true },
  { slug: 'alto-da-boa-vista-rp', name: 'Alto da Boa Vista', zona: 'nobre', m2Venda: 7500, m2Aluguel: 30, scoreComodidade: 82, distanciaCentroKm: 2.5, pontosInteresse: ['Colégio Auxiliadora', 'Clínicas Médicas'], descricao: 'Tradicional alto padrão com grandes terrenos valorizados.', temLeiloes: false },
  { slug: 'jardim-iraja', name: 'Jardim Irajá', zona: 'nobre', m2Venda: 8000, m2Aluguel: 32, scoreComodidade: 85, distanciaCentroKm: 3.5, pontosInteresse: ['Início da Av. João Fiúsa', 'Parque Raya'], descricao: 'Equilíbrio entre lazer e moradia de elite em Ribeirão.', temLeiloes: false },
]

export const BAIRRO_RIBEIRAO_BY_SLUG: Record<string, BairroRibeirao> = Object.fromEntries(
  BAIRROS_RIBEIRAO.map(b => [b.slug, b])
)

// Estatísticas: 20 bairros | Nobres: 7 | Comerciais: 4 | Populares: 5 | Mistos: 4

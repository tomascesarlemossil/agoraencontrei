/**
 * Catálogo do "Divulgue seu Negócio" — AgoraEncontrei
 *
 * Fonte única de verdade para:
 *  - Tipos de cadastro (Empresa / Autônomo)
 *  - Segmentos/categorias de serviço com catálogo de serviços por segmento
 *  - Modelos de landing page
 *  - Planos de divulgação (mensalidade)
 *  - Conteúdo do plano de marketing / estratégia de SEO
 *
 * Usado tanto na página de vendas (/divulgue) quanto no cadastro
 * (/parceiros/cadastro). O `dbCategory` mapeia cada segmento para o enum
 * `SpecialistCategory` já existente no banco — assim o backend não precisa de
 * migração de enum. O segmento preciso é persistido em `businessType`.
 */

export type SpecialistDbCategory =
  | 'ARQUITETO' | 'ENGENHEIRO' | 'CORRETOR' | 'AVALIADOR'
  | 'DESIGNER_INTERIORES' | 'FOTOGRAFO' | 'VIDEOMAKER'
  | 'ADVOGADO_IMOBILIARIO' | 'DESPACHANTE' | 'OUTRO'
  | 'IMOBILIARIA' | 'LOTEADORA'

export interface DivulgueCategory {
  /** Slug preciso do segmento (vai para `businessType`). */
  value: string
  /** Enum do banco (vai para `category`). */
  dbCategory: SpecialistDbCategory
  label: string
  emoji: string
  group: string
  /** Frase curta de posicionamento mostrada no card. */
  tagline: string
  /** Registro profissional exibido no formulário (opcional). */
  registryLabel?: string
  /** Catálogo de serviços sugeridos que o profissional pode oferecer. */
  services: string[]
  /** Modelo de landing sugerido por padrão. */
  suggestedTemplate?: string
}

export interface AdPlan {
  id: 'ESSENCIAL' | 'PROFISSIONAL' | 'PREMIUM'
  name: string
  price: number
  tagline: string
  highlight?: boolean
  badge?: string | null
  maxPhotos: number
  maxVideos: number
  maxServices: number
  features: string[]
}

export interface LandingTemplate {
  id: string
  name: string
  desc: string
  accent: string
  layout: 'classic' | 'showcase' | 'bold' | 'minimal'
}

// ─── PLANO DE DIVULGAÇÃO ─────────────────────────────────────────────────────
// Preço único e fixo: R$ 39,90/mês. Sem taxa de adesão, sem fidelidade. Dá
// acesso completo à landing page editável e à listagem de Empresas Parceiras.
export const AD_PLANS: AdPlan[] = [
  {
    id: 'ESSENCIAL',
    name: 'Divulgação',
    price: 39.9,
    tagline: 'Tudo o que você precisa para ser encontrado',
    highlight: true,
    badge: null,
    maxPhotos: 40,
    maxVideos: 6,
    maxServices: 50,
    features: [
      'Landing page própria no AgoraEncontrei',
      'Listagem em Empresas Parceiras',
      'Botão de WhatsApp e telefone direto',
      'Fotos, vídeos e serviços com preços',
      'Selo Verificado ✓',
      'Otimização de SEO no Google',
      'Painel para editar sua página quando quiser',
      'Métricas de visitas, cliques e leads',
    ],
  },
]

/** Plano único de divulgação (preço fixo). */
export const DIVULGACAO_PLAN: AdPlan = AD_PLANS[0]

export const AD_PLAN_BY_ID: Record<AdPlan['id'], AdPlan> = AD_PLANS.reduce(
  (acc, p) => { acc[p.id] = p; return acc },
  {} as Record<AdPlan['id'], AdPlan>,
)

// ─── MODELOS DE LANDING PAGE ─────────────────────────────────────────────────
export const LANDING_TEMPLATES: LandingTemplate[] = [
  { id: 'classico',  name: 'Clássico',  desc: 'Elegante e confiável — foto, serviços e contato em destaque.', accent: '#143A1F', layout: 'classic' },
  { id: 'vitrine',   name: 'Vitrine',   desc: 'Galeria de fotos grande no topo — ideal para portfólio visual.', accent: '#C9A84C', layout: 'showcase' },
  { id: 'impacto',   name: 'Impacto',   desc: 'Cores fortes e chamada direta — foco em conversão e WhatsApp.', accent: '#B45309', layout: 'bold' },
  { id: 'minimal',   name: 'Minimalista', desc: 'Limpo e direto ao ponto — leve, rápido e profissional.', accent: '#1E3A8A', layout: 'minimal' },
]

// ─── TIPOS DE CADASTRO ───────────────────────────────────────────────────────
export const BUSINESS_TYPES = [
  { value: 'EMPRESA',   label: 'Empresa',              emoji: '🏢', desc: 'Tenho um CNPJ e uma equipe/estrutura' },
  { value: 'AUTONOMO',  label: 'Autônomo / MEI',       emoji: '🧰', desc: 'Trabalho por conta própria ou como MEI' },
] as const

export type BusinessType = (typeof BUSINESS_TYPES)[number]['value']

// ─── SEGMENTOS + CATÁLOGO DE SERVIÇOS ────────────────────────────────────────
export const DIVULGUE_CATEGORIES: DivulgueCategory[] = [
  // ── Imobiliário & Jurídico ────────────────────────────────────────────────
  {
    value: 'IMOBILIARIA', dbCategory: 'IMOBILIARIA', label: 'Imobiliária', emoji: '🏢',
    group: 'Imobiliário & Jurídico', registryLabel: 'CRECI',
    tagline: 'Venda, locação e administração de imóveis',
    services: ['Venda de imóveis', 'Locação residencial', 'Locação comercial', 'Administração de aluguéis', 'Lançamentos', 'Imóveis de leilão', 'Intermediação de financiamento', 'Avaliação de imóveis', 'Regularização documental'],
  },
  {
    value: 'CORRETOR', dbCategory: 'CORRETOR', label: 'Corretor(a) de Imóveis', emoji: '🔑',
    group: 'Imobiliário & Jurídico', registryLabel: 'CRECI',
    tagline: 'Compra, venda e locação com atendimento próximo',
    services: ['Compra e venda', 'Locação', 'Assessoria em financiamento', 'Imóveis na planta', 'Imóveis de leilão', 'Imóveis comerciais', 'Consultoria de investimento', 'Captação de imóveis'],
  },
  {
    value: 'LOTEADORA', dbCategory: 'LOTEADORA', label: 'Loteadora / Incorporadora', emoji: '🏗️',
    group: 'Imobiliário & Jurídico', registryLabel: 'CRECI',
    tagline: 'Loteamentos e empreendimentos imobiliários',
    services: ['Loteamentos residenciais', 'Loteamentos comerciais', 'Condomínios fechados', 'Lotes rurais', 'Incorporação de empreendimentos', 'Venda na planta'],
  },
  {
    value: 'ADVOGADO_IMOBILIARIO', dbCategory: 'ADVOGADO_IMOBILIARIO', label: 'Advogado(a) Imobiliário', emoji: '⚖️',
    group: 'Imobiliário & Jurídico', registryLabel: 'OAB',
    tagline: 'Segurança jurídica na compra, venda e locação',
    services: ['Contratos de compra e venda', 'Análise de documentação', 'Regularização de imóveis', 'Usucapião', 'Assessoria em leilão', 'Inventário e partilha', 'Distrato e rescisão', 'Ações de despejo', 'Direito condominial'],
  },
  {
    value: 'DESPACHANTE', dbCategory: 'DESPACHANTE', label: 'Despachante Imobiliário', emoji: '📋',
    group: 'Imobiliário & Jurídico',
    tagline: 'Documentação e cartório sem dor de cabeça',
    services: ['Escritura pública', 'Registro de imóvel', 'ITBI', 'Certidões', 'Transferência de propriedade', 'Averbação de construção', 'Regularização em cartório'],
  },
  {
    value: 'AVALIADOR', dbCategory: 'AVALIADOR', label: 'Avaliador(a) de Imóveis', emoji: '📊',
    group: 'Imobiliário & Jurídico', registryLabel: 'CNAI/CREA',
    tagline: 'Laudos e avaliação de valor de mercado',
    services: ['Laudo PTAM', 'Avaliação para financiamento', 'Avaliação para inventário', 'Avaliação judicial', 'Avaliação para venda', 'Parecer técnico de valor', 'Avaliação de aluguel'],
  },

  // ── Projetos & Obras ──────────────────────────────────────────────────────
  {
    value: 'ARQUITETO', dbCategory: 'ARQUITETO', label: 'Arquiteto(a)', emoji: '📐',
    group: 'Projetos & Obras', registryLabel: 'CAU',
    tagline: 'Projetos que valorizam e transformam o imóvel',
    services: ['Projeto residencial', 'Projeto comercial', 'Reforma pós-arrematação', 'Regularização de matrícula', 'Aprovação de planta na prefeitura', 'Habite-se', 'Projeto de interiores', 'Projeto 3D e maquete', 'Consultoria de reforma'],
    suggestedTemplate: 'vitrine',
  },
  {
    value: 'ENGENHEIRO', dbCategory: 'ENGENHEIRO', label: 'Engenheiro(a) Civil', emoji: '🏛️',
    group: 'Projetos & Obras', registryLabel: 'CREA',
    tagline: 'Laudos, vistorias e execução de obras',
    services: ['Laudo estrutural', 'Vistoria cautelar de vizinhança', 'Laudo de avaliação', 'Reforma e ampliação', 'Regularização de obra', 'AVCB / Bombeiros', 'ART e responsabilidade técnica', 'Acompanhamento de obra', 'Perícia de engenharia'],
  },
  {
    value: 'CONSTRUTORA', dbCategory: 'ENGENHEIRO', label: 'Construtora', emoji: '🧱',
    group: 'Projetos & Obras', registryLabel: 'CREA',
    tagline: 'Construção e reforma completas, do projeto à chave',
    services: ['Construção de casas', 'Construção de edifícios', 'Reforma completa', 'Ampliação', 'Gerenciamento de obra', 'Construção a seco (steel/wood frame)', 'Obras comerciais', 'Terraplenagem e fundação'],
    suggestedTemplate: 'vitrine',
  },
  {
    value: 'REFORMAS', dbCategory: 'OUTRO', label: 'Reformas & Empreitas', emoji: '👷',
    group: 'Projetos & Obras',
    tagline: 'Pedreiro e empreiteira para reformar seu imóvel',
    services: ['Reforma geral', 'Alvenaria', 'Assentamento de piso e revestimento', 'Impermeabilização', 'Reboco e contrapiso', 'Demolição', 'Pequenas reformas', 'Mão de obra por empreitada'],
  },

  // ── Acabamento & Instalações ──────────────────────────────────────────────
  {
    value: 'PINTOR', dbCategory: 'OUTRO', label: 'Pintor / Pintura', emoji: '🎨',
    group: 'Acabamento & Instalações',
    tagline: 'Pintura residencial e comercial com acabamento',
    services: ['Pintura residencial', 'Pintura comercial', 'Textura e grafiato', 'Pintura de fachada', 'Efeitos decorativos', 'Massa corrida', 'Pintura epóxi', 'Verniz e madeira'],
  },
  {
    value: 'ELETRICISTA', dbCategory: 'OUTRO', label: 'Eletricista', emoji: '⚡',
    group: 'Acabamento & Instalações',
    tagline: 'Instalações elétricas seguras e certificadas',
    services: ['Instalação elétrica residencial', 'Instalação elétrica comercial', 'Troca de fiação', 'Quadro de distribuição', 'Aterramento e DPS', 'Iluminação e luminárias', 'Automação e tomadas', 'Laudo/adequação NR-10', 'Energia solar fotovoltaica'],
  },
  {
    value: 'ENCANADOR', dbCategory: 'OUTRO', label: 'Encanador / Hidráulica', emoji: '🚰',
    group: 'Acabamento & Instalações',
    tagline: 'Hidráulica, vazamentos e desentupimento',
    services: ['Instalação hidráulica', 'Caça-vazamentos', 'Desentupimento', 'Troca de tubulação', 'Instalação de louças e metais', 'Aquecedor e boiler', 'Caixa d’água e bombas', 'Reparo de esgoto'],
  },
  {
    value: 'GESSO_DRYWALL', dbCategory: 'OUTRO', label: 'Gesso & Drywall', emoji: '🪟',
    group: 'Acabamento & Instalações',
    tagline: 'Forros, sancas e paredes de drywall',
    services: ['Forro de gesso', 'Sanca com iluminação', 'Parede de drywall', 'Divisórias', 'Molduras e nichos', 'Placa acartonada acústica', 'Reparo de forro'],
  },
  {
    value: 'VIDRACARIA', dbCategory: 'OUTRO', label: 'Vidraçaria', emoji: '🪞',
    group: 'Acabamento & Instalações',
    tagline: 'Box, espelhos, guarda-corpos e fechamentos',
    services: ['Box de banheiro', 'Espelhos sob medida', 'Guarda-corpo de vidro', 'Fechamento de sacada', 'Portas e janelas de vidro', 'Vitrine comercial', 'Película e insulfilm'],
  },
  {
    value: 'SERRALHERIA', dbCategory: 'OUTRO', label: 'Serralheria', emoji: '🔩',
    group: 'Acabamento & Instalações',
    tagline: 'Portões, grades e estruturas metálicas',
    services: ['Portão basculante', 'Portão deslizante', 'Grades de proteção', 'Estrutura metálica', 'Corrimão e escada', 'Cobertura metálica', 'Automatização de portão', 'Solda e reparos'],
  },
  {
    value: 'CLIMATIZACAO', dbCategory: 'OUTRO', label: 'Ar-condicionado & Climatização', emoji: '❄️',
    group: 'Acabamento & Instalações',
    tagline: 'Instalação e manutenção de ar-condicionado',
    services: ['Instalação de split', 'Manutenção e limpeza', 'Recarga de gás', 'Projeto de climatização', 'Ar central / VRF', 'Higienização', 'Conserto de ar-condicionado', 'Cortina de ar'],
  },
  {
    value: 'MARIDO_ALUGUEL', dbCategory: 'OUTRO', label: 'Marido de Aluguel / Reparos', emoji: '🛠️',
    group: 'Acabamento & Instalações',
    tagline: 'Pequenos reparos e montagem em geral',
    services: ['Montagem de móveis', 'Instalação de prateleiras e quadros', 'Fixação de TV', 'Pequenos reparos elétricos', 'Pequenos reparos hidráulicos', 'Troca de fechaduras', 'Instalação de cortinas', 'Serviços gerais'],
  },

  // ── Móveis & Ambientação ──────────────────────────────────────────────────
  {
    value: 'DESIGNER_INTERIORES', dbCategory: 'DESIGNER_INTERIORES', label: 'Designer de Interiores', emoji: '🛋️',
    group: 'Móveis & Ambientação',
    tagline: 'Ambientes que encantam e valorizam',
    services: ['Decoração residencial', 'Decoração comercial', 'Home staging para venda', 'Projeto 3D de ambientes', 'Consultoria de decoração', 'Seleção de móveis e enxoval', 'Projeto de iluminação', 'Marcenaria planejada'],
    suggestedTemplate: 'vitrine',
  },
  {
    value: 'MARCENARIA', dbCategory: 'OUTRO', label: 'Marcenaria / Móveis Planejados', emoji: '🪚',
    group: 'Móveis & Ambientação',
    tagline: 'Móveis sob medida com acabamento premium',
    services: ['Cozinha planejada', 'Dormitório planejado', 'Home office', 'Painel e rack', 'Closet e guarda-roupa', 'Móveis comerciais', 'Portas e painéis', 'Móveis sob medida'],
    suggestedTemplate: 'vitrine',
  },
  {
    value: 'MOVEIS_DECOR', dbCategory: 'OUTRO', label: 'Loja de Móveis & Decoração', emoji: '🪑',
    group: 'Móveis & Ambientação',
    tagline: 'Móveis, decoração e enxoval para o novo lar',
    services: ['Móveis prontos', 'Estofados e sofás', 'Colchões', 'Objetos de decoração', 'Tapetes e cortinas', 'Iluminação decorativa', 'Enxoval', 'Entrega e montagem'],
  },
  {
    value: 'DECORACAO', dbCategory: 'OUTRO', label: 'Cortinas, Persianas & Papel de Parede', emoji: '🪟',
    group: 'Móveis & Ambientação',
    tagline: 'Ambientação têxtil e revestimentos decorativos',
    services: ['Cortinas sob medida', 'Persianas', 'Papel de parede', 'Painéis decorativos', 'Tapeçaria', 'Almofadas e enxoval', 'Instalação'],
  },
  {
    value: 'PAISAGISMO', dbCategory: 'OUTRO', label: 'Paisagismo & Jardinagem', emoji: '🌳',
    group: 'Móveis & Ambientação',
    tagline: 'Jardins, áreas externas e áreas de lazer',
    services: ['Projeto de paisagismo', 'Jardim vertical', 'Manutenção de jardim', 'Grama e gramado', 'Irrigação automática', 'Deck e pergolado', 'Área gourmet externa', 'Plantio e adubação'],
  },

  // ── Mídia & Marketing ─────────────────────────────────────────────────────
  {
    value: 'FOTOGRAFO', dbCategory: 'FOTOGRAFO', label: 'Fotógrafo(a) Imobiliário', emoji: '📸',
    group: 'Mídia & Marketing',
    tagline: 'Fotos que vendem imóveis mais rápido',
    services: ['Fotografia imobiliária', 'Tour virtual 360°', 'Foto com drone', 'Foto de arquitetura', 'Ensaio de decoração', 'Edição profissional', 'Foto para portais', 'Vídeo institucional'],
    suggestedTemplate: 'vitrine',
  },
  {
    value: 'VIDEOMAKER', dbCategory: 'VIDEOMAKER', label: 'Videomaker', emoji: '🎬',
    group: 'Mídia & Marketing',
    tagline: 'Vídeos e reels que geram desejo',
    services: ['Vídeo de imóvel', 'Filmagem com drone', 'Reels para Instagram', 'Tour em vídeo', 'Vídeo institucional', 'Edição e pós-produção', 'Vídeo para lançamentos', 'Cobertura de eventos'],
    suggestedTemplate: 'vitrine',
  },

  // ── Serviços & Manutenção ─────────────────────────────────────────────────
  {
    value: 'LIMPEZA', dbCategory: 'OUTRO', label: 'Limpeza & Pós-obra', emoji: '🧽',
    group: 'Serviços & Manutenção',
    tagline: 'Limpeza pesada, pós-obra e diarista',
    services: ['Limpeza pós-obra', 'Limpeza pesada', 'Diarista', 'Limpeza de vidros e fachada', 'Higienização de estofados', 'Limpeza de caixa d’água', 'Limpeza comercial', 'Limpeza pré-mudança'],
  },
  {
    value: 'DEDETIZADORA', dbCategory: 'OUTRO', label: 'Dedetização & Controle de Pragas', emoji: '🐜',
    group: 'Serviços & Manutenção',
    tagline: 'Ambiente livre de pragas com certificado',
    services: ['Dedetização', 'Desratização', 'Descupinização', 'Controle de escorpiões', 'Sanitização', 'Limpeza de caixa d’água', 'Certificado sanitário'],
  },
  {
    value: 'MUDANCAS', dbCategory: 'OUTRO', label: 'Mudanças & Fretes', emoji: '🚚',
    group: 'Serviços & Manutenção',
    tagline: 'Mudança residencial e comercial sem estresse',
    services: ['Mudança residencial', 'Mudança comercial', 'Frete e carreto', 'Embalagem e içamento', 'Montagem e desmontagem', 'Guarda-móveis', 'Transporte de piano/objetos especiais'],
  },
  {
    value: 'SEGURANCA', dbCategory: 'OUTRO', label: 'Segurança & Monitoramento', emoji: '📹',
    group: 'Serviços & Manutenção',
    tagline: 'Câmeras, alarmes e portaria para seu imóvel',
    services: ['Instalação de câmeras (CFTV)', 'Alarme monitorado', 'Cerca elétrica', 'Controle de acesso', 'Interfone e vídeoporteiro', 'Portaria remota', 'Manutenção de sistemas'],
  },

  // ── Outro ─────────────────────────────────────────────────────────────────
  {
    value: 'OUTRO', dbCategory: 'OUTRO', label: 'Outro serviço', emoji: '✨',
    group: 'Outros',
    tagline: 'Outros serviços ligados ao seu imóvel',
    services: [],
  },
]

export const CATEGORY_GROUPS: string[] = Array.from(
  new Set(DIVULGUE_CATEGORIES.map(c => c.group)),
)

export function getCategory(value: string | undefined | null): DivulgueCategory | undefined {
  if (!value) return undefined
  return DIVULGUE_CATEGORIES.find(c => c.value === value)
}

// ─── PLANO DE MARKETING / ESTRATÉGIA DE SEO (conteúdo da página de vendas) ────

/** Como o AgoraEncontrei entrega resultado para o parceiro. */
export const RESULT_PILLARS = [
  {
    emoji: '🔎',
    title: 'Você aparece no Google',
    desc: 'Sua landing page é otimizada para SEO e indexada no Google. Quem busca "eletricista no Jardim Aeroporto" ou "reforma no Edifício Prime Franca" encontra o seu negócio.',
  },
  {
    emoji: '🎯',
    title: 'Público certo, na hora certa',
    desc: 'Você aparece para quem acabou de comprar, alugar ou está reformando um imóvel na região — exatamente quem precisa do seu serviço.',
  },
  {
    emoji: '🔗',
    title: 'Autoridade por associação',
    desc: 'Seu perfil é vinculado a bairros, condomínios e páginas de imóveis de alto tráfego do marketplace. O Google entende que você é referência local.',
  },
  {
    emoji: '📈',
    title: 'Você mede tudo',
    desc: 'Painel com visualizações, cliques no WhatsApp e leads recebidos. Sem achismo: você vê o retorno do seu investimento.',
  },
]

/** Estratégia de SEO detalhada — como potencializamos o Google. */
export const SEO_STRATEGY = [
  {
    step: '01',
    title: 'Landing page indexável e rápida',
    desc: 'Cada parceiro ganha uma página própria (URL amigável, título e descrição otimizados, dados estruturados Schema.org de LocalBusiness) que o Google lê e ranqueia.',
  },
  {
    step: '02',
    title: 'SEO local por bairro e cidade',
    desc: 'Geramos páginas de "serviço + bairro + cidade" (ex.: pintor em Franca/SP) e interligamos ao seu perfil, capturando buscas com alta intenção de contratação.',
  },
  {
    step: '03',
    title: 'Interligação com condomínios e imóveis',
    desc: 'Seu perfil aparece nas páginas de condomínios, edifícios, leilões e imóveis do marketplace — páginas que já recebem milhares de visitas por mês.',
  },
  {
    step: '04',
    title: 'Conteúdo e prova social',
    desc: 'Serviços descritos, fotos, vídeos e depoimentos alimentam o Google com conteúdo fresco e relevante, melhorando seu posicionamento ao longo do tempo.',
  },
  {
    step: '05',
    title: 'Distribuição além do Google',
    desc: 'Sua página é compartilhável no WhatsApp, Instagram e Google Meu Negócio, com imagem de link (Open Graph) pronta — mais canais, mais leads.',
  },
]

/** Números de prova de demanda usados no hero. */
export const PROOF_STATS = [
  { value: '300+', label: 'Condomínios mapeados' },
  { value: '1.000+', label: 'Imóveis ativos' },
  { value: '5.000+', label: 'Famílias atendidas' },
  { value: 'R$ 39,90', label: 'Para começar a divulgar' },
]

export function formatBRL(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

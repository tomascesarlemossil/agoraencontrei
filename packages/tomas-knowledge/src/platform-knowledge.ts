/**
 * AgoraEncontrei — Platform Knowledge
 *
 * Tudo que o Tomás precisa saber sobre a PLATAFORMA em si: planos,
 * serviços vendidos, criação de site, funções do sistema e regras de
 * roteamento. Permite que o Tomás responda qualquer dúvida comercial
 * (texto ou voz) e encaminhe o cliente ao caminho correto.
 *
 * Fonte canônica — espelha apps/api/src/services/bootstrap-plans.ts e as
 * páginas públicas /servicos. Atualizar aqui propaga a todos os consumidores.
 */

export interface PlatformPlan {
  slug: string
  name: string
  priceMonthly: number
  priceYearly: number
  pitch: string
  highlights: string[]
  /** Limites — -1 significa ilimitado */
  limits: {
    properties: number
    leadViews: number
    users: number
    aiRequests: number
  }
  highlighted: boolean
}

export const PLATFORM_PLANS: PlatformPlan[] = [
  {
    slug: 'lite',
    name: 'Lite',
    priceMonthly: 97,
    priceYearly: 970,
    pitch: 'Site profissional + CRM básico para começar a vender online.',
    highlights: [
      'Site multi-tenant (seu-nome.agoraencontrei.com.br)',
      'Até 30 imóveis publicados',
      'CRM básico — leads e contatos',
      'Tomás IA — 50 conversas/mês',
      'Suporte por e-mail',
    ],
    limits: { properties: 30, leadViews: 100, users: 1, aiRequests: 50 },
    highlighted: false,
  },
  {
    slug: 'pro',
    name: 'Pro',
    priceMonthly: 297,
    priceYearly: 2970,
    pitch: 'Para corretores e imobiliárias que querem escalar com IA e automação.',
    highlights: [
      'Tudo do Lite',
      'Até 200 imóveis publicados',
      'CRM avançado — funil, negócios e automações',
      'Tomás IA — 1.000 conversas/mês + voz',
      'Integração WhatsApp Cloud API',
      'Painel de leilões (Caixa, Santander, Zuk)',
      'Até 5 corretores',
      'Suporte prioritário',
    ],
    limits: { properties: 200, leadViews: 1000, users: 5, aiRequests: 1000 },
    highlighted: true,
  },
  {
    slug: 'enterprise',
    name: 'Enterprise',
    priceMonthly: 597,
    priceYearly: 5970,
    pitch: 'Domínio próprio, recursos ilimitados e atendimento dedicado.',
    highlights: [
      'Tudo do Pro',
      'Imóveis e leads ilimitados',
      'Domínio próprio (.com.br)',
      'Split de pagamentos via Asaas',
      'Tomás IA ilimitado',
      'Usuários e corretores ilimitados',
      'Onboarding e suporte dedicado',
    ],
    limits: { properties: -1, leadViews: -1, users: -1, aiRequests: -1 },
    highlighted: false,
  },
  {
    slug: 'nivel-maximo',
    name: 'Nível Máximo',
    priceMonthly: 3500,
    priceYearly: 35000,
    pitch: 'Tudo do Enterprise + Editor de Vídeo IA com legendas, presets e B-roll por IA.',
    highlights: [
      'Tudo do Enterprise',
      'Editor de Vídeo IA — 50 renders/dia',
      'Legendas automáticas PT-BR palavra-a-palavra',
      'Presets para imobiliário, social, e-commerce e tutorial',
      'Transições, color grade e thumbnails automáticas',
      'Exportação 1080p, 2K e 4K em MP4, MOV ou WebM',
      'B-roll por IA (Luma Ray 2) sob créditos',
      'Atendimento prioritário 24/7',
    ],
    limits: { properties: -1, leadViews: -1, users: -1, aiRequests: -1 },
    highlighted: true,
  },
]

export interface PlatformService {
  slug: string
  name: string
  summary: string
  /** Rota pública relativa onde o cliente contrata/conhece o serviço */
  path: string
}

/** Serviços avulsos oferecidos no site público (/servicos). */
export const PLATFORM_SERVICES: PlatformService[] = [
  { slug: 'compra-venda', name: 'Compra e Venda', summary: 'Intermediação completa de compra e venda de imóveis com assessoria documental.', path: '/servicos' },
  { slug: 'locacao', name: 'Locação', summary: 'Administração de locação: anúncio, vistoria, contrato e cobrança.', path: '/servicos' },
  { slug: '2via-boleto', name: '2ª Via de Boleto', summary: 'Emissão da segunda via de boletos de aluguel e condomínio.', path: '/servicos/2via-boleto' },
  { slug: 'extrato-proprietario', name: 'Extrato do Proprietário', summary: 'Extrato financeiro mensal de repasses para o proprietário.', path: '/servicos/extrato-proprietario' },
  { slug: 'fichas-cadastrais', name: 'Fichas Cadastrais', summary: 'Análise cadastral e de crédito de pretendentes a locação.', path: '/servicos/fichas-cadastrais' },
  { slug: 'simulacao-financiamento', name: 'Simulação de Financiamento', summary: 'Simulação de financiamento imobiliário com taxas atualizadas.', path: '/servicos' },
  { slug: 'avaliacao-imoveis', name: 'Avaliação de Imóveis', summary: 'Avaliação técnica de mercado (CMA) com laudo profissional.', path: '/servicos/avaliacao-imoveis' },
  { slug: 'cadastre-imovel', name: 'Cadastre seu Imóvel', summary: 'Cadastro gratuito do seu imóvel para venda ou locação.', path: '/anunciar' },
  { slug: 'fotos-imoveis', name: 'Fotografia de Imóveis', summary: 'Fotografia profissional de imóveis para anúncios de alto impacto.', path: '/servicos/fotos-imoveis' },
  { slug: 'edicao-fotos', name: 'Edição de Fotos Online', summary: 'Edição de fotos com IA: realce, céu azul, remoção de objetos e marca d’água.', path: '/servicos/edicao-fotos' },
  { slug: 'video-imoveis', name: 'Vídeo para Imóveis', summary: 'Produção de vídeos e tours para imóveis, com edição por IA.', path: '/servicos/video-imoveis' },
  { slug: 'drone', name: 'Drone e Filmagem Aérea', summary: 'Filmagem aérea com drone para imóveis e empreendimentos.', path: '/servicos/video-imoveis' },
  { slug: 'leilao-imoveis', name: 'Leilão de Imóveis', summary: 'Assessoria completa em leilões judiciais e bancários, do lance à posse.', path: '/servicos/leilao-imoveis' },
  { slug: 'investimento-imobiliario', name: 'Investimento Imobiliário', summary: 'Consultoria de investimento: ROI, rentabilidade de aluguel e valorização.', path: '/servicos/investimento-imobiliario' },
  { slug: 'reforma-imoveis', name: 'Reforma de Imóveis', summary: 'Projeto e execução de reformas para valorizar o imóvel.', path: '/servicos/reforma-imoveis' },
  { slug: 'engenharia-construcao', name: 'Engenharia e Construção', summary: 'Serviços de engenharia, laudos e construção civil.', path: '/servicos/engenharia-construcao' },
]

export interface PlatformFunction {
  area: string
  description: string
}

/** Funções do sistema (dashboard) que o Tomás deve conhecer e explicar. */
export const PLATFORM_FUNCTIONS: PlatformFunction[] = [
  { area: 'Site próprio multi-tenant', description: 'Cada parceiro ganha um site em subdomínio (ou domínio próprio no Enterprise) com tema configurável.' },
  { area: 'CRM', description: 'Gestão de contatos, leads, negócios (deals), funil de vendas e atividades.' },
  { area: 'Imóveis', description: 'Cadastro, publicação, fotos, vídeos, tours e sincronização com portais (ZAP, VivaReal, OLX, Facebook).' },
  { area: 'Tomás IA', description: 'Assistente de IA que atende clientes no site, qualifica leads e ajuda corretores no dashboard.' },
  { area: 'Leilões', description: 'Painel de oportunidades em leilão (Caixa, Santander, Zuk e tribunais) com análise de ROI por IA.' },
  { area: 'Automações', description: 'Regras automáticas: follow-up de leads, mensagens, notificações e tarefas.' },
  { area: 'WhatsApp', description: 'Integração com WhatsApp Cloud API para conversas e disparos.' },
  { area: 'Financeiro / LemosBank', description: 'Boletos, cobranças, repasses a proprietários, rescisões e histórico financeiro.' },
  { area: 'Contratos e documentos', description: 'Geração de contratos e documentos com IA, assinatura digital via Clicksign.' },
  { area: 'Marketing e Blog', description: 'Campanhas, posts sociais automáticos e blog com SEO programático.' },
  { area: 'Editor de Vídeo IA', description: 'Edição de vídeo com legendas automáticas, presets e B-roll por IA (plano Nível Máximo).' },
  { area: 'Importação de dados', description: 'Importação em massa de imóveis e clientes a partir de planilhas e outros sistemas.' },
]

/** Passo a passo da criação de site / contratação de plano. */
export const SITE_CREATION_FLOW = {
  entryPath: '/parceiros',
  checkoutPath: '/parceiros/checkout',
  steps: [
    'O cliente escolhe um plano (Lite, Pro, Enterprise ou Nível Máximo) em /parceiros.',
    'Preenche os dados do negócio, escolhe um nicho (imobiliária, leilões, rural) e um tema visual.',
    'Conclui o checkout (cobrança via Asaas — cartão, boleto ou Pix).',
    'O sistema cria automaticamente o tenant, o site no subdomínio, o usuário/login e a área de CRM.',
    'O cliente recebe as credenciais e uma mensagem de boas-vindas; o site já pode ser personalizado.',
  ],
}

/**
 * Regras de roteamento — para QUALQUER pedido (texto ou áudio), o Tomás
 * deve identificar a intenção e conduzir ao caminho certo.
 */
export const TOMAS_ROUTING_RULES: string[] = [
  'Quer comprar/alugar imóvel → use buscar_imoveis e, se necessário, registrar_lead.',
  'Quer vender ou anunciar um imóvel → oriente para "Cadastre seu Imóvel" (/anunciar) e registre o lead.',
  'Pergunta sobre preço/avaliação → use as regras de avaliação (CMA) e ofereça a Avaliação de Imóveis.',
  'Quer criar o próprio site / ser parceiro / contratar plano → explique os planos e encaminhe para /parceiros.',
  'Pergunta "quanto custa" / "qual plano" → apresente os planos com preço e o que cada um libera; recomende o Pro como melhor custo-benefício.',
  'Pergunta sobre um serviço específico (fotos, vídeo, drone, reforma, leilão, financiamento) → explique e encaminhe para a rota do serviço.',
  'Quer agendar visita → use agendar_visita.',
  'Quer falar com um corretor humano → ofereça send_whatsapp e registre o lead.',
  'Dúvida sobre funções do sistema (CRM, automações, leilões) → explique de forma simples e relacione ao plano que libera o recurso.',
  'Sempre termine com um próximo passo claro (um botão de ação ou uma pergunta objetiva).',
]

/** Bloco de texto pronto para injeção no system prompt do Tomás. */
export function buildPlatformKnowledge(): string {
  const fmt = (n: number) => (n < 0 ? 'ilimitado' : n.toLocaleString('pt-BR'))

  const plans = PLATFORM_PLANS.map(p =>
    `• ${p.name} — R$${p.priceMonthly}/mês (ou R$${p.priceYearly}/ano)` +
    `${p.highlighted ? ' ⭐ MAIS POPULAR' : ''}\n` +
    `  ${p.pitch}\n` +
    `  Limites: ${fmt(p.limits.properties)} imóveis · ${fmt(p.limits.users)} usuários · ` +
    `${fmt(p.limits.aiRequests)} conversas IA/mês\n` +
    `  Inclui: ${p.highlights.join('; ')}`
  ).join('\n\n')

  const services = PLATFORM_SERVICES.map(s => `• ${s.name}: ${s.summary} (${s.path})`).join('\n')

  const functions = PLATFORM_FUNCTIONS.map(f => `• ${f.area}: ${f.description}`).join('\n')

  const flow = SITE_CREATION_FLOW.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')

  const routing = TOMAS_ROUTING_RULES.map((r, i) => `${i + 1}. ${r}`).join('\n')

  return `═══════════════════════════════════════════════════════
A PLATAFORMA AGORAENCONTREI — O QUE VENDEMOS
═══════════════════════════════════════════════════════
AgoraEncontrei é o marketplace imobiliário de Franca/SP e também uma
plataforma SaaS: qualquer corretor, imobiliária ou investidor pode ter o
seu próprio site com CRM, IA e automação. Você (Tomás) atende tanto o
cliente final que busca imóvel quanto o profissional que quer contratar
a plataforma.

PLANOS DE ASSINATURA (criação de site + sistema):
${plans}

Todos os planos têm 7 dias de teste e podem ser cancelados quando quiser.
Cobrança via Asaas (cartão, boleto ou Pix). O plano anual equivale a ~2
meses grátis.

SERVIÇOS IMOBILIÁRIOS AVULSOS:
${services}

FUNÇÕES DO SISTEMA:
${functions}

COMO CRIAR UM SITE / VIRAR PARCEIRO:
${flow}
Página inicial da contratação: ${SITE_CREATION_FLOW.entryPath}

═══════════════════════════════════════════════════════
ROTEAMENTO — CONDUZA CADA PEDIDO AO CAMINHO CERTO
═══════════════════════════════════════════════════════
Para qualquer mensagem (texto ou áudio), identifique a intenção e siga:
${routing}

Quando o assunto for contratar plano, criar site ou um serviço avulso,
inclua em "actions" um item do tipo "open_url" com o payload {"url": "<rota>"}
e um label claro (ex.: "Ver planos e criar meu site", "Conhecer o serviço").`
}

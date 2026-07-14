/**
 * Tomás — Matriz de Política por Ferramenta (Fase 4)
 *
 * Fonte única de verdade das permissões dos DOIS cérebros. Para cada ferramenta
 * define: em qual cérebro pode rodar, se exige companyId, se é leitura/escrita,
 * se exige confirmação explícita, o papel mínimo do usuário, e se audita.
 *
 * Princípios (inegociáveis):
 *  - Cérebro MARKETPLACE (público/plataforma): só dados públicos + operação da
 *    plataforma para o operador autorizado. NUNCA expõe dado privado de parceiro.
 *  - Cérebro PARTNER: só dados do PRÓPRIO companyId; nunca dados globais da
 *    plataforma; nunca dados de outro parceiro; respeita o papel do usuário.
 *  - Ação de ESCRITA nunca é executada silenciosamente — exige confirmação.
 *  - Ferramenta desconhecida = NEGADA por padrão (fail-closed).
 */

export type TomasBrain = 'marketplace' | 'partner'
export type ToolAccess = 'read' | 'write'

/**
 * Ranque de papel (crescente). O cérebro PARTNER mapeia modos:
 *   0 anônimo (site público do parceiro) · 1 corretor (BROKER) ·
 *   2 administração (ADMIN) · 3 direção/plataforma (SUPER_ADMIN).
 * O cérebro MARKETPLACE/plataforma reserva os dados globais ao rank 3.
 */
export const ROLE_RANK = {
  anonymous: 0,
  BROKER: 1,
  MANAGER: 2,
  ADMIN: 2,
  SUPER_ADMIN: 3,
} as const

export type RoleName = keyof typeof ROLE_RANK

export function roleRank(role?: string | null): number {
  if (!role) return 0
  const r = (ROLE_RANK as Record<string, number>)[role]
  return typeof r === 'number' ? r : 0
}

export interface ToolPolicy {
  /** Cérebros onde a ferramenta pode rodar. */
  brains: TomasBrain[]
  /** Exige um companyId resolvido (escopo obrigatório do parceiro). */
  requiresCompanyId: boolean
  access: ToolAccess
  /** Ação de escrita exige confirmação explícita antes de executar. */
  requiresConfirmation: boolean
  /** Papel mínimo do usuário (rank). 0 = permite anônimo. */
  minRoleRank: number
  /** Grava trilha de auditoria ao executar. */
  audit: boolean
  description: string
}

const R = ROLE_RANK

/**
 * MATRIZ COMPLETA. Ferramentas já implementadas + domínios previstos (declarados
 * para governar futuras tools sem regressão de segurança). Tudo que não está
 * aqui é NEGADO por padrão.
 */
export const TOOL_POLICIES: Record<string, ToolPolicy> = {
  // ── Imóveis ──────────────────────────────────────────────────────────────
  buscar_imoveis: {
    brains: ['marketplace', 'partner'], requiresCompanyId: false, access: 'read',
    requiresConfirmation: false, minRoleRank: R.anonymous, audit: false,
    description: 'Busca imóveis. Marketplace: só publicados (todas as empresas). Partner: só do companyId.',
  },
  detalhar_imovel: {
    brains: ['marketplace', 'partner'], requiresCompanyId: false, access: 'read',
    requiresConfirmation: false, minRoleRank: R.anonymous, audit: false,
    description: 'Detalha um imóvel. Mesmo escopo de buscar_imoveis.',
  },
  identificar_bairro: {
    brains: ['marketplace', 'partner'], requiresCompanyId: false, access: 'read',
    requiresConfirmation: false, minRoleRank: R.anonymous, audit: false,
    description: 'Infere o bairro pelo cadastro imobiliário, sem tratá-lo como fonte oficial.',
  },
  buscar_comparaveis: {
    brains: ['marketplace', 'partner'], requiresCompanyId: false, access: 'read',
    requiresConfirmation: false, minRoleRank: R.anonymous, audit: false,
    description: 'Busca comparáveis públicos ou somente da empresa do parceiro.',
  },
  estimar_valor_imovel: {
    brains: ['marketplace', 'partner'], requiresCompanyId: false, access: 'read',
    requiresConfirmation: false, minRoleRank: R.anonymous, audit: false,
    description: 'Produz faixa estatística preliminar com confiança e origem explícitas.',
  },
  consultar_indice_bairro: {
    brains: ['marketplace', 'partner'], requiresCompanyId: false, access: 'read',
    requiresConfirmation: false, minRoleRank: R.anonymous, audit: false,
    description: 'Consulta índice agregado de preços anunciados por bairro.',
  },
  consultar_historico_preco: {
    brains: ['marketplace', 'partner'], requiresCompanyId: false, access: 'read',
    requiresConfirmation: false, minRoleRank: R.anonymous, audit: false,
    description: 'Consulta o histórico disponível sem expor dados pessoais ou cruzar empresas.',
  },
  verificar_fonte: {
    brains: ['marketplace', 'partner'], requiresCompanyId: false, access: 'read',
    requiresConfirmation: false, minRoleRank: R.anonymous, audit: false,
    description: 'Verifica autorização, confiabilidade e regras de uso de uma fonte cadastrada.',
  },
  consultar_conhecimento_publico: {
    brains: ['marketplace', 'partner'], requiresCompanyId: false, access: 'read',
    requiresConfirmation: false, minRoleRank: R.anonymous, audit: false,
    description: 'Consulta conteúdo público verificado sobre a plataforma, jornadas, ferramentas, serviços, pessoas e projetos.',
  },
  buscar_parceiros: {
    brains: ['marketplace', 'partner'], requiresCompanyId: false, access: 'read',
    requiresConfirmation: false, minRoleRank: R.anonymous, audit: false,
    description: 'Busca somente empresas e profissionais com perfil público aprovado no diretório.',
  },
  alterar_imovel: {
    brains: ['partner'], requiresCompanyId: true, access: 'write',
    requiresConfirmation: true, minRoleRank: R.BROKER, audit: true,
    description: 'Altera dados/preço de um imóvel do parceiro. Escrita — exige confirmação.',
  },
  // ── Leilões (dados públicos globais — ativos e históricos/arrematados) ─────
  buscar_leiloes: {
    brains: ['marketplace', 'partner'], requiresCompanyId: false, access: 'read',
    requiresConfirmation: false, minRoleRank: R.anonymous, audit: false,
    description: 'Busca leilões de imóveis (Caixa, bancos, judiciais, leiloeiros) por localização/tipo/valor. Dados públicos, ativos e históricos.',
  },
  relatorio_leiloes: {
    brains: ['marketplace', 'partner'], requiresCompanyId: false, access: 'read',
    requiresConfirmation: false, minRoleRank: R.anonymous, audit: false,
    description: 'Relatório estatístico agregado de leilões (contagem, valores mín/médio/mediana/máx, desconto) por localização/tipo. Dados públicos.',
  },
  // ── Leads / Contatos / Visitas / Propostas ─────────────────────────────────
  registrar_lead: {
    brains: ['marketplace', 'partner'], requiresCompanyId: false, access: 'write',
    requiresConfirmation: false, minRoleRank: R.anonymous, audit: true,
    description: 'Registra um lead. No marketplace só grava se houver companyId (anúncio de um parceiro); nunca transfere sem consentimento.',
  },
  agendar_visita: {
    brains: ['marketplace', 'partner'], requiresCompanyId: true, access: 'write',
    requiresConfirmation: false, minRoleRank: R.anonymous, audit: true,
    description: 'Agenda uma visita a um imóvel de um parceiro.',
  },
  consultar_contatos: {
    brains: ['partner'], requiresCompanyId: true, access: 'read',
    requiresConfirmation: false, minRoleRank: R.BROKER, audit: true,
    description: 'Lista contatos/clientes internos do parceiro. Só interno (corretor+).',
  },
  criar_proposta: {
    brains: ['partner'], requiresCompanyId: true, access: 'write',
    requiresConfirmation: true, minRoleRank: R.BROKER, audit: true,
    description: 'Cria uma proposta. Escrita — exige confirmação.',
  },
  // ── Transferência de lead (marketplace → parceiro) ────────────────────────
  transferir_lead: {
    brains: ['marketplace'], requiresCompanyId: false, access: 'write',
    requiresConfirmation: true, minRoleRank: R.anonymous, audit: true,
    description: 'Transfere um lead do marketplace para um parceiro. SEMPRE exige consentimento explícito e versionado (ver lead-transfer-consent).',
  },
  // ── Contratos / Locações / Documentos / Pagamentos (administração+) ────────
  consultar_contratos: {
    brains: ['partner'], requiresCompanyId: true, access: 'read',
    requiresConfirmation: false, minRoleRank: R.ADMIN, audit: true,
    description: 'Contratos do parceiro. Administração+.',
  },
  consultar_locacoes: {
    brains: ['partner'], requiresCompanyId: true, access: 'read',
    requiresConfirmation: false, minRoleRank: R.ADMIN, audit: true,
    description: 'Locações/repasses/inadimplência do parceiro. Administração+.',
  },
  consultar_documentos: {
    brains: ['partner'], requiresCompanyId: true, access: 'read',
    requiresConfirmation: false, minRoleRank: R.BROKER, audit: true,
    description: 'Documentos do parceiro. Interno (corretor+).',
  },
  gerar_cobranca: {
    brains: ['partner'], requiresCompanyId: true, access: 'write',
    requiresConfirmation: true, minRoleRank: R.ADMIN, audit: true,
    description: 'Gera uma cobrança/boleto. Escrita sensível — administração+ e confirmação.',
  },
  // ── Relatórios / Usuários ─────────────────────────────────────────────────
  gerar_relatorio: {
    brains: ['partner', 'marketplace'], requiresCompanyId: false, access: 'read',
    requiresConfirmation: false, minRoleRank: R.ADMIN, audit: true,
    description: 'Relatórios. Partner: escopado ao companyId (admin+). Marketplace: só dados globais para a direção da plataforma (rank 3).',
  },
  alterar_usuario: {
    brains: ['partner', 'marketplace'], requiresCompanyId: true, access: 'write',
    requiresConfirmation: true, minRoleRank: R.ADMIN, audit: true,
    description: 'Cria/edita usuário ou permissão. Escrita crítica — administração+ e confirmação.',
  },
  // ── Plataforma (somente cérebro marketplace + direção da plataforma) ───────
  intel_plataforma: {
    brains: ['marketplace'], requiresCompanyId: false, access: 'read',
    requiresConfirmation: false, minRoleRank: R.SUPER_ADMIN, audit: true,
    description: 'Métricas globais da plataforma (receita/MRR/parceiros). SÓ direção da plataforma. Nunca exposto a um parceiro.',
  },
  // ── Comunicação (escrita — sempre confirmação) ────────────────────────────
  enviar_whatsapp: {
    brains: ['partner', 'marketplace'], requiresCompanyId: false, access: 'write',
    requiresConfirmation: true, minRoleRank: R.anonymous, audit: true,
    description: 'Envia WhatsApp em nome do parceiro/plataforma. Escrita — confirmação + auditoria.',
  },
  enviar_email: {
    brains: ['partner', 'marketplace'], requiresCompanyId: false, access: 'write',
    requiresConfirmation: true, minRoleRank: R.BROKER, audit: true,
    description: 'Envia e-mail. Escrita — confirmação + auditoria.',
  },
}

export interface PolicyContext {
  brain: TomasBrain
  companyId?: string
  /** Rank do papel do usuário (0 anônimo). */
  roleRank: number
  /** true quando o usuário já confirmou explicitamente uma ação de escrita. */
  confirmed?: boolean
}

export type PolicyDecision =
  | { decision: 'allow'; policy: ToolPolicy }
  | { decision: 'deny'; reason: string }
  | { decision: 'needs_confirmation'; policy: ToolPolicy; reason: string }

/**
 * Avalia se uma ferramenta pode rodar no contexto dado. Fail-closed:
 * ferramenta desconhecida → deny.
 */
export function evaluateToolPolicy(toolName: string, ctx: PolicyContext): PolicyDecision {
  const policy = TOOL_POLICIES[toolName]
  if (!policy) {
    return { decision: 'deny', reason: `Ferramenta '${toolName}' não é permitida.` }
  }
  if (!policy.brains.includes(ctx.brain)) {
    return { decision: 'deny', reason: `Ferramenta '${toolName}' não está disponível neste cérebro (${ctx.brain}).` }
  }
  if (policy.requiresCompanyId && !ctx.companyId) {
    return { decision: 'deny', reason: `Ferramenta '${toolName}' exige contexto de empresa (companyId).` }
  }
  if (ctx.roleRank < policy.minRoleRank) {
    return { decision: 'deny', reason: `Permissão insuficiente para '${toolName}'.` }
  }
  if (policy.access === 'write' && policy.requiresConfirmation && !ctx.confirmed) {
    return { decision: 'needs_confirmation', policy, reason: `A ação '${toolName}' é uma escrita e precisa de confirmação explícita.` }
  }
  return { decision: 'allow', policy }
}

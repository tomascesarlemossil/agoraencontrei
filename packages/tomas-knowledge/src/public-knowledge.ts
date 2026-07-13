export type PublicKnowledgeKind =
  | 'platform'
  | 'journey'
  | 'tool'
  | 'service'
  | 'partner'
  | 'person'
  | 'project'
  | 'policy'

export interface PublicKnowledgeSource {
  label: string
  url: string
  verifiedAt: string
}

export interface PublicKnowledgeEntry {
  id: string
  kind: PublicKnowledgeKind
  title: string
  summary: string
  details: string[]
  aliases: string[]
  path?: string
  sources?: PublicKnowledgeSource[]
}

const VERIFIED_AT = '2026-07-13'

export const NIU_PUBLIC_PROFILE = {
  id: 'seed_niu_arquitetura',
  slug: 'niu-arquitetura',
  name: 'NIU Arquitetura',
  aliases: ['Niu', 'Neo Arquitetura', 'Niu Arquitetura e Construção'],
  category: 'ARQUITETO',
  categoryLabel: 'Arquitetura e Design',
  city: 'Franca',
  state: 'SP',
  foundedAt: '2018',
  people: [
    { name: 'Yuri Miranda', role: 'arquiteto e urbanista' },
    { name: 'Douglas Costa', role: 'gestor de obras' },
  ],
  services: [
    'projetos arquitetônicos residenciais',
    'arquitetura comercial',
    'design de interiores',
    'reformas e valorização de imóveis',
    'edifícios multifamiliares',
  ],
  phone: '+55 16 99460-8222',
  whatsapp: '+55 16 99264-6070',
  email: 'contato@niuarquitetura.com',
  instagram: 'niu_arquitetura',
  website: 'https://niuarquitetura.com',
  address: 'Av. Dr. Armando Sales de Oliveira, 503 - Franca/SP',
  profilePath: '/parceiros/niu-arquitetura',
} as const

export const PUBLIC_KNOWLEDGE: PublicKnowledgeEntry[] = [
  {
    id: 'agoraencontrei-overview',
    kind: 'platform',
    title: 'O que é o AgoraEncontrei',
    summary: 'Marketplace imobiliário e plataforma de operação para compradores, locatários, proprietários, investidores, corretores, imobiliárias e empresas parceiras.',
    details: [
      'Reúne imóveis publicados por parceiros, busca inteligente, mapa, comparação, alertas, financiamento, leilões e serviços ligados ao imóvel.',
      'Para profissionais, oferece site próprio, CRM, Tomás IA, automações, marketing, gestão financeira, contratos, documentos e importação de dados.',
      'Dados de imóveis e planos que mudam com frequência devem ser consultados pelas ferramentas em tempo real.',
    ],
    aliases: ['Agora Encontrei', 'plataforma', 'marketplace', 'o que vocês fazem'],
    path: '/sobre',
  },
  {
    id: 'property-search',
    kind: 'tool',
    title: 'Busca inteligente de imóveis',
    summary: 'Pesquisa imóveis por finalidade, tipo, localização, código, faixa de preço, dormitórios, vagas e características.',
    details: [
      'A disponibilidade e os dados de cada anúncio devem ser confirmados com buscar_imoveis e detalhar_imovel.',
      'A busca por mapa ajuda a explorar regiões sem revelar endereço privado quando o anunciante opta por ocultá-lo.',
      'O usuário também pode comparar imóveis e salvar favoritos.',
    ],
    aliases: ['buscar casa', 'buscar apartamento', 'mapa', 'comparar imóveis', 'favoritos'],
    path: '/imoveis',
  },
  {
    id: 'buyer-journey',
    kind: 'journey',
    title: 'Central do comprador',
    summary: 'Jornada para pesquisar, comparar, financiar, verificar documentos, visitar e apresentar proposta.',
    details: ['Inclui simuladores, orientação documental, comparação, favoritos, visitas e proposta.'],
    aliases: ['comprar imóvel', 'primeiro imóvel', 'entrada', 'proposta', 'visita'],
    path: '/central-do-comprador',
  },
  {
    id: 'owner-journey',
    kind: 'journey',
    title: 'Central do proprietário',
    summary: 'Apoia avaliação, preparação de fotos e documentos, anúncio e acompanhamento de venda ou locação.',
    details: ['O proprietário pode anunciar o imóvel e ser direcionado para avaliação, mídia, documentação e parceiros.'],
    aliases: ['vender imóvel', 'alugar meu imóvel', 'anunciar', 'proprietário'],
    path: '/central-do-proprietario',
  },
  {
    id: 'financing',
    kind: 'tool',
    title: 'Financiamento imobiliário',
    summary: 'Simula entrada, parcela aproximada, renda e custos da compra; a aprovação e a taxa final dependem da instituição financeira.',
    details: ['Nunca apresentar simulação como aprovação, proposta bancária ou taxa garantida.'],
    aliases: ['financiamento', 'simulador', 'parcela', 'entrada', 'banco', 'crédito imobiliário'],
    path: '/financiamentos',
  },
  {
    id: 'valuation',
    kind: 'service',
    title: 'Avaliação de imóveis',
    summary: 'Estimativa de valor de mercado apoiada por características, localização e comparáveis; laudo formal depende de profissional habilitado.',
    details: ['Diferenciar opinião, estimativa automatizada, análise comparativa de mercado e laudo técnico.'],
    aliases: ['avaliar imóvel', 'quanto vale', 'preço de mercado', 'CMA', 'laudo'],
    path: '/avaliacao',
  },
  {
    id: 'auctions',
    kind: 'tool',
    title: 'Leilões inteligentes',
    summary: 'Busca oportunidades e apoia análise de desconto, edital, ocupação, documentação, custos, risco e retorno.',
    details: ['Nenhum leilão deve ser tratado como investimento garantido; edital, matrícula, débitos, ocupação e regras precisam de conferência.'],
    aliases: ['leilão', 'Caixa', 'Santander', 'Zuk', 'arrematação', 'ROI'],
    path: '/leiloes',
  },
  {
    id: 'alerts',
    kind: 'tool',
    title: 'Alertas de oportunidades',
    summary: 'Permite acompanhar novos imóveis, alterações de preço e oportunidades compatíveis com o perfil informado.',
    details: ['O contato deve respeitar consentimento, preferências de canal e descadastro.'],
    aliases: ['avise quando aparecer', 'alerta', 'baixou preço', 'notificação'],
    path: '/alertas',
  },
  {
    id: 'partner-directory',
    kind: 'tool',
    title: 'Empresas parceiras',
    summary: 'Diretório de profissionais e empresas ligados à jornada do imóvel.',
    details: [
      'Categorias incluem arquitetos, engenheiros, designers de interiores, avaliadores, advogados imobiliários, despachantes, fotógrafos, videomakers, imobiliárias, loteadoras e outros serviços.',
      'Indicações devem usar buscar_parceiros e mostrar apenas perfis públicos aprovados.',
      'A presença no diretório não substitui orçamento, contrato, conferência de registro profissional ou diligência do cliente.',
    ],
    aliases: ['indicação', 'profissional', 'empresa', 'arquiteto', 'engenheiro', 'fotógrafo', 'despachante'],
    path: '/empresas-parceiras',
  },
  {
    id: 'saas-sites',
    kind: 'platform',
    title: 'Site para imobiliárias e corretores',
    summary: 'Site white-label com catálogo, busca, mapa, páginas de imóveis, equipe, conteúdo institucional, captação de leads e identidade configurável.',
    details: [
      'Pode operar em subdomínio AgoraEncontrei ou domínio próprio conforme o plano.',
      'A publicação deve passar por checklist de logo, contatos, CRECI, domínio, imóveis, formulários, chat, mapa, imagens e responsividade.',
    ],
    aliases: ['criar site', 'site próprio', 'white label', 'domínio', 'landing page de parceiro'],
    path: '/sistema',
  },
  {
    id: 'saas-crm',
    kind: 'platform',
    title: 'CRM e operação imobiliária',
    summary: 'Centraliza contatos, leads, negócios, funil, atividades, imóveis, propostas, contratos, documentos e histórico.',
    details: ['Recursos disponíveis e limites variam por plano; consultar os planos atuais antes de afirmar preço ou limite.'],
    aliases: ['CRM', 'funil', 'leads', 'negócios', 'pipeline', 'gestão imobiliária'],
    path: '/sistema',
  },
  {
    id: 'tomas-ai',
    kind: 'platform',
    title: 'Tomás IA',
    summary: 'Assistente contextual do AgoraEncontrei para orientar usuários, pesquisar imóveis e parceiros, qualificar leads e apoiar a operação autorizada.',
    details: [
      'No marketplace usa apenas dados públicos; no site de um parceiro fala em nome daquele parceiro e mantém isolamento por empresa.',
      'Informações mutáveis devem vir de ferramentas; o Tomás não deve inventar imóveis, parceiros, preços, disponibilidade ou credenciais.',
      'Transferência de dados para WhatsApp ou parceiro exige consentimento quando aplicável.',
    ],
    aliases: ['Tomás', 'chat', 'inteligência artificial', 'assistente', 'IA'],
    path: '/ferramentas',
  },
  {
    id: 'visual-media',
    kind: 'service',
    title: 'Fotos, vídeos e tour inteligente',
    summary: 'Ferramentas e serviços para melhorar apresentação visual, organizar galerias, produzir vídeos e criar visitas guiadas com imagens.',
    details: ['Inclui edição de fotos, marca d’água, vídeo, drone, tour inteligente e editor de vídeo conforme disponibilidade e plano.'],
    aliases: ['fotografia', 'editar foto', 'vídeo', 'drone', 'tour virtual', 'galeria'],
    path: '/ferramentas',
  },
  {
    id: 'documents',
    kind: 'service',
    title: 'Documentação imobiliária',
    summary: 'Orientação sobre matrícula, escritura, registro, ITBI, certidões, contratos e assinatura digital.',
    details: ['Questões jurídicas ou documentais específicas devem ser confirmadas por cartório, advogado ou profissional habilitado.'],
    aliases: ['documentos', 'cartório', 'matrícula', 'escritura', 'ITBI', 'certidão', 'contrato'],
    path: '/servicos/documentacao-imobiliaria',
  },
  {
    id: 'niu-profile',
    kind: 'partner',
    title: 'NIU Arquitetura',
    summary: 'Escritório de arquitetura e design de Franca/SP, fundado em 2018 por Yuri Miranda e Douglas Costa.',
    details: [
      'Atua com projetos residenciais, espaços comerciais, interiores, reformas e edifícios multifamiliares.',
      'A linguagem declarada pelo escritório é contemporânea, com formas limpas, atenção a detalhes e acabamentos, unindo beleza, inovação e funcionalidade.',
      '“Neo Arquitetura” não é o nome confirmado deste parceiro. Quando o usuário disser Neo no contexto do AgoraEncontrei, confirmar se ele quis dizer NIU.',
      'Contato público: contato@niuarquitetura.com, WhatsApp +55 16 99264-6070 e perfil @niu_arquitetura.',
    ],
    aliases: ['Niu Arquitetura', 'Neo Arquitetura', 'Niu Arquitetura e Construção', 'escritório Niu'],
    path: NIU_PUBLIC_PROFILE.profilePath,
    sources: [
      { label: 'Site oficial da NIU - Escritório', url: 'https://niuarquitetura.com/escritorio/', verifiedAt: VERIFIED_AT },
      { label: 'Landing oficial no AgoraEncontrei', url: 'https://www.agoraencontrei.com.br/parceiros/niu-arquitetura', verifiedAt: VERIFIED_AT },
    ],
  },
  {
    id: 'yuri-miranda',
    kind: 'person',
    title: 'Yuri Miranda',
    summary: 'Arquiteto e urbanista, cofundador da NIU Arquitetura.',
    details: ['O site oficial atribui a Yuri Miranda e Douglas Costa a idealização do escritório; Yuri também aparece como fotógrafo de projetos publicados.'],
    aliases: ['Yuri', 'Yuri Miranda Niu', 'arquiteto da Niu'],
    path: NIU_PUBLIC_PROFILE.profilePath,
    sources: [
      { label: 'Site oficial da NIU - Escritório', url: 'https://niuarquitetura.com/escritorio/', verifiedAt: VERIFIED_AT },
      { label: 'Casa M+ no ArchDaily', url: 'https://www.archdaily.com.br/br/981663/casa-m-plus-niu-arquitetura-e-construcao', verifiedAt: VERIFIED_AT },
    ],
  },
  {
    id: 'douglas-costa-niu',
    kind: 'person',
    title: 'Douglas Costa, da NIU Arquitetura',
    summary: 'Gestor de obras e cofundador da NIU Arquitetura, conforme o site oficial do escritório.',
    details: [
      'Douglas Costa participa do desenvolvimento e da execução de projetos de arquitetura e interiores ao lado de Yuri Miranda.',
      'Em publicações de projetos, também é creditado entre os responsáveis pela NIU. Não confundir com outras pessoas homônimas.',
    ],
    aliases: ['Douglas', 'Douglas Costa', 'quem é Douglas', 'Douglas da Niu', 'Douglas da Neo'],
    path: NIU_PUBLIC_PROFILE.profilePath,
    sources: [
      { label: 'Site oficial da NIU - Escritório', url: 'https://niuarquitetura.com/escritorio/', verifiedAt: VERIFIED_AT },
      { label: 'Casa M+ no ArchDaily', url: 'https://www.archdaily.com.br/br/981663/casa-m-plus-niu-arquitetura-e-construcao', verifiedAt: VERIFIED_AT },
    ],
  },
  {
    id: 'niu-casa-m-plus',
    kind: 'project',
    title: 'Casa M+',
    summary: 'Projeto residencial da NIU em Franca/SP, com 193 m², publicado pelo ArchDaily em 2022.',
    details: ['O projeto trabalha um lote de 165 m², estreito e comprido, com integração social, iluminação, ventilação e linguagem contemporânea.'],
    aliases: ['Casa M+', 'projeto M+', 'projeto da Niu'],
    sources: [{ label: 'Casa M+ no ArchDaily', url: 'https://www.archdaily.com.br/br/981663/casa-m-plus-niu-arquitetura-e-construcao', verifiedAt: VERIFIED_AT }],
  },
  {
    id: 'niu-casa-mcz',
    kind: 'project',
    title: 'Casa MCZ',
    summary: 'Projeto da NIU em Cristais Paulista/SP, com aproximadamente 399 m² e conclusão informada em 2023.',
    details: ['O projeto prioriza relação entre ambientes internos, jardim e horizonte e foi selecionado no Building of the Year 2025 do ArchDaily.'],
    aliases: ['Casa MCZ', 'Micazza', 'projeto Cristais Paulista'],
    sources: [{ label: 'Building of the Year 2025 - ArchDaily', url: 'https://boty.archdaily.com/us/2025/candidates/172748/mcz-house-slash-niu-arquitetura-e-construcao', verifiedAt: VERIFIED_AT }],
  },
  {
    id: 'public-data-policy',
    kind: 'policy',
    title: 'Uso responsável das informações',
    summary: 'O Tomás diferencia fatos oficiais, anúncios, estimativas, opiniões e dados que precisam de confirmação.',
    details: [
      'Não revelar clientes, proprietários, contratos, documentos, finanças ou dados internos no chat público.',
      'Não confundir pessoas ou empresas homônimas; pedir contexto quando a identidade não estiver clara.',
      'Para assuntos médicos, jurídicos, financeiros ou regulatórios, orientar validação com profissional e fonte oficial atualizada.',
    ],
    aliases: ['privacidade', 'LGPD', 'fonte', 'confiabilidade', 'dados internos'],
  },
]

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function searchPublicKnowledge(query: string, limit = 6): PublicKnowledgeEntry[] {
  const normalizedQuery = normalize(query)
  const terms = normalizedQuery.split(' ').filter(term => term.length > 1)
  if (!terms.length) return []

  return PUBLIC_KNOWLEDGE
    .map(entry => {
      const title = normalize(entry.title)
      const aliases = normalize(entry.aliases.join(' '))
      const body = normalize([entry.summary, ...entry.details].join(' '))
      let score = normalizedQuery === title ? 100 : 0
      if (title.includes(normalizedQuery)) score += 45
      if (aliases.includes(normalizedQuery)) score += 35
      for (const term of terms) {
        if (title.includes(term)) score += 12
        if (aliases.includes(term)) score += 8
        if (body.includes(term)) score += 3
      }
      return { entry, score }
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title, 'pt-BR'))
    .slice(0, Math.max(1, Math.min(limit, 10)))
    .map(item => item.entry)
}

export function buildPublicKnowledgeGuide(): string {
  const catalog = PUBLIC_KNOWLEDGE.map(entry => {
    const path = entry.path ? ` | rota: ${entry.path}` : ''
    const sources = entry.sources?.length
      ? ` | fontes: ${entry.sources.map(source => `${source.label} (${source.url}, verificada em ${source.verifiedAt})`).join('; ')}`
      : ''
    return `• ${entry.title}: ${entry.summary}${path}${sources}`
  }).join('\n')

  return `CONHECIMENTO PÚBLICO PESQUISÁVEL:
- Para dúvidas sobre o AgoraEncontrei, ferramentas, jornadas, serviços, parceiros, pessoas ou projetos, use consultar_conhecimento_publico.
- Para indicação de empresa ou profissional, use buscar_parceiros. Mostre somente perfis públicos aprovados.
- Para preço e limites de planos, use consultar_conhecimento_publico: a ferramenta combina a base editorial com os planos ativos do banco.
- Se o usuário disser "Neo Arquitetura" no contexto do parceiro do AgoraEncontrei, confirme que o nome oficial encontrado é NIU Arquitetura.
- Informações externas vêm com fonte e data de verificação. Não amplie um fato além do que a fonte sustenta.

ÍNDICE RESUMIDO (também disponível em canais sem ferramentas):
${catalog}`
}

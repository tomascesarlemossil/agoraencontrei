/**
 * Mapa de Risco Documental (plano §22).
 *
 * Traduz os campos do leilão numa matriz de risco simples (Alto/Médio/Baixo)
 * por dimensão — ocupação, débitos/condomínio, processo, matrícula, ônus e
 * visita/reforma — para o comprador iniciante entender a operação num relance.
 * Puro e determinístico; não substitui a leitura do edital nem parecer jurídico.
 */

export type RiskLevel = 'ALTO' | 'MEDIO' | 'BAIXO' | 'DESCONHECIDO'

export interface RiskDimension {
  key: string
  label: string
  level: RiskLevel
  situation: string
}

export interface RiskMatrix {
  overall: RiskLevel
  dimensions: RiskDimension[]
}

export interface RiskInput {
  occupation: string | null
  hasDebts: boolean | null
  debtDetails: string | null
  restrictions: string | null
  processNumber: string | null
  registryNumber: string | null
  editalUrl: string | null
  documentsUrls: string[]
  visitDate: Date | string | null
  modality: string | null
}

export function computeRiskMatrix(a: RiskInput): RiskMatrix {
  const dims: RiskDimension[] = []
  const docs = a.documentsUrls || []
  const hasMatricula = !!a.registryNumber || docs.some((u) => /matricula/i.test(u))

  // Ocupação
  if (a.occupation === 'OCUPADO') dims.push({ key: 'ocupacao', label: 'Ocupação', level: 'ALTO', situation: 'Imóvel ocupado — prevê custo e prazo de desocupação.' })
  else if (a.occupation === 'DESOCUPADO') dims.push({ key: 'ocupacao', label: 'Ocupação', level: 'BAIXO', situation: 'Imóvel desocupado.' })
  else dims.push({ key: 'ocupacao', label: 'Ocupação', level: 'MEDIO', situation: 'Ocupação não confirmada — verifique no edital e em visita externa.' })

  // Débitos / condomínio / IPTU
  if (a.hasDebts === true) dims.push({ key: 'debitos', label: 'Débitos e condomínio', level: 'ALTO', situation: a.debtDetails?.trim() || 'Há débitos pendentes — confirme quem assume os valores anteriores.' })
  else if (a.hasDebts === false) dims.push({ key: 'debitos', label: 'Débitos e condomínio', level: 'BAIXO', situation: 'Sem débitos pendentes informados.' })
  else dims.push({ key: 'debitos', label: 'Débitos e condomínio', level: 'MEDIO', situation: 'Débitos não informados — confirme IPTU e condomínio anteriores.' })

  // Processo / judicial
  if (a.processNumber) dims.push({ key: 'processo', label: 'Processo', level: 'MEDIO', situation: `Leilão judicial (processo ${a.processNumber}) — verifique recursos e decisões recentes.` })
  else dims.push({ key: 'processo', label: 'Processo', level: 'BAIXO', situation: 'Sem processo judicial associado (extrajudicial/venda direta).' })

  // Matrícula
  if (hasMatricula) dims.push({ key: 'matricula', label: 'Matrícula', level: 'BAIXO', situation: a.registryNumber ? `Matrícula ${a.registryNumber} identificada.` : 'Matrícula disponível nos documentos.' })
  else dims.push({ key: 'matricula', label: 'Matrícula', level: 'MEDIO', situation: 'Matrícula não anexada — solicite antes de decidir.' })

  // Ônus / restrições
  if (a.restrictions?.trim()) dims.push({ key: 'onus', label: 'Ônus e gravames', level: 'ALTO', situation: a.restrictions.trim() })
  else dims.push({ key: 'onus', label: 'Ônus e gravames', level: 'MEDIO', situation: 'Ônus/gravames não informados — confira a matrícula atualizada.' })

  // Visita / reforma
  const hasVisit = !!a.visitDate
  if (hasVisit) dims.push({ key: 'visita', label: 'Visita e estado', level: 'MEDIO', situation: 'Visita prevista — avalie o estado e estime a reforma.' })
  else dims.push({ key: 'visita', label: 'Visita e estado', level: 'ALTO', situation: 'Sem visita interna — estado e reforma são estimados; reserve margem.' })

  // Risco geral: pior nível pesa mais; conta a quantidade de ALTO.
  const highs = dims.filter((d) => d.level === 'ALTO').length
  const mediums = dims.filter((d) => d.level === 'MEDIO').length
  let overall: RiskLevel = 'BAIXO'
  if (highs >= 2) overall = 'ALTO'
  else if (highs === 1 || mediums >= 3) overall = 'MEDIO'

  return { overall, dimensions: dims }
}

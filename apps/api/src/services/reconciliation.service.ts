/**
 * Reconciliation Service — Conciliação bancária (extrato / CNAB retorno)
 *
 * Equivalente Uniloc: movbanco + baixa por arquivo de retorno (BAIXACNAB).
 *
 * As funções de parsing e de matching são PURAS (sem I/O) para serem testáveis.
 * O caminho CSV/JSON é determinístico; o parser CNAB400 segue o layout padrão
 * FEBRABAN e pode exigir ajuste de posições por banco (validar por banco).
 */

export interface ParsedEntry {
  entryDate: string // YYYY-MM-DD
  amount: number
  direction: 'CREDIT' | 'DEBIT'
  description?: string
  nossoNumero?: string
  documentNumber?: string
  occurrenceCode?: string
}

export interface MatchCandidate {
  rentalId?: string
  invoiceId?: string
  nossoNumero?: string
  amount: number
  dueDate?: string // YYYY-MM-DD
}

export interface MatchedEntry extends ParsedEntry {
  matchStatus: 'MATCHED' | 'UNMATCHED'
  matchedRentalId?: string
  matchedInvoiceId?: string
}

function onlyDigits(s: string): string {
  return (s || '').replace(/\D/g, '')
}

/** Parseia data DDMMYYYY ou DDMMYY → YYYY-MM-DD. */
function parseCnabDate(raw: string): string | null {
  const d = onlyDigits(raw)
  if (d.length === 8) {
    const dd = d.slice(0, 2), mm = d.slice(2, 4), yyyy = d.slice(4, 8)
    if (yyyy === '0000') return null
    return `${yyyy}-${mm}-${dd}`
  }
  if (d.length === 6) {
    const dd = d.slice(0, 2), mm = d.slice(2, 4), yy = d.slice(4, 6)
    if (yy === '00' && dd === '00') return null
    return `20${yy}-${mm}-${dd}`
  }
  return null
}

/**
 * CSV simples de extrato. Cabeçalho flexível; reconhece colunas:
 *   data|date, valor|amount, descricao|description, nossonumero|nosso_numero,
 *   documento|document, ocorrencia|occurrence, tipo|direction
 * Datas aceitas: YYYY-MM-DD ou DD/MM/YYYY. Valor: vírgula ou ponto decimal.
 */
export function parseCsvStatement(content: string, delimiter = ','): ParsedEntry[] {
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (lines.length === 0) return []
  const header = lines[0].split(delimiter).map((h) => h.trim().toLowerCase())
  const idx = (names: string[]) => header.findIndex((h) => names.includes(h))

  const iDate = idx(['data', 'date'])
  const iAmount = idx(['valor', 'amount', 'value'])
  const iDesc = idx(['descricao', 'description', 'historico'])
  const iNosso = idx(['nossonumero', 'nosso_numero', 'nosso numero'])
  const iDoc = idx(['documento', 'document', 'doc'])
  const iOcc = idx(['ocorrencia', 'occurrence', 'codigo'])
  const iDir = idx(['tipo', 'direction', 'debcred'])

  const out: ParsedEntry[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map((c) => c.trim())
    const rawDate = cols[iDate] ?? ''
    let entryDate: string | null = null
    if (/^\d{4}-\d{2}-\d{2}/.test(rawDate)) entryDate = rawDate.slice(0, 10)
    else if (/^\d{2}\/\d{2}\/\d{4}/.test(rawDate)) {
      const [d, m, y] = rawDate.slice(0, 10).split('/')
      entryDate = `${y}-${m}-${d}`
    }
    if (!entryDate) continue

    const rawAmount = (cols[iAmount] ?? '').replace(/\./g, '').replace(',', '.')
    const amount = Math.abs(parseFloat(rawAmount))
    if (!Number.isFinite(amount)) continue

    const dirRaw = (cols[iDir] ?? '').toUpperCase()
    const direction: 'CREDIT' | 'DEBIT' =
      dirRaw.startsWith('D') ? 'DEBIT' : dirRaw.startsWith('C') ? 'CREDIT'
      : (cols[iAmount] ?? '').trim().startsWith('-') ? 'DEBIT' : 'CREDIT'

    out.push({
      entryDate,
      amount,
      direction,
      description: iDesc >= 0 ? cols[iDesc] : undefined,
      nossoNumero: iNosso >= 0 ? onlyDigits(cols[iNosso]) || undefined : undefined,
      documentNumber: iDoc >= 0 ? cols[iDoc] : undefined,
      occurrenceCode: iOcc >= 0 ? cols[iOcc] : undefined,
    })
  }
  return out
}

/**
 * Parser CNAB400 de retorno (layout padrão FEBRABAN/CBR643).
 * Lê os registros de detalhe (tipo '1' na posição 0) extraindo nosso número,
 * valor, data de ocorrência e código de ocorrência. ATENÇÃO: as posições
 * variam por banco — validar/ajustar conforme o layout do banco emissor.
 */
export function parseCnab400Return(content: string): ParsedEntry[] {
  const lines = content.split(/\r?\n/).filter((l) => l.length >= 400)
  const out: ParsedEntry[] = []
  for (const line of lines) {
    if (line[0] !== '1') continue // só registros de transação (detalhe)
    const nossoNumero = onlyDigits(line.slice(62, 82))
    const occurrenceCode = line.slice(108, 110)
    const occurrenceDate = parseCnabDate(line.slice(110, 116)) // DDMMYY
    const valorRaw = line.slice(152, 165) // 11 inteiros + 2 decimais
    const amount = parseInt(onlyDigits(valorRaw) || '0', 10) / 100
    out.push({
      entryDate: occurrenceDate ?? new Date(0).toISOString().slice(0, 10),
      amount,
      direction: 'CREDIT',
      nossoNumero: nossoNumero || undefined,
      occurrenceCode,
    })
  }
  return out
}

function daysApart(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00Z').getTime()
  const db = new Date(b + 'T00:00:00Z').getTime()
  return Math.abs(Math.round((da - db) / 86400000))
}

/**
 * Concilia entradas contra candidatos (boletos/aluguéis em aberto). PURO.
 * Regras (em ordem):
 *   1. Match por nossoNumero exato.
 *   2. Senão, por valor igual + data dentro de ±`dateToleranceDays` do
 *      vencimento, desde que haja UM único candidato compatível.
 */
export function matchEntries(
  entries: ParsedEntry[],
  candidates: MatchCandidate[],
  dateToleranceDays = 5,
): MatchedEntry[] {
  const usedRental = new Set<string>()
  const usedInvoice = new Set<string>()

  return entries.map((e) => {
    // 1. nossoNumero exato
    if (e.nossoNumero) {
      const byNosso = candidates.find(
        (c) => c.nossoNumero && onlyDigits(c.nossoNumero) === e.nossoNumero
          && !(c.rentalId && usedRental.has(c.rentalId))
          && !(c.invoiceId && usedInvoice.has(c.invoiceId)),
      )
      if (byNosso) {
        if (byNosso.rentalId) usedRental.add(byNosso.rentalId)
        if (byNosso.invoiceId) usedInvoice.add(byNosso.invoiceId)
        return { ...e, matchStatus: 'MATCHED', matchedRentalId: byNosso.rentalId, matchedInvoiceId: byNosso.invoiceId }
      }
    }

    // 2. valor + data, match único
    const byValue = candidates.filter(
      (c) => Math.abs(c.amount - e.amount) < 0.005
        && (!c.dueDate || daysApart(c.dueDate, e.entryDate) <= dateToleranceDays)
        && !(c.rentalId && usedRental.has(c.rentalId))
        && !(c.invoiceId && usedInvoice.has(c.invoiceId)),
    )
    if (byValue.length === 1) {
      const c = byValue[0]
      if (c.rentalId) usedRental.add(c.rentalId)
      if (c.invoiceId) usedInvoice.add(c.invoiceId)
      return { ...e, matchStatus: 'MATCHED', matchedRentalId: c.rentalId, matchedInvoiceId: c.invoiceId }
    }

    return { ...e, matchStatus: 'UNMATCHED' }
  })
}

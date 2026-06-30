/**
 * Rescission Service — Motor de cálculo de rescisão de locação
 *
 * Apura o acerto de saída de um contrato (equivalente Uniloc rescisao/resclncs):
 *   • Aluguel proporcional aos dias ocupados no mês de saída
 *   • IPTU proporcional
 *   • Multa por rescisão antecipada (Lei 8.245/91, art. 4º — proporcional ao
 *     período restante do contrato)
 *   • Débitos em aberto (aluguéis/lançamentos não pagos)
 *   • Bonificações/descontos concedidos
 *   • Devolução de caução
 *
 * O cálculo é PURO (sem I/O) para ser testável e reaproveitável.
 */

export interface RescissionInput {
  /** Aluguel mensal vigente. */
  monthlyRent: number
  /** Data de saída/entrega das chaves. */
  exitDate: Date
  /** Início do contrato. */
  contractStart: Date
  /** Término previsto do contrato. */
  contractEnd: Date
  /** IPTU mensal (parcela) embutido na cobrança, se houver. Default 0. */
  monthlyIptu?: number
  /**
   * Multa-base de rescisão (tipicamente 3 aluguéis). A multa efetiva é
   * proporcional ao período restante. Se não informado, assume 3x o aluguel.
   */
  penaltyBaseValue?: number
  /** Se true (default), a multa é proporcional ao tempo restante do contrato. */
  penaltyProportional?: boolean
  /** Débitos em aberto (somatório de aluguéis/lançamentos vencidos e não pagos). */
  outstandingValue?: number
  /** Bonificação/desconto concedido na rescisão. */
  bonusValue?: number
  /** Caução retida a ser devolvida ao inquilino. */
  depositHeld?: number
}

export interface RescissionLineItem {
  key: string
  label: string
  /** Sinal contábil para o inquilino: 'debit' soma ao que ele deve; 'credit' abate. */
  kind: 'debit' | 'credit'
  value: number
  detail?: string
}

export interface RescissionResult {
  exitDate: string
  items: RescissionLineItem[]
  totalDebits: number
  totalCredits: number
  /** Resultado líquido. > 0: inquilino deve pagar; < 0: a receber pelo inquilino. */
  netResult: number
  /** Quem paga: 'TENANT' (inquilino paga) | 'TENANT_REFUND' (inquilino recebe) | 'SETTLED' (zero). */
  settlement: 'TENANT' | 'TENANT_REFUND' | 'SETTLED'
  breakdown: {
    daysInExitMonth: number
    occupiedDays: number
    remainingMonths: number
    totalMonths: number
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}

function daysInMonth(year: number, monthZeroBased: number): number {
  return new Date(year, monthZeroBased + 1, 0).getDate()
}

/** Diferença em meses (arredondada para cima em frações) entre duas datas. */
function monthsBetween(from: Date, to: Date): number {
  if (to <= from) return 0
  let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
  if (to.getDate() > from.getDate()) months += 1
  return Math.max(0, months)
}

/**
 * Calcula o acerto de rescisão. Função pura — não toca em banco.
 */
export function calculateRescission(input: RescissionInput): RescissionResult {
  const {
    monthlyRent,
    exitDate,
    contractStart,
    contractEnd,
    monthlyIptu = 0,
    penaltyProportional = true,
    outstandingValue = 0,
    bonusValue = 0,
    depositHeld = 0,
  } = input

  const penaltyBaseValue = input.penaltyBaseValue ?? round(monthlyRent * 3)

  const year = exitDate.getFullYear()
  const month = exitDate.getMonth()
  const totalDaysInMonth = daysInMonth(year, month)
  // Dias ocupados no mês de saída = do dia 1 até o dia da saída (inclusive).
  const occupiedDays = Math.min(exitDate.getDate(), totalDaysInMonth)

  const proRataRent = round(monthlyRent * occupiedDays / totalDaysInMonth)
  const proRataIptu = round(monthlyIptu * occupiedDays / totalDaysInMonth)

  // Multa proporcional ao período restante do contrato (Lei do Inquilinato).
  const totalMonths = monthsBetween(contractStart, contractEnd)
  const remainingMonths = monthsBetween(exitDate, contractEnd)
  let penaltyValue = 0
  if (remainingMonths > 0 && penaltyBaseValue > 0) {
    penaltyValue = penaltyProportional && totalMonths > 0
      ? round(penaltyBaseValue * remainingMonths / totalMonths)
      : round(penaltyBaseValue)
  }

  const items: RescissionLineItem[] = []
  items.push({ key: 'proRataRent', label: 'Aluguel proporcional', kind: 'debit', value: proRataRent, detail: `${occupiedDays}/${totalDaysInMonth} dias` })
  if (proRataIptu > 0) items.push({ key: 'proRataIptu', label: 'IPTU proporcional', kind: 'debit', value: proRataIptu, detail: `${occupiedDays}/${totalDaysInMonth} dias` })
  if (penaltyValue > 0) items.push({ key: 'penalty', label: 'Multa por rescisão antecipada', kind: 'debit', value: penaltyValue, detail: penaltyProportional ? `${remainingMonths}/${totalMonths} meses restantes` : 'integral' })
  if (outstandingValue > 0) items.push({ key: 'outstanding', label: 'Débitos em aberto', kind: 'debit', value: round(outstandingValue) })
  if (bonusValue > 0) items.push({ key: 'bonus', label: 'Bonificação/desconto', kind: 'credit', value: round(bonusValue) })
  if (depositHeld > 0) items.push({ key: 'deposit', label: 'Devolução de caução', kind: 'credit', value: round(depositHeld) })

  const totalDebits = round(items.filter((i) => i.kind === 'debit').reduce((s, i) => s + i.value, 0))
  const totalCredits = round(items.filter((i) => i.kind === 'credit').reduce((s, i) => s + i.value, 0))
  const netResult = round(totalDebits - totalCredits)

  const settlement = netResult > 0 ? 'TENANT' : netResult < 0 ? 'TENANT_REFUND' : 'SETTLED'

  return {
    exitDate: exitDate.toISOString().slice(0, 10),
    items,
    totalDebits,
    totalCredits,
    netResult,
    settlement,
    breakdown: {
      daysInExitMonth: totalDaysInMonth,
      occupiedDays,
      remainingMonths,
      totalMonths,
    },
  }
}

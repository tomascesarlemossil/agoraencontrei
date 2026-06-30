/**
 * Agreement Service — Acordos / Renegociação de dívida
 *
 * Reparcela débitos em atraso num novo cronograma (equivalente Uniloc acordos).
 * O gerador de parcelas é PURO (sem I/O) para ser testável.
 */

export interface InstallmentPlanInput {
  /** Valor total acordado (já com desconto/acréscimo aplicado). */
  agreedValue: number
  /** Número de parcelas (>= 1). */
  installments: number
  /** Vencimento da primeira parcela. */
  firstDueDate: Date
  /** Intervalo entre parcelas em meses (default 1). */
  intervalMonths?: number
}

export interface PlannedInstallment {
  number: number
  dueDate: string // YYYY-MM-DD
  amount: number
}

/**
 * Gera o cronograma de parcelas. O resto de arredondamento (centavos) é
 * absorvido pela ÚLTIMA parcela, garantindo Σ(parcelas) === agreedValue.
 */
export function generateInstallmentPlan(input: InstallmentPlanInput): PlannedInstallment[] {
  const n = Math.max(1, Math.floor(input.installments))
  const interval = input.intervalMonths ?? 1
  const totalCents = Math.round(input.agreedValue * 100)
  const baseCents = Math.floor(totalCents / n)

  const plan: PlannedInstallment[] = []
  let allocated = 0
  const base = input.firstDueDate
  for (let i = 0; i < n; i++) {
    const isLast = i === n - 1
    const cents = isLast ? totalCents - allocated : baseCents
    allocated += cents
    // Vencimento: mesma "data" da primeira parcela + i*interval meses,
    // com clamp para o último dia do mês quando o dia não existe.
    const targetMonthDate = new Date(base.getFullYear(), base.getMonth() + i * interval, 1)
    const lastDay = new Date(targetMonthDate.getFullYear(), targetMonthDate.getMonth() + 1, 0).getDate()
    const day = Math.min(base.getDate(), lastDay)
    const due = new Date(targetMonthDate.getFullYear(), targetMonthDate.getMonth(), day)
    plan.push({
      number: i + 1,
      dueDate: due.toISOString().slice(0, 10),
      amount: cents / 100,
    })
  }
  return plan
}

/**
 * Cliente das funcionalidades de locação/financeiro (módulos novos):
 * contas a pagar, rateio de repasse, rescisão, acordos, conciliação,
 * notificações formais e permissões. Usa fetch direto com Bearer token.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

export async function locacaoFetch<T = any>(
  token: string | null | undefined,
  path: string,
  opts?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: {
      'Authorization': `Bearer ${token ?? ''}`,
      'Content-Type': 'application/json',
      ...opts?.headers,
    },
    credentials: 'include',
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((json as any)?.message ?? (json as any)?.error ?? 'Erro na requisição')
  }
  return json as T
}

export function fmtBRL(v: number | string | null | undefined): string {
  const n = typeof v === 'string' ? parseFloat(v) : (v ?? 0)
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number.isFinite(n as number) ? (n as number) : 0)
}

export function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'UTC' }).format(date)
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

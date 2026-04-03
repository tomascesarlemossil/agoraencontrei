'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2, ArrowLeft, FolderOpen, CheckCircle, Clock, AlertTriangle,
  Copy, ExternalLink, QrCode, ReceiptText, ChevronDown, ChevronUp,
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'
const NAVY = '#1B2B5B'
const GOLD = '#C9A84C'

interface Rental {
  id: string
  dueDate: string
  status: 'PENDING' | 'LATE' | 'PAID' | 'CANCELLED'
  totalAmount: number
  paidAmount?: number
  paymentDate?: string
}

interface PortalInvoice {
  id: string
  dueDate?: string
  issueDate?: string
  amount?: number
  numBoleto?: string
  linhaDigitavel?: string
  codigoBarras?: string
  asaasStatus?: string
  asaasBankSlipUrl?: string
  asaasPixCode?: string
  mensagem?: string
}

const RENTAL_STATUS: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  PENDING:   { label: 'Pendente',   color: '#D97706', bg: '#FEF3C7', icon: Clock },
  LATE:      { label: 'Em atraso',  color: '#DC2626', bg: '#FEE2E2', icon: AlertTriangle },
  PAID:      { label: 'Pago',       color: '#059669', bg: '#D1FAE5', icon: CheckCircle },
  CANCELLED: { label: 'Cancelado',  color: '#9CA3AF', bg: '#F3F4F6', icon: FolderOpen },
}

const ASAAS_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:   { label: 'Aguardando pagamento', color: '#D97706', bg: '#FEF3C7' },
  RECEIVED:  { label: 'Pago',                 color: '#059669', bg: '#D1FAE5' },
  CONFIRMED: { label: 'Confirmado',            color: '#059669', bg: '#D1FAE5' },
  OVERDUE:   { label: 'Vencido',               color: '#DC2626', bg: '#FEE2E2' },
  REFUNDED:  { label: 'Estornado',             color: '#6B7280', bg: '#F3F4F6' },
  CANCELLED: { label: 'Cancelado',             color: '#6B7280', bg: '#F3F4F6' },
}

const fmt = (v?: number | null) =>
  v != null ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v) : '—'

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'

export default function BoletosPage() {
  const router = useRouter()
  const [rentals,  setRentals]  = useState<Rental[]>([])
  const [invoices, setInvoices] = useState<PortalInvoice[]>([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState<'boletos' | 'historico'>('boletos')
  const [copied,   setCopied]   = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('portal_auth')
    if (!stored) { router.push('/portal/login'); return }
    const auth = JSON.parse(stored)
    if (auth.expiresAt && Date.now() > auth.expiresAt) {
      localStorage.removeItem('portal_auth'); router.push('/portal/login'); return
    }
    fetch(`${API_URL}/api/v1/portal/boletos`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
      .then(r => r.ok ? r.json() : { rentals: [], invoices: [] })
      .then(d => { setRentals(d.rentals ?? []); setInvoices(d.invoices ?? []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [router])

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const pending = rentals.filter(r => r.status === 'PENDING' || r.status === 'LATE')
  const paid    = rentals.filter(r => r.status === 'PAID')
  const pendingInvoices = invoices.filter(i => !['RECEIVED', 'CONFIRMED', 'CANCELLED', 'REFUNDED'].includes(i.asaasStatus ?? ''))
  const paidInvoices    = invoices.filter(i => ['RECEIVED', 'CONFIRMED'].includes(i.asaasStatus ?? ''))

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: NAVY, fontFamily: 'Georgia, serif' }}>Boletos & Aluguéis</h1>
          <p className="text-sm text-gray-500">
            {pending.length + pendingInvoices.length} pendente(s) · {paid.length + paidInvoices.length} pago(s)
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {([['boletos', 'Cobranças Ativas'], ['historico', 'Histórico Completo']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === key ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: GOLD }} />
        </div>
      ) : tab === 'boletos' ? (
        <div className="space-y-4">
          {/* Boletos bancários pendentes */}
          {pendingInvoices.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Boletos Bancários</h2>
              {pendingInvoices.map(inv => (
                <InvoiceCard key={inv.id} invoice={inv} onCopy={copyText} copied={copied} />
              ))}
            </div>
          )}

          {/* Aluguéis pendentes */}
          {pending.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Cobranças do Sistema</h2>
              {pending.map(r => <RentalCard key={r.id} rental={r} />)}
            </div>
          )}

          {pendingInvoices.length === 0 && pending.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <CheckCircle className="w-12 h-12 mb-3 opacity-30" style={{ color: '#059669' }} />
              <p className="font-medium text-green-600">Tudo em dia!</p>
              <p className="text-sm mt-1">Nenhuma cobrança pendente no momento</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Histórico de boletos pagos */}
          {paidInvoices.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Boletos Pagos</h2>
              {paidInvoices.map(inv => (
                <InvoiceCard key={inv.id} invoice={inv} onCopy={copyText} copied={copied} />
              ))}
            </div>
          )}

          {/* Histórico de aluguéis pagos */}
          {paid.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Aluguéis Pagos</h2>
              {paid.map(r => <RentalCard key={r.id} rental={r} />)}
            </div>
          )}

          {paidInvoices.length === 0 && paid.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <FolderOpen className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium">Nenhum histórico disponível</p>
            </div>
          )}
        </div>
      )}

      {/* Toast de cópia */}
      {copied && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-xl shadow-lg">
          Copiado!
        </div>
      )}
    </div>
  )
}

// ── InvoiceCard ────────────────────────────────────────────────────────────────
function InvoiceCard({ invoice, onCopy, copied }: {
  invoice: PortalInvoice
  onCopy: (text: string, key: string) => void
  copied: string | null
}) {
  const [expanded, setExpanded] = useState(false)
  const st = ASAAS_STATUS[invoice.asaasStatus ?? ''] ?? { label: 'Boleto Bancário', color: '#6B7280', bg: '#F3F4F6' }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ border: '1px solid #ddd9d0' }}>
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: st.bg }}>
          <ReceiptText className="w-5 h-5" style={{ color: st.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-bold text-gray-800">{fmt(invoice.amount)}</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: st.bg, color: st.color }}>
              {st.label}
            </span>
            {invoice.numBoleto && (
              <span className="text-xs text-gray-400 font-mono">#{invoice.numBoleto}</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Vencimento: {fmtDate(invoice.dueDate)}
            {invoice.mensagem ? ` · ${invoice.mensagem}` : ''}
          </p>
        </div>
        <div className="flex-shrink-0 text-gray-400">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50/50">
          {/* Linha digitável */}
          {invoice.linhaDigitavel && (
            <div>
              <p className="text-xs text-gray-400 mb-1.5 font-medium">Linha Digitável</p>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 break-all leading-relaxed">
                  {invoice.linhaDigitavel}
                </code>
                <button
                  onClick={() => onCopy(invoice.linhaDigitavel!, `ld-${invoice.id}`)}
                  className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 flex-shrink-0 transition-colors"
                  title="Copiar linha digitável"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {copied === `ld-${invoice.id}` && (
                <p className="text-xs text-green-600 mt-1">✓ Copiado!</p>
              )}
            </div>
          )}

          {/* PIX */}
          {invoice.asaasPixCode && (
            <div>
              <p className="text-xs text-gray-400 mb-1.5 font-medium flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5" /> PIX Copia e Cola
              </p>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 break-all leading-relaxed">
                  {invoice.asaasPixCode}
                </code>
                <button
                  onClick={() => onCopy(invoice.asaasPixCode!, `pix-${invoice.id}`)}
                  className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 flex-shrink-0 transition-colors"
                  title="Copiar código PIX"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {copied === `pix-${invoice.id}` && (
                <p className="text-xs text-green-600 mt-1">✓ Copiado!</p>
              )}
            </div>
          )}

          {/* Botão 2ª via */}
          {invoice.asaasBankSlipUrl && (
            <a
              href={invoice.asaasBankSlipUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium rounded-xl text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: NAVY }}
            >
              <ExternalLink className="w-4 h-4" />
              Abrir / Imprimir 2ª Via
            </a>
          )}

          {/* Sem dados de pagamento */}
          {!invoice.linhaDigitavel && !invoice.asaasPixCode && !invoice.asaasBankSlipUrl && (
            <p className="text-xs text-gray-400 text-center py-2">
              Dados de pagamento não disponíveis. Entre em contato com a imobiliária.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── RentalCard ─────────────────────────────────────────────────────────────────
function RentalCard({ rental }: { rental: Rental }) {
  const cfg = RENTAL_STATUS[rental.status] ?? RENTAL_STATUS.PENDING
  const Icon = cfg.icon
  return (
    <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm" style={{ border: '1px solid #ddd9d0' }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cfg.bg }}>
        <Icon className="w-5 h-5" style={{ color: cfg.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-base font-bold text-gray-800">{fmt(rental.totalAmount)}</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
            {cfg.label}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          {rental.status === 'PAID' && rental.paymentDate
            ? `Pago em ${fmtDate(rental.paymentDate)}`
            : `Vencimento: ${fmtDate(rental.dueDate)}`}

        </p>
      </div>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import {
  Plus, Search, ReceiptText, CheckCircle, Clock, AlertTriangle,
  ExternalLink, RefreshCw, X, Copy, QrCode, Loader2, ChevronLeft, ChevronRight,
  FileText, Banknote
} from 'lucide-react'
import { invoiceApi, type Invoice } from '@/lib/api'

const NAVY  = '#1B2B5B'
const GOLD  = '#C9A84C'

const fmt = (v?: number | null) =>
  v != null ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v) : '—'

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  PENDING:   { label: 'Pendente',   color: '#D97706', bg: '#FEF3C7', icon: Clock },
  RECEIVED:  { label: 'Recebido',   color: '#059669', bg: '#D1FAE5', icon: CheckCircle },
  CONFIRMED: { label: 'Confirmado', color: '#059669', bg: '#D1FAE5', icon: CheckCircle },
  OVERDUE:   { label: 'Vencido',    color: '#DC2626', bg: '#FEE2E2', icon: AlertTriangle },
  REFUNDED:  { label: 'Estornado',  color: '#6B7280', bg: '#F3F4F6', icon: X },
  CANCELLED: { label: 'Cancelado',  color: '#6B7280', bg: '#F3F4F6', icon: X },
}

function StatusBadge({ status }: { status?: string | null }) {
  const cfg = STATUS_CONFIG[status ?? ''] ?? { label: status ?? 'Sem cobrança', color: '#9CA3AF', bg: '#F3F4F6', icon: FileText }
  const Icon = cfg.icon
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}

interface CreateForm {
  contractId:      string
  legacyContractCode: string
  legacyTenantCode:   string
  numBoleto:       string
  banco:           string
  carteira:        string
  nossoNumero:     string
  codigoBarras:    string
  linhaDigitavel:  string
  issueDate:       string
  dueDate:         string
  amount:          string
  mensagem:        string
  instrucoes:      string
}

const EMPTY_FORM: CreateForm = {
  contractId: '', legacyContractCode: '', legacyTenantCode: '',
  numBoleto: '', banco: '', carteira: '', nossoNumero: '',
  codigoBarras: '', linhaDigitavel: '', issueDate: '', dueDate: '',
  amount: '', mensagem: '', instrucoes: '',
}

export default function BoletosPage() {
  const { accessToken: token } = useAuth()
  const qc = useQueryClient()

  const [page, setPage]       = useState(1)
  const [search, setSearch]   = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm]       = useState<CreateForm>(EMPTY_FORM)
  const [chargeId, setChargeId] = useState<string | null>(null)
  const [chargeType, setChargeType] = useState<'BOLETO' | 'PIX'>('BOLETO')
  const [msg, setMsg]         = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [copied, setCopied]   = useState(false)

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['invoices', page, search],
    queryFn: () => invoiceApi.list(token!, { page: String(page), limit: '20', ...(search ? { search } : {}) }),
    enabled: !!token,
  })

  const invoices = data?.data ?? []
  const meta     = data?.meta

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMut = useMutation({
    mutationFn: (body: Parameters<typeof invoiceApi.create>[1]) => invoiceApi.create(token!, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] })
      setShowCreate(false)
      setForm(EMPTY_FORM)
      setMsg({ type: 'ok', text: 'Boleto criado com sucesso!' })
      setTimeout(() => setMsg(null), 4000)
    },
    onError: (e: Error) => setMsg({ type: 'err', text: e.message }),
  })

  const chargeMut = useMutation({
    mutationFn: (id: string) => invoiceApi.charge(token!, { invoiceId: id, billingType: chargeType }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] })
      setChargeId(null)
      setMsg({ type: 'ok', text: 'Cobrança registrada no Asaas com sucesso!' })
      setTimeout(() => setMsg(null), 4000)
    },
    onError: (e: Error) => setMsg({ type: 'err', text: e.message }),
  })

  const syncMut = useMutation({
    mutationFn: (id: string) => invoiceApi.syncStatus(token!, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  })

  const cancelMut = useMutation({
    mutationFn: (id: string) => invoiceApi.cancel(token!, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] })
      setMsg({ type: 'ok', text: 'Cobrança cancelada.' })
      setTimeout(() => setMsg(null), 3000)
    },
    onError: (e: Error) => setMsg({ type: 'err', text: e.message }),
  })

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.dueDate || !form.amount) return
    createMut.mutate({
      contractId:         form.contractId || undefined,
      legacyContractCode: form.legacyContractCode || undefined,
      legacyTenantCode:   form.legacyTenantCode || undefined,
      numBoleto:          form.numBoleto || undefined,
      banco:              form.banco || undefined,
      carteira:           form.carteira || undefined,
      nossoNumero:        form.nossoNumero || undefined,
      codigoBarras:       form.codigoBarras || undefined,
      linhaDigitavel:     form.linhaDigitavel || undefined,
      issueDate:          form.issueDate || undefined,
      dueDate:            form.dueDate,
      amount:             parseFloat(form.amount),
      mensagem:           form.mensagem || undefined,
      instrucoes:         form.instrucoes || undefined,
    })
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: NAVY, fontFamily: 'Georgia, serif' }}>
            Boletos & Cobranças
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Gerencie boletos bancários e cobranças Asaas</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white shadow-sm hover:opacity-90 transition-opacity"
          style={{ backgroundColor: NAVY }}
        >
          <Plus className="w-4 h-4" />
          Novo Boleto
        </button>
      </div>

      {/* Mensagem global */}
      {msg && (
        <div className={`text-sm p-3 rounded-xl ${msg.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg.text}
        </div>
      )}

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por inquilino, endereço, número do boleto..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2"
          style={{ '--tw-ring-color': GOLD } as React.CSSProperties}
        />
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: GOLD }} />
        </div>
      ) : invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <ReceiptText className="w-12 h-12 mb-3 opacity-30" />
          <p className="font-medium">Nenhum boleto encontrado</p>
          <p className="text-sm mt-1">Crie o primeiro boleto clicando em "Novo Boleto"</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map(inv => (
            <InvoiceCard
              key={inv.id}
              invoice={inv}
              onCharge={() => setChargeId(inv.id)}
              onSync={() => syncMut.mutate(inv.id)}
              onCancel={() => cancelMut.mutate(inv.id)}
              onCopy={copyToClipboard}
              syncing={syncMut.isPending}
            />
          ))}
        </div>
      )}

      {/* Paginação */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600">
            Página {page} de {meta.totalPages} · {meta.total} boletos
          </span>
          <button
            onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
            disabled={page === meta.totalPages}
            className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modal: Criar Boleto */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold" style={{ color: NAVY, fontFamily: 'Georgia, serif' }}>Novo Boleto</h2>
                <p className="text-xs text-gray-500 mt-0.5">Preencha os dados do boleto bancário</p>
              </div>
              <button onClick={() => { setShowCreate(false); setForm(EMPTY_FORM) }} className="p-2 rounded-xl hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {/* Dados do contrato */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Cód. Contrato (legado)</label>
                  <input type="text" value={form.legacyContractCode} onChange={e => setForm(f => ({ ...f, legacyContractCode: e.target.value }))}
                    placeholder="ex: 0142" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Cód. Inquilino (legado)</label>
                  <input type="text" value={form.legacyTenantCode} onChange={e => setForm(f => ({ ...f, legacyTenantCode: e.target.value }))}
                    placeholder="ex: 0089" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>

              {/* Dados do boleto */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Banco</label>
                  <input type="text" value={form.banco} onChange={e => setForm(f => ({ ...f, banco: e.target.value }))}
                    placeholder="ex: 341" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Carteira</label>
                  <input type="text" value={form.carteira} onChange={e => setForm(f => ({ ...f, carteira: e.target.value }))}
                    placeholder="ex: 175" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Nº do Boleto</label>
                  <input type="text" value={form.numBoleto} onChange={e => setForm(f => ({ ...f, numBoleto: e.target.value }))}
                    placeholder="ex: 000142" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nosso Número</label>
                <input type="text" value={form.nossoNumero} onChange={e => setForm(f => ({ ...f, nossoNumero: e.target.value }))}
                  placeholder="ex: 00000142-0" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Código de Barras</label>
                <input type="text" value={form.codigoBarras} onChange={e => setForm(f => ({ ...f, codigoBarras: e.target.value }))}
                  placeholder="34191.75000 00000.142000 00000.000000 1 00000000000000" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono text-xs" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Linha Digitável</label>
                <input type="text" value={form.linhaDigitavel} onChange={e => setForm(f => ({ ...f, linhaDigitavel: e.target.value }))}
                  placeholder="34191.75000 00000.142000 00000.000000 1 00000000000000" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono text-xs" />
              </div>

              {/* Datas e valor */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Data de Emissão</label>
                  <input type="date" value={form.issueDate} onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Vencimento *</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                    required className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Valor (R$) *</label>
                  <input type="number" min="0.01" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    required placeholder="0,00" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Mensagem ao Pagador</label>
                <input type="text" value={form.mensagem} onChange={e => setForm(f => ({ ...f, mensagem: e.target.value }))}
                  placeholder="ex: Aluguel referente ao mês de Abril/2025" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Instruções de Cobrança</label>
                <textarea value={form.instrucoes} onChange={e => setForm(f => ({ ...f, instrucoes: e.target.value }))}
                  rows={2} placeholder="ex: Após vencimento cobrar multa de 2% + juros de 1% ao mês"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
              </div>

              {createMut.isError && (
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{createMut.error?.message}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowCreate(false); setForm(EMPTY_FORM) }}
                  className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={createMut.isPending}
                  className="flex-1 px-4 py-2 text-sm font-medium rounded-xl text-white disabled:opacity-50 hover:opacity-90"
                  style={{ backgroundColor: NAVY }}>
                  {createMut.isPending ? 'Salvando...' : 'Salvar Boleto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Registrar no Asaas */}
      {chargeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold" style={{ color: NAVY }}>Registrar no Asaas</h2>
              <button onClick={() => setChargeId(null)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-600">Escolha a forma de cobrança para registrar este boleto no Asaas e gerar o link de pagamento.</p>
            <div className="flex gap-2">
              {(['BOLETO', 'PIX'] as const).map(bt => (
                <button key={bt} type="button" onClick={() => setChargeType(bt)}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-xl border transition-all ${chargeType === bt ? 'text-white border-transparent' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  style={chargeType === bt ? { backgroundColor: NAVY } : {}}>
                  {bt === 'BOLETO' ? '🏦 Boleto' : '📱 PIX'}
                </button>
              ))}
            </div>
            {chargeMut.isError && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{chargeMut.error?.message}</p>
            )}
            <div className="flex gap-3">
              <button onClick={() => setChargeId(null)} className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={() => chargeMut.mutate(chargeId)} disabled={chargeMut.isPending}
                className="flex-1 px-4 py-2 text-sm font-medium rounded-xl text-white disabled:opacity-50 hover:opacity-90"
                style={{ backgroundColor: GOLD }}>
                {chargeMut.isPending ? 'Registrando...' : 'Registrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast de cópia */}
      {copied && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-xl shadow-lg">
          Copiado!
        </div>
      )}
    </div>
  )
}

// ── InvoiceCard ───────────────────────────────────────────────────────────────
function InvoiceCard({
  invoice, onCharge, onSync, onCancel, onCopy, syncing,
}: {
  invoice: Invoice
  onCharge: () => void
  onSync: () => void
  onCancel: () => void
  onCopy: (text: string) => void
  syncing: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const hasAsaas = !!invoice.asaasId

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ border: '1px solid #ddd9d0' }}>
      {/* Row principal */}
      <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50/50 transition-colors" onClick={() => setExpanded(e => !e)}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EEF2FF' }}>
          <ReceiptText className="w-5 h-5" style={{ color: '#1B2B5B' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-gray-800">{fmt(invoice.amount ?? undefined)}</span>
            <StatusBadge status={invoice.asaasStatus} />
            {invoice.numBoleto && (
              <span className="text-xs text-gray-400 font-mono">#{invoice.numBoleto}</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {invoice.contract?.tenantName ?? invoice.legacyTenantCode ?? '—'}
            {invoice.contract?.propertyAddress ? ` · ${invoice.contract.propertyAddress}` : ''}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs font-medium text-gray-700">Venc. {fmtDate(invoice.dueDate)}</p>
          {invoice.issueDate && <p className="text-xs text-gray-400">Emissão {fmtDate(invoice.issueDate)}</p>}
        </div>
      </div>

      {/* Detalhes expandidos */}
      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50/50">
          {/* Dados bancários */}
          {(invoice.banco || invoice.carteira || invoice.nossoNumero) && (
            <div className="grid grid-cols-3 gap-3 text-xs">
              {invoice.banco && <div><span className="text-gray-400">Banco</span><p className="font-mono font-medium text-gray-700">{invoice.banco}</p></div>}
              {invoice.carteira && <div><span className="text-gray-400">Carteira</span><p className="font-mono font-medium text-gray-700">{invoice.carteira}</p></div>}
              {invoice.nossoNumero && <div><span className="text-gray-400">Nosso Número</span><p className="font-mono font-medium text-gray-700">{invoice.nossoNumero}</p></div>}
            </div>
          )}

          {/* Linha digitável */}
          {invoice.linhaDigitavel && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Linha Digitável</p>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono bg-white border border-gray-200 rounded-lg px-3 py-1.5 flex-1 break-all">{invoice.linhaDigitavel}</code>
                <button onClick={() => onCopy(invoice.linhaDigitavel!)} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 flex-shrink-0">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* PIX code Asaas */}
          {invoice.asaasPixCode && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Código PIX (Copia e Cola)</p>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono bg-white border border-gray-200 rounded-lg px-3 py-1.5 flex-1 break-all">{invoice.asaasPixCode}</code>
                <button onClick={() => onCopy(invoice.asaasPixCode!)} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 flex-shrink-0">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Mensagem e instruções */}
          {invoice.mensagem && (
            <p className="text-xs text-gray-600 bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2">
              <span className="font-medium text-yellow-700">Mensagem:</span> {invoice.mensagem}
            </p>
          )}

          {/* Ações */}
          <div className="flex flex-wrap gap-2 pt-1">
            {invoice.asaasBankSlipUrl && (
              <a href={invoice.asaasBankSlipUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-white hover:opacity-90"
                style={{ backgroundColor: '#1B2B5B' }}>
                <ExternalLink className="w-3.5 h-3.5" />
                Abrir Boleto
              </a>
            )}
            {!hasAsaas && (
              <button onClick={onCharge}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-white hover:opacity-90"
                style={{ backgroundColor: '#C9A84C' }}>
                <Banknote className="w-3.5 h-3.5" />
                Registrar no Asaas
              </button>
            )}
            {hasAsaas && (
              <button onClick={onSync} disabled={syncing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50">
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                Sincronizar Status
              </button>
            )}
            {hasAsaas && invoice.asaasStatus !== 'RECEIVED' && invoice.asaasStatus !== 'CONFIRMED' && (
              <button onClick={onCancel}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50">
                <X className="w-3.5 h-3.5" />
                Cancelar Cobrança
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

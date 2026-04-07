'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import Link from 'next/link'
import {
  Zap, Play, CheckCircle, AlertTriangle, Clock, DollarSign,
  Users, RefreshCw, MessageCircle, BarChart3, ArrowLeft,
  ChevronRight, TrendingUp, TrendingDown, Banknote, Send,
  Calendar, Eye, X, Loader2, Check, Info,
} from 'lucide-react'
import { financeAutomationApi } from '@/lib/api'

const fmt = (v: number | null | undefined) =>
  v == null ? '—'
  : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(v))

const fmtPct = (v: number) => `${v.toFixed(1)}%`

const NAVY = '#1B2B5B'
const GOLD = '#C9A84C'

// ── Componentes ──────────────────────────────────────────────────────────────
function KpiCard({ title, value, sub, icon: Icon, color, trend }: {
  title: string; value: string; sub?: string
  icon: typeof DollarSign; color: string; trend?: { value: number; label: string }
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          {trend && (
            <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${trend.value >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {trend.value >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
            </div>
          )}
        </div>
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}

// ── Modal de confirmação ──────────────────────────────────────────────────────
function ConfirmModal({ title, descricao, preview, onConfirm, onClose, loading }: {
  title: string; descricao: string; preview?: any
  onConfirm: () => void; onClose: () => void; loading: boolean
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">{descricao}</p>
          {preview && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm space-y-2">
              <p className="font-medium text-blue-800">Preview da operação:</p>
              {preview.aGerar && (
                <p className="text-blue-700">• <strong>{preview.aGerar.length}</strong> cobranças serão geradas</p>
              )}
              {preview.jaExistem !== undefined && (
                <p className="text-blue-600">• <strong>{preview.jaExistem}</strong> já existem (serão ignoradas)</p>
              )}
              {preview.total && (
                <p className="text-blue-600">• <strong>{preview.total}</strong> contratos ativos no total</p>
              )}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl text-white disabled:opacity-50"
              style={{ backgroundColor: NAVY }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {loading ? 'Executando...' : 'Confirmar e Executar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Resultado da operação ─────────────────────────────────────────────────────
function ResultBanner({ result, onClose }: { result: any; onClose: () => void }) {
  if (!result) return null
  const isOk = !result.error
  return (
    <div className={`rounded-xl p-4 flex items-start gap-3 ${isOk ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
      {isOk
        ? <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        : <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
      }
      <div className="flex-1 text-sm">
        {isOk ? (
          <div className="space-y-1">
            {result.criados !== undefined && <p className="font-medium text-green-800">✓ {result.criados} cobranças geradas com sucesso</p>}
            {result.pagos   !== undefined && <p className="font-medium text-green-800">✓ {result.pagos} repasses marcados como pagos</p>}
            {result.enviados !== undefined && <p className="font-medium text-green-800">✓ {result.enviados} notificações enviadas</p>}
            {result.atualizados !== undefined && <p className="font-medium text-green-800">✓ {result.atualizados} cobranças atualizadas para ATRASADO</p>}
            {result.jaExistiam > 0 && <p className="text-green-600">• {result.jaExistiam} já existiam (ignoradas)</p>}
            {result.erros > 0 && <p className="text-yellow-700">• {result.erros} erro(s) — verifique os detalhes</p>}
          </div>
        ) : (
          <p className="font-medium text-red-800">{result.message ?? result.error}</p>
        )}
      </div>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0"><X className="w-4 h-4" /></button>
    </div>
  )
}

// ── Ação Card ─────────────────────────────────────────────────────────────────
function AcaoCard({ acao, onExecutar }: { acao: any; onExecutar: (id: string) => void }) {
  const icons: Record<string, typeof Zap> = {
    gerar_cobracas: Calendar,
    atualizar_status: RefreshCw,
    notificar_inadimplentes: MessageCircle,
    pagar_repasses: DollarSign,
    cobrar_asaas: Banknote,
  }
  const Icon = icons[acao.id] ?? Zap
  return (
    <div className={`bg-white rounded-2xl border p-5 shadow-sm ${acao.urgente ? 'border-orange-200' : 'border-gray-100'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className={`p-2.5 rounded-xl flex-shrink-0 ${acao.urgente ? 'bg-orange-50' : 'bg-blue-50'}`}>
            <Icon className={`w-5 h-5 ${acao.urgente ? 'text-orange-600' : 'text-blue-600'}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900 text-sm">{acao.titulo}</p>
              {acao.urgente && (
                <span className="px-1.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">Pendente</span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{acao.descricao}</p>
            {acao.qtd !== null && acao.qtd !== undefined && (
              <p className={`text-lg font-bold mt-1 ${acao.urgente ? 'text-orange-600' : 'text-blue-600'}`}>
                {acao.qtd}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => onExecutar(acao.id)}
          disabled={acao.qtd === 0}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:opacity-90 flex-shrink-0"
          style={{ backgroundColor: acao.urgente ? '#ea580c' : NAVY }}
        >
          <Play className="w-3.5 h-3.5" />
          Executar
        </button>
      </div>
    </div>
  )
}

// ── Página Principal ──────────────────────────────────────────────────────────
export default function AutomacaoFinanceiraPage() {
  const token = useAuthStore(s => s.accessToken)
  const qc = useQueryClient()
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [month, setMonth] = useState(currentMonth)
  const [confirm, setConfirm] = useState<{ id: string; preview?: any } | null>(null)
  const [result, setResult] = useState<any>(null)
  const [billingType, setBillingType] = useState<'PIX' | 'BOLETO'>('PIX')

  // Queries
  const { data: dashboard, isLoading: dashLoading, refetch: refetchDash } = useQuery({
    queryKey: ['finance-automation-dashboard'],
    queryFn: () => financeAutomationApi.dashboard(token!),
    enabled: !!token,
    refetchInterval: 120_000,
  })

  const { data: preview, isLoading: previewLoading, refetch: refetchPreview } = useQuery({
    queryKey: ['finance-automation-preview', month],
    queryFn: () => financeAutomationApi.previewMes(token!, month),
    enabled: !!token,
  })

  // Mutations
  const gerarMut = useMutation({
    mutationFn: (opts: { preview?: boolean }) =>
      financeAutomationApi.gerarCobrancasMes(token!, { month, preview: opts.preview }),
    onSuccess: (data) => {
      if (!data.preview) {
        setResult(data); setConfirm(null)
        qc.invalidateQueries({ queryKey: ['finance-automation-dashboard'] })
        qc.invalidateQueries({ queryKey: ['finance-automation-preview'] })
        qc.invalidateQueries({ queryKey: ['finance-rentals'] })
      }
    },
  })

  const statusMut = useMutation({
    mutationFn: () => financeAutomationApi.atualizarStatusLote(token!),
    onSuccess: (data) => { setResult(data); setConfirm(null); qc.invalidateQueries({ queryKey: ['finance-automation-dashboard'] }) },
  })

  const notificarMut = useMutation({
    mutationFn: () => financeAutomationApi.notificarLote(token!, { canal: 'whatsapp' }),
    onSuccess: (data) => { setResult(data); setConfirm(null) },
  })

  const repasseMut = useMutation({
    mutationFn: () => financeAutomationApi.repassesLote(token!, { month }),
    onSuccess: (data) => { setResult(data); setConfirm(null); qc.invalidateQueries({ queryKey: ['finance-automation-dashboard'] }) },
  })

  const asaasMut = useMutation({
    mutationFn: () => financeAutomationApi.cobrarLoteAsaas(token!, { month, billingType }),
    onSuccess: (data) => { setResult(data); setConfirm(null) },
  })

  const d = dashboard as any
  const p = preview as any

  const handleExecutar = async (id: string) => {
    if (id === 'gerar_cobracas') {
      // Buscar preview antes de confirmar
      const prev = await financeAutomationApi.gerarCobrancasMes(token!, { month, preview: true })
      setConfirm({ id, preview: prev })
    } else {
      setConfirm({ id })
    }
  }

  const handleConfirm = () => {
    if (!confirm) return
    switch (confirm.id) {
      case 'gerar_cobracas':        gerarMut.mutate({ preview: false }); break
      case 'atualizar_status':      statusMut.mutate(); break
      case 'notificar_inadimplentes': notificarMut.mutate(); break
      case 'pagar_repasses':        repasseMut.mutate(); break
      case 'cobrar_asaas':          asaasMut.mutate(); break
    }
  }

  const isExecuting = gerarMut.isPending || statusMut.isPending || notificarMut.isPending || repasseMut.isPending || asaasMut.isPending

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/lemosbank" className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold" style={{ color: NAVY }}>Automação Financeira</h1>
          <p className="text-sm text-gray-500">Central de controle — execute todas as tarefas do mês em 1 clique</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={() => { refetchDash(); refetchPreview() }}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"
            title="Atualizar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Resultado */}
      {result && <ResultBanner result={result} onClose={() => setResult(null)} />}

      {/* KPIs Dashboard */}
      {dashLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : d && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Receita do Mês"
            value={fmt(d.receita?.mes)}
            sub={`${d.receita?.qtdPagos ?? 0} pagamentos`}
            icon={TrendingUp}
            color="bg-green-50 text-green-600"
            trend={d.receita?.variacao !== undefined ? { value: d.receita.variacao, label: 'vs mês anterior' } : undefined}
          />
          <KpiCard
            title="A Receber"
            value={fmt(d.pendente?.total)}
            sub={`${d.pendente?.qtd ?? 0} cobranças`}
            icon={Clock}
            color="bg-blue-50 text-blue-600"
          />
          <KpiCard
            title="Inadimplência"
            value={fmt(d.inadimplencia?.total)}
            sub={`${d.inadimplencia?.qtd ?? 0} em atraso · ${fmtPct(d.inadimplencia?.taxa ?? 0)}`}
            icon={AlertTriangle}
            color={d.inadimplencia?.qtd > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'}
          />
          <KpiCard
            title="Repasses Pendentes"
            value={fmt(d.repasses?.pendentes?.total)}
            sub={`${d.repasses?.pendentes?.qtd ?? 0} proprietário(s)`}
            icon={DollarSign}
            color="bg-orange-50 text-orange-600"
          />
        </div>
      )}

      {/* Saldo Asaas */}
      {d?.asaas && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-yellow-50">
              <Banknote className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Saldo Asaas</p>
              <p className="text-lg font-bold text-gray-900">{fmt(d.asaas.balance)}</p>
            </div>
            <Link href="/dashboard/lemosbank/boletos" className="ml-auto text-xs text-blue-500 hover:underline flex items-center gap-1">
              Ver boletos <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Ações Automáticas */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Tarefas do Mês — {month}</h2>
          {previewLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
        </div>

        {/* Tipo de cobrança Asaas */}
        <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
          <Info className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-xs text-gray-600">Tipo de cobrança Asaas:</span>
          <div className="flex gap-2">
            {(['PIX', 'BOLETO'] as const).map(t => (
              <button
                key={t}
                onClick={() => setBillingType(t)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${billingType === t ? 'text-white' : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-100'}`}
                style={billingType === t ? { backgroundColor: NAVY } : {}}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {p?.acoes?.map((acao: any) => (
            <AcaoCard key={acao.id} acao={acao} onExecutar={handleExecutar} />
          ))}
          {!p?.acoes && !previewLoading && (
            <div className="col-span-2 text-center py-12 text-gray-400">
              <Zap className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Selecione um mês para ver as tarefas disponíveis</p>
            </div>
          )}
        </div>
      </div>

      {/* Inadimplentes */}
      {d?.inadimplencia?.lista?.length > 0 && (
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-red-50">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Inadimplentes ({d.inadimplencia.lista.length})
            </h2>
            <button
              onClick={() => handleExecutar('notificar_inadimplentes')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl text-white"
              style={{ backgroundColor: '#16a34a' }}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Notificar Todos
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {d.inadimplencia.lista.slice(0, 10).map((r: any) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {r.contract?.tenantName ?? r.contract?.tenant?.name ?? '—'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{r.contract?.propertyAddress ?? '—'}</p>
                  <p className="text-xs text-red-500">
                    Venc.: {r.dueDate ? new Date(r.dueDate).toLocaleDateString('pt-BR') : '—'}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-sm font-bold text-red-600">{fmt(r.totalAmount ?? r.rentAmount)}</p>
                  {r.contract?.id && (
                    <Link href={`/dashboard/contratos/${r.contract.id}`} className="text-xs text-blue-500 hover:underline">
                      Ver contrato
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
          {d.inadimplencia.lista.length > 10 && (
            <div className="px-5 py-3 border-t border-gray-50">
              <Link href="/dashboard/lemosbank/cobrancas?status=LATE" className="text-xs text-blue-500 hover:underline">
                Ver todos os {d.inadimplencia.lista.length} inadimplentes →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Vencimentos próximos */}
      {d?.vencimentos?.em7dias?.length > 0 && (
        <div className="bg-white rounded-2xl border border-yellow-100 shadow-sm">
          <div className="p-5 border-b border-yellow-50">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              Vencendo em 7 dias ({d.vencimentos.em7dias.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {d.vencimentos.em7dias.slice(0, 8).map((r: any) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {r.contract?.tenantName ?? '—'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{r.contract?.propertyAddress ?? '—'}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-sm font-bold text-yellow-700">{fmt(r.totalAmount ?? r.rentAmount)}</p>
                  <p className="text-xs text-gray-400">
                    {r.dueDate ? new Date(r.dueDate).toLocaleDateString('pt-BR') : '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Links rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: '/dashboard/lemosbank/cobrancas', icon: BarChart3, label: 'Cobranças', color: 'bg-blue-50 text-blue-600' },
          { href: '/dashboard/lemosbank/repasses',  icon: DollarSign, label: 'Repasses', color: 'bg-green-50 text-green-600' },
          { href: '/dashboard/lemosbank/boletos',   icon: Banknote, label: 'Boletos', color: 'bg-yellow-50 text-yellow-600' },
          { href: '/dashboard/lemosbank/relatorios', icon: BarChart3, label: 'Relatórios', color: 'bg-purple-50 text-purple-600' },
        ].map(({ href, icon: Icon, label, color }) => (
          <Link key={href} href={href}
            className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className={`p-2 rounded-xl ${color}`}><Icon className="w-4 h-4" /></div>
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300 ml-auto" />
          </Link>
        ))}
      </div>

      {/* Modal de confirmação */}
      {confirm && (
        <ConfirmModal
          title={`Confirmar: ${p?.acoes?.find((a: any) => a.id === confirm.id)?.titulo ?? confirm.id}`}
          descricao={p?.acoes?.find((a: any) => a.id === confirm.id)?.descricao ?? 'Esta operação não pode ser desfeita.'}
          preview={confirm.preview}
          onConfirm={handleConfirm}
          onClose={() => setConfirm(null)}
          loading={isExecuting}
        />
      )}
    </div>
  )
}

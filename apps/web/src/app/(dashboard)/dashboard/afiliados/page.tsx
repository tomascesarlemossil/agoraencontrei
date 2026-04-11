'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { affiliateApi } from '@/lib/api'
import {
  Users, UserPlus, Copy, Check, Award, DollarSign,
  TrendingUp, ToggleLeft, ToggleRight, ChevronDown, ChevronUp,
  Star, Shield, Crown, ExternalLink, Link2, RefreshCw,
  Phone, Mail, Hash, Calendar,
} from 'lucide-react'

const LEVEL_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Star; rate: string }> = {
  bronze: { label: 'Bronze', color: 'text-orange-700', bg: 'bg-orange-100', icon: Shield, rate: '20%' },
  prata:  { label: 'Prata',  color: 'text-gray-600',   bg: 'bg-gray-100',   icon: Star,   rate: '25%' },
  ouro:   { label: 'Ouro',   color: 'text-yellow-700', bg: 'bg-yellow-100', icon: Crown,  rate: '30%' },
}

function fmt(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export default function AfiliadosPage() {
  const token = useAuthStore(s => s.accessToken)
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })

  const { data: listData, isLoading } = useQuery({
    queryKey: ['affiliates'],
    queryFn: () => affiliateApi.list(token!),
    enabled: !!token,
  })

  const createMutation = useMutation({
    mutationFn: () => affiliateApi.create(token!, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliates'] })
      setShowCreate(false)
      setForm({ name: '', email: '', phone: '' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => affiliateApi.update(token!, id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['affiliates'] }),
  })

  const affiliates = listData?.data ?? []
  const total = listData?.meta?.total ?? 0

  function copyLink(code: string) {
    const url = `${window.location.origin}/?ref=${code}`
    navigator.clipboard.writeText(url)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const activeCount = affiliates.filter((a: any) => a.isActive).length
  const totalEarnings = affiliates.reduce((sum: number, a: any) => sum + Number(a.totalEarnings || 0), 0)
  const totalPending = affiliates.reduce((sum: number, a: any) => sum + Number(a.pendingEarnings || 0), 0)
  const totalClients = affiliates.reduce((sum: number, a: any) => sum + (a.totalClients || 0), 0)

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 shrink-0" />
            Programa de Afiliados
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 truncate">Tracking, comiss&otilde;es e gamifica&ccedil;&atilde;o</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors self-start sm:self-auto"
        >
          <UserPlus className="h-4 w-4" />
          Novo Afiliado
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <h3 className="font-semibold text-gray-900 text-sm">Cadastrar Afiliado</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text" placeholder="Nome completo" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <input
              type="email" placeholder="Email" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <input
              type="tel" placeholder="Telefone (opcional)" value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => createMutation.mutate()}
              disabled={!form.name || !form.email || createMutation.isPending}
              className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Criando...' : 'Criar Afiliado'}
            </button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
              Cancelar
            </button>
          </div>
          {createMutation.isError && (
            <p className="text-xs text-red-600">Erro ao criar afiliado. Verifique se o email j&aacute; existe.</p>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
        {[
          { label: 'Total', value: `${total}`, icon: Users, color: 'text-gray-600' },
          { label: 'Ativos', value: `${activeCount}`, icon: TrendingUp, color: 'text-green-600' },
          { label: 'Comiss\u00f5es', value: fmt(totalEarnings), icon: DollarSign, color: 'text-purple-600' },
          { label: 'Pendente', value: fmt(totalPending), icon: Award, color: 'text-orange-600' },
          { label: 'Clientes', value: `${totalClients}`, icon: Users, color: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
              <span className="text-[10px] sm:text-xs text-gray-500">{s.label}</span>
            </div>
            <p className={`text-sm sm:text-lg font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Gamification Levels */}
      <div className="bg-white rounded-xl border border-gray-200 p-3">
        <h3 className="text-xs font-semibold text-gray-600 mb-2">N&iacute;veis de Comiss&atilde;o</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(LEVEL_CONFIG).map(([key, cfg]) => {
            const Icon = cfg.icon
            return (
              <div key={key} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                <Icon className="h-3.5 w-3.5" />
                {cfg.label}: {cfg.rate}
              </div>
            )
          })}
        </div>
      </div>

      {/* Affiliates List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-purple-600 border-t-transparent rounded-full" />
        </div>
      ) : affiliates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhum afiliado cadastrado</p>
          <p className="text-sm text-gray-400">Clique em &ldquo;Novo Afiliado&rdquo; para come&ccedil;ar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {affiliates.map((aff: any) => {
            const levelCfg = LEVEL_CONFIG[aff.level] ?? LEVEL_CONFIG.bronze
            const LevelIcon = levelCfg.icon
            const isExpanded = expandedId === aff.id

            return (
              <div key={aff.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Card Header */}
                <button onClick={() => setExpandedId(isExpanded ? null : aff.id)} className="w-full p-3 sm:p-4 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${levelCfg.bg} ${levelCfg.color}`}>
                          <LevelIcon className="h-3 w-3" /> {levelCfg.label}
                        </span>
                        {!aff.isActive && <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-600">Inativo</span>}
                        <span className="text-xs text-gray-400">{aff.totalClients || 0} clientes</span>
                      </div>
                      <p className="font-medium text-gray-900 truncate">{aff.name}</p>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {aff.email}</span>
                        {aff.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {aff.phone}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <code className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{aff.code}</code>
                        <button onClick={e => { e.stopPropagation(); copyLink(aff.code) }} className="p-1 text-gray-400 hover:text-purple-600" title="Copiar link">
                          {copiedCode === aff.code ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      <p className="text-sm font-bold text-purple-600">{fmt(Number(aff.totalEarnings || 0))}</p>
                      <p className="text-[10px] text-gray-400">pendente: {fmt(Number(aff.pendingEarnings || 0))}</p>
                    </div>
                  </div>
                </button>

                {/* Expanded */}
                {isExpanded && (
                  <AffiliateExpandedDetail
                    affiliate={aff}
                    token={token!}
                    onToggleActive={() => updateMutation.mutate({ id: aff.id, data: { isActive: !aff.isActive } })}
                    onChangeLevel={(level: string) => updateMutation.mutate({ id: aff.id, data: { level } })}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Expanded Affiliate Detail ───────────────────────────────────────────────

function AffiliateExpandedDetail({ affiliate, token, onToggleActive, onChangeLevel }: {
  affiliate: any; token: string; onToggleActive: () => void; onChangeLevel: (l: string) => void
}) {
  const queryClient = useQueryClient()

  const { data: statsData } = useQuery({
    queryKey: ['affiliate-stats', affiliate.id],
    queryFn: () => affiliateApi.stats(token, affiliate.id),
    enabled: !!token,
  })

  const { data: earningsData } = useQuery({
    queryKey: ['affiliate-earnings', affiliate.id],
    queryFn: () => affiliateApi.earnings(token, affiliate.id, { limit: '10' }),
    enabled: !!token,
  })

  const { data: referralsData } = useQuery({
    queryKey: ['affiliate-referrals', affiliate.id],
    queryFn: () => affiliateApi.referrals(token, affiliate.id, { limit: '10' }),
    enabled: !!token,
  })

  const recalcMutation = useMutation({
    mutationFn: () => affiliateApi.recalculateLevel(token, affiliate.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliates'] })
      queryClient.invalidateQueries({ queryKey: ['affiliate-stats', affiliate.id] })
    },
  })

  const stats = statsData
  const earnings = earningsData?.data ?? []
  const referrals = referralsData?.data ?? []

  // Referral link
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://agoraencontrei.com.br'
  const referralLink = `${baseUrl}/?ref=${affiliate.code}`

  return (
    <div className="border-t border-gray-100 p-3 sm:p-4 space-y-4 bg-gray-50">
      {/* Referral Link Card */}
      <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
        <p className="text-xs font-semibold text-purple-700 mb-1 flex items-center gap-1.5">
          <Link2 className="h-3.5 w-3.5" /> Link de Indica&ccedil;&atilde;o
        </p>
        <div className="flex items-center gap-2">
          <code className="text-xs text-purple-800 bg-white px-2 py-1 rounded border border-purple-100 flex-1 truncate">
            {referralLink}
          </code>
          <button
            onClick={() => { navigator.clipboard.writeText(referralLink) }}
            className="px-3 py-1 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 shrink-0"
          >
            Copiar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Total Ganho', value: fmt(stats?.totalEarnings ?? 0) },
          { label: 'Pendente', value: fmt(stats?.pendingEarnings ?? 0) },
          { label: 'Pago', value: fmt(stats?.paidEarnings ?? 0) },
          { label: 'Clientes', value: stats?.totalClients ?? 0 },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg p-2 text-center border border-gray-100">
            <p className="text-[10px] text-gray-400">{s.label}</p>
            <p className="text-sm font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button onClick={onToggleActive} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg ${affiliate.isActive ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {affiliate.isActive ? <ToggleRight className="h-3 w-3" /> : <ToggleLeft className="h-3 w-3" />}
          {affiliate.isActive ? 'Desativar' : 'Ativar'}
        </button>
        {Object.entries(LEVEL_CONFIG).filter(([k]) => k !== affiliate.level).map(([key, cfg]) => (
          <button key={key} onClick={() => onChangeLevel(key)} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg ${cfg.bg} ${cfg.color}`}>
            Promover p/ {cfg.label}
          </button>
        ))}
        <button onClick={() => recalcMutation.mutate()} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-100 text-blue-700">
          <RefreshCw className={`h-3 w-3 ${recalcMutation.isPending ? 'animate-spin' : ''}`} /> Recalcular N&iacute;vel
        </button>
      </div>

      {/* Referrals */}
      {referrals.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-600 mb-2">Indica&ccedil;&otilde;es ({referrals.length})</h4>
          <div className="space-y-1.5">
            {referrals.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between bg-white rounded-lg p-2 border border-gray-100 text-sm">
                <div className="min-w-0">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${r.status === 'converted' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {r.status === 'converted' ? 'Convertido' : r.status === 'tracked' ? 'Rastreado' : r.status}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">{r.source}</span>
                </div>
                <span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Earnings */}
      {earnings.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-600 mb-2">&Uacute;ltimos Ganhos</h4>
          <div className="space-y-1.5">
            {earnings.map((e: any) => (
              <div key={e.id} className="flex items-center justify-between bg-white rounded-lg p-2 border border-gray-100 text-sm">
                <div className="min-w-0">
                  <p className="text-gray-700 truncate text-xs">{e.description || 'Comiss\u00e3o de indica\u00e7\u00e3o'}</p>
                  <p className="text-[10px] text-gray-400">{formatDate(e.createdAt)} &middot; Bruto: {fmt(Number(e.grossValue))}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-green-600 text-sm">{fmt(Number(e.amount))}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${e.status === 'paid' ? 'bg-green-100 text-green-700' : e.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                    {e.status === 'paid' ? 'Pago' : e.status === 'pending' ? 'Pendente' : e.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import Link from 'next/link'
import {
  AlertTriangle, Clock, CheckCircle, Phone,
  MessageCircle, CalendarClock, ChevronRight,
  Building2, UserCheck, Loader2,
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

async function apiFetch(path: string, token: string, opts?: RequestInit) {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts?.headers as any) },
    credentials: 'include',
  })
  if (!res.ok) throw new Error('API error')
  return res.json()
}

export default function RenovacoesPage() {
  const { accessToken: token } = useAuthStore()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['crm-renovacoes'],
    queryFn: () => apiFetch('/api/v1/crm/renovacoes', token!),
    enabled: !!token,
    refetchInterval: 60_000,
  })

  const marcaContatadoMutation = useMutation({
    mutationFn: (clientId: string) =>
      apiFetch(`/api/v1/crm/renovacoes/contato/${clientId}`, token!, { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-renovacoes'] }),
  })

  const handleWhatsApp = (phone: string, nome: string, daysLeft?: number) => {
    const clean = phone.replace(/\D/g, '')
    const msg = daysLeft
      ? `Olá ${nome}! Passando para informar que seu contrato vence em ${daysLeft} dias. Podemos conversar sobre a renovação?`
      : `Olá ${nome}! Somos da Imobiliária Lemos. Gostaria de conversar sobre seus imóveis conosco?`
    window.open(`https://wa.me/55${clean}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    )
  }

  const stats     = data?.stats ?? {}
  const venc30    = data?.vencendo30 ?? []
  const venc60    = data?.vencendo60 ?? []
  const venc90    = data?.vencendo90 ?? []
  const semContato = data?.semContato ?? []

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Alertas de Renovação</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Contratos vencendo e proprietários que precisam de contato
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={AlertTriangle} iconColor="text-red-600" bg="bg-red-50" label="Urgente (30d)" value={stats.urgente ?? 0} />
        <StatCard icon={Clock} iconColor="text-yellow-600" bg="bg-yellow-50" label="Atenção (60d)" value={stats.atencao ?? 0} />
        <StatCard icon={CalendarClock} iconColor="text-blue-600" bg="bg-blue-50" label="Aviso (90d)" value={stats.aviso ?? 0} />
        <StatCard icon={UserCheck} iconColor="text-purple-600" bg="bg-purple-50" label="Sem Contato" value={stats.semContato ?? 0} />
      </div>

      {/* Vencendo em 30 dias — URGENTE */}
      {venc30.length > 0 && (
        <Section title="⚠️ Vencendo em até 30 dias" color="red" count={venc30.length}>
          {venc30.map((c: any) => (
            <ContractRow
              key={c.id}
              contract={c}
              urgencyColor="red"
              onWhatsApp={handleWhatsApp}
            />
          ))}
        </Section>
      )}

      {/* Vencendo em 31-60 dias — ATENÇÃO */}
      {venc60.length > 0 && (
        <Section title="🔔 Vencendo em 31–60 dias" color="yellow" count={venc60.length}>
          {venc60.map((c: any) => (
            <ContractRow
              key={c.id}
              contract={c}
              urgencyColor="yellow"
              onWhatsApp={handleWhatsApp}
            />
          ))}
        </Section>
      )}

      {/* Vencendo em 61-90 dias — AVISO */}
      {venc90.length > 0 && (
        <Section title="📅 Vencendo em 61–90 dias" color="blue" count={venc90.length}>
          {venc90.map((c: any) => (
            <ContractRow
              key={c.id}
              contract={c}
              urgencyColor="blue"
              onWhatsApp={handleWhatsApp}
            />
          ))}
        </Section>
      )}

      {/* Proprietários sem contato */}
      {semContato.length > 0 && (
        <Section title="👤 Proprietários sem contato (30–90 dias)" color="purple" count={semContato.length}>
          {semContato.map((client: any) => (
            <div key={client.id} className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
              <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-sm font-bold flex-shrink-0">
                {client.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">{client.name}</p>
                {client.phone && (
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" />{client.phone}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">
                  Cadastrado em {new Date(client.createdAt).toLocaleDateString('pt-BR')} · Nunca contatado
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {client.phone && (
                  <button
                    onClick={() => handleWhatsApp(client.phone, client.name)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp
                  </button>
                )}
                <button
                  onClick={() => marcaContatadoMutation.mutate(client.id)}
                  disabled={marcaContatadoMutation.isPending}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Contatado
                </button>
              </div>
            </div>
          ))}
        </Section>
      )}

      {venc30.length === 0 && venc60.length === 0 && venc90.length === 0 && semContato.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
          <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Tudo em dia!</p>
          <p className="text-sm text-gray-400 mt-1">Nenhum contrato vencendo ou proprietário sem contato</p>
        </div>
      )}
    </div>
  )
}

function Section({ title, color, count, children }: {
  title: string; color: 'red' | 'yellow' | 'blue' | 'purple'; count: number; children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  const colors = {
    red:    'border-red-200 bg-red-50',
    yellow: 'border-yellow-200 bg-yellow-50',
    blue:   'border-blue-200 bg-blue-50',
    purple: 'border-purple-200 bg-purple-50',
  }
  const headerColors = {
    red:    'text-red-700',
    yellow: 'text-yellow-700',
    blue:   'text-blue-700',
    purple: 'text-purple-700',
  }
  return (
    <div className={`rounded-xl border overflow-hidden ${colors[color]}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4"
      >
        <span className={`font-semibold text-sm ${headerColors[color]}`}>{title}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${headerColors[color]} bg-white`}>{count}</span>
      </button>
      {open && (
        <div className="bg-white divide-y divide-gray-50">
          {children}
        </div>
      )}
    </div>
  )
}

function ContractRow({ contract, urgencyColor, onWhatsApp }: {
  contract: any; urgencyColor: 'red' | 'yellow' | 'blue';
  onWhatsApp: (phone: string, nome: string, daysLeft?: number) => void
}) {
  const phone = contract.tenantPhone ?? contract.tenant?.phone
  return (
    <div className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors">
      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
        <Building2 className="w-4 h-4 text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium text-gray-900 text-sm truncate">{contract.tenantName}</p>
          <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${
            urgencyColor === 'red' ? 'bg-red-100 text-red-700' :
            urgencyColor === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {contract.daysLeft}d
          </span>
        </div>
        <p className="text-xs text-gray-400 truncate">{contract.propertyAddress}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          Vencimento: {new Date(contract.endDate).toLocaleDateString('pt-BR')}
          {contract.rentValue && ` · R$ ${Number(contract.rentValue).toLocaleString('pt-BR')}/mês`}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {phone && (
          <button
            onClick={() => onWhatsApp(phone, contract.tenantName, contract.daysLeft)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp
          </button>
        )}
        <Link
          href={`/dashboard/contratos`}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Ver
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, iconColor, bg, label, value }: {
  icon: any; iconColor: string; bg: string; label: string; value: number
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-2`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Users, Phone, Mail, MapPin, BadgeCheck, FileText,
  Building2, User, Home, Calendar, Briefcase, CreditCard, Hash, Download,
  MessageSquare, Clock, TrendingUp,
} from 'lucide-react'
import { financeApi, type LegacyClient, type LegacyContract } from '@/lib/api'

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  TENANT:      { label: 'Inquilino',            color: 'bg-blue-100 text-blue-700'   },
  LANDLORD:    { label: 'Proprietário',          color: 'bg-green-100 text-green-700' },
  GUARANTOR:   { label: 'Fiador',               color: 'bg-purple-100 text-purple-700' },
  BENEFICIARY: { label: 'Favorecido',           color: 'bg-yellow-100 text-yellow-700' },
  SECONDARY:   { label: 'Prop. Secundário',     color: 'bg-gray-100 text-gray-600' },
}

const STATUS_COLOR: Record<string, string> = {
  ACTIVE:   'bg-green-100 text-green-700',
  FINISHED: 'bg-gray-100 text-gray-600',
  CANCELED: 'bg-red-100 text-red-700',
}
const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Ativo', FINISHED: 'Encerrado', CANCELED: 'Cancelado',
}

const fmt = (v: number | null | undefined) =>
  v == null ? '—'
  : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(v))

function formatDoc(doc: string) {
  if (doc.length <= 11)
    return doc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  return doc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

function InfoRow({ label, value, icon: Icon }: { label: string; value?: string | null; icon?: any }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2 py-1.5">
      {Icon && <Icon className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />}
      <div>
        <span className="text-xs text-gray-400 block leading-none">{label}</span>
        <span className="text-sm text-gray-800 font-medium">{value}</span>
      </div>
    </div>
  )
}

function ContractRow({ c, role }: { c: any; role: 'tenant' | 'landlord' | 'guarantor' }) {
  const otherName = role === 'tenant' ? (c.landlord?.name ?? c.landlordName) : (c.tenant?.name ?? c.tenantName)
  const otherLabel = role === 'tenant' ? 'Proprietário' : role === 'landlord' ? 'Inquilino' : 'Inquilino'
  return (
    <Link
      href={`/dashboard/contratos/${c.id}`}
      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors border border-gray-50 mb-2"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[c.status] ?? 'bg-gray-100 text-gray-600'}`}>
            {STATUS_LABEL[c.status] ?? c.status}
          </span>
          {c.legacyId && <span className="text-xs text-gray-400 font-mono">#{c.legacyId}</span>}
          {c.property?.reference && (
            <span className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-mono">
              Ref: {c.property.reference}
            </span>
          )}
          {(c._count?.documents > 0) && (
            <span className="text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
              {c._count.documents} docs
            </span>
          )}
        </div>
        <p className="text-sm font-medium text-gray-800 truncate">{c.propertyAddress ?? '—'}</p>
        {otherName && (
          <p className="text-xs text-gray-500">{otherLabel}: {otherName}</p>
        )}
        {c.startDate && (
          <p className="text-xs text-gray-400">Início: {new Date(c.startDate).toLocaleDateString('pt-BR')}</p>
        )}
      </div>
      <div className="text-right ml-3 shrink-0">
        <p className="text-sm font-bold text-blue-600">{fmt(c.rentValue)}</p>
        <p className="text-xs text-gray-400">/ mês</p>
      </div>
    </Link>
  )
}

export default function ClienteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const token = useAuthStore(s => s.accessToken)
  const id = params.id as string

  const { data: client, isLoading } = useQuery({
    queryKey: ['finance-client', id],
    queryFn: () => financeApi.client(token!, id),
    enabled: !!token && !!id,
  })

  const c = client as LegacyClient | undefined

  const isLandlord  = c?.roles.includes('LANDLORD') || c?.roles.includes('SECONDARY')
  const isTenant    = c?.roles.includes('TENANT')
  const isGuarantor = c?.roles.includes('GUARANTOR')

  const allContracts = [
    ...(c?.contractsAsTenant ?? []).map(x => ({ ...x, _role: 'tenant' as const })),
    ...(c?.contractsAsLandlord ?? []).map(x => ({ ...x, _role: 'landlord' as const })),
    ...(c?.contractsAsGuarantor ?? []).map(x => ({ ...x, _role: 'guarantor' as const })),
  ]

  const activeContracts   = allContracts.filter(x => x.status === 'ACTIVE')
  const inactiveContracts = allContracts.filter(x => x.status !== 'ACTIVE')

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="p-2 rounded-xl bg-indigo-50">
          <Users className="w-6 h-6 text-indigo-600" />
        </div>
        {isLoading ? (
          <div className="h-7 w-48 bg-gray-200 rounded animate-pulse" />
        ) : (
          <div>
            <h1 className="text-xl font-bold text-gray-900">{c?.name ?? '—'}</h1>
            <div className="flex gap-1 mt-0.5">
              {c?.roles.map(r => {
                const cfg = ROLE_LABELS[r] ?? { label: r, color: 'bg-gray-100 text-gray-600' }
                return (
                  <span key={r} className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                    {cfg.label}
                  </span>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : c ? (
        <>
          {/* Main info grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dados Pessoais */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                Dados Pessoais
              </h2>
              <div className="space-y-0.5">
                <InfoRow label="Código legado" value={c.legacyId ?? undefined} icon={Hash} />
                <InfoRow label="CPF / CNPJ"    value={c.document ? formatDoc(c.document) : undefined} icon={BadgeCheck} />
                <InfoRow label="RG"             value={c.rg ?? undefined} icon={BadgeCheck} />
                <InfoRow label="Profissão"      value={c.profession ?? undefined} icon={Briefcase} />
                <InfoRow
                  label="Data de Nascimento"
                  value={c.birthDate ? new Date(c.birthDate).toLocaleDateString('pt-BR') : undefined}
                  icon={Calendar}
                />
              </div>
            </div>

            {/* Contato */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                Contato
              </h2>
              <div className="space-y-0.5">
                <InfoRow label="E-mail"           value={c.email ?? undefined}       icon={Mail}    />
                <InfoRow label="Celular"          value={c.phoneMobile ?? undefined}  icon={Phone}   />
                <InfoRow label="Telefone Res."    value={c.phone ?? undefined}        icon={Phone}   />
                <InfoRow label="Telefone Com."    value={c.phoneWork ?? undefined}    icon={Phone}   />
              </div>
            </div>

            {/* Endereço */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                Endereço
              </h2>
              <div className="space-y-0.5">
                <InfoRow label="Endereço"    value={c.address ?? undefined}             icon={Home}   />
                <InfoRow label="Complemento" value={c.addressComplement ?? undefined}   icon={Home}   />
                <InfoRow label="Bairro"      value={c.neighborhood ?? undefined}        icon={MapPin} />
                <InfoRow
                  label="Cidade / Estado"
                  value={c.city ? `${c.city}${c.state ? ` / ${c.state}` : ''}` : undefined}
                  icon={MapPin}
                />
                <InfoRow label="CEP"         value={c.zipCode ?? undefined}             icon={MapPin} />
              </div>
            </div>

            {/* Resumo de contratos */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                Resumo de Contratos
              </h2>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-green-50 rounded-xl">
                  <p className="text-2xl font-bold text-green-700">{activeContracts.length}</p>
                  <p className="text-xs text-green-600 mt-0.5">Ativos</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-bold text-gray-600">{inactiveContracts.length}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Encerrados</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-xl">
                  <p className="text-2xl font-bold text-blue-700">{allContracts.length}</p>
                  <p className="text-xs text-blue-600 mt-0.5">Total</p>
                </div>
              </div>
              {isLandlord && (c?.contractsAsLandlord ?? []).length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-50">
                  <p className="text-xs text-gray-400 mb-1">Receita mensal (imóveis ativos)</p>
                  <p className="text-lg font-bold text-green-700">
                    {fmt(
                      (c?.contractsAsLandlord ?? [])
                        .filter(x => x.status === 'ACTIVE')
                        .reduce((sum, x) => sum + Number(x.rentValue ?? 0), 0)
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Contracts sections */}
          {isTenant && (c?.contractsAsTenant ?? []).length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Home className="w-4 h-4 text-blue-400" />
                Contratos como Inquilino
                <span className="ml-auto text-xs text-gray-400 font-normal">{c.contractsAsTenant?.length} contrato(s)</span>
              </h2>
              {c.contractsAsTenant?.map(x => (
                <ContractRow key={x.id} c={x} role="tenant" />
              ))}
            </div>
          )}

          {isLandlord && (c?.contractsAsLandlord ?? []).length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-green-400" />
                Contratos como Proprietário
                <span className="ml-auto text-xs text-gray-400 font-normal">{c.contractsAsLandlord?.length} contrato(s)</span>
              </h2>
              {c.contractsAsLandlord?.map(x => (
                <ContractRow key={x.id} c={x} role="landlord" />
              ))}
            </div>
          )}

          {isGuarantor && (c?.contractsAsGuarantor ?? []).length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-400" />
                Contratos como Fiador
                <span className="ml-auto text-xs text-gray-400 font-normal">{c.contractsAsGuarantor?.length} contrato(s)</span>
              </h2>
              {c.contractsAsGuarantor?.map(x => (
                <ContractRow key={x.id} c={x} role="guarantor" />
              ))}
            </div>
          )}

          {/* Leads / Histórico de interesse */}
          {(c as any).leads?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-400" />
                Histórico de Leads / Interesse em Imóveis
                <span className="ml-auto text-xs text-gray-400 font-normal">{(c as any).leads.length} registros</span>
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {(c as any).leads.map((lead: any) => (
                  <Link
                    key={lead.id}
                    href={`/dashboard/leads/${lead.id}`}
                    className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors border border-gray-50"
                  >
                    <MessageSquare className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-gray-700">{lead.name || 'Anônimo'}</span>
                        {lead.status && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                            {lead.status}
                          </span>
                        )}
                        {(lead.metadata as any)?.propertyRef && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-mono">
                            Ref: {(lead.metadata as any).propertyRef}
                          </span>
                        )}
                      </div>
                      {lead.notes && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{lead.notes}</p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(lead.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Documentos vinculados */}
          {(c as any).documents?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  Documentos Vinculados
                </h2>
                <span className="text-xs text-gray-400">{(c as any).documents.length} arquivo(s)</span>
              </div>
              <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                {(c as any).documents.map((doc: any) => {
                  const typeColors: Record<string, string> = {
                    BOLETO: 'text-orange-600 bg-orange-50',
                    EXTRATO: 'text-blue-600 bg-blue-50',
                    REAJUSTE: 'text-yellow-600 bg-yellow-50',
                    FINANCEIRO: 'text-green-600 bg-green-50',
                  }
                  const color = typeColors[doc.type] ?? 'text-gray-500 bg-gray-50'
                  return (
                    <div key={doc.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 group">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium shrink-0 ${color}`}>
                          {doc.type}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm text-gray-800 truncate">{doc.name}</p>
                          {(doc.month || doc.year) && (
                            <p className="text-xs text-gray-400">
                              {doc.month ? `${String(doc.month).padStart(2, '0')}/` : ''}{doc.year ?? ''}
                            </p>
                          )}
                        </div>
                      </div>
                      <a
                        href={`/api/v1/documents/${doc.id}/download`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 p-1.5 text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">Cliente não encontrado</p>
          <Link href="/dashboard/clientes" className="mt-3 text-sm text-indigo-600 hover:underline block">
            Voltar para lista
          </Link>
        </div>
      )}
    </div>
  )
}

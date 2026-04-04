'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import Link from 'next/link'
import {
  ArrowLeft, Pencil, Save, Loader2, User, Phone, Mail,
  MapPin, Briefcase, Calendar, Banknote, Heart, DollarSign,
  FileText, AlertCircle, Archive, ArchiveRestore, CreditCard,
} from 'lucide-react'
import { financeApi } from '@/lib/api'

const ROLE_OPTIONS = [
  { value: 'LANDLORD',    label: 'Proprietário' },
  { value: 'TENANT',      label: 'Inquilino' },
  { value: 'GUARANTOR',   label: 'Fiador' },
  { value: 'BENEFICIARY', label: 'Favorecido' },
  { value: 'SECONDARY',   label: 'Prop. Secundário' },
]

const MARITAL_OPTIONS = [
  { value: '',               label: 'Não informado' },
  { value: 'solteiro',       label: 'Solteiro(a)' },
  { value: 'casado',         label: 'Casado(a)' },
  { value: 'divorciado',     label: 'Divorciado(a)' },
  { value: 'viuvo',          label: 'Viúvo(a)' },
  { value: 'uniao_estavel',  label: 'União Estável' },
  { value: 'separado',       label: 'Separado(a)' },
]

const BANK_ACCOUNT_TYPES = [
  { value: '',          label: 'Tipo de conta' },
  { value: 'corrente',  label: 'Conta Corrente' },
  { value: 'poupanca',  label: 'Conta Poupança' },
  { value: 'salario',   label: 'Conta Salário' },
]

const STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

function SectionTitle({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
      <Icon className="w-4 h-4 text-indigo-500" />
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h3>
    </div>
  )
}

function Field({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-600">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

const inputCls = "w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
const selectCls = "w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"

export default function EditarClientePage() {
  const token = useAuthStore(s => s.accessToken)
  const router = useRouter()
  const params = useParams()
  const queryClient = useQueryClient()
  const id = params.id as string

  const { data: client, isLoading } = useQuery({
    queryKey: ['finance-client', id],
    queryFn: () => financeApi.client(token!, id),
    enabled: !!token && !!id,
  })

  const [form, setForm] = useState({
    name: '', document: '', rg: '', profession: '', birthDate: '',
    email: '', phone: '', phoneMobile: '', phoneWork: '',
    address: '', addressComplement: '', neighborhood: '', city: '', state: '', zipCode: '',
    roles: [] as string[],
    notes: '', maritalStatus: '', nationality: '', spouseName: '', spouseDocument: '',
    spouseProfession: '', income: '', spouseIncome: '',
    bankName: '', bankBranch: '', bankAccount: '', bankAccountType: '', pixKey: '',
    observations: '', isArchived: false, archivedReason: '',
  })

  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (client) {
      const c = client as any
      setForm({
        name:             c.name ?? '',
        document:         c.document ?? '',
        rg:               c.rg ?? '',
        profession:       c.profession ?? '',
        birthDate:        c.birthDate ? c.birthDate.substring(0, 10) : '',
        email:            c.email ?? '',
        phone:            c.phone ?? '',
        phoneMobile:      c.phoneMobile ?? '',
        phoneWork:        c.phoneWork ?? '',
        address:          c.address ?? '',
        addressComplement: c.addressComplement ?? '',
        neighborhood:     c.neighborhood ?? '',
        city:             c.city ?? '',
        state:            c.state ?? '',
        zipCode:          c.zipCode ?? '',
        roles:            c.roles ?? [],
        notes:            c.notes ?? '',
        maritalStatus:    c.maritalStatus ?? '',
        nationality:      c.nationality ?? '',
        spouseName:       c.spouseName ?? '',
        spouseDocument:   c.spouseDocument ?? '',
        spouseProfession: c.spouseProfession ?? '',
        income:           c.income ? String(c.income) : '',
        spouseIncome:     c.spouseIncome ? String(c.spouseIncome) : '',
        bankName:         c.bankName ?? '',
        bankBranch:       c.bankBranch ?? '',
        bankAccount:      c.bankAccount ?? '',
        bankAccountType:  c.bankAccountType ?? '',
        pixKey:           c.pixKey ?? '',
        observations:     c.observations ?? '',
        isArchived:       c.isArchived ?? false,
        archivedReason:   c.archivedReason ?? '',
      })
    }
  }, [client])

  const mutation = useMutation({
    mutationFn: (data: typeof form) => {
      const body: any = { ...data }
      if (body.income) body.income = parseFloat(String(body.income).replace(/\./g, '').replace(',', '.'))
      else body.income = null
      if (body.spouseIncome) body.spouseIncome = parseFloat(String(body.spouseIncome).replace(/\./g, '').replace(',', '.'))
      else body.spouseIncome = null
      if (!body.birthDate) body.birthDate = null
      return financeApi.updateClient(token!, id, body)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-client', id] })
      queryClient.invalidateQueries({ queryKey: ['finance-clients'] })
      router.push(`/dashboard/clientes/${id}`)
    },
    onError: (err: any) => {
      setError(err.message ?? 'Erro ao salvar cliente')
    },
  })

  function set(key: string, value: any) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function toggleRole(role: string) {
    setForm(f => ({
      ...f,
      roles: f.roles.includes(role) ? f.roles.filter(r => r !== role) : [...f.roles, role],
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.name.trim()) { setError('Nome é obrigatório'); return }
    mutation.mutate(form)
  }

  function handleArchive() {
    const body: any = { isArchived: !form.isArchived }
    if (!form.isArchived && form.archivedReason) body.archivedReason = form.archivedReason
    financeApi.updateClient(token!, id, body).then(() => {
      queryClient.invalidateQueries({ queryKey: ['finance-client', id] })
      queryClient.invalidateQueries({ queryKey: ['finance-clients'] })
      router.push(`/dashboard/clientes/${id}`)
    })
  }

  const showSpouse = ['casado', 'uniao_estavel'].includes(form.maritalStatus)

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/clientes/${id}`} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="p-2 rounded-xl bg-indigo-50">
          <Pencil className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Cliente</h1>
          <p className="text-sm text-gray-500">{client?.name}</p>
        </div>
        {/* Botão Arquivo Morto */}
        <div className="ml-auto">
          {!showArchiveConfirm ? (
            <button
              type="button"
              onClick={() => setShowArchiveConfirm(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                form.isArchived
                  ? 'border-green-200 text-green-700 hover:bg-green-50'
                  : 'border-amber-200 text-amber-700 hover:bg-amber-50'
              }`}
            >
              {form.isArchived ? (
                <><ArchiveRestore className="w-4 h-4" /> Reativar</>
              ) : (
                <><Archive className="w-4 h-4" /> Arquivo Morto</>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Confirmar?</span>
              <button
                type="button"
                onClick={handleArchive}
                className="px-3 py-1.5 bg-amber-600 text-white text-xs rounded-lg hover:bg-amber-700"
              >
                Sim
              </button>
              <button
                type="button"
                onClick={() => setShowArchiveConfirm(false)}
                className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs rounded-lg hover:bg-gray-50"
              >
                Não
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Motivo de arquivamento (se arquivando) */}
      {showArchiveConfirm && !form.isArchived && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <label className="block text-xs font-medium text-amber-800 mb-2">
            Motivo do arquivamento (opcional)
          </label>
          <input
            value={form.archivedReason}
            onChange={e => set('archivedReason', e.target.value)}
            placeholder="Ex: Cliente falecido, contrato encerrado, mudou de cidade..."
            className="w-full px-3 py-2 rounded-xl border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
          />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados Pessoais */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SectionTitle icon={User} title="Dados Pessoais" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <Field label="Nome completo" required>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nome completo" className={inputCls} required />
              </Field>
            </div>
            <Field label="CPF / CNPJ">
              <input value={form.document} onChange={e => set('document', e.target.value)} placeholder="000.000.000-00" className={inputCls} />
            </Field>
            <Field label="RG">
              <input value={form.rg} onChange={e => set('rg', e.target.value)} placeholder="Número do RG" className={inputCls} />
            </Field>
            <Field label="Profissão">
              <input value={form.profession} onChange={e => set('profession', e.target.value)} placeholder="Ex: Engenheiro..." className={inputCls} />
            </Field>
            <Field label="Data de nascimento">
              <input type="date" value={form.birthDate} onChange={e => set('birthDate', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Nacionalidade">
              <input value={form.nationality} onChange={e => set('nationality', e.target.value)} placeholder="Brasileiro(a)" className={inputCls} />
            </Field>
            <Field label="Estado civil">
              <select value={form.maritalStatus} onChange={e => set('maritalStatus', e.target.value)} className={selectCls}>
                {MARITAL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-600 mb-2">Papel(is) no sistema</label>
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map(({ value, label }) => (
                <button
                  key={value} type="button" onClick={() => toggleRole(value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    form.roles.includes(value)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cônjuge */}
        {showSpouse && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <SectionTitle icon={Heart} title="Dados do Cônjuge" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <Field label="Nome do cônjuge">
                  <input value={form.spouseName} onChange={e => set('spouseName', e.target.value)} placeholder="Nome completo" className={inputCls} />
                </Field>
              </div>
              <Field label="CPF do cônjuge">
                <input value={form.spouseDocument} onChange={e => set('spouseDocument', e.target.value)} placeholder="000.000.000-00" className={inputCls} />
              </Field>
              <Field label="Profissão do cônjuge">
                <input value={form.spouseProfession} onChange={e => set('spouseProfession', e.target.value)} placeholder="Profissão" className={inputCls} />
              </Field>
              <Field label="Renda do cônjuge (R$)">
                <input value={form.spouseIncome} onChange={e => set('spouseIncome', e.target.value)} placeholder="0,00" className={inputCls} />
              </Field>
            </div>
          </div>
        )}

        {/* Renda */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SectionTitle icon={DollarSign} title="Renda" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Renda mensal (R$)" hint="Renda bruta mensal do titular">
              <input value={form.income} onChange={e => set('income', e.target.value)} placeholder="0,00" className={inputCls} />
            </Field>
          </div>
        </div>

        {/* Contato */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SectionTitle icon={Phone} title="Contato" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Celular">
              <input value={form.phoneMobile} onChange={e => set('phoneMobile', e.target.value)} placeholder="(00) 90000-0000" className={inputCls} />
            </Field>
            <Field label="Telefone fixo">
              <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(00) 0000-0000" className={inputCls} />
            </Field>
            <Field label="Telefone comercial">
              <input value={form.phoneWork} onChange={e => set('phoneWork', e.target.value)} placeholder="(00) 0000-0000" className={inputCls} />
            </Field>
            <div className="md:col-span-2">
              <Field label="E-mail">
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@exemplo.com" className={inputCls} />
              </Field>
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SectionTitle icon={MapPin} title="Endereço" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="CEP">
              <input value={form.zipCode} onChange={e => set('zipCode', e.target.value)} placeholder="00000-000" className={inputCls} />
            </Field>
            <div className="lg:col-span-2">
              <Field label="Logradouro">
                <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Rua, Avenida, número..." className={inputCls} />
              </Field>
            </div>
            <Field label="Complemento">
              <input value={form.addressComplement} onChange={e => set('addressComplement', e.target.value)} placeholder="Apto, Bloco..." className={inputCls} />
            </Field>
            <Field label="Bairro">
              <input value={form.neighborhood} onChange={e => set('neighborhood', e.target.value)} placeholder="Bairro" className={inputCls} />
            </Field>
            <Field label="Cidade">
              <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Cidade" className={inputCls} />
            </Field>
            <Field label="Estado">
              <select value={form.state} onChange={e => set('state', e.target.value)} className={selectCls}>
                <option value="">UF</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
        </div>

        {/* Dados Bancários */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SectionTitle icon={Banknote} title="Dados Bancários" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <Field label="Banco">
                <input value={form.bankName} onChange={e => set('bankName', e.target.value)} placeholder="Nome do banco" className={inputCls} />
              </Field>
            </div>
            <Field label="Tipo de conta">
              <select value={form.bankAccountType} onChange={e => set('bankAccountType', e.target.value)} className={selectCls}>
                {BANK_ACCOUNT_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Agência">
              <input value={form.bankBranch} onChange={e => set('bankBranch', e.target.value)} placeholder="0000-0" className={inputCls} />
            </Field>
            <Field label="Conta">
              <input value={form.bankAccount} onChange={e => set('bankAccount', e.target.value)} placeholder="00000-0" className={inputCls} />
            </Field>
            <Field label="Chave PIX">
              <input value={form.pixKey} onChange={e => set('pixKey', e.target.value)} placeholder="CPF, e-mail, telefone ou chave aleatória" className={inputCls} />
            </Field>
          </div>
        </div>

        {/* Observações */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SectionTitle icon={FileText} title="Observações e Notas" />
          <div className="space-y-4">
            <Field label="Notas internas" hint="Visível apenas para a equipe">
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Notas rápidas..." rows={3} className={inputCls + ' resize-none'} />
            </Field>
            <Field label="Observações detalhadas" hint="Histórico, pendências, informações importantes">
              <textarea value={form.observations} onChange={e => set('observations', e.target.value)} placeholder="Observações mais detalhadas..." rows={4} className={inputCls + ' resize-none'} />
            </Field>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-3 justify-end">
          <Link href={`/dashboard/clientes/${id}`} className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {mutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
            ) : (
              <><Save className="w-4 h-4" /> Salvar alterações</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import Link from 'next/link'
import {
  ArrowLeft, UserPlus, Save, Loader2, User, Phone, Mail,
  MapPin, CreditCard, Briefcase, Calendar, Building2,
  Heart, DollarSign, Banknote, Hash, FileText, AlertCircle,
  Thermometer, Search, Shield, Globe, Car, ChevronDown, ChevronUp,
} from 'lucide-react'
import { financeApi } from '@/lib/api'

const ROLE_OPTIONS = [
  { value: 'LANDLORD',    label: 'Proprietário' },
  { value: 'TENANT',      label: 'Inquilino' },
  { value: 'GUARANTOR',   label: 'Fiador' },
  { value: 'BENEFICIARY', label: 'Favorecido' },
  { value: 'SECONDARY',   label: 'Prop. Secundário' },
  { value: 'BUYER',       label: 'Comprador' },
  { value: 'SELLER',      label: 'Vendedor' },
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

const EDUCATION_OPTIONS = [
  { value: '', label: 'Não informado' },
  { value: 'fundamental', label: 'Ensino Fundamental' },
  { value: 'medio', label: 'Ensino Médio' },
  { value: 'tecnico', label: 'Técnico' },
  { value: 'superior', label: 'Ensino Superior' },
  { value: 'pos', label: 'Pós-Graduação' },
  { value: 'mestrado', label: 'Mestrado' },
  { value: 'doutorado', label: 'Doutorado' },
]

const NEGOTIATION_TEMP_OPTIONS = [
  { value: '', label: 'Não definido' },
  { value: 'FRIO', label: '🔵 Frio' },
  { value: 'MORNO', label: '🟡 Morno' },
  { value: 'QUENTE', label: '🔴 Quente' },
  { value: 'FECHADO', label: '✅ Fechado' },
]

const SEARCH_TYPE_OPTIONS = [
  { value: '', label: 'Não definido' },
  { value: 'COMPRA', label: 'Compra' },
  { value: 'LOCACAO', label: 'Locação' },
  { value: 'AMBOS', label: 'Compra e Locação' },
]

const CONTACT_CHANNEL_OPTIONS = [
  { value: '', label: 'Não definido' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'EMAIL', label: 'E-mail' },
  { value: 'TELEFONE', label: 'Telefone' },
  { value: 'PRESENCIAL', label: 'Presencial' },
]

const GUARANTOR_TYPE_OPTIONS = [
  { value: '', label: 'Não definido' },
  { value: 'FIADOR', label: 'Fiador' },
  { value: 'CAUCAO', label: 'Caução' },
  { value: 'SEGURO_FIANCA', label: 'Seguro Fiança' },
  { value: 'TITULO_CAPITALIZACAO', label: 'Título de Capitalização' },
]

const STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

const PROPERTY_TYPES = [
  'APARTMENT','HOUSE','LAND','FARM','RANCH','WAREHOUSE','OFFICE','STORE','STUDIO','PENTHOUSE','CONDO','KITNET',
]
const PROPERTY_TYPE_LABELS: Record<string, string> = {
  APARTMENT: 'Apartamento', HOUSE: 'Casa', LAND: 'Terreno', FARM: 'Fazenda',
  RANCH: 'Sítio', WAREHOUSE: 'Galpão', OFFICE: 'Sala/Escritório', STORE: 'Loja',
  STUDIO: 'Studio', PENTHOUSE: 'Cobertura', CONDO: 'Condomínio', KITNET: 'Kitnet',
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
      <Icon className="w-4 h-4 text-indigo-500" />
      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
  )
}

function Field({
  label, required, children, hint,
}: {
  label: string; required?: boolean; children: React.ReactNode; hint?: string
}) {
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

function CollapsibleSection({ title, icon: Icon, children, defaultOpen = false }: {
  title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h3>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-6 pb-6">{children}</div>}
    </div>
  )
}

export default function NovoClientePage() {
  const token = useAuthStore(s => s.accessToken)
  const router = useRouter()
  const queryClient = useQueryClient()

  const [form, setForm] = useState({
    // Dados básicos
    name: '',
    document: '',
    rg: '',
    rgIssuer: '',
    rgIssueDate: '',
    rgState: '',
    cnh: '',
    cnhCategory: '',
    cnhExpiry: '',
    passportNumber: '',
    passportExpiry: '',
    profession: '',
    birthDate: '',
    nationality: 'Brasileiro(a)',
    maritalStatus: '',
    sex: '',
    education: '',
    cargo: '',
    businessSector: '',
    // Empresa empregadora
    employerName: '',
    employerCnpj: '',
    employerAddress: '',
    employerPhone: '',
    // Cônjuge
    spouseName: '',
    spouseDocument: '',
    spouseProfession: '',
    spouseIncome: '',
    // Contato
    email: '',
    phone: '',
    phoneMobile: '',
    phoneWork: '',
    phoneResidential: '',
    whatsapp: '',
    instagram: '',
    facebook: '',
    website: '',
    contactChannel: '',
    // Endereço residencial
    zipCode: '',
    address: '',
    addressComplement: '',
    neighborhood: '',
    city: '',
    state: '',
    // Endereço de correspondência
    mailingAddress: '',
    mailingComplement: '',
    mailingNeighborhood: '',
    mailingCity: '',
    mailingState: '',
    mailingZipCode: '',
    // Renda
    income: '',
    // Dados bancários
    bankName: '',
    bankBranch: '',
    bankAgencyDigit: '',
    bankAccount: '',
    bankAccountDigit: '',
    bankAccountType: '',
    bankAccountSecond: '',
    bankAccountSecondType: '',
    pixKey: '',
    // Garantia
    guarantorType: '',
    guarantorValue: '',
    guarantorInsurance: '',
    guarantorPolicyNum: '',
    guarantorExpiry: '',
    // Preferências de busca
    searchType: '',
    searchPropertyType: [] as string[],
    searchMinPrice: '',
    searchMaxPrice: '',
    searchMinArea: '',
    searchMaxArea: '',
    searchBedrooms: '',
    searchNeighborhoods: '',
    searchCities: '',
    searchNotes: '',
    // Controle interno
    negotiationTemp: '',
    category: '',
    captorName: '',
    lastContactAt: '',
    nextContactAt: '',
    rating: '',
    tags: '',
    // Papéis
    roles: [] as string[],
    // Observações
    notes: '',
    observations: '',
  })

  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (data: typeof form) => {
      const body: any = { ...data }
      // Converter valores numéricos
      if (body.income) body.income = parseFloat(body.income.replace(/\./g, '').replace(',', '.'))
      else delete body.income
      if (body.spouseIncome) body.spouseIncome = parseFloat(body.spouseIncome.replace(/\./g, '').replace(',', '.'))
      else delete body.spouseIncome
      if (body.guarantorValue) body.guarantorValue = parseFloat(body.guarantorValue.replace(/\./g, '').replace(',', '.'))
      else delete body.guarantorValue
      if (body.searchMinPrice) body.searchMinPrice = parseFloat(body.searchMinPrice.replace(/\./g, '').replace(',', '.'))
      else delete body.searchMinPrice
      if (body.searchMaxPrice) body.searchMaxPrice = parseFloat(body.searchMaxPrice.replace(/\./g, '').replace(',', '.'))
      else delete body.searchMaxPrice
      if (body.searchMinArea) body.searchMinArea = parseFloat(body.searchMinArea)
      else delete body.searchMinArea
      if (body.searchMaxArea) body.searchMaxArea = parseFloat(body.searchMaxArea)
      else delete body.searchMaxArea
      if (body.searchBedrooms) body.searchBedrooms = parseInt(body.searchBedrooms)
      else delete body.searchBedrooms
      if (body.rating) body.rating = parseInt(body.rating)
      else delete body.rating
      // Datas
      if (!body.birthDate) delete body.birthDate
      if (!body.rgIssueDate) delete body.rgIssueDate
      if (!body.cnhExpiry) delete body.cnhExpiry
      if (!body.passportExpiry) delete body.passportExpiry
      if (!body.guarantorExpiry) delete body.guarantorExpiry
      if (!body.lastContactAt) delete body.lastContactAt
      if (!body.nextContactAt) delete body.nextContactAt
      // Arrays
      if (body.tags) body.tags = body.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      else delete body.tags
      if (body.searchNeighborhoods) body.searchNeighborhoods = body.searchNeighborhoods.split(',').map((t: string) => t.trim()).filter(Boolean)
      else delete body.searchNeighborhoods
      if (body.searchCities) body.searchCities = body.searchCities.split(',').map((t: string) => t.trim()).filter(Boolean)
      else delete body.searchCities
      // Limpar campos vazios
      Object.keys(body).forEach(k => {
        if (body[k] === '' || (Array.isArray(body[k]) && body[k].length === 0)) delete body[k]
      })
      return financeApi.createClient(token!, body)
    },
    onSuccess: (client) => {
      queryClient.invalidateQueries({ queryKey: ['finance-clients'] })
      router.push(`/dashboard/clientes/${client.id}`)
    },
    onError: (err: any) => {
      if (err.message?.includes('DOCUMENT_ALREADY_EXISTS')) {
        setError('Já existe um cliente cadastrado com este CPF/CNPJ.')
      } else {
        setError(err.message ?? 'Erro ao criar cliente')
      }
    },
  })

  function set(key: string, value: any) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function toggleRole(role: string) {
    setForm(f => ({
      ...f,
      roles: f.roles.includes(role)
        ? f.roles.filter(r => r !== role)
        : [...f.roles, role],
    }))
  }

  function toggleSearchPropertyType(type: string) {
    setForm(f => ({
      ...f,
      searchPropertyType: f.searchPropertyType.includes(type)
        ? f.searchPropertyType.filter(t => t !== type)
        : [...f.searchPropertyType, type],
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.name.trim()) { setError('Nome é obrigatório'); return }
    mutation.mutate(form)
  }

  const showSpouse = ['casado', 'uniao_estavel'].includes(form.maritalStatus)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/clientes" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="p-2 rounded-xl bg-indigo-50">
          <UserPlus className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Cliente</h1>
          <p className="text-sm text-gray-500">Proprietário, inquilino, fiador, comprador ou interessado</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Dados Pessoais ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SectionTitle icon={User} title="Dados Pessoais" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <Field label="Nome completo" required>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nome completo do cliente" className={inputCls} required />
              </Field>
            </div>
            <Field label="Sexo">
              <select value={form.sex} onChange={e => set('sex', e.target.value)} className={selectCls}>
                <option value="">Não informado</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="OUTRO">Outro</option>
              </select>
            </Field>
            <Field label="CPF / CNPJ">
              <input value={form.document} onChange={e => set('document', e.target.value)} placeholder="000.000.000-00" className={inputCls} />
            </Field>
            <Field label="RG">
              <input value={form.rg} onChange={e => set('rg', e.target.value)} placeholder="Número do RG" className={inputCls} />
            </Field>
            <Field label="Órgão emissor RG">
              <input value={form.rgIssuer} onChange={e => set('rgIssuer', e.target.value)} placeholder="SSP, DETRAN..." className={inputCls} />
            </Field>
            <Field label="Data emissão RG">
              <input type="date" value={form.rgIssueDate} onChange={e => set('rgIssueDate', e.target.value)} className={inputCls} />
            </Field>
            <Field label="UF emissão RG">
              <select value={form.rgState} onChange={e => set('rgState', e.target.value)} className={selectCls}>
                <option value="">UF</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
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
            <Field label="Escolaridade">
              <select value={form.education} onChange={e => set('education', e.target.value)} className={selectCls}>
                {EDUCATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Profissão">
              <input value={form.profession} onChange={e => set('profession', e.target.value)} placeholder="Ex: Engenheiro, Médico..." className={inputCls} />
            </Field>
            <Field label="Cargo / Função">
              <input value={form.cargo} onChange={e => set('cargo', e.target.value)} placeholder="Ex: Gerente, Diretor..." className={inputCls} />
            </Field>
            <Field label="Ramo de atividade">
              <input value={form.businessSector} onChange={e => set('businessSector', e.target.value)} placeholder="Ex: Comércio, Saúde, TI..." className={inputCls} />
            </Field>
          </div>

          {/* CNH */}
          <div className="mt-4 pt-4 border-t border-gray-50">
            <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">CNH (Carteira de Motorista)</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Número da CNH">
                <input value={form.cnh} onChange={e => set('cnh', e.target.value)} placeholder="Número da CNH" className={inputCls} />
              </Field>
              <Field label="Categoria">
                <input value={form.cnhCategory} onChange={e => set('cnhCategory', e.target.value)} placeholder="A, B, AB, C, D, E..." className={inputCls} />
              </Field>
              <Field label="Validade">
                <input type="date" value={form.cnhExpiry} onChange={e => set('cnhExpiry', e.target.value)} className={inputCls} />
              </Field>
            </div>
          </div>

          {/* Passaporte */}
          <div className="mt-4 pt-4 border-t border-gray-50">
            <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">Passaporte</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Número do passaporte">
                <input value={form.passportNumber} onChange={e => set('passportNumber', e.target.value)} placeholder="Número do passaporte" className={inputCls} />
              </Field>
              <Field label="Validade">
                <input type="date" value={form.passportExpiry} onChange={e => set('passportExpiry', e.target.value)} className={inputCls} />
              </Field>
            </div>
          </div>

          {/* Papéis */}
          <div className="mt-4 pt-4 border-t border-gray-50">
            <label className="block text-xs font-medium text-gray-600 mb-2">Papel(is) no sistema</label>
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map(({ value, label }) => (
                <button key={value} type="button" onClick={() => toggleRole(value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    form.roles.includes(value) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Empresa Empregadora ── */}
        <CollapsibleSection title="Empresa Empregadora" icon={Building2}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <Field label="Nome da empresa">
                <input value={form.employerName} onChange={e => set('employerName', e.target.value)} placeholder="Razão social ou nome fantasia" className={inputCls} />
              </Field>
            </div>
            <Field label="CNPJ da empresa">
              <input value={form.employerCnpj} onChange={e => set('employerCnpj', e.target.value)} placeholder="00.000.000/0000-00" className={inputCls} />
            </Field>
            <div className="lg:col-span-2">
              <Field label="Endereço da empresa">
                <input value={form.employerAddress} onChange={e => set('employerAddress', e.target.value)} placeholder="Endereço completo" className={inputCls} />
              </Field>
            </div>
            <Field label="Telefone da empresa">
              <input value={form.employerPhone} onChange={e => set('employerPhone', e.target.value)} placeholder="(00) 0000-0000" className={inputCls} />
            </Field>
          </div>
        </CollapsibleSection>

        {/* ── Cônjuge (condicional) ── */}
        {showSpouse && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <SectionTitle icon={Heart} title="Dados do Cônjuge" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <Field label="Nome do cônjuge">
                  <input value={form.spouseName} onChange={e => set('spouseName', e.target.value)} placeholder="Nome completo do cônjuge" className={inputCls} />
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

        {/* ── Renda ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SectionTitle icon={DollarSign} title="Renda" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Renda mensal (R$)" hint="Renda bruta mensal do titular">
              <input value={form.income} onChange={e => set('income', e.target.value)} placeholder="0,00" className={inputCls} />
            </Field>
          </div>
        </div>

        {/* ── Contato ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SectionTitle icon={Phone} title="Contato" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Celular">
              <input value={form.phoneMobile} onChange={e => set('phoneMobile', e.target.value)} placeholder="(00) 90000-0000" className={inputCls} />
            </Field>
            <Field label="WhatsApp">
              <input value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="(00) 90000-0000" className={inputCls} />
            </Field>
            <Field label="Telefone fixo">
              <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(00) 0000-0000" className={inputCls} />
            </Field>
            <Field label="Telefone residencial">
              <input value={form.phoneResidential} onChange={e => set('phoneResidential', e.target.value)} placeholder="(00) 0000-0000" className={inputCls} />
            </Field>
            <Field label="Telefone comercial">
              <input value={form.phoneWork} onChange={e => set('phoneWork', e.target.value)} placeholder="(00) 0000-0000" className={inputCls} />
            </Field>
            <div className="md:col-span-2">
              <Field label="E-mail">
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@exemplo.com" className={inputCls} />
              </Field>
            </div>
            <Field label="Instagram">
              <input value={form.instagram} onChange={e => set('instagram', e.target.value)} placeholder="@usuario" className={inputCls} />
            </Field>
            <Field label="Facebook">
              <input value={form.facebook} onChange={e => set('facebook', e.target.value)} placeholder="Nome no Facebook" className={inputCls} />
            </Field>
            <Field label="Site / Blog">
              <input value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://..." className={inputCls} />
            </Field>
            <Field label="Canal preferido de contato">
              <select value={form.contactChannel} onChange={e => set('contactChannel', e.target.value)} className={selectCls}>
                {CONTACT_CHANNEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
          </div>
        </div>

        {/* ── Endereço Residencial ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SectionTitle icon={MapPin} title="Endereço Residencial" />
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

        {/* ── Endereço de Correspondência ── */}
        <CollapsibleSection title="Endereço de Correspondência (se diferente)" icon={Mail}>
          <p className="text-xs text-gray-400 mb-4">Preencha apenas se diferente do endereço residencial</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="CEP">
              <input value={form.mailingZipCode} onChange={e => set('mailingZipCode', e.target.value)} placeholder="00000-000" className={inputCls} />
            </Field>
            <div className="lg:col-span-2">
              <Field label="Logradouro">
                <input value={form.mailingAddress} onChange={e => set('mailingAddress', e.target.value)} placeholder="Rua, Avenida, número..." className={inputCls} />
              </Field>
            </div>
            <Field label="Complemento">
              <input value={form.mailingComplement} onChange={e => set('mailingComplement', e.target.value)} placeholder="Apto, Bloco..." className={inputCls} />
            </Field>
            <Field label="Bairro">
              <input value={form.mailingNeighborhood} onChange={e => set('mailingNeighborhood', e.target.value)} placeholder="Bairro" className={inputCls} />
            </Field>
            <Field label="Cidade">
              <input value={form.mailingCity} onChange={e => set('mailingCity', e.target.value)} placeholder="Cidade" className={inputCls} />
            </Field>
            <Field label="Estado">
              <select value={form.mailingState} onChange={e => set('mailingState', e.target.value)} className={selectCls}>
                <option value="">UF</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
        </CollapsibleSection>

        {/* ── Dados Bancários ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SectionTitle icon={Banknote} title="Dados Bancários" subtitle="Para repasse de aluguel ou pagamentos" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <Field label="Banco" hint="Ex: Banco do Brasil, Caixa, Itaú, Bradesco...">
                <input value={form.bankName} onChange={e => set('bankName', e.target.value)} placeholder="Nome do banco" className={inputCls} />
              </Field>
            </div>
            <Field label="Tipo de conta">
              <select value={form.bankAccountType} onChange={e => set('bankAccountType', e.target.value)} className={selectCls}>
                {BANK_ACCOUNT_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Agência">
              <input value={form.bankBranch} onChange={e => set('bankBranch', e.target.value)} placeholder="0000" className={inputCls} />
            </Field>
            <Field label="Dígito da agência">
              <input value={form.bankAgencyDigit} onChange={e => set('bankAgencyDigit', e.target.value)} placeholder="0" className={inputCls} />
            </Field>
            <Field label="Conta">
              <input value={form.bankAccount} onChange={e => set('bankAccount', e.target.value)} placeholder="00000" className={inputCls} />
            </Field>
            <Field label="Dígito da conta">
              <input value={form.bankAccountDigit} onChange={e => set('bankAccountDigit', e.target.value)} placeholder="0" className={inputCls} />
            </Field>
            <div className="lg:col-span-2">
              <Field label="Chave PIX">
                <input value={form.pixKey} onChange={e => set('pixKey', e.target.value)} placeholder="CPF, e-mail, telefone ou chave aleatória" className={inputCls} />
              </Field>
            </div>
          </div>
          {/* Segunda conta */}
          <div className="mt-4 pt-4 border-t border-gray-50">
            <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">Segunda Conta Bancária (opcional)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Segunda conta">
                <input value={form.bankAccountSecond} onChange={e => set('bankAccountSecond', e.target.value)} placeholder="Número da conta" className={inputCls} />
              </Field>
              <Field label="Tipo">
                <select value={form.bankAccountSecondType} onChange={e => set('bankAccountSecondType', e.target.value)} className={selectCls}>
                  {BANK_ACCOUNT_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
            </div>
          </div>
        </div>

        {/* ── Garantia ── */}
        <CollapsibleSection title="Garantia (Fiador / Caução / Seguro)" icon={Shield}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Tipo de garantia">
              <select value={form.guarantorType} onChange={e => set('guarantorType', e.target.value)} className={selectCls}>
                {GUARANTOR_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Valor da garantia (R$)" hint="Para caução">
              <input value={form.guarantorValue} onChange={e => set('guarantorValue', e.target.value)} placeholder="0,00" className={inputCls} />
            </Field>
            <Field label="Seguradora" hint="Para seguro fiança">
              <input value={form.guarantorInsurance} onChange={e => set('guarantorInsurance', e.target.value)} placeholder="Nome da seguradora" className={inputCls} />
            </Field>
            <Field label="Número da apólice">
              <input value={form.guarantorPolicyNum} onChange={e => set('guarantorPolicyNum', e.target.value)} placeholder="Número da apólice" className={inputCls} />
            </Field>
            <Field label="Vencimento da garantia">
              <input type="date" value={form.guarantorExpiry} onChange={e => set('guarantorExpiry', e.target.value)} className={inputCls} />
            </Field>
          </div>
        </CollapsibleSection>

        {/* ── Preferências de Busca ── */}
        <CollapsibleSection title="Preferências de Busca / Interesse" icon={Search}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Tipo de interesse">
              <select value={form.searchType} onChange={e => set('searchType', e.target.value)} className={selectCls}>
                {SEARCH_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Preço mínimo (R$)">
              <input value={form.searchMinPrice} onChange={e => set('searchMinPrice', e.target.value)} placeholder="0,00" className={inputCls} />
            </Field>
            <Field label="Preço máximo (R$)">
              <input value={form.searchMaxPrice} onChange={e => set('searchMaxPrice', e.target.value)} placeholder="0,00" className={inputCls} />
            </Field>
            <Field label="Área mínima (m²)">
              <input type="number" value={form.searchMinArea} onChange={e => set('searchMinArea', e.target.value)} placeholder="0" className={inputCls} />
            </Field>
            <Field label="Área máxima (m²)">
              <input type="number" value={form.searchMaxArea} onChange={e => set('searchMaxArea', e.target.value)} placeholder="0" className={inputCls} />
            </Field>
            <Field label="Dormitórios mínimos">
              <input type="number" min="0" value={form.searchBedrooms} onChange={e => set('searchBedrooms', e.target.value)} placeholder="0" className={inputCls} />
            </Field>
            <div className="lg:col-span-3">
              <Field label="Tipos de imóvel de interesse" hint="Clique para selecionar">
                <div className="flex flex-wrap gap-2 mt-1">
                  {PROPERTY_TYPES.map(type => (
                    <button key={type} type="button" onClick={() => toggleSearchPropertyType(type)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                        form.searchPropertyType.includes(type) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                      }`}>
                      {PROPERTY_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
            <div className="lg:col-span-2">
              <Field label="Bairros de interesse" hint="Separe por vírgula">
                <input value={form.searchNeighborhoods} onChange={e => set('searchNeighborhoods', e.target.value)} placeholder="Centro, Jardim América, Vila Nova..." className={inputCls} />
              </Field>
            </div>
            <Field label="Cidades de interesse" hint="Separe por vírgula">
              <input value={form.searchCities} onChange={e => set('searchCities', e.target.value)} placeholder="São Paulo, Campinas..." className={inputCls} />
            </Field>
            <div className="lg:col-span-3">
              <Field label="Observações sobre a busca">
                <textarea value={form.searchNotes} onChange={e => set('searchNotes', e.target.value)} placeholder="Detalhes sobre o que o cliente está procurando..." rows={2} className={inputCls + ' resize-none'} />
              </Field>
            </div>
          </div>
        </CollapsibleSection>

        {/* ── Controle Interno / CRM ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SectionTitle icon={Thermometer} title="Controle Interno / CRM" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Termômetro de negociação">
              <select value={form.negotiationTemp} onChange={e => set('negotiationTemp', e.target.value)} className={selectCls}>
                {NEGOTIATION_TEMP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Categoria principal">
              <select value={form.category} onChange={e => set('category', e.target.value)} className={selectCls}>
                <option value="">Não definida</option>
                <option value="LANDLORD">Proprietário</option>
                <option value="TENANT">Inquilino</option>
                <option value="GUARANTOR">Fiador</option>
                <option value="BENEFICIARY">Favorecido</option>
                <option value="BUYER">Comprador</option>
                <option value="SELLER">Vendedor</option>
              </select>
            </Field>
            <Field label="Avaliação interna (1-5)">
              <select value={form.rating} onChange={e => set('rating', e.target.value)} className={selectCls}>
                <option value="">Não avaliado</option>
                <option value="1">⭐ 1 — Muito baixo</option>
                <option value="2">⭐⭐ 2 — Baixo</option>
                <option value="3">⭐⭐⭐ 3 — Médio</option>
                <option value="4">⭐⭐⭐⭐ 4 — Alto</option>
                <option value="5">⭐⭐⭐⭐⭐ 5 — Excelente</option>
              </select>
            </Field>
            <Field label="Captador / Corretor responsável">
              <input value={form.captorName} onChange={e => set('captorName', e.target.value)} placeholder="Nome do corretor" className={inputCls} />
            </Field>
            <Field label="Último contato">
              <input type="date" value={form.lastContactAt} onChange={e => set('lastContactAt', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Próximo contato agendado">
              <input type="date" value={form.nextContactAt} onChange={e => set('nextContactAt', e.target.value)} className={inputCls} />
            </Field>
            <div className="lg:col-span-3">
              <Field label="Tags" hint="Separe por vírgula: ex: vip, urgente, indicação">
                <input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="vip, indicação, urgente..." className={inputCls} />
              </Field>
            </div>
          </div>
        </div>

        {/* ── Observações ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SectionTitle icon={FileText} title="Observações e Notas" />
          <div className="space-y-4">
            <Field label="Notas rápidas" hint="Visível apenas para a equipe">
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Notas rápidas sobre o cliente..." rows={3} className={inputCls + ' resize-none'} />
            </Field>
            <Field label="Observações detalhadas" hint="Histórico, pendências, informações importantes">
              <textarea value={form.observations} onChange={e => set('observations', e.target.value)} placeholder="Observações mais detalhadas sobre o cliente, histórico de relacionamento, pendências..." rows={4} className={inputCls + ' resize-none'} />
            </Field>
          </div>
        </div>

        {/* ── Ações ── */}
        <div className="flex gap-3 justify-end">
          <Link href="/dashboard/clientes" className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            Cancelar
          </Link>
          <button type="submit" disabled={mutation.isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {mutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
            ) : (
              <><Save className="w-4 h-4" /> Salvar cliente</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

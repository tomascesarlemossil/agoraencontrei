'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { VoiceInputButton } from '@/components/ui/VoiceInputButton'
import {
  Upload, Brain, Search, User, FileText, DollarSign, CheckCircle,
  Rocket, X, ChevronRight, ChevronLeft, Loader2, Building2,
  Phone, Mail, CreditCard, Shield, CalendarDays, AlertCircle,
  MessageSquare, Printer, Key,
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

// ── Types ────────────────────────────────────────────────────────────────────

interface ClientResult {
  id: string
  name: string
  document?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
}

interface PropertyResult {
  id: string
  title: string
  reference?: string | null
  street?: string | null
  number?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  priceRent?: number | null
  type?: string
}

interface WizardData {
  // Step 0 – AI extracted
  aiRaw: string

  // Step 1 – Property
  propertyId: string
  propertyCode: string
  propertyAddress: string
  propertyNeighborhood: string
  guaranteeType: 'fiador' | 'caucao' | 'seguro' | ''

  // Step 2 – Tenant + Guarantor
  tenantId: string
  tenantName: string
  tenantCpf: string
  tenantRg: string
  tenantPhone: string
  tenantEmail: string
  tenantAddress: string

  guarantorId: string
  guarantorName: string
  guarantorCpf: string
  guarantorRg: string
  guarantorPhone: string
  guarantorEmail: string
  guarantorAddress: string

  // Step 3 – Financial
  rentValue: string
  dueDay: string
  startDate: string
  endDate: string
  adjustmentIndex: 'IGPM' | 'IPCA' | 'FIXO'
  adjustmentPercent: string
  adjustmentMonth: string
  penaltyPercent: string
  adminFeePercent: string
  caucaoValue: string
  iptuAnnual: string
  iptuParcels: string
  bankFee: string
  fireInsurance: boolean
  fireInsuranceValue: string
  autoBoleto: boolean
  sendBoletoWhatsapp: boolean
  sendBoletoEmail: boolean

  // Step 4 – contract HTML
  contractHtml: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function inputCls(extra = '') {
  return `w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 ${extra}`
}

function labelCls() {
  return 'block text-xs font-medium text-gray-500 mb-1.5'
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 mt-1">
      {children}
    </h3>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ClientSearchField({
  label,
  value,
  onChange,
  onSelect,
  token,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  onSelect: (c: ClientResult) => void
  token: string
  placeholder?: string
}) {
  const [results, setResults] = useState<ClientResult[]>([])
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(
    async (q: string) => {
      if (q.length < 2) { setResults([]); return }
      setLoading(true)
      try {
        const res = await fetch(
          `${API_URL}/api/v1/finance/clients?search=${encodeURIComponent(q)}&limit=8`,
          { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' },
        )
        const data = await res.json()
        setResults(data.data ?? [])
      } catch { setResults([]) }
      finally { setLoading(false) }
    },
    [token],
  )

  function handleChange(v: string) {
    onChange(v)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => search(v), 300)
  }

  return (
    <div className="relative">
      <label className={labelCls()}>{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={e => handleChange(e.target.value)}
          placeholder={placeholder ?? 'Nome, CPF ou telefone...'}
          className={inputCls('flex-1')}
        />
        <VoiceInputButton onResult={v => handleChange(v)} />
      </div>
      {loading && (
        <p className="text-xs text-gray-400 mt-1">Buscando...</p>
      )}
      {results.length > 0 && (
        <div className="absolute z-20 bg-white border border-gray-200 rounded-xl shadow-lg w-full mt-1 max-h-48 overflow-y-auto">
          {results.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => { onSelect(c); setResults([]) }}
              className="w-full text-left px-3 py-2 hover:bg-purple-50 text-sm"
            >
              <span className="font-medium text-gray-800">{c.name}</span>
              {c.document && <span className="ml-2 text-xs text-gray-400">{c.document}</span>}
              {c.phone && <span className="ml-2 text-xs text-gray-400">{c.phone}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Steps labels ─────────────────────────────────────────────────────────────

const STEPS = [
  { icon: Upload,        label: 'Documentos' },
  { icon: Building2,     label: 'Imóvel' },
  { icon: User,          label: 'Partes' },
  { icon: DollarSign,    label: 'Financeiro' },
  { icon: FileText,      label: 'Revisão' },
  { icon: Rocket,        label: 'Pós-contrato' },
]

// ── Main page ─────────────────────────────────────────────────────────────────

const defaultData: WizardData = {
  aiRaw: '',
  propertyId: '', propertyCode: '', propertyAddress: '', propertyNeighborhood: '',
  guaranteeType: '',
  tenantId: '', tenantName: '', tenantCpf: '', tenantRg: '',
  tenantPhone: '', tenantEmail: '', tenantAddress: '',
  guarantorId: '', guarantorName: '', guarantorCpf: '', guarantorRg: '',
  guarantorPhone: '', guarantorEmail: '', guarantorAddress: '',
  rentValue: '', dueDay: '5', startDate: '', endDate: '',
  adjustmentIndex: 'IGPM', adjustmentPercent: '3', adjustmentMonth: '',
  penaltyPercent: '3',
  adminFeePercent: '10', caucaoValue: '',
  iptuAnnual: '', iptuParcels: '8', bankFee: '3.50',
  fireInsurance: true,
  fireInsuranceValue: '', autoBoleto: false, sendBoletoWhatsapp: false,
  sendBoletoEmail: false, contractHtml: '',
}

export default function NovoContratoPage() {
  const token = useAuthStore(s => s.accessToken)
  const router = useRouter()

  const [step, setStep] = useState(0)
  const [data, setData] = useState<WizardData>(defaultData)
  const [files, setFiles] = useState<File[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [propSearch, setPropSearch] = useState('')
  const [propResults, setPropResults] = useState<PropertyResult[]>([])
  const [propLoading, setPropLoading] = useState(false)
  const [genLoading, setGenLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [savedContractId, setSavedContractId] = useState('')
  const [savedContract, setSavedContract] = useState<any>(null)
  const [globalError, setGlobalError] = useState('')

  const set = (k: keyof WizardData, v: any) =>
    setData(d => ({ ...d, [k]: v }))

  // ── Step 0: AI document analysis ─────────────────────────────────────────

  async function handleAiAnalyze() {
    if (!files.length || !token) return
    setAiLoading(true)
    setAiError('')
    try {
      const toBase64 = (f: File): Promise<string> =>
        new Promise((res, rej) => {
          const r = new FileReader()
          r.onload = () => res((r.result as string).split(',')[1] ?? '')
          r.onerror = rej
          r.readAsDataURL(f)
        })

      // Normaliza mediaType: HEIC/HEIF do iPhone → image/jpeg (Claude não suporta HEIC)
      const normalizeType = (t: string) => {
        if (t === 'image/heic' || t === 'image/heif' || t === '') return 'image/jpeg'
        return t
      }
      const images = await Promise.all(
        files
          .filter(f => f.type.startsWith('image/') || f.type === '')
          .map(async f => ({ base64: await toBase64(f), mediaType: normalizeType(f.type) })),
      )

      const resp = await fetch(`${API_URL}/api/v1/agents/documents/identify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          images,
          text: 'Extraia todos os dados de locação destes documentos: inquilino, proprietário, imóvel, valor, datas, fiador. Retorne em JSON com os campos: tenantName, tenantCpf, tenantRg, tenantPhone, tenantEmail, tenantAddress, guarantorName, guarantorCpf, guarantorRg, guarantorPhone, propertyAddress, propertyNeighborhood, rentValue, dueDay, startDate, endDate, adjustmentIndex',
        }),
      })

      if (!resp.ok) throw new Error('Erro na análise de documentos')
      const result = await resp.json()
      // A API retorna { templateId, confidence, extractedData, reasoning }
      // extractedData contém os campos no formato do sistema (locatario_nome, etc.)
      // Mas também pode retornar campos diretos no nível raiz
      const raw = result?.extractedData ?? result?.result ?? result
      // Mapeamento: campos do sistema legado → campos do wizard
      const extracted = {
        tenantName:           raw.locatario_nome   ?? raw.tenantName           ?? raw.nome_completo ?? raw.nome,
        tenantCpf:            raw.locatario_cpf    ?? raw.tenantCpf            ?? raw.cpf,
        tenantRg:             raw.locatario_rg     ?? raw.tenantRg             ?? raw.rg,
        tenantPhone:          raw.locatario_tel    ?? raw.tenantPhone          ?? raw.telefone ?? raw.celular,
        tenantEmail:          raw.locatario_email  ?? raw.tenantEmail          ?? raw.email,
        tenantAddress:        raw.locatario_endereco_atual ?? raw.tenantAddress ?? raw.endereco,
        guarantorName:        raw.fiador_nome      ?? raw.guarantorName,
        guarantorCpf:         raw.fiador_cpf       ?? raw.guarantorCpf,
        guarantorRg:          raw.fiador_rg        ?? raw.guarantorRg,
        guarantorPhone:       raw.fiador_tel       ?? raw.guarantorPhone,
        propertyAddress:      raw.imovel_endereco  ?? raw.propertyAddress,
        propertyNeighborhood: raw.imovel_bairro    ?? raw.propertyNeighborhood,
        rentValue:            raw.valor_aluguel    ?? raw.rentValue,
        dueDay:               raw.dia_vencimento   ?? raw.dueDay,
        startDate:            raw.data_inicio      ?? raw.startDate,
        endDate:              raw.data_fim         ?? raw.endDate,
        adjustmentIndex:      raw.indice_reajuste  ?? raw.adjustmentIndex,
      }

      // Auto-fill wizard fields from AI extraction
      setData(d => ({
        ...d,
        aiRaw: JSON.stringify(raw, null, 2),
        tenantName:           extracted.tenantName           ?? d.tenantName,
        tenantCpf:            extracted.tenantCpf            ?? d.tenantCpf,
        tenantRg:             extracted.tenantRg             ?? d.tenantRg,
        tenantPhone:          extracted.tenantPhone          ?? d.tenantPhone,
        tenantEmail:          extracted.tenantEmail          ?? d.tenantEmail,
        tenantAddress:        extracted.tenantAddress        ?? d.tenantAddress,
        guarantorName:        extracted.guarantorName        ?? d.guarantorName,
        guarantorCpf:         extracted.guarantorCpf         ?? d.guarantorCpf,
        guarantorRg:          extracted.guarantorRg          ?? d.guarantorRg,
        guarantorPhone:       extracted.guarantorPhone       ?? d.guarantorPhone,
        propertyAddress:      extracted.propertyAddress      ?? d.propertyAddress,
        propertyNeighborhood: extracted.propertyNeighborhood ?? d.propertyNeighborhood,
        rentValue:            extracted.rentValue ? String(extracted.rentValue) : d.rentValue,
        dueDay:               extracted.dueDay   ? String(extracted.dueDay)    : d.dueDay,
        startDate:            extracted.startDate            ?? d.startDate,
        endDate:              extracted.endDate              ?? d.endDate,
        adjustmentIndex:      extracted.adjustmentIndex      ?? d.adjustmentIndex,
      }))
    } catch (e: any) {
      setAiError(e.message ?? 'Erro desconhecido')
    } finally {
      setAiLoading(false)
    }
  }

  // ── Step 1: Property search ───────────────────────────────────────────────

  const propTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function searchProperties(q: string) {
    if (q.length < 2) { setPropResults([]); return }
    setPropLoading(true)
    try {
      const res = await fetch(
        `${API_URL}/api/v1/properties?search=${encodeURIComponent(q)}&limit=8`,
        { headers: { Authorization: `Bearer ${token!}` }, credentials: 'include' },
      )
      const json = await res.json()
      setPropResults(json.data ?? [])
    } catch { setPropResults([]) }
    finally { setPropLoading(false) }
  }

  function handlePropSearch(v: string) {
    setPropSearch(v)
    if (propTimerRef.current) clearTimeout(propTimerRef.current)
    propTimerRef.current = setTimeout(() => searchProperties(v), 300)
  }

  function selectProperty(p: PropertyResult) {
    setPropResults([])
    setPropSearch(p.title)
    const addr = [p.street, p.number, p.neighborhood, p.city, p.state]
      .filter(Boolean).join(', ')
    setData(d => ({
      ...d,
      propertyId:           p.id,
      propertyCode:         p.reference ?? '',
      propertyAddress:      addr || d.propertyAddress,
      propertyNeighborhood: p.neighborhood ?? d.propertyNeighborhood,
      rentValue:            p.priceRent ? String(p.priceRent) : d.rentValue,
    }))
  }

  // ── Step 2: Tenant/guarantor auto-fill from client search ─────────────────

  function fillTenant(c: ClientResult) {
    setData(d => ({
      ...d,
      tenantId:      c.id,
      tenantName:    c.name,
      tenantCpf:     c.document ?? d.tenantCpf,
      tenantPhone:   c.phone    ?? d.tenantPhone,
      tenantEmail:   c.email    ?? d.tenantEmail,
      tenantAddress: c.address  ?? d.tenantAddress,
    }))
  }

  function fillGuarantor(c: ClientResult) {
    setData(d => ({
      ...d,
      guarantorId:      c.id,
      guarantorName:    c.name,
      guarantorCpf:     c.document ?? d.guarantorCpf,
      guarantorPhone:   c.phone    ?? d.guarantorPhone,
      guarantorEmail:   c.email    ?? d.guarantorEmail,
      guarantorAddress: c.address  ?? d.guarantorAddress,
    }))
  }

  // ── Step 4: Generate contract via AI ─────────────────────────────────────

  async function generateContract() {
    if (!token) return
    setGenLoading(true)
    setGlobalError('')
    try {
      // Monta o formData com todos os dados do wizard
      const formData: Record<string, string> = {
        imovel_endereco: data.propertyAddress,
        locatario_nome: data.tenantName,
        locatario_cpf: data.tenantCpf,
        locatario_rg: data.tenantRg,
        locatario_telefone: data.tenantPhone,
        locatario_email: data.tenantEmail,
        locatario_endereco_atual: data.tenantAddress,
        fiador_nome: data.guarantorName || '',
        fiador_cpf: data.guarantorCpf || '',
        fiador_rg: data.guarantorRg || '',
        fiador_telefone: data.guarantorPhone || '',
        valor_aluguel: `R$ ${data.rentValue}`,
        dia_vencimento: data.dueDay,
        data_inicio: data.startDate,
        data_fim: data.endDate,
        reajuste: `${data.adjustmentIndex} ${data.adjustmentPercent}% ao ano`,
        multa_rescisoria: `${data.penaltyPercent}%`,
        taxa_administrativa: `${data.adminFeePercent}%`,
        caucao: data.caucaoValue ? `R$ ${data.caucaoValue}` : 'Não aplicado',
        seguro_incendio: data.fireInsurance ? `Obrigatório - R$ ${data.fireInsuranceValue || 'a calcular'}` : 'Não incluso',
        garantia_tipo: data.guaranteeType || '',
      }

      const templateContent = `Contrato de Locação Residencial conforme Lei do Inquilinato (Lei 8.245/91).
Inclua todas as cláusulas padrão: objeto, prazo, valor, vencimento, reajuste, multa, garantia, obrigações das partes, rescisão e disposições gerais.
Use estilos CSS inline para impressão A4. Inclua espaço para assinaturas ao final.`

      const resp = await fetch(`${API_URL}/api/v1/agents/documents/generate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          templateId: 'contrato-locacao-residencial',
          templateContent,
          formData,
          userInstructions: 'Gere o contrato completo com todas as cláusulas padrão da Lei do Inquilinato.',
        }),
      })

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}))
        if (err.error === 'AI_NOT_CONFIGURED') {
          throw new Error('Agente IA não configurado no servidor. Configure a ANTHROPIC_API_KEY.')
        }
        throw new Error(err.message ?? 'Erro ao gerar contrato')
      }
      const result = await resp.json()
      const html = result?.html ?? ''
      if (html) set('contractHtml', html)
    } catch (e: any) {
      setGlobalError(e.message ?? 'Erro ao gerar contrato')
    } finally {
      setGenLoading(false)
    }
  }

  // ── Final save ────────────────────────────────────────────────────────────

  async function saveContract() {
    if (!token) return
    setSaveLoading(true)
    setGlobalError('')
    try {
      const body: Record<string, any> = {
        propertyAddress:      data.propertyAddress,
        legacyPropertyCode:   data.propertyCode || undefined,
        tenantName:           data.tenantName,
        rentValue:            Number(data.rentValue) || undefined,
        tenantDueDay:         Number(data.dueDay) || undefined,
        startDate:            data.startDate || undefined,
        rescissionDate:       data.endDate   || undefined,
        adjustmentIndex:      data.adjustmentIndex,
        adjustmentPercent:    Number(data.adjustmentPercent) || undefined,
        adjustmentMonth:      Number(data.adjustmentMonth)   || undefined,
        penalty:              Number(data.penaltyPercent)    || undefined,
        commission:           Number(data.adminFeePercent)   || undefined,
        iptuAnnual:           Number(data.iptuAnnual)        || undefined,
        iptuParcels:          Number(data.iptuParcels)       || undefined,
        bankFee:              data.bankFee !== '' ? Number(data.bankFee) : undefined,
        contractHtml:         data.contractHtml || undefined,
        guaranteeType:        data.guaranteeType || undefined,
        status:               'ACTIVE',
      }
      // Campos extras do formulário (sempre enviar booleans)
      body.caucaoValue = data.caucaoValue ? Number(data.caucaoValue) : null
      body.fireInsurance = data.fireInsurance
      body.fireInsuranceValue = data.fireInsuranceValue ? Number(data.fireInsuranceValue) : null
      body.autoBoleto = data.autoBoleto
      body.sendBoletoWhatsapp = data.sendBoletoWhatsapp
      body.sendBoletoEmail = data.sendBoletoEmail
      if (data.tenantId)    body.tenantId    = data.tenantId
      if (data.guarantorId) body.guarantorId = data.guarantorId

      const resp = await fetch(`${API_URL}/api/v1/finance/contracts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(body),
      })

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}))
        throw new Error(err.message ?? 'Erro ao salvar contrato')
      }
      const saved = await resp.json()
      setSavedContractId(saved.id ?? '')
      setSavedContract(saved)
      setStep(5)
    } catch (e: any) {
      setGlobalError(e.message)
    } finally {
      setSaveLoading(false)
    }
  }

  // ── WhatsApp send ─────────────────────────────────────────────────────────

  async function sendContractWhatsapp() {
    if (!token || !savedContractId || !data.tenantPhone) return
    try {
      const msg = `Olá ${data.tenantName}! Segue o resumo do seu contrato de locação:\n\nImóvel: ${data.propertyAddress}\nAluguel: R$ ${data.rentValue}\nVencimento: dia ${data.dueDay}\nInício: ${data.startDate}\n\nQualquer dúvida, entre em contato com a Imobiliária Lemos. 🏠`
      await fetch(`${API_URL}/api/v1/whatsapp/send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ to: data.tenantPhone.replace(/\D/g, ''), message: msg }),
      })
      alert('WhatsApp enviado com sucesso!')
    } catch {
      alert('Erro ao enviar WhatsApp.')
    }
  }

  function handlePrint() {
    if (!data.contractHtml) return
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(data.contractHtml)
    w.document.close()
    w.print()
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/dashboard/contratos')}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Contrato de Locação</h1>
          <p className="text-sm text-gray-500">Assistente passo a passo com IA</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {STEPS.map((s, i) => {
          const Icon = s.icon
          const active  = i === step
          const done    = i < step
          return (
            <div key={i} className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  active ? 'bg-purple-600 text-white shadow-sm'
                  : done  ? 'bg-purple-100 text-purple-700 cursor-pointer hover:bg-purple-200'
                  : 'bg-gray-100 text-gray-400 cursor-default'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {s.label}
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />
              )}
            </div>
          )
        })}
      </div>

      {/* Global error */}
      {globalError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {globalError}
          <button className="ml-auto" onClick={() => setGlobalError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ── STEP 0: Documents + AI ─────────────────────────────────────────── */}
      {step === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <SectionTitle>Upload de Documentos</SectionTitle>

          {/* Drop zone */}
          <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-purple-200 rounded-xl p-8 cursor-pointer hover:bg-purple-50 transition-colors">
            <Upload className="w-8 h-8 text-purple-400" />
            <span className="text-sm text-gray-600 text-center">
              Arraste ou clique para adicionar fotos, PDFs, RG, CPF,<br />
              comprovante de residência, fotos da vistoria
            </span>
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              className="sr-only"
              onChange={e => setFiles(Array.from(e.target.files ?? []))}
            />
          </label>

          {files.length > 0 && (
            <div className="space-y-1">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                  <span className="truncate flex-1">{f.name}</span>
                  <span className="text-xs text-gray-400 ml-2">{(f.size / 1024).toFixed(0)} KB</span>
                  <button
                    onClick={() => setFiles(fs => fs.filter((_, j) => j !== i))}
                    className="ml-2 text-red-400 hover:text-red-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {aiError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{aiError}</p>
          )}

          {data.aiRaw && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-green-700 mb-2">
                IA extraiu os dados com sucesso! Revise nos próximos passos.
              </p>
              <details className="text-xs text-gray-500">
                <summary className="cursor-pointer hover:text-gray-700">Ver dados brutos</summary>
                <pre className="mt-2 whitespace-pre-wrap break-all">{data.aiRaw}</pre>
              </details>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              disabled={!files.length || aiLoading}
              onClick={handleAiAnalyze}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
              {aiLoading ? 'Analisando...' : 'Analisar com IA'}
            </button>
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 ml-auto"
            >
              {data.aiRaw ? 'Continuar' : 'Pular'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 1: Property ──────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <SectionTitle>Dados do Imóvel</SectionTitle>

          {/* Smart property search */}
          <div className="relative">
            <label className={labelCls()}>Buscar imóvel cadastrado</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={propSearch}
                  onChange={e => handlePropSearch(e.target.value)}
                  placeholder="Código, endereço ou bairro..."
                  className={inputCls('pl-9')}
                />
              </div>
            </div>
            {propLoading && <p className="text-xs text-gray-400 mt-1">Buscando...</p>}
            {propResults.length > 0 && (
              <div className="absolute z-20 bg-white border border-gray-200 rounded-xl shadow-lg w-full mt-1 max-h-52 overflow-y-auto">
                {propResults.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectProperty(p)}
                    className="w-full text-left px-3 py-2.5 hover:bg-purple-50 text-sm border-b border-gray-50 last:border-0"
                  >
                    <p className="font-medium text-gray-800 truncate">{p.title}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {[p.reference, p.street, p.neighborhood, p.city].filter(Boolean).join(' · ')}
                      {p.priceRent && ` — R$ ${Number(p.priceRent).toLocaleString('pt-BR')}`}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls()}>Código do Imóvel</label>
              <input
                type="text"
                value={data.propertyCode}
                onChange={e => set('propertyCode', e.target.value)}
                placeholder="Ex: LEM-0087"
                className={inputCls()}
              />
            </div>
            <div>
              <label className={labelCls()}>Tipo de Garantia</label>
              <select
                value={data.guaranteeType}
                onChange={e => set('guaranteeType', e.target.value)}
                className={inputCls()}
              >
                <option value="">Selecione...</option>
                <option value="fiador">Fiador</option>
                <option value="caucao">Caução</option>
                <option value="seguro">Seguro Fiança</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls()}>Endereço completo</label>
            <input
              type="text"
              value={data.propertyAddress}
              onChange={e => set('propertyAddress', e.target.value)}
              placeholder="Rua, número, complemento..."
              className={inputCls()}
            />
          </div>

          <div>
            <label className={labelCls()}>Bairro</label>
            <input
              type="text"
              value={data.propertyNeighborhood}
              onChange={e => set('propertyNeighborhood', e.target.value)}
              className={inputCls()}
            />
          </div>

          <div className="flex gap-3 justify-between pt-2">
            <button
              onClick={() => setStep(0)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700"
            >
              Próximo <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Tenant + Guarantor ────────────────────────────────────── */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          {/* Tenant */}
          <SectionTitle>Locatário (Inquilino)</SectionTitle>

          <ClientSearchField
            label="Buscar cliente existente"
            value={data.tenantName}
            onChange={v => set('tenantName', v)}
            onSelect={fillTenant}
            token={token!}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls()}>CPF</label>
              <div className="flex gap-2">
                <input type="text" value={data.tenantCpf} onChange={e => set('tenantCpf', e.target.value)} placeholder="000.000.000-00" className={inputCls('flex-1')} />
                <VoiceInputButton onResult={v => set('tenantCpf', v)} />
              </div>
            </div>
            <div>
              <label className={labelCls()}>RG</label>
              <div className="flex gap-2">
                <input type="text" value={data.tenantRg} onChange={e => set('tenantRg', e.target.value)} className={inputCls('flex-1')} />
                <VoiceInputButton onResult={v => set('tenantRg', v)} />
              </div>
            </div>
            <div>
              <label className={labelCls()}>Telefone</label>
              <div className="flex gap-2">
                <input type="tel" value={data.tenantPhone} onChange={e => set('tenantPhone', e.target.value)} placeholder="(16) 9xxxx-xxxx" className={inputCls('flex-1')} />
                <VoiceInputButton onResult={v => set('tenantPhone', v)} />
              </div>
            </div>
            <div>
              <label className={labelCls()}>E-mail</label>
              <input type="email" value={data.tenantEmail} onChange={e => set('tenantEmail', e.target.value)} className={inputCls()} />
            </div>
          </div>

          <div>
            <label className={labelCls()}>Endereço do Locatário</label>
            <div className="flex gap-2">
              <input type="text" value={data.tenantAddress} onChange={e => set('tenantAddress', e.target.value)} className={inputCls('flex-1')} />
              <VoiceInputButton onResult={v => set('tenantAddress', v)} />
            </div>
          </div>

          {/* Guarantor (only if fiador) */}
          {data.guaranteeType === 'fiador' && (
            <>
              <hr className="border-gray-100" />
              <SectionTitle>Fiador</SectionTitle>

              <ClientSearchField
                label="Buscar fiador existente"
                value={data.guarantorName}
                onChange={v => set('guarantorName', v)}
                onSelect={fillGuarantor}
                token={token!}
                placeholder="Nome, CPF ou telefone do fiador..."
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls()}>CPF do Fiador</label>
                  <div className="flex gap-2">
                    <input type="text" value={data.guarantorCpf} onChange={e => set('guarantorCpf', e.target.value)} placeholder="000.000.000-00" className={inputCls('flex-1')} />
                    <VoiceInputButton onResult={v => set('guarantorCpf', v)} />
                  </div>
                </div>
                <div>
                  <label className={labelCls()}>RG do Fiador</label>
                  <div className="flex gap-2">
                    <input type="text" value={data.guarantorRg} onChange={e => set('guarantorRg', e.target.value)} className={inputCls('flex-1')} />
                    <VoiceInputButton onResult={v => set('guarantorRg', v)} />
                  </div>
                </div>
                <div>
                  <label className={labelCls()}>Telefone do Fiador</label>
                  <div className="flex gap-2">
                    <input type="tel" value={data.guarantorPhone} onChange={e => set('guarantorPhone', e.target.value)} className={inputCls('flex-1')} />
                    <VoiceInputButton onResult={v => set('guarantorPhone', v)} />
                  </div>
                </div>
                <div>
                  <label className={labelCls()}>E-mail do Fiador</label>
                  <input type="email" value={data.guarantorEmail} onChange={e => set('guarantorEmail', e.target.value)} className={inputCls()} />
                </div>
              </div>

              <div>
                <label className={labelCls()}>Endereço do Fiador</label>
                <div className="flex gap-2">
                  <input type="text" value={data.guarantorAddress} onChange={e => set('guarantorAddress', e.target.value)} className={inputCls('flex-1')} />
                  <VoiceInputButton onResult={v => set('guarantorAddress', v)} />
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3 justify-between pt-2">
            <button onClick={() => setStep(1)} className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50">
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
            <button onClick={() => setStep(3)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700">
              Próximo <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Financial ─────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <SectionTitle>Condições Financeiras</SectionTitle>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls()}>Valor do Aluguel (R$)</label>
              <input
                type="number" min="0" step="0.01"
                value={data.rentValue}
                onChange={e => set('rentValue', e.target.value)}
                className={inputCls()}
              />
            </div>
            <div>
              <label className={labelCls()}>Dia de Vencimento</label>
              <input
                type="number" min="1" max="31"
                value={data.dueDay}
                onChange={e => set('dueDay', e.target.value)}
                className={inputCls()}
              />
            </div>
            <div>
              <label className={labelCls()}>Data de Início</label>
              <input
                type="date"
                value={data.startDate}
                onChange={e => {
                  const sd = e.target.value
                  set('startDate', sd)
                  if (sd && !data.endDate) {
                    const d = new Date(sd)
                    d.setFullYear(d.getFullYear() + 1)
                    set('endDate', d.toISOString().slice(0, 10))
                  }
                }}
                className={inputCls()}
              />
            </div>
            <div>
              <label className={labelCls()}>Data de Fim</label>
              <input
                type="date"
                value={data.endDate}
                onChange={e => set('endDate', e.target.value)}
                className={inputCls()}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className={labelCls()}>Índice de Reajuste</label>
              <select value={data.adjustmentIndex} onChange={e => set('adjustmentIndex', e.target.value)} className={inputCls()}>
                <option value="IGPM">IGPM</option>
                <option value="IPCA">IPCA</option>
                <option value="FIXO">Fixo</option>
              </select>
            </div>
            <div>
              <label className={labelCls()}>% Reajuste Anual</label>
              <input type="number" min="0" step="0.01" value={data.adjustmentPercent} onChange={e => set('adjustmentPercent', e.target.value)} className={inputCls()} />
            </div>
            <div>
              <label className={labelCls()}>Mês do Reajuste Anual</label>
              <select value={data.adjustmentMonth} onChange={e => set('adjustmentMonth', e.target.value)} className={inputCls()}>
                <option value="">Selecione...</option>
                <option value="1">1 - Janeiro</option>
                <option value="2">2 - Fevereiro</option>
                <option value="3">3 - Março</option>
                <option value="4">4 - Abril</option>
                <option value="5">5 - Maio</option>
                <option value="6">6 - Junho</option>
                <option value="7">7 - Julho</option>
                <option value="8">8 - Agosto</option>
                <option value="9">9 - Setembro</option>
                <option value="10">10 - Outubro</option>
                <option value="11">11 - Novembro</option>
                <option value="12">12 - Dezembro</option>
              </select>
            </div>
            <div>
              <label className={labelCls()}>Multa Rescisão (%)</label>
              <input type="number" min="0" step="0.01" value={data.penaltyPercent} onChange={e => set('penaltyPercent', e.target.value)} className={inputCls()} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls()}>Taxa Administrativa (%)</label>
              <input type="number" min="0" step="0.01" value={data.adminFeePercent} onChange={e => set('adminFeePercent', e.target.value)} className={inputCls()} />
            </div>
            <div>
              <label className={labelCls()}>Depósito Caução (R$)</label>
              <input type="number" min="0" step="0.01" value={data.caucaoValue} onChange={e => set('caucaoValue', e.target.value)} className={inputCls()} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls()}>IPTU Anual (R$)</label>
              <input type="number" min="0" step="0.01" value={data.iptuAnnual} onChange={e => set('iptuAnnual', e.target.value)} placeholder="Ex: 1200.00" className={inputCls()} />
            </div>
            <div>
              <label className={labelCls()}>Parcelas do IPTU</label>
              <input type="number" min="1" max="12" value={data.iptuParcels} onChange={e => set('iptuParcels', e.target.value)} className={inputCls()} />
            </div>
            <div>
              <label className={labelCls()}>Taxa Bancária por Boleto (R$)</label>
              <input type="number" min="0" step="0.01" value={data.bankFee} onChange={e => set('bankFee', e.target.value)} className={inputCls()} />
            </div>
          </div>

          {/* Fire insurance */}
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl p-3">
            <Shield className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div className="flex-1 space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.fireInsurance}
                  onChange={e => set('fireInsurance', e.target.checked)}
                  className="w-4 h-4 accent-purple-600"
                />
                Seguro Incêndio Obrigatório
              </label>
              {data.fireInsurance && (
                <div>
                  <label className={labelCls()}>Valor do Seguro (R$/ano)</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={data.fireInsuranceValue}
                    onChange={e => set('fireInsuranceValue', e.target.value)}
                    placeholder="Ex: 180.00"
                    className={inputCls()}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Asaas integrations */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={data.autoBoleto}
                onChange={e => set('autoBoleto', e.target.checked)}
                className="w-4 h-4 accent-purple-600"
              />
              <CreditCard className="w-4 h-4 text-gray-500" />
              Gerar boleto automaticamente todo mês (Asaas)
            </label>
            {data.autoBoleto && (
              <div className="ml-6 space-y-1">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.sendBoletoWhatsapp}
                    onChange={e => set('sendBoletoWhatsapp', e.target.checked)}
                    className="w-4 h-4 accent-purple-600"
                  />
                  <MessageSquare className="w-4 h-4 text-green-500" />
                  Enviar boleto por WhatsApp
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.sendBoletoEmail}
                    onChange={e => set('sendBoletoEmail', e.target.checked)}
                    className="w-4 h-4 accent-purple-600"
                  />
                  <Mail className="w-4 h-4 text-blue-500" />
                  Enviar boleto por E-mail
                </label>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-between pt-2">
            <button onClick={() => setStep(2)} className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50">
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
            <button onClick={() => setStep(4)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700">
              Próximo <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Review + Generate ─────────────────────────────────────── */}
      {step === 4 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <SectionTitle>Revisão e Geração do Contrato</SectionTitle>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Property card */}
            <div className="bg-blue-50 rounded-xl p-4 space-y-1">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Imóvel</p>
              <p className="text-sm font-medium text-gray-800">{data.propertyAddress || '—'}</p>
              {data.propertyNeighborhood && <p className="text-xs text-gray-500">{data.propertyNeighborhood}</p>}
              {data.propertyCode && <p className="text-xs text-gray-400">Cód: {data.propertyCode}</p>}
              {data.guaranteeType && <p className="text-xs text-gray-500 capitalize">Garantia: {data.guaranteeType}</p>}
            </div>

            {/* Tenant card */}
            <div className="bg-purple-50 rounded-xl p-4 space-y-1">
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Locatário</p>
              <p className="text-sm font-medium text-gray-800">{data.tenantName || '—'}</p>
              {data.tenantCpf && <p className="text-xs text-gray-500">CPF: {data.tenantCpf}</p>}
              {data.tenantPhone && <p className="text-xs text-gray-500">Tel: {data.tenantPhone}</p>}
            </div>

            {/* Financial card */}
            <div className="bg-green-50 rounded-xl p-4 space-y-1">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Financeiro</p>
              <p className="text-xl font-bold text-gray-800">
                R$ {Number(data.rentValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500">Venc. dia {data.dueDay} · Reajuste {data.adjustmentIndex} {data.adjustmentPercent}%</p>
              <p className="text-xs text-gray-500">
                {data.startDate && `De ${new Date(data.startDate).toLocaleDateString('pt-BR')}`}
                {data.endDate   && ` até ${new Date(data.endDate).toLocaleDateString('pt-BR')}`}
              </p>
            </div>

            {/* Extras card */}
            <div className="bg-amber-50 rounded-xl p-4 space-y-1">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Extras</p>
              <p className="text-xs text-gray-600">Adm: {data.adminFeePercent}% · Multa: {data.penaltyPercent}%</p>
              {data.caucaoValue && <p className="text-xs text-gray-600">Caução: R$ {data.caucaoValue}</p>}
              {data.fireInsurance && <p className="text-xs text-gray-600">Seguro incêndio: {data.fireInsuranceValue ? `R$ ${data.fireInsuranceValue}` : 'Sim'}</p>}
              {data.autoBoleto && <p className="text-xs text-gray-600">Boleto automático Asaas</p>}
            </div>
          </div>

          {/* AI contract generation */}
          <div className="border border-dashed border-purple-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-semibold text-gray-700">Gerar Contrato com IA</span>
            </div>
            <p className="text-xs text-gray-500">
              A IA irá gerar o HTML do contrato com todas as cláusulas legais baseadas nos dados informados.
            </p>
            <button
              type="button"
              disabled={genLoading}
              onClick={generateContract}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 disabled:opacity-50"
            >
              {genLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
              {genLoading ? 'Gerando...' : data.contractHtml ? 'Regerar Contrato IA' : 'Gerar Contrato IA'}
            </button>

            {data.contractHtml && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-medium text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                  Contrato gerado com sucesso! Revise o preview abaixo.
                </p>
                <details className="text-xs">
                  <summary className="cursor-pointer text-purple-600 hover:underline font-medium">
                    Visualizar preview do contrato
                  </summary>
                  <div
                    className="mt-2 border rounded-lg p-3 max-h-96 overflow-y-auto bg-white text-xs"
                    dangerouslySetInnerHTML={{ __html: data.contractHtml }}
                  />
                </details>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-between pt-2">
            <button onClick={() => setStep(3)} className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50">
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
            <button
              disabled={saveLoading}
              onClick={saveContract}
              className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50"
            >
              {saveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {saveLoading ? 'Salvando...' : 'Confirmar e Salvar'}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 5: Post-contract ─────────────────────────────────────────── */}
      {step === 5 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div className="text-center py-4">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-gray-900">Contrato salvo com sucesso!</h2>
            {savedContractId && (
              <p className="text-sm text-gray-500 mt-1">ID: {savedContractId}</p>
            )}
          </div>

          <SectionTitle>Próximos Passos</SectionTitle>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Asaas recurring charge */}
            <button
              onClick={() => {
                if (savedContractId) {
                  router.push(`/dashboard/contratos/${savedContractId}?action=asaas`)
                }
              }}
              className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl text-left transition-colors"
            >
              <CreditCard className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-800">Criar Cobrança Recorrente</p>
                <p className="text-xs text-gray-500">Configura cobranças mensais no Asaas</p>
              </div>
            </button>

            {/* WhatsApp */}
            <button
              onClick={sendContractWhatsapp}
              className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-xl text-left transition-colors"
            >
              <MessageSquare className="w-5 h-5 text-green-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-800">Enviar por WhatsApp</p>
                <p className="text-xs text-gray-500">{data.tenantPhone || 'Telefone não informado'}</p>
              </div>
            </button>

            {/* Print */}
            <button
              onClick={handlePrint}
              disabled={!data.contractHtml}
              className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-left transition-colors disabled:opacity-40"
            >
              <Printer className="w-5 h-5 text-gray-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-800">Imprimir / Download PDF</p>
                <p className="text-xs text-gray-500">
                  {data.contractHtml ? 'Abre o contrato para impressão' : 'Contrato HTML não gerado'}
                </p>
              </div>
            </button>

            {/* Vistoria */}
            <button
              onClick={() => {
                if (savedContractId) {
                  router.push(`/dashboard/contratos/${savedContractId}?action=vistoria`)
                }
              }}
              className="flex items-center gap-3 p-4 bg-amber-50 hover:bg-amber-100 rounded-xl text-left transition-colors"
            >
              <Key className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-800">Registro de Entrega de Chaves</p>
                <p className="text-xs text-gray-500">Registrar vistoria de entrada</p>
              </div>
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => router.push(`/dashboard/contratos/${savedContractId}`)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700"
            >
              <FileText className="w-4 h-4" />
              Ver Contrato
            </button>
            <button
              onClick={() => router.push('/dashboard/contratos')}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50"
            >
              Voltar à lista
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

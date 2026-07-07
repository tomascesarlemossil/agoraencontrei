'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  User, Mail, Phone, Building2, Award, MapPin, Instagram, Globe,
  CheckCircle2, ChevronRight, Loader2, X, Plus, Trash2, ImageIcon,
  Video, Star, Sparkles, CreditCard, QrCode, FileText,
  Copy, ExternalLink, Layout, DollarSign, ArrowLeft,
} from 'lucide-react'
import {
  DIVULGUE_CATEGORIES, CATEGORY_GROUPS, BUSINESS_TYPES,
  AD_PLAN_BY_ID, LANDING_TEMPLATES, getCategory, formatBRL,
  type AdPlan,
} from '@/lib/divulgue-catalog'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

type Step = 'segment' | 'info' | 'landing' | 'payment' | 'success'
type BillingType = 'PIX' | 'BOLETO' | 'CREDIT_CARD'

interface ServiceItem { name: string; description: string; price: string; priceType: string }
interface ReferenceItem { title: string; url: string; note: string }

interface CheckoutResult {
  subscriptionId?: string
  pixQrCode?: string
  pixCopiaECola?: string
  bankSlipUrl?: string
  invoiceUrl?: string
  paymentUrl?: string
  status?: string
}

// ── Validação de documento ──────────────────────────────────────────────────
function validateCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false
  let s = 0
  for (let i = 0; i < 9; i++) s += parseInt(d[i]) * (10 - i)
  let r = (s * 10) % 11; if (r === 10) r = 0
  if (r !== parseInt(d[9])) return false
  s = 0
  for (let i = 0; i < 10; i++) s += parseInt(d[i]) * (11 - i)
  r = (s * 10) % 11; if (r === 10) r = 0
  return r === parseInt(d[10])
}
function validateCNPJ(cnpj: string): boolean {
  const d = cnpj.replace(/\D/g, '')
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let s = 0; for (let i = 0; i < 12; i++) s += parseInt(d[i]) * w1[i]
  let r = s % 11; const d1 = r < 2 ? 0 : 11 - r
  if (d1 !== parseInt(d[12])) return false
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  s = 0; for (let i = 0; i < 13; i++) s += parseInt(d[i]) * w2[i]
  r = s % 11; const d2 = r < 2 ? 0 : 11 - r
  return d2 === parseInt(d[13])
}
function validateDocument(value: string): { valid: boolean; error: string } {
  const d = value.replace(/\D/g, '')
  if (!d) return { valid: true, error: '' }
  if (d.length <= 11) return d.length < 11 ? { valid: true, error: '' } : (validateCPF(d) ? { valid: true, error: '' } : { valid: false, error: 'CPF inválido' })
  if (d.length < 14) return { valid: true, error: '' }
  return validateCNPJ(d) ? { valid: true, error: '' } : { valid: false, error: 'CNPJ inválido' }
}

// Reduz uma imagem para dataURL leve (máx ~1000px, JPEG 0.82).
function fileToDataUrl(file: File, maxSize = 1000): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = document.createElement('img')
      img.onload = () => {
        let { width, height } = img
        if (width > maxSize || height > maxSize) {
          if (width >= height) { height = Math.round((height * maxSize) / width); width = maxSize }
          else { width = Math.round((width * maxSize) / height); height = maxSize }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) { resolve(reader.result as string); return }
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = reject
      img.src = reader.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const PRICE_TYPES = [
  { value: 'a_partir', label: 'A partir de' },
  { value: 'fixo', label: 'Valor fixo' },
  { value: 'por_m2', label: 'Por m²' },
  { value: 'hora', label: 'Por hora' },
  { value: 'consulta', label: 'Sob consulta' },
]

function CadastroContent() {
  const searchParams = useSearchParams()
  const initialPlan = ((searchParams.get('plano') || 'ESSENCIAL').toUpperCase()) as AdPlan['id']
  const [step, setStep] = useState<Step>('segment')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Seleção
  const [businessType, setBusinessType] = useState<string>('EMPRESA')
  const [segment, setSegment] = useState<string>('')
  // Divulgação é um plano único de preço fixo — não há seleção de tier.
  const adPlanId: AdPlan['id'] = AD_PLAN_BY_ID[initialPlan] ? initialPlan : 'ESSENCIAL'

  // Dados
  const [form, setForm] = useState({
    name: '', email: '', phone: '', whatsapp: '', cpfcnpj: '', crea: '',
    instagram: '', website: '', bio: '',
    street: '', number: '', neighborhood: '', city: 'Franca', state: 'SP', zip: '',
  })
  const [docError, setDocError] = useState('')

  // Landing page
  const [logoUrl, setLogoUrl] = useState('')
  const [template, setTemplate] = useState('classico')
  const [services, setServices] = useState<ServiceItem[]>([])
  const [photos, setPhotos] = useState<string[]>([])
  const [videos, setVideos] = useState<string[]>([])
  const [references, setReferences] = useState<ReferenceItem[]>([])
  const [newPhotoUrl, setNewPhotoUrl] = useState('')
  const [newVideoUrl, setNewVideoUrl] = useState('')
  const logoInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  // Pagamento
  const [billingType, setBillingType] = useState<BillingType>('PIX')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [specialistId, setSpecialistId] = useState('')
  const [profileUrl, setProfileUrl] = useState('')
  const [payResult, setPayResult] = useState<CheckoutResult | null>(null)
  const [copied, setCopied] = useState(false)

  const cat = getCategory(segment)
  const plan = AD_PLAN_BY_ID[adPlanId]

  // Ao escolher segmento, sugere template e pré-carrega os serviços do catálogo.
  useEffect(() => {
    if (cat?.suggestedTemplate) setTemplate(cat.suggestedTemplate)
  }, [segment]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleCatalogService = (name: string) => {
    setServices(prev => {
      const exists = prev.find(s => s.name === name)
      if (exists) return prev.filter(s => s.name !== name)
      if (prev.length >= plan.maxServices) { setError(`Seu plano permite até ${plan.maxServices} serviços. Faça upgrade para adicionar mais.`); return prev }
      setError('')
      return [...prev, { name, description: '', price: '', priceType: 'a_partir' }]
    })
  }
  const updateService = (i: number, patch: Partial<ServiceItem>) =>
    setServices(prev => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))
  const removeService = (i: number) => setServices(prev => prev.filter((_, idx) => idx !== i))
  const addCustomService = () => {
    if (services.length >= plan.maxServices) { setError(`Seu plano permite até ${plan.maxServices} serviços.`); return }
    setServices(prev => [...prev, { name: '', description: '', price: '', priceType: 'a_partir' }])
  }

  const addPhotoUrl = () => {
    const url = newPhotoUrl.trim()
    if (!url) return
    if (photos.length >= plan.maxPhotos) { setError(`Seu plano permite até ${plan.maxPhotos} fotos.`); return }
    setPhotos(prev => [...prev, url]); setNewPhotoUrl(''); setError('')
  }
  const onPhotoFiles = async (files: FileList | null) => {
    if (!files) return
    for (const file of Array.from(files)) {
      if (photos.length >= plan.maxPhotos) { setError(`Seu plano permite até ${plan.maxPhotos} fotos.`); break }
      try { const data = await fileToDataUrl(file); setPhotos(prev => [...prev, data]) } catch { /* ignora arquivo inválido */ }
    }
  }
  const removePhoto = (i: number) => setPhotos(prev => prev.filter((_, idx) => idx !== i))

  const addVideo = () => {
    const url = newVideoUrl.trim()
    if (!url) return
    if (videos.length >= plan.maxVideos) { setError(`Seu plano permite até ${plan.maxVideos} vídeo(s).`); return }
    setVideos(prev => [...prev, url]); setNewVideoUrl(''); setError('')
  }
  const removeVideo = (i: number) => setVideos(prev => prev.filter((_, idx) => idx !== i))

  const onLogoFile = async (file: File | null) => {
    if (!file) return
    try { setLogoUrl(await fileToDataUrl(file, 512)) } catch { /* ignora */ }
  }

  const fmtDoc = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 14)
    if (d.length <= 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4').replace(/\.$|-$/, '')
    return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5')
  }

  // ── Cria o cadastro (Specialist + landing) e inicia o pagamento ────────────
  const handlePay = async () => {
    setError('')
    if (!acceptedTerms) { setError('Aceite os termos para continuar.'); return }
    const doc = form.cpfcnpj.replace(/\D/g, '')
    if (!doc) { setError('Informe seu CPF ou CNPJ para o pagamento.'); return }
    setLoading(true)

    const landingPage = {
      template,
      businessType,
      segment,
      segmentLabel: cat?.label ?? segment,
      headline: `${cat?.label ?? 'Serviços'} — ${form.name}`,
      about: form.bio,
      services: services.filter(s => s.name.trim()),
      photos, videos,
      references: references.filter(r => r.title.trim() || r.url.trim()),
      logoUrl,
      address: {
        street: form.street, number: form.number, neighborhood: form.neighborhood,
        city: form.city, state: form.state, zip: form.zip,
      },
      adPlan: adPlanId,
    }

    try {
      // 1) Cria/atualiza o cadastro
      let sid = specialistId
      if (!sid) {
        const res = await fetch(`${API_URL}/api/v1/specialists`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            phone: form.phone || undefined,
            whatsapp: form.whatsapp || undefined,
            category: cat?.dbCategory ?? 'OUTRO',
            businessType,
            bio: form.bio || undefined,
            city: form.city || 'Franca',
            state: form.state || 'SP',
            crea: form.crea || undefined,
            instagram: form.instagram || undefined,
            website: form.website || undefined,
            cpfcnpj: doc || undefined,
            photoUrl: logoUrl || photos[0] || undefined,
            logoUrl: logoUrl || undefined,
            address: [form.street, form.number, form.neighborhood].filter(Boolean).join(', ') || undefined,
            tags: services.map(s => s.name).filter(Boolean),
            landingPage,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'Erro ao criar cadastro. Tente novamente.')
          setLoading(false); return
        }
        sid = data.data?.id
        setSpecialistId(sid)
        setProfileUrl(data.data?.profileUrl || '')
      }

      // 2) Inicia a cobrança da divulgação (mensal, sem taxa de adesão)
      const payRes = await fetch(`${API_URL}/api/v1/specialists/payments/divulgacao-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specialistId: sid,
          plan: adPlanId,
          billingType,
          cpfCnpj: doc,
          name: form.name,
          email: form.email,
          phone: form.whatsapp || form.phone,
        }),
      })
      const payData = await payRes.json()
      if (!payRes.ok) {
        if (payData.error === 'ASAAS_NOT_CONFIGURED') {
          // Pagamento indisponível: cadastro criado, seguimos para sucesso com aviso.
          setPayResult(null)
          setStep('success')
          setLoading(false)
          return
        }
        setError(payData.message || payData.error || 'Erro ao gerar o pagamento. Tente novamente.')
        setLoading(false); return
      }
      setPayResult(payData)
      setStep('success')
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const copyPix = () => {
    if (payResult?.pixCopiaECola) {
      navigator.clipboard.writeText(payResult.pixCopiaECola)
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    }
  }

  const STEP_LABELS: { key: Step; label: string }[] = [
    { key: 'segment', label: 'Segmento' },
    { key: 'info', label: 'Seus Dados' },
    { key: 'landing', label: 'Sua Página' },
    { key: 'payment', label: 'Pagamento' },
  ]
  const stepIndex = STEP_LABELS.findIndex(s => s.key === step)

  const input = 'w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 bg-white text-[16px]'
  const inputBare = 'w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 bg-white text-[16px]'

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f6f1] to-white">
      {/* Header */}
      <header className="bg-[#143A1F] py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/"><Image src="/brand/ae-lockup-full.png" alt="Agora Encontrei" width={168} height={61} className="h-8 w-auto" /></Link>
          <Link href="/divulgue" className="text-white/70 hover:text-white text-sm transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Sobre a divulgação
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Progress */}
        {step !== 'success' && (
          <div className="flex items-center gap-1 sm:gap-2 mb-8">
            {STEP_LABELS.map((s, i) => (
              <div key={s.key} className="flex items-center gap-1 sm:gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step === s.key ? 'bg-[#C9A84C] text-white' : stepIndex > i ? 'bg-[#143A1F] text-white' : 'bg-gray-200 text-gray-400'
                }`}>{i + 1}</div>
                <span className={`text-xs sm:text-sm hidden sm:block ${step === s.key ? 'text-[#143A1F] font-semibold' : 'text-gray-400'}`}>{s.label}</span>
                {i < STEP_LABELS.length - 1 && <ChevronRight className="w-4 h-4 text-gray-300" />}
              </div>
            ))}
          </div>
        )}

        {/* ─────────────── STEP 1: SEGMENTO ─────────────── */}
        {step === 'segment' && (
          <div>
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest mb-3" style={{ backgroundColor: 'rgba(201,168,76,0.12)', color: '#b8943d' }}>
                <Sparkles className="w-3 h-3" /> Divulgue seu Negócio
              </div>
              <h1 className="text-3xl font-bold text-[#143A1F] mb-2">Crie a página do seu negócio</h1>
              <p className="text-gray-600 text-lg">Apareça no Google e na lista de empresas parceiras do AgoraEncontrei. R$ 39,90/mês.</p>
            </div>

            {/* Tipo de cadastro */}
            <h2 className="text-sm font-semibold text-[#143A1F] mb-3">Como você atua?</h2>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {BUSINESS_TYPES.map(bt => (
                <button key={bt.value} onClick={() => setBusinessType(bt.value)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${businessType === bt.value ? 'border-[#C9A84C] bg-[#C9A84C]/5' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                  <span className="text-2xl">{bt.emoji}</span>
                  <div>
                    <p className="font-semibold text-[#143A1F] text-sm">{bt.label}</p>
                    <p className="text-xs text-gray-500">{bt.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Segmento */}
            <h2 className="text-sm font-semibold text-[#143A1F] mb-3">Qual é o seu segmento?</h2>
            <div className="space-y-6">
              {CATEGORY_GROUPS.map(group => (
                <div key={group}>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[#C9A84C] mb-2">{group}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {DIVULGUE_CATEGORIES.filter(c => c.group === group).map(c => (
                      <button key={c.value}
                        onClick={() => { setSegment(c.value); setServices([]); setStep('info') }}
                        className="flex items-start gap-3 p-3.5 bg-white rounded-xl border-2 border-gray-100 hover:border-[#C9A84C] hover:shadow-sm transition-all text-left group">
                        <span className="text-xl flex-shrink-0">{c.emoji}</span>
                        <div>
                          <p className="font-semibold text-[#143A1F] text-sm leading-tight">{c.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{c.tagline}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─────────────── STEP 2: DADOS ─────────────── */}
        {step === 'info' && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">{cat?.emoji}</span>
              <div>
                <h1 className="text-2xl font-bold text-[#143A1F]">Dados do seu negócio</h1>
                <p className="text-gray-500 text-sm">{cat?.label} · {businessType === 'EMPRESA' ? 'Empresa' : 'Autônomo/MEI'}</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[#143A1F] mb-1.5">{businessType === 'EMPRESA' ? 'Nome da empresa' : 'Seu nome'} *</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={businessType === 'EMPRESA' ? 'Ex.: Construtora Silva' : 'Seu nome completo'} className={input} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#143A1F] mb-1.5">E-mail *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="seu@email.com" className={input} />
                </div>
                <p className="text-xs text-gray-400 mt-1">É por aqui que você acessa o painel para editar sua página.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#143A1F] mb-1.5">Telefone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(16) 3000-0000" className={input} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#143A1F] mb-1.5">WhatsApp *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="tel" value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="(16) 99999-9999" className={input} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#143A1F] mb-1.5">CPF ou CNPJ</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input value={form.cpfcnpj} onChange={e => { const v = fmtDoc(e.target.value); setForm(f => ({ ...f, cpfcnpj: v })); setDocError(validateDocument(v).error) }} placeholder="Necessário para o pagamento" maxLength={18} className={`${input} ${docError ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : ''}`} />
                </div>
                {docError && <p className="text-red-500 text-xs mt-1">{docError}</p>}
              </div>

              {cat?.registryLabel && (
                <div>
                  <label className="block text-sm font-semibold text-[#143A1F] mb-1.5">{cat.registryLabel} (opcional)</label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={form.crea} onChange={e => setForm(f => ({ ...f, crea: e.target.value }))} placeholder="Número do registro profissional" className={input} />
                  </div>
                </div>
              )}

              {/* Endereço */}
              <div className="pt-2">
                <p className="text-sm font-semibold text-[#143A1F] mb-2 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#C9A84C]" /> Endereço de atendimento</p>
                <div className="grid grid-cols-3 gap-3">
                  <input value={form.street} onChange={e => setForm(f => ({ ...f, street: e.target.value }))} placeholder="Rua / Avenida" className={`${inputBare} col-span-2`} />
                  <input value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} placeholder="Número" className={inputBare} />
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <input value={form.neighborhood} onChange={e => setForm(f => ({ ...f, neighborhood: e.target.value }))} placeholder="Bairro" className={inputBare} />
                  <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Cidade" className={inputBare} />
                  <input value={form.zip} onChange={e => setForm(f => ({ ...f, zip: e.target.value }))} placeholder="CEP" className={inputBare} />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">O bairro e a cidade ajudam você a aparecer nas buscas locais do Google.</p>
              </div>

              {/* Redes */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#143A1F] mb-1.5">Instagram</label>
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={form.instagram} onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))} placeholder="@seuperfil" className={input} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#143A1F] mb-1.5">Site</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://seusite.com" className={input} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#143A1F] mb-1.5">Sobre o seu negócio</label>
                <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={4} placeholder="Conte sobre sua experiência, diferenciais e a região que você atende..." className={`${inputBare} resize-none`} />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setStep('segment')} className="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">Voltar</button>
              <button onClick={() => {
                if (!form.name || !form.email || !form.whatsapp) { setError('Preencha nome, e-mail e WhatsApp.'); return }
                if (form.cpfcnpj && !validateDocument(form.cpfcnpj).valid) { setError('Documento inválido.'); return }
                setError(''); setStep('landing')
              }} className="flex-1 bg-[#143A1F] text-white py-3 rounded-xl font-semibold hover:bg-[#0E2A15] transition-colors flex items-center justify-center gap-2">
                Continuar <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-3 text-center">{error}</p>}
          </div>
        )}

        {/* ─────────────── STEP 3: LANDING PAGE ─────────────── */}
        {step === 'landing' && (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[#143A1F] mb-2">Monte sua landing page</h1>
              <p className="text-gray-600">Adicione seus serviços, preços, fotos e vídeos. É isso que os clientes vão ver — e o que o Google vai indexar.</p>
            </div>

            {/* Modelo */}
            <div className="mb-7">
              <p className="text-sm font-semibold text-[#143A1F] mb-2 flex items-center gap-1.5"><Layout className="w-4 h-4 text-[#C9A84C]" /> Modelo da página</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {LANDING_TEMPLATES.map(t => (
                  <button key={t.id} onClick={() => setTemplate(t.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${template === t.id ? 'border-[#C9A84C] bg-[#C9A84C]/5' : 'border-gray-100 hover:border-gray-200'}`}>
                    <div className="h-8 rounded-md mb-2" style={{ background: `linear-gradient(135deg, ${t.accent}, ${t.accent}99)` }} />
                    <p className="text-sm font-semibold text-[#143A1F]">{t.name}</p>
                    <p className="text-[11px] text-gray-500 leading-tight mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Logo */}
            <div className="mb-7">
              <p className="text-sm font-semibold text-[#143A1F] mb-2 flex items-center gap-1.5"><ImageIcon className="w-4 h-4 text-[#C9A84C]" /> Logo do negócio</p>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-white flex-shrink-0">
                  {logoUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    : <ImageIcon className="w-6 h-6 text-gray-300" />}
                </div>
                <div className="flex-1">
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={e => onLogoFile(e.target.files?.[0] ?? null)} />
                  <button onClick={() => logoInputRef.current?.click()} className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 hover:border-[#C9A84C] transition-colors text-[#143A1F]">Enviar logo</button>
                  {logoUrl && <button onClick={() => setLogoUrl('')} className="ml-2 text-sm text-red-500">Remover</button>}
                  <p className="text-xs text-gray-400 mt-1.5">PNG ou JPG. Se não tiver logo, usamos a primeira foto.</p>
                </div>
              </div>
            </div>

            {/* Serviços do catálogo */}
            <div className="mb-7">
              <p className="text-sm font-semibold text-[#143A1F] mb-1 flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-[#C9A84C]" /> Seus serviços e valores</p>
              <p className="text-xs text-gray-500 mb-3">Selecione o que você oferece (até {plan.maxServices} no plano {plan.name}). Depois defina o preço de cada um.</p>
              {(cat?.services.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {cat!.services.map(name => {
                    const on = services.some(s => s.name === name)
                    return (
                      <button key={name} onClick={() => toggleCatalogService(name)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${on ? 'bg-[#143A1F] text-white border-[#143A1F]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#C9A84C]'}`}>
                        {on ? '✓ ' : '+ '}{name}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Cards de serviço com preço */}
              <div className="space-y-3">
                {services.map((s, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-xl p-3.5">
                    <div className="flex items-center gap-2 mb-2">
                      <input value={s.name} onChange={e => updateService(i, { name: e.target.value })} placeholder="Nome do serviço" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-[16px]" />
                      <button onClick={() => removeService(i)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <input value={s.description} onChange={e => updateService(i, { description: e.target.value })} placeholder="Descrição curta (opcional)" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-[16px] mb-2" />
                    <div className="flex gap-2">
                      <select value={s.priceType} onChange={e => updateService(i, { priceType: e.target.value })} className="px-2 py-2 border border-gray-200 rounded-lg text-sm bg-white text-[16px]">
                        {PRICE_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                      <input value={s.price} onChange={e => updateService(i, { price: e.target.value })} disabled={s.priceType === 'consulta'} placeholder={s.priceType === 'consulta' ? 'Sob consulta' : 'R$ 0,00'} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-[16px] disabled:bg-gray-50 disabled:text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={addCustomService} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#143A1F] hover:text-[#C9A84C]"><Plus className="w-4 h-4" /> Adicionar outro serviço</button>
            </div>

            {/* Fotos */}
            <div className="mb-7">
              <p className="text-sm font-semibold text-[#143A1F] mb-1 flex items-center gap-1.5"><ImageIcon className="w-4 h-4 text-[#C9A84C]" /> Fotos do trabalho <span className="text-xs font-normal text-gray-400">({photos.length}/{plan.maxPhotos})</span></p>
              <p className="text-xs text-gray-500 mb-3">Mostre fotos de trabalhos, produtos ou da equipe. Envie do seu dispositivo ou cole um link.</p>
              {photos.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
                  {photos.map((p, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                      <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => onPhotoFiles(e.target.files)} />
                <button onClick={() => photoInputRef.current?.click()} className="px-4 py-2.5 rounded-lg text-sm font-semibold border border-gray-200 hover:border-[#C9A84C] transition-colors text-[#143A1F] whitespace-nowrap">Enviar fotos</button>
                <input value={newPhotoUrl} onChange={e => setNewPhotoUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addPhotoUrl())} placeholder="ou cole um link de imagem" className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-[16px]" />
                <button onClick={addPhotoUrl} className="px-3 py-2.5 rounded-lg bg-[#143A1F] text-white text-sm"><Plus className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Vídeos */}
            <div className="mb-7">
              <p className="text-sm font-semibold text-[#143A1F] mb-1 flex items-center gap-1.5"><Video className="w-4 h-4 text-[#C9A84C]" /> Vídeos <span className="text-xs font-normal text-gray-400">({videos.length}/{plan.maxVideos})</span></p>
              <p className="text-xs text-gray-500 mb-3">Cole links do YouTube, Instagram ou Reels.</p>
              {videos.length > 0 && (
                <div className="space-y-2 mb-3">
                  {videos.map((v, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                      <Video className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="flex-1 text-sm text-gray-600 truncate">{v}</span>
                      <button onClick={() => removeVideo(i)} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input value={newVideoUrl} onChange={e => setNewVideoUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addVideo())} placeholder="https://youtube.com/..." className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-[16px]" />
                <button onClick={addVideo} className="px-3 py-2.5 rounded-lg bg-[#143A1F] text-white text-sm"><Plus className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Referências */}
            <div className="mb-4">
              <p className="text-sm font-semibold text-[#143A1F] mb-1 flex items-center gap-1.5"><Star className="w-4 h-4 text-[#C9A84C]" /> Referências e trabalhos anteriores</p>
              <p className="text-xs text-gray-500 mb-3">Obras, clientes atendidos, condomínios onde já trabalhou ou links de portfólio.</p>
              <div className="space-y-2">
                {references.map((r, i) => (
                  <div key={i} className="flex gap-2">
                    <input value={r.title} onChange={e => setReferences(prev => prev.map((x, idx) => idx === i ? { ...x, title: e.target.value } : x))} placeholder="Ex.: Reforma no Ed. Prime Franca" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-[16px]" />
                    <input value={r.url} onChange={e => setReferences(prev => prev.map((x, idx) => idx === i ? { ...x, url: e.target.value } : x))} placeholder="link (opcional)" className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm text-[16px]" />
                    <button onClick={() => setReferences(prev => prev.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
              <button onClick={() => setReferences(prev => [...prev, { title: '', url: '', note: '' }])} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#143A1F] hover:text-[#C9A84C]"><Plus className="w-4 h-4" /> Adicionar referência</button>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setStep('info')} className="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">Voltar</button>
              <button onClick={() => {
                if (services.length === 0) { setError('Adicione pelo menos um serviço.'); return }
                setError(''); setStep('payment')
              }} className="flex-1 bg-[#143A1F] text-white py-3 rounded-xl font-semibold hover:bg-[#0E2A15] transition-colors flex items-center justify-center gap-2">
                Ir para o pagamento <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-3 text-center">{error}</p>}
          </div>
        )}

        {/* ─────────────── STEP 4: PAGAMENTO ─────────────── */}
        {step === 'payment' && (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[#143A1F] mb-2">Ative sua divulgação</h1>
              <p className="text-gray-600">Sua página está pronta. Ative para entrar no ar e começar a aparecer.</p>
            </div>

            {/* Plano único */}
            <div className="bg-white border-2 border-[#C9A84C] rounded-2xl p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-[#C9A84C]" />
                  <p className="font-bold text-[#143A1F]">Plano {plan.name}</p>
                </div>
                <p className="text-2xl font-bold text-[#143A1F]">{formatBRL(plan.price)}<span className="text-sm font-normal text-gray-400">/mês</span></p>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600"><CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />{f}</li>
                ))}
              </ul>
            </div>

            {/* Forma de pagamento */}
            <div className="bg-white border rounded-2xl p-5 mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Forma de pagamento</label>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {([
                  { type: 'PIX' as BillingType, icon: <QrCode className="w-5 h-5" />, label: 'PIX' },
                  { type: 'BOLETO' as BillingType, icon: <FileText className="w-5 h-5" />, label: 'Boleto' },
                  { type: 'CREDIT_CARD' as BillingType, icon: <CreditCard className="w-5 h-5" />, label: 'Cartão' },
                ]).map(({ type, icon, label }) => (
                  <button key={type} onClick={() => setBillingType(type)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-sm font-medium"
                    style={{ borderColor: billingType === type ? '#C9A84C' : '#e5e7eb', backgroundColor: billingType === type ? 'rgba(201,168,76,0.08)' : 'white', color: billingType === type ? '#b8943d' : '#6b7280' }}>
                    {icon}{label}
                  </button>
                ))}
              </div>

              <div className="flex items-baseline justify-between border-t pt-4">
                <span className="text-gray-500 text-sm">Total mensal</span>
                <span className="text-2xl font-bold text-[#143A1F]">{formatBRL(plan.price)}<span className="text-sm font-normal text-gray-400">/mês</span></span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Sem taxa de adesão. Sem fidelidade. Renovação automática — cancele quando quiser.</p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer mb-4">
              <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#143A1F] flex-shrink-0" />
              <span className="text-xs text-gray-600 leading-relaxed">
                Li e concordo com os <Link href="/termos-uso" target="_blank" className="underline text-[#143A1F]">Termos de Uso</Link>. Autorizo a cobrança mensal de {formatBRL(plan.price)} referente à divulgação do meu negócio, ciente de que posso cancelar a qualquer momento.
              </span>
            </label>

            <div className="flex gap-3">
              <button onClick={() => setStep('landing')} className="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">Voltar</button>
              <button onClick={handlePay} disabled={loading || !acceptedTerms}
                className="flex-1 bg-[#C9A84C] text-[#143A1F] py-3.5 rounded-xl font-bold hover:brightness-105 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</> : <>Ativar divulgação — {formatBRL(plan.price)}/mês <ChevronRight className="w-4 h-4" /></>}
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-3 text-center">{error}</p>}
          </div>
        )}

        {/* ─────────────── SUCESSO ─────────────── */}
        {step === 'success' && (
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-[#143A1F] mb-3">Cadastro criado! 🎉</h1>
            <p className="text-gray-600 text-lg mb-6">Olá, <strong>{form.name}</strong>! Sua página foi criada. {payResult ? 'Conclua o pagamento abaixo para entrar no ar.' : 'Nossa equipe entrará em contato para concluir a divulgação.'}</p>

            {/* Pagamento */}
            {payResult && billingType === 'PIX' && payResult.pixQrCode && (
              <div className="bg-white border rounded-2xl p-6 mb-6 max-w-sm mx-auto">
                <p className="text-sm font-semibold text-gray-700 mb-3">Escaneie o QR Code PIX ({formatBRL(plan.price)}/mês):</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`data:image/png;base64,${payResult.pixQrCode}`} alt="QR Code PIX" className="w-48 h-48 mx-auto mb-4 rounded-xl border" />
                {payResult.pixCopiaECola && (
                  <button onClick={copyPix} className="flex items-center gap-2 mx-auto px-4 py-2 bg-[#143A1F] text-white rounded-xl text-sm font-medium hover:bg-[#0E2A15] transition-colors">
                    {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? 'Copiado!' : 'Copiar código PIX'}
                  </button>
                )}
              </div>
            )}
            {payResult && billingType === 'BOLETO' && payResult.bankSlipUrl && (
              <a href={payResult.bankSlipUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-[#143A1F] text-white rounded-xl font-semibold mb-6"><ExternalLink className="w-4 h-4" /> Abrir boleto</a>
            )}
            {payResult && (payResult.invoiceUrl || payResult.paymentUrl) && billingType === 'CREDIT_CARD' && (
              <a href={payResult.invoiceUrl || payResult.paymentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-[#143A1F] text-white rounded-xl font-semibold mb-6"><ExternalLink className="w-4 h-4" /> Pagar com cartão</a>
            )}
            {!payResult && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 max-w-md mx-auto text-sm text-amber-700">
                O pagamento online está temporariamente indisponível. Fale com a gente no WhatsApp <strong>(16) 98101-0004</strong> para ativar sua divulgação.
              </div>
            )}

            {profileUrl && (
              <div className="bg-[#f8f6f1] rounded-2xl p-5 mb-6 text-left max-w-md mx-auto">
                <p className="text-sm font-semibold text-[#143A1F] mb-2 flex items-center gap-2"><Globe className="w-4 h-4" /> Link da sua página (após ativação):</p>
                <div className="flex items-center gap-2 bg-white rounded-xl p-3 border">
                  <p className="text-[#143A1F] text-sm font-mono flex-1 truncate">{profileUrl}</p>
                  <button onClick={() => navigator.clipboard.writeText(profileUrl)} className="text-xs bg-[#143A1F] text-white px-3 py-1.5 rounded-lg flex-shrink-0">Copiar</button>
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Link href="/meu-painel" className="px-6 py-3 bg-[#143A1F] text-white rounded-xl font-semibold hover:bg-[#0E2A15] transition-colors">Acessar meu painel</Link>
              <Link href="/divulgue" className="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">Voltar</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CadastroParceirosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#f8f6f1]"><Loader2 className="w-8 h-8 animate-spin text-[#C9A84C]" /></div>}>
      <CadastroContent />
    </Suspense>
  )
}

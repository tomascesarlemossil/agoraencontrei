'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import {
  User, Mail, Phone, Building2, Award, MapPin, Instagram,
  Globe, CheckCircle2, ChevronRight, Loader2, Search, X,
  Briefcase, Camera, Scale, Wrench, Palette, Video, Star,
  Crown, ArrowRight, Sparkles,
}
 from 'lucide-react'
import { PlanosContent } from '../planos/page'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

const CATEGORIES = [
  { value: 'IMOBILIARIA',         label: 'Imobiliária',             icon: Building2,  desc: 'Imobiliária parceira — anuncie seus imóveis no marketplace' },
  { value: 'LOTEADORA',           label: 'Loteadora',               icon: Building2,  desc: 'Loteamentos e empreendimentos imobiliários' },
  { value: 'ARQUITETO',           label: 'Arquiteto(a)',            icon: Building2,  desc: 'Projetos arquitetônicos e regularização' },
  { value: 'ENGENHEIRO',          label: 'Engenheiro(a)',           icon: Wrench,     desc: 'Laudos, vistorias e reformas' },
  { value: 'CORRETOR',            label: 'Corretor(a)',             icon: Briefcase,  desc: 'Compra, venda e locação de imóveis' },
  { value: 'AVALIADOR',           label: 'Avaliador(a)',            icon: Star,       desc: 'Avaliação de mercado e laudos PTAM' },
  { value: 'DESIGNER_INTERIORES', label: 'Designer de Interiores',  icon: Palette,    desc: 'Projetos de decoração e interiores' },
  { value: 'FOTOGRAFO',           label: 'Fotógrafo(a)',            icon: Camera,     desc: 'Fotografia e tour virtual 360°' },
  { value: 'VIDEOMAKER',          label: 'Videomaker',              icon: Video,      desc: 'Vídeos e drones para imóveis' },
  { value: 'ADVOGADO_IMOBILIARIO',label: 'Advogado(a) Imobiliário', icon: Scale,      desc: 'Contratos, escrituras e regularização' },
  { value: 'DESPACHANTE',         label: 'Despachante',             icon: Award,      desc: 'Documentação e cartório' },
  { value: 'OUTRO',               label: 'Outro',                   icon: User,       desc: 'Outros serviços relacionados a imóveis' },
]

// Categorias com preço diferenciado (R$350/mês em vez do padrão)
const PREMIUM_CATEGORIES = ['IMOBILIARIA', 'LOTEADORA']

const SPECIALTY_TAGS: Record<string, string[]> = {
  IMOBILIARIA:          ['Venda de Imóveis', 'Locação', 'Administração de Imóveis', 'Lançamentos', 'Imóveis de Leilão', 'Financiamento Imobiliário'],
  LOTEADORA:            ['Loteamentos', 'Empreendimentos', 'Lotes Residenciais', 'Lotes Comerciais', 'Condomínios Fechados', 'Lotes Rurais'],
  ARQUITETO:            ['Reforma Pós-Arrematação', 'Regularização de Matrícula', 'Projeto Residencial', 'Projeto Comercial', 'Aprovação de Planta', 'Habite-se'],
  ENGENHEIRO:           ['Laudo Estrutural', 'Vistoria Cautelar', 'Reforma', 'Regularização', 'AVCB', 'Laudo de Avaliação'],
  CORRETOR:             ['Compra e Venda', 'Locação', 'Lançamentos', 'Imóveis de Leilão', 'Imóveis Comerciais', 'Financiamento'],
  AVALIADOR:            ['PTAM', 'Avaliação para Inventário', 'Avaliação para Financiamento', 'Avaliação Judicial', 'Avaliação Comercial'],
  DESIGNER_INTERIORES:  ['Decoração Residencial', 'Decoração Comercial', 'Home Staging', 'Projeto 3D', 'Marcenaria Planejada'],
  FOTOGRAFO:            ['Fotografia Imobiliária', 'Tour Virtual 360°', 'Drone', 'Vídeo Institucional', 'Edição Profissional'],
  VIDEOMAKER:           ['Vídeo Imobiliário', 'Drone', 'Reels para Instagram', 'Tour Virtual', 'Vídeo Institucional'],
  ADVOGADO_IMOBILIARIO: ['Contratos de Compra e Venda', 'Regularização de Imóveis', 'Usucapião', 'Arrematação em Leilão', 'Inventário', 'Distrato'],
  DESPACHANTE:          ['Escritura', 'Registro de Imóvel', 'ITBI', 'Certidões', 'Transferência de Propriedade'],
  OUTRO:                [],
}

interface Building {
  id: string
  slug: string
  name: string
  neighborhood?: string
  city: string
}

type Step = 'category' | 'info' | 'buildings' | 'success'

function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return false
  if (/^(\d)\1{10}$/.test(digits)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i)
  let remainder = (sum * 10) % 11
  if (remainder === 10) remainder = 0
  if (remainder !== parseInt(digits[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i)
  remainder = (sum * 10) % 11
  if (remainder === 10) remainder = 0
  return remainder === parseInt(digits[10])
}

function validateCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '')
  if (digits.length !== 14) return false
  if (/^(\d)\1{13}$/.test(digits)) return false
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum = 0
  for (let i = 0; i < 12; i++) sum += parseInt(digits[i]) * weights1[i]
  let remainder = sum % 11
  const d1 = remainder < 2 ? 0 : 11 - remainder
  if (d1 !== parseInt(digits[12])) return false
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  sum = 0
  for (let i = 0; i < 13; i++) sum += parseInt(digits[i]) * weights2[i]
  remainder = sum % 11
  const d2 = remainder < 2 ? 0 : 11 - remainder
  return d2 === parseInt(digits[13])
}

function validateDocument(value: string): { valid: boolean; type: 'cpf' | 'cnpj' | null; error: string } {
  const digits = value.replace(/\D/g, '')
  if (!digits) return { valid: true, type: null, error: '' }
  if (digits.length <= 11) {
    if (digits.length < 11) return { valid: true, type: 'cpf', error: '' }
    return validateCPF(digits)
      ? { valid: true, type: 'cpf', error: '' }
      : { valid: false, type: 'cpf', error: 'CPF inválido' }
  }
  if (digits.length < 14) return { valid: true, type: 'cnpj', error: '' }
  return validateCNPJ(digits)
    ? { valid: true, type: 'cnpj', error: '' }
    : { valid: false, type: 'cnpj', error: 'CNPJ inválido' }
}

function CadastroParceirosContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialPlan = (searchParams.get('plan') ?? 'START') as 'START' | 'PRIME' | 'VIP'
  const [step, setStep] = useState<Step>('category')
  const [loading, setLoading] = useState(false)
  const [buildings, setBuildings] = useState<Building[]>([])
  const [buildingSearch, setBuildingSearch] = useState('')
  const [selectedBuildings, setSelectedBuildings] = useState<Building[]>([])
  const [result, setResult] = useState<{ id: string; slug: string; profileUrl: string; name: string } | null>(null)
  const [error, setError] = useState('')
  const [docError, setDocError] = useState('')
  const [selectedPlan] = useState<'START' | 'PRIME' | 'VIP'>(initialPlan)

  const [form, setForm] = useState({
    category: '',
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    cpfcnpj: '',
    bio: '',
    crea: '',
    instagram: '',
    website: '',
    tags: [] as string[],
  })

  // Carregar edifícios
  useEffect(() => {
    fetch(`${API_URL}/api/v1/specialists/buildings`)
      .then(r => r.json())
      .then(d => setBuildings(d.data || []))
      .catch(() => {})
  }, [])

  const filteredBuildings = buildings.filter(b =>
    b.name.toLowerCase().includes(buildingSearch.toLowerCase()) ||
    (b.neighborhood || '').toLowerCase().includes(buildingSearch.toLowerCase())
  )

  const toggleBuilding = (b: Building) => {
    setSelectedBuildings(prev =>
      prev.find(x => x.id === b.id)
        ? prev.filter(x => x.id !== b.id)
        : [...prev, b]
    )
  }

  const toggleTag = (tag: string) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/v1/specialists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          cpfcnpj: form.cpfcnpj.replace(/\D/g, '') || undefined,
          buildingIds: selectedBuildings.map(b => b.id),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao cadastrar. Tente novamente.')
        setLoading(false)
        return
      }
      setResult(data.data)
      // Se o plano selecionado for pago, redirecionar ao checkout automaticamente
      if (initialPlan !== 'START' && data.data?.id) {
        router.push(`/parceiros/checkout?plan=${initialPlan}&specialistId=${data.data.id}`)
        return
      }
      setStep('success')
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const selectedCategory = CATEGORIES.find(c => c.value === form.category)

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f6f1] to-white">
      {/* Header */}
      <header className="bg-[#1B2B5B] py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Image src="/logo-ae-v2.png" alt="AgoraEncontrei" width={140} height={40} className="h-8 w-auto" />
          </Link>
          <Link href="/parceiros" className="text-white/70 hover:text-white text-sm transition-colors">
            ← Voltar para Parceiros
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Badge do plano selecionado */}
        {selectedPlan !== 'START' && step !== 'success' && (
          <div className="mb-6 flex items-center gap-3 p-4 rounded-2xl border" style={{ backgroundColor: selectedPlan === 'VIP' ? 'rgba(27,43,91,0.05)' : 'rgba(201,168,76,0.08)', borderColor: selectedPlan === 'VIP' ? 'rgba(27,43,91,0.2)' : 'rgba(201,168,76,0.3)' }}>
            {selectedPlan === 'VIP'
              ? <Crown className="w-5 h-5 flex-shrink-0" style={{ color: '#1B2B5B' }} />
              : <Star className="w-5 h-5 flex-shrink-0" style={{ color: '#C9A84C' }} />
            }
            <div>
              <p className="text-sm font-bold" style={{ color: '#1B2B5B' }}>Plano {selectedPlan} selecionado — R$ {selectedPlan === 'VIP' ? '497' : '197'}/mês</p>
              <p className="text-xs text-gray-500">Após o cadastro, você será redirecionado ao checkout para ativar seu dashboard privado.</p>
            </div>
          </div>
        )}
        {/* Progress */}
        {step !== 'success' && (
          <div className="flex items-center gap-2 mb-10">
            {(['category', 'info', 'buildings'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step === s ? 'bg-[#C9A84C] text-white' :
                  ['category', 'info', 'buildings'].indexOf(step) > i ? 'bg-[#1B2B5B] text-white' :
                  'bg-gray-200 text-gray-400'
                }`}>{i + 1}</div>
                <span className={`text-sm hidden sm:block ${step === s ? 'text-[#1B2B5B] font-semibold' : 'text-gray-400'}`}>
                  {s === 'category' ? 'Especialidade' : s === 'info' ? 'Seus Dados' : 'Edifícios'}
                </span>
                {i < 2 && <ChevronRight className="w-4 h-4 text-gray-300" />}
              </div>
            ))}
          </div>
        )}

        {/* ── STEP 1: Categoria ── */}
        {step === 'category' && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-[#1B2B5B] mb-2">Seja um Parceiro Profissional</h1>
              <p className="text-gray-600 text-lg">
                Cadastre-se gratuitamente e apareça nas buscas de quem precisa dos seus serviços em Franca e região.
              </p>
            </div>

            <h2 className="text-lg font-semibold text-[#1B2B5B] mb-4">Qual é a sua especialidade?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon
                return (
                  <button
                    key={cat.value}
                    onClick={() => { setForm(f => ({ ...f, category: cat.value })); setStep('info') }}
                    className="flex items-start gap-4 p-4 bg-white rounded-xl border-2 border-gray-100 hover:border-[#C9A84C] hover:shadow-md transition-all text-left group"
                  >
                    <div className="w-10 h-10 bg-[#f8f6f1] rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[#C9A84C]/10 transition-colors">
                      <Icon className="w-5 h-5 text-[#1B2B5B]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#1B2B5B]">{cat.label}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{cat.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── STEP 2: Informações Pessoais ── */}
        {step === 'info' && (
          <div>
            <div className="flex items-center gap-3 mb-8">
              {selectedCategory && (
                <div className="w-10 h-10 bg-[#C9A84C]/10 rounded-lg flex items-center justify-center">
                  <selectedCategory.icon className="w-5 h-5 text-[#C9A84C]" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-[#1B2B5B]">Seus Dados Profissionais</h1>
                <p className="text-gray-500 text-sm">{selectedCategory?.label} · Franca e Região</p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Nome */}
              <div>
                <label className="block text-sm font-semibold text-[#1B2B5B] mb-1.5">Nome completo *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Seu nome completo"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 bg-white"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-[#1B2B5B] mb-1.5">E-mail profissional *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="seu@email.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 bg-white"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Você receberá o link do seu perfil neste e-mail</p>
              </div>

              {/* Telefone + WhatsApp */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1B2B5B] mb-1.5">Telefone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="(16) 99999-9999"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1B2B5B] mb-1.5">WhatsApp</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={form.whatsapp}
                      onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                      placeholder="(16) 99999-9999"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* CPF/CNPJ */}
              <div>
                <label className="block text-sm font-semibold text-[#1B2B5B] mb-1.5">CPF ou CNPJ</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={form.cpfcnpj}
                    onChange={e => {
                      const val = e.target.value
                      setForm(f => ({ ...f, cpfcnpj: val }))
                      const result = validateDocument(val)
                      setDocError(result.error)
                    }}
                    placeholder="000.000.000-00 ou 00.000.000/0001-00"
                    maxLength={18}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 bg-white ${
                      docError
                        ? 'border-red-400 focus:border-red-400 focus:ring-red-200'
                        : 'border-gray-200 focus:border-[#C9A84C] focus:ring-[#C9A84C]/20'
                    }`}
                  />
                </div>
                {docError && (
                  <p className="text-red-500 text-xs mt-1">{docError}</p>
                )}
                {!docError && form.cpfcnpj && (
                  <p className="text-gray-400 text-xs mt-1">
                    {form.cpfcnpj.replace(/\D/g, '').length <= 11 ? 'CPF' : 'CNPJ'} detectado
                  </p>
                )}
              </div>

              {/* CREA/CAU/CRO */}
              {['IMOBILIARIA', 'LOTEADORA', 'ARQUITETO', 'ENGENHEIRO', 'AVALIADOR', 'CORRETOR', 'ADVOGADO_IMOBILIARIO'].includes(form.category) && (
                <div>
                  <label className="block text-sm font-semibold text-[#1B2B5B] mb-1.5">
                    {form.category === 'IMOBILIARIA' || form.category === 'LOTEADORA' || form.category === 'CORRETOR' ? 'CRECI' :
                     form.category === 'ARQUITETO' ? 'CAU' :
                     form.category === 'ADVOGADO_IMOBILIARIO' ? 'OAB' : 'CREA'} (opcional)
                  </label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={form.crea}
                      onChange={e => setForm(f => ({ ...f, crea: e.target.value }))}
                      placeholder="Número do registro profissional"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Bio */}
              <div>
                <label className="block text-sm font-semibold text-[#1B2B5B] mb-1.5">Apresentação profissional</label>
                <textarea
                  value={form.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="Conte um pouco sobre sua experiência, especialidades e diferenciais..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 bg-white resize-none"
                />
              </div>

              {/* Instagram + Website */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1B2B5B] mb-1.5">Instagram</label>
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={form.instagram}
                      onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))}
                      placeholder="@seuperfil"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1B2B5B] mb-1.5">Site</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="url"
                      value={form.website}
                      onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                      placeholder="https://seusite.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Tags de especialidade */}
              {SPECIALTY_TAGS[form.category]?.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-[#1B2B5B] mb-2">Áreas de atuação (selecione as que se aplicam)</label>
                  <div className="flex flex-wrap gap-2">
                    {SPECIALTY_TAGS[form.category].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                          form.tags.includes(tag)
                            ? 'bg-[#1B2B5B] text-white border-[#1B2B5B]'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-[#C9A84C]'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep('category')}
                className="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={() => {
                  if (!form.name || !form.email) { setError('Preencha nome e e-mail'); return }
                  if (form.cpfcnpj) {
                    const docResult = validateDocument(form.cpfcnpj)
                    if (!docResult.valid) { setError(docResult.error); return }
                  }
                  setError('')
                  setStep('buildings')
                }}
                className="flex-1 bg-[#1B2B5B] text-white py-3 rounded-xl font-semibold hover:bg-[#162247] transition-colors flex items-center justify-center gap-2"
              >
                Continuar <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-3 text-center">{error}</p>}
          </div>
        )}

        {/* ── STEP 3: Edifícios ── */}
        {step === 'buildings' && (
          <div>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-[#1B2B5B] mb-2">Onde você já trabalhou?</h1>
              <p className="text-gray-600">
                Selecione os condomínios e edifícios onde você já prestou serviços. Isso cria links automáticos entre seu perfil e esses imóveis no Google.
              </p>
            </div>

            {/* Selecionados */}
            {selectedBuildings.length > 0 && (
              <div className="mb-4 p-4 bg-[#1B2B5B]/5 rounded-xl">
                <p className="text-sm font-semibold text-[#1B2B5B] mb-2">{selectedBuildings.length} selecionado(s):</p>
                <div className="flex flex-wrap gap-2">
                  {selectedBuildings.map(b => (
                    <span key={b.id} className="flex items-center gap-1 bg-[#1B2B5B] text-white text-xs px-3 py-1.5 rounded-full">
                      {b.name}
                      <button onClick={() => toggleBuilding(b)}>
                        <X className="w-3 h-3 ml-1" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Busca */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={buildingSearch}
                onChange={e => setBuildingSearch(e.target.value)}
                placeholder="Buscar condomínio ou edifício..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 bg-white"
              />
            </div>

            {/* Lista */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {filteredBuildings.length === 0 && (
                <p className="text-center text-gray-400 py-8">Nenhum resultado encontrado</p>
              )}
              {filteredBuildings.map(b => {
                const selected = !!selectedBuildings.find(x => x.id === b.id)
                return (
                  <button
                    key={b.id}
                    onClick={() => toggleBuilding(b)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                      selected
                        ? 'border-[#C9A84C] bg-[#C9A84C]/5'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      selected ? 'border-[#C9A84C] bg-[#C9A84C]' : 'border-gray-300'
                    }`}>
                      {selected && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <p className="font-medium text-[#1B2B5B] text-sm">{b.name}</p>
                      {b.neighborhood && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {b.neighborhood} · {b.city}/SP
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Info SEO */}
            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-sm text-blue-700 font-medium mb-1">💡 Como isso funciona?</p>
              <p className="text-xs text-blue-600 leading-relaxed">
                Ao selecionar um edifício, seu perfil aparecerá automaticamente na página desse condomínio.
                Quando alguém buscar "arquiteto para reforma no Edifício Prime Franca", o Google encontrará
                tanto a página do edifício quanto o seu perfil — ambos no AgoraEncontrei.
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep('info')}
                className="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-[#C9A84C] text-white py-3 rounded-xl font-semibold hover:bg-[#b8963e] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Cadastrando...</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4" /> Finalizar Cadastro</>
                )}
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-3 text-center">{error}</p>}
          </div>
        )}

        {/* ── STEP 4: Sucesso ── */}
        {step === 'success' && result && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-[#1B2B5B] mb-3">Cadastro realizado! 🎉</h1>
            <p className="text-gray-600 text-lg mb-2">
              Olá, <strong>{result.name}</strong>! Seu perfil foi criado com sucesso.
            </p>
            <p className="text-gray-500 mb-8">
              Nossa equipe irá revisar e aprovar seu perfil em até <strong>24 horas</strong>.
              Você receberá um e-mail de confirmação com o link do seu perfil.
            </p>

            {/* Link do perfil */}
            <div className="bg-[#f8f6f1] rounded-2xl p-6 mb-8 text-left">
              <p className="text-sm font-semibold text-[#1B2B5B] mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4" /> Seu link de perfil (disponível após aprovação):
              </p>
              <div className="flex items-center gap-2 bg-white rounded-xl p-3 border border-gray-200">
                <p className="text-[#1B2B5B] text-sm font-mono flex-1 truncate">{result.profileUrl}</p>
                <button
                  onClick={() => navigator.clipboard.writeText(result.profileUrl)}
                  className="text-xs bg-[#1B2B5B] text-white px-3 py-1.5 rounded-lg hover:bg-[#162247] transition-colors flex-shrink-0"
                >
                  Copiar
                </button>
              </div>
            </div>

            {/* Próximos passos */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-left">
              {[
                { icon: Mail, title: 'Verifique seu e-mail', desc: 'Enviamos um e-mail de boas-vindas com todas as informações.' },
                { icon: CheckCircle2, title: 'Aguarde a aprovação', desc: 'Nossa equipe revisa todos os perfis em até 24 horas.' },
                { icon: Star, title: 'Compartilhe seu perfil', desc: 'Após aprovado, compartilhe o link nas suas redes sociais.' },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl p-4 border border-gray-100">
                  <div className="w-8 h-8 bg-[#C9A84C]/10 rounded-lg flex items-center justify-center mb-3">
                    <item.icon className="w-4 h-4 text-[#C9A84C]" />
                  </div>
                  <p className="font-semibold text-[#1B2B5B] text-sm mb-1">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-center">
              <Link
                href="/parceiros"
                className="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Ver Parceiros
              </Link>
              <Link
                href="/"
                className="px-6 py-3 bg-[#1B2B5B] text-white rounded-xl font-semibold hover:bg-[#162247] transition-colors"
              >
                Ir para o Início
              </Link>
            </div>
          </div>
         )}
      </div>
    </div>
  )
}

export default function CadastroParceirosPage() {
  return (
    <>
      {/* Planos e ferramentas (primeiro) */}
      <PlanosContent />

      {/* Formulário de cadastro (depois dos planos) */}
      <Suspense fallback={
        <div className="py-20 flex items-center justify-center" style={{ backgroundColor: '#f8f6f1' }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C9A84C]" />
        </div>
      }>
        <CadastroParceirosContent />
      </Suspense>
    </>
  )
}

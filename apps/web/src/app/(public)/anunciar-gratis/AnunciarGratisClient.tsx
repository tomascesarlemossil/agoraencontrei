'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  CheckCircle, MapPin, DollarSign, Phone, Home, Star, Clock,
  Shield, TrendingUp, Users, Zap, ArrowRight, AlertCircle,
  Building2, ChevronDown
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '1x00000000000000000000AA' // test key

interface FormData {
  // Passo 1 — básico
  zipCode: string
  street: string
  number: string
  neighborhood: string
  city: string
  state: string
  price: string
  ownerPhone: string
  // Passo 2 — detalhes
  ownerName: string
  ownerEmail: string
  propertyType: string
  bedrooms: string
  totalArea: string
  description: string
  // Turnstile
  turnstileToken: string
}

const PROPERTY_TYPES = [
  { value: 'HOUSE', label: 'Casa' },
  { value: 'APARTMENT', label: 'Apartamento' },
  { value: 'LAND', label: 'Terreno' },
  { value: 'COMMERCIAL', label: 'Comercial' },
  { value: 'FARM', label: 'Chácara / Sítio' },
  { value: 'OTHER', label: 'Outro' },
]

const BENEFITS = [
  { icon: Star, text: 'Destaque na página inicial por 30 dias', color: 'text-[#C9A84C]' },
  { icon: MapPin, text: 'Pin verde exclusivo no mapa interativo', color: 'text-green-500' },
  { icon: Users, text: 'Visibilidade para +5.000 compradores ativos', color: 'text-[#1B2B5B]' },
  { icon: Shield, text: 'Sem comissão, sem contrato, sem burocracia', color: 'text-blue-500' },
  { icon: TrendingUp, text: 'SEO otimizado para aparecer no Google', color: 'text-purple-500' },
  { icon: Zap, text: 'Anúncio publicado em menos de 5 minutos', color: 'text-orange-500' },
]

const TESTIMONIALS = [
  { name: 'Carlos M.', city: 'Franca/SP', text: 'Vendi minha casa em 18 dias sem pagar comissão. Incrível!', stars: 5 },
  { name: 'Ana Paula R.', city: 'Batatais/SP', text: 'Recebi 12 contatos na primeira semana. O destaque faz diferença.', stars: 5 },
  { name: 'Roberto S.', city: 'Franca/SP', text: 'Simples, rápido e gratuito. Recomendo para todo mundo.', stars: 5 },
]

export default function AnunciarGratisClient() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>({
    zipCode: '', street: '', number: '', neighborhood: '', city: 'Franca', state: 'SP',
    price: '', ownerPhone: '',
    ownerName: '', ownerEmail: '', propertyType: 'HOUSE', bedrooms: '2', totalArea: '',
    description: '', turnstileToken: '',
  })
  const [loading, setLoading] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ slug: string; name: string } | null>(null)
  const turnstileRef = useRef<HTMLDivElement>(null)
  const turnstileWidgetId = useRef<string | null>(null)

  // Inicializar Turnstile
  useEffect(() => {
    if (step !== 2) return
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    script.async = true
    script.defer = true
    document.head.appendChild(script)

    script.onload = () => {
      if (turnstileRef.current && (window as any).turnstile) {
        turnstileWidgetId.current = (window as any).turnstile.render(turnstileRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token: string) => setForm(f => ({ ...f, turnstileToken: token })),
          'expired-callback': () => setForm(f => ({ ...f, turnstileToken: '' })),
          theme: 'light',
        })
      }
    }
    return () => {
      document.head.removeChild(script)
    }
  }, [step])

  // Auto-fill CEP
  const handleCepBlur = async () => {
    const cep = form.zipCode.replace(/\D/g, '')
    if (cep.length !== 8) return
    setCepLoading(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setForm(f => ({
          ...f,
          street: data.logradouro || f.street,
          neighborhood: data.bairro || f.neighborhood,
          city: data.localidade || f.city,
          state: data.uf || f.state,
        }))
      }
    } catch {
      // silencioso
    } finally {
      setCepLoading(false)
    }
  }

  const formatCep = (v: string) => {
    const n = v.replace(/\D/g, '').slice(0, 8)
    return n.length > 5 ? `${n.slice(0, 5)}-${n.slice(5)}` : n
  }

  const formatPhone = (v: string) => {
    const n = v.replace(/\D/g, '').slice(0, 11)
    if (n.length <= 10) return n.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
    return n.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
  }

  const formatPrice = (v: string) => {
    const n = v.replace(/\D/g, '')
    if (!n) return ''
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(n))
  }

  const handleStep1 = () => {
    if (!form.zipCode || !form.price || !form.ownerPhone) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }
    if (form.ownerPhone.replace(/\D/g, '').length < 10) {
      setError('WhatsApp inválido. Digite com DDD.')
      return
    }
    setError('')
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async () => {
    if (!form.ownerName || !form.ownerEmail) {
      setError('Preencha seu nome e e-mail.')
      return
    }
    if (!form.turnstileToken) {
      setError('Por favor, confirme que você não é um robô.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const priceNum = Number(form.price.replace(/\D/g, ''))
      const res = await fetch(`${API_URL}/api/v1/public/free-listing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zipCode: form.zipCode.replace(/\D/g, ''),
          street: form.street,
          number: form.number,
          neighborhood: form.neighborhood,
          city: form.city,
          state: form.state,
          price: priceNum,
          ownerPhone: form.ownerPhone.replace(/\D/g, ''),
          ownerName: form.ownerName,
          ownerEmail: form.ownerEmail,
          propertyType: form.propertyType,
          bedrooms: Number(form.bedrooms) || 0,
          totalArea: Number(form.totalArea) || null,
          description: form.description,
          turnstileToken: form.turnstileToken,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao cadastrar imóvel. Tente novamente.')
        return
      }
      setSuccess({ slug: data.slug, name: data.title })
    } catch {
      setError('Erro de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Tela de sucesso
  if (success) {
    const profileUrl = `https://www.agoraencontrei.com.br/imoveis/${success.slug}`
    return (
      <div className="min-h-screen bg-[#f8f6f1] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border shadow-sm p-8 max-w-lg w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#1B2B5B] mb-2" style={{ fontFamily: 'Georgia, serif' }}>
            Imóvel cadastrado com sucesso!
          </h1>
          <p className="text-gray-500 mb-6 text-sm">
            Seu anúncio está em destaque por <strong>30 dias</strong>. Compartilhe o link abaixo para receber contatos.
          </p>
          <div className="bg-[#f8f6f1] rounded-xl p-4 mb-6">
            <p className="text-xs text-gray-500 mb-2">Link do seu anúncio:</p>
            <p className="text-[#1B2B5B] font-medium text-sm break-all">{profileUrl}</p>
          </div>
          <div className="flex gap-3 mb-6">
            <a href={`https://wa.me/?text=Estou vendendo meu imóvel! Veja o anúncio: ${profileUrl}`}
              target="_blank" rel="noreferrer"
              className="flex-1 bg-[#25D366] text-white py-3 rounded-xl text-sm font-bold">
              Compartilhar no WhatsApp
            </a>
            <button
              onClick={() => navigator.clipboard.writeText(profileUrl)}
              className="flex-1 bg-[#1B2B5B] text-white py-3 rounded-xl text-sm font-bold">
              Copiar link
            </button>
          </div>
          <div className="bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-xl p-4 text-left">
            <p className="text-sm font-bold text-[#1B2B5B] mb-1">📧 Verifique seu e-mail</p>
            <p className="text-xs text-gray-600">
              Enviamos o link do seu anúncio e dicas para aumentar suas chances de venda. Fique atento ao e-mail de aviso quando o período de destaque estiver encerrando.
            </p>
          </div>
          <Link href="/" className="inline-flex items-center gap-2 text-[#C9A84C] font-medium text-sm mt-6 hover:underline">
            Voltar para a página inicial <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f6f1]">
      {/* Hero */}
      <section className="bg-[#1B2B5B] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#C9A84C]/20 text-[#C9A84C] px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Star className="w-4 h-4" /> Destaque Gratuito por 30 Dias
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
            Venda seu imóvel sem pagar comissão.
          </h1>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Anúncio Grátis com destaque por 30 dias no maior marketplace imobiliário de Franca e região.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-white/70">
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-400" /> Sem comissão</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-400" /> Sem contrato</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-400" /> Publicado em 5 minutos</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-400" /> Pin verde exclusivo no mapa</span>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Formulário */}
        <div className="lg:col-span-3">
          {/* Indicador de progresso */}
          <div className="flex items-center gap-3 mb-6">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-[#1B2B5B]' : 'text-gray-300'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-[#1B2B5B] text-white' : 'bg-gray-200 text-gray-400'}`}>1</div>
              <span className="text-sm font-medium hidden sm:block">Dados do Imóvel</span>
            </div>
            <div className={`flex-1 h-0.5 ${step >= 2 ? 'bg-[#1B2B5B]' : 'bg-gray-200'}`} />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-[#1B2B5B]' : 'text-gray-300'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-[#1B2B5B] text-white' : 'bg-gray-200 text-gray-400'}`}>2</div>
              <span className="text-sm font-medium hidden sm:block">Seus Dados</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            {/* PASSO 1 */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-[#1B2B5B] mb-4" style={{ fontFamily: 'Georgia, serif' }}>
                  Onde fica seu imóvel?
                </h2>

                {/* CEP */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CEP <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.zipCode}
                      onChange={e => setForm(f => ({ ...f, zipCode: formatCep(e.target.value) }))}
                      onBlur={handleCepBlur}
                      placeholder="00000-000"
                      className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5B]"
                    />
                    {cepLoading && (
                      <div className="absolute right-3 top-3.5 w-4 h-4 border-2 border-[#1B2B5B] border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Endereço preenchido automaticamente</p>
                </div>

                {/* Rua e Número */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rua / Avenida</label>
                    <input
                      type="text"
                      value={form.street}
                      onChange={e => setForm(f => ({ ...f, street: e.target.value }))}
                      placeholder="Rua das Flores"
                      className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5B]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                    <input
                      type="text"
                      value={form.number}
                      onChange={e => setForm(f => ({ ...f, number: e.target.value }))}
                      placeholder="123"
                      className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5B]"
                    />
                  </div>
                </div>

                {/* Bairro e Cidade */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                    <input
                      type="text"
                      value={form.neighborhood}
                      onChange={e => setForm(f => ({ ...f, neighborhood: e.target.value }))}
                      placeholder="Centro"
                      className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5B]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                      placeholder="Franca"
                      className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5B]"
                    />
                  </div>
                </div>

                {/* Preço */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço de Venda <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={form.price}
                      onChange={e => setForm(f => ({ ...f, price: formatPrice(e.target.value) }))}
                      placeholder="R$ 350.000"
                      className="w-full border rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5B]"
                    />
                  </div>
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    WhatsApp para contato <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={form.ownerPhone}
                      onChange={e => setForm(f => ({ ...f, ownerPhone: formatPhone(e.target.value) }))}
                      placeholder="(16) 99999-9999"
                      className="w-full border rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5B]"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Compradores entrarão em contato por aqui</p>
                </div>

                <button
                  onClick={handleStep1}
                  className="w-full bg-[#C9A84C] text-[#1B2B5B] py-4 rounded-xl font-bold text-base hover:bg-[#b8943d] transition-colors flex items-center justify-center gap-2"
                >
                  Continuar <ArrowRight className="w-5 h-5" />
                </button>
                <p className="text-center text-xs text-gray-400">
                  Grátis · Sem compromisso · Publicado em 5 minutos
                </p>
              </div>
            )}

            {/* PASSO 2 */}
            {step === 2 && (
              <div className="space-y-4">
                <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-[#1B2B5B] flex items-center gap-1 mb-2">
                  ← Voltar
                </button>
                <h2 className="text-xl font-bold text-[#1B2B5B]" style={{ fontFamily: 'Georgia, serif' }}>
                  Seus dados e detalhes do imóvel
                </h2>

                {/* Nome e Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Seu nome <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.ownerName}
                      onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))}
                      placeholder="João Silva"
                      className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5B]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E-mail <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.ownerEmail}
                      onChange={e => setForm(f => ({ ...f, ownerEmail: e.target.value }))}
                      placeholder="joao@email.com"
                      className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5B]"
                    />
                  </div>
                </div>

                {/* Tipo e Quartos */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de imóvel</label>
                    <div className="relative">
                      <select
                        value={form.propertyType}
                        onChange={e => setForm(f => ({ ...f, propertyType: e.target.value }))}
                        className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5B] appearance-none bg-white"
                      >
                        {PROPERTY_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quartos</label>
                    <div className="relative">
                      <select
                        value={form.bedrooms}
                        onChange={e => setForm(f => ({ ...f, bedrooms: e.target.value }))}
                        className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5B] appearance-none bg-white"
                      >
                        {['0', '1', '2', '3', '4', '5+'].map(n => (
                          <option key={n} value={n}>{n === '0' ? 'Sem quartos' : `${n} quarto${n !== '1' ? 's' : ''}`}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Área total */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Área total (m²)</label>
                  <input
                    type="number"
                    value={form.totalArea}
                    onChange={e => setForm(f => ({ ...f, totalArea: e.target.value }))}
                    placeholder="120"
                    className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5B]"
                  />
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição do imóvel (opcional)</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Descreva os diferenciais do seu imóvel: localização, reformas, vizinhança..."
                    rows={3}
                    className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5B] resize-none"
                  />
                </div>

                {/* Turnstile */}
                <div>
                  <div ref={turnstileRef} className="flex justify-center" />
                  {!form.turnstileToken && (
                    <p className="text-xs text-gray-400 text-center mt-2">Confirme que você não é um robô</p>
                  )}
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading || !form.turnstileToken}
                  className="w-full bg-[#1B2B5B] text-white py-4 rounded-xl font-bold text-base hover:bg-[#162247] transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Publicando seu anúncio...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Publicar anúncio grátis agora
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-gray-400">
                  Ao cadastrar, você concorda com os{' '}
                  <Link href="/termos-uso" className="text-[#C9A84C] hover:underline">Termos de Uso</Link>
                  {' '}e a{' '}
                  <Link href="/politica-privacidade" className="text-[#C9A84C] hover:underline">Política de Privacidade</Link>.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar de benefícios */}
        <div className="lg:col-span-2 space-y-6">
          {/* Benefícios */}
          <div className="bg-white rounded-2xl border p-6 shadow-sm">
            <h3 className="font-bold text-[#1B2B5B] mb-4" style={{ fontFamily: 'Georgia, serif' }}>
              O que você ganha
            </h3>
            <ul className="space-y-3">
              {BENEFITS.map((b, i) => (
                <li key={i} className="flex items-start gap-3">
                  <b.icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${b.color}`} />
                  <span className="text-sm text-gray-700">{b.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Timeline dos 30 dias */}
          <div className="bg-[#1B2B5B] rounded-2xl p-6 text-white">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#C9A84C]" /> O que acontece depois
            </h3>
            <div className="space-y-4">
              {[
                { day: 'Hoje', text: 'Anúncio publicado com pin verde no mapa e destaque na página inicial' },
                { day: 'Dia 15', text: 'E-mail com relatório de visualizações e contatos recebidos' },
                { day: 'Dia 28', text: 'Aviso: "Seu destaque encerra em 2 dias. Quer continuar no topo?"' },
                { day: 'Dia 30', text: 'Anúncio continua ativo, mas sai do destaque. Opção de renovar.' },
              ].map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-12 text-[#C9A84C] font-bold text-xs flex-shrink-0 pt-0.5">{item.day}</div>
                  <div className="flex-1 text-white/80 text-sm">{item.text}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Depoimentos */}
          <div className="bg-white rounded-2xl border p-6 shadow-sm">
            <h3 className="font-bold text-[#1B2B5B] mb-4">O que dizem os proprietários</h3>
            <div className="space-y-4">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className="border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center gap-1 mb-1">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <Star key={j} className="w-3 h-3 text-[#C9A84C] fill-[#C9A84C]" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 italic mb-1">"{t.text}"</p>
                  <p className="text-xs text-gray-400">{t.name} · {t.city}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: '30', label: 'Dias grátis', icon: Clock },
              { value: '0%', label: 'Comissão', icon: DollarSign },
              { value: '5min', label: 'Para publicar', icon: Zap },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-xl border p-3 text-center shadow-sm">
                <s.icon className="w-4 h-4 text-[#C9A84C] mx-auto mb-1" />
                <p className="text-lg font-bold text-[#1B2B5B]">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <section className="bg-white py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-[#1B2B5B] text-center mb-8" style={{ fontFamily: 'Georgia, serif' }}>
            Perguntas Frequentes
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'O anúncio é realmente gratuito?',
                a: 'Sim! Você cadastra seu imóvel sem pagar nada. O destaque na página inicial e o pin verde no mapa são gratuitos por 30 dias. Após esse período, o anúncio continua ativo, mas sem o destaque premium.'
              },
              {
                q: 'Preciso contratar a Imobiliária Lemos para vender?',
                a: 'Não. O AgoraEncontrei é um marketplace aberto. Você pode vender diretamente para o comprador, sem intermediários. Caso precise de ajuda profissional, nossa equipe está disponível.'
              },
              {
                q: 'Como os compradores entram em contato comigo?',
                a: 'Pelo WhatsApp que você cadastrou. O número aparece diretamente no anúncio para que os interessados entrem em contato com você.'
              },
              {
                q: 'O que é o pin verde no mapa?',
                a: 'Imóveis cadastrados por proprietários diretos aparecem com um pin verde no mapa interativo, diferenciando-os dos imóveis de imobiliárias. Isso aumenta a visibilidade e a credibilidade do seu anúncio.'
              },
              {
                q: 'Posso adicionar fotos depois?',
                a: 'Sim! Após o cadastro, você receberá um link para completar seu anúncio com fotos, mais detalhes e descrição completa. Anúncios com fotos recebem até 5x mais contatos.'
              },
            ].map((item, i) => (
              <details key={i} className="border rounded-xl overflow-hidden">
                <summary className="px-5 py-4 font-medium text-[#1B2B5B] cursor-pointer hover:bg-[#f8f6f1] flex items-center justify-between">
                  {item.q}
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </summary>
                <div className="px-5 pb-4 text-sm text-gray-600">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-[#1B2B5B] py-12 px-4 text-center text-white">
        <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Georgia, serif' }}>
          Pronto para anunciar seu imóvel?
        </h2>
        <p className="text-white/70 mb-6">Grátis · Sem compromisso · Publicado em 5 minutos</p>
        <button
          onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setStep(1) }}
          className="bg-[#C9A84C] text-[#1B2B5B] px-8 py-4 rounded-xl font-bold text-base hover:bg-[#b8943d] transition-colors inline-flex items-center gap-2"
        >
          <Home className="w-5 h-5" /> Anunciar meu imóvel grátis
        </button>
      </section>
    </div>
  )
}

'use client'

import { useState, useEffect, useRef, createContext, useContext } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Sparkles, CheckCircle2, Loader2, X } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

// ── Types ──────────────────────────────────────────────────────────────────
interface Answer {
  objetivo?: string
  tipo?: string
  cidade?: string
  priceRange?: string
  quartos?: string
  name?: string
  phone?: string
  email?: string
}

// ── Quiz data ──────────────────────────────────────────────────────────────
const STEPS = [
  {
    id: 'objetivo',
    question: 'Qual o seu objetivo?',
    subtitle: 'Me conta o que você está procurando hoje.',
    options: [
      { emoji: '🏡', label: 'Comprar um imóvel', value: 'buy' },
      { emoji: '🔑', label: 'Alugar um imóvel', value: 'rent' },
      { emoji: '💰', label: 'Investir em imóvel', value: 'invest' },
      { emoji: '🌴', label: 'Temporada / férias', value: 'season' },
    ],
  },
  {
    id: 'tipo',
    question: 'Que tipo de imóvel você prefere?',
    subtitle: 'Selecione o que mais combina com o seu perfil.',
    options: [
      { emoji: '🏠', label: 'Casa', value: 'HOUSE' },
      { emoji: '🏢', label: 'Apartamento', value: 'APARTMENT' },
      { emoji: '🌿', label: 'Chácara / Fazenda', value: 'FARM' },
      { emoji: '📐', label: 'Terreno / Lote', value: 'LAND' },
      { emoji: '🏪', label: 'Comercial', value: 'STORE' },
      { emoji: '✨', label: 'Cobertura / Penthouse', value: 'PENTHOUSE' },
    ],
  },
  {
    id: 'cidade',
    question: 'Em qual cidade você busca?',
    subtitle: 'Atendemos Franca e toda a região.',
    options: [
      { emoji: '📍', label: 'Franca / SP', value: 'Franca' },
      { emoji: '🌆', label: 'Ribeirão Preto', value: 'Ribeirão Preto' },
      { emoji: '🏙️', label: 'Batatais', value: 'Batatais' },
      { emoji: '🗺️', label: 'Outra cidade', value: '' },
    ],
  },
  {
    id: 'priceRange',
    question: 'Qual sua faixa de investimento?',
    subtitle: 'Isso nos ajuda a encontrar as melhores opções para você.',
    // Options are dynamic based on objetivo
    options: [], // populated dynamically
  },
  {
    id: 'quartos',
    question: 'Quantos quartos você precisa?',
    subtitle: 'Selecione o mínimo de quartos desejado.',
    options: [
      { emoji: '🛏️', label: 'Sem preferência', value: '' },
      { emoji: '1️⃣', label: '1 quarto', value: '1' },
      { emoji: '2️⃣', label: '2 quartos', value: '2' },
      { emoji: '3️⃣', label: '3 quartos', value: '3' },
      { emoji: '4️⃣', label: '4 quartos ou mais', value: '4' },
    ],
  },
]

const PRICE_OPTIONS_BUY = [
  { emoji: '🏷️', label: 'Até R$ 200 mil', value: '0-200000' },
  { emoji: '💵', label: 'R$ 200k – R$ 500k', value: '200000-500000' },
  { emoji: '💎', label: 'R$ 500k – R$ 1M', value: '500000-1000000' },
  { emoji: '🏆', label: 'R$ 1M – R$ 2M', value: '1000000-2000000' },
  { emoji: '👑', label: 'Acima de R$ 2M', value: '2000000-99999999' },
]

const PRICE_OPTIONS_RENT = [
  { emoji: '🏷️', label: 'Até R$ 1.000/mês', value: '0-1000' },
  { emoji: '💵', label: 'R$ 1.000 – R$ 2.500', value: '1000-2500' },
  { emoji: '💎', label: 'R$ 2.500 – R$ 5.000', value: '2500-5000' },
  { emoji: '🏆', label: 'Acima de R$ 5.000', value: '5000-99999999' },
]

// ── AI messages between steps ──────────────────────────────────────────────
function getTransitionMessage(step: number, answer: Answer): string {
  const msgs: Record<number, string> = {
    1: answer.objetivo === 'buy'
      ? 'Ótima escolha! Temos imóveis incríveis para compra. 🏡'
      : answer.objetivo === 'rent'
      ? 'Perfeito! Vou encontrar as melhores opções para locação.'
      : answer.objetivo === 'invest'
      ? 'Excelente! Temos ótimas oportunidades de investimento com alta valorização.'
      : 'Que delícia! Temos opções lindas para temporada.',
    2: `${answer.tipo === 'FARM' ? 'Chácaras e fazendas têm muito espaço e natureza!' : 'Perfeito!'} Vou refinar sua busca...`,
    3: answer.cidade === 'Franca' ? 'Franca tem um mercado imobiliário incrível! Muitas opções.' : 'Ótimo! Temos opções na sua região.',
    4: 'Certo! Agora deixa eu te mostrar o que temos dentro do seu orçamento.',
    5: 'Quase lá! Só me passa seus dados para personalizar completamente.',
  }
  return msgs[step] ?? 'Ótimo!'
}

// ── Context para compartilhar estado entre SmartQuizButton e SmartQuizModal ─
interface SmartQuizCtx { open: () => void }
const SmartQuizContext = createContext<SmartQuizCtx>({ open: () => {} })

// ── Hook para abrir o quiz de qualquer lugar ────────────────────────────────
export function useSmartQuiz() { return useContext(SmartQuizContext) }

// ── Botão isolado (usado na coluna esquerda do layout lado a lado) ──────────
export function SmartQuizButton() {
  const { open } = useSmartQuiz()
  return (
    <button
      onClick={open}
      className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold transition-all hover:scale-105 hover:shadow-lg active:scale-100 w-fit"
      style={{ background: 'linear-gradient(135deg, #1B2B5B, #2d4a99)', color: 'white' }}
    >
      <Sparkles className="w-4 h-4" />
      Iniciar Quiz Inteligente
    </button>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export function SmartQuiz({ children }: { children?: React.ReactNode }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [answer, setAnswer] = useState<Answer>({})
  const [transitioning, setTransitioning] = useState(false)
  const [transitionMsg, setTransitionMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' })
  const phoneRef = useRef<HTMLInputElement>(null)

  const totalSteps = STEPS.length
  const progress = Math.round((step / totalSteps) * 100)

  // Dynamic price options
  const currentStep = { ...STEPS[step] }
  if (currentStep.id === 'priceRange') {
    currentStep.options = (answer.objetivo === 'rent' || answer.objetivo === 'season')
      ? PRICE_OPTIONS_RENT
      : PRICE_OPTIONS_BUY
  }

  function handleOption(value: string) {
    const key = currentStep.id as keyof Answer
    const newAnswer = { ...answer, [key]: value }
    setAnswer(newAnswer)

    // Skip quartos for land/commercial
    const nextStep = step + 1
    const willSkipQuartos = nextStep === 4 && (newAnswer.tipo === 'LAND' || newAnswer.tipo === 'STORE' || newAnswer.tipo === 'WAREHOUSE')

    const msg = getTransitionMessage(nextStep, newAnswer)
    setTransitionMsg(msg)
    setTransitioning(true)

    setTimeout(() => {
      setTransitioning(false)
      if (willSkipQuartos) {
        setStep(5) // skip to contact form
      } else {
        setStep(nextStep)
      }
    }, 1200)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name || !formData.phone) return
    setSubmitting(true)

    // Build message from answers
    const purposeLabel = answer.objetivo === 'buy' ? 'Comprar' : answer.objetivo === 'rent' ? 'Alugar' : answer.objetivo === 'invest' ? 'Investir' : 'Temporada'
    const typeLabel = STEPS[1].options.find(o => o.value === answer.tipo)?.label ?? answer.tipo ?? ''
    const [minPrice, maxPrice] = (answer.priceRange ?? '').split('-')

    const message = [
      `Quiz: ${purposeLabel}`,
      answer.tipo ? `Tipo: ${typeLabel}` : '',
      answer.cidade ? `Cidade: ${answer.cidade}` : '',
      answer.priceRange ? `Orçamento: ${PRICE_OPTIONS_BUY.concat(PRICE_OPTIONS_RENT).find(o => o.value === answer.priceRange)?.label ?? ''}` : '',
      answer.quartos ? `Quartos: ${answer.quartos}+` : '',
    ].filter(Boolean).join(' | ')

    try {
      await fetch(`${API_URL}/api/v1/public/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email || undefined,
          interest: answer.objetivo === 'rent' ? 'rent' : 'buy',
          message,
          utmSource: 'quiz',
          utmMedium: 'homepage',
          utmCampaign: 'smart_quiz',
        }),
      })
    } catch {
      // fail silently — still redirect
    }

    setDone(true)
    setSubmitting(false)

    // Build search URL
    setTimeout(() => {
      const params = new URLSearchParams()
      if (answer.tipo) params.set('type', answer.tipo)
      if (answer.cidade) params.set('city', answer.cidade)
      if (answer.objetivo === 'rent' || answer.objetivo === 'season') params.set('purpose', 'RENT')
      if (answer.objetivo === 'buy' || answer.objetivo === 'invest') params.set('purpose', 'SALE')
      if (answer.quartos) params.set('bedrooms', answer.quartos)
      if (minPrice && minPrice !== '0') params.set('minPrice', minPrice)
      if (maxPrice && maxPrice !== '99999999') params.set('maxPrice', maxPrice)
      router.push(`/imoveis?${params.toString()}`)
    }, 2500)
  }

  function handleBack() {
    if (step > 0) setStep(step - 1)
  }

  function open() {
    setIsOpen(true)
    setStep(0)
    setAnswer({})
    setDone(false)
    setFormData({ name: '', phone: '', email: '' })
  }

  // Prevent scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <SmartQuizContext.Provider value={{ open }}>
      {children}
      {/* ── Modal overlay ───────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false) }}
        >
          <div
            className="relative w-full sm:max-w-md bg-white sm:rounded-3xl overflow-hidden"
            style={{ maxHeight: '95dvh', borderRadius: '24px 24px 0 0', boxShadow: '0 -4px 60px rgba(0,0,0,0.2)' }}
          >
            {/* ── Header ── */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-5 pt-5 pb-3">
              {/* Progress bar */}
              <div className="flex items-center gap-3 mb-3">
                {step > 0 && !transitioning && !done && (
                  <button
                    onClick={handleBack}
                    className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                    style={{ color: '#1B2B5B' }}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #1B2B5B, #C9A84C)' }}
                  />
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* AI avatar + step counter */}
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
                  style={{ background: 'linear-gradient(135deg, #1B2B5B, #2d4a99)' }}
                >
                  🤖
                </div>
                <span className="text-xs text-gray-500">
                  {done ? 'Concluído!' : `Pergunta ${Math.min(step + 1, totalSteps)} de ${totalSteps}`}
                </span>
              </div>
            </div>

            {/* ── Body ── */}
            <div className="overflow-y-auto px-5 pb-8" style={{ maxHeight: 'calc(95dvh - 100px)' }}>

              {/* Transition message */}
              {transitioning && (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl"
                    style={{ background: 'linear-gradient(135deg, #1B2B5B15, #C9A84C15)' }}>
                    🤖
                  </div>
                  <p className="text-gray-700 font-medium text-base max-w-xs mx-auto">{transitionMsg}</p>
                  <div className="flex justify-center gap-1 mt-4">
                    <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              {/* Done screen */}
              {done && !transitioning && (
                <div className="py-12 text-center">
                  <div
                    className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #25D36620, #128C7E20)' }}
                  >
                    <CheckCircle2 className="w-10 h-10" style={{ color: '#25D366' }} />
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
                    Perfeito, {formData.name.split(' ')[0]}!
                  </h3>
                  <p className="text-gray-500 text-sm mb-2">
                    Sua consulta foi registrada e um corretor entrará em contato em breve.
                  </p>
                  <p className="text-gray-500 text-xs">Redirecionando para os imóveis encontrados...</p>
                  <Loader2 className="w-5 h-5 mx-auto mt-4 animate-spin text-gray-300" />
                </div>
              )}

              {/* Quiz question */}
              {!transitioning && !done && step < totalSteps && (
                <div className="pt-2">
                  <h3 className="text-xl font-bold mb-1 leading-snug" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
                    {currentStep.question}
                  </h3>
                  <p className="text-gray-500 text-sm mb-6 leading-relaxed">{currentStep.subtitle}</p>

                  <div className="flex flex-col gap-3">
                    {currentStep.options.map(opt => (
                      <button
                        key={opt.value + opt.label}
                        onClick={() => handleOption(opt.value)}
                        className="flex items-center gap-3.5 w-full text-left px-4 py-3.5 rounded-2xl border-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
                        style={{
                          borderColor: '#e5e7eb',
                          backgroundColor: 'white',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = '#C9A84C'
                          e.currentTarget.style.backgroundColor = '#fdf9f0'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = '#e5e7eb'
                          e.currentTarget.style.backgroundColor = 'white'
                        }}
                      >
                        <span className="text-xl w-8 text-center shrink-0">{opt.emoji}</span>
                        <span className="text-sm font-medium text-gray-800">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact form (final step) */}
              {!transitioning && !done && step >= totalSteps && (
                <div className="pt-2">
                  <div
                    className="rounded-2xl p-4 mb-6 flex items-start gap-3"
                    style={{ backgroundColor: '#f0ede6' }}
                  >
                    <span className="text-xl shrink-0">🤖</span>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Encontrei <strong style={{ color: '#1B2B5B' }}>imóveis perfeitos</strong> para você! Me passa seus dados para eu personalizar ainda mais e ter um corretor disponível para te ajudar.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Seu nome *</label>
                      <input
                        type="text"
                        required
                        placeholder="Como podemos te chamar?"
                        value={formData.name}
                        onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none transition-colors"
                        style={{ borderColor: '#e5e7eb' }}
                        onFocus={e => e.target.style.borderColor = '#C9A84C'}
                        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">WhatsApp / Telefone *</label>
                      <input
                        ref={phoneRef}
                        type="tel"
                        required
                        placeholder="(16) 9 0000-0000"
                        value={formData.phone}
                        onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none transition-colors"
                        style={{ borderColor: '#e5e7eb' }}
                        onFocus={e => e.target.style.borderColor = '#C9A84C'}
                        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">E-mail <span className="font-normal text-gray-500">(opcional)</span></label>
                      <input
                        type="email"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none transition-colors"
                        style={{ borderColor: '#e5e7eb' }}
                        onFocus={e => e.target.style.borderColor = '#C9A84C'}
                        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || !formData.name || !formData.phone}
                      className="w-full py-4 rounded-xl text-sm font-bold transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
                      style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', color: 'white' }}
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>🔍</span>}
                      {submitting ? 'Buscando...' : 'Ver meus imóveis recomendados'}
                    </button>
                    <p className="text-center text-xs text-gray-500">
                      Seus dados são protegidos e não serão compartilhados.
                    </p>
                  </form>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </SmartQuizContext.Provider>
  )
}

// ── SmartQuizModal: wrapper que provê o contexto + modal (usado na página) ──────
export function SmartQuizModal({ children }: { children?: React.ReactNode }) {
  return <SmartQuiz>{children}</SmartQuiz>
}

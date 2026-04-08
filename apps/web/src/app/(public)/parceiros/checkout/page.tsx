'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  CreditCard, QrCode, FileText, CheckCircle2, Loader2,
  ArrowLeft, Shield, Star, Crown, Zap, AlertCircle,
  Copy, ExternalLink, ChevronRight,
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

const PLAN_INFO: Record<string, { name: string; price: number; icon: React.ReactNode; color: string; bg: string; features: string[]; dashboardTools: { icon: string; name: string; desc: string }[] }> = {
  PRIME: {
    name: 'Lite',
    price: 79.90,
    icon: <Star className="w-6 h-6 text-[#C9A84C]" />,
    color: '#C9A84C',
    bg: 'rgba(201,168,76,0.1)',
    features: [
      'Até 10 anúncios ativos',
      'Selo Verificado ✓',
      'Link de WhatsApp direto',
      'Filtros de busca avançados',
      'Topo das buscas por bairro',
    ],
    dashboardTools: [
      { icon: '📊', name: 'Analytics', desc: 'Visualizações e cliques no WhatsApp' },
      { icon: '🔍', name: 'Filtros', desc: 'Busca avançada por bairro e tipo' },
    ],
  },
  MODERADO: {
    name: 'Moderado',
    price: 279,
    icon: <Star className="w-6 h-6 text-[#C9A84C]" />,
    color: '#C9A84C',
    bg: 'rgba(201,168,76,0.1)',
    features: [
      'Até 30 anúncios ativos',
      'I.A. de ROI (10 análises/mês)',
      'Alertas de oportunidades',
      'Selo Verificado ✓',
      'Topo das buscas por bairro',
      'Dashboard de analytics completo',
    ],
    dashboardTools: [
      { icon: '📊', name: 'Analytics', desc: 'Visualizações e cliques no WhatsApp' },
      { icon: '🧮', name: 'Calculadora ROI', desc: 'Score de oportunidade em leilões' },
      { icon: '🔔', name: 'Alertas', desc: 'Leilões com desconto > 40%' },
    ],
  },
  VIP: {
    name: 'Pro',
    price: 499,
    icon: <Crown className="w-6 h-6 text-[#1B2B5B]" />,
    color: '#1B2B5B',
    bg: 'rgba(27,43,91,0.08)',
    features: [
      'Até 100 anúncios ativos',
      'I.A. Ilimitada (ROI + Fotos + Dossiês)',
      'Edição de fotos profissional com I.A.',
      'Alertas em tempo real',
      'Banner em condomínios de luxo',
      'Destaque no mapa de busca',
      'Relatórios mensais de desempenho',
    ],
    dashboardTools: [
      { icon: '📊', name: 'Analytics', desc: 'Visualizações e cliques no WhatsApp' },
      { icon: '🧮', name: 'Calculadora ROI', desc: 'Score de oportunidade em leilões' },
      { icon: '🔔', name: 'Alertas', desc: 'Leilões com desconto > 40%' },
      { icon: '🛡️', name: 'Sentinela Territorial', desc: 'Monitoramento exclusivo de bairros' },
      { icon: '📈', name: 'Relatório Mensal', desc: 'PDF com performance e ROI' },
    ],
  },
}

type BillingType = 'PIX' | 'BOLETO' | 'CREDIT_CARD'

interface CheckoutResult {
  subscriptionId: string
  pixQrCode?: string
  pixCopiaECola?: string
  bankSlipUrl?: string
  invoiceUrl?: string
  status: string
}

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const plan = (searchParams.get('plan') ?? 'PRIME') as 'PRIME' | 'VIP'
  const specialistId = searchParams.get('specialistId') ?? ''

  const [step, setStep] = useState<'form' | 'processing' | 'success' | 'error'>('form')
  const [billingType, setBillingType] = useState<BillingType>('PIX')
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState<CheckoutResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [isFounder, setIsFounder] = useState(false)

  const planInfo = PLAN_INFO[plan] ?? PLAN_INFO.PRIME
  const isVIP = plan === 'VIP'

  // Se não tem specialistId, redireciona para cadastro
  useEffect(() => {
    if (!specialistId) {
      router.replace(`/parceiros/cadastro?plan=${plan}`)
    }
  }, [specialistId, plan, router])

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!cpfCnpj.replace(/\D/g, '')) {
      setError('Informe seu CPF ou CNPJ para continuar.')
      return
    }

    setStep('processing')

    try {
      const res = await fetch(`${API_URL}/api/v1/specialists/payments/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specialistId,
          plan,
          billingType,
          cpfCnpj: cpfCnpj.replace(/\D/g, ''),
          name,
          email,
          phone,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'ASAAS_NOT_CONFIGURED') {
          // Fallback: registrar interesse e mostrar mensagem
          setResult({
            subscriptionId: 'PENDING_MANUAL',
            status: 'PENDING',
          })
          setStep('success')
          return
        }
        setError(data.message ?? data.error ?? 'Erro ao processar pagamento. Tente novamente.')
        setStep('form')
        return
      }

      setResult(data)
      setStep('success')
    } catch {
      setError('Erro de conexão. Verifique sua internet e tente novamente.')
      setStep('form')
    }
  }

  const copyPix = () => {
    if (result?.pixCopiaECola) {
      navigator.clipboard.writeText(result.pixCopiaECola)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatCpfCnpj = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 14)
    if (digits.length <= 11) {
      return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
        .replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3')
        .replace(/(\d{3})(\d{0,3})/, '$1.$2')
    }
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
      .replace(/(\d{2})(\d{3})(\d{3})(\d{0,4})/, '$1.$2.$3/$4')
      .replace(/(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3')
      .replace(/(\d{2})(\d{0,3})/, '$1.$2')
  }

  return (
    <div className="min-h-screen bg-[#f8f6f1]">
      {/* Header */}
      <header className="bg-[#1B2B5B] py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Image src="/logo-ae-v2.png" alt="AgoraEncontrei" width={140} height={40} className="h-8 w-auto" />
          </Link>
          <Link href="/seja-parceiro" className="text-white/70 hover:text-white text-sm transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* ── FORMULÁRIO ─────────────────────────────────────────────────── */}
        {(step === 'form' || step === 'processing') && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {/* Resumo do plano */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-2xl border p-6 sticky top-24">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Resumo do pedido</p>

                <div
                  className="flex items-center gap-3 p-4 rounded-xl mb-4"
                  style={{ backgroundColor: planInfo.bg, border: `1px solid ${planInfo.color}30` }}
                >
                  {planInfo.icon}
                  <div>
                    <p className="font-bold text-[#1B2B5B]">Plano {planInfo.name}</p>
                    <p className="text-xs text-gray-500">Assinatura mensal recorrente</p>
                  </div>
                </div>

                <ul className="space-y-2 mb-6">
                  {planInfo.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="border-t pt-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-gray-500 text-sm">Total mensal</span>
                    <span className="text-2xl font-bold text-[#1B2B5B]">{fmt(planInfo.price)}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Renovação automática. Cancele quando quiser.</p>
                </div>

                <div className="mt-4 p-3 bg-green-50 rounded-xl border border-green-100 flex items-start gap-2">
                  <Shield className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-green-700">Pagamento 100% seguro via Asaas. Seus dados estão protegidos.</p>
                </div>
              </div>
            </div>

            {/* Formulário de pagamento */}
            <div className="md:col-span-3">
              <div className="bg-white rounded-2xl border p-6">
                <h1 className="text-xl font-bold text-[#1B2B5B] mb-6">Dados de pagamento</h1>

                {error && (
                  <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-xl mb-6 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Forma de pagamento */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Forma de pagamento</label>
                    <div className="grid grid-cols-3 gap-3">
                      {([
                        { type: 'PIX' as BillingType, icon: <QrCode className="w-5 h-5" />, label: 'PIX' },
                        { type: 'BOLETO' as BillingType, icon: <FileText className="w-5 h-5" />, label: 'Boleto' },
                        { type: 'CREDIT_CARD' as BillingType, icon: <CreditCard className="w-5 h-5" />, label: 'Cartão' },
                      ]).map(({ type, icon, label }) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setBillingType(type)}
                          className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-sm font-medium"
                          style={{
                            borderColor: billingType === type ? planInfo.color : '#e5e7eb',
                            backgroundColor: billingType === type ? `${planInfo.color}10` : 'white',
                            color: billingType === type ? planInfo.color : '#6b7280',
                          }}
                        >
                          {icon}
                          {label}
                        </button>
                      ))}
                    </div>
                    {billingType === 'CREDIT_CARD' && (
                      <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Para cartão de crédito, você será redirecionado para a página de pagamento segura do Asaas.
                      </p>
                    )}
                  </div>

                  {/* Nome */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nome completo</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Seu nome completo"
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B2B5B] transition-colors"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">E-mail</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B2B5B] transition-colors"
                    />
                  </div>

                  {/* CPF/CNPJ */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">CPF ou CNPJ</label>
                    <input
                      type="text"
                      value={cpfCnpj}
                      onChange={e => setCpfCnpj(formatCpfCnpj(e.target.value))}
                      placeholder="000.000.000-00"
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B2B5B] transition-colors"
                    />
                  </div>

                  {/* Telefone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">WhatsApp / Telefone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="(16) 99999-9999"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B2B5B] transition-colors"
                    />
                  </div>

                  {/* ── Aceite de Termos de Membro Fundador ─────────────── */}
                  {isVIP && (
                    <div className="rounded-xl border-2 p-4 mb-2" style={{ borderColor: '#C9A84C', backgroundColor: 'rgba(201,168,76,0.06)' }}>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isFounder}
                          onChange={e => setIsFounder(e.target.checked)}
                          className="mt-0.5 w-4 h-4 accent-yellow-500 flex-shrink-0"
                        />
                        <span className="text-xs text-gray-700 leading-relaxed">
                          <strong className="text-[#1B2B5B]">Quero ser Membro Fundador 💎</strong> — Meu preço de R$ 497/mês fica congelado vitaliciamente enquanto a assinatura estiver ativa. Recebo o selo exclusivo &quot;Fundador&quot; e prioridade máxima (score 100) em todos os meus territórios.
                        </span>
                      </label>
                    </div>
                  )}

                  <label className="flex items-start gap-3 cursor-pointer mb-2">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={e => setAcceptedTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-blue-600 flex-shrink-0"
                    />
                    <span className="text-xs text-gray-600 leading-relaxed">
                      Li e concordo com os{' '}
                      <Link href="/termos-uso" className="underline text-[#1B2B5B] hover:text-blue-700" target="_blank">Termos de Uso</Link>{' '}e com os{' '}
                      <Link href="/parceiros/membro-fundador" className="underline text-[#C9A84C] hover:text-yellow-700" target="_blank">Termos de Parceria</Link>.
                      Autorizo a cobrança recorrente mensal e o cancelamento sem multa a qualquer momento.
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={step === 'processing' || !acceptedTerms}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ backgroundColor: planInfo.color, color: plan === 'PRIME' ? '#1B2B5B' : 'white' }}
                  >
                    {step === 'processing' ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Processando...</>
                    ) : (
                      <>Confirmar assinatura {planInfo.name} — {fmt(planInfo.price)}/mês <ChevronRight className="w-5 h-5" /></>
                    )}
                  </button>

                  {!acceptedTerms && (
                    <p className="text-center text-xs text-amber-600">
                      ⚠️ Aceite os termos acima para continuar.
                    </p>
                  )}
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ── SUCESSO ─────────────────────────────────────────────────────── */}
        {step === 'success' && result && (
          <div className="max-w-xl mx-auto">
            <div className="bg-white rounded-2xl border p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>

              {result.subscriptionId === 'PENDING_MANUAL' ? (
                <>
                  <h1 className="text-2xl font-bold text-[#1B2B5B] mb-3">Interesse registrado! 🎉</h1>
                  <p className="text-gray-600 mb-6">
                    Nossa equipe entrará em contato em até <strong>2 horas</strong> para finalizar sua assinatura do Plano {planInfo.name}.
                  </p>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-700">
                    <p>Enquanto isso, seu perfil já está cadastrado e será ativado após a confirmação do pagamento.</p>
                  </div>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-[#1B2B5B] mb-3">Assinatura criada! 🎉</h1>
                  <p className="text-gray-600 mb-6">
                    Plano <strong>{planInfo.name}</strong> ativado. Seu perfil será promovido em até 24h após confirmação do pagamento.
                  </p>

                  {/* PIX */}
                  {billingType === 'PIX' && result.pixQrCode && (
                    <div className="mb-6">
                      <p className="text-sm font-semibold text-gray-700 mb-3">Escaneie o QR Code PIX:</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`data:image/png;base64,${result.pixQrCode}`}
                        alt="QR Code PIX"
                        className="w-48 h-48 mx-auto mb-4 rounded-xl border"
                      />
                      {result.pixCopiaECola && (
                        <button
                          onClick={copyPix}
                          className="flex items-center gap-2 mx-auto px-4 py-2 bg-[#1B2B5B] text-white rounded-xl text-sm font-medium hover:bg-[#162247] transition-colors"
                        >
                          {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {copied ? 'Copiado!' : 'Copiar código PIX'}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Boleto */}
                  {billingType === 'BOLETO' && result.bankSlipUrl && (
                    <div className="mb-6">
                      <a
                        href={result.bankSlipUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#1B2B5B] text-white rounded-xl font-semibold hover:bg-[#162247] transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" /> Abrir boleto bancário
                      </a>
                    </div>
                  )}

                  {/* Link de fatura */}
                  {result.invoiceUrl && (
                    <div className="mb-6">
                      <a
                        href={result.invoiceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-[#1B2B5B] underline hover:text-[#162247]"
                      >
                        Ver fatura completa
                      </a>
                    </div>
                  )}
                </>
              )}

              {/* Dashboard tools preview */}
              <div className="bg-[#f8f6f1] rounded-2xl p-5 mb-6 text-left">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Ferramentas do seu dashboard privado</p>
                <div className="space-y-2">
                  {planInfo.dashboardTools.map((tool: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-lg">{tool.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-[#1B2B5B]">{tool.name}</p>
                        <p className="text-xs text-gray-400">{tool.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aviso de ativação */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-700 text-left">
                <p className="font-semibold mb-1">⚡ Ativação automática</p>
                <p className="text-xs leading-relaxed">
                  {billingType === 'PIX'
                    ? 'Após o pagamento via PIX, seu dashboard será ativado em instantes automaticamente.'
                    : billingType === 'BOLETO'
                    ? 'Após a compensação do boleto (até 3 dias úteis), seu dashboard será ativado automaticamente.'
                    : 'Após a confirmação do cartão, seu dashboard será ativado em instantes automaticamente.'
                  }
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Link
                  href="/meu-painel"
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all"
                  style={{ backgroundColor: planInfo.color, color: plan === 'PRIME' ? '#1B2B5B' : 'white' }}
                >
                  Acessar meu dashboard privado →
                </Link>
                <div className="flex gap-3">
                  <Link
                    href="/parceiros"
                    className="flex-1 px-5 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors text-sm text-center"
                  >
                    Ver Parceiros
                  </Link>
                  <Link
                    href="/"
                    className="flex-1 px-5 py-2.5 bg-[#1B2B5B] text-white rounded-xl font-semibold hover:bg-[#162247] transition-colors text-sm text-center"
                  >
                    Ir para o Início
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1B2B5B]" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}

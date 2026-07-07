'use client'

/**
 * Assinatura dos planos PRIME/VIP (ferramentas + dashboard do corretor).
 * Fluxo legado da linha "Seja um Parceiro": cadastro do especialista →
 * checkout Asaas (com aporte). Diferente de /parceiros/cadastro, que é o
 * fluxo de "Divulgue seu Negócio" (landing page, R$ 39,90/mês, sem aporte).
 */
import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  User, Mail, Phone, Building2, Award, Instagram, Globe, Briefcase,
  Camera, Scale, Wrench, Palette, Video, Star, Crown, CheckCircle2,
  ChevronRight, Loader2, ArrowLeft,
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

const CATEGORIES = [
  { value: 'IMOBILIARIA',         label: 'Imobiliária',             icon: Building2, registry: 'CRECI' },
  { value: 'LOTEADORA',           label: 'Loteadora',               icon: Building2, registry: 'CRECI' },
  { value: 'CORRETOR',            label: 'Corretor(a)',             icon: Briefcase, registry: 'CRECI' },
  { value: 'ARQUITETO',           label: 'Arquiteto(a)',            icon: Building2, registry: 'CAU' },
  { value: 'ENGENHEIRO',          label: 'Engenheiro(a)',           icon: Wrench,    registry: 'CREA' },
  { value: 'AVALIADOR',           label: 'Avaliador(a)',            icon: Star,      registry: 'CREA' },
  { value: 'DESIGNER_INTERIORES', label: 'Designer de Interiores',  icon: Palette },
  { value: 'FOTOGRAFO',           label: 'Fotógrafo(a)',            icon: Camera },
  { value: 'VIDEOMAKER',          label: 'Videomaker',              icon: Video },
  { value: 'ADVOGADO_IMOBILIARIO',label: 'Advogado(a) Imobiliário', icon: Scale,     registry: 'OAB' },
  { value: 'DESPACHANTE',         label: 'Despachante',             icon: Award },
  { value: 'OUTRO',               label: 'Outro',                   icon: User },
]

function AssinarContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const plan = ((searchParams.get('plan') || 'PRIME').toUpperCase()) as 'PRIME' | 'VIP'
  const [step, setStep] = useState<'category' | 'info'>('category')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    category: '', name: '', email: '', phone: '', whatsapp: '', cpfcnpj: '',
    bio: '', crea: '', instagram: '', website: '',
  })

  const selectedCategory = CATEGORIES.find(c => c.value === form.category)
  const input = 'w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 bg-white text-[16px]'

  const handleSubmit = async () => {
    if (!form.name || !form.email) { setError('Preencha nome e e-mail.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API_URL}/api/v1/specialists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, email: form.email,
          phone: form.phone || undefined, whatsapp: form.whatsapp || undefined,
          category: form.category || 'OUTRO', bio: form.bio || undefined,
          crea: form.crea || undefined, instagram: form.instagram || undefined,
          website: form.website || undefined,
          cpfcnpj: form.cpfcnpj.replace(/\D/g, '') || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao cadastrar. Tente novamente.'); setLoading(false); return }
      router.push(`/parceiros/checkout?plan=${plan}&specialistId=${data.data.id}`)
    } catch {
      setError('Erro de conexão. Tente novamente.'); setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f6f1] to-white">
      <header className="bg-[#143A1F] py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/"><Image src="/brand/ae-lockup-full.png" alt="Agora Encontrei" width={168} height={61} className="h-8 w-auto" /></Link>
          <Link href="/parceiros/planos" className="text-white/70 hover:text-white text-sm flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Planos</Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-6 flex items-center gap-3 p-4 rounded-2xl border" style={{ backgroundColor: plan === 'VIP' ? 'rgba(20,58,31,0.05)' : 'rgba(201,168,76,0.08)', borderColor: plan === 'VIP' ? 'rgba(20,58,31,0.2)' : 'rgba(201,168,76,0.3)' }}>
          {plan === 'VIP' ? <Crown className="w-5 h-5" style={{ color: '#143A1F' }} /> : <Star className="w-5 h-5" style={{ color: '#C9A84C' }} />}
          <div>
            <p className="text-sm font-bold" style={{ color: '#143A1F' }}>Plano {plan} — R$ {plan === 'VIP' ? '497' : '197'}/mês</p>
            <p className="text-xs text-gray-500">Inclui aporte inicial único de implantação, cobrado com a 1ª mensalidade. Após o cadastro você vai ao checkout.</p>
          </div>
        </div>

        {step === 'category' && (
          <div>
            <h1 className="text-2xl font-bold text-[#143A1F] mb-1">Sua especialidade</h1>
            <p className="text-gray-500 mb-6">Escolha sua área para continuar a assinatura.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon
                return (
                  <button key={cat.value} onClick={() => { setForm(f => ({ ...f, category: cat.value })); setStep('info') }}
                    className="flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-gray-100 hover:border-[#C9A84C] transition-all text-left">
                    <div className="w-10 h-10 bg-[#f8f6f1] rounded-lg flex items-center justify-center flex-shrink-0"><Icon className="w-5 h-5 text-[#143A1F]" /></div>
                    <p className="font-semibold text-[#143A1F]">{cat.label}</p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {step === 'info' && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              {selectedCategory && <div className="w-10 h-10 bg-[#C9A84C]/10 rounded-lg flex items-center justify-center"><selectedCategory.icon className="w-5 h-5 text-[#C9A84C]" /></div>}
              <div>
                <h1 className="text-2xl font-bold text-[#143A1F]">Seus dados</h1>
                <p className="text-gray-500 text-sm">{selectedCategory?.label}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome completo *" className={input} /></div>
              <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="E-mail *" className={input} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Telefone" className={input} /></div>
                <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="WhatsApp" className={input} /></div>
              </div>
              <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={form.cpfcnpj} onChange={e => setForm(f => ({ ...f, cpfcnpj: e.target.value }))} placeholder="CPF ou CNPJ" className={input} /></div>
              {selectedCategory?.registry && (
                <div className="relative"><Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={form.crea} onChange={e => setForm(f => ({ ...f, crea: e.target.value }))} placeholder={`${selectedCategory.registry} (opcional)`} className={input} /></div>
              )}
              <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3} placeholder="Apresentação profissional" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 bg-white text-[16px] resize-none" />
              <div className="grid grid-cols-2 gap-4">
                <div className="relative"><Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={form.instagram} onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))} placeholder="@instagram" className={input} /></div>
                <div className="relative"><Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="Site" className={input} /></div>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setStep('category')} className="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">Voltar</button>
              <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-[#143A1F] text-white py-3 rounded-xl font-semibold hover:bg-[#0E2A15] flex items-center justify-center gap-2 disabled:opacity-60">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</> : <>Ir para o pagamento <ChevronRight className="w-4 h-4" /></>}
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-3 text-center">{error}</p>}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AssinarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#f8f6f1]"><Loader2 className="w-8 h-8 animate-spin text-[#C9A84C]" /></div>}>
      <AssinarContent />
    </Suspense>
  )
}

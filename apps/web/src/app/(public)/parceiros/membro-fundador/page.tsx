import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle, Star, Shield, Clock, Zap, Crown, ArrowRight, Phone } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Membro Fundador — Plano Elite R$ 497/mês | AgoraEncontrei',
  description: 'Seja um Membro Fundador do AgoraEncontrei. Preço congelado vitalício, prioridade nas buscas, leads qualificados e selo exclusivo.',
  robots: { index: true, follow: true },
}

export default function MembroFundadorPage() {
  return (
    <div className="min-h-screen bg-[#f8f6f1]">
      {/* Hero */}
      <section className="relative overflow-hidden py-16 px-4" style={{ background: 'linear-gradient(135deg, #1B2B5B 0%, #0f1c3a 50%, #1a1a2e 100%)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #C9A84C 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold mb-6" style={{ backgroundColor: '#C9A84C', color: '#1B2B5B' }}>
            <Crown className="w-4 h-4" /> Vagas Limitadas — Membro Fundador
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            Plano Elite{' '}
            <span style={{ color: '#C9A84C' }}>Membro Fundador</span>
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto mb-8">
            Garanta seu lugar como parceiro fundador do maior marketplace imobiliário do Brasil.
            Preço congelado vitalício.
          </p>
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="text-3xl text-white/40 line-through">R$ 997</span>
            <span className="text-5xl font-bold text-white">R$ 497</span>
            <span className="text-white/60 text-lg">/mês</span>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="max-w-4xl mx-auto px-4 -mt-8 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: <Zap className="w-6 h-6" />, title: 'Priority Placement', desc: 'Sua marca no topo das buscas de bairros e condomínios selecionados' },
            { icon: <Star className="w-6 h-6" />, title: 'Leads Qualificados', desc: 'Acesso direto a leads de leilões e imóveis de alto ROI' },
            { icon: <Shield className="w-6 h-6" />, title: 'Badge Founder', desc: 'Selo exclusivo no perfil aumentando autoridade em 40%' },
            { icon: <Clock className="w-6 h-6" />, title: 'Preço Congelado', desc: 'R$ 497/mês vitalício. Preço regular: R$ 997/mês' },
          ].map((b, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-lg border text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#f0ece4', color: '#C9A84C' }}>
                {b.icon}
              </div>
              <h3 className="font-bold text-gray-800 text-sm mb-1">{b.title}</h3>
              <p className="text-xs text-gray-500">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Termos do Contrato */}
      <section className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b" style={{ backgroundColor: '#f8f6f1' }}>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#C9A84C]" />
              Termos de Parceria — Membro Fundador AgoraEncontrei
            </h2>
          </div>

          <div className="px-6 py-6 space-y-6 text-sm text-gray-700 leading-relaxed">
            <div>
              <h3 className="font-bold text-gray-800 mb-2">1. Objeto</h3>
              <p>
                Acesso vitalício (enquanto durar a assinatura) ao <strong>Plano Elite</strong> com congelamento
                de preço em <strong>R$ 497,00/mês</strong> (quatrocentos e noventa e sete reais).
                O preço regular para novos assinantes será de R$ 997,00/mês.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-800 mb-2">2. Benefícios Exclusivos</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Priority Placement:</strong> Sua marca no topo das buscas orgânicas de bairros e condomínios selecionados no marketplace.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Leads Qualificados:</strong> Acesso direto a leads que interagirem com leilões e imóveis de alto ROI na plataforma.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Badge Founder:</strong> Selo exclusivo de "Membro Fundador" no perfil, aumentando a autoridade percebida em 40%.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Suporte Prioritário:</strong> Canal direto com a equipe AgoraEncontrei para dúvidas e ajustes.</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-gray-800 mb-2">3. Compromisso de Qualidade</h3>
              <p>
                O parceiro se compromete a responder aos leads gerados pela plataforma em no máximo
                <strong> 4 horas comerciais</strong> para manter o selo de verificação e o posicionamento
                prioritário. O não cumprimento por 3 vezes consecutivas poderá resultar na perda temporária
                do selo até regularização.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-800 mb-2">4. Rescisão</h3>
              <p>
                Cancelamento <strong>livre a qualquer momento</strong>, sem multas ou taxas de rescisão.
                Ao cancelar, o parceiro perde a condição de preço "Membro Fundador" e, caso deseje retornar,
                pagará o preço vigente na data da reativação.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-800 mb-2">5. Pagamento</h3>
              <p>
                A cobrança será realizada mensalmente via PIX, boleto ou cartão de crédito,
                no valor de <strong>R$ 497,00</strong>. O primeiro pagamento garante a ativação
                imediata de todos os benefícios.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="px-6 py-6 border-t" style={{ backgroundColor: '#fffdf5' }}>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/parceiros/cadastro"
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base active:scale-[0.98] transition-transform"
                style={{ backgroundColor: '#C9A84C', color: '#1B2B5B' }}>
                <Crown className="w-5 h-5" /> Quero ser Membro Fundador
              </Link>
              <a href="https://wa.me/5516981010004?text=Olá! Tenho interesse no Plano Membro Fundador do AgoraEncontrei."
                target="_blank" rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base text-white active:scale-[0.98] transition-transform"
                style={{ backgroundColor: '#25D366' }}>
                <Phone className="w-5 h-5" /> Falar com Tomás
              </a>
            </div>
            <p className="text-xs text-gray-400 text-center mt-3">
              Cancelamento livre a qualquer momento. Sem multas.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

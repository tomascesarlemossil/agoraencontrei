import type { Metadata } from 'next'
import Link from 'next/link'
import { CreditCard, Phone, MessageSquare, Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: '2ª Via de Boleto | AgoraEncontrei — Imobiliária Lemos',
  description: 'Solicite a 2ª via do seu boleto de aluguel. Entre em contato com a Imobiliária Lemos pelo WhatsApp, telefone ou e-mail. Franca/SP.',
}

export default function SegundaViaBoletoPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f6f1' }}>
      <section className="py-16 text-center" style={{ backgroundColor: '#1B2B5B' }}>
        <div className="max-w-3xl mx-auto px-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(201,168,76,0.15)' }}>
            <CreditCard className="w-8 h-8" style={{ color: '#C9A84C' }} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: 'Georgia, serif' }}>2ª Via de Boleto</h1>
          <p className="text-white/70">Solicite a segunda via do seu boleto de aluguel de forma rápida e segura.</p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl p-8 border mb-6" style={{ borderColor: '#e8e4dc' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>Como solicitar</h2>
          <p className="text-gray-600 mb-6">Para receber a 2ª via do seu boleto de aluguel, entre em contato com nossa equipe por um dos canais abaixo. Tenha em mãos o número do seu contrato ou o CPF do titular.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a
              href="https://wa.me/5516981010004?text=Olá! Preciso da 2ª via do meu boleto de aluguel."
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-dashed hover:border-solid transition-all group"
              style={{ borderColor: '#25D366' }}
            >
              <MessageSquare className="w-8 h-8" style={{ color: '#25D366' }} />
              <div className="text-center">
                <p className="font-bold text-sm" style={{ color: '#25D366' }}>WhatsApp</p>
                <p className="text-xs text-gray-500 mt-1">(16) 98101-0004</p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full text-white" style={{ backgroundColor: '#25D366' }}>Atendimento imediato</span>
            </a>

            <a
              href="tel:+551637230045"
              className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-dashed hover:border-solid transition-all"
              style={{ borderColor: '#1B2B5B' }}
            >
              <Phone className="w-8 h-8" style={{ color: '#1B2B5B' }} />
              <div className="text-center">
                <p className="font-bold text-sm" style={{ color: '#1B2B5B' }}>Telefone</p>
                <p className="text-xs text-gray-500 mt-1">(16) 3723-0045</p>
              </div>
              <span className="text-xs text-gray-500">Seg-Sex: 8h–18h | Sáb: 8h–12h</span>
            </a>

            <a
              href="mailto:contato@imobiliarialemos.com.br?subject=Solicitação 2ª Via de Boleto"
              className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-dashed hover:border-solid transition-all"
              style={{ borderColor: '#C9A84C' }}
            >
              <Mail className="w-8 h-8" style={{ color: '#C9A84C' }} />
              <div className="text-center">
                <p className="font-bold text-sm" style={{ color: '#C9A84C' }}>E-mail</p>
                <p className="text-xs text-gray-500 mt-1">contato@imobiliarialemos.com.br</p>
              </div>
              <span className="text-xs text-gray-500">Resposta em até 1 dia útil</span>
            </a>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: '#e8e4dc' }}>
          <h3 className="font-bold mb-2" style={{ color: '#1B2B5B' }}>Informações necessárias</h3>
          <ul className="text-sm text-gray-600 space-y-1.5">
            <li>• Número do contrato de locação</li>
            <li>• CPF do titular do contrato</li>
            <li>• Mês de referência do boleto</li>
          </ul>
        </div>

        <div className="mt-6 text-center">
          <Link href="/servicos" className="text-sm font-medium hover:opacity-80" style={{ color: '#1B2B5B' }}>
            ← Voltar aos serviços
          </Link>
        </div>
      </section>
    </div>
  )
}

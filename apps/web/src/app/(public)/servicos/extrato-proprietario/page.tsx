import type { Metadata } from 'next'
import Link from 'next/link'
import { BarChart3, MessageSquare, Mail, Lock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Extrato do Proprietário | AgoraEncontrei — Imobiliária Lemos',
  description: 'Proprietários: consulte o extrato de repasses, aluguéis recebidos e despesas dos seus imóveis administrados pela Imobiliária Lemos em Franca/SP.',
}

export default function ExtratoProprietarioPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f6f1' }}>
      <section className="py-16 text-center" style={{ backgroundColor: '#1B2B5B' }}>
        <div className="max-w-3xl mx-auto px-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(201,168,76,0.15)' }}>
            <BarChart3 className="w-8 h-8" style={{ color: '#C9A84C' }} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: 'Georgia, serif' }}>Extrato do Proprietário</h1>
          <p className="text-white/70">Acompanhe os repasses, aluguéis recebidos e despesas dos seus imóveis.</p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl p-8 border mb-6" style={{ borderColor: '#e8e4dc' }}>
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-5 h-5" style={{ color: '#1B2B5B' }} />
            <h2 className="text-xl font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>Área Restrita ao Proprietário</h2>
          </div>
          <p className="text-gray-600 mb-6">
            O extrato de repasses está disponível mediante solicitação à nossa equipe. Para proprietários com acesso ao sistema, utilize o painel de controle com suas credenciais.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <a
              href="https://wa.me/5516981010004?text=Olá! Sou proprietário e gostaria de receber o extrato dos meus imóveis."
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 p-4 rounded-2xl border transition-all hover:shadow-md"
              style={{ borderColor: '#25D366' }}
            >
              <MessageSquare className="w-6 h-6 flex-shrink-0" style={{ color: '#25D366' }} />
              <div>
                <p className="font-bold text-sm" style={{ color: '#25D366' }}>WhatsApp</p>
                <p className="text-xs text-gray-500">(16) 98101-0004</p>
              </div>
            </a>
            <a
              href="mailto:contato@imobiliarialemos.com.br?subject=Extrato do Proprietário"
              className="flex items-center gap-3 p-4 rounded-2xl border transition-all hover:shadow-md"
              style={{ borderColor: '#C9A84C' }}
            >
              <Mail className="w-6 h-6 flex-shrink-0" style={{ color: '#C9A84C' }} />
              <div>
                <p className="font-bold text-sm" style={{ color: '#C9A84C' }}>E-mail</p>
                <p className="text-xs text-gray-500">contato@imobiliarialemos.com.br</p>
              </div>
            </a>
          </div>

          <div className="p-4 rounded-xl text-sm" style={{ backgroundColor: '#f0ece4' }}>
            <p className="font-semibold mb-1" style={{ color: '#1B2B5B' }}>O extrato inclui:</p>
            <ul className="text-gray-600 space-y-1">
              <li>• Aluguéis recebidos no período</li>
              <li>• Repasses realizados ao proprietário</li>
              <li>• Taxas de administração</li>
              <li>• Despesas e manutenções</li>
              <li>• Saldo disponível</li>
            </ul>
          </div>
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

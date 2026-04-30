/**
 * Página de sucesso pós-checkout.
 *
 * O parceiro chega aqui depois de criar a assinatura. Mostra próximos
 * passos claros: pagar no Asaas, conferir caixa de entrada para receber
 * as credenciais, e link do site/painel. Quando o webhook do Asaas
 * processar o pagamento, ele dispara o e-mail/WhatsApp com a senha.
 */

import Link from 'next/link'
import { CheckCircle2, Mail, Smartphone, ExternalLink, Globe, LogIn } from 'lucide-react'

export const metadata = {
  title: 'Assinatura criada — AgoraEncontrei',
  robots: { index: false, follow: false },
}

interface PageProps {
  searchParams: Promise<{ ref?: string; payment?: string }>
}

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const params = await searchParams
  const subdomain = (params.ref || '').replace(/[^a-z0-9-]/g, '')
  const siteUrl = subdomain ? `https://${subdomain}.agoraencontrei.com.br` : null
  const paymentUrl = params.payment ? `https://www.asaas.com/c/${params.payment}` : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1B2B5B] to-[#0f1c3a] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-8 text-white text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Assinatura criada!</h1>
            <p className="text-emerald-50">
              Falta um passo: confirmar o pagamento. Em seguida seu site fica no ar.
            </p>
          </div>

          {/* Steps */}
          <div className="p-8 space-y-6">
            <Step
              number={1}
              done={false}
              title="Pague no Asaas"
              description="Boleto, PIX ou cartão. O link abre na nova aba."
            >
              {paymentUrl ? (
                <a
                  href={paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-sm"
                >
                  Ir para o pagamento <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <p className="text-sm text-gray-600 mt-2">
                  Verifique seu e-mail — também enviamos o link de pagamento por lá.
                </p>
              )}
            </Step>

            <Step
              number={2}
              done={false}
              title="Receba as credenciais"
              description="Assim que o pagamento for confirmado pelo Asaas, enviamos o login e a senha temporária por:"
            >
              <ul className="mt-2 space-y-1 text-sm text-gray-700">
                <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-amber-600" /> E-mail cadastrado</li>
                <li className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-amber-600" /> WhatsApp (se informado)</li>
              </ul>
            </Step>

            <Step
              number={3}
              done={false}
              title="Acesse o painel e personalize"
              description="No primeiro acesso troque a senha em Perfil → Segurança e edite tema, cor, logo e cadastre seus imóveis."
            >
              <Link
                href="/login"
                className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-lg bg-[#1B2B5B] hover:bg-[#243b78] text-white font-medium text-sm"
              >
                <LogIn className="w-4 h-4" /> Ir para o login
              </Link>
            </Step>

            {siteUrl && (
              <div className="border-t border-gray-200 pt-6">
                <p className="text-sm text-gray-600 mb-2">Seu site (estará no ar após confirmação do pagamento):</p>
                <a
                  href={siteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium"
                >
                  <Globe className="w-4 h-4" /> {siteUrl} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          <div className="bg-gray-50 px-8 py-4 text-center text-xs text-gray-500">
            Dúvidas? Responda o e-mail de boas-vindas ou chame no WhatsApp pelo site.
          </div>
        </div>
      </div>
    </div>
  )
}

function Step({
  number,
  done,
  title,
  description,
  children,
}: {
  number: number
  done: boolean
  title: string
  description: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex gap-4">
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
          done
            ? 'bg-emerald-500 text-white'
            : 'bg-amber-100 text-amber-700 border-2 border-amber-600'
        }`}
      >
        {done ? <CheckCircle2 className="w-5 h-5" /> : number}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 mt-0.5">{description}</p>
        {children}
      </div>
    </div>
  )
}

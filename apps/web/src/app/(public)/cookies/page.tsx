import type { Metadata } from 'next'
import Link from 'next/link'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Política de Cookies | AgoraEncontrei',
  description:
    'Como o AgoraEncontrei usa cookies e tecnologias semelhantes, quais categorias existem e como você pode gerenciar suas preferências. Conforme a LGPD (Lei nº 13.709/2018).',
  alternates: { canonical: 'https://www.agoraencontrei.com.br/cookies' },
}

const NAVY = '#1B2B5B'

const CATEGORIAS = [
  {
    t: 'Estritamente necessários',
    base: 'Sempre ativos',
    d: 'Essenciais para o funcionamento do site — login, segurança, preferências de sessão e o registro do seu consentimento. Sem eles o site não funciona; por isso não podem ser desativados.',
  },
  {
    t: 'Analíticos / de desempenho',
    base: 'Opcional (consentimento)',
    d: 'Ajudam a entender como os visitantes usam o site (páginas mais vistas, tempo de navegação) para melhorarmos a experiência. Ex.: Google Analytics. Só são ativados se você aceitar.',
  },
  {
    t: 'Marketing',
    base: 'Opcional (consentimento)',
    d: 'Usados para mensurar campanhas e mostrar anúncios mais relevantes. Ex.: Meta Pixel. Só são ativados se você aceitar.',
  },
]

export default function CookiesPage() {
  return (
    <div className="bg-[#f8f6f1]">
      <section className="px-4 py-14 text-white" style={{ background: `linear-gradient(135deg, ${NAVY}, #0f1c3a)` }}>
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: 'Georgia, serif' }}>
            Política de Cookies
          </h1>
          <p className="mt-3 text-white/70">
            Última atualização: junho de 2026 · Em conformidade com a LGPD (Lei nº 13.709/2018).
          </p>
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-4 py-12 text-gray-700 leading-relaxed">
        <h2 className="mb-3 text-xl font-bold" style={{ color: NAVY }}>O que são cookies?</h2>
        <p className="mb-8">
          Cookies são pequenos arquivos de texto que um site armazena no seu navegador para lembrar
          informações sobre sua visita — como manter você conectado, guardar preferências ou medir o uso
          das páginas. Usamos também tecnologias semelhantes (como armazenamento local) para os mesmos fins.
        </p>

        <h2 className="mb-3 text-xl font-bold" style={{ color: NAVY }}>Categorias que utilizamos</h2>
        <div className="mb-8 space-y-4">
          {CATEGORIAS.map((c) => (
            <div key={c.t} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold" style={{ color: NAVY }}>{c.t}</h3>
                <span className="rounded-full bg-[#C9A84C]/15 px-3 py-0.5 text-xs font-semibold text-amber-700">{c.base}</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">{c.d}</p>
            </div>
          ))}
        </div>

        <h2 className="mb-3 text-xl font-bold" style={{ color: NAVY }}>Como gerenciar suas preferências</h2>
        <p className="mb-4">
          Na sua primeira visita, mostramos um banner onde você pode <strong>Aceitar</strong> ou{' '}
          <strong>Rejeitar</strong> os cookies opcionais (analíticos e de marketing). Os cookies
          estritamente necessários permanecem ativos por serem essenciais.
        </p>
        <p className="mb-4">
          Você pode <strong>rever ou alterar sua escolha</strong> a qualquer momento limpando os dados do
          site no seu navegador (o banner reaparece) ou ajustando as configurações de cookies do próprio
          navegador (Chrome, Safari, Firefox e Edge permitem bloquear ou apagar cookies por site).
        </p>
        <p className="mb-8">
          Bloquear cookies necessários pode afetar funcionalidades como login e segurança.
        </p>

        <h2 className="mb-3 text-xl font-bold" style={{ color: NAVY }}>Cookies de terceiros</h2>
        <p className="mb-8">
          Alguns recursos dependem de serviços externos que podem definir seus próprios cookies — por
          exemplo Google (Analytics, Maps/Street View) e Meta (Pixel). O uso desses dados é regido também
          pelas políticas de privacidade dessas empresas.
        </p>

        <h2 className="mb-3 text-xl font-bold" style={{ color: NAVY }}>Mais informações</h2>
        <p className="mb-8">
          Para entender como tratamos seus dados pessoais de forma mais ampla, consulte a nossa{' '}
          <Link href="/politica-privacidade" className="font-semibold text-[#1B2B5B] underline">
            Política de Privacidade
          </Link>
          . Dúvidas sobre cookies ou privacidade podem ser enviadas pelo nosso{' '}
          <Link href="/contato" className="font-semibold text-[#1B2B5B] underline">canal de contato</Link>.
        </p>

        <div className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-500">
          AgoraEncontrei — Imobiliária Lemos. Esta política pode ser atualizada periodicamente; a data no
          topo indica a última revisão.
        </div>
      </article>
    </div>
  )
}

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos de Uso | AgoraEncontrei - Imobiliaria Lemos',
  description:
    'Termos de Uso do site AgoraEncontrei, plataforma da Imobiliaria Lemos em Franca/SP. Condicoes de acesso e utilizacao do site.',
}

export default function TermosUsoPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: '#f9f7f4' }}>
      {/* Hero */}
      <section
        className="py-16 text-white text-center"
        style={{ background: 'linear-gradient(135deg, #1B2B5B 0%, #2d4a8a 60%, #1B2B5B 100%)' }}
      >
        <div className="max-w-4xl mx-auto px-4">
          <p
            className="text-sm font-semibold uppercase tracking-widest mb-3"
            style={{ color: '#C9A84C' }}
          >
            Imobiliaria Lemos — Franca/SP
          </p>
          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Termos de Uso
          </h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto">
            Condicoes para acesso e utilizacao do site AgoraEncontrei.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl shadow-sm p-8 md:p-12 space-y-10">
          {/* Intro */}
          <section>
            <p className="text-gray-600 leading-relaxed">
              Estes Termos de Uso regulam o acesso e a utilizacao do site{' '}
              <strong style={{ color: '#1B2B5B' }}>AgoraEncontrei</strong>, operado pela{' '}
              <strong style={{ color: '#1B2B5B' }}>Imobiliaria Lemos</strong>, inscrita no CNPJ sob
              o n. 10.962.301/0001-50, com sede em Franca/SP. Ao acessar e utilizar este site, voce
              concorda com os termos e condicoes aqui estabelecidos.
            </p>
            <p className="text-gray-500 text-sm mt-4">
              Ultima atualizacao: abril de 2026.
            </p>
          </section>

          {/* 1 */}
          <section>
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}
            >
              1. Objeto
            </h2>
            <p className="text-gray-600 leading-relaxed">
              O site AgoraEncontrei tem como finalidade a divulgacao de imoveis disponiveis para venda
              e locacao, bem como a prestacao de informacoes sobre os servicos oferecidos pela
              Imobiliaria Lemos, incluindo intermediacao imobiliaria e administracao de alugueis.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}
            >
              2. Acesso ao Site
            </h2>
            <p className="text-gray-600 leading-relaxed">
              O acesso ao site e gratuito e aberto ao publico. Determinadas funcionalidades, como o
              envio de propostas ou agendamento de visitas, podem exigir o preenchimento de formularios
              com dados pessoais, conforme descrito em nossa{' '}
              <a
                href="/politica-privacidade"
                className="underline font-semibold transition-colors hover:opacity-80"
                style={{ color: '#C9A84C' }}
              >
                Politica de Privacidade
              </a>
              .
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}
            >
              3. Conteudo e Propriedade Intelectual
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Todo o conteudo disponivel no site — incluindo textos, imagens, logotipos, layouts e
              codigo-fonte — e de propriedade da Imobiliaria Lemos ou licenciado para uso nesta
              plataforma. E proibida a reproducao, distribuicao ou modificacao de qualquer conteudo sem
              autorizacao previa e expressa.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}
            >
              4. Informacoes sobre Imoveis
            </h2>
            <p className="text-gray-600 leading-relaxed">
              As informacoes sobre imoveis (precos, areas, descricoes e fotos) sao fornecidas com base
              nos dados disponiveis no momento da publicacao. A Imobiliaria Lemos empenha-se em manter
              as informacoes atualizadas, mas nao garante a ausencia de eventuais divergencias. Os
              valores e a disponibilidade estao sujeitos a alteracao sem aviso previo. Somente a
              formalizacao contratual gera vinculo entre as partes.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}
            >
              5. Responsabilidades do Usuario
            </h2>
            <p className="text-gray-600 mb-3 leading-relaxed">
              Ao utilizar o site, o usuario compromete-se a:
            </p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span style={{ color: '#C9A84C' }} className="font-bold mt-0.5">&#x2022;</span>
                <span>Fornecer informacoes veridicas e atualizadas nos formularios;</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#C9A84C' }} className="font-bold mt-0.5">&#x2022;</span>
                <span>Nao utilizar o site para fins ilicitos ou contrarios a boa-fe;</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#C9A84C' }} className="font-bold mt-0.5">&#x2022;</span>
                <span>Nao tentar obter acesso nao autorizado a sistemas ou dados;</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#C9A84C' }} className="font-bold mt-0.5">&#x2022;</span>
                <span>Respeitar os direitos de propriedade intelectual sobre o conteudo do site.</span>
              </li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}
            >
              6. Limitacao de Responsabilidade
            </h2>
            <p className="text-gray-600 leading-relaxed">
              A Imobiliaria Lemos nao se responsabiliza por: interrupcoes temporarias no acesso ao
              site por motivos tecnicos ou de manutencao; danos decorrentes do uso de informacoes
              obtidas no site sem a devida verificacao; ou acoes de terceiros que comprometam a
              seguranca do usuario fora do ambiente do site.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}
            >
              7. Privacidade e Dados Pessoais
            </h2>
            <p className="text-gray-600 leading-relaxed">
              O tratamento de dados pessoais coletados atraves deste site e regido por nossa{' '}
              <a
                href="/politica-privacidade"
                className="underline font-semibold transition-colors hover:opacity-80"
                style={{ color: '#C9A84C' }}
              >
                Politica de Privacidade
              </a>
              , elaborada em conformidade com a Lei Geral de Protecao de Dados (LGPD - Lei
              13.709/2018).
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}
            >
              8. Alteracoes nos Termos
            </h2>
            <p className="text-gray-600 leading-relaxed">
              A Imobiliaria Lemos reserva-se o direito de alterar estes Termos de Uso a qualquer
              momento, publicando a versao atualizada nesta pagina. O uso continuado do site apos
              alteracoes constitui aceitacao dos novos termos.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}
            >
              9. Legislacao Aplicavel e Foro
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Estes Termos de Uso sao regidos pela legislacao brasileira. Fica eleito o foro da
              Comarca de Franca/SP para dirimir quaisquer controversias decorrentes destes termos, com
              renuncia a qualquer outro, por mais privilegiado que seja.
            </p>
          </section>

          {/* 10. Contato */}
          <section>
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}
            >
              10. Contato
            </h2>
            <div className="p-6 rounded-2xl" style={{ backgroundColor: '#f9f7f4' }}>
              <p className="text-gray-600 leading-relaxed">
                Em caso de duvidas sobre estes Termos de Uso, entre em contato:
              </p>
              <p className="text-gray-600 mt-2">
                <strong style={{ color: '#1B2B5B' }}>Imobiliaria Lemos</strong> — CNPJ
                10.962.301/0001-50
              </p>
              <a
                href="mailto:tomas@agoraencontrei.com.br"
                className="inline-flex items-center gap-2 mt-3 px-6 py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90"
                style={{ backgroundColor: '#1B2B5B' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
                tomas@agoraencontrei.com.br
              </a>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

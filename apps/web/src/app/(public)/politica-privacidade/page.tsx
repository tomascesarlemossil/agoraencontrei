import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politica de Privacidade | AgoraEncontrei - Imobiliaria Lemos',
  description:
    'Politica de Privacidade da Imobiliaria Lemos (AgoraEncontrei). Saiba como coletamos, usamos e protegemos seus dados pessoais conforme a LGPD.',
}

export default function PoliticaPrivacidadePage() {
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
            Politica de Privacidade
          </h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto">
            Transparencia e seguranca no tratamento dos seus dados pessoais.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl shadow-sm p-8 md:p-12 space-y-10">
          {/* Intro */}
          <section>
            <p className="text-gray-600 leading-relaxed">
              A <strong style={{ color: '#1B2B5B' }}>Imobiliaria Lemos</strong>, inscrita no CNPJ
              sob o n. 10.962.301/0001-50, com sede em Franca/SP, responsavel pela plataforma{' '}
              <strong style={{ color: '#1B2B5B' }}>AgoraEncontrei</strong>, apresenta esta Politica
              de Privacidade em conformidade com a{' '}
              <strong>Lei Geral de Protecao de Dados Pessoais (LGPD - Lei 13.709/2018)</strong>.
            </p>
            <p className="text-gray-500 text-sm mt-4">
              Ultima atualizacao: abril de 2026.
            </p>
          </section>

          {/* 1. Dados Coletados */}
          <section>
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}
            >
              1. Dados Pessoais Coletados
            </h2>
            <p className="text-gray-600 mb-3 leading-relaxed">
              Coletamos os seguintes dados pessoais, de acordo com a finalidade do relacionamento:
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ backgroundColor: '#f9f7f4' }}>
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5"
                  style={{ backgroundColor: '#1B2B5B' }}
                >
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: '#1B2B5B' }}>Visitantes e Leads</p>
                  <p className="text-gray-600 text-sm">Nome, e-mail e telefone (formularios de contato e interesse em imoveis).</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ backgroundColor: '#f9f7f4' }}>
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5"
                  style={{ backgroundColor: '#1B2B5B' }}
                >
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: '#1B2B5B' }}>Clientes (Locatarios e Compradores)</p>
                  <p className="text-gray-600 text-sm">Nome, e-mail, telefone e CPF, necessarios para formalizacao de contratos e gestao de locacoes.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ backgroundColor: '#f9f7f4' }}>
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5"
                  style={{ backgroundColor: '#1B2B5B' }}
                >
                  <span className="text-white text-xs font-bold">3</span>
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: '#1B2B5B' }}>Dados de Navegacao</p>
                  <p className="text-gray-600 text-sm">Endereco IP, tipo de navegador, paginas acessadas e dados de cookies (conforme secao 5).</p>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Finalidade */}
          <section>
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}
            >
              2. Finalidade do Tratamento
            </h2>
            <p className="text-gray-600 mb-3 leading-relaxed">
              Os dados pessoais sao tratados para as seguintes finalidades:
            </p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span style={{ color: '#C9A84C' }} className="font-bold mt-0.5">&#x2022;</span>
                <span>Prestacao de servicos imobiliarios (compra, venda e locacao de imoveis);</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#C9A84C' }} className="font-bold mt-0.5">&#x2022;</span>
                <span>Gestao de leads e atendimento a interessados;</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#C9A84C' }} className="font-bold mt-0.5">&#x2022;</span>
                <span>Administracao de locacoes e contratos de aluguel;</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#C9A84C' }} className="font-bold mt-0.5">&#x2022;</span>
                <span>Comunicacao sobre novos imoveis e oportunidades;</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#C9A84C' }} className="font-bold mt-0.5">&#x2022;</span>
                <span>Cumprimento de obrigacoes legais e regulatorias;</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#C9A84C' }} className="font-bold mt-0.5">&#x2022;</span>
                <span>Analise de uso do site para melhoria da experiencia do usuario.</span>
              </li>
            </ul>
          </section>

          {/* 3. Base Legal */}
          <section>
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}
            >
              3. Base Legal
            </h2>
            <p className="text-gray-600 leading-relaxed">
              O tratamento dos dados pessoais e realizado com base nas seguintes hipoteses legais
              previstas na LGPD (Lei 13.709/2018): <strong>consentimento</strong> do titular (Art. 7,
              I); <strong>execucao de contrato</strong> ou de procedimentos preliminares (Art. 7, V);{' '}
              <strong>cumprimento de obrigacao legal</strong> ou regulatoria (Art. 7, II); e{' '}
              <strong>interesse legitimo</strong> do controlador (Art. 7, IX), quando aplicavel.
            </p>
          </section>

          {/* 4. Compartilhamento */}
          <section>
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}
            >
              4. Compartilhamento com Terceiros
            </h2>
            <p className="text-gray-600 mb-3 leading-relaxed">
              Seus dados podem ser compartilhados com os seguintes prestadores de servico, exclusivamente
              para as finalidades descritas nesta politica:
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl text-center" style={{ backgroundColor: '#f9f7f4' }}>
                <p className="font-semibold text-sm" style={{ color: '#1B2B5B' }}>Google Analytics (GA4)</p>
                <p className="text-gray-500 text-xs mt-1">Analise de trafego e comportamento de navegacao</p>
              </div>
              <div className="p-4 rounded-2xl text-center" style={{ backgroundColor: '#f9f7f4' }}>
                <p className="font-semibold text-sm" style={{ color: '#1B2B5B' }}>Facebook / Meta Pixel</p>
                <p className="text-gray-500 text-xs mt-1">Campanhas de marketing e remarketing</p>
              </div>
              <div className="p-4 rounded-2xl text-center" style={{ backgroundColor: '#f9f7f4' }}>
                <p className="font-semibold text-sm" style={{ color: '#1B2B5B' }}>Asaas</p>
                <p className="text-gray-500 text-xs mt-1">Processamento de pagamentos e cobrancas</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm mt-4 leading-relaxed">
              Nao vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para
              finalidades diferentes das aqui descritas.
            </p>
          </section>

          {/* 5. Cookies */}
          <section>
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}
            >
              5. Cookies
            </h2>
            <p className="text-gray-600 mb-3 leading-relaxed">
              Utilizamos cookies e tecnologias semelhantes para melhorar sua experiencia em nosso site:
            </p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span style={{ color: '#C9A84C' }} className="font-bold mt-0.5">&#x2022;</span>
                <span><strong>Cookies de Analise (Google Analytics / GA4):</strong> para entender como os visitantes utilizam o site, coletar dados estatisticos anonimos e melhorar nossos servicos.</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#C9A84C' }} className="font-bold mt-0.5">&#x2022;</span>
                <span><strong>Cookies de Marketing (Meta Pixel):</strong> para medir a eficacia de campanhas publicitarias e exibir anuncios relevantes nas plataformas do Facebook e Instagram.</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#C9A84C' }} className="font-bold mt-0.5">&#x2022;</span>
                <span><strong>Cookies Essenciais:</strong> necessarios para o funcionamento basico do site, como preferencias de navegacao.</span>
              </li>
            </ul>
            <p className="text-gray-600 text-sm mt-4">
              Voce pode gerenciar suas preferencias de cookies diretamente nas configuracoes do seu navegador.
            </p>
          </section>

          {/* 6. Direitos do Titular */}
          <section>
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}
            >
              6. Seus Direitos (LGPD)
            </h2>
            <p className="text-gray-600 mb-3 leading-relaxed">
              Conforme a LGPD, voce tem os seguintes direitos sobre seus dados pessoais:
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { title: 'Acesso', desc: 'Solicitar uma copia dos seus dados pessoais que tratamos.' },
                { title: 'Correcao', desc: 'Solicitar a correcao de dados incompletos, inexatos ou desatualizados.' },
                { title: 'Eliminacao', desc: 'Solicitar a exclusao dos seus dados pessoais, quando aplicavel.' },
                { title: 'Portabilidade', desc: 'Solicitar a transferencia dos seus dados a outro fornecedor de servico.' },
                { title: 'Revogacao', desc: 'Revogar o consentimento a qualquer momento, sem prejudizo do tratamento anterior.' },
                { title: 'Informacao', desc: 'Ser informado sobre o compartilhamento dos seus dados com terceiros.' },
              ].map((right) => (
                <div key={right.title} className="flex items-start gap-3 p-4 rounded-2xl" style={{ backgroundColor: '#f9f7f4' }}>
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: '#C9A84C' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#1B2B5B' }}>{right.title}</p>
                    <p className="text-gray-600 text-xs mt-0.5">{right.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 7. Retencao */}
          <section>
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}
            >
              7. Prazo de Retencao dos Dados
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Os dados pessoais serao retidos pelos seguintes periodos:
            </p>
            <ul className="space-y-2 text-gray-600 mt-3">
              <li className="flex items-start gap-2">
                <span style={{ color: '#C9A84C' }} className="font-bold mt-0.5">&#x2022;</span>
                <span><strong>Dados contratuais</strong> (clientes, locatarios): retidos por <strong>5 (cinco) anos</strong> apos o termino do contrato, conforme obrigacoes legais e fiscais.</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#C9A84C' }} className="font-bold mt-0.5">&#x2022;</span>
                <span><strong>Dados de leads</strong> (visitantes e interessados): retidos por <strong>2 (dois) anos</strong> apos o ultimo contato, salvo solicitacao de exclusao anterior.</span>
              </li>
            </ul>
            <p className="text-gray-600 text-sm mt-4">
              Apos os prazos acima, os dados serao anonimizados ou eliminados de forma segura.
            </p>
          </section>

          {/* 8. Seguranca */}
          <section>
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}
            >
              8. Medidas de Seguranca
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Adotamos medidas tecnicas e administrativas aptas a proteger os dados pessoais de acessos
              nao autorizados e de situacoes acidentais ou ilicitas de destruicao, perda, alteracao,
              comunicacao ou difusao, incluindo:
            </p>
            <ul className="space-y-2 text-gray-600 mt-3">
              <li className="flex items-start gap-2">
                <span style={{ color: '#C9A84C' }} className="font-bold mt-0.5">&#x2022;</span>
                <span>Criptografia SSL/TLS em todas as comunicacoes do site;</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#C9A84C' }} className="font-bold mt-0.5">&#x2022;</span>
                <span>Controle de acesso restrito a dados pessoais;</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#C9A84C' }} className="font-bold mt-0.5">&#x2022;</span>
                <span>Monitoramento e auditoria de acessos;</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#C9A84C' }} className="font-bold mt-0.5">&#x2022;</span>
                <span>Backups periodicos e armazenamento seguro.</span>
              </li>
            </ul>
          </section>

          {/* 9. Controlador */}
          <section>
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}
            >
              9. Controlador e Contato
            </h2>
            <div className="p-6 rounded-2xl" style={{ backgroundColor: '#f9f7f4' }}>
              <p className="text-gray-600 leading-relaxed">
                <strong style={{ color: '#1B2B5B' }}>Controlador:</strong> Imobiliaria Lemos
              </p>
              <p className="text-gray-600">
                <strong style={{ color: '#1B2B5B' }}>CNPJ:</strong> 10.962.301/0001-50
              </p>
              <p className="text-gray-600">
                <strong style={{ color: '#1B2B5B' }}>Endereco:</strong> Franca/SP
              </p>
              <p className="text-gray-600 mt-3">
                Para exercer seus direitos ou esclarecer duvidas sobre o tratamento de dados pessoais,
                entre em contato:
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

          {/* 10. Alteracoes */}
          <section>
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}
            >
              10. Alteracoes nesta Politica
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Esta Politica de Privacidade podera ser atualizada periodicamente para refletir mudancas em
              nossas praticas ou em decorrencia de alteracoes legais. Recomendamos que voce revise esta
              pagina regularmente. A data da ultima atualizacao sera sempre indicada no inicio do
              documento.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}

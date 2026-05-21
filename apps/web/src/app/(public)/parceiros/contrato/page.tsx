import Link from 'next/link'
import { ArrowLeft, ShieldCheck, FileText } from 'lucide-react'

export const metadata = {
  title: 'Contrato de Adesão — Parceiros | AgoraEncontrei',
  description: 'Termos e condições de contratação dos planos e serviços AgoraEncontrei.',
  robots: { index: false, follow: false },
}

const APORTE = 990
const APORTE_PIX = 922.68

function Clause({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-sm font-bold text-[#1B2B5B] mb-2">{n}. {title}</h2>
      <div className="text-sm text-gray-600 leading-relaxed space-y-2">{children}</div>
    </div>
  )
}

export default function ContratoPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f6f1' }}>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/parceiros/planos" className="inline-flex items-center gap-1.5 text-sm text-[#1B2B5B] mb-6 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Voltar aos planos
        </Link>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-10">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-6 h-6" style={{ color: '#C9A84C' }} />
            <h1 className="text-xl sm:text-2xl font-bold text-[#1B2B5B]" style={{ fontFamily: 'Georgia, serif' }}>
              Contrato de Adesão e Licença de Uso
            </h1>
          </div>
          <p className="text-xs text-gray-400 mb-6">
            Plataforma AgoraEncontrei · Imobiliária Lemos · Última atualização: maio de 2026
          </p>

          {/* Aviso */}
          <div className="mb-8 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              Esta é uma minuta padrão de adesão. Recomenda-se a revisão por advogado antes da
              assinatura. Ao contratar qualquer plano ou serviço, o CONTRATANTE declara ter lido e
              concordado integralmente com as cláusulas abaixo.
            </p>
          </div>

          <Clause n="1" title="Das Partes e do Objeto">
            <p>
              O presente contrato regula a adesão do CONTRATANTE (parceiro, corretor, imobiliária
              ou profissional) aos planos, ferramentas e serviços disponibilizados pela CONTRATADA
              (AgoraEncontrei / Imobiliária Lemos), incluindo licença de uso do sistema (SaaS),
              perfil público, dashboard de inteligência, CRM e demais funcionalidades contratadas.
            </p>
            <p>
              A contratação é uma licença de uso pessoal, intransferível e não exclusiva. Não há
              transferência de propriedade do software, do código-fonte ou de qualquer ativo da
              CONTRATADA.
            </p>
          </Clause>

          <Clause n="2" title="Do Investimento Inicial (Aporte)">
            <p>
              Toda contratação está condicionada ao pagamento de um <strong>aporte inicial único de
              implantação no valor de R$ {APORTE.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>,
              cobrado no ato da adesão, com as seguintes formas de pagamento:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>À vista via PIX:</strong> R$ {APORTE_PIX.toLocaleString('pt-BR', { minimumFractionDigits: 2 })},
                com desconto de 6,80%, aprovação imediata; ou
              </li>
              <li>
                <strong>Parcelado:</strong> R$ {APORTE.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} no
                boleto ou cartão de crédito, podendo ser dividido em parcelas, sujeito às taxas da
                operadora/instituição financeira.
              </li>
            </ul>
            <p>
              As parcelas mensais do plano escolhido (Prime, VIP ou outro) iniciam-se conjuntamente
              com o aporte inicial.
            </p>
          </Clause>

          <Clause n="3" title="Dos Valores e do Reajuste">
            <p>
              Os valores praticados <strong>não são fixos</strong>. A CONTRATADA poderá reajustar e
              atualizar os valores do aporte, das mensalidades e dos serviços <strong>a cada 5 (cinco)
              meses</strong>, mediante comunicação prévia ao CONTRATANTE por e-mail, WhatsApp ou pelo
              painel.
            </p>
            <p>
              Caso o CONTRATANTE não concorde com o novo valor, poderá manifestar-se no prazo
              indicado na comunicação. Não havendo acordo, tampouco o pagamento dos valores
              atualizados no vencimento, a CONTRATADA poderá <strong>suspender o acesso ao painel, ao
              site e ao sistema, bem como despublicar o perfil público</strong> do CONTRATANTE, até a
              regularização ou a celebração de novo acordo.
            </p>
          </Clause>

          <Clause n="4" title="Da Suspensão e Inadimplência">
            <p>
              O atraso ou a ausência de pagamento de qualquer valor (aporte, mensalidade ou serviço)
              autoriza a CONTRATADA, após aviso prévio, a suspender total ou parcialmente os acessos,
              o site e as funcionalidades, bem como a remover temporariamente o perfil público de
              circulação, até a quitação do débito.
            </p>
            <p>
              A suspensão por inadimplência não exonera o CONTRATANTE das obrigações financeiras já
              vencidas.
            </p>
          </Clause>

          <Clause n="5" title="Da Propriedade Intelectual">
            <p>
              Todo o sistema, código-fonte, arquitetura, design, marca, identidade visual, textos,
              banco de dados, algoritmos, modelos de inteligência artificial, imagens e qualquer
              conteúdo da plataforma são de <strong>propriedade exclusiva da CONTRATADA</strong>,
              protegidos pela legislação de direitos autorais e propriedade industrial (Lei
              9.610/98, Lei 9.279/96 e Lei 9.609/98 — software).
            </p>
            <p>
              É <strong>expressamente vedado</strong> ao CONTRATANTE e a terceiros: copiar, reproduzir,
              distribuir, sublicenciar, realizar engenharia reversa, descompilar, extrair dados em
              massa (scraping), capturar imagens/conteúdo de forma automatizada, ou criar obra
              derivada, no todo ou em parte, sob pena de responsabilização civil e criminal.
            </p>
          </Clause>

          <Clause n="6" title="Da Confidencialidade">
            <p>
              As informações técnicas, comerciais, dados de clientes e quaisquer informações não
              públicas a que o CONTRATANTE tiver acesso são confidenciais e não poderão ser divulgadas
              ou utilizadas para finalidade diversa da execução deste contrato, mesmo após o seu
              término.
            </p>
          </Clause>

          <Clause n="7" title="Da Proteção de Dados (LGPD)">
            <p>
              As partes comprometem-se a observar a Lei 13.709/2018 (LGPD). Os dados pessoais tratados
              na plataforma são utilizados exclusivamente para a prestação dos serviços, com medidas
              técnicas e organizacionais de segurança. O CONTRATANTE, quando atuar como controlador de
              dados de seus próprios clientes, é responsável pela base legal do tratamento.
            </p>
          </Clause>

          <Clause n="8" title="Da Vigência e Rescisão">
            <p>
              O contrato vigora por prazo indeterminado a partir da adesão. Pode ser rescindido por
              qualquer das partes mediante comunicação prévia. O aporte inicial não é reembolsável
              após a implantação. Valores de mensalidade já vencidos permanecem devidos.
            </p>
          </Clause>

          <Clause n="9" title="Do Foro">
            <p>
              Fica eleito o foro da Comarca de Franca/SP para dirimir quaisquer controvérsias
              decorrentes deste contrato, com renúncia a qualquer outro, por mais privilegiado que
              seja.
            </p>
          </Clause>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 leading-relaxed">
              Ao prosseguir com a contratação, o CONTRATANTE declara estar ciente e de acordo com
              todas as cláusulas acima, em especial quanto ao aporte inicial (cláusula 2), ao reajuste
              de valores a cada 5 meses (cláusula 3) e às vedações de propriedade intelectual
              (cláusula 5).
            </p>
            <Link
              href="/parceiros/planos"
              className="mt-5 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:brightness-110"
              style={{ backgroundColor: '#C9A84C', color: '#1B2B5B' }}
            >
              Voltar e escolher meu plano
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

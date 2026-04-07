import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, Quote, Star, MessageSquareHeart } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Depoimentos | AgoraEncontrei — Imobiliária Lemos — Franca/SP',
  description:
    'Veja o que nossos clientes dizem sobre a Imobiliária Lemos e o AgoraEncontrei. Depoimentos reais de compradores, inquilinos e proprietários satisfeitos em Franca/SP.',
  keywords: [
    'depoimentos imobiliária lemos',
    'depoimentos agoraencontrei',
    'avaliações clientes',
    'Franca SP',
    'imobiliária confiável',
    'opinião clientes imobiliária',
  ],
  openGraph: {
    title: 'Depoimentos | AgoraEncontrei — Imobiliária Lemos',
    description:
      'Veja o que nossos clientes dizem. Mais de 22 anos de confiança em Franca/SP.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'AgoraEncontrei — Imobiliária Lemos',
  },
}

const TESTIMONIALS = [
  {
    name: 'Mariana C. Oliveira',
    initials: 'MC',
    role: 'Compradora',
    stars: 5,
    text: 'A equipe da Imobiliária Lemos foi extremamente atenciosa durante todo o processo de compra do meu apartamento. Desde a primeira visita até a entrega das chaves, me senti segura e bem orientada. Recomendo de olhos fechados!',
  },
  {
    name: 'Ricardo A. Santos',
    initials: 'RA',
    role: 'Comprador',
    stars: 5,
    text: 'Depois de meses procurando casa em Franca, encontrei o imóvel perfeito com a ajuda da Imobiliária Lemos. O atendimento personalizado fez toda a diferença. A Noêmia entendeu exatamente o que eu precisava.',
  },
  {
    name: 'Fernanda L. Costa',
    initials: 'FL',
    role: 'Inquilina',
    stars: 5,
    text: 'Aluguei meu apartamento pela Imobiliária Lemos e a experiência foi impecável. O contrato foi claro, sem surpresas, e sempre que precisei de suporte, a equipe respondeu rapidamente. Estou muito satisfeita!',
  },
  {
    name: 'Carlos E. Ferreira',
    initials: 'CE',
    role: 'Proprietário',
    stars: 4,
    text: 'Tenho dois imóveis administrados pela Imobiliária Lemos há mais de 5 anos. A gestão é transparente, os repasses são pontuais e a comunicação é excelente. Confio plenamente no trabalho deles.',
  },
  {
    name: 'Patrícia R. Almeida',
    initials: 'PR',
    role: 'Compradora',
    stars: 5,
    text: 'Realizei o sonho da casa própria graças à orientação da equipe. Eles me ajudaram com toda a documentação e até com o financiamento bancário. Profissionalismo do início ao fim!',
  },
  {
    name: 'João V. Mendes',
    initials: 'JV',
    role: 'Inquilino',
    stars: 4,
    text: 'Mudei para Franca a trabalho e precisava de um imóvel urgente. A equipe foi ágil e me apresentou várias opções dentro do meu orçamento. Em menos de uma semana já estava instalado. Muito grato!',
  },
  {
    name: 'Luciana M. Barbosa',
    initials: 'LM',
    role: 'Proprietária',
    stars: 5,
    text: 'A avaliação do meu imóvel foi feita com muito critério e profissionalismo. Consegui vender pelo valor justo em pouco tempo. A Imobiliária Lemos realmente conhece o mercado de Franca.',
  },
  {
    name: 'André S. Pereira',
    initials: 'AS',
    role: 'Comprador',
    stars: 5,
    text: 'Comprei um terreno para investimento e fui muito bem assessorado pela equipe. Eles me mostraram as melhores opções com potencial de valorização. Já estou pensando no próximo investimento com eles!',
  },
]

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Avaliação: ${count} de 5 estrelas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className="text-lg"
          style={{ color: i < count ? '#C9A84C' : '#d1d5db' }}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </div>
  )
}

export default function DepoimentosPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: '#f9f7f4' }}>
      {/* Hero */}
      <section
        className="py-20 text-white text-center"
        style={{
          background:
            'linear-gradient(135deg, #1B2B5B 0%, #2d4a8a 60%, #1B2B5B 100%)',
        }}
      >
        <div className="max-w-4xl mx-auto px-4">
          <p
            className="text-sm font-semibold uppercase tracking-widest mb-3"
            style={{ color: '#C9A84C' }}
          >
            Imobiliária Lemos — Franca/SP
          </p>
          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Depoimentos
          </h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto">
            Veja o que nossos clientes dizem sobre a experiência com a
            Imobiliária Lemos. Mais de 20 anos construindo relações de
            confiança.
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 pt-4 pb-2">
        <nav className="flex items-center gap-1.5 text-sm text-gray-500" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-gray-600 transition-colors">
            Início
          </Link>
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
          <span className="text-gray-600 font-medium">Depoimentos</span>
        </nav>
      </div>

      {/* Testimonials Grid */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <p
            className="text-sm font-semibold uppercase tracking-widest mb-2"
            style={{ color: '#C9A84C' }}
          >
            Clientes satisfeitos
          </p>
          <h2
            className="text-3xl font-bold"
            style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}
          >
            O que dizem sobre nós
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TESTIMONIALS.map((testimonial) => (
            <div
              key={testimonial.name}
              className="bg-white rounded-2xl border shadow-sm p-8 relative"
              style={{ borderColor: '#ddd9d0' }}
            >
              {/* Quote icon */}
              <Quote
                className="w-8 h-8 absolute top-6 right-6 opacity-10"
                style={{ color: '#C9A84C' }}
                aria-hidden="true"
              />

              {/* Stars */}
              <StarRating count={testimonial.stars} />

              {/* Text */}
              <p className="text-gray-700 leading-relaxed mt-4 mb-6">
                &ldquo;{testimonial.text}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: '#1B2B5B' }}
                >
                  {testimonial.initials}
                </div>
                <div>
                  <p
                    className="font-bold"
                    style={{ color: '#1B2B5B' }}
                  >
                    {testimonial.name}
                  </p>
                  <p className="text-sm" style={{ color: '#C9A84C' }}>
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div
          className="bg-white rounded-2xl border shadow-sm p-10 text-center"
          style={{ borderColor: '#ddd9d0' }}
        >
          <MessageSquareHeart
            className="w-10 h-10 mx-auto mb-4"
            style={{ color: '#C9A84C' }}
            aria-hidden="true"
          />
          <h2
            className="text-2xl font-bold mb-3"
            style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}
          >
            Quer fazer parte dos nossos clientes satisfeitos?
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto mb-6">
            Solicite uma avaliação gratuita do seu imóvel ou entre em contato
            com nossa equipe. Estamos prontos para ajudar você a encontrar o
            imóvel ideal.
          </p>
          <Link
            href="/avaliacao"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold transition-transform hover:scale-105"
            style={{ backgroundColor: '#1B2B5B' }}
          >
            <Star className="w-5 h-5" aria-hidden="true" />
            Solicitar Avaliação Gratuita
          </Link>
        </div>
      </section>
    </main>
  )
}

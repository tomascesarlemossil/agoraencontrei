import type { Metadata } from 'next'
import Link from 'next/link'
import { MembroCard, type Membro } from './MembroCard'

export const metadata: Metadata = {
  title: 'Nossa Equipe | Imobiliária Lemos — Franca/SP',
  description: 'Conheça a equipe da Imobiliária Lemos em Franca/SP. Diretoria, corretores e administrativo especializados em compra, venda e locação de imóveis. CRECI 279051.',
  keywords: ['corretores Franca SP', 'Imobiliária Lemos equipe', 'CRECI Franca', 'corretor de imóveis Franca'],
}

export const revalidate = 300

// ─────────────────────────────────────────────────────────────────────────────
// DADOS DA EQUIPE — Para trocar foto, altere o campo "photo" de cada membro
// Coloque a nova foto em /apps/web/public/corretores/<nome-do-arquivo>.jpg
// ─────────────────────────────────────────────────────────────────────────────
const EQUIPE = {
  diretoria: [
    {
      id: 'noemia',
      name: 'Noêmia Pires Lemos',
      role: 'Diretora Fundadora',
      creci: '279051-F',
      phone: '5516981010005',
      email: 'noemia@imobiliarialemos.com.br',
      photo: '/corretores/noemia-pires.jpg',  // foto real
      specialties: ['Compra e Venda', 'Locação', 'Avaliação de Imóveis'],
      bio: 'Fundadora da Imobiliária Lemos, com mais de 20 anos de experiência no mercado imobiliário de Franca/SP.',
    },
    {
      id: 'naira',
      name: 'Naira Cristina Lemos',
      role: 'Diretoria',
      creci: '',
      phone: '5516981010003',
      email: 'blognairalemos@gmail.com',
      photo: '/corretores/naira-lemos.jpg',  // foto real
      specialties: ['Residencial', 'Locação', 'Financiamento'],
      bio: 'Especialista em imóveis residenciais e locação. Atendimento humanizado e dedicado a cada cliente.',
    },
    {
      id: 'nadia',
      name: 'Nádia Maria Cristina Lemos',
      role: 'Diretoria',
      creci: '61053-F',
      phone: '5516992533583',
      email: 'nadia@imobiliarialemos.com.br',
      photo: '/corretores/nadia-lemos.jpg',  // foto real
      specialties: ['Imóveis Comerciais', 'Compra e Venda', 'Avaliação'],
      bio: 'Especialista em imóveis comerciais e negociações diferenciadas. Comprometida com os melhores resultados.',
    },
    {
      id: 'nilton',
      name: 'Nilton Lemos',
      role: 'Diretoria',
      creci: '',
      phone: '5516999654949',
      email: 'nilton@imobiliarialemos.com.br',
      photo: '/corretores/nilton-lemos.jpg',  // foto real
      specialties: ['Gestão', 'Administração de Imóveis'],
      bio: 'Membro da diretoria responsável pela gestão e administração de imóveis da Imobiliária Lemos.',
    },
    {
      id: 'tomas',
      name: 'Tomás César Lemos Silva',
      role: 'Diretoria | Tecnologia',
      creci: '279051-F',
      phone: '5516993116199',
      email: 'tomas@imobiliarialemos.com.br',
      photo: '/corretores/tomas-lemos.jpg',  // ← trocar foto aqui
      specialties: ['Tecnologia Imobiliária', 'Marketing Digital', 'Inovação'],
      bio: 'Responsável pela transformação digital da Imobiliária Lemos, integrando tecnologia e inovação ao mercado.',
    },
  ],
  corretores: [
    {
      id: 'gabriel',
      name: 'Gabriel Leal',
      role: 'Corretor de Imóveis',
      creci: '305711-F',
      phone: '5516992411378',
      email: 'gabriel@imobiliarialemos.com.br',
      photo: '/corretores/gabriel-leal.jpg',  // foto real
      specialties: ['Lançamentos', 'Residencial', 'Atendimento Digital'],
      bio: 'Atendimento moderno e presença digital para encontrar o imóvel ideal. Especialista em lançamentos.',
    },
    {
      id: 'miriam',
      name: 'Miriam Soares Chagas',
      role: 'Corretora de Imóveis',
      creci: '',
      phone: '5516991275404',
      email: 'artmiriamchagas@gmail.com',
      photo: '/corretores/miriam-chagas.jpg',  // foto real
      specialties: ['Residencial', 'Locação', 'Compra e Venda'],
      bio: 'Corretora dedicada ao atendimento personalizado, especialista em imóveis residenciais e locação.',
    },
    {
      id: 'lorena',
      name: 'Lorena Assis Sesso',
      role: 'Corretora de Imóveis',
      creci: '',
      phone: '5516991083946',
      email: 'lorenaassis@imobiliarialemos.com.br',
      photo: '/corretores/lorena-sesso.jpg',  // foto real
      specialties: ['Residencial', 'Locação', 'Primeiro Imóvel'],
      bio: 'Especialista em ajudar clientes a realizarem o sonho do primeiro imóvel. Atendimento acolhedor.',
    },
    {
      id: 'laura',
      name: 'Laura Sesso',
      role: 'Corretora de Imóveis',
      creci: '',
      phone: '5516993404117',
      email: 'laura@imobiliarialemos.com.br',
      photo: '/corretores/laura-sesso.jpg',  // foto real
      specialties: ['Residencial', 'Compra e Venda', 'Avaliação'],
      bio: 'Corretora comprometida com o melhor atendimento na compra, venda e avaliação de imóveis.',
    },
    {
      id: 'lucas',
      name: 'Lucas Rodrigues',
      role: 'Corretor de Imóveis',
      creci: '',
      phone: '5516991957528',
      email: 'lucas@imobiliarialemos.com.br',
      photo: '/corretores/lucas-rodrigues.jpg',  // foto real
      specialties: ['Residencial', 'Locação', 'Novos Empreendimentos'],
      bio: 'Corretor dinâmico e atualizado com as tendências do mercado imobiliário de Franca/SP.',
    },
  ],
  administrativo: [
    {
      id: 'geraldo',
      name: 'Geraldo',
      role: 'Administrativo',
      creci: '',
      phone: '5516981010004',
      email: 'geraldo@imobiliarialemos.com.br',
      photo: '/corretores/geraldo.jpg',  // foto real
      specialties: ['Administração', 'Suporte Operacional'],
      bio: 'Responsável pelo suporte administrativo e operacional, garantindo o funcionamento eficiente de todos os processos.',
    },
  ],
}

// MembroCard e type Membro movidos para ./MembroCard.tsx (Client Component)

function SecaoEquipe({ titulo, badge, cor, membros }: {
  titulo: string
  badge: string
  cor: string
  membros: Membro[]
}) {
  return (
    <section>
      <div className="text-center mb-10">
        <span className="inline-block px-4 py-1 rounded-full text-sm font-semibold mb-3"
          style={{ backgroundColor: cor + '22', color: cor }}>
          {badge}
        </span>
        <h2 className="text-3xl font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
          {titulo}
        </h2>
      </div>
      <div className={`grid gap-6 ${
        membros.length === 1
          ? 'grid-cols-1 max-w-xs mx-auto'
          : membros.length <= 3
          ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 max-w-3xl mx-auto'
          : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
      }`}>
        {membros.map((m) => (
          <MembroCard key={m.id} membro={m} />
        ))}
      </div>
    </section>
  )
}

export default async function CorretoresPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: '#f9f7f4' }}>
      {/* Hero */}
      <section className="py-16 text-white text-center"
        style={{ background: 'linear-gradient(135deg, #1B2B5B 0%, #2d4a8a 60%, #1B2B5B 100%)' }}>
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#C9A84C' }}>
            Imobiliária Lemos — Franca/SP
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            Nossa Equipe
          </h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto">
            Profissionais dedicados a encontrar o imóvel ideal para você. Atendimento personalizado, experiência e confiança em cada negociação.
          </p>
          <a
            href="https://wa.me/5516981010004?text=Olá!%20Gostaria%20de%20falar%20com%20um%20corretor%20da%20Imobiliária%20Lemos."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-bold mt-8 transition-all hover:scale-105 hover:shadow-xl shadow-lg"
            style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', color: 'white' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Falar com um Corretor agora
          </a>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-16 space-y-16">
        <SecaoEquipe
          badge="Diretoria"
          titulo="Liderança & Gestão"
          cor="#C9A84C"
          membros={EQUIPE.diretoria}
        />
        <SecaoEquipe
          badge="Corretores"
          titulo="Especialistas em Imóveis"
          cor="#2e7d32"
          membros={EQUIPE.corretores}
        />
        <SecaoEquipe
          badge="Administrativo"
          titulo="Suporte & Operações"
          cor="#1565c0"
          membros={EQUIPE.administrativo}
        />

        {/* CTA final */}
        <section className="text-center py-12 rounded-3xl relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1B2B5B 0%, #2d4a8a 100%)' }}>
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Georgia, serif' }}>
              Pronto para encontrar seu imóvel?
            </h2>
            <p className="text-blue-100 mb-8 max-w-xl mx-auto">
              Nossa equipe está pronta para te atender. Entre em contato agora mesmo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="https://wa.me/5516981010004?text=Olá!%20Gostaria%20de%20informações%20sobre%20imóveis."
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: '#25D366' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp da Imobiliária
              </a>
              <Link href="/imoveis"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold border-2 border-white text-white transition-all hover:bg-white hover:text-blue-900">
                Ver Imóveis Disponíveis
              </Link>
            </div>
            <div className="mt-8 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
              <p>Rua João Ramalho, 1060 — Centro, Franca/SP · CRECI 279051</p>
              <p className="mt-1">
                <a href="tel:1637230045" className="hover:text-white transition-colors">(16) 3723-0045</a>
                {' · '}
                <a href="mailto:contato@imobiliarialemos.com.br" className="hover:text-white transition-colors">contato@imobiliarialemos.com.br</a>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

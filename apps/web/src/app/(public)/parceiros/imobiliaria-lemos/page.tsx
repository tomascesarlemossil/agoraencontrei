import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, MapPin, Phone, Mail, Globe, Instagram, Clock, Star, Building2, Users, Award, ArrowRight } from 'lucide-react'
import { MembroCard, type Membro } from '../../corretores/MembroCard'

export const metadata: Metadata = {
  title: 'Imobiliária Lemos | 1º Parceiro Oficial — AgoraEncontrei Marketplace',
  description: 'Conheça a Imobiliária Lemos, 1º parceiro oficial do AgoraEncontrei. Referência no mercado imobiliário de Franca/SP desde 2002. Equipe completa, dados de contato e portfólio de imóveis.',
  keywords: ['Imobiliária Lemos', 'imobiliária Franca SP', 'comprar imóvel Franca', 'alugar imóvel Franca', 'CRECI Franca', 'AgoraEncontrei parceiro'],
  alternates: { canonical: 'https://www.agoraencontrei.com.br/parceiros/imobiliaria-lemos' },
}

export const revalidate = 60

// Busca avatares atualizados do banco
async function fetchTeamFromDB(): Promise<Record<string, { creci?: string; avatarUrl?: string }>> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'https://www.agoraencontrei.com.br/api/v1'
    const res = await fetch(`${apiUrl}/public/team`, { next: { revalidate: 60 } })
    if (!res.ok) return {}
    const users: Array<{ name: string; email: string; creciNumber?: string; avatarUrl?: string }> = await res.json()
    return Object.fromEntries(
      users
        .filter(u => u.email)
        .map(u => [u.email.toLowerCase(), { creci: u.creciNumber, avatarUrl: u.avatarUrl }])
    )
  } catch {
    return {}
  }
}

function mergeFromDB(membros: Membro[], dbMap: Record<string, { creci?: string; avatarUrl?: string }>): Membro[] {
  return membros.map(m => {
    const dbData = dbMap[m.email?.toLowerCase() ?? '']
    return {
      ...m,
      creci: dbData?.creci ?? m.creci,
      photo: dbData?.avatarUrl || m.photo,
    }
  })
}

// Dados completos da equipe
const EQUIPE = {
  diretoria: [
    {
      id: 'noemia',
      name: 'Noêmia Pires Lemos',
      role: 'Diretora Fundadora',
      creci: '279051-F',
      phone: '5516981010005',
      email: 'noemia@imobiliarialemos.com.br',
      photo: '/corretores/noemia-pires.jpg',
      specialties: ['Compra e Venda', 'Locação', 'Avaliação de Imóveis'],
      bio: 'Fundadora da Imobiliária Lemos, com mais de 22 anos de experiência no mercado imobiliário de Franca/SP.',
    },
    {
      id: 'nilton',
      name: 'Nilton Lemos',
      role: 'Co-Fundador · Obras & Investimentos',
      creci: '',
      phone: '5516999654949',
      email: 'nilton@imobiliarialemos.com.br',
      photo: '/corretores/nilton-lemos.jpg',
      specialties: ['Gestão', 'Obras', 'Investimentos', 'Reformas'],
      bio: 'Co-fundador responsável pela gestão de obras, investimentos e reformas imobiliárias.',
    },
    {
      id: 'naira',
      name: 'Naira Cristina Lemos',
      role: 'Diretoria · Suporte & Operações',
      creci: '',
      phone: '5516981010003',
      email: 'blognairalemos@gmail.com',
      photo: '/corretores/naira-lemos.jpg',
      specialties: ['Residencial', 'Locação', 'Financiamento'],
      bio: 'Especialista em imóveis residenciais e locação. Atendimento humanizado e dedicado.',
    },
    {
      id: 'tomas',
      name: 'Tomás César Lemos Silva',
      role: 'Diretoria · Tecnologia & Inovação',
      creci: '279051-F',
      phone: '5516993116199',
      email: 'tomas@imobiliarialemos.com.br',
      photo: '/corretores/tomas.jpg',
      specialties: ['Tecnologia Imobiliária', 'Marketing Digital', 'Inovação'],
      bio: 'Responsável pela transformação digital da Imobiliária Lemos e criador do AgoraEncontrei Marketplace.',
    },
    {
      id: 'geraldo',
      name: 'Geraldo',
      role: 'Suporte & Operações',
      creci: '',
      phone: '5516981010004',
      email: 'geraldo@imobiliarialemos.com.br',
      photo: '/corretores/geraldo.jpg',
      specialties: ['Administração', 'Suporte Operacional'],
      bio: 'Responsável pelo suporte administrativo e operacional da imobiliária.',
    },
    {
      id: 'nadia',
      name: 'Nádia Maria Cristina Lemos',
      role: 'Diretoria · Suporte & Operações',
      creci: '',
      phone: '5516992533583',
      email: 'nadia@imobiliarialemos.com.br',
      photo: '/corretores/nadia.png',
      specialties: ['Imóveis Comerciais', 'Compra e Venda', 'Avaliação'],
      bio: 'Especialista em imóveis comerciais e negociações diferenciadas.',
    },
  ],
  corretores: [
    {
      id: 'miriam',
      name: 'Miriam Soares Chagas',
      role: 'Corretora de Imóveis',
      creci: '',
      phone: '5516991275404',
      email: 'artmiriamchagas@gmail.com',
      photo: '/corretores/miriam-icon-final.png',
      specialties: ['Residencial', 'Locação', 'Compra e Venda'],
      bio: 'Corretora dedicada ao atendimento personalizado, especialista em imóveis residenciais.',
    },
    {
      id: 'lucas',
      name: 'Lucas Rodrigues',
      role: 'Corretor de Imóveis',
      creci: '',
      phone: '5516991957528',
      email: 'lucas@imobiliarialemos.com.br',
      photo: '/corretores/lucas.jpg',
      specialties: ['Residencial', 'Locação', 'Novos Empreendimentos'],
      bio: 'Corretor dinâmico e atualizado com as tendências do mercado imobiliário de Franca/SP.',
    },
    {
      id: 'laura',
      name: 'Laura Sesso',
      role: 'Corretora de Imóveis',
      creci: '',
      phone: '5516993404117',
      email: 'laura@imobiliarialemos.com.br',
      photo: '/corretores/laura.jpg',
      specialties: ['Residencial', 'Compra e Venda', 'Avaliação'],
      bio: 'Corretora comprometida com o melhor atendimento na compra, venda e avaliação de imóveis.',
    },
    {
      id: 'gabriel',
      name: 'Gabriel Leal',
      role: 'Corretor de Imóveis',
      creci: '305711-F',
      phone: '5516992411378',
      email: 'gabriel@imobiliarialemos.com.br',
      photo: '/corretores/gabriel-icon-v2.jpg',
      specialties: ['Lançamentos', 'Residencial', 'Atendimento Digital'],
      bio: 'Atendimento moderno e presença digital. Especialista em lançamentos imobiliários.',
    },
    {
      id: 'lorena',
      name: 'Lorena Assis Sesso',
      role: 'Corretora de Imóveis',
      creci: '',
      phone: '5516991083946',
      email: 'lorenaassis@imobiliarialemos.com.br',
      photo: '/corretores/lorena.jpg',
      specialties: ['Residencial', 'Locação', 'Primeiro Imóvel'],
      bio: 'Especialista em ajudar clientes a realizarem o sonho do primeiro imóvel.',
    },
  ],
}

const STATS = [
  { value: '+22', label: 'Anos de Mercado', icon: <Clock className="w-5 h-5" /> },
  { value: '1.000+', label: 'Imóveis no Portfólio', icon: <Building2 className="w-5 h-5" /> },
  { value: '11', label: 'Profissionais', icon: <Users className="w-5 h-5" /> },
  { value: '5★', label: 'Avaliação no Google', icon: <Star className="w-5 h-5" /> },
]

export default async function ImobiliariaLemosPage() {
  const dbMap = await fetchTeamFromDB()
  const diretoria = mergeFromDB(EQUIPE.diretoria, dbMap)
  const corretores = mergeFromDB(EQUIPE.corretores, dbMap)

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#f9f7f4' }}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(135deg, #1B2B5B 0%, #2d4a8a 60%, #1B2B5B 100%)' }} className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Breadcrumb */}
          <Link
            href="/parceiros"
            className="inline-flex items-center gap-2 text-sm mb-8 transition-colors hover:text-white"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Parceiros
          </Link>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
            {/* Logo */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 shadow-2xl" style={{ borderColor: '#C9A84C' }}>
                <Image
                  src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663481419273/dSHpPTGqPSuMnYML.jpg"
                  alt="Imobiliária Lemos"
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
            </div>

            {/* Info principal */}
            <div className="text-center sm:text-left flex-1">
              <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-3" style={{ backgroundColor: 'rgba(201,168,76,0.2)', color: '#C9A84C' }}>
                1º Parceiro Oficial do AgoraEncontrei
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                Imobiliária Lemos
              </h1>
              <p className="text-white/70 text-sm mb-4">
                Referência no mercado imobiliário de Franca e região desde 2002
              </p>
              <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                <a
                  href="https://wa.me/5516981010004?text=Olá! Vim pelo AgoraEncontrei e gostaria de informações sobre imóveis."
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', color: 'white' }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  WhatsApp
                </a>
                <Link
                  href="/imoveis"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold border transition-all hover:bg-white/10"
                  style={{ borderColor: 'rgba(201,168,76,0.5)', color: '#C9A84C' }}
                >
                  Ver Imóveis <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <section className="py-8 border-b" style={{ backgroundColor: '#ffffff', borderColor: '#e8e4dc' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {STATS.map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(201,168,76,0.1)', color: '#C9A84C' }}>
                  {s.icon}
                </div>
                <span className="text-2xl font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>{s.value}</span>
                <span className="text-xs text-gray-500">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOBRE & CONTATO ──────────────────────────────────────────────── */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">

            {/* Sobre */}
            <div className="bg-white rounded-2xl p-8 border" style={{ borderColor: '#e8e4dc' }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(27,43,91,0.08)', color: '#1B2B5B' }}>
                  <Award className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>Nossa História</h2>
              </div>
              <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
                <p>
                  Fundada em <strong>2002</strong> por Noêmia Pires Lemos e Nilton Lemos, a <strong>Imobiliária Lemos</strong> nasceu com o propósito de oferecer um atendimento diferenciado e humanizado no mercado imobiliário de Franca/SP.
                </p>
                <p>
                  Ao longo de mais de <strong>22 anos</strong>, construímos uma sólida reputação baseada em confiança, transparência e resultados. Somos especializados em compra, venda e locação de imóveis residenciais e comerciais em Franca e região.
                </p>
                <p>
                  Em 2024, demos um grande passo ao criar o <strong>AgoraEncontrei Marketplace</strong> — a plataforma imobiliária mais moderna de Franca, integrando tecnologia de ponta com o atendimento personalizado que nos tornou referência.
                </p>
                <p>
                  Nossa equipe de <strong>11 profissionais</strong> está sempre pronta para ajudar você a encontrar o imóvel ideal ou realizar o melhor negócio.
                </p>
              </div>
            </div>

            {/* Contato */}
            <div className="bg-white rounded-2xl p-8 border" style={{ borderColor: '#e8e4dc' }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(201,168,76,0.1)', color: '#C9A84C' }}>
                  <Phone className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>Contato & Localização</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#C9A84C' }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#1B2B5B' }}>Endereço</p>
                    <p className="text-sm text-gray-600">Rua João Ramalho, 1060 — Centro</p>
                    <p className="text-sm text-gray-600">Franca — SP, CEP 14400-630</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#C9A84C' }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#1B2B5B' }}>Telefone / WhatsApp</p>
                    <a href="tel:1637230045" className="text-sm text-gray-600 hover:text-green-600 transition-colors">(16) 3723-0045</a>
                    <br />
                    <a href="https://wa.me/5516981010004" target="_blank" rel="noreferrer" className="text-sm text-gray-600 hover:text-green-600 transition-colors">(16) 98101-0004</a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#C9A84C' }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#1B2B5B' }}>E-mail</p>
                    <a href="mailto:contato@imobiliarialemos.com.br" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">contato@imobiliarialemos.com.br</a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#C9A84C' }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#1B2B5B' }}>Site & Redes Sociais</p>
                    <a href="https://www.imobiliarialemos.com.br" target="_blank" rel="noreferrer" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">www.imobiliarialemos.com.br</a>
                    <br />
                    <a href="https://www.instagram.com/imobiliarialemos" target="_blank" rel="noreferrer" className="text-sm text-gray-600 hover:text-pink-600 transition-colors">@imobiliarialemos</a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#C9A84C' }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#1B2B5B' }}>Horário de Atendimento</p>
                    <p className="text-sm text-gray-600">Seg–Sex: 8h às 18h</p>
                    <p className="text-sm text-gray-600">Sáb: 8h às 12h</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── EQUIPE — DIRETORIA ───────────────────────────────────────────── */}
      <section className="py-12" style={{ backgroundColor: '#ffffff' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="inline-block px-4 py-1 rounded-full text-sm font-semibold mb-3" style={{ backgroundColor: 'rgba(201,168,76,0.15)', color: '#C9A84C' }}>
              Diretoria & Operações
            </span>
            <h2 className="text-3xl font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
              Liderança & Gestão
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-6">
            {diretoria.map(m => (
              <MembroCard key={m.id} membro={m} />
            ))}
          </div>
        </div>
      </section>

      {/* ── EQUIPE — CORRETORES ──────────────────────────────────────────── */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="inline-block px-4 py-1 rounded-full text-sm font-semibold mb-3" style={{ backgroundColor: 'rgba(46,125,50,0.12)', color: '#2e7d32' }}>
              Corretores
            </span>
            <h2 className="text-3xl font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
              Especialistas em Imóveis
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6">
            {corretores.map(m => (
              <MembroCard key={m.id} membro={m} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────────────── */}
      <section className="py-16 text-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1B2B5B 0%, #2d4a8a 100%)' }}>
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative z-10 max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            Pronto para encontrar seu imóvel?
          </h2>
          <p className="text-white/60 text-sm mb-8">
            Nossa equipe está pronta para te atender com o melhor da Imobiliária Lemos — tradição desde 2002.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/5516981010004?text=Olá! Vim pelo AgoraEncontrei e gostaria de falar com um corretor."
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', color: 'white' }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Falar com um Corretor
            </a>
            <Link
              href="/imoveis"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold border-2 border-white text-white transition-all hover:bg-white hover:text-blue-900"
            >
              Ver Imóveis Disponíveis
            </Link>
          </div>
        </div>
      </section>

    </main>
  )
}

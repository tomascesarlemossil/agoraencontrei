import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Building2, Users, Phone, Globe, MapPin, Star, Handshake } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Parceiros | AgoraEncontrei Marketplace',
  description: 'Conheça as imobiliárias e corretores parceiros do AgoraEncontrei — o marketplace imobiliário de Franca e região. Criado pela Imobiliária Lemos, referência desde 2002.',
  keywords: 'parceiros imobiliários franca, imobiliárias franca sp, corretores parceiros franca, marketplace imobiliário franca, agoraencontrei parceiros',
  alternates: { canonical: 'https://www.agoraencontrei.com.br/parceiros' },
}

// Dados dos parceiros — a Imobiliária Lemos é sempre o 1º parceiro oficial
// Futuramente, isso virá da API quando novos parceiros se cadastrarem
const PARCEIROS = [
  {
    id: 'imobiliaria-lemos',
    nome: 'Imobiliária Lemos',
    logo: '/logo.png',
    descricao: '1º Parceiro Oficial do AgoraEncontrei. Referência no mercado imobiliário de Franca e região desde 2002. Especializada em compra, venda e locação de imóveis residenciais e comerciais.',
    cidade: 'Franca — SP',
    telefone: '(16) 3723-0045',
    whatsapp: '5516981010004',
    site: 'https://www.imobiliarialemos.com.br',
    instagram: 'https://www.instagram.com/imobiliarialemos',
    corretoresUrl: '/corretores',
    totalImoveis: null, // será buscado da API
    destaque: true,
    badge: '1º Parceiro Oficial',
    badgeColor: '#C9A84C',
  },
]

export default function ParceirosPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f6f1' }}>
      {/* Hero */}
      <section style={{ backgroundColor: '#1B2B5B' }} className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-3" style={{ color: '#C9A84C' }}>
            AgoraEncontrei Marketplace
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            Nossas Imobiliárias &amp;{' '}
            <span style={{ color: '#C9A84C' }}>Corretores Parceiros</span>
          </h1>
          <p className="text-white/60 text-sm max-w-2xl mx-auto leading-relaxed">
            O AgoraEncontrei é um marketplace aberto para imobiliárias, corretores autônomos e
            proprietários anunciarem seus imóveis com tecnologia de ponta. Cada parceiro tem sua
            própria página com equipe e portfólio de imóveis.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://wa.me/5516981010004?text=Olá! Gostaria de ser um parceiro do AgoraEncontrei."
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all hover:brightness-110"
              style={{ backgroundColor: '#C9A84C', color: '#1B2B5B' }}
            >
              <Handshake className="w-4 h-4" />
              Quero ser Parceiro
            </a>
            <Link
              href="/anunciar"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-sm font-bold border transition-all hover:bg-white/10"
              style={{ borderColor: 'rgba(201,168,76,0.4)', color: '#C9A84C' }}
            >
              Anunciar Imóvel
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8 border-b" style={{ backgroundColor: '#ffffff', borderColor: '#e8e4dc' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-3 gap-6 text-center">
            {[
              { value: '1', label: 'Parceiro Ativo', icon: <Building2 className="w-5 h-5" /> },
              { value: '1.000+', label: 'Imóveis no Marketplace', icon: <Star className="w-5 h-5" /> },
              { value: '22+', label: 'Anos de Tradição', icon: <Users className="w-5 h-5" /> },
            ].map(stat => (
              <div key={stat.label} className="flex flex-col items-center gap-1">
                <div className="text-2xl font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
                  {stat.value}
                </div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lista de Parceiros */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="mb-10">
            <h2 className="text-xl font-bold mb-1" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
              Parceiros Oficiais
            </h2>
            <p className="text-gray-500 text-sm">
              Clique em um parceiro para ver sua equipe de corretores e imóveis disponíveis.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PARCEIROS.map(parceiro => (
              <div
                key={parceiro.id}
                className="bg-white rounded-2xl overflow-hidden border hover:shadow-xl transition-all group"
                style={{ borderColor: parceiro.destaque ? '#C9A84C' : '#e8e4dc', borderWidth: parceiro.destaque ? 2 : 1 }}
              >
                {/* Badge */}
                {parceiro.badge && (
                  <div
                    className="px-4 py-1.5 text-xs font-bold text-center"
                    style={{ backgroundColor: parceiro.badgeColor, color: '#1B2B5B' }}
                  >
                    {parceiro.badge}
                  </div>
                )}

                <div className="p-6">
                  {/* Logo + Nome */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border-2" style={{ borderColor: '#e8e4dc' }}>
                      <Image
                        src={parceiro.logo}
                        alt={parceiro.nome}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-base leading-snug" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
                        {parceiro.nome}
                      </h3>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {parceiro.cidade}
                      </p>
                    </div>
                  </div>

                  {/* Descrição */}
                  <p className="text-gray-500 text-xs leading-relaxed mb-4 line-clamp-3">
                    {parceiro.descricao}
                  </p>

                  {/* Contatos */}
                  <div className="flex flex-col gap-1.5 mb-5">
                    {parceiro.telefone && (
                      <a
                        href={`tel:${parceiro.telefone.replace(/\D/g, '')}`}
                        className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" style={{ color: '#1B2B5B' }} />
                        {parceiro.telefone}
                      </a>
                    )}
                    {parceiro.site && (
                      <a
                        href={parceiro.site}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-xs hover:opacity-80 transition-opacity"
                        style={{ color: '#C9A84C' }}
                      >
                        <Globe className="w-3.5 h-3.5" />
                        {parceiro.site.replace('https://', '')}
                      </a>
                    )}
                  </div>

                  {/* Botões */}
                  <div className="flex flex-col gap-2">
                    <Link
                      href={parceiro.corretoresUrl}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold transition-all hover:brightness-110"
                      style={{ backgroundColor: '#1B2B5B', color: 'white' }}
                    >
                      <Users className="w-3.5 h-3.5" />
                      Ver Equipe de Corretores
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    {parceiro.whatsapp && (
                      <a
                        href={`https://wa.me/${parceiro.whatsapp}?text=Olá! Vim pelo AgoraEncontrei e gostaria de mais informações.`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold transition-all hover:brightness-110"
                        style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', color: 'white' }}
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Card "Seja um Parceiro" */}
            <div
              className="bg-white rounded-2xl overflow-hidden border border-dashed flex flex-col items-center justify-center p-8 text-center hover:shadow-lg transition-all cursor-pointer group"
              style={{ borderColor: '#C9A84C', minHeight: 320 }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: 'rgba(201,168,76,0.1)' }}
              >
                <Handshake className="w-8 h-8" style={{ color: '#C9A84C' }} />
              </div>
              <h3 className="font-bold text-base mb-2" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
                Seja um Parceiro
              </h3>
              <p className="text-gray-500 text-xs leading-relaxed mb-5">
                Anuncie seus imóveis no maior marketplace imobiliário de Franca e região. Tecnologia de ponta, sem custo inicial.
              </p>
              <a
                href="https://wa.me/5516981010004?text=Olá! Gostaria de ser um parceiro do AgoraEncontrei e anunciar meus imóveis."
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all hover:brightness-110"
                style={{ backgroundColor: '#C9A84C', color: '#1B2B5B' }}
              >
                Entrar em contato
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section style={{ backgroundColor: '#1B2B5B' }} className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>
              Como funciona a parceria?
            </h2>
            <p className="text-white/50 text-sm mt-2">Simples, rápido e sem burocracia</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Entre em contato',
                desc: 'Fale conosco pelo WhatsApp ou e-mail para iniciar o processo de parceria.',
              },
              {
                step: '02',
                title: 'Cadastre seus imóveis',
                desc: 'Sua imobiliária terá acesso ao sistema para cadastrar e gerenciar todos os imóveis.',
              },
              {
                step: '03',
                title: 'Sua página no marketplace',
                desc: 'Sua imobiliária terá uma página própria com logo, equipe e portfólio de imóveis.',
              },
            ].map(item => (
              <div key={item.step} className="rounded-2xl p-6" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <div className="text-3xl font-bold mb-3" style={{ color: '#C9A84C', fontFamily: 'Georgia, serif' }}>
                  {item.step}
                </div>
                <h3 className="text-white font-semibold text-sm mb-2">{item.title}</h3>
                <p className="text-white/40 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <a
              href="https://wa.me/5516981010004?text=Olá! Gostaria de saber mais sobre a parceria com o AgoraEncontrei."
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all hover:brightness-110"
              style={{ backgroundColor: '#C9A84C', color: '#1B2B5B' }}
            >
              <Handshake className="w-4 h-4" />
              Quero ser Parceiro
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

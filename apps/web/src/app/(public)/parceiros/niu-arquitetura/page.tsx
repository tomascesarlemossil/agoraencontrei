import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Compass,
  Mail,
  MapPin,
  MessageCircle,
  PenTool,
  Phone,
  Sparkles,
} from 'lucide-react'
import { PartnerLeadQualifier } from '../../especialistas/[slug]/PartnerLeadQualifier'

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'https://www.agoraencontrei.com.br'
const PAGE_URL = `${WEB_URL}/parceiros/niu-arquitetura`

const CONTACT = {
  phone: '+55 16 99460-8222',
  whatsapp: '+55 16 99264-6070',
  email: 'contato@niuarquitetura.com',
  instagram: 'niu_arquitetura',
  address: 'Av. Dr. Armando Sales de Oliveira, 503 - Franca/SP',
}

const NIU_IMAGES = {
  logo: '/partners/niu/niu-logo.jpg',
  team: '/partners/niu/niu-equipe.jpg',
  office: '/partners/niu/niu-escritorio.jpg',
  culture: '/partners/niu/niu-cultura.jpg',
  brandDark: '/partners/niu/niu-marca-dark.jpg',
  manifesto: '/partners/niu/niu-manifesto.jpg',
  whatWeDo: '/partners/niu/niu-o-que-fazemos.jpg',
  language: '/partners/niu/niu-linguagem.jpg',
  whatWeDoText: '/partners/niu/niu-o-que-fazemos-texto.jpg',
  location: '/partners/niu/niu-onde-estamos.jpg',
  locationMap: '/partners/niu/niu-localizacao.jpg',
  conversation: '/partners/niu/niu-vamos-conversar.jpg',
  projectSeven: '/partners/niu/niu-projeto-seven.jpg',
  projectGama: '/partners/niu/niu-projeto-gama.jpg',
  projectPatio: '/partners/niu/niu-projeto-patio.jpg',
  projectGaia: '/partners/niu/niu-projeto-gaia.jpg',
  projectAlvorada: '/partners/niu/niu-projeto-alvorada.jpg',
}

const SERVICES = [
  {
    title: 'Projeto arquitetonico residencial',
    text: 'Conceito, geometria, materialidade e desenvolvimento tecnico para casas, reformas e novos espacos.',
  },
  {
    title: 'Interiores e ambientacao',
    text: 'Ambientes com intencao, funcionalidade, materiais, iluminacao, marcenaria e composicao visual.',
  },
  {
    title: 'Arquitetura comercial',
    text: 'Projetos para marcas, lojas, escritorios e experiencias que precisam comunicar identidade e impacto.',
  },
  {
    title: 'Reformas e valorizacao',
    text: 'Leitura do potencial do imovel para transformar limites em solucoes criativas e valorizacao real.',
  },
]

const VALUES = [
  ['Excelencia', 'detalhe nao e so um detalhe'],
  ['Paixao', 'nada menos que tudo'],
  ['Criatividade', 'arquitetamos rupturas'],
  ['Pessoas', 'construimos gente que constroi'],
]

const GALLERY = [
  { src: NIU_IMAGES.office, label: 'O escritorio', caption: 'Fundacao, identidade e olhar contemporaneo.' },
  { src: NIU_IMAGES.culture, label: 'Nossa cultura', caption: 'Missao, visao e valores do escritorio.' },
  { src: NIU_IMAGES.whatWeDo, label: 'O que fazemos', caption: 'Arquitetura em diversas escalas.' },
  { src: NIU_IMAGES.language, label: 'Nossa linguagem', caption: 'Rigor tecnico, intencao e excelencia.' },
]

const PROJECTS = [
  {
    src: NIU_IMAGES.projectSeven,
    name: 'Casa Seven',
    label: 'Novo projeto',
    text: 'Residencia contemporanea com piscina, volumes marcantes, transparencia e iluminacao de destaque.',
  },
  {
    src: NIU_IMAGES.projectGama,
    name: 'Casa Gama',
    label: 'Novo projeto',
    text: 'Composicao de concreto, madeira, vegetacao e planos horizontais para uma chegada imponente.',
  },
  {
    src: NIU_IMAGES.projectPatio,
    name: 'Casa Patio',
    label: 'Estudo residencial',
    text: 'Estudo para residencia de alto padrao em Franca/SP, integrando interior, patio, luz natural e paisagismo.',
  },
  {
    src: NIU_IMAGES.projectGaia,
    name: 'Casa Gaia',
    label: 'Novo projeto',
    text: 'Residencia com linguagem vertical, fachada ritmada, jardins e materialidade quente.',
  },
  {
    src: NIU_IMAGES.projectAlvorada,
    name: 'Casa Alvorada',
    label: 'Obra em andamento',
    text: 'Obra em andamento em condominio na cidade de Franca/SP. Ano 2025, 448,00m2.',
  },
]

export const metadata: Metadata = {
  title: 'NIU Arquitetura | Parceiro Oficial AgoraEncontrei',
  description:
    'NIU Arquitetura, escritorio fundado por Yuri Miranda e Douglas Costa. Projetos residenciais, interiores, comerciais e reformas com arquitetura contemporanea, brasilidade, geometria e materialidade.',
  keywords: [
    'NIU Arquitetura',
    'niu arquitetura',
    'arquiteto Franca SP',
    'arquitetura contemporanea',
    'projeto arquitetonico',
    'design de interiores',
    'arquitetura residencial',
    'AgoraEncontrei parceiro oficial',
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'NIU Arquitetura | Parceiro Oficial AgoraEncontrei',
    description:
      'Arquitetura contemporanea com brasilidade, geometria, materialidade e desobediencia criativa.',
    url: PAGE_URL,
    type: 'website',
    siteName: 'AgoraEncontrei',
    images: [{ url: `${WEB_URL}${NIU_IMAGES.logo}`, width: 1178, height: 1178 }],
  },
}

function waLink(text: string) {
  return `https://wa.me/5516992646070?text=${encodeURIComponent(text)}`
}

export default function NiuArquiteturaPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'NIU Arquitetura',
    url: PAGE_URL,
    image: `${WEB_URL}${NIU_IMAGES.logo}`,
    logo: `${WEB_URL}${NIU_IMAGES.logo}`,
    email: CONTACT.email,
    telephone: CONTACT.whatsapp,
    areaServed: ['Franca/SP', 'Brasil'],
    foundingDate: '2018',
    founder: [
      { '@type': 'Person', name: 'Yuri Miranda', jobTitle: 'Arquiteto' },
      { '@type': 'Person', name: 'Douglas Costa', jobTitle: 'Gestor' },
    ],
    sameAs: [`https://instagram.com/${CONTACT.instagram}`],
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Av. Dr. Armando Sales de Oliveira, 503',
      addressLocality: 'Franca',
      addressRegion: 'SP',
      addressCountry: 'BR',
    },
    description:
      'Escritorio de arquitetura e design fundado em 2018, com pratica baseada em arquitetura contemporanea, brasilidade, geometria e materialidade.',
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'A NIU atende projetos fora de Franca/SP?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'O primeiro contato pode acontecer online. A equipe avalia cidade, escopo, prazo, fotos, medidas e formato de atendimento para cada projeto.',
        },
      },
      {
        '@type': 'Question',
        name: 'Quais tipos de projeto a NIU desenvolve?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A NIU atua em projetos residenciais, interiores, reformas, arquitetura comercial e estudos para transformar espacos, processos e pensamentos.',
        },
      },
      {
        '@type': 'Question',
        name: 'O que enviar no primeiro briefing?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Informe cidade, objetivo, tipo de imovel, medidas aproximadas, fotos, prazo desejado, faixa de investimento e referencias de estilo.',
        },
      },
    ],
  }

  return (
    <main className="min-h-screen bg-[#f5f2ec] text-[#141414]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <section className="relative min-h-[92vh] overflow-hidden bg-[#11110f] text-white">
        <Image
          src={NIU_IMAGES.brandDark}
          alt="Marca NIU Arquitetura"
          fill
          priority
          className="object-cover opacity-70"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-[#11110f]" />
        <div className="relative mx-auto flex min-h-[92vh] max-w-7xl flex-col px-5 py-6 sm:px-8">
          <nav className="flex items-center justify-between text-sm text-white/65">
            <Link href="/empresas-parceiras" className="inline-flex items-center gap-2 transition hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Empresas parceiras
            </Link>
            <span className="tracking-[0.35em]">NIU</span>
            <a href={`https://instagram.com/${CONTACT.instagram}`} target="_blank" rel="noreferrer" className="transition hover:text-white">
              @{CONTACT.instagram}
            </a>
          </nav>

          <div className="grid flex-1 items-end gap-10 pb-12 pt-24 lg:grid-cols-[1fr_0.65fr] lg:pb-20">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-white/75 backdrop-blur">
                1o parceiro oficial de arquitetura
              </p>
              <h1 className="max-w-4xl text-5xl font-semibold leading-[0.95] tracking-[-0.04em] sm:text-7xl lg:text-8xl">
                NIU Arquitetura
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">
                Arquitetura contemporanea com brasilidade, geometria e materialidade para criar espacos autenticos, funcionais e memoraveis.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={waLink('Ola, vim pelo AgoraEncontrei e quero iniciar um briefing com a NIU Arquitetura.')}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-white px-6 py-3 text-sm font-bold text-[#11110f] transition hover:bg-[#e8dfd0]"
                >
                  <MessageCircle className="h-4 w-4" /> Comecar briefing
                </a>
                <a
                  href="#projetos"
                  className="inline-flex items-center justify-center gap-2 border border-white/25 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  Ver linguagem <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="border border-white/15 bg-white/8 p-6 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <Image src={NIU_IMAGES.logo} alt="Logo NIU" width={96} height={96} className="h-20 w-20 object-cover" />
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45">Fundada em</p>
                  <p className="text-3xl font-semibold">2018</p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-white/45">Fundadores</p>
                  <p className="mt-1 font-medium">Yuri Miranda e Douglas Costa</p>
                </div>
                <div>
                  <p className="text-white/45">Atuacao</p>
                  <p className="mt-1 font-medium">Franca/SP e Brasil</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.7fr_1fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#8c8173]">quem somos</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">Um escritorio movido por identidade.</h2>
          </div>
          <div className="space-y-6 text-lg leading-9 text-[#4a4a45]">
            <p>
              A NIU foi fundada em 2018 pelo arquiteto Yuri Miranda e pelo gestor Douglas Costa. O escritorio traduz a arquitetura contemporanea atraves de um olhar apurado sobre a brasilidade.
            </p>
            <p>
              Sua pratica se apoia na forca da geometria e da materialidade para criar espacos autenticos onde inovacao e funcionalidade se encontram. A cultura da NIU e guiada pela desobediencia criativa, desafiando o obvio para alcancar excelencia em cada detalhe.
            </p>
          </div>
        </div>
      </section>

      <section id="projetos" className="px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#8c8173]">o que fazemos</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">Projetos com rigor tecnico e impacto visual.</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-[#66615a]">
              A arquitetura da NIU pulsa em diversas escalas, do residencial ao comercial, sempre movida por inquietude, intencao e excelencia.
            </p>
          </div>

          <div className="grid gap-px overflow-hidden bg-[#d8d1c6] md:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((service, index) => (
              <article key={service.title} className="bg-[#f5f2ec] p-6 sm:p-8">
                <span className="text-xs font-bold text-[#8c8173]">0{index + 1}</span>
                <h3 className="mt-8 text-xl font-semibold">{service.title}</h3>
                <p className="mt-4 text-sm leading-6 text-[#625d56]">{service.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#11110f] px-5 py-16 text-white sm:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative min-h-[520px] overflow-hidden bg-[#191814]">
            <Image src={NIU_IMAGES.language} alt="Linguagem visual e tecnica da NIU" fill className="object-cover" sizes="(min-width: 1024px) 45vw, 100vw" />
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/45">nossa linguagem</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">Nao projetar apenas. Transformar espacos, processos e pensamentos.</h2>
            <p className="mt-6 text-lg leading-9 text-white/68">
              Definida pelo estilo contemporaneo e pelo rigor tecnico em diversas escalas, a NIU se recusa a apenas se encaixar. Cada linha carrega o peso da intencao, a busca pela excelencia e a criatividade como responsabilidade.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {VALUES.map(([title, text]) => (
                <div key={title} className="border border-white/12 p-4">
                  <p className="font-semibold">{title}</p>
                  <p className="mt-1 text-sm text-white/55">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#8c8173]">portfolio institucional</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">Imagem, cultura e metodo em uma vitrine oficial.</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {GALLERY.map(item => (
              <article key={item.src} className="group">
                <div className="relative aspect-[4/5] overflow-hidden bg-[#11110f]">
                  <Image src={item.src} alt={item.label} fill className="object-cover transition duration-500 group-hover:scale-[1.02]" sizes="(min-width: 768px) 50vw, 100vw" />
                </div>
                <div className="flex items-start justify-between border-b border-[#d8d1c6] py-4">
                  <div>
                    <h3 className="text-lg font-semibold">{item.label}</h3>
                    <p className="mt-1 text-sm text-[#625d56]">{item.caption}</p>
                  </div>
                  <Sparkles className="mt-1 h-5 w-5 text-[#8c8173]" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#8c8173]">projetos NIU</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">Casas, estudos e obras com linguagem propria.</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-[#625d56]">
              Alguns dos projetos que expressam a atuacao da NIU: casas contemporaneas, estudos residenciais de alto padrao e obras em andamento em Franca/SP.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
            {PROJECTS.map(project => (
              <article key={project.name} className="group bg-white">
                <div className="relative aspect-[9/16] overflow-hidden bg-[#11110f]">
                  <Image
                    src={project.src}
                    alt={`${project.name} - ${project.label}`}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-[1.02]"
                    sizes="(min-width: 1280px) 20vw, (min-width: 768px) 50vw, 100vw"
                  />
                </div>
                <div className="border-b border-[#d8d1c6] py-5">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8c8173]">{project.label}</p>
                  <h3 className="mt-2 text-xl font-semibold">{project.name}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#625d56]">{project.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <div className="bg-white p-7">
              <Compass className="h-6 w-6 text-[#11110f]" />
              <h2 className="mt-5 text-3xl font-semibold tracking-[-0.03em]">Briefing inteligente para projetos de arquitetura</h2>
              <p className="mt-4 text-sm leading-6 text-[#625d56]">
                O AgoraEncontrei qualifica nome, cidade, tipo de imovel, objetivo, prazo e faixa de investimento antes do contato. A NIU recebe um resumo mais claro para responder com precisao.
              </p>
            </div>
            <div className="grid gap-px overflow-hidden bg-[#d8d1c6] sm:grid-cols-2">
              {[
                ['Missao', 'transformar limites em criatividade'],
                ['Visao', 'ser excelencia em arquitetura desafiando o obvio'],
              ].map(([title, text]) => (
                <div key={title} className="bg-white p-6">
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#625d56]">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <PartnerLeadQualifier
            specialistId="seed_niu_arquitetura"
            specialistName="NIU Arquitetura"
            categoryLabel="Arquitetura e Design"
            whatsapp={CONTACT.whatsapp}
            services={[
              { name: 'Projeto arquitetonico residencial', description: 'Casa, reforma, ampliacao ou novo projeto.' },
              { name: 'Interiores e ambientacao', description: 'Ambientes internos, materiais e composicao visual.' },
              { name: 'Arquitetura comercial', description: 'Lojas, escritorios, marcas e experiencias.' },
              { name: 'Consultoria inicial online', description: 'Triagem de objetivo, medidas, fotos e viabilidade.' },
            ]}
          />
        </div>
      </section>

      <section className="bg-[#11110f] px-5 py-16 text-white sm:px-8 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.75fr_1fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/45">contato</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em]">Comece uma conversa com a NIU.</h2>
            <p className="mt-5 text-sm leading-6 text-white/60">
              Envie o contexto do seu projeto, fotos, medidas e o momento da decisao. Quanto melhor o briefing, mais objetiva fica a primeira resposta.
            </p>
            <div className="mt-8 border border-white/12 bg-white/5 p-5">
              <MapPin className="h-5 w-5 text-white/50" />
              <p className="mt-4 text-sm text-white/45">Localizacao</p>
              <p className="mt-1 font-semibold">{CONTACT.address}</p>
              <div className="relative mt-5 aspect-[4/3] overflow-hidden bg-[#191814]">
                <Image src={NIU_IMAGES.locationMap} alt="Mapa de localizacao da NIU em Franca/SP" fill className="object-cover" sizes="(min-width: 1024px) 35vw, 100vw" />
              </div>
            </div>
          </div>
          <div className="grid gap-px overflow-hidden bg-white/12 sm:grid-cols-2">
            <a href={`tel:${CONTACT.phone.replace(/\D/g, '')}`} className="bg-[#191814] p-6 transition hover:bg-[#23221e]">
              <Phone className="h-5 w-5 text-white/50" />
              <p className="mt-5 text-sm text-white/45">Telefone</p>
              <p className="mt-1 font-semibold">{CONTACT.phone}</p>
            </a>
            <a href={waLink('Ola NIU, vim pelo AgoraEncontrei e quero falar sobre um projeto.')} target="_blank" rel="noreferrer" className="bg-[#191814] p-6 transition hover:bg-[#23221e]">
              <MessageCircle className="h-5 w-5 text-white/50" />
              <p className="mt-5 text-sm text-white/45">WhatsApp</p>
              <p className="mt-1 font-semibold">{CONTACT.whatsapp}</p>
            </a>
            <a href={`mailto:${CONTACT.email}`} className="bg-[#191814] p-6 transition hover:bg-[#23221e]">
              <Mail className="h-5 w-5 text-white/50" />
              <p className="mt-5 text-sm text-white/45">Email</p>
              <p className="mt-1 font-semibold">{CONTACT.email}</p>
            </a>
            <a href={`https://instagram.com/${CONTACT.instagram}`} target="_blank" rel="noreferrer" className="bg-[#191814] p-6 transition hover:bg-[#23221e]">
              <MapPin className="h-5 w-5 text-white/50" />
              <p className="mt-5 text-sm text-white/45">Instagram</p>
              <p className="mt-1 font-semibold">@{CONTACT.instagram}</p>
            </a>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#8c8173]">vamos conversar?</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
              Arquitetura com proposito, estetica e verdade.
            </h2>
            <p className="mt-6 text-lg leading-9 text-[#4a4a45]">
              Essa proposta e so o primeiro traco do que a NIU pode construir junto com voce. O AgoraEncontrei organiza o briefing e conecta seu projeto ao escritorio.
            </p>
            <a
              href={waLink('Ola NIU, vi os projetos no AgoraEncontrei e quero conversar sobre o meu projeto.')}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center justify-center gap-2 bg-[#11110f] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#2b2a25]"
            >
              <MessageCircle className="h-4 w-4" /> Conversar com a NIU
            </a>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden bg-[#f5f2ec]">
            <Image src={NIU_IMAGES.conversation} alt="Vamos conversar com a NIU Arquitetura" fill className="object-cover" sizes="(min-width: 1024px) 45vw, 100vw" />
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Image src={NIU_IMAGES.logo} alt="Logo NIU" width={48} height={48} className="h-12 w-12 object-cover" />
            <div>
              <p className="font-semibold">NIU Arquitetura</p>
              <p className="text-sm text-[#625d56]">Parceiro oficial AgoraEncontrei</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/empresas-parceiras/franca-sp/arquitetos" className="inline-flex items-center justify-center gap-2 border border-[#11110f] px-5 py-3 text-sm font-bold transition hover:bg-[#11110f] hover:text-white">
              <Building2 className="h-4 w-4" /> Ver no diretorio
            </Link>
            <a href={waLink('Ola, quero contratar a NIU Arquitetura pelo AgoraEncontrei.')} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 bg-[#11110f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#2b2a25]">
              <PenTool className="h-4 w-4" /> Falar com a NIU
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}

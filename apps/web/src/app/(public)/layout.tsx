import type { Metadata } from 'next'
import Link from 'next/link'
import { Phone, MapPin, Instagram, Facebook, Youtube } from 'lucide-react'
import { Navbar } from '@/components/public/Navbar'
import { BrandBackdrop } from '@/components/public/BrandBackdrop'
import { SystemThemeInjector } from '@/components/public/SystemThemeInjector'
import TomasWidget from '@/components/tomas/TomasWidget'
import { SkipNav } from '@/components/SkipNav'
import {
  fetchSiteSettings,
  resolveSiteColors,
  resolveSiteBrand,
  DEFAULT_FOOTER_LOGO_URL,
} from '@/lib/site-settings'

export const metadata: Metadata = {
  title: {
    template: '%s | AgoraEncontrei Marketplace',
    default: 'AgoraEncontrei — Marketplace Imobiliário de Franca/SP',
  },
  description: 'AgoraEncontrei é o marketplace imobiliário de Franca e região. Compra, venda e locação de imóveis com a Imobiliária Lemos e parceiros. Criado pela Imobiliária Lemos, referência desde 2002.',
  metadataBase: new URL('https://www.agoraencontrei.com.br'),
  keywords: 'imóveis franca, casas franca, apartamentos franca, terrenos franca, imobiliária franca, comprar imóvel franca, alugar imóvel franca, financiamento imobiliário, leilão imóvel, imobiliária lemos, aluguel franca sp, investimento imóvel franca, marketplace imobiliário franca, agoraencontrei',
  authors: [{ name: 'AgoraEncontrei Marketplace', url: 'https://www.agoraencontrei.com.br' }],
  creator: 'AgoraEncontrei — Imobiliária Lemos',
  publisher: 'AgoraEncontrei Marketplace',
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
}

const FOOTER_IMOVEIS = [
  { href: '/imoveis?purpose=SALE', label: 'Comprar' },
  { href: '/imoveis?purpose=RENT', label: 'Alugar' },
  { href: '/imoveis?type=APARTMENT', label: 'Apartamentos' },
  { href: '/imoveis?type=HOUSE', label: 'Casas' },
  { href: '/imoveis?type=LAND', label: 'Terrenos' },
  { href: '/imoveis?type=STORE', label: 'Comercial' },
]

const FOOTER_SERVICOS = [
  { href: '/servicos', label: 'Nossos Serviços' },
  { href: '/avaliacao', label: 'Avaliação Imediata' },
  { href: '/parceiros/cadastro', label: 'Seja um Parceiro' },
  { href: '/corretores', label: 'Nossa Equipe (Lemos)' },
  { href: '/servicos/2via-boleto', label: '2ª Via de Boleto' },
  { href: '/servicos/extrato-proprietario', label: 'Extrato do Proprietário' },
  { href: '/servicos/fichas-cadastrais', label: 'Fichas Cadastrais' },
  { href: '/financiamentos', label: 'Financiamentos' },
  { href: '/anunciar', label: 'Cadastre seu Imóvel' },
]

// No-flash theme bootstrap: resolves the saved theme (cookie → localStorage →
// system preference) and applies the `.ae-light` / `.ae-dark` class to the
// wrapper before first paint. Scoped to the public layout only.
const AE_THEME_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|; )ae-theme=([^;]+)/);var t=m?m[1]:null;if(!t){try{t=localStorage.getItem('ae-theme')}catch(e){}}if(!t){t=(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light'}var el=document.currentScript.parentElement;el.classList.remove('ae-light','ae-dark');el.classList.add(t==='dark'?'ae-dark':'ae-light')}catch(e){}})();`

// Fallbacks hardcoded atuais — mantidos para que o site nunca fique sem
// contato/redes caso a config do admin venha vazia.
const FB = {
  logo: DEFAULT_FOOTER_LOGO_URL,
  tagline: 'O Marketplace Imobiliário de Franca e Região.',
  phoneFixed: '(16) 3723-0045',
  phoneMobile: '(16) 98101-0004',
  whatsapp: '5516981010004',
  whatsappDisplay: '(16) 98101-0004',
  instagram: 'https://www.instagram.com/imobiliarialemos',
  instagramTomas: 'https://www.instagram.com/tomaslemosbr',
  youtube: 'https://www.youtube.com/@imobiliarialemos',
  facebook: 'https://facebook.com/imobiliarialemos',
  cnpj: '10.962.301/0001-50',
  website: 'https://www.imobiliarialemos.com.br',
}

const telHref = (v: string) => 'tel:' + v.replace(/\D/g, '')
const waHref = (v: string) => {
  const d = v.replace(/\D/g, '')
  return `https://wa.me/${d.startsWith('55') ? d : '55' + d}`
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await fetchSiteSettings()
  const { primary, accent } = resolveSiteColors(settings)
  const brand = resolveSiteBrand(settings, FB.logo)

  // Contato / redes — config com fallback para os valores atuais.
  const phoneFixed = (settings.phoneFixed || settings.companyPhone || FB.phoneFixed) as string
  const phoneMobile = (settings.phoneMobile || FB.phoneMobile) as string
  const whatsappRaw = (settings.whatsappNumber || FB.whatsapp) as string
  const whatsappDisplay = (settings.whatsappNumber || FB.whatsappDisplay) as string
  const instagram = (settings.instagramUrl || FB.instagram) as string
  const instagramTomas = (settings.instagramUrlTomas || FB.instagramTomas) as string
  const youtube = (settings.youtubeUrl || FB.youtube) as string
  const facebook = (settings.facebookUrl || FB.facebook) as string
  const tagline = (settings.footerTagline || FB.tagline) as string
  const cnpj = (settings.companyCnpj || FB.cnpj) as string
  const website = (settings.companyWebsite || FB.website) as string
  const websiteLabel = website.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const hasCustomAddress = typeof settings.companyAddress === 'string' && settings.companyAddress.trim() !== ''

  // No-FOUC: injeta as CSS vars de cor server-side (o SystemThemeInjector,
  // client-side, reaplica os mesmos valores + overrides de classes utilitárias).
  const themeVarsCss = `:root{--site-primary-color:${primary};--site-accent-color:${accent};}`

  return (
    <>
      {/* Papel de parede institucional: verde escuro militar + monograma AE
          em cada lateral (aparece nas telas largas, atrás do conteúdo). */}
      <BrandBackdrop />
      {/* Cores do site vindas da config do admin (com fallback). */}
      <style dangerouslySetInnerHTML={{ __html: themeVarsCss }} />
      <SystemThemeInjector />
      {/* Em telas largas (2xl+) o conteúdo vira um painel centralizado, revelando
          o verde militar e os logos nas laterais. Abaixo disso ocupa a largura
          toda — layout e leitura idênticos ao anterior (zero regressão). */}
      <div
        id="ae-root"
        suppressHydrationWarning
        className="relative min-h-screen ae-light 2xl:max-w-[1600px] 2xl:mx-auto 2xl:shadow-[0_0_60px_rgba(0,0,0,0.45)]"
        style={{ backgroundColor: 'var(--ae-surface)' }}
      >
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: AE_THEME_SCRIPT }} />
      {/* Top info bar */}
      <div style={{ backgroundColor: '#143A1F' }} className="hidden lg:block">
        <div className="max-w-7xl mx-auto px-6 h-9 flex items-center justify-between text-xs text-white/70">
          <div className="flex items-center gap-6">
            <a href={telHref(phoneFixed)} className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Phone className="w-3 h-3" /> {phoneFixed}
            </a>
            <a href={telHref(phoneMobile)} className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Phone className="w-3 h-3" /> {phoneMobile}
            </a>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3" /> Franca — SP
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white/70">Marketplace Imobiliário · Franca/SP</span>
            <a href={instagram} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white transition-colors" aria-label="Instagram da Imobiliária Lemos (@imobiliarialemos)">
              <Instagram className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
            <a href={instagramTomas} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white transition-colors" aria-label="Instagram de Tomás Lemos (@tomaslemosbr)">
              <Instagram className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
            <a href={facebook} target="_blank" rel="noreferrer" className="hover:text-white transition-colors" aria-label="Facebook da Imobiliária Lemos">
              <Facebook className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
            <a href={youtube} target="_blank" rel="noreferrer" className="hover:text-white transition-colors" aria-label="Canal YouTube da Imobiliária Lemos">
              <Youtube className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      <SkipNav />
      <Navbar
        logoUrl={brand.logoUrl}
        wordmarkUrl={brand.wordmarkUrl}
        fullLogoUrl={brand.fullLogoUrl}
        companyName={brand.companyName}
        hasCustomLogo={brand.hasCustomLogo}
        visible={brand.visible}
        showText={brand.showText}
        position={brand.position}
      />

      <main id="main-content" tabIndex={-1}>{children}</main>
      <TomasWidget />

      {/* Footer */}
      <footer style={{ backgroundColor: '#143A1F' }} className="mt-20 pt-14 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            {/* Brand */}
            <div>
              {brand.visible && (
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={brand.logoUrl}
                    alt={brand.companyName ?? 'AgoraEncontrei Marketplace'}
                    width={44}
                    height={44}
                    className="rounded-full flex-shrink-0 object-cover"
                    loading="lazy"
                  />
                  {brand.showText && (
                    brand.companyName ? (
                      <div className="flex flex-col leading-none">
                        <span className="font-bold text-base" style={{ fontFamily: 'Arial, Helvetica, sans-serif', color: '#d1d5db' }}>
                          {brand.companyName}
                        </span>
                        <span className="text-[10px] font-medium" style={{ color: '#9ca3af', letterSpacing: '0.04em' }}>Marketplace</span>
                      </div>
                    ) : (
                      // Marca escrita padrão (imagem), editável pelo admin. O
                      // rodapé é verde escuro → usa a wordmark clara (creme +
                      // dourado) para "Agora Encontrei" ficar legível.
                      <img
                        src={brand.wordmarkUrl ?? '/brand/ae-wordmark-light.png'}
                        alt="Agora Encontrei Marketplace"
                        width={148}
                        height={40}
                        className="h-9 w-auto"
                        loading="lazy"
                      />
                    )
                  )}
                </div>
              )}
              <p className="text-white/70 text-xs leading-relaxed">
                {tagline}
              </p>
              <p className="text-white/60 text-xs mt-1">
                Criado pela <span className="text-white/60 font-medium">Imobiliária Lemos</span>, referência desde 2002.
              </p>

              {/* Social media */}
              <div className="mt-5">
                <p className="text-white/55 text-xs uppercase tracking-wider mb-3">Redes Sociais</p>
                <div className="flex flex-col gap-2">
                  <a
                    href={instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 group"
                    aria-label="Instagram da Imobiliária Lemos (@imobiliarialemos)"
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-white/60 group-hover:text-white transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                      <Instagram className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-white/70 text-xs group-hover:text-white transition-colors">@imobiliarialemos</span>
                  </a>
                  <a
                    href={instagramTomas}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 group"
                    aria-label="Instagram de Tomás Lemos (@tomaslemosbr)"
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-white/60 group-hover:text-white transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                      <Instagram className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-white/70 text-xs group-hover:text-white transition-colors">@tomaslemosbr</span>
                  </a>
                  <a
                    href={youtube}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 group"
                    aria-label="Canal YouTube da Imobiliária Lemos"
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-white/60 group-hover:text-white transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                      <Youtube className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-white/70 text-xs group-hover:text-white transition-colors">Imobiliária Lemos</span>
                  </a>
                  <a
                    href={facebook}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 group"
                    aria-label="Facebook da Imobiliária Lemos"
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-white/60 group-hover:text-white transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                      <Facebook className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-white/70 text-xs group-hover:text-white transition-colors">imobiliarialemos</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Imóveis */}
            <div>
              <p className="text-sm font-semibold mb-4 tracking-wide uppercase" style={{ color: '#C9A84C' }}>Imóveis</p>
              <ul className="space-y-2.5">
                {FOOTER_IMOVEIS.map(l => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-white/70 text-sm hover:text-white transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Serviços */}
            <div>
              <p className="text-sm font-semibold mb-4 tracking-wide uppercase" style={{ color: '#C9A84C' }}>Serviços</p>
              <ul className="space-y-2.5">
                {FOOTER_SERVICOS.map(l => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-white/70 text-sm hover:text-white transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
              {/* Área de Acesso */}
              <p className="text-sm font-semibold mt-6 mb-3 tracking-wide uppercase" style={{ color: '#C9A84C' }}>Área de Acesso</p>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/login" className="flex items-center gap-2 text-white/70 text-sm hover:text-white transition-colors group">
                    <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: '#C9A84C' }} />
                    Painel Administrativo
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="flex items-center gap-2 text-white/70 text-sm hover:text-white transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: '#4a90d9' }} />
                    Área do Corretor
                  </Link>
                </li>
                <li>
                  <Link href="/portal/login" className="flex items-center gap-2 text-white/70 text-sm hover:text-white transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: '#5cb85c' }} />
                    Portal do Cliente
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contato */}
            <div>
              <p className="text-sm font-semibold mb-4 tracking-wide uppercase" style={{ color: '#C9A84C' }}>Contato</p>
              <ul className="space-y-3 text-sm">
                <li>
                  <p className="text-white/60 text-xs uppercase tracking-wider mb-0.5">Fixo</p>
                  <a href={telHref(phoneFixed)} className="text-white/70 hover:text-white transition-colors">{phoneFixed}</a>
                </li>
                <li>
                  <p className="text-white/60 text-xs uppercase tracking-wider mb-0.5">Vendas / Locação</p>
                  <a href={telHref(phoneMobile)} className="text-white/70 hover:text-white transition-colors">{phoneMobile}</a>
                </li>
                <li>
                  <p className="text-white/60 text-xs uppercase tracking-wider mb-0.5">WhatsApp</p>
                  <a href={waHref(whatsappRaw)} target="_blank" rel="noreferrer"
                    className="hover:opacity-80 transition-opacity" style={{ color: 'var(--site-accent-color, #C9A84C)' }}>
                    {whatsappDisplay}
                  </a>
                </li>
                <li className="pt-1">
                  <p className="text-white/60 text-xs uppercase tracking-wider mb-0.5">Endereço</p>
                  {hasCustomAddress ? (
                    <p className="text-white/60 text-sm leading-relaxed">
                      {settings.companyAddress as string}
                      {(settings.companyCity || settings.companyState) && (
                        <>
                          <br />
                          {[settings.companyCity, settings.companyState].filter(Boolean).join(' — ')}
                        </>
                      )}
                    </p>
                  ) : (
                    <p className="text-white/60 text-sm leading-relaxed">
                      Rua Simão Caleiro, 2383<br />
                      Vila Industrial — Franca/SP<br />
                      CEP 14400-340
                    </p>
                  )}
                  <p className="text-white/60 text-xs mt-1">CNPJ: {cnpj}</p>
                  <a
                    href={website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs mt-1 inline-block hover:opacity-80 transition-opacity"
                    style={{ color: 'var(--site-accent-color, #C9A84C)' }}
                  >
                    {websiteLabel}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-white/70 text-xs">
              © {new Date().getFullYear()} AgoraEncontrei Marketplace. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/termos-uso" className="text-white/60 text-xs hover:text-white/70 transition-colors">Termos de Uso</Link>
              <span className="text-white/20 text-xs">·</span>
              <Link href="/politica-privacidade" className="text-white/60 text-xs hover:text-white/70 transition-colors">Política de Privacidade</Link>
              <span className="text-white/20 text-xs">·</span>
              <p className="text-white/60 text-xs">Criado pela Imobiliária Lemos · Fundada em 2002</p>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </>
  )
}

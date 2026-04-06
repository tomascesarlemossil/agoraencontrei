import type { MetadataRoute } from 'next'

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'https://www.agoraencontrei.com.br'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Regras gerais para todos os crawlers
        userAgent: '*',
        allow: [
          '/',
          '/imoveis',
          '/bairros',
          '/blog',
          '/servicos',
          '/corretores',
          '/sobre',
          '/avaliacao',
          '/anunciar',
          '/financiamentos',
          '/faq',
          '/contato',
          '/casas-a-venda-franca-sp',
          '/casas-para-alugar-franca-sp',
          '/apartamentos-a-venda-franca-sp',
          '/apartamentos-para-alugar-franca-sp',
          '/terrenos-a-venda-franca-sp',
          '/imoveis-comerciais-franca-sp',
          '/chacaras-franca-sp',
          '/condominio-fechado-franca-sp',
          '/leilao-imoveis-franca-sp',
          '/investimento-imobiliario-franca-sp',
        ],
        disallow: [
          '/dashboard/',
          '/api/',
          '/login',
          '/portal/',
          '/servicos/2via-boleto',
          '/servicos/extrato-proprietario',
          '/_next/',
          '/admin/',
        ],
      },
      {
        // Googlebot tem acesso total às páginas públicas
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/dashboard/', '/api/', '/login', '/portal/', '/admin/'],
      },
      {
        // Bingbot também tem acesso total
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/dashboard/', '/api/', '/login', '/portal/', '/admin/'],
      },
    ],
    sitemap: [
      `${WEB_URL}/sitemap.xml`,
    ],
    host: WEB_URL,
  }
}

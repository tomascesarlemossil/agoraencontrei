import type { MetadataRoute } from 'next'

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'https://www.agoraencontrei.com.br'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/imoveis',
          '/leiloes',
          '/bairros',
          '/condominios',
          '/profissionais',
          '/blog',
          '/servicos',
          '/corretores',
          '/sobre',
          '/avaliacao',
          '/anunciar',
          '/financiamentos',
          '/faq',
          '/contato',
          '/parceiros',
          '/casas-a-venda-franca-sp',
          '/casas-para-alugar-franca-sp',
          '/apartamentos-a-venda-franca-sp',
          '/apartamentos-para-alugar-franca-sp',
          '/terrenos-a-venda-franca-sp',
          '/imoveis-comerciais-franca-sp',
          '/chacaras-e-sitios-franca-sp',
          '/condominio-fechado-franca-sp',
          '/leilao-imoveis-franca-sp',
          '/investimento-imobiliario-franca-sp',
          '/imoveis-regiao-franca-sp',
          '/imoveis-batatais-sp',
          '/imoveis-rifaina-sp',
          '/imoveis-brodowski-sp',
          '/imoveis-cristais-paulista-sp',
          '/imoveis-patrocinio-paulista-sp',
          '/imoveis-pedregulho-sp',
          '/imoveis-altinopolis-sp',
        ],
        disallow: [
          '/dashboard/',
          '/api/',
          '/login',
          '/portal/',
          '/_next/',
          '/admin/',
          '/meu-painel', // Private partner data
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/dashboard/', '/api/', '/login', '/portal/', '/admin/', '/meu-painel'],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/dashboard/', '/api/', '/login', '/portal/', '/admin/', '/meu-painel'],
      },
    ],
    sitemap: [
      `${WEB_URL}/sitemap.xml`,
    ],
    host: WEB_URL,
  }
}

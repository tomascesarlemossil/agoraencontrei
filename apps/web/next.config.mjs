/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output for Docker/Railway deployment
  output: 'standalone',
  // Compressão gzip/brotli automática
  compress: true,
  // Skip type checking during build — types are checked in CI/dev
  // Next.js 15 async params break type checking on all dynamic routes
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    scrollRestoration: true,
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
    ],
    optimisticClientCache: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    // Mobile-first: reduzido de 2048 para 1920
    deviceSizes: [390, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Cache de imagens por 1 ano no servidor
    minimumCacheTTL: 31536000,
    remotePatterns: [
      { protocol: 'https', hostname: 'cdnuso.com' },
      { protocol: 'https', hostname: 'cdn2.uso.com.br' },
      { protocol: 'https', hostname: '*.s3.amazonaws.com' },
      { protocol: 'https', hostname: '*.cloudfront.net' },
      { protocol: 'https', hostname: 'agoraencontrei-media.s3.us-east-1.amazonaws.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  // Otimização de bundle: separar vendor chunks
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            leaflet: {
              test: /[\\/]node_modules[\\/](leaflet)[\\/]/,
              name: 'leaflet',
              chunks: 'async',
              priority: 20,
            },
            recharts: {
              test: /[\\/]node_modules[\\/](recharts|d3-.*)[\\/]/,
              name: 'recharts',
              chunks: 'async',
              priority: 15,
            },
          },
        },
      }
    }
    return config
  },
  async redirects() {
    return [
      {
        source: '/busca',
        destination: '/imoveis',
        permanent: true,
      },
      {
        source: '/cadastro',
        destination: '/register',
        permanent: true,
      },
      {
        source: '/planos',
        destination: '/parceiros/planos',
        permanent: true,
      },
    ]
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-669c.up.railway.app'
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiUrl}/api/v1/:path*`,
      },
      // /health is handled directly by app/health/route.ts — no proxy needed
      // ── SEO Programático: /{categoria}/{cidade} → /seo/{categoria}/{cidade} ──
      // Property types
      { source: '/:cat(casas-a-venda|apartamentos-a-venda|terrenos-a-venda|imoveis-comerciais|salas-comerciais|galpoes|cobertura-duplex|kitnet|condominio-fechado|chacaras-a-venda|sitios-a-venda|fazendas-a-venda|imoveis-rurais|casas-para-alugar|apartamentos-para-alugar|kitnets-para-alugar|salas-para-alugar|galpoes-para-alugar|casas-em-condominio|aluguel-temporada|imoveis-permuta|lancamentos|imoveis-novos|imoveis-usados)/:cidade', destination: '/seo/:cat/:cidade' },
      // Leilões
      { source: '/:cat(leilao-casas|leilao-apartamentos|leilao-terrenos|leilao-caixa|leilao-judicial|leilao-extrajudicial|leilao-banco-do-brasil|leilao-bradesco|leilao-itau|leilao-santander|leilao-rural)/:cidade', destination: '/seo/:cat/:cidade' },
      // Serviços e profissionais
      { source: '/:cat(avaliacao-imoveis|financiamento-imovel|reforma-de-imoveis|materiais-de-construcao|vistoria-imovel|decoracao-interiores|investimento-imobiliario|home-staging|engenheiros-civis|arquitetos|advogados-imobiliarios|agrimensores|corretores-de-imoveis|despachante-imobiliario|fotografo-imoveis)/:cidade', destination: '/seo/:cat/:cidade' },
      // Construção
      { source: '/:cat(construtoras|empreiteiros|pedreiros|eletricistas|encanadores|pintores|marceneiros|vidraceiros|serralheiros)/:cidade', destination: '/seo/:cat/:cidade' },
      // Documentação
      { source: '/:cat(regularizacao-imovel|escritura-imovel|usucapiao|inventario-imovel)/:cidade', destination: '/seo/:cat/:cidade' },
      // Filtros (quartos, preço, features)
      { source: '/:cat(valor-metro-quadrado|imoveis-1-quarto|imoveis-2-quartos|imoveis-3-quartos|imoveis-4-quartos|imoveis-ate-200mil|imoveis-200-500mil|imoveis-500mil-1milhao|imoveis-acima-1milhao|aluguel-ate-1000|aluguel-1000-2000|aluguel-2000-3000|aluguel-acima-3000)/:cidade', destination: '/seo/:cat/:cidade' },
      // Proximity & features
      { source: '/:cat(imoveis-perto-metro|imoveis-perto-escola|imoveis-perto-hospital|imoveis-perto-shopping|imoveis-com-piscina|imoveis-com-churrasqueira|imoveis-aceita-pets|imoveis-mobiliados|imoveis-com-varanda)/:cidade', destination: '/seo/:cat/:cidade' },
      // Outros serviços
      { source: '/:cat(seguro-residencial|seguro-incendio|empresas-mudanca|guarda-moveis|limpeza-pos-obra|dedetizacao|jardinagem-paisagismo|impermeabilizacao)/:cidade', destination: '/seo/:cat/:cidade' },
    ]
  },
  async headers() {
    return [
      // ── Dashboard/Auth: noindex ────────────────────────────────────
      {
        source: '/dashboard/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/login',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/register',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/portal/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      // ── Public pages: full indexing ────────────────────────────────
      {
        source: '/(.*)',
        headers: [
          // ── SEO: Indexação otimizada para 1M+ páginas ───────────────────
          {
            key: 'X-Robots-Tag',
            value: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
          },
          // ── Security Headers ──────────────────────────────────────────────
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
          },
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none',
          },
          // ── Content Security Policy ───────────────────────────────────────
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://connect.facebook.net https://www.googletagmanager.com https://www.google-analytics.com https://maps.googleapis.com https://cdn.jsdelivr.net https://unpkg.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: http:",
              "connect-src 'self' https://api.agoraencontrei.com.br https://*.railway.app https://www.google-analytics.com https://analytics.google.com https://www.facebook.com https://maps.googleapis.com https://nominatim.openstreetmap.org https://tile.openstreetmap.org https://tiles.openfreemap.org https://demotiles.maplibre.org https://mt0.google.com https://mt1.google.com https://mt2.google.com https://mt3.google.com https://unpkg.com wss:",
              "frame-src 'self' https://www.youtube.com https://www.google.com https://maps.google.com",
              "media-src 'self' https: blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
      // ── Cache headers for static assets ────────────────────────────────────
      {
        source: '/images/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // ── Block indexing of admin/dashboard routes ───────────────────────────
      {
        source: '/dashboard/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      {
        source: '/login',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      {
        source: '/register',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      {
        source: '/portal/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      // Cache para API pública via proxy (CDN edge cache)
      {
        source: '/api/v1/public/(featured|site-settings|team|cities|stats|map-clusters)(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=600' },
        ],
      },
    ]
  },
}

export default nextConfig
// Build trigger 1775545191

/**
 * seo-generator.service.ts
 * Motor de geração de páginas SEO programáticas.
 * Usa OpenAI (gpt-4.1-mini) com rotação de prompts anti-padrão.
 */
import OpenAI from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

/** Slugify PT-BR */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Dados básicos de uma página SEO (sem conteúdo IA) */
export function buildPageData(keyword: string, cidade: string, uf: string, bairro?: string) {
  const location = bairro ? `${bairro}, ${cidade} ${uf}` : `${cidade} ${uf}`
  const slug = bairro
    ? slugify(`${keyword}-${bairro}-${cidade}-${uf}`)
    : slugify(`${keyword}-${cidade}-${uf}`)

  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

  return {
    slug,
    titulo: `${cap(keyword)} em ${location} | AgoraEncontrei`,
    h1: `${cap(keyword)} em ${location}`,
    meta_title: `${cap(keyword)} em ${location} — Melhores Oportunidades | AgoraEncontrei`,
    meta_description: `Veja as melhores opções de ${keyword.toLowerCase()} em ${location}. Compare preços, bairros e detalhes no AgoraEncontrei — atualizado diariamente.`,
    intro: `Encontre opções de ${keyword.toLowerCase()} em ${location} no AgoraEncontrei. Explore oportunidades reais, compare anúncios e tome decisões com dados.`,
    canonical_url: `https://agoraencontrei.com.br/seo/${uf.toLowerCase()}/${slugify(cidade)}${bairro ? '/' + slugify(bairro) : ''}/${slugify(keyword)}`,
    faq: [
      {
        question: `Como encontrar ${keyword.toLowerCase()} em ${location}?`,
        answer: `Compare anúncios, localização, faixa de preço e detalhes do imóvel para identificar as melhores oportunidades em ${location}.`,
      },
      {
        question: `Vale a pena buscar ${keyword.toLowerCase()} em ${location}?`,
        answer: `Sim. ${cidade} oferece oportunidades variadas dependendo do bairro, do valor e do potencial de valorização. Consulte nossos especialistas.`,
      },
      {
        question: `Qual o preço médio de ${keyword.toLowerCase()} em ${location}?`,
        answer: `O preço varia conforme localização, tamanho e tipo do imóvel. Use nossa calculadora de ROI para estimar o valor justo.`,
      },
    ],
  }
}

/** Prompts variados para evitar padrão detectável pelo Google */
const PROMPT_VARIANTS = [
  (keyword: string, cidade: string, uf: string) => `
Atue como especialista em mercado imobiliário de ${cidade} - ${uf}.
Crie conteúdo estratégico sobre "${keyword} em ${cidade} - ${uf}".
Inclua: contexto real da cidade, análise de oportunidades, visão de investimento, pontos fortes e riscos.
Use linguagem natural e específica da região. Evite frases genéricas e introduções clichê.
Finalize com 5 perguntas frequentes realistas. Texto entre 500 e 700 palavras.`,

  (keyword: string, cidade: string, uf: string) => `
Você é um corretor experiente em ${cidade} ${uf}. Escreva um guia prático sobre "${keyword}" nessa cidade.
Aborde: situação atual do mercado, bairros mais procurados, faixa de preço, dicas para comprador/investidor.
Tom direto, informativo, sem exageros. 500 a 700 palavras. Sem bullet points excessivos.`,

  (keyword: string, cidade: string, uf: string) => `
Crie um artigo informativo sobre "${keyword} em ${cidade} ${uf}" para um portal imobiliário.
Estrutura: introdução contextualizada → mercado local → oportunidades → dicas práticas → conclusão.
Linguagem acessível, dados reais quando possível, sem repetição. 500 a 700 palavras.`,
]

/** Gera conteúdo IA com rotação de prompts */
export async function generateSeoContent(keyword: string, cidade: string, uf: string): Promise<string> {
  const variant = PROMPT_VARIANTS[Math.floor(Math.random() * PROMPT_VARIANTS.length)]
  const prompt = variant(keyword, cidade, uf)

  const response = await client.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1200,
    temperature: 0.8,
  })

  return response.choices[0]?.message?.content || ''
}

/** URL padrão de uma página SEO */
export function buildSeoUrl(uf: string, cidadeSlug: string, keywordSlug: string, bairroSlug?: string): string {
  const base = `/seo/${uf.toLowerCase()}/${cidadeSlug}`
  return bairroSlug ? `${base}/${bairroSlug}/${keywordSlug}` : `${base}/${keywordSlug}`
}

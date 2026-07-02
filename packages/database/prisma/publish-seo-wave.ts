/**
 * Publicador em Ondas — SEO Programático AgoraEncontrei
 * -------------------------------------------------------------------------
 * Publica, de forma CONTROLADA, os posts importados como draft por
 * import-seo-programmatic.ts (source='seo-programmatic').
 *
 * Por que ondas? Publicar milhares de páginas quase-template de uma vez é o
 * gatilho clássico de "scaled content abuse" do Google. Publicar em lotes,
 * medindo indexação no Search Console entre as ondas, é o caminho seguro.
 *
 * Uso (dry-run por padrão — NÃO altera nada sem --confirm):
 *   pnpm --filter @agoraencontrei/database run publish:seo -- --bairro="Centro" --limit=200
 *   pnpm --filter @agoraencontrei/database run publish:seo -- --bairro="Centro" --limit=200 --confirm
 *   pnpm --filter @agoraencontrei/database run publish:seo -- --tema="Leilões" --limit=100 --confirm
 *   pnpm --filter @agoraencontrei/database run publish:seo -- --limit=100 --confirm   (qualquer bairro)
 *
 * Flags:
 *   --bairro="Nome"   filtra por bairro (contains, case-insensitive)
 *   --tema="Texto"    filtra por tema (busca em editorialNotes)
 *   --limit=N         máx. de posts nesta onda (default 100)
 *   --confirm         aplica de fato (sem isso, apenas simula)
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.split('=').slice(1).join('=').replace(/^["']|["']$/g, '') : undefined
}
const has = (name: string) => process.argv.includes(`--${name}`)

async function main() {
  const bairro = arg('bairro')
  const tema = arg('tema')
  const limit = arg('limit') ? parseInt(arg('limit')!, 10) : 100
  const confirm = has('confirm')

  const where: any = {
    source: 'seo-programmatic',
    published: false,
    status: 'draft',
  }
  if (bairro) where.bairro = { contains: bairro, mode: 'insensitive' }
  if (tema) where.editorialNotes = { contains: tema, mode: 'insensitive' }

  const totalPending = await prisma.blogPost.count({ where })
  const candidates = await prisma.blogPost.findMany({
    where,
    select: { id: true, slug: true, bairro: true, title: true },
    orderBy: { createdAt: 'asc' },
    take: limit,
  })

  console.log('🌊 Onda de publicação — SEO programático')
  console.log(`   filtro: bairro=${bairro ?? '(todos)'} tema=${tema ?? '(todos)'}`)
  console.log(`   pendentes no filtro: ${totalPending}`)
  console.log(`   nesta onda:          ${candidates.length}`)

  if (candidates.length === 0) {
    console.log('   nada a publicar.')
    return
  }

  console.log('\n   amostra:')
  candidates.slice(0, 8).forEach((c) => console.log(`     • [${c.bairro}] ${c.title.slice(0, 70)}`))

  if (!confirm) {
    console.log('\n🔎 DRY-RUN. Nada foi alterado. Adicione --confirm para publicar.')
    return
  }

  const ids = candidates.map((c) => c.id)
  const res = await prisma.blogPost.updateMany({
    where: { id: { in: ids } },
    data: {
      status: 'published',
      published: true,
      publishedAt: new Date(),
      noindex: false,
    },
  })

  console.log(`\n✅ Publicados: ${res.count}`)
  console.log(`   restam pendentes no filtro: ${totalPending - res.count}`)
  console.log('   👉 Aguarde a indexação no Search Console antes da próxima onda.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())

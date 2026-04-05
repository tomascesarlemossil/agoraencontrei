/**
 * Script: Publicar todos os imóveis ativos no site público
 *
 * Problema: Imóveis importados têm status='ACTIVE' mas authorizedPublish=false,
 * o que impede que apareçam no site público (agoraencontrei.com.br).
 *
 * Solução: Setar authorizedPublish=true e publishedAt para todos os imóveis
 * que têm status='ACTIVE' mas ainda não estão publicados.
 *
 * Uso: node scripts/publish-all-active-properties.js
 *
 * Requer: DATABASE_URL no .env ou como variável de ambiente
 */

const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()

  try {
    // 1. Contar imóveis por status
    const statusCounts = await prisma.property.groupBy({
      by: ['status', 'authorizedPublish'],
      _count: true,
    })

    console.log('\n📊 Distribuição atual de imóveis:')
    console.log('─'.repeat(50))
    for (const row of statusCounts) {
      console.log(`  Status: ${row.status.padEnd(10)} | Publicado: ${row.authorizedPublish ? '✅ Sim' : '❌ Não'} | Qtd: ${row._count}`)
    }

    // 2. Contar imóveis ACTIVE não publicados
    const unpublished = await prisma.property.count({
      where: {
        status: 'ACTIVE',
        authorizedPublish: false,
      },
    })

    if (unpublished === 0) {
      console.log('\n✅ Todos os imóveis ativos já estão publicados!')
      return
    }

    console.log(`\n🔄 Encontrados ${unpublished} imóveis ATIVOS não publicados`)
    console.log('   Publicando todos...\n')

    // 3. Atualizar todos os imóveis ACTIVE para authorizedPublish=true
    const result = await prisma.property.updateMany({
      where: {
        status: 'ACTIVE',
        authorizedPublish: false,
      },
      data: {
        authorizedPublish: true,
        publishedAt: new Date(),
      },
    })

    console.log(`✅ ${result.count} imóveis publicados com sucesso!`)

    // 4. Mostrar totais finais
    const totalPublished = await prisma.property.count({
      where: {
        status: 'ACTIVE',
        authorizedPublish: true,
      },
    })

    const totalRent = await prisma.property.count({
      where: {
        status: 'ACTIVE',
        authorizedPublish: true,
        purpose: { in: ['RENT', 'BOTH'] },
      },
    })

    const totalSale = await prisma.property.count({
      where: {
        status: 'ACTIVE',
        authorizedPublish: true,
        purpose: { in: ['SALE', 'BOTH'] },
      },
    })

    console.log(`\n📈 Totais finais:`)
    console.log(`   Total publicados: ${totalPublished}`)
    console.log(`   Para locação:     ${totalRent}`)
    console.log(`   Para venda:       ${totalSale}`)
    console.log('\n🌐 Os imóveis aparecerão no site público após a próxima atualização de cache.')

  } catch (error) {
    console.error('❌ Erro:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

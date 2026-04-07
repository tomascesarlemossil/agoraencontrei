#!/usr/bin/env node
/**
 * Corrige ortografia "Á VENDA" → "À VENDA" em TODOS os campos de texto dos imóveis
 */
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function fixOrtografia(text) {
  if (!text) return text
  return text
    .replace(/Á VENDA/g, 'À VENDA')
    .replace(/á venda/g, 'à venda')
    .replace(/Á Venda/g, 'À Venda')
    .replace(/á Venda/g, 'à Venda')
    .replace(/A VENDA/g, 'À VENDA')  // sem acento também
    .replace(/a venda/g, 'à venda')
}

async function main() {
  console.log('Verificando ocorrências de ortografia errada...')
  
  // Verificar títulos
  const wrongTitles = await prisma.property.count({
    where: {
      OR: [
        { title: { contains: 'Á VENDA' } },
        { title: { contains: 'á venda' } },
        { title: { contains: 'A VENDA' } },
      ]
    }
  })
  console.log(`Títulos com ortografia errada: ${wrongTitles}`)

  // Verificar descrições
  const wrongDescs = await prisma.property.count({
    where: {
      OR: [
        { description: { contains: 'Á VENDA' } },
        { description: { contains: 'á venda' } },
        { description: { contains: 'A VENDA' } },
      ]
    }
  })
  console.log(`Descrições com ortografia errada: ${wrongDescs}`)

  if (wrongTitles === 0 && wrongDescs === 0) {
    console.log('✅ Nenhuma ocorrência errada encontrada!')
    await prisma.$disconnect()
    return
  }

  // Corrigir em lote usando updateMany com SQL raw
  const titleResult = await prisma.$executeRaw`
    UPDATE properties 
    SET title = REPLACE(REPLACE(REPLACE(title, 'Á VENDA', 'À VENDA'), 'á venda', 'à venda'), 'A VENDA', 'À VENDA')
    WHERE title LIKE '%Á VENDA%' OR title LIKE '%á venda%' OR title LIKE '%A VENDA%'
  `
  console.log(`Títulos corrigidos: ${titleResult}`)

  const descResult = await prisma.$executeRaw`
    UPDATE properties 
    SET description = REPLACE(REPLACE(REPLACE(description, 'Á VENDA', 'À VENDA'), 'á venda', 'à venda'), 'A VENDA', 'À VENDA')
    WHERE description LIKE '%Á VENDA%' OR description LIKE '%á venda%' OR description LIKE '%A VENDA%'
  `
  console.log(`Descrições corrigidas: ${descResult}`)

  // Verificar resultado final
  const remaining = await prisma.property.count({
    where: {
      OR: [
        { title: { contains: 'Á VENDA' } },
        { description: { contains: 'Á VENDA' } },
      ]
    }
  })
  console.log(`Restantes com erro: ${remaining}`)
  console.log(remaining === 0 ? '✅ Tudo corrigido!' : '⚠️ Ainda há ocorrências')

  await prisma.$disconnect()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})

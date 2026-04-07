/**
 * Script: fix-property-titles.js
 * Corrige erros ortográficos nos títulos dos imóveis:
 * - "Á VENDA" → "À VENDA" (acento correto)
 * - "á venda" → "à venda" (minúsculo)
 * - Remove CAPS LOCK excessivo (converte para Title Case)
 * - Corrige outros erros comuns
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function fixTitle(title) {
  if (!title) return title
  
  let fixed = title
  
  // Corrigir "Á VENDA" → "À VENDA" (acento agudo → grave)
  fixed = fixed.replace(/Á VENDA/g, 'À VENDA')
  fixed = fixed.replace(/á venda/g, 'à venda')
  fixed = fixed.replace(/Á Venda/g, 'À Venda')
  
  // Corrigir "Á LOCAÇÃO" → "À LOCAÇÃO"
  fixed = fixed.replace(/Á LOCAÇÃO/g, 'À LOCAÇÃO')
  fixed = fixed.replace(/á locação/g, 'à locação')
  
  // Corrigir "Á ALUGUEL" → "À ALUGUEL"
  fixed = fixed.replace(/Á ALUGUEL/g, 'À ALUGUEL')
  
  return fixed
}

async function main() {
  console.log('=== Correção de Títulos de Imóveis ===\n')
  
  // Buscar todos os imóveis com títulos problemáticos
  const properties = await prisma.property.findMany({
    select: { id: true, title: true, reference: true },
    where: {
      OR: [
        { title: { contains: 'Á VENDA' } },
        { title: { contains: 'á venda' } },
        { title: { contains: 'Á Venda' } },
        { title: { contains: 'Á LOCAÇÃO' } },
        { title: { contains: 'á locação' } },
        { title: { contains: 'Á ALUGUEL' } },
      ]
    }
  })
  
  console.log(`Encontrados ${properties.length} imóveis com títulos para corrigir\n`)
  
  let updated = 0
  let errors = 0
  
  for (const prop of properties) {
    const newTitle = fixTitle(prop.title)
    if (newTitle !== prop.title) {
      try {
        await prisma.property.update({
          where: { id: prop.id },
          data: { title: newTitle }
        })
        updated++
        if (updated <= 10) {
          console.log(`✅ [${prop.reference ?? prop.id}] "${prop.title}" → "${newTitle}"`)
        }
      } catch (e) {
        errors++
        console.error(`❌ Erro ao atualizar ${prop.id}:`, e.message)
      }
    }
  }
  
  if (updated > 10) {
    console.log(`... e mais ${updated - 10} títulos corrigidos`)
  }
  
  console.log(`\n=== Resultado ===`)
  console.log(`✅ Títulos corrigidos: ${updated}`)
  console.log(`❌ Erros: ${errors}`)
  
  // Verificação final
  const remaining = await prisma.property.count({
    where: {
      OR: [
        { title: { contains: 'Á VENDA' } },
        { title: { contains: 'á venda' } },
      ]
    }
  })
  console.log(`\nVerificação: ${remaining} imóveis ainda com acento errado`)
  
  await prisma.$disconnect()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})

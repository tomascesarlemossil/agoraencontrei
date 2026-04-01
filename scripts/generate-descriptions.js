const { PrismaClient } = require('/Users/tomaslemos/Downloads/squads/agoraencontrei/packages/database/node_modules/@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_KAver0xR2jiU@ep-holy-band-andfuwo5.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    },
  },
});

function generateDescription(p) {
  const typeMap = {
    HOUSE: 'Casa',
    APARTMENT: 'Apartamento',
    LAND: 'Terreno',
    FARM: 'Chácara/Sítio',
    WAREHOUSE: 'Galpão',
    OFFICE: 'Escritório',
    STORE: 'Loja',
    STUDIO: 'Studio',
    PENTHOUSE: 'Cobertura',
    CONDO: 'Condomínio',
    KITNET: 'Kitnet',
    RANCH: 'Rancho',
  };
  const purposeMap = {
    SALE: 'à venda',
    RENT: 'para alugar',
    BOTH: 'à venda ou aluguel',
    SEASON: 'para temporada',
  };

  const tipo = typeMap[p.type] || 'Imóvel';
  const finalidade = purposeMap[p.purpose] || '';
  const loc = [p.neighborhood, p.city, p.state].filter(Boolean).join(', ');

  let parts = [];

  // Opening sentence
  let opening = `${tipo} ${finalidade}`;
  if (loc) opening += ` em ${loc}`;
  opening += '.';
  parts.push(opening);

  // Features sentence
  let features = [];
  if (p.bedrooms && p.bedrooms > 0)
    features.push(`${p.bedrooms} dormitório${p.bedrooms > 1 ? 's' : ''}`);
  if (p.suites && p.suites > 0)
    features.push(`${p.suites} suíte${p.suites > 1 ? 's' : ''}`);
  if (p.bathrooms && p.bathrooms > 0)
    features.push(`${p.bathrooms} banheiro${p.bathrooms > 1 ? 's' : ''}`);
  if (p.parkingSpaces && p.parkingSpaces > 0)
    features.push(`${p.parkingSpaces} vaga${p.parkingSpaces > 1 ? 's' : ''} de garagem`);
  if (features.length > 0) parts.push(`Conta com ${features.join(', ')}.`);

  // Area sentence
  let areas = [];
  if (p.totalArea) areas.push(`área total de ${p.totalArea}m²`);
  if (p.builtArea) areas.push(`área construída de ${p.builtArea}m²`);
  if (areas.length > 0) parts.push(`Possui ${areas.join(' e ')}.`);

  // Price sentence
  if (p.price && Number(p.price) > 0) {
    const val = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
      Number(p.price)
    );
    parts.push(`Valor de venda: ${val}.`);
  } else if (p.priceRent && Number(p.priceRent) > 0) {
    const val = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
      Number(p.priceRent)
    );
    parts.push(`Valor do aluguel: ${val}/mês.`);
  }

  // Closing
  parts.push(
    'Entre em contato com a Imobiliária Lemos para mais informações e agendar uma visita. CRECI 61053-F.'
  );

  return parts.join(' ');
}

async function main() {
  console.log('Conectando ao banco de dados...');

  // First, get available fields by checking schema
  // Try to count how many properties need descriptions
  let totalCount;
  try {
    totalCount = await prisma.property.count({
      where: {
        status: 'ACTIVE',
        description: null,
      },
    });
  } catch (err) {
    console.error('Erro ao contar propriedades:', err.message);
    process.exit(1);
  }

  console.log(`\nTotal de imóveis ATIVOS com descrição nula: ${totalCount}`);

  if (totalCount === 0) {
    console.log('Nenhum imóvel para processar. Encerrando.');
    await prisma.$disconnect();
    return;
  }

  const BATCH_SIZE = 100;
  const UPDATE_BATCH = 50;
  let processed = 0;
  let updated = 0;
  let errors = 0;
  let sampleDescriptions = [];
  // Track IDs that failed so we can exclude them from future fetches (avoid infinite loop)
  const erroredIds = new Set();

  console.log(`\nProcessando em lotes de ${BATCH_SIZE}...\n`);

  while (true) {
    let properties;
    // Build where clause, excluding IDs that previously errored
    const whereClause = {
      status: 'ACTIVE',
      description: null,
      ...(erroredIds.size > 0 ? { id: { notIn: Array.from(erroredIds) } } : {}),
    };

    try {
      // Try with suites first
      properties = await prisma.property.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          type: true,
          purpose: true,
          bedrooms: true,
          bathrooms: true,
          totalArea: true,
          builtArea: true,
          price: true,
          priceRent: true,
          neighborhood: true,
          city: true,
          state: true,
          parkingSpaces: true,
          suites: true,
        },
        take: BATCH_SIZE,
        orderBy: { id: 'asc' },
      });
    } catch (err) {
      if (err.message && err.message.includes('suites')) {
        console.warn('Campo "suites" não encontrado, tentando sem ele...');
        properties = await prisma.property.findMany({
          where: whereClause,
          select: {
            id: true,
            title: true,
            type: true,
            purpose: true,
            bedrooms: true,
            bathrooms: true,
            totalArea: true,
            builtArea: true,
            price: true,
            priceRent: true,
            neighborhood: true,
            city: true,
            state: true,
            parkingSpaces: true,
          },
          take: BATCH_SIZE,
          orderBy: { id: 'asc' },
        });
      } else {
        console.error('Erro ao buscar propriedades:', err.message);
        errors++;
        break;
      }
    }

    if (!properties || properties.length === 0) break;

    // Process all properties in this batch
    for (let i = 0; i < properties.length; i++) {
      const p = properties[i];
      try {
        const description = generateDescription(p);

        await prisma.property.update({
          where: { id: p.id },
          data: { description },
        });

        updated++;
        processed++;

        // Collect sample descriptions (first 3)
        if (sampleDescriptions.length < 3) {
          sampleDescriptions.push({
            id: p.id,
            title: p.title,
            description,
          });
        }

        // Log progress every UPDATE_BATCH properties
        if (processed % UPDATE_BATCH === 0) {
          console.log(
            `  Progresso: ${processed}/${totalCount} processados (${updated} atualizados, ${errors} erros)`
          );
        }
      } catch (err) {
        console.error(`  Erro ao atualizar imóvel ${p.id}:`, err.message);
        errors++;
        processed++;
        erroredIds.add(p.id); // exclude from future fetches to avoid infinite loop
      }
    }
    // Loop continues: updated items drop out of query (description no longer null),
    // errored items are excluded via erroredIds. Loop exits when query returns 0 results.
  }

  console.log('\n========================================');
  console.log('RESULTADO FINAL:');
  console.log(`  Total encontrado:   ${totalCount}`);
  console.log(`  Total processado:   ${processed}`);
  console.log(`  Total atualizado:   ${updated}`);
  console.log(`  Erros:              ${errors}`);
  console.log('========================================\n');

  // Verify final count
  try {
    const remaining = await prisma.property.count({
      where: {
        status: 'ACTIVE',
        description: null,
      },
    });
    console.log(`Imóveis ATIVOS ainda com descrição nula: ${remaining}`);
  } catch (err) {
    console.warn('Não foi possível verificar contagem final:', err.message);
  }

  if (sampleDescriptions.length > 0) {
    console.log('\n========== AMOSTRAS DE DESCRIÇÕES GERADAS ==========\n');
    sampleDescriptions.forEach((s, idx) => {
      console.log(`[${idx + 1}] ID: ${s.id} | Título: ${s.title}`);
      console.log(`    Descrição: ${s.description}`);
      console.log();
    });
  }

  await prisma.$disconnect();
  console.log('Concluído.');
}

main().catch((err) => {
  console.error('Erro fatal:', err);
  prisma.$disconnect();
  process.exit(1);
});

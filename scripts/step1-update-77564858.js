const { PrismaClient } = require('/Users/tomaslemos/Downloads/squads/agoraencontrei/packages/database/node_modules/@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_KAver0xR2jiU@ep-holy-band-andfuwo5.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
    }
  }
});

async function main() {
  const companyId = 'cmnevj5it000075bq2de64f2u';
  const reference = '77564858';

  // First, find the property
  const existing = await prisma.property.findFirst({
    where: { companyId, reference },
    select: {
      id: true, reference: true, bedrooms: true, suites: true, bathrooms: true,
      parkingSpaces: true, totalArea: true, builtArea: true, price: true,
      priceRent: true, purpose: true, description: true
    }
  });

  if (!existing) {
    console.log('Property 77564858 NOT FOUND in DB');
    await prisma.$disconnect();
    return;
  }

  console.log('Found property:', existing.id);
  console.log('BEFORE:', JSON.stringify({
    bedrooms: existing.bedrooms,
    suites: existing.suites,
    bathrooms: existing.bathrooms,
    parkingSpaces: existing.parkingSpaces,
    totalArea: existing.totalArea,
    builtArea: existing.builtArea,
    price: existing.price?.toString(),
    priceRent: existing.priceRent?.toString(),
    purpose: existing.purpose
  }, null, 2));

  const description = "Excelente imóvel comercial/residencial de alto padrão disponível para venda e locação no Bairro São José em Franca/SP. Conta com 3 dormitórios, 3 suítes com closet, 5 banheiros, 6 vagas de garagem. Área total de 1.175m² e área construída de 643,23m². Pé direito de 6 metros na sala, cozinha planejada, área gourmet com churrasqueira, home office, área de lazer com campo de futebol, academia, jardim. Acabamento em mármore e porcelanato. IPTU: R$9.273,81/ano. Entre em contato com a Imobiliária Lemos. CRECI 61053-F.";

  const updated = await prisma.property.update({
    where: { id: existing.id },
    data: {
      bedrooms: 3,
      suites: 3,
      bathrooms: 5,
      parkingSpaces: 6,
      totalArea: 1175,
      builtArea: 643.23,
      price: 5500000,
      priceRent: 25000,
      purpose: 'BOTH',
      description
    },
    select: {
      id: true, reference: true, bedrooms: true, suites: true, bathrooms: true,
      parkingSpaces: true, totalArea: true, builtArea: true, price: true,
      priceRent: true, purpose: true
    }
  });

  console.log('AFTER:', JSON.stringify({
    bedrooms: updated.bedrooms,
    suites: updated.suites,
    bathrooms: updated.bathrooms,
    parkingSpaces: updated.parkingSpaces,
    totalArea: updated.totalArea,
    builtArea: updated.builtArea,
    price: updated.price?.toString(),
    priceRent: updated.priceRent?.toString(),
    purpose: updated.purpose
  }, null, 2));

  console.log('Step 1 DONE: Property 77564858 updated successfully.');
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });

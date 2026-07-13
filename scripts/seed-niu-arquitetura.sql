-- ============================================================================
-- Seed: NIU Arquitetura como primeira Empresa Parceira (Specialist) do
-- AgoraEncontrei.
--
-- Dados publicos extraidos do Instagram e dos materiais oficiais enviados:
--   @niu_arquitetura
--   Estudio de Arquitetura e Design.
--   +55 16 99264-6070 | +55 16 99460-8222
--   contato@niuarquitetura.com
--   Fundada em 2018 por Yuri Miranda e Douglas Costa.
--
-- Como rodar: cole no SQL editor do Neon e execute.
-- Idempotente: pode rodar novamente depois de ajustar campos.
-- ============================================================================

ALTER TABLE specialists ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE specialists ADD COLUMN IF NOT EXISTS "featuredUntil" TIMESTAMP;
ALTER TABLE specialists ADD COLUMN IF NOT EXISTS "featuredWeight" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE specialists ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
ALTER TABLE specialists ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE specialists ADD COLUMN IF NOT EXISTS "businessType" TEXT;
ALTER TABLE specialists ADD COLUMN IF NOT EXISTS "landingPage" JSONB;
ALTER TABLE specialists ADD COLUMN IF NOT EXISTS "adPlan" TEXT;

INSERT INTO specialists (
  id, slug, name, email, phone, whatsapp,
  category, bio, city, state, instagram, website, "photoUrl", "logoUrl", address,
  "businessType", "landingPage", "adPlan",
  status, tags, plan, "planStatus", "planActivatedAt",
  "isFeatured", "featuredUntil", "featuredWeight",
  "createdAt", "updatedAt"
) VALUES (
  'seed_niu_arquitetura',
  'niu-arquitetura',
  'NIU Arquitetura',
  'contato@niuarquitetura.com',
  '+55 16 99460-8222',
  '+55 16 99264-6070',
  'ARQUITETO',
  'Escritorio de Arquitetura e Design fundado em 2018 por Yuri Miranda e Douglas Costa. A NIU traduz arquitetura contemporanea com brasilidade, geometria e materialidade para criar espacos autenticos, funcionais e memoraveis.',
  'Franca',
  'SP',
  'niu_arquitetura',
  'https://www.agoraencontrei.com.br/parceiros/niu-arquitetura',
  '/partners/niu/niu-logo.jpg',
  '/partners/niu/niu-logo.jpg',
  'Av. Dr. Armando Sales de Oliveira, 503 - Franca/SP',
  'arquitetura',
  '{
    "segmentLabel": "Arquitetura e Design",
    "adPlan": "PREMIUM",
    "template": "vitrine",
    "logoUrl": "/partners/niu/niu-logo.jpg",
    "heroTitle": "Arquitetura contemporanea com brasilidade, geometria e materialidade",
    "heroSubtitle": "Projetos residenciais, interiores, reformas e arquitetura comercial para transformar espacos, processos e pensamentos.",
    "services": [
      { "name": "Projeto arquitetonico residencial", "description": "Briefing, conceito, estudos e desenvolvimento do projeto para obra nova ou reforma.", "price": null },
      { "name": "Interiores e ambientacao", "description": "Planejamento de ambientes, materiais, marcenaria, iluminacao e composicao visual.", "price": null },
      { "name": "Arquitetura comercial", "description": "Projetos para lojas, escritorios, marcas e experiencias que precisam comunicar identidade e impacto.", "price": null },
      { "name": "Reforma e valorizacao de imoveis", "description": "Solucoes para atualizar, adequar e valorizar casas, apartamentos, areas de lazer e imoveis comerciais.", "price": null },
      { "name": "Consultoria inicial online", "description": "Triagem do objetivo, medidas, fotos, prazo e orcamento para indicar o caminho de projeto.", "price": null }
    ],
    "photos": [
      "/partners/niu/niu-equipe.jpg",
      "/partners/niu/niu-escritorio.jpg",
      "/partners/niu/niu-cultura.jpg",
      "/partners/niu/niu-o-que-fazemos.jpg",
      "/partners/niu/niu-linguagem.jpg",
      "/partners/niu/niu-onde-estamos.jpg",
      "/partners/niu/niu-projeto-seven.jpg",
      "/partners/niu/niu-projeto-gama.jpg",
      "/partners/niu/niu-projeto-patio.jpg",
      "/partners/niu/niu-projeto-gaia.jpg",
      "/partners/niu/niu-projeto-alvorada.jpg"
    ],
    "gallery": [
      "/partners/niu/niu-equipe.jpg",
      "/partners/niu/niu-escritorio.jpg",
      "/partners/niu/niu-cultura.jpg",
      "/partners/niu/niu-o-que-fazemos.jpg",
      "/partners/niu/niu-linguagem.jpg",
      "/partners/niu/niu-onde-estamos.jpg",
      "/partners/niu/niu-projeto-seven.jpg",
      "/partners/niu/niu-projeto-gama.jpg",
      "/partners/niu/niu-projeto-patio.jpg",
      "/partners/niu/niu-projeto-gaia.jpg",
      "/partners/niu/niu-projeto-alvorada.jpg"
    ],
    "projects": [
      { "name": "Casa Seven", "status": "Novo projeto", "image": "/partners/niu/niu-projeto-seven.jpg" },
      { "name": "Casa Gama", "status": "Novo projeto", "image": "/partners/niu/niu-projeto-gama.jpg" },
      { "name": "Casa Patio", "status": "Estudo residencial de alto padrao em Franca/SP", "image": "/partners/niu/niu-projeto-patio.jpg" },
      { "name": "Casa Gaia", "status": "Novo projeto", "image": "/partners/niu/niu-projeto-gaia.jpg" },
      { "name": "Casa Alvorada", "status": "Obra em andamento em Franca/SP, ano 2025, 448,00m2", "image": "/partners/niu/niu-projeto-alvorada.jpg" }
    ],
    "videos": [],
    "faq": [
      { "question": "A NIU atende clientes fora de Franca/SP?", "answer": "O atendimento pode comecar online. Confirme escopo, cidade, prazos e formato diretamente com a equipe." },
      { "question": "Quais tipos de projeto a NIU desenvolve?", "answer": "Projetos residenciais, interiores, reformas, arquitetura comercial e estudos para transformar espacos, processos e pensamentos." },
      { "question": "Quais informacoes ajudam no primeiro contato?", "answer": "Cidade, tipo de imovel, objetivo do projeto, fotos, medidas aproximadas, prazo desejado, faixa de investimento e referencias." }
    ],
    "mission": "Transformar limites em criatividade.",
    "vision": "Ser excelencia em arquitetura desafiando o obvio por meio da desobediencia criativa.",
    "values": ["excelencia", "paixao", "criatividade", "pessoas"],
    "officialPage": "/parceiros/niu-arquitetura",
    "source": "Materiais oficiais anexados pelo parceiro e Instagram publico @niu_arquitetura"
  }'::jsonb,
  'PREMIUM',
  'ACTIVE',
  ARRAY[
    'Arquitetura residencial',
    'Arquitetura comercial',
    'Interiores',
    'Reformas',
    'Alto padrao',
    'Geometria e materialidade',
    'Desobediencia criativa',
    'Design contemporaneo',
    'Projeto online',
    'Franca SP',
    'Brasil'
  ],
  'VIP',
  'ACTIVE',
  NOW(),
  true,
  NOW() + INTERVAL '180 days',
  100,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  whatsapp = EXCLUDED.whatsapp,
  category = EXCLUDED.category,
  bio = EXCLUDED.bio,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  instagram = EXCLUDED.instagram,
  website = EXCLUDED.website,
  "photoUrl" = EXCLUDED."photoUrl",
  "logoUrl" = EXCLUDED."logoUrl",
  address = EXCLUDED.address,
  "businessType" = EXCLUDED."businessType",
  "landingPage" = EXCLUDED."landingPage",
  "adPlan" = EXCLUDED."adPlan",
  status = EXCLUDED.status,
  tags = EXCLUDED.tags,
  plan = EXCLUDED.plan,
  "planStatus" = EXCLUDED."planStatus",
  "isFeatured" = EXCLUDED."isFeatured",
  "featuredUntil" = EXCLUDED."featuredUntil",
  "featuredWeight" = EXCLUDED."featuredWeight",
  "updatedAt" = NOW();

-- Verificar:
-- SELECT slug, name, category, city, status, plan, "isFeatured", "featuredUntil"
-- FROM specialists
-- WHERE slug = 'niu-arquitetura';

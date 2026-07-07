-- ============================================================================
-- Seed: NIU Arquitetura como primeira Empresa Parceira (Specialist) do
-- AgoraEncontrei.
--
-- Dados publicos extraidos do Instagram em 2026-07-06:
--   @niu_arquitetura
--   Estudio de Arquitetura e Design.
--   +55 16 99264-6070 | +55 16 99463-0822
--   contato@niuarquitetura.com
--
-- Nao inclui fotos do Instagram. Use apenas imagem autorizada pela NIU em
-- photoUrl depois que eles enviarem o arquivo oficial.
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
  '+55 16 99463-0822',
  '+55 16 99264-6070',
  'ARQUITETO',
  'Estudio de Arquitetura e Design. Projetos residenciais, interiores, reformas e arquitetura contemporanea para construir, transformar e valorizar imoveis.',
  'Franca',
  'SP',
  'niu_arquitetura',
  NULL,
  NULL,
  NULL,
  NULL,
  'arquitetura',
  '{
    "segmentLabel": "Arquitetura e Design",
    "adPlan": "PREMIUM",
    "template": "vitrine",
    "heroTitle": "Projetos de arquitetura contemporanea para construir, reformar e valorizar imoveis",
    "heroSubtitle": "Atendimento para projetos residenciais, interiores, reformas e arquitetura sob medida em Franca/SP e para todo o Brasil.",
    "services": [
      { "name": "Projeto arquitetonico residencial", "description": "Briefing, conceito, estudos e desenvolvimento do projeto para obra nova ou reforma.", "price": null },
      { "name": "Interiores e ambientacao", "description": "Planejamento de ambientes, materiais, marcenaria, iluminacao e composicao visual.", "price": null },
      { "name": "Reforma e valorizacao de imoveis", "description": "Solucoes para atualizar, adequar e valorizar casas, apartamentos e areas de lazer.", "price": null },
      { "name": "Consultoria inicial online", "description": "Triagem do objetivo, medidas, fotos, prazo e orcamento para indicar o caminho de projeto.", "price": null }
    ],
    "gallery": [],
    "videos": [],
    "faq": [
      { "question": "A NIU atende clientes fora de Franca/SP?", "answer": "O atendimento pode comecar online. Confirme escopo, cidade, prazos e formato diretamente com a equipe." },
      { "question": "Quais informacoes ajudam no primeiro contato?", "answer": "Cidade, tipo de imovel, objetivo do projeto, fotos, medidas aproximadas, prazo desejado e faixa de investimento." }
    ],
    "source": "Instagram publico @niu_arquitetura, consultado em 2026-07-06"
  }'::jsonb,
  'PREMIUM',
  'ACTIVE',
  ARRAY[
    'Arquitetura residencial',
    'Interiores',
    'Reformas',
    'Alto padrao',
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

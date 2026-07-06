-- ============================================================================
-- Seed: NIU Arquitetura como primeira Empresa Parceira (Specialist) do
-- AgoraEncontrei — categoria ARQUITETO, em destaque (plano VIP).
--
-- ⚠️  REVISE ANTES DE RODAR:
--   - Só usa DADOS PÚBLICOS. NÃO inclui fotos do Instagram (direito autoral).
--     photoUrl fica NULL → o card mostra as iniciais até você subir uma imagem
--     autorizada pela NIU.
--   - Ajuste email, phone, whatsapp, city/state e bio com os dados REAIS/oficiais
--     da NIU antes de executar (os valores abaixo são placeholders seguros).
--
-- Como rodar: cole no SQL editor do Neon (mesmo banco de produção) e execute.
-- É idempotente (ON CONFLICT) — pode rodar de novo depois de ajustar os campos.
-- ============================================================================

INSERT INTO specialists (
  id, slug, name, email, phone, whatsapp,
  category, bio, city, state, instagram, website, "photoUrl",
  status, tags, plan, "planStatus", "planActivatedAt",
  "createdAt", "updatedAt"
) VALUES (
  'seed_niu_arquitetura',                       -- id fixo (idempotência)
  'niu-arquitetura',                            -- slug → /especialistas/niu-arquitetura
  'NIU Arquitetura',
  'contato@niuarquitetura.com.br',              -- ⚠️ ajuste para o e-mail real
  NULL,                                         -- ⚠️ telefone real (opcional)
  NULL,                                         -- ⚠️ whatsapp real (opcional)
  'ARQUITETO',
  'Escritório de arquitetura especializado em projetos residenciais e comerciais, interiores e reformas. Parceiro do AgoraEncontrei.',
  'Franca',                                     -- ⚠️ confirme a cidade real
  'SP',                                         -- ⚠️ confirme o estado real
  'niu_arquitetura',                            -- handle público do Instagram
  NULL,                                         -- site oficial (opcional)
  NULL,                                         -- photoUrl: placeholder (sem foto do IG)
  'ACTIVE',
  ARRAY['Projetos Residenciais','Interiores','Reformas','Comercial'],
  'VIP',                                        -- destaque na home e no topo do diretório
  'ACTIVE',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name        = EXCLUDED.name,
  category    = EXCLUDED.category,
  bio         = EXCLUDED.bio,
  city        = EXCLUDED.city,
  state       = EXCLUDED.state,
  instagram   = EXCLUDED.instagram,
  status      = EXCLUDED.status,
  tags        = EXCLUDED.tags,
  plan        = EXCLUDED.plan,
  "planStatus"= EXCLUDED."planStatus",
  "updatedAt" = NOW();

-- Verificar:
-- SELECT slug, name, category, city, status, plan FROM specialists WHERE slug = 'niu-arquitetura';

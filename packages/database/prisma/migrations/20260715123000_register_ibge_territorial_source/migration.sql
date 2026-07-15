INSERT INTO "intelligence_data_sources" (
  "id", "slug", "name", "kind", "accessMethod", "baseUrl", "termsUrl",
  "storageAllowed", "republicationAllowed", "attributionRequired", "reliabilityScore",
  "legalStatus", "legalReviewedAt", "isActive", "metadata", "createdAt", "updatedAt"
) VALUES (
  'source_ibge_faces_2022',
  'ibge-faces-logradouros-2022',
  'IBGE — Base de Faces de Logradouros 2022',
  'OFFICIAL',
  'OPEN_DATA',
  'https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais/28971-base-de-faces-de-logradouros-do-brasil.html',
  'https://www.ibge.gov.br/acesso-informacao/acoes-e-programas/termos-de-uso.html',
  true, true, true, 95, 'APPROVED', CURRENT_TIMESTAMP, true,
  '{"scope":"Nomes e tipos de logradouros públicos; município de Franca 3516200","referenceDate":"2022","attribution":"Fonte: IBGE, Base de Faces de Logradouros 2022"}',
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
) ON CONFLICT ("slug") DO UPDATE SET
  "metadata" = EXCLUDED."metadata",
  "updatedAt" = CURRENT_TIMESTAMP;

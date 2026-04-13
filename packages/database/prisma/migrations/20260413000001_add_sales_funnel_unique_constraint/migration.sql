-- ============================================================================
-- Sprint 3 #2 — SalesFunnel: UNIQUE parciais para dedup no nível de DB
-- ============================================================================
--
-- Problema: `lead-ingestion.service.ts` faz dedup por findFirst + create
-- (check-then-act). Entre o findFirst e o create existe uma janela de corrida
-- onde duas chamadas concorrentes com o mesmo phone/email podem ambas achar
-- que o funnel não existe e criar duplicatas.
--
-- Solução: índice UNIQUE parcial no banco como última linha de defesa.
--
-- Critérios de partial index:
--   (1) Só aplicamos UNIQUE para leads "vivos" (stage NOT IN ('converted','lost')).
--       Leads convertidos ou perdidos podem ser re-ingestados como novos
--       porque representam ciclo de vida diferente. (ex.: cliente que cancelou
--       e voltou 6 meses depois).
--   (2) Escopamos por tenantId quando presente — pré-conversão tenantId=NULL,
--       então o UNIQUE só age quando há um tenant SaaS identificado.
--       Pré-tenant (tenantId=NULL) o dedup é só aplicativo (findFirst),
--       mas aceitável porque não há cross-tenant leak possível.
--   (3) phone normalizado (já garantido por normalizePhone no service).
--   (4) email em lowercase (já garantido pelo service).
--
-- Comportamento esperado: o service já faz check-then-update por lead ativo
-- dentro de 30 dias. O UNIQUE fecha a corrida entre duas create concorrentes —
-- a segunda vai falhar com P2002 e o service pode tratar (retry com findFirst
-- ou retornar isDuplicate). No estado atual o .catch do service engole, que
-- é aceitável porque o resultado semântico ("já existe funnel") é correto.
--
-- Rollback: DROP INDEX IF EXISTS sales_funnels_phone_tenant_active_key;
--           DROP INDEX IF EXISTS sales_funnels_email_tenant_active_key;
-- ============================================================================

-- Limpeza defensiva antes de criar o UNIQUE: se já existem duplicatas no
-- banco atual (frutos da regressão histórica), mantemos apenas a mais recente
-- por (phone, tenantId) no conjunto "vivo". Duplicatas ficam com stage='lost'
-- para preservar histórico (em vez de DELETE destrutivo).
--
-- NOTA: o CTE abaixo só mexe em linhas onde stage NÃO É 'converted' nem 'lost',
-- então rollback é trivial (UPDATE inverso se necessário, mas raramente útil).

WITH dup_by_phone AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY phone, tenant_id
           ORDER BY created_at DESC
         ) AS rn
  FROM sales_funnels
  WHERE phone IS NOT NULL
    AND tenant_id IS NOT NULL
    AND stage NOT IN ('converted', 'lost')
)
UPDATE sales_funnels
SET stage = 'lost',
    metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{deduplicatedAt}',
      to_jsonb(now()::text)
    )
WHERE id IN (SELECT id FROM dup_by_phone WHERE rn > 1);

WITH dup_by_email AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY email, tenant_id
           ORDER BY created_at DESC
         ) AS rn
  FROM sales_funnels
  WHERE email IS NOT NULL
    AND tenant_id IS NOT NULL
    AND stage NOT IN ('converted', 'lost')
)
UPDATE sales_funnels
SET stage = 'lost',
    metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{deduplicatedAt}',
      to_jsonb(now()::text)
    )
WHERE id IN (SELECT id FROM dup_by_email WHERE rn > 1);

-- UNIQUE parcial por (phone, tenantId) para leads vivos
CREATE UNIQUE INDEX IF NOT EXISTS sales_funnels_phone_tenant_active_key
  ON sales_funnels (phone, tenant_id)
  WHERE phone IS NOT NULL
    AND tenant_id IS NOT NULL
    AND stage NOT IN ('converted', 'lost');

-- UNIQUE parcial por (email, tenantId) para leads vivos
CREATE UNIQUE INDEX IF NOT EXISTS sales_funnels_email_tenant_active_key
  ON sales_funnels (email, tenant_id)
  WHERE email IS NOT NULL
    AND tenant_id IS NOT NULL
    AND stage NOT IN ('converted', 'lost');

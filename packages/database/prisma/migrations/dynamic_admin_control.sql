-- =============================================================================
-- DYNAMIC ADMIN CONTROL — "The Master Toggle"
-- Run in Neon SQL Editor
-- =============================================================================

-- Plan Definitions
CREATE TABLE IF NOT EXISTS "plan_definitions" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "longDescription" TEXT,
    "priceMonthly" DECIMAL(10,2) NOT NULL,
    "priceYearly" DECIMAL(10,2),
    "maxProperties" INTEGER NOT NULL DEFAULT -1,
    "maxLeadViews" INTEGER NOT NULL DEFAULT -1,
    "maxUsers" INTEGER NOT NULL DEFAULT 1,
    "maxAIRequests" INTEGER NOT NULL DEFAULT 0,
    "themes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "modules" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "nicheFilter" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "billingType" TEXT NOT NULL DEFAULT 'recurring',
    "highlighted" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "plan_definitions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "plan_definitions_slug_key" ON "plan_definitions"("slug");
CREATE INDEX IF NOT EXISTS "plan_definitions_isActive_sortOrder_idx" ON "plan_definitions"("isActive", "sortOrder");

-- Niche Templates
CREATE TABLE IF NOT EXISTS "niche_templates" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "description" TEXT,
    "tomasPersona" TEXT NOT NULL,
    "tomasGreeting" TEXT,
    "tomasTone" TEXT NOT NULL DEFAULT 'consultivo',
    "itemLabel" TEXT NOT NULL DEFAULT 'Imóvel',
    "itemLabelPlural" TEXT NOT NULL DEFAULT 'Imóveis',
    "searchFields" JSONB NOT NULL DEFAULT '[]',
    "categoryFields" JSONB NOT NULL DEFAULT '[]',
    "seoKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "seoTitleTemplate" TEXT,
    "defaultTheme" TEXT NOT NULL DEFAULT 'urban_tech',
    "availableThemes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "niche_templates_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "niche_templates_slug_key" ON "niche_templates"("slug");
CREATE INDEX IF NOT EXISTS "niche_templates_isActive_sortOrder_idx" ON "niche_templates"("isActive", "sortOrder");

-- Module Definitions
CREATE TABLE IF NOT EXISTS "module_definitions" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceMonthly" DECIMAL(10,2),
    "priceOneTime" DECIMAL(10,2),
    "billingType" TEXT NOT NULL DEFAULT 'recurring',
    "category" TEXT NOT NULL DEFAULT 'feature',
    "requiredPlan" TEXT,
    "nicheFilter" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "module_definitions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "module_definitions_slug_key" ON "module_definitions"("slug");
CREATE INDEX IF NOT EXISTS "module_definitions_isActive_sortOrder_idx" ON "module_definitions"("isActive", "sortOrder");

-- Service Definitions
CREATE TABLE IF NOT EXISTS "service_definitions" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "longDescription" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "billingType" TEXT NOT NULL DEFAULT 'one_time',
    "category" TEXT NOT NULL DEFAULT 'service',
    "nicheFilter" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "service_definitions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "service_definitions_slug_key" ON "service_definitions"("slug");
CREATE INDEX IF NOT EXISTS "service_definitions_isActive_sortOrder_idx" ON "service_definitions"("isActive", "sortOrder");

-- Tenant Module Activations
CREATE TABLE IF NOT EXISTS "tenant_module_activations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "asaasChargeId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tenant_module_activations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "tenant_module_activations_tenantId_moduleId_key" ON "tenant_module_activations"("tenantId", "moduleId");
CREATE INDEX IF NOT EXISTS "tenant_module_activations_tenantId_status_idx" ON "tenant_module_activations"("tenantId", "status");

-- Tenant Service Orders
CREATE TABLE IF NOT EXISTS "tenant_service_orders" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paidAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "asaasChargeId" TEXT,
    "notes" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tenant_service_orders_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "tenant_service_orders_tenantId_status_idx" ON "tenant_service_orders"("tenantId", "status");

-- Global System Settings (singleton)
CREATE TABLE IF NOT EXISTS "global_system_settings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "seoDefaults" JSONB NOT NULL DEFAULT '{}',
    "landingContent" JSONB NOT NULL DEFAULT '{}',
    "billingConfig" JSONB NOT NULL DEFAULT '{}',
    "featureFlags" JSONB NOT NULL DEFAULT '{}',
    "brandConfig" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    CONSTRAINT "global_system_settings_pkey" PRIMARY KEY ("id")
);

-- System Config (key-value)
CREATE TABLE IF NOT EXISTS "system_configs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL DEFAULT 'platform',
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "system_configs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "system_configs_companyId_key_key" ON "system_configs"("companyId", "key");

-- Foreign Keys
ALTER TABLE "tenant_module_activations" ADD CONSTRAINT "tenant_module_activations_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "module_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tenant_service_orders" ADD CONSTRAINT "tenant_service_orders_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- =============================================================================
-- SEED DATA — Initial plans, niches, modules
-- =============================================================================

-- Plans
INSERT INTO "plan_definitions" ("id","slug","name","description","priceMonthly","priceYearly","maxProperties","maxLeadViews","maxUsers","maxAIRequests","themes","modules","features","highlighted","sortOrder","updatedAt")
VALUES
  ('plan_lite','lite','Lite','Plano ideal para corretores autônomos iniciando no digital.',97.00,970.00,5,10,1,0,ARRAY['urban_tech','classic_trust'],ARRAY['site_basico','crm'],ARRAY['Até 5 imóveis','10 leads/mês','CRM básico','1 layout'],false,1,CURRENT_TIMESTAMP),
  ('plan_pro','pro','Pro','Para imobiliárias que querem escalar com IA e automação.',297.00,2970.00,30,50,5,100,ARRAY['urban_tech','classic_trust','luxury_gold','fast_sales_pro'],ARRAY['site_basico','crm','ia_tomas','automacao_whatsapp','blog_seo','relatorios'],ARRAY['Até 30 imóveis','50 leads/mês','IA Tomás completa','WhatsApp automático','Blog SEO','5 usuários'],true,2,CURRENT_TIMESTAMP),
  ('plan_enterprise','enterprise','Enterprise','Controle total, API dedicada, white-label e suporte VIP.',597.00,5970.00,-1,-1,-1,-1,ARRAY['all'],ARRAY['site_basico','crm','ia_tomas','ia_tomas_voz','automacao_whatsapp','blog_seo','relatorios','api_externa','white_label','multi_usuarios'],ARRAY['Imóveis ilimitados','Leads ilimitados','Todas as IAs','API dedicada','White-label','Usuários ilimitados','Suporte VIP'],false,3,CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

-- Niches
INSERT INTO "niche_templates" ("id","slug","name","icon","description","tomasPersona","tomasGreeting","tomasTone","itemLabel","itemLabelPlural","searchFields","categoryFields","seoKeywords","seoTitleTemplate","defaultTheme","availableThemes","sortOrder","updatedAt")
VALUES
  ('niche_imobiliaria','imobiliaria','Imobiliária','building-2','Corretores e imobiliárias de imóveis residenciais e comerciais.','Você é Tomás, um corretor de imóveis experiente e consultivo. Você conhece profundamente o mercado imobiliário de Franca-SP e região. Ajude o cliente a encontrar o imóvel ideal, qualifique o lead, e registre as informações no CRM.','Olá! Sou o Tomás, seu consultor imobiliário. Como posso ajudar você a encontrar o imóvel ideal?','consultivo','Imóvel','Imóveis','[{"key":"quartos","label":"Quartos","type":"number"},{"key":"vagas","label":"Vagas","type":"number"},{"key":"area","label":"Área (m²)","type":"range"},{"key":"bairro","label":"Bairro","type":"text"}]','["Residencial","Comercial","Rural","Industrial"]',ARRAY['imóveis','casas','apartamentos','terrenos','corretor'],'{partner} - Imóveis em {cidade} | Casas, Apartamentos e Terrenos','urban_tech',ARRAY['urban_tech','classic_trust','luxury_gold','fast_sales_pro','landscape_living'],1,CURRENT_TIMESTAMP),
  ('niche_estetica','estetica','Estética e Beleza','sparkles','Clínicas de estética, salões e profissionais de beleza.','Você é Tomás, um recepcionista especializado em estética e beleza. Ajude os clientes a agendar procedimentos, tire dúvidas sobre tratamentos e qualifique leads interessados em serviços estéticos.','Olá! Sou o Tomás, assistente da clínica. Posso ajudar com agendamento ou tirar dúvidas sobre nossos tratamentos?','acolhedor','Serviço','Serviços','[{"key":"tipo","label":"Tipo de tratamento","type":"select"},{"key":"regiao","label":"Região do corpo","type":"text"}]','["Facial","Corporal","Capilar","Unhas","Depilação"]',ARRAY['estética','beleza','tratamento','clínica'],'{partner} - Estética e Beleza em {cidade}','urban_tech',ARRAY['urban_tech','classic_trust'],2,CURRENT_TIMESTAMP),
  ('niche_advocacia','advocacia','Advocacia','scale','Escritórios de advocacia e profissionais jurídicos.','Você é Tomás, um assistente jurídico profissional. Faça triagem inicial de casos, agende consultas e qualifique potenciais clientes. Nunca dê parecer jurídico — encaminhe para o advogado responsável.','Olá! Sou o Tomás, assistente do escritório. Posso ajudar com agendamento de consulta ou triagem inicial do seu caso.','formal','Caso','Casos','[{"key":"area","label":"Área do direito","type":"select"},{"key":"urgencia","label":"Urgência","type":"select"}]','["Civil","Trabalhista","Criminal","Tributário","Família","Empresarial"]',ARRAY['advogado','advocacia','jurídico','direito'],'{partner} - Advocacia em {cidade} | Consultoria Jurídica','classic_trust',ARRAY['classic_trust','urban_tech'],3,CURRENT_TIMESTAMP),
  ('niche_moveis','moveis','Loja de Móveis','sofa','Lojas de móveis, decoração e design de interiores.','Você é Tomás, um consultor de decoração e móveis. Ajude os clientes a encontrar peças ideais para seus ambientes, sugira combinações e encaminhe para compra ou orçamento.','Olá! Sou o Tomás, seu consultor de decoração. Procurando algo especial para sua casa?','acolhedor','Produto','Produtos','[{"key":"ambiente","label":"Ambiente","type":"select"},{"key":"estilo","label":"Estilo","type":"select"},{"key":"material","label":"Material","type":"text"}]','["Sala","Quarto","Cozinha","Escritório","Área externa"]',ARRAY['móveis','decoração','sofá','mesa'],'{partner} - Móveis e Decoração em {cidade}','urban_tech',ARRAY['urban_tech','fast_sales_pro'],4,CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

-- Modules
INSERT INTO "module_definitions" ("id","slug","name","description","priceMonthly","billingType","category","icon","sortOrder","updatedAt")
VALUES
  ('mod_site','site_basico','Site Básico','Site profissional com layout responsivo e SEO.',NULL,'included','feature','globe',1,CURRENT_TIMESTAMP),
  ('mod_crm','crm','CRM de Leads','Gerenciamento completo de leads e pipeline de vendas.',NULL,'included','feature','users',2,CURRENT_TIMESTAMP),
  ('mod_tomas','ia_tomas','IA Tomás (Texto)','Agente de IA para atendimento, qualificação e conversão.',NULL,'included','ai','bot',3,CURRENT_TIMESTAMP),
  ('mod_tomas_voz','ia_tomas_voz','IA Tomás (Voz)','Atendimento por voz com IA para leads telefônicos.',79.00,'recurring','ai','phone',4,CURRENT_TIMESTAMP),
  ('mod_whatsapp','automacao_whatsapp','Automação WhatsApp','Mensagens automáticas e follow-up via WhatsApp.',49.00,'recurring','integration','message-circle',5,CURRENT_TIMESTAMP),
  ('mod_blog','blog_seo','Blog SEO','Blog integrado com geração automática de conteúdo SEO.',39.00,'recurring','feature','file-text',6,CURRENT_TIMESTAMP),
  ('mod_relatorios','relatorios','Relatórios Avançados','Dashboards, métricas e relatórios de performance.',29.00,'recurring','feature','bar-chart-3',7,CURRENT_TIMESTAMP),
  ('mod_api','api_externa','API Externa','Acesso à API REST para integrações customizadas.',99.00,'recurring','integration','code',8,CURRENT_TIMESTAMP),
  ('mod_whitelabel','white_label','White Label','Remove marca AgoraEncontrei do site do parceiro.',149.00,'recurring','design','eye-off',9,CURRENT_TIMESTAMP),
  ('mod_multiuser','multi_usuarios','Multi-Usuários','Equipe com múltiplos acessos e permissões.',49.00,'recurring','feature','users-round',10,CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

-- Services
INSERT INTO "service_definitions" ("id","slug","name","description","price","billingType","category","icon","sortOrder","updatedAt")
VALUES
  ('svc_implantacao','implantacao_vip','Implantação VIP','Setup completo: configuração, branding, importação de dados e treinamento.',997.00,'one_time','premium','rocket',1,CURRENT_TIMESTAMP),
  ('svc_mentoria','mentoria_estrategica','Mentoria Estratégica','3 sessões de mentoria comercial com especialista em marketing digital.',497.00,'one_time','consulting','graduation-cap',2,CURRENT_TIMESTAMP),
  ('svc_trafego','setup_trafego','Setup de Tráfego Pago','Configuração de campanhas Google Ads e Meta Ads otimizadas.',797.00,'one_time','service','target',3,CURRENT_TIMESTAMP),
  ('svc_conteudo','producao_conteudo','Produção de Conteúdo','Pack de 10 posts + 4 artigos SEO otimizados para o nicho.',397.00,'one_time','service','pen-tool',4,CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

-- Global System Settings (singleton)
INSERT INTO "global_system_settings" ("id","seoDefaults","landingContent","billingConfig","featureFlags","brandConfig","updatedAt")
VALUES (
  'global',
  '{"titleTemplate":"{partner} - {niche} em {cidade}","descriptionTemplate":"Encontre os melhores {items} em {cidade}. {partner} oferece atendimento personalizado com IA.","defaultKeywords":["agoraencontrei","plataforma","leads","conversão"]}',
  '{"headline":"Transforme seu negócio em uma máquina de vendas digital","subtitle":"Site profissional + IA de atendimento + CRM — tudo em uma plataforma","ctaText":"Comece Agora","ctaUrl":"/parceiros/cadastro"}',
  '{"asaasMode":"sandbox","defaultTrialDays":14,"defaultSplitPercent":2.00}',
  '{"hunterMode":true,"voiceAI":false,"blogSEO":true,"universalNiche":true,"seoPages":true}',
  '{"platformName":"AgoraEncontrei","primaryColor":"#3b82f6","logoUrl":null}',
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;

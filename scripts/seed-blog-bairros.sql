-- ============================================================
-- Seed: Artigos de Blog sobre Bairros de Franca/SP
-- Execute no banco de dados de produção:
--   psql $DATABASE_URL -f seed-blog-bairros.sql
-- ============================================================

-- Buscar o companyId da Imobiliária Lemos
DO $$
DECLARE
  v_company_id TEXT;
  v_author_id TEXT;
BEGIN
  SELECT id INTO v_company_id FROM "Company" LIMIT 1;
  SELECT id INTO v_author_id FROM "User" WHERE role IN ('ADMIN','OWNER') LIMIT 1;

  -- 1. Jardim Europa
  INSERT INTO "BlogPost" (id, "companyId", title, slug, excerpt, content, "seoTitle", "seoDescription", tags, category, "authorName", published, "publishedAt", featured, views, "createdAt", "updatedAt")
  VALUES (
    gen_random_uuid(), v_company_id,
    'Jardim Europa Franca SP: Imóveis, Infraestrutura e Qualidade de Vida',
    'jardim-europa-franca-sp-imoveis',
    'Conheça o Jardim Europa, um dos bairros mais valorizados de Franca/SP. Veja imóveis disponíveis, infraestrutura, escolas, comércio e por que é uma excelente escolha para morar.',
    E'# Jardim Europa — Franca/SP\n\nO **Jardim Europa** é um dos bairros mais tradicionais e valorizados de Franca/SP. Localizado na zona sul da cidade, o bairro se destaca pela infraestrutura completa, ruas arborizadas e excelente qualidade de vida.\n\n## Por que morar no Jardim Europa?\n\nO Jardim Europa oferece tudo o que uma família precisa para viver com conforto e segurança em Franca/SP:\n\n- **Localização privilegiada**: próximo ao centro comercial de Franca\n- **Infraestrutura completa**: supermercados, farmácias, escolas e clínicas\n- **Segurança**: bairro tranquilo com baixo índice de criminalidade\n- **Valorização imobiliária**: um dos bairros com maior valorização em Franca\n\n## Imóveis no Jardim Europa\n\nA Imobiliária Lemos possui uma ampla seleção de imóveis no Jardim Europa:\n\n- **Casas à venda**: a partir de R$ 350.000\n- **Apartamentos**: a partir de R$ 220.000\n- **Terrenos**: a partir de R$ 80.000\n- **Imóveis para alugar**: a partir de R$ 1.200/mês\n\n## Infraestrutura do Bairro\n\nO Jardim Europa conta com excelente infraestrutura urbana, incluindo escolas públicas e particulares, unidades de saúde, supermercados, padarias, farmácias e fácil acesso às principais vias de Franca.\n\n## Como Chegar ao Jardim Europa\n\nO bairro tem fácil acesso pela Avenida Major Nicácio e pela Rua Pio XII. Há linhas de ônibus que conectam o Jardim Europa ao centro de Franca e a outros bairros.\n\n## Fale com a Imobiliária Lemos\n\nInteressado em imóveis no Jardim Europa? Entre em contato com a **Imobiliária Lemos** — mais de 22 anos de experiência em Franca/SP.\n\n📞 (16) 3722-0000 | 🌐 [agoraencontrei.com.br](https://www.agoraencontrei.com.br)',
    'Imóveis no Jardim Europa Franca SP | Casas e Apartamentos | Imobiliária Lemos',
    'Encontre casas, apartamentos e terrenos no Jardim Europa em Franca/SP. Imobiliária Lemos — CRECI 279051. Mais de 22 anos de tradição. Ligue (16) 3722-0000.',
    ARRAY['jardim europa','franca sp','imóveis franca','bairros franca','casas franca'],
    'Bairros de Franca',
    'Imobiliária Lemos',
    true, NOW(), true, 0, NOW(), NOW()
  ) ON CONFLICT (slug, "companyId") DO NOTHING;

  -- 2. Jardim Califórnia
  INSERT INTO "BlogPost" (id, "companyId", title, slug, excerpt, content, "seoTitle", "seoDescription", tags, category, "authorName", published, "publishedAt", featured, views, "createdAt", "updatedAt")
  VALUES (
    gen_random_uuid(), v_company_id,
    'Jardim Califórnia Franca SP: Bairro Nobre com Ótima Localização',
    'jardim-california-franca-sp-imoveis',
    'O Jardim Califórnia é um dos bairros mais nobres de Franca/SP. Descubra imóveis disponíveis, a infraestrutura do bairro e por que é uma das melhores escolhas para quem busca qualidade de vida.',
    E'# Jardim Califórnia — Franca/SP\n\nO **Jardim Califórnia** é reconhecido como um dos bairros mais nobres e valorizados de Franca/SP. Com ruas amplas, casas de alto padrão e excelente infraestrutura, o bairro atrai famílias que buscam qualidade de vida e segurança.\n\n## Características do Jardim Califórnia\n\n- **Alto padrão**: casas e sobrados de luxo com amplos terrenos\n- **Segurança**: bairro tranquilo e bem iluminado\n- **Comércio local**: supermercados, restaurantes e serviços\n- **Escolas de qualidade**: próximo às melhores instituições de ensino de Franca\n\n## Imóveis no Jardim Califórnia\n\nA Imobiliária Lemos tem os melhores imóveis no Jardim Califórnia:\n\n- **Casas de alto padrão**: a partir de R$ 600.000\n- **Sobrados**: a partir de R$ 450.000\n- **Terrenos**: a partir de R$ 120.000\n- **Locação**: a partir de R$ 2.000/mês\n\n## Por que Investir no Jardim Califórnia?\n\nO Jardim Califórnia apresenta uma das maiores valorizações imobiliárias de Franca/SP. Investir em um imóvel neste bairro é garantia de patrimônio sólido e qualidade de vida incomparável.\n\n## Contato\n\n**Imobiliária Lemos** — CRECI 279051\n📞 (16) 3722-0000 | WhatsApp: (16) 98101-0005',
    'Imóveis no Jardim Califórnia Franca SP | Casas de Alto Padrão | Imobiliária Lemos',
    'Casas e imóveis de alto padrão no Jardim Califórnia em Franca/SP. Imobiliária Lemos — CRECI 279051. Ligue (16) 3722-0000.',
    ARRAY['jardim califórnia','franca sp','casas alto padrão franca','bairros nobres franca'],
    'Bairros de Franca',
    'Imobiliária Lemos',
    true, NOW(), true, 0, NOW(), NOW()
  ) ON CONFLICT (slug, "companyId") DO NOTHING;

  -- 3. Polo Club
  INSERT INTO "BlogPost" (id, "companyId", title, slug, excerpt, content, "seoTitle", "seoDescription", tags, category, "authorName", published, "publishedAt", featured, views, "createdAt", "updatedAt")
  VALUES (
    gen_random_uuid(), v_company_id,
    'Polo Club Franca SP: Condomínio Fechado de Alto Padrão',
    'polo-club-franca-sp-imoveis-condominio',
    'O Polo Club é o condomínio fechado mais exclusivo de Franca/SP. Veja casas e terrenos disponíveis, infraestrutura de lazer e segurança 24h.',
    E'# Polo Club — Franca/SP\n\nO **Polo Club** é o condomínio fechado mais exclusivo e cobiçado de Franca/SP. Com segurança 24 horas, amplas áreas de lazer e casas de altíssimo padrão, o empreendimento representa o ápice do mercado imobiliário francano.\n\n## O que é o Polo Club?\n\nO Polo Club é um condomínio residencial fechado de alto padrão localizado em Franca/SP. O empreendimento conta com:\n\n- **Segurança 24h**: portaria controlada, câmeras e ronda\n- **Área de lazer completa**: piscinas, quadras esportivas, salão de festas\n- **Ruas internas pavimentadas** e bem iluminadas\n- **Casas e terrenos** de grandes dimensões\n\n## Imóveis no Polo Club\n\nA Imobiliária Lemos é especialista em imóveis no Polo Club:\n\n- **Casas de luxo**: a partir de R$ 800.000\n- **Terrenos**: a partir de R$ 200.000\n- **Locação de alto padrão**: a partir de R$ 4.000/mês\n\n## Investimento Seguro\n\nImóveis no Polo Club são considerados investimentos seguros e de alta valorização em Franca/SP. A demanda sempre supera a oferta neste condomínio exclusivo.\n\n## Fale com a Imobiliária Lemos\n\n📞 (16) 3722-0000 | WhatsApp: (16) 98101-0005\n🌐 [agoraencontrei.com.br](https://www.agoraencontrei.com.br)',
    'Imóveis no Polo Club Franca SP | Condomínio Fechado Alto Padrão | Imobiliária Lemos',
    'Casas e terrenos no Polo Club em Franca/SP. Condomínio fechado de alto padrão. Imobiliária Lemos — CRECI 279051. Ligue (16) 3722-0000.',
    ARRAY['polo club franca','condomínio fechado franca','imóveis alto padrão franca sp'],
    'Condomínios de Franca',
    'Imobiliária Lemos',
    true, NOW(), true, 0, NOW(), NOW()
  ) ON CONFLICT (slug, "companyId") DO NOTHING;

  -- 4. Centro de Franca
  INSERT INTO "BlogPost" (id, "companyId", title, slug, excerpt, content, "seoTitle", "seoDescription", tags, category, "authorName", published, "publishedAt", featured, views, "createdAt", "updatedAt")
  VALUES (
    gen_random_uuid(), v_company_id,
    'Centro de Franca SP: Imóveis Comerciais e Residenciais no Coração da Cidade',
    'centro-franca-sp-imoveis-comerciais-residenciais',
    'O Centro de Franca/SP concentra os melhores imóveis comerciais e salas para alugar. Veja opções de lojas, escritórios, apartamentos e salas comerciais no centro da cidade.',
    E'# Centro de Franca/SP — Imóveis Comerciais e Residenciais\n\nO **Centro de Franca/SP** é o coração comercial e histórico da cidade. Com alta circulação de pessoas, infraestrutura completa e fácil acesso, o centro é o local ideal para negócios e moradia.\n\n## Imóveis Comerciais no Centro\n\nA Imobiliária Lemos oferece diversas opções de imóveis comerciais no centro de Franca:\n\n- **Lojas para alugar**: a partir de R$ 1.500/mês\n- **Salas comerciais**: a partir de R$ 800/mês\n- **Escritórios**: a partir de R$ 1.200/mês\n- **Galpões e depósitos**: consulte disponibilidade\n\n## Imóveis Residenciais no Centro\n\n- **Apartamentos à venda**: a partir de R$ 180.000\n- **Apartamentos para alugar**: a partir de R$ 900/mês\n- **Kitnets e studios**: a partir de R$ 600/mês\n\n## Vantagens de Morar ou Trabalhar no Centro\n\n- Acesso a todos os serviços públicos (Prefeitura, Fórum, Receita Federal)\n- Proximidade com bancos, cartórios e serviços\n- Fácil acesso por transporte público\n- Alta valorização para imóveis comerciais\n\n## Contato\n\n**Imobiliária Lemos** — CRECI 279051\n📞 (16) 3722-0000',
    'Imóveis no Centro de Franca SP | Lojas e Apartamentos | Imobiliária Lemos',
    'Lojas, salas comerciais e apartamentos no centro de Franca/SP. Imobiliária Lemos — CRECI 279051. Ligue (16) 3722-0000.',
    ARRAY['centro franca sp','imóveis comerciais franca','lojas para alugar franca','salas comerciais franca'],
    'Bairros de Franca',
    'Imobiliária Lemos',
    true, NOW(), false, 0, NOW(), NOW()
  ) ON CONFLICT (slug, "companyId") DO NOTHING;

  -- 5. Jardim América
  INSERT INTO "BlogPost" (id, "companyId", title, slug, excerpt, content, "seoTitle", "seoDescription", tags, category, "authorName", published, "publishedAt", featured, views, "createdAt", "updatedAt")
  VALUES (
    gen_random_uuid(), v_company_id,
    'Jardim América Franca SP: Bairro Familiar com Ótima Infraestrutura',
    'jardim-america-franca-sp-imoveis',
    'O Jardim América é um dos bairros mais tradicionais e familiares de Franca/SP. Conheça as opções de casas e apartamentos disponíveis e a infraestrutura completa do bairro.',
    E'# Jardim América — Franca/SP\n\nO **Jardim América** é um bairro tradicional e muito procurado em Franca/SP. Com infraestrutura completa, escolas de qualidade e comércio local diversificado, é uma excelente opção para famílias.\n\n## Por que Escolher o Jardim América?\n\n- **Localização central**: fácil acesso ao centro de Franca\n- **Escolas**: próximo a escolas públicas e particulares de qualidade\n- **Comércio**: supermercados, padarias, farmácias e serviços\n- **Transporte**: linhas de ônibus para toda a cidade\n\n## Imóveis Disponíveis\n\n- **Casas à venda**: a partir de R$ 280.000\n- **Casas para alugar**: a partir de R$ 1.100/mês\n- **Terrenos**: a partir de R$ 70.000\n\n## Contato\n\n**Imobiliária Lemos** — CRECI 279051\n📞 (16) 3722-0000 | 🌐 agoraencontrei.com.br',
    'Imóveis no Jardim América Franca SP | Casas e Terrenos | Imobiliária Lemos',
    'Casas e terrenos no Jardim América em Franca/SP. Imobiliária Lemos — CRECI 279051. Ligue (16) 3722-0000.',
    ARRAY['jardim américa franca','casas franca sp','bairros franca sp'],
    'Bairros de Franca',
    'Imobiliária Lemos',
    true, NOW(), false, 0, NOW(), NOW()
  ) ON CONFLICT (slug, "companyId") DO NOTHING;

  -- 6. Villaggio di Firenze
  INSERT INTO "BlogPost" (id, "companyId", title, slug, excerpt, content, "seoTitle", "seoDescription", tags, category, "authorName", published, "publishedAt", featured, views, "createdAt", "updatedAt")
  VALUES (
    gen_random_uuid(), v_company_id,
    'Villaggio di Firenze Franca SP: Condomínio Fechado com Segurança Total',
    'villaggio-di-firenze-franca-sp-condominio',
    'O Villaggio di Firenze é um dos condomínios fechados mais procurados de Franca/SP. Veja casas e terrenos disponíveis neste empreendimento de alto padrão.',
    E'# Villaggio di Firenze — Franca/SP\n\nO **Villaggio di Firenze** é um dos condomínios fechados mais desejados de Franca/SP. Com arquitetura italiana inspirada, segurança 24 horas e infraestrutura de lazer completa, o empreendimento oferece um estilo de vida exclusivo.\n\n## Diferenciais do Villaggio di Firenze\n\n- **Segurança 24h**: portaria blindada e câmeras em toda a área\n- **Arquitetura diferenciada**: inspirada na Toscana italiana\n- **Área de lazer**: piscina, quadras, academia e salão de festas\n- **Sustentabilidade**: áreas verdes preservadas\n\n## Imóveis Disponíveis\n\n- **Casas à venda**: a partir de R$ 750.000\n- **Terrenos**: a partir de R$ 180.000\n- **Locação**: consulte disponibilidade\n\n## Localização\n\nO Villaggio di Firenze está localizado em uma das regiões mais valorizadas de Franca/SP, com fácil acesso às principais vias da cidade.\n\n## Contato\n\n**Imobiliária Lemos** — CRECI 279051\n📞 (16) 3722-0000 | WhatsApp: (16) 98101-0005',
    'Imóveis no Villaggio di Firenze Franca SP | Condomínio Fechado | Imobiliária Lemos',
    'Casas e terrenos no Villaggio di Firenze em Franca/SP. Condomínio fechado de alto padrão. Imobiliária Lemos — CRECI 279051.',
    ARRAY['villaggio di firenze franca','condomínio fechado franca sp','casas condomínio franca'],
    'Condomínios de Franca',
    'Imobiliária Lemos',
    true, NOW(), false, 0, NOW(), NOW()
  ) ON CONFLICT (slug, "companyId") DO NOTHING;

  -- 7. Jardim Redentor
  INSERT INTO "BlogPost" (id, "companyId", title, slug, excerpt, content, "seoTitle", "seoDescription", tags, category, "authorName", published, "publishedAt", featured, views, "createdAt", "updatedAt")
  VALUES (
    gen_random_uuid(), v_company_id,
    'Jardim Redentor Franca SP: Bairro em Crescimento com Ótimo Custo-Benefício',
    'jardim-redentor-franca-sp-imoveis',
    'O Jardim Redentor é um bairro em crescimento em Franca/SP com excelente custo-benefício. Veja casas e apartamentos disponíveis para compra e aluguel.',
    E'# Jardim Redentor — Franca/SP\n\nO **Jardim Redentor** é um bairro em constante crescimento em Franca/SP, oferecendo excelente custo-benefício para quem deseja comprar ou alugar um imóvel na cidade.\n\n## Características do Bairro\n\n- **Crescimento acelerado**: novos empreendimentos e infraestrutura\n- **Custo-benefício**: imóveis com preços acessíveis\n- **Infraestrutura**: escolas, comércio e transporte\n- **Localização**: próximo a importantes vias de acesso\n\n## Imóveis Disponíveis\n\n- **Casas à venda**: a partir de R$ 220.000\n- **Casas para alugar**: a partir de R$ 900/mês\n- **Apartamentos**: a partir de R$ 160.000\n\n## Contato\n\n**Imobiliária Lemos** — CRECI 279051\n📞 (16) 3722-0000',
    'Imóveis no Jardim Redentor Franca SP | Casas e Apartamentos | Imobiliária Lemos',
    'Casas e apartamentos no Jardim Redentor em Franca/SP. Imobiliária Lemos — CRECI 279051. Ligue (16) 3722-0000.',
    ARRAY['jardim redentor franca','casas franca sp','imóveis franca sp'],
    'Bairros de Franca',
    'Imobiliária Lemos',
    true, NOW(), false, 0, NOW(), NOW()
  ) ON CONFLICT (slug, "companyId") DO NOTHING;

  -- 8. Jardim Universitário
  INSERT INTO "BlogPost" (id, "companyId", title, slug, excerpt, content, "seoTitle", "seoDescription", tags, category, "authorName", published, "publishedAt", featured, views, "createdAt", "updatedAt")
  VALUES (
    gen_random_uuid(), v_company_id,
    'Jardim Universitário Franca SP: Ideal para Estudantes e Jovens Profissionais',
    'jardim-universitario-franca-sp-imoveis',
    'O Jardim Universitário em Franca/SP é o bairro ideal para estudantes e jovens profissionais. Próximo à UNIFRAN e outras faculdades, com apartamentos e kitnets para alugar.',
    E'# Jardim Universitário — Franca/SP\n\nO **Jardim Universitário** é o bairro mais procurado por estudantes e jovens profissionais em Franca/SP. Localizado próximo às principais universidades da cidade, o bairro oferece excelente infraestrutura e fácil acesso.\n\n## Por que Morar no Jardim Universitário?\n\n- **Proximidade com universidades**: UNIFRAN, FACEF e outras faculdades\n- **Transporte público**: linhas de ônibus para toda a cidade\n- **Comércio local**: restaurantes, lanchonetes, farmácias e serviços\n- **Segurança**: bairro bem iluminado e movimentado\n\n## Imóveis para Estudantes\n\n- **Kitnets para alugar**: a partir de R$ 550/mês\n- **Apartamentos para alugar**: a partir de R$ 800/mês\n- **Quartos em repúblicas**: consulte disponibilidade\n- **Apartamentos à venda**: a partir de R$ 150.000\n\n## Para Investidores\n\nO Jardim Universitário é excelente para investimento em imóveis para locação. A alta demanda de estudantes garante ocupação constante e boa rentabilidade.\n\n## Contato\n\n**Imobiliária Lemos** — CRECI 279051\n📞 (16) 3722-0000 | 🌐 agoraencontrei.com.br',
    'Imóveis no Jardim Universitário Franca SP | Kitnets e Apartamentos | Imobiliária Lemos',
    'Kitnets e apartamentos para alugar no Jardim Universitário em Franca/SP. Próximo à UNIFRAN. Imobiliária Lemos — CRECI 279051.',
    ARRAY['jardim universitário franca','kitnets franca sp','apartamentos estudantes franca','unifran franca'],
    'Bairros de Franca',
    'Imobiliária Lemos',
    true, NOW(), false, 0, NOW(), NOW()
  ) ON CONFLICT (slug, "companyId") DO NOTHING;

  -- 9. Jardim Paulista
  INSERT INTO "BlogPost" (id, "companyId", title, slug, excerpt, content, "seoTitle", "seoDescription", tags, category, "authorName", published, "publishedAt", featured, views, "createdAt", "updatedAt")
  VALUES (
    gen_random_uuid(), v_company_id,
    'Jardim Paulista Franca SP: Bairro Residencial Tranquilo e Valorizado',
    'jardim-paulista-franca-sp-imoveis',
    'O Jardim Paulista é um bairro residencial tranquilo e valorizado em Franca/SP. Conheça as opções de casas e terrenos disponíveis neste bairro familiar.',
    E'# Jardim Paulista — Franca/SP\n\nO **Jardim Paulista** é um dos bairros residenciais mais tranquilos e valorizados de Franca/SP. Com ruas arborizadas, vizinhança familiar e boa infraestrutura, é uma excelente escolha para quem busca qualidade de vida.\n\n## Características do Jardim Paulista\n\n- **Tranquilidade**: bairro residencial com baixo movimento de veículos\n- **Arborização**: ruas com árvores e áreas verdes\n- **Infraestrutura**: escolas, comércio e serviços próximos\n- **Valorização**: bairro com histórico de valorização imobiliária\n\n## Imóveis Disponíveis\n\n- **Casas à venda**: a partir de R$ 320.000\n- **Terrenos**: a partir de R$ 90.000\n- **Casas para alugar**: a partir de R$ 1.300/mês\n\n## Contato\n\n**Imobiliária Lemos** — CRECI 279051\n📞 (16) 3722-0000',
    'Imóveis no Jardim Paulista Franca SP | Casas e Terrenos | Imobiliária Lemos',
    'Casas e terrenos no Jardim Paulista em Franca/SP. Bairro tranquilo e valorizado. Imobiliária Lemos — CRECI 279051.',
    ARRAY['jardim paulista franca','casas franca sp','bairros residenciais franca'],
    'Bairros de Franca',
    'Imobiliária Lemos',
    true, NOW(), false, 0, NOW(), NOW()
  ) ON CONFLICT (slug, "companyId") DO NOTHING;

  -- 10. Ana Dorothea
  INSERT INTO "BlogPost" (id, "companyId", title, slug, excerpt, content, "seoTitle", "seoDescription", tags, category, "authorName", published, "publishedAt", featured, views, "createdAt", "updatedAt")
  VALUES (
    gen_random_uuid(), v_company_id,
    'Residencial Ana Dorothea Franca SP: Condomínio com Segurança e Lazer',
    'residencial-ana-dorothea-franca-sp-imoveis',
    'O Residencial Ana Dorothea é um dos empreendimentos mais procurados de Franca/SP. Veja casas disponíveis neste condomínio com segurança e área de lazer completa.',
    E'# Residencial Ana Dorothea — Franca/SP\n\nO **Residencial Ana Dorothea** (também conhecido como Prolongamento Ana Dorothea) é um dos empreendimentos residenciais mais procurados de Franca/SP. Com casas de padrão médio-alto, segurança e boa localização, atrai famílias que buscam conforto e tranquilidade.\n\n## Diferenciais do Residencial\n\n- **Segurança**: portaria e monitoramento\n- **Casas espaçosas**: lotes generosos com área de lazer privativa\n- **Localização**: acesso fácil às principais vias de Franca\n- **Infraestrutura**: próximo a escolas, supermercados e serviços\n\n## Imóveis Disponíveis\n\n- **Casas à venda**: a partir de R$ 380.000\n- **Casas para alugar**: a partir de R$ 1.500/mês\n- **Terrenos**: consulte disponibilidade\n\n## Contato\n\n**Imobiliária Lemos** — CRECI 279051\n📞 (16) 3722-0000 | WhatsApp: (16) 98101-0005\n🌐 [agoraencontrei.com.br](https://www.agoraencontrei.com.br)',
    'Imóveis no Residencial Ana Dorothea Franca SP | Casas | Imobiliária Lemos',
    'Casas no Residencial Ana Dorothea em Franca/SP. Imobiliária Lemos — CRECI 279051. Ligue (16) 3722-0000.',
    ARRAY['ana dorothea franca','residencial ana dorothea','casas franca sp','condomínio franca'],
    'Condomínios de Franca',
    'Imobiliária Lemos',
    true, NOW(), false, 0, NOW(), NOW()
  ) ON CONFLICT (slug, "companyId") DO NOTHING;

  RAISE NOTICE 'Blog posts criados com sucesso para companyId: %', v_company_id;
END $$;

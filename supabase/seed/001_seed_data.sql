-- ============================================================
-- SEED DATA - Imobiliária Lemos CRM
-- NOTE: User UUIDs are placeholders. When using Supabase Auth,
-- insert real users via auth.users first, then use their UUIDs.
-- For local development, these UUIDs are used directly.
-- ============================================================

-- Admin and Corretor profile UUIDs (used throughout seed)
DO $$
DECLARE
  admin1_id UUID := 'a1000000-0000-0000-0000-000000000001';
  admin2_id UUID := 'a2000000-0000-0000-0000-000000000002';
  corretor1_id UUID := 'c1000000-0000-0000-0000-000000000003';
  corretor2_id UUID := 'c2000000-0000-0000-0000-000000000004';

  -- Property UUIDs
  prop1_id UUID := uuid_generate_v4();
  prop2_id UUID := uuid_generate_v4();
  prop3_id UUID := uuid_generate_v4();
  prop4_id UUID := uuid_generate_v4();
  prop5_id UUID := uuid_generate_v4();

  -- Client UUIDs
  client1_id UUID := uuid_generate_v4();
  client2_id UUID := uuid_generate_v4();
  client3_id UUID := uuid_generate_v4();
  client4_id UUID := uuid_generate_v4();
  client5_id UUID := uuid_generate_v4();

BEGIN
  -- Profiles
  INSERT INTO profiles (id, full_name, phone, creci, bio, active) VALUES
    (admin1_id, 'Carlos Lemos', '(16) 99999-1001', 'CRECI-SP 98765', 'Diretor e fundador da Imobiliária Lemos. Mais de 20 anos de experiência no mercado imobiliário de Franca e região.', true),
    (admin2_id, 'Ana Paula Lemos', '(16) 99999-1002', 'CRECI-SP 87654', 'Gestora de operações e sócia-diretora. Especialista em avaliação de imóveis residenciais e comerciais.', true),
    (corretor1_id, 'Rafael Oliveira', '(16) 99999-2001', 'CRECI-SP 56789', 'Corretor especializado em imóveis residenciais de médio e alto padrão em Franca.', true),
    (corretor2_id, 'Fernanda Costa', '(16) 99999-2002', 'CRECI-SP 45678', 'Corretora com foco em imóveis comerciais e industriais na região de Franca.', true);

  -- User roles
  INSERT INTO user_roles (user_id, role) VALUES
    (admin1_id, 'admin'),
    (admin2_id, 'admin'),
    (corretor1_id, 'corretor'),
    (corretor2_id, 'corretor');

  RAISE NOTICE 'Profiles and roles inserted successfully';
END $$;

-- ============================================================
-- PROPERTIES (50 properties)
-- ============================================================

INSERT INTO properties (
  codigo, titulo, tipo, finalidade, status, preco, preco_negociavel,
  preco_condominio, preco_iptu, descricao, cep, rua, numero, bairro,
  cidade, estado, area_total, area_construida, quartos, suites, banheiros,
  vagas, piscina, churrasqueira, jardim, varanda, sacada, area_servico,
  ar_condicionado, alarme, portaria_24h, interfone, cameras, elevador,
  pet_friendly, mobiliado, condominio_fechado, fibra_optica,
  proprietario_nome, proprietario_telefone, comissao_percentual,
  destaque, publicar_site, publicar_vivareal, publicar_zap,
  corretor_id, visualizacoes, favoritos
) VALUES

-- 1. Casa alto padrão - Jardim Paulistano
(
  'IML-001', 'Casa Alto Padrão com Piscina - Jardim Paulistano', 'casa', 'venda', 'disponivel',
  850000.00, true, NULL, 4200.00,
  'Excelente casa em condomínio fechado no Jardim Paulistano, bairro nobre de Franca. Imóvel com acabamento de alto padrão, ampla sala de estar e jantar integradas, cozinha americana equipada, 4 suítes sendo a master com closet e banheiro luxuoso. Área de lazer completa com piscina aquecida, churrasqueira gourmet e jardim. Garagem para 4 carros. Segurança 24h com câmeras e portaria monitorada.',
  '14409-000', 'Rua das Acácias', '245', 'Jardim Paulistano',
  'Franca', 'SP', 480.00, 380.00, 4, 4, 6,
  4, true, true, true, true, false, true,
  true, true, true, true, true, false,
  true, false, true, true,
  'Roberto Almeida Santos', '(16) 99888-1001', 6.0,
  true, true, true, true,
  'c1000000-0000-0000-0000-000000000003', 342, 28
),

-- 2. Apartamento - Centro
(
  'IML-002', 'Apartamento 3 Quartos - Centro de Franca', 'apartamento', 'venda', 'disponivel',
  380000.00, true, 450.00, 1800.00,
  'Apartamento bem localizado no coração de Franca, a poucos metros do Shopping Iguatemi e Av. Major Nicácio. Sala ampla com varanda, 3 quartos sendo 1 suíte, cozinha espaçosa, área de serviço e 2 vagas de garagem. Condomínio com portaria 24h, academia e salão de festas. Andar alto com vista privilegiada.',
  '14400-610', 'Rua Marcolino Martins Fontes', '500', 'Centro',
  'Franca', 'SP', 115.00, 115.00, 3, 1, 2,
  2, false, false, false, false, true, true,
  true, true, true, true, true, true,
  true, false, false, true,
  'Maria Helena Ferreira', '(16) 99777-2002', 6.0,
  true, true, true, true,
  'c1000000-0000-0000-0000-000000000003', 198, 15
),

-- 3. Casa - São José
(
  'IML-003', 'Casa Térrea 3 Quartos - São José', 'casa', 'venda', 'disponivel',
  420000.00, true, NULL, 2100.00,
  'Ótima casa no bairro São José, região tranquila e bem servida de comércio e serviços. Sala de estar e jantar, 3 quartos sendo 1 suíte, banheiro social, cozinha com churrasqueira integrada, área de serviço, garagem para 2 carros. Quintal com jardim e espaço para área de lazer. Documentação em dia.',
  '14405-290', 'Rua Oito de Outubro', '88', 'São José',
  'Franca', 'SP', 250.00, 180.00, 3, 1, 2,
  2, false, true, true, false, false, true,
  false, true, false, true, true, false,
  true, false, false, false,
  'João Carlos Pereira', '(16) 99666-3003', 6.0,
  false, true, false, true,
  'c1000000-0000-0000-0000-000000000003', 87, 6
),

-- 4. Terreno - Jardim América
(
  'IML-004', 'Terreno Plano 360m² - Jardim América', 'terreno', 'venda', 'disponivel',
  195000.00, true, NULL, 900.00,
  'Excelente terreno plano de esquina no Jardim América, pronto para construção. Localização privilegiada próxima a escolas, supermercados e vias principais. Topografia plana, sem pedras, com rede de água, esgoto e energia. Documentação toda regularizada. Ótima oportunidade de investimento.',
  '14403-360', 'Rua Campos Sales', '0', 'Jardim América',
  'Franca', 'SP', 360.00, NULL, 0, 0, 0,
  0, false, false, false, false, false, false,
  false, false, false, false, false, false,
  false, false, false, false,
  'Antônio Vieira Lima', '(16) 99555-4004', 5.0,
  false, true, true, false,
  'c2000000-0000-0000-0000-000000000004', 54, 3
),

-- 5. Chácara - Região de Franca
(
  'IML-005', 'Chácara 5 Alqueires com Casa Sede - Região de Franca', 'chacara', 'venda', 'disponivel',
  1200000.00, true, NULL, 6000.00,
  'Linda chácara com 5 alqueires a 15km de Franca, acesso pela rodovia Cândido Portinari. Casa sede com 4 dormitórios, 2 banheiros, sala, cozinha, varanda ampla. Área com pomar (laranja, limão, manga, goiaba), horta, curral, piscina, churrasqueira e barracão. Nascente de água natural e poço artesiano. Escritura em dia.',
  '14400-000', 'Estrada Municipal', 'Km 15', 'Zona Rural',
  'Franca', 'SP', 121000.00, 320.00, 4, 0, 2,
  4, true, true, true, true, false, true,
  false, false, false, false, false, false,
  true, false, false, false,
  'Paulo Roberto Mendes', '(16) 99444-5005', 5.0,
  true, true, false, false,
  'c2000000-0000-0000-0000-000000000004', 267, 41
),

-- 6. Apartamento locação - Jardim Aeroporto
(
  'IML-006', 'Apartamento 2 Quartos para Locação - Jardim Aeroporto', 'apartamento', 'locacao', 'disponivel',
  1800.00, false, 300.00, 180.00,
  'Apartamento 2 quartos no Jardim Aeroporto, próximo ao aeroporto municipal e shoppings. Sala, cozinha, área de serviço, 1 banheiro e 1 vaga de garagem. Condomínio com portaria. Aceita pet de pequeno porte.',
  '14406-100', 'Av. Presidente Vargas', '1200', 'Jardim Aeroporto',
  'Franca', 'SP', 65.00, 65.00, 2, 0, 1,
  1, false, false, false, false, false, true,
  false, true, true, true, true, false,
  true, false, false, true,
  'Luciana Barbosa Faria', '(16) 99333-6006', 8.0,
  false, true, true, true,
  'c1000000-0000-0000-0000-000000000003', 123, 9
),

-- 7. Sala Comercial - Centro
(
  'IML-007', 'Sala Comercial 45m² - Centro de Franca', 'sala', 'locacao', 'disponivel',
  2200.00, true, 600.00, 250.00,
  'Sala comercial de 45m² em andar alto com vista para a cidade, no coração do Centro de Franca. Acabamento moderno, climatização, banheiro privativo, recepção compartilhada e 1 vaga de garagem. Excelente para escritórios, consultórios médicos, odontológicos ou advocacia.',
  '14400-100', 'Rua Dídimo Galvão', '850', 'Centro',
  'Franca', 'SP', 45.00, 45.00, 0, 0, 1,
  1, false, false, false, false, false, false,
  true, true, true, true, true, true,
  false, true, false, true,
  'Comercial Centro Ltda', '(16) 99222-7007', 8.0,
  false, true, false, false,
  'c2000000-0000-0000-0000-000000000004', 67, 4
),

-- 8. Casa - Jardim Consolação
(
  'IML-008', 'Casa 3 Quartos com Piscina - Jardim Consolação', 'casa', 'venda', 'disponivel',
  560000.00, true, NULL, 2800.00,
  'Belíssima casa no Jardim Consolação, um dos bairros mais valorizados de Franca. Sala de estar e jantar amplas, 3 quartos sendo 2 suítes, cozinha moderna com ilha central, área gourmet com churrasqueira e forno, piscina com aquecimento solar. Jardim bem cuidado, 3 vagas de garagem. Cerca elétrica e câmeras de segurança.',
  '14408-180', 'Rua Antônio de Lacerda', '170', 'Jardim Consolação',
  'Franca', 'SP', 320.00, 260.00, 3, 2, 3,
  3, true, true, true, true, false, true,
  true, true, false, true, true, false,
  true, false, false, true,
  'Marcos Henrique Souza', '(16) 99111-8008', 6.0,
  true, true, true, true,
  'c1000000-0000-0000-0000-000000000003', 289, 22
),

-- 9. Apartamento cobertura - Centro
(
  'IML-009', 'Cobertura Duplex 4 Suítes - Centro Premium', 'cobertura', 'venda', 'disponivel',
  1350000.00, false, 1200.00, 6500.00,
  'Sofisticada cobertura duplex no coração de Franca, com 4 suítes todas com banheiro privativo, closet master de 25m², home cinema, home office, sala de estar e jantar integradas com pé-direito de 4m, terraço de 120m² com piscina privativa, churrasqueira e espaço gourmet. Vista panorâmica de 360 graus da cidade. 4 vagas de garagem.',
  '14400-650', 'Av. Major Nicácio', '2100', 'Centro',
  'Franca', 'SP', 350.00, 350.00, 4, 4, 5,
  4, true, true, false, false, true, true,
  true, true, true, true, true, true,
  true, false, true, true,
  'Grupo Incorporadora Franca', '(16) 98888-9009', 6.0,
  true, true, true, true,
  'c2000000-0000-0000-0000-000000000004', 445, 67
),

-- 10. Terreno comercial - Av. Dr. Flávio Rocha
(
  'IML-010', 'Terreno Comercial 1.200m² - Av. Dr. Flávio Rocha', 'terreno', 'venda', 'disponivel',
  980000.00, true, NULL, 4900.00,
  'Terreno de alto potencial comercial na Av. Dr. Flávio Rocha, uma das principais avenidas de Franca. 1.200m² em frente à avenida, frente de 30m. Ideal para empreendimentos comerciais, fast food, posto de gasolina, concessionária ou supermercado. Zoneamento C3.',
  '14400-700', 'Av. Dr. Flávio Rocha', '0', 'Cidade Nova',
  'Franca', 'SP', 1200.00, NULL, 0, 0, 0,
  0, false, false, false, false, false, false,
  false, false, false, false, false, false,
  false, false, false, false,
  'Espólio Comercial Franca', '(16) 98777-0010', 5.0,
  true, true, true, false,
  'c2000000-0000-0000-0000-000000000004', 198, 31
),

-- 11. Casa locação - Vila Mineiral
(
  'IML-011', 'Casa 3 Quartos para Locação - Vila Mineiral', 'casa', 'locacao', 'disponivel',
  2500.00, false, NULL, 220.00,
  'Casa bem localizada na Vila Mineiral, próxima à UNIFRAN e serviços. 3 quartos, sala, cozinha, banheiro, área de serviço e 1 vaga de garagem. Quintal. Ótima para família ou estudantes.',
  '14404-040', 'Rua Pará', '340', 'Vila Mineiral',
  'Franca', 'SP', 140.00, 120.00, 3, 0, 1,
  1, false, true, true, false, false, true,
  false, false, false, true, false, false,
  true, false, false, false,
  'Fernanda Lima Torres', '(16) 98666-1011', 8.0,
  false, true, false, true,
  'c1000000-0000-0000-0000-000000000003', 76, 5
),

-- 12. Studio - Centro
(
  'IML-012', 'Studio Mobiliado 32m² - Centro Franca', 'studio', 'locacao', 'disponivel',
  1400.00, false, 250.00, 120.00,
  'Studio totalmente mobiliado e equipado no centro de Franca. Espaço inteligente com área de dormir, cozinha americana completa (geladeira, microondas, fogão, lavadora), banheiro com box e armários embutidos. Ideal para estudantes ou profissionais solteiros.',
  '14400-200', 'Rua Frederico Moura', '720', 'Centro',
  'Franca', 'SP', 32.00, 32.00, 0, 0, 1,
  0, false, false, false, false, false, false,
  true, true, true, true, true, true,
  true, true, false, true,
  'Rodrigo Alves Lima', '(16) 98555-1012', 8.0,
  false, true, true, false,
  'c1000000-0000-0000-0000-000000000003', 89, 11
),

-- 13. Casa - Jardim América (alto padrão)
(
  'IML-013', 'Mansão 5 Suítes - Jardim América', 'casa', 'venda', 'disponivel',
  2800000.00, false, NULL, 14000.00,
  'Propriedade de altíssimo padrão no Jardim América, rua mais nobre de Franca. 5 suítes com closets individuais, suíte master de 80m² com spa privativo. Sala de cinema, adega climatizada, academia privativa, salão de festas, piscina olímpica aquecida, quadra poliesportiva coberta. Área total de 1.400m², sendo 900m² construídos. Segurança máxima com biometria.',
  '14403-280', 'Rua Rio de Janeiro', '1100', 'Jardim América',
  'Franca', 'SP', 1400.00, 900.00, 5, 5, 8,
  6, true, true, true, true, true, true,
  true, true, true, true, true, false,
  true, false, true, true,
  'Confidencial', '(16) 98444-1013', 5.0,
  true, true, false, false,
  'c2000000-0000-0000-0000-000000000004', 892, 156
),

-- 14. Apartamento - Jardim Paulistano (locação)
(
  'IML-014', 'Apartamento 2 Quartos - Jardim Paulistano', 'apartamento', 'locacao', 'disponivel',
  2100.00, false, 380.00, 160.00,
  'Apartamento 2 quartos em condomínio clube no Jardim Paulistano. Lazer completo: piscina, academia, salão de festas, playground. 1 vaga coberta. Próximo a escolas de qualidade e shoppings.',
  '14409-100', 'Rua das Palmeiras', '890', 'Jardim Paulistano',
  'Franca', 'SP', 72.00, 72.00, 2, 1, 1,
  1, false, false, false, false, false, true,
  true, true, true, true, true, false,
  true, false, false, true,
  'Construtora Paulistano', '(16) 98333-1014', 8.0,
  false, true, true, true,
  'c1000000-0000-0000-0000-000000000003', 134, 18
),

-- 15. Galpão comercial
(
  'IML-015', 'Galpão Industrial 800m² - Distrito Industrial', 'galpao', 'locacao', 'disponivel',
  9500.00, true, NULL, 800.00,
  'Galpão no Distrito Industrial de Franca com 800m² de área coberta, pé-direito de 8m, piso industrial, portão para caminhão, energia trifásica, escritório de 40m², vestiários, estacionamento. Próximo às rodovias SP-330 e SP-320.',
  '14407-000', 'Rua das Indústrias', '50', 'Distrito Industrial',
  'Franca', 'SP', 1200.00, 800.00, 0, 0, 2,
  10, false, false, false, false, false, false,
  false, true, false, false, true, false,
  false, false, false, false,
  'Indústrias Francanas Ltda', '(16) 98222-1015', 7.0,
  false, true, false, false,
  'c2000000-0000-0000-0000-000000000004', 43, 7
),

-- 16. Casa - São José (mais acessível)
(
  'IML-016', 'Casa 2 Quartos - São José', 'casa', 'venda', 'disponivel',
  280000.00, true, NULL, 1400.00,
  'Casa simples e bem conservada no bairro São José. 2 dormitórios, sala, cozinha, banheiro, área de serviço e garagem coberta. Quintal amplo. Ótima localização com fácil acesso ao centro. Documentação regularizada.',
  '14405-350', 'Rua Quinze de Novembro', '542', 'São José',
  'Franca', 'SP', 175.00, 100.00, 2, 0, 1,
  1, false, false, true, false, false, true,
  false, false, false, false, false, false,
  false, false, false, false,
  'José Antônio da Silva', '(16) 98111-1016', 6.0,
  false, true, true, true,
  'c1000000-0000-0000-0000-000000000003', 55, 3
),

-- 17. Chácara - Rifaina
(
  'IML-017', 'Chácara de Lazer 3 Alqueires - Rifaina', 'chacara', 'venda', 'disponivel',
  750000.00, true, NULL, 3750.00,
  'Chácara de lazer em Rifaina, cidade à beira do Lago de Água Vermelha. 3 alqueires com casa sede de 3 quartos, piscina, churrasqueira, deque às margens do lago. Vista deslumbrante para o reservatório. Excelente para finais de semana e hospedagem. A 80km de Franca.',
  '14365-000', 'Estrada do Lago', 'Km 3', 'Zona Rural',
  'Rifaina', 'SP', 72600.00, 200.00, 3, 1, 2,
  3, true, true, true, true, false, true,
  false, false, false, false, false, false,
  true, false, false, false,
  'Mário Cézar Lacerda', '(16) 97999-1017', 5.0,
  true, true, false, false,
  'c2000000-0000-0000-0000-000000000004', 312, 54
),

-- 18. Apartamento - Centro (locação)
(
  'IML-018', 'Apartamento 1 Quarto para Locação - Centro', 'apartamento', 'locacao', 'disponivel',
  1200.00, false, 180.00, 90.00,
  'Apartamento compacto no Centro de Franca, ideal para quem quer praticidade no dia a dia. 1 dormitório, sala, cozinha americana, banheiro. Condomínio com portaria. Próximo a comércio, bancos e transporte público.',
  '14400-400', 'Rua Ouvidor Pelegrino', '310', 'Centro',
  'Franca', 'SP', 42.00, 42.00, 1, 0, 1,
  0, false, false, false, false, false, false,
  false, true, true, true, true, true,
  false, false, false, true,
  'Gabriela Freitas Santos', '(16) 97888-1018', 8.0,
  false, true, true, true,
  'c1000000-0000-0000-0000-000000000003', 98, 12
),

-- 19. Casa - Jardim Consolação (médio padrão)
(
  'IML-019', 'Casa 3 Quartos com Suíte - Jardim Consolação', 'casa', 'venda', 'disponivel',
  490000.00, true, NULL, 2450.00,
  'Ótima casa no Jardim Consolação, bairro tranquilo e bem valorizado. Sala de estar e jantar, 3 quartos sendo 1 suíte, cozinha planejada, área gourmet com churrasqueira, garagem para 2 carros, jardim frontal. Próxima a colégios particulares e comércio.',
  '14408-070', 'Rua Amâncio Bueno de Camargo', '285', 'Jardim Consolação',
  'Franca', 'SP', 270.00, 200.00, 3, 1, 2,
  2, false, true, true, false, false, true,
  true, true, false, true, true, false,
  true, false, false, true,
  'Sandra Aparecida Moreira', '(16) 97777-1019', 6.0,
  false, true, true, true,
  'c1000000-0000-0000-0000-000000000003', 167, 14
),

-- 20. Terreno - Patrocínio Paulista
(
  'IML-020', 'Terreno Rural 10 Alqueires - Patrocínio Paulista', 'terreno', 'venda', 'disponivel',
  320000.00, true, NULL, 1600.00,
  'Área rural de 10 alqueires em Patrocínio Paulista, terra roxa de boa fertilidade, cercada, com acesso por estrada carroçável. Ótima para cultivo de café, soja ou pastagem. Água encanada disponível. Localizada a 40km de Franca.',
  '14355-000', 'Estrada Rural', 'Km 8', 'Zona Rural',
  'Patrocínio Paulista', 'SP', 242000.00, NULL, 0, 0, 0,
  0, false, false, false, false, false, false,
  false, false, false, false, false, false,
  false, false, false, false,
  'Herdeiros Santana', '(16) 97666-1020', 5.0,
  false, true, false, false,
  'c2000000-0000-0000-0000-000000000004', 89, 16
),

-- 21. Apartamento 3 quartos - Jardim Aeroporto
(
  'IML-021', 'Apartamento 3 Quartos 2 Vagas - Jardim Aeroporto', 'apartamento', 'venda', 'disponivel',
  420000.00, true, 520.00, 2100.00,
  'Excelente apartamento no Jardim Aeroporto, condomínio clube com infraestrutura completa. 3 dormitórios, sala ampla, varanda, cozinha, área de serviço, 2 banheiros e 2 vagas. Lazer: piscina adulto e infantil, academia, quadra, salão de festas e playground.',
  '14406-200', 'Rua Humberto de Campos', '1540', 'Jardim Aeroporto',
  'Franca', 'SP', 120.00, 120.00, 3, 1, 2,
  2, false, false, false, false, true, true,
  true, true, true, true, true, false,
  true, false, false, true,
  'Andréa Lima Campos', '(16) 97555-1021', 6.0,
  false, true, true, true,
  'c1000000-0000-0000-0000-000000000003', 145, 11
),

-- 22. Casa - Vila Mineiral
(
  'IML-022', 'Casa 4 Quartos Reformada - Vila Mineiral', 'casa', 'venda', 'disponivel',
  395000.00, true, NULL, 1975.00,
  'Casa totalmente reformada na Vila Mineiral. 4 quartos, sala de estar e jantar, cozinha americana moderna, 2 banheiros, área de serviço, quintal com churrasqueira e piscina. 2 vagas de garagem. Próxima à UNIFRAN e comércio local.',
  '14404-150', 'Rua Goiás', '187', 'Vila Mineiral',
  'Franca', 'SP', 240.00, 190.00, 4, 1, 2,
  2, true, true, true, false, false, true,
  true, true, false, true, true, false,
  true, false, false, false,
  'Cláudio Roberto Nascimento', '(16) 97444-1022', 6.0,
  false, true, true, true,
  'c2000000-0000-0000-0000-000000000004', 112, 8
),

-- 23. Loja comercial - Centro
(
  'IML-023', 'Loja Comercial 120m² - Av. Major Nicácio', 'comercial', 'locacao', 'disponivel',
  5800.00, true, NULL, 580.00,
  'Loja comercial em ponto nobre na Av. Major Nicácio, a principal avenida de Franca. 120m² em nível de rua, fachada de vidro, depósito nos fundos. Alto fluxo de pedestres e veículos. Ideal para varejo, restaurante, farmácia ou serviços.',
  '14400-000', 'Av. Major Nicácio', '1350', 'Centro',
  'Franca', 'SP', 120.00, 120.00, 0, 0, 1,
  0, false, false, false, false, false, false,
  true, true, false, false, true, false,
  false, false, false, true,
  'Imóveis Comerciais Nicácio', '(16) 97333-1023', 7.0,
  false, true, false, true,
  'c2000000-0000-0000-0000-000000000004', 78, 5
),

-- 24. Casa condomínio - Jardim Paulistano (médio)
(
  'IML-024', 'Casa em Condomínio 3 Suítes - Jardim Paulistano', 'casa', 'venda', 'disponivel',
  720000.00, true, 650.00, 3600.00,
  'Casa em condomínio fechado com segurança 24h no Jardim Paulistano. 3 suítes com closets, sala de estar e jantar integradas, cozinha gourmet, sala de TV, escritório, área de lazer com piscina, churrasqueira e jardim. 3 vagas. Acabamento impecável.',
  '14409-050', 'Rua das Orquídeas', '88', 'Jardim Paulistano',
  'Franca', 'SP', 380.00, 300.00, 3, 3, 4,
  3, true, true, true, true, false, true,
  true, true, true, true, true, false,
  true, false, true, true,
  'Augusto Tavares Cunha', '(16) 97222-1024', 6.0,
  true, true, true, true,
  'c1000000-0000-0000-0000-000000000003', 234, 31
),

-- 25. Apartamento Flat - Centro
(
  'IML-025', 'Flat Studio com Serviços - Centro Empresarial', 'flat', 'locacao', 'disponivel',
  3200.00, false, 800.00, 300.00,
  'Flat empresarial no centro de Franca com serviços incluídos: limpeza, café da manhã, recepção, internet. 38m², mobiliado com cama casal, sofá, mesa de trabalho, TV, frigobar, banheiro com banheira. Ideal para viajantes corporativos.',
  '14400-300', 'Rua Dr. José Custódio', '430', 'Centro',
  'Franca', 'SP', 38.00, 38.00, 0, 0, 1,
  1, false, false, false, false, false, false,
  true, true, true, true, true, true,
  false, true, false, true,
  'Hotel Empresarial Lemos', '(16) 97111-1025', 8.0,
  false, true, false, false,
  'c2000000-0000-0000-0000-000000000004', 56, 4
),

-- 26. Terreno - Jardim Consolação (para construção)
(
  'IML-026', 'Terreno 450m² - Jardim Consolação', 'terreno', 'venda', 'disponivel',
  280000.00, true, NULL, 1400.00,
  'Terreno de esquina 450m² no Jardim Consolação, bairro nobre de Franca. Plano, murado, com calçada. Infraestrutura completa: água, esgoto, energia, asfalto. Ideal para construção de casa de alto padrão ou pequeno edifício.',
  '14408-200', 'Rua Balbino de Almeida', '0', 'Jardim Consolação',
  'Franca', 'SP', 450.00, NULL, 0, 0, 0,
  0, false, false, false, false, false, false,
  false, false, false, false, false, false,
  false, false, false, false,
  'Érica Moraes Tavares', '(16) 96999-1026', 5.0,
  false, true, true, false,
  'c1000000-0000-0000-0000-000000000003', 67, 9
),

-- 27. Casa - Jardim Aeroporto
(
  'IML-027', 'Casa 3 Quartos com Varanda - Jardim Aeroporto', 'casa', 'venda', 'disponivel',
  350000.00, true, NULL, 1750.00,
  'Casa aconchegante no Jardim Aeroporto com 3 dormitórios, sala de estar e jantar, cozinha, área de serviço, banheiro e garagem. Varanda gourmet com churrasqueira. Quintal com área verde. Bairro tranquilo com bom acesso a escolas e supermercados.',
  '14406-350', 'Rua Professor Santos', '678', 'Jardim Aeroporto',
  'Franca', 'SP', 210.00, 160.00, 3, 0, 1,
  2, false, true, true, true, false, true,
  false, true, false, true, false, false,
  true, false, false, false,
  'Nilza Aparecida Rodrigues', '(16) 96888-1027', 6.0,
  false, true, true, true,
  'c2000000-0000-0000-0000-000000000004', 88, 6
),

-- 28. Prédio comercial inteiro - Centro
(
  'IML-028', 'Prédio Comercial 6 Andares - Centro', 'comercial', 'venda', 'disponivel',
  3500000.00, true, NULL, 17500.00,
  'Prédio comercial completo no Centro de Franca, 6 andares mais térreo, 28 salas de 25 a 60m², elevador, gerador, 30 vagas de garagem, recepção principal. Ideal para sede própria ou investimento com renda. Locação atual de R$ 35.000/mês.',
  '14400-500', 'Rua Frederico Moura', '380', 'Centro',
  'Franca', 'SP', 2100.00, 2100.00, 0, 0, 14,
  30, false, false, false, false, false, false,
  true, true, true, true, true, true,
  false, false, false, true,
  'Holding Central Imóveis', '(16) 96777-1028', 5.0,
  true, true, true, false,
  'c2000000-0000-0000-0000-000000000004', 167, 43
),

-- 29. Casa - São José (locação)
(
  'IML-029', 'Casa 3 Quartos para Locação - São José', 'casa', 'locacao', 'disponivel',
  2200.00, false, NULL, 200.00,
  'Casa para locação no São José, boa localização. 3 dormitórios, sala, cozinha, banheiro, área de serviço, garagem e quintal. Vizinhança tranquila.',
  '14405-180', 'Rua Marechal Deodoro', '92', 'São José',
  'Franca', 'SP', 180.00, 130.00, 3, 0, 1,
  1, false, true, true, false, false, true,
  false, false, false, false, false, false,
  true, false, false, false,
  'Paulo Sérgio Teixeira', '(16) 96666-1029', 8.0,
  false, true, false, true,
  'c1000000-0000-0000-0000-000000000003', 43, 2
),

-- 30. Apartamento - Jardim América (locação)
(
  'IML-030', 'Apartamento 2 Quartos - Jardim América', 'apartamento', 'locacao', 'disponivel',
  1900.00, false, 350.00, 150.00,
  'Apartamento bem conservado no Jardim América, bairro nobre. 2 dormitórios, sala, varanda, cozinha, área de serviço, 1 banheiro e 1 vaga. Condomínio com piscina e portaria.',
  '14403-200', 'Av. Champagnat', '440', 'Jardim América',
  'Franca', 'SP', 75.00, 75.00, 2, 0, 1,
  1, false, false, false, false, true, true,
  false, true, true, true, true, false,
  true, false, false, true,
  'Denise Cristina Alves', '(16) 96555-1030', 8.0,
  false, true, true, true,
  'c2000000-0000-0000-0000-000000000004', 92, 8
),

-- 31. Casa - Ibiraci (MG)
(
  'IML-031', 'Casa com Lote Grande - Ibiraci MG', 'casa', 'venda', 'disponivel',
  180000.00, true, NULL, 900.00,
  'Casa em Ibiraci, cidade no sul de Minas a 80km de Franca. 3 dormitórios, sala, cozinha, banheiro. Lote de 600m², quintal amplo com frutíferas. Oportunidade para quem busca qualidade de vida em cidade menor. Documentação em dia.',
  '37795-000', 'Rua Coronel Honório', '215', 'Centro',
  'Ibiraci', 'MG', 600.00, 120.00, 3, 0, 1,
  1, false, false, true, false, false, true,
  false, false, false, false, false, false,
  true, false, false, false,
  'Otávio Bernardes Lima', '(34) 99900-1031', 6.0,
  false, true, false, false,
  'c1000000-0000-0000-0000-000000000003', 34, 2
),

-- 32. Casa alto padrão reformada - Centro
(
  'IML-032', 'Casarão Histórico Reformado - Centro Histórico', 'casa', 'venda', 'disponivel',
  980000.00, true, NULL, 4900.00,
  'Imponente casarão do século XX no Centro Histórico de Franca, completamente restaurado mantendo os elementos originais: pé-direito alto, forro de madeira, janelas coloniais. 5 dormitórios, 3 banheiros, sala formal, sala de TV, escritório, jardim interno, varanda. Ideal para residência de alto padrão ou sede corporativa.',
  '14400-040', 'Rua Frederico Moura', '120', 'Centro',
  'Franca', 'SP', 650.00, 550.00, 5, 2, 3,
  3, false, false, true, true, false, true,
  true, true, false, true, true, false,
  false, false, false, true,
  'Instituto Patrimônio Histórico', '(16) 96444-1032', 5.0,
  true, true, false, false,
  'c2000000-0000-0000-0000-000000000004', 276, 47
),

-- 33. Apartamento - Cidade Nova
(
  'IML-033', 'Apartamento 3 Quartos - Cidade Nova', 'apartamento', 'venda', 'disponivel',
  360000.00, true, 480.00, 1800.00,
  'Apartamento no bairro Cidade Nova, em prédio relativamente novo. 3 dormitórios sendo 1 suíte, sala integrada, varanda, cozinha, área de serviço e 2 vagas. Condomínio com piscina, academia e salão. Ótimo custo-benefício.',
  '14401-000', 'Rua Coronel Luís Brandão', '780', 'Cidade Nova',
  'Franca', 'SP', 105.00, 105.00, 3, 1, 2,
  2, false, false, false, false, true, true,
  true, true, true, true, true, false,
  true, false, false, true,
  'Sandro Ferreira Lopes', '(16) 96333-1033', 6.0,
  false, true, true, true,
  'c1000000-0000-0000-0000-000000000003', 122, 10
),

-- 34. Terreno - Jardim Aeroporto
(
  'IML-034', 'Terreno 270m² - Jardim Aeroporto', 'terreno', 'venda', 'disponivel',
  145000.00, true, NULL, 725.00,
  'Terreno de 270m² no Jardim Aeroporto, plano e com boa localização. Rua pavimentada, toda a infraestrutura disponível. Ótimo para construção de casa padrão ou duplex. Escritura e IPTU em dia.',
  '14406-450', 'Rua Santos Dumont', '0', 'Jardim Aeroporto',
  'Franca', 'SP', 270.00, NULL, 0, 0, 0,
  0, false, false, false, false, false, false,
  false, false, false, false, false, false,
  false, false, false, false,
  'Ivone dos Santos Costa', '(16) 96222-1034', 5.0,
  false, true, true, false,
  'c2000000-0000-0000-0000-000000000004', 48, 4
),

-- 35. Casa - Jardim América (locação)
(
  'IML-035', 'Casa 4 Quartos para Locação - Jardim América', 'casa', 'locacao', 'disponivel',
  4500.00, true, NULL, 380.00,
  'Casa para locação no nobre Jardim América. 4 dormitórios sendo 2 suítes, sala de estar e jantar, cozinha espaçosa, área gourmet com churrasqueira, piscina, jardim e 3 vagas de garagem. Casa ampla e bem conservada para família grande.',
  '14403-120', 'Rua São Paulo', '392', 'Jardim América',
  'Franca', 'SP', 380.00, 300.00, 4, 2, 3,
  3, true, true, true, true, false, true,
  true, true, false, true, true, false,
  true, false, false, true,
  'Família Mendonça', '(16) 96111-1035', 8.0,
  false, true, true, false,
  'c1000000-0000-0000-0000-000000000003', 97, 13
),

-- 36. Casa pequena - São José (MCMV)
(
  'IML-036', 'Casa 2 Quartos - Programa Casa Verde e Amarela', 'casa', 'venda', 'disponivel',
  195000.00, false, NULL, 975.00,
  'Casa no programa Casa Verde e Amarela, 2 dormitórios, sala, cozinha, banheiro, área de serviço e garagem. Aceita FGTS e financiamento Caixa Econômica. Documentação pronta. Ideal para compra do primeiro imóvel.',
  '14405-500', 'Rua Esperança', '234', 'Jardim Esperança',
  'Franca', 'SP', 60.00, 52.00, 2, 0, 1,
  1, false, false, false, false, false, true,
  false, false, false, false, false, false,
  false, false, false, false,
  'Construtora Federal', '(16) 95999-1036', 4.0,
  false, true, true, true,
  'c1000000-0000-0000-0000-000000000003', 187, 24
),

-- 37. Apartamento 4 suítes - Jardim Paulistano
(
  'IML-037', 'Apartamento 4 Suítes Luxo - Jardim Paulistano', 'apartamento', 'venda', 'disponivel',
  1100000.00, true, 1400.00, 5500.00,
  'Apartamento de altíssimo padrão no Jardim Paulistano, andar alto com vista panorâmica. 4 suítes, sendo a master com closet e banheiro com banheira de hidromassagem. Cozinha americana completa, sala de estar e jantar integradas, sacada com churrasqueira. 4 vagas de garagem. Condomínio clube com lazer completo.',
  '14409-200', 'Rua Comendador Palmério', '1800', 'Jardim Paulistano',
  'Franca', 'SP', 250.00, 250.00, 4, 4, 5,
  4, false, true, false, false, true, true,
  true, true, true, true, true, true,
  true, false, false, true,
  'Ricardo Abreu Machado', '(16) 95888-1037', 6.0,
  true, true, true, true,
  'c2000000-0000-0000-0000-000000000004', 378, 62
),

-- 38. Sala comercial - Jardim Aeroporto
(
  'IML-038', 'Conjunto de Salas Comerciais 80m² - Aeroporto', 'sala', 'venda', 'disponivel',
  320000.00, true, 420.00, 1600.00,
  'Conjunto de 2 salas comerciais unificadas, 80m² no Jardim Aeroporto próximo ao aeroporto municipal. Acabamento moderno, climatizado, 2 banheiros, copa, 2 vagas de garagem. Ideal para clínicas médicas, escritórios ou ensino.',
  '14406-620', 'Av. Presidente Itamar Franco', '560', 'Jardim Aeroporto',
  'Franca', 'SP', 80.00, 80.00, 0, 0, 2,
  2, false, false, false, false, false, false,
  true, true, true, true, true, true,
  false, false, false, true,
  'Grupo Médico Francano', '(16) 95777-1038', 6.0,
  false, true, false, false,
  'c1000000-0000-0000-0000-000000000003', 56, 7
),

-- 39. Chácara - Ibiraci MG
(
  'IML-039', 'Chácara 2 Alqueires com Represa - Ibiraci MG', 'chacara', 'venda', 'disponivel',
  420000.00, true, NULL, 2100.00,
  'Chácara em Ibiraci MG com represa para pesca esportiva, 2 alqueires de terra. Casa com 2 dormitórios, sala, cozinha, banheiro, varanda. Piscina, churrasqueira, pomar, horta. Acesso por estrada de barro bem conservada. A 75km de Franca.',
  '37795-000', 'Fazenda Boa Vista', 'S/N', 'Zona Rural',
  'Ibiraci', 'MG', 48400.00, 150.00, 2, 0, 1,
  2, true, true, true, true, false, true,
  false, false, false, false, false, false,
  true, false, false, false,
  'Rômulo Guimarães Pinto', '(34) 99800-1039', 5.0,
  false, true, false, false,
  'c2000000-0000-0000-0000-000000000004', 143, 26
),

-- 40. Casa nova - Jardim América
(
  'IML-040', 'Casa Nova 3 Suítes em Construção - Jardim América', 'casa', 'venda', 'reservado',
  680000.00, false, NULL, 3400.00,
  'Casa nova com entrega prevista para outubro/2025 no Jardim América. 3 suítes com closets, sala de estar e jantar, cozinha espaçosa, área gourmet, piscina, jardim. 3 vagas de garagem. Possibilidade de personalização de acabamentos. Construtora com garantia.',
  '14403-320', 'Rua Minas Gerais', '580', 'Jardim América',
  'Franca', 'SP', 320.00, 270.00, 3, 3, 4,
  3, true, true, true, false, false, true,
  true, true, false, true, true, false,
  true, false, true, true,
  'Construtora Novo Horizonte', '(16) 95666-1040', 6.0,
  true, true, true, true,
  'c1000000-0000-0000-0000-000000000003', 412, 89
),

-- 41. Apartamento - Jardim Consolação (venda)
(
  'IML-041', 'Apartamento 2 Quartos - Jardim Consolação', 'apartamento', 'venda', 'disponivel',
  320000.00, true, 380.00, 1600.00,
  'Bom apartamento no Jardim Consolação, conservado e bem localizado. 2 dormitórios, sala, varanda, cozinha, área de serviço, 1 banheiro e 1 vaga. Prédio com portaria e elevador.',
  '14408-100', 'Rua Capitão João Gomes', '990', 'Jardim Consolação',
  'Franca', 'SP', 78.00, 78.00, 2, 0, 1,
  1, false, false, false, false, true, true,
  false, true, true, true, true, true,
  true, false, false, false,
  'Thereza Cristina Borges', '(16) 95555-1041', 6.0,
  false, true, true, true,
  'c2000000-0000-0000-0000-000000000004', 76, 5
),

-- 42. Galpão venda - Distrito Industrial
(
  'IML-042', 'Galpão Industrial 1.500m² para Venda - Distrito Industrial', 'galpao', 'venda', 'disponivel',
  2200000.00, true, NULL, 11000.00,
  'Galpão industrial de 1.500m² no Distrito Industrial de Franca. Pé-direito 10m, 2 pontes rolantes de 10 ton cada, escritórios 80m², refeitório, vestiários completos, gerador, transformador, energia trifásica 380V, guarita, estacionamento para 30 veículos. Área total do terreno 3.000m².',
  '14407-100', 'Rua Progresso Industrial', '200', 'Distrito Industrial',
  'Franca', 'SP', 3000.00, 1500.00, 0, 0, 6,
  30, false, false, false, false, false, false,
  false, true, true, false, true, false,
  false, false, false, false,
  'Metalúrgica Franca SA', '(16) 95444-1042', 5.0,
  false, true, true, false,
  'c2000000-0000-0000-0000-000000000004', 89, 22
),

-- 43. Casa - Bairro Aeroporto (acessível)
(
  'IML-043', 'Casa 3 Quartos Bairro Aeroporto', 'casa', 'venda', 'disponivel',
  310000.00, true, NULL, 1550.00,
  'Casa de 3 dormitórios no Bairro Aeroporto, próxima a supermercados e escolas. Sala de estar, cozinha, banheiro, área de serviço, garagem e quintal. Bairro de bom acesso à rodovia.',
  '14406-700', 'Rua Aviador Willy', '124', 'Jardim Aeroporto',
  'Franca', 'SP', 190.00, 140.00, 3, 0, 1,
  1, false, false, true, false, false, true,
  false, false, false, false, false, false,
  true, false, false, false,
  'Marcos de Oliveira Dias', '(16) 95333-1043', 6.0,
  false, true, true, true,
  'c1000000-0000-0000-0000-000000000003', 67, 4
),

-- 44. Apartamento cobertura - Jardim Consolação
(
  'IML-044', 'Cobertura 3 Suítes com Churrasqueira - Jardim Consolação', 'cobertura', 'venda', 'disponivel',
  780000.00, true, 900.00, 3900.00,
  'Cobertura duplex no Jardim Consolação, 3 suítes com armários, sala integrada de 60m², terraço de 80m² com churrasqueira e espaço gourmet, vista para o bairro. Cozinha americana. 3 vagas de garagem. Andar exclusivo.',
  '14408-130', 'Rua Emílio de Menezes', '2200', 'Jardim Consolação',
  'Franca', 'SP', 230.00, 230.00, 3, 3, 4,
  3, false, true, false, false, true, true,
  true, true, true, true, true, true,
  true, false, false, true,
  'Berenice Almeida Neto', '(16) 95222-1044', 6.0,
  true, true, true, true,
  'c2000000-0000-0000-0000-000000000004', 198, 27
),

-- 45. Casa popular - Jardim Esperança
(
  'IML-045', 'Casa Popular 2 Quartos - Jardim Esperança', 'casa', 'venda', 'disponivel',
  165000.00, false, NULL, 825.00,
  'Casa popular no Jardim Esperança, 2 dormitórios, sala, cozinha, banheiro e área de serviço. Documentação em dia. Aceita FGTS. Boa oportunidade para quem deseja sair do aluguel.',
  '14405-600', 'Rua Boa Esperança', '678', 'Jardim Esperança',
  'Franca', 'SP', 130.00, 75.00, 2, 0, 1,
  0, false, false, false, false, false, true,
  false, false, false, false, false, false,
  false, false, false, false,
  'Eunice Barbosa Cunha', '(16) 95111-1045', 4.0,
  false, true, true, true,
  'c1000000-0000-0000-0000-000000000003', 143, 19
),

-- 46. Conjunto residencial - Cond. Fechado
(
  'IML-046', 'Casa em Condomínio 4 Suítes - Cond. Jardins de Franca', 'casa', 'venda', 'disponivel',
  1450000.00, true, 1800.00, 7250.00,
  'Magnífica residência no Condomínio Jardins de Franca, o mais valorizado da cidade. 4 suítes, cozinha gourmet com ilha, sala de cinema, escritório, sala de jogos, piscina aquecida, deck, sauna, jardim paisagístico, garage para 4 carros. Área total: 800m².',
  '14409-400', 'Alameda dos Flamboyants', '45', 'Jardim Paulistano',
  'Franca', 'SP', 800.00, 600.00, 4, 4, 6,
  4, true, true, true, true, false, true,
  true, true, true, true, true, false,
  true, false, true, true,
  'Empresa Construtora Jardins', '(16) 94999-1046', 5.0,
  true, true, true, true,
  'c2000000-0000-0000-0000-000000000004', 567, 123
),

-- 47. Apartamento - Cidade Nova (locação)
(
  'IML-047', 'Apartamento 2 Quartos - Cidade Nova', 'apartamento', 'locacao', 'disponivel',
  1750.00, false, 290.00, 140.00,
  'Apartamento 2 dormitórios para locação na Cidade Nova. Sala, varanda, cozinha, área de serviço, 1 banheiro e 1 vaga de garagem. Condomínio com portaria e lazer básico.',
  '14401-200', 'Rua Lauro Gomes', '1100', 'Cidade Nova',
  'Franca', 'SP', 68.00, 68.00, 2, 0, 1,
  1, false, false, false, false, true, true,
  false, true, true, true, true, false,
  true, false, false, false,
  'Waldir Santos Freitas', '(16) 94888-1047', 8.0,
  false, true, true, true,
  'c1000000-0000-0000-0000-000000000003', 64, 5
),

-- 48. Terreno - São José (grande)
(
  'IML-048', 'Área 2.400m² - São José, Franca', 'terreno', 'venda', 'disponivel',
  480000.00, true, NULL, 2400.00,
  'Grande área no São José com 2.400m², plana e regular. Excelente potencial para loteamento ou pequeno empreendimento habitacional. Próximo a todas as facilidades do bairro. Documentação em ordem.',
  '14405-450', 'Rua Sebastião de Lacerda', '0', 'São José',
  'Franca', 'SP', 2400.00, NULL, 0, 0, 0,
  0, false, false, false, false, false, false,
  false, false, false, false, false, false,
  false, false, false, false,
  'Sindicato Rural de Franca', '(16) 94777-1048', 5.0,
  false, true, true, false,
  'c2000000-0000-0000-0000-000000000004', 78, 12
),

-- 49. Casa - Vila Mineiral (locação)
(
  'IML-049', 'Casa 2 Quartos para Locação - Vila Mineiral', 'casa', 'locacao', 'disponivel',
  1800.00, false, NULL, 160.00,
  'Casa simples para locação na Vila Mineiral. 2 dormitórios, sala, cozinha, banheiro e área de serviço. Próxima à UNIFRAN e ao comércio local. Ideal para estudantes ou casal.',
  '14404-250', 'Rua Piauí', '567', 'Vila Mineiral',
  'Franca', 'SP', 100.00, 80.00, 2, 0, 1,
  1, false, false, false, false, false, true,
  false, false, false, false, false, false,
  true, false, false, false,
  'Sebastiana Torres Lima', '(16) 94666-1049', 8.0,
  false, true, false, true,
  'c1000000-0000-0000-0000-000000000003', 51, 3
),

-- 50. Casa - Jardim Paulistano (vendida como exemplo)
(
  'IML-050', 'Casa 3 Suítes - Jardim Paulistano', 'casa', 'venda', 'vendido',
  720000.00, false, NULL, 3600.00,
  'Casa no Jardim Paulistano com 3 suítes, área gourmet, piscina e 3 vagas. Imóvel já vendido, mantido para referência de mercado.',
  '14409-300', 'Rua das Rosas', '890', 'Jardim Paulistano',
  'Franca', 'SP', 340.00, 280.00, 3, 3, 4,
  3, true, true, true, true, false, true,
  true, true, true, true, true, false,
  true, false, true, true,
  'Nilton Cesar Rodrigues', '(16) 94555-1050', 6.0,
  false, false, false, false,
  'c2000000-0000-0000-0000-000000000004', 234, 45
);

-- ============================================================
-- CLIENTS (10 clients)
-- ============================================================

INSERT INTO clients (
  nome, email, telefone, whatsapp, cpf, data_nascimento,
  estado_civil, profissao, renda_mensal,
  interesse_tipo, tipos_preferidos, cidades_preferidas,
  preco_min, preco_max, quartos_min,
  status, temperatura, origem,
  corretor_id, notas, tags
) VALUES
(
  'Márcio Augusto Ferreira',
  'marcio.ferreira@gmail.com',
  '(16) 99100-1001',
  '(16) 99100-1001',
  '123.456.789-00',
  '1985-03-15',
  'casado',
  'Empresário',
  15000.00,
  'venda',
  ARRAY['casa'::property_type],
  ARRAY['Franca'],
  500000.00, 900000.00, 3,
  'ativo', 'hot', 'indicacao',
  'c1000000-0000-0000-0000-000000000003',
  'Cliente indicado pelo Carlos Silva. Procura casa de alto padrão no Jardim Paulistano ou Jardim Consolação. Tem pressa.',
  ARRAY['alto padrão', 'urgente', 'indicação']
),
(
  'Juliana Cristina Oliveira',
  'juliana.oliveira@outlook.com',
  '(16) 99200-2002',
  '(16) 99200-2002',
  '234.567.890-11',
  '1990-07-22',
  'solteira',
  'Médica',
  12000.00,
  'venda',
  ARRAY['apartamento'::property_type],
  ARRAY['Franca'],
  350000.00, 600000.00, 2,
  'ativo', 'warm', 'portal',
  'c1000000-0000-0000-0000-000000000003',
  'Médica, busca apartamento perto do Hospital Unimed. Prefere 2 ou 3 quartos com suíte.',
  ARRAY['apartamento', 'hospital', 'profissional saúde']
),
(
  'Roberto Carlos Mendes',
  'roberto.mendes@yahoo.com.br',
  '(16) 99300-3003',
  '(16) 99300-3003',
  '345.678.901-22',
  '1975-11-08',
  'divorciado',
  'Engenheiro Civil',
  18000.00,
  'venda',
  ARRAY['terreno'::property_type, 'casa'::property_type],
  ARRAY['Franca'],
  200000.00, 600000.00, 0,
  'ativo', 'warm', 'site',
  'c2000000-0000-0000-0000-000000000004',
  'Engenheiro quer terreno para construir casa própria no Jardim América ou Jardim Consolação.',
  ARRAY['construção', 'terreno', 'engenheiro']
),
(
  'Patrícia Souza Lima',
  'patricia.lima@gmail.com',
  '(16) 99400-4004',
  '(16) 99400-4004',
  '456.789.012-33',
  '1988-05-30',
  'casada',
  'Advogada',
  10000.00,
  'locacao',
  ARRAY['apartamento'::property_type],
  ARRAY['Franca'],
  2000.00, 3500.00, 2,
  'ativo', 'hot', 'whatsapp',
  'c2000000-0000-0000-0000-000000000004',
  'Advogada transferida para Franca, precisa de apartamento com urgência. Tem 2 filhos e cachorro pequeno.',
  ARRAY['locação', 'pet friendly', 'urgente', 'transferência']
),
(
  'Henrique Alves Batista',
  'henrique.batista@empresa.com.br',
  '(16) 99500-5005',
  '(16) 99500-5005',
  '567.890.123-44',
  '1970-09-14',
  'casado',
  'Diretor Financeiro',
  45000.00,
  'venda',
  ARRAY['chacara'::property_type, 'casa'::property_type],
  ARRAY['Franca', 'Rifaina'],
  800000.00, 2000000.00, 4,
  'ativo', 'hot', 'indicacao',
  'c1000000-0000-0000-0000-000000000003',
  'Diretor quer chácara de luxo para lazer ou mansão na cidade. Alto poder aquisitivo.',
  ARRAY['alto padrão', 'chácara', 'lazer', 'indicação VIP']
),
(
  'Camila Rodrigues Torres',
  'camila.torres@gmail.com',
  '(16) 99600-6006',
  '(16) 99600-6006',
  '678.901.234-55',
  '1995-01-25',
  'solteira',
  'Professora',
  4500.00,
  'locacao',
  ARRAY['apartamento'::property_type, 'casa'::property_type],
  ARRAY['Franca'],
  1200.00, 2000.00, 1,
  'ativo', 'cold', 'instagram',
  'c1000000-0000-0000-0000-000000000003',
  'Professora do ensino básico, orçamento limitado. Busca algo simples no centro ou perto de escolas.',
  ARRAY['locação', 'orçamento baixo', 'centro']
),
(
  'Felipe Costa Nunes',
  'felipe.nunes@hotmail.com',
  '(16) 99700-7007',
  '(16) 99700-7007',
  '789.012.345-66',
  '1982-12-03',
  'casado',
  'Corretor de Seguros',
  8000.00,
  'venda',
  ARRAY['casa'::property_type],
  ARRAY['Franca'],
  300000.00, 500000.00, 3,
  'ativo', 'warm', 'facebook',
  'c2000000-0000-0000-0000-000000000004',
  'Comprador de primeira viagem, quer financiar. Renda de R$8k, pode pagar parcela de R$2,5k.',
  ARRAY['financiamento', 'FGTS', 'primeira compra']
),
(
  'Luciana Faria Gomes',
  'luciana.gomes@gmail.com',
  '(16) 99800-8008',
  '(16) 99800-8008',
  '890.123.456-77',
  '1968-04-18',
  'viúva',
  'Aposentada',
  5500.00,
  'venda',
  ARRAY['apartamento'::property_type],
  ARRAY['Franca'],
  200000.00, 400000.00, 2,
  'ativo', 'warm', 'outros',
  'c1000000-0000-0000-0000-000000000003',
  'Viúva quer sair de casa grande, busca apartamento menor e mais fácil de manter. Quer elevador.',
  ARRAY['downsizing', 'acessibilidade', 'elevador']
),
(
  'Tiago Morais Andrade',
  'tiago.andrade@startupfranca.com',
  '(16) 99900-9009',
  '(16) 99900-9009',
  '901.234.567-88',
  '1992-08-11',
  'solteiro',
  'CEO Startup',
  20000.00,
  'locacao',
  ARRAY['sala'::property_type, 'comercial'::property_type],
  ARRAY['Franca'],
  3000.00, 8000.00, 0,
  'ativo', 'hot', 'google',
  'c2000000-0000-0000-0000-000000000004',
  'Startup em expansão, precisa de sala comercial no centro ou perto do centro. 100 a 200m². Busca ambiente moderno.',
  ARRAY['comercial', 'startup', 'sala', 'expansão']
),
(
  'Marta Silva Carvalho',
  'marta.carvalho@uol.com.br',
  '(16) 98900-0010',
  '(16) 98900-0010',
  '012.345.678-99',
  '1978-06-29',
  'casada',
  'Pedagoga',
  6000.00,
  'venda',
  ARRAY['casa'::property_type],
  ARRAY['Franca'],
  250000.00, 400000.00, 3,
  'convertido', 'warm', 'site',
  'c1000000-0000-0000-0000-000000000003',
  'Cliente convertida — comprou casa no IML-016. Pode indicar outros clientes.',
  ARRAY['convertida', 'indicação potencial']
);

-- ============================================================
-- LEADS (10 leads)
-- ============================================================

INSERT INTO leads (
  nome, email, telefone, mensagem,
  score, temperatura, origem,
  ai_resumo, ai_tags,
  corretor_id, follow_up_data
) VALUES
(
  'Anderson Luiz Prado',
  'anderson.prado@gmail.com',
  '(16) 98100-0101',
  'Tenho interesse em casas no Jardim Paulistano com piscina. Tenho budget de até R$900 mil.',
  85, 'hot', 'portal',
  'Interessado em casa de alto padrão no Jardim Paulistano, orçamento R$900k, provável comprador imediato.',
  ARRAY['alto padrão', 'jardim paulistano', 'piscina', 'compra'],
  'c1000000-0000-0000-0000-000000000003',
  NOW() + INTERVAL '1 day'
),
(
  'Simone Aparecida Vieira',
  'simone.vieira@hotmail.com',
  '(16) 98200-0202',
  'Preciso de apartamento para alugar, 2 quartos, até R$2.000 com condomínio. Tenho cachorro.',
  72, 'warm', 'whatsapp',
  'Quer apartamento para locação, 2 quartos, orçamento R$2k, tem pet.',
  ARRAY['locação', 'apartamento', 'pet friendly', '2 quartos'],
  'c1000000-0000-0000-0000-000000000003',
  NOW() + INTERVAL '2 days'
),
(
  'Bruno Ferreira Matos',
  'bruno.matos@gmail.com',
  '(16) 98300-0303',
  'Quero terreno para construir casa. Bairro São José ou Jardim América. Até R$250k.',
  60, 'warm', 'site',
  'Busca terreno para construção em São José ou Jardim América, orçamento R$250k.',
  ARRAY['terreno', 'construção', 'são josé', 'jardim américa'],
  'c2000000-0000-0000-0000-000000000004',
  NOW() + INTERVAL '3 days'
),
(
  'Rosana Lima Cunha',
  'rosana.cunha@outlook.com',
  '(16) 98400-0404',
  'Interesse na chácara IML-017 em Rifaina. Posso visitar no próximo fim de semana?',
  90, 'hot', 'portal',
  'Interesse direto na chácara em Rifaina, quer visitar. Lead quente.',
  ARRAY['chácara', 'rifaina', 'visita', 'lazer'],
  'c2000000-0000-0000-0000-000000000004',
  NOW() + INTERVAL '5 days'
),
(
  'Eduardo Costa Lins',
  'eduardo.lins@empresa.com',
  '(16) 98500-0505',
  'Procuro galpão de pelo menos 500m² para locação no distrito industrial.',
  75, 'warm', 'google',
  'Empresa procura galpão 500m²+ no distrito industrial de Franca.',
  ARRAY['galpão', 'comercial', 'distrito industrial', 'locação'],
  'c2000000-0000-0000-0000-000000000004',
  NOW() + INTERVAL '2 days'
),
(
  'Amanda Souza Ribeiro',
  NULL,
  '(16) 98600-0606',
  'Vi no Instagram a casa IML-008 no Jardim Consolação. Tenho interesse!',
  65, 'warm', 'instagram',
  'Lead do Instagram interessada na IML-008, Jardim Consolação.',
  ARRAY['instagram', 'jardim consolação', 'casa', 'interesse'],
  'c1000000-0000-0000-0000-000000000003',
  NOW() + INTERVAL '1 day'
),
(
  'José Antônio Carvalho',
  'jose.carvalho@gmail.com',
  '(16) 98700-0707',
  'Busco imóvel comercial para minha farmácia. Preciso de ponto em avenida movimentada.',
  55, 'cold', 'facebook',
  'Farmacêutico quer ponto comercial em avenida movimentada.',
  ARRAY['comercial', 'farmácia', 'avenida', 'locação'],
  'c2000000-0000-0000-0000-000000000004',
  NOW() + INTERVAL '7 days'
),
(
  'Carla Mendes Pires',
  'carla.pires@yahoo.com.br',
  '(16) 98800-0808',
  'Meu marido e eu queremos casa de 3 quartos para comprar. Temos FGTS de R$40k e renda de R$10k.',
  78, 'warm', 'site',
  'Casal quer comprar casa 3 quartos, FGTS R$40k, renda R$10k, bom perfil para financiamento.',
  ARRAY['financiamento', 'FGTS', 'casal', '3 quartos'],
  'c1000000-0000-0000-0000-000000000003',
  NOW() + INTERVAL '2 days'
),
(
  'Thiago Barros Figueiredo',
  'thiago.figueiredo@hotmail.com',
  '(16) 98900-0909',
  'Tenho interesse em apartamento de alto padrão, 3 ou 4 quartos, no Jardim Paulistano.',
  82, 'hot', 'indicacao',
  'Indicação de corretor parceiro, alto padrão, Jardim Paulistano, 3-4 quartos.',
  ARRAY['alto padrão', 'jardim paulistano', 'apartamento', 'indicação'],
  'c2000000-0000-0000-0000-000000000004',
  NOW() + INTERVAL '1 day'
),
(
  'Vanessa Oliveira Teles',
  'vanessa.teles@gmail.com',
  '(16) 97900-0010',
  'Procuro kitnet ou studio para alugar, orçamento de até R$1.500, precisa de vaga de garagem.',
  40, 'cold', 'site',
  'Jovem busca studio ou kitnet para locação, orçamento R$1.500, precisa de vaga.',
  ARRAY['studio', 'locação', 'vaga', 'orçamento baixo'],
  'c1000000-0000-0000-0000-000000000003',
  NOW() + INTERVAL '10 days'
);

-- ============================================================
-- NEGOTIATIONS (5 negotiations)
-- ============================================================

INSERT INTO negotiations (
  cliente_id, imovel_id, corretor_id,
  stage, prioridade,
  valor_proposta, valor_final,
  comissao_percentual, comissao_valor,
  proxima_acao, proxima_acao_data,
  notas
)
SELECT
  c.id AS cliente_id,
  p.id AS imovel_id,
  'c1000000-0000-0000-0000-000000000003'::UUID AS corretor_id,
  'visita'::negotiation_stage AS stage,
  'alta'::priority_level AS prioridade,
  820000.00 AS valor_proposta,
  NULL AS valor_final,
  6.0 AS comissao_percentual,
  49200.00 AS comissao_valor,
  'Enviar documentação do imóvel para análise do cliente' AS proxima_acao,
  NOW() + INTERVAL '2 days' AS proxima_acao_data,
  'Cliente visitou o imóvel e ficou muito satisfeito. Está negociando o valor. Pretende fazer proposta formal esta semana.' AS notas
FROM clients c, properties p
WHERE c.nome = 'Márcio Augusto Ferreira'
  AND p.codigo = 'IML-001'
LIMIT 1;

INSERT INTO negotiations (
  cliente_id, imovel_id, corretor_id,
  stage, prioridade,
  valor_proposta, valor_final,
  comissao_percentual, comissao_valor,
  proxima_acao, proxima_acao_data,
  notas
)
SELECT
  c.id AS cliente_id,
  p.id AS imovel_id,
  'c1000000-0000-0000-0000-000000000003'::UUID AS corretor_id,
  'proposta'::negotiation_stage AS stage,
  'media'::priority_level AS prioridade,
  370000.00 AS valor_proposta,
  NULL AS valor_final,
  6.0 AS comissao_percentual,
  22200.00 AS comissao_valor,
  'Aguardar resposta do proprietário sobre contraproposta' AS proxima_acao,
  NOW() + INTERVAL '3 days' AS proxima_acao_data,
  'Proposta enviada ao proprietário. Cliente quer pagar R$370k, proprietário pediu R$390k. Negociando.' AS notas
FROM clients c, properties p
WHERE c.nome = 'Juliana Cristina Oliveira'
  AND p.codigo = 'IML-002'
LIMIT 1;

INSERT INTO negotiations (
  cliente_id, imovel_id, corretor_id,
  stage, prioridade,
  valor_proposta, valor_final,
  comissao_percentual, comissao_valor,
  proxima_acao, proxima_acao_data,
  notas
)
SELECT
  c.id AS cliente_id,
  p.id AS imovel_id,
  'c2000000-0000-0000-0000-000000000004'::UUID AS corretor_id,
  'qualificacao'::negotiation_stage AS stage,
  'media'::priority_level AS prioridade,
  190000.00 AS valor_proposta,
  NULL AS valor_final,
  5.0 AS comissao_percentual,
  9500.00 AS comissao_valor,
  'Agendar visita ao terreno com o cliente' AS proxima_acao,
  NOW() + INTERVAL '4 days' AS proxima_acao_data,
  'Engenheiro qualificado, verificando documentação do terreno antes de fazer proposta. Interesse real.' AS notas
FROM clients c, properties p
WHERE c.nome = 'Roberto Carlos Mendes'
  AND p.codigo = 'IML-004'
LIMIT 1;

INSERT INTO negotiations (
  cliente_id, imovel_id, corretor_id,
  stage, prioridade,
  valor_proposta, valor_final,
  comissao_percentual, comissao_valor,
  proxima_acao, proxima_acao_data,
  notas,
  data_fechamento
)
SELECT
  c.id AS cliente_id,
  p.id AS imovel_id,
  'c1000000-0000-0000-0000-000000000003'::UUID AS corretor_id,
  'fechamento'::negotiation_stage AS stage,
  'baixa'::priority_level AS prioridade,
  280000.00 AS valor_proposta,
  280000.00 AS valor_final,
  6.0 AS comissao_percentual,
  16800.00 AS comissao_valor,
  'Acompanhar lavratura de escritura' AS proxima_acao,
  NOW() + INTERVAL '15 days' AS proxima_acao_data,
  'Negociação encerrada com sucesso. Contrato assinado. Aguardando liberação do financiamento Caixa.' AS notas,
  NOW() - INTERVAL '5 days' AS data_fechamento
FROM clients c, properties p
WHERE c.nome = 'Marta Silva Carvalho'
  AND p.codigo = 'IML-016'
LIMIT 1;

INSERT INTO negotiations (
  cliente_id, imovel_id, corretor_id,
  stage, prioridade,
  valor_proposta,
  comissao_percentual,
  proxima_acao, proxima_acao_data,
  notas
)
SELECT
  c.id AS cliente_id,
  p.id AS imovel_id,
  'c2000000-0000-0000-0000-000000000004'::UUID AS corretor_id,
  'documentacao'::negotiation_stage AS stage,
  'alta'::priority_level AS prioridade,
  1150000.00 AS valor_proposta,
  5.0 AS comissao_percentual,
  'Revisar contrato com advogado do cliente' AS proxima_acao,
  NOW() + INTERVAL '1 day' AS proxima_acao_data,
  'Chácara em Rifaina. Cliente interessadíssimo, passando documentação para análise. Muito próximo de fechar.' AS notas
FROM clients c, properties p
WHERE c.nome = 'Henrique Alves Batista'
  AND p.codigo = 'IML-017'
LIMIT 1;

-- ============================================================
-- APPOINTMENTS (5 appointments)
-- ============================================================

INSERT INTO appointments (
  tipo, titulo,
  cliente_id, imovel_id, corretor_id,
  data_inicio, data_fim,
  local, observacoes, status,
  lembrete_whatsapp, lembrete_email
)
SELECT
  'visita', 'Visita à Casa IML-001 - Jardim Paulistano',
  c.id, p.id,
  'c1000000-0000-0000-0000-000000000003'::UUID,
  NOW() + INTERVAL '1 day 10 hours',
  NOW() + INTERVAL '1 day 11 hours',
  'Rua das Acácias, 245 - Jardim Paulistano, Franca SP',
  'Cliente Márcio vai com a esposa. Preparar pasta com toda a documentação e fotos do imóvel.',
  'confirmado',
  true, true
FROM clients c, properties p
WHERE c.nome = 'Márcio Augusto Ferreira' AND p.codigo = 'IML-001'
LIMIT 1;

INSERT INTO appointments (
  tipo, titulo,
  cliente_id, imovel_id, corretor_id,
  data_inicio, data_fim,
  local, observacoes, status,
  lembrete_whatsapp, lembrete_email
)
SELECT
  'visita', 'Visita ao Apartamento IML-021 - Jardim Aeroporto',
  c.id, p.id,
  'c1000000-0000-0000-0000-000000000003'::UUID,
  NOW() + INTERVAL '2 days 14 hours',
  NOW() + INTERVAL '2 days 15 hours',
  'Rua Humberto de Campos, 1540 - Jardim Aeroporto, Franca SP',
  'Segunda visita da Juliana. Levar simulação de financiamento.',
  'agendado',
  true, false
FROM clients c, properties p
WHERE c.nome = 'Juliana Cristina Oliveira' AND p.codigo = 'IML-021'
LIMIT 1;

INSERT INTO appointments (
  tipo, titulo,
  cliente_id, corretor_id,
  data_inicio, data_fim,
  local, observacoes, status,
  lembrete_whatsapp, lembrete_email
)
SELECT
  'reuniao', 'Reunião de Qualificação - Roberto Mendes',
  c.id,
  'c2000000-0000-0000-0000-000000000004'::UUID,
  NOW() + INTERVAL '3 days 9 hours',
  NOW() + INTERVAL '3 days 10 hours',
  'Escritório Imobiliária Lemos - Av. Major Nicácio',
  'Reunião para entender melhor as necessidades do Roberto e apresentar portfólio de terrenos.',
  'agendado',
  true, true
FROM clients c
WHERE c.nome = 'Roberto Carlos Mendes'
LIMIT 1;

INSERT INTO appointments (
  tipo, titulo,
  cliente_id, imovel_id, corretor_id,
  data_inicio, data_fim,
  local, observacoes, status,
  lembrete_whatsapp, lembrete_email
)
SELECT
  'visita', 'Visita Chácara Rifaina - Henrique Batista',
  c.id, p.id,
  'c2000000-0000-0000-0000-000000000004'::UUID,
  NOW() + INTERVAL '5 days 8 hours',
  NOW() + INTERVAL '5 days 13 hours',
  'Estrada do Lago, Km 3 - Zona Rural, Rifaina SP',
  'Visita completa à chácara. Saída às 8h da imobiliária. Levar fotos de outras chácaras como comparativos.',
  'confirmado',
  true, true
FROM clients c, properties p
WHERE c.nome = 'Henrique Alves Batista' AND p.codigo = 'IML-017'
LIMIT 1;

INSERT INTO appointments (
  tipo, titulo,
  cliente_id, imovel_id, corretor_id,
  data_inicio, data_fim,
  local, observacoes, status,
  lembrete_whatsapp, lembrete_email
)
SELECT
  'assinatura', 'Assinatura Contrato - Casa IML-016 - Marta Carvalho',
  c.id, p.id,
  'c1000000-0000-0000-0000-000000000003'::UUID,
  NOW() + INTERVAL '7 days 15 hours',
  NOW() + INTERVAL '7 days 17 hours',
  'Cartório Oficial de Registro de Imóveis - Franca SP',
  'Assinatura da escritura. Confirmar presença de comprador, vendedor e testemunhas. Levar documentos originais.',
  'agendado',
  true, true
FROM clients c, properties p
WHERE c.nome = 'Marta Silva Carvalho' AND p.codigo = 'IML-016'
LIMIT 1;

-- ============================================================
-- CMS - Banners, Pages, Testimonials
-- ============================================================

INSERT INTO cms_banners (titulo, subtitulo, link, botao_texto, ativo, ordem) VALUES
  ('Encontre o Imóvel dos Seus Sonhos', 'Mais de 50 imóveis selecionados em Franca e região', '/imoveis', 'Ver Imóveis', true, 1),
  ('Venda seu Imóvel Conosco', 'Avaliação gratuita e marketing completo para o seu imóvel', '/avaliacao', 'Saiba Mais', true, 2),
  ('Financiamento Facilitado', 'Simulação gratuita de financiamento com as melhores condições', '/financiamento', 'Simular Agora', true, 3);

INSERT INTO cms_pages (slug, titulo, conteudo, meta_titulo, meta_descricao, publicado) VALUES
  ('sobre', 'Sobre a Imobiliária Lemos', 'A Imobiliária Lemos atua há mais de 20 anos no mercado imobiliário de Franca e região, com foco em excelência e transparência em cada negociação.', 'Sobre Nós - Imobiliária Lemos', 'Conheça a história e os valores da Imobiliária Lemos, referência em imóveis em Franca SP.', true),
  ('contato', 'Entre em Contato', 'Estamos sempre disponíveis para atendê-lo. Entre em contato conosco por telefone, WhatsApp ou visite nossa loja.', 'Contato - Imobiliária Lemos', 'Entre em contato com a Imobiliária Lemos. Atendimento por telefone, WhatsApp e presencial em Franca SP.', true),
  ('politica-privacidade', 'Política de Privacidade', 'Nossa política de privacidade descreve como coletamos, usamos e protegemos suas informações pessoais.', 'Política de Privacidade - Imobiliária Lemos', 'Política de privacidade da Imobiliária Lemos.', true);

INSERT INTO cms_testimonials (nome, texto, nota, imovel_tipo, publicado, ordem) VALUES
  ('Márcio e Daniela F.', 'Excelente atendimento! O corretor Rafael nos ajudou a encontrar a casa perfeita no Jardim Paulistano. Todo o processo foi transparente e ágil. Super recomendamos!', 5, 'casa', true, 1),
  ('Juliana M.', 'Encontrei meu apartamento dos sonhos graças à equipe da Imobiliária Lemos. Profissionalismo e dedicação do início ao fim. Nota 10!', 5, 'apartamento', true, 2),
  ('Roberto C.', 'Ótima experiência na compra do meu terreno. A Fernanda foi muito atenciosa e explicou tudo sobre a documentação. Negócio seguro e rápido.', 5, 'terreno', true, 3),
  ('Família Batista', 'Compramos nossa chácara em Rifaina com a ajuda da Imobiliária Lemos. Serviço impecável, suporte total na documentação e financiamento. Voltaríamos a negociar com eles.', 5, 'chacara', true, 4),
  ('Patrícia S.', 'Muito satisfeita com o aluguel do apartamento. Processo rápido e sem burocracia excessiva. A Fernanda entendeu exatamente o que eu precisava.', 4, 'apartamento', true, 5);

-- ============================================================
-- Activity Log (initial entries)
-- ============================================================

INSERT INTO activity_log (user_id, tipo, entidade, descricao, metadata) VALUES
  ('a1000000-0000-0000-0000-000000000001'::UUID, 'login', 'sistema', 'Usuário Carlos Lemos realizou login', '{"ip": "127.0.0.1"}'::JSONB),
  ('c1000000-0000-0000-0000-000000000003'::UUID, 'create', 'imovel', 'Imóvel IML-001 cadastrado no sistema', '{"codigo": "IML-001"}'::JSONB),
  ('c2000000-0000-0000-0000-000000000004'::UUID, 'create', 'imovel', 'Imóvel IML-005 cadastrado no sistema', '{"codigo": "IML-005"}'::JSONB),
  ('c1000000-0000-0000-0000-000000000003'::UUID, 'create', 'negociacao', 'Nova negociação iniciada com Márcio Ferreira', '{"stage": "visita"}'::JSONB),
  ('a1000000-0000-0000-0000-000000000001'::UUID, 'update', 'imovel', 'Imóvel IML-050 marcado como vendido', '{"codigo": "IML-050", "status": "vendido"}'::JSONB);

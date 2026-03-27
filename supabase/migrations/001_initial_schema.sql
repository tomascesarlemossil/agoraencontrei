-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Enums
CREATE TYPE property_type AS ENUM ('casa', 'apartamento', 'terreno', 'chacara', 'comercial', 'sala', 'galpao', 'studio', 'cobertura', 'flat');
CREATE TYPE property_purpose AS ENUM ('venda', 'locacao', 'temporada');
CREATE TYPE property_status AS ENUM ('disponivel', 'reservado', 'vendido', 'locado', 'inativo', 'em_reforma');
CREATE TYPE negotiation_stage AS ENUM ('novo_lead', 'qualificacao', 'visita', 'proposta', 'documentacao', 'fechamento', 'cancelado');
CREATE TYPE lead_temperature AS ENUM ('hot', 'warm', 'cold');
CREATE TYPE contract_type AS ENUM ('compra_venda', 'locacao', 'temporada', 'exclusividade', 'cessao');
CREATE TYPE user_role AS ENUM ('admin', 'gerente', 'corretor');
CREATE TYPE financing_stage AS ENUM ('simulacao', 'pre_analise', 'documentacao', 'analise_banco', 'aprovado', 'assinatura', 'registro', 'cancelado');
CREATE TYPE message_channel AS ENUM ('email', 'whatsapp', 'sms');
CREATE TYPE client_status AS ENUM ('ativo', 'inativo', 'convertido', 'desistente');
CREATE TYPE lead_origin AS ENUM ('site', 'whatsapp', 'indicacao', 'portal', 'instagram', 'facebook', 'google', 'outros');
CREATE TYPE priority_level AS ENUM ('baixa', 'media', 'alta', 'urgente');

-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  creci TEXT,
  avatar_url TEXT,
  bio TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User roles table (separate from profiles)
CREATE TABLE user_roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL DEFAULT 'corretor',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Properties table (100+ fields)
CREATE TABLE properties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  titulo TEXT NOT NULL,
  tipo property_type NOT NULL,
  finalidade property_purpose NOT NULL,
  status property_status DEFAULT 'disponivel',
  preco DECIMAL(12,2) NOT NULL,
  preco_negociavel BOOLEAN DEFAULT false,
  preco_condominio DECIMAL(10,2),
  preco_iptu DECIMAL(10,2),
  descricao TEXT,

  -- Endereço
  cep TEXT,
  rua TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT NOT NULL DEFAULT 'Franca',
  estado TEXT DEFAULT 'SP',
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),

  -- Características
  area_total DECIMAL(10,2),
  area_construida DECIMAL(10,2),
  area_terreno DECIMAL(10,2),
  quartos INTEGER DEFAULT 0,
  suites INTEGER DEFAULT 0,
  banheiros INTEGER DEFAULT 0,
  vagas INTEGER DEFAULT 0,
  andar INTEGER,
  total_andares INTEGER,

  -- Amenidades (boolean fields)
  piscina BOOLEAN DEFAULT false,
  churrasqueira BOOLEAN DEFAULT false,
  jardim BOOLEAN DEFAULT false,
  varanda BOOLEAN DEFAULT false,
  sacada BOOLEAN DEFAULT false,
  area_servico BOOLEAN DEFAULT false,
  despensa BOOLEAN DEFAULT false,
  quarto_empregada BOOLEAN DEFAULT false,
  academia BOOLEAN DEFAULT false,
  salao_festas BOOLEAN DEFAULT false,
  playground BOOLEAN DEFAULT false,
  quadra BOOLEAN DEFAULT false,
  ar_condicionado BOOLEAN DEFAULT false,
  aquecimento_solar BOOLEAN DEFAULT false,
  alarme BOOLEAN DEFAULT false,
  portaria_24h BOOLEAN DEFAULT false,
  interfone BOOLEAN DEFAULT false,
  cerca_eletrica BOOLEAN DEFAULT false,
  cameras BOOLEAN DEFAULT false,
  elevador BOOLEAN DEFAULT false,
  acessibilidade BOOLEAN DEFAULT false,
  pet_friendly BOOLEAN DEFAULT false,
  mobiliado BOOLEAN DEFAULT false,
  semi_mobiliado BOOLEAN DEFAULT false,
  condominio_fechado BOOLEAN DEFAULT false,
  fibra_optica BOOLEAN DEFAULT false,
  gas_encanado BOOLEAN DEFAULT false,

  -- Fotos
  fotos JSONB DEFAULT '[]',
  foto_principal TEXT,
  video_url TEXT,
  tour_virtual_url TEXT,

  -- Proprietário
  proprietario_nome TEXT,
  proprietario_telefone TEXT,
  proprietario_email TEXT,
  proprietario_cpf TEXT,

  -- Comissão
  comissao_percentual DECIMAL(5,2) DEFAULT 6.0,
  comissao_valor DECIMAL(10,2),

  -- SEO
  seo_titulo TEXT,
  seo_descricao TEXT,
  seo_palavras_chave TEXT[],
  slug TEXT UNIQUE,

  -- Publicação em portais
  publicar_site BOOLEAN DEFAULT true,
  publicar_vivareal BOOLEAN DEFAULT false,
  publicar_zap BOOLEAN DEFAULT false,
  publicar_olx BOOLEAN DEFAULT false,
  publicar_imovelweb BOOLEAN DEFAULT false,

  -- IA
  investment_score DECIMAL(4,2),
  investment_analysis JSONB,

  -- Meta
  corretor_id UUID REFERENCES auth.users(id),
  destaque BOOLEAN DEFAULT false,
  visualizacoes INTEGER DEFAULT 0,
  favoritos INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Full text search index
CREATE INDEX properties_search_idx ON properties USING gin(
  to_tsvector('portuguese', unaccent(coalesce(titulo,'') || ' ' || coalesce(descricao,'') || ' ' || coalesce(bairro,'') || ' ' || coalesce(cidade,'')))
);
CREATE INDEX properties_cidade_idx ON properties(cidade);
CREATE INDEX properties_tipo_idx ON properties(tipo);
CREATE INDEX properties_finalidade_idx ON properties(finalidade);
CREATE INDEX properties_status_idx ON properties(status);
CREATE INDEX properties_preco_idx ON properties(preco);

-- Clients table
CREATE TABLE clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  whatsapp TEXT,
  cpf TEXT,
  rg TEXT,
  data_nascimento DATE,
  estado_civil TEXT,
  profissao TEXT,
  renda_mensal DECIMAL(10,2),

  -- Preferences
  interesse_tipo property_purpose,
  tipos_preferidos property_type[],
  cidades_preferidas TEXT[],
  preco_min DECIMAL(12,2),
  preco_max DECIMAL(12,2),
  quartos_min INTEGER,
  amenidades_preferidas TEXT[],

  -- CRM
  status client_status DEFAULT 'ativo',
  temperatura lead_temperature DEFAULT 'warm',
  origem lead_origin DEFAULT 'site',
  origem_utm JSONB,
  corretor_id UUID REFERENCES auth.users(id),

  notas TEXT,
  tags TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Negotiations table
CREATE TABLE negotiations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cliente_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  imovel_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  corretor_id UUID REFERENCES auth.users(id),

  stage negotiation_stage DEFAULT 'novo_lead',
  prioridade priority_level DEFAULT 'media',

  valor_proposta DECIMAL(12,2),
  valor_final DECIMAL(12,2),
  comissao_percentual DECIMAL(5,2),
  comissao_valor DECIMAL(10,2),

  proxima_acao TEXT,
  proxima_acao_data TIMESTAMPTZ,

  notas TEXT,
  motivo_cancelamento TEXT,

  data_fechamento TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads table
CREATE TABLE leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  mensagem TEXT,

  imovel_interesse_id UUID REFERENCES properties(id),

  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  temperatura lead_temperature DEFAULT 'cold',
  origem lead_origin DEFAULT 'site',
  origem_utm JSONB,

  ai_resumo TEXT,
  ai_tags TEXT[],

  corretor_id UUID REFERENCES auth.users(id),
  convertido_cliente_id UUID REFERENCES clients(id),

  follow_up_data TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments table
CREATE TABLE appointments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tipo TEXT NOT NULL, -- visita, reuniao, assinatura, followup
  titulo TEXT NOT NULL,

  cliente_id UUID REFERENCES clients(id),
  imovel_id UUID REFERENCES properties(id),
  corretor_id UUID REFERENCES auth.users(id),

  data_inicio TIMESTAMPTZ NOT NULL,
  data_fim TIMESTAMPTZ,

  local TEXT,
  observacoes TEXT,
  status TEXT DEFAULT 'agendado', -- agendado, confirmado, realizado, cancelado

  lembrete_whatsapp BOOLEAN DEFAULT true,
  lembrete_email BOOLEAN DEFAULT true,
  lembrete_antecedencia INTEGER DEFAULT 60, -- minutes

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contracts table
CREATE TABLE contracts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  numero TEXT UNIQUE NOT NULL,
  tipo contract_type NOT NULL,

  cliente_id UUID REFERENCES clients(id),
  imovel_id UUID REFERENCES properties(id),
  corretor_id UUID REFERENCES auth.users(id),
  negotiation_id UUID REFERENCES negotiations(id),

  valor DECIMAL(12,2) NOT NULL,
  comissao_percentual DECIMAL(5,2),
  comissao_valor DECIMAL(10,2),

  data_assinatura TIMESTAMPTZ,
  data_vencimento TIMESTAMPTZ,

  status TEXT DEFAULT 'em_elaboracao',
  arquivo_url TEXT,
  template_id TEXT,
  conteudo JSONB,

  assinatura_cliente JSONB,
  assinatura_corretor JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Commissions table
CREATE TABLE commissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  corretor_id UUID REFERENCES auth.users(id) NOT NULL,
  negotiation_id UUID REFERENCES negotiations(id),
  contract_id UUID REFERENCES contracts(id),

  percentual DECIMAL(5,2) NOT NULL,
  valor DECIMAL(10,2) NOT NULL,

  status TEXT DEFAULT 'pendente', -- pendente, pago, parcial, cancelado
  data_pagamento TIMESTAMPTZ,
  valor_pago DECIMAL(10,2),

  observacoes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Financings table
CREATE TABLE financings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cliente_id UUID REFERENCES clients(id) NOT NULL,
  imovel_id UUID REFERENCES properties(id),

  banco TEXT NOT NULL,
  tipo TEXT NOT NULL, -- convencional, mcmv, fgts, caixa

  valor_imovel DECIMAL(12,2),
  valor_entrada DECIMAL(12,2),
  valor_financiado DECIMAL(12,2),
  taxa_juros DECIMAL(6,4),
  prazo_meses INTEGER,
  parcela_estimada DECIMAL(10,2),

  stage financing_stage DEFAULT 'simulacao',

  documentos JSONB DEFAULT '[]',
  checklist JSONB DEFAULT '[]',
  notas TEXT,

  corretor_id UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mass messages table
CREATE TABLE mass_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  titulo TEXT NOT NULL,
  canal message_channel NOT NULL,

  assunto TEXT, -- email only
  conteudo TEXT NOT NULL,
  template_variaveis JSONB,

  segmento JSONB, -- audience filters
  total_destinatarios INTEGER DEFAULT 0,
  total_enviados INTEGER DEFAULT 0,
  total_entregues INTEGER DEFAULT 0,
  total_abertos INTEGER DEFAULT 0,
  total_clicados INTEGER DEFAULT 0,

  status TEXT DEFAULT 'rascunho', -- rascunho, agendado, enviando, concluido, cancelado
  agendado_para TIMESTAMPTZ,
  enviado_em TIMESTAMPTZ,

  criado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mass message recipients
CREATE TABLE mass_message_recipients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES mass_messages(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES clients(id),

  status TEXT DEFAULT 'pendente',
  entregue_em TIMESTAMPTZ,
  aberto_em TIMESTAMPTZ,
  clicado_em TIMESTAMPTZ,
  erro TEXT
);

-- Property renewals
CREATE TABLE property_renewals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  imovel_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,

  intervalo_dias INTEGER DEFAULT 30,
  ultimo_contato TIMESTAMPTZ,
  proximo_contato TIMESTAMPTZ,

  status TEXT DEFAULT 'pendente', -- pendente, contatado, renovado, saiu_mercado
  canal_contato message_channel DEFAULT 'whatsapp',
  notas TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Property valuations
CREATE TABLE property_valuations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  imovel_id UUID REFERENCES properties(id),

  endereco TEXT,
  tipo property_type,
  area DECIMAL(10,2),

  preco_sugerido_min DECIMAL(12,2),
  preco_sugerido_max DECIMAL(12,2),
  preco_medio_m2 DECIMAL(10,2),

  comparaveis JSONB,
  analise_ia TEXT,

  solicitado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social media posts
CREATE TABLE social_media_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  rede TEXT NOT NULL, -- instagram, facebook, linkedin
  tipo TEXT DEFAULT 'imovel', -- imovel, dica, depoimento, novidade

  imovel_id UUID REFERENCES properties(id),

  legenda TEXT NOT NULL,
  hashtags TEXT[],
  imagens TEXT[],
  link TEXT,

  status TEXT DEFAULT 'rascunho', -- rascunho, agendado, publicado, erro
  agendado_para TIMESTAMPTZ,
  publicado_em TIMESTAMPTZ,
  post_id_rede TEXT,

  curtidas INTEGER DEFAULT 0,
  comentarios INTEGER DEFAULT 0,
  alcance INTEGER DEFAULT 0,
  salvamentos INTEGER DEFAULT 0,

  gerado_por_ia BOOLEAN DEFAULT false,

  criado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CMS Banners
CREATE TABLE cms_banners (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  titulo TEXT NOT NULL,
  subtitulo TEXT,
  imagem_url TEXT,
  link TEXT,
  botao_texto TEXT,
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CMS Pages
CREATE TABLE cms_pages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  titulo TEXT NOT NULL,
  conteudo TEXT,
  meta_titulo TEXT,
  meta_descricao TEXT,
  publicado BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CMS Testimonials
CREATE TABLE cms_testimonials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome TEXT NOT NULL,
  foto_url TEXT,
  texto TEXT NOT NULL,
  nota INTEGER CHECK (nota >= 1 AND nota <= 5),
  imovel_tipo TEXT,
  publicado BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portal publications
CREATE TABLE portal_publications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  imovel_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  portal TEXT NOT NULL, -- vivareal, zap, olx, imovelweb
  status TEXT DEFAULT 'pendente',
  external_id TEXT,
  publicado_em TIMESTAMPTZ,
  erro TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- News cache table
CREATE TABLE news_cache (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  titulo TEXT NOT NULL,
  resumo TEXT,
  categoria TEXT,
  fonte TEXT,
  url TEXT,
  data_publicacao TIMESTAMPTZ,
  tags TEXT[],
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '6 hours')
);

-- Activity log
CREATE TABLE activity_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  tipo TEXT NOT NULL,
  entidade TEXT,
  entidade_id UUID,
  descricao TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============= ROW LEVEL SECURITY =============

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE financings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mass_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE mass_message_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_renewals ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(uid UUID)
RETURNS user_role AS $$
  SELECT role FROM user_roles WHERE user_id = uid LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = uid AND role = 'admin');
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to check if user is admin or gerente
CREATE OR REPLACE FUNCTION is_manager_or_admin(uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = uid AND role IN ('admin', 'gerente'));
$$ LANGUAGE SQL SECURITY DEFINER;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (is_admin());
CREATE POLICY "Admins can manage profiles" ON profiles FOR ALL USING (is_admin());

-- User roles policies (admin only)
CREATE POLICY "Admins manage roles" ON user_roles FOR ALL USING (is_admin());
CREATE POLICY "Users view own role" ON user_roles FOR SELECT USING (auth.uid() = user_id);

-- Properties - public read, authenticated write
CREATE POLICY "Anyone can view active properties" ON properties FOR SELECT USING (status != 'inativo' OR auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create properties" ON properties FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Corretores can update own properties" ON properties FOR UPDATE USING (auth.uid() = corretor_id OR is_admin());
CREATE POLICY "Admins can delete properties" ON properties FOR DELETE USING (is_admin());

-- Clients - corretor sees own, admin sees all
CREATE POLICY "Corretores see own clients" ON clients FOR SELECT USING (auth.uid() = corretor_id OR is_admin());
CREATE POLICY "Corretores manage own clients" ON clients FOR ALL USING (auth.uid() = corretor_id OR is_admin());

-- Negotiations
CREATE POLICY "Corretores see own negotiations" ON negotiations FOR SELECT USING (auth.uid() = corretor_id OR is_admin());
CREATE POLICY "Corretores manage own negotiations" ON negotiations FOR ALL USING (auth.uid() = corretor_id OR is_admin());

-- Leads
CREATE POLICY "Corretores see own leads" ON leads FOR SELECT USING (auth.uid() = corretor_id OR is_admin());
CREATE POLICY "Insert leads from public" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Corretores manage own leads" ON leads FOR UPDATE USING (auth.uid() = corretor_id OR is_admin());

-- Admin-only tables
CREATE POLICY "Authenticated users manage appointments" ON appointments FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin manages mass messages" ON mass_messages FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated view contracts" ON contracts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin manage contracts" ON contracts FOR ALL USING (is_admin());
CREATE POLICY "Corretores see own commissions" ON commissions FOR SELECT USING (auth.uid() = corretor_id OR is_admin());
CREATE POLICY "Admin manage commissions" ON commissions FOR ALL USING (is_admin());
CREATE POLICY "Authenticated manage financings" ON financings FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin manage renewals" ON property_renewals FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated manage valuations" ON property_valuations FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated manage social posts" ON social_media_posts FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Public read cms banners" ON cms_banners FOR SELECT USING (ativo = true);
CREATE POLICY "Admin manage banners" ON cms_banners FOR ALL USING (is_admin());
CREATE POLICY "Public read cms pages" ON cms_pages FOR SELECT USING (publicado = true);
CREATE POLICY "Admin manage pages" ON cms_pages FOR ALL USING (is_admin());
CREATE POLICY "Public read testimonials" ON cms_testimonials FOR SELECT USING (publicado = true);
CREATE POLICY "Admin manage testimonials" ON cms_testimonials FOR ALL USING (is_admin());
CREATE POLICY "Admin manage portals" ON portal_publications FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Public read news cache" ON news_cache FOR SELECT USING (true);
CREATE POLICY "Service role manage news cache" ON news_cache FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated view activity" ON activity_log FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "System insert activity" ON activity_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated manage recipients" ON mass_message_recipients FOR ALL USING (auth.uid() IS NOT NULL);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_negotiations_updated_at BEFORE UPDATE ON negotiations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_financings_updated_at BEFORE UPDATE ON financings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to auto-generate property slug
CREATE OR REPLACE FUNCTION generate_property_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Generate base slug from titulo + cidade + bairro
  base_slug := lower(
    regexp_replace(
      unaccent(NEW.titulo || '-' || NEW.cidade || COALESCE('-' || NEW.bairro, '')),
      '[^a-z0-9]+', '-', 'g'
    )
  );
  -- Trim leading/trailing dashes
  base_slug := trim(both '-' from base_slug);
  final_slug := base_slug;

  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM properties WHERE slug = final_slug AND id != NEW.id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_property_slug
  BEFORE INSERT ON properties
  FOR EACH ROW
  WHEN (NEW.slug IS NULL)
  EXECUTE FUNCTION generate_property_slug();

-- Function to auto-calculate commission value
CREATE OR REPLACE FUNCTION calculate_commission_value()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.comissao_percentual IS NOT NULL AND NEW.preco IS NOT NULL THEN
    NEW.comissao_valor := NEW.preco * (NEW.comissao_percentual / 100);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_calculate_property_commission
  BEFORE INSERT OR UPDATE OF preco, comissao_percentual ON properties
  FOR EACH ROW
  EXECUTE FUNCTION calculate_commission_value();

-- Function to log activity automatically
CREATE OR REPLACE FUNCTION log_activity(
  p_user_id UUID,
  p_tipo TEXT,
  p_entidade TEXT,
  p_entidade_id UUID,
  p_descricao TEXT,
  p_metadata JSONB DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO activity_log (user_id, tipo, entidade, entidade_id, descricao, metadata)
  VALUES (p_user_id, p_tipo, p_entidade, p_entidade_id, p_descricao, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Views for dashboards
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM properties WHERE status = 'disponivel') AS imoveis_disponiveis,
  (SELECT COUNT(*) FROM properties WHERE status = 'reservado') AS imoveis_reservados,
  (SELECT COUNT(*) FROM properties WHERE status = 'vendido') AS imoveis_vendidos,
  (SELECT COUNT(*) FROM properties WHERE status = 'locado') AS imoveis_locados,
  (SELECT COUNT(*) FROM clients WHERE status = 'ativo') AS clientes_ativos,
  (SELECT COUNT(*) FROM leads WHERE created_at >= NOW() - INTERVAL '30 days') AS leads_mes,
  (SELECT COUNT(*) FROM negotiations WHERE stage NOT IN ('fechamento', 'cancelado')) AS negociacoes_ativas,
  (SELECT COALESCE(SUM(valor_final), 0) FROM negotiations WHERE stage = 'fechamento' AND data_fechamento >= NOW() - INTERVAL '30 days') AS vendas_mes,
  (SELECT COUNT(*) FROM appointments WHERE data_inicio >= NOW() AND data_inicio <= NOW() + INTERVAL '7 days') AS agendamentos_semana;

-- View for property with corretor info
CREATE OR REPLACE VIEW properties_with_corretor AS
SELECT
  p.*,
  pr.full_name AS corretor_nome,
  pr.phone AS corretor_telefone,
  pr.creci AS corretor_creci,
  pr.avatar_url AS corretor_avatar
FROM properties p
LEFT JOIN profiles pr ON p.corretor_id = pr.id;

-- Indexes for performance
CREATE INDEX leads_corretor_idx ON leads(corretor_id);
CREATE INDEX leads_temperatura_idx ON leads(temperatura);
CREATE INDEX leads_created_at_idx ON leads(created_at DESC);
CREATE INDEX clients_corretor_idx ON clients(corretor_id);
CREATE INDEX clients_status_idx ON clients(status);
CREATE INDEX negotiations_corretor_idx ON negotiations(corretor_id);
CREATE INDEX negotiations_stage_idx ON negotiations(stage);
CREATE INDEX appointments_corretor_idx ON appointments(corretor_id);
CREATE INDEX appointments_data_inicio_idx ON appointments(data_inicio);
CREATE INDEX activity_log_user_idx ON activity_log(user_id);
CREATE INDEX activity_log_created_at_idx ON activity_log(created_at DESC);
CREATE INDEX news_cache_expires_idx ON news_cache(expires_at);

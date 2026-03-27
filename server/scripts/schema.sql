-- =============================================================================
-- Imobiliária Lemos - Complete Database Schema
-- TiDB Cloud (MySQL 8.0 compatible)
-- Charset: utf8mb4
-- =============================================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- =============================================================================
-- PROPERTIES TABLE
-- All 80 fields from Univen export + extra CRM fields
-- =============================================================================
CREATE TABLE IF NOT EXISTS properties (
  id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,

  -- Univen core identifiers
  codigo                VARCHAR(20)   DEFAULT NULL COMMENT 'Referência',
  id_internet           VARCHAR(20)   DEFAULT NULL COMMENT 'ID Internet',

  -- Classification
  tipo                  ENUM('CASA','APARTAMENTO','TERRENO','CHÁCARA','ÁREA','BARRACÃO','GALPÃO','SÍTIO','RANCHO','SALA','FLAT','STUDIO','COBERTURA','KITNET','RURAL') NOT NULL DEFAULT 'CASA',
  finalidade            ENUM('RESIDENCIAL','COMERCIAL','RURAL','INDUSTRIAL','TEMPORADA','Misto') NOT NULL DEFAULT 'RESIDENCIAL',
  categoria             VARCHAR(100)  DEFAULT NULL,

  -- Prices
  preco_venda           DECIMAL(12,2) DEFAULT NULL COMMENT 'Valor Venda',
  preco_locacao         DECIMAL(12,2) DEFAULT NULL COMMENT 'Valor Locação',
  preco_temporada       DECIMAL(12,2) DEFAULT NULL COMMENT 'Valor Temporada',
  preco_m2              DECIMAL(12,2) DEFAULT NULL COMMENT 'Valor m2',

  -- Address
  endereco              VARCHAR(255)  DEFAULT NULL COMMENT 'Endereço',
  numero                VARCHAR(20)   DEFAULT NULL COMMENT 'Número',
  complemento           VARCHAR(100)  DEFAULT NULL,
  bloco                 VARCHAR(20)   DEFAULT NULL,
  apto                  VARCHAR(20)   DEFAULT NULL,
  quadra                VARCHAR(20)   DEFAULT NULL,
  lote                  VARCHAR(20)   DEFAULT NULL,
  bairro                VARCHAR(150)  DEFAULT NULL,
  cidade                VARCHAR(150)  DEFAULT NULL,
  uf                    CHAR(2)       DEFAULT NULL,
  cep                   VARCHAR(10)   DEFAULT NULL,
  regiao                VARCHAR(100)  DEFAULT NULL COMMENT 'Região',
  edificio              VARCHAR(150)  DEFAULT NULL COMMENT 'Edifício',
  condominio            VARCHAR(150)  DEFAULT NULL COMMENT 'Condomínio',
  preco_condominio      DECIMAL(10,2) DEFAULT NULL COMMENT 'Valor Condomínio',
  empreendimento        VARCHAR(150)  DEFAULT NULL,
  construtora           VARCHAR(150)  DEFAULT NULL,

  -- Status & activation
  situacao              VARCHAR(50)   DEFAULT NULL COMMENT 'Situação',
  ultima_ativacao       VARCHAR(50)   DEFAULT NULL COMMENT 'Última Ativação',
  estado_atual          VARCHAR(50)   DEFAULT NULL COMMENT 'Estado Atual',
  pelo                  VARCHAR(100)  DEFAULT NULL,
  padrao                VARCHAR(50)   DEFAULT NULL COMMENT 'Padrão',
  localizacao           VARCHAR(100)  DEFAULT NULL COMMENT 'Localização',

  -- Rooms & features
  quartos               TINYINT UNSIGNED DEFAULT 0 COMMENT 'Dorms.',
  suites                TINYINT UNSIGNED DEFAULT 0 COMMENT 'Suíte',
  garagens              TINYINT UNSIGNED DEFAULT 0 COMMENT 'Gar.',
  banheiros             TINYINT UNSIGNED DEFAULT 0 COMMENT 'Banh.',

  -- Areas
  area_construida       DECIMAL(10,2) DEFAULT NULL COMMENT 'Área Construída',
  area_util             DECIMAL(10,2) DEFAULT NULL COMMENT 'Área Útil',
  area_comum            DECIMAL(10,2) DEFAULT NULL COMMENT 'Área Comum',
  area_total            DECIMAL(10,2) DEFAULT NULL COMMENT 'Área Total',
  dist_mar              DECIMAL(10,2) DEFAULT NULL COMMENT 'Dist. mar',

  -- Administrative
  local_chaves          VARCHAR(100)  DEFAULT NULL COMMENT 'Local das Chaves',
  equipe                VARCHAR(100)  DEFAULT NULL,
  captador              VARCHAR(150)  DEFAULT NULL,
  indicacao             VARCHAR(150)  DEFAULT NULL COMMENT 'Indicação',
  parceria              VARCHAR(150)  DEFAULT NULL,
  vistoria              VARCHAR(50)   DEFAULT NULL,
  corretor              VARCHAR(150)  DEFAULT NULL COMMENT 'Corretor',

  -- Dates from Univen
  data_cadastro         DATETIME      DEFAULT NULL COMMENT 'Data Cadastro',
  data_atualizacao      DATETIME      DEFAULT NULL COMMENT 'Data Atualização',

  -- Registry & tax
  n_iptu                VARCHAR(100)  DEFAULT NULL COMMENT 'Cad. Pref. (N.IPTU)',
  preco_iptu            DECIMAL(10,2) DEFAULT NULL COMMENT 'Valor IPTU',
  n_matricula           VARCHAR(100)  DEFAULT NULL COMMENT 'Cartório (N.Matrícula)',
  ano_construcao        SMALLINT      DEFAULT NULL COMMENT 'Ano Construção',

  -- Exclusivity & authorization
  exclusividade         VARCHAR(10)   DEFAULT NULL,
  fim_exclusividade     VARCHAR(50)   DEFAULT NULL COMMENT 'Fim Exclus.',
  aut_publicar          VARCHAR(10)   DEFAULT NULL COMMENT 'Aut. Publicar',
  fim_aut_pub           VARCHAR(50)   DEFAULT NULL COMMENT 'Fim Aut. Pub.',

  -- Temporary rental extras
  n_acomodacoes         TINYINT UNSIGNED DEFAULT NULL COMMENT 'N. Acomodações',
  taxa_limpeza          DECIMAL(10,2) DEFAULT NULL COMMENT 'Taxa Limpeza',

  -- Auction
  primeiro_leilao       VARCHAR(50)   DEFAULT NULL COMMENT '1.leilão',
  valor_primeiro_leilao DECIMAL(12,2) DEFAULT NULL COMMENT 'Valor 1.leilão',
  segundo_leilao        VARCHAR(50)   DEFAULT NULL COMMENT '2.Leilão',
  valor_segundo_leilao  DECIMAL(12,2) DEFAULT NULL COMMENT 'Valor 2.leilão',

  -- Media
  foto_principal        TEXT          DEFAULT NULL COMMENT 'Foto principal',
  link_site             VARCHAR(500)  DEFAULT NULL COMMENT 'Link no Site',

  -- Descriptions & details (TEXT fields)
  descricao             MEDIUMTEXT    DEFAULT NULL COMMENT 'Descrição',
  detalhes_basico       TEXT          DEFAULT NULL COMMENT 'Detalhes Básico',
  detalhes_servicos     TEXT          DEFAULT NULL COMMENT 'Detalhes Serviços',
  detalhes_lazer        TEXT          DEFAULT NULL COMMENT 'Detalhes Lazer',
  detalhes_social       TEXT          DEFAULT NULL COMMENT 'Detalhes Social',
  detalhes_intima       TEXT          DEFAULT NULL COMMENT 'Detalhes Íntima',
  detalhes_armarios     TEXT          DEFAULT NULL COMMENT 'Detalhes Armários',
  detalhes_acabamento   TEXT          DEFAULT NULL COMMENT 'Detalhes Acabamento',
  detalhes_destaque     TEXT          DEFAULT NULL COMMENT 'Detalhes Destaque',
  outras_caracteristicas TEXT         DEFAULT NULL COMMENT 'Outras características',

  -- Owner
  proprietario_nome     VARCHAR(200)  DEFAULT NULL COMMENT 'Proprietário',
  proprietario_empresa  VARCHAR(200)  DEFAULT NULL COMMENT 'Empresa',
  proprietario_telefone VARCHAR(50)   DEFAULT NULL COMMENT 'Celular/Telefone',
  proprietario_email    VARCHAR(150)  DEFAULT NULL COMMENT 'E-mail',

  -- CRM / Platform fields
  titulo                VARCHAR(300)  DEFAULT NULL COMMENT 'Generated title for display',
  slug                  VARCHAR(255)  DEFAULT NULL,
  status                ENUM('disponivel','vendido','alugado','inativo','suspenso') NOT NULL DEFAULT 'disponivel',
  destaque              TINYINT(1)    NOT NULL DEFAULT 0,
  visualizacoes         INT UNSIGNED  NOT NULL DEFAULT 0,

  -- Timestamps
  created_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_codigo (codigo),
  UNIQUE KEY uq_slug (slug),
  KEY idx_id_internet (id_internet),
  KEY idx_cidade_tipo (cidade, tipo, finalidade, status, preco_venda),
  KEY idx_bairro (bairro),
  KEY idx_status (status),
  KEY idx_destaque (destaque),
  KEY idx_preco_venda (preco_venda),
  KEY idx_preco_locacao (preco_locacao),
  KEY idx_quartos (quartos),
  KEY idx_area_total (area_total),
  KEY idx_created_at (created_at),
  FULLTEXT KEY ft_properties (titulo, descricao, bairro)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Real estate property listings';

-- =============================================================================
-- PROPERTY IMAGES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS property_images (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  property_id INT UNSIGNED NOT NULL,
  url         TEXT         NOT NULL,
  caption     VARCHAR(255) DEFAULT NULL,
  ordem       SMALLINT     NOT NULL DEFAULT 0,
  is_cover    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_property_id (property_id),
  KEY idx_property_cover (property_id, is_cover)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- CLIENTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS clients (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         INT UNSIGNED DEFAULT NULL COMMENT 'Link to users table if registered',
  nome            VARCHAR(200) NOT NULL,
  email           VARCHAR(150) DEFAULT NULL,
  telefone        VARCHAR(30)  DEFAULT NULL,
  celular         VARCHAR(30)  DEFAULT NULL,
  cpf             VARCHAR(20)  DEFAULT NULL,
  rg              VARCHAR(30)  DEFAULT NULL,
  data_nascimento DATE         DEFAULT NULL,
  estado_civil    ENUM('solteiro','casado','divorciado','viuvo','uniao_estavel') DEFAULT NULL,
  profissao       VARCHAR(100) DEFAULT NULL,
  renda_mensal    DECIMAL(12,2) DEFAULT NULL,
  endereco        VARCHAR(255) DEFAULT NULL,
  numero          VARCHAR(20)  DEFAULT NULL,
  complemento     VARCHAR(100) DEFAULT NULL,
  bairro          VARCHAR(150) DEFAULT NULL,
  cidade          VARCHAR(150) DEFAULT NULL,
  uf              CHAR(2)      DEFAULT NULL,
  cep             VARCHAR(10)  DEFAULT NULL,
  observacoes     TEXT         DEFAULT NULL,
  origem          VARCHAR(100) DEFAULT NULL COMMENT 'How they found us',
  corretor_id     INT UNSIGNED DEFAULT NULL COMMENT 'Assigned broker user_id',
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_email (email),
  KEY idx_telefone (telefone),
  KEY idx_corretor_id (corretor_id),
  KEY idx_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- LEADS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS leads (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome              VARCHAR(200) DEFAULT NULL,
  email             VARCHAR(150) DEFAULT NULL,
  telefone          VARCHAR(30)  DEFAULT NULL,
  mensagem          TEXT         DEFAULT NULL,
  property_id       INT UNSIGNED DEFAULT NULL COMMENT 'Property the lead came from',
  property_codigo   VARCHAR(20)  DEFAULT NULL,
  corretor_id       INT UNSIGNED DEFAULT NULL COMMENT 'Assigned broker',
  client_id         INT UNSIGNED DEFAULT NULL COMMENT 'Converted to client',

  -- Lead qualification
  score             TINYINT      NOT NULL DEFAULT 0 COMMENT '0-100 AI score',
  temperature       ENUM('frio','morno','quente') NOT NULL DEFAULT 'frio',
  intencao          ENUM('comprar','alugar','vender','avaliar','financiamento','outro') DEFAULT NULL,
  budget_min        DECIMAL(12,2) DEFAULT NULL,
  budget_max        DECIMAL(12,2) DEFAULT NULL,
  prazo             ENUM('imediato','1_mes','3_meses','6_meses','1_ano','sem_prazo') DEFAULT NULL,

  -- UTM / Traffic source
  utm_source        VARCHAR(100) DEFAULT NULL,
  utm_medium        VARCHAR(100) DEFAULT NULL,
  utm_campaign      VARCHAR(100) DEFAULT NULL,
  utm_term          VARCHAR(100) DEFAULT NULL,
  utm_content       VARCHAR(100) DEFAULT NULL,
  origem_url        VARCHAR(500) DEFAULT NULL,
  origem_canal      VARCHAR(100) DEFAULT NULL COMMENT 'portal, site, whatsapp, instagram, etc',

  -- Status
  status            ENUM('novo','em_atendimento','qualificado','convertido','descartado') NOT NULL DEFAULT 'novo',
  motivo_descarte   VARCHAR(255) DEFAULT NULL,

  -- AI analysis
  ai_score_reason   TEXT         DEFAULT NULL,
  ai_tags           JSON         DEFAULT NULL,

  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_score_temp (score, temperature, created_at),
  KEY idx_status (status),
  KEY idx_property_id (property_id),
  KEY idx_corretor_id (corretor_id),
  KEY idx_email (email),
  KEY idx_telefone (telefone),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- NEGOTIATIONS TABLE (CRM Kanban)
-- =============================================================================
CREATE TABLE IF NOT EXISTS negotiations (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  lead_id         INT UNSIGNED DEFAULT NULL,
  client_id       INT UNSIGNED DEFAULT NULL,
  property_id     INT UNSIGNED DEFAULT NULL,
  corretor_id     INT UNSIGNED DEFAULT NULL,

  -- Kanban stage
  stage           ENUM(
    'contato_inicial',
    'visita_agendada',
    'visita_realizada',
    'proposta_enviada',
    'proposta_aceita',
    'documentacao',
    'financiamento',
    'contrato',
    'fechado',
    'perdido'
  ) NOT NULL DEFAULT 'contato_inicial',

  titulo          VARCHAR(255) DEFAULT NULL,
  valor_proposta  DECIMAL(12,2) DEFAULT NULL,
  valor_comissao  DECIMAL(12,2) DEFAULT NULL,
  percentual_comissao DECIMAL(5,2) DEFAULT NULL,
  tipo_negocio    ENUM('venda','locacao','temporada','permuta') DEFAULT 'venda',

  data_contato    DATE         DEFAULT NULL,
  data_visita     DATE         DEFAULT NULL,
  data_proposta   DATE         DEFAULT NULL,
  data_fechamento DATE         DEFAULT NULL,
  previsao_fechamento DATE     DEFAULT NULL,

  motivo_perda    VARCHAR(255) DEFAULT NULL,
  observacoes     TEXT         DEFAULT NULL,
  prioridade      ENUM('baixa','media','alta') NOT NULL DEFAULT 'media',

  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_stage_corretor (stage, corretor_id),
  KEY idx_client_id (client_id),
  KEY idx_property_id (property_id),
  KEY idx_corretor_id (corretor_id),
  KEY idx_lead_id (lead_id),
  KEY idx_previsao (previsao_fechamento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- APPOINTMENTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS appointments (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  negotiation_id  INT UNSIGNED DEFAULT NULL,
  property_id     INT UNSIGNED DEFAULT NULL,
  client_id       INT UNSIGNED DEFAULT NULL,
  corretor_id     INT UNSIGNED DEFAULT NULL,
  lead_id         INT UNSIGNED DEFAULT NULL,

  tipo            ENUM('visita','reuniao','ligacao','vistoria','assinatura','outro') NOT NULL DEFAULT 'visita',
  titulo          VARCHAR(255) DEFAULT NULL,
  descricao       TEXT         DEFAULT NULL,
  data_inicio     DATETIME     NOT NULL,
  data_fim        DATETIME     DEFAULT NULL,
  local           VARCHAR(255) DEFAULT NULL,

  status          ENUM('agendado','confirmado','realizado','cancelado','faltou') NOT NULL DEFAULT 'agendado',
  resultado       TEXT         DEFAULT NULL,
  lembrete_enviado TINYINT(1)  NOT NULL DEFAULT 0,

  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_corretor_data (corretor_id, data_inicio),
  KEY idx_property_id (property_id),
  KEY idx_client_id (client_id),
  KEY idx_data_inicio (data_inicio),
  KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- CONTRACTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS contracts (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  negotiation_id  INT UNSIGNED DEFAULT NULL,
  property_id     INT UNSIGNED NOT NULL,
  client_id       INT UNSIGNED NOT NULL,
  corretor_id     INT UNSIGNED DEFAULT NULL,

  tipo            ENUM('compra_venda','locacao','temporada','permuta','comodato') NOT NULL,
  numero          VARCHAR(50)  DEFAULT NULL,
  valor           DECIMAL(12,2) NOT NULL,
  valor_entrada   DECIMAL(12,2) DEFAULT NULL,
  forma_pagamento VARCHAR(255) DEFAULT NULL COMMENT 'Cash, financing, mixed',

  data_assinatura DATE         DEFAULT NULL,
  data_inicio     DATE         DEFAULT NULL,
  data_fim        DATE         DEFAULT NULL COMMENT 'For rental contracts',
  data_entrega    DATE         DEFAULT NULL,

  status          ENUM('rascunho','assinado','vigente','encerrado','rescindido','cancelado') NOT NULL DEFAULT 'rascunho',
  url_documento   VARCHAR(500) DEFAULT NULL,
  observacoes     TEXT         DEFAULT NULL,

  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_property_id (property_id),
  KEY idx_client_id (client_id),
  KEY idx_corretor_id (corretor_id),
  KEY idx_status (status),
  KEY idx_data_assinatura (data_assinatura)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- COMMISSIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS commissions (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  contract_id     INT UNSIGNED DEFAULT NULL,
  negotiation_id  INT UNSIGNED DEFAULT NULL,
  corretor_id     INT UNSIGNED NOT NULL,
  property_id     INT UNSIGNED DEFAULT NULL,

  tipo            ENUM('venda','locacao','indicacao','captacao','parceria') NOT NULL DEFAULT 'venda',
  valor_negocio   DECIMAL(12,2) NOT NULL,
  percentual      DECIMAL(5,2)  NOT NULL,
  valor_comissao  DECIMAL(12,2) NOT NULL,
  valor_pago      DECIMAL(12,2) NOT NULL DEFAULT 0,

  status          ENUM('pendente','parcial','pago','cancelado') NOT NULL DEFAULT 'pendente',
  data_prevista   DATE          DEFAULT NULL,
  data_pagamento  DATE          DEFAULT NULL,
  comprovante_url VARCHAR(500)  DEFAULT NULL,
  observacoes     TEXT          DEFAULT NULL,

  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_corretor_id (corretor_id),
  KEY idx_contract_id (contract_id),
  KEY idx_status (status),
  KEY idx_data_prevista (data_prevista)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- FINANCINGS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS financings (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  client_id           INT UNSIGNED NOT NULL,
  property_id         INT UNSIGNED DEFAULT NULL,
  negotiation_id      INT UNSIGNED DEFAULT NULL,
  corretor_id         INT UNSIGNED DEFAULT NULL,

  banco               VARCHAR(100) DEFAULT NULL,
  modalidade          ENUM('FGTS','SFH','SFI','SBPE','MINHA_CASA','PROGRAMA_ESTADO','OUTRO') DEFAULT NULL,
  valor_imovel        DECIMAL(12,2) DEFAULT NULL,
  valor_entrada       DECIMAL(12,2) DEFAULT NULL,
  valor_financiado    DECIMAL(12,2) DEFAULT NULL,
  prazo_meses         SMALLINT      DEFAULT NULL,
  taxa_juros          DECIMAL(6,4)  DEFAULT NULL,
  valor_parcela       DECIMAL(12,2) DEFAULT NULL,
  renda_necessaria    DECIMAL(12,2) DEFAULT NULL,

  status              ENUM('simulacao','pre_aprovado','em_analise','aprovado','negado','cancelado') NOT NULL DEFAULT 'simulacao',
  data_simulacao      DATE          DEFAULT NULL,
  data_aprovacao      DATE          DEFAULT NULL,
  data_contratacao    DATE          DEFAULT NULL,
  observacoes         TEXT          DEFAULT NULL,

  created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_client_id (client_id),
  KEY idx_property_id (property_id),
  KEY idx_corretor_id (corretor_id),
  KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- ACTIVITY LOG TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS activity_log (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED DEFAULT NULL COMMENT 'Who performed the action',
  entity_type   VARCHAR(50)  NOT NULL COMMENT 'property, lead, client, negotiation, etc',
  entity_id     INT UNSIGNED DEFAULT NULL,
  action        VARCHAR(100) NOT NULL COMMENT 'created, updated, stage_changed, note_added, etc',
  old_value     JSON         DEFAULT NULL,
  new_value     JSON         DEFAULT NULL,
  description   TEXT         DEFAULT NULL,
  ip_address    VARCHAR(45)  DEFAULT NULL,
  user_agent    VARCHAR(500) DEFAULT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_entity (entity_type, entity_id),
  KEY idx_user_id (user_id),
  KEY idx_created_at (created_at),
  KEY idx_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- MASS MESSAGES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS mass_messages (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id      INT UNSIGNED NOT NULL COMMENT 'Sender user',
  titulo          VARCHAR(255) NOT NULL,
  mensagem        TEXT         NOT NULL,
  canal           ENUM('email','whatsapp','sms','push') NOT NULL DEFAULT 'whatsapp',
  segmento        VARCHAR(100) DEFAULT NULL COMMENT 'Audience segment label',
  filtros         JSON         DEFAULT NULL COMMENT 'JSON filter criteria',

  total_destinatarios INT UNSIGNED NOT NULL DEFAULT 0,
  total_enviados      INT UNSIGNED NOT NULL DEFAULT 0,
  total_entregues     INT UNSIGNED NOT NULL DEFAULT 0,
  total_lidos         INT UNSIGNED NOT NULL DEFAULT 0,
  total_erros         INT UNSIGNED NOT NULL DEFAULT 0,

  status          ENUM('rascunho','agendado','enviando','concluido','cancelado') NOT NULL DEFAULT 'rascunho',
  agendado_para   DATETIME     DEFAULT NULL,
  iniciado_em     DATETIME     DEFAULT NULL,
  concluido_em    DATETIME     DEFAULT NULL,

  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_usuario_id (usuario_id),
  KEY idx_status (status),
  KEY idx_agendado_para (agendado_para)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- PROPERTY RENEWALS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS property_renewals (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  property_id     INT UNSIGNED NOT NULL,
  corretor_id     INT UNSIGNED DEFAULT NULL,
  tipo            ENUM('autorizacao','exclusividade','contrato_locacao') NOT NULL,
  data_inicio     DATE         NOT NULL,
  data_fim        DATE         NOT NULL,
  status          ENUM('ativo','vencendo','vencido','renovado','cancelado') NOT NULL DEFAULT 'ativo',
  lembrete_30d    TINYINT(1)   NOT NULL DEFAULT 0,
  lembrete_15d    TINYINT(1)   NOT NULL DEFAULT 0,
  lembrete_7d     TINYINT(1)   NOT NULL DEFAULT 0,
  observacoes     TEXT         DEFAULT NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_property_id (property_id),
  KEY idx_data_fim (data_fim),
  KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- SOCIAL MEDIA POSTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS social_media_posts (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  property_id     INT UNSIGNED DEFAULT NULL,
  usuario_id      INT UNSIGNED NOT NULL,
  plataforma      ENUM('instagram','facebook','linkedin','twitter','tiktok','whatsapp_story') NOT NULL,
  tipo_conteudo   ENUM('post','story','reels','carrossel') NOT NULL DEFAULT 'post',
  legenda         TEXT         DEFAULT NULL,
  hashtags        TEXT         DEFAULT NULL,
  url_midia       TEXT         DEFAULT NULL COMMENT 'Generated image/video URL',
  post_externo_id VARCHAR(100) DEFAULT NULL COMMENT 'ID from social platform',
  status          ENUM('rascunho','agendado','publicado','falhou','cancelado') NOT NULL DEFAULT 'rascunho',
  agendado_para   DATETIME     DEFAULT NULL,
  publicado_em    DATETIME     DEFAULT NULL,
  impressoes      INT UNSIGNED DEFAULT 0,
  curtidas        INT UNSIGNED DEFAULT 0,
  comentarios     INT UNSIGNED DEFAULT 0,
  compartilhamentos INT UNSIGNED DEFAULT 0,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_property_id (property_id),
  KEY idx_usuario_id (usuario_id),
  KEY idx_status_plataforma (status, plataforma),
  KEY idx_agendado_para (agendado_para)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- CMS BANNERS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS cms_banners (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  titulo          VARCHAR(255) NOT NULL,
  subtitulo       VARCHAR(255) DEFAULT NULL,
  descricao       TEXT         DEFAULT NULL,
  url_imagem      VARCHAR(500) NOT NULL,
  url_imagem_mobile VARCHAR(500) DEFAULT NULL,
  url_destino     VARCHAR(500) DEFAULT NULL,
  target          ENUM('_self','_blank') NOT NULL DEFAULT '_self',
  posicao         VARCHAR(50)  NOT NULL DEFAULT 'hero' COMMENT 'hero, sidebar, popup, etc',
  ordem           SMALLINT     NOT NULL DEFAULT 0,
  ativo           TINYINT(1)   NOT NULL DEFAULT 1,
  data_inicio     DATE         DEFAULT NULL,
  data_fim        DATE         DEFAULT NULL,
  criado_por      INT UNSIGNED DEFAULT NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_posicao_ativo (posicao, ativo),
  KEY idx_ordem (ordem),
  KEY idx_datas (data_inicio, data_fim)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- PROPERTY VALUATIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS property_valuations (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  property_id     INT UNSIGNED DEFAULT NULL COMMENT 'Existing property, if any',
  solicitante_nome VARCHAR(200) NOT NULL,
  solicitante_email VARCHAR(150) DEFAULT NULL,
  solicitante_telefone VARCHAR(30) DEFAULT NULL,
  corretor_id     INT UNSIGNED DEFAULT NULL,

  -- Property data for valuation
  tipo            VARCHAR(50)  DEFAULT NULL,
  finalidade      VARCHAR(50)  DEFAULT NULL,
  endereco        VARCHAR(255) DEFAULT NULL,
  bairro          VARCHAR(150) DEFAULT NULL,
  cidade          VARCHAR(150) DEFAULT NULL,
  uf              CHAR(2)      DEFAULT NULL,
  area_total      DECIMAL(10,2) DEFAULT NULL,
  area_construida DECIMAL(10,2) DEFAULT NULL,
  quartos         TINYINT UNSIGNED DEFAULT NULL,
  banheiros       TINYINT UNSIGNED DEFAULT NULL,
  garagens        TINYINT UNSIGNED DEFAULT NULL,
  ano_construcao  SMALLINT     DEFAULT NULL,
  estado_conservacao VARCHAR(50) DEFAULT NULL,
  caracteristicas TEXT         DEFAULT NULL,

  -- Valuation result
  valor_avaliado  DECIMAL(12,2) DEFAULT NULL,
  valor_min       DECIMAL(12,2) DEFAULT NULL,
  valor_max       DECIMAL(12,2) DEFAULT NULL,
  metodologia     VARCHAR(100) DEFAULT NULL,
  laudo_url       VARCHAR(500) DEFAULT NULL,
  observacoes     TEXT         DEFAULT NULL,

  status          ENUM('solicitado','em_analise','concluido','cancelado') NOT NULL DEFAULT 'solicitado',
  data_vistoria   DATE         DEFAULT NULL,
  data_laudo      DATE         DEFAULT NULL,

  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_property_id (property_id),
  KEY idx_corretor_id (corretor_id),
  KEY idx_status (status),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- PROPERTY FAVORITES (user wishlist)
-- =============================================================================
CREATE TABLE IF NOT EXISTS property_favorites (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED NOT NULL,
  property_id INT UNSIGNED NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_user_property (user_id, property_id),
  KEY idx_user_id (user_id),
  KEY idx_property_id (property_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- PROPERTY VIEWS LOG
-- =============================================================================
CREATE TABLE IF NOT EXISTS property_views (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  property_id INT UNSIGNED NOT NULL,
  user_id     INT UNSIGNED DEFAULT NULL,
  ip_address  VARCHAR(45)  DEFAULT NULL,
  user_agent  VARCHAR(500) DEFAULT NULL,
  referer     VARCHAR(500) DEFAULT NULL,
  utm_source  VARCHAR(100) DEFAULT NULL,
  utm_medium  VARCHAR(100) DEFAULT NULL,
  utm_campaign VARCHAR(100) DEFAULT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_property_id (property_id),
  KEY idx_created_at (created_at),
  KEY idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- PLANS TABLE (subscription)
-- =============================================================================
CREATE TABLE IF NOT EXISTS plans (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome            VARCHAR(100) NOT NULL,
  slug            VARCHAR(50)  NOT NULL,
  descricao       TEXT         DEFAULT NULL,
  preco_mensal    DECIMAL(10,2) NOT NULL DEFAULT 0,
  preco_anual     DECIMAL(10,2) NOT NULL DEFAULT 0,
  stripe_price_id_mensal VARCHAR(100) DEFAULT NULL,
  stripe_price_id_anual  VARCHAR(100) DEFAULT NULL,
  limite_imoveis  INT          NOT NULL DEFAULT 10,
  limite_fotos    INT          NOT NULL DEFAULT 10,
  limite_leads    INT          NOT NULL DEFAULT 100,
  tem_crm         TINYINT(1)   NOT NULL DEFAULT 0,
  tem_site        TINYINT(1)   NOT NULL DEFAULT 0,
  tem_redes       TINYINT(1)   NOT NULL DEFAULT 0,
  tem_relatorios  TINYINT(1)   NOT NULL DEFAULT 0,
  ativo           TINYINT(1)   NOT NULL DEFAULT 1,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- SAVED SEARCHES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS saved_searches (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED NOT NULL,
  nome        VARCHAR(150) DEFAULT NULL,
  filtros     JSON         NOT NULL,
  alerta_email TINYINT(1)  NOT NULL DEFAULT 0,
  alerta_push  TINYINT(1)  NOT NULL DEFAULT 0,
  ultimo_alerta DATETIME   DEFAULT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- NOTIFICATIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED NOT NULL,
  tipo        VARCHAR(50)  NOT NULL,
  titulo      VARCHAR(255) NOT NULL,
  mensagem    TEXT         DEFAULT NULL,
  url_destino VARCHAR(500) DEFAULT NULL,
  lida        TINYINT(1)   NOT NULL DEFAULT 0,
  dados       JSON         DEFAULT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_user_unread (user_id, lida),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/**
 * Mapeamento de todas as categorias SEO programáticas
 * Cada categoria gera URLs: /{categoria}/{cidade-uf}
 * Total: ~85 categorias × 500+ cidades = 42,500+ páginas
 */

export interface SeoCategoria {
  slug: string
  titulo: string
  h1Template: string
  descTemplate: string
  grupo: 'imoveis' | 'leilao' | 'servicos' | 'profissionais' | 'filtros' | 'construcao' | 'documentacao' | 'outros'
  icon: string
  /** Mapa para query da API: purpose (SALE/RENT), type (HOUSE/APARTMENT/LAND), etc. */
  apiFilter?: { purpose?: string; type?: string }
}

// ── Property Types ──────────────────────────────────────────────────────────
const IMOVEIS: SeoCategoria[] = [
  { slug: 'casas-a-venda', titulo: 'Casas à Venda', h1Template: 'Casas à Venda em {cidade}/{uf}', descTemplate: 'Encontre casas à venda em {cidade}/{uf}. Residências, sobrados e casas em condomínio no AgoraEncontrei.', grupo: 'imoveis', icon: '🏡', apiFilter: { purpose: 'SALE', type: 'HOUSE' } },
  { slug: 'apartamentos-a-venda', titulo: 'Apartamentos à Venda', h1Template: 'Apartamentos à Venda em {cidade}/{uf}', descTemplate: 'Apartamentos à venda em {cidade}/{uf}. Studios, 1, 2, 3 e 4 quartos.', grupo: 'imoveis', icon: '🏢', apiFilter: { purpose: 'SALE', type: 'APARTMENT' } },
  { slug: 'terrenos-a-venda', titulo: 'Terrenos à Venda', h1Template: 'Terrenos à Venda em {cidade}/{uf}', descTemplate: 'Terrenos e lotes à venda em {cidade}/{uf}. Residenciais e comerciais.', grupo: 'imoveis', icon: '📐', apiFilter: { purpose: 'SALE', type: 'LAND' } },
  { slug: 'imoveis-comerciais', titulo: 'Imóveis Comerciais', h1Template: 'Imóveis Comerciais em {cidade}/{uf}', descTemplate: 'Salas, lojas, galpões e prédios comerciais em {cidade}/{uf}.', grupo: 'imoveis', icon: '🏪', apiFilter: { purpose: 'SALE', type: 'COMMERCIAL' } },
  { slug: 'salas-comerciais', titulo: 'Salas Comerciais', h1Template: 'Salas Comerciais em {cidade}/{uf}', descTemplate: 'Salas comerciais para venda e aluguel em {cidade}/{uf}.', grupo: 'imoveis', icon: '🏢' },
  { slug: 'galpoes', titulo: 'Galpões', h1Template: 'Galpões em {cidade}/{uf}', descTemplate: 'Galpões industriais e logísticos em {cidade}/{uf}.', grupo: 'imoveis', icon: '🏭' },
  { slug: 'cobertura-duplex', titulo: 'Coberturas Duplex', h1Template: 'Coberturas Duplex em {cidade}/{uf}', descTemplate: 'Coberturas duplex à venda em {cidade}/{uf}. Imóveis de alto padrão.', grupo: 'imoveis', icon: '🌇' },
  { slug: 'kitnet', titulo: 'Kitnets', h1Template: 'Kitnets em {cidade}/{uf}', descTemplate: 'Kitnets à venda e para alugar em {cidade}/{uf}.', grupo: 'imoveis', icon: '🏠' },
  { slug: 'condominio-fechado', titulo: 'Condomínios Fechados', h1Template: 'Condomínios Fechados em {cidade}/{uf}', descTemplate: 'Imóveis em condomínios fechados em {cidade}/{uf}. Segurança e lazer.', grupo: 'imoveis', icon: '🏘️' },
  { slug: 'chacaras-a-venda', titulo: 'Chácaras à Venda', h1Template: 'Chácaras à Venda em {cidade}/{uf}', descTemplate: 'Chácaras à venda em {cidade}/{uf} e região.', grupo: 'imoveis', icon: '🌿' },
  { slug: 'sitios-a-venda', titulo: 'Sítios à Venda', h1Template: 'Sítios à Venda em {cidade}/{uf}', descTemplate: 'Sítios à venda em {cidade}/{uf} e região.', grupo: 'imoveis', icon: '🌾' },
  { slug: 'fazendas-a-venda', titulo: 'Fazendas à Venda', h1Template: 'Fazendas à Venda em {cidade}/{uf}', descTemplate: 'Fazendas à venda em {cidade}/{uf}. Agronegócio e pecuária.', grupo: 'imoveis', icon: '🐄' },
  { slug: 'imoveis-rurais', titulo: 'Imóveis Rurais', h1Template: 'Imóveis Rurais em {cidade}/{uf}', descTemplate: 'Sítios, chácaras e fazendas em {cidade}/{uf}.', grupo: 'imoveis', icon: '🌳' },
  { slug: 'casas-para-alugar', titulo: 'Casas para Alugar', h1Template: 'Casas para Alugar em {cidade}/{uf}', descTemplate: 'Casas para alugar em {cidade}/{uf}. Encontre a casa ideal.', grupo: 'imoveis', icon: '🏡', apiFilter: { purpose: 'RENT', type: 'HOUSE' } },
  { slug: 'apartamentos-para-alugar', titulo: 'Apartamentos para Alugar', h1Template: 'Apartamentos para Alugar em {cidade}/{uf}', descTemplate: 'Apartamentos para alugar em {cidade}/{uf}.', grupo: 'imoveis', icon: '🏢', apiFilter: { purpose: 'RENT', type: 'APARTMENT' } },
  { slug: 'kitnets-para-alugar', titulo: 'Kitnets para Alugar', h1Template: 'Kitnets para Alugar em {cidade}/{uf}', descTemplate: 'Kitnets para alugar em {cidade}/{uf}.', grupo: 'imoveis', icon: '🏠', apiFilter: { purpose: 'RENT' } },
  { slug: 'salas-para-alugar', titulo: 'Salas para Alugar', h1Template: 'Salas para Alugar em {cidade}/{uf}', descTemplate: 'Salas comerciais para alugar em {cidade}/{uf}.', grupo: 'imoveis', icon: '🏢', apiFilter: { purpose: 'RENT', type: 'COMMERCIAL' } },
  { slug: 'galpoes-para-alugar', titulo: 'Galpões para Alugar', h1Template: 'Galpões para Alugar em {cidade}/{uf}', descTemplate: 'Galpões industriais para locação em {cidade}/{uf}.', grupo: 'imoveis', icon: '🏭', apiFilter: { purpose: 'RENT' } },
  { slug: 'casas-em-condominio', titulo: 'Casas em Condomínio', h1Template: 'Casas em Condomínio em {cidade}/{uf}', descTemplate: 'Casas em condomínio fechado em {cidade}/{uf}.', grupo: 'imoveis', icon: '🏘️', apiFilter: { purpose: 'SALE', type: 'HOUSE' } },
  { slug: 'aluguel-temporada', titulo: 'Aluguel por Temporada', h1Template: 'Aluguel por Temporada em {cidade}/{uf}', descTemplate: 'Imóveis para temporada em {cidade}/{uf}. Casas e apartamentos mobiliados.', grupo: 'imoveis', icon: '🏖️' },
  { slug: 'imoveis-permuta', titulo: 'Imóveis para Permuta', h1Template: 'Imóveis para Permuta em {cidade}/{uf}', descTemplate: 'Imóveis aceita permuta em {cidade}/{uf}. Troque seu imóvel.', grupo: 'imoveis', icon: '🔄' },
  { slug: 'lancamentos', titulo: 'Lançamentos', h1Template: 'Lançamentos Imobiliários em {cidade}/{uf}', descTemplate: 'Lançamentos imobiliários em {cidade}/{uf}. Compre na planta.', grupo: 'imoveis', icon: '✨' },
  { slug: 'imoveis-novos', titulo: 'Imóveis Novos', h1Template: 'Imóveis Novos em {cidade}/{uf}', descTemplate: 'Imóveis novos à venda em {cidade}/{uf}. Prontos para morar.', grupo: 'imoveis', icon: '🆕' },
  { slug: 'imoveis-usados', titulo: 'Imóveis Usados', h1Template: 'Imóveis Usados em {cidade}/{uf}', descTemplate: 'Imóveis usados à venda em {cidade}/{uf}. Bom custo-benefício.', grupo: 'imoveis', icon: '🏚️' },
]

// ── Leilões ─────────────────────────────────────────────────────────────────
const LEILAO: SeoCategoria[] = [
  { slug: 'leilao-casas', titulo: 'Leilão de Casas', h1Template: 'Leilão de Casas em {cidade}/{uf}', descTemplate: 'Casas em leilão em {cidade}/{uf} com até 50% de desconto.', grupo: 'leilao', icon: '🏡' },
  { slug: 'leilao-apartamentos', titulo: 'Leilão de Apartamentos', h1Template: 'Leilão de Apartamentos em {cidade}/{uf}', descTemplate: 'Apartamentos em leilão em {cidade}/{uf}.', grupo: 'leilao', icon: '🏢' },
  { slug: 'leilao-terrenos', titulo: 'Leilão de Terrenos', h1Template: 'Leilão de Terrenos em {cidade}/{uf}', descTemplate: 'Terrenos em leilão em {cidade}/{uf}.', grupo: 'leilao', icon: '📐' },
  { slug: 'leilao-caixa', titulo: 'Leilão Caixa', h1Template: 'Imóveis Caixa em {cidade}/{uf}', descTemplate: 'Imóveis retomados pela Caixa em {cidade}/{uf}. Use FGTS, financie em até 420 meses.', grupo: 'leilao', icon: '🏦' },
  { slug: 'leilao-judicial', titulo: 'Leilão Judicial', h1Template: 'Leilão Judicial de Imóveis em {cidade}/{uf}', descTemplate: 'Leilões judiciais em {cidade}/{uf}. Hasta pública com descontos de 40-60%.', grupo: 'leilao', icon: '⚖️' },
  { slug: 'leilao-extrajudicial', titulo: 'Leilão Extrajudicial', h1Template: 'Leilão Extrajudicial em {cidade}/{uf}', descTemplate: 'Leilões extrajudiciais em {cidade}/{uf}. Imóveis retomados por bancos.', grupo: 'leilao', icon: '🔨' },
  { slug: 'leilao-banco-do-brasil', titulo: 'Leilão Banco do Brasil', h1Template: 'Imóveis Banco do Brasil em {cidade}/{uf}', descTemplate: 'Imóveis retomados pelo Banco do Brasil em {cidade}/{uf}.', grupo: 'leilao', icon: '🏦' },
  { slug: 'leilao-bradesco', titulo: 'Leilão Bradesco', h1Template: 'Imóveis Bradesco em {cidade}/{uf}', descTemplate: 'Imóveis retomados pelo Bradesco em {cidade}/{uf}.', grupo: 'leilao', icon: '🏦' },
  { slug: 'leilao-itau', titulo: 'Leilão Itaú', h1Template: 'Imóveis Itaú em {cidade}/{uf}', descTemplate: 'Imóveis retomados pelo Itaú em {cidade}/{uf}.', grupo: 'leilao', icon: '🏦' },
  { slug: 'leilao-santander', titulo: 'Leilão Santander', h1Template: 'Imóveis Santander em {cidade}/{uf}', descTemplate: 'Imóveis retomados pelo Santander em {cidade}/{uf}.', grupo: 'leilao', icon: '🏦' },
  { slug: 'leilao-rural', titulo: 'Leilão Rural', h1Template: 'Leilão de Imóveis Rurais em {cidade}/{uf}', descTemplate: 'Sítios, chácaras e fazendas em leilão em {cidade}/{uf}.', grupo: 'leilao', icon: '🌾' },
]

// ── Serviços e Profissionais ─────────────────────────────────────────────────
const SERVICOS: SeoCategoria[] = [
  { slug: 'avaliacao-imoveis', titulo: 'Avaliação de Imóveis', h1Template: 'Avaliação de Imóveis em {cidade}/{uf}', descTemplate: 'Avaliação profissional de imóveis em {cidade}/{uf}. Laudos e pareceres técnicos.', grupo: 'servicos', icon: '📊' },
  { slug: 'financiamento-imovel', titulo: 'Financiamento Imobiliário', h1Template: 'Financiamento Imobiliário em {cidade}/{uf}', descTemplate: 'Simule financiamento imobiliário em {cidade}/{uf}. Compare taxas e parcelas.', grupo: 'servicos', icon: '💰' },
  { slug: 'reforma-de-imoveis', titulo: 'Reforma de Imóveis', h1Template: 'Reforma de Imóveis em {cidade}/{uf}', descTemplate: 'Encontre profissionais para reforma de imóveis em {cidade}/{uf}.', grupo: 'servicos', icon: '🔧' },
  { slug: 'materiais-de-construcao', titulo: 'Materiais de Construção', h1Template: 'Materiais de Construção em {cidade}/{uf}', descTemplate: 'Lojas de materiais de construção em {cidade}/{uf}. Compare preços.', grupo: 'servicos', icon: '🧱' },
  { slug: 'vistoria-imovel', titulo: 'Vistoria de Imóvel', h1Template: 'Vistoria de Imóvel em {cidade}/{uf}', descTemplate: 'Vistoria profissional de imóveis em {cidade}/{uf}. Inspeção técnica completa.', grupo: 'servicos', icon: '🔍' },
  { slug: 'decoracao-interiores', titulo: 'Decoração de Interiores', h1Template: 'Decoração de Interiores em {cidade}/{uf}', descTemplate: 'Decoradores de interiores em {cidade}/{uf}. Projetos residenciais e comerciais.', grupo: 'servicos', icon: '🎨' },
  { slug: 'investimento-imobiliario', titulo: 'Investimento Imobiliário', h1Template: 'Investimento Imobiliário em {cidade}/{uf}', descTemplate: 'Oportunidades de investimento imobiliário em {cidade}/{uf}. Renda passiva e valorização.', grupo: 'servicos', icon: '📈' },
  { slug: 'home-staging', titulo: 'Home Staging', h1Template: 'Home Staging em {cidade}/{uf}', descTemplate: 'Serviço de home staging em {cidade}/{uf}. Prepare seu imóvel para vender mais rápido.', grupo: 'servicos', icon: '🏡' },
]

// ── Profissionais ────────────────────────────────────────────────────────────
const PROFISSIONAIS: SeoCategoria[] = [
  { slug: 'engenheiros-civis', titulo: 'Engenheiros Civis', h1Template: 'Engenheiros Civis em {cidade}/{uf}', descTemplate: 'Engenheiros civis em {cidade}/{uf}. Projetos, laudos e ART.', grupo: 'profissionais', icon: '🏗️' },
  { slug: 'arquitetos', titulo: 'Arquitetos', h1Template: 'Arquitetos em {cidade}/{uf}', descTemplate: 'Arquitetos em {cidade}/{uf}. Projetos residenciais e comerciais.', grupo: 'profissionais', icon: '📐' },
  { slug: 'advogados-imobiliarios', titulo: 'Advogados Imobiliários', h1Template: 'Advogados Imobiliários em {cidade}/{uf}', descTemplate: 'Advogados especializados em direito imobiliário em {cidade}/{uf}.', grupo: 'profissionais', icon: '⚖️' },
  { slug: 'agrimensores', titulo: 'Agrimensores', h1Template: 'Agrimensores em {cidade}/{uf}', descTemplate: 'Serviço de agrimensura em {cidade}/{uf}. Topografia e georreferenciamento.', grupo: 'profissionais', icon: '📏' },
  { slug: 'corretores-de-imoveis', titulo: 'Corretores de Imóveis', h1Template: 'Corretores de Imóveis em {cidade}/{uf}', descTemplate: 'Corretores de imóveis em {cidade}/{uf}. Compra, venda e aluguel.', grupo: 'profissionais', icon: '🤝' },
  { slug: 'despachante-imobiliario', titulo: 'Despachante Imobiliário', h1Template: 'Despachante Imobiliário em {cidade}/{uf}', descTemplate: 'Despachante imobiliário em {cidade}/{uf}. Documentação e regularização.', grupo: 'profissionais', icon: '📋' },
  { slug: 'fotografo-imoveis', titulo: 'Fotógrafo de Imóveis', h1Template: 'Fotógrafo de Imóveis em {cidade}/{uf}', descTemplate: 'Fotógrafo profissional de imóveis em {cidade}/{uf}.', grupo: 'profissionais', icon: '📷' },
]

// ── Construção ───────────────────────────────────────────────────────────────
const CONSTRUCAO: SeoCategoria[] = [
  { slug: 'construtoras', titulo: 'Construtoras', h1Template: 'Construtoras em {cidade}/{uf}', descTemplate: 'Construtoras em {cidade}/{uf}. Construção residencial e comercial.', grupo: 'construcao', icon: '🏗️' },
  { slug: 'empreiteiros', titulo: 'Empreiteiros', h1Template: 'Empreiteiros em {cidade}/{uf}', descTemplate: 'Empreiteiros em {cidade}/{uf}. Obras residenciais e comerciais.', grupo: 'construcao', icon: '👷' },
  { slug: 'pedreiros', titulo: 'Pedreiros', h1Template: 'Pedreiros em {cidade}/{uf}', descTemplate: 'Pedreiros em {cidade}/{uf}. Construção e reforma.', grupo: 'construcao', icon: '🧱' },
  { slug: 'eletricistas', titulo: 'Eletricistas', h1Template: 'Eletricistas em {cidade}/{uf}', descTemplate: 'Eletricistas em {cidade}/{uf}. Instalações elétricas e manutenção.', grupo: 'construcao', icon: '⚡' },
  { slug: 'encanadores', titulo: 'Encanadores', h1Template: 'Encanadores em {cidade}/{uf}', descTemplate: 'Encanadores em {cidade}/{uf}. Instalações hidráulicas e reparos.', grupo: 'construcao', icon: '🔧' },
  { slug: 'pintores', titulo: 'Pintores', h1Template: 'Pintores em {cidade}/{uf}', descTemplate: 'Pintores em {cidade}/{uf}. Pintura residencial e comercial.', grupo: 'construcao', icon: '🎨' },
  { slug: 'marceneiros', titulo: 'Marceneiros', h1Template: 'Marceneiros em {cidade}/{uf}', descTemplate: 'Marceneiros em {cidade}/{uf}. Móveis planejados e sob medida.', grupo: 'construcao', icon: '🪚' },
  { slug: 'vidraceiros', titulo: 'Vidraceiros', h1Template: 'Vidraceiros em {cidade}/{uf}', descTemplate: 'Vidraceiros em {cidade}/{uf}. Box, espelhos e envidraçamento.', grupo: 'construcao', icon: '🪟' },
  { slug: 'serralheiros', titulo: 'Serralheiros', h1Template: 'Serralheiros em {cidade}/{uf}', descTemplate: 'Serralheiros em {cidade}/{uf}. Portões, grades e estruturas metálicas.', grupo: 'construcao', icon: '🔩' },
]

// ── Documentação ─────────────────────────────────────────────────────────────
const DOCUMENTACAO: SeoCategoria[] = [
  { slug: 'regularizacao-imovel', titulo: 'Regularização de Imóvel', h1Template: 'Regularização de Imóvel em {cidade}/{uf}', descTemplate: 'Regularização imobiliária em {cidade}/{uf}. Documentação e averbação.', grupo: 'documentacao', icon: '📋' },
  { slug: 'escritura-imovel', titulo: 'Escritura de Imóvel', h1Template: 'Escritura de Imóvel em {cidade}/{uf}', descTemplate: 'Escritura pública de imóvel em {cidade}/{uf}. Custos e procedimentos.', grupo: 'documentacao', icon: '📄' },
  { slug: 'usucapiao', titulo: 'Usucapião', h1Template: 'Usucapião em {cidade}/{uf}', descTemplate: 'Processo de usucapião em {cidade}/{uf}. Judicial e extrajudicial.', grupo: 'documentacao', icon: '⚖️' },
  { slug: 'inventario-imovel', titulo: 'Inventário de Imóvel', h1Template: 'Inventário de Imóvel em {cidade}/{uf}', descTemplate: 'Inventário imobiliário em {cidade}/{uf}. Judicial e extrajudicial.', grupo: 'documentacao', icon: '📑' },
]

// ── Filtros (quartos, preço, features) ───────────────────────────────────────
const FILTROS: SeoCategoria[] = [
  { slug: 'valor-metro-quadrado', titulo: 'Valor do Metro Quadrado', h1Template: 'Valor do Metro Quadrado em {cidade}/{uf}', descTemplate: 'Preço médio do m² em {cidade}/{uf}. Dados atualizados por bairro.', grupo: 'filtros', icon: '💲' },
  { slug: 'imoveis-1-quarto', titulo: 'Imóveis 1 Quarto', h1Template: 'Imóveis com 1 Quarto em {cidade}/{uf}', descTemplate: 'Imóveis com 1 quarto em {cidade}/{uf}. Studios e kitnets.', grupo: 'filtros', icon: '🛏️' },
  { slug: 'imoveis-2-quartos', titulo: 'Imóveis 2 Quartos', h1Template: 'Imóveis com 2 Quartos em {cidade}/{uf}', descTemplate: 'Imóveis com 2 quartos em {cidade}/{uf}.', grupo: 'filtros', icon: '🛏️' },
  { slug: 'imoveis-3-quartos', titulo: 'Imóveis 3 Quartos', h1Template: 'Imóveis com 3 Quartos em {cidade}/{uf}', descTemplate: 'Imóveis com 3 quartos em {cidade}/{uf}.', grupo: 'filtros', icon: '🛏️' },
  { slug: 'imoveis-4-quartos', titulo: 'Imóveis 4 Quartos', h1Template: 'Imóveis com 4+ Quartos em {cidade}/{uf}', descTemplate: 'Imóveis com 4 ou mais quartos em {cidade}/{uf}. Alto padrão.', grupo: 'filtros', icon: '🛏️' },
  { slug: 'imoveis-ate-200mil', titulo: 'Imóveis até R$ 200 mil', h1Template: 'Imóveis até R$ 200 mil em {cidade}/{uf}', descTemplate: 'Imóveis baratos em {cidade}/{uf}. Casas e apartamentos até R$ 200.000.', grupo: 'filtros', icon: '💰' },
  { slug: 'imoveis-200-500mil', titulo: 'Imóveis R$ 200-500 mil', h1Template: 'Imóveis de R$ 200 a R$ 500 mil em {cidade}/{uf}', descTemplate: 'Imóveis de médio padrão em {cidade}/{uf}.', grupo: 'filtros', icon: '💰' },
  { slug: 'imoveis-500mil-1milhao', titulo: 'Imóveis R$ 500 mil - 1 milhão', h1Template: 'Imóveis de R$ 500 mil a R$ 1 milhão em {cidade}/{uf}', descTemplate: 'Imóveis de alto padrão em {cidade}/{uf}.', grupo: 'filtros', icon: '💰' },
  { slug: 'imoveis-acima-1milhao', titulo: 'Imóveis acima R$ 1 milhão', h1Template: 'Imóveis acima de R$ 1 milhão em {cidade}/{uf}', descTemplate: 'Imóveis de luxo em {cidade}/{uf}. Mansões, coberturas e casas exclusivas.', grupo: 'filtros', icon: '💎' },
  { slug: 'aluguel-ate-1000', titulo: 'Aluguel até R$ 1.000', h1Template: 'Aluguel até R$ 1.000 em {cidade}/{uf}', descTemplate: 'Imóveis para alugar até R$ 1.000/mês em {cidade}/{uf}.', grupo: 'filtros', icon: '🔑' },
  { slug: 'aluguel-1000-2000', titulo: 'Aluguel R$ 1.000-2.000', h1Template: 'Aluguel de R$ 1.000 a R$ 2.000 em {cidade}/{uf}', descTemplate: 'Imóveis para alugar entre R$ 1.000 e R$ 2.000 em {cidade}/{uf}.', grupo: 'filtros', icon: '🔑' },
  { slug: 'aluguel-2000-3000', titulo: 'Aluguel R$ 2.000-3.000', h1Template: 'Aluguel de R$ 2.000 a R$ 3.000 em {cidade}/{uf}', descTemplate: 'Imóveis para alugar entre R$ 2.000 e R$ 3.000 em {cidade}/{uf}.', grupo: 'filtros', icon: '🔑' },
  { slug: 'aluguel-acima-3000', titulo: 'Aluguel acima R$ 3.000', h1Template: 'Aluguel acima de R$ 3.000 em {cidade}/{uf}', descTemplate: 'Imóveis de alto padrão para alugar em {cidade}/{uf}.', grupo: 'filtros', icon: '🔑' },
  { slug: 'imoveis-perto-metro', titulo: 'Imóveis Perto do Metrô', h1Template: 'Imóveis Perto do Metrô em {cidade}/{uf}', descTemplate: 'Imóveis próximos a estações de metrô em {cidade}/{uf}.', grupo: 'filtros', icon: '🚇' },
  { slug: 'imoveis-perto-escola', titulo: 'Imóveis Perto de Escola', h1Template: 'Imóveis Perto de Escola em {cidade}/{uf}', descTemplate: 'Imóveis próximos a escolas em {cidade}/{uf}. Ideal para famílias.', grupo: 'filtros', icon: '🏫' },
  { slug: 'imoveis-perto-hospital', titulo: 'Imóveis Perto de Hospital', h1Template: 'Imóveis Perto de Hospital em {cidade}/{uf}', descTemplate: 'Imóveis próximos a hospitais em {cidade}/{uf}.', grupo: 'filtros', icon: '🏥' },
  { slug: 'imoveis-perto-shopping', titulo: 'Imóveis Perto de Shopping', h1Template: 'Imóveis Perto de Shopping em {cidade}/{uf}', descTemplate: 'Imóveis próximos a shoppings em {cidade}/{uf}.', grupo: 'filtros', icon: '🛍️' },
  { slug: 'imoveis-com-piscina', titulo: 'Imóveis com Piscina', h1Template: 'Imóveis com Piscina em {cidade}/{uf}', descTemplate: 'Casas e apartamentos com piscina em {cidade}/{uf}.', grupo: 'filtros', icon: '🏊' },
  { slug: 'imoveis-com-churrasqueira', titulo: 'Imóveis com Churrasqueira', h1Template: 'Imóveis com Churrasqueira em {cidade}/{uf}', descTemplate: 'Imóveis com área gourmet e churrasqueira em {cidade}/{uf}.', grupo: 'filtros', icon: '🔥' },
  { slug: 'imoveis-aceita-pets', titulo: 'Imóveis Aceita Pets', h1Template: 'Imóveis que Aceitam Pets em {cidade}/{uf}', descTemplate: 'Imóveis pet-friendly em {cidade}/{uf}. Casas e apartamentos que aceitam animais.', grupo: 'filtros', icon: '🐾' },
  { slug: 'imoveis-mobiliados', titulo: 'Imóveis Mobiliados', h1Template: 'Imóveis Mobiliados em {cidade}/{uf}', descTemplate: 'Imóveis mobiliados à venda e para alugar em {cidade}/{uf}.', grupo: 'filtros', icon: '🛋️' },
  { slug: 'imoveis-com-varanda', titulo: 'Imóveis com Varanda', h1Template: 'Imóveis com Varanda em {cidade}/{uf}', descTemplate: 'Apartamentos e casas com varanda em {cidade}/{uf}.', grupo: 'filtros', icon: '🌅' },
]

// ── Outros ────────────────────────────────────────────────────────────────────
const OUTROS: SeoCategoria[] = [
  { slug: 'seguro-residencial', titulo: 'Seguro Residencial', h1Template: 'Seguro Residencial em {cidade}/{uf}', descTemplate: 'Seguro residencial em {cidade}/{uf}. Compare preços e coberturas.', grupo: 'outros', icon: '🛡️' },
  { slug: 'seguro-incendio', titulo: 'Seguro Incêndio', h1Template: 'Seguro Incêndio em {cidade}/{uf}', descTemplate: 'Seguro incêndio obrigatório em {cidade}/{uf}.', grupo: 'outros', icon: '🔥' },
  { slug: 'empresas-mudanca', titulo: 'Empresas de Mudança', h1Template: 'Empresas de Mudança em {cidade}/{uf}', descTemplate: 'Transportadoras e empresas de mudança em {cidade}/{uf}.', grupo: 'outros', icon: '🚛' },
  { slug: 'guarda-moveis', titulo: 'Guarda-Móveis', h1Template: 'Guarda-Móveis em {cidade}/{uf}', descTemplate: 'Self storage e guarda-móveis em {cidade}/{uf}.', grupo: 'outros', icon: '📦' },
  { slug: 'limpeza-pos-obra', titulo: 'Limpeza Pós-Obra', h1Template: 'Limpeza Pós-Obra em {cidade}/{uf}', descTemplate: 'Serviço de limpeza pós-obra em {cidade}/{uf}.', grupo: 'outros', icon: '🧹' },
  { slug: 'dedetizacao', titulo: 'Dedetização', h1Template: 'Dedetização em {cidade}/{uf}', descTemplate: 'Dedetização e controle de pragas em {cidade}/{uf}.', grupo: 'outros', icon: '🐛' },
  { slug: 'jardinagem-paisagismo', titulo: 'Jardinagem e Paisagismo', h1Template: 'Jardinagem e Paisagismo em {cidade}/{uf}', descTemplate: 'Paisagismo e jardinagem em {cidade}/{uf}.', grupo: 'outros', icon: '🌿' },
  { slug: 'impermeabilizacao', titulo: 'Impermeabilização', h1Template: 'Impermeabilização em {cidade}/{uf}', descTemplate: 'Impermeabilização de lajes, piscinas e reservatórios em {cidade}/{uf}.', grupo: 'outros', icon: '💧' },
]

// ── Exports ──────────────────────────────────────────────────────────────────
export const ALL_SEO_CATEGORIAS: SeoCategoria[] = [
  ...IMOVEIS, ...LEILAO, ...SERVICOS, ...PROFISSIONAIS,
  ...CONSTRUCAO, ...DOCUMENTACAO, ...FILTROS, ...OUTROS,
]

export const SEO_CATEGORIAS_MAP: Record<string, SeoCategoria> = Object.fromEntries(
  ALL_SEO_CATEGORIAS.map(c => [c.slug, c])
)

/** All category slugs for rewrite matching */
export const ALL_CATEGORY_SLUGS = ALL_SEO_CATEGORIAS.map(c => c.slug)

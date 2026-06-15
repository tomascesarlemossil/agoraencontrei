/**
 * Dados de demonstração — Ligia Giani Imóveis (Franca/SP)
 *
 * Fonte: dados públicos reais do site da corretora (ligiagianiimoveis.com.br),
 * usados para alimentar a apresentação autônoma do AgoraEncontrei.
 * As fotos são servidas diretamente do CDN público da plataforma de origem.
 *
 * Este arquivo NÃO depende de banco de dados — alimenta a página
 * /apresentacao/ligia-giani. O mesmo conjunto é replicado no seed
 * (packages/database/prisma/seed-ligiagiani.ts) para o sistema real.
 */

const CDN = 'https://imgs1.cdn-imobibrasil.com.br/imagens/imoveis/'
const img = (file: string) => `${CDN}${file}.jpeg`

export interface DemoProperty {
  reference: string
  title: string
  type: 'APARTMENT' | 'HOUSE' | 'PENTHOUSE'
  typeLabel: string
  purpose: 'SALE'
  price: number | null
  condoFee?: number | null
  city: string
  state: string
  neighborhood: string
  condoName?: string
  bedrooms: number
  suites: number
  bathrooms: number
  parkingSpaces: number
  area: number
  areaLabel?: string
  description: string
  features: string[]
  images: string[]
  isFeatured?: boolean
}

export const LIGIA_COMPANY = {
  name: 'Ligia Giani Imóveis',
  tradeName: 'Ligia Giani Imóveis',
  agent: 'Lígia Giani',
  creci: 'CRECI 46401-J',
  phone: '(16) 99102-9559',
  whatsapp: '5516991029559',
  email: 'ligia.gmd@hotmail.com',
  address: 'Av. Dr. Armando de Salles Oliveira, 435 — Parque Universitário',
  city: 'Franca',
  state: 'SP',
  zipCode: '14404-600',
  website: 'https://www.ligiagianiimoveis.com.br',
  instagram: 'https://www.instagram.com/ligiagianiimoveis/',
  facebook: 'https://www.facebook.com/ligiagianiimoveis/',
  about:
    'A Ligia Giani Imóveis atua no mercado imobiliário de Franca e região com um histórico íntegro e de ótimas negociações. Oferecemos atendimento personalizado, transmitindo segurança em todos os negócios realizados.',
  // Acesso de parceira no AgoraEncontrei (criado via seed)
  tenant: {
    subdomain: 'ligiagiani',
    siteUrl: 'https://ligiagiani.agoraencontrei.com.br',
    login: 'ligiagiani@agoraencontrei.com.br',
    password: 'muitasvendas',
    plan: 'PRO',
    theme: 'luxury_gold',
  },
}

export const LIGIA_PROPERTIES: DemoProperty[] = [
  {
    reference: 'LG-01',
    title: 'Apartamento alto padrão no Residencial Amazonas',
    type: 'APARTMENT',
    typeLabel: 'Apartamento',
    purpose: 'SALE',
    price: 580000,
    condoFee: 200,
    city: 'Franca',
    state: 'SP',
    neighborhood: 'Residencial Amazonas',
    bedrooms: 3,
    suites: 1,
    bathrooms: 3,
    parkingSpaces: 2,
    area: 102.85,
    description:
      'Maravilhoso apartamento no 2º andar com 3 dormitórios (1 suíte encantadora com banheira), banheiro social, ampla lavanderia, sala com iluminação especial, móveis modernos de qualidade, cozinha, ampla varanda e 2 vagas de garagem. Prédio com elevador. Apenas 1,5 ano de uso.',
    features: ['Ar-condicionado', 'Aquecimento solar', 'Móveis planejados', 'Hidromassagem', 'Área de serviço', 'Elevador'],
    isFeatured: true,
    images: [
      img('202408301932523160'), img('2024083019325394'), img('202408301932541644'),
      img('202408301932545648'), img('202408301932568255'), img('202408301932578960'),
      img('2024083019325792'), img('202408301932583353'), img('202408301932595112'),
    ],
  },
  {
    reference: 'LG-02',
    title: 'Apartamento mobiliado no Edifício The One',
    type: 'APARTMENT',
    typeLabel: 'Apartamento',
    purpose: 'SALE',
    price: 500000,
    city: 'Franca',
    state: 'SP',
    neighborhood: 'The One',
    condoName: 'Edifício The One',
    bedrooms: 3,
    suites: 1,
    bathrooms: 2,
    parkingSpaces: 2,
    area: 67,
    description:
      'Apartamento moderno de 67m² com três dormitórios (uma suíte), totalmente mobiliado, com duas vagas de garagem. Andar alto com sol da manhã. O edifício oferece academia, piscina e área gourmet.',
    features: ['Mobiliado', 'Portão eletrônico', 'Móveis planejados', 'Academia', 'Piscina', 'Área gourmet'],
    isFeatured: true,
    images: [
      img('202409121853573055'), img('202409121855095482'), img('202409121855093883'),
      img('202409121855096992'), img('202409121855105434'), img('202409121855348904'),
      img('202409121855347240'), img('20240912185534690'), img('202409121855349471'),
      img('202409121855351195'),
    ],
  },
  {
    reference: 'LG-03',
    title: 'Casa mobiliada e pronta para morar no Zanetti',
    type: 'HOUSE',
    typeLabel: 'Casa',
    purpose: 'SALE',
    price: 450000,
    city: 'Franca',
    state: 'SP',
    neighborhood: 'Zanetti',
    bedrooms: 2,
    suites: 1,
    bathrooms: 2,
    parkingSpaces: 2,
    area: 125,
    areaLabel: '125 m² (terreno) • 120 m² construídos',
    description:
      'Casa toda mobiliada e pronta para morar! 2 dormitórios, incluindo 1 suíte. Sala com acabamento em sancas, luzes de LED e lustre. Cozinha com armários planejados, lavanderia completa e jardim de inverno com paisagismo encantador. Iluminação em LED econômica e moderna. 2 vagas de garagem coberta.',
    features: ['Mobiliada', 'Portão eletrônico', 'Móveis planejados', 'Jardim de inverno', 'Área de serviço'],
    isFeatured: true,
    images: [
      img('202411102115518461'), img('202411102118253570'), img('202411102118261906'),
      img('202411102118269325'), img('202411102118262122'), img('20241110211826800'),
      img('202411102118271275'), img('202411102118277074'), img('20241110211827846'),
      img('202411102118275838'),
    ],
  },
  {
    reference: 'LG-04',
    title: 'Apartamento moderno no Santa Lúcia',
    type: 'APARTMENT',
    typeLabel: 'Apartamento',
    purpose: 'SALE',
    price: 320000,
    city: 'Franca',
    state: 'SP',
    neighborhood: 'Santa Lúcia',
    bedrooms: 2,
    suites: 1,
    bathrooms: 2,
    parkingSpaces: 2,
    area: 77.41,
    description:
      'Apartamento moderno, bem localizado e pronto para morar. Cozinha com bancada em granito, cooktop, iluminação em LED, área gourmet com churrasqueira e móveis planejados. Duas salas.',
    features: ['Mobiliado', 'Portão eletrônico', 'Móveis planejados', 'Área gourmet', 'Churrasqueira'],
    images: [
      img('202503251719159220'), img('202503251719448151'), img('202503251719444334'),
      img('202503251719441784'), img('202503251719453898'), img('202503251719458401'),
      img('202503251719452561'), img('202503251719451624'), img('20250325171945784'),
      img('202503251719468795'),
    ],
  },
  {
    reference: 'LG-05',
    title: 'Apartamento de alto padrão no Edifício Dublin',
    type: 'APARTMENT',
    typeLabel: 'Apartamento',
    purpose: 'SALE',
    price: 1100000,
    city: 'Franca',
    state: 'SP',
    neighborhood: 'Edifício Dublin',
    condoName: 'Edifício Dublin',
    bedrooms: 3,
    suites: 3,
    bathrooms: 4,
    parkingSpaces: 2,
    area: 127,
    description:
      'Lindo apartamento no Edifício Dublin, com 127m² de área útil. Conta com 3 suítes, varanda gourmet, sala de TV e jantar, cozinha e apartamento completo em armários. O edifício oferece lazer completo: academia, salão de festas, piscina e muito mais.',
    features: ['Ar-condicionado', 'Aquecimento solar', 'Móveis planejados', 'Varanda gourmet', 'Academia', 'Piscina'],
    isFeatured: true,
    images: [
      img('202408281616246460'), img('202408281616261620'), img('202408281616267873'),
      img('202408281616277814'), img('20240828161627838'), img('20240828161627868'),
      img('202408281616271757'), img('202408281616287174'), img('202408281616283547'),
      img('202408281616281572'),
    ],
  },
  {
    reference: 'LG-06',
    title: 'Apartamento todo em porcelanato no Primo Meneghetti II',
    type: 'APARTMENT',
    typeLabel: 'Apartamento',
    purpose: 'SALE',
    price: 230000,
    city: 'Franca',
    state: 'SP',
    neighborhood: 'Primo Meneghetti II',
    bedrooms: 2,
    suites: 1,
    bathrooms: 2,
    parkingSpaces: 1,
    area: 65,
    description:
      'Lindo apartamento no Primo Meneghetti II, com 65m² de área útil, dois dormitórios (sendo 1 suíte), todo em porcelanato e 1 vaga de garagem. Ótimo para morar ou investir.',
    features: ['Porcelanato', 'Duas salas', 'Cozinha', 'Área de serviço'],
    images: [
      img('202410151146535384'), img('202410151148084093'), img('202410151148099738'),
      img('202410151148094903'), img('202410151148096428'), img('202410151148094879'),
      img('202410151148104882'), img('202410151148101664'), img('202410151148101297'),
      img('202410151148107273'),
    ],
  },
  {
    reference: 'LG-07',
    title: 'Apartamento mobiliado próximo à UNIP — Ribeirão Preto',
    type: 'APARTMENT',
    typeLabel: 'Apartamento',
    purpose: 'SALE',
    price: 320000,
    condoFee: 67,
    city: 'Ribeirão Preto',
    state: 'SP',
    neighborhood: 'Nova Aliança',
    bedrooms: 2,
    suites: 1,
    bathrooms: 2,
    parkingSpaces: 1,
    area: 57,
    description:
      'Apartamento mobiliado na Nova Aliança, com dois dormitórios com closet (uma suíte), dois banheiros, sala, varanda, cozinha equipada e lavanderia. O condomínio possui piscina adulto/infantil, área verde de descanso, salão de festas, churrasqueira, mercadinho e espaço fitness.',
    features: ['Mobiliado', 'Portão eletrônico', 'Móveis planejados', 'Segurança 24h', 'Elevador', 'Piscina'],
    images: [
      img('20241003064232275'), img('202410030643402163'), img('202410030643407551'),
      img('202410030643416311'), img('202410030643426949'), img('2024100306434384'),
      img('202410030643431873'), img('202410030643446451'), img('20241003064344653'),
      img('202410030643454038'),
    ],
  },
  {
    reference: 'LG-08',
    title: 'Apartamento com terraço privativo no Edifício Le Mans',
    type: 'APARTMENT',
    typeLabel: 'Apartamento',
    purpose: 'SALE',
    price: 850000,
    condoFee: 550,
    city: 'Franca',
    state: 'SP',
    neighborhood: 'Paraíso',
    condoName: 'Edifício Le Mans',
    bedrooms: 3,
    suites: 3,
    bathrooms: 4,
    parkingSpaces: 2,
    area: 172,
    areaLabel: '172 m² úteis (68 m² de terraço privativo)',
    description:
      'Apartamento no Edifício Le Mans com 172m² de área útil, incluindo 68m² de terraço privativo. Salas de estar e jantar integradas, cozinha gourmet, terraço privativo e garagem coberta. Portão remoto 24h. Pronto para morar.',
    features: ['Terraço privativo', 'Portão eletrônico', 'Cozinha gourmet', 'Garagem coberta'],
    isFeatured: true,
    images: [
      img('2024101709435054'), img('202410170944402503'), img('202410170944403879'),
      img('202410170944403215'), img('202410170944413766'), img('2024101709444172'),
      img('202410170944427508'), img('202410170944421772'), img('202410170944427645'),
      img('20241017094442390'),
    ],
  },
  {
    reference: 'LG-09',
    title: 'Apartamento sofisticado no Edifício Modernitá',
    type: 'APARTMENT',
    typeLabel: 'Apartamento',
    purpose: 'SALE',
    price: 1450000,
    city: 'Franca',
    state: 'SP',
    neighborhood: 'Edifício Modernitá',
    condoName: 'Edifício Modernitá',
    bedrooms: 3,
    suites: 3,
    bathrooms: 4,
    parkingSpaces: 2,
    area: 144,
    description:
      'Apartamento sofisticado e mobiliado com 144m² de área útil. São 3 suítes, sendo uma master com closet, cozinha completa, lavanderia, sala de TV e jantar com ambientes integrados, além de varanda gourmet. Edifício com lazer completo.',
    features: ['Ar-condicionado', 'Móveis planejados', 'Varanda gourmet', 'Suíte master com closet'],
    isFeatured: true,
    images: [
      img('202410281107517931'), img('202410281110215886'), img('2024102811102157'),
      img('202410281110227657'), img('202410281110229118'), img('202410281110227552'),
      img('202410281110227866'), img('202410281110236048'), img('2024102811102347'),
      img('202410281110233903'),
    ],
  },
  {
    reference: 'LG-10',
    title: 'Cobertura com 3 suítes na Vila Industrial',
    type: 'PENTHOUSE',
    typeLabel: 'Cobertura',
    purpose: 'SALE',
    price: 499000,
    city: 'Franca',
    state: 'SP',
    neighborhood: 'Vila Industrial',
    bedrooms: 3,
    suites: 3,
    bathrooms: 3,
    parkingSpaces: 2,
    area: 110,
    description:
      'Ampla cobertura com três suítes, sala de TV espaçosa, cozinha com ilha, lavanderia separada, dois terraços com solário e duas vagas de garagem.',
    features: ['Cobertura', 'Portão eletrônico', 'Cozinha com ilha', 'Dois terraços', 'Solário'],
    images: [
      img('202411221422562812'), img('20241122142613888'), img('202411221426142844'),
      img('202411221426143055'), img('202411221426148341'), img('202411221426141990'),
      img('202411221426144921'), img('202411221426144732'), img('202411221426149697'),
      img('202411221426159089'),
    ],
  },
  {
    reference: 'LG-11',
    title: 'Apartamentos novos no Jardim Adelinha — ótimo investimento',
    type: 'APARTMENT',
    typeLabel: 'Apartamento',
    purpose: 'SALE',
    price: null,
    city: 'Franca',
    state: 'SP',
    neighborhood: 'Jardim Adelinha',
    bedrooms: 2,
    suites: 1,
    bathrooms: 2,
    parkingSpaces: 1,
    area: 61,
    areaLabel: '61 m² (térreo) a 69 m² (com varanda)',
    description:
      'Apartamentos no Jardim Adelinha com dois dormitórios (uma suíte), sala e cozinha integradas, uma vaga de garagem e armários de cozinha. Unidades térreas de 61m² e unidades com varanda de 69m². Ótimo investimento.',
    features: ['Portão eletrônico', 'Móveis planejados', 'Sala e cozinha integradas', 'Área de serviço'],
    images: [
      img('202409022117058622'), img('202409022117056093'), img('202409022117065569'),
      img('202409022117062942'), img('202409022117061203'), img('202409022117063342'),
      img('202409022117075777'), img('202409022117071650'), img('202409022117078683'),
    ],
  },
]

export function formatBRL(value: number | null): string {
  if (value == null) return 'Sob consulta'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

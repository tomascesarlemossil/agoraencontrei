/**
 * Data layer expandido: 152 cidades com dados IBGE reais
 * Gerado automaticamente via API IBGE + manifesto_blocos_1M.xlsx
 * Cobre 6 estados: SP, MG, GO, PR, MS, RJ
 * Total de cidades: 152
 * Potencial: 152 cidades × 278.311 slugs únicos = 278k+ páginas
 */

export interface IbgeCityData {
  slug: string          // ex: 'franca-sp'
  name: string          // ex: 'Franca'
  state: string         // ex: 'SP'
  stateSlug: string     // ex: 'sp'
  stateName: string     // ex: 'São Paulo'
  ibgeId: number        // código IBGE do município
  populacao: number     // habitantes (censo/estimativa IBGE)
  areakm2: number       // área territorial em km²
  pibPerCapita: number  // PIB per capita em R$
  salarioMedioSM: number // salário médio em salários mínimos
  region: string        // classificação regional
}

// ── Goiás (13 cidades) ────────────────────────────────────────
const CIDADES_GO: IbgeCityData[] = [
  { slug: 'goiania', name: 'Goiânia', state: 'GO', stateSlug: 'go', stateName: 'Goiás', ibgeId: 5208707, populacao: 1503256, areakm2: 1776.74, pibPerCapita: 52722.02, salarioMedioSM: 3.2, region: 'capital' },
  { slug: 'aparecida-de-goiania', name: 'Aparecida de Goiânia', state: 'GO', stateSlug: 'go', stateName: 'Goiás', ibgeId: 5201405, populacao: 556021, areakm2: 1580.27, pibPerCapita: 39577.67, salarioMedioSM: 2.1, region: 'grande-go' },
  { slug: 'anapolis', name: 'Anápolis', state: 'GO', stateSlug: 'go', stateName: 'Goiás', ibgeId: 5201108, populacao: 420300, areakm2: 358.58, pibPerCapita: 51225.11, salarioMedioSM: 2.5, region: 'interior-go' },
  { slug: 'rio-verde', name: 'Rio Verde', state: 'GO', stateSlug: 'go', stateName: 'Goiás', ibgeId: 5218805, populacao: 241494, areakm2: 21.05, pibPerCapita: 98849.92, salarioMedioSM: 2.6, region: 'interior-go' },
  { slug: 'catalao', name: 'Catalão', state: 'GO', stateSlug: 'go', stateName: 'Goiás', ibgeId: 5205109, populacao: 122760, areakm2: 22.67, pibPerCapita: 90415.66, salarioMedioSM: 2.8, region: 'interior-go' },
  { slug: 'itumbiara', name: 'Itumbiara', state: 'GO', stateSlug: 'go', stateName: 'Goiás', ibgeId: 5211503, populacao: 113322, areakm2: 37.71, pibPerCapita: 60714.79, salarioMedioSM: 2.3, region: 'interior-go' },
  { slug: 'jatai', name: 'Jataí', state: 'GO', stateSlug: 'go', stateName: 'Goiás', ibgeId: 5211909, populacao: 111634, areakm2: 12.27, pibPerCapita: 94828.45, salarioMedioSM: 2.5, region: 'interior-go' },
  { slug: 'caldas-novas', name: 'Caldas Novas', state: 'GO', stateSlug: 'go', stateName: 'Goiás', ibgeId: 5204508, populacao: 106820, areakm2: 44.16, pibPerCapita: 38348.69, salarioMedioSM: 1.8, region: 'interior-go' },
  { slug: 'mineiros', name: 'Mineiros', state: 'GO', stateSlug: 'go', stateName: 'Goiás', ibgeId: 5213103, populacao: 74999, areakm2: 5.84, pibPerCapita: 64729.74, salarioMedioSM: 2.4, region: 'interior-go' },
  { slug: 'cristalina', name: 'Cristalina', state: 'GO', stateSlug: 'go', stateName: 'Goiás', ibgeId: 5206206, populacao: 66827, areakm2: 7.56, pibPerCapita: 91562.29, salarioMedioSM: 2.2, region: 'interior-go' },
  { slug: 'morrinhos', name: 'Morrinhos', state: 'GO', stateSlug: 'go', stateName: 'Goiás', ibgeId: 5213806, populacao: 54326, areakm2: 14.57, pibPerCapita: 49152.36, salarioMedioSM: 2.2, region: 'interior-go' },
  { slug: 'quirinopolis', name: 'Quirinópolis', state: 'GO', stateSlug: 'go', stateName: 'Goiás', ibgeId: 5218508, populacao: 50329, areakm2: 11.41, pibPerCapita: 64472.6, salarioMedioSM: 2.2, region: 'interior-go' },
  { slug: 'santa-helena-de-goias', name: 'Santa Helena de Goiás', state: 'GO', stateSlug: 'go', stateName: 'Goiás', ibgeId: 5219308, populacao: 39601, areakm2: 31.95, pibPerCapita: 51848.48, salarioMedioSM: 2.1, region: 'interior-go' },
]

// ── Minas Gerais (43 cidades) ────────────────────────────────────────
const CIDADES_MG: IbgeCityData[] = [
  { slug: 'belo-horizonte', name: 'Belo Horizonte', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3106200, populacao: 2415872, areakm2: 7167.0, pibPerCapita: 56227.29, salarioMedioSM: 3.5, region: 'capital' },
  { slug: 'uberlandia', name: 'Uberlândia', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3170206, populacao: 761835, areakm2: 146.78, pibPerCapita: 71598.38, salarioMedioSM: 2.6, region: 'grande-mg' },
  { slug: 'juiz-de-fora', name: 'Juiz de Fora', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3136702, populacao: 567730, areakm2: 359.59, pibPerCapita: 43035.36, salarioMedioSM: 2.4, region: 'grande-mg' },
  { slug: 'uberaba', name: 'Uberaba', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3170107, populacao: 356781, areakm2: 65.43, pibPerCapita: 70120.94, salarioMedioSM: 2.6, region: 'interior-mg' },
  { slug: 'divinopolis', name: 'Divinópolis', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3122306, populacao: 243583, areakm2: 300.82, pibPerCapita: 40414.09, salarioMedioSM: 2.1, region: 'interior-mg' },
  { slug: 'sete-lagoas', name: 'Sete Lagoas', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3167202, populacao: 238909, areakm2: 398.32, pibPerCapita: 65543.81, salarioMedioSM: 2.3, region: 'interior-mg' },
  { slug: 'pocos-de-caldas', name: 'Poços de Caldas', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3151800, populacao: 172339, areakm2: 278.54, pibPerCapita: 65547.68, salarioMedioSM: 2.4, region: 'interior-mg' },
  { slug: 'patos-de-minas', name: 'Patos de Minas', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3148004, populacao: 169173, areakm2: 43.49, pibPerCapita: 51190.81, salarioMedioSM: 2.2, region: 'interior-mg' },
  { slug: 'pouso-alegre', name: 'Pouso Alegre', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3152501, populacao: 162133, areakm2: 240.51, pibPerCapita: 93295.79, salarioMedioSM: 2.4, region: 'interior-mg' },
  { slug: 'varginha', name: 'Varginha', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3170701, populacao: 143676, areakm2: 311.29, pibPerCapita: 73780.24, salarioMedioSM: 2.2, region: 'interior-mg' },
  { slug: 'conselheiro-lafaiete', name: 'Conselheiro Lafaiete', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3118304, populacao: 138946, areakm2: 314.69, pibPerCapita: 26459.67, salarioMedioSM: 1.8, region: 'interior-mg' },
  { slug: 'araguari', name: 'Araguari', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3103504, populacao: 123432, areakm2: 40.23, pibPerCapita: 58217.9, salarioMedioSM: 2.2, region: 'interior-mg' },
  { slug: 'araxa', name: 'Araxá', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3104007, populacao: 118786, areakm2: 80.45, pibPerCapita: 79211.75, salarioMedioSM: 2.7, region: 'interior-mg' },
  { slug: 'passos', name: 'Passos', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3147907, populacao: 116951, areakm2: 79.44, pibPerCapita: 36449.37, salarioMedioSM: 2.0, region: 'interior-mg' },
  { slug: 'lavras', name: 'Lavras', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3138203, populacao: 110682, areakm2: 163.26, pibPerCapita: 37386.83, salarioMedioSM: 2.5, region: 'interior-mg' },
  { slug: 'ituiutaba', name: 'Ituiutaba', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3134202, populacao: 106775, areakm2: 37.4, pibPerCapita: 48673.56, salarioMedioSM: 1.9, region: 'interior-mg' },
  { slug: 'itauna', name: 'Itaúna', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3133808, populacao: 103272, areakm2: 172.38, pibPerCapita: 50947.27, salarioMedioSM: 2.2, region: 'interior-mg' },
  { slug: 'para-de-minas', name: 'Pará de Minas', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3147105, populacao: 102844, areakm2: 152.77, pibPerCapita: 53134.48, salarioMedioSM: 2.0, region: 'interior-mg' },
  { slug: 'itajuba', name: 'Itajubá', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3132404, populacao: 96855, areakm2: 307.49, pibPerCapita: 48327.22, salarioMedioSM: 2.8, region: 'interior-mg' },
  { slug: 'patrocinio', name: 'Patrocínio', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3148103, populacao: 94357, areakm2: 28.69, pibPerCapita: 54502.98, salarioMedioSM: 2.1, region: 'interior-mg' },
  { slug: 'alfenas', name: 'Alfenas', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3101607, populacao: 82303, areakm2: 86.75, pibPerCapita: 46472.06, salarioMedioSM: 2.5, region: 'interior-mg' },
  { slug: 'tres-coracoes', name: 'Três Corações', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3169307, populacao: 78291, areakm2: 87.88, pibPerCapita: 47277.07, salarioMedioSM: 2.1, region: 'interior-mg' },
  { slug: 'sao-sebastiao-do-paraiso', name: 'São Sebastião do Paraíso', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3164704, populacao: 75179, areakm2: 79.74, pibPerCapita: 39476.43, salarioMedioSM: 1.9, region: 'interior-mg' },
  { slug: 'formiga', name: 'Formiga', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3126109, populacao: 70897, areakm2: 43.36, pibPerCapita: 43506.98, salarioMedioSM: 1.7, region: 'interior-mg' },
  { slug: 'extrema', name: 'Extrema', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3125101, populacao: 59336, areakm2: 116.93, pibPerCapita: 377790.63, salarioMedioSM: 2.5, region: 'interior-mg' },
  { slug: 'bom-despacho', name: 'Bom Despacho', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3107406, populacao: 54377, areakm2: 37.28, pibPerCapita: 42391.56, salarioMedioSM: 1.8, region: 'interior-mg' },
  { slug: 'guaxupe', name: 'Guaxupé', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3128709, populacao: 52744, areakm2: 172.59, pibPerCapita: 47760.99, salarioMedioSM: 2.2, region: 'interior-mg' },
  { slug: 'monte-carmelo', name: 'Monte Carmelo', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3143104, populacao: 49500, areakm2: 34.08, pibPerCapita: 41037.5, salarioMedioSM: 1.8, region: 'interior-mg' },
  { slug: 'oliveira', name: 'Oliveira', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3145604, populacao: 40576, areakm2: 43.98, pibPerCapita: 37268.52, salarioMedioSM: 1.7, region: 'interior-mg' },
  { slug: 'piumhi', name: 'Piumhi', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3151503, populacao: 38007, areakm2: 35.33, pibPerCapita: 43496.6, salarioMedioSM: 1.8, region: 'interior-mg' },
  { slug: 'sacramento', name: 'Sacramento', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3156908, populacao: 28076, areakm2: 7.78, pibPerCapita: 89506.92, salarioMedioSM: 2.1, region: 'interior-mg' },
  { slug: 'muzambinho', name: 'Muzambinho', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3144102, populacao: 22620, areakm2: 49.84, pibPerCapita: 33933.26, salarioMedioSM: 2.0, region: 'interior-mg' },
  { slug: 'monte-santo-de-minas', name: 'Monte Santo de Minas', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3143203, populacao: 21294, areakm2: 35.71, pibPerCapita: 30279.32, salarioMedioSM: 1.7, region: 'interior-mg' },
  { slug: 'alpinopolis', name: 'Alpinópolis', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3101904, populacao: 18673, areakm2: 40.66, pibPerCapita: 33804.26, salarioMedioSM: 1.8, region: 'interior-mg' },
  { slug: 'perdizes', name: 'Perdizes', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3149804, populacao: 17992, areakm2: 5.88, pibPerCapita: 150305.14, salarioMedioSM: 2.0, region: 'interior-mg' },
  { slug: 'cassia', name: 'Cássia', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3115102, populacao: 17491, areakm2: 26.15, pibPerCapita: 30305.57, salarioMedioSM: 2.0, region: 'interior-mg' },
  { slug: 'nova-resende', name: 'Nova Resende', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3145109, populacao: 16919, areakm2: 39.41, pibPerCapita: 30082.15, salarioMedioSM: 1.8, region: 'interior-mg' },
  { slug: 'campos-altos', name: 'Campos Altos', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3111507, populacao: 13076, areakm2: 19.99, pibPerCapita: 40439.11, salarioMedioSM: 2.1, region: 'interior-mg' },
  { slug: 'delta', name: 'Delta', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3121258, populacao: 11143, areakm2: 78.66, pibPerCapita: 67510.91, salarioMedioSM: 2.9, region: 'interior-mg' },
  { slug: 'ibiraci', name: 'Ibiraci', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3129707, populacao: 10996, areakm2: 21.66, pibPerCapita: 81825.83, salarioMedioSM: 2.4, region: 'interior-mg' },
  { slug: 'capitolio', name: 'Capitólio', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3112802, populacao: 10991, areakm2: 15.68, pibPerCapita: 42758.08, salarioMedioSM: 1.8, region: 'interior-mg' },
  { slug: 'jacui', name: 'Jacuí', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3134806, populacao: 7668, areakm2: 18.33, pibPerCapita: 24856.4, salarioMedioSM: 1.7, region: 'interior-mg' },
  { slug: 'conquista', name: 'Conquista', state: 'MG', stateSlug: 'mg', stateName: 'Minas Gerais', ibgeId: 3118205, populacao: 6878, areakm2: 10.55, pibPerCapita: 100331.51, salarioMedioSM: 2.4, region: 'interior-mg' },
]

// ── Mato Grosso do Sul (5 cidades) ────────────────────────────────────────
const CIDADES_MS: IbgeCityData[] = [
  { slug: 'tres-lagoas', name: 'Três Lagoas', state: 'MS', stateSlug: 'ms', stateName: 'Mato Grosso do Sul', ibgeId: 5008305, populacao: 143523, areakm2: 9.97, pibPerCapita: 111703.31, salarioMedioSM: 3.0, region: 'interior-ms' },
  { slug: 'paranaiba', name: 'Paranaíba', state: 'MS', stateSlug: 'ms', stateName: 'Mato Grosso do Sul', ibgeId: 5006309, populacao: 42638, areakm2: 7.44, pibPerCapita: 49127.28, salarioMedioSM: 1.9, region: 'interior-ms' },
  { slug: 'chapadao-do-sul', name: 'Chapadão do Sul', state: 'MS', stateSlug: 'ms', stateName: 'Mato Grosso do Sul', ibgeId: 5002951, populacao: 34606, areakm2: 5.1, pibPerCapita: 107428.37, salarioMedioSM: 2.5, region: 'interior-ms' },
  { slug: 'costa-rica', name: 'Costa Rica', state: 'MS', stateSlug: 'ms', stateName: 'Mato Grosso do Sul', ibgeId: 5003256, populacao: 28740, areakm2: 3.67, pibPerCapita: 128336.26, salarioMedioSM: 2.5, region: 'interior-ms' },
  { slug: 'cassilandia', name: 'Cassilândia', state: 'MS', stateSlug: 'ms', stateName: 'Mato Grosso do Sul', ibgeId: 5002902, populacao: 21565, areakm2: 5.74, pibPerCapita: 50503.78, salarioMedioSM: 2.1, region: 'interior-ms' },
]

// ── Paraná (8 cidades) ────────────────────────────────────────
const CIDADES_PR: IbgeCityData[] = [
  { slug: 'londrina', name: 'Londrina', state: 'PR', stateSlug: 'pr', stateName: 'Paraná', ibgeId: 4113700, populacao: 581382, areakm2: 306.52, pibPerCapita: 50362.05, salarioMedioSM: 2.8, region: 'grande-pr' },
  { slug: 'maringa', name: 'Maringá', state: 'PR', stateSlug: 'pr', stateName: 'Paraná', ibgeId: 4115200, populacao: 429660, areakm2: 733.14, pibPerCapita: 67903.99, salarioMedioSM: 2.7, region: 'interior-pr' },
  { slug: 'apucarana', name: 'Apucarana', state: 'PR', stateSlug: 'pr', stateName: 'Paraná', ibgeId: 4101408, populacao: 134910, areakm2: 216.55, pibPerCapita: 37146.42, salarioMedioSM: 2.1, region: 'interior-pr' },
  { slug: 'arapongas', name: 'Arapongas', state: 'PR', stateSlug: 'pr', stateName: 'Paraná', ibgeId: 4101507, populacao: 124838, areakm2: 272.49, pibPerCapita: 47973.54, salarioMedioSM: 2.2, region: 'interior-pr' },
  { slug: 'cambe', name: 'Cambé', state: 'PR', stateSlug: 'pr', stateName: 'Paraná', ibgeId: 4103701, populacao: 110923, areakm2: 195.47, pibPerCapita: 63159.21, salarioMedioSM: 2.5, region: 'interior-pr' },
  { slug: 'cornelio-procopio', name: 'Cornélio Procópio', state: 'PR', stateSlug: 'pr', stateName: 'Paraná', ibgeId: 4106407, populacao: 45720, areakm2: 73.89, pibPerCapita: 52697.46, salarioMedioSM: 2.0, region: 'interior-pr' },
  { slug: 'santo-antonio-da-platina', name: 'Santo Antônio da Platina', state: 'PR', stateSlug: 'pr', stateName: 'Paraná', ibgeId: 4124103, populacao: 45628, areakm2: 59.19, pibPerCapita: 41422.7, salarioMedioSM: 1.9, region: 'interior-pr' },
  { slug: 'jacarezinho', name: 'Jacarezinho', state: 'PR', stateSlug: 'pr', stateName: 'Paraná', ibgeId: 4111803, populacao: 41493, areakm2: 64.93, pibPerCapita: 48470.43, salarioMedioSM: 2.3, region: 'interior-pr' },
]

// ── Rio de Janeiro (3 cidades) ────────────────────────────────────────
const CIDADES_RJ: IbgeCityData[] = [
  { slug: 'volta-redonda', name: 'Volta Redonda', state: 'RJ', stateSlug: 'rj', stateName: 'Rio de Janeiro', ibgeId: 3306305, populacao: 279971, areakm2: 1412.75, pibPerCapita: 58523.62, salarioMedioSM: 2.1, region: 'interior-rj' },
  { slug: 'barra-mansa', name: 'Barra Mansa', state: 'RJ', stateSlug: 'rj', stateName: 'Rio de Janeiro', ibgeId: 3300407, populacao: 181679, areakm2: 324.94, pibPerCapita: 40208.1, salarioMedioSM: 2.0, region: 'interior-rj' },
  { slug: 'resende', name: 'Resende', state: 'RJ', stateSlug: 'rj', stateName: 'Rio de Janeiro', ibgeId: 3304201, populacao: 137697, areakm2: 109.35, pibPerCapita: 94649.39, salarioMedioSM: 2.8, region: 'interior-rj' },
]

// ── São Paulo (80 cidades) ────────────────────────────────────────
const CIDADES_SP: IbgeCityData[] = [
  { slug: 'campinas', name: 'Campinas', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3509502, populacao: 1187974, areakm2: 1359.6, pibPerCapita: 80741.47, salarioMedioSM: 3.8, region: 'capital' },
  { slug: 'sorocaba', name: 'Sorocaba', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3552205, populacao: 762172, areakm2: 1304.18, pibPerCapita: 81273.66, salarioMedioSM: 3.0, region: 'grande-sp' },
  { slug: 'ribeirao-preto', name: 'Ribeirão Preto', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3543402, populacao: 731639, areakm2: 928.92, pibPerCapita: 74869.27, salarioMedioSM: 2.7, region: 'grande-sp' },
  { slug: 'sao-jose-do-rio-preto', name: 'São José do Rio Preto', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3549805, populacao: 504166, areakm2: 945.12, pibPerCapita: 54934.44, salarioMedioSM: 2.7, region: 'grande-sp' },
  { slug: 'jundiai', name: 'Jundiaí', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3525904, populacao: 463039, areakm2: 858.42, pibPerCapita: 147597.65, salarioMedioSM: 3.3, region: 'interior-sp' },
  { slug: 'piracicaba', name: 'Piracicaba', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3538709, populacao: 440835, areakm2: 264.47, pibPerCapita: 104770.09, salarioMedioSM: 3.1, region: 'interior-sp' },
  { slug: 'bauru', name: 'Bauru', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3506003, populacao: 392947, areakm2: 515.12, pibPerCapita: 54477.06, salarioMedioSM: 2.6, region: 'interior-sp' },
  { slug: 'franca', name: 'Franca', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3516200, populacao: 365494, areakm2: 526.09, pibPerCapita: 40777.87, salarioMedioSM: 2.1, region: 'interior-sp' },
  { slug: 'limeira', name: 'Limeira', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3526902, populacao: 301292, areakm2: 475.32, pibPerCapita: 71528.46, salarioMedioSM: 2.9, region: 'interior-sp' },
  { slug: 'sumare', name: 'Sumaré', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3552403, populacao: 291116, areakm2: 1572.04, pibPerCapita: 68060.93, salarioMedioSM: 3.7, region: 'interior-sp' },
  { slug: 'indaiatuba', name: 'Indaiatuba', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3520509, populacao: 269657, areakm2: 646.11, pibPerCapita: 110518.41, salarioMedioSM: 3.4, region: 'interior-sp' },
  { slug: 'sao-carlos', name: 'São Carlos', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3548906, populacao: 266427, areakm2: 195.15, pibPerCapita: 72146.03, salarioMedioSM: 3.2, region: 'interior-sp' },
  { slug: 'araraquara', name: 'Araraquara', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3503208, populacao: 253474, areakm2: 207.9, pibPerCapita: 60643.28, salarioMedioSM: 2.7, region: 'interior-sp' },
  { slug: 'hortolandia', name: 'Hortolândia', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3519071, populacao: 248842, areakm2: 3094.16, pibPerCapita: 93660.54, salarioMedioSM: 3.8, region: 'interior-sp' },
  { slug: 'americana', name: 'Americana', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3501608, populacao: 247571, areakm2: 1572.75, pibPerCapita: 74188.86, salarioMedioSM: 2.7, region: 'interior-sp' },
  { slug: 'marilia', name: 'Marília', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3529005, populacao: 247348, areakm2: 185.21, pibPerCapita: 52635.31, salarioMedioSM: 2.5, region: 'interior-sp' },
  { slug: 'presidente-prudente', name: 'Presidente Prudente', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3541406, populacao: 234706, areakm2: 368.89, pibPerCapita: 51480.93, salarioMedioSM: 2.4, region: 'interior-sp' },
  { slug: 'rio-claro', name: 'Rio Claro', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3543907, populacao: 210323, areakm2: 373.69, pibPerCapita: 76592.54, salarioMedioSM: 2.9, region: 'interior-sp' },
  { slug: 'aracatuba', name: 'Araçatuba', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3502804, populacao: 208415, areakm2: 155.54, pibPerCapita: 57253.2, salarioMedioSM: 2.4, region: 'interior-sp' },
  { slug: 'santa-barbara-d-oeste', name: 'Santa Bárbara d\'Oeste', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3545803, populacao: 189456, areakm2: 664.49, pibPerCapita: 58926.47, salarioMedioSM: 2.6, region: 'interior-sp' },
  { slug: 'itu', name: 'Itu', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3523909, populacao: 175047, areakm2: 241.01, pibPerCapita: 83288.93, salarioMedioSM: 2.8, region: 'interior-sp' },
  { slug: 'mogi-guacu', name: 'Mogi Guaçu', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3530706, populacao: 160318, areakm2: 168.99, pibPerCapita: 61395.03, salarioMedioSM: 2.7, region: 'interior-sp' },
  { slug: 'botucatu', name: 'Botucatu', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3507506, populacao: 151053, areakm2: 85.88, pibPerCapita: 55059.4, salarioMedioSM: 2.8, region: 'interior-sp' },
  { slug: 'salto', name: 'Salto', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3545209, populacao: 141111, areakm2: 792.13, pibPerCapita: 85609.32, salarioMedioSM: 2.8, region: 'interior-sp' },
  { slug: 'jau', name: 'Jaú', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3525300, populacao: 137409, areakm2: 191.09, pibPerCapita: 49011.83, salarioMedioSM: 2.2, region: 'interior-sp' },
  { slug: 'araras', name: 'Araras', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3503307, populacao: 135744, areakm2: 184.3, pibPerCapita: 76588.83, salarioMedioSM: 2.7, region: 'interior-sp' },
  { slug: 'valinhos', name: 'Valinhos', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3556206, populacao: 132258, areakm2: 718.7, pibPerCapita: 80718.99, salarioMedioSM: 3.2, region: 'interior-sp' },
  { slug: 'sertaozinho', name: 'Sertãozinho', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3551702, populacao: 132176, areakm2: 273.22, pibPerCapita: 71520.47, salarioMedioSM: 3.0, region: 'interior-sp' },
  { slug: 'barretos', name: 'Barretos', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3505500, populacao: 126957, areakm2: 71.6, pibPerCapita: 54826.42, salarioMedioSM: 2.4, region: 'interior-sp' },
  { slug: 'birigui', name: 'Birigui', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3506508, populacao: 123340, areakm2: 204.79, pibPerCapita: 40902.09, salarioMedioSM: 2.0, region: 'interior-sp' },
  { slug: 'catanduva', name: 'Catanduva', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3511102, populacao: 119275, areakm2: 388.24, pibPerCapita: 60712.43, salarioMedioSM: 2.5, region: 'interior-sp' },
  { slug: 'ourinhos', name: 'Ourinhos', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3534708, populacao: 106911, areakm2: 347.78, pibPerCapita: 47155.54, salarioMedioSM: 2.3, region: 'interior-sp' },
  { slug: 'assis', name: 'Assis', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3504008, populacao: 104858, areakm2: 206.7, pibPerCapita: 46175.48, salarioMedioSM: 2.4, region: 'interior-sp' },
  { slug: 'leme', name: 'Leme', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3526704, populacao: 101537, areakm2: 227.75, pibPerCapita: 50310.32, salarioMedioSM: 2.3, region: 'interior-sp' },
  { slug: 'votuporanga', name: 'Votuporanga', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3557105, populacao: 100568, areakm2: 201.15, pibPerCapita: 47418.12, salarioMedioSM: 2.2, region: 'interior-sp' },
  { slug: 'avare', name: 'Avaré', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3504503, populacao: 96450, areakm2: 68.37, pibPerCapita: 47503.24, salarioMedioSM: 2.2, region: 'interior-sp' },
  { slug: 'sao-joao-da-boa-vista', name: 'São João da Boa Vista', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3549102, populacao: 96080, areakm2: 161.96, pibPerCapita: 54147.42, salarioMedioSM: 2.3, region: 'interior-sp' },
  { slug: 'mogi-mirim', name: 'Mogi Mirim', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3530805, populacao: 95742, areakm2: 173.77, pibPerCapita: 87434.03, salarioMedioSM: 2.8, region: 'interior-sp' },
  { slug: 'matao', name: 'Matão', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3529302, populacao: 81075, areakm2: 146.3, pibPerCapita: 96754.27, salarioMedioSM: 2.8, region: 'interior-sp' },
  { slug: 'vinhedo', name: 'Vinhedo', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3556701, populacao: 79089, areakm2: 779.51, pibPerCapita: 192052.06, salarioMedioSM: 3.2, region: 'interior-sp' },
  { slug: 'bebedouro', name: 'Bebedouro', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3506102, populacao: 78257, areakm2: 109.81, pibPerCapita: 69967.94, salarioMedioSM: 2.4, region: 'interior-sp' },
  { slug: 'lins', name: 'Lins', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3527108, populacao: 76844, areakm2: 124.98, pibPerCapita: 115144.13, salarioMedioSM: 2.4, region: 'interior-sp' },
  { slug: 'pirassununga', name: 'Pirassununga', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3539301, populacao: 75594, areakm2: 96.38, pibPerCapita: 58527.61, salarioMedioSM: 2.9, region: 'interior-sp' },
  { slug: 'fernandopolis', name: 'Fernandópolis', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3515509, populacao: 73508, areakm2: 117.62, pibPerCapita: 39203.05, salarioMedioSM: 2.0, region: 'interior-sp' },
  { slug: 'jaboticabal', name: 'Jaboticabal', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3524303, populacao: 73473, areakm2: 101.42, pibPerCapita: 57869.61, salarioMedioSM: 2.8, region: 'interior-sp' },
  { slug: 'mococa', name: 'Mococa', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3530508, populacao: 69372, areakm2: 77.55, pibPerCapita: 59315.81, salarioMedioSM: 2.4, region: 'interior-sp' },
  { slug: 'lencois-paulista', name: 'Lençóis Paulista', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3526803, populacao: 68568, areakm2: 75.88, pibPerCapita: 98709.09, salarioMedioSM: 2.9, region: 'interior-sp' },
  { slug: 'tupa', name: 'Tupã', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3555000, populacao: 65433, areakm2: 100.99, pibPerCapita: 48934.77, salarioMedioSM: 2.1, region: 'interior-sp' },
  { slug: 'batatais', name: 'Batatais', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3505906, populacao: 59939, areakm2: 66.48, pibPerCapita: 56996.17, salarioMedioSM: 2.5, region: 'interior-sp' },
  { slug: 'olimpia', name: 'Olímpia', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3533908, populacao: 56874, areakm2: 62.32, pibPerCapita: 64815.98, salarioMedioSM: 2.5, region: 'interior-sp' },
  { slug: 'porto-ferreira', name: 'Porto Ferreira', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3540705, populacao: 53966, areakm2: 209.88, pibPerCapita: 58298.46, salarioMedioSM: 2.2, region: 'interior-sp' },
  { slug: 'sao-jose-do-rio-pardo', name: 'São José do Rio Pardo', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3549706, populacao: 53427, areakm2: 123.81, pibPerCapita: 55109.14, salarioMedioSM: 2.1, region: 'interior-sp' },
  { slug: 'taquaritinga', name: 'Taquaritinga', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3553708, populacao: 53264, areakm2: 90.95, pibPerCapita: 44147.43, salarioMedioSM: 2.1, region: 'interior-sp' },
  { slug: 'sao-joaquim-da-barra', name: 'São Joaquim da Barra', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3549409, populacao: 49885, areakm2: 113.28, pibPerCapita: 56299.4, salarioMedioSM: 2.7, region: 'interior-sp' },
  { slug: 'monte-alto', name: 'Monte Alto', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3531308, populacao: 48758, areakm2: 134.61, pibPerCapita: 64379.33, salarioMedioSM: 2.5, region: 'interior-sp' },
  { slug: 'jardinopolis', name: 'Jardinópolis', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3525102, populacao: 47125, areakm2: 74.99, pibPerCapita: 52970.55, salarioMedioSM: 2.4, region: 'interior-sp' },
  { slug: 'vargem-grande-do-sul', name: 'Vargem Grande do Sul', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3556404, populacao: 41256, areakm2: 146.94, pibPerCapita: 35672.43, salarioMedioSM: 2.1, region: 'interior-sp' },
  { slug: 'guaira', name: 'Guaíra', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3517406, populacao: 40489, areakm2: 29.72, pibPerCapita: 82333.01, salarioMedioSM: 2.4, region: 'interior-sp' },
  { slug: 'orlandia', name: 'Orlândia', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3534302, populacao: 39144, areakm2: 136.34, pibPerCapita: 84752.94, salarioMedioSM: 2.9, region: 'interior-sp' },
  { slug: 'ituverava', name: 'Ituverava', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3524105, populacao: 38413, areakm2: 54.87, pibPerCapita: 59051.53, salarioMedioSM: 2.2, region: 'interior-sp' },
  { slug: 'pontal', name: 'Pontal', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3540200, populacao: 38286, areakm2: 112.94, pibPerCapita: 57275.34, salarioMedioSM: 2.5, region: 'interior-sp' },
  { slug: 'pitangueiras', name: 'Pitangueiras', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3539509, populacao: 34361, areakm2: 81.99, pibPerCapita: 54349.34, salarioMedioSM: 2.6, region: 'interior-sp' },
  { slug: 'casa-branca', name: 'Casa Branca', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3510807, populacao: 28779, areakm2: 32.76, pibPerCapita: 53209.39, salarioMedioSM: 2.3, region: 'interior-sp' },
  { slug: 'morro-agudo', name: 'Morro Agudo', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3531902, populacao: 28521, areakm2: 20.97, pibPerCapita: 70890.9, salarioMedioSM: 2.4, region: 'interior-sp' },
  { slug: 'igarapava', name: 'Igarapava', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3520103, populacao: 26696, areakm2: 59.7, pibPerCapita: 54254.63, salarioMedioSM: 2.3, region: 'interior-sp' },
  { slug: 'brodowski', name: 'Brodowski', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3507803, populacao: 26314, areakm2: 75.8, pibPerCapita: 48026.05, salarioMedioSM: 2.2, region: 'interior-sp' },
  { slug: 'miguelopolis', name: 'Miguelópolis', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3529708, populacao: 19621, areakm2: 24.88, pibPerCapita: 57255.19, salarioMedioSM: 2.1, region: 'interior-sp' },
  { slug: 'colina', name: 'Colina', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3512001, populacao: 18880, areakm2: 41.11, pibPerCapita: 111034.1, salarioMedioSM: 2.2, region: 'interior-sp' },
  { slug: 'guara', name: 'Guará', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3517703, populacao: 18748, areakm2: 54.78, pibPerCapita: 45937.59, salarioMedioSM: 2.3, region: 'interior-sp' },
  { slug: 'altinopolis', name: 'Altinópolis', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3501004, populacao: 17197, areakm2: 16.8, pibPerCapita: 56281.23, salarioMedioSM: 2.0, region: 'interior-sp' },
  { slug: 'pedregulho', name: 'Pedregulho', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3537008, populacao: 15737, areakm2: 22.03, pibPerCapita: 91303.55, salarioMedioSM: 2.2, region: 'interior-sp' },
  { slug: 'patrocinio-paulista', name: 'Patrocínio Paulista', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3536307, populacao: 14888, areakm2: 21.56, pibPerCapita: 127481.55, salarioMedioSM: 2.9, region: 'interior-sp' },
  { slug: 'sales-oliveira', name: 'Sales Oliveira', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3544905, populacao: 11683, areakm2: 34.58, pibPerCapita: 46399.47, salarioMedioSM: 2.1, region: 'interior-sp' },
  { slug: 'cristais-paulista', name: 'Cristais Paulista', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3513207, populacao: 9600, areakm2: 19.7, pibPerCapita: 48443.85, salarioMedioSM: 2.0, region: 'interior-sp' },
  { slug: 'nuporanga', name: 'Nuporanga', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3533601, populacao: 7570, areakm2: 19.57, pibPerCapita: 167167.74, salarioMedioSM: 2.0, region: 'interior-sp' },
  { slug: 'restinga', name: 'Restinga', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3542701, populacao: 6486, areakm2: 26.8, pibPerCapita: 48687.83, salarioMedioSM: 2.3, region: 'interior-sp' },
  { slug: 'itirapua', name: 'Itirapuã', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3523701, populacao: 5857, areakm2: 36.71, pibPerCapita: 33029.32, salarioMedioSM: 2.1, region: 'interior-sp' },
  { slug: 'aramina', name: 'Aramina', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3503000, populacao: 5535, areakm2: 25.39, pibPerCapita: 40438.92, salarioMedioSM: 1.8, region: 'interior-sp' },
  { slug: 'buritizal', name: 'Buritizal', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3508207, populacao: 4458, areakm2: 15.21, pibPerCapita: 70148.67, salarioMedioSM: 3.5, region: 'interior-sp' },
  { slug: 'jeriquara', name: 'Jeriquara', state: 'SP', stateSlug: 'sp', stateName: 'São Paulo', ibgeId: 3525409, populacao: 4000, areakm2: 22.26, pibPerCapita: 79934.9, salarioMedioSM: 2.0, region: 'interior-sp' },
]

// ── Array consolidado de todas as 152 cidades ─────────────────────────────
export const IBGE_CITIES_152: IbgeCityData[] = [
  ...CIDADES_GO,
  ...CIDADES_MG,
  ...CIDADES_MS,
  ...CIDADES_PR,
  ...CIDADES_RJ,
  ...CIDADES_SP,
]

// ── Índice por slug para lookup rápido ────────────────────────────────────
export const IBGE_CITY_BY_SLUG: Record<string, IbgeCityData> = Object.fromEntries(
  IBGE_CITIES_152.map(c => [c.slug, c])
)

// ── Índice por estado ─────────────────────────────────────────────────────
export const IBGE_CITIES_BY_STATE: Record<string, IbgeCityData[]> = IBGE_CITIES_152.reduce(
  (acc, c) => { (acc[c.state] = acc[c.state] || []).push(c); return acc },
  {} as Record<string, IbgeCityData[]>
)

// ── Helper: gerar snippet SEO com dados IBGE ──────────────────────────────
export function getIbgeCitySnippet(city: IbgeCityData): string {
  const pop = city.populacao.toLocaleString("pt-BR")
  const pib = city.pibPerCapita.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
  return `${city.name}/${city.state} tem ${pop} habitantes, PIB per capita de ${pib} e área de ${city.areakm2} km² (IBGE).`
}

// ── Estatísticas da base ──────────────────────────────────────────────────
// Total: 152 cidades | 6 estados
// Maior cidade: Belo Horizonte/MG (2,415,872 hab)
// Menor cidade: Jeriquara/SP (4,000 hab)

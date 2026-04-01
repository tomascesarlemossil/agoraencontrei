export interface DocTemplate {
  id: string
  title: string
  category: string
  description: string
  icon: string
  fields: Array<{ key: string; label: string; placeholder?: string; required?: boolean; multiline?: boolean }>
  content: string
}

export const TEMPLATES: DocTemplate[] = [
  {
    id: 'contrato-locacao-residencial',
    title: 'Contrato de Locação Residencial',
    category: 'Locação',
    description: 'Contrato padrão para locação residencial com todas as cláusulas da Lei 8.245/91',
    icon: '🏠',
    fields: [
      { key: 'locador_nome', label: 'Nome do Locador', required: true },
      { key: 'locador_cpf', label: 'CPF do Locador', required: true },
      { key: 'locador_rg', label: 'RG do Locador' },
      { key: 'locador_estado_civil', label: 'Estado Civil do Locador' },
      { key: 'locador_endereco', label: 'Endereço do Locador' },
      { key: 'locatario_nome', label: 'Nome do Locatário', required: true },
      { key: 'locatario_cpf', label: 'CPF do Locatário', required: true },
      { key: 'locatario_rg', label: 'RG do Locatário' },
      { key: 'locatario_nascimento', label: 'Data de Nascimento' },
      { key: 'locatario_profissao', label: 'Profissão' },
      { key: 'locatario_estado_civil', label: 'Estado Civil' },
      { key: 'locatario_endereco_atual', label: 'Endereço Atual do Locatário' },
      { key: 'imovel_endereco', label: 'Endereço do Imóvel', required: true },
      { key: 'imovel_bairro', label: 'Bairro do Imóvel' },
      { key: 'imovel_descricao', label: 'Descrição do Imóvel' },
      { key: 'valor_aluguel', label: 'Valor do Aluguel (R$)', required: true },
      { key: 'dia_vencimento', label: 'Dia de Vencimento', placeholder: 'Ex: 10' },
      { key: 'data_inicio', label: 'Data de Início', required: true },
      { key: 'data_fim', label: 'Data de Término', required: true },
      { key: 'garantia_tipo', label: 'Tipo de Garantia', placeholder: 'Fiador / Caução / Seguro Fiança' },
      { key: 'fiador_nome', label: 'Nome do Fiador (se houver)' },
      { key: 'fiador_cpf', label: 'CPF do Fiador' },
      { key: 'fiador_endereco', label: 'Endereço do Fiador' },
      { key: 'data_assinatura', label: 'Data de Assinatura', placeholder: 'Franca, DD de MMMM de AAAA' },
      { key: 'observacoes', label: 'Observações adicionais', multiline: true },
    ],
    content: `IMOBILIÁRIA LEMOS — CONTRATO DE LOCAÇÃO RESIDENCIAL

PARTES:
LOCADOR: [locador_nome], CPF: [locador_cpf], RG: [locador_rg], [locador_estado_civil], residente em [locador_endereco]
ADMINISTRADORA: NOEMIA PIRES LEMOS DA SILVA — CRECI 61053-F — Rua Simão Caleiro, 2383, Vila França, Franca/SP, Tel: (16)3723-0045
LOCATÁRIO: [locatario_nome], CPF: [locatario_cpf], RG: [locatario_rg], nascido em [locatario_nascimento], [locatario_profissao], [locatario_estado_civil], residente em [locatario_endereco_atual]

IMÓVEL LOCADO: [imovel_descricao], situado na [imovel_endereco], Bairro [imovel_bairro], Franca/SP

CLÁUSULAS:
1. PRAZO: O prazo de locação é de 30 (trinta) meses, com início em [data_inicio] e término em [data_fim].
2. ALUGUEL: O aluguel mensal é de R$ [valor_aluguel], com vencimento todo dia [dia_vencimento].
3. GARANTIA: [garantia_tipo]. Fiador: [fiador_nome], CPF: [fiador_cpf], residente em [fiador_endereco].
4. REAJUSTE: O aluguel será reajustado anualmente pelo IGP-M ou índice substituto legal.
5. USO: O imóvel destina-se exclusivamente à moradia do locatário e sua família.
6. MANUTENÇÃO: O locatário é responsável pela manutenção e conservação do imóvel.
7. SUBLOCAÇÃO: É vedada a sublocação total ou parcial sem anuência escrita do locador.
8. VISTORIA: O imóvel foi entregue conforme laudo de vistoria em anexo.
9. RESCISÃO ANTECIPADA: Em caso de rescisão antecipada pelo locatário, será cobrada multa proporcional ao tempo restante.
10. FORO: Fica eleito o Foro da Comarca de Franca/SP.

[observacoes]

[data_assinatura]`,
  },
  {
    id: 'contrato-locacao-caucao',
    title: 'Contrato de Locação — Garantia: Caução',
    category: 'Locação',
    description: 'Contrato de locação com depósito caução como garantia',
    icon: '💰',
    fields: [
      { key: 'locador_nome', label: 'Nome do Locador', required: true },
      { key: 'locador_cpf', label: 'CPF do Locador', required: true },
      { key: 'locatario_nome', label: 'Nome do Locatário', required: true },
      { key: 'locatario_cpf', label: 'CPF do Locatário', required: true },
      { key: 'locatario_rg', label: 'RG do Locatário' },
      { key: 'locatario_estado_civil', label: 'Estado Civil' },
      { key: 'imovel_endereco', label: 'Endereço do Imóvel', required: true },
      { key: 'valor_aluguel', label: 'Valor do Aluguel (R$)', required: true },
      { key: 'valor_caucao', label: 'Valor da Caução (R$)', required: true },
      { key: 'dia_vencimento', label: 'Dia de Vencimento' },
      { key: 'data_inicio', label: 'Data de Início', required: true },
      { key: 'data_fim', label: 'Data de Término', required: true },
      { key: 'data_assinatura', label: 'Data de Assinatura' },
      { key: 'observacoes', label: 'Observações', multiline: true },
    ],
    content: `CONTRATO DE LOCAÇÃO RESIDENCIAL — GARANTIA: DEPÓSITO CAUÇÃO

PARTES:
LOCADOR: [locador_nome], CPF: [locador_cpf]
ADMINISTRADORA: NOEMIA PIRES LEMOS DA SILVA — CRECI 61053-F
LOCATÁRIO: [locatario_nome], CPF: [locatario_cpf], RG: [locatario_rg], [locatario_estado_civil]

IMÓVEL: [imovel_endereco], Franca/SP

CLÁUSULAS:
1. PRAZO: Início [data_inicio] — Término [data_fim]
2. ALUGUEL: R$ [valor_aluguel], vencimento dia [dia_vencimento]
3. CAUÇÃO: R$ [valor_caucao] (equivalente a 3 aluguéis), restituível no encerramento
4. USO EXCLUSIVO RESIDENCIAL
5. REAJUSTE ANUAL PELO IGP-M
[observacoes]
[data_assinatura]`,
  },
  {
    id: 'contrato-locacao-temporario',
    title: 'Contrato de Locação Temporária',
    category: 'Locação',
    description: 'Contrato para locação por temporada (até 90 dias)',
    icon: '🌴',
    fields: [
      { key: 'locador_nome', label: 'Nome do Locador', required: true },
      { key: 'locador_cpf', label: 'CPF do Locador', required: true },
      { key: 'locatario_nome', label: 'Nome do Locatário', required: true },
      { key: 'locatario_cpf', label: 'CPF do Locatário', required: true },
      { key: 'imovel_endereco', label: 'Endereço do Imóvel', required: true },
      { key: 'valor_total', label: 'Valor Total (R$)', required: true },
      { key: 'data_entrada', label: 'Data de Entrada', required: true },
      { key: 'data_saida', label: 'Data de Saída', required: true },
      { key: 'num_pessoas', label: 'Número de Pessoas' },
      { key: 'finalidade', label: 'Finalidade da Locação', placeholder: 'Ex: Lazer, Férias, Trabalho' },
      { key: 'data_assinatura', label: 'Data de Assinatura' },
    ],
    content: `CONTRATO DE LOCAÇÃO POR TEMPORADA

PARTES:
LOCADOR: [locador_nome], CPF: [locador_cpf]
LOCATÁRIO: [locatario_nome], CPF: [locatario_cpf]
ADMINISTRADORA: IMOBILIÁRIA LEMOS — CRECI 61053-F

IMÓVEL: [imovel_endereco], Franca/SP
PERÍODO: [data_entrada] a [data_saida]
VALOR TOTAL: R$ [valor_total]
NÚMERO DE HÓSPEDES: [num_pessoas]
FINALIDADE: [finalidade]

CLÁUSULAS ESPECÍFICAS:
1. Prazo máximo de 90 dias conforme Art. 48 da Lei 8.245/91
2. Proibido sublocar ou ceder a terceiros
3. Imóvel deve ser entregue nas mesmas condições de entrada
4. Não inclusão de animais domésticos sem autorização prévia
[data_assinatura]`,
  },
  {
    id: 'compromisso-venda-compra',
    title: 'Compromisso de Venda e Compra',
    category: 'Venda',
    description: 'Instrumento particular de compromisso de venda e compra de imóvel',
    icon: '🤝',
    fields: [
      { key: 'vendedor_nome', label: 'Nome do Vendedor', required: true },
      { key: 'vendedor_cpf', label: 'CPF do Vendedor', required: true },
      { key: 'vendedor_rg', label: 'RG do Vendedor' },
      { key: 'vendedor_estado_civil', label: 'Estado Civil do Vendedor' },
      { key: 'vendedor_profissao', label: 'Profissão do Vendedor' },
      { key: 'vendedor_endereco', label: 'Endereço do Vendedor' },
      { key: 'comprador_nome', label: 'Nome do Comprador', required: true },
      { key: 'comprador_cpf', label: 'CPF do Comprador', required: true },
      { key: 'comprador_rg', label: 'RG do Comprador' },
      { key: 'comprador_estado_civil', label: 'Estado Civil do Comprador' },
      { key: 'comprador_profissao', label: 'Profissão do Comprador' },
      { key: 'comprador_endereco', label: 'Endereço do Comprador' },
      { key: 'imovel_descricao', label: 'Descrição Completa do Imóvel', required: true, multiline: true },
      { key: 'imovel_matricula', label: 'Matrícula do Imóvel' },
      { key: 'imovel_inscricao_pref', label: 'Inscrição Municipal' },
      { key: 'valor_venda', label: 'Valor de Venda (R$)', required: true },
      { key: 'valor_sinal', label: 'Valor do Sinal/Entrada (R$)' },
      { key: 'forma_pagamento', label: 'Forma de Pagamento', multiline: true },
      { key: 'prazo_escritura', label: 'Prazo para Escritura', placeholder: 'Ex: 60 dias após assinatura' },
      { key: 'comissao_pct', label: 'Comissão Imobiliária (%)' },
      { key: 'data_assinatura', label: 'Data de Assinatura' },
      { key: 'observacoes', label: 'Observações', multiline: true },
    ],
    content: `INSTRUMENTO PARTICULAR DE COMPROMISSO DE VENDA E COMPRA

VENDEDOR: [vendedor_nome], [vendedor_estado_civil], [vendedor_profissao], RG: [vendedor_rg], CPF: [vendedor_cpf], residente em [vendedor_endereco]

COMPRADOR: [comprador_nome], [comprador_estado_civil], [comprador_profissao], RG: [comprador_rg], CPF: [comprador_cpf], residente em [comprador_endereco]

IMÓVEL: [imovel_descricao]
Matrícula: [imovel_matricula] | Inscrição Municipal: [imovel_inscricao_pref]

VALOR: R$ [valor_venda]
SINAL/ENTRADA: R$ [valor_sinal]
FORMA DE PAGAMENTO: [forma_pagamento]
PRAZO ESCRITURA: [prazo_escritura]
COMISSÃO: [comissao_pct]% a cargo do vendedor, paga à IMOBILIÁRIA LEMOS — CRECI 61053-F

CLÁUSULAS:
1. O presente instrumento obriga as partes e seus herdeiros
2. Em caso de desistência do comprador, perde-se o sinal
3. Em caso de desistência do vendedor, devolve-se o sinal em dobro
4. Todas as despesas de escritura e ITBI são de responsabilidade do comprador

[observacoes]
[data_assinatura]`,
  },
  {
    id: 'aviso-nao-renovacao',
    title: 'Aviso de Não Renovação de Contrato',
    category: 'Notificações',
    description: 'Comunicado formal de não renovação de contrato de locação',
    icon: '📋',
    fields: [
      { key: 'locador_nome', label: 'Nome do Locador', required: true },
      { key: 'locatario_nome', label: 'Nome do Locatário', required: true },
      { key: 'imovel_endereco', label: 'Endereço do Imóvel', required: true },
      { key: 'data_inicio_contrato', label: 'Data de Início do Contrato' },
      { key: 'data_termino', label: 'Data de Término do Contrato', required: true },
      { key: 'data_aviso', label: 'Data deste Aviso', required: true },
      { key: 'motivo', label: 'Motivo (opcional)', multiline: true },
    ],
    content: `AVISO DE NÃO RENOVAÇÃO DE CONTRATO DE LOCAÇÃO

Locador: [locador_nome]
Locatário: [locatario_nome]
Imóvel: [imovel_endereco], Franca/SP
Contrato: iniciado em [data_inicio_contrato], término em [data_termino]

Prezado(a) Sr(a). [locatario_nome],

Por meio desta, [locador_nome] vem formalmente comunicar que não tem interesse na renovação do contrato de locação do imóvel acima descrito, cujo término está previsto para [data_termino].

O contrato permanecerá em vigor até o final do prazo ajustado. Após essa data, o imóvel deverá ser desocupado e as chaves entregues na IMOBILIÁRIA LEMOS, Rua Simão Caleiro, 2383, Franca/SP.

[motivo]

Franca, [data_aviso]`,
  },
  {
    id: 'comunicado-desocupacao',
    title: 'Comunicado de Desocupação',
    category: 'Notificações',
    description: 'Comunicado do locatário informando saída do imóvel',
    icon: '🔑',
    fields: [
      { key: 'locatario_nome', label: 'Nome do Locatário', required: true },
      { key: 'imovel_endereco', label: 'Endereço do Imóvel', required: true },
      { key: 'imovel_bairro', label: 'Bairro do Imóvel' },
      { key: 'data_saida', label: 'Data Prevista de Saída', required: true },
      { key: 'data_comunicado', label: 'Data deste Comunicado', required: true },
    ],
    content: `COMUNICADO DE DESOCUPAÇÃO DE IMÓVEL LOCADO

Franca, [data_comunicado]
Aos cuidados da IMOBILIÁRIA LEMOS — setor de desocupações

Eu, [locatario_nome], venho por meio desta comunicar que não tenho interesse em continuar a locação do imóvel situado à [imovel_endereco], Bairro [imovel_bairro], Franca/SP.

Comunico que em [data_saida] o imóvel estará desocupado de pessoas e coisas, e as chaves serão entregues na Imobiliária Lemos, Rua Simão Caleiro, 2383, para fins de vistoria e encerramento do contrato.

Declaro estar ciente das obrigações referentes à entrega do imóvel em perfeitas condições de higiene e conservação, conforme laudo de vistoria inicial.

[locatario_nome]`,
  },
  {
    id: 'carta-desistencia-compra',
    title: 'Carta de Desistência de Compra',
    category: 'Venda',
    description: 'Carta formal de desistência de compra de imóvel',
    icon: '✉️',
    fields: [
      { key: 'comprador_nome', label: 'Nome do Comprador', required: true },
      { key: 'comprador_cpf', label: 'CPF do Comprador', required: true },
      { key: 'imovel_descricao', label: 'Descrição do Imóvel', required: true },
      { key: 'vendedor_nome', label: 'Nome do Vendedor' },
      { key: 'data_proposta', label: 'Data da Proposta Original' },
      { key: 'motivo', label: 'Motivo da Desistência', multiline: true },
      { key: 'data_carta', label: 'Data desta Carta', required: true },
    ],
    content: `CARTA DE DESISTÊNCIA DE COMPRA DE IMÓVEL

Franca, [data_carta]

À IMOBILIÁRIA LEMOS
Rua Simão Caleiro, 2383 — Vila França — Franca/SP

Ref.: Desistência de proposta de compra

Eu, [comprador_nome], CPF [comprador_cpf], venho por meio desta formalizar minha desistência da proposta de compra do imóvel: [imovel_descricao].

[motivo]

Declaro estar ciente das condições previstas no instrumento preliminar quanto às consequências da presente desistência.

Atenciosamente,

[comprador_nome]
CPF: [comprador_cpf]`,
  },
  {
    id: 'notificacao-perturbacao',
    title: 'Notificação de Perturbação de Sossego',
    category: 'Notificações',
    description: 'Notificação extrajudicial por perturbação do sossego — Art. 46 §2º Lei 8.245/91',
    icon: '⚠️',
    fields: [
      { key: 'notificado_nome', label: 'Nome do Notificado', required: true },
      { key: 'notificado_endereco', label: 'Endereço do Notificado', required: true },
      { key: 'descricao_ocorrencia', label: 'Descrição da Ocorrência', required: true, multiline: true },
      { key: 'data_notificacao', label: 'Data da Notificação', required: true },
      { key: 'prazo_regularizacao', label: 'Prazo para Regularização', placeholder: 'Ex: 48 horas' },
    ],
    content: `NOTIFICAÇÃO EXTRAJUDICIAL — PERTURBAÇÃO DE SOSSEGO

Franca, [data_notificacao]

[notificado_nome]
End: [notificado_endereco]
Ref.: PERTURBAÇÃO DE SOSSEGO

Prezado Senhor(a),

Para os efeitos do Art. 726 do CPC e art. 46, §2º da Lei 8.245/91, NOEMIA PIRES LEMOS DA SILVA, CRECI/SP 61053-F, na qualidade de administradora de imóveis, vem NOTIFICAR V. Sa.:

[descricao_ocorrencia]

Solicitamos que providencie a regularização da situação no prazo de [prazo_regularizacao], sob pena de rescisão contratual por infração legal, conforme art. 9º, II da Lei 8.245/91.

Atenciosamente,
IMOBILIÁRIA LEMOS
Noêmia Pires Lemos da Silva — CRECI 61053-F`,
  },
  {
    id: 'confissao-divida',
    title: 'Confissão de Dívida',
    category: 'Financeiro',
    description: 'Instrumento de reconhecimento e confissão de dívida por aluguéis em atraso',
    icon: '📄',
    fields: [
      { key: 'devedor_nome', label: 'Nome do Devedor', required: true },
      { key: 'devedor_cpf', label: 'CPF do Devedor', required: true },
      { key: 'devedor_rg', label: 'RG do Devedor' },
      { key: 'devedor_estado_civil', label: 'Estado Civil' },
      { key: 'devedor_endereco', label: 'Endereço do Devedor' },
      { key: 'valor_divida', label: 'Valor Total da Dívida (R$)', required: true },
      { key: 'descricao_divida', label: 'Origem da Dívida', multiline: true },
      { key: 'forma_pagamento', label: 'Forma de Pagamento', multiline: true },
      { key: 'data_instrumento', label: 'Data do Instrumento', required: true },
      { key: 'testemunha1', label: 'Testemunha 1' },
      { key: 'testemunha2', label: 'Testemunha 2' },
    ],
    content: `INSTRUMENTO PARTICULAR DE CONFISSÃO DE DÍVIDA

CREDOR: IMOBILIÁRIA LEMOS, representada por NOÊMIA PIRES LEMOS DA SILVA, CRECI/SP 61053-F e TOMAS CESAR LEMOS SILVA, CRECI/SP 279051, Rua Simão Caleiro, 2383, Vila França, Franca/SP.

DEVEDOR: [devedor_nome], [devedor_estado_civil], RG: [devedor_rg], CPF: [devedor_cpf], residente em [devedor_endereco].

Pelo presente instrumento, o DEVEDOR confessa e assume como líquida e certa a dívida:

CLÁUSULA PRIMEIRA — RECONHECIMENTO DA DÍVIDA:
O devedor reconhece, de forma irrevogável, dívida no valor de R$ [valor_divida].
Origem: [descricao_divida]

CLÁUSULA SEGUNDA — FORMA DE PAGAMENTO:
[forma_pagamento]

CLÁUSULA TERCEIRA — MORA: O não pagamento em qualquer parcela tornará vencido o saldo total, acrescido de multa de 10%, juros de 1% ao mês e correção monetária pelo IGP-M.

CLÁUSULA QUARTA — FORO: Comarca de Franca/SP.

Franca, [data_instrumento]

_________________________________    _________________________________
IMOBILIÁRIA LEMOS (Credor)             [devedor_nome] (Devedor)

Testemunhas:
1. [testemunha1]
2. [testemunha2]`,
  },
  {
    id: 'entrega-chaves',
    title: 'Termo de Entrega de Chaves',
    category: 'Vistoria',
    description: 'Termo de entrega e recebimento de chaves do imóvel',
    icon: '🗝️',
    fields: [
      { key: 'locatario_nome', label: 'Nome do Locatário/Entregante', required: true },
      { key: 'locatario_cpf', label: 'CPF', required: true },
      { key: 'imovel_endereco', label: 'Endereço do Imóvel', required: true },
      { key: 'imovel_bairro', label: 'Bairro' },
      { key: 'num_chaves', label: 'Quantidade de Chaves', placeholder: 'Ex: 2 chaves + 1 controle remoto' },
      { key: 'condicao_imovel', label: 'Condições do Imóvel na Entrega', multiline: true },
      { key: 'pendencias', label: 'Pendências a Regularizar', multiline: true },
      { key: 'data_entrega', label: 'Data de Entrega das Chaves', required: true },
      { key: 'recebedor_nome', label: 'Nome do Recebedor (Imobiliária)' },
    ],
    content: `TERMO DE ENTREGA DE CHAVES

Eu, [locatario_nome], CPF [locatario_cpf], venho por meio deste declarar a entrega das chaves do imóvel:

IMÓVEL: [imovel_endereco], Bairro [imovel_bairro], Franca/SP
DATA: [data_entrega]
CHAVES ENTREGUES: [num_chaves]
CONDIÇÕES DO IMÓVEL: [condicao_imovel]
PENDÊNCIAS: [pendencias]

Declaro que estou ciente de que o contrato de locação somente será encerrado após vistoria final e quitação de todos os débitos pendentes.

Franca, [data_entrega]

_________________________________    _________________________________
[locatario_nome] (Entregante)          [recebedor_nome] — IMOBILIÁRIA LEMOS`,
  },
  {
    id: 'termo-sabesp-cpfl',
    title: 'Termo de Responsabilidade SABESP/CPFL',
    category: 'Locação',
    description: 'Termo de compromisso de transferência de titularidade junto à SABESP e CPFL',
    icon: '⚡',
    fields: [
      { key: 'locatario_nome', label: 'Nome do Locatário', required: true },
      { key: 'locatario_cpf', label: 'CPF do Locatário', required: true },
      { key: 'imovel_endereco', label: 'Endereço do Imóvel', required: true },
      { key: 'imovel_bairro', label: 'Bairro do Imóvel' },
      { key: 'prazo_dias', label: 'Prazo em Dias Úteis', placeholder: 'Ex: 05 dias úteis' },
      { key: 'data_assinatura', label: 'Data de Assinatura' },
    ],
    content: `TERMO DE RESPONSABILIDADE PERANTE A SABESP E A CPFL

LOCATÁRIO: [locatario_nome]
IMÓVEL: [imovel_endereco], Bairro [imovel_bairro], Franca/SP

Na qualidade de locatário, comprometo-me a dirigir-me, na data da assinatura deste contrato de locação, junto à SABESP e à CPFL, para que tanto a água quanto a energia elétrica no local sejam restauradas/religadas.

Comprometo-me ainda a realizar a alteração de titularidade junto a estes órgãos para o meu nome, sob pena de responsabilização por qualquer dano decorrente da ausência desta providência.

Estas providências podem ser feitas pelos sites dos órgãos, pelos telefones ou diretamente nas concessionárias.

O não cumprimento da troca incidirá em quebra de cláusula contratual.

PRAZO PARA AS PROVIDÊNCIAS: [prazo_dias]

Franca, [data_assinatura]

CIENTE:
_________________________________
[locatario_nome]
CPF: [locatario_cpf]`,
  },
  {
    id: 'aditivo-substituicao-locatario',
    title: 'Aditivo — Substituição de Locatário',
    category: 'Aditivos',
    description: 'Aditivo contratual para substituição do locatário',
    icon: '🔄',
    fields: [
      { key: 'locador_nome', label: 'Nome do Locador', required: true },
      { key: 'locatario_saindo_nome', label: 'Nome do Locatário que Sai', required: true },
      { key: 'locatario_saindo_cpf', label: 'CPF do Locatário que Sai' },
      { key: 'locatario_entrando_nome', label: 'Nome do Novo Locatário', required: true },
      { key: 'locatario_entrando_cpf', label: 'CPF do Novo Locatário', required: true },
      { key: 'locatario_entrando_rg', label: 'RG do Novo Locatário' },
      { key: 'locatario_entrando_estado_civil', label: 'Estado Civil do Novo Locatário' },
      { key: 'imovel_endereco', label: 'Endereço do Imóvel', required: true },
      { key: 'data_substituicao', label: 'Data da Substituição', required: true },
      { key: 'observacoes', label: 'Observações', multiline: true },
    ],
    content: `ADITIVO AO CONTRATO DE LOCAÇÃO — SUBSTITUIÇÃO DE LOCATÁRIO

Pelo presente aditivo, as partes acordam:

LOCADOR: [locador_nome]
LOCATÁRIO SAINDO: [locatario_saindo_nome], CPF: [locatario_saindo_cpf]
NOVO LOCATÁRIO: [locatario_entrando_nome], CPF: [locatario_entrando_cpf], RG: [locatario_entrando_rg], [locatario_entrando_estado_civil]
IMÓVEL: [imovel_endereco], Franca/SP

A partir de [data_substituicao], [locatario_entrando_nome] sub-roga-se em todos os direitos e obrigações do contrato de locação, liberando [locatario_saindo_nome] das responsabilidades futuras.

O novo locatário declara conhecer e aceitar todas as cláusulas do contrato original.

[observacoes]

Franca, [data_substituicao]`,
  },
  {
    id: 'comprovante-visita',
    title: 'Comprovante de Realização de Visita',
    category: 'Visitas',
    description: 'Comprovante de visita ao imóvel com assinatura do visitante',
    icon: '👁️',
    fields: [
      { key: 'visitante_nome', label: 'Nome do Visitante', required: true },
      { key: 'visitante_cpf', label: 'CPF do Visitante' },
      { key: 'imovel_endereco', label: 'Endereço do Imóvel', required: true },
      { key: 'imovel_bairro', label: 'Bairro do Imóvel' },
      { key: 'corretor_nome', label: 'Nome do Corretor', required: true },
      { key: 'data_visita', label: 'Data da Visita', required: true },
      { key: 'horario_visita', label: 'Horário da Visita' },
    ],
    content: `COMPROVANTE DE REALIZAÇÃO DE VISITA

Eu, [visitante_nome], CPF [visitante_cpf], venho por meio desta informar que realizei visita ao imóvel:

Endereço: [imovel_endereco], Bairro [imovel_bairro], Franca/SP
Data: [data_visita] às [horario_visita]
Apresentado por: [corretor_nome], corretor(a) da IMOBILIÁRIA LEMOS

Declaro que a visita foi realizada com intermediação exclusiva da Imobiliária Lemos e que qualquer negociação futura referente a este imóvel será obrigatoriamente realizada por meio desta.

Franca, [data_visita]

_________________________________
[visitante_nome]`,
  },
  {
    id: 'protocolo-documentos',
    title: 'Protocolo de Entrega de Documentos',
    category: 'Administrativo',
    description: 'Protocolo de recebimento de documentos pelo cliente',
    icon: '📂',
    fields: [
      { key: 'cliente_nome', label: 'Nome do Cliente', required: true },
      { key: 'cliente_cpf', label: 'CPF do Cliente' },
      { key: 'documentos_listados', label: 'Documentos Entregues', required: true, multiline: true },
      { key: 'finalidade', label: 'Finalidade', placeholder: 'Ex: Elaboração de contrato de locação' },
      { key: 'data_protocolo', label: 'Data', required: true },
      { key: 'atendente', label: 'Atendente Responsável' },
    ],
    content: `PROTOCOLO DE ENTREGA DE DOCUMENTOS

Eu, [cliente_nome], CPF [cliente_cpf], declaro ter entregue à IMOBILIÁRIA LEMOS os seguintes documentos:

[documentos_listados]

FINALIDADE: [finalidade]

Franca, [data_protocolo]

_________________________________    _________________________________
[cliente_nome]                         [atendente] — IMOBILIÁRIA LEMOS

--- CANHOTO ---

Protocolo — [data_protocolo]
Cliente: [cliente_nome]
Recebemos os documentos acima listados.`,
  },
  {
    id: 'carta-agradecimento',
    title: 'Carta de Agradecimento',
    category: 'Relacionamento',
    description: 'Carta de agradecimento ao cliente após fechamento de negócio',
    icon: '💌',
    fields: [
      { key: 'cliente_nome', label: 'Nome do Cliente', required: true },
      { key: 'tipo_negocio', label: 'Tipo de Negócio', placeholder: 'Ex: compra, locação, venda' },
      { key: 'imovel_descricao', label: 'Descrição do Imóvel' },
      { key: 'corretor_nome', label: 'Nome do Corretor Responsável' },
      { key: 'data_carta', label: 'Data da Carta' },
      { key: 'mensagem_personalizada', label: 'Mensagem Personalizada (opcional)', multiline: true },
    ],
    content: `CARTA DE AGRADECIMENTO

Franca, [data_carta]

Prezado(a) [cliente_nome],

É com grande satisfação que a IMOBILIÁRIA LEMOS agradece pela confiança depositada em nossa equipe para a realização do seu [tipo_negocio].

[mensagem_personalizada]

Esperamos ter contribuído para realizar seu sonho e estamos à disposição para futuros negócios e para qualquer suporte necessário.

Atenciosamente,

IMOBILIÁRIA LEMOS
Noêmia Pires Lemos da Silva — CRECI 61053-F
Rua Simão Caleiro, 2383 — Franca/SP
Tel: (16) 3723-0045`,
  },
  {
    id: 'declaracao-autorizacao-visita',
    title: 'Declaração de Autorização de Visita/Vistoria',
    category: 'Visitas',
    description: 'Declaração autorizando vistoria ou visita ao imóvel',
    icon: '📝',
    fields: [
      { key: 'autorizante_nome', label: 'Nome do Autorizante', required: true },
      { key: 'vistoriador_nome', label: 'Nome do Vistoriador/Visitante', required: true },
      { key: 'imovel_descricao', label: 'Descrição do Imóvel', required: true },
      { key: 'finalidade', label: 'Finalidade da Visita', required: true },
      { key: 'data_validade', label: 'Data de Validade da Autorização' },
      { key: 'data_declaracao', label: 'Data da Declaração' },
    ],
    content: `DECLARAÇÃO DE AUTORIZAÇÃO DE VISITA

A IMOBILIÁRIA LEMOS, na pessoa de [autorizante_nome], autoriza [vistoriador_nome] a visitar/vistoriar:

IMÓVEL: [imovel_descricao]

FINALIDADE: [finalidade]
VALIDADE: [data_validade]

Franca, [data_declaracao]

_________________________________
IMOBILIÁRIA LEMOS
[autorizante_nome]`,
  },
  {
    id: 'aditivo-substituicao-locador',
    title: 'Aditivo — Substituição de Locador',
    category: 'Aditivos',
    description: 'Aditivo contratual para substituição do proprietário/locador',
    icon: '🔄',
    fields: [
      { key: 'locador_saindo_nome', label: 'Nome do Locador Anterior', required: true },
      { key: 'locador_saindo_cpf', label: 'CPF do Locador Anterior' },
      { key: 'locador_entrando_nome', label: 'Nome do Novo Locador', required: true },
      { key: 'locador_entrando_cpf', label: 'CPF do Novo Locador', required: true },
      { key: 'locatario_nome', label: 'Nome do Locatário', required: true },
      { key: 'imovel_endereco', label: 'Endereço do Imóvel', required: true },
      { key: 'motivo', label: 'Motivo da Substituição', placeholder: 'Ex: Venda do imóvel, falecimento, doação' },
      { key: 'data_aditivo', label: 'Data do Aditivo', required: true },
    ],
    content: `ADITIVO AO CONTRATO DE LOCAÇÃO — SUBSTITUIÇÃO DE LOCADOR

LOCADOR ANTERIOR: [locador_saindo_nome], CPF: [locador_saindo_cpf]
NOVO LOCADOR: [locador_entrando_nome], CPF: [locador_entrando_cpf]
LOCATÁRIO: [locatario_nome]
IMÓVEL: [imovel_endereco], Franca/SP
MOTIVO: [motivo]

A partir de [data_aditivo], [locador_entrando_nome] passa a ser o locador do contrato, assumindo todos os direitos e obrigações, mantendo-se as demais cláusulas inalteradas.

Franca, [data_aditivo]`,
  },
]

export const CATEGORIES = Array.from(new Set(TEMPLATES.map(t => t.category)))

export const TEMPLATE_BY_ID = Object.fromEntries(TEMPLATES.map(t => [t.id, t]))

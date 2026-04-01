export interface DocTemplate {
  id: string
  title: string
  category: string
  description: string
  icon: string
  fields: Array<{ key: string; label: string; placeholder?: string; required?: boolean; multiline?: boolean }>
  content: string
}

// ─── LEMOS header constant used inside template content strings ───────────────
const LEMOS_HEADER = `IMOBILIÁRIA LEMOS
NOEMIA PIRES LEMOS DA SILVA — CRECI/SP 61053-F
TOMAS CESAR LEMOS SILVA — CRECI/SP 279051
Rua Simão Caleiro, 2383 — Vila França — Franca/SP — CEP 14401-155
Tel: (16) 3723-0045`

export const TEMPLATES: DocTemplate[] = [

  // ════════════════════════════════════════════════════════════════
  //  LOCAÇÃO
  // ════════════════════════════════════════════════════════════════

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
      { key: 'locatario_estado_civil', label: 'Estado Civil do Locatário' },
      { key: 'locatario_endereco_atual', label: 'Endereço Atual do Locatário' },
      { key: 'imovel_endereco', label: 'Endereço do Imóvel', required: true },
      { key: 'imovel_bairro', label: 'Bairro do Imóvel' },
      { key: 'imovel_descricao', label: 'Descrição do Imóvel', placeholder: 'Ex: Casa com 3 quartos, sala, cozinha, 2 banheiros, garagem' },
      { key: 'valor_aluguel', label: 'Valor do Aluguel (R$)', required: true },
      { key: 'dia_vencimento', label: 'Dia de Vencimento', placeholder: 'Ex: 10' },
      { key: 'data_inicio', label: 'Data de Início', required: true },
      { key: 'data_fim', label: 'Data de Término', required: true },
      { key: 'garantia_tipo', label: 'Tipo de Garantia', placeholder: 'Fiador / Caução / Seguro Fiança' },
      { key: 'fiador_nome', label: 'Nome do Fiador (se houver)' },
      { key: 'fiador_cpf', label: 'CPF do Fiador' },
      { key: 'fiador_rg', label: 'RG do Fiador' },
      { key: 'fiador_estado_civil', label: 'Estado Civil do Fiador' },
      { key: 'fiador_endereco', label: 'Endereço do Fiador' },
      { key: 'data_assinatura', label: 'Data de Assinatura', placeholder: 'Franca, DD de mês de AAAA' },
      { key: 'observacoes', label: 'Observações adicionais', multiline: true },
    ],
    content: `${LEMOS_HEADER}

CONTRATO DE LOCAÇÃO RESIDENCIAL

LOCADOR: [locador_nome], CPF: [locador_cpf], RG: [locador_rg], [locador_estado_civil], residente em [locador_endereco].

ADMINISTRADORA: IMOBILIÁRIA LEMOS — NOEMIA PIRES LEMOS DA SILVA, CRECI/SP 61053-F, Rua Simão Caleiro, 2383, Franca/SP.

LOCATÁRIO: [locatario_nome], CPF: [locatario_cpf], RG: [locatario_rg], nascido em [locatario_nascimento], [locatario_profissao], [locatario_estado_civil], residente em [locatario_endereco_atual].

IMÓVEL LOCADO: [imovel_descricao], situado na [imovel_endereco], Bairro [imovel_bairro], Franca/SP.

CLÁUSULA PRIMEIRA — DO PRAZO
O prazo de locação é de 30 (trinta) meses, com início em [data_inicio] e término previsto para [data_fim], findos os quais o imóvel deverá ser devolvido nas mesmas condições em que foi recebido.

CLÁUSULA SEGUNDA — DO ALUGUEL
O aluguel mensal é de R$ [valor_aluguel], a ser pago até o dia [dia_vencimento] de cada mês, mediante boleto bancário emitido pela Administradora.

CLÁUSULA TERCEIRA — DO REAJUSTE
O aluguel será reajustado anualmente pelo IGP-M/FGV ou, na sua extinção, pelo índice legal substituto.

CLÁUSULA QUARTA — DA GARANTIA
Modalidade de garantia: [garantia_tipo].
Fiador: [fiador_nome], CPF: [fiador_cpf], RG: [fiador_rg], [fiador_estado_civil], residente em [fiador_endereco].

CLÁUSULA QUINTA — DO USO
O imóvel destina-se exclusivamente à moradia do locatário e sua família imediata, sendo vedado uso comercial ou a cessão/sublocação sem anuência escrita do locador.

CLÁUSULA SEXTA — DA MANUTENÇÃO
O locatário é responsável pela conservação do imóvel, reparos de pequeno vulto, e pela manutenção de instalações hidráulicas, elétricas, gás e demais componentes de uso cotidiano.

CLÁUSULA SÉTIMA — DAS BENFEITORIAS
Não serão permitidas obras ou alterações sem autorização prévia e escrita do locador. As benfeitorias úteis não serão indenizadas; as necessárias, sim.

CLÁUSULA OITAVA — DA VISTORIA
O imóvel foi entregue conforme laudo de vistoria em anexo, que faz parte integrante deste contrato.

CLÁUSULA NONA — DA RESCISÃO ANTECIPADA
Em caso de rescisão antecipada pelo locatário, será devida multa proporcional ao tempo faltante do contrato, calculada sobre o valor do aluguel vigente, nos termos do art. 4º da Lei 8.245/91.

CLÁUSULA DÉCIMA — DO FORO
Fica eleito o Foro da Comarca de Franca/SP para dirimir quaisquer dúvidas oriundas deste instrumento.

[observacoes]

[data_assinatura]

_________________________________    _________________________________
[locador_nome] (Locador)               IMOBILIÁRIA LEMOS (Administradora)

_________________________________    _________________________________
[locatario_nome] (Locatário)           [fiador_nome] (Fiador)`,
  },

  {
    id: 'contrato-locacao-caucao',
    title: 'Contrato de Locação — Garantia: Caução',
    category: 'Locação',
    description: 'Contrato de locação residencial com depósito caução em dinheiro (até 3 aluguéis)',
    icon: '💰',
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
      { key: 'locatario_estado_civil', label: 'Estado Civil do Locatário' },
      { key: 'locatario_endereco_atual', label: 'Endereço Atual do Locatário' },
      { key: 'imovel_endereco', label: 'Endereço do Imóvel', required: true },
      { key: 'imovel_bairro', label: 'Bairro do Imóvel' },
      { key: 'imovel_descricao', label: 'Descrição do Imóvel' },
      { key: 'valor_aluguel', label: 'Valor do Aluguel (R$)', required: true },
      { key: 'valor_caucao', label: 'Valor da Caução (R$)', required: true, placeholder: 'Máximo 3 aluguéis' },
      { key: 'dia_vencimento', label: 'Dia de Vencimento', placeholder: 'Ex: 10' },
      { key: 'data_inicio', label: 'Data de Início', required: true },
      { key: 'data_fim', label: 'Data de Término', required: true },
      { key: 'conta_deposito', label: 'Conta Bancária para Depósito da Caução', placeholder: 'Banco, Ag., Conta' },
      { key: 'data_assinatura', label: 'Data de Assinatura', placeholder: 'Franca, DD de mês de AAAA' },
      { key: 'observacoes', label: 'Observações', multiline: true },
    ],
    content: `${LEMOS_HEADER}

CONTRATO DE LOCAÇÃO RESIDENCIAL
MODALIDADE DE GARANTIA: DEPÓSITO CAUÇÃO

LOCADOR: [locador_nome], CPF: [locador_cpf], RG: [locador_rg], [locador_estado_civil], residente em [locador_endereco].

ADMINISTRADORA: IMOBILIÁRIA LEMOS — NOEMIA PIRES LEMOS DA SILVA, CRECI/SP 61053-F, Rua Simão Caleiro, 2383, Franca/SP.

LOCATÁRIO: [locatario_nome], CPF: [locatario_cpf], RG: [locatario_rg], nascido em [locatario_nascimento], [locatario_profissao], [locatario_estado_civil], residente em [locatario_endereco_atual].

IMÓVEL LOCADO: [imovel_descricao], situado na [imovel_endereco], Bairro [imovel_bairro], Franca/SP.

CLÁUSULA PRIMEIRA — DO PRAZO
O prazo de locação é de 30 (trinta) meses, com início em [data_inicio] e término em [data_fim].

CLÁUSULA SEGUNDA — DO ALUGUEL
O aluguel mensal é de R$ [valor_aluguel], com vencimento todo dia [dia_vencimento], pago via boleto bancário.

CLÁUSULA TERCEIRA — DO REAJUSTE
Reajuste anual pelo IGP-M/FGV ou índice legal substituto.

CLÁUSULA QUARTA — DA CAUÇÃO
Em garantia das obrigações deste contrato, o locatário deposita neste ato a quantia de R$ [valor_caucao], equivalente a 3 (três) aluguéis, nos termos do art. 38, §2º da Lei 8.245/91, mediante depósito em: [conta_deposito].
A caução somente será restituída após o término do contrato, entrega das chaves e quitação de todos os débitos, corrigida pela caderneta de poupança (art. 38, §4º, Lei 8.245/91).
Em caso de débito, o valor será utilizado para cobrir aluguéis, encargos, reparos ou multas devidos.

CLÁUSULA QUINTA — DO USO
O imóvel destina-se exclusivamente à moradia do locatário e sua família, sendo vedada sublocação ou cessão.

CLÁUSULA SEXTA — DA MANUTENÇÃO
O locatário responsabiliza-se pela conservação, limpeza e reparos de desgaste cotidiano do imóvel.

CLÁUSULA SÉTIMA — DAS BENFEITORIAS
Obras sem autorização escrita do locador serão desfeitas pelo locatário ao término do contrato; benfeitorias necessárias serão indenizadas; as úteis e voluptuárias, não.

CLÁUSULA OITAVA — DA VISTORIA
O imóvel é entregue conforme laudo de vistoria em anexo, parte integrante deste contrato.

CLÁUSULA NONA — DA RESCISÃO ANTECIPADA
Em caso de rescisão antecipada pelo locatário antes de 12 meses de vigência, incidirá multa proporcional ao período remanescente do contrato, calculada sobre o valor do aluguel vigente.

CLÁUSULA DÉCIMA — DO FORO
Fica eleito o Foro da Comarca de Franca/SP.

[observacoes]

[data_assinatura]

_________________________________    _________________________________
[locador_nome] (Locador)               IMOBILIÁRIA LEMOS (Administradora)

_________________________________
[locatario_nome] (Locatário)`,
  },

  {
    id: 'contrato-locacao-fianca',
    title: 'Contrato de Locação — Garantia: Fiança Pessoal',
    category: 'Locação',
    description: 'Contrato de locação residencial com fiador pessoal solidário',
    icon: '🤝',
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
      { key: 'locatario_estado_civil', label: 'Estado Civil do Locatário' },
      { key: 'locatario_endereco_atual', label: 'Endereço Atual do Locatário' },
      { key: 'imovel_endereco', label: 'Endereço do Imóvel', required: true },
      { key: 'imovel_bairro', label: 'Bairro do Imóvel' },
      { key: 'imovel_descricao', label: 'Descrição do Imóvel' },
      { key: 'valor_aluguel', label: 'Valor do Aluguel (R$)', required: true },
      { key: 'dia_vencimento', label: 'Dia de Vencimento', placeholder: 'Ex: 10' },
      { key: 'data_inicio', label: 'Data de Início', required: true },
      { key: 'data_fim', label: 'Data de Término', required: true },
      { key: 'fiador_nome', label: 'Nome do Fiador', required: true },
      { key: 'fiador_cpf', label: 'CPF do Fiador', required: true },
      { key: 'fiador_rg', label: 'RG do Fiador' },
      { key: 'fiador_estado_civil', label: 'Estado Civil do Fiador' },
      { key: 'fiador_profissao', label: 'Profissão do Fiador' },
      { key: 'fiador_endereco', label: 'Endereço do Fiador', required: true },
      { key: 'fiador_conjuge_nome', label: 'Nome do Cônjuge do Fiador (se casado)' },
      { key: 'fiador_conjuge_cpf', label: 'CPF do Cônjuge do Fiador' },
      { key: 'data_assinatura', label: 'Data de Assinatura', placeholder: 'Franca, DD de mês de AAAA' },
      { key: 'observacoes', label: 'Observações', multiline: true },
    ],
    content: `${LEMOS_HEADER}

CONTRATO DE LOCAÇÃO RESIDENCIAL
MODALIDADE DE GARANTIA: FIANÇA PESSOAL

LOCADOR: [locador_nome], CPF: [locador_cpf], RG: [locador_rg], [locador_estado_civil], residente em [locador_endereco].

ADMINISTRADORA: IMOBILIÁRIA LEMOS — NOEMIA PIRES LEMOS DA SILVA, CRECI/SP 61053-F, Rua Simão Caleiro, 2383, Franca/SP.

LOCATÁRIO: [locatario_nome], CPF: [locatario_cpf], RG: [locatario_rg], nascido em [locatario_nascimento], [locatario_profissao], [locatario_estado_civil], residente em [locatario_endereco_atual].

FIADOR: [fiador_nome], CPF: [fiador_cpf], RG: [fiador_rg], [fiador_estado_civil], [fiador_profissao], residente em [fiador_endereco].
CÔNJUGE DO FIADOR: [fiador_conjuge_nome], CPF: [fiador_conjuge_cpf] (outorga uxória/marital concedida).

IMÓVEL LOCADO: [imovel_descricao], situado na [imovel_endereco], Bairro [imovel_bairro], Franca/SP.

CLÁUSULA PRIMEIRA — DO PRAZO
Prazo de 30 (trinta) meses, de [data_inicio] a [data_fim].

CLÁUSULA SEGUNDA — DO ALUGUEL
R$ [valor_aluguel] mensais, com vencimento no dia [dia_vencimento].

CLÁUSULA TERCEIRA — DO REAJUSTE
Reajuste anual pelo IGP-M/FGV ou índice substituto legal.

CLÁUSULA QUARTA — DA FIANÇA
O FIADOR acima qualificado, neste ato, presta fiança ao LOCATÁRIO, obrigando-se solidariamente ao pagamento de todos os débitos decorrentes deste contrato: aluguéis, encargos, multas, danos ao imóvel e custas judiciais.
A fiança subsistirá até a efetiva entrega das chaves e plena quitação dos débitos, nos termos do art. 39 da Lei 8.245/91.
O FIADOR renuncia expressamente ao benefício de ordem previsto no art. 827 do Código Civil.
Havendo pluralidade de fiadores, a obrigação é solidária entre eles.

CLÁUSULA QUINTA — DO USO
O imóvel destina-se exclusivamente à moradia do locatário, sendo vedada sublocação.

CLÁUSULA SEXTA — DA MANUTENÇÃO
O locatário é responsável pela conservação e reparos de uso corrente do imóvel.

CLÁUSULA SÉTIMA — DA VISTORIA
O imóvel é entregue conforme laudo de vistoria em anexo.

CLÁUSULA OITAVA — DA RESCISÃO ANTECIPADA
Rescisão antecipada pelo locatário antes de 12 meses implica multa proporcional ao período remanescente.

CLÁUSULA NONA — DO FORO
Comarca de Franca/SP.

[observacoes]

[data_assinatura]

_________________________________    _________________________________
[locador_nome] (Locador)               IMOBILIÁRIA LEMOS (Administradora)

_________________________________    _________________________________
[locatario_nome] (Locatário)           [fiador_nome] (Fiador)

_________________________________
[fiador_conjuge_nome] (Cônjuge do Fiador)`,
  },

  {
    id: 'contrato-locacao-seguro-fianca',
    title: 'Contrato de Locação — Garantia: Seguro Fiança',
    category: 'Locação',
    description: 'Contrato de locação residencial com seguro fiança locatícia',
    icon: '🛡️',
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
      { key: 'locatario_estado_civil', label: 'Estado Civil do Locatário' },
      { key: 'locatario_endereco_atual', label: 'Endereço Atual do Locatário' },
      { key: 'imovel_endereco', label: 'Endereço do Imóvel', required: true },
      { key: 'imovel_bairro', label: 'Bairro do Imóvel' },
      { key: 'imovel_descricao', label: 'Descrição do Imóvel' },
      { key: 'valor_aluguel', label: 'Valor do Aluguel (R$)', required: true },
      { key: 'dia_vencimento', label: 'Dia de Vencimento', placeholder: 'Ex: 10' },
      { key: 'data_inicio', label: 'Data de Início', required: true },
      { key: 'data_fim', label: 'Data de Término', required: true },
      { key: 'seguradora_nome', label: 'Nome da Seguradora', required: true, placeholder: 'Ex: Porto Seguro, Tokio Marine, Mapfre' },
      { key: 'apolice_numero', label: 'Número da Apólice', required: true },
      { key: 'apolice_validade', label: 'Validade da Apólice' },
      { key: 'cobertura_descricao', label: 'Coberturas Contratadas', multiline: true, placeholder: 'Ex: Aluguel + encargos, danos ao imóvel, pintura' },
      { key: 'data_assinatura', label: 'Data de Assinatura', placeholder: 'Franca, DD de mês de AAAA' },
      { key: 'observacoes', label: 'Observações', multiline: true },
    ],
    content: `${LEMOS_HEADER}

CONTRATO DE LOCAÇÃO RESIDENCIAL
MODALIDADE DE GARANTIA: SEGURO FIANÇA LOCATÍCIA

LOCADOR: [locador_nome], CPF: [locador_cpf], RG: [locador_rg], [locador_estado_civil], residente em [locador_endereco].

ADMINISTRADORA: IMOBILIÁRIA LEMOS — NOEMIA PIRES LEMOS DA SILVA, CRECI/SP 61053-F, Rua Simão Caleiro, 2383, Franca/SP.

LOCATÁRIO: [locatario_nome], CPF: [locatario_cpf], RG: [locatario_rg], nascido em [locatario_nascimento], [locatario_profissao], [locatario_estado_civil], residente em [locatario_endereco_atual].

IMÓVEL LOCADO: [imovel_descricao], situado na [imovel_endereco], Bairro [imovel_bairro], Franca/SP.

CLÁUSULA PRIMEIRA — DO PRAZO
Prazo de 30 (trinta) meses, de [data_inicio] a [data_fim].

CLÁUSULA SEGUNDA — DO ALUGUEL
R$ [valor_aluguel] mensais, vencimento dia [dia_vencimento].

CLÁUSULA TERCEIRA — DO REAJUSTE
Reajuste anual pelo IGP-M/FGV ou índice legal substituto.

CLÁUSULA QUARTA — DO SEGURO FIANÇA LOCATÍCIA
Em garantia das obrigações locatícias, o LOCATÁRIO apresenta Seguro Fiança contratado junto à seguradora [seguradora_nome], Apólice nº [apolice_numero], com validade até [apolice_validade].
Coberturas: [cobertura_descricao].
O locatário obriga-se a manter o seguro vigente e renovado durante toda a locação, comunicando à Administradora qualquer alteração ou cancelamento com 30 dias de antecedência.
O não pagamento do prêmio ou cancelamento do seguro sem substituto acarretará rescisão por infração contratual.

CLÁUSULA QUINTA — DO USO
Exclusivo para moradia, vedada sublocação.

CLÁUSULA SEXTA — DA MANUTENÇÃO
O locatário conservará o imóvel, responsabilizando-se por reparos de uso.

CLÁUSULA SÉTIMA — DA VISTORIA
Imóvel entregue conforme laudo em anexo.

CLÁUSULA OITAVA — DA RESCISÃO ANTECIPADA
Multa proporcional ao período remanescente em rescisão antecipada.

CLÁUSULA NONA — DO FORO
Comarca de Franca/SP.

[observacoes]

[data_assinatura]

_________________________________    _________________________________
[locador_nome] (Locador)               IMOBILIÁRIA LEMOS (Administradora)

_________________________________
[locatario_nome] (Locatário)`,
  },

  {
    id: 'contrato-locacao-temporada',
    title: 'Contrato de Locação por Temporada',
    category: 'Locação',
    description: 'Contrato para locação por temporada — até 90 dias (Art. 48 Lei 8.245/91)',
    icon: '🌴',
    fields: [
      { key: 'locador_nome', label: 'Nome do Locador', required: true },
      { key: 'locador_cpf', label: 'CPF do Locador', required: true },
      { key: 'locatario_nome', label: 'Nome do Locatário', required: true },
      { key: 'locatario_cpf', label: 'CPF do Locatário', required: true },
      { key: 'locatario_rg', label: 'RG do Locatário' },
      { key: 'locatario_endereco', label: 'Endereço do Locatário' },
      { key: 'imovel_endereco', label: 'Endereço do Imóvel', required: true },
      { key: 'imovel_bairro', label: 'Bairro do Imóvel' },
      { key: 'imovel_descricao', label: 'Descrição e Mobiliário do Imóvel', multiline: true },
      { key: 'valor_total', label: 'Valor Total (R$)', required: true },
      { key: 'valor_deposito', label: 'Depósito Caução (R$)', placeholder: 'Restituível na saída' },
      { key: 'data_entrada', label: 'Data de Entrada', required: true },
      { key: 'data_saida', label: 'Data de Saída', required: true },
      { key: 'horario_entrada', label: 'Horário de Entrada', placeholder: 'Ex: 14h00' },
      { key: 'horario_saida', label: 'Horário de Saída', placeholder: 'Ex: 11h00' },
      { key: 'num_pessoas', label: 'Número de Hóspedes Autorizados' },
      { key: 'finalidade', label: 'Finalidade da Locação', placeholder: 'Ex: Lazer, férias, trabalho' },
      { key: 'regras_especificas', label: 'Regras Específicas', multiline: true, placeholder: 'Ex: Não são permitidos animais, festas até 22h...' },
      { key: 'data_assinatura', label: 'Data de Assinatura' },
    ],
    content: `${LEMOS_HEADER}

CONTRATO DE LOCAÇÃO POR TEMPORADA
(Art. 48 da Lei Federal nº 8.245/91)

LOCADOR: [locador_nome], CPF: [locador_cpf].
ADMINISTRADORA: IMOBILIÁRIA LEMOS — CRECI/SP 61053-F.
LOCATÁRIO: [locatario_nome], CPF: [locatario_cpf], RG: [locatario_rg], residente em [locatario_endereco].

IMÓVEL: [imovel_descricao], situado na [imovel_endereco], Bairro [imovel_bairro], Franca/SP.

PERÍODO: Entrada em [data_entrada] às [horario_entrada] | Saída em [data_saida] às [horario_saida].
VALOR TOTAL: R$ [valor_total]
DEPÓSITO CAUÇÃO: R$ [valor_deposito] (restituível ao final)
NÚMERO DE HÓSPEDES AUTORIZADOS: [num_pessoas]
FINALIDADE: [finalidade]

CLÁUSULA PRIMEIRA — DO PRAZO
Locação por temporada com prazo máximo de 90 dias, conforme Art. 48 da Lei 8.245/91. Findo o prazo sem solicitação de renovação, o locador poderá reaver o imóvel sem notificação prévia.

CLÁUSULA SEGUNDA — DO PAGAMENTO
O valor total de R$ [valor_total] deverá ser pago na assinatura deste instrumento.

CLÁUSULA TERCEIRA — DO DEPÓSITO CAUÇÃO
O depósito de R$ [valor_deposito] será restituído ao locatário após vistoria de saída e constatação de que o imóvel se encontra em perfeitas condições.

CLÁUSULA QUARTA — DO USO
O locatário se compromete a utilizar o imóvel exclusivamente para [finalidade], respeitando o número máximo de [num_pessoas] pessoas autorizadas.

CLÁUSULA QUINTA — DAS REGRAS
[regras_especificas]
É proibido fumar no interior do imóvel. Animais domésticos apenas com autorização expressa. Eventos e festas devem ser comunicados previamente.

CLÁUSULA SEXTA — DA ENTREGA
O imóvel deverá ser entregue nas mesmas condições de recebimento, limpo, com móveis e utensílios no lugar.

CLÁUSULA SÉTIMA — DO FORO
Comarca de Franca/SP.

[data_assinatura]

_________________________________    _________________________________
[locador_nome] (Locador)               [locatario_nome] (Locatário)`,
  },

  {
    id: 'contrato-locacao-comercial',
    title: 'Contrato de Locação Comercial',
    category: 'Locação',
    description: 'Contrato de locação para fins comerciais/empresariais com ação renovatória',
    icon: '🏢',
    fields: [
      { key: 'locador_nome', label: 'Nome/Razão Social do Locador', required: true },
      { key: 'locador_cpf_cnpj', label: 'CPF/CNPJ do Locador', required: true },
      { key: 'locador_endereco', label: 'Endereço do Locador' },
      { key: 'locatario_nome', label: 'Nome/Razão Social do Locatário', required: true },
      { key: 'locatario_cpf_cnpj', label: 'CPF/CNPJ do Locatário', required: true },
      { key: 'locatario_rg', label: 'RG/IE do Representante' },
      { key: 'locatario_representante', label: 'Nome do Representante Legal' },
      { key: 'locatario_endereco', label: 'Endereço do Locatário' },
      { key: 'imovel_endereco', label: 'Endereço do Imóvel Comercial', required: true },
      { key: 'imovel_bairro', label: 'Bairro' },
      { key: 'imovel_descricao', label: 'Descrição do Imóvel', multiline: true },
      { key: 'imovel_area', label: 'Área em m²' },
      { key: 'atividade_comercial', label: 'Atividade Comercial Permitida', required: true },
      { key: 'valor_aluguel', label: 'Valor do Aluguel (R$)', required: true },
      { key: 'dia_vencimento', label: 'Dia de Vencimento' },
      { key: 'data_inicio', label: 'Data de Início', required: true },
      { key: 'data_fim', label: 'Data de Término', required: true },
      { key: 'indice_reajuste', label: 'Índice de Reajuste', placeholder: 'Ex: IGPM, IPCA' },
      { key: 'garantia_tipo', label: 'Tipo de Garantia' },
      { key: 'fiador_nome', label: 'Fiador (se houver)' },
      { key: 'fiador_cpf', label: 'CPF do Fiador' },
      { key: 'data_assinatura', label: 'Data de Assinatura' },
      { key: 'observacoes', label: 'Observações', multiline: true },
    ],
    content: `${LEMOS_HEADER}

CONTRATO DE LOCAÇÃO PARA FINS COMERCIAIS

LOCADOR: [locador_nome], CPF/CNPJ: [locador_cpf_cnpj], residente/sediado em [locador_endereco].

ADMINISTRADORA: IMOBILIÁRIA LEMOS — NOEMIA PIRES LEMOS DA SILVA, CRECI/SP 61053-F, Rua Simão Caleiro, 2383, Franca/SP.

LOCATÁRIO: [locatario_nome], CPF/CNPJ: [locatario_cpf_cnpj], representado por [locatario_representante], RG/IE: [locatario_rg], com sede em [locatario_endereco].

IMÓVEL LOCADO: [imovel_descricao], área de [imovel_area] m², situado na [imovel_endereco], Bairro [imovel_bairro], Franca/SP.

ATIVIDADE AUTORIZADA: [atividade_comercial]

CLÁUSULA PRIMEIRA — DO PRAZO
Prazo de locação: [data_inicio] a [data_fim]. Findo este prazo, o locatário poderá propor ação renovatória nos termos da Lei 8.245/91 (art. 51), desde que atendidos os requisitos legais.

CLÁUSULA SEGUNDA — DO ALUGUEL
Aluguel mensal de R$ [valor_aluguel], com vencimento no dia [dia_vencimento].

CLÁUSULA TERCEIRA — DO REAJUSTE
Reajuste anual pelo [indice_reajuste] ou índice legal substituto.

CLÁUSULA QUARTA — DA GARANTIA
[garantia_tipo]. Fiador: [fiador_nome], CPF: [fiador_cpf].

CLÁUSULA QUINTA — DO USO
O imóvel destina-se exclusivamente ao exercício de [atividade_comercial], sendo vedada qualquer outra atividade sem anuência escrita do locador.

CLÁUSULA SEXTA — DAS OBRAS E BENFEITORIAS
Obras de adaptação e instalações comerciais dependem de autorização prévia e escrita do locador. As benfeitorias realizadas pelo locatário incorporam-se ao imóvel sem direito a indenização, salvo acordo em contrário.

CLÁUSULA SÉTIMA — DOS IMPOSTOS E ENCARGOS
IPTU e demais taxas municipais relativas ao imóvel são de responsabilidade do locador, salvo pactuação diversa. Taxas de água, energia, gás e telecomunicações são de responsabilidade do locatário.

CLÁUSULA OITAVA — DA RESCISÃO
A rescisão antecipada implica multa correspondente a 3 (três) aluguéis vigentes.

CLÁUSULA NONA — DO FORO
Comarca de Franca/SP.

[observacoes]

[data_assinatura]

_________________________________    _________________________________
[locador_nome] (Locador)               IMOBILIÁRIA LEMOS (Administradora)

_________________________________    _________________________________
[locatario_nome] (Locatário)           [fiador_nome] (Fiador)`,
  },

  // ════════════════════════════════════════════════════════════════
  //  VENDA
  // ════════════════════════════════════════════════════════════════

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
      { key: 'imovel_cartorio', label: 'Cartório de Registro' },
      { key: 'valor_venda', label: 'Valor de Venda (R$)', required: true },
      { key: 'valor_sinal', label: 'Valor do Sinal/Entrada (R$)' },
      { key: 'data_sinal', label: 'Data do Pagamento do Sinal' },
      { key: 'forma_pagamento', label: 'Forma de Pagamento do Saldo', multiline: true },
      { key: 'prazo_escritura', label: 'Prazo para Escritura', placeholder: 'Ex: 60 dias após assinatura' },
      { key: 'comissao_pct', label: 'Comissão Imobiliária (%)' },
      { key: 'data_assinatura', label: 'Data de Assinatura' },
      { key: 'testemunha1', label: 'Testemunha 1' },
      { key: 'testemunha2', label: 'Testemunha 2' },
      { key: 'observacoes', label: 'Observações', multiline: true },
    ],
    content: `${LEMOS_HEADER}

INSTRUMENTO PARTICULAR DE COMPROMISSO DE VENDA E COMPRA

VENDEDOR: [vendedor_nome], [vendedor_estado_civil], [vendedor_profissao], RG: [vendedor_rg], CPF: [vendedor_cpf], residente em [vendedor_endereco].

COMPRADOR: [comprador_nome], [comprador_estado_civil], [comprador_profissao], RG: [comprador_rg], CPF: [comprador_cpf], residente em [comprador_endereco].

IMÓVEL OBJETO: [imovel_descricao].
Matrícula nº [imovel_matricula] — [imovel_cartorio] | Inscrição Municipal: [imovel_inscricao_pref].

CLÁUSULA PRIMEIRA — DO PREÇO E PAGAMENTO
Preço total: R$ [valor_venda].
Sinal pago neste ato: R$ [valor_sinal] em [data_sinal].
Saldo: [forma_pagamento].

CLÁUSULA SEGUNDA — DA ESCRITURA DEFINITIVA
As partes comprometem-se a lavrar a escritura definitiva de compra e venda no prazo de [prazo_escritura], junto ao Tabelionato de Notas indicado pelo comprador, após quitação integral do preço.

CLÁUSULA TERCEIRA — DA COMISSÃO
A comissão imobiliária de [comissao_pct]% sobre o valor de venda é devida ao fechamento do negócio, a cargo do vendedor, a ser paga à IMOBILIÁRIA LEMOS — CRECI/SP 61053-F.

CLÁUSULA QUARTA — DAS CONSEQUÊNCIAS DA DESISTÊNCIA
Em caso de desistência do COMPRADOR, o sinal pago será perdido em favor do VENDEDOR.
Em caso de desistência do VENDEDOR, devolverá o sinal em dobro ao COMPRADOR.

CLÁUSULA QUINTA — DAS DESPESAS
Todas as despesas de escritura, ITBI e registro são de responsabilidade do COMPRADOR.
O VENDEDOR responsabiliza-se por certidões negativas e regularidade documental do imóvel.

CLÁUSULA SEXTA — DAS OBRIGAÇÕES DO VENDEDOR
O vendedor declara que o imóvel está livre e desembaraçado de quaisquer ônus, dívidas, hipotecas ou litígios que impeçam a transferência.

CLÁUSULA SÉTIMA — DO FORO
Comarca de Franca/SP.

[observacoes]

[data_assinatura]

_________________________________    _________________________________
[vendedor_nome] (Vendedor)             [comprador_nome] (Comprador)

_________________________________    _________________________________
IMOBILIÁRIA LEMOS (Intermediadora)    Testemunha 1: [testemunha1]

Testemunha 2: [testemunha2]`,
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
    content: `${LEMOS_HEADER}

CARTA DE DESISTÊNCIA DE COMPRA DE IMÓVEL

Franca, [data_carta]

À IMOBILIÁRIA LEMOS
Rua Simão Caleiro, 2383 — Vila França — Franca/SP

Ref.: Desistência de proposta de compra — [imovel_descricao]

Eu, [comprador_nome], CPF [comprador_cpf], venho por meio desta formalizar minha desistência da proposta de compra do imóvel: [imovel_descricao], do vendedor [vendedor_nome], proposta formulada em [data_proposta].

Motivo: [motivo]

Declaro estar ciente das condições previstas no instrumento preliminar quanto às consequências desta desistência, inclusive quanto à perda do sinal eventualmente pago.

Atenciosamente,

_________________________________
[comprador_nome]
CPF: [comprador_cpf]`,
  },

  // ════════════════════════════════════════════════════════════════
  //  ADITIVOS
  // ════════════════════════════════════════════════════════════════

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
      { key: 'locatario_entrando_profissao', label: 'Profissão do Novo Locatário' },
      { key: 'locatario_entrando_endereco', label: 'Endereço do Novo Locatário' },
      { key: 'imovel_endereco', label: 'Endereço do Imóvel', required: true },
      { key: 'data_substituicao', label: 'Data da Substituição', required: true },
      { key: 'observacoes', label: 'Observações', multiline: true },
    ],
    content: `${LEMOS_HEADER}

ADITIVO AO CONTRATO DE LOCAÇÃO
SUBSTITUIÇÃO DE LOCATÁRIO

LOCADOR: [locador_nome]
LOCATÁRIO SAINDO: [locatario_saindo_nome], CPF: [locatario_saindo_cpf]
NOVO LOCATÁRIO: [locatario_entrando_nome], CPF: [locatario_entrando_cpf], RG: [locatario_entrando_rg], [locatario_entrando_estado_civil], [locatario_entrando_profissao], residente em [locatario_entrando_endereco].
IMÓVEL: [imovel_endereco], Franca/SP
ADMINISTRADORA: IMOBILIÁRIA LEMOS — CRECI/SP 61053-F

Pelo presente aditivo, as partes acordam a substituição de locatário a partir de [data_substituicao].

[locatario_entrando_nome] sub-roga-se em todos os direitos e obrigações do contrato de locação original, liberando [locatario_saindo_nome] das responsabilidades futuras a partir da data acima.

O novo locatário declara conhecer integralmente e aceitar todas as cláusulas do contrato original e seus aditivos anteriores.

Mantêm-se inalteradas todas as demais cláusulas do contrato principal.

[observacoes]

Franca, [data_substituicao]

_________________________________    _________________________________
[locador_nome] (Locador)               IMOBILIÁRIA LEMOS (Administradora)

_________________________________    _________________________________
[locatario_saindo_nome] (Saindo)       [locatario_entrando_nome] (Entrando)`,
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
      { key: 'locador_entrando_rg', label: 'RG do Novo Locador' },
      { key: 'locador_entrando_endereco', label: 'Endereço do Novo Locador' },
      { key: 'locatario_nome', label: 'Nome do Locatário', required: true },
      { key: 'imovel_endereco', label: 'Endereço do Imóvel', required: true },
      { key: 'motivo', label: 'Motivo da Substituição', placeholder: 'Ex: Venda do imóvel, falecimento, doação' },
      { key: 'data_aditivo', label: 'Data do Aditivo', required: true },
    ],
    content: `${LEMOS_HEADER}

ADITIVO AO CONTRATO DE LOCAÇÃO
SUBSTITUIÇÃO DE LOCADOR

LOCADOR ANTERIOR: [locador_saindo_nome], CPF: [locador_saindo_cpf]
NOVO LOCADOR: [locador_entrando_nome], CPF: [locador_entrando_cpf], RG: [locador_entrando_rg], residente em [locador_entrando_endereco].
LOCATÁRIO: [locatario_nome]
IMÓVEL: [imovel_endereco], Franca/SP
ADMINISTRADORA: IMOBILIÁRIA LEMOS — CRECI/SP 61053-F
MOTIVO DA SUBSTITUIÇÃO: [motivo]

A partir de [data_aditivo], [locador_entrando_nome] passa a ser o LOCADOR deste contrato, assumindo todos os direitos e obrigações decorrentes, inclusive o recebimento dos aluguéis futuros.

Mantêm-se inalteradas todas as demais cláusulas do contrato original.

Franca, [data_aditivo]

_________________________________    _________________________________
[locador_saindo_nome] (Locador Anterior) [locador_entrando_nome] (Novo Locador)

_________________________________    _________________________________
[locatario_nome] (Locatário)           IMOBILIÁRIA LEMOS (Administradora)`,
  },

  // ════════════════════════════════════════════════════════════════
  //  NOTIFICAÇÕES
  // ════════════════════════════════════════════════════════════════

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
    content: `${LEMOS_HEADER}

AVISO DE NÃO RENOVAÇÃO DE CONTRATO DE LOCAÇÃO

Franca, [data_aviso]

Ao(à) Sr(a). [locatario_nome]
Imóvel: [imovel_endereco], Franca/SP
Contrato: início em [data_inicio_contrato] — término em [data_termino]

Prezado(a) Sr(a). [locatario_nome],

Por meio desta, [locador_nome], na qualidade de locador do imóvel acima identificado, administrado pela IMOBILIÁRIA LEMOS — CRECI/SP 61053-F, vem formalmente comunicar que NÃO tem interesse na renovação do contrato de locação, cujo término está previsto para [data_termino].

O contrato permanecerá em vigor até o final do prazo ajustado. Após essa data, o imóvel deverá ser desocupado e as chaves entregues na IMOBILIÁRIA LEMOS, Rua Simão Caleiro, 2383, Franca/SP, para fins de vistoria e encerramento formal do contrato.

[motivo]

Atenciosamente,
IMOBILIÁRIA LEMOS
Noêmia Pires Lemos da Silva — CRECI/SP 61053-F`,
  },

  {
    id: 'comunicado-desocupacao',
    title: 'Comunicado de Desocupação',
    category: 'Notificações',
    description: 'Comunicado do locatário informando intenção de saída do imóvel',
    icon: '🔑',
    fields: [
      { key: 'locatario_nome', label: 'Nome do Locatário', required: true },
      { key: 'locatario_cpf', label: 'CPF do Locatário' },
      { key: 'imovel_endereco', label: 'Endereço do Imóvel', required: true },
      { key: 'imovel_bairro', label: 'Bairro do Imóvel' },
      { key: 'data_saida', label: 'Data Prevista de Saída', required: true },
      { key: 'data_comunicado', label: 'Data deste Comunicado', required: true },
      { key: 'motivo', label: 'Motivo da Saída (opcional)', multiline: true },
    ],
    content: `${LEMOS_HEADER}

COMUNICADO DE DESOCUPAÇÃO DE IMÓVEL LOCADO

Franca, [data_comunicado]

À IMOBILIÁRIA LEMOS — Setor de Desocupações
Rua Simão Caleiro, 2383 — Franca/SP

Eu, [locatario_nome], CPF [locatario_cpf], locatário do imóvel situado à [imovel_endereco], Bairro [imovel_bairro], Franca/SP, venho por meio desta comunicar que não tenho interesse em continuar a locação.

Comunico que em [data_saida] o imóvel estará desocupado de pessoas e coisas, e as chaves serão entregues na sede da Imobiliária Lemos para fins de vistoria e encerramento do contrato.

Declaro estar ciente das obrigações referentes à entrega do imóvel em perfeitas condições de higiene e conservação, conforme laudo de vistoria inicial.

Motivo: [motivo]

_________________________________
[locatario_nome]
CPF: [locatario_cpf]`,
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
    content: `${LEMOS_HEADER}

NOTIFICAÇÃO EXTRAJUDICIAL — PERTURBAÇÃO DE SOSSEGO

Franca, [data_notificacao]

[notificado_nome]
Endereço: [notificado_endereco]
Ref.: PERTURBAÇÃO DO SOSSEGO — INFRAÇÃO CONTRATUAL

Prezado(a) Senhor(a),

Para os efeitos do Art. 726 do CPC e art. 46, §2º da Lei 8.245/91, NOEMIA PIRES LEMOS DA SILVA, CRECI/SP 61053-F, na qualidade de Administradora do imóvel em que reside V. Sa., vem NOTIFICÁ-LO(A):

[descricao_ocorrencia]

Solicitamos que providencie a regularização da situação no prazo de [prazo_regularizacao], sob pena de rescisão contratual por infração legal, conforme art. 9º, II da Lei 8.245/91, e eventual ação de despejo.

Atenciosamente,
IMOBILIÁRIA LEMOS
Noêmia Pires Lemos da Silva — CRECI/SP 61053-F`,
  },

  {
    id: 'notificacao-desocupacao',
    title: 'Notificação Formal de Desocupação',
    category: 'Notificações',
    description: 'Notificação extrajudicial para desocupação do imóvel com prazo de 30 dias',
    icon: '🚨',
    fields: [
      { key: 'notificado_nome', label: 'Nome do Notificado/Locatário', required: true },
      { key: 'notificado_cpf', label: 'CPF do Notificado' },
      { key: 'notificado_endereco', label: 'Endereço do Imóvel Ocupado', required: true },
      { key: 'locador_nome', label: 'Nome do Locador', required: true },
      { key: 'motivo_notificacao', label: 'Motivo da Notificação', required: true, multiline: true, placeholder: 'Ex: Término de contrato, falta de pagamento, uso indevido...' },
      { key: 'prazo_desocupacao', label: 'Prazo para Desocupação', placeholder: 'Ex: 30 dias', required: true },
      { key: 'data_notificacao', label: 'Data desta Notificação', required: true },
      { key: 'debito_existente', label: 'Débito Existente (se houver)', placeholder: 'Ex: R$ 3.600 referente a 3 meses de aluguel em atraso' },
    ],
    content: `${LEMOS_HEADER}

NOTIFICAÇÃO EXTRAJUDICIAL PARA DESOCUPAÇÃO DE IMÓVEL

Franca, [data_notificacao]

[notificado_nome]
CPF: [notificado_cpf]
Imóvel: [notificado_endereco], Franca/SP

Prezado(a) Senhor(a),

NOEMIA PIRES LEMOS DA SILVA, CRECI/SP 61053-F, na qualidade de Administradora do imóvel acima identificado, a pedido do locador [locador_nome], vem por meio desta NOTIFICAR EXTRAJUDICIALMENTE V. Sa. a desocupar o imóvel no prazo de [prazo_desocupacao] a contar do recebimento desta notificação.

FUNDAMENTAÇÃO: [motivo_notificacao]

DÉBITO EXISTENTE: [debito_existente]

O não atendimento desta notificação no prazo estabelecido ensejará o ajuizamento de Ação de Despejo, nos termos da Lei 8.245/91, com pedido de liminar para desocupação e cobrança de todos os débitos, acrescidos de multa contratual, honorários advocatícios e demais encargos legais.

As chaves deverão ser entregues na sede da Imobiliária Lemos, Rua Simão Caleiro, 2383, Franca/SP, no prazo acima fixado.

Atenciosamente,
IMOBILIÁRIA LEMOS
Noêmia Pires Lemos da Silva — CRECI/SP 61053-F`,
  },

  // ════════════════════════════════════════════════════════════════
  //  VISTORIA
  // ════════════════════════════════════════════════════════════════

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
    content: `${LEMOS_HEADER}

TERMO DE ENTREGA DE CHAVES

Eu, [locatario_nome], CPF [locatario_cpf], venho por meio deste declarar a entrega das chaves do imóvel:

IMÓVEL: [imovel_endereco], Bairro [imovel_bairro], Franca/SP
DATA: [data_entrega]
CHAVES ENTREGUES: [num_chaves]
CONDIÇÕES DO IMÓVEL: [condicao_imovel]
PENDÊNCIAS: [pendencias]

Declaro estar ciente de que o contrato de locação somente será encerrado após vistoria final e quitação de todos os débitos pendentes (aluguéis, encargos, contas de água, energia e eventuais reparos).

Franca, [data_entrega]

_________________________________    _________________________________
[locatario_nome] (Entregante)          [recebedor_nome] — IMOBILIÁRIA LEMOS`,
  },

  {
    id: 'laudo-vistoria',
    title: 'Laudo de Vistoria do Imóvel',
    category: 'Vistoria',
    description: 'Laudo detalhado de vistoria de entrada/saída com todos os cômodos',
    icon: '📋',
    fields: [
      { key: 'tipo_vistoria', label: 'Tipo de Vistoria', placeholder: 'Entrada / Saída / Intermediária' },
      { key: 'locatario_nome', label: 'Nome do Locatário', required: true },
      { key: 'imovel_endereco', label: 'Endereço do Imóvel', required: true },
      { key: 'imovel_bairro', label: 'Bairro' },
      { key: 'data_vistoria', label: 'Data da Vistoria', required: true },
      { key: 'vistoriador_nome', label: 'Nome do Vistoriador' },
      { key: 'cond_fachada', label: 'Fachada / Área Externa', multiline: true, placeholder: 'Descreva pintura, portão, calçada...' },
      { key: 'cond_sala', label: 'Sala', multiline: true, placeholder: 'Paredes, piso, teto, tomadas, esquadrias...' },
      { key: 'cond_cozinha', label: 'Cozinha', multiline: true, placeholder: 'Paredes, piso, pia, gabinete, azulejos...' },
      { key: 'cond_quartos', label: 'Quartos', multiline: true, placeholder: 'Descreva cada quarto: paredes, piso, armários...' },
      { key: 'cond_banheiros', label: 'Banheiros', multiline: true, placeholder: 'Louças, torneiras, chuveiro, azulejos, box...' },
      { key: 'cond_area_servico', label: 'Área de Serviço / Lavanderia', multiline: true },
      { key: 'cond_garagem', label: 'Garagem / Quintal', multiline: true },
      { key: 'equipamentos', label: 'Equipamentos e Chaves Entregues', multiline: true, placeholder: 'Ex: 2 chaves, 1 controle portão, boiler, ar-cond...' },
      { key: 'observacoes_gerais', label: 'Observações Gerais', multiline: true },
      { key: 'pendencias_anotadas', label: 'Pendências / Ressalvas', multiline: true },
    ],
    content: `${LEMOS_HEADER}

LAUDO DE VISTORIA — [tipo_vistoria]

LOCATÁRIO: [locatario_nome]
IMÓVEL: [imovel_endereco], Bairro [imovel_bairro], Franca/SP
DATA: [data_vistoria]
VISTORIADOR: [vistoriador_nome] — IMOBILIÁRIA LEMOS

────────────────────────────────────────
FACHADA / ÁREA EXTERNA:
[cond_fachada]

SALA:
[cond_sala]

COZINHA:
[cond_cozinha]

QUARTOS:
[cond_quartos]

BANHEIROS:
[cond_banheiros]

ÁREA DE SERVIÇO / LAVANDERIA:
[cond_area_servico]

GARAGEM / QUINTAL:
[cond_garagem]

EQUIPAMENTOS / CHAVES ENTREGUES:
[equipamentos]

OBSERVAÇÕES GERAIS:
[observacoes_gerais]

PENDÊNCIAS / RESSALVAS:
[pendencias_anotadas]
────────────────────────────────────────

As partes declaram estar de acordo com o estado acima descrito.

Franca, [data_vistoria]

_________________________________    _________________________________
[locatario_nome] (Locatário)           [vistoriador_nome] — IMOBILIÁRIA LEMOS`,
  },

  // ════════════════════════════════════════════════════════════════
  //  CADASTRO
  // ════════════════════════════════════════════════════════════════

  {
    id: 'ficha-cadastral-pf',
    title: 'Ficha Cadastral — Pessoa Física',
    category: 'Cadastro',
    description: 'Ficha de cadastro completo de pessoa física (locatário, comprador, fiador)',
    icon: '👤',
    fields: [
      { key: 'finalidade', label: 'Finalidade do Cadastro', placeholder: 'Ex: Locatário, Fiador, Comprador' },
      { key: 'nome_completo', label: 'Nome Completo', required: true },
      { key: 'data_nascimento', label: 'Data de Nascimento', required: true },
      { key: 'naturalidade', label: 'Naturalidade (Cidade/UF)' },
      { key: 'nacionalidade', label: 'Nacionalidade', placeholder: 'Brasileira' },
      { key: 'estado_civil', label: 'Estado Civil', required: true },
      { key: 'conjuge_nome', label: 'Nome do Cônjuge (se casado)' },
      { key: 'conjuge_cpf', label: 'CPF do Cônjuge' },
      { key: 'conjuge_rg', label: 'RG do Cônjuge' },
      { key: 'cpf', label: 'CPF', required: true },
      { key: 'rg', label: 'RG', required: true },
      { key: 'rg_orgao', label: 'Órgão Emissor do RG' },
      { key: 'rg_data', label: 'Data de Emissão do RG' },
      { key: 'profissao', label: 'Profissão', required: true },
      { key: 'empresa_nome', label: 'Empresa / Empregador' },
      { key: 'empresa_cnpj', label: 'CNPJ da Empresa' },
      { key: 'empresa_endereco', label: 'Endereço da Empresa' },
      { key: 'empresa_tel', label: 'Tel. da Empresa' },
      { key: 'renda_mensal', label: 'Renda Mensal (R$)', required: true },
      { key: 'endereco_atual', label: 'Endereço Atual Completo', required: true },
      { key: 'bairro_atual', label: 'Bairro' },
      { key: 'cep_atual', label: 'CEP' },
      { key: 'tel_cel', label: 'Celular', required: true },
      { key: 'tel_fixo', label: 'Tel. Fixo' },
      { key: 'email', label: 'E-mail' },
      { key: 'imovel_proprio', label: 'Possui Imóvel Próprio?', placeholder: 'Sim / Não' },
      { key: 'imovel_proprio_endereco', label: 'Endereço do Imóvel Próprio (se houver)' },
      { key: 'referencia_pessoal1', label: 'Referência Pessoal 1 (nome e tel.)' },
      { key: 'referencia_pessoal2', label: 'Referência Pessoal 2 (nome e tel.)' },
      { key: 'data_cadastro', label: 'Data do Cadastro' },
    ],
    content: `${LEMOS_HEADER}

FICHA CADASTRAL — PESSOA FÍSICA
Finalidade: [finalidade]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DADOS PESSOAIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nome completo: [nome_completo]
Data de nascimento: [data_nascimento] | Naturalidade: [naturalidade] | Nacionalidade: [nacionalidade]
Estado civil: [estado_civil]
Cônjuge: [conjuge_nome] | CPF cônjuge: [conjuge_cpf] | RG cônjuge: [conjuge_rg]
CPF: [cpf] | RG: [rg] — [rg_orgao] — emitido em [rg_data]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DADOS PROFISSIONAIS E FINANCEIROS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Profissão: [profissao]
Empresa: [empresa_nome] | CNPJ: [empresa_cnpj]
Endereço empresa: [empresa_endereco] | Tel.: [empresa_tel]
Renda mensal: R$ [renda_mensal]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ENDEREÇO E CONTATOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Endereço atual: [endereco_atual] — Bairro [bairro_atual] — CEP [cep_atual]
Celular: [tel_cel] | Tel. fixo: [tel_fixo] | E-mail: [email]
Possui imóvel próprio: [imovel_proprio]
Endereço do imóvel próprio: [imovel_proprio_endereco]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REFERÊNCIAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ref. 1: [referencia_pessoal1]
Ref. 2: [referencia_pessoal2]

Declaro serem verdadeiras as informações prestadas, autorizando a Imobiliária Lemos a consultar meu histórico nos órgãos de proteção ao crédito (SPC/Serasa) e demais cadastros.

Franca, [data_cadastro]

_________________________________
[nome_completo] — CPF: [cpf]`,
  },

  {
    id: 'ficha-cadastral-pj',
    title: 'Ficha Cadastral — Pessoa Jurídica',
    category: 'Cadastro',
    description: 'Ficha de cadastro de empresa para locação comercial',
    icon: '🏢',
    fields: [
      { key: 'razao_social', label: 'Razão Social', required: true },
      { key: 'nome_fantasia', label: 'Nome Fantasia' },
      { key: 'cnpj', label: 'CNPJ', required: true },
      { key: 'inscricao_estadual', label: 'Inscrição Estadual' },
      { key: 'inscricao_municipal', label: 'Inscrição Municipal' },
      { key: 'atividade', label: 'Ramo de Atividade / CNAE', required: true },
      { key: 'data_fundacao', label: 'Data de Fundação' },
      { key: 'capital_social', label: 'Capital Social (R$)' },
      { key: 'endereco_sede', label: 'Endereço da Sede', required: true },
      { key: 'bairro_sede', label: 'Bairro' },
      { key: 'cep_sede', label: 'CEP' },
      { key: 'tel_empresa', label: 'Telefone da Empresa', required: true },
      { key: 'email_empresa', label: 'E-mail da Empresa' },
      { key: 'representante_nome', label: 'Nome do Representante Legal', required: true },
      { key: 'representante_cpf', label: 'CPF do Representante', required: true },
      { key: 'representante_rg', label: 'RG do Representante' },
      { key: 'representante_cargo', label: 'Cargo do Representante', placeholder: 'Ex: Sócio-Gerente, Diretor' },
      { key: 'representante_tel', label: 'Celular do Representante' },
      { key: 'faturamento_mensal', label: 'Faturamento Médio Mensal (R$)' },
      { key: 'socios', label: 'Nome e CPF dos Sócios', multiline: true },
      { key: 'referencias_comerciais', label: 'Referências Comerciais', multiline: true },
      { key: 'data_cadastro', label: 'Data do Cadastro' },
    ],
    content: `${LEMOS_HEADER}

FICHA CADASTRAL — PESSOA JURÍDICA

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DADOS DA EMPRESA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Razão Social: [razao_social]
Nome Fantasia: [nome_fantasia]
CNPJ: [cnpj] | IE: [inscricao_estadual] | IM: [inscricao_municipal]
Ramo de Atividade: [atividade]
Data de Fundação: [data_fundacao] | Capital Social: R$ [capital_social]
Faturamento Médio Mensal: R$ [faturamento_mensal]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ENDEREÇO E CONTATOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Endereço da Sede: [endereco_sede] — Bairro [bairro_sede] — CEP [cep_sede]
Tel.: [tel_empresa] | E-mail: [email_empresa]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REPRESENTANTE LEGAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nome: [representante_nome] | Cargo: [representante_cargo]
CPF: [representante_cpf] | RG: [representante_rg] | Cel.: [representante_tel]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUADRO SOCIETÁRIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[socios]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REFERÊNCIAS COMERCIAIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[referencias_comerciais]

Declaro que as informações prestadas são verdadeiras e autorizo consulta nos órgãos de proteção ao crédito e cadastros públicos.

Franca, [data_cadastro]

_________________________________
[representante_nome] — [representante_cargo]
CNPJ: [cnpj]`,
  },

  {
    id: 'ficha-captacao-imovel',
    title: 'Ficha de Captação de Imóvel',
    category: 'Cadastro',
    description: 'Formulário de captação e cadastro de imóvel para locação ou venda',
    icon: '🏗️',
    fields: [
      { key: 'finalidade_captacao', label: 'Finalidade', placeholder: 'Locação / Venda / Ambos' },
      { key: 'proprietario_nome', label: 'Nome do Proprietário', required: true },
      { key: 'proprietario_cpf', label: 'CPF do Proprietário', required: true },
      { key: 'proprietario_rg', label: 'RG do Proprietário' },
      { key: 'proprietario_estado_civil', label: 'Estado Civil' },
      { key: 'proprietario_conjuge', label: 'Nome do Cônjuge (se casado)' },
      { key: 'proprietario_tel', label: 'Telefone do Proprietário', required: true },
      { key: 'proprietario_email', label: 'E-mail' },
      { key: 'proprietario_endereco_res', label: 'Endereço Residencial do Proprietário' },
      { key: 'imovel_endereco', label: 'Endereço do Imóvel', required: true },
      { key: 'imovel_bairro', label: 'Bairro', required: true },
      { key: 'imovel_cep', label: 'CEP' },
      { key: 'imovel_tipo', label: 'Tipo do Imóvel', placeholder: 'Casa, Apto, Sala Comercial, Lote, Galpão...' },
      { key: 'imovel_area_total', label: 'Área Total (m²)' },
      { key: 'imovel_area_construida', label: 'Área Construída (m²)' },
      { key: 'imovel_quartos', label: 'Quartos' },
      { key: 'imovel_banheiros', label: 'Banheiros' },
      { key: 'imovel_vagas', label: 'Vagas de Garagem' },
      { key: 'imovel_descricao', label: 'Descrição e Características', multiline: true },
      { key: 'imovel_matricula', label: 'Matrícula' },
      { key: 'imovel_iptu', label: 'Nº do IPTU' },
      { key: 'valor_pretendido', label: 'Valor Pretendido (R$)', required: true },
      { key: 'condicoes_especiais', label: 'Condições Especiais', multiline: true },
      { key: 'corretor_captador', label: 'Corretor Captador' },
      { key: 'data_captacao', label: 'Data da Captação' },
    ],
    content: `${LEMOS_HEADER}

FICHA DE CAPTAÇÃO DE IMÓVEL
Finalidade: [finalidade_captacao]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DADOS DO PROPRIETÁRIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nome: [proprietario_nome] | CPF: [proprietario_cpf] | RG: [proprietario_rg]
Estado Civil: [proprietario_estado_civil] | Cônjuge: [proprietario_conjuge]
Tel.: [proprietario_tel] | E-mail: [proprietario_email]
Endereço residencial: [proprietario_endereco_res]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DADOS DO IMÓVEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Endereço: [imovel_endereco] — Bairro [imovel_bairro] — CEP [imovel_cep]
Tipo: [imovel_tipo]
Área total: [imovel_area_total] m² | Área construída: [imovel_area_construida] m²
Quartos: [imovel_quartos] | Banheiros: [imovel_banheiros] | Vagas: [imovel_vagas]
Matrícula: [imovel_matricula] | IPTU nº: [imovel_iptu]

Descrição / Características:
[imovel_descricao]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VALORES E CONDIÇÕES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Valor pretendido: R$ [valor_pretendido]
Condições especiais: [condicoes_especiais]

Corretor captador: [corretor_captador]
Data da captação: [data_captacao]

O proprietário autoriza a IMOBILIÁRIA LEMOS a intermediar negócios relativos ao imóvel acima descrito.

_________________________________    _________________________________
[proprietario_nome] (Proprietário)     IMOBILIÁRIA LEMOS — Corretor: [corretor_captador]`,
  },

  // ════════════════════════════════════════════════════════════════
  //  VISITAS
  // ════════════════════════════════════════════════════════════════

  {
    id: 'comprovante-visita',
    title: 'Comprovante de Realização de Visita',
    category: 'Visitas',
    description: 'Comprovante de visita ao imóvel com assinatura do visitante',
    icon: '👁️',
    fields: [
      { key: 'visitante_nome', label: 'Nome do Visitante', required: true },
      { key: 'visitante_cpf', label: 'CPF do Visitante' },
      { key: 'visitante_tel', label: 'Telefone do Visitante' },
      { key: 'imovel_endereco', label: 'Endereço do Imóvel', required: true },
      { key: 'imovel_bairro', label: 'Bairro do Imóvel' },
      { key: 'corretor_nome', label: 'Nome do Corretor', required: true },
      { key: 'data_visita', label: 'Data da Visita', required: true },
      { key: 'horario_visita', label: 'Horário da Visita' },
      { key: 'interesse', label: 'Nível de Interesse', placeholder: 'Alto / Médio / Baixo' },
      { key: 'observacoes', label: 'Observações do Corretor', multiline: true },
    ],
    content: `${LEMOS_HEADER}

COMPROVANTE DE REALIZAÇÃO DE VISITA A IMÓVEL

Eu, [visitante_nome], CPF [visitante_cpf], Tel: [visitante_tel], venho por meio desta informar que realizei visita ao imóvel:

Endereço: [imovel_endereco], Bairro [imovel_bairro], Franca/SP
Data: [data_visita] às [horario_visita]
Apresentado por: [corretor_nome] — IMOBILIÁRIA LEMOS

Declaro que a visita foi realizada com intermediação exclusiva da IMOBILIÁRIA LEMOS e que qualquer negociação futura referente a este imóvel será obrigatoriamente realizada por intermédio desta imobiliária, sob pena de comissão em dobro.

Franca, [data_visita]

_________________________________
[visitante_nome]
CPF: [visitante_cpf]`,
  },

  {
    id: 'posse-chaves-visita',
    title: 'Termo de Posse de Chaves para Visita',
    category: 'Visitas',
    description: 'Controle de retirada de chaves para visita a imóvel',
    icon: '🔑',
    fields: [
      { key: 'corretor_nome', label: 'Nome do Corretor Responsável', required: true },
      { key: 'corretor_creci', label: 'CRECI do Corretor' },
      { key: 'visitante_nome', label: 'Nome do Visitante/Cliente', required: true },
      { key: 'visitante_cpf', label: 'CPF do Visitante' },
      { key: 'visitante_tel', label: 'Telefone do Visitante' },
      { key: 'imovel_endereco', label: 'Endereço do Imóvel', required: true },
      { key: 'imovel_bairro', label: 'Bairro' },
      { key: 'num_chaves', label: 'Quantidade e Descrição das Chaves', required: true },
      { key: 'data_retirada', label: 'Data/Hora de Retirada', required: true },
      { key: 'data_devolucao_prevista', label: 'Data/Hora Prevista de Devolução', required: true },
      { key: 'data_devolucao_real', label: 'Data/Hora Real de Devolução (preencher na volta)' },
      { key: 'recebedor_devolucao', label: 'Quem recebeu a devolução' },
    ],
    content: `${LEMOS_HEADER}

TERMO DE POSSE DE CHAVES PARA VISITA

IMÓVEL: [imovel_endereco], Bairro [imovel_bairro], Franca/SP
CHAVES: [num_chaves]
CORRETOR: [corretor_nome] — CRECI [corretor_creci]
VISITANTE/CLIENTE: [visitante_nome] | CPF: [visitante_cpf] | Tel.: [visitante_tel]

RETIRADA: [data_retirada]
DEVOLUÇÃO PREVISTA: [data_devolucao_prevista]

O CORRETOR acima identificado assume total responsabilidade pela guarda e conservação das chaves durante o período de posse, comprometendo-se a devolvê-las imediatamente após a visita.

Caso as chaves não sejam devolvidas no prazo previsto, a Imobiliária Lemos acionará o responsável para arcar com todos os custos de troca de fechaduras e demais consequências.

Franca, [data_retirada]

_________________________________    _________________________________
[corretor_nome] (Corretor)             Atendente IMOBILIÁRIA LEMOS

─── DEVOLUÇÃO ───
Data/Hora: [data_devolucao_real]
Recebido por: [recebedor_devolucao] — IMOBILIÁRIA LEMOS`,
  },

  {
    id: 'retirada-chaves-vistoria',
    title: 'Retirada de Chaves para Vistoria',
    category: 'Visitas',
    description: 'Controle de retirada de chaves para vistoria técnica do imóvel',
    icon: '🔐',
    fields: [
      { key: 'vistoriador_nome', label: 'Nome do Vistoriador', required: true },
      { key: 'vistoriador_empresa', label: 'Empresa/Credencial do Vistoriador' },
      { key: 'imovel_endereco', label: 'Endereço do Imóvel', required: true },
      { key: 'imovel_bairro', label: 'Bairro' },
      { key: 'tipo_vistoria', label: 'Tipo de Vistoria', placeholder: 'Entrada / Saída / Laudo Técnico / Seguro' },
      { key: 'num_chaves', label: 'Chaves Entregues', required: true },
      { key: 'data_retirada', label: 'Data/Hora de Retirada', required: true },
      { key: 'data_devolucao_prevista', label: 'Previsão de Devolução' },
      { key: 'solicitante_nome', label: 'Solicitante da Vistoria' },
      { key: 'autorizante_nome', label: 'Quem Autorizou (Imobiliária)' },
    ],
    content: `${LEMOS_HEADER}

CONTROLE DE RETIRADA DE CHAVES — VISTORIA

IMÓVEL: [imovel_endereco], Bairro [imovel_bairro], Franca/SP
TIPO DE VISTORIA: [tipo_vistoria]
CHAVES ENTREGUES: [num_chaves]

VISTORIADOR: [vistoriador_nome] | Empresa/Credencial: [vistoriador_empresa]
SOLICITANTE: [solicitante_nome]
AUTORIZADO POR: [autorizante_nome] — IMOBILIÁRIA LEMOS

RETIRADA: [data_retirada]
DEVOLUÇÃO PREVISTA: [data_devolucao_prevista]

O vistoriador recebe as chaves em perfeitas condições e assume responsabilidade total pelo imóvel durante o período de vistoria, obrigando-se a devolver as chaves imediatamente após a conclusão dos serviços.

Franca, [data_retirada]

_________________________________    _________________________________
[vistoriador_nome] (Vistoriador)       [autorizante_nome] — IMOBILIÁRIA LEMOS`,
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
    content: `${LEMOS_HEADER}

DECLARAÇÃO DE AUTORIZAÇÃO DE VISITA / VISTORIA

A IMOBILIÁRIA LEMOS, na pessoa de [autorizante_nome], AUTORIZA [vistoriador_nome] a visitar/vistoriar:

IMÓVEL: [imovel_descricao]
FINALIDADE: [finalidade]
VALIDADE: [data_validade]

Franca, [data_declaracao]

_________________________________
IMOBILIÁRIA LEMOS
[autorizante_nome]`,
  },

  // ════════════════════════════════════════════════════════════════
  //  ADMINISTRATIVO
  // ════════════════════════════════════════════════════════════════

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
    content: `${LEMOS_HEADER}

PROTOCOLO DE ENTREGA DE DOCUMENTOS

Eu, [cliente_nome], CPF [cliente_cpf], declaro ter entregue à IMOBILIÁRIA LEMOS os seguintes documentos:

[documentos_listados]

FINALIDADE: [finalidade]

Franca, [data_protocolo]

_________________________________    _________________________________
[cliente_nome]                         [atendente] — IMOBILIÁRIA LEMOS

━━━━━━━━━━━━━━━ CANHOTO ━━━━━━━━━━━━━━━
Protocolo — [data_protocolo]
Cliente: [cliente_nome]
A IMOBILIÁRIA LEMOS confirma o recebimento dos documentos listados acima.`,
  },

  {
    id: 'termo-sabesp-cpfl',
    title: 'Termo de Responsabilidade SABESP/CPFL',
    category: 'Administrativo',
    description: 'Compromisso de transferência de titularidade de água e energia elétrica',
    icon: '⚡',
    fields: [
      { key: 'locatario_nome', label: 'Nome do Locatário', required: true },
      { key: 'locatario_cpf', label: 'CPF do Locatário', required: true },
      { key: 'imovel_endereco', label: 'Endereço do Imóvel', required: true },
      { key: 'imovel_bairro', label: 'Bairro do Imóvel' },
      { key: 'prazo_dias', label: 'Prazo em Dias Úteis', placeholder: 'Ex: 05 dias úteis' },
      { key: 'data_assinatura', label: 'Data de Assinatura' },
    ],
    content: `${LEMOS_HEADER}

TERMO DE RESPONSABILIDADE PERANTE A SABESP E A CPFL

LOCATÁRIO: [locatario_nome] | CPF: [locatario_cpf]
IMÓVEL: [imovel_endereco], Bairro [imovel_bairro], Franca/SP

Na qualidade de locatário, comprometo-me a dirigir-me junto à SABESP e à CPFL para que tanto a água quanto a energia elétrica no imóvel sejam restauradas/religadas e a titularidade transferida para meu nome.

PRAZO: [prazo_dias] a contar da assinatura do contrato de locação.

Estas providências podem ser realizadas:
- Pelo site ou aplicativo de cada concessionária
- Por telefone
- Presencialmente nos postos de atendimento

O não cumprimento desta transferência caracterizará infração contratual, podendo ensejar rescisão do contrato de locação.

Franca, [data_assinatura]

_________________________________
[locatario_nome]
CPF: [locatario_cpf]`,
  },

  {
    id: 'regulamento-interno',
    title: 'Regulamento Interno do Condomínio',
    category: 'Administrativo',
    description: 'Regulamento interno e normas de convivência para condomínios administrados',
    icon: '📜',
    fields: [
      { key: 'condominio_nome', label: 'Nome do Condomínio', required: true },
      { key: 'condominio_endereco', label: 'Endereço do Condomínio', required: true },
      { key: 'condominio_bairro', label: 'Bairro' },
      { key: 'sindico_nome', label: 'Nome do Síndico', required: true },
      { key: 'horario_silencio', label: 'Horário de Silêncio', placeholder: 'Ex: 22h00 às 07h00' },
      { key: 'horario_mudanca', label: 'Horário para Mudanças', placeholder: 'Ex: 08h00 às 17h00, seg. a sáb.' },
      { key: 'taxa_condominio', label: 'Taxa de Condomínio (R$)' },
      { key: 'dia_vencimento', label: 'Dia de Vencimento da Taxa' },
      { key: 'regras_especificas', label: 'Regras Específicas do Condomínio', multiline: true },
      { key: 'data_aprovacao', label: 'Data de Aprovação' },
    ],
    content: `${LEMOS_HEADER}

REGULAMENTO INTERNO
[condominio_nome]
[condominio_endereco] — Bairro [condominio_bairro] — Franca/SP

SÍNDICO(A): [sindico_nome]
ADMINISTRADORA: IMOBILIÁRIA LEMOS — CRECI/SP 61053-F

ART. 1º — DO OBJETIVO
O presente Regulamento Interno tem por objetivo estabelecer as normas de convivência e uso das áreas comuns do condomínio, complementando a Convenção Condominial e a legislação vigente (Lei 10.406/02 — Código Civil).

ART. 2º — DO SILÊNCIO E HORÁRIOS
O horário de silêncio é de [horario_silencio]. Neste período é proibido realizar quaisquer atividades que perturbem o sossego dos moradores.
Mudanças somente permitidas no horário: [horario_mudanca].

ART. 3º — DA TAXA CONDOMINIAL
A taxa de condomínio é de R$ [taxa_condominio], com vencimento no dia [dia_vencimento] de cada mês.
O atraso acarretará multa de 2% mais juros de 1% ao mês.

ART. 4º — DOS ANIMAIS DE ESTIMAÇÃO
Animais domésticos são permitidos desde que não perturbem o sossego, não utilizem as áreas comuns sem guia e seus dejetos sejam recolhidos pelo proprietário.

ART. 5º — DO USO DAS ÁREAS COMUNS
As áreas comuns são de uso coletivo e devem ser mantidas limpas e conservadas.
É proibido: depositar objetos nas áreas comuns, realizar festas sem prévia autorização do síndico, e utilizar as vagas de garagem de maneira irregular.

ART. 6º — DAS OBRAS E REFORMAS
Reformas nas unidades devem ser comunicadas ao síndico com 5 dias de antecedência.
Obras somente permitidas de segunda a sábado, das 08h00 às 17h00.
O condômino responde por danos causados às áreas comuns e a outras unidades.

ART. 7º — DAS INFRAÇÕES E MULTAS
O descumprimento deste Regulamento sujeita o infrator a advertência e multa conforme previsto na Convenção Condominial e no art. 1.337 do Código Civil.

ART. 8º — REGRAS ESPECÍFICAS
[regras_especificas]

Aprovado em: [data_aprovacao]

_________________________________
[sindico_nome] — Síndico(a)
IMOBILIÁRIA LEMOS — Administradora`,
  },

  {
    id: 'instrucao-emissao-boleto',
    title: 'Instrução para Emissão de Boleto',
    category: 'Financeiro',
    description: 'Instrução ao locatário sobre como obter e pagar o boleto de aluguel',
    icon: '📄',
    fields: [
      { key: 'locatario_nome', label: 'Nome do Locatário', required: true },
      { key: 'imovel_endereco', label: 'Endereço do Imóvel', required: true },
      { key: 'valor_aluguel', label: 'Valor do Aluguel (R$)', required: true },
      { key: 'dia_vencimento', label: 'Dia de Vencimento', required: true },
      { key: 'canal_boleto', label: 'Canal para Obter o Boleto', placeholder: 'Ex: WhatsApp, e-mail, portal do cliente' },
      { key: 'contato_cobranca', label: 'Contato para Dúvidas sobre Cobrança', placeholder: 'Ex: (16) 3723-0045 / WhatsApp' },
      { key: 'multa_atraso', label: 'Multa por Atraso', placeholder: 'Ex: 2% + 0,033% ao dia (juros de mora)' },
      { key: 'data_instrucao', label: 'Data deste Documento' },
    ],
    content: `${LEMOS_HEADER}

INSTRUÇÕES PARA EMISSÃO E PAGAMENTO DE BOLETO DE ALUGUEL

Prezado(a) [locatario_nome],

Bem-vindo(a) ao sistema de locação da IMOBILIÁRIA LEMOS! Seguem as instruções para pagamento do seu aluguel referente ao imóvel: [imovel_endereco].

VALOR DO ALUGUEL: R$ [valor_aluguel]
DIA DE VENCIMENTO: Todo dia [dia_vencimento] de cada mês

COMO OBTER SEU BOLETO:
[canal_boleto]

COMO PAGAR:
• Internet Banking ou aplicativo do seu banco
• Lotéricas e Correspondentes Bancários
• Agências Bancárias
• Pix (quando disponível — utilize o QR Code ou código de barras Pix do boleto)

EM CASO DE ATRASO:
Será cobrada [multa_atraso]. Por isso, pague sempre no vencimento!
Após o vencimento, o boleto pode ser pago pelo mesmo código de barras por até 60 dias. Após esse prazo, solicite segunda via.

DÚVIDAS SOBRE COBRANÇA:
[contato_cobranca]

Importante: o boleto enviado é a única forma de quitação válida. Não efetue depósitos ou transferências sem nosso boleto ou autorização expressa por escrito.

Franca, [data_instrucao]

IMOBILIÁRIA LEMOS
Tel: (16) 3723-0045`,
  },

  // ════════════════════════════════════════════════════════════════
  //  FINANCEIRO
  // ════════════════════════════════════════════════════════════════

  {
    id: 'confissao-divida',
    title: 'Confissão de Dívida',
    category: 'Financeiro',
    description: 'Instrumento de reconhecimento e confissão de dívida por aluguéis em atraso',
    icon: '📑',
    fields: [
      { key: 'devedor_nome', label: 'Nome do Devedor', required: true },
      { key: 'devedor_cpf', label: 'CPF do Devedor', required: true },
      { key: 'devedor_rg', label: 'RG do Devedor' },
      { key: 'devedor_estado_civil', label: 'Estado Civil' },
      { key: 'devedor_endereco', label: 'Endereço do Devedor' },
      { key: 'valor_divida', label: 'Valor Total da Dívida (R$)', required: true },
      { key: 'descricao_divida', label: 'Origem da Dívida', required: true, multiline: true },
      { key: 'forma_pagamento', label: 'Forma de Pagamento Acordada', required: true, multiline: true },
      { key: 'data_instrumento', label: 'Data do Instrumento', required: true },
      { key: 'testemunha1', label: 'Testemunha 1 (nome e CPF)' },
      { key: 'testemunha2', label: 'Testemunha 2 (nome e CPF)' },
    ],
    content: `${LEMOS_HEADER}

INSTRUMENTO PARTICULAR DE CONFISSÃO DE DÍVIDA

CREDOR: IMOBILIÁRIA LEMOS, representada por NOÊMIA PIRES LEMOS DA SILVA, CRECI/SP 61053-F e TOMAS CESAR LEMOS SILVA, CRECI/SP 279051, Rua Simão Caleiro, 2383, Vila França, Franca/SP.

DEVEDOR: [devedor_nome], [devedor_estado_civil], RG: [devedor_rg], CPF: [devedor_cpf], residente em [devedor_endereco].

Pelo presente instrumento, o DEVEDOR confessa e assume como líquida, certa e exigível a dívida abaixo descrita:

CLÁUSULA PRIMEIRA — RECONHECIMENTO DA DÍVIDA
O devedor reconhece, de forma irrevogável e irretratável, dívida no valor de R$ [valor_divida].
Origem: [descricao_divida]

CLÁUSULA SEGUNDA — FORMA DE PAGAMENTO
[forma_pagamento]

CLÁUSULA TERCEIRA — DA MORA
O não pagamento de qualquer parcela no prazo avençado tornará imediatamente vencido o saldo devedor total, acrescido de multa de 10%, juros de mora de 1% ao mês e correção monetária pelo IGP-M/FGV.

CLÁUSULA QUARTA — DA EXECUÇÃO
O presente instrumento constitui título executivo extrajudicial, nos termos do art. 784, III do CPC, habilitando o credor a promover sua execução independentemente de interpelação judicial.

CLÁUSULA QUINTA — DO FORO
Fica eleito o Foro da Comarca de Franca/SP, com renúncia expressa a qualquer outro.

Franca, [data_instrumento]

_________________________________    _________________________________
IMOBILIÁRIA LEMOS (Credora)            [devedor_nome] (Devedor)

Testemunhas:
1. [testemunha1]
2. [testemunha2]`,
  },

  // ════════════════════════════════════════════════════════════════
  //  RELACIONAMENTO
  // ════════════════════════════════════════════════════════════════

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
    content: `${LEMOS_HEADER}

CARTA DE AGRADECIMENTO

Franca, [data_carta]

Prezado(a) [cliente_nome],

É com grande satisfação que a IMOBILIÁRIA LEMOS agradece pela confiança depositada em nossa equipe para a realização do seu [tipo_negocio].

[mensagem_personalizada]

Sabemos que escolher um imóvel é uma das decisões mais importantes da vida, e nos sentimos honrados em ter sido parte desta conquista.

Nossa equipe está à sua disposição para qualquer suporte necessário, inclusive para futuras negociações. Fique à vontade para nos contatar a qualquer momento.

Atenciosamente,

IMOBILIÁRIA LEMOS
Noêmia Pires Lemos da Silva — CRECI/SP 61053-F
Rua Simão Caleiro, 2383 — Franca/SP
Tel: (16) 3723-0045`,
  },

  {
    id: 'folha-rosto-contrato',
    title: 'Folha de Rosto do Contrato',
    category: 'Administrativo',
    description: 'Capa/folha de rosto identificando o contrato e as partes',
    icon: '📄',
    fields: [
      { key: 'tipo_contrato', label: 'Tipo de Contrato', required: true, placeholder: 'Ex: Locação Residencial — Caução' },
      { key: 'numero_contrato', label: 'Número / Código do Contrato' },
      { key: 'locador_nome', label: 'Nome do Locador/Vendedor', required: true },
      { key: 'locatario_nome', label: 'Nome do Locatário/Comprador', required: true },
      { key: 'imovel_endereco', label: 'Endereço do Imóvel', required: true },
      { key: 'imovel_bairro', label: 'Bairro' },
      { key: 'valor_contrato', label: 'Valor Mensal/Total (R$)' },
      { key: 'data_inicio', label: 'Vigência: Início' },
      { key: 'data_fim', label: 'Vigência: Término' },
      { key: 'corretor_responsavel', label: 'Corretor Responsável' },
      { key: 'data_assinatura', label: 'Data de Assinatura' },
    ],
    content: `${LEMOS_HEADER}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FOLHA DE ROSTO — [tipo_contrato]
Nº [numero_contrato]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PARTE A (Locador/Vendedor):
[locador_nome]

PARTE B (Locatário/Comprador):
[locatario_nome]

IMÓVEL:
[imovel_endereco] — Bairro [imovel_bairro] — Franca/SP

VALOR: R$ [valor_contrato]
VIGÊNCIA: [data_inicio] a [data_fim]
CORRETOR: [corretor_responsavel]
DATA DE ASSINATURA: [data_assinatura]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMOBILIÁRIA LEMOS — CRECI/SP 61053-F
Rua Simão Caleiro, 2383 — Franca/SP — Tel: (16) 3723-0045`,
  },

]

// ── Exports ───────────────────────────────────────────────────────────────────
export const CATEGORIES = Array.from(new Set(TEMPLATES.map(t => t.category)))

export const TEMPLATE_BY_ID = Object.fromEntries(TEMPLATES.map(t => [t.id, t]))

/**
 * Gerador de documentos — motor de templates com merge-fields (porte TS do
 * scripts/doc-generator/render.mjs). Renderiza contratos/recibos/cobranças a
 * partir dos dados de um Contract + Client + Property.
 *
 * Suporta: {{campo.caminho}}, filtros {{valor|moeda}}, {{data|extenso}} e blocos
 * condicionais {{#se campo}}...{{/se}}. Saída HTML (pronta para virar PDF).
 */

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho',
  'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

function get(obj: any, dotted: string): any {
  return dotted.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj)
}

function fmtExtenso(d: any): string {
  const date = d instanceof Date ? d : new Date(d)
  if (isNaN(date.getTime())) return String(d ?? '')
  return `${date.getDate()} de ${MESES[date.getMonth()]} de ${date.getFullYear()}`
}

function applyFilter(value: any, filter: string): string {
  if (value == null || value === '') return ''
  switch (filter) {
    case 'moeda': return BRL.format(Number(value) || 0)
    case 'extenso': return fmtExtenso(value)
    case 'data': {
      const d = value instanceof Date ? value : new Date(value)
      return isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('pt-BR')
    }
    case 'maiusc': return String(value).toUpperCase()
    default: return String(value)
  }
}

export function render(template: string, data: Record<string, any>): string {
  let out = template.replace(/\{\{#se\s+([\w.]+)\}\}([\s\S]*?)\{\{\/se\}\}/g,
    (_m, key, body) => (get(data, key) ? body : ''))
  out = out.replace(/\{\{\s*([\w.]+)(?:\s*\|\s*(\w+))?\s*\}\}/g,
    (_m, key, filter) => {
      const v = get(data, key)
      return filter ? applyFilter(v, filter) : (v == null ? '' : String(v))
    })
  return out
}

/** Monta o objeto de merge-fields a partir de um contrato carregado (com relações). */
export function buildContractData(contract: any, company: any): Record<string, any> {
  const c = contract || {}
  const prop = c.property || {}
  const landlord = c.landlord || {}
  const tenant = c.tenant || {}
  const guarantor = c.guarantor || {}
  const endereco = prop.street
    ? [prop.street, prop.number].filter(Boolean).join(', ')
    : (c.propertyAddress || '')
  return {
    empresa: {
      nome: company?.name, cnpj: company?.document || company?.cnpj,
      endereco: company?.address, telefone: company?.phone,
      creci: company?.creci, cidade: company?.city || 'Franca',
    },
    locador: {
      nome: landlord.name || c.landlordName, cpfCnpj: landlord.document,
      rg: landlord.rg, endereco: landlord.address, estadoCivil: landlord.maritalStatus,
    },
    locatario: {
      nome: tenant.name || c.tenantName, cpfCnpj: tenant.document,
      rg: tenant.rg, profissao: tenant.profession, endereco: tenant.address,
    },
    fiador: { nome: guarantor.name, cpfCnpj: guarantor.document },
    imovel: {
      endereco, bairro: prop.neighborhood, cidade: prop.city,
      numeroIptu: c.iptuCode || prop.iptuCode, tipo: prop.type,
    },
    contrato: {
      inicio: c.startDate, prazoMeses: c.duration, valorAluguel: c.rentValue,
      diaVencimento: c.tenantDueDay, indiceReajuste: c.adjustmentIndex,
      multa: c.penalty, comissao: c.commission,
    },
    data: { hoje: new Date() },
  }
}

/** Templates embutidos (subconjunto). O conjunto completo vive em scripts/doc-generator. */
export const TEMPLATES: Record<string, string> = {
  cobranca: `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><style>body{font-family:'Times New Roman',serif;font-size:12pt;line-height:1.6;max-width:680px;margin:40px auto;padding:0 30px}.cab{text-align:center;border-bottom:2px solid #1B2B5B;padding-bottom:10px;margin-bottom:22px}.cab h1{font-size:15pt;color:#1B2B5B;margin:0}.assina{margin-top:48px;text-align:center}</style></head><body>
<div class="cab"><h1>{{empresa.nome|maiusc}}</h1><small>{{empresa.endereco}} · {{empresa.telefone}}</small></div>
<p style="text-align:right">{{empresa.cidade}}, {{data.hoje|extenso}}</p>
<p>Prezado(a) Sr(a). <strong>{{locatario.nome}}</strong>,</p>
<p>Constam débitos em aberto do contrato de locação do imóvel <strong>{{imovel.endereco}}</strong>.</p>
<p>A fim de evitar o envio ao Departamento Jurídico — com despesas de honorários advocatícios, custas de cartório, taxa de oficial de justiça e negativação junto ao SPC e SERASA — solicitamos providências para liquidação.</p>
<p>V.Sa. dispõe de <strong>10 (dez) dias úteis</strong> a contar do recebimento desta para pagamento ou negociação.</p>
<div class="assina"><p>Atenciosamente,</p><p>_______________________________<br>{{empresa.nome}}</p></div>
</body></html>`,

  recibo: `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><style>body{font-family:'Times New Roman',serif;font-size:12pt;line-height:1.7;max-width:680px;margin:40px auto;padding:0 30px}.cab{text-align:center;border-bottom:2px solid #1B2B5B;padding-bottom:10px;margin-bottom:22px}.cab h1{font-size:15pt;color:#1B2B5B}.valor{font-size:18pt;font-weight:bold;border:1px solid #1B2B5B;border-radius:6px;display:inline-block;padding:6px 18px;margin:8px 0}.assina{margin-top:56px;text-align:center}</style></head><body>
<div class="cab"><h1>RECIBO DE ALUGUEL</h1><small>{{empresa.nome}}</small></div>
<p class="valor">{{contrato.valorAluguel|moeda}}</p>
<p>Recebemos de <strong>{{locatario.nome}}</strong>, CPF {{locatario.cpfCnpj}}, a importância de <strong>{{contrato.valorAluguel|moeda}}</strong>, referente ao aluguel do imóvel situado em <strong>{{imovel.endereco}}</strong>.</p>
<p style="text-align:right">{{empresa.cidade}}, {{data.hoje|extenso}}.</p>
<div class="assina"><p>_______________________________<br>{{empresa.nome}}</p></div>
</body></html>`,

  'contrato-residencial': `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><style>body{font-family:'Times New Roman',serif;font-size:12pt;line-height:1.7;max-width:700px;margin:40px auto;padding:0 30px;text-align:justify}h1{font-size:15pt;text-align:center;color:#1B2B5B;margin-bottom:24px}h2{font-size:12pt;margin:16px 0 6px}.assinaturas{margin-top:56px;display:flex;justify-content:space-between;gap:40px;text-align:center}.assinaturas div{flex:1;border-top:1px solid #000;padding-top:6px;font-size:11pt}</style></head><body>
<h1>CONTRATO DE LOCAÇÃO RESIDENCIAL</h1>
<p><strong>LOCADOR(A):</strong> {{locador.nome}}, CPF/CNPJ {{locador.cpfCnpj}}.</p>
<p><strong>LOCATÁRIO(A):</strong> {{locatario.nome}}, CPF {{locatario.cpfCnpj}}.</p>
{{#se fiador.nome}}<p><strong>FIADOR(A):</strong> {{fiador.nome}}, CPF {{fiador.cpfCnpj}}.</p>{{/se}}
<p>As partes contratam a locação regida pela Lei nº 8.245/91 e pelas cláusulas seguintes:</p>
<h2>1ª — OBJETO</h2><p>Locação do imóvel situado em <strong>{{imovel.endereco}}</strong>{{#se imovel.bairro}}, {{imovel.bairro}}{{/se}}, para fins residenciais.</p>
<h2>2ª — PRAZO</h2><p>Prazo de <strong>{{contrato.prazoMeses}} meses</strong>, início em {{contrato.inicio|data}}.</p>
<h2>3ª — ALUGUEL</h2><p>Aluguel mensal de <strong>{{contrato.valorAluguel|moeda}}</strong>, pago até o dia {{contrato.diaVencimento}}.{{#se contrato.indiceReajuste}} Reajuste anual pelo {{contrato.indiceReajuste}}.{{/se}}</p>
<p style="text-align:center;margin-top:24px">{{empresa.cidade}}, {{data.hoje|extenso}}.</p>
<div class="assinaturas"><div>{{locador.nome}}<br>LOCADOR(A)</div><div>{{locatario.nome}}<br>LOCATÁRIO(A)</div>{{#se fiador.nome}}<div>{{fiador.nome}}<br>FIADOR(A)</div>{{/se}}</div>
</body></html>`,
}

export function listTemplates(): string[] {
  return Object.keys(TEMPLATES)
}

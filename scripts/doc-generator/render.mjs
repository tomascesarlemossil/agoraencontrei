/**
 * Gerador de documentos — motor de templates com merge-fields.
 *
 * Substitui {{campo.caminho}} pelos valores de um objeto de dados, suporta
 * blocos condicionais {{#se campo}}...{{/se}} e formata moeda/data PT-BR.
 * A saída é HTML pronto para virar PDF (via puppeteer/`@react-pdf` na app).
 *
 * Templates em ./templates/*.html — derivados dos 44 documentos do IMOBILI.
 *
 * Uso:
 *   import { render, renderFile } from './render.mjs'
 *   const html = render(templateString, dados)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TEMPLATES_DIR = path.join(__dirname, 'templates')

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function get(obj, dotted) {
  return dotted.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj)
}

function fmtDateExtenso(d) {
  const date = d instanceof Date ? d : new Date(d)
  if (isNaN(date)) return String(d ?? '')
  const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho',
    'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
  return `${date.getDate()} de ${meses[date.getMonth()]} de ${date.getFullYear()}`
}

/** Aplica um pipe simples: {{valor|moeda}}, {{data|extenso}} */
function applyFilter(value, filter) {
  if (value == null || value === '') return ''
  switch (filter) {
    case 'moeda': return BRL.format(Number(value) || 0)
    case 'extenso': return fmtDateExtenso(value)
    case 'data': {
      const d = value instanceof Date ? value : new Date(value)
      return isNaN(d) ? String(value) : d.toLocaleDateString('pt-BR')
    }
    case 'maiusc': return String(value).toUpperCase()
    default: return String(value)
  }
}

export function render(template, data) {
  let out = template

  // 1) blocos condicionais {{#se caminho}}...{{/se}}
  out = out.replace(/\{\{#se\s+([\w.]+)\}\}([\s\S]*?)\{\{\/se\}\}/g, (_m, key, body) => {
    const v = get(data, key)
    return v ? body : ''
  })

  // 2) merge fields {{caminho}} ou {{caminho|filtro}}
  out = out.replace(/\{\{\s*([\w.]+)(?:\s*\|\s*(\w+))?\s*\}\}/g, (_m, key, filter) => {
    const v = get(data, key)
    return filter ? applyFilter(v, filter) : (v == null ? '' : String(v))
  })

  return out
}

export function renderFile(templateName, data) {
  const file = path.join(TEMPLATES_DIR, templateName.endsWith('.html') ? templateName : `${templateName}.html`)
  return render(fs.readFileSync(file, 'utf8'), data)
}

export function listTemplates() {
  return fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.html'))
}

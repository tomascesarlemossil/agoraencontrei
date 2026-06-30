/**
 * Teste do gerador: renderiza os templates com dados de exemplo e salva HTML.
 *   node test-render.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderFile, listTemplates } from './render.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const dados = {
  empresa: { nome: 'Imobiliária Lemos', endereco: 'Rua Major Claudiano, Centro — Franca/SP',
    telefone: '(16) 3722-0000', creci: 'J-1234', cidade: 'Franca' },
  locador: { nome: 'Maria das Dores Silva', cpfCnpj: '123.456.789-00', endereco: 'Rua A, 100 — Franca/SP' },
  locatario: { nome: 'João Pereira Santos', cpfCnpj: '987.654.321-00', profissao: 'comerciante' },
  fiador: { nome: 'Antônio Carlos Souza', cpfCnpj: '111.222.333-44' },
  imovel: { endereco: 'Av. José Bonifácio, 707', bairro: 'Vila Nicácio', cidade: 'Franca/SP' },
  contrato: { prazoMeses: 30, inicio: '2026-07-01', valorAluguel: 1850.5, diaVencimento: 10,
    indiceReajuste: 'IPCA', multa: 3 },
  parcela: { competencia: '06/2026', vencimento: '2026-06-10', valor: 1850.5 },
  cobranca: { totalDevido: 1850.5 },
  recibo: { valor: 1850.5, competencia: '06/2026', vencimento: '2026-06-10' },
  rescisao: { data: '2026-07-15', multa: 1850.5, devolucao: 900 },
  vistoria: { tipo: 'Vistoria de Entrada', data: '2026-07-01', pintura: 'Bom', obsPintura: 'recém-pintado',
    piso: 'Bom', obsPiso: '', eletrica: 'Bom', obsEletrica: '', hidraulica: 'Regular',
    obsHidraulica: 'torneira da cozinha pinga', esquadrias: 'Bom', obsEsquadrias: '',
    observacoes: 'Imóvel entregue limpo e em boas condições.' },
  data: { hoje: new Date('2026-06-30') },
}

const OUT = path.join(__dirname, 'out')
fs.mkdirSync(OUT, { recursive: true })

let ok = 0
for (const t of listTemplates()) {
  const html = renderFile(t, dados)
  const dest = path.join(OUT, t)
  fs.writeFileSync(dest, html)
  // checagem básica: nenhum merge-field {{...}} pode sobrar
  const leftover = html.match(/\{\{[^}]+\}\}/g)
  const status = leftover ? `⚠️ sobrou ${leftover.length} campo(s)` : 'OK'
  console.log(`${t.padEnd(28)} → ${dest}  [${status}]`)
  if (!leftover) ok++
}
console.log(`\n${ok}/${listTemplates().length} templates renderizados sem campos pendentes.`)

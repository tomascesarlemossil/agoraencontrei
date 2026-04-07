/**
 * Script de importação de planilhas financeiras mensais → FinancialForecast
 * Uso: pnpm tsx scripts/import-financial-forecast.ts
 *
 * Colunas das planilhas (16):
 * VENC | VALOR | TAXA | PARC | DATA | M/J | INQUILINO | ENDEREÇO |
 * SEGURO | VEN/SEG | CONTROLE | PROPRIETÁRIO | DATA_REPASSE | REPASSE | BOLETO | IPTU
 */

import * as XLSX from 'xlsx'
import * as path from 'path'
import * as fs from 'fs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const COMPANY_ID = 'cmnb3pnpl0000ldqxlw26surr'

function parseDecimal(val: unknown): number {
  if (!val) return 0
  return parseFloat(String(val).replace(/[R$\s.]/g, '').replace(',', '.')) || 0
}

function parseDate(val: unknown): Date | null {
  if (!val) return null
  if (val instanceof Date) return val
  // Excel date serial number
  if (typeof val === 'number') {
    const d = new Date((val - 25569) * 86400 * 1000)
    return isNaN(d.getTime()) ? null : d
  }
  const s = String(val).trim()
  if (!s) return null
  // DD/MM/YYYY
  const parts = s.split('/')
  if (parts.length === 3) {
    const d = new Date(`${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`)
    return isNaN(d.getTime()) ? null : d
  }
  return null
}

async function importarPlanilha(filePath: string, mes: number, ano: number): Promise<number> {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Arquivo não encontrado: ${filePath}`)
    return 0
  }

  const workbook = XLSX.readFile(filePath, { type: 'file', codepage: 1252 })
  let totalImportados = 0

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][]

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] as unknown[]
      const inquilino = String(row[6] ?? '').trim()
      const valorAluguel = parseDecimal(row[1])

      // Pular linhas vazias ou sem valor
      if (!inquilino || valorAluguel <= 0) continue

      const vencimento  = parseDate(row[0])
      const taxaAdm     = parseDecimal(row[2])
      const parcela     = String(row[3] ?? '').trim()
      const proprietario = String(row[11] ?? '').trim()
      const repasse     = parseDecimal(row[13])
      const boleto      = String(row[14] ?? '').trim()
      const iptu        = parseDecimal(row[15])

      // Buscar cliente pelo primeiro nome (fuzzy)
      const primeiroNome = inquilino.split(' ')[0]
      let clienteId: string | null = null
      if (primeiroNome.length >= 3) {
        const client = await prisma.client.findFirst({
          where: {
            companyId: COMPANY_ID,
            name: { contains: primeiroNome, mode: 'insensitive' },
          },
          select: { id: true },
        })
        clienteId = client?.id ?? null
      }

      try {
        await prisma.financialForecast.upsert({
          where: {
            // Use a composite where + create/update since no unique in current schema
            id: `ff_${COMPANY_ID}_${mes}_${ano}_${i}_${sheetName}`.replace(/\s/g, '_').slice(0, 30),
          },
          create: {
            id:              `ff_${COMPANY_ID}_${mes}_${ano}_${i}_${sheetName}`.replace(/\s/g, '_').slice(0, 30),
            companyId:       COMPANY_ID,
            dueDate:         vencimento ?? new Date(ano, mes - 1, 1),
            amount:          valorAluguel,
            fee:             taxaAdm,
            tenantName:      inquilino,
            tenantId:        clienteId,
            propertyAddress: String(row[7] ?? '').trim() || undefined,
            landlordName:    proprietario || undefined,
            month:           mes,
            year:            ano,
            source:          'forecast',
            clienteNome:     inquilino,
            proprietarioNome: proprietario || undefined,
            endereco:        String(row[7] ?? '').trim() || undefined,
            valorAluguel:    valorAluguel,
            taxaAdm:         taxaAdm,
            parcela:         parcela || undefined,
            valorRepasse:    repasse,
            numeroBoleto:    boleto || undefined,
            valorIptu:       iptu,
            forecastStatus:  'PREVISTO',
          },
          update: {
            valorAluguel:    valorAluguel,
            taxaAdm:         taxaAdm,
            valorRepasse:    repasse,
            tenantId:        clienteId,
            forecastStatus:  'PREVISTO',
          },
        })
        totalImportados++
      } catch (err: any) {
        console.warn(`  ⚠️  Linha ${i} (${inquilino}): ${err.message}`)
      }
    }
  }

  return totalImportados
}

async function main() {
  const baseDir = process.argv[2] ?? path.join(process.cwd(), 'data')

  const arquivos = [
    { file: '06.25-FINANCEIRO-PREVISAO.xlsx', mes: 6,  ano: 2025 },
    { file: '07.25-FINANCEIRO-PREVISAO.xlsx', mes: 7,  ano: 2025 },
    { file: '08.25-FINANCEIRO-PREVISAO.xlsx', mes: 8,  ano: 2025 },
    { file: '09.25-FINANCEIRO-PREVISAO.xlsx', mes: 9,  ano: 2025 },
    { file: '10.25-FINANCEIRO-PREVISAO.xlsx', mes: 10, ano: 2025 },
    { file: '11.25-FINANCEIRO-PREVISAO.xlsx', mes: 11, ano: 2025 },
    { file: '12.25-FINANCEIRO-PREVISAO.xlsx', mes: 12, ano: 2025 },
    { file: '01.26-FINANCEIRO-PREVISAO.xlsx', mes: 1,  ano: 2026 },
    { file: '02.26-FINANCEIRO-PREVISAO.xlsx', mes: 2,  ano: 2026 },
    { file: '03.26-FINANCEIRO-PREVISAO.xlsx', mes: 3,  ano: 2026 },
  ]

  let totalGeral = 0
  for (const arq of arquivos) {
    const fullPath = path.join(baseDir, arq.file)
    const count = await importarPlanilha(fullPath, arq.mes, arq.ano)
    if (count > 0) {
      console.log(`✅ ${arq.file} → ${count} registros importados (${arq.mes}/${arq.ano})`)
      totalGeral += count
    }
  }

  console.log(`\n✅ Total importado: ${totalGeral} registros`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

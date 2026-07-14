import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { backfillPropertyIntelligence } from '../src/services/property-intelligence-ingestion.service.js'

const prisma = new PrismaClient()
const companyArg = process.argv.find(arg => arg.startsWith('--company='))
const batchArg = process.argv.find(arg => arg.startsWith('--batch='))
const result = await backfillPropertyIntelligence(prisma, {
  companyId: companyArg?.slice('--company='.length) || undefined,
  batchSize: batchArg ? Number(batchArg.slice('--batch='.length)) : 100,
  detectDuplicates: process.argv.includes('--duplicates'),
})
console.log(JSON.stringify(result, null, 2))
await prisma.$disconnect()

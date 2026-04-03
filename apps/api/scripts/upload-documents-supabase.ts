import 'dotenv/config'
import * as path from 'node:path'
import * as fs from 'node:fs'
import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const DRY_RUN = process.argv.includes('--dry-run')
const BUCKET = 'documents'
const prisma = new PrismaClient()
const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')
const BACKUP = process.env.BACKUP_PATH || 'Y:\\BACKUP 2025'

function mime(f: string) {
  const e = path.extname(f).toLowerCase()
  return {'.pdf':'application/pdf','.jpg':'image/jpeg','.png':'image/png','.doc':'application/msword','.xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}[e] || 'application/octet-stream'
}

async function main() {
  console.log('UPLOAD DOCUMENTOS -> Supabase Storage')
  console.log('Modo:', DRY_RUN ? 'DRY-RUN' : 'UPLOAD REAL')
  const co = await prisma.company.findFirst({where:{isActive:true}})
  if (!co) { console.log('Sem empresa'); return }
  const cid = co.id
  const clients = await prisma.client.findMany({where:{companyId:cid},select:{id:true,name:true}})
  const cmap = new Map<string,string>()
  for (const c of clients) { cmap.set(c.name.toUpperCase().trim(), c.id) }
  console.log('Clientes:', cmap.size)
  const boletosDir = path.join(BACKUP, 'FINANCEIRO 2025', 'INQUILINOS', 'BOLETOS - 2025')
  if (!fs.existsSync(boletosDir)) { console.log('Pasta boletos nao encontrada:', boletosDir); return }
  const folders = fs.readdirSync(boletosDir).filter(f => { try { return fs.statSync(path.join(boletosDir,f)).isDirectory() } catch { return false } })
  console.log('Pastas inquilinos:', folders.length)
  let up = 0, err = 0, noClient = 0
  for (const folder of folders) {
    const name = folder.replace(/^\d+\.\d+\s*-\s*/, '').toUpperCase().trim()
    let clientId: string | null = null
    for (const [n, id] of cmap) { if (n.includes(name) || name.includes(n)) { clientId = id; break } }
    if (!clientId) { for (const [n, id] of cmap) { if (n.startsWith(name.split(' ')[0])) { clientId = id; break } } }
    if (!clientId) { noClient++; continue }
    const files = fs.readdirSync(path.join(boletosDir, folder)).filter(f => { try { return !fs.statSync(path.join(boletosDir,folder,f)).isDirectory() } catch { return false } })
    for (const file of files) {
      const fp = path.join(boletosDir, folder, file)
      const sp = `boletos/2025/${folder}/${file}`
      if (DRY_RUN) { up++; continue }
      try {
        const buf = fs.readFileSync(fp)
        const { error } = await supabase.storage.from(BUCKET).upload(sp, buf, {contentType: mime(file), upsert: true})
        if (error) { err++; continue }
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(sp)
        await prisma.document.create({data:{companyId:cid,clientId,category:'BOLETO',title:`Boleto ${folder}`,fileName:file,fileUrl:data.publicUrl,storagePath:sp,fileSize:buf.length,mimeType:mime(file),year:2025,legacyPath:fp}})
        up++
      } catch { err++ }
    }
    process.stdout.write(`\r  ${up} enviados, ${err} erros, ${noClient} sem cliente`)
  }
  console.log(`\nCONCLUIDO: ${up} enviados, ${err} erros, ${noClient} sem cliente`)
  const total = await prisma.document.count({where:{companyId:cid}})
  console.log('Total documentos no banco:', total)
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect())

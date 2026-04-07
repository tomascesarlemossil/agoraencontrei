/**
 * IBGE Data Import — All 5,570 Cities
 *
 * Importa dados reais do IBGE para todas as cidades do banco de dados:
 * - População estimada (2025)
 * - Área territorial
 * - PIB per capita (último disponível)
 * - Salário médio dos trabalhadores formais
 *
 * Uso:
 *   cd apps/api
 *   npx tsx scripts/import-ibge-all-cities.ts
 *
 * Variáveis de ambiente:
 *   API_URL  — URL da API (default: http://localhost:3100)
 *   BATCH    — Cidades por lote (default: 50)
 *   DELAY_MS — Delay entre lotes em ms (default: 500)
 */

const API_URL = process.env.API_URL || 'http://localhost:3100'
const BATCH = parseInt(process.env.BATCH || '50', 10)
const DELAY_MS = parseInt(process.env.DELAY_MS || '500', 10)

const IBGE_BASE = 'https://servicodados.ibge.gov.br/api/v1'

// Indicadores IBGE
const INDICADORES = {
  POPULACAO_ESTIMADA: 29171,   // População estimada (anual)
  AREA_TERRITORIAL: 29168,     // Área da unidade territorial (km²)
  PIB_PER_CAPITA: 47001,       // PIB per capita (R$)
  SALARIO_MEDIO: 29765,        // Salário médio trabalhadores formais (SM)
}

interface CidadeDB {
  id: number
  id_ibge: number
  nome: string
  slug: string
  uf: string
}

interface IBGEResult {
  id: number
  res: {
    localidade: string
    res: Record<string, string>
  }[]
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Busca um indicador IBGE para um município específico.
 * Retorna o valor mais recente disponível.
 */
async function fetchIndicador(idIbge: number, indicador: number): Promise<number | null> {
  try {
    const url = `${IBGE_BASE}/pesquisas/indicadores/${indicador}/resultados/${idIbge}`
    const resp = await fetch(url)
    if (!resp.ok) return null
    const data: IBGEResult[] = await resp.json()
    if (!data || !data[0] || !data[0].res || !data[0].res[0]) return null
    const valores = data[0].res[0].res
    if (!valores) return null
    // Pegar o valor mais recente (último ano disponível)
    const anos = Object.keys(valores).sort((a, b) => parseInt(b) - parseInt(a))
    for (const ano of anos) {
      const val = valores[ano]
      if (val && val !== '' && val !== '-') {
        const num = parseFloat(val.replace(',', '.'))
        if (!isNaN(num)) return num
      }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Enriquece uma cidade com dados IBGE via rota da API.
 */
async function enrichCity(cidade: CidadeDB): Promise<boolean> {
  try {
    const [populacaoEstimada, areaTerritorial, pibPerCapita, salarioMedio] = await Promise.all([
      fetchIndicador(cidade.id_ibge, INDICADORES.POPULACAO_ESTIMADA),
      fetchIndicador(cidade.id_ibge, INDICADORES.AREA_TERRITORIAL),
      fetchIndicador(cidade.id_ibge, INDICADORES.PIB_PER_CAPITA),
      fetchIndicador(cidade.id_ibge, INDICADORES.SALARIO_MEDIO),
    ])

    // Chamar a rota de atualização da API
    const payload = {
      cidade_id: cidade.id,
      populacao_estimada: populacaoEstimada,
      area_territorial: areaTerritorial,
      pib_per_capita: pibPerCapita,
      salario_medio_sm: salarioMedio,
    }

    const resp = await fetch(`${API_URL}/api/v1/seo/cities/${cidade.id}/ibge`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    return resp.ok
  } catch {
    return false
  }
}

async function getCidades(): Promise<CidadeDB[]> {
  const resp = await fetch(`${API_URL}/api/v1/seo/cities?limit=10000`)
  if (!resp.ok) throw new Error(`Falha ao buscar cidades: ${resp.status}`)
  const data = await resp.json()
  return data.cidades || data
}

async function main() {
  console.log('═══════════════════════════════════════════════════')
  console.log('  AgoraEncontrei — IBGE Data Import (All Cities)')
  console.log('═══════════════════════════════════════════════════')
  console.log(`  API:        ${API_URL}`)
  console.log(`  Batch size: ${BATCH}`)
  console.log(`  Delay:      ${DELAY_MS}ms`)
  console.log('')

  // Verificar saúde da API
  try {
    const health = await fetch(`${API_URL}/health`)
    if (!health.ok) throw new Error('API não está saudável')
    console.log('✅ API está rodando')
  } catch (e: any) {
    console.error(`❌ API não acessível: ${e.message}`)
    console.error(`   Certifique-se que a API está rodando em ${API_URL}`)
    process.exit(1)
  }

  // Buscar todas as cidades
  console.log('\n📋 Buscando cidades do banco de dados...')
  const cidades = await getCidades()
  console.log(`   Total: ${cidades.length} cidades`)

  // Filtrar cidades sem dados IBGE (populacao_estimada = null)
  const cidadesSemDados = cidades.filter((c: any) => !c.populacao_estimada && !c.populacao)
  console.log(`   Sem dados IBGE: ${cidadesSemDados.length} cidades`)

  if (cidadesSemDados.length === 0) {
    console.log('\n✅ Todas as cidades já têm dados IBGE!')
    return
  }

  let success = 0
  let errors = 0
  const startTime = Date.now()

  // Processar em lotes
  for (let i = 0; i < cidadesSemDados.length; i += BATCH) {
    const lote = cidadesSemDados.slice(i, i + BATCH)
    const progress = Math.round((i / cidadesSemDados.length) * 100)
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0)
    const eta = i > 0 ? Math.round(((Date.now() - startTime) / i) * (cidadesSemDados.length - i) / 1000) : '?'
    
    console.log(`\n[${progress}%] Lote ${Math.floor(i / BATCH) + 1} | ${i}/${cidadesSemDados.length} | ⏱ ${elapsed}s | ETA: ${eta}s`)

    await Promise.all(
      lote.map(async (cidade: CidadeDB) => {
        const ok = await enrichCity(cidade)
        if (ok) {
          success++
          process.stdout.write('.')
        } else {
          errors++
          process.stdout.write('x')
        }
      })
    )

    if (i + BATCH < cidadesSemDados.length) {
      await sleep(DELAY_MS)
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log('\n\n═══════════════════════════════════════════════════')
  console.log(`  ✅ Concluído em ${totalTime}s`)
  console.log(`  📊 Sucesso: ${success} | Erros: ${errors}`)
  console.log('═══════════════════════════════════════════════════')
}

main().catch(console.error)

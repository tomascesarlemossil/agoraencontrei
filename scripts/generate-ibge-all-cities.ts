/**
 * Script para gerar data layer com TODAS as 5.570 cidades do IBGE
 * Execução: npx tsx scripts/generate-ibge-all-cities.ts
 *
 * Busca dados da API IBGE Servicodados e gera:
 * - apps/web/src/data/seo-ibge-all-cities.ts (5.570 cidades)
 * - Sitemaps por estado
 */

const IBGE_API = 'https://servicodados.ibge.gov.br/api/v1'

interface IBGEMunicipio {
  id: number
  nome: string
  microrregiao: {
    mesorregiao: {
      UF: {
        id: number
        sigla: string
        nome: string
        regiao: { sigla: string; nome: string }
      }
    }
  }
}

interface CityEntry {
  slug: string
  name: string
  state: string
  stateSlug: string
  stateName: string
  ibgeId: number
  region: string
}

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function getRegion(uf: string, pop?: number): string {
  const capitals: Record<string, boolean> = {
    SP: true, RJ: true, MG: true, BA: true, PR: true, RS: true, PE: true,
    CE: true, PA: true, MA: true, SC: true, GO: true, PB: true, AM: true,
    ES: true, RN: true, AL: true, PI: true, MT: true, DF: true, MS: true,
    SE: true, RO: true, TO: true, AC: true, AP: true, RR: true,
  }
  if (!capitals[uf]) return `interior-${uf.toLowerCase()}`
  return `interior-${uf.toLowerCase()}`
}

async function fetchAllMunicipios(): Promise<IBGEMunicipio[]> {
  console.log('Buscando todos os municípios do IBGE...')
  const res = await fetch(`${IBGE_API}/localidades/municipios?orderBy=nome`)
  if (!res.ok) throw new Error(`IBGE API error: ${res.status}`)
  const data: IBGEMunicipio[] = await res.json()
  console.log(`${data.length} municípios encontrados`)
  return data
}

async function main() {
  const municipios = await fetchAllMunicipios()

  // Agrupar por estado
  const byState: Record<string, CityEntry[]> = {}
  const allCities: CityEntry[] = []

  for (const m of municipios) {
    const uf = m.microrregiao?.mesorregiao?.UF
    if (!uf) continue // Skip municipalities without region data
    const entry: CityEntry = {
      slug: slugify(m.nome),
      name: m.nome,
      state: uf.sigla,
      stateSlug: uf.sigla.toLowerCase(),
      stateName: uf.nome,
      ibgeId: m.id,
      region: getRegion(uf.sigla),
    }

    allCities.push(entry)
    if (!byState[uf.sigla]) byState[uf.sigla] = []
    byState[uf.sigla].push(entry)
  }

  // Gerar arquivo TypeScript
  const states = Object.keys(byState).sort()

  let output = `/**
 * Data layer: TODAS as ${allCities.length} cidades do IBGE
 * Gerado automaticamente via API IBGE Servicodados
 * ${new Date().toISOString().split('T')[0]}
 *
 * Para regenerar: npx tsx scripts/generate-ibge-all-cities.ts
 */

export interface IBGECityBasic {
  slug: string
  name: string
  state: string
  stateSlug: string
  stateName: string
  ibgeId: number
  region: string
}

`

  // Gerar constantes por estado
  for (const state of states) {
    const cities = byState[state]
    output += `// ── ${state} (${cities.length} cidades) ──\n`
    output += `const CIDADES_${state}: IBGECityBasic[] = [\n`
    for (const c of cities) {
      // Escapar aspas simples no nome
      const name = c.name.replace(/'/g, "\\'")
      output += `  { slug: '${c.slug}', name: '${name}', state: '${c.state}', stateSlug: '${c.stateSlug}', stateName: '${c.stateName}', ibgeId: ${c.ibgeId}, region: '${c.region}' },\n`
    }
    output += `]\n\n`
  }

  // Array consolidado
  output += `// ── Array consolidado: ${allCities.length} cidades ──\n`
  output += `export const IBGE_ALL_CITIES: IBGECityBasic[] = [\n`
  for (const state of states) {
    output += `  ...CIDADES_${state},\n`
  }
  output += `]\n\n`

  // Índice por slug
  output += `// ── Índice por slug (O(1) lookup) ──\n`
  output += `export const IBGE_ALL_BY_SLUG: Record<string, IBGECityBasic> = Object.fromEntries(\n`
  output += `  IBGE_ALL_CITIES.map(c => [c.slug, c])\n`
  output += `)\n\n`

  // Índice por estado
  output += `// ── Índice por estado ──\n`
  output += `export const IBGE_ALL_BY_STATE: Record<string, IBGECityBasic[]> = IBGE_ALL_CITIES.reduce(\n`
  output += `  (acc, c) => { (acc[c.state] = acc[c.state] || []).push(c); return acc },\n`
  output += `  {} as Record<string, IBGECityBasic[]>\n`
  output += `)\n\n`

  // Estatísticas
  output += `// ── Estatísticas ──\n`
  output += `// Total: ${allCities.length} cidades | ${states.length} estados\n`
  for (const state of states) {
    output += `// ${state}: ${byState[state].length} cidades\n`
  }

  // Escrever arquivo
  const fs = await import('fs')
  const path = 'apps/web/src/data/seo-ibge-all-cities.ts'
  fs.writeFileSync(path, output, 'utf-8')
  console.log(`\n✅ Gerado: ${path}`)
  console.log(`   ${allCities.length} cidades | ${states.length} estados`)
  console.log(`   Tamanho: ${(output.length / 1024).toFixed(0)} KB`)

  // Gerar resumo por estado
  console.log('\nResumo por estado:')
  for (const state of states) {
    console.log(`  ${state}: ${byState[state].length} cidades`)
  }
}

main().catch(console.error)

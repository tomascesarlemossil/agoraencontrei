#!/usr/bin/env node
/**
 * Guarda de boot (build-time): importa TODOS os módulos de rota compilados para
 * garantir que o grafo de módulos ESM linka sem erro ANTES de subir em produção.
 *
 * Motivação: em 01/07 a API entrou em crash-loop (502) porque um export foi
 * removido de routes/public/index.ts enquanto routes/users e routes/system-config
 * ainda o importavam. Em ESM isso é um SyntaxError no carregamento do módulo — o
 * processo morre no boot, antes do listen. Como no Fastify o registro de rotas é
 * lazy, um try/catch em runtime NÃO pega esse erro de import.
 *
 * Rodando esta verificação como passo de build (Dockerfile/nixpacks), um import
 * quebrado FALHA o build → o Railway mantém o último deploy saudável em vez de
 * subir uma versão que não liga. Zero efeito em runtime.
 *
 * Importa apenas os plugins de rota (funções, sem efeito colateral no import),
 * o que já linka transitivamente os services/utils que eles usam.
 */
import { readdirSync, statSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url)) // apps/api/scripts
const routesDir = join(here, '..', 'dist', 'routes')

if (!existsSync(routesDir)) {
  console.error(`[verify-route-imports] dist não encontrado em ${routesDir} — rode o build antes.`)
  process.exit(1)
}

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else if (entry.endsWith('.js')) out.push(full)
  }
  return out
}

const files = walk(routesDir)
let failed = 0

for (const file of files) {
  try {
    await import(pathToFileURL(file).href)
  } catch (err) {
    failed++
    console.error(`✗ ${file.slice(file.indexOf('dist/'))}`)
    console.error(`    ${err?.message || err}`)
  }
}

if (failed > 0) {
  console.error(`\n[verify-route-imports] ${failed} módulo(s) de rota com import quebrado — build abortado.`)
  process.exit(1)
}

console.log(`[verify-route-imports] ✓ ${files.length} módulos de rota linkam sem erro`)

/**
 * Import Service — CSV/Excel Importer with AI Column Mapping
 *
 * Features:
 * - Parses CSV headers and sample data
 * - Uses Claude AI to intelligently map columns to property schema
 * - Validates and transforms data before import
 * - Batch creates properties with tenant/company isolation
 * - Cloudinary image processing with tenant-specific logos
 */

import type { PrismaClient } from '@prisma/client'
import { env } from '../utils/env.js'

// ── Types ───────────────────────────────────────────────────────────────────

export interface ColumnMapping {
  csvColumn: string
  targetField: string
  transform?: string
  confidence: number
}

export interface ImportPreview {
  totalRows: number
  sampleRows: Array<Record<string, string>>
  headers: string[]
  suggestedMappings: ColumnMapping[]
}

export interface ImportResult {
  totalProcessed: number
  created: number
  updated: number
  skipped: number
  errors: Array<{ row: number; error: string }>
}

// ── Constants ───────────────────────────────────────────────────────────────

const ANTHROPIC_API_KEY = (env as any).ANTHROPIC_API_KEY || ''

// Property fields that can be mapped
const PROPERTY_FIELDS = [
  'title', 'description', 'type', 'purpose', 'status',
  'price', 'priceRent', 'condoFee', 'iptuValue',
  'street', 'number', 'complement', 'neighborhood', 'city', 'state', 'zipCode',
  'bedrooms', 'bathrooms', 'suites', 'parkingSpaces',
  'totalArea', 'builtArea', 'landArea',
  'yearBuilt', 'floor',
  'slug', 'externalId',
]

// ── Core Functions ──────────────────────────────────────────────────────────

/**
 * Parses CSV content and returns a preview with AI-suggested mappings.
 */
export async function previewImport(
  csvContent: string,
): Promise<ImportPreview> {
  const lines = csvContent.split('\n').filter((l: string) => l.trim())
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header row and one data row')
  }

  const headers = parseCSVLine(lines[0])
  const sampleRows: Array<Record<string, string>> = []

  for (let i = 1; i < Math.min(lines.length, 6); i++) {
    const values = parseCSVLine(lines[i])
    const row: Record<string, string> = {}
    headers.forEach((h: string, idx: number) => {
      row[h] = values[idx] || ''
    })
    sampleRows.push(row)
  }

  // AI-powered column mapping
  let suggestedMappings: ColumnMapping[] = []
  if (ANTHROPIC_API_KEY) {
    suggestedMappings = await aiColumnMapping(headers, sampleRows)
  } else {
    suggestedMappings = fallbackColumnMapping(headers)
  }

  return {
    totalRows: lines.length - 1,
    sampleRows,
    headers,
    suggestedMappings,
  }
}

/**
 * Executes the import with confirmed column mappings.
 */
export async function executeImport(
  prisma: PrismaClient,
  csvContent: string,
  mappings: ColumnMapping[],
  companyId: string,
): Promise<ImportResult> {
  const lines = csvContent.split('\n').filter((l: string) => l.trim())
  const headers = parseCSVLine(lines[0])

  const result: ImportResult = {
    totalProcessed: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  }

  // Process rows in batches
  for (let i = 1; i < lines.length; i++) {
    result.totalProcessed++

    try {
      const values = parseCSVLine(lines[i])
      const rowData: Record<string, string> = {}
      headers.forEach((h: string, idx: number) => {
        rowData[h] = values[idx] || ''
      })

      // Apply mappings to create property data
      const propertyData = applyMappings(rowData, mappings)

      if (!propertyData.title && !propertyData.externalId) {
        result.skipped++
        continue
      }

      // Generate slug if not present
      if (!propertyData.slug) {
        const slugBase = (propertyData.title || `imovel-${i}`)
          .toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
        propertyData.slug = `${slugBase}-${Date.now().toString(36)}`
      }

      // Check for existing by externalId
      if (propertyData.externalId) {
        const existing = await prisma.property.findFirst({
          where: { externalId: propertyData.externalId, companyId },
        })

        if (existing) {
          await prisma.property.update({
            where: { id: existing.id },
            data: {
              ...propertyData,
              slug: undefined, // Don't update slug
              companyId,
            } as any,
          })
          result.updated++
          continue
        }
      }

      // Create new property
      await prisma.property.create({
        data: {
          ...propertyData,
          companyId,
          status: 'ACTIVE',
          isActive: true,
        } as any,
      })
      result.created++
    } catch (error: any) {
      result.errors.push({ row: i, error: error.message })
    }
  }

  return result
}

/**
 * Processes images with Cloudinary transformations.
 * Adds watermark with tenant logo.
 */
export function buildCloudinaryUrl(
  imageUrl: string,
  options?: {
    width?: number
    height?: number
    logoUrl?: string
    quality?: string
  },
): string {
  const width = options?.width || 1200
  const quality = options?.quality || 'auto'

  // Base Cloudinary transformation
  let transformation = `f_auto,q_${quality},w_${width},c_limit`

  // Add logo overlay if provided
  if (options?.logoUrl) {
    // Extract Cloudinary public ID from URL for overlay
    const logoMatch = options.logoUrl.match(/upload\/(?:.*\/)?(.+?)(?:\.\w+)?$/)
    if (logoMatch) {
      const logoId = logoMatch[1].replace(/\//g, ':')
      transformation += `/l_${logoId},w_150,o_70,g_south_east,x_20,y_20`
    }
  }

  // Validate that imageUrl is a genuine Cloudinary URL using URL parsing
  try {
    const parsed = new URL(imageUrl)
    if (parsed.hostname === 'res.cloudinary.com' && parsed.protocol === 'https:') {
      return imageUrl.replace('/upload/', `/upload/${transformation}/`)
    }
  } catch {
    // Invalid URL — fall through to Cloudinary fetch
  }

  // For external images, use Cloudinary fetch with sanitized URL
  const cloudName = (env as any).CLOUDINARY_CLOUD_NAME || 'drrfzmwu8'
  // Only allow http/https schemes to prevent SSRF via other protocols
  let sanitizedUrl: string
  try {
    const parsed = new URL(imageUrl)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new Error('Invalid protocol')
    }
    sanitizedUrl = parsed.href
  } catch {
    // If URL parsing fails, return original URL unchanged
    return imageUrl
  }
  return `https://res.cloudinary.com/${cloudName}/image/fetch/${transformation}/${encodeURIComponent(sanitizedUrl)}`
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes
    } else if ((char === ',' || char === ';') && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

function applyMappings(
  row: Record<string, string>,
  mappings: ColumnMapping[],
): Record<string, any> {
  const result: Record<string, any> = {}

  for (const mapping of mappings) {
    const value = row[mapping.csvColumn]
    if (!value || value.trim() === '') continue

    const targetField = mapping.targetField
    const transformed = transformValue(value, targetField, mapping.transform)

    if (transformed !== undefined) {
      result[targetField] = transformed
    }
  }

  return result
}

function transformValue(value: string, field: string, transform?: string): any {
  if (transform === 'skip' || !value.trim()) return undefined

  // Number fields
  const numberFields = [
    'price', 'priceRent', 'condoFee', 'iptuValue',
    'totalArea', 'builtArea', 'landArea',
  ]
  if (numberFields.includes(field)) {
    const num = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'))
    return isNaN(num) ? undefined : num
  }

  // Integer fields
  const intFields = ['bedrooms', 'bathrooms', 'suites', 'parkingSpaces', 'yearBuilt', 'floor']
  if (intFields.includes(field)) {
    const num = parseInt(value.replace(/\D/g, ''))
    return isNaN(num) ? undefined : num
  }

  // Type/purpose mapping
  if (field === 'type') {
    return mapPropertyType(value)
  }
  if (field === 'purpose') {
    return mapPropertyPurpose(value)
  }

  return value.trim()
}

function mapPropertyType(value: string): string {
  const v = value.toUpperCase().trim()
  const map: Record<string, string> = {
    'CASA': 'HOUSE', 'HOUSE': 'HOUSE',
    'APARTAMENTO': 'APARTMENT', 'APARTMENT': 'APARTMENT', 'APTO': 'APARTMENT', 'APT': 'APARTMENT',
    'TERRENO': 'LAND', 'LAND': 'LAND', 'LOTE': 'LAND',
    'COMERCIAL': 'STORE', 'LOJA': 'STORE', 'STORE': 'STORE',
    'SALA': 'OFFICE', 'OFFICE': 'OFFICE',
    'GALPÃO': 'WAREHOUSE', 'GALPAO': 'WAREHOUSE', 'WAREHOUSE': 'WAREHOUSE',
    'KITNET': 'KITNET', 'STUDIO': 'STUDIO',
    'FAZENDA': 'FARM', 'FARM': 'FARM',
    'SÍTIO': 'RANCH', 'SITIO': 'RANCH', 'RANCH': 'RANCH', 'CHÁCARA': 'RANCH', 'CHACARA': 'RANCH',
  }
  return map[v] || 'HOUSE'
}

function mapPropertyPurpose(value: string): string {
  const v = value.toUpperCase().trim()
  if (v.includes('ALUG') || v.includes('RENT')) return 'RENT'
  if (v.includes('VEND') || v.includes('SALE') || v.includes('COMPRA')) return 'SALE'
  if (v.includes('AMBOS') || v.includes('BOTH')) return 'BOTH'
  if (v.includes('TEMPORADA') || v.includes('SEASON')) return 'SEASON'
  return 'SALE'
}

/**
 * AI-powered column mapping using Claude.
 */
async function aiColumnMapping(
  headers: string[],
  sampleRows: Array<Record<string, string>>,
): Promise<ColumnMapping[]> {
  const prompt = `Analise os headers de um CSV de imóveis e mapeie para os campos do sistema.

HEADERS DO CSV:
${JSON.stringify(headers)}

AMOSTRAS DE DADOS (primeiras 3 linhas):
${JSON.stringify(sampleRows.slice(0, 3), null, 2)}

CAMPOS DISPONÍVEIS NO SISTEMA:
${JSON.stringify(PROPERTY_FIELDS)}

Para cada header do CSV, sugira o campo mais adequado do sistema.
Responda EXCLUSIVAMENTE em JSON (sem markdown):
[
  {"csvColumn": "header1", "targetField": "campo_do_sistema", "confidence": 0.95},
  ...
]

Se um header não tem correspondência, use targetField: "skip".
O campo "confidence" deve ser de 0 a 1.`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) return fallbackColumnMapping(headers)

    const data = await res.json()
    const text = data.content?.[0]?.text || ''
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return fallbackColumnMapping(headers)

    return JSON.parse(jsonMatch[0])
  } catch {
    return fallbackColumnMapping(headers)
  }
}

/**
 * Fallback keyword-based column mapping when AI is unavailable.
 */
function fallbackColumnMapping(headers: string[]): ColumnMapping[] {
  const keywordMap: Record<string, string> = {
    titulo: 'title', title: 'title', nome: 'title',
    descricao: 'description', description: 'description',
    tipo: 'type', type: 'type', categoria: 'type',
    finalidade: 'purpose', purpose: 'purpose',
    preco: 'price', price: 'price', valor: 'price', 'valor_venda': 'price',
    aluguel: 'priceRent', rent: 'priceRent', 'valor_aluguel': 'priceRent',
    condominio: 'condoFee', condo: 'condoFee',
    iptu: 'iptuValue',
    rua: 'street', street: 'street', endereco: 'street', logradouro: 'street',
    numero: 'number', number: 'number', num: 'number',
    complemento: 'complement', complement: 'complement',
    bairro: 'neighborhood', neighborhood: 'neighborhood',
    cidade: 'city', city: 'city', municipio: 'city',
    estado: 'state', state: 'state', uf: 'state',
    cep: 'zipCode', zipcode: 'zipCode', 'zip_code': 'zipCode',
    quartos: 'bedrooms', bedrooms: 'bedrooms', dormitorios: 'bedrooms',
    banheiros: 'bathrooms', bathrooms: 'bathrooms',
    suites: 'suites', suite: 'suites',
    vagas: 'parkingSpaces', garagem: 'parkingSpaces', parking: 'parkingSpaces',
    'area_total': 'totalArea', area: 'totalArea', 'total_area': 'totalArea', metragem: 'totalArea',
    'area_construida': 'builtArea', 'built_area': 'builtArea',
    'area_terreno': 'landArea', 'land_area': 'landArea',
    'ano_construcao': 'yearBuilt', year: 'yearBuilt',
    andar: 'floor', floor: 'floor',
    codigo: 'externalId', code: 'externalId', referencia: 'externalId', ref: 'externalId',
  }

  return headers.map((h: string) => {
    const normalized = h.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')

    const match = keywordMap[normalized]
    return {
      csvColumn: h,
      targetField: match || 'skip',
      confidence: match ? 0.8 : 0.1,
    }
  })
}

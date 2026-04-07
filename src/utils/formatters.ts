import type { PropertyType, PropertyPurpose, PropertyStatus } from '@/types'

// ============================================================
// CURRENCY
// ============================================================

/**
 * Formats a numeric value as Brazilian Real currency.
 * @example formatCurrency(450000) → "R$ 450.000"
 * @example formatCurrency(1250000) → "R$ 1.250.000"
 * @example formatCurrency(1500.5) → "R$ 1.500,50"
 */
export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return 'R$ —'

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value)
}

/**
 * Formats a value as compact Brazilian Real (e.g. "R$ 1,2M" or "R$ 450k").
 * Useful for cards and chips where space is limited.
 */
export function formatCurrencyCompact(value: number): string {
  if (!Number.isFinite(value)) return 'R$ —'

  if (value >= 1_000_000) {
    const m = value / 1_000_000
    return `R$ ${m % 1 === 0 ? m : m.toFixed(1)}M`
  }

  if (value >= 1_000) {
    const k = value / 1_000
    return `R$ ${k % 1 === 0 ? k : k.toFixed(0)}k`
  }

  return formatCurrency(value)
}

// ============================================================
// AREA
// ============================================================

/**
 * Formats an area value in square meters.
 * @example formatArea(125) → "125 m²"
 */
export function formatArea(area: number | null | undefined): string {
  if (area == null || !Number.isFinite(area)) return '—'
  return `${new Intl.NumberFormat('pt-BR').format(area)} m²`
}

// ============================================================
// PHONE
// ============================================================

/**
 * Formats a Brazilian phone number string.
 * Handles both landline (10 digits) and mobile (11 digits) numbers.
 * @example formatPhone('16372300045') → "(16) 3723-0045"
 * @example formatPhone('16981010004') → "(16) 98101-0004"
 * @example formatPhone('(16) 3723-0045') → "(16) 3723-0045" (already formatted)
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '—'

  // Strip all non-digits
  const digits = phone.replace(/\D/g, '')

  // Already formatted or invalid — return as is
  if (digits.length < 10 || digits.length > 11) return phone

  const ddd = digits.slice(0, 2)
  const number = digits.slice(2)

  if (number.length === 9) {
    // Mobile: 9 digits → (16) 98101-0004
    return `(${ddd}) ${number.slice(0, 5)}-${number.slice(5)}`
  }

  // Landline: 8 digits → (16) 3723-0045
  return `(${ddd}) ${number.slice(0, 4)}-${number.slice(4)}`
}

// ============================================================
// DATE
// ============================================================

/**
 * Formats an ISO date string to long Brazilian format.
 * @example formatDate('2024-03-15') → "15 de março de 2024"
 */
export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'

  try {
    // Append time to avoid timezone offset issues with date-only strings
    const normalized = date.includes('T') ? date : `${date}T12:00:00`
    return new Intl.DateTimeFormat('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(normalized))
  } catch {
    return date
  }
}

/**
 * Formats an ISO date string to short Brazilian format.
 * @example formatDateShort('2024-03-15') → "15/03/2024"
 */
export function formatDateShort(date: string | null | undefined): string {
  if (!date) return '—'

  try {
    const normalized = date.includes('T') ? date : `${date}T12:00:00`
    return new Intl.DateTimeFormat('pt-BR').format(new Date(normalized))
  } catch {
    return date
  }
}

/**
 * Returns a relative time string in Portuguese.
 * @example formatRelativeDate('2024-03-13T10:00:00Z') → "2 dias atrás"
 */
export function formatRelativeDate(date: string | null | undefined): string {
  if (!date) return '—'

  try {
    const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })
    const diffMs = new Date(date).getTime() - Date.now()
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

    if (Math.abs(diffDays) < 1) {
      const diffHours = Math.round(diffMs / (1000 * 60 * 60))
      if (Math.abs(diffHours) < 1) {
        const diffMins = Math.round(diffMs / (1000 * 60))
        return rtf.format(diffMins, 'minute')
      }
      return rtf.format(diffHours, 'hour')
    }

    if (Math.abs(diffDays) < 30) return rtf.format(diffDays, 'day')
    if (Math.abs(diffDays) < 365) return rtf.format(Math.round(diffDays / 30), 'month')
    return rtf.format(Math.round(diffDays / 365), 'year')
  } catch {
    return date
  }
}

// ============================================================
// PROPERTY LABELS
// ============================================================

const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  house: 'Casa',
  apartment: 'Apartamento',
  commercial_room: 'Sala Comercial',
  commercial_building: 'Prédio Comercial',
  land: 'Terreno',
  rural: 'Área Rural',
  garage: 'Garagem',
  warehouse: 'Galpão',
  studio: 'Studio',
  penthouse: 'Cobertura',
  townhouse: 'Sobrado',
  farm: 'Chácara / Sítio',
  other: 'Outro',
}

/**
 * Returns the Portuguese label for a property type.
 * @example getPropertyTypeLabel('house') → "Casa"
 */
export function getPropertyTypeLabel(tipo: PropertyType | string): string {
  return PROPERTY_TYPE_LABELS[tipo as PropertyType] ?? tipo
}

const PURPOSE_LABELS: Record<PropertyPurpose, string> = {
  sale: 'Venda',
  rent: 'Locação',
  sale_rent: 'Venda / Locação',
  season_rent: 'Temporada',
}

/**
 * Returns the Portuguese label for a property purpose.
 * @example getPurposeLabel('sale') → "Venda"
 */
export function getPurposeLabel(finalidade: PropertyPurpose | string): string {
  return PURPOSE_LABELS[finalidade as PropertyPurpose] ?? finalidade
}

// ============================================================
// STATUS COLORS
// ============================================================

const STATUS_COLORS: Record<PropertyStatus, string> = {
  available: 'text-emerald-400 bg-emerald-400/10',
  under_negotiation: 'text-amber-400 bg-amber-400/10',
  sold: 'text-blue-400 bg-blue-400/10',
  rented: 'text-violet-400 bg-violet-400/10',
  inactive: 'text-slate-400 bg-slate-400/10',
  pending_approval: 'text-orange-400 bg-orange-400/10',
  expired: 'text-red-400 bg-red-400/10',
}

/**
 * Returns a Tailwind CSS class string for a property status badge.
 * @example getStatusColor('available') → "text-emerald-400 bg-emerald-400/10"
 */
export function getStatusColor(status: PropertyStatus | string): string {
  return STATUS_COLORS[status as PropertyStatus] ?? 'text-slate-400 bg-slate-400/10'
}

const STATUS_LABELS: Record<PropertyStatus, string> = {
  available: 'Disponível',
  under_negotiation: 'Em Negociação',
  sold: 'Vendido',
  rented: 'Alugado',
  inactive: 'Inativo',
  pending_approval: 'Aguardando Aprovação',
  expired: 'Expirado',
}

/**
 * Returns the Portuguese label for a property status.
 */
export function getStatusLabel(status: PropertyStatus | string): string {
  return STATUS_LABELS[status as PropertyStatus] ?? status
}

// ============================================================
// SLUG
// ============================================================

/**
 * Generates a URL-safe slug from a property's title, city, and neighborhood.
 * @example
 * generatePropertySlug({ title: 'Casa 3 Quartos', city: 'Franca', neighborhood: 'Centro' })
 * // → "casa-3-quartos-centro-franca"
 */
export function generatePropertySlug(property: {
  title?: string | null
  city?: string | null
  neighborhood?: string | null
  code?: string | null
}): string {
  const parts = [property.title, property.neighborhood, property.city]
    .filter(Boolean)
    .join(' ')

  const slug = parts
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // keep alphanumeric and hyphens
    .trim()
    .replace(/\s+/g, '-') // spaces → hyphens
    .replace(/-+/g, '-') // collapse multiple hyphens

  // Append code as suffix to ensure uniqueness
  return property.code ? `${slug}-${property.code.toLowerCase()}` : slug
}

// ============================================================
// WHATSAPP
// ============================================================

/**
 * Generates a wa.me deep-link URL for WhatsApp.
 * @param phone  Brazilian phone number (digits only or formatted)
 * @param message  Pre-filled message text
 * @example
 * formatWhatsAppUrl('5516981010004', 'Olá, tenho interesse no imóvel')
 * // → "https://wa.me/5516981010004?text=Ol%C3%A1%2C%20tenho%20interesse..."
 */
export function formatWhatsAppUrl(phone: string, message: string): string {
  // Strip everything except digits
  const digits = phone.replace(/\D/g, '')

  // Add country code if missing (assume Brazil +55)
  const number = digits.startsWith('55') ? digits : `55${digits}`

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

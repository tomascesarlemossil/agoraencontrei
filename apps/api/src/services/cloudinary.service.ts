/**
 * Cloudinary Image Service — Transformação dinâmica de fotos via URL
 * Aplica presets de edição, marca d'água e smart crop sem processar no servidor.
 *
 * Configuração: CLOUDINARY_CLOUD_NAME e CLOUDINARY_LOGO_ID no .env
 */

import { env } from '../utils/env.js'

// ── Types ────────────────────────────────────────────────────────────────────

export type ImagePreset = 'moderno' | 'luxo' | 'vibrant' | 'clean'

export type ImageFormat = 'feed' | 'stories' | 'thumb' | 'site' | 'og'

export type LogoPosition = 'south_east' | 'south_west' | 'north_east' | 'north_west' | 'center'

export interface ImageTransformOptions {
  preset?: ImagePreset
  format?: ImageFormat
  withLogo?: boolean
  logoPosition?: LogoPosition
  logoOpacity?: number   // 0-100
  logoWidth?: number     // px
  quality?: 'auto' | number
}

// ── Config ───────────────────────────────────────────────────────────────────

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME ?? 'agoraencontrei'
const LOGO_ID    = process.env.CLOUDINARY_LOGO_ID ?? 'logo_agora_encontrei'

// ── Preset Definitions ──────────────────────────────────────────────────────

const PRESETS: Record<ImagePreset, string> = {
  moderno:  'e_improve,e_sharpen:100,e_vibrance:10',
  luxo:     'e_art:incognito,e_contrast:20',
  vibrant:  'e_saturation:30,e_vibrance:20,e_sharpen:80',
  clean:    'e_improve,e_auto_brightness',
}

const FORMATS: Record<ImageFormat, string> = {
  feed:    'w_1080,h_1080,c_fill,g_auto',    // Instagram Feed (quadrado)
  stories: 'w_1080,h_1920,c_fill,g_auto',    // Stories/Reels (vertical)
  thumb:   'w_600,h_400,c_fill,g_auto',      // Miniatura para listagem
  site:    'w_1920,h_1080,c_limit,g_auto',   // Full-size para o site
  og:      'w_1200,h_630,c_fill,g_auto',     // Open Graph (compartilhamento)
}

// ── Core Functions ──────────────────────────────────────────────────────────

/**
 * Gera URL de imagem otimizada com preset, crop e logo via Cloudinary fetch.
 * Não requer upload prévio — usa image/fetch para transformar qualquer URL.
 */
export function getOptimizedImageUrl(
  originalUrl: string,
  options: ImageTransformOptions = {},
): string {
  const {
    preset = 'moderno',
    format = 'site',
    withLogo = true,
    logoPosition = 'south_east',
    logoOpacity = 75,
    logoWidth = 200,
    quality = 'auto',
  } = options

  const parts: string[] = []

  // Quality and format optimization
  parts.push(`q_${quality},f_auto`)

  // Preset (color/effect transforms)
  if (PRESETS[preset]) {
    parts.push(PRESETS[preset])
  }

  // Format (size/crop)
  if (FORMATS[format]) {
    parts.push(FORMATS[format])
  }

  // Build base transformation string
  let transform = parts.join('/')

  // Logo overlay (separate transformation step)
  if (withLogo) {
    const logoTransform = `l_${LOGO_ID},o_${logoOpacity},g_${logoPosition},x_20,y_20,w_${logoWidth}`
    transform = `${transform}/${logoTransform}`
  }

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/fetch/${transform}/${encodeURIComponent(originalUrl)}`
}

/**
 * Gera todas as variantes de uma imagem (feed, stories, thumb, site, og).
 * Útil para pré-gerar os URLs ao cadastrar um imóvel.
 */
export function getAllImageVariants(
  originalUrl: string,
  preset: ImagePreset = 'moderno',
  withLogo = true,
): Record<ImageFormat, string> {
  const formats: ImageFormat[] = ['feed', 'stories', 'thumb', 'site', 'og']
  const result = {} as Record<ImageFormat, string>

  for (const format of formats) {
    result[format] = getOptimizedImageUrl(originalUrl, { preset, format, withLogo })
  }

  return result
}

/**
 * Processa um lote de imagens com o mesmo preset.
 * Retorna um array de objetos com URL original + todas as variantes.
 */
export function processBatchImages(
  imageUrls: string[],
  preset: ImagePreset = 'moderno',
  withLogo = true,
): Array<{ original: string; variants: Record<ImageFormat, string> }> {
  return imageUrls.map(url => ({
    original: url,
    variants: getAllImageVariants(url, preset, withLogo),
  }))
}

/**
 * Gera URL de thumbnail otimizada para listagens (rápido, sem logo).
 */
export function getThumbnailUrl(originalUrl: string): string {
  return getOptimizedImageUrl(originalUrl, {
    preset: 'clean',
    format: 'thumb',
    withLogo: false,
    quality: 'auto',
  })
}

/**
 * Gera URL otimizada para Open Graph (compartilhamento em redes sociais).
 */
export function getOgImageUrl(originalUrl: string): string {
  return getOptimizedImageUrl(originalUrl, {
    preset: 'moderno',
    format: 'og',
    withLogo: true,
    logoOpacity: 60,
    logoWidth: 250,
  })
}

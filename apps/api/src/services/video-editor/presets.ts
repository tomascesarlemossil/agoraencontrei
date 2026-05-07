/**
 * Video editor — preset catalog.
 *
 * A "preset" is a high-level edit template (LUT + pacing + caption style +
 * default transition). The worker reads these definitions to drive FFmpeg
 * filter graphs.
 *
 * Presets are intentionally hard-coded in source: this lets the team review
 * each addition (instead of letting end-users craft arbitrary filter graphs
 * that could DoS the render farm).
 */

export type CaptionPosition = 'bottom' | 'middle' | 'top'

export interface PresetDefinition {
  id:           string
  name:         string
  description:  string
  niche:        'real_estate' | 'social' | 'ecommerce' | 'tutorial' | 'testimonial' | 'generic'
  // FFmpeg filter graph fragment applied to every clip (color grading)
  videoFilter:  string
  // Default audio gain applied if the user provides their own track (-vol)
  audioGain:    number
  // Pacing: max seconds per clip before forced cut (null = keep full clip)
  maxClipSec:   number | null
  // Caption defaults
  captionStyle: {
    fontFamily:  string
    fontSizePct: number      // % of frame height
    color:       string      // hex
    highlight:   string      // hex (word-level pop color)
    position:    CaptionPosition
    bold:        boolean
  }
  // Default transition between clips
  defaultTransitionId: string
  /** UI preview — a dominant color hint (used when there is no thumbnail). */
  previewColor: string
  /** UI preview — a CSS filter string approximating the videoFilter. The
   *  dashboard applies it to a static thumbnail so the partner can see
   *  "more or less" the look before rendering. */
  cssPreview:   string
}

export const PRESETS: PresetDefinition[] = [
  {
    id:          'realestate-tour',
    name:        'Tour de Imóvel',
    description: 'Cortes suaves, color grade quente, legendas no rodapé. Ideal para apresentar imóveis.',
    niche:       'real_estate',
    videoFilter: 'eq=contrast=1.05:saturation=1.10:gamma=0.98',
    audioGain:   1.0,
    maxClipSec:  4,
    captionStyle: {
      fontFamily:  'Montserrat',
      fontSizePct: 4.5,
      color:       '#FFFFFF',
      highlight:   '#C9A84C',
      position:    'bottom',
      bold:        true,
    },
    defaultTransitionId: 'fade',
    previewColor: '#1B2B5B',
    cssPreview:   'contrast(1.05) saturate(1.10) brightness(1.02)',
  },
  {
    id:          'realestate-before-after',
    name:        'Antes & Depois',
    description: 'Comparação lado a lado de reforma com transição split. Use 2 clipes.',
    niche:       'real_estate',
    videoFilter: 'eq=contrast=1.10:saturation=1.05',
    audioGain:   1.0,
    maxClipSec:  null,
    captionStyle: {
      fontFamily:  'Montserrat',
      fontSizePct: 5.0,
      color:       '#FFFFFF',
      highlight:   '#C9A84C',
      position:    'top',
      bold:        true,
    },
    defaultTransitionId: 'wipe-left',
    previewColor: '#3A506B',
    cssPreview:   'contrast(1.10) saturate(1.05)',
  },
  {
    id:          'social-reels-fast',
    name:        'Reels Rápido',
    description: 'Cortes rápidos (1-2s), legenda animada palavra-a-palavra, alto contraste.',
    niche:       'social',
    videoFilter: 'eq=contrast=1.15:saturation=1.20:gamma=0.95',
    audioGain:   1.0,
    maxClipSec:  2,
    captionStyle: {
      fontFamily:  'Inter',
      fontSizePct: 6.0,
      color:       '#FFFFFF',
      highlight:   '#FFD400',
      position:    'middle',
      bold:        true,
    },
    defaultTransitionId: 'cut',
    previewColor: '#FF1744',
    cssPreview:   'contrast(1.15) saturate(1.20) brightness(0.95)',
  },
  {
    id:          'social-vlog',
    name:        'Vlog Cinemático',
    description: 'Cortes médios, color grade cinematográfica, legendas discretas.',
    niche:       'social',
    videoFilter: 'eq=contrast=1.08:saturation=0.95:gamma=1.02,curves=preset=vintage',
    audioGain:   1.0,
    maxClipSec:  6,
    captionStyle: {
      fontFamily:  'Inter',
      fontSizePct: 3.8,
      color:       '#FFFFFF',
      highlight:   '#FFFFFF',
      position:    'bottom',
      bold:        false,
    },
    defaultTransitionId: 'fade',
    previewColor: '#5C4033',
    cssPreview:   'contrast(1.08) saturate(0.95) sepia(0.15)',
  },
  {
    id:          'ecommerce-product',
    name:        'Produto E-commerce',
    description: 'Foco em produto com fundo limpo, legendas grandes destacando preço/oferta.',
    niche:       'ecommerce',
    videoFilter: 'eq=contrast=1.12:saturation=1.30:brightness=0.02',
    audioGain:   1.0,
    maxClipSec:  3,
    captionStyle: {
      fontFamily:  'Inter',
      fontSizePct: 7.0,
      color:       '#FFFFFF',
      highlight:   '#FF3366',
      position:    'middle',
      bold:        true,
    },
    defaultTransitionId: 'zoom',
    previewColor: '#FF3366',
    cssPreview:   'contrast(1.12) saturate(1.30) brightness(1.04)',
  },
  {
    id:          'tutorial-stepbystep',
    name:        'Tutorial Passo-a-Passo',
    description: 'Pacing pausado para acompanhar, legendas claras com posição estável.',
    niche:       'tutorial',
    videoFilter: 'eq=contrast=1.04:saturation=1.00',
    audioGain:   1.2,
    maxClipSec:  null,
    captionStyle: {
      fontFamily:  'Inter',
      fontSizePct: 4.0,
      color:       '#FFFFFF',
      highlight:   '#33CCFF',
      position:    'bottom',
      bold:        true,
    },
    defaultTransitionId: 'fade',
    previewColor: '#33CCFF',
    cssPreview:   'contrast(1.04) saturate(1.00)',
  },
  {
    id:          'testimonial-talking-head',
    name:        'Depoimento (Falando à Câmera)',
    description: 'Legendas grandes com destaque palavra-a-palavra. Espera o áudio do clipe ser a voz do entrevistado.',
    niche:       'testimonial',
    videoFilter: 'eq=contrast=1.06:saturation=1.05',
    audioGain:   1.0,
    maxClipSec:  null,
    captionStyle: {
      fontFamily:  'Montserrat',
      fontSizePct: 5.5,
      color:       '#FFFFFF',
      highlight:   '#FFD400',
      position:    'middle',
      bold:        true,
    },
    defaultTransitionId: 'cut',
    previewColor: '#FFD400',
    cssPreview:   'contrast(1.06) saturate(1.05)',
  },
  {
    id:          'generic-clean',
    name:        'Padrão Limpo',
    description: 'Sem color grade. Apenas concatena os clipes. Use quando quiser o material original.',
    niche:       'generic',
    videoFilter: 'null',
    audioGain:   1.0,
    maxClipSec:  null,
    captionStyle: {
      fontFamily:  'Inter',
      fontSizePct: 4.0,
      color:       '#FFFFFF',
      highlight:   '#FFFFFF',
      position:    'bottom',
      bold:        false,
    },
    defaultTransitionId: 'cut',
    previewColor: '#9CA3AF',
    cssPreview:   'none',
  },
]

export function getPreset(id: string | null | undefined): PresetDefinition {
  if (!id) return PRESETS.find(p => p.id === 'generic-clean')!
  return PRESETS.find(p => p.id === id) ?? PRESETS.find(p => p.id === 'generic-clean')!
}

/**
 * Video editor — transition catalog.
 *
 * Each entry maps to FFmpeg's `xfade` filter (or to a "cut" no-op for hard
 * cuts). Duration is expressed in seconds and overlap is taken into account
 * by the render service when concatenating clips.
 */

export interface TransitionDefinition {
  id:          string
  name:        string
  // FFmpeg xfade `transition` parameter. `null` means no xfade (hard cut).
  xfadeName:   string | null
  durationSec: number
  /** Short, human-friendly description that the UI shows on hover. */
  description: string
  /** Lucide icon name the UI renders next to the transition card. */
  icon:        string
}

export const TRANSITIONS: TransitionDefinition[] = [
  { id: 'cut',        name: 'Corte Seco',    xfadeName: null,         durationSec: 0,
    description: 'Sem transição. Mudança instantânea entre clipes.', icon: 'Scissors' },
  { id: 'fade',       name: 'Fade',          xfadeName: 'fade',       durationSec: 0.5,
    description: 'Fade suave entre dois clipes.', icon: 'Sun' },
  { id: 'fadeblack',  name: 'Fade Preto',    xfadeName: 'fadeblack',  durationSec: 0.6,
    description: 'Escurece e clareia para o próximo clipe.', icon: 'Moon' },
  { id: 'fadewhite',  name: 'Fade Branco',   xfadeName: 'fadewhite',  durationSec: 0.6,
    description: 'Estoura para o branco e volta.', icon: 'Sun' },
  { id: 'wipe-left',  name: 'Wipe Esquerda', xfadeName: 'wipeleft',   durationSec: 0.5,
    description: 'O próximo clipe entra deslizando da esquerda.', icon: 'ArrowLeft' },
  { id: 'wipe-right', name: 'Wipe Direita',  xfadeName: 'wiperight',  durationSec: 0.5,
    description: 'O próximo clipe entra deslizando da direita.', icon: 'ArrowRight' },
  { id: 'slide-up',   name: 'Slide Cima',    xfadeName: 'slideup',    durationSec: 0.5,
    description: 'Próximo clipe sobe por baixo.', icon: 'ArrowUp' },
  { id: 'slide-down', name: 'Slide Baixo',   xfadeName: 'slidedown',  durationSec: 0.5,
    description: 'Próximo clipe desce por cima.', icon: 'ArrowDown' },
  { id: 'zoom',       name: 'Zoom',          xfadeName: 'zoomin',     durationSec: 0.6,
    description: 'Próximo clipe entra com zoom.', icon: 'ZoomIn' },
  { id: 'circle',     name: 'Círculo',       xfadeName: 'circleopen', durationSec: 0.7,
    description: 'Abertura circular do centro para fora.', icon: 'Circle' },
  { id: 'pixelize',   name: 'Pixelize',      xfadeName: 'pixelize',   durationSec: 0.6,
    description: 'Quebra em pixels e revela o próximo clipe.', icon: 'Grid3x3' },
  { id: 'dissolve',   name: 'Dissolve',      xfadeName: 'dissolve',   durationSec: 0.7,
    description: 'Mistura aleatória entre os clipes.', icon: 'Sparkles' },
]

export function getTransition(id: string | null | undefined): TransitionDefinition {
  if (!id) return TRANSITIONS[0]
  return TRANSITIONS.find(t => t.id === id) ?? TRANSITIONS[0]
}

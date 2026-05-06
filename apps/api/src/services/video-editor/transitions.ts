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
}

export const TRANSITIONS: TransitionDefinition[] = [
  { id: 'cut',        name: 'Corte Seco',        xfadeName: null,            durationSec: 0    },
  { id: 'fade',       name: 'Fade',              xfadeName: 'fade',          durationSec: 0.5  },
  { id: 'fadeblack',  name: 'Fade Preto',        xfadeName: 'fadeblack',     durationSec: 0.6  },
  { id: 'fadewhite',  name: 'Fade Branco',       xfadeName: 'fadewhite',     durationSec: 0.6  },
  { id: 'wipe-left',  name: 'Wipe Esquerda',     xfadeName: 'wipeleft',      durationSec: 0.5  },
  { id: 'wipe-right', name: 'Wipe Direita',      xfadeName: 'wiperight',     durationSec: 0.5  },
  { id: 'slide-up',   name: 'Slide Cima',        xfadeName: 'slideup',       durationSec: 0.5  },
  { id: 'slide-down', name: 'Slide Baixo',       xfadeName: 'slidedown',     durationSec: 0.5  },
  { id: 'zoom',       name: 'Zoom',              xfadeName: 'zoomin',        durationSec: 0.6  },
  { id: 'circle',     name: 'Círculo',           xfadeName: 'circleopen',    durationSec: 0.7  },
  { id: 'pixelize',   name: 'Pixelize',          xfadeName: 'pixelize',      durationSec: 0.6  },
  { id: 'dissolve',   name: 'Dissolve',          xfadeName: 'dissolve',      durationSec: 0.7  },
]

export function getTransition(id: string | null | undefined): TransitionDefinition {
  if (!id) return TRANSITIONS[0]
  return TRANSITIONS.find(t => t.id === id) ?? TRANSITIONS[0]
}

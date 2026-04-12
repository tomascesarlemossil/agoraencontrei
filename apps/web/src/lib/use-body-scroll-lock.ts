/**
 * use-body-scroll-lock — bloqueia scroll do body com suporte a múltiplos
 * modais/drawers empilhados. Restaura o scroll correto quando o último
 * consumidor fecha.
 *
 * Uso:
 *   useBodyScrollLock(isOpen)
 *
 * Detalhes:
 * - Mantém contador de consumidores no escopo do módulo.
 * - Salva scrollY do primeiro lock e restaura no unlock final.
 * - Preserva outros estilos inline do body (não usa cssText).
 * - Safe para SSR (só roda no client).
 */
import { useEffect } from 'react'

let lockCount = 0
let savedScrollY = 0
let savedStyles: Partial<Pick<CSSStyleDeclaration, 'overflow' | 'position' | 'top' | 'left' | 'right' | 'width'>> = {}

function lock() {
  if (typeof window === 'undefined') return
  lockCount += 1
  if (lockCount > 1) return // já travado por outro consumidor

  savedScrollY = window.scrollY
  const body = document.body.style
  savedStyles = {
    overflow: body.overflow,
    position: body.position,
    top: body.top,
    left: body.left,
    right: body.right,
    width: body.width,
  }
  body.overflow = 'hidden'
  body.position = 'fixed'
  body.top = `-${savedScrollY}px`
  body.left = '0'
  body.right = '0'
  body.width = '100%'
}

function unlock() {
  if (typeof window === 'undefined') return
  if (lockCount === 0) return
  lockCount -= 1
  if (lockCount > 0) return // ainda há outro consumidor ativo

  const body = document.body.style
  body.overflow = savedStyles.overflow ?? ''
  body.position = savedStyles.position ?? ''
  body.top = savedStyles.top ?? ''
  body.left = savedStyles.left ?? ''
  body.right = savedStyles.right ?? ''
  body.width = savedStyles.width ?? ''
  window.scrollTo(0, savedScrollY)
}

export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return
    lock()
    return () => unlock()
  }, [isLocked])
}

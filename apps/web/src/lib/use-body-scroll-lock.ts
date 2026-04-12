/**
 * useBodyScrollLock — iOS-safe body scroll lock with reference counting.
 *
 * Multiple components can call this hook independently; the body only
 * becomes scrollable again when ALL consumers have unlocked.
 *
 * Implementation follows the iOS Safari best practice:
 *   position: fixed + top: -${scrollY}px + restore window.scrollTo on unlock.
 *
 * Reference: https://css-tricks.com/prevent-page-scrolling-when-a-modal-is-open/
 */

import { useEffect } from 'react'

/** Shared counter so nested/stacked modals all hold the lock correctly. */
let lockCount = 0
let savedScrollY = 0

function acquireLock() {
  if (lockCount === 0) {
    savedScrollY = window.scrollY
    document.body.style.cssText = `
      overflow: hidden;
      position: fixed;
      top: -${savedScrollY}px;
      left: 0;
      right: 0;
      width: 100%;
    `
  }
  lockCount++
}

function releaseLock() {
  if (lockCount <= 0) return
  lockCount--
  if (lockCount === 0) {
    document.body.style.cssText = ''
    window.scrollTo(0, savedScrollY)
  }
}

/**
 * Call with `active = true` to lock body scroll, `false` to release.
 * Automatically releases on component unmount.
 */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    acquireLock()
    return () => releaseLock()
  }, [active])
}

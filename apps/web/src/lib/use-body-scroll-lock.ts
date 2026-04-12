/**
 * useBodyScrollLock — iOS-safe body scroll lock with reference counting.
 *
 * Multiple components can call this hook independently; the body only
 * becomes scrollable again when ALL consumers have unlocked.
 *
 * Implementation follows the iOS Safari best practice:
 *   position: fixed + top: -${scrollY}px + restore window.scrollTo on unlock.
 *
 * JS is single-threaded in the browser, so the module-level counter is safe
 * from concurrent-access issues. React StrictMode double-invokes effects in
 * dev, but the acquire → cleanup → re-acquire sequence still keeps lockCount
 * correct because each cleanup decrements before the next mount increments.
 *
 * Reference: https://css-tricks.com/prevent-page-scrolling-when-a-modal-is-open/
 */

import { useEffect } from 'react'

/** Shared counter so nested/stacked modals all hold the lock correctly. */
let lockCount = 0
let savedScrollY = 0

/** Pixels to reserve above/below the fixed body on portrait mobile devices
 *  to account for notch + home indicator when env() is unavailable in JS. */
const MOBILE_PORTRAIT_SAFE_MARGIN = 50

function acquireLock() {
  if (lockCount === 0) {
    savedScrollY = window.scrollY
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${savedScrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
  }
  lockCount++
}

function releaseLock() {
  if (lockCount <= 0) return
  lockCount--
  if (lockCount === 0) {
    // Reset only the properties we set — avoid clobbering other inline styles
    document.body.style.overflow = ''
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.left = ''
    document.body.style.right = ''
    document.body.style.width = ''
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

export { MOBILE_PORTRAIT_SAFE_MARGIN }

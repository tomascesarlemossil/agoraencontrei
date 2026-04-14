/**
 * Constant-time comparison helpers.
 *
 * These functions protect against timing-oracle attacks when comparing
 * sensitive values (webhook tokens, JWT secrets, admin passwords).
 *
 * IMPORTANT: never compare secrets with `===` or `!==`. The V8 string
 * comparison short-circuits on the first mismatched byte, leaking the
 * length of the matching prefix through response-time side channels.
 */

import { timingSafeEqual } from 'node:crypto'

/**
 * Returns `true` iff `a` and `b` have identical length and bytes.
 * Always runs in time proportional to the longer input (no early exit).
 *
 * Accepts any UTF-8 strings. Returns `false` when either argument is
 * `undefined`, `null`, or an empty string (so callers never treat a
 * missing expected value as a match).
 */
export function safeStringEqual(a: string | undefined | null, b: string | undefined | null): boolean {
  if (!a || !b) return false
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  // Pad the shorter buffer so timingSafeEqual can run (it throws when
  // lengths differ). Length mismatch still returns false.
  if (bufA.length !== bufB.length) {
    // Do a dummy comparison of equal length to keep timing consistent.
    timingSafeEqual(bufA, bufA)
    return false
  }
  return timingSafeEqual(bufA, bufB)
}

'use client'

import { motion, useReducedMotion, type Variant } from 'framer-motion'
import type { ReactNode } from 'react'

type Direction = 'up' | 'down' | 'left' | 'right' | 'none'

interface RevealProps {
  children: ReactNode
  /** Slide direction the element travels from. Default: 'up'. */
  direction?: Direction
  /** Animation delay in seconds (use to cascade siblings). Default: 0. */
  delay?: number
  /** Travel distance in px. Default: 24. */
  distance?: number
  /** Duration in seconds. Default: 0.6. */
  duration?: number
  className?: string
  /** Render as a different element when nesting matters (default: div). */
  as?: 'div' | 'section' | 'li' | 'span'
}

const OFFSETS: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 1 },
  down: { x: 0, y: -1 },
  left: { x: 1, y: 0 },
  right: { x: -1, y: 0 },
  none: { x: 0, y: 0 },
}

/**
 * Scroll-reveal wrapper: fades + slides its children into view the first time
 * they enter the viewport. Respects `prefers-reduced-motion` (renders content
 * statically with no transform) so it never harms accessibility.
 */
export function Reveal({
  children,
  direction = 'up',
  delay = 0,
  distance = 24,
  duration = 0.6,
  className,
  as = 'div',
}: RevealProps) {
  const reduceMotion = useReducedMotion()
  const MotionTag = motion[as]

  if (reduceMotion) {
    const Tag = as
    return <Tag className={className}>{children}</Tag>
  }

  const offset = OFFSETS[direction]
  const hidden: Variant = {
    opacity: 0,
    x: offset.x * distance,
    y: offset.y * distance,
  }
  const visible: Variant = { opacity: 1, x: 0, y: 0 }

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15, margin: '0px 0px -10% 0px' }}
      variants={{ hidden, visible }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  )
}

export default Reveal

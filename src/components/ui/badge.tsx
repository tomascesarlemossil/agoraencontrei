import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 font-sans',
  {
    variants: {
      variant: {
        default:
          'border-gold-500/30 bg-gold-500/15 text-gold-300 hover:bg-gold-500/25',
        secondary:
          'border-navy-700 bg-navy-800 text-foreground/70 hover:bg-navy-700',
        destructive:
          'border-red-500/30 bg-red-500/15 text-red-400 hover:bg-red-500/25',
        outline:
          'border-foreground/20 text-foreground/70 bg-transparent',
        success:
          'border-emerald-500/30 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25',
        warning:
          'border-amber-500/30 bg-amber-500/15 text-amber-400 hover:bg-amber-500/25',
        info:
          'border-blue-500/30 bg-blue-500/15 text-blue-400 hover:bg-blue-500/25',
        hot:
          'border-red-400/40 bg-gradient-to-r from-red-500/20 to-orange-500/20 text-orange-300',
        warm:
          'border-amber-400/40 bg-amber-500/15 text-amber-300',
        cold:
          'border-blue-400/40 bg-blue-500/15 text-blue-300',
        new:
          'border-emerald-400/40 bg-emerald-500/15 text-emerald-300',
        reduced:
          'border-purple-400/40 bg-purple-500/15 text-purple-300',
        featured:
          'border-gold-400/50 bg-gradient-to-r from-gold-600/20 to-gold-400/20 text-gold-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 font-sans',
  {
    variants: {
      variant: {
        default:
          'bg-gold-500 text-navy-950 hover:bg-gold-400 active:bg-gold-600 shadow-md hover:shadow-gold-500/25 hover:shadow-lg font-semibold',
        secondary:
          'border border-gold-500/50 text-gold-400 bg-transparent hover:bg-gold-500/10 hover:border-gold-400 hover:text-gold-300',
        ghost:
          'text-foreground/70 hover:bg-navy-800 hover:text-foreground',
        destructive:
          'bg-red-600 text-white hover:bg-red-500 shadow-sm',
        link:
          'text-gold-400 underline-offset-4 hover:underline hover:text-gold-300 p-0 h-auto',
        outline:
          'border border-navy-700 bg-navy-900 text-foreground hover:bg-navy-800 hover:border-navy-600',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-md px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '@/lib/utils'

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    showValue?: boolean
    label?: string
  }
>(({ className, value, showValue, label, ...props }, ref) => (
  <div className="w-full space-y-1.5">
    {(label || showValue) && (
      <div className="flex justify-between items-center">
        {label && <span className="text-xs text-foreground/60 font-sans">{label}</span>}
        {showValue && (
          <span className="text-xs text-gold-400 font-semibold font-sans">{value ?? 0}%</span>
        )}
      </div>
    )}
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-navy-800 border border-navy-700',
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 bg-gradient-to-r from-gold-600 to-gold-400 transition-all duration-500 ease-out"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  </div>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }

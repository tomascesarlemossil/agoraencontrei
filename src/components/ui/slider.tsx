import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '@/lib/utils'

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex w-full touch-none select-none items-center',
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-navy-800 border border-navy-700">
      <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-gold-600 to-gold-400" />
    </SliderPrimitive.Track>
    {(props.value ?? props.defaultValue ?? [0]).map((_, i) => (
      <SliderPrimitive.Thumb
        key={i}
        className={cn(
          'block h-5 w-5 rounded-full border-2 border-gold-400 bg-navy-900',
          'ring-offset-background transition-colors focus-visible:outline-none',
          'focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          'hover:border-gold-300 hover:scale-110 transition-transform duration-150',
          'shadow-lg shadow-gold-500/20 cursor-grab active:cursor-grabbing'
        )}
      />
    ))}
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }

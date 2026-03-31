import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-foreground/80 font-sans"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            className={cn(
              'flex h-10 w-full rounded-md border border-navy-700 bg-navy-800',
              'px-3 py-2 text-sm text-foreground placeholder:text-foreground/40',
              'ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-0 focus-visible:border-gold-500/50',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'transition-all duration-200',
              'hover:border-navy-600',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-red-500/70 focus-visible:ring-red-500',
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-red-400 font-sans">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }

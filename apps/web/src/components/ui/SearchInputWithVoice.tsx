'use client'

import { forwardRef } from 'react'
import { Search } from 'lucide-react'
import { VoiceInputButton } from './VoiceInputButton'
import { cn } from '@/lib/utils'

interface SearchInputWithVoiceProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onVoiceResult?: (text: string) => void
  dark?: boolean
  containerClassName?: string
  showSearchIcon?: boolean
}

/**
 * Drop-in replacement for search inputs — adds a mic icon (voice-to-text) on the right.
 * onVoiceResult defaults to calling onChange if not provided.
 */
export const SearchInputWithVoice = forwardRef<HTMLInputElement, SearchInputWithVoiceProps>(
  ({ onVoiceResult, dark = false, containerClassName, showSearchIcon = true, className, onChange, ...props }, ref) => {
    function handleVoice(text: string) {
      if (onVoiceResult) {
        onVoiceResult(text)
      } else if (onChange) {
        // Synthesize a change event
        const nativeInput = document.createElement('input')
        Object.defineProperty(nativeInput, 'value', { writable: true, value: text })
        const event = new Event('input', { bubbles: true })
        Object.defineProperty(event, 'target', { writable: false, value: nativeInput })
        onChange(event as unknown as React.ChangeEvent<HTMLInputElement>)
      }
    }

    return (
      <div className={cn('relative flex items-center', containerClassName)}>
        {showSearchIcon && (
          <Search className={cn(
            'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none',
            dark ? 'text-white/40' : 'text-gray-400',
          )} />
        )}
        <input
          ref={ref}
          onChange={onChange}
          className={cn(
            showSearchIcon ? 'pl-9' : 'pl-3',
            'pr-9',
            className,
          )}
          {...props}
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2">
          <VoiceInputButton onResult={handleVoice} dark={dark} />
        </span>
      </div>
    )
  },
)

SearchInputWithVoice.displayName = 'SearchInputWithVoice'

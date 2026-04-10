'use client'

import { forwardRef, useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'

// ── Monetary Input ──────────────────────────────────────────────────────────
// Displays values in Brazilian Real format (R$ 1.234,56)
// Stores raw number value for form submission

interface MoneyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: number | string | null
  onChange?: (value: number | null) => void
  error?: string
}

function formatMoney(val: number | null | undefined): string {
  if (val == null || isNaN(val)) return ''
  return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function parseMoney(str: string): number | null {
  if (!str) return null
  // Remove everything except digits and comma/dot
  const cleaned = str.replace(/[^\d,.-]/g, '')
  // Brazilian format: 1.234,56 → replace . with nothing, , with .
  const normalized = cleaned.replace(/\./g, '').replace(',', '.')
  const num = parseFloat(normalized)
  return isNaN(num) ? null : num
}

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ className, value, onChange, error, placeholder = '0,00', ...props }, ref) => {
    const [display, setDisplay] = useState('')

    useEffect(() => {
      const numVal = typeof value === 'string' ? parseFloat(value) : value
      if (numVal != null && !isNaN(numVal) && numVal > 0) {
        setDisplay(formatMoney(numVal))
      } else {
        setDisplay('')
      }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value
      // Allow only digits, comma, dot
      const filtered = raw.replace(/[^\d.,]/g, '')
      setDisplay(filtered)
    }

    const handleBlur = () => {
      const parsed = parseMoney(display)
      if (parsed != null) {
        setDisplay(formatMoney(parsed))
      }
      onChange?.(parsed)
    }

    return (
      <div className="relative w-full">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/40 pointer-events-none">
          R$
        </span>
        <input
          ref={ref}
          type="text"
          inputMode="decimal"
          className={cn(
            'flex h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-400 focus-visible:ring-red-400',
            className,
          )}
          value={display}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          {...props}
        />
      </div>
    )
  },
)
MoneyInput.displayName = 'MoneyInput'

// ── CEP Input with auto-fill ────────────────────────────────────────────────
// Fetches address data from ViaCEP API when a valid CEP is entered

interface CepInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string
  onChange?: (value: string) => void
  onAddressFound?: (address: {
    street: string
    neighborhood: string
    city: string
    state: string
  }) => void
  error?: string
}

function formatCep(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 8)
  if (digits.length > 5) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`
  }
  return digits
}

export const CepInput = forwardRef<HTMLInputElement, CepInputProps>(
  ({ className, value, onChange, onAddressFound, error, ...props }, ref) => {
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<'idle' | 'found' | 'notfound'>('idle')

    const fetchAddress = useCallback(async (cep: string) => {
      const digits = cep.replace(/\D/g, '')
      if (digits.length !== 8) return

      setLoading(true)
      setStatus('idle')
      try {
        // Use our API proxy to avoid CORS issues
        const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''
        const res = await fetch(`${API_URL}/api/v1/cep/${digits}`)
        if (!res.ok) {
          setStatus('notfound')
          return
        }
        const data = await res.json()
        if (data.error) {
          setStatus('notfound')
          return
        }
        setStatus('found')
        onAddressFound?.({
          street: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || '',
        })
      } catch {
        setStatus('notfound')
      } finally {
        setLoading(false)
      }
    }, [onAddressFound])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatCep(e.target.value)
      onChange?.(formatted)

      // Auto-fetch when 8 digits entered
      const digits = formatted.replace(/\D/g, '')
      if (digits.length === 8) {
        fetchAddress(formatted)
      } else {
        setStatus('idle')
      }
    }

    return (
      <div className="relative w-full">
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          maxLength={9}
          className={cn(
            'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-400 focus-visible:ring-red-400',
            className,
          )}
          value={value || ''}
          onChange={handleChange}
          placeholder="00000-000"
          {...props}
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg className="animate-spin h-4 w-4 text-white/40" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
            </svg>
          </span>
        )}
        {status === 'found' && !loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 text-xs">
            ✓
          </span>
        )}
        {status === 'notfound' && !loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 text-xs">
            CEP não encontrado
          </span>
        )}
      </div>
    )
  },
)
CepInput.displayName = 'CepInput'

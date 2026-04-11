'use client'

import { useState, useRef, useCallback } from 'react'
import { Send, Loader2, Sparkles, MapPin, Bed, Car, FileText, MessageSquare, Calendar } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'

// ── Types ───────────────────────────────────────────────────────────────────

interface TomasAction {
  type: string
  label: string
  payload?: Record<string, unknown>
}

interface ShortlistItem {
  propertyId: string
  reference?: string | null
  title: string
  city: string | null
  neighborhood: string | null
  price: number | null
  bedrooms: number
  parkingSpaces: number
  type: string
  score: number
  reason: string
}

interface TomasResponse {
  chatId: string
  message: string
  actions: TomasAction[]
  shortlist: ShortlistItem[]
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

const EXAMPLE_COMMANDS = [
  'Ache imóveis até 500 mil em Franca com 3 quartos',
  'Monte uma lista de apartamentos para investimento',
  'Quais imóveis tiveram mais leads essa semana?',
  'Gere uma mensagem de follow-up para o cliente',
]

// ── Component ───────────────────────────────────────────────────────────────

export default function TomasCommandBar() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<TomasResponse | null>(null)
  const [history, setHistory] = useState<Array<{ query: string; response: TomasResponse }>>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const { accessToken } = useAuthStore()

  const runCommand = useCallback(async (prefilled?: string) => {
    const text = (prefilled ?? query).trim()
    if (!text || loading) return

    setQuery('')
    setLoading(true)
    setResponse(null)

    try {
      const res = await fetch(`${API_URL}/api/v1/tomas/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: text }],
          channel: 'dashboard',
        }),
      })

      if (!res.ok) throw new Error('Network error')

      const data: TomasResponse = await res.json()
      setResponse(data)
      setHistory(prev => [...prev, { query: text, response: data }].slice(-10))
    } catch {
      setResponse({
        chatId: '',
        message: 'Não consegui processar agora. Tente novamente em instantes.',
        actions: [],
        shortlist: [],
      })
    } finally {
      setLoading(false)
    }
  }, [query, loading, accessToken])

  const formatPrice = (price: number | null) => {
    if (!price) return 'Consulte'
    return `R$ ${price.toLocaleString('pt-BR')}`
  }

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/50 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-800 px-5 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600">
          <Sparkles className="h-4 w-4 text-black" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">Tomás Copilot</div>
          <div className="text-xs text-gray-500">Pergunte ou peça algo ao Tomás</div>
        </div>
      </div>

      {/* Input */}
      <div className="p-4">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            className="flex-1 rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-yellow-600/60"
            placeholder="Ex: ache imóveis até 700 mil em Franca com 3 quartos e 2 vagas"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') runCommand()
            }}
            disabled={loading}
          />
          <button
            onClick={() => runCommand()}
            disabled={loading || !query.trim()}
            className="rounded-xl bg-yellow-600 px-4 py-3 text-sm font-medium text-black transition-colors hover:bg-yellow-500 disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>

        {/* Example Commands */}
        {!response && !loading && (
          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLE_COMMANDS.map((cmd) => (
              <button
                key={cmd}
                onClick={() => {
                  setQuery(cmd)
                  runCommand(cmd)
                }}
                className="rounded-full border border-gray-700/50 bg-gray-800/30 px-3 py-1 text-xs text-gray-400 transition-colors hover:border-yellow-600/40 hover:text-yellow-500"
              >
                {cmd}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center gap-3 border-t border-gray-800 px-5 py-4">
          <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
          <span className="text-sm text-gray-400">Tomás está processando...</span>
        </div>
      )}

      {/* Response */}
      {response && !loading && (
        <div className="border-t border-gray-800">
          {/* Message */}
          <div className="px-5 py-4">
            <p className="text-sm leading-relaxed text-gray-200">{response.message}</p>
          </div>

          {/* Shortlist */}
          {response.shortlist.length > 0 && (
            <div className="border-t border-gray-800/50 px-5 py-3">
              <div className="mb-2 text-xs font-medium text-yellow-500/80">
                {response.shortlist.length} imóveis selecionados
              </div>
              <div className="space-y-2">
                {response.shortlist.map((item) => (
                  <div
                    key={item.propertyId}
                    className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/60 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-white">{item.title}</div>
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {item.neighborhood}{item.city ? `, ${item.city}` : ''}
                      </div>
                      <div className="mt-1 flex items-center gap-3">
                        <span className="text-sm font-semibold text-yellow-500">
                          {formatPrice(item.price)}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {item.bedrooms > 0 && (
                            <span className="flex items-center gap-0.5">
                              <Bed className="h-3 w-3" /> {item.bedrooms}
                            </span>
                          )}
                          {item.parkingSpaces > 0 && (
                            <span className="flex items-center gap-0.5">
                              <Car className="h-3 w-3" /> {item.parkingSpaces}
                            </span>
                          )}
                        </div>
                      </div>
                      {item.reason && (
                        <div className="mt-1 text-xs text-gray-500">{item.reason}</div>
                      )}
                    </div>
                    <div className="ml-3 flex shrink-0 flex-col gap-1">
                      <button className="rounded-lg border border-gray-700 px-2.5 py-1 text-xs text-gray-400 transition-colors hover:border-yellow-600/50 hover:text-yellow-500">
                        Abrir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {response.actions.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-gray-800/50 px-5 py-3">
              {response.actions.map((action, i) => {
                const icons: Record<string, typeof FileText> = {
                  show_shortlist: FileText,
                  schedule_visit: Calendar,
                  send_whatsapp: MessageSquare,
                  open_proposal: FileText,
                }
                const Icon = icons[action.type] || Sparkles

                return (
                  <button
                    key={`${action.label}-${i}`}
                    onClick={() => runCommand(action.label)}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-1.5 text-xs text-gray-300 transition-colors hover:border-yellow-600/50 hover:text-yellow-500"
                  >
                    <Icon className="h-3 w-3" />
                    {action.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

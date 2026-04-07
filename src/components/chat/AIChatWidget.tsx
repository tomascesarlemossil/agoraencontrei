import React, { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, X, Send, Minimize2, Bot, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const INITIAL_MESSAGE: ChatMessage = {
  id: 'initial',
  role: 'assistant',
  content:
    'Olá! Sou o assistente da Imobiliária Lemos. Como posso ajudar você hoje? Posso buscar imóveis, tirar dúvidas sobre financiamento ou conectar você com um corretor!',
  timestamp: new Date(),
}

const QUICK_REPLIES = [
  'Ver imóveis disponíveis',
  'Simular financiamento',
  'Falar com corretor',
]

const MOCK_RESPONSES: Record<string, string> = {
  'ver imóveis disponíveis':
    'Ótimo! Temos mais de 200 imóveis disponíveis em Franca e região. Você prefere comprar ou alugar? E qual é a sua faixa de preço aproximada?',
  'simular financiamento':
    'Posso ajudar com isso! Use nosso simulador de financiamento na página inicial para calcular parcelas. Temos opções de financiamento convencional, Minha Casa Minha Vida e Caixa Econômica Federal. Qual modalidade te interessa?',
  'falar com corretor':
    'Vou conectar você com um de nossos corretores agora mesmo! Você pode:\n\n• Ligar: (16) 3723-0045\n• WhatsApp: (16) 98101-0004\n\nNosso horário de atendimento é de segunda a sexta, das 8h às 18h, e sábados das 8h às 12h.',
  default:
    'Entendi! Vou buscar essa informação para você. Enquanto isso, você pode entrar em contato com nossa equipe pelo WhatsApp (16) 98101-0004 para atendimento imediato.',
}

function getMockResponse(message: string): string {
  const lower = message.toLowerCase().trim()
  for (const [key, response] of Object.entries(MOCK_RESPONSES)) {
    if (key !== 'default' && lower.includes(key)) {
      return response
    }
  }
  return MOCK_RESPONSES.default
}

async function callAIChat(message: string, history: ChatMessage[]): Promise<string> {
  try {
    // Try Supabase edge function
    const supabaseUrl = (import.meta as Record<string, unknown>).env?.VITE_SUPABASE_URL as string | undefined
    const supabaseKey = (import.meta as Record<string, unknown>).env?.VITE_SUPABASE_ANON_KEY as string | undefined

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('No Supabase config')
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/ai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        message,
        history: history.map((m) => ({ role: m.role, content: m.content })),
      }),
      signal: AbortSignal.timeout(8000),
    })

    if (!response.ok) throw new Error('API error')
    const data = await response.json() as { reply?: string; message?: string }
    return data.reply || data.message || getMockResponse(message)
  } catch {
    // Fallback to mock response
    return getMockResponse(message)
  }
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold-600 to-gold-400 flex items-center justify-center shrink-0">
        <Bot className="h-3.5 w-3.5 text-navy-950" />
      </div>
      <div className="bg-navy-800 border border-navy-700 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  return (
    <div className={cn('flex items-start gap-2', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold-600 to-gold-400 flex items-center justify-center shrink-0">
          <Bot className="h-3.5 w-3.5 text-navy-950" />
        </div>
      )}

      {/* Bubble */}
      <div
        className={cn(
          'max-w-[85%] px-4 py-2.5 rounded-2xl text-sm font-sans leading-relaxed whitespace-pre-wrap',
          isUser
            ? 'bg-gold-500/20 text-foreground border border-gold-500/25 rounded-tr-sm'
            : 'bg-navy-800 border border-navy-700 text-foreground/90 rounded-tl-sm'
        )}
      >
        {message.content}
      </div>
    </div>
  )
}

export function AIChatWidget() {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [hasNewMessage, setHasNewMessage] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const hasOpened = useRef(false)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (open && !minimized) {
      scrollToBottom()
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, minimized, messages, scrollToBottom])

  // Show notification dot after 5 seconds
  useEffect(() => {
    if (!hasOpened.current) {
      const t = setTimeout(() => setHasNewMessage(true), 5000)
      return () => clearTimeout(t)
    }
  }, [])

  const handleOpen = () => {
    setOpen(true)
    setMinimized(false)
    setHasNewMessage(false)
    hasOpened.current = true
  }

  const handleClose = () => {
    setOpen(false)
    setMinimized(false)
  }

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isTyping) return

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMsg])
      setInput('')
      setIsTyping(true)

      try {
        // Simulate natural typing delay
        const delay = Math.min(800 + trimmed.length * 10, 2500)
        await new Promise((resolve) => setTimeout(resolve, delay))
        const reply = await callAIChat(trimmed, [...messages, userMsg])
        const botMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: reply,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, botMsg])
      } catch {
        const errorMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Desculpe, tive um problema técnico. Entre em contato pelo WhatsApp: (16) 98101-0004',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMsg])
      } finally {
        setIsTyping(false)
      }
    },
    [isTyping, messages]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat Window */}
      {open && (
        <div
          className={cn(
            'w-[360px] bg-navy-950 border border-navy-800 rounded-2xl shadow-2xl shadow-black/50',
            'flex flex-col overflow-hidden',
            'transition-all duration-300 origin-bottom-right',
            minimized ? 'h-14' : 'h-[500px]',
            open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          )}
          style={{ maxWidth: 'calc(100vw - 2.5rem)' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-navy-900 to-navy-800 border-b border-navy-800 shrink-0">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-600 to-gold-400 flex items-center justify-center">
                <Bot className="h-4.5 w-4.5 text-navy-950" style={{ width: '1.125rem', height: '1.125rem' }} />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-navy-900" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground font-sans">Assistente Lemos</p>
              <p className="text-xs text-emerald-400 font-sans">Online agora</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMinimized(!minimized)}
                className="p-1.5 rounded-md text-foreground/40 hover:text-foreground hover:bg-navy-700 transition-colors"
                aria-label={minimized ? 'Expandir' : 'Minimizar'}
              >
                {minimized ? (
                  <ChevronDown className="h-4 w-4 rotate-180" />
                ) : (
                  <Minimize2 className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-md text-foreground/40 hover:text-foreground hover:bg-navy-700 transition-colors"
                aria-label="Fechar chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-track-navy-900 scrollbar-thumb-navy-700">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                {isTyping && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Replies */}
              {messages.length === 1 && !isTyping && (
                <div className="px-4 pb-2 flex flex-wrap gap-2">
                  {QUICK_REPLIES.map((reply) => (
                    <button
                      key={reply}
                      onClick={() => sendMessage(reply)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium font-sans border border-gold-500/30 text-gold-400 bg-gold-500/10 hover:bg-gold-500/20 transition-colors"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <form
                onSubmit={handleSubmit}
                className="flex items-center gap-2 px-3 py-3 border-t border-navy-800 bg-navy-900/50 shrink-0"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite uma mensagem..."
                  disabled={isTyping}
                  className={cn(
                    'flex-1 bg-navy-800 border border-navy-700 rounded-xl px-3 py-2 text-sm text-foreground',
                    'placeholder:text-foreground/30 font-sans',
                    'focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30',
                    'disabled:opacity-50 transition-colors'
                  )}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200',
                    input.trim() && !isTyping
                      ? 'bg-gold-500 text-navy-950 hover:bg-gold-400 shadow-md shadow-gold-500/20'
                      : 'bg-navy-800 text-foreground/30 cursor-not-allowed'
                  )}
                  aria-label="Enviar"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={open ? handleClose : handleOpen}
        className={cn(
          'relative w-14 h-14 rounded-full flex items-center justify-center',
          'bg-gradient-to-br from-gold-500 to-gold-600',
          'shadow-xl shadow-gold-500/30',
          'hover:from-gold-400 hover:to-gold-500',
          'hover:shadow-2xl hover:shadow-gold-500/40 hover:scale-110',
          'active:scale-95',
          'transition-all duration-200',
          'border border-gold-400/30'
        )}
        aria-label={open ? 'Fechar assistente' : 'Abrir assistente'}
      >
        {open ? (
          <X className="h-6 w-6 text-navy-950" />
        ) : (
          <MessageCircle className="h-6 w-6 text-navy-950" />
        )}
        {/* Notification dot */}
        {!open && hasNewMessage && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-[#0a0e1a] flex items-center justify-center">
            <span className="text-[9px] text-white font-bold">1</span>
          </span>
        )}
        {/* Pulse ring when closed */}
        {!open && (
          <span className="absolute inset-0 rounded-full bg-gold-400/30 animate-ping pointer-events-none" />
        )}
      </button>
    </div>
  )
}

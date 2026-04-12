'use client'

/**
 * TomasWidget — Chat flutuante com IA para site público
 *
 * Fixes aplicados para mobile/iPhone/Safari:
 * - Input com font-size 16px (text-base) para evitar auto-zoom iOS
 * - Layout com dvh + visualViewport para teclado virtual
 * - Body scroll lock quando chat está aberto
 * - Safe-area-inset-bottom respeitada
 * - Botão de microfone funcional com gravação real (MediaRecorder)
 * - Estados claros de gravação com feedback visual
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, X, Send, Mic, MicOff, Loader2, MapPin, Bed, Car, ChevronRight, AlertCircle } from 'lucide-react'
import { useBodyScrollLock } from '@/lib/use-body-scroll-lock'

// ── Types ───────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

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

interface TomasWidgetProps {
  propertyContext?: {
    propertyId?: string
    title?: string
    city?: string
    neighborhood?: string
    price?: number
    type?: string
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

// ── Quick Reply Suggestions ─────────────────────────────────────────────────

const QUICK_REPLIES = [
  { text: 'Quero comprar um imóvel', icon: '🏠' },
  { text: 'Quero alugar', icon: '🔑' },
  { text: 'Tenho interesse em leilão', icon: '⚖️' },
  { text: 'Quero agendar uma visita', icon: '📅' },
]

// ── Audio Recording States ──────────────────────────────────────────────────

type AudioState = 'idle' | 'requesting' | 'recording' | 'stopping' | 'uploading' | 'error'

// ── Component ───────────────────────────────────────────────────────────────

export default function TomasWidget({ propertyContext }: TomasWidgetProps) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [chatId, setChatId] = useState<string | null>(null)
  const [visitorId] = useState(() => `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [actions, setActions] = useState<TomasAction[]>([])
  const [shortlist, setShortlist] = useState<ShortlistItem[]>([])
  const [showQuickReplies, setShowQuickReplies] = useState(true)
  const [chatHeight, setChatHeight] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // ── Audio state ───────────────────────────────────────────────────────────
  const [audioState, setAudioState] = useState<AudioState>('idle')
  const [audioError, setAudioError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioStreamRef = useRef<MediaStream | null>(null)
  const audioTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Viewport height fix for mobile keyboard ───────────────────────────────
  useEffect(() => {
    if (!open) return

    function updateHeight() {
      // Use visualViewport when available (accounts for virtual keyboard)
      const vh = window.visualViewport?.height ?? window.innerHeight
      // On mobile, cap at full viewport minus safe-area insets (env() not available in JS,
      // so we use a conservative 50px margin that covers most notch + home indicator heights)
      const safeMargin = window.screen?.height > window.screen?.width ? 50 : 20
      setChatHeight(Math.min(vh - safeMargin, 600))
    }

    updateHeight()

    // Listen for visualViewport resize (keyboard open/close)
    const vv = window.visualViewport
    if (vv) {
      vv.addEventListener('resize', updateHeight)
      vv.addEventListener('scroll', updateHeight)
    }
    window.addEventListener('resize', updateHeight)

    return () => {
      if (vv) {
        vv.removeEventListener('resize', updateHeight)
        vv.removeEventListener('scroll', updateHeight)
      }
      window.removeEventListener('resize', updateHeight)
    }
  }, [open])

  // ── Body scroll lock (uses shared counter — safe with stacked modals) ──────
  useBodyScrollLock(open)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, shortlist])

  // Focus input when opened (with delay for mobile keyboard)
  useEffect(() => {
    if (open) {
      // Small delay to let the layout settle before focusing
      const timer = setTimeout(() => inputRef.current?.focus(), 300)
      return () => clearTimeout(timer)
    }
  }, [open])

  // Initial greeting
  useEffect(() => {
    if (open && messages.length === 0) {
      const greeting = propertyContext?.title
        ? `Olá! Sou o Tomás, da equipe AgoraEncontrei. Vi que você está olhando o "${propertyContext.title}". Posso te explicar os detalhes, comparar com opções parecidas ou já organizar uma visita. Como prefere seguir?`
        : 'Olá! Sou o Tomás, da equipe AgoraEncontrei. Posso te ajudar a encontrar imóveis, tirar dúvidas sobre documentação, financiamento ou leilões. O que você está procurando?'

      setMessages([{ role: 'assistant', content: greeting }])
    }
  }, [open, messages.length, propertyContext])

  // ── Audio cleanup on unmount ──────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopAudioStream()
      if (audioTimeoutRef.current) clearTimeout(audioTimeoutRef.current)
    }
  }, [])

  // ── Send message ──────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (prefilled?: string) => {
    const content = (prefilled ?? input).trim()
    if (!content || loading) return

    const userMsg: ChatMessage = { role: 'user', content }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput('')
    setShowQuickReplies(false)
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/api/v1/tomas/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages,
          channel: 'site',
          chatId,
          visitorId,
          propertyContext,
        }),
      })

      if (!res.ok) throw new Error('Network error')

      const data: TomasResponse = await res.json()
      if (data.chatId) setChatId(data.chatId)

      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
      setActions(data.actions || [])
      setShortlist(data.shortlist || [])
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Tive uma dificuldade aqui, mas continuo com você. Me diga novamente o que precisa.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages, chatId, visitorId, propertyContext])

  // ── Audio recording functions ─────────────────────────────────────────────

  function stopAudioStream() {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(t => t.stop())
      audioStreamRef.current = null
    }
  }

  const stopRecording = useCallback(() => {
    if (audioTimeoutRef.current) clearTimeout(audioTimeoutRef.current)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      setAudioState('stopping')
      mediaRecorderRef.current.stop()
    }
  }, [])

  const startRecording = useCallback(async () => {
    // Toggle off if already recording
    if (audioState === 'recording') {
      stopRecording()
      return
    }

    setAudioError(null)
    setAudioState('requesting')

    // Check for MediaRecorder support
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setAudioError('Seu navegador não suporta gravação de áudio.')
      setAudioState('error')
      setTimeout(() => setAudioState('idle'), 3000)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioStreamRef.current = stream
      audioChunksRef.current = []

      // Find best supported MIME type
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/ogg',
        'audio/mp4',
        '',
      ]
      const mimeType = mimeTypes.find(t =>
        !t || (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t))
      ) ?? ''

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stopAudioStream()
        setAudioState('uploading')

        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' })
          if (audioBlob.size < 100) {
            setAudioState('idle')
            return
          }

          // Determine file extension
          const ext = mimeType.includes('mp4') ? 'm4a'
            : mimeType.includes('ogg') ? 'ogg'
            : 'webm'

          const formData = new FormData()
          formData.append('audio', audioBlob, `voice.${ext}`)

          const res = await fetch(`${API_URL}/api/v1/public/voice-search`, {
            method: 'POST',
            body: formData,
          })

          if (!res.ok) {
            setAudioError('Erro ao processar o áudio. Tente novamente.')
            setAudioState('error')
            setTimeout(() => { setAudioState('idle'); setAudioError(null) }, 3000)
            return
          }

          const data = await res.json() as { transcript: string }

          if (data.transcript?.trim()) {
            // Send the transcribed text as a chat message
            sendMessage(data.transcript)
          } else {
            setAudioError('Não consegui entender o áudio. Tente novamente.')
            setAudioState('error')
            setTimeout(() => { setAudioState('idle'); setAudioError(null) }, 3000)
          }

          setAudioState('idle')
        } catch {
          setAudioError('Falha ao enviar áudio. Verifique sua conexão.')
          setAudioState('error')
          setTimeout(() => { setAudioState('idle'); setAudioError(null) }, 3000)
        }
      }

      recorder.onerror = () => {
        stopAudioStream()
        setAudioError('Erro na gravação de áudio.')
        setAudioState('error')
        setTimeout(() => { setAudioState('idle'); setAudioError(null) }, 3000)
      }

      recorder.start()
      setAudioState('recording')

      // Auto-stop after 15 seconds
      audioTimeoutRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop()
        }
      }, 15000)

    } catch (err: unknown) {
      stopAudioStream()
      const isPermission = err instanceof Error && (
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError' ||
        err.message.toLowerCase().includes('permission')
      )

      if (isPermission) {
        setAudioError('Permissão de microfone negada. Habilite nas configurações do navegador.')
      } else {
        setAudioError('Seu navegador não suporta gravação de áudio.')
      }
      setAudioState('error')
      setTimeout(() => { setAudioState('idle'); setAudioError(null) }, 4000)
    }
  }, [audioState, stopRecording, sendMessage])

  const formatPrice = (price: number | null) => {
    if (!price) return 'Consulte'
    return `R$ ${price.toLocaleString('pt-BR')}`
  }

  // ── Closed state: floating button ─────────────────────────────────────────

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed right-5 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-yellow-600 to-yellow-500 px-5 py-3.5 text-sm font-semibold text-black shadow-2xl transition-all hover:scale-105 hover:shadow-yellow-500/25"
        style={{
          bottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))',
        }}
        aria-label="Falar com Tomás"
      >
        <MessageCircle className="h-5 w-5" />
        <span>Falar com Tomás</span>
      </button>
    )
  }

  // ── Open state: chat panel ────────────────────────────────────────────────

  const isRecording = audioState === 'recording'
  const isAudioBusy = audioState === 'requesting' || audioState === 'stopping' || audioState === 'uploading'
  const isAudioError = audioState === 'error'

  return (
    <div
      ref={chatContainerRef}
      className="fixed inset-x-0 bottom-0 z-50 flex flex-col overflow-hidden rounded-t-2xl border border-gray-800 bg-gray-950 shadow-2xl sm:inset-x-auto sm:bottom-5 sm:right-5 sm:rounded-2xl sm:w-[380px]"
      style={{
        height: chatHeight ? `${chatHeight}px` : '600px',
        maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 bg-gradient-to-r from-gray-900 to-gray-950 px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 text-sm font-bold text-black">
            T
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Tomás</div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
              Especialista imobiliário
            </div>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 space-y-3 overflow-y-auto overscroll-contain p-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === 'assistant'
                  ? 'bg-gray-800/80 text-gray-100'
                  : 'bg-yellow-600 text-black'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl bg-gray-800/80 px-4 py-2.5 text-sm text-gray-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Tomás está digitando...
            </div>
          </div>
        )}

        {/* Shortlist Cards */}
        {shortlist.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="text-xs font-medium text-yellow-500/80">
              Imóveis selecionados pelo Tomás
            </div>
            {shortlist.map((item) => (
              <div
                key={item.propertyId}
                className="rounded-xl border border-gray-800 bg-gray-900/80 p-3 transition-colors hover:border-yellow-600/40"
              >
                <div className="text-sm font-medium text-white">{item.title}</div>
                <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                  <MapPin className="h-3 w-3" />
                  {item.neighborhood}{item.city ? `, ${item.city}` : ''}
                </div>
                <div className="mt-1.5 flex items-center justify-between">
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
                  <div className="mt-1.5 text-xs text-gray-500">{item.reason}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        {actions.length > 0 && !loading && (
          <div className="flex flex-wrap gap-2 pt-1">
            {actions.map((action, i) => (
              <button
                key={`${action.label}-${i}`}
                onClick={() => sendMessage(action.label)}
                className="flex items-center gap-1 rounded-full border border-gray-700 bg-gray-800/50 px-3 py-1.5 text-xs text-gray-300 transition-colors hover:border-yellow-600/50 hover:text-yellow-500"
              >
                {action.label}
                <ChevronRight className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}

        {/* Quick Replies (only on first interaction) */}
        {showQuickReplies && messages.length <= 1 && !loading && (
          <div className="space-y-1.5 pt-1">
            {QUICK_REPLIES.map((qr) => (
              <button
                key={qr.text}
                onClick={() => sendMessage(qr.text)}
                className="flex w-full items-center gap-2 rounded-xl border border-gray-800 bg-gray-900/50 px-3 py-2.5 text-left text-sm text-gray-300 transition-colors hover:border-yellow-600/40 hover:bg-gray-800"
              >
                <span>{qr.icon}</span>
                <span>{qr.text}</span>
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Audio error feedback */}
      {audioError && (
        <div className="mx-3 mb-1 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 flex-shrink-0">
          <AlertCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
          <span className="text-xs text-red-400/80">{audioError}</span>
        </div>
      )}

      {/* Recording indicator */}
      {isRecording && (
        <div className="mx-3 mb-1 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 flex-shrink-0">
          <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs text-red-400">Gravando... toque no mic para parar</span>
        </div>
      )}

      {/* Input Footer */}
      <div className="border-t border-gray-800 bg-gray-900/50 p-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          {/* Microphone button — FUNCTIONAL */}
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isAudioBusy || loading}
            className={`rounded-lg p-2 transition-all flex-shrink-0 ${
              isRecording
                ? 'bg-red-500 text-white shadow-[0_0_0_3px_rgba(239,68,68,0.3)] animate-pulse'
                : isAudioBusy
                ? 'text-gray-600 cursor-wait'
                : isAudioError
                ? 'text-red-400 hover:bg-red-500/10'
                : 'text-gray-500 hover:bg-gray-800 hover:text-yellow-500'
            }`}
            title={
              isRecording ? 'Parar gravação'
                : isAudioBusy ? 'Processando...'
                : isAudioError ? 'Erro — toque para tentar novamente'
                : 'Enviar mensagem por voz'
            }
            aria-label={isRecording ? 'Parar gravação' : 'Gravar mensagem de voz'}
          >
            {isAudioBusy
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : isRecording
              ? <MicOff className="h-4 w-4" />
              : <Mic className="h-4 w-4" />
            }
          </button>

          {/* Text input — font-size 16px to prevent iOS auto-zoom */}
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            placeholder="Digite sua mensagem..."
            className="flex-1 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-base text-white placeholder-gray-500 outline-none transition-colors focus:border-yellow-600/60"
            style={{ fontSize: '16px' }}
            disabled={loading || isRecording}
            autoComplete="off"
            autoCorrect="on"
          />

          {/* Send button */}
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim() || isRecording}
            className="rounded-lg bg-yellow-600 p-2 text-black transition-colors hover:bg-yellow-500 disabled:opacity-40 flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VoiceInputButtonProps {
  onResult: (text: string) => void
  className?: string
  dark?: boolean  // dark background variant (dashboard)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionCtor = new () => any

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
}

export function VoiceInputButton({ onResult, className, dark = false }: VoiceInputButtonProps) {
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recogRef = useRef<any>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SR) setSupported(false)
    return () => {
      recogRef.current?.abort()
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const start = useCallback(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SR) return

    const r = new SR()
    r.lang = 'pt-BR'
    r.continuous = false
    r.interimResults = false
    r.maxAlternatives = 1

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    r.onresult = (e: any) => {
      const text = e.results[0]?.[0]?.transcript ?? ''
      if (text) onResult(text)
      setListening(false)
    }

    r.onerror = () => setListening(false)
    r.onend = () => setListening(false)

    recogRef.current = r
    r.start()
    setListening(true)

    // Auto-stop after 10s
    timeoutRef.current = setTimeout(() => { r.stop() }, 10000)
  }, [onResult])

  const stop = useCallback(() => {
    recogRef.current?.stop()
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setListening(false)
  }, [])

  if (!supported) return null

  return (
    <button
      type="button"
      onClick={listening ? stop : start}
      title={listening ? 'Parar gravação' : 'Buscar por voz'}
      className={cn(
        'flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 select-none',
        listening
          ? 'bg-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.25)] animate-pulse'
          : dark
            ? 'text-white/40 hover:text-white/80 hover:bg-white/10'
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
        className,
      )}
      aria-label={listening ? 'Parar gravação de voz' : 'Gravar busca por voz'}
    >
      {listening
        ? <MicOff className="w-3.5 h-3.5 text-white" />
        : <Mic className="w-3.5 h-3.5" />
      }
    </button>
  )
}

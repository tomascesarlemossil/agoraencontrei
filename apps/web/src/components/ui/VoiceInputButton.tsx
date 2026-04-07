'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

interface VoiceInputButtonProps {
  onResult: (text: string) => void
  onFilters?: (filters: Record<string, string>) => void
  className?: string
  dark?: boolean  // dark background variant (dashboard)
}

type RecordingState = 'idle' | 'recording' | 'processing' | 'error'

/**
 * VoiceInputButton — usa MediaRecorder + Whisper (OpenAI)
 * Funciona em Safari iOS 14.3+, Chrome, Firefox, Edge e todos os navegadores modernos.
 * A antiga implementação com SpeechRecognition NÃO funciona no Safari/iOS.
 */
export function VoiceInputButton({ onResult, onFilters, className, dark = false }: VoiceInputButtonProps) {
  const [state, setState] = useState<RecordingState>('idle')
  const [supported, setSupported] = useState(true)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.MediaRecorder) {
      setSupported(false)
    }
    return () => {
      stopStream()
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  function stopStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }

  const stop = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const start = useCallback(async () => {
    if (state === 'recording') { stop(); return }

    setState('recording')
    chunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Escolher o melhor MIME type suportado pelo navegador
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/ogg',
        'audio/mp4',
        '',
      ]
      const mimeType = mimeTypes.find(t => !t || MediaRecorder.isTypeSupported(t)) ?? ''

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stopStream()
        setState('processing')

        try {
          const audioBlob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' })
          if (audioBlob.size < 100) { setState('idle'); return }

          // Determinar extensão do arquivo
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
            setState('error')
            setTimeout(() => setState('idle'), 2500)
            return
          }

          const data = await res.json() as { transcript: string; filters: Record<string, string> }

          if (data.transcript) {
            onResult(data.transcript)
            if (onFilters && data.filters && Object.keys(data.filters).length > 0) {
              onFilters(data.filters)
            }
          }

          setState('idle')
        } catch {
          setState('error')
          setTimeout(() => setState('idle'), 2500)
        }
      }

      recorder.onerror = () => {
        stopStream()
        setState('error')
        setTimeout(() => setState('idle'), 2500)
      }

      recorder.start()

      // Para automaticamente após 10 segundos
      timeoutRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop()
        }
      }, 10000)

    } catch (err: unknown) {
      stopStream()
      const isPermissionError = err instanceof Error && (
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError' ||
        err.message.toLowerCase().includes('permission')
      )
      if (isPermissionError) {
        setState('error')
        setTimeout(() => setState('idle'), 3000)
      } else {
        setSupported(false)
      }
    }
  }, [state, stop, onResult, onFilters])

  if (!supported) return null

  const isRecording = state === 'recording'
  const isProcessing = state === 'processing'
  const isError = state === 'error'

  return (
    <button
      type="button"
      onClick={isRecording ? stop : start}
      disabled={isProcessing}
      title={
        isRecording   ? 'Parar gravação' :
        isProcessing  ? 'Processando...' :
        isError       ? 'Erro — tente novamente' :
                        'Buscar por voz'
      }
      className={cn(
        'flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 select-none',
        isRecording
          ? 'bg-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.25)] animate-pulse'
          : isProcessing
          ? 'opacity-60 cursor-not-allowed'
          : isError
          ? 'bg-red-100 text-red-500'
          : dark
          ? 'text-white/40 hover:text-white/80 hover:bg-white/10'
          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
        className,
      )}
      aria-label={isRecording ? 'Parar gravação de voz' : 'Gravar busca por voz'}
    >
      {isProcessing
        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
        : isRecording
        ? <MicOff className="w-3.5 h-3.5 text-white" />
        : <Mic className="w-3.5 h-3.5" />
      }
    </button>
  )
}

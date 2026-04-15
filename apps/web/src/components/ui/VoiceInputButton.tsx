'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { Mic, MicOff, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

interface VoiceInputButtonProps {
  onResult: (text: string) => void
  onFilters?: (filters: Record<string, string>) => void
  /** Token JWT para endpoints autenticados (opcional — default é o endpoint público /voice-search). */
  token?: string | null
  /** Quando true, usa /api/v1/public/voice-search (sem auth). Default true para manter compat. */
  publicEndpoint?: boolean
  /** Se o caller quiser ser notificado de mensagem de erro para exibir em tooltip externo. */
  onError?: (msg: string) => void
  className?: string
  dark?: boolean  // dark background variant (dashboard)
}

type RecordingState = 'idle' | 'recording' | 'processing' | 'error'

// Voice Activity Detection — silence threshold and duration.
// When the RMS of the mic drops below SILENCE_RMS for SILENCE_MS ms in a
// row, we auto-stop and submit. Chosen empirically for desktop/mobile
// microphones in a moderately noisy office.
const SILENCE_RMS = 0.02
const SILENCE_MS = 1500
// Hard cap so the recorder can't run forever if the user forgets.
const MAX_RECORDING_MS = 60_000
// Minimum active speech before we even try to auto-stop — avoids
// killing a recording that hasn't really started (e.g. user is thinking).
const MIN_ACTIVE_MS = 600
// Below this blob size we assume nothing was captured and surface the
// error explicitly (old version failed silently here).
const MIN_BLOB_BYTES = 300

/**
 * VoiceInputButton — usa MediaRecorder + Whisper (OpenAI).
 *
 * Melhorias recentes:
 *  • Voice Activity Detection: quando o usuário para de falar por
 *    ~1.5s, o recorder para e envia automaticamente.
 *  • Mensagens de erro explícitas e persistentes (permissão negada,
 *    nada captado, falha no Whisper) em vez do antigo "vermelho e
 *    some em 3s sem explicação".
 *  • Timeout-duro aumentado de 10s para 60s — frases longas não são
 *    cortadas no meio.
 *  • Feedback visual do nível de áudio durante a gravação.
 *
 * Funciona em Safari iOS 14.3+, Chrome, Firefox, Edge e todos os
 * navegadores modernos. A antiga SpeechRecognition NÃO funciona
 * consistentemente no Safari/iOS.
 */
export function VoiceInputButton({
  onResult, onFilters, token, publicEndpoint = true, onError,
  className, dark = false,
}: VoiceInputButtonProps) {
  const [state, setState] = useState<RecordingState>('idle')
  const [supported, setSupported] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [level, setLevel] = useState(0) // 0-1 RMS para feedback visual

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const hardStopRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const rafRef = useRef<number | null>(null)
  const silenceStartRef = useRef<number | null>(null)
  const speakStartRef = useRef<number | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.MediaRecorder) {
      setSupported(false)
    }
    return () => {
      cleanupAll()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function cleanupAll() {
    if (hardStopRef.current) { clearTimeout(hardStopRef.current); hardStopRef.current = null }
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
    }
    silenceStartRef.current = null
    speakStartRef.current = null
  }

  const flashError = useCallback((msg: string) => {
    setErrorMsg(msg)
    setState('error')
    onError?.(msg)
    // Keep the message readable — doesn't auto-hide. Resets next time
    // the user clicks to start again.
  }, [onError])

  const stop = useCallback(() => {
    if (hardStopRef.current) { clearTimeout(hardStopRef.current); hardStopRef.current = null }
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop() } catch { /* already stopped */ }
    }
  }, [])

  const start = useCallback(async () => {
    if (state === 'recording') { stop(); return }
    if (state === 'processing') return

    // Reset error / level state before new attempt.
    setErrorMsg(null)
    setLevel(0)
    chunksRef.current = []
    silenceStartRef.current = null
    speakStartRef.current = null
    setState('recording')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } as MediaTrackConstraints,
      })
      streamRef.current = stream

      // Pick the first supported MIME; empty string = browser default.
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

      recorder.onerror = () => {
        cleanupAll()
        flashError('Erro no microfone. Tente novamente.')
      }

      recorder.onstop = async () => {
        // Para cleanup independente da causa (auto-stop, user-stop, error)
        cleanupAll()
        setState('processing')

        try {
          const audioBlob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' })
          if (audioBlob.size < MIN_BLOB_BYTES) {
            flashError('Não consegui captar áudio. Fale mais próximo do microfone e tente de novo.')
            return
          }

          const ext = mimeType.includes('mp4') ? 'm4a'
            : mimeType.includes('ogg') ? 'ogg'
            : 'webm'

          const formData = new FormData()
          formData.append('audio', audioBlob, `voice.${ext}`)

          // Public endpoint by default — homepage/Tomás public search.
          // Authenticated one is /api/v1/agents/voice, requer token no
          // header. Decidido pelo publicEndpoint prop.
          const endpoint = publicEndpoint
            ? `${API_URL}/api/v1/public/voice-search`
            : `${API_URL}/api/v1/agents/voice`
          const headers: Record<string, string> = {}
          if (!publicEndpoint && token) headers.Authorization = `Bearer ${token}`

          const res = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: formData,
          })

          if (!res.ok) {
            const payload = await res.json().catch(() => ({})) as { message?: string; error?: string }
            flashError(
              res.status === 401 ? 'Sessão expirou. Faça login novamente.' :
              res.status === 413 ? 'Áudio muito longo. Grave uma fala mais curta.' :
              payload.message || payload.error || `Falha ao processar áudio (HTTP ${res.status}).`,
            )
            return
          }

          const data = await res.json() as { transcript?: string; filters?: Record<string, string> }

          if (!data.transcript || data.transcript.trim().length === 0) {
            flashError('Não consegui entender o que foi dito. Tente falar mais devagar e mais próximo do microfone.')
            return
          }

          onResult(data.transcript)
          if (onFilters && data.filters && Object.keys(data.filters).length > 0) {
            onFilters(data.filters)
          }

          setState('idle')
        } catch (e: any) {
          flashError(e?.message ? `Erro: ${e.message}` : 'Erro ao processar áudio. Tente novamente.')
        }
      }

      recorder.start()

      // ── Voice Activity Detection ────────────────────────────────────────
      // Criamos um AudioContext + AnalyserNode paralelo só para medir o
      // nível RMS em tempo real. Se ficar abaixo de SILENCE_RMS por
      // SILENCE_MS, paramos automaticamente e enviamos — resolve o
      // pedido "reconhecer quando a pessoa acabar de falar e já
      // reproduzir a escrita e buscar automaticamente na sequência".
      try {
        const AudioCtor = (window as any).AudioContext || (window as any).webkitAudioContext
        if (AudioCtor) {
          const ctx: AudioContext = new AudioCtor()
          audioCtxRef.current = ctx
          const source = ctx.createMediaStreamSource(stream)
          const analyser = ctx.createAnalyser()
          analyser.fftSize = 1024
          source.connect(analyser)
          const buf = new Float32Array(analyser.fftSize)

          const tick = () => {
            if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') return
            analyser.getFloatTimeDomainData(buf)
            // RMS do frame atual
            let sum = 0
            for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i]
            const rms = Math.sqrt(sum / buf.length)
            setLevel(Math.min(1, rms * 4)) // escala visual

            const now = performance.now()
            if (rms > SILENCE_RMS) {
              if (speakStartRef.current == null) speakStartRef.current = now
              silenceStartRef.current = null
            } else {
              if (silenceStartRef.current == null) silenceStartRef.current = now
              const silentFor = now - silenceStartRef.current
              const hasStartedSpeaking = speakStartRef.current != null
              const spokeLongEnough = hasStartedSpeaking && (now - (speakStartRef.current ?? now)) > MIN_ACTIVE_MS
              if (spokeLongEnough && silentFor >= SILENCE_MS) {
                // User stopped speaking → stop recording.
                stop()
                return
              }
            }
            rafRef.current = requestAnimationFrame(tick)
          }
          rafRef.current = requestAnimationFrame(tick)
        }
      } catch {
        // VAD is a nice-to-have; if AudioContext fails (old browser,
        // autoplay policy) we still rely on the hard timeout below.
      }

      // Hard stop at MAX_RECORDING_MS to prevent forever-running mics.
      hardStopRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop()
        }
      }, MAX_RECORDING_MS)

    } catch (err: unknown) {
      cleanupAll()
      const e = err as { name?: string; message?: string } | undefined
      const permissionDenied = e?.name === 'NotAllowedError' || e?.name === 'PermissionDeniedError'
        || (e?.message || '').toLowerCase().includes('permission')
      const noMic = e?.name === 'NotFoundError' || (e?.message || '').toLowerCase().includes('not found')

      if (permissionDenied) {
        flashError('Permissão do microfone negada. Libere o acesso nas configurações do navegador.')
      } else if (noMic) {
        flashError('Nenhum microfone foi encontrado. Conecte um e tente novamente.')
      } else {
        setSupported(false)
      }
    }
  }, [state, stop, onResult, onFilters, flashError, token, publicEndpoint])

  if (!supported) return null

  const isRecording = state === 'recording'
  const isProcessing = state === 'processing'
  const isError = state === 'error'

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={isRecording ? stop : start}
        disabled={isProcessing}
        title={
          isRecording   ? 'Clique para parar (ou pare de falar)' :
          isProcessing  ? 'Transcrevendo áudio…' :
          isError       ? (errorMsg ?? 'Erro') :
                          'Buscar por voz'
        }
        className={cn(
          'flex-shrink-0 flex items-center justify-center w-8 h-8 min-w-[44px] min-h-[44px] rounded-full transition-all duration-200 select-none relative',
          isRecording
            ? 'bg-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.25)]'
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
        {/* Mic level indicator — shows a ring that scales with the
            current RMS so the user has feedback that the mic is
            actually capturing their voice. */}
        {isRecording && (
          <span
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              boxShadow: `0 0 0 ${Math.round(2 + level * 8)}px rgba(239,68,68,${0.15 + level * 0.3})`,
              transition: 'box-shadow 80ms linear',
            }}
            aria-hidden
          />
        )}
      </button>

      {/* Error bubble — explicit, persistent until next click. */}
      {isError && errorMsg && (
        <div
          role="status"
          className={cn(
            'absolute top-full mt-1 left-0 whitespace-normal w-64 z-30',
            'flex items-start gap-1.5 text-xs rounded-lg px-2.5 py-1.5 shadow-lg',
            dark
              ? 'bg-red-500/15 border border-red-500/40 text-red-200'
              : 'bg-red-50 border border-red-200 text-red-700',
          )}
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  )
}

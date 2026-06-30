'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

export type DictationState = 'idle' | 'recording' | 'processing' | 'error'

export interface UseLiveDictationOptions {
  /** Transcrição FINAL — uma vez, quando a pessoa termina de falar. */
  onResult: (text: string) => void
  /** Transcrição PARCIAL ao vivo — chamada continuamente enquanto fala. */
  onInterim?: (text: string) => void
  /** Filtros extraídos (só no fallback Whisper da busca). */
  onFilters?: (filters: Record<string, string>) => void
  onError?: (msg: string) => void
  token?: string | null
  publicEndpoint?: boolean
}

// VAD (fallback Whisper)
const SILENCE_RMS = 0.02
const SILENCE_MS = 1500
const MAX_RECORDING_MS = 60_000
const MIN_ACTIVE_MS = 600
const MIN_BLOB_BYTES = 300
// Modo ao vivo (Web Speech): encerra após este tempo sem novas palavras.
const LIVE_SILENCE_MS = 1600

function getSpeechRecognitionCtor(): any | null {
  if (typeof window === 'undefined') return null
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null
}

/**
 * useLiveDictation — ditado por voz com TRANSCRIÇÃO AO VIVO e custo zero.
 *
 * 1) Se o navegador suporta a Web Speech API, transcreve em tempo real
 *    (onInterim enquanto fala, onResult ao terminar). Sem backend.
 * 2) Senão, cai no MediaRecorder + Whisper (OpenAI): grava, detecta silêncio,
 *    envia e devolve o texto.
 *
 * Compartilhado por VoiceInputButton, TomasWidget e TomasCommandBar.
 */
export function useLiveDictation(opts: UseLiveDictationOptions) {
  const { onResult, onInterim, onFilters, onError, token, publicEndpoint = true } = opts

  const [state, setState] = useState<DictationState>('idle')
  const [supported, setSupported] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [level, setLevel] = useState(0)

  // callbacks sempre atualizados sem re-criar os handlers
  const cbRef = useRef(opts)
  cbRef.current = opts

  // Whisper/MediaRecorder
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const hardStopRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const rafRef = useRef<number | null>(null)
  const silenceStartRef = useRef<number | null>(null)
  const speakStartRef = useRef<number | null>(null)

  // Web Speech
  const recognitionRef = useRef<any>(null)
  const liveFinalRef = useRef('')
  const liveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const liveGotSpeechRef = useRef(false)

  const cleanupAll = useCallback(() => {
    if (hardStopRef.current) { clearTimeout(hardStopRef.current); hardStopRef.current = null }
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
    if (audioCtxRef.current) { audioCtxRef.current.close().catch(() => {}); audioCtxRef.current = null }
    silenceStartRef.current = null
    speakStartRef.current = null
  }, [])

  const cleanupLive = useCallback(() => {
    if (liveTimerRef.current) { clearTimeout(liveTimerRef.current); liveTimerRef.current = null }
    if (recognitionRef.current) {
      try { recognitionRef.current.onresult = null; recognitionRef.current.onerror = null; recognitionRef.current.onend = null } catch { /* noop */ }
      try { recognitionRef.current.abort() } catch { /* noop */ }
      recognitionRef.current = null
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.MediaRecorder && !getSpeechRecognitionCtor()) {
      setSupported(false)
    }
    return () => { cleanupAll(); cleanupLive() }
  }, [cleanupAll, cleanupLive])

  const flashError = useCallback((msg: string) => {
    setErrorMsg(msg)
    setState('error')
    cbRef.current.onError?.(msg)
  }, [])

  // ── Fallback Whisper ────────────────────────────────────────────────────────
  const stopWhisper = useCallback(() => {
    if (hardStopRef.current) { clearTimeout(hardStopRef.current); hardStopRef.current = null }
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop() } catch { /* já parou */ }
    }
  }, [])

  const startWhisper = useCallback(async () => {
    setErrorMsg(null); setLevel(0)
    chunksRef.current = []; silenceStartRef.current = null; speakStartRef.current = null
    setState('recording')

    if (typeof window === 'undefined' || !window.MediaRecorder) {
      flashError('Seu navegador não suporta gravação de voz. Você pode digitar normalmente.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } as MediaTrackConstraints,
      })
      streamRef.current = stream
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg', 'audio/mp4', '']
      const mimeType = mimeTypes.find(t => !t || MediaRecorder.isTypeSupported(t)) ?? ''
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onerror = () => { cleanupAll(); flashError('Erro no microfone. Tente novamente.') }
      recorder.onstop = async () => {
        cleanupAll(); setState('processing')
        try {
          const audioBlob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' })
          if (audioBlob.size < MIN_BLOB_BYTES) { flashError('Não consegui captar áudio. Fale mais próximo do microfone e tente de novo.'); return }
          const ext = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'webm'
          const formData = new FormData()
          formData.append('audio', audioBlob, `voice.${ext}`)
          const endpoint = publicEndpoint ? `${API_URL}/api/v1/public/voice-search` : `${API_URL}/api/v1/agents/voice`
          const headers: Record<string, string> = {}
          if (!publicEndpoint && token) headers.Authorization = `Bearer ${token}`
          const res = await fetch(endpoint, { method: 'POST', headers, body: formData })
          if (!res.ok) {
            const payload = await res.json().catch(() => ({})) as { message?: string; error?: string }
            flashError(
              res.status === 401 ? 'Sessão expirou. Faça login novamente.' :
              res.status === 413 ? 'Áudio muito longo. Grave uma fala mais curta.' :
              payload.message || payload.error || `Falha ao processar áudio (HTTP ${res.status}).`,
            )
            return
          }
          const data = await res.json() as { transcript?: string; filters?: Record<string, string>; reason?: string }
          if (!data.transcript || !data.transcript.trim()) {
            flashError(data.reason === 'not_configured'
              ? 'Busca por voz indisponível no momento. Você pode digitar normalmente.'
              : 'Não consegui entender o que foi dito. Tente falar mais devagar e mais próximo do microfone.')
            return
          }
          cbRef.current.onResult(data.transcript)
          if (cbRef.current.onFilters && data.filters && Object.keys(data.filters).length > 0) cbRef.current.onFilters(data.filters)
          setState('idle')
        } catch (e: any) {
          flashError(e?.message ? `Erro: ${e.message}` : 'Erro ao processar áudio. Tente novamente.')
        }
      }
      recorder.start()

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
            let sum = 0
            for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i]
            const rms = Math.sqrt(sum / buf.length)
            setLevel(Math.min(1, rms * 4))
            const now = performance.now()
            if (rms > SILENCE_RMS) {
              if (speakStartRef.current == null) speakStartRef.current = now
              silenceStartRef.current = null
            } else {
              if (silenceStartRef.current == null) silenceStartRef.current = now
              const silentFor = now - silenceStartRef.current
              const spokeLongEnough = speakStartRef.current != null && (now - (speakStartRef.current ?? now)) > MIN_ACTIVE_MS
              if (spokeLongEnough && silentFor >= SILENCE_MS) { stopWhisper(); return }
            }
            rafRef.current = requestAnimationFrame(tick)
          }
          rafRef.current = requestAnimationFrame(tick)
        }
      } catch { /* VAD opcional */ }

      hardStopRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
      }, MAX_RECORDING_MS)
    } catch (err: unknown) {
      cleanupAll()
      const e = err as { name?: string; message?: string } | undefined
      const permissionDenied = e?.name === 'NotAllowedError' || e?.name === 'PermissionDeniedError' || (e?.message || '').toLowerCase().includes('permission')
      const noMic = e?.name === 'NotFoundError' || (e?.message || '').toLowerCase().includes('not found')
      if (permissionDenied) flashError('Permissão do microfone negada. Libere o acesso nas configurações do navegador.')
      else if (noMic) flashError('Nenhum microfone foi encontrado. Conecte um e tente novamente.')
      else flashError('Não foi possível iniciar a gravação. Tente novamente.')
    }
  }, [cleanupAll, flashError, publicEndpoint, stopWhisper, token])

  // ── Modo ao vivo (Web Speech) ───────────────────────────────────────────────
  const stopLive = useCallback(() => {
    if (liveTimerRef.current) { clearTimeout(liveTimerRef.current); liveTimerRef.current = null }
    if (recognitionRef.current) { try { recognitionRef.current.stop() } catch { /* já parou */ } }
  }, [])

  const startLive = useCallback((SR: any): boolean => {
    let recognition: any
    try { recognition = new SR() } catch { return false }
    recognition.lang = 'pt-BR'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognitionRef.current = recognition
    liveFinalRef.current = ''
    liveGotSpeechRef.current = false
    setErrorMsg(null); setState('recording')

    const armSilenceTimer = () => {
      if (liveTimerRef.current) clearTimeout(liveTimerRef.current)
      liveTimerRef.current = setTimeout(() => { stopLive() }, LIVE_SILENCE_MS)
    }

    recognition.onresult = (e: any) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        const txt = r[0]?.transcript ?? ''
        if (r.isFinal) liveFinalRef.current += txt
        else interim += txt
      }
      liveGotSpeechRef.current = true
      const live = (liveFinalRef.current + interim).replace(/\s+/g, ' ').trim()
      if (live) cbRef.current.onInterim?.(live)
      armSilenceTimer()
    }
    recognition.onerror = (e: any) => {
      const err = e?.error
      if (err === 'not-allowed' || err === 'service-not-allowed') {
        cleanupLive(); flashError('Permissão do microfone negada. Libere o acesso nas configurações do navegador.'); return
      }
      if (err === 'no-speech') return
      if ((err === 'network' || err === 'audio-capture') && !liveGotSpeechRef.current) {
        cleanupLive(); void startWhisper(); return
      }
    }
    recognition.onend = () => {
      const text = liveFinalRef.current.replace(/\s+/g, ' ').trim()
      cleanupLive()
      if (text) { cbRef.current.onResult(text); setState('idle') }
      else if (liveGotSpeechRef.current) setState('idle')
      else flashError('Não consegui entender o que foi dito. Fale mais perto do microfone e tente de novo.')
    }
    try { recognition.start(); return true } catch { cleanupLive(); return false }
  }, [cleanupLive, flashError, startWhisper, stopLive])

  // ── API pública do hook ─────────────────────────────────────────────────────
  const start = useCallback(() => {
    if (state === 'recording') { stopLive(); stopWhisper(); return }
    if (state === 'processing') return
    setErrorMsg(null)
    const SR = getSpeechRecognitionCtor()
    if (SR && startLive(SR)) return
    void startWhisper()
  }, [state, startLive, startWhisper, stopLive, stopWhisper])

  const stop = useCallback(() => { stopLive(); stopWhisper() }, [stopLive, stopWhisper])

  return {
    state, supported, errorMsg, level,
    isRecording: state === 'recording',
    isProcessing: state === 'processing',
    isError: state === 'error',
    start, stop,
  }
}

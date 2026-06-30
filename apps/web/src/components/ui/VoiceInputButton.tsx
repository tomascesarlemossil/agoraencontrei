'use client'
import { Mic, MicOff, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLiveDictation } from './useLiveDictation'

interface VoiceInputButtonProps {
  /** Transcrição FINAL — chamada uma vez quando o usuário termina de falar. */
  onResult: (text: string) => void
  /** Transcrição PARCIAL ao vivo — chamada continuamente enquanto a pessoa fala
   *  (modo Web Speech). Use para mostrar o texto em tempo real no input. */
  onInterim?: (text: string) => void
  onFilters?: (filters: Record<string, string>) => void
  token?: string | null
  publicEndpoint?: boolean
  onError?: (msg: string) => void
  className?: string
  dark?: boolean
}

/**
 * VoiceInputButton — botão de microfone com TRANSCRIÇÃO AO VIVO (custo zero).
 * Usa Web Speech API (tempo real) quando disponível, com fallback Whisper.
 * Toda a lógica fica em useLiveDictation (compartilhado com Tomás chat/copilot).
 */
export function VoiceInputButton({
  onResult, onInterim, onFilters, token, publicEndpoint = true, onError, className, dark = false,
}: VoiceInputButtonProps) {
  const { supported, errorMsg, level, isRecording, isProcessing, isError, start, stop } = useLiveDictation({
    onResult, onInterim, onFilters, onError, token, publicEndpoint,
  })

  if (!supported) return null

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
                          'Falar (transcrição ao vivo)'
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
        {isRecording && (
          <span
            className="absolute inset-0 rounded-full pointer-events-none animate-pulse"
            style={{
              boxShadow: `0 0 0 ${Math.round(2 + level * 8)}px rgba(239,68,68,${0.15 + level * 0.3})`,
              transition: 'box-shadow 80ms linear',
            }}
            aria-hidden
          />
        )}
      </button>

      {isError && errorMsg && (
        <div
          role="status"
          className={cn(
            'absolute top-full mt-1 left-0 whitespace-normal w-64 z-30',
            'flex items-start gap-1.5 text-xs rounded-lg px-2.5 py-1.5 shadow-lg',
            dark ? 'bg-red-500/15 border border-red-500/40 text-red-200' : 'bg-red-50 border border-red-200 text-red-700',
          )}
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  )
}

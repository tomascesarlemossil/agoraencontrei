'use client'

import { useState, useEffect, useRef } from 'react'
import { Sparkles, X, Loader2, ChevronDown, Image as ImageIcon, ExternalLink } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

interface Props {
  propertySlug: string
  images: string[]
  title: string
}

type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'

const STYLES = [
  { value: 'moderno',     label: 'Moderno' },
  { value: 'rustico',     label: 'Rústico' },
  { value: 'minimalista', label: 'Minimalista' },
  { value: 'classico',    label: 'Clássico' },
  { value: 'industrial',  label: 'Industrial' },
]

export function AIVisualPublicButton({ propertySlug, images, title }: Props) {
  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState('')
  const [style, setStyle] = useState('moderno')
  const [selectedImageUrl, setSelectedImageUrl] = useState(images[0] ?? '')
  const [loading, setLoading] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [outputUrl, setOutputUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [whatsappFallback, setWhatsappFallback] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Stop polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  // Start polling when we have a jobId
  useEffect(() => {
    if (!jobId) return

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/ai-visual/public/jobs/${jobId}`)
        if (!res.ok) {
          if (res.status === 404) {
            clearInterval(pollRef.current!)
            setWhatsappFallback(true)
            setLoading(false)
          }
          return
        }
        const data = await res.json()
        const status: JobStatus = data.status

        if (status === 'completed' && data.outputUrl) {
          clearInterval(pollRef.current!)
          setOutputUrl(data.outputUrl)
          setLoading(false)
        } else if (status === 'failed') {
          clearInterval(pollRef.current!)
          setError('Não foi possível gerar a imagem. Tente novamente ou use o WhatsApp.')
          setLoading(false)
        }
      } catch {
        // keep polling
      }
    }, 3000)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [jobId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) return

    setLoading(true)
    setError(null)
    setOutputUrl(null)
    setWhatsappFallback(false)
    setJobId(null)

    try {
      const res = await fetch(`${API_URL}/api/v1/ai-visual/public/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          style,
          propertySlug,
          imageUrl: selectedImageUrl || images[0] || undefined,
        }),
      })

      if (!res.ok) {
        if (res.status === 404) {
          setWhatsappFallback(true)
          setLoading(false)
          return
        }
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `Erro ${res.status}`)
      }

      const data = await res.json()
      if (data.jobId) {
        setJobId(data.jobId)
        // polling will start via useEffect
      } else if (data.outputUrl) {
        setOutputUrl(data.outputUrl)
        setLoading(false)
      } else {
        setWhatsappFallback(true)
        setLoading(false)
      }
    } catch (err: any) {
      if (err.message?.includes('fetch') || err.message?.includes('network')) {
        setWhatsappFallback(true)
      } else {
        setError(err.message || 'Erro ao processar. Tente novamente.')
      }
      setLoading(false)
    }
  }

  function handleClose() {
    setOpen(false)
    setDescription('')
    setOutputUrl(null)
    setError(null)
    setWhatsappFallback(false)
    setJobId(null)
    setLoading(false)
    if (pollRef.current) clearInterval(pollRef.current)
  }

  const waLink = `https://wa.me/5516981010004?text=${encodeURIComponent(`Quero visualizar uma reforma do imóvel ${propertySlug}`)}`

  return (
    <>
      {/* ── Floating Button ────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl shadow-2xl font-bold text-sm transition-all hover:scale-105 hover:brightness-110 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #C9A84C, #e8c66a)',
          color: '#1B2B5B',
          boxShadow: '0 8px 32px rgba(201,168,76,0.45)',
        }}
        aria-label="Visualizar reforma com IA"
      >
        <Sparkles className="h-4 w-4 flex-shrink-0" />
        <span>Visualizar com IA</span>
      </button>

      {/* ── Modal Overlay ─────────────────────────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <div
            className="relative z-10 w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-6 pb-4" style={{ borderBottom: '1px solid #ede9df' }}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-5 w-5" style={{ color: '#C9A84C' }} />
                  <h2 className="text-xl font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
                    Visualize sua reforma com IA
                  </h2>
                </div>
                <p className="text-sm text-gray-500">
                  Descreva como você gostaria de transformar este imóvel
                </p>
              </div>
              <button
                onClick={handleClose}
                className="ml-4 p-1.5 rounded-xl text-gray-500 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Image thumbnails */}
              {images.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Selecione uma foto como base:
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {images.slice(0, 8).map((url, i) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => setSelectedImageUrl(url)}
                        className="flex-shrink-0 rounded-xl overflow-hidden transition-all hover:scale-105"
                        style={{
                          width: 72,
                          height: 56,
                          outline: selectedImageUrl === url ? `3px solid #C9A84C` : '3px solid transparent',
                          outlineOffset: 2,
                        }}
                        aria-label={`Foto ${i + 1}`}
                      >
                        <img src={url} alt={`Foto ${i + 1} do imóvel`} className="w-full h-full object-cover" loading="lazy" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Result */}
              {outputUrl && (
                <div className="rounded-2xl overflow-hidden border-2" style={{ borderColor: '#C9A84C' }}>
                  <img src={outputUrl} alt="Visualização gerada por IA" loading="lazy" className="w-full object-cover" />
                  <div className="px-4 py-3 text-center space-y-3" style={{ backgroundColor: '#fffdf9' }}>
                    <p className="text-sm font-semibold" style={{ color: '#1B2B5B' }}>
                      Imagem gerada com sucesso!
                    </p>
                    <a
                      href="#contato"
                      onClick={handleClose}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-110"
                      style={{ background: 'linear-gradient(135deg, #C9A84C, #e8c66a)', color: '#1B2B5B' }}
                    >
                      Gostou? Agende uma visita!
                    </a>
                  </div>
                </div>
              )}

              {/* WhatsApp Fallback */}
              {whatsappFallback && (
                <div className="rounded-2xl p-5 text-center space-y-3" style={{ backgroundColor: '#f0fff4', border: '1px solid #86efac' }}>
                  <p className="text-sm text-gray-700 font-medium">
                    Nosso gerador de imagens está em configuração.
                  </p>
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                    style={{ backgroundColor: '#25D366' }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    Solicite pelo WhatsApp
                  </a>
                </div>
              )}

              {/* Form (hide when result shown) */}
              {!outputUrl && !whatsappFallback && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Description */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                      Descrição da reforma ou decoração *
                    </label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      rows={4}
                      required
                      placeholder="Descreva a reforma ou decoração desejada... Ex: quero um quarto moderno com paredes cinza, cama king, iluminação LED embutida e closet planejado."
                      className="w-full rounded-xl border px-4 py-3 text-sm text-gray-800 placeholder:text-gray-500 resize-none focus:outline-none focus:ring-2 transition-all"
                      style={{ borderColor: '#ddd9d0' }}
                      onFocus={e => (e.target.style.borderColor = '#C9A84C')}
                      onBlur={e => (e.target.style.borderColor = '#ddd9d0')}
                    />
                  </div>

                  {/* Style select */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                      Estilo
                    </label>
                    <div className="relative">
                      <select
                        value={style}
                        onChange={e => setStyle(e.target.value)}
                        className="w-full appearance-none rounded-xl border px-4 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 pr-10"
                        style={{ borderColor: '#ddd9d0' }}
                      >
                        {STYLES.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading || !description.trim()}
                    className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg, #C9A84C, #e8c66a)', color: '#1B2B5B' }}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {jobId ? 'Gerando imagem...' : 'Enviando...'}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Gerar Imagem IA
                      </>
                    )}
                  </button>

                  {loading && jobId && (
                    <p className="text-xs text-center text-gray-500">
                      Isso pode levar até 30 segundos. Por favor aguarde...
                    </p>
                  )}
                </form>
              )}

              {/* After result, show re-generate option */}
              {(outputUrl || whatsappFallback) && (
                <button
                  type="button"
                  onClick={() => { setOutputUrl(null); setWhatsappFallback(null as any); setDescription(''); setJobId(null) }}
                  className="w-full py-2.5 rounded-xl border text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                  style={{ borderColor: '#ddd9d0' }}
                >
                  Tentar novamente
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

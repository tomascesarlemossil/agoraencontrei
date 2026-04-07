'use client'

import { useState } from 'react'
import { Instagram, Eye, CheckCircle2, XCircle, Loader2, Share2 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

function getToken() {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('access_token') ?? ''
}

interface PreviewData {
  caption: string
  hashtags: string
  fullCaption: string
  charCount: number
  coverImage: string | null
  canPost: boolean
}

interface PostResult {
  success: boolean
  permalink?: string
  error?: string
}

export function SocialPostPanel({ propertyId }: { propertyId: string }) {
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [posting, setPosting] = useState<string | null>(null)
  const [result, setResult] = useState<PostResult | null>(null)

  async function loadPreview() {
    setLoadingPreview(true)
    try {
      const res = await fetch(`${API_URL}/api/v1/social/post/preview/${propertyId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      const data = await res.json()
      setPreview(data)
    } catch {
      // ignore
    } finally {
      setLoadingPreview(false)
    }
  }

  async function post(account: 'lemos' | 'tomas') {
    setPosting(account)
    setResult(null)
    try {
      const res = await fetch(`${API_URL}/api/v1/social/post/property/${propertyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ account }),
      })
      const data = await res.json()
      setResult({ success: data.success, permalink: data.permalink, error: data.error ?? data.message })
    } catch {
      setResult({ success: false, error: 'Erro de conexão' })
    } finally {
      setPosting(null)
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden mt-6">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
        <Share2 className="w-5 h-5" style={{ color: '#C9A84C' }} />
        <div>
          <h3 className="font-bold text-white text-sm">Publicar nas Redes Sociais</h3>
          <p className="text-white/40 text-xs mt-0.5">Gere legenda com IA e publique no Instagram</p>
        </div>
      </div>

      <div className="p-5">
        {/* Preview button */}
        {!preview && (
          <button
            onClick={loadPreview}
            disabled={loadingPreview}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-white/10 text-white/70 hover:text-white hover:border-white/30 transition-all disabled:opacity-50"
          >
            {loadingPreview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
            {loadingPreview ? 'Gerando com IA...' : 'Gerar Legenda com IA'}
          </button>
        )}

        {/* Preview card */}
        {preview && (
          <div className="space-y-4">
            <div className="flex gap-4">
              {preview.coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.coverImage} alt="Capa" className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/40 mb-1">Legenda gerada pela IA:</p>
                <p className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">{preview.caption}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <p className="text-xs text-white/40 mb-1">Hashtags ({preview.charCount} caracteres total):</p>
              <p className="text-xs text-blue-400 leading-relaxed">{preview.hashtags}</p>
            </div>

            {/* Post buttons */}
            {preview.canPost ? (
              <div className="flex gap-3">
                <button
                  onClick={() => post('lemos')}
                  disabled={!!posting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #E1306C, #833AB4)', color: 'white' }}
                >
                  {posting === 'lemos' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Instagram className="w-4 h-4" />}
                  @imobiliarialemos
                </button>
                <button
                  onClick={() => post('tomas')}
                  disabled={!!posting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #833AB4, #405DE6)', color: 'white' }}
                >
                  {posting === 'tomas' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Instagram className="w-4 h-4" />}
                  @tomaslemosbr
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-xl text-xs text-yellow-400 border border-yellow-400/20" style={{ backgroundColor: 'rgba(255,200,0,0.05)' }}>
                ⚠️ Configure INSTAGRAM_BUSINESS_ACCOUNT_ID e INSTAGRAM_PAGE_ACCESS_TOKEN no Railway para publicar.
              </div>
            )}

            {/* Result */}
            {result && (
              <div
                className={`flex items-center gap-3 p-3 rounded-xl text-sm ${result.success ? 'text-green-400' : 'text-red-400'}`}
                style={{ backgroundColor: result.success ? 'rgba(0,200,0,0.08)' : 'rgba(255,0,0,0.08)' }}
              >
                {result.success ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <XCircle className="w-4 h-4 flex-shrink-0" />}
                {result.success ? (
                  <span>
                    Publicado!{' '}
                    {result.permalink && (
                      <a href={result.permalink} target="_blank" rel="noopener noreferrer" className="underline">
                        Ver post →
                      </a>
                    )}
                  </span>
                ) : (
                  <span>{result.error}</span>
                )}
              </div>
            )}

            <button
              onClick={() => { setPreview(null); setResult(null) }}
              className="text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              Regenerar legenda
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

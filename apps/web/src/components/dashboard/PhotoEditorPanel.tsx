'use client'
/**
 * PhotoEditorPanel — Painel de edição automática de fotos de imóveis
 *
 * Funcionalidades:
 * - Seletor visual de filtros (Efeito 1, 2, 3 + importados)
 * - Preview em tempo real ao selecionar filtro
 * - Aplicar filtro em 1 foto ou em todas
 * - Opção de aplicar logo da imobiliária
 * - Posição do logo configurável
 */
import { useState, useCallback, useRef } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import {
  Wand2, Loader2, CheckCircle2, X, Upload, Trash2,
  ChevronLeft, ChevronRight, Layers, Image as ImageIcon,
  Sparkles, AlertCircle, Download, RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Filter {
  id: string
  name: string
  description: string
  source: 'builtin' | 'imported'
}

interface PhotoEditorPanelProps {
  propertyId: string
  photos: string[]
  onPhotosUpdated: (newPhotos: string[]) => void
  onClose: () => void
}

// ── API helpers ───────────────────────────────────────────────────────────────
async function fetchFilters(token: string): Promise<Filter[]> {
  const res = await fetch(`${API_URL}/api/v1/photo-editor/filters`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Microserviço de imagens indisponível')
  const data = await res.json()
  return data.filters
}

async function fetchPreview(
  token: string,
  imageUrl: string,
  filterId: string,
  applyLogo: boolean,
  logoPosition: string,
): Promise<string> {
  const res = await fetch(`${API_URL}/api/v1/photo-editor/preview`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_url: imageUrl,
      filter_id: filterId,
      apply_logo: applyLogo,
      logo_position: logoPosition,
      preview_width: 800,
    }),
  })
  if (!res.ok) throw new Error('Erro ao gerar preview')
  const data = await res.json()
  return data.preview // base64 data URL
}

async function processImages(
  token: string,
  imageUrls: string[],
  filterId: string,
  applyLogo: boolean,
  logoPosition: string,
): Promise<Array<{ index: number; url: string; result: string }>> {
  const res = await fetch(`${API_URL}/api/v1/photo-editor/process/batch`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_urls: imageUrls,
      filter_id: filterId,
      apply_logo: applyLogo,
      logo_position: logoPosition,
      output_quality: 92,
    }),
  })
  if (!res.ok) throw new Error('Erro ao processar imagens')
  const data = await res.json()
  return data.results
}

// ── Component ─────────────────────────────────────────────────────────────────
export function PhotoEditorPanel({ propertyId, photos, onPhotosUpdated, onClose }: PhotoEditorPanelProps) {
  const token = useAuthStore(s => s.accessToken)

  // Estado
  const [selectedFilterId, setSelectedFilterId] = useState<string | null>(null)
  const [previewPhotoIndex, setPreviewPhotoIndex] = useState(0)
  const [previewData, setPreviewData] = useState<string | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [applyLogo, setApplyLogo] = useState(true)
  const [logoPosition, setLogoPosition] = useState('bottom-right')
  const [processing, setProcessing] = useState(false)
  const [processedCount, setProcessedCount] = useState(0)
  const [processedResults, setProcessedResults] = useState<Array<{ index: number; result: string }>>([])
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'select' | 'preview' | 'done'>('select')
  const dngInputRef = useRef<HTMLInputElement>(null)
  const [importingFilter, setImportingFilter] = useState(false)

  // Carregar filtros
  const { data: filters = [], isLoading: loadingFilters, refetch: refetchFilters } = useQuery({
    queryKey: ['photo-filters'],
    queryFn: () => fetchFilters(token!),
    enabled: !!token,
  })

  // Selecionar filtro e gerar preview
  const handleSelectFilter = useCallback(async (filterId: string) => {
    if (!token || photos.length === 0) return
    setSelectedFilterId(filterId)
    setPreviewData(null)
    setLoadingPreview(true)
    setError(null)
    try {
      const preview = await fetchPreview(
        token,
        photos[previewPhotoIndex],
        filterId,
        applyLogo,
        logoPosition,
      )
      setPreviewData(preview)
      setStep('preview')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoadingPreview(false)
    }
  }, [token, photos, previewPhotoIndex, applyLogo, logoPosition])

  // Mudar foto de preview
  const handleChangePreviewPhoto = useCallback(async (idx: number) => {
    if (!token || !selectedFilterId) return
    setPreviewPhotoIndex(idx)
    setPreviewData(null)
    setLoadingPreview(true)
    try {
      const preview = await fetchPreview(token, photos[idx], selectedFilterId, applyLogo, logoPosition)
      setPreviewData(preview)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoadingPreview(false)
    }
  }, [token, photos, selectedFilterId, applyLogo, logoPosition])

  // Atualizar preview quando logo/posição mudar
  const handleRefreshPreview = useCallback(async () => {
    if (!token || !selectedFilterId || photos.length === 0) return
    setPreviewData(null)
    setLoadingPreview(true)
    try {
      const preview = await fetchPreview(token, photos[previewPhotoIndex], selectedFilterId, applyLogo, logoPosition)
      setPreviewData(preview)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoadingPreview(false)
    }
  }, [token, photos, previewPhotoIndex, selectedFilterId, applyLogo, logoPosition])

  // Aplicar em 1 foto
  const handleApplyOne = useCallback(async () => {
    if (!token || !selectedFilterId) return
    setProcessing(true)
    setError(null)
    try {
      const results = await processImages(token, [photos[previewPhotoIndex]], selectedFilterId, applyLogo, logoPosition)
      if (results.length > 0) {
        // Substituir a foto processada na lista
        const newPhotos = [...photos]
        // Converter base64 para upload e obter URL
        const base64 = results[0].result
        // Fazer upload da imagem processada
        const blob = await fetch(base64).then(r => r.blob())
        const formData = new FormData()
        formData.append('file', blob, `edited_${Date.now()}.jpg`)
        const uploadRes = await fetch(`${API_URL}/api/v1/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        })
        if (uploadRes.ok) {
          const { url } = await uploadRes.json()
          newPhotos[previewPhotoIndex] = url
          onPhotosUpdated(newPhotos)
          setProcessedCount(1)
          setStep('done')
        }
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setProcessing(false)
    }
  }, [token, photos, previewPhotoIndex, selectedFilterId, applyLogo, logoPosition, onPhotosUpdated])

  // Aplicar em todas as fotos
  const handleApplyAll = useCallback(async () => {
    if (!token || !selectedFilterId) return
    setProcessing(true)
    setProcessedCount(0)
    setError(null)
    try {
      const results = await processImages(token, photos, selectedFilterId, applyLogo, logoPosition)
      const newPhotos = [...photos]
      let count = 0
      for (const result of results) {
        const base64 = result.result
        const blob = await fetch(base64).then(r => r.blob())
        const formData = new FormData()
        formData.append('file', blob, `edited_${Date.now()}_${result.index}.jpg`)
        const uploadRes = await fetch(`${API_URL}/api/v1/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        })
        if (uploadRes.ok) {
          const { url } = await uploadRes.json()
          newPhotos[result.index] = url
          count++
          setProcessedCount(count)
        }
      }
      onPhotosUpdated(newPhotos)
      setStep('done')
      setProcessedCount(count)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setProcessing(false)
    }
  }, [token, photos, selectedFilterId, applyLogo, logoPosition, onPhotosUpdated])

  // Importar filtro DNG
  const handleImportDng = useCallback(async (file: File) => {
    if (!token) return
    setImportingFilter(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('filter_name', file.name.replace('.dng', ''))
      const res = await fetch(`${API_URL}/api/v1/photo-editor/import-filter`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (!res.ok) throw new Error('Erro ao importar filtro')
      await refetchFilters()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setImportingFilter(false)
    }
  }, [token, refetchFilters])

  const currentPhoto = photos[previewPhotoIndex]

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1a2744] border border-white/10 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-400/10 rounded-xl">
              <Wand2 className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Editor de Fotos</h2>
              <p className="text-white/50 text-xs">{photos.length} foto{photos.length !== 1 ? 's' : ''} disponíveis</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X className="h-5 w-5 text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {step === 'done' ? (
            /* ── Concluído ─────────────────────────────────────────────── */
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="p-4 bg-emerald-500/20 rounded-full">
                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              </div>
              <h3 className="text-white text-xl font-bold">Fotos editadas com sucesso!</h3>
              <p className="text-white/60 text-sm text-center">
                {processedCount} foto{processedCount !== 1 ? 's' : ''} processada{processedCount !== 1 ? 's' : ''} com o filtro <strong className="text-yellow-400">{filters.find(f => f.id === selectedFilterId)?.name}</strong>
              </p>
              <div className="flex gap-3 mt-4">
                <button onClick={() => { setStep('select'); setSelectedFilterId(null); setPreviewData(null) }}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition-colors">
                  Aplicar outro filtro
                </button>
                <button onClick={onClose}
                  className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-[#1B2B5B] rounded-xl text-sm font-bold transition-colors">
                  Concluir
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ── Coluna esquerda: seletor de filtros ──────────────────── */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-3">
                    Escolha um Filtro
                  </h3>
                  {loadingFilters ? (
                    <div className="flex items-center gap-2 text-white/40 text-sm py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando filtros...
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filters.map(filter => (
                        <button
                          key={filter.id}
                          onClick={() => handleSelectFilter(filter.id)}
                          disabled={loadingPreview}
                          className={cn(
                            'w-full text-left px-4 py-3 rounded-xl border transition-all',
                            selectedFilterId === filter.id
                              ? 'bg-yellow-400/10 border-yellow-400/50 text-white'
                              : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white',
                            loadingPreview && selectedFilterId !== filter.id && 'opacity-50 cursor-not-allowed',
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <Sparkles className={cn('h-3.5 w-3.5', selectedFilterId === filter.id ? 'text-yellow-400' : 'text-white/40')} />
                                <span className="text-sm font-semibold">{filter.name}</span>
                                {filter.source === 'imported' && (
                                  <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">importado</span>
                                )}
                              </div>
                              <p className="text-xs text-white/40 mt-0.5 ml-5.5">{filter.description}</p>
                            </div>
                            {selectedFilterId === filter.id && loadingPreview && (
                              <Loader2 className="h-4 w-4 text-yellow-400 animate-spin flex-shrink-0" />
                            )}
                            {selectedFilterId === filter.id && !loadingPreview && previewData && (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Opções de logo */}
                <div className="bg-white/5 rounded-xl p-4 space-y-3">
                  <h4 className="text-white/70 text-xs font-semibold uppercase tracking-wider">Logo da Imobiliária</h4>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className={cn(
                      'w-10 h-5 rounded-full transition-colors relative',
                      applyLogo ? 'bg-yellow-400' : 'bg-white/20',
                    )} onClick={() => { setApplyLogo(v => !v); if (selectedFilterId) setTimeout(handleRefreshPreview, 100) }}>
                      <div className={cn(
                        'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
                        applyLogo ? 'translate-x-5' : 'translate-x-0.5',
                      )} />
                    </div>
                    <span className="text-sm text-white/70">Aplicar logo nas fotos</span>
                  </label>
                  {applyLogo && (
                    <div>
                      <label className="text-xs text-white/50 mb-1.5 block">Posição do logo</label>
                      <select
                        value={logoPosition}
                        onChange={e => { setLogoPosition(e.target.value); if (selectedFilterId) setTimeout(handleRefreshPreview, 100) }}
                        className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400/50"
                      >
                        <option value="bottom-right">Inferior direito</option>
                        <option value="bottom-left">Inferior esquerdo</option>
                        <option value="top-right">Superior direito</option>
                        <option value="top-left">Superior esquerdo</option>
                        <option value="center">Centro</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Importar novo filtro DNG */}
                <div className="bg-white/5 rounded-xl p-4">
                  <h4 className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-2">Importar Filtro DNG</h4>
                  <p className="text-white/40 text-xs mb-3">Importe predefinições do Lightroom (.dng) para adicionar novos filtros.</p>
                  <button
                    onClick={() => dngInputRef.current?.click()}
                    disabled={importingFilter}
                    className="flex items-center gap-2 text-xs text-white/60 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {importingFilter ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    {importingFilter ? 'Importando...' : 'Selecionar arquivo .dng'}
                  </button>
                  <input
                    ref={dngInputRef}
                    type="file"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && handleImportDng(e.target.files[0])}
                  />
                </div>
              </div>

              {/* ── Coluna direita: preview ───────────────────────────────── */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white/70 text-xs font-semibold uppercase tracking-wider">
                      Preview
                    </h3>
                    {photos.length > 1 && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleChangePreviewPhoto(Math.max(0, previewPhotoIndex - 1))}
                          disabled={previewPhotoIndex === 0 || loadingPreview}
                          className="p-1 hover:bg-white/10 rounded-lg disabled:opacity-30 transition-colors"
                        >
                          <ChevronLeft className="h-4 w-4 text-white/60" />
                        </button>
                        <span className="text-xs text-white/40">{previewPhotoIndex + 1}/{photos.length}</span>
                        <button
                          onClick={() => handleChangePreviewPhoto(Math.min(photos.length - 1, previewPhotoIndex + 1))}
                          disabled={previewPhotoIndex === photos.length - 1 || loadingPreview}
                          className="p-1 hover:bg-white/10 rounded-lg disabled:opacity-30 transition-colors"
                        >
                          <ChevronRight className="h-4 w-4 text-white/60" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Área de preview */}
                  <div className="relative rounded-xl overflow-hidden bg-black/30 aspect-video">
                    {/* Foto original (fundo) */}
                    {currentPhoto && (
                      <img
                        src={currentPhoto}
                        alt="Original"
                        className={cn(
                          'w-full h-full object-cover transition-opacity duration-300',
                          previewData ? 'opacity-0' : 'opacity-100',
                        )}
                      />
                    )}
                    {/* Preview com filtro */}
                    {previewData && (
                      <img
                        src={previewData}
                        alt="Preview com filtro"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                    {/* Loading overlay */}
                    {loadingPreview && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 text-yellow-400 animate-spin" />
                          <span className="text-white/70 text-xs">Gerando preview...</span>
                        </div>
                      </div>
                    )}
                    {/* Placeholder */}
                    {!currentPhoto && !loadingPreview && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-white/30">
                          <ImageIcon className="h-10 w-10 mx-auto mb-2" />
                          <p className="text-sm">Nenhuma foto disponível</p>
                        </div>
                      </div>
                    )}
                    {/* Label */}
                    {previewData && !loadingPreview && (
                      <div className="absolute top-2 left-2 bg-yellow-400 text-[#1B2B5B] text-[10px] font-bold px-2 py-1 rounded-lg">
                        Preview: {filters.find(f => f.id === selectedFilterId)?.name}
                      </div>
                    )}
                    {!previewData && !loadingPreview && currentPhoto && (
                      <div className="absolute top-2 left-2 bg-white/20 text-white text-[10px] font-semibold px-2 py-1 rounded-lg">
                        Original
                      </div>
                    )}
                  </div>

                  {/* Instrução */}
                  {!selectedFilterId && (
                    <p className="text-white/40 text-xs text-center mt-2">
                      ← Selecione um filtro para ver o preview
                    </p>
                  )}
                </div>

                {/* Erro */}
                {error && (
                  <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                    <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-400 text-xs font-semibold">Erro</p>
                      <p className="text-red-400/70 text-xs">{error}</p>
                      {error.includes('indisponível') && (
                        <p className="text-red-400/50 text-xs mt-1">
                          Certifique-se de que o microserviço de imagens está rodando na porta 3200.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Botões de ação */}
                {selectedFilterId && previewData && !processing && (
                  <div className="space-y-2">
                    <button
                      onClick={handleApplyOne}
                      className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl text-sm font-semibold transition-colors"
                    >
                      <ImageIcon className="h-4 w-4" />
                      Aplicar nesta foto
                    </button>
                    <button
                      onClick={handleApplyAll}
                      className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-[#1B2B5B] py-3 rounded-xl text-sm font-bold transition-colors"
                    >
                      <Layers className="h-4 w-4" />
                      Aplicar em todas as {photos.length} fotos
                    </button>
                  </div>
                )}

                {/* Progresso do processamento */}
                {processing && (
                  <div className="bg-white/5 rounded-xl p-4 text-center space-y-2">
                    <Loader2 className="h-6 w-6 text-yellow-400 animate-spin mx-auto" />
                    <p className="text-white/70 text-sm font-semibold">Processando fotos...</p>
                    <p className="text-white/40 text-xs">{processedCount}/{photos.length} concluídas</p>
                    <div className="w-full bg-white/10 rounded-full h-1.5">
                      <div
                        className="bg-yellow-400 h-1.5 rounded-full transition-all"
                        style={{ width: `${(processedCount / photos.length) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

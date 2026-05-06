'use client'

/**
 * Video Editor — dashboard page (Nível Máximo plan).
 *
 * UI flow:
 *   1) Pick clips + (optional) audio → POST /projects to get presigned PUT URLs.
 *   2) Upload each file directly to S3 via presigned URL.
 *   3) POST /projects/:id/render with chosen preset/transition/resolution.
 *   4) Poll GET /projects/:id every 5s until DONE.
 *   5) Show "Baixar vídeo" button → GET /projects/:id/download → window.open.
 *
 * Server-side rendering, B-roll generation and caption styling all happen on
 * the API. This page is intentionally lean — it's the contract surface.
 */
import { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

interface Preset {
  id: string
  name: string
  description: string
  niche: string
}
interface Transition  { id: string; name: string }
interface Resolution  { id: '1080p'|'2k'|'4k'; label: string }

type Status = 'PENDING'|'UPLOADED'|'PROCESSING'|'DONE'|'ERROR'|'EXPIRED'
interface JobStatus {
  id: string
  status: Status
  errorMsg: string | null
  durationSec: number | null
  fileSizeBytes: number | null
  resolution: string
  outputFormat: string
  creditsUsed: number
  expiresAt: string | null
}

export default function VideoEditorPage() {
  const { accessToken } = useAuthStore()
  const auth = useMemo(() => ({ Authorization: `Bearer ${accessToken}` }), [accessToken])

  // ── Catalog ──
  const [presets, setPresets]           = useState<Preset[]>([])
  const [transitions, setTransitions]   = useState<Transition[]>([])
  const [resolutions, setResolutions]   = useState<Resolution[]>([])

  // ── User selections ──
  const [clipFiles, setClipFiles]       = useState<File[]>([])
  const [audioFile, setAudioFile]       = useState<File | null>(null)
  const [audioSource, setAudioSource]   = useState<'upload'|'extracted_from_video'|'none'>('none')
  const [presetId, setPresetId]         = useState<string>('social-reels-fast')
  const [transitionId, setTransitionId] = useState<string>('cut')
  const [resolution, setResolution]     = useState<'1080p'|'2k'|'4k'>('1080p')
  const [outputFormat, setOutputFormat] = useState<'mp4'|'mov'|'webm'>('mp4')
  const [captionsEnabled, setCaptionsEnabled] = useState(true)
  const [brollEnabled, setBrollEnabled]       = useState(false)
  const [brollPrompt, setBrollPrompt]         = useState('')

  // ── Job state ──
  const [job, setJob]           = useState<JobStatus | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  // ── Load catalog once ──
  useEffect(() => {
    if (!accessToken) return
    fetch(`${API_URL}/api/v1/video-editor/catalog`, { headers: auth })
      .then(r => r.json())
      .then(d => {
        setPresets(d.presets ?? [])
        setTransitions(d.transitions ?? [])
        setResolutions(d.resolutions ?? [])
      })
      .catch(() => setError('Falha ao carregar catálogo do editor.'))
  }, [accessToken, auth])

  // ── Poll job status ──
  useEffect(() => {
    if (!job?.id || job.status === 'DONE' || job.status === 'ERROR' || job.status === 'EXPIRED') return
    const t = setInterval(async () => {
      const r = await fetch(`${API_URL}/api/v1/video-editor/projects/${job.id}`, { headers: auth })
      if (!r.ok) return
      setJob(await r.json())
    }, 5000)
    return () => clearInterval(t)
  }, [job, auth])

  async function handleSubmit() {
    if (clipFiles.length === 0) { setError('Selecione ao menos 1 vídeo.'); return }
    setLoading(true); setError(null); setDownloadUrl(null)
    try {
      // 1) Create draft + obtain presigned PUT URLs
      type UploadIntent = { filename: string; contentType: string; kind: 'input' | 'audio' }
      const uploads: UploadIntent[] = clipFiles.map(f => ({
        filename: f.name, contentType: f.type || 'video/mp4', kind: 'input',
      }))
      if (audioFile) uploads.push({ filename: audioFile.name, contentType: audioFile.type || 'audio/mpeg', kind: 'audio' })

      const draftRes = await fetch(`${API_URL}/api/v1/video-editor/projects`, {
        method: 'POST',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploads }),
      })
      if (!draftRes.ok) throw new Error('Falha ao criar projeto')
      const { jobId, uploads: signed } = await draftRes.json() as {
        jobId: string
        uploads: Array<{ key: string; url: string; filename: string; kind: 'input'|'audio' }>
      }

      // 2) Upload each file directly to S3
      const inputClips: Array<{ key: string; label?: string }> = []
      let audioKey: string | undefined
      for (let i = 0; i < signed.length; i++) {
        const slot = signed[i]
        const file = slot.kind === 'audio' ? audioFile! : clipFiles[i]
        const put = await fetch(slot.url, {
          method: 'PUT',
          headers: { 'Content-Type': file.type || (slot.kind === 'audio' ? 'audio/mpeg' : 'video/mp4') },
          body: file,
        })
        if (!put.ok) throw new Error(`Falha no upload de ${slot.filename}`)
        if (slot.kind === 'audio') audioKey = slot.key
        else inputClips.push({ key: slot.key, label: slot.filename })
      }

      // 3) Render
      const renderRes = await fetch(`${API_URL}/api/v1/video-editor/projects/${jobId}/render`, {
        method: 'POST',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputClips,
          audioKey,
          audioSource,
          presetId,
          transitionId,
          resolution,
          outputFormat,
          captionsEnabled,
          captionsLanguage: 'pt-BR',
          brollEnabled,
          brollPrompts: brollEnabled && brollPrompt ? [{ promptText: brollPrompt, durationSec: 5, atSec: 0 }] : undefined,
        }),
      })
      if (!renderRes.ok) throw new Error('Falha ao iniciar render')
      const j = await renderRes.json()
      setJob({ id: j.id, status: j.status, errorMsg: null, durationSec: null, fileSizeBytes: null, resolution, outputFormat, creditsUsed: 0, expiresAt: null })
    } catch (e: any) {
      setError(e.message ?? String(e))
    } finally {
      setLoading(false)
    }
  }

  async function handleDownload() {
    if (!job?.id) return
    const r = await fetch(`${API_URL}/api/v1/video-editor/projects/${job.id}/download`, { headers: auth })
    if (!r.ok) { setError('Não foi possível obter o link de download.'); return }
    const { url } = await r.json() as { url: string }
    setDownloadUrl(url)
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Editor de Vídeo IA</h1>
        <p className="text-sm text-muted-foreground">
          Edite vídeos automaticamente com presets, transições e legendas. Disponível no plano Nível Máximo.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle>1. Mídia</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Vídeos (até 20 clipes, qualquer formato)</label>
            <input
              type="file"
              accept="video/*"
              multiple
              onChange={(e) => setClipFiles(Array.from(e.target.files ?? []))}
              className="block w-full text-sm"
            />
            {clipFiles.length > 0 && <p className="text-xs text-muted-foreground mt-1">{clipFiles.length} clipe(s) selecionado(s)</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Áudio (opcional)</label>
            <select
              value={audioSource}
              onChange={(e) => setAudioSource(e.target.value as any)}
              className="border rounded px-2 py-1 text-sm mb-2"
            >
              <option value="none">Sem áudio adicional</option>
              <option value="upload">Subir arquivo de áudio</option>
              <option value="extracted_from_video">Extrair áudio de outro vídeo</option>
            </select>
            {audioSource !== 'none' && (
              <input
                type="file"
                accept={audioSource === 'extracted_from_video' ? 'video/*' : 'audio/*'}
                onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm"
              />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>2. Estilo</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">Preset</label>
            <select value={presetId} onChange={(e) => setPresetId(e.target.value)} className="border rounded px-2 py-1 text-sm w-full">
              {presets.map(p => <option key={p.id} value={p.id}>{p.name} — {p.niche}</option>)}
            </select>
            <p className="text-xs text-muted-foreground mt-1">{presets.find(p => p.id === presetId)?.description}</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Transição</label>
            <select value={transitionId} onChange={(e) => setTransitionId(e.target.value)} className="border rounded px-2 py-1 text-sm w-full">
              {transitions.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Resolução</label>
            <select value={resolution} onChange={(e) => setResolution(e.target.value as any)} className="border rounded px-2 py-1 text-sm w-full">
              {resolutions.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Formato de saída</label>
            <select value={outputFormat} onChange={(e) => setOutputFormat(e.target.value as any)} className="border rounded px-2 py-1 text-sm w-full">
              <option value="mp4">MP4</option>
              <option value="mov">MOV</option>
              <option value="webm">WebM</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>3. Recursos IA</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={captionsEnabled} onChange={(e) => setCaptionsEnabled(e.target.checked)} />
            Legendas automáticas (PT-BR, com fala palavra-a-palavra)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={brollEnabled} onChange={(e) => setBrollEnabled(e.target.checked)} />
            Gerar B-roll por IA (Luma Ray 2 — cobra créditos extras)
          </label>
          {brollEnabled && (
            <input
              type="text"
              placeholder="Descreva a cena que a IA deve gerar (ex: drone shot over a beach at sunset)"
              value={brollPrompt}
              onChange={(e) => setBrollPrompt(e.target.value)}
              className="border rounded px-2 py-1 text-sm w-full"
            />
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSubmit} disabled={loading || clipFiles.length === 0}>
          {loading ? 'Enviando…' : 'Editar e renderizar'}
        </Button>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>

      {job && (
        <Card>
          <CardHeader><CardTitle>Status do render</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>ID: <code className="text-xs">{job.id}</code></div>
            <div>Status: <strong>{job.status}</strong></div>
            {job.errorMsg && <div className="text-red-600">Erro: {job.errorMsg}</div>}
            {job.creditsUsed > 0 && <div>Créditos usados: {job.creditsUsed}</div>}
            {job.status === 'DONE' && (
              <div className="pt-2">
                <Button onClick={handleDownload}>Baixar vídeo</Button>
                {downloadUrl && (
                  <p className="text-xs text-muted-foreground mt-2">
                    O link expira em {new Date(job.expiresAt ?? Date.now()).toLocaleString('pt-BR')}.
                    Após o download, o arquivo é removido do servidor automaticamente.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

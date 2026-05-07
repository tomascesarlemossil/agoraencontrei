'use client'

/**
 * Video Editor — dashboard page (Nível Máximo plan).
 *
 * Flow:
 *   1) Pick clips + (optional) audio + (optional) logo.
 *   2) Try presigned PUT for each file. On any failure (CORS, expired, bucket
 *      unconfigured) automatically fall back to POST /projects/:id/upload
 *      which streams through the API. The partner doesn't need to know.
 *   3) Pick preset / transition / resolution / format. CSS preview thumbnails
 *      give a real-time hint of the look without rendering.
 *   4) Optional: click "Pré-visualizar" to render a 480p version that does
 *      NOT consume the daily quota and skips B-roll/captions for speed.
 *   5) Click "Editar e renderizar" for the full render. Polling until DONE.
 *   6) Download via signed URL → file purged from S3 24h later.
 */
import { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Upload, Play, Download, RefreshCw, AlertCircle, Image as ImageIcon,
  Eye, Loader2, CheckCircle, Music,
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

interface Preset {
  id:           string
  name:         string
  description:  string
  niche:        string
  previewColor: string
  cssPreview:   string
}
interface Transition  { id: string; name: string; description: string; icon: string }
interface Resolution  { id: '1080p'|'2k'|'4k'; label: string }

type Status = 'PENDING'|'UPLOADED'|'PROCESSING'|'DONE'|'ERROR'|'EXPIRED'
interface JobStatus {
  id:           string
  status:       Status
  errorMsg:     string | null
  durationSec:  number | null
  fileSizeBytes: number | null
  resolution:   string
  outputFormat: string
  creditsUsed:  number
  expiresAt:    string | null
  previewMode?: boolean
}

interface Diagnostics {
  ffmpeg:        string
  s3VideoBucket: boolean
  assemblyaiKey: boolean
  lumaKey:       boolean
  renderQueue:   boolean
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
  const [logoFile, setLogoFile]         = useState<File | null>(null)
  const [logoEnabled, setLogoEnabled]   = useState(false)
  const [logoPosition, setLogoPosition] = useState<'bottom-right'|'bottom-left'|'top-right'|'top-left'>('bottom-right')
  const [logoSize, setLogoSize]         = useState(10)
  const [logoOpacity, setLogoOpacity]   = useState(0.85)

  const [presetId, setPresetId]         = useState<string>('social-reels-fast')
  const [transitionId, setTransitionId] = useState<string>('cut')
  const [resolution, setResolution]     = useState<'1080p'|'2k'|'4k'>('1080p')
  const [outputFormat, setOutputFormat] = useState<'mp4'|'mov'|'webm'>('mp4')
  const [captionsEnabled, setCaptionsEnabled] = useState(true)

  const [brollEnabled, setBrollEnabled]       = useState(false)
  type BrollPrompt = { promptText: string; durationSec: number; atSec: number }
  const [brollPrompts, setBrollPrompts]       = useState<BrollPrompt[]>([
    { promptText: '', durationSec: 5, atSec: 0 },
  ])

  // ── Job state ──
  const [job, setJob]                     = useState<JobStatus | null>(null)
  const [previewUrl, setPreviewUrl]       = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl]     = useState<string | null>(null)
  const [progress, setProgress]           = useState<string>('')
  const [error, setError]                 = useState<string | null>(null)
  const [busy, setBusy]                   = useState<'preview'|'render'|null>(null)

  const [quota, setQuota]                 = useState<{ dailyRemaining: number; dailyLimit: number; brollRemaining: number } | null>(null)
  const [diag, setDiag]                   = useState<Diagnostics | null>(null)

  // ── Load catalog + quota + diagnostics ──
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
    fetch(`${API_URL}/api/v1/video-editor/quota`, { headers: auth })
      .then(async r => r.ok ? r.json() : null).then(setQuota).catch(() => {})
    fetch(`${API_URL}/api/v1/video-editor/diagnostics`, { headers: auth })
      .then(async r => r.ok ? r.json() : null).then(setDiag).catch(() => {})
  }, [accessToken, auth])

  // ── Poll job status ──
  useEffect(() => {
    if (!job?.id || job.status === 'DONE' || job.status === 'ERROR' || job.status === 'EXPIRED') return
    const t = setInterval(async () => {
      const r = await fetch(`${API_URL}/api/v1/video-editor/projects/${job.id}`, { headers: auth })
      if (!r.ok) return
      const data = await r.json()
      setJob({ ...data, previewMode: job.previewMode })
      // Auto-resolve download once DONE
      if (data.status === 'DONE') {
        const dl = await fetch(`${API_URL}/api/v1/video-editor/projects/${job.id}/download`, { headers: auth })
        if (dl.ok) {
          const { url } = await dl.json() as { url: string }
          if (job.previewMode) setPreviewUrl(url)
          else setDownloadUrl(url)
        }
      }
    }, 4000)
    return () => clearInterval(t)
  }, [job, auth])

  /** Upload one file: presigned PUT first, then server-relay fallback. */
  async function uploadOne(jobId: string, file: File, kind: 'input'|'audio'|'logo'): Promise<string> {
    // Try presigned PUT
    const draft = await fetch(`${API_URL}/api/v1/video-editor/projects`, {
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ uploads: [{ filename: file.name, contentType: file.type || 'video/mp4', kind }] }),
    })
    // The /projects endpoint creates a NEW job — use it only for the very
    // first upload of a session. For follow-up files (audio/logo on the same
    // job) we skip straight to server-relay so we don't fragment jobs.
    if (jobId === '__new__' && draft.ok) {
      const { jobId: newId, uploads } = await draft.json() as { jobId: string; uploads: { url: string; key: string }[] }
      try {
        const put = await fetch(uploads[0].url, {
          method: 'PUT',
          headers: { 'Content-Type': file.type || 'video/mp4' },
          body: file,
        })
        if (!put.ok) throw new Error(`S3 PUT ${put.status}`)
        ;(globalThis as any).__videoEditorJobId = newId
        return uploads[0].key
      } catch {
        // Fall through to server-relay using the just-created jobId
        return relayUpload(newId, file, kind)
      }
    }
    return relayUpload(jobId, file, kind)
  }

  async function relayUpload(jobId: string, file: File, kind: 'input'|'audio'|'logo'): Promise<string> {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('kind', kind)
    const res = await fetch(`${API_URL}/api/v1/video-editor/projects/${jobId}/upload`, {
      method: 'POST', headers: auth, body: fd,
    })
    if (!res.ok) {
      const msg = await res.text().catch(() => '')
      throw new Error(`Upload falhou (${res.status}): ${msg.slice(0, 120)}`)
    }
    const { key } = await res.json() as { key: string }
    return key
  }

  async function startRender(previewMode: boolean) {
    if (clipFiles.length === 0) { setError('Selecione ao menos 1 vídeo.'); return }
    setBusy(previewMode ? 'preview' : 'render')
    setError(null)
    setPreviewUrl(null)
    if (!previewMode) setDownloadUrl(null)

    try {
      // 1) Create draft job and upload first clip (gets us a jobId)
      setProgress(`Enviando clipe 1/${clipFiles.length}…`)
      const firstKey = await uploadOne('__new__', clipFiles[0], 'input')
      const jobId = (globalThis as any).__videoEditorJobId as string
      if (!jobId) throw new Error('Não foi possível criar o projeto no servidor')
      const inputClips: { key: string; label?: string }[] = [{ key: firstKey, label: clipFiles[0].name }]

      // 2) Upload remaining clips
      for (let i = 1; i < clipFiles.length; i++) {
        setProgress(`Enviando clipe ${i + 1}/${clipFiles.length}…`)
        const k = await uploadOne(jobId, clipFiles[i], 'input')
        inputClips.push({ key: k, label: clipFiles[i].name })
      }

      // 3) Audio
      let audioKey: string | undefined
      if (audioFile && audioSource === 'upload') {
        setProgress('Enviando áudio…')
        audioKey = await uploadOne(jobId, audioFile, 'audio')
      } else if (audioFile && audioSource === 'extracted_from_video') {
        setProgress('Extraindo áudio do vídeo…')
        const fd = new FormData()
        fd.append('file', audioFile)
        const r = await fetch(`${API_URL}/api/v1/video-editor/extract-audio`, {
          method: 'POST', headers: auth, body: fd,
        })
        if (!r.ok) throw new Error('Falha ao extrair áudio')
        audioKey = (await r.json() as { key: string }).key
      }

      // 4) Logo
      let logoKey: string | undefined
      if (logoEnabled && logoFile) {
        setProgress('Enviando logo…')
        logoKey = await uploadOne(jobId, logoFile, 'logo')
      }

      // 5) Render
      setProgress(previewMode ? 'Gerando prévia (480p)…' : 'Iniciando renderização…')
      const renderRes = await fetch(`${API_URL}/api/v1/video-editor/projects/${jobId}/render`, {
        method: 'POST',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputClips,
          audioKey,
          audioSource: audioFile ? audioSource : 'none',
          presetId,
          transitionId,
          resolution,
          outputFormat,
          captionsEnabled,
          captionsLanguage: 'pt-BR',
          brollEnabled,
          brollPrompts: brollEnabled
            ? brollPrompts.filter(p => p.promptText.trim().length > 0)
            : undefined,
          logo: logoEnabled && logoKey ? {
            enabled: true, key: logoKey, position: logoPosition,
            sizePercent: logoSize, opacity: logoOpacity,
          } : undefined,
          previewMode,
        }),
      })
      if (!renderRes.ok) {
        const msg = await renderRes.json().catch(() => ({})) as any
        throw new Error(msg.message || msg.error || `Falha (${renderRes.status})`)
      }
      const j = await renderRes.json()
      setJob({
        id: j.id, status: j.status, errorMsg: null,
        durationSec: null, fileSizeBytes: null,
        resolution, outputFormat, creditsUsed: 0, expiresAt: null,
        previewMode,
      })
      setProgress('Aguardando worker processar…')

      // Refresh quota for non-preview
      if (!previewMode) {
        fetch(`${API_URL}/api/v1/video-editor/quota`, { headers: auth })
          .then(r => r.ok ? r.json() : null).then(setQuota).catch(() => {})
      }
    } catch (e: any) {
      setError(e?.message ?? String(e))
    } finally {
      setBusy(null)
      setProgress('')
    }
  }

  const selectedPreset = presets.find(p => p.id === presetId)
  const selectedTransition = transitions.find(t => t.id === transitionId)

  // ── Setup status banner ───────────────────────────────────────────────
  const setupIssues: string[] = []
  if (diag && !diag.s3VideoBucket) setupIssues.push('Bucket S3 não configurado — uploads não vão funcionar até o admin definir AWS_S3_VIDEO_BUCKET.')
  if (diag && !diag.renderQueue)   setupIssues.push('Fila de render indisponível — REDIS_URL precisa estar configurado.')
  if (diag && diag.ffmpeg === 'NOT_AVAILABLE') setupIssues.push('FFmpeg ausente no servidor — render não vai funcionar.')

  return (
    <div className="space-y-6 p-6 max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Editor de Vídeo IA</h1>
          <p className="text-sm text-muted-foreground">
            Edite vídeos automaticamente com presets, transições, legendas e logo.
          </p>
        </div>
        {quota && (
          <div className="text-xs border rounded-lg px-4 py-2 bg-card">
            <div className="font-semibold">{quota.dailyRemaining} / {quota.dailyLimit} renders hoje</div>
            <div className="text-muted-foreground">{quota.brollRemaining} créditos B-roll</div>
          </div>
        )}
      </div>

      {setupIssues.length > 0 && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-700 mt-0.5 shrink-0" />
              <div className="text-sm text-amber-900 dark:text-amber-100 space-y-1">
                <strong>Configuração pendente:</strong>
                <ul className="list-disc pl-5">
                  {setupIssues.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── 1. Mídia ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" />1. Mídia</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Vídeos (até 20 clipes, qualquer formato)</label>
            <input
              type="file"
              accept="video/*"
              multiple
              onChange={(e) => setClipFiles(Array.from(e.target.files ?? []))}
              className="block w-full text-sm border rounded-md p-2"
            />
            {clipFiles.length > 0 && (
              <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                {clipFiles.map((f, i) => (
                  <div key={i} className="border rounded px-2 py-1 truncate">
                    <span className="font-mono">#{i + 1}</span> {f.name}
                    <span className="text-muted-foreground"> ({(f.size/1024/1024).toFixed(1)} MB)</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Music className="h-4 w-4" /> Áudio (opcional)
            </label>
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
                className="block w-full text-sm border rounded-md p-2"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── 2. Estilo ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader><CardTitle>2. Estilo</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Preset</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {presets.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPresetId(p.id)}
                  className={cn(
                    'text-left border rounded-lg overflow-hidden transition',
                    presetId === p.id ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50',
                  )}
                >
                  <div
                    className="h-16 w-full"
                    style={{ background: `linear-gradient(135deg, ${p.previewColor}, ${p.previewColor}aa)`, filter: p.cssPreview }}
                  />
                  <div className="p-2 bg-card">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="text-[10px] text-muted-foreground capitalize">{p.niche.replace('_', ' ')}</div>
                  </div>
                </button>
              ))}
            </div>
            {selectedPreset && <p className="text-xs text-muted-foreground mt-2">{selectedPreset.description}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Transição entre clipes</label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {transitions.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTransitionId(t.id)}
                  title={t.description}
                  className={cn(
                    'text-center border rounded-lg px-2 py-3 transition',
                    transitionId === t.id ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50',
                  )}
                >
                  <div className="text-xs font-medium">{t.name}</div>
                </button>
              ))}
            </div>
            {selectedTransition && <p className="text-xs text-muted-foreground mt-2">{selectedTransition.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Resolução</label>
              <select value={resolution} onChange={(e) => setResolution(e.target.value as any)} className="border rounded px-2 py-1 text-sm w-full">
                {resolutions.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Formato</label>
              <select value={outputFormat} onChange={(e) => setOutputFormat(e.target.value as any)} className="border rounded px-2 py-1 text-sm w-full">
                <option value="mp4">MP4</option>
                <option value="mov">MOV</option>
                <option value="webm">WebM</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 3. Logo ───────────────────────────────────────────────────── */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5" />3. Logo (opcional)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={logoEnabled} onChange={(e) => setLogoEnabled(e.target.checked)} />
            Inserir logo da imobiliária em todos os frames
          </label>
          {logoEnabled && (
            <div className="space-y-3 border-l-2 border-primary pl-3">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm border rounded-md p-2"
              />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs">Posição</label>
                  <select value={logoPosition} onChange={(e) => setLogoPosition(e.target.value as any)} className="border rounded px-2 py-1 text-sm w-full">
                    <option value="bottom-right">Inferior direita</option>
                    <option value="bottom-left">Inferior esquerda</option>
                    <option value="top-right">Superior direita</option>
                    <option value="top-left">Superior esquerda</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs">Tamanho ({logoSize}%)</label>
                  <input type="range" min={2} max={40} value={logoSize}
                    onChange={(e) => setLogoSize(Number(e.target.value))}
                    className="w-full" />
                </div>
                <div>
                  <label className="block text-xs">Opacidade ({logoOpacity.toFixed(2)})</label>
                  <input type="range" min={0} max={1} step={0.05} value={logoOpacity}
                    onChange={(e) => setLogoOpacity(Number(e.target.value))}
                    className="w-full" />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 4. Recursos IA ────────────────────────────────────────────── */}
      <Card>
        <CardHeader><CardTitle>4. Recursos IA</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={captionsEnabled} onChange={(e) => setCaptionsEnabled(e.target.checked)} />
            Legendas automáticas (PT-BR, palavra-a-palavra)
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={brollEnabled} onChange={(e) => setBrollEnabled(e.target.checked)} />
            Gerar B-roll por IA (Luma Ray 2 — cobra créditos extras)
          </label>
          {brollEnabled && (
            <div className="space-y-3 border-l-2 border-amber-300 pl-3">
              <p className="text-xs text-muted-foreground">
                Cada segundo gerado custa 1 crédito. Disponível: <strong>{quota?.brollRemaining ?? 0}</strong>.
              </p>
              {brollPrompts.map((p, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-7">
                    <label className="block text-xs">Prompt {i + 1}</label>
                    <input type="text" placeholder="ex: aerial drone shot of a beach at sunset"
                      value={p.promptText}
                      onChange={(e) => {
                        const next = [...brollPrompts]; next[i] = { ...next[i], promptText: e.target.value }; setBrollPrompts(next)
                      }}
                      className="border rounded px-2 py-1 text-sm w-full" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs">Duração</label>
                    <select value={p.durationSec}
                      onChange={(e) => {
                        const next = [...brollPrompts]; next[i] = { ...next[i], durationSec: Number(e.target.value) }; setBrollPrompts(next)
                      }}
                      className="border rounded px-2 py-1 text-sm w-full">
                      <option value={5}>5s</option>
                      <option value={10}>10s</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs">atSec</label>
                    <input type="number" min={0} step={1} value={p.atSec}
                      onChange={(e) => {
                        const next = [...brollPrompts]; next[i] = { ...next[i], atSec: Number(e.target.value) }; setBrollPrompts(next)
                      }}
                      className="border rounded px-2 py-1 text-sm w-full" />
                  </div>
                  <div className="col-span-1">
                    <Button type="button" variant="outline" size="sm"
                      onClick={() => setBrollPrompts(brollPrompts.filter((_, j) => j !== i))}
                      disabled={brollPrompts.length <= 1}>−</Button>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm"
                onClick={() => setBrollPrompts([...brollPrompts, { promptText: '', durationSec: 5, atSec: 0 }])}
              >+ Adicionar prompt</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Action bar ─────────────────────────────────────────────── */}
      <div className="sticky bottom-0 -mx-6 px-6 py-3 bg-background/95 backdrop-blur border-t">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={() => startRender(true)}
            disabled={!!busy || clipFiles.length === 0}
          >
            {busy === 'preview' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
            Pré-visualizar (480p, grátis)
          </Button>
          <Button
            onClick={() => startRender(false)}
            disabled={!!busy || clipFiles.length === 0}
          >
            {busy === 'render' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
            Editar e renderizar ({resolution.toUpperCase()})
          </Button>
          {progress && <span className="text-xs text-muted-foreground">{progress}</span>}
          {error && (
            <span className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {error}
            </span>
          )}
        </div>
      </div>

      {/* ── Render result ─────────────────────────────────────────── */}
      {job && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {job.status === 'DONE' ? <CheckCircle className="h-5 w-5 text-green-600" /> : <Loader2 className="h-5 w-5 animate-spin" />}
              {job.previewMode ? 'Prévia' : 'Render final'} — {job.status}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {job.errorMsg && (
              <div className="p-3 rounded bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-200">
                <strong>Erro:</strong> {job.errorMsg}
              </div>
            )}
            {job.creditsUsed > 0 && <div>Créditos consumidos: <strong>{job.creditsUsed}</strong></div>}
            {job.durationSec != null && <div>Duração: <strong>{job.durationSec}s</strong></div>}

            {previewUrl && job.previewMode && (
              <div className="space-y-2">
                <video src={previewUrl} controls className="w-full max-h-96 rounded border" />
                <p className="text-xs text-muted-foreground">
                  Esta é uma prévia em 480p. Não consumiu créditos. Se gostar, clique em <strong>Editar e renderizar</strong> para gerar a versão final em {resolution.toUpperCase()}.
                </p>
              </div>
            )}

            {downloadUrl && !job.previewMode && (
              <div className="space-y-2">
                <video src={downloadUrl} controls className="w-full max-h-96 rounded border" />
                <Button asChild>
                  <a href={downloadUrl} target="_blank" rel="noreferrer">
                    <Download className="h-4 w-4 mr-2" /> Baixar vídeo
                  </a>
                </Button>
                <p className="text-xs text-muted-foreground">
                  Link expira em {new Date(job.expiresAt ?? Date.now()).toLocaleString('pt-BR')}.
                  Após o download, o arquivo é removido do servidor automaticamente.
                </p>
              </div>
            )}

            {(job.status === 'PROCESSING' || job.status === 'UPLOADED' || job.status === 'PENDING') && (
              <Button variant="outline" size="sm" onClick={() => {
                fetch(`${API_URL}/api/v1/video-editor/projects/${job.id}`, { headers: auth })
                  .then(r => r.json()).then(d => setJob({ ...d, previewMode: job.previewMode })).catch(() => {})
              }}>
                <RefreshCw className="h-4 w-4 mr-2" /> Atualizar status
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import {
  Sparkles, FileText, Download, Printer, Image as ImageIcon, X,
  ChevronRight, Loader2, Camera, CheckCircle2, AlertCircle,
  PanelRightClose, PanelRightOpen, Wand2, Menu,
} from 'lucide-react'
import { VoiceInputButton } from '@/components/ui/VoiceInputButton'
import { TEMPLATES, CATEGORIES, type DocTemplate } from './templates'

// IDs de todos os templates disponíveis — enviados ao backend para orientar a IA
const ALL_TEMPLATE_IDS = TEMPLATES.map(t => `${t.id} — ${t.title} (${t.category})`)

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

// ── types ──────────────────────────────────────────────────────────────────────
interface UploadedImage {
  base64: string
  mediaType: string
  description: string
  name: string
  preview?: string
}

interface IdentifyResult {
  templateId: string
  extractedData: Record<string, string>
  confidence: number
  reasoning?: string
}

type Step = 'command' | 'identified' | 'generated'

// ── helpers ────────────────────────────────────────────────────────────────────
function toBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload = () => res((reader.result as string).split(',')[1])
    reader.onerror = rej
    reader.readAsDataURL(file)
  })
}

function toPreviewUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload = () => res(reader.result as string)
    reader.onerror = rej
    reader.readAsDataURL(file)
  })
}

function confidenceColor(c: number) {
  if (c >= 0.85) return 'text-green-400'
  if (c >= 0.6) return 'text-yellow-400'
  return 'text-red-400'
}

function confidenceLabel(c: number) {
  if (c >= 0.85) return 'Alta confiança'
  if (c >= 0.6) return 'Confiança média'
  return 'Baixa confiança'
}

// ── category badge colors ──────────────────────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
  'Locação': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Venda': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'Aditivos': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'Notificações': 'bg-red-500/20 text-red-300 border-red-500/30',
  'Vistoria': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'Cadastro': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  'Visitas': 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  'Administrativo': 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  'Financeiro': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'Relacionamento': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
}

// ── prompt suggestions per category ────────────────────────────────────────────
const CAT_PROMPTS: Record<string, string> = {
  'Locação': 'Contrato de locação para ',
  'Venda': 'Compromisso de compra e venda para ',
  'Aditivos': 'Aditivo contratual para ',
  'Notificações': 'Notificação para ',
  'Vistoria': 'Laudo de vistoria para o imóvel em ',
  'Cadastro': 'Ficha cadastral para ',
  'Visitas': 'Comprovante de visita para ',
  'Administrativo': 'Documento administrativo sobre ',
  'Financeiro': 'Documento financeiro referente a ',
  'Relacionamento': 'Carta para ',
}

// ── grouped templates ──────────────────────────────────────────────────────────
const GROUPED = CATEGORIES.reduce<Record<string, DocTemplate[]>>((acc, cat) => {
  const items = TEMPLATES.filter(t => t.category === cat)
  if (items.length) acc[cat] = items
  return acc
}, {})

// ── component ──────────────────────────────────────────────────────────────────
export default function DocumentosPage() {
  const token = useAuthStore(s => s.accessToken)

  // flow state
  const [step, setStep] = useState<Step>('command')
  const [command, setCommand] = useState('')
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])

  // identification state
  const [identifying, setIdentifying] = useState(false)
  const [identifyError, setIdentifyError] = useState('')
  const [identifyResult, setIdentifyResult] = useState<IdentifyResult | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<DocTemplate | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})

  // generation state
  const [generating, setGenerating] = useState(false)
  const [generatedHtml, setGeneratedHtml] = useState('')

  // sidebar — fechado por padrão em mobile (< 768px)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(!e.matches)
      if (e.matches && !sidebarOpen) setSidebarOpen(true)
      if (!e.matches) setSidebarOpen(false)
    }
    handler(mq) // run on mount
    mq.addEventListener('change', handler as any)
    return () => mq.removeEventListener('change', handler as any)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // refs
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  // ── image upload ────────────────────────────────────────────────────────────
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    for (const file of files) {
      const base64 = await toBase64(file)
      const preview = await toPreviewUrl(file)
      setUploadedImages(prev => [...prev, {
        base64,
        mediaType: file.type,
        name: file.name,
        description: `Documento para OCR: extraia nome, CPF, RG, endereço e demais dados visíveis`,
        preview,
      }])
    }
    e.target.value = ''
  }

  // ── step 1 → 2: identify ────────────────────────────────────────────────────
  async function handleIdentify() {
    const text = command.trim()
    if (!text && uploadedImages.length === 0) return
    setIdentifying(true)
    setIdentifyError('')
    setIdentifyResult(null)
    try {
      const res = await fetch(`${API_URL}/api/v1/agents/documents/identify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: text || 'Analise as imagens enviadas e identifique o tipo de documento necessário.',
          templateIds: ALL_TEMPLATE_IDS,
          images: uploadedImages.map(({ base64, mediaType, description }) => ({
            base64, mediaType, description,
          })),
        }),
      })
      const data = await res.json()
      if (data.templateId) {
        const tmpl = TEMPLATES.find(t => t.id === data.templateId)
        if (tmpl) {
          setIdentifyResult(data as IdentifyResult)
          setSelectedTemplate(tmpl)
          setFormData(data.extractedData ?? {})
          setStep('identified')
        } else {
          setIdentifyError('Modelo identificado não encontrado. Tente descrever de forma diferente.')
        }
      } else {
        setIdentifyError(data.message ?? 'Não foi possível identificar o documento. Tente ser mais específico.')
      }
    } catch {
      setIdentifyError('Erro de conexão com o agente de IA.')
    } finally {
      setIdentifying(false)
    }
  }

  // ── step 2 → 3: generate ────────────────────────────────────────────────────
  async function handleGenerate() {
    if (!selectedTemplate) return
    setGenerating(true)
    setGeneratedHtml('')
    try {
      const res = await fetch(`${API_URL}/api/v1/agents/documents/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          templateContent: selectedTemplate.content,
          formData,
          userInstructions: command ||
            `Gere o documento "${selectedTemplate.title}" com os dados fornecidos de forma profissional, com formatação adequada para impressão A4.`,
          images: uploadedImages.map(({ base64, mediaType, description }) => ({
            base64, mediaType, description,
          })),
        }),
      })
      const data = await res.json()
      if (data.html) {
        setGeneratedHtml(data.html)
        setStep('generated')
      } else {
        setGeneratedHtml('<p style="color:red;font-family:sans-serif;padding:2rem">Erro ao gerar documento. Verifique se a chave da IA está configurada no servidor.</p>')
        setStep('generated')
      }
    } catch {
      setGeneratedHtml('<p style="color:red;font-family:sans-serif;padding:2rem">Erro de conexão ao gerar documento.</p>')
      setStep('generated')
    } finally {
      setGenerating(false)
    }
  }

  // ── print / download ────────────────────────────────────────────────────────
  function handlePrint() {
    if (!generatedHtml) return
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(generatedHtml)
      win.document.close()
      win.focus()
      setTimeout(() => win.print(), 500)
    }
  }

  function handleDownload() {
    if (!generatedHtml) return
    const blob = new Blob([generatedHtml], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedTemplate?.id ?? 'documento'}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── reset ───────────────────────────────────────────────────────────────────
  function handleReset() {
    setStep('command')
    setCommand('')
    setUploadedImages([])
    setIdentifyResult(null)
    setIdentifyError('')
    setSelectedTemplate(null)
    setFormData({})
    setGeneratedHtml('')
  }

  // ── sidebar template click ──────────────────────────────────────────────────
  function handleSidebarTemplateClick(t: DocTemplate) {
    const catPrompt = CAT_PROMPTS[t.category] ?? ''
    setCommand(`${catPrompt}[preencha os dados do cliente aqui] — Modelo: ${t.title}`)
    setSelectedTemplate(t)
    setFormData({})
    setStep('command')
    setIdentifyResult(null)
    setGeneratedHtml('')
    if (isMobile) setSidebarOpen(false) // fechar drawer no mobile ao escolher
  }

  // ── keyboard shortcut ────────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleIdentify()
    }
  }, [command, uploadedImages]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full bg-[#0d1b3e] text-white min-h-screen relative">

      {/* ── Mobile sidebar overlay backdrop ──────────────────────────────────── */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── MAIN AREA ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">

        {/* Page header */}
        <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-6 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-lg sm:text-xl flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #C9A84C, #e8c66a)' }}>
              🤖
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-white leading-tight truncate">Agente IA de Documentos</h1>
              <p className="text-[10px] sm:text-[11px] text-white/40 truncate">Descreva ou fotografe — a IA identifica e gera</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-2">
            {step !== 'command' && (
              <button
                onClick={handleReset}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 text-xs text-white/60 hover:text-white transition-all"
              >
                <X className="w-3 h-3" /> Novo
              </button>
            )}
            {/* Mobile: X button to reset */}
            {step !== 'command' && (
              <button
                onClick={handleReset}
                className="sm:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white/60"
                title="Novo documento"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {/* Templates toggle */}
            <button
              onClick={() => setSidebarOpen(p => !p)}
              title={sidebarOpen ? 'Fechar modelos' : 'Ver modelos'}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 text-xs text-white/60 hover:text-white transition-all"
            >
              {sidebarOpen
                ? <><PanelRightClose className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Fechar modelos</span></>
                : <><Menu className="w-3.5 h-3.5 sm:hidden" /><PanelRightOpen className="w-3.5 h-3.5 hidden sm:block" /> <span className="hidden sm:inline">Modelos ({TEMPLATES.length})</span></>}
            </button>
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 px-4 sm:px-6 py-3 flex-shrink-0 overflow-x-auto scrollbar-none">
          {[
            { key: 'command', label: '1. Comando', num: 1 },
            { key: 'identified', label: '2. Identificado', num: 2 },
            { key: 'generated', label: '3. Documento gerado', num: 3 },
          ].map(({ key, label, num }) => {
            const active = step === key
            const done = (key === 'command' && (step === 'identified' || step === 'generated'))
              || (key === 'identified' && step === 'generated')
            return (
              <div key={key} className="flex items-center gap-1.5">
                {num > 1 && <div className={`w-8 h-px ${done ? 'bg-yellow-400/60' : 'bg-white/10'}`} />}
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                  active ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-400/30'
                    : done ? 'bg-green-500/15 text-green-400 border border-green-400/20'
                    : 'bg-white/5 text-white/50 border border-white/5'
                }`}>
                  {done
                    ? <CheckCircle2 className="w-3 h-3" />
                    : <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${active ? 'bg-yellow-400 text-[#0d1b3e]' : 'bg-white/10 text-white/40'}`}>{num}</span>}
                  {label}
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex-1 px-4 sm:px-6 pb-8 space-y-4 sm:space-y-5">

          {/* ── STEP 1: Command area ───────────────────────────────────────── */}
          <div className={`rounded-2xl border transition-all ${step === 'command' ? 'border-yellow-400/30 bg-white/[0.03]' : 'border-white/10 bg-white/[0.02]'}`}>
            <div className="p-5">
              <label className="block text-xs font-semibold text-white/50 mb-3 uppercase tracking-wider">
                O que você precisa?
              </label>
              <div className="relative">
                <textarea
                  value={command}
                  onChange={e => setCommand(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Descreva o documento que precisa... ex: 'Contrato de locação para João Silva, imóvel na Rua X, aluguel R$2.000'`}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 pr-10 text-white placeholder:text-white/25 outline-none focus:border-yellow-400/40 resize-none transition-colors"
                  style={{ fontSize: '16px', minHeight: '120px' }}
                />
                <span className="absolute right-3 top-3">
                  <VoiceInputButton onResult={(text) => setCommand(prev => prev ? prev + ' ' + text : text)} dark />
                </span>
              </div>

              {/* Uploaded image previews */}
              {uploadedImages.length > 0 && (
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="text-[11px] text-white/50">Imagens:</span>
                  {uploadedImages.map((img, i) => (
                    <div key={i} className="relative flex-shrink-0">
                      {img.preview ? (
                        <img src={img.preview} alt={img.name}
                          className="w-12 h-12 object-cover rounded-lg border border-white/10" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-white/40" />
                        </div>
                      )}
                      <button
                        onClick={() => setUploadedImages(prev => prev.filter((_, j) => j !== i))}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-400 transition-colors"
                      >
                        <X className="w-2.5 h-2.5 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Hidden file inputs */}
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment"
                multiple onChange={handleImageUpload} className="hidden" />
              <input ref={galleryInputRef} type="file" accept="image/*,.pdf"
                multiple onChange={handleImageUpload} className="hidden" />

              {/* Action row */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4">
                {/* Camera button */}
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-yellow-400/30 hover:bg-yellow-400/5 text-white/60 hover:text-yellow-300 text-sm transition-all"
                  title="Fotografar documento"
                >
                  <Camera className="w-4 h-4" />
                  <span>Câmera</span>
                </button>

                {/* Gallery button */}
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-yellow-400/30 hover:bg-yellow-400/5 text-white/60 hover:text-yellow-300 text-sm transition-all"
                  title="Enviar imagem da galeria"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Galeria</span>
                </button>

                <div className="flex-1" />

                {/* Identify button */}
                <button
                  onClick={handleIdentify}
                  disabled={identifying || (!command.trim() && uploadedImages.length === 0)}
                  className="flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
                  style={{ background: 'linear-gradient(135deg, #C9A84C, #e8c66a)', color: '#1B2B5B' }}
                >
                  {identifying
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Analisando...</>
                    : <><Sparkles className="w-4 h-4" /> Identificar &amp; Gerar</>}
                </button>
              </div>

              <p className="text-[10px] text-white/40 mt-2 text-right">Ctrl+Enter para enviar</p>
            </div>

            {/* Error message */}
            {identifyError && (
              <div className="mx-5 mb-5 flex items-center gap-2 bg-red-500/10 border border-red-400/30 rounded-xl px-4 py-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-300 flex-1">{identifyError}</p>
                <button onClick={() => setIdentifyError('')} className="text-white/40 hover:text-white/50">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* ── STEP 2: Identified — editable fields ──────────────────────── */}
          {(step === 'identified' || step === 'generated') && selectedTemplate && identifyResult && (
            <div className="rounded-2xl border border-green-400/25 bg-green-500/5">
              {/* Card header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base">{selectedTemplate.icon}</span>
                    <h3 className="text-sm font-bold text-white">{selectedTemplate.title}</h3>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${CAT_COLORS[selectedTemplate.category] ?? 'bg-white/10 text-white/40 border-white/10'}`}>
                      {selectedTemplate.category}
                    </span>
                    <span className={`text-[11px] font-semibold ${confidenceColor(identifyResult.confidence)}`}>
                      {confidenceLabel(identifyResult.confidence)} — {Math.round(identifyResult.confidence * 100)}%
                    </span>
                  </div>
                  {identifyResult.reasoning && (
                    <p className="text-[10px] text-white/50 mt-0.5">{identifyResult.reasoning}</p>
                  )}
                </div>
              </div>

              {/* Editable fields */}
              {step === 'identified' && (
                <div className="p-5">
                  <p className="text-[11px] text-white/40 mb-4">
                    A IA extraiu os dados abaixo. Revise e edite conforme necessário antes de gerar.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedTemplate.fields.map(field => (
                      <div key={field.key} className={field.multiline ? 'sm:col-span-2' : ''}>
                        <label className="block text-[11px] font-medium text-white/50 mb-1">
                          {field.label}
                          {field.required && <span className="text-yellow-400 ml-0.5">*</span>}
                        </label>
                        {field.multiline ? (
                          <textarea
                            value={formData[field.key] ?? ''}
                            onChange={e => setFormData(p => ({ ...p, [field.key]: e.target.value }))}
                            placeholder={field.placeholder ?? `Digite ${field.label.toLowerCase()}...`}
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-yellow-400/50 resize-none"
                          />
                        ) : (
                          <input
                            type="text"
                            value={formData[field.key] ?? ''}
                            onChange={e => setFormData(p => ({ ...p, [field.key]: e.target.value }))}
                            placeholder={field.placeholder ?? `Digite ${field.label.toLowerCase()}...`}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-yellow-400/50"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Generate button */}
                  <div className="mt-5 flex justify-end">
                    <button
                      onClick={handleGenerate}
                      disabled={generating}
                      className="flex items-center gap-2.5 px-8 py-3 rounded-xl text-sm font-bold transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background: 'linear-gradient(135deg, #C9A84C, #e8c66a)', color: '#1B2B5B' }}
                    >
                      {generating
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando documento...</>
                        : <><Wand2 className="w-4 h-4" /> Gerar Documento</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Generated document preview ────────────────────────── */}
          {step === 'generated' && generatedHtml && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
              {/* Preview header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-semibold text-white">
                    {selectedTemplate?.icon} {selectedTemplate?.title}
                  </span>
                  <span className="text-[10px] text-green-400 bg-green-500/10 border border-green-400/20 px-2 py-0.5 rounded-full ml-1">
                    Gerado
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      // go back to edit fields
                      setStep('identified')
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 text-xs text-white/60 hover:text-white transition-all"
                  >
                    Editar campos
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 text-xs text-white/60 hover:text-white transition-all"
                  >
                    <Printer className="w-3.5 h-3.5" /> Imprimir
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all hover:brightness-110"
                    style={{ background: 'linear-gradient(135deg, #C9A84C, #e8c66a)', color: '#1B2B5B' }}
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                </div>
              </div>

              {/* Iframe preview */}
              <div className="bg-white">
                <iframe
                  srcDoc={generatedHtml}
                  className="w-full border-0"
                  style={{ minHeight: '800px', height: 'auto' }}
                  onLoad={e => {
                    const iframe = e.currentTarget
                    try {
                      const h = iframe.contentDocument?.body?.scrollHeight
                      if (h) iframe.style.height = `${h + 40}px`
                    } catch {}
                  }}
                  title="Documento gerado"
                />
              </div>
            </div>
          )}

          {/* ── Empty state / tips (only on step command with no error) ────── */}
          {step === 'command' && !identifyError && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
              {[
                { icon: '💬', title: 'Linguagem natural', desc: 'Escreva como falaria: "Contrato de locação para Maria, imóvel na Rua das Flores, R$1.500/mês"' },
                { icon: '📷', title: 'Foto do documento', desc: 'Tire uma foto do RG, CNH ou contrato antigo — a IA extrai os dados automaticamente' },
                { icon: '📋', title: 'Escolha pela lista', desc: 'Clique em qualquer modelo na barra lateral para pré-preencher o comando' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/8">
                  <span className="text-2xl flex-shrink-0">{icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-white/70 mb-1">{title}</p>
                    <p className="text-[11px] text-white/35 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* ── RIGHT SIDEBAR: Template library ─────────────────────────────────── */}
      {sidebarOpen && (
        <div className={`
          flex flex-col bg-[#0a1730] border-white/10
          ${isMobile
            ? 'fixed top-0 right-0 h-full w-72 max-w-[85vw] z-40 shadow-2xl border-l'
            : 'w-72 flex-shrink-0 border-l min-h-screen'
          }
        `}>
          {/* Sidebar header */}
          <div className="px-4 pt-5 pb-3 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-bold text-white">Modelos</span>
              <span className="text-[10px] text-white/50 bg-white/5 rounded-full px-2 py-0.5">
                {TEMPLATES.length}
              </span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="ml-auto w-6 h-6 flex items-center justify-center rounded-md bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-white/50 mt-1">Clique para pré-preencher o comando</p>
          </div>

          {/* Grouped list */}
          <div className="flex-1 overflow-y-auto py-2">
            {Object.entries(GROUPED).map(([cat, items]) => (
              <div key={cat} className="mb-1">
                {/* Category header */}
                <div className="flex items-center gap-2 px-4 py-1.5">
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${CAT_COLORS[cat] ?? 'bg-white/10 text-white/40 border-white/10'}`}>
                    {cat}
                  </span>
                  <span className="text-[9px] text-white/40">{items.length}</span>
                </div>

                {/* Templates */}
                <div className="space-y-0.5 px-2">
                  {items.map(t => (
                    <button
                      key={t.id}
                      onClick={() => handleSidebarTemplateClick(t)}
                      className={`w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-lg transition-all group ${
                        selectedTemplate?.id === t.id
                          ? 'bg-yellow-500/15 border border-yellow-400/25'
                          : 'hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <span className="text-sm flex-shrink-0">{t.icon}</span>
                      <span className="text-[11px] text-white/70 group-hover:text-white transition-colors truncate flex-1 leading-snug">
                        {t.title}
                      </span>
                      <ChevronRight className="w-3 h-3 text-white/40 group-hover:text-yellow-400/60 flex-shrink-0 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

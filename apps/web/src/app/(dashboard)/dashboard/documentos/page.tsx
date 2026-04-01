'use client'

import { useState, useRef, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import {
  Sparkles, FileText, Search, Download, Printer, Image as ImageIcon, X,
  ChevronRight, Loader2, Copy, Check, Upload, Wand2, Camera, Brain,
  MessageSquare, ChevronDown, ChevronUp, AlertCircle, CheckCircle2
} from 'lucide-react'
import { TEMPLATES, CATEGORIES, type DocTemplate } from './templates'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

// ── types ─────────────────────────────────────────────────────────────────────
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

// ── helpers ───────────────────────────────────────────────────────────────────
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

// ── category badge colors ─────────────────────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
  'Locação': 'bg-blue-500/20 text-blue-300',
  'Venda': 'bg-emerald-500/20 text-emerald-300',
  'Aditivos': 'bg-purple-500/20 text-purple-300',
  'Notificações': 'bg-red-500/20 text-red-300',
  'Vistoria': 'bg-orange-500/20 text-orange-300',
  'Cadastro': 'bg-cyan-500/20 text-cyan-300',
  'Visitas': 'bg-teal-500/20 text-teal-300',
  'Administrativo': 'bg-slate-500/20 text-slate-300',
  'Financeiro': 'bg-yellow-500/20 text-yellow-300',
  'Relacionamento': 'bg-pink-500/20 text-pink-300',
}

// ── component ─────────────────────────────────────────────────────────────────
export default function DocumentosPage() {
  const token = useAuthStore(s => s.accessToken)

  // sidebar / template state
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<DocTemplate | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [freeInstructions, setFreeInstructions] = useState('')
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [generatedHtml, setGeneratedHtml] = useState('')
  const [generating, setGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState<'form' | 'instructions'>('form')
  const [copied, setCopied] = useState(false)

  // AI search / identify state
  const [aiQuery, setAiQuery] = useState('')
  const [identifying, setIdentifying] = useState(false)
  const [identifyResult, setIdentifyResult] = useState<IdentifyResult | null>(null)
  const [identifyError, setIdentifyError] = useState('')
  const [aiPanelExpanded, setAiPanelExpanded] = useState(true)

  // refs
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const ocrInputRef = useRef<HTMLInputElement>(null)

  // ── derived ────────────────────────────────────────────────────────────────
  const filtered = TEMPLATES.filter(t => {
    const matchesSearch = !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !activeCategory || t.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const groupedFiltered = CATEGORIES.reduce<Record<string, DocTemplate[]>>((acc, cat) => {
    const items = filtered.filter(t => t.category === cat)
    if (items.length) acc[cat] = items
    return acc
  }, {})

  // ── handlers ───────────────────────────────────────────────────────────────
  function selectTemplate(t: DocTemplate, prefill?: Record<string, string>) {
    setSelectedTemplate(t)
    setFormData(prefill ?? {})
    setFreeInstructions('')
    setGeneratedHtml('')
    setActiveTab('form')
  }

  // Apply identify result
  function applyIdentifyResult(result: IdentifyResult) {
    const tmpl = TEMPLATES.find(t => t.id === result.templateId)
    if (tmpl) {
      selectTemplate(tmpl, result.extractedData)
      setIdentifyResult(null)
      setAiQuery('')
    }
  }

  // Natural language AI identification
  async function handleIdentify() {
    if (!aiQuery.trim()) return
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
        body: JSON.stringify({ text: aiQuery }),
      })
      const data = await res.json()
      if (data.templateId) {
        setIdentifyResult(data as IdentifyResult)
      } else {
        setIdentifyError(data.message ?? 'Não foi possível identificar o documento. Tente ser mais específico.')
      }
    } catch {
      setIdentifyError('Erro de conexão com o agente de IA.')
    } finally {
      setIdentifying(false)
    }
  }

  // Image upload for doc generation
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    for (const file of files) {
      const base64 = await toBase64(file)
      const preview = await toPreviewUrl(file)
      setUploadedImages(prev => [...prev, {
        base64,
        mediaType: file.type,
        name: file.name,
        description: `Imagem: ${file.name}`,
        preview,
      }])
    }
    e.target.value = ''
  }

  // OCR image upload — extract data from document photos
  async function handleOcrUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    // Add images to the uploaded list AND trigger generation with OCR instruction
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
    setActiveTab('instructions')
    if (!freeInstructions.includes('extraia')) {
      setFreeInstructions(prev =>
        prev
          ? prev + '\n\nExtraia automaticamente os dados dos documentos enviados (RG, CPF, nome, endereço) e preencha o documento com eles.'
          : 'Extraia automaticamente os dados dos documentos enviados (RG, CPF, nome, endereço) e preencha o documento com eles.'
      )
    }
    e.target.value = ''
  }

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
          userInstructions: freeInstructions ||
            `Gere o documento "${selectedTemplate.title}" com os dados fornecidos de forma profissional, com formatação adequada para impressão A4.`,
          images: uploadedImages.map(({ base64, mediaType, description }) => ({
            base64, mediaType, description,
          })),
        }),
      })
      const data = await res.json()
      if (data.html) {
        setGeneratedHtml(data.html)
      } else {
        setGeneratedHtml('<p style="color:red;font-family:sans-serif;padding:2rem">Erro ao gerar documento. Verifique se a chave da IA está configurada no servidor.</p>')
      }
    } catch {
      setGeneratedHtml('<p style="color:red;font-family:sans-serif;padding:2rem">Erro de conexão ao gerar documento.</p>')
    } finally {
      setGenerating(false)
    }
  }

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

  function handleCopy() {
    if (!generatedHtml) return
    navigator.clipboard.writeText(generatedHtml)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleKeyDownQuery = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleIdentify()
    }
  }, [aiQuery]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full bg-[#0f172a] text-white min-h-screen flex-col">

      {/* ── TOP: AI Natural Language Bar ───────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-white/10">
        {/* Collapsed toggle */}
        <button
          onClick={() => setAiPanelExpanded(p => !p)}
          className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-white/3 transition-colors"
        >
          <Brain className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          <span className="text-xs font-semibold text-yellow-400">Assistente IA — Descreva o documento ou envie foto dos documentos do cliente</span>
          <div className="flex-1" />
          {aiPanelExpanded
            ? <ChevronUp className="w-3.5 h-3.5 text-white/30" />
            : <ChevronDown className="w-3.5 h-3.5 text-white/30" />}
        </button>

        {aiPanelExpanded && (
          <div className="px-5 pb-4 space-y-3">
            {/* Main AI input row */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-400/60 pointer-events-none" />
                <textarea
                  value={aiQuery}
                  onChange={e => setAiQuery(e.target.value)}
                  onKeyDown={handleKeyDownQuery}
                  placeholder="Ex: contrato de locação para Maria Silva, CPF 123.456.789-00, alugando na Rua das Flores 100, por R$1.200/mês, início em 01/05/2026, com fiador João Souza..."
                  rows={2}
                  className="w-full bg-white/5 border border-yellow-400/20 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-yellow-400/50 resize-none"
                />
              </div>

              {/* OCR camera button */}
              <div className="flex flex-col gap-1.5">
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onChange={handleOcrUpload}
                  className="hidden"
                />
                <input
                  ref={ocrInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  multiple
                  onChange={handleOcrUpload}
                  className="hidden"
                />
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  title="Fotografar documento (RG, CNH, contrato...)"
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:border-yellow-400/40 hover:bg-yellow-400/10 text-white/50 hover:text-yellow-400 transition-all"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <button
                  onClick={() => ocrInputRef.current?.click()}
                  title="Enviar foto/scan do documento"
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:border-yellow-400/40 hover:bg-yellow-400/10 text-white/50 hover:text-yellow-400 transition-all"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleIdentify}
                disabled={identifying || !aiQuery.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed self-start"
                style={{ background: 'linear-gradient(135deg, #C9A84C, #e8c66a)', color: '#1B2B5B' }}
              >
                {identifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {identifying ? 'Analisando...' : 'Identificar'}
              </button>
            </div>

            {/* Identify result */}
            {identifyResult && (() => {
              const tmpl = TEMPLATES.find(t => t.id === identifyResult.templateId)
              return tmpl ? (
                <div className="flex items-start gap-3 bg-green-500/10 border border-green-400/30 rounded-xl px-4 py-3">
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-green-300">
                      IA identificou: {tmpl.icon} {tmpl.title}
                      <span className={`ml-2 text-[10px] font-normal ${confidenceColor(identifyResult.confidence)}`}>
                        — {confidenceLabel(identifyResult.confidence)} ({Math.round(identifyResult.confidence * 100)}%)
                      </span>
                    </p>
                    {Object.keys(identifyResult.extractedData).length > 0 && (
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5">
                        {Object.entries(identifyResult.extractedData).map(([k, v]) => (
                          <span key={k} className="text-[10px] text-white/50">
                            <span className="text-white/30">{k}:</span> <span className="text-white/70">{v}</span>
                          </span>
                        ))}
                      </div>
                    )}
                    {identifyResult.reasoning && (
                      <p className="text-[10px] text-white/30 mt-1">{identifyResult.reasoning}</p>
                    )}
                  </div>
                  <button
                    onClick={() => applyIdentifyResult(identifyResult)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-400/20 hover:bg-green-400/30 text-green-300 text-xs font-medium transition-colors flex-shrink-0"
                  >
                    Aplicar <ChevronRight className="w-3 h-3" />
                  </button>
                  <button onClick={() => setIdentifyResult(null)} className="text-white/20 hover:text-white/50">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : null
            })()}

            {identifyError && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-400/30 rounded-xl px-4 py-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-300">{identifyError}</p>
                <button onClick={() => setIdentifyError('')} className="ml-auto text-white/20 hover:text-white/50">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* OCR images preview strip */}
            {uploadedImages.length > 0 && activeTab !== 'instructions' && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-[10px] text-white/30 flex-shrink-0">Docs enviados:</span>
                {uploadedImages.map((img, i) => (
                  <div key={i} className="relative flex-shrink-0">
                    {img.preview ? (
                      <img src={img.preview} alt={img.name}
                        className="w-10 h-10 object-cover rounded-lg border border-white/10" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-white/40" />
                      </div>
                    )}
                    <button
                      onClick={() => setUploadedImages(prev => prev.filter((_, j) => j !== i))}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center"
                    >
                      <X className="w-2.5 h-2.5 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MAIN: 3-column layout ──────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* ── LEFT: Template Library ───────────────────────────────────────── */}
        <div className="w-72 flex-shrink-0 border-r border-white/10 flex flex-col min-h-0">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <Wand2 className="w-5 h-5 text-yellow-400" />
              <h1 className="text-sm font-bold text-white">Modelos de Documentos</h1>
              <span className="ml-auto text-[10px] text-white/30 bg-white/5 rounded-full px-2 py-0.5">
                {TEMPLATES.length}
              </span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar modelo..."
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-yellow-400/50"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-1.5 px-3 py-2.5 border-b border-white/10 flex-shrink-0">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${!activeCategory ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-white/50 hover:text-white'}`}
            >
              Todos ({TEMPLATES.length})
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${activeCategory === cat ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-white/50 hover:text-white'}`}
              >
                {cat} ({TEMPLATES.filter(t => t.category === cat).length})
              </button>
            ))}
          </div>

          {/* Template list — grouped by category */}
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
            {Object.entries(groupedFiltered).map(([cat, items]) => (
              <div key={cat}>
                <p className={`text-[9px] font-bold uppercase tracking-wider px-2 mb-1 ${CAT_COLORS[cat] ?? 'text-white/30'}`}>
                  {cat}
                </p>
                <div className="space-y-0.5">
                  {items.map(t => (
                    <button
                      key={t.id}
                      onClick={() => selectTemplate(t)}
                      className={`w-full text-left flex items-start gap-2.5 px-2.5 py-2 rounded-xl transition-all ${
                        selectedTemplate?.id === t.id
                          ? 'bg-yellow-500/15 border border-yellow-400/30'
                          : 'hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <span className="text-base mt-0.5 flex-shrink-0">{t.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-white truncate leading-snug">{t.title}</p>
                        <p className="text-[9px] text-white/35 mt-0.5 line-clamp-1">{t.description}</p>
                      </div>
                      {selectedTemplate?.id === t.id && (
                        <ChevronRight className="w-3 h-3 text-yellow-400 flex-shrink-0 mt-0.5" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-white/30 text-xs py-8">Nenhum modelo encontrado</p>
            )}
          </div>
        </div>

        {/* ── CENTER: Form / Instructions ──────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-white/10 min-h-0">
          {!selectedTemplate ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center overflow-y-auto">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-4"
                style={{ background: 'linear-gradient(135deg, #1B2B5B, #2d4a99)' }}>
                🤖
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Agente IA de Documentos</h2>
              <p className="text-white/40 text-sm max-w-xs leading-relaxed">
                Selecione um modelo à esquerda, ou descreva o documento no campo de IA acima para identificação automática e preenchimento dos dados.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3 max-w-sm w-full">
                {['Locação', 'Venda', 'Notificações', 'Financeiro', 'Cadastro', 'Vistoria'].map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)}
                    className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-yellow-400/40 text-xs text-white/70 hover:text-white transition-all text-left">
                    <span className="block font-semibold">{cat}</span>
                    <span className="text-white/30 text-[10px]">{TEMPLATES.filter(t => t.category === cat).length} modelos</span>
                  </button>
                ))}
              </div>

              {/* Tips */}
              <div className="mt-8 max-w-sm w-full space-y-2">
                <p className="text-[10px] text-white/25 font-semibold uppercase tracking-wider">Dicas do Assistente IA</p>
                {[
                  { icon: '💬', tip: 'Digite a situação em linguagem natural e a IA identifica o documento certo' },
                  { icon: '📷', tip: 'Fotografe o RG ou CNH do cliente — a IA extrai os dados automaticamente' },
                  { icon: '📋', tip: 'Preencha os campos do formulário ou use instruções livres para personalizar' },
                ].map(({ icon, tip }) => (
                  <div key={tip} className="flex items-start gap-2 text-left px-3 py-2 rounded-lg bg-white/3">
                    <span className="text-sm flex-shrink-0">{icon}</span>
                    <p className="text-[10px] text-white/35 leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Template header */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/10 flex-shrink-0">
                <span className="text-2xl">{selectedTemplate.icon}</span>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-bold text-white truncate">{selectedTemplate.title}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${CAT_COLORS[selectedTemplate.category] ?? 'bg-white/10 text-white/40'}`}>
                      {selectedTemplate.category}
                    </span>
                    <p className="text-[10px] text-white/35 truncate">{selectedTemplate.description}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedTemplate(null)} className="text-white/30 hover:text-white p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/10 flex-shrink-0">
                {(['form', 'instructions'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2.5 text-xs font-medium transition-colors ${activeTab === tab ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-white/40 hover:text-white'}`}>
                    {tab === 'form'
                      ? `📋 Formulário (${selectedTemplate.fields.length} campos)`
                      : `💬 Instruções + Imagens${uploadedImages.length > 0 ? ` (${uploadedImages.length})` : ''}`}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto">
                {activeTab === 'form' ? (
                  <div className="p-5 space-y-3">
                    {selectedTemplate.fields.map(field => (
                      <div key={field.key}>
                        <label className="block text-xs font-medium text-white/60 mb-1">
                          {field.label}
                          {field.required && <span className="text-yellow-400 ml-1">*</span>}
                        </label>
                        {field.multiline ? (
                          <textarea
                            value={formData[field.key] ?? ''}
                            onChange={e => setFormData(p => ({ ...p, [field.key]: e.target.value }))}
                            placeholder={field.placeholder ?? `Digite ${field.label.toLowerCase()}...`}
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-yellow-400/50 resize-none"
                          />
                        ) : (
                          <input
                            type="text"
                            value={formData[field.key] ?? ''}
                            onChange={e => setFormData(p => ({ ...p, [field.key]: e.target.value }))}
                            placeholder={field.placeholder ?? `Digite ${field.label.toLowerCase()}...`}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-yellow-400/50"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-5 space-y-4">
                    {/* Free instructions */}
                    <div>
                      <label className="block text-xs font-medium text-white/60 mb-2">
                        Instruções livres para a IA (pode incluir dados adicionais, tom, detalhe de cláusulas...)
                      </label>
                      <textarea
                        value={freeInstructions}
                        onChange={e => setFreeInstructions(e.target.value)}
                        placeholder="Ex: Crie o contrato com cláusula adicional sobre animais de estimação. João tem cachorro porte médio. Incluir que animais são permitidos mediante autorização. Contrato deve ser formal e bem detalhado."
                        rows={7}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-yellow-400/50 resize-none"
                      />
                    </div>

                    {/* Image upload */}
                    <div>
                      <label className="block text-xs font-medium text-white/60 mb-2">
                        Imagens de documentos para OCR (RG, CNH, comprovante, contrato antigo...)
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-4 border-2 border-dashed border-white/15 rounded-xl text-white/35 hover:border-yellow-400/40 hover:text-white/60 transition-colors text-xs"
                        >
                          <Upload className="w-4 h-4" />
                          Galeria / Arquivo
                        </button>
                        <button
                          onClick={() => cameraInputRef.current?.click()}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-4 border-2 border-dashed border-white/15 rounded-xl text-white/35 hover:border-yellow-400/40 hover:text-white/60 transition-colors text-xs"
                        >
                          <Camera className="w-4 h-4" />
                          Câmera
                        </button>
                      </div>

                      {uploadedImages.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {uploadedImages.map((img, i) => (
                            <div key={i} className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2">
                              {img.preview ? (
                                <img src={img.preview} alt={img.name}
                                  className="w-8 h-8 object-cover rounded flex-shrink-0" />
                              ) : (
                                <ImageIcon className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-white truncate">{img.name}</p>
                                <input
                                  value={img.description}
                                  onChange={e => setUploadedImages(prev =>
                                    prev.map((im, j) => j === i ? { ...im, description: e.target.value } : im)
                                  )}
                                  placeholder="Descreva o que é esta imagem..."
                                  className="text-[10px] text-white/40 bg-transparent outline-none w-full mt-0.5"
                                />
                              </div>
                              <button
                                onClick={() => setUploadedImages(prev => prev.filter((_, j) => j !== i))}
                                className="text-white/30 hover:text-red-400"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Generate button */}
              <div className="p-4 border-t border-white/10 flex-shrink-0 space-y-2">
                {uploadedImages.length > 0 && (
                  <p className="text-[10px] text-yellow-400/70 text-center">
                    {uploadedImages.length} imagem(ns) serão analisadas pela IA para extração de dados
                  </p>
                )}
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all hover:brightness-110 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #C9A84C, #e8c66a)', color: '#1B2B5B' }}
                >
                  {generating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Gerando documento com IA...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Gerar Documento com IA</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── RIGHT: Preview ──────────────────────────────────────────────── */}
        <div className="w-[500px] flex-shrink-0 flex flex-col min-h-0">
          {/* Preview toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
            <span className="text-xs font-medium text-white/50 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Pré-visualização
            </span>
            {generatedHtml && (
              <div className="flex items-center gap-2">
                <button onClick={handleCopy} title="Copiar HTML"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs transition-colors">
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado!' : 'HTML'}
                </button>
                <button onClick={handleDownload} title="Baixar"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs transition-colors">
                  <Download className="w-3.5 h-3.5" /> Baixar
                </button>
                <button onClick={handlePrint} title="Imprimir"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 text-xs transition-colors font-medium">
                  <Printer className="w-3.5 h-3.5" /> Imprimir
                </button>
              </div>
            )}
          </div>

          {/* Preview content */}
          <div className="flex-1 overflow-hidden bg-gray-100 min-h-0">
            {generating ? (
              <div className="h-full flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl animate-bounce"
                  style={{ background: 'linear-gradient(135deg, #1B2B5B20, #C9A84C20)' }}>
                  🤖
                </div>
                <p className="text-gray-500 text-sm text-center max-w-xs">
                  Gerando seu documento com inteligência artificial...
                </p>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            ) : generatedHtml ? (
              <iframe
                ref={iframeRef}
                srcDoc={generatedHtml}
                className="w-full h-full border-0"
                title="Documento gerado"
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                <FileText className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-400 text-sm">
                  Preencha o formulário e clique em<br />
                  <strong>&quot;Gerar Documento com IA&quot;</strong>
                </p>
                <p className="text-gray-300 text-xs mt-2">
                  O documento aparecerá aqui pronto para imprimir
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

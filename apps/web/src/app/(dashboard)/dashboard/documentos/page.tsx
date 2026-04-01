'use client'

import { useState, useRef } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { Sparkles, FileText, Search, Download, Printer, Image as ImageIcon, X, ChevronRight, Loader2, Copy, Check, Upload, Wand2 } from 'lucide-react'
import { TEMPLATES, CATEGORIES, type DocTemplate } from './templates'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

// ── helpers ──────────────────────────────────────────────────────────────────
function toBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload = () => res((reader.result as string).split(',')[1])
    reader.onerror = rej
    reader.readAsDataURL(file)
  })
}

// ── component ─────────────────────────────────────────────────────────────────
export default function DocumentosPage() {
  const token = useAuthStore(s => s.accessToken)

  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<DocTemplate | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [freeInstructions, setFreeInstructions] = useState('')
  const [uploadedImages, setUploadedImages] = useState<Array<{ base64: string; mediaType: string; description: string; name: string }>>([])
  const [generatedHtml, setGeneratedHtml] = useState('')
  const [generating, setGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState<'form' | 'instructions'>('form')
  const [copied, setCopied] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filtered = TEMPLATES.filter(t => {
    const matchesSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !activeCategory || t.category === activeCategory
    return matchesSearch && matchesCategory
  })

  function selectTemplate(t: DocTemplate) {
    setSelectedTemplate(t)
    setFormData({})
    setFreeInstructions('')
    setGeneratedHtml('')
    setActiveTab('form')
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    for (const file of files) {
      const base64 = await toBase64(file)
      setUploadedImages(prev => [...prev, {
        base64,
        mediaType: file.type,
        name: file.name,
        description: `Imagem: ${file.name}`,
      }])
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
          userInstructions: freeInstructions || `Gere o documento ${selectedTemplate.title} com os dados fornecidos de forma profissional.`,
          images: uploadedImages.map(({ base64, mediaType, description }) => ({ base64, mediaType, description })),
        }),
      })
      const data = await res.json()
      if (data.html) {
        setGeneratedHtml(data.html)
      } else {
        setGeneratedHtml('<p style="color:red">Erro ao gerar documento. Verifique se a chave da IA está configurada.</p>')
      }
    } catch {
      setGeneratedHtml('<p style="color:red">Erro de conexão ao gerar documento.</p>')
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

  return (
    <div className="flex h-full bg-[#0f172a] text-white min-h-screen">

      {/* ── LEFT: Template Library ──────────────────────────────────────── */}
      <div className="w-72 flex-shrink-0 border-r border-white/10 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <Wand2 className="w-5 h-5 text-yellow-400" />
            <h1 className="text-sm font-bold text-white">Criar Documentos IA</h1>
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
        <div className="flex flex-wrap gap-1.5 px-4 py-3 border-b border-white/10">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${!activeCategory ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-white/50 hover:text-white'}`}
          >
            Todos
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${activeCategory === cat ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-white/50 hover:text-white'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Template list */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          {filtered.map(t => (
            <button
              key={t.id}
              onClick={() => selectTemplate(t)}
              className={`w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-xl transition-all ${
                selectedTemplate?.id === t.id
                  ? 'bg-yellow-500/15 border border-yellow-400/30'
                  : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              <span className="text-lg mt-0.5 flex-shrink-0">{t.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate leading-snug">{t.title}</p>
                <p className="text-[10px] text-white/40 mt-0.5">{t.category}</p>
              </div>
              {selectedTemplate?.id === t.id && <ChevronRight className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-white/30 text-xs py-8">Nenhum modelo encontrado</p>
          )}
        </div>
      </div>

      {/* ── CENTER: Form / Instructions ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-white/10">
        {!selectedTemplate ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-4"
              style={{ background: 'linear-gradient(135deg, #1B2B5B, #2d4a99)' }}>
              🤖
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Agente IA de Documentos</h2>
            <p className="text-white/40 text-sm max-w-xs leading-relaxed">
              Selecione um modelo à esquerda ou descreva o documento que precisa para a IA criar do zero.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 max-w-sm w-full">
              {['Locação', 'Venda', 'Notificações', 'Financeiro'].map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-yellow-400/40 text-xs text-white/70 hover:text-white transition-all text-left">
                  <span className="block font-semibold">{cat}</span>
                  <span className="text-white/30 text-[10px]">{TEMPLATES.filter(t => t.category === cat).length} modelos</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Template header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 flex-shrink-0">
              <span className="text-2xl">{selectedTemplate.icon}</span>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-white truncate">{selectedTemplate.title}</h2>
                <p className="text-xs text-white/40 mt-0.5">{selectedTemplate.description}</p>
              </div>
              <button onClick={() => setSelectedTemplate(null)} className="text-white/30 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10 flex-shrink-0">
              {(['form', 'instructions'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2.5 text-xs font-medium transition-colors ${activeTab === tab ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-white/40 hover:text-white'}`}>
                  {tab === 'form' ? '📋 Formulário' : '💬 Instruções Livres + Imagens'}
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
                      Descreva o documento que precisa (pode incluir dados das pessoas, imóvel, valores, datas...)
                    </label>
                    <textarea
                      value={freeInstructions}
                      onChange={e => setFreeInstructions(e.target.value)}
                      placeholder="Ex: Crie um contrato de locação para João Silva, CPF 123.456.789-00, alugando o imóvel na Rua das Flores 100, Franca SP, por R$ 1.200/mês, início em 01/05/2026, prazo de 30 meses, com fiador Pedro Santos..."
                      rows={8}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-yellow-400/50 resize-none"
                    />
                  </div>

                  {/* Image upload */}
                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-2">
                      Enviar documentos/fotos para extração de dados (RG, CNH, contrato antigo...)
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-white/20 rounded-xl text-white/40 hover:border-yellow-400/40 hover:text-white/60 transition-colors text-sm"
                    >
                      <Upload className="w-5 h-5" />
                      Clique para enviar imagens ou arraste aqui
                    </button>

                    {uploadedImages.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {uploadedImages.map((img, i) => (
                          <div key={i} className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2">
                            <ImageIcon className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-white truncate">{img.name}</p>
                              <input
                                value={img.description}
                                onChange={e => setUploadedImages(prev => prev.map((im, j) => j === i ? { ...im, description: e.target.value } : im))}
                                placeholder="Descreva o que é esta imagem..."
                                className="text-[10px] text-white/40 bg-transparent outline-none w-full mt-0.5"
                              />
                            </div>
                            <button onClick={() => setUploadedImages(prev => prev.filter((_, j) => j !== i))}
                              className="text-white/30 hover:text-red-400">
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
            <div className="p-4 border-t border-white/10 flex-shrink-0">
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all hover:brightness-110 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #C9A84C, #e8c66a)', color: '#1B2B5B' }}
              >
                {generating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Gerando documento...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Gerar Documento com IA</>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── RIGHT: Preview ──────────────────────────────────────────────── */}
      <div className="w-[500px] flex-shrink-0 flex flex-col">
        {/* Preview toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
          <span className="text-xs font-medium text-white/50">Pré-visualização</span>
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
        <div className="flex-1 overflow-hidden bg-gray-100">
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
                {[0,1,2].map(i => (
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
  )
}

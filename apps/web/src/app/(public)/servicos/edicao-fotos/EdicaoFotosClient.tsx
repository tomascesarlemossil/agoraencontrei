'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, ImageIcon, CheckCircle, Loader2, Copy, Check, Download, Sparkles, CreditCard, Camera, Star, Zap, Shield } from 'lucide-react'
import Image from 'next/image'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

const FILTERS = [
  { id: 'efeito-1',       name: 'Suave Pastel',       description: 'Tons suaves e luminosos. Ideal para interiores.', emoji: '🌸', color: '#f9a8d4' },
  { id: 'efeito-2',       name: 'Vibrante Moderno',    description: 'Cores vivas e contraste marcante. Impacto visual.', emoji: '⚡', color: '#60a5fa' },
  { id: 'efeito-3',       name: 'Quente Natural',      description: 'Tons quentes e naturais. Aconchego e conforto.', emoji: '🌅', color: '#fb923c' },
  { id: 'hdr-interior',   name: 'HDR Interior',        description: 'Sombras abertas, destaques controlados. Ambientes com janelas.', emoji: '🏠', color: '#fbbf24' },
  { id: 'magazine',       name: 'Magazine Editorial',   description: 'Padrão de revistas de arquitetura e decoração.', emoji: '📸', color: '#a78bfa' },
  { id: 'luxury-premium', name: 'Luxo Premium',        description: 'Tons ricos e quentes. Imóveis de alto padrão.', emoji: '💎', color: '#c9a84c' },
  { id: 'fresh-bright',   name: 'Fresh & Bright',      description: 'Ultra brilhante e arejado. Popular no Airbnb.', emoji: '☀️', color: '#34d399' },
  { id: 'twilight',       name: 'Twilight',             description: 'Céu azul + interior quente. Fotos ao entardecer.', emoji: '🌆', color: '#818cf8' },
  { id: 'cinematic',      name: 'Cinematográfico',     description: 'Contraste dramático, tom de filme.', emoji: '🎬', color: '#6366f1' },
  { id: 'exterior-vivid', name: 'Exterior Vívido',     description: 'Gramados verdes, céu azul. Fachadas impactantes.', emoji: '🌿', color: '#22c55e' },
  { id: 'pool-leisure',   name: 'Piscina & Lazer',     description: 'Água cristalina, verdes vibrantes.', emoji: '🏊', color: '#06b6d4' },
  { id: 'drone-aerial',   name: 'Vista Aérea',         description: 'Clareza máxima para fotos de drone.', emoji: '🚁', color: '#0ea5e9' },
  { id: 'night-elegant',  name: 'Noturna Elegante',    description: 'Iluminação quente noturna, fachada à noite.', emoji: '🌙', color: '#8b5cf6' },
]

type Step = 'upload' | 'payment' | 'processing' | 'done'

export function EdicaoFotosClient() {
  const [step, setStep] = useState<Step>('upload')
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [selectedFilter, setSelectedFilter] = useState<string>('efeito-1')
  const photoInputRef = useRef<HTMLInputElement>(null)

  // Payment state
  const [payForm, setPayForm] = useState({ name: '', phone: '', email: '', cpf: '' })
  const [payLoading, setPayLoading] = useState(false)
  const [payData, setPayData] = useState<{
    chargeId: string
    pixQrCode: string | null
    pixCopyCola: string | null
    invoiceUrl: string | null
    value: number
  } | null>(null)
  const [copied, setCopied] = useState(false)
  const [checkingPayment, setCheckingPayment] = useState(false)
  const [paymentConfirmed, setPaymentConfirmed] = useState(false)

  // Processing state
  const [processing, setProcessing] = useState(false)
  const [processedImages, setProcessedImages] = useState<string[]>([])
  const [processProgress, setProcessProgress] = useState(0)

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const newPhotos = [...photos, ...files].slice(0, 20)
    setPhotos(newPhotos)
    newPhotos.forEach((file, i) => {
      if (previews[i]) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        setPreviews(prev => {
          const updated = [...prev]
          updated[i] = ev.target?.result as string
          return updated
        })
      }
      reader.readAsDataURL(file)
    })
    if (photoInputRef.current) photoInputRef.current.value = ''
  }

  function removePhoto(i: number) {
    setPhotos(prev => prev.filter((_, idx) => idx !== i))
    setPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleCheckout() {
    if (!payForm.name || !payForm.phone) return
    setPayLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/v1/public/photo-edit-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? 'Erro ao gerar cobrança')
      setPayData(data)
    } catch (err) {
      alert('Erro ao gerar cobrança. Tente novamente ou entre em contato pelo WhatsApp.')
    } finally {
      setPayLoading(false)
    }
  }

  async function checkPaymentStatus() {
    if (!payData?.chargeId) return
    setCheckingPayment(true)
    try {
      const res = await fetch(`${API_URL}/api/v1/public/photo-edit-status/${payData.chargeId}`)
      const data = await res.json()
      if (data.paid) {
        setPaymentConfirmed(true)
        setStep('processing')
        await processPhotos()
      } else {
        alert('Pagamento ainda não confirmado. Aguarde alguns instantes e tente novamente.')
      }
    } catch {
      alert('Erro ao verificar pagamento. Tente novamente.')
    } finally {
      setCheckingPayment(false)
    }
  }

  async function processPhotos() {
    setProcessing(true)
    setProcessProgress(0)
    const results: string[] = []

    for (let i = 0; i < photos.length; i++) {
      try {
        const fd = new FormData()
        fd.append('file', photos[i])
        fd.append('filter_id', selectedFilter)
        const res = await fetch(`${API_URL}/api/v1/photo-editor/apply`, {
          method: 'POST',
          body: fd,
        })
        if (res.ok) {
          const data = await res.json()
          results.push(data.result ?? data.preview ?? '')
        } else {
          // Fallback: usar preview original
          results.push(previews[i] ?? '')
        }
      } catch {
        results.push(previews[i] ?? '')
      }
      setProcessProgress(Math.round(((i + 1) / photos.length) * 100))
    }

    setProcessedImages(results)
    setProcessing(false)
    setStep('done')
  }

  function downloadImage(dataUrl: string, index: number) {
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `foto-editada-${index + 1}.jpg`
    a.click()
  }

  function downloadAll() {
    processedImages.forEach((url, i) => {
      if (url) setTimeout(() => downloadImage(url, i), i * 300)
    })
  }

  async function copyPix() {
    if (!payData?.pixCopyCola) return
    await navigator.clipboard.writeText(payData.pixCopyCola)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  // ── Step: Upload ─────────────────────────────────────────────────────────────
  if (step === 'upload') {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f8f7f4 0%, #fff 100%)' }}>
        {/* Hero */}
        <div className="py-16 px-4 text-center" style={{ background: 'linear-gradient(135deg, #1B2B5B 0%, #2d4a8a 100%)' }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-4" style={{ background: 'rgba(201,168,76,0.2)', color: '#C9A84C' }}>
            <Sparkles className="w-3.5 h-3.5" />
            Serviço Profissional Online
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            Edição de Fotos de Imóveis
          </h1>
          <p className="text-blue-200 text-lg mb-2">
            Até <strong className="text-white">20 fotos</strong> com filtros profissionais por apenas{' '}
            <strong className="text-[#C9A84C] text-2xl">R$10,00</strong>
          </p>
          <p className="text-blue-300 text-sm">Pague via PIX e receba suas fotos editadas em minutos</p>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            {[
              { icon: Zap, text: 'Resultado em minutos' },
              { icon: Shield, text: 'Pagamento seguro via PIX' },
              { icon: Star, text: 'Filtros profissionais' },
              { icon: Camera, text: 'Até 20 fotos por R$10' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-white/80 text-sm">
                <Icon className="w-4 h-4 text-[#C9A84C]" />
                {text}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Filter selection */}
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
              1. Escolha o filtro
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {FILTERS.map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFilter(f.id)}
                  className="p-4 rounded-2xl border-2 text-left transition-all hover:shadow-md"
                  style={{
                    borderColor: selectedFilter === f.id ? '#1B2B5B' : '#e0dbd0',
                    backgroundColor: selectedFilter === f.id ? 'rgba(27,43,91,0.04)' : 'white',
                  }}
                >
                  <div className="text-3xl mb-2">{f.emoji}</div>
                  <div className="font-bold text-sm mb-1" style={{ color: '#1B2B5B' }}>{f.name}</div>
                  <div className="text-xs text-gray-500">{f.description}</div>
                  {selectedFilter === f.id && (
                    <div className="mt-2 flex items-center gap-1 text-xs font-bold" style={{ color: '#1B2B5B' }}>
                      <CheckCircle className="w-3.5 h-3.5" /> Selecionado
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Photo upload */}
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
              2. Selecione suas fotos <span className="text-sm font-normal text-gray-500">({photos.length}/20)</span>
            </h2>

            {photos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
                {photos.map((file, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border" style={{ borderColor: '#e0dbd0' }}>
                    {previews[i] ? (
                      <img src={previews[i]} alt={file.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input ref={photoInputRef} type="file" multiple className="hidden" onChange={handlePhotoSelect} />
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={photos.length >= 20}
              className="w-full py-4 rounded-2xl border-2 border-dashed text-sm font-medium transition-all hover:border-[#C9A84C] hover:bg-[rgba(201,168,76,0.03)] disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ borderColor: '#e0dbd0', color: '#6b7280' }}
            >
              <Upload className="w-4 h-4" />
              {photos.length === 0 ? 'Clique para selecionar fotos' : 'Adicionar mais fotos'}
            </button>
            <p className="text-xs text-gray-400 mt-2 text-center">
              PNG, JPEG, HEIC, RAW — qualquer formato. Máximo 20 fotos.
            </p>
          </div>

          {/* CTA */}
          <button
            type="button"
            disabled={photos.length === 0}
            onClick={() => setStep('payment')}
            className="w-full py-4 rounded-2xl text-sm font-bold transition-all hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #1B2B5B 0%, #2d4a8a 100%)', color: 'white' }}
          >
            <CreditCard className="w-4 h-4" />
            Continuar para pagamento — R$10,00
          </button>
          {photos.length === 0 && (
            <p className="text-center text-xs text-gray-400 mt-2">Selecione pelo menos 1 foto para continuar</p>
          )}
        </div>
      </div>
    )
  }

  // ── Step: Payment ─────────────────────────────────────────────────────────────
  if (step === 'payment') {
    return (
      <div className="min-h-screen py-12 px-4" style={{ background: 'linear-gradient(135deg, #f8f7f4 0%, #fff 100%)' }}>
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: 'rgba(27,43,91,0.08)' }}>
              <CreditCard className="w-7 h-7" style={{ color: '#1B2B5B' }} />
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
              Pagamento
            </h1>
            <p className="text-gray-500 text-sm">
              {photos.length} foto{photos.length > 1 ? 's' : ''} selecionada{photos.length > 1 ? 's' : ''} · Filtro: {FILTERS.find(f => f.id === selectedFilter)?.name}
            </p>
          </div>

          <div className="bg-white rounded-3xl border shadow-sm p-6" style={{ borderColor: '#e8e4dc' }}>
            {!payData ? (
              <>
                <div className="mb-6 p-4 rounded-2xl text-center" style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.3)' }}>
                  <p className="text-sm text-gray-600">Total a pagar</p>
                  <p className="text-4xl font-bold mt-1" style={{ color: '#1B2B5B' }}>R$ 10,00</p>
                  <p className="text-xs text-gray-500 mt-1">Pagamento via PIX — confirmação instantânea</p>
                </div>

                <div className="space-y-3 mb-6">
                  <input
                    type="text"
                    placeholder="Seu nome completo *"
                    value={payForm.name}
                    onChange={e => setPayForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-3 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#1B2B5B] text-gray-800"
                    style={{ borderColor: '#e0dbd0' }}
                  />
                  <input
                    type="tel"
                    placeholder="WhatsApp / Telefone *"
                    value={payForm.phone}
                    onChange={e => setPayForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full px-4 py-3 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#1B2B5B] text-gray-800"
                    style={{ borderColor: '#e0dbd0' }}
                  />
                  <input
                    type="email"
                    placeholder="E-mail (opcional)"
                    value={payForm.email}
                    onChange={e => setPayForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full px-4 py-3 text-sm rounded-xl border focus:outline-none text-gray-800"
                    style={{ borderColor: '#e0dbd0' }}
                  />
                  <input
                    type="text"
                    placeholder="CPF (opcional)"
                    value={payForm.cpf}
                    onChange={e => setPayForm(p => ({ ...p, cpf: e.target.value }))}
                    className="w-full px-4 py-3 text-sm rounded-xl border focus:outline-none text-gray-800"
                    style={{ borderColor: '#e0dbd0' }}
                  />
                </div>

                <button
                  type="button"
                  disabled={payLoading || !payForm.name || !payForm.phone}
                  onClick={handleCheckout}
                  className="w-full py-4 rounded-2xl text-sm font-bold transition-all hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', color: 'white' }}
                >
                  {payLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando PIX...</> : <>Gerar QR Code PIX — R$10,00</>}
                </button>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4" style={{ background: 'rgba(22,163,74,0.1)', color: '#16a34a' }}>
                    <CheckCircle className="w-3.5 h-3.5" /> PIX gerado com sucesso
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Escaneie o QR Code abaixo ou copie o código PIX</p>

                  {payData.pixQrCode && (
                    <div className="flex justify-center mb-4">
                      <img
                        src={`data:image/png;base64,${payData.pixQrCode}`}
                        alt="QR Code PIX"
                        className="w-48 h-48 rounded-xl border"
                        style={{ borderColor: '#e0dbd0' }}
                      />
                    </div>
                  )}

                  {payData.pixCopyCola && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 p-3 rounded-xl border text-xs font-mono break-all" style={{ borderColor: '#e0dbd0', background: '#f9f9f7' }}>
                        <span className="flex-1 text-left text-gray-600 line-clamp-2">{payData.pixCopyCola}</span>
                        <button
                          type="button"
                          onClick={copyPix}
                          className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                          style={{ background: copied ? '#16a34a' : '#1B2B5B', color: 'white' }}
                        >
                          {copied ? <><Check className="w-3 h-3" /> Copiado!</> : <><Copy className="w-3 h-3" /> Copiar</>}
                        </button>
                      </div>
                    </div>
                  )}

                  {payData.invoiceUrl && (
                    <a
                      href={payData.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs text-blue-600 hover:underline mb-4"
                    >
                      Ver fatura completa →
                    </a>
                  )}
                </div>

                <button
                  type="button"
                  disabled={checkingPayment}
                  onClick={checkPaymentStatus}
                  className="w-full py-4 rounded-2xl text-sm font-bold transition-all hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #1B2B5B 0%, #2d4a8a 100%)', color: 'white' }}
                >
                  {checkingPayment ? <><Loader2 className="w-4 h-4 animate-spin" /> Verificando pagamento...</> : <>Já paguei — Editar minhas fotos</>}
                </button>
                <p className="text-center text-xs text-gray-400 mt-3">
                  Após o pagamento, clique no botão acima para iniciar a edição
                </p>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setStep('upload')}
            className="w-full mt-4 py-3 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Voltar e alterar fotos
          </button>
        </div>
      </div>
    )
  }

  // ── Step: Processing ──────────────────────────────────────────────────────────
  if (step === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4" style={{ background: 'linear-gradient(135deg, #f8f7f4 0%, #fff 100%)' }}>
        <div className="max-w-sm w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6" style={{ background: 'rgba(27,43,91,0.08)' }}>
            <Sparkles className="w-10 h-10" style={{ color: '#1B2B5B' }} />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            Editando suas fotos...
          </h2>
          <p className="text-gray-500 text-sm mb-8">
            Aplicando o filtro <strong>{FILTERS.find(f => f.id === selectedFilter)?.name}</strong> em {photos.length} foto{photos.length > 1 ? 's' : ''}
          </p>
          <div className="w-full bg-gray-100 rounded-full h-3 mb-3">
            <div
              className="h-3 rounded-full transition-all duration-500"
              style={{ width: `${processProgress}%`, background: 'linear-gradient(90deg, #1B2B5B, #C9A84C)' }}
            />
          </div>
          <p className="text-sm font-bold" style={{ color: '#1B2B5B' }}>{processProgress}%</p>
        </div>
      </div>
    )
  }

  // ── Step: Done ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen py-12 px-4" style={{ background: 'linear-gradient(135deg, #f8f7f4 0%, #fff 100%)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: 'rgba(22,163,74,0.1)' }}>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            Fotos editadas com sucesso!
          </h1>
          <p className="text-gray-500">
            {processedImages.length} foto{processedImages.length > 1 ? 's' : ''} com filtro <strong>{FILTERS.find(f => f.id === selectedFilter)?.name}</strong>
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <button
            type="button"
            onClick={downloadAll}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl text-sm font-bold transition-all hover:brightness-110"
            style={{ background: 'linear-gradient(135deg, #1B2B5B 0%, #2d4a8a 100%)', color: 'white' }}
          >
            <Download className="w-4 h-4" />
            Baixar todas as fotos ({processedImages.length})
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {processedImages.map((url, i) => (
            <div key={i} className="relative group rounded-2xl overflow-hidden bg-gray-100 aspect-square border" style={{ borderColor: '#e0dbd0' }}>
              {url ? (
                <img src={url} alt={`Foto editada ${i + 1}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => url && downloadImage(url, i)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white"
                  style={{ background: 'rgba(27,43,91,0.9)' }}
                >
                  <Download className="w-3.5 h-3.5" /> Baixar
                </button>
              </div>
              <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
                Foto {i + 1}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-gray-500 mb-4">Precisa de mais serviços?</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="/servicos/fotos-imoveis"
              className="px-5 py-2.5 rounded-xl text-sm font-medium border transition-all hover:shadow-sm"
              style={{ borderColor: '#e0dbd0', color: '#1B2B5B' }}
            >
              Fotografia profissional
            </a>
            <a
              href="/servicos/video-imoveis"
              className="px-5 py-2.5 rounded-xl text-sm font-medium border transition-all hover:shadow-sm"
              style={{ borderColor: '#e0dbd0', color: '#1B2B5B' }}
            >
              Vídeo e drone
            </a>
            <a
              href="/anunciar"
              className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-110"
              style={{ background: '#1B2B5B', color: 'white' }}
            >
              Anunciar meu imóvel
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

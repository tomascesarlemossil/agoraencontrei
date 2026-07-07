'use client'

/**
 * Editor simples da landing page do parceiro ("Divulgue seu Negócio").
 * Login sem senha: usa o accessToken (magic-link) guardado no localStorage
 * pelo /meu-painel, ou recebido via ?token=. Salva com PATCH /specialists/:id.
 */
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Loader2, Plus, Trash2, X, ImageIcon, Video, Star, DollarSign,
  Layout, CheckCircle2, ArrowLeft, Save, Globe, Instagram, Phone,
  Eye, MessageCircle, Users, ClipboardCheck,
} from 'lucide-react'
import { LANDING_TEMPLATES, getCategory } from '@/lib/divulgue-catalog'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

interface ServiceItem { name: string; description: string; price: string; priceType: string }
interface ReferenceItem { title: string; url: string; note?: string }
interface PartnerLead {
  id: string
  name: string
  phone?: string | null
  email?: string | null
  city?: string | null
  projectType?: string | null
  objective?: string | null
  budget?: string | null
  timeline?: string | null
  score?: number | null
  scoreLabel?: string | null
  recommendedAction?: string | null
  createdAt?: string | null
}
interface PartnerStats {
  monthly: { profileViews: number; whatsappClicks: number; qualifiedLeads: number; uniqueVisitors: number }
  allTime: { totalViews: number; totalWhatsapp: number; totalQualifiedLeads: number }
  recentLeads?: PartnerLead[]
}

const PRICE_TYPES = [
  { value: 'a_partir', label: 'A partir de' },
  { value: 'fixo', label: 'Valor fixo' },
  { value: 'por_m2', label: 'Por m²' },
  { value: 'hora', label: 'Por hora' },
  { value: 'consulta', label: 'Sob consulta' },
]

function fileToDataUrl(file: File, maxSize = 1000): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = document.createElement('img')
      img.onload = () => {
        let { width, height } = img
        if (width > maxSize || height > maxSize) {
          if (width >= height) { height = Math.round((height * maxSize) / width); width = maxSize }
          else { width = Math.round((width * maxSize) / height); height = maxSize }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) { resolve(reader.result as string); return }
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = reject
      img.src = reader.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function EditarParceiroPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ''
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)

  const [name, setName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [phone, setPhone] = useState('')
  const [instagram, setInstagram] = useState('')
  const [website, setWebsite] = useState('')
  const [bio, setBio] = useState('')
  const [segment, setSegment] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [template, setTemplate] = useState('classico')
  const [services, setServices] = useState<ServiceItem[]>([])
  const [photos, setPhotos] = useState<string[]>([])
  const [videos, setVideos] = useState<string[]>([])
  const [references, setReferences] = useState<ReferenceItem[]>([])
  const [newPhotoUrl, setNewPhotoUrl] = useState('')
  const [newVideoUrl, setNewVideoUrl] = useState('')
  const [profileUrl, setProfileUrl] = useState('')
  const [stats, setStats] = useState<PartnerStats | null>(null)
  const logoRef = useRef<HTMLInputElement>(null)
  const photoRef = useRef<HTMLInputElement>(null)

  const cat = getCategory(segment)

  // Resolve token: ?token= tem prioridade; senão localStorage do /meu-painel.
  useEffect(() => {
    const url = new URL(window.location.href)
    const qt = url.searchParams.get('token')
    const t = qt || localStorage.getItem('specialist_token')
    if (qt) localStorage.setItem('specialist_token', qt)
    setToken(t)
    if (!t) { setLoading(false); return }
    fetch(`${API_URL}/api/v1/specialists/session?token=${encodeURIComponent(t)}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((s) => {
        setName(s.name || '')
        setWhatsapp(s.whatsapp || '')
        setPhone(s.phone || '')
        setInstagram(s.instagram || '')
        setWebsite(s.website || '')
        setBio(s.bio || '')
        setSegment(s.businessType || s.category || '')
        setLogoUrl(s.logoUrl || '')
        setProfileUrl(s.slug ? `https://www.agoraencontrei.com.br/especialistas/${s.slug}` : '')
        const lp = (s.landingPage && typeof s.landingPage === 'object') ? s.landingPage : {}
        setTemplate(lp.template || 'classico')
        setServices(Array.isArray(lp.services) ? lp.services : [])
        setPhotos(Array.isArray(lp.photos) ? lp.photos : [])
        setVideos(Array.isArray(lp.videos) ? lp.videos : [])
        setReferences(Array.isArray(lp.references) ? lp.references : [])
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [])

  // Métricas (visualizações, cliques no WhatsApp) do parceiro.
  useEffect(() => {
    if (!token || !id) return
    fetch(`${API_URL}/api/v1/specialists/${id}/stats?token=${encodeURIComponent(token)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setStats(d) })
      .catch(() => {})
  }, [token, id])

  const toggleCatalog = (svcName: string) => {
    setServices(prev => prev.find(s => s.name === svcName)
      ? prev.filter(s => s.name !== svcName)
      : [...prev, { name: svcName, description: '', price: '', priceType: 'a_partir' }])
  }
  const updateService = (i: number, patch: Partial<ServiceItem>) => setServices(prev => prev.map((s, idx) => idx === i ? { ...s, ...patch } : s))

  const onLogo = async (f: File | null) => { if (f) { try { setLogoUrl(await fileToDataUrl(f, 512)) } catch {} } }
  const onPhotos = async (files: FileList | null) => {
    if (!files) return
    for (const f of Array.from(files)) { try { const d = await fileToDataUrl(f); setPhotos(p => [...p, d]) } catch {} }
  }

  const save = async () => {
    if (!token) return
    setSaving(true); setError(''); setSaved(false)
    const landingPage = {
      template, segment, segmentLabel: cat?.label ?? segment,
      about: bio, services: services.filter(s => s.name.trim()),
      photos, videos, references: references.filter(r => r.title?.trim() || r.url?.trim()),
      logoUrl,
    }
    try {
      const res = await fetch(`${API_URL}/api/v1/specialists/${id}?token=${encodeURIComponent(token)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, whatsapp, phone, instagram, website, bio, logoUrl,
          photoUrl: logoUrl || photos[0] || undefined,
          tags: services.map(s => s.name).filter(Boolean),
          landingPage,
        }),
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.message || d.error || 'Erro ao salvar.'); setSaving(false); return }
      setSaved(true); setTimeout(() => setSaved(false), 2500)
    } catch { setError('Erro de conexão.') } finally { setSaving(false) }
  }

  const inputBare = 'w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 bg-white text-[16px]'

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f8f6f1]"><Loader2 className="w-8 h-8 animate-spin text-[#C9A84C]" /></div>

  if (!token || notFound) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f6f1] px-4 text-center">
      <p className="text-lg font-bold text-[#143A1F] mb-2">Acesso ao editor</p>
      <p className="text-gray-500 text-sm mb-6 max-w-sm">Para editar sua página, acesse pelo link do seu painel (enviado por e-mail/WhatsApp).</p>
      <Link href="/meu-painel" className="px-6 py-3 bg-[#143A1F] text-white rounded-xl font-semibold">Ir para o painel</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f8f6f1]">
      <header className="bg-[#143A1F] py-4 px-6 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/meu-painel" className="text-white/70 hover:text-white text-sm flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Painel</Link>
          <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-[#143A1F] disabled:opacity-60" style={{ backgroundColor: '#C9A84C' }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar'}
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[#143A1F] mb-1">Editar minha página</h1>
        <p className="text-gray-500 text-sm mb-6">Atualize seus serviços, fotos e contatos. As alterações aparecem na sua página pública.{profileUrl && <> · <a href={profileUrl} target="_blank" rel="noreferrer" className="text-[#C9A84C] font-medium underline">ver página</a></>}</p>

        {/* Métricas */}
        {stats && (
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Seu desempenho este mês</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: Eye, label: 'Visualizações', value: stats.monthly.profileViews ?? 0, sub: `${stats.allTime.totalViews ?? 0} no total` },
                { icon: MessageCircle, label: 'Cliques no WhatsApp', value: stats.monthly.whatsappClicks ?? 0, sub: `${stats.allTime.totalWhatsapp ?? 0} no total` },
                { icon: ClipboardCheck, label: 'Briefings recebidos', value: stats.monthly.qualifiedLeads ?? 0, sub: `${stats.allTime.totalQualifiedLeads ?? 0} no total` },
                { icon: Users, label: 'Visitantes únicos', value: stats.monthly.uniqueVisitors ?? 0, sub: 'este mês' },
              ].map((s, i) => (
                <div key={i} className="bg-white border rounded-2xl p-4 text-center">
                  <s.icon className="w-5 h-5 mx-auto mb-2" style={{ color: '#C9A84C' }} />
                  <p className="text-2xl font-bold text-[#143A1F]">{s.value}</p>
                  <p className="text-[11px] text-gray-500 leading-tight">{s.label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>
            {stats.allTime.totalViews === 0 && (
              <p className="text-xs text-gray-400 mt-2">As métricas começam a contar assim que sua página estiver ativa e as pessoas a visitarem.</p>
            )}
            {stats.recentLeads && stats.recentLeads.length > 0 && (
              <div className="mt-4 rounded-2xl border bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-[#143A1F]">Briefings recentes</p>
                  <span className="rounded-full bg-[#C9A84C]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#9A7A23]">
                    Leads qualificados
                  </span>
                </div>
                <div className="space-y-3">
                  {stats.recentLeads.slice(0, 5).map(lead => {
                    const score = Number(lead.score || 0)
                    const digits = (lead.phone || '').replace(/\D/g, '')
                    const wa = digits.length >= 10 ? `https://wa.me/${digits.startsWith('55') ? digits : `55${digits}`}` : null
                    const hot = score >= 80
                    const warm = score >= 55 && score < 80
                    return (
                      <div key={lead.id} className="rounded-xl border border-gray-100 bg-[#f8f6f1] p-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[#143A1F]">{lead.name}</p>
                            <p className="mt-0.5 text-xs text-gray-500">
                              {[lead.projectType, lead.city, lead.timeline].filter(Boolean).join(' - ') || 'Briefing recebido'}
                            </p>
                            {(lead.objective || lead.budget) && (
                              <p className="mt-1 text-xs text-gray-500">
                                {[lead.objective, lead.budget].filter(Boolean).join(' - ')}
                              </p>
                            )}
                            {lead.recommendedAction && (
                              <p className="mt-2 text-xs font-medium text-[#143A1F]">{lead.recommendedAction}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${hot ? 'bg-green-100 text-green-700' : warm ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                              Score {score}
                            </span>
                            {wa && (
                              <a href={wa} target="_blank" rel="noreferrer" className="rounded-full bg-[#25D366] px-3 py-1 text-xs font-bold text-white">
                                WhatsApp
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Contatos */}
        <div className="bg-white border rounded-2xl p-5 mb-5">
          <p className="text-sm font-semibold text-[#143A1F] mb-3">Contato e apresentação</p>
          <div className="space-y-3">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome do negócio" className={inputBare} />
            <div className="grid grid-cols-2 gap-3">
              <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="WhatsApp" className={`${inputBare} pl-10`} /></div>
              <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Telefone" className={`${inputBare} pl-10`} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative"><Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@instagram" className={`${inputBare} pl-10`} /></div>
              <div className="relative"><Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={website} onChange={e => setWebsite(e.target.value)} placeholder="Site" className={`${inputBare} pl-10`} /></div>
            </div>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Sobre o seu negócio" className={`${inputBare} resize-none`} />
          </div>
        </div>

        {/* Modelo + Logo */}
        <div className="bg-white border rounded-2xl p-5 mb-5">
          <p className="text-sm font-semibold text-[#143A1F] mb-2 flex items-center gap-1.5"><Layout className="w-4 h-4 text-[#C9A84C]" /> Modelo</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
            {LANDING_TEMPLATES.map(t => (
              <button key={t.id} onClick={() => setTemplate(t.id)} className={`p-3 rounded-xl border-2 text-left transition-all ${template === t.id ? 'border-[#C9A84C] bg-[#C9A84C]/5' : 'border-gray-100'}`}>
                <div className="h-6 rounded-md mb-1.5" style={{ background: `linear-gradient(135deg, ${t.accent}, ${t.accent}99)` }} />
                <p className="text-xs font-semibold text-[#143A1F]">{t.name}</p>
              </button>
            ))}
          </div>
          <p className="text-sm font-semibold text-[#143A1F] mb-2 flex items-center gap-1.5"><ImageIcon className="w-4 h-4 text-[#C9A84C]" /> Logo</p>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-white flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" /> : <ImageIcon className="w-5 h-5 text-gray-300" />}
            </div>
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={e => onLogo(e.target.files?.[0] ?? null)} />
            <button onClick={() => logoRef.current?.click()} className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 hover:border-[#C9A84C] text-[#143A1F]">Enviar logo</button>
            {logoUrl && <button onClick={() => setLogoUrl('')} className="text-sm text-red-500">Remover</button>}
          </div>
        </div>

        {/* Serviços */}
        <div className="bg-white border rounded-2xl p-5 mb-5">
          <p className="text-sm font-semibold text-[#143A1F] mb-3 flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-[#C9A84C]" /> Serviços e valores</p>
          {(cat?.services.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {cat!.services.map(nm => {
                const on = services.some(s => s.name === nm)
                return <button key={nm} onClick={() => toggleCatalog(nm)} className={`px-3 py-1.5 rounded-full text-sm font-medium border ${on ? 'bg-[#143A1F] text-white border-[#143A1F]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#C9A84C]'}`}>{on ? '✓ ' : '+ '}{nm}</button>
              })}
            </div>
          )}
          <div className="space-y-3">
            {services.map((s, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <input value={s.name} onChange={e => updateService(i, { name: e.target.value })} placeholder="Nome do serviço" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-[16px]" />
                  <button onClick={() => setServices(prev => prev.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                </div>
                <input value={s.description} onChange={e => updateService(i, { description: e.target.value })} placeholder="Descrição (opcional)" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-[16px] mb-2" />
                <div className="flex gap-2">
                  <select value={s.priceType} onChange={e => updateService(i, { priceType: e.target.value })} className="px-2 py-2 border border-gray-200 rounded-lg text-sm bg-white text-[16px]">
                    {PRICE_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                  <input value={s.price} onChange={e => updateService(i, { price: e.target.value })} disabled={s.priceType === 'consulta'} placeholder={s.priceType === 'consulta' ? 'Sob consulta' : 'R$ 0,00'} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-[16px] disabled:bg-gray-50" />
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setServices(prev => [...prev, { name: '', description: '', price: '', priceType: 'a_partir' }])} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#143A1F] hover:text-[#C9A84C]"><Plus className="w-4 h-4" /> Adicionar serviço</button>
        </div>

        {/* Fotos */}
        <div className="bg-white border rounded-2xl p-5 mb-5">
          <p className="text-sm font-semibold text-[#143A1F] mb-3 flex items-center gap-1.5"><ImageIcon className="w-4 h-4 text-[#C9A84C]" /> Fotos</p>
          {photos.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
              {photos.map((p, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                  <button onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input ref={photoRef} type="file" accept="image/*" multiple className="hidden" onChange={e => onPhotos(e.target.files)} />
            <button onClick={() => photoRef.current?.click()} className="px-4 py-2.5 rounded-lg text-sm font-semibold border border-gray-200 hover:border-[#C9A84C] text-[#143A1F] whitespace-nowrap">Enviar fotos</button>
            <input value={newPhotoUrl} onChange={e => setNewPhotoUrl(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newPhotoUrl.trim()) { setPhotos(p => [...p, newPhotoUrl.trim()]); setNewPhotoUrl('') } } }} placeholder="ou cole um link" className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-[16px]" />
            <button onClick={() => { if (newPhotoUrl.trim()) { setPhotos(p => [...p, newPhotoUrl.trim()]); setNewPhotoUrl('') } }} className="px-3 py-2.5 rounded-lg bg-[#143A1F] text-white text-sm"><Plus className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Vídeos */}
        <div className="bg-white border rounded-2xl p-5 mb-5">
          <p className="text-sm font-semibold text-[#143A1F] mb-3 flex items-center gap-1.5"><Video className="w-4 h-4 text-[#C9A84C]" /> Vídeos</p>
          {videos.length > 0 && (
            <div className="space-y-2 mb-3">
              {videos.map((v, i) => (
                <div key={i} className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
                  <Video className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="flex-1 text-sm text-gray-600 truncate">{v}</span>
                  <button onClick={() => setVideos(prev => prev.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input value={newVideoUrl} onChange={e => setNewVideoUrl(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newVideoUrl.trim()) { setVideos(v => [...v, newVideoUrl.trim()]); setNewVideoUrl('') } } }} placeholder="Link do YouTube/Instagram" className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-[16px]" />
            <button onClick={() => { if (newVideoUrl.trim()) { setVideos(v => [...v, newVideoUrl.trim()]); setNewVideoUrl('') } }} className="px-3 py-2.5 rounded-lg bg-[#143A1F] text-white text-sm"><Plus className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Referências */}
        <div className="bg-white border rounded-2xl p-5 mb-5">
          <p className="text-sm font-semibold text-[#143A1F] mb-3 flex items-center gap-1.5"><Star className="w-4 h-4 text-[#C9A84C]" /> Referências</p>
          <div className="space-y-2">
            {references.map((r, i) => (
              <div key={i} className="flex gap-2">
                <input value={r.title} onChange={e => setReferences(prev => prev.map((x, idx) => idx === i ? { ...x, title: e.target.value } : x))} placeholder="Ex.: Reforma no Ed. Prime" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-[16px]" />
                <input value={r.url} onChange={e => setReferences(prev => prev.map((x, idx) => idx === i ? { ...x, url: e.target.value } : x))} placeholder="link (opcional)" className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm text-[16px]" />
                <button onClick={() => setReferences(prev => prev.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
          <button onClick={() => setReferences(prev => [...prev, { title: '', url: '' }])} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#143A1F] hover:text-[#C9A84C]"><Plus className="w-4 h-4" /> Adicionar referência</button>
        </div>

        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        <button onClick={save} disabled={saving} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-[#143A1F] disabled:opacity-60" style={{ backgroundColor: '#C9A84C' }}>
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : saved ? <><CheckCircle2 className="w-4 h-4" /> Alterações salvas!</> : <><Save className="w-4 h-4" /> Salvar alterações</>}
        </button>
      </div>
    </div>
  )
}

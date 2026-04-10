'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { propertiesApi, type PropertyDetail } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Controller, useForm } from 'react-hook-form'
import {
  ArrowLeft, Edit, Save, X, MapPin, BedDouble, Bath, Car, Ruler, Eye,
  Calendar, ImagePlus, Trash2, Star, Upload, Phone, Mail, User as UserIcon, ZoomIn,
  Home, Globe, Settings, Shield, Briefcase, Building2, Search, MessageSquare, Clock, Wand2, Film, Download,
} from 'lucide-react'
import Link from 'next/link'
import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { uploadApi, usersApi, type User } from '@/lib/api'
import { MoneyInput, CepInput } from '@/components/ui/MoneyInput'
import { revalidatePublicPages, PAGES } from '@/lib/revalidate'
import { PropertyImageLightbox } from '@/components/dashboard/PropertyImageLightbox'
import { PropertyFeaturesEditor } from '@/components/dashboard/PropertyFeaturesEditor'
import { SocialPostPanel } from './SocialPostPanel'
import { PhotoEditorPanel } from '@/components/dashboard/PhotoEditorPanel'
import { MediaEditorModal } from '@/components/dashboard/MediaEditorModal'

const STATUS_BADGE: Record<string, string> = {
  ACTIVE:   'bg-emerald-500/20 text-emerald-400',
  INACTIVE: 'bg-gray-500/20 text-gray-400',
  SOLD:     'bg-blue-500/20 text-blue-400',
  RENTED:   'bg-purple-500/20 text-purple-400',
  PENDING:  'bg-yellow-500/20 text-yellow-400',
  DRAFT:    'bg-white/10 text-white/40',
}

const TYPE_LABELS: Record<string, string> = {
  HOUSE:'Casa', APARTMENT:'Apartamento', LAND:'Terreno', FARM:'Chácara/Sítio',
  RANCH:'Rancho', WAREHOUSE:'Galpão', OFFICE:'Escritório', STORE:'Loja/Comercial',
  STUDIO:'Studio', PENTHOUSE:'Cobertura', CONDO:'Condomínio', KITNET:'Kitnet',
}
const PURPOSE_LABELS: Record<string, string> = {
  SALE:'Venda', RENT:'Aluguel', BOTH:'Venda/Aluguel', SEASON:'Temporada',
}

const STATUSES = [['ACTIVE','Ativo'],['INACTIVE','Inativo'],['SOLD','Vendido'],['RENTED','Alugado'],['PENDING','Pendente'],['DRAFT','Rascunho']]
const TYPES = Object.entries(TYPE_LABELS)
const PURPOSES = Object.entries(PURPOSE_LABELS)
const CATEGORIES = [['RESIDENTIAL','Residencial'],['COMMERCIAL','Comercial'],['RURAL','Rural'],['INDUSTRIAL','Industrial']]
const STANDARDS = [['SIMPLE','Simples'],['NORMAL','Normal'],['HIGH','Alto'],['LUXURY','Luxo']]
const CURRENT_STATES = [['VACANT','Desocupado'],['OCCUPIED_OWNER','Ocupado Proprietário'],['OCCUPIED_TENANT','Ocupado Inquilino'],['UNDER_CONSTRUCTION','Em Construção']]
const KEY_LOCATIONS = [['NOT_INFORMED','Não informado'],['OFFICE','Escritório'],['OWNER','Com o Proprietário'],['ONSITE','No Local']]
const FACES = [['NORTH','Norte'],['SOUTH','Sul'],['EAST','Leste'],['WEST','Oeste'],['NORTHEAST','Nordeste'],['NORTHWEST','Noroeste'],['SOUTHEAST','Sudeste'],['SOUTHWEST','Sudoeste']]

const TABS = [
  { id: 'cadastro',    label: 'Cadastro',    icon: Home },
  { id: 'localizacao', label: 'Localização', icon: MapPin },
  { id: 'detalhes',    label: 'Detalhes',    icon: Settings },
  { id: 'anuncios',    label: 'Anúncios',    icon: Globe },
  { id: 'captacao',    label: 'Captação',    icon: Briefcase },
  { id: 'confidencial',label: 'Confidencial',icon: Shield },
]

function fmt(v?: number | null) {
  if (!v) return null
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function Stat({ icon: Icon, label }: { icon: React.ComponentType<any>; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-white/60">
      <Icon className="h-4 w-4 text-white/50" />
      {label}
    </div>
  )
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">{children}</div>
}

function Field({ label, children, span }: { label: string; children: React.ReactNode; span?: string }) {
  return (
    <div className={cn("space-y-1.5", span)}>
      <Label className="text-white/60 text-xs">{label}</Label>
      {children}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-4">
      <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  )
}

function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 cursor-pointer" />
      <span className="text-sm text-white/70">{label}</span>
    </label>
  )
}

function NumInput({ reg, label, span }: { reg: any; label: string; span?: string }) {
  return (
    <Field label={label} span={span}>
      <Input {...reg} type="number" min={0} className="bg-white/5 border-white/10 text-white h-9" />
    </Field>
  )
}

const STATUS_LEAD_COLORS: Record<string, string> = {
  NEW: 'bg-blue-500/20 text-blue-400',
  CONTACTED: 'bg-yellow-500/20 text-yellow-400',
  QUALIFIED: 'bg-purple-500/20 text-purple-400',
  VISITING: 'bg-cyan-500/20 text-cyan-400',
  PROPOSAL: 'bg-orange-500/20 text-orange-400',
  NEGOTIATING: 'bg-indigo-500/20 text-indigo-400',
  WON: 'bg-green-500/20 text-green-400',
  LOST: 'bg-red-500/20 text-red-400',
  ARCHIVED: 'bg-gray-500/20 text-gray-400',
}
const STATUS_LEAD_LABELS: Record<string, string> = {
  NEW: 'Novo', CONTACTED: 'Contatado', QUALIFIED: 'Qualificado', VISITING: 'Visita',
  PROPOSAL: 'Proposta', NEGOTIATING: 'Negociando', WON: 'Ganho', LOST: 'Perdido', ARCHIVED: 'Arquivado',
}

function LeadsHistoryPanel({ propertyId }: { propertyId: string }) {
  const { getValidToken } = useAuth()
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'
  const { data, isLoading } = useQuery({
    queryKey: ['property-leads', propertyId],
    queryFn: async () => {
      const token = await getValidToken()
      const res = await fetch(`${API_URL}/api/v1/properties/by-id/${propertyId}/leads?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return { data: [], meta: { total: 0 } }
      return res.json()
    },
    enabled: !!propertyId,
  })

  const leads = data?.data ?? []
  const total = data?.meta?.total ?? 0

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5" />
          Histórico de Leads / Interessados
        </h3>
        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">{total} lead{total !== 1 ? 's' : ''}</span>
      </div>
      {isLoading ? (
        <p className="text-white/30 text-sm text-center py-4">Carregando leads...</p>
      ) : leads.length === 0 ? (
        <p className="text-white/30 text-sm text-center py-4">Nenhum lead registrado ainda.</p>
      ) : (
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {leads.map((lead: any) => (
            <div key={lead.id} className="flex items-start gap-3 bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors">
              <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 text-sm font-bold text-blue-400">
                {(lead.name || '?').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-white truncate">{lead.name || 'Anônimo'}</p>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_LEAD_COLORS[lead.status] ?? 'bg-gray-500/20 text-gray-400'}`}>
                    {STATUS_LEAD_LABELS[lead.status] ?? lead.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  {lead.email && <span className="text-xs text-white/40 flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</span>}
                  {lead.phone && <span className="text-xs text-white/40 flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>}
                  <span className="text-xs text-white/30 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(lead.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {lead.notes && (
                  <p className="text-xs text-white/40 mt-1 line-clamp-2">{lead.notes}</p>
                )}
              </div>
              <Link href={`/dashboard/leads/${lead.id}`} className="text-xs text-blue-400 hover:text-blue-300 flex-shrink-0">ver →</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const { getValidToken, user } = useAuth()
  // Somente ADMIN e SUPER_ADMIN podem marcar imóveis como destaque da página inicial
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const [editing, setEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('cadastro')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const { data: property, isLoading } = useQuery<PropertyDetail>({
    queryKey: ['property', id],
    queryFn: async () => {
      const token = await getValidToken()
      return propertiesApi.getById(token!, id)
    },
  })

  const { data: usersData } = useQuery<User[]>({
    queryKey: ['users-list'],
    queryFn: async () => {
      const token = await getValidToken()
      return usersApi.list(token!)
    },
  })

  const p = property as any

  const { register, handleSubmit, control, reset, watch, setValue } = useForm({
    values: p ? {
      // Cadastro
      title: p.title ?? '',
      type: p.type ?? 'HOUSE',
      purpose: p.purpose ?? 'SALE',
      category: p.category ?? 'RESIDENTIAL',
      status: p.status ?? 'ACTIVE',
      currentState: p.currentState ?? '',
      occupation: p.occupation ?? '',
      standard: p.standard ?? '',
      auxReference: p.auxReference ?? '',
      description: p.description ?? '',
      descriptionInternal: p.descriptionInternal ?? '',
      videoUrl: p.videoUrl ?? '',
      virtualTourUrl: p.virtualTourUrl ?? '',
      // Pricing
      price: p.price ?? '',
      priceRent: p.priceRent ?? '',
      pricePromo: p.pricePromo ?? '',
      pricePerM2: p.pricePerM2 ?? '',
      condoFee: p.condoFee ?? '',
      iptu: p.iptu ?? '',
      allowExchange: p.allowExchange ?? false,
      valueUnderConsultation: p.valueUnderConsultation ?? false,
      priceNegotiable: p.priceNegotiable ?? false,
      isFeatured: p.isFeatured ?? false,
      isPremium: p.isPremium ?? false,
      // Location
      zipCode: p.zipCode ?? '',
      street: p.street ?? '',
      number: p.number ?? '',
      complement: p.complement ?? '',
      neighborhood: p.neighborhood ?? '',
      commercialNeighborhood: p.commercialNeighborhood ?? '',
      city: p.city ?? '',
      state: p.state ?? '',
      country: p.country ?? 'BR',
      region: p.region ?? '',
      referencePoint: p.referencePoint ?? '',
      latitude: p.latitude ?? '',
      longitude: p.longitude ?? '',
      closedCondo: p.closedCondo ?? false,
      condoName: p.condoName ?? '',
      adminCompany: p.adminCompany ?? '',
      constructionCompany: p.constructionCompany ?? '',
      signOnSite: p.signOnSite ?? false,
      // Details - rooms
      bedrooms: p.bedrooms ?? 0,
      suites: p.suites ?? 0,
      suitesWithCloset: p.suitesWithCloset ?? 0,
      demiSuites: p.demiSuites ?? 0,
      bathrooms: p.bathrooms ?? 0,
      rooms: p.rooms ?? 0,
      livingRooms: p.livingRooms ?? 0,
      diningRooms: p.diningRooms ?? 0,
      tvRooms: p.tvRooms ?? 0,
      parkingSpaces: p.parkingSpaces ?? 0,
      garagesCovered: p.garagesCovered ?? 0,
      garagesOpen: p.garagesOpen ?? 0,
      elevators: p.elevators ?? 0,
      totalFloors: p.totalFloors ?? '',
      floor: p.floor ?? '',
      // Details - areas
      totalArea: p.totalArea ?? '',
      builtArea: p.builtArea ?? '',
      landArea: p.landArea ?? '',
      commonArea: p.commonArea ?? '',
      ceilingHeight: p.ceilingHeight ?? '',
      landDimensions: p.landDimensions ?? '',
      landFace: p.landFace ?? '',
      sunExposure: p.sunExposure ?? '',
      position: p.position ?? '',
      yearBuilt: p.yearBuilt ?? '',
      yearLastReformed: p.yearLastReformed ?? '',
      features: p.features ?? [],
      // SEO
      metaTitle: p.metaTitle ?? '',
      metaDescription: p.metaDescription ?? '',
      metaKeywords: Array.isArray(p.metaKeywords) ? p.metaKeywords.join(', ') : (p.metaKeywords ?? ''),
      // Portais
      publishOlx: !!(p.portalDescriptions as any)?.olx,
      publishZap: !!(p.portalDescriptions as any)?.zap,
      publishVivaReal: !!(p.portalDescriptions as any)?.vivareal,
      publishFacebook: !!(p.portalDescriptions as any)?.facebook,
      // Captação
      captorName: p.captorName ?? '',
      captorCommissionPct: p.captorCommissionPct ?? '',
      exclusivityContract: p.exclusivityContract ?? false,
      commercialConditions: p.commercialConditions ?? '',
      keyLocation: p.keyLocation ?? '',
      // Confidencial
      cib: p.cib ?? '',
      iptuRegistration: p.iptuRegistration ?? '',
      cartorioMatricula: p.cartorioMatricula ?? '',
      electricityInfo: p.electricityInfo ?? '',
      waterInfo: p.waterInfo ?? '',
      documentationPending: p.documentationPending ?? false,
      documentationNotes: p.documentationNotes ?? '',
      isReserved: p.isReserved ?? false,
      authorizedPublish: p.authorizedPublish ?? false,
      showExactLocation: p.showExactLocation ?? false,
    } : undefined,
  })

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = await getValidToken()
      const { publishOlx, publishZap, publishVivaReal, publishFacebook, metaKeywords, ...rest } = data
      const clean: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(rest)) {
        if (v !== '' && v !== undefined && v !== null) clean[k] = v
      }
      // Store portal toggles in portalDescriptions JSON
      clean.portalDescriptions = {
        ...((p?.portalDescriptions as any) ?? {}),
        olx: publishOlx, zap: publishZap, vivareal: publishVivaReal, facebook: publishFacebook,
      }
      // Convert comma-separated keywords to array
      if (metaKeywords) {
        clean.metaKeywords = metaKeywords.split(',').map((k: string) => k.trim()).filter(Boolean)
      }
      return propertiesApi.update(token!, id, clean)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['property', id] })
      setEditing(false)
      // Revalidar páginas públicas imediatamente
      revalidatePublicPages([`/imoveis/${property?.slug || id}`, ...PAGES.properties])
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const token = await getValidToken()
      return propertiesApi.delete(token!, id)
    },
    onSuccess: () => router.push('/dashboard/properties'),
  })

  // Auto-save draft every 30 seconds when editing
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const formValues = watch()
  useEffect(() => {
    if (!editing || !p) return
    const timer = setTimeout(() => {
      setAutoSaveStatus('saving')
      handleSubmit((d) => updateMutation.mutate(d, {
        onSuccess: () => setAutoSaveStatus('saved'),
        onError: () => setAutoSaveStatus('idle'),
      }))()
    }, 30000)
    return () => clearTimeout(timer)
  }, [formValues, editing]) // eslint-disable-line react-hooks/exhaustive-deps

  // Image & Video management
  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadingVideos, setUploadingVideos] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [showPhotoEditor, setShowPhotoEditor] = useState(false)
  const [showMediaEditor, setShowMediaEditor] = useState(false)
  const [mediaEditorToken, setMediaEditorToken] = useState('')
  const [newUploadedMedia, setNewUploadedMedia] = useState<{urls: string[], types: ('photo'|'video')[]} | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const saveImages = async (coverImage: string | undefined, images: string[]) => {
    const token = await getValidToken()
    await propertiesApi.update(token!, id, { coverImage, images } as any)
    qc.invalidateQueries({ queryKey: ['property', id] })
    // Revalidar páginas públicas de imóveis imediatamente
    revalidatePublicPages([`/imoveis/${property?.slug || id}`, ...PAGES.properties])
  }

  const saveVideos = async (videos: string[]) => {
    const token = await getValidToken()
    await propertiesApi.update(token!, id, { videos } as any)
    qc.invalidateQueries({ queryKey: ['property', id] })
    revalidatePublicPages([`/imoveis/${property?.slug || id}`, ...PAGES.properties])
  }

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploadingImages(true)
    try {
      const token = await getValidToken()
      const urls: string[] = []
      for (const file of Array.from(files)) {
        const { url } = await uploadApi.upload(token!, file)
        urls.push(url)
      }
      const existing = p?.images ?? []
      const cover = p?.coverImage ?? urls[0]
      await saveImages(cover, [...existing, ...urls])
      // Abrir editor automaticamente após upload
      setNewUploadedMedia({ urls, types: urls.map(() => 'photo' as const) })
      const tk = await getValidToken()
      setMediaEditorToken(tk)
      setShowMediaEditor(true)
    } catch (e: any) {
      alert(e.message || 'Erro ao fazer upload')
    } finally {
      setUploadingImages(false)
    }
  }

  const handleVideoUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploadingVideos(true)
    try {
      const token = await getValidToken()
      const urls: string[] = []
      for (const file of Array.from(files)) {
        const { url } = await uploadApi.upload(token!, file)
        urls.push(url)
      }
      const existing = (p as any)?.videos ?? []
      await saveVideos([...existing, ...urls])
      // Abrir editor automaticamente após upload de vídeo
      setNewUploadedMedia({ urls, types: urls.map(() => 'video' as const) })
      const tk = await getValidToken()
      setMediaEditorToken(tk)
      setShowMediaEditor(true)
    } catch (e: any) {
      alert(e.message || 'Erro ao fazer upload de vídeo')
    } finally {
      setUploadingVideos(false)
    }
  }

  const handleAddUrl = async () => {
    if (!urlInput.trim()) return
    const url = urlInput.trim()
    setUrlInput('')
    setShowUrlInput(false)
    const existing = p?.images ?? []
    const cover = p?.coverImage ?? url
    await saveImages(cover, [...existing, url])
  }

  if (isLoading) return <div className="p-6 text-white/40 text-center py-20">Carregando...</div>
  if (!property) return <div className="p-6 text-red-400 text-center py-20">Imóvel não encontrado</div>

  const allPhotos = [...(p.coverImage ? [p.coverImage] : []), ...(p.images ?? []).filter((u: string) => u !== p.coverImage)]

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/dashboard/properties">
            <Button variant="ghost" size="icon" className="text-white/60 hover:text-white mt-1 h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-white leading-tight">{p.title}</h1>
              <Badge className={cn('border-0 text-xs', STATUS_BADGE[p.status] ?? 'bg-white/10 text-white/40')}>
                {STATUSES.find(s => s[0] === p.status)?.[1] ?? p.status}
              </Badge>
              {p.isFeatured && <Badge className="border-0 text-xs bg-yellow-500/20 text-yellow-400">★ Destaque</Badge>}
            </div>
            <p className="text-white/40 text-sm mt-0.5">
              {TYPE_LABELS[p.type] ?? p.type} · {PURPOSE_LABELS[p.purpose] ?? p.purpose}
              {p.reference ? ` · Ref: ${p.reference}` : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {!editing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}
                className="border-white/20 text-white/70 hover:text-white gap-2 h-8">
                <Edit className="h-3.5 w-3.5" /> Editar
              </Button>
              <Link href={`/imoveis/${p.slug}`} target="_blank">
                <Button variant="ghost" size="sm" className="text-white/50 hover:text-white gap-1.5 h-8">
                  <Eye className="h-3.5 w-3.5" /> Ver no site
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => { if (confirm('Desativar este imóvel?')) deleteMutation.mutate() }}
                className="text-red-400 hover:bg-red-500/10 hover:text-red-300 h-8"
                disabled={deleteMutation.isPending}>
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              {autoSaveStatus === 'saving' && <span className="text-xs text-yellow-400 animate-pulse">Salvando...</span>}
              {autoSaveStatus === 'saved' && <span className="text-xs text-green-400">Salvo automaticamente</span>}
              <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setAutoSaveStatus('idle'); reset() }}
                className="text-white/60 h-8">Cancelar</Button>
              <Button size="sm" onClick={handleSubmit((d) => updateMutation.mutate(d))}
                disabled={updateMutation.isPending} className="gap-2 h-8">
                <Save className="h-3.5 w-3.5" />
                {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── PHOTOS & VIDEOS section (always visible) ─────────────────────── */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">
            Mídia · {allPhotos.length} foto{allPhotos.length !== 1 ? 's' : ''} · {((p as any)?.videos ?? []).length} vídeo{((p as any)?.videos ?? []).length !== 1 ? 's' : ''}
          </h3>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowUrlInput(v => !v)}
              className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/10">
              <ImagePlus className="h-3.5 w-3.5" /> URL Foto
            </button>
            <button onClick={() => fileInputRef.current?.click()} disabled={uploadingImages}
              className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/10 disabled:opacity-40">
              <Upload className="h-3.5 w-3.5" /> {uploadingImages ? 'Enviando...' : 'Fotos'}
            </button>
            <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/*" className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)} />
            <button onClick={() => videoInputRef.current?.click()} disabled={uploadingVideos}
              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors px-2 py-1 rounded-lg hover:bg-blue-400/10 border border-blue-400/20 disabled:opacity-40">
              <Film className="h-3.5 w-3.5" /> {uploadingVideos ? 'Enviando...' : 'Vídeos'}
            </button>
            <input ref={videoInputRef} type="file" accept="video/mp4,video/mov,video/quicktime,video/webm,video/*" multiple className="hidden"
              onChange={(e) => handleVideoUpload(e.target.files)} />
            {allPhotos.length > 0 && (
              <button onClick={async () => {
                const a = document.createElement('a')
                for (const url of allPhotos) {
                  a.href = url; a.download = url.split('/').pop() || 'foto.jpg'; a.click()
                  await new Promise(r => setTimeout(r, 300))
                }
              }}
                className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 transition-colors px-2 py-1 rounded-lg hover:bg-green-400/10 border border-green-400/20">
                <Download className="h-3.5 w-3.5" /> Baixar Todas
              </button>
            )}
            {(allPhotos.length > 0 || ((p as any)?.videos ?? []).length > 0) && (
              <button onClick={async () => { const tk = await getValidToken(); setMediaEditorToken(tk); setShowMediaEditor(true) }}
                className="flex items-center gap-1.5 text-xs text-yellow-400 hover:text-yellow-300 transition-colors px-2 py-1 rounded-lg hover:bg-yellow-400/10 border border-yellow-400/30">
                <Wand2 className="h-3.5 w-3.5" /> Efeitos & Logo
              </button>
            )}
          </div>
        </div>
        {showUrlInput && (
          <div className="flex gap-2">
            <input value={urlInput} onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddUrl()}
              placeholder="Cole a URL da imagem (https://...)"
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/20" />
            <button onClick={handleAddUrl} className="px-3 py-1.5 bg-white/10 rounded-lg text-xs text-white hover:bg-white/20 transition-colors">
              Adicionar
            </button>
          </div>
        )}
        {allPhotos.length === 0 ? (
          <div className="py-6 text-center text-white/50 text-sm">
            <ImagePlus className="h-7 w-7 mx-auto mb-2 opacity-30" />
            Nenhuma foto. Adicione por URL ou upload.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {allPhotos.map((url: string, idx: number) => (
                <div key={url} className="relative group rounded-lg overflow-hidden aspect-video bg-white/5">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  {url === p.coverImage && (
                    <div className="absolute top-1 left-1 bg-[#C9A84C] text-[#1B2B5B] text-[10px] font-bold px-1 py-0.5 rounded flex items-center gap-0.5">
                      <Star className="h-2 w-2 fill-current" /> Capa
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                    <button onClick={() => setLightboxIndex(idx)}
                      className="p-1 bg-white/20 rounded hover:bg-white/30 text-white">
                      <ZoomIn className="h-3 w-3" />
                    </button>
                    {url !== p.coverImage && (
                      <button onClick={async () => await saveImages(url, p.images ?? [])}
                        className="text-[10px] bg-[#C9A84C] text-[#1B2B5B] px-1.5 py-0.5 rounded font-semibold">
                        Capa
                      </button>
                    )}
                    <button onClick={async () => {
                      const imgs = (p.images ?? []).filter((u: string) => u !== url)
                      const cover = p.coverImage === url ? imgs[0] : p.coverImage
                      await saveImages(cover, imgs)
                    }} className="p-1 bg-red-500/80 rounded hover:bg-red-500 text-white">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {lightboxIndex !== null && (
              <PropertyImageLightbox images={allPhotos} startIndex={lightboxIndex}
                title={p.title} onClose={() => setLightboxIndex(null)} />
            )}
          </>
        )}
      </div>

      {/* ── VIDEOS GRID ──────────────────────────────────────── */}
      {((p as any)?.videos ?? []).length > 0 && (
        <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">
            Vídeos ({((p as any)?.videos ?? []).length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {((p as any)?.videos ?? []).map((url: string, idx: number) => (
              <div key={idx} className="relative group rounded-xl overflow-hidden bg-black border border-white/10">
                <video src={url} className="w-full aspect-video object-contain" controls preload="metadata" />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={async () => {
                      const newVideos = ((p as any)?.videos ?? []).filter((_: string, i: number) => i !== idx)
                      await saveVideos(newVideos)
                    }}
                    className="p-1.5 bg-red-500/80 rounded-lg hover:bg-red-500 text-white"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <div className="absolute bottom-2 left-2">
                  <span className="bg-black/60 text-white/60 text-[10px] px-2 py-0.5 rounded-full">Vídeo {idx + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MEDIA EDITOR MODAL (efeitos + logo para fotos e vídeos) ─────── */}
      {showMediaEditor && (
        <MediaEditorModal
          propertyId={id}
          photos={allPhotos}
          videos={(p as any)?.videos ?? []}
          logoUrl={(p as any)?.company?.logoUrl ?? null}
          token={mediaEditorToken}
          newMediaUrls={newUploadedMedia?.urls}
          newMediaTypes={newUploadedMedia?.types}
          onSave={async (newPhotos, newVideos) => {
            const cover = newPhotos[0]
            const rest = newPhotos.slice(1)
            await saveImages(cover, rest)
            await saveVideos(newVideos)
            setNewUploadedMedia(null)
          }}
          onClose={() => { setShowMediaEditor(false); setNewUploadedMedia(null) }}
        />
      )}

      {/* ── PHOTO EDITOR PANEL (legado) ─────────────────────────── */}
      {showPhotoEditor && (
        <PhotoEditorPanel
          propertyId={id}
          photos={allPhotos}
          onPhotosUpdated={async (newPhotos) => {
            const cover = newPhotos[0]
            const rest = newPhotos.slice(1)
            await saveImages(cover, rest)
            setShowPhotoEditor(false)
          }}
          onClose={() => setShowPhotoEditor(false)}
        />
      )}

      {/* ── TABS ─────────────────────────────────────────────────────────── */}
      {editing ? (
        <div className="space-y-4">
          {/* Tab navigation */}
          <div className="flex gap-1 bg-white/5 rounded-xl p-1 overflow-x-auto">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all',
                  activeTab === tab.id
                    ? 'bg-white/15 text-white'
                    : 'text-white/40 hover:text-white/70'
                )}>
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── TAB: CADASTRO ─────────────────────────────────────────── */}
          {activeTab === 'cadastro' && (
            <div className="space-y-4">
              <Section title="Identificação">
                <Field label="Título do imóvel" span="col-span-full sm:col-span-2">
                  <Input {...register('title')} className="bg-white/5 border-white/10 text-white" />
                </Field>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Field label="Tipo">
                    <Controller name="type" control={control} render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>{TYPES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                      </Select>
                    )} />
                  </Field>
                  <Field label="Finalidade">
                    <Controller name="purpose" control={control} render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>{PURPOSES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                      </Select>
                    )} />
                  </Field>
                  <Field label="Categoria">
                    <Controller name="category" control={control} render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>{CATEGORIES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                      </Select>
                    )} />
                  </Field>
                  <Field label="Situação">
                    <Controller name="status" control={control} render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>{STATUSES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                      </Select>
                    )} />
                  </Field>
                  <Field label="Estado Atual">
                    <Controller name="currentState" control={control} render={({ field }) => (
                      <Select value={field.value || ''} onValueChange={field.onChange}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white h-9"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{CURRENT_STATES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                      </Select>
                    )} />
                  </Field>
                  <Field label="Padrão">
                    <Controller name="standard" control={control} render={({ field }) => (
                      <Select value={field.value || ''} onValueChange={field.onChange}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white h-9"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{STANDARDS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                      </Select>
                    )} />
                  </Field>
                  <Field label="Ref. Auxiliar">
                    <Input {...register('auxReference')} className="bg-white/5 border-white/10 text-white h-9" />
                  </Field>
                </div>
              </Section>

              <Section title="Valores">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Field label="Preço Venda (R$)">
                    <Controller name="price" control={control} render={({ field }) => (
                      <MoneyInput value={field.value} onChange={field.onChange} className="bg-white/5 border-white/10 text-white h-9" />
                    )} />
                  </Field>
                  <Field label="Preço Aluguel (R$)">
                    <Controller name="priceRent" control={control} render={({ field }) => (
                      <MoneyInput value={field.value} onChange={field.onChange} className="bg-white/5 border-white/10 text-white h-9" />
                    )} />
                  </Field>
                  <Field label="Preço Promocional (R$)">
                    <Controller name="pricePromo" control={control} render={({ field }) => (
                      <MoneyInput value={field.value} onChange={field.onChange} className="bg-white/5 border-white/10 text-white h-9" />
                    )} />
                  </Field>
                  <Field label="Preço por M² (R$)">
                    <Controller name="pricePerM2" control={control} render={({ field }) => (
                      <MoneyInput value={field.value} onChange={field.onChange} className="bg-white/5 border-white/10 text-white h-9" />
                    )} />
                  </Field>
                  <Field label="Condomínio (R$)">
                    <Controller name="condoFee" control={control} render={({ field }) => (
                      <MoneyInput value={field.value} onChange={field.onChange} className="bg-white/5 border-white/10 text-white h-9" />
                    )} />
                  </Field>
                  <Field label="IPTU (R$/ano)">
                    <Controller name="iptu" control={control} render={({ field }) => (
                      <MoneyInput value={field.value} onChange={field.onChange} className="bg-white/5 border-white/10 text-white h-9" />
                    )} />
                  </Field>
                </div>
                <div className="flex flex-wrap gap-6 pt-1">
                  <Controller name="allowExchange" control={control} render={({ field }) => (
                    <CheckField label="Aceita Permuta" checked={field.value} onChange={field.onChange} />
                  )} />
                  <Controller name="priceNegotiable" control={control} render={({ field }) => (
                    <CheckField label="Valor Negociável" checked={field.value} onChange={field.onChange} />
                  )} />
                  <Controller name="valueUnderConsultation" control={control} render={({ field }) => (
                    <CheckField label="Valor Sob Consulta" checked={field.value} onChange={field.onChange} />
                  )} />
                  {isAdmin && (
                    <Controller name="isFeatured" control={control} render={({ field }) => (
                      <CheckField label="★ Destaque na Página Inicial (somente admin)" checked={field.value} onChange={field.onChange} />
                    )} />
                  )}
                </div>
              </Section>

              <Section title="Descrição Pública">
                <textarea {...register('description')} rows={5}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-white/40"
                  placeholder="Descrição que será publicada no site e portais..." />
              </Section>

              <Section title="Descrição Interna (não publicada)">
                <textarea {...register('descriptionInternal')} rows={4}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-white/40"
                  placeholder="Informações internas, histórico, observações do corretor..." />
                <p className="text-xs text-white/50">* Esta informação é de uso interno e NÃO será divulgada no site e portais.</p>
              </Section>

              <Section title="Vídeo e Tour Virtual">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Vídeo YouTube (URL ou ID)">
                    <Input {...register('videoUrl')} placeholder="https://youtube.com/watch?v=..." className="bg-white/5 border-white/10 text-white h-9 placeholder:text-white/40" />
                  </Field>
                  <Field label="Tour Virtual (URL)">
                    <Input {...register('virtualTourUrl')} placeholder="https://..." className="bg-white/5 border-white/10 text-white h-9 placeholder:text-white/40" />
                  </Field>
                </div>
              </Section>
            </div>
          )}

          {/* ── TAB: LOCALIZAÇÃO ──────────────────────────────────────── */}
          {activeTab === 'localizacao' && (
            <div className="space-y-4">
              <Section title="Endereço">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Field label="CEP *">
                    <Controller name="zipCode" control={control} render={({ field }) => (
                      <CepInput
                        value={field.value}
                        onChange={field.onChange}
                        onAddressFound={(addr) => {
                          setValue('street', addr.street)
                          setValue('neighborhood', addr.neighborhood)
                          setValue('commercialNeighborhood', addr.neighborhood)
                          setValue('city', addr.city)
                          setValue('state', addr.state)
                        }}
                        className="bg-white/5 border-white/10 text-white h-9"
                      />
                    )} />
                  </Field>
                  <Field label="Endereço" span="sm:col-span-2">
                    <Input {...register('street')} className="bg-white/5 border-white/10 text-white h-9" />
                  </Field>
                  <Field label="Número">
                    <Input {...register('number')} className="bg-white/5 border-white/10 text-white h-9" />
                  </Field>
                  <Field label="Complemento">
                    <Input {...register('complement')} className="bg-white/5 border-white/10 text-white h-9" />
                  </Field>
                  <Field label="Bairro Comercial (exibido no site)">
                    <Input {...register('commercialNeighborhood')} className="bg-white/5 border-white/10 text-white h-9" />
                  </Field>
                  <Field label="Bairro Oficial">
                    <Input {...register('neighborhood')} className="bg-white/5 border-white/10 text-white h-9" />
                  </Field>
                  <Field label="Cidade">
                    <Input {...register('city')} className="bg-white/5 border-white/10 text-white h-9" />
                  </Field>
                  <Field label="UF">
                    <Input {...register('state')} maxLength={2} className="bg-white/5 border-white/10 text-white h-9 uppercase" placeholder="SP" />
                  </Field>
                  <Field label="País">
                    <Input {...register('country')} className="bg-white/5 border-white/10 text-white h-9" defaultValue="BR" />
                  </Field>
                  <Field label="Região">
                    <Input {...register('region')} className="bg-white/5 border-white/10 text-white h-9" />
                  </Field>
                  <Field label="Ponto de Referência" span="sm:col-span-2">
                    <Input {...register('referencePoint')} className="bg-white/5 border-white/10 text-white h-9" />
                  </Field>
                </div>
              </Section>

              <Section title="Coordenadas GPS">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Latitude">
                    <Input {...register('latitude')} type="number" step="any" placeholder="-20.123456" className="bg-white/5 border-white/10 text-white h-9" />
                  </Field>
                  <Field label="Longitude">
                    <Input {...register('longitude')} type="number" step="any" placeholder="-47.654321" className="bg-white/5 border-white/10 text-white h-9" />
                  </Field>
                </div>
                <div className="mt-3 p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
                  <Controller name="showExactLocation" control={control} render={({ field }) => (
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={e => field.onChange(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded border-white/20 bg-white/5 text-yellow-500 cursor-pointer flex-shrink-0"
                      />
                      <div>
                        <span className="text-sm font-semibold text-yellow-400">Exibir localização exata no mapa público</span>
                        <p className="text-xs text-white/40 mt-0.5">
                          Quando ativado, o pin do imóvel aparece no endereço exato no portal público.
                          Por padrão, apenas o centróide do bairro é exibido para proteger a privacidade.
                        </p>
                      </div>
                    </label>
                  )} />
                </div>
              </Section>

              <Section title="Condomínio / Empreendimento">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <Controller name="closedCondo" control={control} render={({ field }) => (
                    <div className="col-span-full">
                      <CheckField label="Condomínio Fechado" checked={field.value} onChange={field.onChange} />
                    </div>
                  )} />
                  <Field label="Nome do Condomínio / Empreendimento" span="sm:col-span-2">
                    <Input {...register('condoName')} className="bg-white/5 border-white/10 text-white h-9" placeholder="Ex: Residencial das Flores, Ed. Parque Verde..." />
                    <p className="text-[11px] text-white/30 mt-0.5">💡 Deixe em branco para detectar automaticamente da descrição</p>
                  </Field>
                  <Field label="Administradora">
                    <Input {...register('adminCompany')} className="bg-white/5 border-white/10 text-white h-9" />
                  </Field>
                  <Field label="Construtora">
                    <Input {...register('constructionCompany')} className="bg-white/5 border-white/10 text-white h-9" />
                  </Field>
                  <Controller name="signOnSite" control={control} render={({ field }) => (
                    <div className="col-span-full">
                      <CheckField label="Placa no local" checked={field.value} onChange={field.onChange} />
                    </div>
                  )} />
                </div>
              </Section>
            </div>
          )}

          {/* ── TAB: DETALHES ─────────────────────────────────────────── */}
          {activeTab === 'detalhes' && (
            <div className="space-y-4">
              <Section title="Cômodos">
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                  <NumInput reg={register('bedrooms')} label="Dormitórios" />
                  <NumInput reg={register('suites')} label="Suítes" />
                  <NumInput reg={register('suitesWithCloset')} label="Suítes c/ Closet" />
                  <NumInput reg={register('demiSuites')} label="Demi-suítes" />
                  <NumInput reg={register('bathrooms')} label="Banheiros" />
                  <NumInput reg={register('rooms')} label="Salas (total)" />
                  <NumInput reg={register('livingRooms')} label="Sala de Estar" />
                  <NumInput reg={register('diningRooms')} label="Sala de Jantar" />
                  <NumInput reg={register('tvRooms')} label="Salas de TV" />
                  <NumInput reg={register('parkingSpaces')} label="Vagas (total)" />
                  <NumInput reg={register('garagesCovered')} label="Gar. Cobertas" />
                  <NumInput reg={register('garagesOpen')} label="Gar. Descobertas" />
                  <NumInput reg={register('elevators')} label="Elevadores" />
                  <NumInput reg={register('totalFloors')} label="Nº de Andares" />
                  <NumInput reg={register('floor')} label="Andar" />
                </div>
              </Section>

              <Section title="Áreas">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Field label="Área Construída (m²)">
                    <Input {...register('builtArea')} type="number" step="0.01" className="bg-white/5 border-white/10 text-white h-9" />
                  </Field>
                  <Field label="Área Útil (m²)">
                    <Input {...register('totalArea')} type="number" step="0.01" className="bg-white/5 border-white/10 text-white h-9" />
                  </Field>
                  <Field label="Área Total Terreno (m²)">
                    <Input {...register('landArea')} type="number" step="0.01" className="bg-white/5 border-white/10 text-white h-9" />
                  </Field>
                  <Field label="Área Comum (m²)">
                    <Input {...register('commonArea')} type="number" step="0.01" className="bg-white/5 border-white/10 text-white h-9" />
                  </Field>
                  <Field label="Pé Direto (m)">
                    <Input {...register('ceilingHeight')} type="number" step="0.01" className="bg-white/5 border-white/10 text-white h-9" />
                  </Field>
                  <Field label="Dimensão Terreno">
                    <Input {...register('landDimensions')} placeholder="Ex: 10x20" className="bg-white/5 border-white/10 text-white h-9" />
                  </Field>
                  <Field label="Face">
                    <Controller name="landFace" control={control} render={({ field }) => (
                      <Select value={field.value || ''} onValueChange={field.onChange}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white h-9"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{FACES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                      </Select>
                    )} />
                  </Field>
                  <Field label="Insolamento">
                    <Input {...register('sunExposure')} placeholder="Sol da manhã / tarde" className="bg-white/5 border-white/10 text-white h-9" />
                  </Field>
                  <Field label="Posição">
                    <Input {...register('position')} placeholder="Frente / Fundos / Meio" className="bg-white/5 border-white/10 text-white h-9" />
                  </Field>
                  <Field label="Ano de Construção">
                    <Input {...register('yearBuilt')} type="number" className="bg-white/5 border-white/10 text-white h-9" />
                  </Field>
                  <Field label="Ano Última Reforma">
                    <Input {...register('yearLastReformed')} type="number" className="bg-white/5 border-white/10 text-white h-9" />
                  </Field>
                </div>
              </Section>

              <PropertyFeaturesEditor
                selected={watch('features') ?? []}
                onChange={(f) => setValue('features', f)}
              />
            </div>
          )}

          {/* ── TAB: ANÚNCIOS ─────────────────────────────────────────── */}
          {activeTab === 'anuncios' && (
            <div className="space-y-4">
              <Section title="Opções de Publicação">
                <div className="flex flex-wrap gap-6">
                  {isAdmin && (
                    <Controller name="isFeatured" control={control} render={({ field }) => (
                      <CheckField label="★ Destaque na Página Inicial (somente admin)" checked={field.value} onChange={field.onChange} />
                    )} />
                  )}
                  <Controller name="isPremium" control={control} render={({ field }) => (
                    <CheckField label="Premium" checked={field.value} onChange={field.onChange} />
                  )} />
                  <Controller name="authorizedPublish" control={control} render={({ field }) => (
                    <CheckField label="Autorizado para Publicar" checked={field.value} onChange={field.onChange} />
                  )} />
                </div>
              </Section>

              {/* Portais */}
              <Section title="Portais de Publicação">
                <p className="text-xs text-white/50 -mt-1">Selecione em quais portais este imóvel será publicado.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {([
                    ['publishOlx',      'OLX',          '#FF6500'],
                    ['publishZap',      'Zap Imóveis',  '#7C3AED'],
                    ['publishVivaReal', 'Viva Real',    '#16A34A'],
                    ['publishFacebook', 'Facebook Mkt', '#1877F2'],
                  ] as const).map(([name, label, color]) => (
                    <Controller key={name} name={name as any} control={control} render={({ field }) => (
                      <button
                        type="button"
                        onClick={() => field.onChange(!field.value)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all',
                          field.value
                            ? 'border-white/30 bg-white/15 text-white'
                            : 'border-white/10 bg-white/5 text-white/40 hover:text-white/60'
                        )}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: field.value ? color : 'rgba(255,255,255,0.2)' }}
                        />
                        {label}
                      </button>
                    )} />
                  ))}
                </div>
              </Section>

              <Section title="SEO — Otimização para Buscadores">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-white/60 text-xs">Título SEO</Label>
                      <span className={cn('text-xs tabular-nums', (watch('metaTitle')?.length ?? 0) > 50 ? (watch('metaTitle')?.length ?? 0) > 60 ? 'text-red-400' : 'text-yellow-400' : 'text-white/30')}>
                        {watch('metaTitle')?.length ?? 0}/60
                      </span>
                    </div>
                    <Input {...register('metaTitle')} maxLength={60}
                      placeholder="Ex: Apartamento 3 quartos em Franca SP | Imobiliária Lemos"
                      className="bg-white/5 border-white/10 text-white h-9 placeholder:text-white/40" />
                    <p className="text-xs text-white/40">Ideal: até 60 caracteres. Aparece como título no Google.</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-white/60 text-xs">Meta Descrição</Label>
                      <span className={cn('text-xs tabular-nums', (watch('metaDescription')?.length ?? 0) > 130 ? (watch('metaDescription')?.length ?? 0) > 160 ? 'text-red-400' : 'text-yellow-400' : 'text-white/30')}>
                        {watch('metaDescription')?.length ?? 0}/160
                      </span>
                    </div>
                    <textarea {...register('metaDescription')} rows={3} maxLength={160}
                      placeholder="Descreva o imóvel em até 160 caracteres para aparecer no Google..."
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-white/40" />
                    <p className="text-xs text-white/40">Ideal: 120–160 caracteres. Aparece como descrição no Google.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-white/60 text-xs">Palavras-chave (separadas por vírgula)</Label>
                    <Input {...register('metaKeywords')}
                      placeholder="apartamento, 3 quartos, Franca, imóvel à venda..."
                      className="bg-white/5 border-white/10 text-white h-9 placeholder:text-white/40" />
                  </div>

                  {/* Google Preview */}
                  {(watch('metaTitle') || watch('metaDescription')) && (
                    <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Search className="h-3.5 w-3.5 text-white/30" />
                        <span className="text-xs text-white/30 uppercase tracking-wider font-semibold">Prévia no Google</span>
                      </div>
                      <div className="bg-white rounded-lg p-4 space-y-1">
                        <p className="text-xs text-[#006621] truncate">www.agoraencontrei.com.br/imoveis/{p?.slug ?? '...'}</p>
                        <p className="text-[#1a0dab] text-base font-medium leading-snug line-clamp-1">
                          {watch('metaTitle') || p?.title || 'Título do imóvel | Imobiliária Lemos'}
                        </p>
                        <p className="text-[#545454] text-sm leading-snug line-clamp-2">
                          {watch('metaDescription') || p?.description || 'Descrição do imóvel aparecerá aqui. Preencha a meta descrição para controlar o que o Google exibe nos resultados de busca.'}
                        </p>
                      </div>
                      <p className="text-xs text-white/30">* Prévia aproximada — o Google pode exibir de forma diferente.</p>
                    </div>
                  )}

                  <p className="text-xs text-white/50">* Se deixar em branco, o título e descrição do imóvel serão usados automaticamente.</p>
                </div>
              </Section>
            </div>
          )}

          {/* ── TAB: CAPTAÇÃO ─────────────────────────────────────────── */}
          {activeTab === 'captacao' && (
            <div className="space-y-4">
              <Section title="Captador Principal">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <Field label="Captador (Corretor)" span="sm:col-span-2">
                    <Controller name="captorName" control={control} render={({ field }) => (
                      <select
                        value={field.value ?? ''}
                        onChange={e => field.onChange(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">— Selecione o captador —</option>
                        {(usersData ?? []).filter(u => ['BROKER', 'ADMIN', 'MANAGER', 'SUPER_ADMIN'].includes(u.role)).map(u => (
                          <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
                        ))}
                      </select>
                    )} />
                  </Field>
                  <Field label="Comissão (%)">
                    <Input {...register('captorCommissionPct')} type="number" step="0.01" min={0} max={100}
                      className="bg-white/5 border-white/10 text-white h-9" />
                  </Field>
                  <Field label="Data de Captação">
                    <Input {...register('captureDate' as any)} type="date"
                      className="bg-white/5 border-white/10 text-white h-9 [color-scheme:dark]"
                      defaultValue={(p as any)?.captureDate ? new Date((p as any).captureDate).toISOString().split('T')[0] : ''} />
                  </Field>
                </div>
              </Section>

              <Section title="Condições Comerciais">
                <textarea {...register('commercialConditions')} rows={4}
                  placeholder="Condições de venda, prazo, observações comerciais..."
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-white/40" />
              </Section>

              <Section title="Exclusividade">
                <Controller name="exclusivityContract" control={control} render={({ field }) => (
                  <CheckField label="Contrato de Exclusividade" checked={field.value} onChange={field.onChange} />
                )} />
              </Section>

              <Section title="Controle de Chaves">
                <Field label="Local das Chaves">
                  <Controller name="keyLocation" control={control} render={({ field }) => (
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white h-9 max-w-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{KEY_LOCATIONS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                  )} />
                </Field>
              </Section>

              <Section title="Auditoria">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-white/40">
                  <div><p className="text-white/50 mb-0.5">Cadastrado em</p><p>{p.createdAt ? new Date(p.createdAt).toLocaleString('pt-BR') : '—'}</p></div>
                  <div><p className="text-white/50 mb-0.5">Atualizado em</p><p>{p.updatedAt ? new Date(p.updatedAt).toLocaleString('pt-BR') : '—'}</p></div>
                  <div><p className="text-white/50 mb-0.5">Publicado em</p><p>{p.publishedAt ? new Date(p.publishedAt).toLocaleString('pt-BR') : '—'}</p></div>
                  <div><p className="text-white/50 mb-0.5">Visualizações</p><p>{p.views ?? 0}</p></div>
                </div>
              </Section>
            </div>
          )}

          {/* ── TAB: CONFIDENCIAL ─────────────────────────────────────── */}
          {activeTab === 'confidencial' && (
            <div className="space-y-4">
              <Section title="Documentação">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <Field label="CIB (Código Imobiliário Brasileiro)">
                    <Input {...register('cib')} className="bg-white/5 border-white/10 text-white h-9" />
                  </Field>
                  <Field label="Cadastro Prefeitura (Nº IPTU / INCRA)">
                    <Input {...register('iptuRegistration')} className="bg-white/5 border-white/10 text-white h-9" />
                  </Field>
                  <Field label="Cartório de Imóveis (Nº Matrícula)">
                    <Input {...register('cartorioMatricula')} className="bg-white/5 border-white/10 text-white h-9" />
                  </Field>
                  <Field label="Eletricidade (Concessionária)">
                    <Input {...register('electricityInfo')} className="bg-white/5 border-white/10 text-white h-9" />
                  </Field>
                  <Field label="Água e Saneamento">
                    <Input {...register('waterInfo')} className="bg-white/5 border-white/10 text-white h-9" />
                  </Field>
                </div>
                <div className="pt-2">
                  <Controller name="documentationPending" control={control} render={({ field }) => (
                    <CheckField label="Documentação Pendente" checked={field.value} onChange={field.onChange} />
                  )} />
                </div>
                <Field label="Observações de Documentação">
                  <textarea {...register('documentationNotes')} rows={3}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-white/40" />
                </Field>
              </Section>

              <Section title="Reserva e Publicação">
                <div className="flex flex-wrap gap-6">
                  <Controller name="isReserved" control={control} render={({ field }) => (
                    <CheckField label="Imóvel Reservado" checked={field.value} onChange={field.onChange} />
                  )} />
                  <Controller name="authorizedPublish" control={control} render={({ field }) => (
                    <CheckField label="Autorizado para Publicar" checked={field.value} onChange={field.onChange} />
                  )} />
                </div>
              </Section>
            </div>
          )}

          {/* Bottom save bar */}
          <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
            <Button variant="ghost" onClick={() => { setEditing(false); reset() }} className="text-white/60">Cancelar</Button>
            <Button onClick={handleSubmit((d) => updateMutation.mutate(d))}
              disabled={updateMutation.isPending} className="gap-2 min-w-[120px]">
              <Save className="h-3.5 w-3.5" />
              {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>
      ) : (
        /* ── VIEW MODE ───────────────────────────────────────────────────── */
        <div className="space-y-4">
          {/* Price + Stats */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {p.price && (
              <div>
                <p className="text-xs text-white/40 mb-1">Venda</p>
                <p className="text-lg font-bold text-white">{fmt(p.price)}</p>
              </div>
            )}
            {p.priceRent && (
              <div>
                <p className="text-xs text-white/40 mb-1">Aluguel</p>
                <p className="text-lg font-bold text-white">{fmt(p.priceRent)}/mês</p>
              </div>
            )}
            {p.condoFee && (
              <div>
                <p className="text-xs text-white/40 mb-1">Condomínio</p>
                <p className="text-sm font-medium text-white/70">{fmt(p.condoFee)}</p>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-white/50 text-sm">
              <Eye className="h-4 w-4" /> {p.views} visualizações
            </div>
          </div>

          {/* Characteristics */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-3">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Características</h3>
            <div className="flex flex-wrap gap-4">
              {p.bedrooms > 0 && <Stat icon={BedDouble} label={`${p.bedrooms} quarto${p.bedrooms > 1 ? 's' : ''}`} />}
              {p.suites > 0 && <Stat icon={BedDouble} label={`${p.suites} suíte${p.suites > 1 ? 's' : ''}`} />}
              {p.bathrooms > 0 && <Stat icon={Bath} label={`${p.bathrooms} banheiro${p.bathrooms > 1 ? 's' : ''}`} />}
              {p.parkingSpaces > 0 && <Stat icon={Car} label={`${p.parkingSpaces} vaga${p.parkingSpaces > 1 ? 's' : ''}`} />}
              {p.totalArea && <Stat icon={Ruler} label={`${p.totalArea} m² útil`} />}
              {p.builtArea && <Stat icon={Ruler} label={`${p.builtArea} m² construído`} />}
              {p.landArea && <Stat icon={Ruler} label={`${p.landArea} m² terreno`} />}
              {p.yearBuilt && <Stat icon={Calendar} label={`Construído em ${p.yearBuilt}`} />}
            </div>
          </div>

          {/* Address */}
          {(p.city || p.neighborhood) && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-5">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Localização</h3>
              <div className="flex items-start gap-2 text-white/70">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-white/50" />
                <p className="text-sm">
                  {[p.street, p.number, p.complement].filter(Boolean).join(', ')}
                  {p.street && <br />}
                  {[p.neighborhood, p.city, p.state].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
          )}

          {/* Description */}
          {p.description && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-5">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Descrição</h3>
              <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line">{p.description}</p>
            </div>
          )}

          {/* Owner */}
          {p.owners && p.owners.length > 0 && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-5">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
                Proprietário{p.owners.length > 1 ? 's' : ''}
              </h3>
              <div className="space-y-3">
                {p.owners.map((o: any) => (
                  <div key={o.contact.id} className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-full bg-emerald-500/20 flex items-center justify-center text-sm font-bold text-emerald-400 flex-shrink-0">
                      <UserIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">{o.contact.name}</p>
                      {o.contact.cpf && <p className="text-xs text-white/40">CPF: {o.contact.cpf}</p>}
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5">
                        {o.contact.phone && <div className="flex items-center gap-1 text-xs text-white/50"><Phone className="h-3 w-3" />{o.contact.phone}</div>}
                        {o.contact.email && <div className="flex items-center gap-1 text-xs text-white/50"><Mail className="h-3 w-3" />{o.contact.email}</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          {p.features && p.features.length > 0 && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-5">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Diferenciais</h3>
              <div className="flex flex-wrap gap-2">
                {p.features.map((f: string) => (
                  <span key={f} className="px-3 py-1 bg-white/10 rounded-full text-xs text-white/70">{f}</span>
                ))}
              </div>
            </div>
          )}

          {/* Broker */}
          {p.user && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-5">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Corretor Responsável</h3>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold text-white">
                  {p.user.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{p.user.name}</p>
                  {p.user.creciNumber && <p className="text-xs text-white/40">CRECI {p.user.creciNumber}</p>}
                  {p.user.phone && <p className="text-xs text-white/40">{p.user.phone}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Confidential info summary */}
          {(p.captorName || p.cib || p.isReserved || p.documentationPending) && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-5">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Info. Confidenciais</h3>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/50">
                {p.captorName && <span>Captador: <span className="text-white/70">{p.captorName}</span></span>}
                {p.cib && <span>CIB: <span className="text-white/70">{p.cib}</span></span>}
                {p.keyLocation && <span>Chaves: <span className="text-white/70">{KEY_LOCATIONS.find(k => k[0] === p.keyLocation)?.[1] ?? p.keyLocation}</span></span>}
                {p.isReserved && <Badge className="bg-orange-500/20 text-orange-400 border-0 text-[10px]">Reservado</Badge>}
                {p.documentationPending && <Badge className="bg-red-500/20 text-red-400 border-0 text-[10px]">Doc. Pendente</Badge>}
                {p.exclusivityContract && <Badge className="bg-purple-500/20 text-purple-400 border-0 text-[10px]">Exclusividade</Badge>}
                {p.authorizedPublish && <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-[10px]">Autorizado Publicar</Badge>}
              </div>
            </div>
          )}

          {/* Leads History */}
          <LeadsHistoryPanel propertyId={p.id} />

          {/* Social Media Publishing Panel */}
          <SocialPostPanel propertyId={p.id} />
        </div>
      )}
    </div>
  )
}

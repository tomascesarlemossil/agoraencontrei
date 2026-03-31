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
import { ArrowLeft, Edit, Save, X, MapPin, BedDouble, Bath, Car, Ruler, Eye, Calendar, ImagePlus, Trash2, Star, Upload, Phone, Mail, User, ZoomIn } from 'lucide-react'
import Link from 'next/link'
import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { uploadApi } from '@/lib/api'
import { PropertyImageLightbox } from '@/components/dashboard/PropertyImageLightbox'
import { PropertyFeaturesEditor } from '@/components/dashboard/PropertyFeaturesEditor'

const STATUS_BADGE: Record<string, string> = {
  ACTIVE:   'bg-emerald-500/20 text-emerald-400',
  INACTIVE: 'bg-gray-500/20 text-gray-400',
  SOLD:     'bg-blue-500/20 text-blue-400',
  RENTED:   'bg-purple-500/20 text-purple-400',
  PENDING:  'bg-yellow-500/20 text-yellow-400',
  DRAFT:    'bg-white/10 text-white/40',
}

const TYPE_LABELS: Record<string, string> = {
  HOUSE:'Casa', APARTMENT:'Apartamento', LAND:'Terreno', FARM:'Fazenda',
  RANCH:'Sítio', WAREHOUSE:'Galpão', OFFICE:'Escritório', STORE:'Loja',
  STUDIO:'Studio', PENTHOUSE:'Cobertura', CONDO:'Condomínio', KITNET:'Kitnet',
}
const PURPOSE_LABELS: Record<string, string> = {
  SALE:'Venda', RENT:'Aluguel', BOTH:'Venda/Aluguel', SEASON:'Temporada',
}

const STATUSES = [['ACTIVE','Ativo'],['INACTIVE','Inativo'],['SOLD','Vendido'],['RENTED','Alugado'],['PENDING','Pendente'],['DRAFT','Rascunho']]

function fmt(v?: number | null) {
  if (!v) return null
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function Stat({ icon: Icon, label }: { icon: React.ComponentType<any>; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-white/60">
      <Icon className="h-4 w-4 text-white/30" />
      {label}
    </div>
  )
}

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const { getValidToken } = useAuth()
  const [editing, setEditing] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const { data: property, isLoading } = useQuery<PropertyDetail>({
    queryKey: ['property', id],
    queryFn: async () => {
      const token = await getValidToken()
      return propertiesApi.getById(token!, id)
    },
  })

  const { register, handleSubmit, control, reset, watch, setValue } = useForm({
    values: property ? {
      title: property.title,
      status: property.status,
      price: property.price ?? '',
      priceRent: property.priceRent ?? '',
      description: property.description ?? '',
      neighborhood: property.neighborhood ?? '',
      city: property.city ?? '',
      state: property.state ?? '',
      bedrooms: property.bedrooms,
      suites: property.suites ?? 0,
      bathrooms: property.bathrooms,
      parkingSpaces: property.parkingSpaces,
      totalArea: property.totalArea ?? '',
      builtArea: property.builtArea ?? '',
      landArea: property.landArea ?? '',
      yearBuilt: property.yearBuilt ?? '',
      condoFee: property.condoFee ?? '',
      iptu: property.iptu ?? '',
      latitude: property.latitude ?? '',
      longitude: property.longitude ?? '',
      features: property.features ?? [],
    } : undefined,
  })

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = await getValidToken()
      const clean: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(data)) {
        if (v !== '' && v !== undefined) clean[k] = v
      }
      return propertiesApi.update(token!, id, clean)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['property', id] })
      setEditing(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const token = await getValidToken()
      return propertiesApi.delete(token!, id)
    },
    onSuccess: () => router.push('/dashboard/properties'),
  })

  // Image management
  const [uploadingImages, setUploadingImages] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const saveImages = async (coverImage: string | undefined, images: string[]) => {
    const token = await getValidToken()
    await propertiesApi.update(token!, id, { coverImage, images } as any)
    qc.invalidateQueries({ queryKey: ['property', id] })
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
      const existing = property?.images ?? []
      const cover = property?.coverImage ?? urls[0]
      await saveImages(cover, [...existing, ...urls])
    } catch (e: any) {
      alert(e.message || 'Erro ao fazer upload')
    } finally {
      setUploadingImages(false)
    }
  }

  const handleAddUrl = async () => {
    if (!urlInput.trim()) return
    const url = urlInput.trim()
    setUrlInput('')
    setShowUrlInput(false)
    const existing = property?.images ?? []
    const cover = property?.coverImage ?? url
    await saveImages(cover, [...existing, url])
  }

  const handleSetCover = async (url: string) => {
    await saveImages(url, property?.images ?? [])
  }

  const handleRemoveImage = async (url: string) => {
    const newImages = (property?.images ?? []).filter((u: string) => u !== url)
    const newCover = property?.coverImage === url ? newImages[0] : property?.coverImage
    await saveImages(newCover, newImages)
  }

  if (isLoading) return <div className="p-6 text-white/40 text-center py-20">Carregando...</div>
  if (!property) return <div className="p-6 text-red-400 text-center py-20">Imóvel não encontrado</div>

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/dashboard/properties">
            <Button variant="ghost" size="icon" className="text-white/60 hover:text-white mt-1">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-white">{property.title}</h1>
              <Badge className={cn('border-0 text-xs', STATUS_BADGE[property.status] ?? 'bg-white/10 text-white/40')}>
                {property.status}
              </Badge>
            </div>
            <p className="text-white/40 text-sm mt-1">
              {TYPE_LABELS[property.type] ?? property.type} · {PURPOSE_LABELS[property.purpose] ?? property.purpose}
              {property.reference ? ` · Ref: ${property.reference}` : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {!editing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}
                className="border-white/20 text-white/70 hover:text-white gap-2">
                <Edit className="h-3.5 w-3.5" /> Editar
              </Button>
              <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate()}
                className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? '...' : <X className="h-4 w-4" />}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => { setEditing(false); reset() }}
                className="text-white/60">Cancelar</Button>
              <Button size="sm" onClick={handleSubmit((d) => updateMutation.mutate(d))}
                disabled={updateMutation.isPending} className="gap-2">
                <Save className="h-3.5 w-3.5" />
                {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        /* Edit Form */
        <div className="space-y-4">
          {/* Identificação */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-4">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Identificação</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-full space-y-1.5">
                <Label className="text-white/70">Título</Label>
                <Input {...register('title')} className="bg-white/5 border-white/10 text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/70">Status</Label>
                <Controller name="status" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                )} />
              </div>
              <div className="col-span-full space-y-1.5">
                <Label className="text-white/70">Descrição</Label>
                <textarea {...register('description')} rows={4}
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
          </div>

          {/* Valores */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-4">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Valores</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-white/70">Venda (R$)</Label>
                <Input {...register('price')} type="number" className="bg-white/5 border-white/10 text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/70">Aluguel (R$)</Label>
                <Input {...register('priceRent')} type="number" className="bg-white/5 border-white/10 text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/70">Condomínio (R$)</Label>
                <Input {...register('condoFee')} type="number" className="bg-white/5 border-white/10 text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/70">IPTU (R$/ano)</Label>
                <Input {...register('iptu')} type="number" className="bg-white/5 border-white/10 text-white" />
              </div>
            </div>
          </div>

          {/* Localização */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-4">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Localização</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-white/70">Cidade</Label>
                <Input {...register('city')} className="bg-white/5 border-white/10 text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/70">Bairro</Label>
                <Input {...register('neighborhood')} className="bg-white/5 border-white/10 text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/70">Estado (UF)</Label>
                <Input {...register('state')} maxLength={2} className="bg-white/5 border-white/10 text-white uppercase" placeholder="SP" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/70">Latitude</Label>
                <Input {...register('latitude')} type="number" step="any" className="bg-white/5 border-white/10 text-white" placeholder="-20.123456" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/70">Longitude</Label>
                <Input {...register('longitude')} type="number" step="any" className="bg-white/5 border-white/10 text-white" placeholder="-47.654321" />
              </div>
            </div>
          </div>

          {/* Características */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-4">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Características</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-white/70">Quartos</Label>
                <Input {...register('bedrooms')} type="number" min={0} className="bg-white/5 border-white/10 text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/70">Suítes</Label>
                <Input {...register('suites')} type="number" min={0} className="bg-white/5 border-white/10 text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/70">Banheiros</Label>
                <Input {...register('bathrooms')} type="number" min={0} className="bg-white/5 border-white/10 text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/70">Vagas</Label>
                <Input {...register('parkingSpaces')} type="number" min={0} className="bg-white/5 border-white/10 text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/70">Área Terreno (m²)</Label>
                <Input {...register('totalArea')} type="number" step="0.01" className="bg-white/5 border-white/10 text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/70">Área Construída (m²)</Label>
                <Input {...register('builtArea')} type="number" step="0.01" className="bg-white/5 border-white/10 text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/70">Área do Terreno (m²)</Label>
                <Input {...register('landArea')} type="number" step="0.01" className="bg-white/5 border-white/10 text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/70">Ano de construção</Label>
                <Input {...register('yearBuilt')} type="number" className="bg-white/5 border-white/10 text-white" />
              </div>
            </div>
          </div>

          {/* Itens / Features */}
          <PropertyFeaturesEditor
            selected={watch('features') ?? []}
            onChange={(f) => setValue('features', f)}
          />
        </div>
      ) : (
        /* View Mode */
        <div className="space-y-4">
          {/* Image Gallery Management */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Fotos do Imóvel</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowUrlInput(v => !v)}
                  className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/10"
                >
                  <ImagePlus className="h-3.5 w-3.5" /> Adicionar URL
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImages}
                  className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/10 disabled:opacity-40"
                >
                  <Upload className="h-3.5 w-3.5" /> {uploadingImages ? 'Enviando...' : 'Upload'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
              </div>
            </div>

            {showUrlInput && (
              <div className="flex gap-2">
                <input
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddUrl()}
                  placeholder="Cole a URL da imagem (https://...)"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
                />
                <button onClick={handleAddUrl} className="px-3 py-1.5 bg-white/10 rounded-lg text-xs text-white hover:bg-white/20 transition-colors">
                  Adicionar
                </button>
              </div>
            )}

            {(!property.coverImage && (!property.images || property.images.length === 0)) ? (
              <div className="py-8 text-center text-white/30 text-sm">
                <ImagePlus className="h-8 w-8 mx-auto mb-2 opacity-30" />
                Nenhuma foto cadastrada. Adicione fotos por URL ou upload.
              </div>
            ) : (() => {
              const allPhotos = [...(property.coverImage ? [property.coverImage] : []), ...(property.images ?? []).filter((u: string) => u !== property.coverImage)]
              return (
              <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {allPhotos.map((url: string, idx: number) => (
                  <div key={url} className="relative group rounded-xl overflow-hidden aspect-video bg-white/5">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    {url === property.coverImage && (
                      <div className="absolute top-1.5 left-1.5 bg-[#C9A84C] text-[#1B2B5B] text-xs font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1">
                        <Star className="h-2.5 w-2.5 fill-current" /> Capa
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {/* View full */}
                      <button
                        onClick={() => setLightboxIndex(idx)}
                        className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30 text-white"
                        title="Ver foto"
                      >
                        <ZoomIn className="h-3.5 w-3.5" />
                      </button>
                      {url !== property.coverImage && (
                        <button
                          onClick={() => handleSetCover(url)}
                          className="text-xs bg-[#C9A84C] text-[#1B2B5B] px-2 py-1 rounded-lg font-semibold hover:brightness-110"
                        >
                          Definir capa
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveImage(url)}
                        className="p-1.5 bg-red-500/80 rounded-lg hover:bg-red-500 text-white"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {lightboxIndex !== null && (
                <PropertyImageLightbox
                  images={allPhotos}
                  startIndex={lightboxIndex}
                  title={property.title}
                  onClose={() => setLightboxIndex(null)}
                />
              )}
              </>
              )
            })()}
          </div>

          {/* Price + Stats */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {property.price && (
              <div>
                <p className="text-xs text-white/40 mb-1">Venda</p>
                <p className="text-lg font-bold text-white">{fmt(property.price)}</p>
              </div>
            )}
            {property.priceRent && (
              <div>
                <p className="text-xs text-white/40 mb-1">Aluguel</p>
                <p className="text-lg font-bold text-white">{fmt(property.priceRent)}/mês</p>
              </div>
            )}
            {property.condoFee && (
              <div>
                <p className="text-xs text-white/40 mb-1">Condomínio</p>
                <p className="text-sm font-medium text-white/70">{fmt(property.condoFee)}</p>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-white/50 text-sm">
              <Eye className="h-4 w-4" /> {property.views} visualizações
            </div>
          </div>

          {/* Characteristics */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-3">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Características</h3>
            <div className="flex flex-wrap gap-4">
              {property.bedrooms > 0 && <Stat icon={BedDouble} label={`${property.bedrooms} quarto${property.bedrooms > 1 ? 's' : ''}`} />}
              {property.suites > 0 && <Stat icon={BedDouble} label={`${property.suites} suíte${property.suites > 1 ? 's' : ''}`} />}
              {property.bathrooms > 0 && <Stat icon={Bath} label={`${property.bathrooms} banheiro${property.bathrooms > 1 ? 's' : ''}`} />}
              {property.parkingSpaces > 0 && <Stat icon={Car} label={`${property.parkingSpaces} vaga${property.parkingSpaces > 1 ? 's' : ''}`} />}
              {property.totalArea && <Stat icon={Ruler} label={`${property.totalArea} m² total`} />}
              {property.builtArea && <Stat icon={Ruler} label={`${property.builtArea} m² construído`} />}
              {property.yearBuilt && <Stat icon={Calendar} label={`Construído em ${property.yearBuilt}`} />}
            </div>
          </div>

          {/* Address */}
          {(property.city || property.neighborhood) && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-5">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Localização</h3>
              <div className="flex items-start gap-2 text-white/70">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-white/30" />
                <p className="text-sm">
                  {[property.street, property.number, property.complement].filter(Boolean).join(', ')}
                  {property.street && <br />}
                  {[property.neighborhood, property.city, property.state].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
          )}

          {/* Description */}
          {property.description && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-5">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Descrição</h3>
              <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line">{property.description}</p>
            </div>
          )}

          {/* Proprietários */}
          {property.owners && property.owners.length > 0 && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-5">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
                Proprietário{property.owners.length > 1 ? 's' : ''}
              </h3>
              <div className="space-y-3">
                {property.owners.map((o) => (
                  <div key={o.contact.id} className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-full bg-emerald-500/20 flex items-center justify-center text-sm font-bold text-emerald-400 flex-shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">{o.contact.name}</p>
                      {o.contact.cpf && <p className="text-xs text-white/40">CPF: {o.contact.cpf}</p>}
                      {o.contact.cnpj && <p className="text-xs text-white/40">CNPJ: {o.contact.cnpj}</p>}
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5">
                        {o.contact.phone && (
                          <div className="flex items-center gap-1 text-xs text-white/50">
                            <Phone className="h-3 w-3" />{o.contact.phone}
                          </div>
                        )}
                        {o.contact.email && (
                          <div className="flex items-center gap-1 text-xs text-white/50">
                            <Mail className="h-3 w-3" />{o.contact.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          {property.features && property.features.length > 0 && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-5">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Diferenciais</h3>
              <div className="flex flex-wrap gap-2">
                {property.features.map((f) => (
                  <span key={f} className="px-3 py-1 bg-white/10 rounded-full text-xs text-white/70">{f}</span>
                ))}
              </div>
            </div>
          )}

          {/* Broker */}
          {property.user && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-5">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Corretor Responsável</h3>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold text-white">
                  {property.user.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{property.user.name}</p>
                  {property.user.creciNumber && <p className="text-xs text-white/40">CRECI {property.user.creciNumber}</p>}
                  {property.user.phone && <p className="text-xs text-white/40">{property.user.phone}</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

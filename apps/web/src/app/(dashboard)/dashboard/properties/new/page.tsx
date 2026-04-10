'use client'

import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { propertiesApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft, Save, Home, MapPin, Settings, Globe, Briefcase, Shield, Search, Loader2, Info,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usersApi, type User } from '@/lib/api'
import { cn } from '@/lib/utils'
import { PropertyFeaturesEditor } from '@/components/dashboard/PropertyFeaturesEditor'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUSES   = [['ACTIVE','Ativo'],['INACTIVE','Inativo'],['SOLD','Vendido'],['RENTED','Alugado'],['PENDING','Pendente'],['DRAFT','Rascunho']]
const TYPES      = [['HOUSE','Casa'],['APARTMENT','Apartamento'],['LAND','Terreno'],['FARM','Chácara/Sítio'],['RANCH','Rancho'],['WAREHOUSE','Galpão'],['OFFICE','Escritório'],['STORE','Loja/Comercial'],['STUDIO','Studio'],['PENTHOUSE','Cobertura'],['CONDO','Condomínio'],['KITNET','Kitnet']]
const PURPOSES   = [['SALE','Venda'],['RENT','Aluguel'],['BOTH','Venda e Aluguel'],['SEASON','Temporada']]
const CATEGORIES = [['RESIDENTIAL','Residencial'],['COMMERCIAL','Comercial'],['RURAL','Rural'],['INDUSTRIAL','Industrial']]
const STANDARDS  = [['SIMPLE','Simples'],['NORMAL','Normal'],['HIGH','Alto'],['LUXURY','Luxo']]
const CURRENT_STATES = [['VACANT','Desocupado'],['OCCUPIED_OWNER','Ocupado Proprietário'],['OCCUPIED_TENANT','Ocupado Inquilino'],['UNDER_CONSTRUCTION','Em Construção']]
const KEY_LOCATIONS  = [['NOT_INFORMED','Não informado'],['OFFICE','Escritório'],['OWNER','Com o Proprietário'],['ONSITE','No Local']]
const FACES = [['NORTH','Norte'],['SOUTH','Sul'],['EAST','Leste'],['WEST','Oeste'],['NORTHEAST','Nordeste'],['NORTHWEST','Noroeste'],['SOUTHEAST','Sudeste'],['SOUTHWEST','Sudoeste']]

const TABS = [
  { id: 'cadastro',    label: 'Cadastro',    icon: Home },
  { id: 'localizacao', label: 'Localização', icon: MapPin },
  { id: 'detalhes',    label: 'Detalhes',    icon: Settings },
  { id: 'anuncios',    label: 'Anúncios',    icon: Globe },
  { id: 'captacao',    label: 'Captação',    icon: Briefcase },
  { id: 'confidencial',label: 'Confidencial',icon: Shield },
]

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const schema = z.object({
  // Cadastro
  title:                  z.string().min(3, 'Mínimo 3 caracteres'),
  type:                   z.string().min(1, 'Selecione o tipo'),
  purpose:                z.string().min(1, 'Selecione a finalidade'),
  category:               z.string().default('RESIDENTIAL'),
  status:                 z.string().default('DRAFT'),
  reference:              z.string().optional(),
  auxReference:           z.string().optional(),
  currentState:           z.string().optional(),
  occupation:             z.string().optional(),
  standard:               z.string().optional(),
  description:            z.string().optional(),
  descriptionInternal:    z.string().optional(),
  videoUrl:               z.string().optional(),
  virtualTourUrl:         z.string().optional(),
  price:                  z.coerce.number().positive().optional().or(z.literal('')),
  priceRent:              z.coerce.number().positive().optional().or(z.literal('')),
  priceSeason:            z.coerce.number().positive().optional().or(z.literal('')),
  pricePromo:             z.coerce.number().positive().optional().or(z.literal('')),
  condoFee:               z.coerce.number().optional().or(z.literal('')),
  iptu:                   z.coerce.number().optional().or(z.literal('')),
  priceNegotiable:        z.boolean().default(false),
  valueUnderConsultation: z.boolean().default(false),
  allowExchange:          z.boolean().default(false),
  isFeatured:             z.boolean().default(false),
  isPremium:              z.boolean().default(false),
  // Localização
  zipCode:                z.string().optional(),
  street:                 z.string().optional(),
  number:                 z.string().optional(),
  complement:             z.string().optional(),
  neighborhood:           z.string().optional(),
  commercialNeighborhood: z.string().optional(),
  city:                   z.string().optional(),
  state:                  z.string().max(2).optional(),
  country:                z.string().optional(),
  region:                 z.string().optional(),
  referencePoint:         z.string().optional(),
  latitude:               z.coerce.number().optional().or(z.literal('')),
  longitude:              z.coerce.number().optional().or(z.literal('')),
  condoName:              z.string().optional(),
  adminCompany:           z.string().optional(),
  constructionCompany:    z.string().optional(),
  closedCondo:            z.boolean().default(false),
  signOnSite:             z.boolean().default(false),
  // Detalhes
  bedrooms:               z.coerce.number().int().min(0).default(0),
  suites:                 z.coerce.number().int().min(0).default(0),
  suitesWithCloset:       z.coerce.number().int().min(0).default(0),
  demiSuites:             z.coerce.number().int().min(0).default(0),
  bathrooms:              z.coerce.number().int().min(0).default(0),
  rooms:                  z.coerce.number().int().min(0).default(0),
  livingRooms:            z.coerce.number().int().min(0).default(0),
  diningRooms:            z.coerce.number().int().min(0).default(0),
  tvRooms:                z.coerce.number().int().min(0).default(0),
  parkingSpaces:          z.coerce.number().int().min(0).default(0),
  garagesCovered:         z.coerce.number().int().min(0).default(0),
  garagesOpen:            z.coerce.number().int().min(0).default(0),
  elevators:              z.coerce.number().int().min(0).default(0),
  floor:                  z.coerce.number().optional().or(z.literal('')),
  totalFloors:            z.coerce.number().optional().or(z.literal('')),
  totalArea:              z.coerce.number().positive().optional().or(z.literal('')),
  builtArea:              z.coerce.number().positive().optional().or(z.literal('')),
  landArea:               z.coerce.number().positive().optional().or(z.literal('')),
  commonArea:             z.coerce.number().positive().optional().or(z.literal('')),
  ceilingHeight:          z.coerce.number().positive().optional().or(z.literal('')),
  landDimensions:         z.string().optional(),
  landFace:               z.string().optional(),
  sunExposure:            z.string().optional(),
  position:               z.string().optional(),
  yearBuilt:              z.coerce.number().int().min(1900).optional().or(z.literal('')),
  yearLastReformed:       z.coerce.number().int().min(1900).optional().or(z.literal('')),
  features:               z.array(z.string()).default([]),
  // Anúncios / SEO
  metaTitle:              z.string().max(60).optional(),
  metaDescription:        z.string().max(160).optional(),
  metaKeywords:           z.string().optional(),
  // Portais
  publishOlx:             z.boolean().default(false),
  publishZap:             z.boolean().default(false),
  publishVivaReal:        z.boolean().default(false),
  publishFacebook:        z.boolean().default(false),
  // Captação
  captorName:             z.string().optional(),
  captorCommissionPct:    z.coerce.number().optional().or(z.literal('')),
  exclusivityContract:    z.boolean().default(false),
  commercialConditions:   z.string().optional(),
  keyLocation:            z.string().optional(),
  // Detalhes adicionais
  usefulArea:             z.coerce.number().positive().optional().or(z.literal('')),
  privateArea:            z.coerce.number().positive().optional().or(z.literal('')),
  terrainFront:           z.coerce.number().positive().optional().or(z.literal('')),
  terrainDepth:           z.coerce.number().positive().optional().or(z.literal('')),
  terrainBack:            z.coerce.number().positive().optional().or(z.literal('')),
  terrainSide:            z.coerce.number().positive().optional().or(z.literal('')),
  kitchens:               z.coerce.number().int().min(0).default(0),
  laundryRooms:           z.coerce.number().int().min(0).default(0),
  serviceRooms:           z.coerce.number().int().min(0).default(0),
  balconies:              z.coerce.number().int().min(0).default(0),
  pools:                  z.coerce.number().int().min(0).default(0),
  condoUnits:             z.coerce.number().int().min(0).optional().or(z.literal('')),
  condoTowers:            z.coerce.number().int().min(0).optional().or(z.literal('')),
  condoFloors:            z.coerce.number().int().min(0).optional().or(z.literal('')),
  condoUnitsPerFloor:     z.coerce.number().int().min(0).optional().or(z.literal('')),
  gasInfo:                z.string().optional(),
  internetInfo:           z.string().optional(),
  // Proprietário vinculado
  ownerClientId:          z.string().optional(),
  ownerName:              z.string().optional(),
  ownerPhone:             z.string().optional(),
  ownerEmail:             z.string().optional(),
  ownerDocument:          z.string().optional(),
  ownerNotes:             z.string().optional(),
  // Confidencial
  cib:                    z.string().optional(),
  iptuRegistration:       z.string().optional(),
  cartorioMatricula:      z.string().optional(),
  electricityInfo:        z.string().optional(),
  waterInfo:              z.string().optional(),
  documentationPending:   z.boolean().default(false),
  documentationNotes:     z.string().optional(),
  isReserved:             z.boolean().default(false),
  authorizedPublish:      z.boolean().default(true),
  showExactLocation:      z.boolean().default(true),
  // Financeiro do imóvel
  pricePerMeter:          z.coerce.number().positive().optional().or(z.literal('')),
  rentPerMeter:           z.coerce.number().positive().optional().or(z.literal('')),
  fireInsurance:          z.coerce.number().positive().optional().or(z.literal('')),
  administrationFee:      z.coerce.number().positive().optional().or(z.literal('')),
  administrationFeePct:   z.coerce.number().positive().optional().or(z.literal('')),
})

type FormData = z.infer<typeof schema>

// ─── Helper components ────────────────────────────────────────────────────────

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">{children}</div>
}

function Field({ label, error, children, span }: { label: string; error?: string; children: React.ReactNode; span?: string }) {
  return (
    <div className={cn('space-y-1.5', span)}>
      <Label className="text-white/60 text-xs">{label}</Label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewPropertyPage() {
  const router = useRouter()
  const { getValidToken } = useAuth()
  const [activeTab, setActiveTab] = useState('cadastro')

  const { data: usersData } = useQuery<User[]>({
    queryKey: ['users-list-new'],
    queryFn: async () => {
      const token = await getValidToken()
      return usersApi.list(token!)
    },
  })

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '', type: '', purpose: '', category: 'RESIDENTIAL', status: 'DRAFT',
      reference: '', description: '',
      bedrooms: 0, suites: 0, suitesWithCloset: 0, demiSuites: 0,
      bathrooms: 0, rooms: 0, livingRooms: 0, diningRooms: 0, tvRooms: 0,
      parkingSpaces: 0, garagesCovered: 0, garagesOpen: 0, elevators: 0,
      priceNegotiable: false, valueUnderConsultation: false, allowExchange: false,
      isFeatured: false, isPremium: false, closedCondo: false, signOnSite: false,
      exclusivityContract: false, documentationPending: false,
      isReserved: false, authorizedPublish: true, showExactLocation: true,
      publishOlx: false, publishZap: false, publishVivaReal: false, publishFacebook: false,
      features: [],
    },
  })

  const [cepLoading, setCepLoading] = useState(false)
  const fetchCep = async (cep: string) => {
    const raw = cep.replace(/\D/g, '')
    if (raw.length !== 8) return
    setCepLoading(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setValue('street', data.logradouro || '')
        setValue('neighborhood', data.bairro || '')
        setValue('city', data.localidade || '')
        setValue('state', data.uf || '')
      }
    } catch {
      // ignore fetch errors
    } finally {
      setCepLoading(false)
    }
  }

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const token = await getValidToken()
      const { publishOlx, publishZap, publishVivaReal, publishFacebook, metaKeywords, ...rest } = data
      const clean: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(rest)) {
        if (v !== '' && v !== undefined && v !== null) clean[k] = v
      }
      // Store portal toggles in portalDescriptions JSON
      clean.portalDescriptions = { olx: publishOlx, zap: publishZap, vivareal: publishVivaReal, facebook: publishFacebook }
      // Convert comma-separated keywords to array
      if (metaKeywords) {
        clean.metaKeywords = metaKeywords.split(',').map((k: string) => k.trim()).filter(Boolean)
      }
      return propertiesApi.create(token!, clean as any)
    },
    onSuccess: (prop: any) => router.push(`/dashboard/properties/${prop.id}`),
  })

  const inputCls = 'bg-white/5 border-white/10 text-white h-9 placeholder:text-white/40'
  const textareaCls = 'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-white/40'
  const selectTriggerCls = 'bg-white/5 border-white/10 text-white h-9'

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/properties">
          <Button variant="ghost" size="icon" className="text-white/60 hover:text-white h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Cadastrar Imóvel</h1>
          <p className="text-white/40 text-sm">Preencha os dados do imóvel</p>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
        <Info className="h-4 w-4 text-blue-400 flex-shrink-0" />
        <p className="text-blue-400/90 text-xs">O imóvel será criado como <strong>Rascunho</strong>. Adicione fotos ou vídeos na página de edição para poder ativá-lo.</p>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        {/* Tab navigation */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
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

        {/* ── TAB: CADASTRO ───────────────────────────────────────────────── */}
        {activeTab === 'cadastro' && (
          <div className="space-y-4">
            <Section title="Identificação">
              <Field label="Título do imóvel *" error={errors.title?.message} span="col-span-full">
                <Input {...register('title')} className={inputCls} placeholder="Ex: Apartamento 3 quartos no Itaim" />
              </Field>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Field label="Tipo *" error={errors.type?.message}>
                  <Controller name="type" control={control} render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                      <SelectContent>{TYPES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                  )} />
                </Field>
                <Field label="Finalidade *" error={errors.purpose?.message}>
                  <Controller name="purpose" control={control} render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                      <SelectContent>{PURPOSES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                  )} />
                </Field>
                <Field label="Categoria">
                  <Controller name="category" control={control} render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={selectTriggerCls}><SelectValue /></SelectTrigger>
                      <SelectContent>{CATEGORIES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                  )} />
                </Field>
                <Field label="Situação">
                  <Controller name="status" control={control} render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={selectTriggerCls}><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                  )} />
                </Field>
                <Field label="Estado Atual">
                  <Controller name="currentState" control={control} render={({ field }) => (
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{CURRENT_STATES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                  )} />
                </Field>
                <Field label="Padrão">
                  <Controller name="standard" control={control} render={({ field }) => (
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{STANDARDS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                  )} />
                </Field>
                <Field label="Código de Referência">
                  <Input {...register('reference')} className={inputCls} placeholder="REF-001" />
                </Field>
                <Field label="Ref. Auxiliar">
                  <Input {...register('auxReference')} className={inputCls} />
                </Field>
              </div>
            </Section>

            <Section title="Valores">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Field label="Preço Venda (R$)">
                  <Input {...register('price')} type="number" className={inputCls} placeholder="0,00" />
                </Field>
                <Field label="Preço Aluguel (R$)">
                  <Input {...register('priceRent')} type="number" className={inputCls} placeholder="0,00" />
                </Field>
                <Field label="Preço Temporada (R$)">
                  <Input {...register('priceSeason')} type="number" className={inputCls} placeholder="0,00" />
                </Field>
                <Field label="Preço Promocional (R$)">
                  <Input {...register('pricePromo')} type="number" className={inputCls} placeholder="0,00" />
                </Field>
                <Field label="Condomínio (R$)">
                  <Input {...register('condoFee')} type="number" className={inputCls} placeholder="0,00" />
                </Field>
                <Field label="IPTU (R$/ano)">
                  <Input {...register('iptu')} type="number" className={inputCls} placeholder="0,00" />
                </Field>
              </div>
              <div className="flex flex-wrap gap-6 pt-1">
                <Controller name="priceNegotiable" control={control} render={({ field }) => (
                  <CheckField label="Valor Negociável" checked={field.value} onChange={field.onChange} />
                )} />
                <Controller name="valueUnderConsultation" control={control} render={({ field }) => (
                  <CheckField label="Valor Sob Consulta" checked={field.value} onChange={field.onChange} />
                )} />
                <Controller name="allowExchange" control={control} render={({ field }) => (
                  <CheckField label="Aceita Permuta" checked={field.value} onChange={field.onChange} />
                )} />
                <Controller name="isFeatured" control={control} render={({ field }) => (
                  <CheckField label="Imóvel em Destaque" checked={field.value} onChange={field.onChange} />
                )} />
                <Controller name="isPremium" control={control} render={({ field }) => (
                  <CheckField label="Premium" checked={field.value} onChange={field.onChange} />
                )} />
              </div>
            </Section>

            <Section title="Descrição Pública">
              <textarea {...register('description')} rows={5} className={textareaCls}
                placeholder="Descrição que será publicada no site e portais..." />
            </Section>

            <Section title="Descrição Interna (não publicada)">
              <textarea {...register('descriptionInternal')} rows={4} className={textareaCls}
                placeholder="Informações internas, histórico, observações do corretor..." />
              <p className="text-xs text-white/50">* Esta informação é de uso interno e NÃO será divulgada no site e portais.</p>
            </Section>

            <Section title="Vídeo e Tour Virtual">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Vídeo YouTube (URL ou ID)">
                  <Input {...register('videoUrl')} placeholder="https://youtube.com/watch?v=..." className={inputCls} />
                </Field>
                <Field label="Tour Virtual (URL)">
                  <Input {...register('virtualTourUrl')} placeholder="https://..." className={inputCls} />
                </Field>
              </div>
            </Section>
          </div>
        )}

        {/* ── TAB: LOCALIZAÇÃO ────────────────────────────────────────────── */}
        {activeTab === 'localizacao' && (
          <div className="space-y-4">
            <Section title="Endereço">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Field label="CEP *">
                  <div className="flex gap-2 items-center">
                    <Input {...register('zipCode', { onBlur: (e) => fetchCep(e.target.value) })} placeholder="00000-000" className={inputCls} maxLength={9} />
                    {cepLoading && <Loader2 className="h-4 w-4 animate-spin text-white/40" />}
                  </div>
                </Field>
                <Field label="Endereço" span="sm:col-span-2">
                  <Input {...register('street')} className={inputCls} />
                </Field>
                <Field label="Número">
                  <Input {...register('number')} className={inputCls} />
                </Field>
                <Field label="Complemento">
                  <Input {...register('complement')} className={inputCls} />
                </Field>
                <Field label="Bairro Comercial (exibido no site)">
                  <Input {...register('commercialNeighborhood')} className={inputCls} />
                </Field>
                <Field label="Bairro Oficial">
                  <Input {...register('neighborhood')} className={inputCls} />
                </Field>
                <Field label="Cidade">
                  <Input {...register('city')} className={inputCls} />
                </Field>
                <Field label="UF">
                  <Input {...register('state')} maxLength={2} className={cn(inputCls, 'uppercase')} placeholder="SP" />
                </Field>
                <Field label="País">
                  <Input {...register('country')} className={inputCls} defaultValue="BR" />
                </Field>
                <Field label="Região">
                  <Input {...register('region')} className={inputCls} />
                </Field>
                <Field label="Ponto de Referência" span="sm:col-span-2">
                  <Input {...register('referencePoint')} className={inputCls} />
                </Field>
              </div>
            </Section>

            <Section title="Coordenadas GPS">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Latitude">
                  <Input {...register('latitude')} type="number" step="any" placeholder="-20.123456" className={inputCls} />
                </Field>
                <Field label="Longitude">
                  <Input {...register('longitude')} type="number" step="any" placeholder="-47.654321" className={inputCls} />
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
                  <Input {...register('condoName')} className={inputCls} placeholder="Ex: Residencial das Flores, Ed. Parque Verde..." />
                  <p className="text-[11px] text-white/30 mt-0.5">💡 Deixe em branco para detectar automaticamente da descrição</p>
                </Field>
                <Field label="Administradora">
                  <Input {...register('adminCompany')} className={inputCls} />
                </Field>
                <Field label="Construtora">
                  <Input {...register('constructionCompany')} className={inputCls} />
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

        {/* ── TAB: DETALHES ───────────────────────────────────────────────── */}
        {activeTab === 'detalhes' && (
          <div className="space-y-4">
            <Section title="Cômodos">
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                <NumInput reg={register('bedrooms')} label="Dormitórios" />
                <NumInput reg={register('suites')} label="Suítes" />
                <NumInput reg={register('suitesWithCloset')} label="Suítes c/ Closet" />
                <NumInput reg={register('demiSuites')} label="Demi-suítes" />
                <NumInput reg={register('bathrooms')} label="Banheiros" />
                <NumInput reg={register('kitchens')} label="Cozinhas" />
                <NumInput reg={register('laundryRooms')} label="Lavanderia" />
                <NumInput reg={register('serviceRooms')} label="Dep. Serviço" />
                <NumInput reg={register('balconies')} label="Varandas" />
                <NumInput reg={register('pools')} label="Piscinas" />
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
                  <Input {...register('builtArea')} type="number" step="0.01" className={inputCls} />
                </Field>
                <Field label="Área Útil (m²)">
                  <Input {...register('usefulArea')} type="number" step="0.01" className={inputCls} />
                </Field>
                <Field label="Área Privativa (m²)">
                  <Input {...register('privateArea')} type="number" step="0.01" className={inputCls} />
                </Field>
                <Field label="Área Total (m²)">
                  <Input {...register('totalArea')} type="number" step="0.01" className={inputCls} />
                </Field>
                <Field label="Área Terreno (m²)">
                  <Input {...register('landArea')} type="number" step="0.01" className={inputCls} />
                </Field>
                <Field label="Área Comum (m²)">
                  <Input {...register('commonArea')} type="number" step="0.01" className={inputCls} />
                </Field>
                <Field label="Pé Direto (m)">
                  <Input {...register('ceilingHeight')} type="number" step="0.01" className={inputCls} />
                </Field>
                <Field label="Dimensão Terreno">
                  <Input {...register('landDimensions')} placeholder="Ex: 10x20" className={inputCls} />
                </Field>
                <Field label="Frente do Terreno (m)">
                  <Input {...register('terrainFront')} type="number" step="0.01" className={inputCls} />
                </Field>
                <Field label="Fundo do Terreno (m)">
                  <Input {...register('terrainDepth')} type="number" step="0.01" className={inputCls} />
                </Field>
                <Field label="Lateral Esq. (m)">
                  <Input {...register('terrainSide')} type="number" step="0.01" className={inputCls} />
                </Field>
                <Field label="Lateral Dir. (m)">
                  <Input {...register('terrainBack')} type="number" step="0.01" className={inputCls} />
                </Field>
                <Field label="Face">
                  <Controller name="landFace" control={control} render={({ field }) => (
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{FACES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                  )} />
                </Field>
                <Field label="Insolamento">
                  <Input {...register('sunExposure')} placeholder="Sol da manhã / tarde" className={inputCls} />
                </Field>
                <Field label="Posição">
                  <Input {...register('position')} placeholder="Frente / Fundos / Meio" className={inputCls} />
                </Field>
                <Field label="Ano de Construção">
                  <Input {...register('yearBuilt')} type="number" className={inputCls} />
                </Field>
                <Field label="Ano Última Reforma">
                  <Input {...register('yearLastReformed')} type="number" className={inputCls} />
                </Field>
              </div>
            </Section>

            <PropertyFeaturesEditor
              selected={watch('features') ?? []}
              onChange={(f) => setValue('features', f)}
            />
          </div>
        )}

        {/* ── TAB: ANÚNCIOS / SEO ─────────────────────────────────────────── */}
        {activeTab === 'anuncios' && (
          <div className="space-y-4">
            <Section title="Opções de Publicação">
              <div className="flex flex-wrap gap-6">
                <Controller name="isFeatured" control={control} render={({ field }) => (
                  <CheckField label="Imóvel em Destaque" checked={field.value} onChange={field.onChange} />
                )} />
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
                  ['publishOlx',        'OLX',           '#FF6500'],
                  ['publishZap',        'Zap Imóveis',   '#7C3AED'],
                  ['publishVivaReal',   'Viva Real',     '#16A34A'],
                  ['publishFacebook',   'Facebook Mkt',  '#1877F2'],
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

            {/* SEO */}
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
                    className={inputCls} />
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
                    className={textareaCls} />
                  <p className="text-xs text-white/40">Ideal: 120–160 caracteres. Aparece como descrição no Google.</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-white/60 text-xs">Palavras-chave (separadas por vírgula)</Label>
                  <Input {...register('metaKeywords')}
                    placeholder="apartamento, 3 quartos, Franca, imóvel à venda..."
                    className={inputCls} />
                </div>

                {/* Google Preview */}
                {(watch('metaTitle') || watch('metaDescription')) && (
                  <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Search className="h-3.5 w-3.5 text-white/30" />
                      <span className="text-xs text-white/30 uppercase tracking-wider font-semibold">Prévia no Google</span>
                    </div>
                    <div className="bg-white rounded-lg p-4 space-y-1">
                      <p className="text-xs text-[#006621] truncate">www.agoraencontrei.com.br/imoveis/...</p>
                      <p className="text-[#1a0dab] text-base font-medium leading-snug line-clamp-1">
                        {watch('metaTitle') || watch('title') || 'Título do imóvel | Imobiliária Lemos'}
                      </p>
                      <p className="text-[#545454] text-sm leading-snug line-clamp-2">
                        {watch('metaDescription') || watch('description') || 'Descrição do imóvel aparecerá aqui. Preencha a meta descrição para controlar o que o Google exibe nos resultados de busca.'}
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

        {/* ── TAB: CAPTAÇÃO ───────────────────────────────────────────────── */}
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
                  <Input {...register('captorCommissionPct')} type="number" step="0.01" min={0} max={100} className={inputCls} />
                </Field>
                <Field label="Data de Captação">
                  <Input {...register('captureDate' as any)} type="date" className={`${inputCls} [color-scheme:dark]`} />
                </Field>
              </div>
            </Section>

            <Section title="Condições Comerciais">
              <textarea {...register('commercialConditions')} rows={4}
                placeholder="Condições de venda, prazo, observações comerciais..."
                className={textareaCls} />
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
                    <SelectTrigger className={cn(selectTriggerCls, 'max-w-xs')}><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{KEY_LOCATIONS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                )} />
              </Field>
            </Section>
          </div>
        )}

        {/* ── TAB: CONFIDENCIAL ───────────────────────────────────────────── */}
        {activeTab === 'confidencial' && (
          <div className="space-y-4">

            {/* Proprietário Vinculado */}
            <Section title="Proprietário Vinculado">
              <p className="text-xs text-white/40 -mt-1">Vincule o proprietário do imóvel a um cliente cadastrado ou preencha manualmente.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Field label="Nome do Proprietário" span="sm:col-span-2">
                  <Input {...register('ownerName')} className={inputCls} placeholder="Nome completo" />
                </Field>
                <Field label="CPF/CNPJ do Proprietário">
                  <Input {...register('ownerDocument')} className={inputCls} placeholder="000.000.000-00" />
                </Field>
                <Field label="Telefone do Proprietário">
                  <Input {...register('ownerPhone')} className={inputCls} placeholder="(16) 99999-9999" />
                </Field>
                <Field label="E-mail do Proprietário">
                  <Input {...register('ownerEmail')} className={inputCls} placeholder="email@exemplo.com" />
                </Field>
              </div>
              <Field label="Observações sobre o Proprietário">
                <textarea {...register('ownerNotes')} rows={2} className={textareaCls} placeholder="Preferências, restrições, contatos adicionais..." />
              </Field>
            </Section>

            {/* Financeiro do Imóvel */}
            <Section title="Financeiro do Imóvel">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Field label="Preço por m² (Venda)">
                  <Input {...register('pricePerMeter')} type="number" step="0.01" className={inputCls} />
                </Field>
                <Field label="Preço por m² (Aluguel)">
                  <Input {...register('rentPerMeter')} type="number" step="0.01" className={inputCls} />
                </Field>
                <Field label="Seguro Incêndio (R$)">
                  <Input {...register('fireInsurance')} type="number" step="0.01" className={inputCls} />
                </Field>
                <Field label="Taxa de Administração (R$)">
                  <Input {...register('administrationFee')} type="number" step="0.01" className={inputCls} />
                </Field>
                <Field label="Taxa de Administração (%)">
                  <Input {...register('administrationFeePct')} type="number" step="0.01" min={0} max={100} className={inputCls} />
                </Field>
              </div>
            </Section>

            {/* Concessías e Serviços */}
            <Section title="Concessionárias e Serviços">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Field label="Eletricidade (Concessionária / Nº Medidor)">
                  <Input {...register('electricityInfo')} className={inputCls} placeholder="CPFL / Nº 12345" />
                </Field>
                <Field label="Água e Saneamento (Nº Hidrometro)">
                  <Input {...register('waterInfo')} className={inputCls} placeholder="SAAE / Nº 67890" />
                </Field>
                <Field label="Gás (Concessionária / Nº)">
                  <Input {...register('gasInfo')} className={inputCls} placeholder="Comgás / Nº 11111" />
                </Field>
                <Field label="Internet / TV a Cabo">
                  <Input {...register('internetInfo')} className={inputCls} placeholder="Claro / Vivo / NET" />
                </Field>
              </div>
            </Section>

            {/* Documentação */}
            <Section title="Documentação Cartória e Prefeitura">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Field label="CIB (Código Imobiliário Brasileiro)">
                  <Input {...register('cib')} className={inputCls} />
                </Field>
                <Field label="Cadastro Prefeitura (Nº IPTU / INCRA)">
                  <Input {...register('iptuRegistration')} className={inputCls} />
                </Field>
                <Field label="Cartório de Imóveis (Nº Matrícula)">
                  <Input {...register('cartorioMatricula')} className={inputCls} />
                </Field>
              </div>
              <div className="pt-2">
                <Controller name="documentationPending" control={control} render={({ field }) => (
                  <CheckField label="Documentação Pendente" checked={field.value} onChange={field.onChange} />
                )} />
              </div>
              <Field label="Observações de Documentação">
                <textarea {...register('documentationNotes')} rows={3} className={textareaCls} />
              </Field>
            </Section>

            {/* Condomínio */}
            <Section title="Dados do Condomínio / Empreendimento">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Field label="Nº de Unidades">
                  <Input {...register('condoUnits')} type="number" min={0} className={inputCls} />
                </Field>
                <Field label="Nº de Torres">
                  <Input {...register('condoTowers')} type="number" min={0} className={inputCls} />
                </Field>
                <Field label="Nº de Andares">
                  <Input {...register('condoFloors')} type="number" min={0} className={inputCls} />
                </Field>
                <Field label="Unidades por Andar">
                  <Input {...register('condoUnitsPerFloor')} type="number" min={0} className={inputCls} />
                </Field>
              </div>
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

        {/* Bottom action bar */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10">
          <Link href="/dashboard/properties">
            <Button variant="ghost" className="text-white/60 hover:text-white" type="button">Cancelar</Button>
          </Link>
          <div className="flex items-center gap-3">
            {mutation.isError && (
              <p className="text-sm text-red-400">{(mutation.error as Error).message}</p>
            )}
            <Button type="submit" disabled={mutation.isPending} className="gap-2 min-w-[160px]">
              <Save className="h-4 w-4" />
              {mutation.isPending ? 'Cadastrando...' : 'Cadastrar Imóvel'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

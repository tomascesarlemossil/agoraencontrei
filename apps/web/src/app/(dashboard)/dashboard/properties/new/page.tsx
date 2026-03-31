'use client'

import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { propertiesApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { PropertyFeaturesEditor } from '@/components/dashboard/PropertyFeaturesEditor'

const schema = z.object({
  title:        z.string().min(3, 'Mínimo 3 caracteres'),
  type:         z.string().min(1, 'Selecione o tipo'),
  purpose:      z.string().min(1, 'Selecione a finalidade'),
  category:     z.string().default('RESIDENTIAL'),
  status:       z.string().default('ACTIVE'),
  price:        z.coerce.number().positive().optional().or(z.literal('')),
  priceRent:    z.coerce.number().positive().optional().or(z.literal('')),
  description:  z.string().optional(),
  street:       z.string().optional(),
  number:       z.string().optional(),
  neighborhood: z.string().optional(),
  city:         z.string().optional(),
  state:        z.string().max(2).optional(),
  zipCode:      z.string().optional(),
  latitude:     z.coerce.number().optional().or(z.literal('')),
  longitude:    z.coerce.number().optional().or(z.literal('')),
  totalArea:    z.coerce.number().positive().optional().or(z.literal('')),
  builtArea:    z.coerce.number().positive().optional().or(z.literal('')),
  landArea:     z.coerce.number().positive().optional().or(z.literal('')),
  bedrooms:     z.coerce.number().int().min(0).default(0),
  suites:       z.coerce.number().int().min(0).default(0),
  bathrooms:    z.coerce.number().int().min(0).default(0),
  parkingSpaces: z.coerce.number().int().min(0).default(0),
  yearBuilt:    z.coerce.number().int().min(1900).optional().or(z.literal('')),
  reference:    z.string().optional(),
  condoFee:     z.coerce.number().optional().or(z.literal('')),
  iptu:         z.coerce.number().optional().or(z.literal('')),
  features:     z.array(z.string()).default([]),
})
type FormData = z.infer<typeof schema>

const TYPES = [
  ['HOUSE','Casa'], ['APARTMENT','Apartamento'], ['LAND','Terreno'],
  ['FARM','Fazenda'], ['RANCH','Sítio'], ['WAREHOUSE','Galpão'],
  ['OFFICE','Escritório'], ['STORE','Loja'], ['STUDIO','Studio'],
  ['PENTHOUSE','Cobertura'], ['CONDO','Condomínio'], ['KITNET','Kitnet'],
]
const PURPOSES = [['SALE','Venda'], ['RENT','Aluguel'], ['BOTH','Venda e Aluguel'], ['SEASON','Temporada']]
const CATEGORIES = [['RESIDENTIAL','Residencial'], ['COMMERCIAL','Comercial'], ['RURAL','Rural'], ['INDUSTRIAL','Industrial']]
const STATUSES = [['ACTIVE','Ativo'], ['DRAFT','Rascunho'], ['INACTIVE','Inativo'], ['PENDING','Pendente']]

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-white/70">{label}</Label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

export default function NewPropertyPage() {
  const router = useRouter()
  const { getValidToken } = useAuth()

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: '', purpose: '', category: 'RESIDENTIAL', status: 'ACTIVE',
      bedrooms: 0, suites: 0, bathrooms: 0, parkingSpaces: 0,
      features: [],
    },
  })

  const purpose = watch('purpose')

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const token = await getValidToken()
      const clean: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(data)) {
        if (v !== '' && v !== undefined && v !== null) clean[k] = v
      }
      return propertiesApi.create(token!, clean as any)
    },
    onSuccess: (prop) => router.push(`/dashboard/properties/${prop.id}`),
  })

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/properties">
          <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Cadastrar Imóvel</h1>
          <p className="text-white/40 text-sm">Preencha os dados do imóvel</p>
        </div>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
        {/* Identificação */}
        <section className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Identificação</h2>
          <Field label="Título *" error={errors.title?.message}>
            <Input {...register('title')} className="bg-white/5 border-white/10 text-white" placeholder="Ex: Apartamento 3 quartos no Itaim" />
          </Field>
          <FieldRow>
            <Field label="Tipo *" error={errors.type?.message}>
              <Controller name="type" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>{TYPES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                </Select>
              )} />
            </Field>
            <Field label="Finalidade *" error={errors.purpose?.message}>
              <Controller name="purpose" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>{PURPOSES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                </Select>
              )} />
            </Field>
            <Field label="Categoria">
              <Controller name="category" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                </Select>
              )} />
            </Field>
            <Field label="Status">
              <Controller name="status" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                </Select>
              )} />
            </Field>
            <Field label="Código de referência">
              <Input {...register('reference')} className="bg-white/5 border-white/10 text-white" placeholder="REF-001" />
            </Field>
          </FieldRow>
          <Field label="Descrição">
            <textarea
              {...register('description')}
              rows={3}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              placeholder="Descreva o imóvel..."
            />
          </Field>
        </section>

        {/* Valores */}
        <section className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Valores</h2>
          <FieldRow>
            {(purpose === 'SALE' || purpose === 'BOTH' || !purpose) && (
              <Field label="Preço de venda (R$)">
                <Input {...register('price')} type="number" className="bg-white/5 border-white/10 text-white" placeholder="0,00" />
              </Field>
            )}
            {(purpose === 'RENT' || purpose === 'BOTH' || purpose === 'SEASON') && (
              <Field label="Preço de aluguel (R$)">
                <Input {...register('priceRent')} type="number" className="bg-white/5 border-white/10 text-white" placeholder="0,00" />
              </Field>
            )}
            <Field label="Condomínio (R$)">
              <Input {...register('condoFee')} type="number" className="bg-white/5 border-white/10 text-white" placeholder="0,00" />
            </Field>
            <Field label="IPTU (R$/ano)">
              <Input {...register('iptu')} type="number" className="bg-white/5 border-white/10 text-white" placeholder="0,00" />
            </Field>
          </FieldRow>
        </section>

        {/* Localização */}
        <section className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Localização</h2>
          <FieldRow>
            <Field label="CEP">
              <Input {...register('zipCode')} className="bg-white/5 border-white/10 text-white" placeholder="00000-000" />
            </Field>
            <Field label="Rua / Logradouro">
              <Input {...register('street')} className="bg-white/5 border-white/10 text-white" />
            </Field>
            <Field label="Número">
              <Input {...register('number')} className="bg-white/5 border-white/10 text-white" />
            </Field>
            <Field label="Bairro">
              <Input {...register('neighborhood')} className="bg-white/5 border-white/10 text-white" />
            </Field>
            <Field label="Cidade">
              <Input {...register('city')} className="bg-white/5 border-white/10 text-white" />
            </Field>
            <Field label="Estado (UF)">
              <Input {...register('state')} maxLength={2} className="bg-white/5 border-white/10 text-white uppercase" placeholder="SP" />
            </Field>
            <Field label="Latitude">
              <Input {...register('latitude')} type="number" step="any" className="bg-white/5 border-white/10 text-white" placeholder="-20.123456" />
            </Field>
            <Field label="Longitude">
              <Input {...register('longitude')} type="number" step="any" className="bg-white/5 border-white/10 text-white" placeholder="-47.654321" />
            </Field>
          </FieldRow>
        </section>

        {/* Características */}
        <section className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Características</h2>
          <FieldRow>
            <Field label="Área Terreno (m²)">
              <Input {...register('totalArea')} type="number" step="0.01" className="bg-white/5 border-white/10 text-white" />
            </Field>
            <Field label="Área Construída (m²)">
              <Input {...register('builtArea')} type="number" step="0.01" className="bg-white/5 border-white/10 text-white" />
            </Field>
            <Field label="Área do Terreno (m²)">
              <Input {...register('landArea')} type="number" step="0.01" className="bg-white/5 border-white/10 text-white" />
            </Field>
            <Field label="Ano de construção">
              <Input {...register('yearBuilt')} type="number" className="bg-white/5 border-white/10 text-white" placeholder="2010" />
            </Field>
            <Field label="Quartos">
              <Input {...register('bedrooms')} type="number" min={0} className="bg-white/5 border-white/10 text-white" />
            </Field>
            <Field label="Suítes">
              <Input {...register('suites')} type="number" min={0} className="bg-white/5 border-white/10 text-white" />
            </Field>
            <Field label="Banheiros">
              <Input {...register('bathrooms')} type="number" min={0} className="bg-white/5 border-white/10 text-white" />
            </Field>
            <Field label="Vagas de garagem">
              <Input {...register('parkingSpaces')} type="number" min={0} className="bg-white/5 border-white/10 text-white" />
            </Field>
          </FieldRow>
        </section>

        {/* Itens do Imóvel */}
        <PropertyFeaturesEditor
          selected={watch('features') ?? []}
          onChange={(f) => setValue('features', f)}
        />

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/dashboard/properties">
            <Button variant="ghost" className="text-white/60 hover:text-white" type="button">Cancelar</Button>
          </Link>
          <Button type="submit" disabled={mutation.isPending} className="gap-2 min-w-[140px]">
            <Save className="h-4 w-4" />
            {mutation.isPending ? 'Salvando...' : 'Cadastrar Imóvel'}
          </Button>
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-400 text-center">{(mutation.error as Error).message}</p>
        )}
      </form>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { contactsApi, type Contact } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, User, Building2, Phone, Mail, MapPin } from 'lucide-react'
import { SearchInputWithVoice } from '@/components/ui/SearchInputWithVoice'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const contactSchema = z.object({
  name:  z.string().min(2, 'Nome obrigatório'),
  type:  z.enum(['INDIVIDUAL', 'COMPANY']),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  cpf:   z.string().optional(),
  cnpj:  z.string().optional(),
  city:  z.string().optional(),
  state: z.string().max(2).optional(),
  notes: z.string().optional(),
  isOwner:     z.boolean().default(false),
  isTenant:    z.boolean().default(false),
  isGuarantor: z.boolean().default(false),
})
type ContactForm = z.infer<typeof contactSchema>

function typeLabel(type: string) {
  return type === 'COMPANY' ? 'Empresa' : 'Pessoa Física'
}

function typeIcon(type: string) {
  return type === 'COMPANY' ? Building2 : User
}

export default function ContactsPage() {
  const { getValidToken } = useAuth()
  const router = useRouter()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [showCreate, setShowCreate] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', page, search, roleFilter],
    queryFn: async () => {
      const token = await getValidToken()
      return contactsApi.list(token!, { page, limit: 50, search: search || undefined, ...(roleFilter && { role: roleFilter }) })
    },
  })

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: { type: 'INDIVIDUAL', isOwner: false, isTenant: false, isGuarantor: false },
  })

  const createMutation = useMutation({
    mutationFn: async (body: ContactForm) => {
      const token = await getValidToken()
      return contactsApi.create(token!, body)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
      setShowCreate(false)
      reset()
    },
  })

  const total = data?.meta.total ?? 0
  const totalPages = data?.meta.totalPages ?? 1

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Contatos</h1>
          <p className="text-white/50 text-sm mt-1">{total} contato{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Contato
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInputWithVoice
          containerClassName="flex-1"
          placeholder="Buscar por nome, e-mail, CPF, telefone..."
          className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-md border px-3 py-2 text-sm"
          value={search}
          dark
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          onVoiceResult={(t) => { setSearch(t); setPage(1) }}
        />
        <div className="flex gap-1.5 flex-wrap">
          {[
            { key: '', label: 'Todos' },
            { key: 'owner', label: 'Proprietários' },
            { key: 'tenant', label: 'Inquilinos' },
            { key: 'guarantor', label: 'Fiadores' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => { setRoleFilter(f.key); setPage(1) }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                roleFilter === f.key
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-white/40">Carregando...</div>
        ) : !data?.data.length ? (
          <div className="py-20 text-center">
            <User className="h-12 w-12 text-white/40 mx-auto mb-3" />
            <p className="text-white/40">Nenhum contato encontrado</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Nome</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider hidden md:table-cell">Contato</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider hidden lg:table-cell">Cidade</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Tags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.data.map((c: Contact) => {
                const TypeIcon = typeIcon(c.type)
                return (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/contacts/${c.id}`)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                          <TypeIcon className="h-4 w-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{c.name}</p>
                          {(c.cpf || c.cnpj) && (
                            <p className="text-xs text-white/40">{c.cpf ?? c.cnpj}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="border-white/20 text-white/60 text-xs">
                        {typeLabel(c.type)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="space-y-0.5">
                        {c.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-white/50">
                            <Phone className="h-3 w-3" />
                            {c.phone}
                          </div>
                        )}
                        {c.email && (
                          <div className="flex items-center gap-1.5 text-xs text-white/50">
                            <Mail className="h-3 w-3" />
                            {c.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {c.city && (
                        <div className="flex items-center gap-1.5 text-xs text-white/50">
                          <MapPin className="h-3 w-3" />
                          {c.city}{c.state ? `, ${c.state}` : ''}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {c.isOwner && <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">Proprietário</Badge>}
                        {c.isTenant && <Badge className="bg-blue-500/20 text-blue-400 border-0 text-xs">Inquilino</Badge>}
                        {(c as any).isGuarantor && <Badge className="bg-orange-500/20 text-orange-400 border-0 text-xs">Fiador</Badge>}
                        {c.tags.slice(0, 1).map((t) => (
                          <Badge key={t} variant="outline" className="border-white/20 text-white/40 text-xs">{t}</Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-white/40">
          <span>Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="border-white/20 text-white/60 hover:text-white">Anterior</Button>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
              className="border-white/20 text-white/60 hover:text-white">Próximo</Button>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-[#1a1a2e] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Contato</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Nome *</Label>
                <Input {...register('name')} className="bg-white/5 border-white/10 text-white" />
                {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select defaultValue="INDIVIDUAL" onValueChange={(v: string) => setValue('type', v as 'INDIVIDUAL' | 'COMPANY')}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INDIVIDUAL">Pessoa Física</SelectItem>
                    <SelectItem value="COMPANY">Empresa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input {...register('phone')} className="bg-white/5 border-white/10 text-white" placeholder="(11) 99999-9999" />
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label>E-mail</Label>
                <Input {...register('email')} type="email" className="bg-white/5 border-white/10 text-white" />
                {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
              </div>

              {watch('type') === 'INDIVIDUAL' ? (
                <div className="space-y-1.5">
                  <Label>CPF</Label>
                  <Input {...register('cpf')} className="bg-white/5 border-white/10 text-white" placeholder="000.000.000-00" />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label>CNPJ</Label>
                  <Input {...register('cnpj')} className="bg-white/5 border-white/10 text-white" placeholder="00.000.000/0001-00" />
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Cidade</Label>
                <Input {...register('city')} className="bg-white/5 border-white/10 text-white" />
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label>Observações</Label>
                <Input {...register('notes')} className="bg-white/5 border-white/10 text-white" />
              </div>

              <div className="col-span-2 flex gap-4">
                <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                  <input type="checkbox" {...register('isOwner')} className="rounded" />
                  Proprietário
                </label>
                <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                  <input type="checkbox" {...register('isTenant')} className="rounded" />
                  Inquilino
                </label>
                <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                  <input type="checkbox" {...register('isGuarantor')} className="rounded" />
                  Fiador
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}
                className="text-white/60 hover:text-white">Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Salvando...' : 'Criar Contato'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

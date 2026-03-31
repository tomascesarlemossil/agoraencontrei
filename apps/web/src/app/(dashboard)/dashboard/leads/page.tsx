'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { leadsApi, type Lead } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { UserCheck, Search, Phone, Mail, Star, ChevronLeft, ChevronRight } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  qualified: 'bg-purple-100 text-purple-700',
  proposal: 'bg-orange-100 text-orange-700',
  negotiation: 'bg-indigo-100 text-indigo-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<string, string> = {
  new: 'Novo',
  contacted: 'Contatado',
  qualified: 'Qualificado',
  proposal: 'Proposta',
  negotiation: 'Negociação',
  won: 'Ganho',
  lost: 'Perdido',
}

export default function LeadsPage() {
  const { accessToken } = useAuthStore()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['leads', page, search],
    queryFn: () => leadsApi.list(accessToken!, { page, limit: 15, search: search || undefined }),
    enabled: !!accessToken,
  })

  const leads = data?.data ?? []
  const meta = data?.meta

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {meta ? `${meta.total} leads no total` : 'Carregando...'}
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por nome, e-mail, telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <UserCheck className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="font-semibold text-lg">Nenhum lead encontrado</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Os leads chegam quando clientes entram em contato pelo site
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {leads.map((lead) => (
                <LeadRow key={lead.id} lead={lead} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Página {meta.page} de {meta.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page === meta.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function LeadRow({ lead }: { lead: Lead }) {
  return (
    <Link href={`/dashboard/leads/${lead.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer block">
      {/* Avatar */}
      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-primary">
          {lead.name.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{lead.name}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLORS[lead.status] ?? 'bg-gray-100 text-gray-600'}`}>
            {STATUS_LABELS[lead.status] ?? lead.status}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          {lead.email && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" /> {lead.email}
            </span>
          )}
          {lead.phone && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" /> {lead.phone}
            </span>
          )}
        </div>
      </div>

      {/* Score + budget */}
      <div className="flex items-center gap-4 flex-shrink-0 text-right">
        {lead.budget && (
          <div className="hidden sm:block">
            <p className="text-xs text-muted-foreground">Budget</p>
            <p className="text-sm font-medium">{formatCurrency(lead.budget)}</p>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 text-yellow-500" />
          <span className="text-sm font-medium">{lead.score}</span>
        </div>
        {lead.assignedTo && (
          <div className="hidden md:block text-right">
            <p className="text-xs text-muted-foreground">Corretor</p>
            <p className="text-xs font-medium">{lead.assignedTo.name}</p>
          </div>
        )}
      </div>
    </Link>
  )
}

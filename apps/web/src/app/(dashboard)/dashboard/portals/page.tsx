'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { portalsApi, propertiesApi, type PortalConfig, type PortalPublication } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Globe, Plus, CheckCircle, XCircle, Clock, Trash2, Settings2, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

const KNOWN_PORTALS = [
  { id: 'olx',        name: 'OLX',              color: 'bg-purple-500/20 text-purple-400' },
  { id: 'zap',        name: 'ZAP Imóveis',       color: 'bg-orange-500/20 text-orange-400' },
  { id: 'vivareal',   name: 'Viva Real',          color: 'bg-green-500/20 text-green-400' },
  { id: 'chavescasa', name: 'Chaves na Mão',      color: 'bg-blue-500/20 text-blue-400' },
  { id: 'facebook',   name: 'Facebook Marketplace', color: 'bg-indigo-500/20 text-indigo-400' },
  { id: 'imovelweb',  name: 'ImovelWeb',          color: 'bg-teal-500/20 text-teal-400' },
]

const PUB_STATUS: Record<string, { label: string; color: string; icon: React.ComponentType<any> }> = {
  published: { label: 'Publicado',  color: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle },
  pending:   { label: 'Pendente',   color: 'bg-yellow-500/20 text-yellow-400',   icon: Clock },
  failed:    { label: 'Erro',       color: 'bg-red-500/20 text-red-400',         icon: XCircle },
  removed:   { label: 'Removido',   color: 'bg-white/10 text-white/40',          icon: Trash2 },
}

export default function PortalsPage() {
  const { getValidToken, user } = useAuth()
  const qc = useQueryClient()
  const [showPublish, setShowPublish] = useState(false)
  const [showConfig, setShowConfig] = useState<string | null>(null)
  const [pubPropertyId, setPubPropertyId] = useState('')
  const [pubPortalId, setPubPortalId] = useState('')
  const [pubDesc, setPubDesc] = useState('')
  const [cfgApiKey, setCfgApiKey] = useState('')
  const [cfgActive, setCfgActive] = useState(false)

  const canManage = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user?.role ?? '')

  const { data: configs, isLoading: loadingConfigs } = useQuery({
    queryKey: ['portals'],
    queryFn: async () => {
      const token = await getValidToken()
      return portalsApi.list(token!)
    },
  })

  const { data: publications } = useQuery({
    queryKey: ['portals', 'publications'],
    queryFn: async () => {
      const token = await getValidToken()
      return portalsApi.publications(token!, { limit: 50 })
    },
  })

  const { data: properties } = useQuery({
    queryKey: ['properties-select'],
    queryFn: async () => {
      const token = await getValidToken()
      return propertiesApi.listProtected(token!, { limit: 100 })
    },
  })

  const upsertMutation = useMutation({
    mutationFn: async ({ portalId, body }: { portalId: string; body: any }) => {
      const token = await getValidToken()
      return portalsApi.upsertConfig(token!, portalId, body)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portals'] })
      setShowConfig(null)
    },
  })

  const publishMutation = useMutation({
    mutationFn: async () => {
      const token = await getValidToken()
      return portalsApi.publish(token!, { propertyId: pubPropertyId, portalId: pubPortalId, description: pubDesc || undefined })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portals', 'publications'] })
      setShowPublish(false)
      setPubPropertyId('')
      setPubPortalId('')
      setPubDesc('')
    },
  })

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getValidToken()
      return portalsApi.removePublication(token!, id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portals', 'publications'] }),
  })

  const configMap = new Map((configs ?? []).map((c: PortalConfig) => [c.portalId, c]))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Portais</h1>
          <p className="text-white/40 text-sm mt-1">Gerencie publicações nos portais imobiliários</p>
        </div>
        <Button onClick={() => setShowPublish(true)} className="gap-2">
          <Send className="h-4 w-4" /> Publicar Imóvel
        </Button>
      </div>

      {/* Portal cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {KNOWN_PORTALS.map((p) => {
          const cfg = configMap.get(p.id)
          return (
            <div key={p.id} className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-white/40" />
                  <p className="text-sm font-semibold text-white">{p.name}</p>
                </div>
                {canManage && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-white/50 hover:text-white"
                    onClick={() => {
                      setCfgApiKey(cfg?.apiKey ?? '')
                      setCfgActive(cfg?.isActive ?? false)
                      setShowConfig(p.id)
                    }}>
                    <Settings2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={cn('border-0 text-xs', cfg?.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40')}>
                  {cfg?.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
                <Badge className={cn('border-0 text-xs', cfg?.apiKey ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400')}>
                  {cfg?.apiKey ? '🟢 API Key' : '🟡 Stub'}
                </Badge>
                {cfg?.isPaid && (
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-0 text-xs">Pago</Badge>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Publications */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Publicações Recentes</h2>
        {!publications?.data.length ? (
          <div className="bg-white/5 rounded-xl border border-white/10 py-16 flex flex-col items-center text-center">
            <Globe className="h-12 w-12 text-white/40 mb-3" />
            <p className="text-white/40">Nenhuma publicação ainda</p>
            <p className="text-white/50 text-xs mt-1">Clique em "Publicar Imóvel" para começar</p>
          </div>
        ) : (
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <div className="divide-y divide-white/5">
              {publications.data.map((pub: PortalPublication) => {
                const st = PUB_STATUS[pub.status] ?? PUB_STATUS.pending
                const StatusIcon = st.icon
                const portal = KNOWN_PORTALS.find((p) => p.id === pub.portalId)
                return (
                  <div key={pub.id} className="flex items-center gap-4 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white truncate">
                          {pub.property?.title ?? pub.propertyId}
                        </p>
                        <Badge className="bg-white/10 text-white/50 border-0 text-xs flex-shrink-0">
                          {portal?.name ?? pub.portalId}
                        </Badge>
                      </div>
                      {pub.publishedAt && (
                        <p className="text-xs text-white/50 mt-0.5">
                          {new Date(pub.publishedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn('border-0 text-xs flex items-center gap-1', st.color)}>
                        <StatusIcon className="h-3 w-3" />{st.label}
                      </Badge>
                      {canManage && pub.status !== 'removed' && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-white/40 hover:text-red-400"
                          onClick={() => removeMutation.mutate(pub.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Publish Dialog */}
      <Dialog open={showPublish} onOpenChange={setShowPublish}>
        <DialogContent className="bg-[#1a1a2e] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Publicar Imóvel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Imóvel</Label>
              <Select value={pubPropertyId} onValueChange={setPubPropertyId}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue placeholder="Selecionar imóvel..." /></SelectTrigger>
                <SelectContent>
                  {properties?.data.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Portal</Label>
              <Select value={pubPortalId} onValueChange={setPubPortalId}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue placeholder="Selecionar portal..." /></SelectTrigger>
                <SelectContent>
                  {KNOWN_PORTALS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Descrição (opcional)</Label>
              <Input value={pubDesc} onChange={(e) => setPubDesc(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Descrição específica para o portal..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowPublish(false)} className="text-white/60 hover:text-white">
              Cancelar
            </Button>
            <Button onClick={() => publishMutation.mutate()}
              disabled={!pubPropertyId || !pubPortalId || publishMutation.isPending}>
              {publishMutation.isPending ? 'Publicando...' : 'Publicar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Config Dialog */}
      {showConfig && (
        <Dialog open={!!showConfig} onOpenChange={() => setShowConfig(null)}>
          <DialogContent className="bg-[#1a1a2e] border-white/10 text-white max-w-sm">
            <DialogHeader>
              <DialogTitle>
                Configurar — {KNOWN_PORTALS.find((p) => p.id === showConfig)?.name ?? showConfig}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>API Key</Label>
                <Input value={cfgApiKey} onChange={(e) => setCfgApiKey(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Chave de integração..." />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={cfgActive} onChange={(e) => setCfgActive(e.target.checked)} className="rounded" />
                <span className="text-sm text-white/70">Portal ativo</span>
              </label>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowConfig(null)} className="text-white/60 hover:text-white">
                Cancelar
              </Button>
              <Button onClick={() => upsertMutation.mutate({
                  portalId: showConfig,
                  body: { apiKey: cfgApiKey || undefined, isActive: cfgActive },
                })}
                disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

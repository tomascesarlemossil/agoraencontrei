'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { usersApi, authApi, type User } from '@/lib/api'
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
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Users, Plus, Trash2, Settings, User as UserIcon, Shield, Globe, Youtube, Upload, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  MANAGER: 'Gerente',
  BROKER: 'Corretor',
  FINANCIAL: 'Financeiro',
  CLIENT: 'Cliente',
}
const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-500/20 text-red-400',
  ADMIN: 'bg-purple-500/20 text-purple-400',
  MANAGER: 'bg-blue-500/20 text-blue-400',
  BROKER: 'bg-emerald-500/20 text-emerald-400',
  FINANCIAL: 'bg-yellow-500/20 text-yellow-400',
  CLIENT: 'bg-white/10 text-white/50',
}

const newUserSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  role: z.enum(['ADMIN', 'MANAGER', 'BROKER', 'FINANCIAL', 'CLIENT']),
  phone: z.string().optional(),
  creciNumber: z.string().optional(),
})
type NewUserForm = z.infer<typeof newUserSchema>

const profileSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  bio: z.string().max(500).optional(),
  creciNumber: z.string().optional(),
})
type ProfileForm = z.infer<typeof profileSchema>

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
})
type PasswordForm = z.infer<typeof passwordSchema>

export default function SettingsPage() {
  const { getValidToken, user } = useAuth()
  const qc = useQueryClient()
  const [showNewUser, setShowNewUser] = useState(false)
  const [activeTab, setActiveTab] = useState<'team' | 'profile' | 'security' | 'site'>('team')

  const canManageTeam = ['SUPER_ADMIN', 'ADMIN'].includes(user?.role ?? '')
  const canManageSite = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user?.role ?? '')

  // Site settings
  const [videoType, setVideoType] = useState<'youtube' | 'upload'>('youtube')
  const [videoUrl, setVideoUrl] = useState('')
  const [siteSettingsSaved, setSiteSettingsSaved] = useState(false)

  const updateSiteSettingsMutation = useMutation({
    mutationFn: async () => {
      const token = await getValidToken()
      return usersApi.updateSiteSettings(token!, { heroVideoUrl: videoUrl, heroVideoType: videoType })
    },
    onSuccess: () => {
      setSiteSettingsSaved(true)
      setTimeout(() => setSiteSettingsSaved(false), 3000)
    },
  })

  // Team
  const { data: teamUsers, isLoading: loadingTeam } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const token = await getValidToken()
      return usersApi.list(token!)
    },
    enabled: canManageTeam,
  })

  const newUserForm = useForm<NewUserForm>({
    resolver: zodResolver(newUserSchema),
    defaultValues: { role: 'BROKER' },
  })

  const createUserMutation = useMutation({
    mutationFn: async (body: NewUserForm) => {
      const token = await getValidToken()
      return usersApi.create(token!, body)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      setShowNewUser(false)
      newUserForm.reset()
    },
  })

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getValidToken()
      return usersApi.delete(token!, id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  // Profile
  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? '',
      phone: user?.phone ?? '',
      bio: user?.bio ?? '',
      creciNumber: user?.creciNumber ?? '',
    },
  })

  const updateProfileMutation = useMutation({
    mutationFn: async (body: ProfileForm) => {
      const token = await getValidToken()
      return usersApi.update(token!, user!.id, body)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] })
    },
  })

  // Password
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })
  const [pwSuccess, setPwSuccess] = useState(false)

  const changePasswordMutation = useMutation({
    mutationFn: async (body: PasswordForm) => {
      const token = await getValidToken()
      return authApi.changePassword(token!, body.currentPassword, body.newPassword)
    },
    onSuccess: () => {
      setPwSuccess(true)
      passwordForm.reset()
      setTimeout(() => setPwSuccess(false), 3000)
    },
  })

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-white/40 text-sm mt-1">Gerencie a equipe e suas preferências</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 flex-wrap">
        {([
          ['team', 'Equipe', canManageTeam],
          ['profile', 'Perfil', true],
          ['security', 'Segurança', true],
          ['site', 'Site / Vídeo', canManageSite],
        ] as const).filter(([,, show]) => show).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab as any)}
            className={cn(
              'px-4 text-sm py-1.5 rounded-lg transition-colors font-medium',
              activeTab === tab ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80'
            )}>
            {label}
          </button>
        ))}
      </div>

      {/* Team Tab */}
      {activeTab === 'team' && canManageTeam && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-white/40" /> Membros da Equipe
            </h2>
            <Button onClick={() => setShowNewUser(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Convidar
            </Button>
          </div>

          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            {loadingTeam ? (
              <div className="py-12 text-center text-white/40">Carregando...</div>
            ) : (
              <div className="divide-y divide-white/5">
                {teamUsers?.map((u: User) => (
                  <div key={u.id} className="flex items-center gap-4 px-4 py-3">
                    <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-white/60">{u.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white truncate">{u.name}</p>
                        {u.id === user?.id && <span className="text-xs text-white/30">(você)</span>}
                      </div>
                      <p className="text-xs text-white/40 truncate">{u.email}</p>
                    </div>
                    <Badge className={cn('border-0 text-xs flex-shrink-0', ROLE_COLORS[u.role] ?? 'bg-white/10 text-white/40')}>
                      {ROLE_LABELS[u.role] ?? u.role}
                    </Badge>
                    {u.id !== user?.id && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-white/30 hover:text-red-400"
                        onClick={() => {
                          if (confirm(`Remover ${u.name} da equipe?`)) deleteUserMutation.mutate(u.id)
                        }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* New User Dialog */}
          <Dialog open={showNewUser} onOpenChange={setShowNewUser}>
            <DialogContent className="bg-[#1a1a2e] border-white/10 text-white max-w-md">
              <DialogHeader>
                <DialogTitle>Convidar Membro</DialogTitle>
              </DialogHeader>
              <form onSubmit={newUserForm.handleSubmit((d) => createUserMutation.mutate(d))} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <Label>Nome *</Label>
                    <Input {...newUserForm.register('name')} className="bg-white/5 border-white/10 text-white" />
                    {newUserForm.formState.errors.name && (
                      <p className="text-xs text-red-400">{newUserForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>E-mail *</Label>
                    <Input {...newUserForm.register('email')} type="email" className="bg-white/5 border-white/10 text-white" />
                    {newUserForm.formState.errors.email && (
                      <p className="text-xs text-red-400">{newUserForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Senha *</Label>
                    <Input {...newUserForm.register('password')} type="password" className="bg-white/5 border-white/10 text-white" />
                    {newUserForm.formState.errors.password && (
                      <p className="text-xs text-red-400">{newUserForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Cargo</Label>
                    <Select defaultValue="BROKER" onValueChange={(v) => newUserForm.setValue('role', v as any)}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROLE_LABELS).filter(([k]) => k !== 'SUPER_ADMIN' && k !== 'CLIENT').map(([v, l]) => (
                          <SelectItem key={v} value={v}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Telefone</Label>
                    <Input {...newUserForm.register('phone')} className="bg-white/5 border-white/10 text-white" placeholder="(11) 99999-9999" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>CRECI</Label>
                    <Input {...newUserForm.register('creciNumber')} className="bg-white/5 border-white/10 text-white" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setShowNewUser(false)} className="text-white/60 hover:text-white">
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createUserMutation.isPending}>
                    {createUserMutation.isPending ? 'Criando...' : 'Criar Usuário'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-4 max-w-md">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-white/40" /> Meu Perfil
          </h2>
          <form onSubmit={profileForm.handleSubmit((d) => updateProfileMutation.mutate(d))}
            className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-4">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input {...profileForm.register('name')} className="bg-white/5 border-white/10 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input {...profileForm.register('phone')} className="bg-white/5 border-white/10 text-white" placeholder="(11) 99999-9999" />
            </div>
            <div className="space-y-1.5">
              <Label>CRECI</Label>
              <Input {...profileForm.register('creciNumber')} className="bg-white/5 border-white/10 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label>Bio</Label>
              <Input {...profileForm.register('bio')} className="bg-white/5 border-white/10 text-white" placeholder="Sobre você..." />
            </div>
            <Button type="submit" disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending ? 'Salvando...' : 'Salvar Perfil'}
            </Button>
            {updateProfileMutation.isSuccess && (
              <p className="text-xs text-emerald-400">Perfil atualizado!</p>
            )}
          </form>
        </div>
      )}

      {/* Site / Video Tab */}
      {activeTab === 'site' && canManageSite && (
        <div className="space-y-4 max-w-xl">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Globe className="h-5 w-5 text-white/40" /> Vídeo de Fundo — Página Inicial
          </h2>

          <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-5">
            {/* Video type selector */}
            <div className="space-y-2">
              <Label className="text-white/70">Tipo de vídeo</Label>
              <div className="flex gap-3">
                <button
                  onClick={() => setVideoType('youtube')}
                  className={cn(
                    'flex-1 flex items-center gap-2 p-3 rounded-xl border transition-all text-sm font-medium',
                    videoType === 'youtube'
                      ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]'
                      : 'border-white/10 text-white/50 hover:border-white/30'
                  )}
                >
                  <Youtube className="h-4 w-4" />
                  YouTube URL
                </button>
                <button
                  onClick={() => setVideoType('upload')}
                  className={cn(
                    'flex-1 flex items-center gap-2 p-3 rounded-xl border transition-all text-sm font-medium',
                    videoType === 'upload'
                      ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]'
                      : 'border-white/10 text-white/50 hover:border-white/30'
                  )}
                >
                  <Upload className="h-4 w-4" />
                  Upload de arquivo
                </button>
              </div>
            </div>

            {/* YouTube URL input */}
            {videoType === 'youtube' && (
              <div className="space-y-2">
                <Label className="text-white/70">URL do YouTube</Label>
                <Input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="https://youtu.be/tET8AYkIxgw ou https://www.youtube.com/watch?v=..."
                />
                <p className="text-xs text-white/30">Cole o link do vídeo do YouTube. Ele será exibido em loop, sem som, como fundo da página inicial.</p>
                {videoUrl && (
                  <div className="mt-3 rounded-xl overflow-hidden aspect-video bg-black">
                    <iframe
                      src={`https://www.youtube.com/embed/${videoUrl.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/)?.[1] ?? videoUrl}?autoplay=0&mute=1&controls=1`}
                      allow="autoplay; fullscreen"
                      className="w-full h-full"
                      style={{ border: 'none' }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Upload input */}
            {videoType === 'upload' && (
              <div className="space-y-2">
                <Label className="text-white/70">URL do arquivo de vídeo</Label>
                <Input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="https://cdn.exemplo.com/video.mp4"
                />
                <p className="text-xs text-white/30">Cole a URL direta de um arquivo de vídeo (.mp4, .webm). O vídeo será exibido em loop e sem som.</p>
              </div>
            )}

            <Button
              onClick={() => updateSiteSettingsMutation.mutate()}
              disabled={updateSiteSettingsMutation.isPending || !videoUrl.trim()}
              className="w-full gap-2"
            >
              {updateSiteSettingsMutation.isPending ? 'Salvando...' : 'Salvar configuração de vídeo'}
            </Button>

            {siteSettingsSaved && (
              <div className="flex items-center gap-2 text-emerald-400 text-sm">
                <CheckCircle2 className="h-4 w-4" />
                Configuração salva! O vídeo será atualizado em até 1 minuto.
              </div>
            )}
            {updateSiteSettingsMutation.isError && (
              <p className="text-xs text-red-400">Erro ao salvar. Tente novamente.</p>
            )}
          </div>

          <div className="bg-white/5 rounded-xl border border-white/10 p-4">
            <p className="text-xs text-white/40 leading-relaxed">
              <strong className="text-white/60">Vídeo atual em uso:</strong> O ID padrão é <code className="bg-white/10 px-1 rounded">tET8AYkIxgw</code> (definido no código). Ao salvar aqui, o novo vídeo será usado em até 1 minuto no site público.
            </p>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-4 max-w-md">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-white/40" /> Segurança
          </h2>
          <form onSubmit={passwordForm.handleSubmit((d) => changePasswordMutation.mutate(d))}
            className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-4">
            <div className="space-y-1.5">
              <Label>Senha atual</Label>
              <Input {...passwordForm.register('currentPassword')} type="password" className="bg-white/5 border-white/10 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label>Nova senha</Label>
              <Input {...passwordForm.register('newPassword')} type="password" className="bg-white/5 border-white/10 text-white" />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-xs text-red-400">{passwordForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <Button type="submit" disabled={changePasswordMutation.isPending}>
              {changePasswordMutation.isPending ? 'Alterando...' : 'Alterar Senha'}
            </Button>
            {pwSuccess && <p className="text-xs text-emerald-400">Senha alterada com sucesso!</p>}
            {changePasswordMutation.isError && (
              <p className="text-xs text-red-400">Senha atual incorreta.</p>
            )}
          </form>
        </div>
      )}
    </div>
  )
}

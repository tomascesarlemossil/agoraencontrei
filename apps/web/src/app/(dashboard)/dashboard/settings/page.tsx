'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/auth.store'
import { usersApi, authApi, type User } from '@/lib/api'
import { revalidatePublicPages, PAGES } from '@/lib/revalidate'
import { cn } from '@/lib/utils'
import {
  Building2, Users, User as UserIcon, Shield, Globe, Youtube, Upload, CheckCircle2,
  Plus, Trash2, Loader2, Eye, EyeOff, Save, Settings, Plug, Camera, X, Link, Pencil,
} from 'lucide-react'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { SystemConfigPanel } from './SystemConfigPanel'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  BROKER: 'Corretor',
  FINANCIAL: 'Financeiro',
  CLIENT: 'Cliente',
}
const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-500/20 text-red-400 border-red-500/30',
  ADMIN: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  MANAGER: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  BROKER: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  FINANCIAL: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  CLIENT: 'bg-white/10 text-white/50 border-white/10',
}

// ── Reusable primitives ───────────────────────────────────────────────────────
function DarkInput({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <div>
      {label && <label className="text-xs font-semibold text-white/70 mb-1.5 block">{label}</label>}
      <input
        {...props}
        className={cn(
          'bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-yellow-400/50 w-full transition-colors',
          props.className,
        )}
      />
    </div>
  )
}

function DarkTextarea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <div>
      {label && <label className="text-xs font-semibold text-white/70 mb-1.5 block">{label}</label>}
      <textarea
        {...props}
        className={cn(
          'bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-yellow-400/50 w-full transition-colors resize-none',
          props.className,
        )}
      />
    </div>
  )
}

function DarkSelect({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <div>
      {label && <label className="text-xs font-semibold text-white/70 mb-1.5 block">{label}</label>}
      <select
        {...props}
        className={cn(
          'bg-[#1a2740] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400/50 w-full transition-colors',
          props.className,
        )}
      >
        {children}
      </select>
    </div>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 w-full group"
    >
      <div className={cn(
        'w-11 h-6 rounded-full flex items-center transition-colors flex-shrink-0',
        checked ? 'bg-yellow-500/80' : 'bg-white/10',
      )}>
        <div className={cn(
          'w-4 h-4 bg-white rounded-full shadow transition-transform mx-1',
          checked ? 'translate-x-5' : 'translate-x-0',
        )} />
      </div>
      <span className="text-sm text-white/70 group-hover:text-white transition-colors">{label}</span>
    </button>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 p-5 space-y-4">
      <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest">{title}</h3>
      {children}
    </div>
  )
}

function SaveButton({ loading, saved }: { loading: boolean; saved: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-110 disabled:opacity-50"
      style={{ background: 'linear-gradient(135deg, #C9A84C, #e8c66a)', color: '#1B2B5B' }}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
      {loading ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar'}
    </button>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { getValidToken, user } = useAuth()
  const { updateUser } = useAuthStore()
  const qc = useQueryClient()

  const userSettings = (user as any)?.settings ?? {}
  const isIsolated = userSettings.isolatedCompany === true
  const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(user?.role ?? '')
  const isManager = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user?.role ?? '')

  const TABS = [
    { id: 'empresa',      label: 'Empresa',       icon: Building2, show: true },
    { id: 'equipe',       label: 'Equipe',        icon: Users,     show: isAdmin && !isIsolated },
    { id: 'perfil',       label: 'Perfil',        icon: UserIcon,  show: true },
    { id: 'seguranca',    label: 'Segurança',     icon: Shield,    show: true },
    { id: 'site',         label: 'Site & IA',     icon: Globe,     show: isManager && !isIsolated },
    { id: 'integracoes',  label: 'Integrações',   icon: Plug,      show: isAdmin && !isIsolated },
    { id: 'sistema',      label: 'Sistema',       icon: Settings,  show: isManager },
  ].filter(t => t.show)

  const [activeTab, setActiveTab] = useState('empresa')

  // ── Empresa ────────────────────────────────────────────────────────────────
  const [empresa, setEmpresa] = useState({
    name: '', tradeName: '', cnpj: '', creci: '', phone: '', email: '',
    website: '', logoUrl: '', address: '', city: '', state: '', zipCode: '',
  })
  const [empresaSaved, setEmpresaSaved] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = ev => setLogoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const uploadLogo = async (): Promise<string | undefined> => {
    if (!logoFile) return undefined
    setLogoUploading(true)
    try {
      const token = await getValidToken()
      const fd = new FormData()
      fd.append('file', logoFile)
      fd.append('folder', 'logos')
      const res = await fetch(`${API_URL}/api/v1/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      if (res.ok) {
        const data = await res.json()
        return data.url as string
      }
    } finally {
      setLogoUploading(false)
    }
  }

  const { data: companyData } = useQuery({
    queryKey: ['company-info'],
    queryFn: async () => {
      const token = await getValidToken()
      const res = await fetch(`${API_URL}/api/v1/users/company`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.json()
    },
    enabled: ['SUPER_ADMIN', 'ADMIN'].includes(user?.role ?? ''),
  })

  useEffect(() => {
    if (companyData) {
      setEmpresa({
        name:      companyData.name      ?? '',
        tradeName: companyData.tradeName ?? '',
        cnpj:      companyData.cnpj      ?? '',
        creci:     companyData.creci     ?? '',
        phone:     companyData.phone     ?? '',
        email:     companyData.email     ?? '',
        website:   companyData.website   ?? '',
        logoUrl:   companyData.logoUrl   ?? '',
        address:   companyData.address   ?? '',
        city:      companyData.city      ?? '',
        state:     companyData.state     ?? '',
        zipCode:   companyData.zipCode   ?? '',
      })
    }
  }, [companyData])

  const updateEmpresaMutation = useMutation({
    mutationFn: async () => {
      const token = await getValidToken()
      let logoUrl = empresa.logoUrl
      if (logoFile) {
        const uploaded = await uploadLogo()
        if (uploaded) {
          logoUrl = uploaded
          setEmpresa(p => ({ ...p, logoUrl: uploaded }))
          setLogoPreview(null)
          setLogoFile(null)
        }
      }
      const res = await fetch(`${API_URL}/api/v1/users/company`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...empresa, logoUrl }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message ?? 'Erro ao salvar empresa') }
      return res.json()
    },
    onSuccess: () => {
      setEmpresaSaved(true)
      setTimeout(() => setEmpresaSaved(false), 3000)
      // Revalidar todas as páginas públicas (logo, configurações)
      revalidatePublicPages(PAGES.all)
    },
    onError: (e: Error) => { alert('Erro ao salvar: ' + e.message) },
  })

  // ── Integrations ──────────────────────────────────────────────────────────
  const [integrations, setIntegrations] = useState({
    instagramTokenTomas: '',
    instagramTokenLemos: '',
    instagramBusinessAccountId: '',
    instagramPageAccessToken: '',
    youtubeApiKey: '',
    googleClientId: '',
  })
  const [integSaved, setIntegSaved] = useState(false)

  const saveIntegrationsMutation = useMutation({
    mutationFn: async () => {
      const token = await getValidToken()
      const res = await fetch(`${API_URL}/api/v1/users/site-settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(integrations),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message ?? 'Erro ao salvar integrações') }
      return res.json()
    },
    onSuccess: () => { setIntegSaved(true); setTimeout(() => setIntegSaved(false), 3000) },
    onError: (e: Error) => { alert('Erro ao salvar: ' + e.message) },
  })

  // ── Site Settings ──────────────────────────────────────────────────────────
  const [videoType, setVideoType] = useState<'youtube' | 'upload'>('youtube')
  const [videoUrl, setVideoUrl] = useState('')
  const [siteSaved, setSiteSaved] = useState(false)
  const [siteSettings, setSiteSettings] = useState({
    whatsapp: '',
    whatsappMsg: 'Olá! Vim pelo site e gostaria de mais informações.',
    phone: '',
    instagram: '',
    facebook: '',
    tiktok: '',
    googleAnalytics: '',
    facebookPixel: '',
    showPrices: true,
    allowPropertySearch: true,
    enableSmartQuiz: true,
    enableProposal: true,
    footerText: '',
    primaryColor: '#1B2B5B',
    accentColor: '#C9A84C',
  })

  const { data: savedSiteSettings } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/v1/public/site-settings`)
      return res.json()
    },
  })

  useEffect(() => {
    if (savedSiteSettings) {
      if (savedSiteSettings.heroVideoUrl) setVideoUrl(savedSiteSettings.heroVideoUrl)
      if (savedSiteSettings.heroVideoType) setVideoType(savedSiteSettings.heroVideoType)
      setSiteSettings(prev => ({ ...prev, ...savedSiteSettings }))
      setIntegrations(prev => ({
        ...prev,
        instagramTokenTomas:       savedSiteSettings.instagramTokenTomas       ?? '',
        instagramTokenLemos:       savedSiteSettings.instagramTokenLemos       ?? '',
        instagramBusinessAccountId: savedSiteSettings.instagramBusinessAccountId ?? '',
        instagramPageAccessToken:  savedSiteSettings.instagramPageAccessToken  ?? '',
        youtubeApiKey:             savedSiteSettings.youtubeApiKey             ?? '',
        googleClientId:            savedSiteSettings.googleClientId            ?? '',
      }))
    }
  }, [savedSiteSettings])

  const saveSiteSettingsMutation = useMutation({
    mutationFn: async () => {
      const token = await getValidToken()
      const res = await fetch(`${API_URL}/api/v1/users/site-settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ heroVideoUrl: videoUrl, heroVideoType: videoType, ...siteSettings }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message ?? 'Erro ao salvar configurações do site') }
      return res.json()
    },
    onSuccess: () => { setSiteSaved(true); setTimeout(() => setSiteSaved(false), 3000) },
    onError: (e: Error) => { alert('Erro ao salvar: ' + e.message) },
  })

  // ── Team ──────────────────────────────────────────────────────────────────
  const [showNewUser, setShowNewUser] = useState(false)
  const [newUser, setNewUser] = useState({
    name: '', email: '', password: '', role: 'BROKER', phone: '', creciNumber: '',
    accessLevel: 'full' as 'full' | 'custom' | 'readonly',
    moduleAccess: [] as string[],
    createIsolatedCompany: false,
    isolatedCompanyName: '',
  })
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editUser, setEditUser] = useState({
    name: '', email: '', phone: '', role: '', creciNumber: '', bio: '', avatarUrl: '',
    accessLevel: 'full' as string,
    moduleAccess: [] as string[],
    hasDataAccess: true,
    welcomeMessage: '',
    welcomeDuration: 6,
  })
  const [editUserSaved, setEditUserSaved] = useState(false)
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null)
  const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null)
  const [resetPwdOpen, setResetPwdOpen] = useState(false)
  const [resetPwdValue, setResetPwdValue] = useState('')
  const [resetPwdConfirm, setResetPwdConfirm] = useState('')
  const [resetPwdError, setResetPwdError] = useState('')
  const [resetPwdSaved, setResetPwdSaved] = useState(false)

  const { data: teamUsers, isLoading: loadingTeam } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const token = await getValidToken()
      return usersApi.list(token!)
    },
    enabled: ['SUPER_ADMIN', 'ADMIN'].includes(user?.role ?? ''),
  })

  const createUserMutation = useMutation({
    mutationFn: async () => {
      const token = await getValidToken()
      return usersApi.create(token!, newUser as Parameters<typeof usersApi.create>[1])
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setShowNewUser(false); setNewUser({ name: '', email: '', password: '', role: 'BROKER', phone: '', creciNumber: '' }) },
    onError: (e: Error) => { alert('Erro ao criar usuário: ' + e.message) },
  })

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => { const token = await getValidToken(); return usersApi.delete(token!, id) },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
    onError: (e: Error) => { alert('Erro ao excluir usuário: ' + e.message) },
  })

  const updateTeamUserMutation = useMutation({
    mutationFn: async () => {
      if (!editingUserId) return
      const token = await getValidToken()
      let avatarUrl = editUser.avatarUrl || undefined
      if (editAvatarFile) {
        const fd = new FormData()
        fd.append('file', editAvatarFile)
        fd.append('folder', 'avatars')
        const res = await fetch(`${API_URL}/api/v1/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        })
        if (res.ok) {
          const data = await res.json()
          avatarUrl = data.url
        }
      }
      const { avatarUrl: _omit, ...editFields } = editUser
      return usersApi.update(token!, editingUserId, { ...editFields, ...(avatarUrl ? { avatarUrl } : {}) })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      setEditUserSaved(true)
      setEditAvatarFile(null)
      setEditAvatarPreview(null)
      setTimeout(() => { setEditUserSaved(false); setEditingUserId(null) }, 1500)
      // Revalidar páginas públicas imediatamente
      revalidatePublicPages(PAGES.team)
    },
  })

  const adminResetPwdMutation = useMutation({
    mutationFn: async () => {
      if (!editingUserId) return
      if (resetPwdValue.length < 8) throw new Error('Mínimo 8 caracteres')
      if (resetPwdValue !== resetPwdConfirm) throw new Error('As senhas não coincidem')
      const token = await getValidToken()
      return usersApi.resetPassword(token!, editingUserId, resetPwdValue)
    },
    onSuccess: () => {
      setResetPwdSaved(true)
      setResetPwdValue('')
      setResetPwdConfirm('')
      setResetPwdError('')
      setTimeout(() => { setResetPwdSaved(false); setResetPwdOpen(false) }, 2000)
    },
    onError: (e: Error) => { setResetPwdError(e.message || 'Erro ao redefinir senha') },
  })

  const startEditUser = (u: User) => {
    setEditingUserId(u.id)
    const settings = (u as any).settings ?? {}
    setEditUser({
      name: u.name ?? '',
      email: u.email ?? '',
      phone: u.phone ?? '',
      role: u.role ?? 'BROKER',
      creciNumber: u.creciNumber ?? '',
      bio: (u as any).bio ?? '',
      avatarUrl: u.avatarUrl ?? '',
      accessLevel: settings.accessLevel ?? 'full',
      moduleAccess: settings.moduleAccess ?? [],
      hasDataAccess: !settings.isolatedCompany,
      welcomeMessage: settings.welcomeMessage ?? '',
      welcomeDuration: Math.round((settings.welcomeDuration ?? 6000) / 1000),
    })
    setEditAvatarFile(null)
    setEditAvatarPreview(null)
    setResetPwdOpen(false)
    setResetPwdValue('')
    setResetPwdConfirm('')
    setResetPwdError('')
    setResetPwdSaved(false)
    setShowNewUser(false)
  }

  // ── Profile ───────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({ name: '', phone: '', creciNumber: '', bio: '' })
  const [profileSaved, setProfileSaved] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)

  useEffect(() => {
    if (user) {
      setProfile({ name: user.name ?? '', phone: user.phone ?? '', creciNumber: user.creciNumber ?? '', bio: (user as User & { bio?: string }).bio ?? '' })
    }
  }, [user])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = ev => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const uploadAvatar = async (): Promise<string | undefined> => {
    if (!avatarFile) return undefined
    setAvatarUploading(true)
    try {
      const token = await getValidToken()
      const fd = new FormData()
      fd.append('file', avatarFile)
      fd.append('folder', 'avatars')
      const res = await fetch(`${API_URL}/api/v1/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      if (res.ok) {
        const data = await res.json()
        return data.url
      }
    } finally {
      setAvatarUploading(false)
    }
  }

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const token = await getValidToken()
      let avatarUrl: string | undefined
      if (avatarFile) {
        avatarUrl = await uploadAvatar()
      }
      return usersApi.update(token!, user!.id, { ...profile, ...(avatarUrl ? { avatarUrl } : {}) })
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['me'] })
      if (data?.avatarUrl) updateUser({ avatarUrl: data.avatarUrl } as any)
      else if (avatarPreview) updateUser({ avatarUrl: avatarPreview } as any)
      setAvatarFile(null)
      setAvatarPreview(null)
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 3000)
      // Revalidar páginas públicas imediatamente
      revalidatePublicPages(PAGES.team)
    },
  })

  // ── Security ──────────────────────────────────────────────────────────────
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [pwdSaved, setPwdSaved] = useState(false)
  const [pwdError, setPwdError] = useState('')

  const changePwdMutation = useMutation({
    mutationFn: async () => {
      if (pwd.next !== pwd.confirm) throw new Error('As senhas não coincidem')
      if (pwd.next.length < 8) throw new Error('Mínimo 8 caracteres')
      const token = await getValidToken()
      return authApi.changePassword(token!, pwd.current, pwd.next)
    },
    onSuccess: () => { setPwdSaved(true); setPwd({ current: '', next: '', confirm: '' }); setTimeout(() => setPwdSaved(false), 3000) },
    onError: (e: Error) => {
      const msg = e.message || ''
      // Traduz erros comuns de validação para português
      if (msg.includes('maiúscula') || msg.includes('uppercase')) {
        setPwdError('A senha deve conter pelo menos uma letra maiúscula (A-Z)')
      } else if (msg.includes('minúscula') || msg.includes('lowercase')) {
        setPwdError('A senha deve conter pelo menos uma letra minúscula (a-z)')
      } else if (msg.includes('número') || msg.includes('digit') || msg.includes('number')) {
        setPwdError('A senha deve conter pelo menos um número (0-9)')
      } else if (msg.includes('especial') || msg.includes('special')) {
        setPwdError('A senha deve conter pelo menos um caractere especial (!@#$%)')
      } else if (msg.includes('Invalid') || msg.includes('invalid_string') || msg.includes('regex')) {
        setPwdError('Senha fraca. Use pelo menos 8 caracteres com maiúsculas, minúsculas, números e caracteres especiais.')
      } else if (msg.includes('current') || msg.includes('atual') || msg.includes('incorrect')) {
        setPwdError('Senha atual incorreta. Verifique e tente novamente.')
      } else {
        setPwdError(msg || 'Erro ao alterar senha. Tente novamente.')
      }
    },
  })

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-yellow-400" /> Configurações
          </h1>
          <p className="text-white/60 text-sm mt-1">Gerencie sua empresa, equipe e preferências do sistema</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-2xl p-1.5 mb-6 flex-wrap">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                activeTab === id
                  ? 'bg-yellow-500/20 text-yellow-400 shadow'
                  : 'text-white/70 hover:text-white hover:bg-white/5',
              )}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>

        {/* ── EMPRESA ──────────────────────────────────────────────────── */}
        {activeTab === 'empresa' && (
          <form onSubmit={e => { e.preventDefault(); updateEmpresaMutation.mutate() }} className="space-y-4">
            <Section title="Dados da Empresa">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DarkInput label="Razão Social *" value={empresa.name} onChange={e => setEmpresa(p => ({ ...p, name: e.target.value }))} placeholder="Nome jurídico da empresa" />
                <DarkInput label="Nome Fantasia" value={empresa.tradeName} onChange={e => setEmpresa(p => ({ ...p, tradeName: e.target.value }))} placeholder="Nome comercial" />
                <DarkInput label="CNPJ" value={empresa.cnpj} onChange={e => setEmpresa(p => ({ ...p, cnpj: e.target.value }))} placeholder="00.000.000/0001-00" />
                <DarkInput label="CRECI" value={empresa.creci} onChange={e => setEmpresa(p => ({ ...p, creci: e.target.value }))} placeholder="61053-F" />
                <DarkInput label="Telefone Principal" value={empresa.phone} onChange={e => setEmpresa(p => ({ ...p, phone: e.target.value }))} placeholder="(16) 3723-0045" />
                <DarkInput label="E-mail Comercial" type="email" value={empresa.email} onChange={e => setEmpresa(p => ({ ...p, email: e.target.value }))} placeholder="contato@imobiliaria.com" />
                <DarkInput label="Website" value={empresa.website} onChange={e => setEmpresa(p => ({ ...p, website: e.target.value }))} placeholder="https://www.imobiliarialemos.com.br" />
                {/* Upload de Logotipo */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-white/70 mb-1.5 block">Logotipo da Empresa</label>
                  <div className="flex items-center gap-4">
                    {/* Preview */}
                    <div className="w-20 h-20 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {(logoPreview || empresa.logoUrl) ? (
                        <img src={logoPreview ?? empresa.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                      ) : (
                        <Building2 className="w-8 h-8 text-white/20" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <label
                          htmlFor="logo-upload"
                          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 text-sm text-white/70 hover:text-white hover:border-white/40 cursor-pointer transition-colors w-fit"
                        >
                          {logoUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                          {logoFile ? logoFile.name : 'Upload arquivo'}
                        </label>
                        <span className="text-xs text-white/30">ou</span>
                        <DarkInput
                          placeholder="Cole a URL da imagem (https://...)"
                          value={!logoFile ? empresa.logoUrl : ''}
                          onChange={e => { setEmpresa(p => ({ ...p, logoUrl: e.target.value })); setLogoPreview(e.target.value || null); setLogoFile(null) }}
                          className="flex-1 !py-2 min-w-[200px]"
                        />
                      </div>
                      <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            <Section title="Endereço">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <DarkInput label="CEP" value={empresa.zipCode} onChange={e => setEmpresa(p => ({ ...p, zipCode: e.target.value }))} placeholder="14401-155" />
                <DarkInput label="Cidade" value={empresa.city} onChange={e => setEmpresa(p => ({ ...p, city: e.target.value }))} placeholder="Franca" />
                <DarkInput label="UF" value={empresa.state} onChange={e => setEmpresa(p => ({ ...p, state: e.target.value }))} placeholder="SP" maxLength={2} />
                <div className="sm:col-span-3">
                  <DarkInput label="Endereço Completo" value={empresa.address} onChange={e => setEmpresa(p => ({ ...p, address: e.target.value }))} placeholder="Rua Simão Caleiro, 2383, Vila França" />
                </div>
              </div>
            </Section>

            <div className="flex justify-end">
              <SaveButton loading={updateEmpresaMutation.isPending} saved={empresaSaved} />
            </div>
          </form>
        )}

        {/* ── EQUIPE ──────────────────────────────────────────────────── */}
        {activeTab === 'equipe' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-white/70 text-sm">{teamUsers?.length ?? 0} membros na equipe</p>
              <button onClick={() => setShowNewUser(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #1B2B5B, #2d4a99)', color: 'white' }}>
                <Plus className="w-4 h-4" /> Adicionar Membro
              </button>
            </div>

            <div className="space-y-2">
              {loadingTeam ? (
                <div className="text-center py-12 text-white/60">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /> Carregando...
                </div>
              ) : teamUsers?.map((u: User) => (
                <div key={u.id} className="flex items-center gap-4 bg-white/5 rounded-xl border border-white/10 px-4 py-3 hover:border-white/20 transition-colors">
                  {/* Avatar com botão de upload de ícone */}
                  <div className="relative group flex-shrink-0">
                    <UserAvatar
                      name={u.name}
                      avatarUrl={(u as any).avatarUrl}
                      size="md"
                      showRing
                    />
                    <label
                      htmlFor={`icon-upload-${u.id}`}
                      className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Trocar foto"
                    >
                      <Camera className="w-4 h-4 text-white" />
                    </label>
                    <input
                      id={`icon-upload-${u.id}`}
                      type="file"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        try {
                          const token = await getValidToken()
                          const fd = new FormData()
                          fd.append('file', file)
                          fd.append('folder', 'avatars')
                          const res = await fetch(`${API_URL}/api/v1/upload`, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}` },
                            body: fd,
                          })
                          if (res.ok) {
                            const data = await res.json()
                            await usersApi.update(token!, u.id, { avatarUrl: data.url })
                            qc.invalidateQueries({ queryKey: ['users'] })
                            // Revalidar páginas públicas imediatamente
                            revalidatePublicPages(PAGES.team)
                          }
                        } catch {}
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{u.name}</p>
                      {u.id === user?.id && <span className="text-[10px] text-white/60 bg-white/10 px-1.5 py-0.5 rounded">você</span>}
                    </div>
                    <p className="text-xs text-white/60">{u.email}</p>
                  </div>
                  <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full border', ROLE_COLORS[u.role] ?? 'bg-white/10 text-white/50 border-white/10')}>
                    {ROLE_LABELS[u.role] ?? u.role}
                  </span>
                  {u.id !== user?.id && (
                    <div className="flex items-center gap-1 ml-1">
                      <button onClick={() => startEditUser(u)}
                        className="text-white/50 hover:text-yellow-400 transition-colors"
                        title="Editar usuário">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => { if (confirm(`Remover ${u.name}?`)) deleteUserMutation.mutate(u.id) }}
                        className="text-white/50 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Edit user panel */}
            {editingUserId && (
              <div className="bg-white/5 rounded-2xl border border-yellow-400/30 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Editar Membro</h3>
                  <button onClick={() => { setEditingUserId(null); setEditAvatarFile(null); setEditAvatarPreview(null) }} className="text-white/60 hover:text-white text-xs">Cancelar</button>
                </div>
                {/* Avatar upload for edited user */}
                <div className="flex items-center gap-4">
                  <div className="relative group flex-shrink-0">
                    <UserAvatar
                      name={editUser.name}
                      avatarUrl={editAvatarPreview ?? (editUser.avatarUrl || undefined)}
                      size="lg"
                      showRing
                    />
                    <label
                      htmlFor="edit-user-avatar-upload"
                      className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Trocar foto"
                    >
                      <Camera className="w-4 h-4 text-white" />
                    </label>
                    <input
                      id="edit-user-avatar-upload"
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        setEditAvatarFile(file)
                        const reader = new FileReader()
                        reader.onload = ev => setEditAvatarPreview(ev.target?.result as string)
                        reader.readAsDataURL(file)
                      }}
                    />
                  </div>
                  <div className="text-sm space-y-1.5">
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="edit-user-avatar-upload"
                        className="inline-flex items-center gap-1.5 text-xs text-[#C9A84C] hover:text-[#e8c66a] cursor-pointer transition-colors"
                      >
                        <Camera className="w-3 h-3" />
                        {editAvatarFile ? editAvatarFile.name : 'Upload foto'}
                      </label>
                      {editAvatarFile && (
                        <button type="button" onClick={() => { setEditAvatarFile(null); setEditAvatarPreview(null) }}
                          className="text-xs text-red-400 hover:text-red-300">Remover</button>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-white/30">ou URL:</span>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={!editAvatarFile ? (editUser.avatarUrl || '') : ''}
                        onChange={e => {
                          const url = e.target.value
                          setEditUser(p => ({ ...p, avatarUrl: url }))
                          setEditAvatarPreview(url || null)
                          setEditAvatarFile(null)
                        }}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white placeholder:text-white/30 outline-none focus:border-yellow-400/50 transition-colors"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <DarkInput label="Nome *" value={editUser.name} onChange={e => setEditUser(p => ({ ...p, name: e.target.value }))} placeholder="Nome completo" />
                  <DarkInput label="E-mail *" type="email" value={editUser.email} onChange={e => setEditUser(p => ({ ...p, email: e.target.value }))} placeholder="email@exemplo.com" />
                  <DarkInput label="Telefone" value={editUser.phone} onChange={e => setEditUser(p => ({ ...p, phone: e.target.value }))} placeholder="(16) 99999-9999" />
                  <DarkSelect label="Perfil" value={editUser.role} onChange={e => setEditUser(p => ({ ...p, role: e.target.value }))}>
                    <option value="BROKER">Corretor</option>
                    <option value="MANAGER">Gerente</option>
                    <option value="FINANCIAL">Financeiro</option>
                    <option value="LAWYER">Advogado</option>
                    <option value="ADMIN">Administrador</option>
                  </DarkSelect>
                  <DarkInput label="CRECI" value={editUser.creciNumber} onChange={e => setEditUser(p => ({ ...p, creciNumber: e.target.value }))} placeholder="000000-F" />
                </div>
                <DarkTextarea label="Bio / Apresentação" value={editUser.bio} onChange={e => setEditUser(p => ({ ...p, bio: e.target.value }))} rows={3} placeholder="Sobre o usuário..." />

                {/* ── Permissões do Usuário ─────────────────────── */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3">Permissões de Acesso</p>
                  <div className="flex gap-2 mb-3">
                    {[
                      { id: 'full', label: 'Acesso Total', desc: 'Todas as ferramentas' },
                      { id: 'custom', label: 'Personalizado', desc: 'Escolher módulos' },
                      { id: 'readonly', label: 'Somente Leitura', desc: 'Apenas visualizar' },
                    ].map(opt => (
                      <button key={opt.id} type="button"
                        onClick={() => setEditUser(p => ({ ...p, accessLevel: opt.id }))}
                        className={`flex-1 p-2.5 rounded-lg text-xs text-center border transition-all ${
                          editUser.accessLevel === opt.id
                            ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]'
                            : 'border-white/10 text-white/40 hover:border-white/20'
                        }`}>
                        <p className="font-bold">{opt.label}</p>
                        <p className="text-[10px] mt-0.5 opacity-60">{opt.desc}</p>
                      </button>
                    ))}
                  </div>

                  {editUser.accessLevel === 'custom' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                      {[
                        { id: 'imoveis', label: 'Imóveis' }, { id: 'leads', label: 'Leads' },
                        { id: 'contatos', label: 'Contatos' }, { id: 'negocios', label: 'Negócios' },
                        { id: 'financeiro', label: 'Financeiro' }, { id: 'juridico', label: 'Jurídico' },
                        { id: 'chat', label: 'Chat/WhatsApp' }, { id: 'leiloes', label: 'Leilões' },
                        { id: 'blog', label: 'Blog' }, { id: 'seo', label: 'SEO' },
                        { id: 'automacoes', label: 'Automações' }, { id: 'ia-visual', label: 'IA Visual' },
                        { id: 'documentos', label: 'Documentos IA' }, { id: 'configuracoes', label: 'Configurações' },
                        { id: 'financiamentos', label: 'Financiamentos' }, { id: 'campanhas', label: 'Campanhas' },
                        { id: 'notas-fiscais', label: 'Notas Fiscais' }, { id: 'foto-editor', label: 'Editor Fotos' },
                      ].map(mod => (
                        <label key={mod.id} className="flex items-center gap-2 text-xs text-white/60 cursor-pointer hover:text-white/80">
                          <input type="checkbox" className="rounded border-white/20 bg-white/5 text-[#C9A84C]"
                            checked={editUser.moduleAccess.includes(mod.id)}
                            onChange={e => {
                              setEditUser(p => ({
                                ...p,
                                moduleAccess: e.target.checked
                                  ? [...p.moduleAccess, mod.id]
                                  : p.moduleAccess.filter(m => m !== mod.id),
                              }))
                            }}
                          />
                          {mod.label}
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Acesso a dados */}
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="rounded border-white/20 bg-white/5 text-[#C9A84C]"
                        checked={editUser.hasDataAccess}
                        onChange={e => setEditUser(p => ({ ...p, hasDataAccess: e.target.checked }))}
                      />
                      <div>
                        <p className="text-xs font-bold text-white/80">Acesso aos dados da empresa (imóveis, clientes, contratos)</p>
                        <p className="text-[10px] text-white/40">Se desativado, o usuário terá acesso às ferramentas mas sem dados existentes.</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* ── Mensagem de Boas-Vindas ────────────────── */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3">Mensagem de Boas-Vindas</p>
                  <DarkTextarea
                    label="Mensagem (use {nome} para o nome do usuário)"
                    value={editUser.welcomeMessage}
                    onChange={e => setEditUser(p => ({ ...p, welcomeMessage: e.target.value }))}
                    rows={3}
                    placeholder="Olá {nome}, está preparado para vender muito? ..."
                  />
                  <div className="mt-2">
                    <DarkInput
                      label="Tempo de exibição (segundos)"
                      type="number"
                      value={String(editUser.welcomeDuration)}
                      onChange={e => setEditUser(p => ({ ...p, welcomeDuration: parseInt(e.target.value) || 6 }))}
                      placeholder="6"
                    />
                  </div>
                  <p className="text-[10px] text-white/30 mt-2">Deixe vazio para usar a mensagem padrão. Aparece 1x por sessão ao fazer login.</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateTeamUserMutation.mutate()}
                    disabled={updateTeamUserMutation.isPending || !editUser.name}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #C9A84C, #e8c66a)', color: '#1B2B5B' }}>
                    {updateTeamUserMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {editUserSaved ? 'Salvo!' : 'Salvar Alterações'}
                  </button>
                  {updateTeamUserMutation.isError && <p className="text-xs text-red-400">Erro ao salvar</p>}
                </div>

                {/* Admin Reset Password */}
                <div className="border-t border-white/10 pt-4">
                  <button
                    type="button"
                    onClick={() => { setResetPwdOpen(v => !v); setResetPwdError('') }}
                    className="flex items-center gap-2 text-xs text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    {resetPwdOpen ? 'Fechar' : 'Redefinir Senha deste Usuário'}
                  </button>
                  {resetPwdOpen && (
                    <div className="mt-3 space-y-3 bg-orange-500/5 border border-orange-500/20 rounded-xl p-4">
                      <p className="text-xs text-orange-300/80">Define uma nova senha para este usuário. Ele precisará usar a nova senha no próximo login.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <DarkInput label="Nova Senha" type="password" value={resetPwdValue} onChange={e => { setResetPwdValue(e.target.value); setResetPwdError('') }} placeholder="Mínimo 8 caracteres" />
                        <DarkInput label="Confirmar Nova Senha" type="password" value={resetPwdConfirm} onChange={e => { setResetPwdConfirm(e.target.value); setResetPwdError('') }} placeholder="Repita a nova senha" />
                      </div>
                      {resetPwdError && <p className="text-xs text-red-400">{resetPwdError}</p>}
                      <button
                        onClick={() => adminResetPwdMutation.mutate()}
                        disabled={adminResetPwdMutation.isPending || !resetPwdValue || !resetPwdConfirm}
                        className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold disabled:opacity-50 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30 transition-colors"
                      >
                        {adminResetPwdMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                        {resetPwdSaved ? 'Senha Redefinida!' : 'Redefinir Senha'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Add user panel */}
            {showNewUser && (
              <div className="bg-white/5 rounded-2xl border border-yellow-400/30 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Novo Membro</h3>
                  <button onClick={() => setShowNewUser(false)} className="text-white/60 hover:text-white text-xs">Cancelar</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <DarkInput label="Nome *" value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} placeholder="Nome completo" />
                  <DarkInput label="E-mail *" type="email" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} placeholder="email@exemplo.com" />
                  <DarkInput label="Senha *" type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} placeholder="Mínimo 8 caracteres" />
                  <DarkSelect label="Perfil" value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}>
                    <option value="BROKER">Corretor</option>
                    <option value="MANAGER">Gerente</option>
                    <option value="FINANCIAL">Financeiro</option>
                    <option value="ADMIN">Administrador</option>
                  </DarkSelect>
                  <DarkInput label="Telefone" value={newUser.phone} onChange={e => setNewUser(p => ({ ...p, phone: e.target.value }))} placeholder="(16) 99999-9999" />
                  <DarkInput label="CRECI" value={newUser.creciNumber} onChange={e => setNewUser(p => ({ ...p, creciNumber: e.target.value }))} placeholder="000000-F" />
                </div>

                {/* ── Nível de Acesso ────────────────────────── */}
                <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3">Nível de Acesso</p>
                  <div className="flex gap-2 mb-3">
                    {[
                      { id: 'full', label: 'Acesso Total', desc: 'Todas as ferramentas' },
                      { id: 'custom', label: 'Personalizado', desc: 'Escolher módulos' },
                      { id: 'readonly', label: 'Somente Leitura', desc: 'Apenas visualizar' },
                    ].map(opt => (
                      <button key={opt.id} type="button"
                        onClick={() => setNewUser(p => ({ ...p, accessLevel: opt.id as any }))}
                        className={`flex-1 p-3 rounded-lg text-xs text-center border transition-all ${
                          newUser.accessLevel === opt.id
                            ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]'
                            : 'border-white/10 text-white/40 hover:border-white/20'
                        }`}>
                        <p className="font-bold">{opt.label}</p>
                        <p className="text-[10px] mt-0.5 opacity-60">{opt.desc}</p>
                      </button>
                    ))}
                  </div>

                  {newUser.accessLevel === 'custom' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                      {[
                        { id: 'imoveis', label: 'Imóveis' }, { id: 'leads', label: 'Leads' },
                        { id: 'contatos', label: 'Contatos' }, { id: 'negocios', label: 'Negócios' },
                        { id: 'financeiro', label: 'Financeiro' }, { id: 'juridico', label: 'Jurídico' },
                        { id: 'chat', label: 'Chat/WhatsApp' }, { id: 'leiloes', label: 'Leilões' },
                        { id: 'blog', label: 'Blog' }, { id: 'seo', label: 'SEO' },
                        { id: 'automacoes', label: 'Automações' }, { id: 'ia-visual', label: 'IA Visual' },
                        { id: 'documentos', label: 'Documentos IA' }, { id: 'configuracoes', label: 'Configurações' },
                        { id: 'financiamentos', label: 'Financiamentos' }, { id: 'campanhas', label: 'Campanhas' },
                        { id: 'notas-fiscais', label: 'Notas Fiscais' }, { id: 'foto-editor', label: 'Editor Fotos' },
                      ].map(mod => (
                        <label key={mod.id} className="flex items-center gap-2 text-xs text-white/60 cursor-pointer hover:text-white/80">
                          <input type="checkbox" className="rounded border-white/20 bg-white/5 text-[#C9A84C]"
                            checked={newUser.moduleAccess.includes(mod.id)}
                            onChange={e => {
                              setNewUser(p => ({
                                ...p,
                                moduleAccess: e.target.checked
                                  ? [...p.moduleAccess, mod.id]
                                  : p.moduleAccess.filter(m => m !== mod.id),
                              }))
                            }}
                          />
                          {mod.label}
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Empresa Isolada (dados do zero) ─────────── */}
                <div className="mt-3 p-4 rounded-xl bg-white/5 border border-white/10">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="rounded border-white/20 bg-white/5 text-[#C9A84C]"
                      checked={newUser.createIsolatedCompany}
                      onChange={e => setNewUser(p => ({ ...p, createIsolatedCompany: e.target.checked }))}
                    />
                    <div>
                      <p className="text-xs font-bold text-white/80">Criar empresa isolada (banco de dados do zero)</p>
                      <p className="text-[10px] text-white/40">O usuário terá acesso total às ferramentas, mas sem nenhum dado existente. Começa do zero.</p>
                    </div>
                  </label>
                  {newUser.createIsolatedCompany && (
                    <div className="mt-3">
                      <DarkInput label="Nome da Empresa" value={newUser.isolatedCompanyName}
                        onChange={e => setNewUser(p => ({ ...p, isolatedCompanyName: e.target.value }))}
                        placeholder="Ex: Imobiliária Silva" />
                    </div>
                  )}
                </div>

                <button
                  onClick={() => createUserMutation.mutate()}
                  disabled={createUserMutation.isPending || !newUser.name || !newUser.email || !newUser.password}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #C9A84C, #e8c66a)', color: '#1B2B5B' }}>
                  {createUserMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Adicionar
                </button>
                {createUserMutation.isError && <p className="text-xs text-red-400">Erro ao criar usuário</p>}
              </div>
            )}
          </div>
        )}

        {/* ── PERFIL ──────────────────────────────────────────────────── */}
        {activeTab === 'perfil' && (
          <form onSubmit={e => { e.preventDefault(); updateProfileMutation.mutate() }} className="space-y-4">
            {/* Avatar */}
            <Section title="Foto de Perfil">
              <div className="flex items-center gap-5">
                <div className="relative group">
                  <UserAvatar
                    name={user?.name}
                    avatarUrl={avatarPreview ?? (user as any)?.avatarUrl}
                    size="xl"
                    showRing
                    className="rounded-2xl"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="absolute inset-0 rounded-2xl bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Camera className="w-5 h-5 text-white" />
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  {avatarFile && (
                    <button
                      type="button"
                      onClick={() => { setAvatarFile(null); setAvatarPreview(null) }}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  )}
                </div>
                <div>
                  <p className="text-white font-semibold">{user?.name}</p>
                  <p className="text-white/40 text-sm">{user?.email}</p>
                  <p className="text-white/60 text-xs mt-0.5">{ROLE_LABELS[user?.role ?? ''] ?? user?.role}</p>
                  <label
                    htmlFor="avatar-upload"
                    className="mt-2 inline-flex items-center gap-1.5 text-xs text-[#C9A84C] hover:text-[#e8c66a] cursor-pointer transition-colors"
                  >
                    <Camera className="w-3 h-3" />
                    {avatarFile ? 'Trocar foto selecionada' : 'Carregar foto'}
                  </label>
                </div>
              </div>
            </Section>

            <Section title="Dados Pessoais">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DarkInput label="Nome Completo" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} placeholder="Seu nome" />
                <DarkInput label="Telefone / WhatsApp" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="(16) 99999-9999" />
                <DarkInput label="CRECI" value={profile.creciNumber} onChange={e => setProfile(p => ({ ...p, creciNumber: e.target.value }))} placeholder="000000-F" />
              </div>
              <DarkTextarea label="Bio / Apresentação" value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} rows={3} placeholder="Sobre você, especialidades, tempo de mercado..." />
            </Section>

            <div className="flex items-center gap-3">
              <SaveButton loading={updateProfileMutation.isPending} saved={profileSaved} />
              {updateProfileMutation.isError && <p className="text-xs text-red-400">Erro ao salvar perfil</p>}
            </div>
          </form>
        )}

        {/* ── SEGURANÇA ──────────────────────────────────────────────── */}
        {activeTab === 'seguranca' && (
          <div className="space-y-4 max-w-md">
            <Section title="Alterar Senha">
              <div className="space-y-3">
                <DarkInput label="Senha Atual" type={showPwd ? 'text' : 'password'} value={pwd.current} onChange={e => setPwd(p => ({ ...p, current: e.target.value }))} placeholder="••••••••" />
                <DarkInput label="Nova Senha" type={showPwd ? 'text' : 'password'} value={pwd.next} onChange={e => setPwd(p => ({ ...p, next: e.target.value }))} placeholder="Mínimo 8 caracteres" />
                <DarkInput label="Confirmar Nova Senha" type={showPwd ? 'text' : 'password'} value={pwd.confirm} onChange={e => { setPwd(p => ({ ...p, confirm: e.target.value })); setPwdError('') }} placeholder="Repita a nova senha" />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white/90">
                  {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showPwd ? 'Ocultar senhas' : 'Mostrar senhas'}
                </button>
                {pwdError && <p className="text-xs text-red-400">{pwdError}</p>}
                {pwdSaved && <p className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Senha alterada com sucesso!</p>}
                <button
                  type="button"
                  onClick={() => changePwdMutation.mutate()}
                  disabled={changePwdMutation.isPending || !pwd.current || !pwd.next || !pwd.confirm}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #C9A84C, #e8c66a)', color: '#1B2B5B' }}>
                  {changePwdMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                  Alterar Senha
                </button>
              </div>
            </Section>

            <Section title="Sessões Ativas">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-white">Sessão atual ativa</p>
                  <p className="text-xs text-white/60">Última atividade: agora</p>
                </div>
              </div>
            </Section>
          </div>
        )}

        {/* ── SITE & IA ─────────────────────────────────────────────── */}
        {activeTab === 'site' && (
          <div className="space-y-4">
            <Section title="Vídeo de Fundo — Página Inicial">
              <div className="flex gap-3">
                {(['youtube', 'upload', 'file'] as const).map(type => (
                  <button key={type} type="button" onClick={() => setVideoType(type === 'file' ? 'upload' : type)}
                    className={cn(
                      'flex-1 flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all',
                      (videoType === type || (type === 'file' && videoType === 'upload'))
                        ? 'border-yellow-400/50 bg-yellow-500/10 text-yellow-400'
                        : 'border-white/10 text-white/50 hover:border-white/30 hover:text-white',
                    )}>
                    {type === 'youtube' ? <Youtube className="w-4 h-4" /> : type === 'upload' ? <Link className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                    {type === 'youtube' ? 'YouTube' : type === 'upload' ? 'URL externa' : 'Upload direto'}
                  </button>
                ))}
              </div>
              {videoType === 'youtube' && (
                <DarkInput
                  label="URL do YouTube"
                  value={videoUrl}
                  onChange={e => setVideoUrl(e.target.value)}
                  placeholder="https://youtu.be/VIDEOID"
                />
              )}
              {videoType === 'upload' && (
                <DarkInput
                  label="URL do arquivo (.mp4, .webm)"
                  value={videoUrl}
                  onChange={e => setVideoUrl(e.target.value)}
                  placeholder="https://cdn.../video.mp4"
                />
              )}
              {/* Upload direto de vídeo */}
              <div className="mt-2">
                <label className="text-xs font-semibold text-white/70 mb-1.5 block">Ou envie o arquivo de vídeo diretamente</label>
                <label
                  htmlFor="hero-video-upload"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/20 text-sm text-white/70 hover:text-white hover:border-white/40 cursor-pointer transition-colors w-fit"
                >
                  <Upload className="w-4 h-4" />
                  Selecionar arquivo de vídeo
                </label>
                <input
                  id="hero-video-upload"
                  type="file"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    try {
                      const token = await getValidToken()
                      const fd = new FormData()
                      fd.append('file', file)
                      fd.append('folder', 'videos')
                      const res = await fetch(`${API_URL}/api/v1/upload`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` },
                        body: fd,
                      })
                      if (res.ok) {
                        const data = await res.json()
                        setVideoUrl(data.url)
                        setVideoType('upload')
                      }
                    } catch {}
                  }}
                />
                {videoUrl && videoType === 'upload' && (
                  <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Vídeo configurado
                  </p>
                )}
              </div>
            </Section>

            <Section title="Contato & Redes Sociais">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DarkInput label="WhatsApp (com DDI)" value={siteSettings.whatsapp} onChange={e => setSiteSettings(p => ({ ...p, whatsapp: e.target.value }))} placeholder="5516981010004" />
                <DarkInput label="Telefone de exibição" value={siteSettings.phone} onChange={e => setSiteSettings(p => ({ ...p, phone: e.target.value }))} placeholder="(16) 3723-0045" />
                <DarkInput label="Instagram" value={siteSettings.instagram} onChange={e => setSiteSettings(p => ({ ...p, instagram: e.target.value }))} placeholder="@imobiliarialemos" />
                <DarkInput label="Facebook" value={siteSettings.facebook} onChange={e => setSiteSettings(p => ({ ...p, facebook: e.target.value }))} placeholder="facebook.com/imobiliarialemos" />
                <div className="sm:col-span-2">
                  <DarkTextarea label="Mensagem padrão do WhatsApp" value={siteSettings.whatsappMsg} onChange={e => setSiteSettings(p => ({ ...p, whatsappMsg: e.target.value }))} rows={2} />
                </div>
              </div>
            </Section>

            <Section title="Tracking & Analytics">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DarkInput label="Google Analytics (ID)" value={siteSettings.googleAnalytics} onChange={e => setSiteSettings(p => ({ ...p, googleAnalytics: e.target.value }))} placeholder="G-XXXXXXXXXX" />
                <DarkInput label="Facebook Pixel (ID)" value={siteSettings.facebookPixel} onChange={e => setSiteSettings(p => ({ ...p, facebookPixel: e.target.value }))} placeholder="000000000000000" />
              </div>
            </Section>

            <Section title="Funcionalidades do Site">
              <div className="space-y-4">
                <Toggle checked={siteSettings.showPrices} onChange={v => setSiteSettings(p => ({ ...p, showPrices: v }))} label="Exibir preços dos imóveis no site público" />
                <Toggle checked={siteSettings.allowPropertySearch} onChange={v => setSiteSettings(p => ({ ...p, allowPropertySearch: v }))} label="Habilitar busca avançada com mapa" />
                <Toggle checked={siteSettings.enableSmartQuiz} onChange={v => setSiteSettings(p => ({ ...p, enableSmartQuiz: v }))} label="Exibir Quiz Inteligente de IA na homepage" />
                <Toggle checked={siteSettings.enableProposal} onChange={v => setSiteSettings(p => ({ ...p, enableProposal: v }))} label="Habilitar proposta online nos imóveis" />
              </div>
            </Section>

            <div className="flex justify-end">
              <button
                onClick={() => saveSiteSettingsMutation.mutate()}
                disabled={saveSiteSettingsMutation.isPending}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #C9A84C, #e8c66a)', color: '#1B2B5B' }}>
                {saveSiteSettingsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : siteSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {siteSaved ? 'Salvo!' : 'Salvar configurações'}
              </button>
            </div>
          </div>
        )}

        {/* ── INTEGRAÇÕES ─────────────────────────────────────────────── */}
        {activeTab === 'integracoes' && (
          <div className="space-y-4">
            <Section title="Instagram — @tomaslemosbr (Pessoal)">
              <div className="space-y-3">
                <p className="text-xs text-white/40">Token de acesso para sincronizar posts do Instagram de Tomas Lemos para o blog.</p>
                <DarkInput
                  label="Instagram Access Token (@tomaslemosbr)"
                  type="password"
                  value={integrations.instagramTokenTomas}
                  onChange={e => setIntegrations(p => ({ ...p, instagramTokenTomas: e.target.value }))}
                  placeholder="EAAxxxxxxx..."
                />
              </div>
            </Section>

            <Section title="Instagram — @imobiliarialemos (Imobiliária)">
              <div className="space-y-3">
                <p className="text-xs text-white/40">Tokens para sincronizar posts e publicar no Instagram da Imobiliária Lemos.</p>
                <DarkInput
                  label="Instagram Access Token (@imobiliarialemos)"
                  type="password"
                  value={integrations.instagramTokenLemos}
                  onChange={e => setIntegrations(p => ({ ...p, instagramTokenLemos: e.target.value }))}
                  placeholder="EAAxxxxxxx..."
                />
                <DarkInput
                  label="Instagram Business Account ID"
                  value={integrations.instagramBusinessAccountId}
                  onChange={e => setIntegrations(p => ({ ...p, instagramBusinessAccountId: e.target.value }))}
                  placeholder="17841400000000000"
                />
                <DarkInput
                  label="Facebook Page Access Token (para publicação)"
                  type="password"
                  value={integrations.instagramPageAccessToken}
                  onChange={e => setIntegrations(p => ({ ...p, instagramPageAccessToken: e.target.value }))}
                  placeholder="EAAxxxxxxx..."
                />
              </div>
            </Section>

            <Section title="YouTube — @tomaslemosbr">
              <div className="space-y-3">
                <p className="text-xs text-white/40">Chave de API para sincronizar vídeos do YouTube para o blog automaticamente.</p>
                <DarkInput
                  label="YouTube Data API v3 Key"
                  type="password"
                  value={integrations.youtubeApiKey}
                  onChange={e => setIntegrations(p => ({ ...p, youtubeApiKey: e.target.value }))}
                  placeholder="AIzaSy..."
                />
              </div>
            </Section>

            <Section title="Google Sign-In">
              <div className="space-y-3">
                <p className="text-xs text-white/40">Client ID do Google OAuth para login com Google no sistema e site.</p>
                <DarkInput
                  label="Google OAuth Client ID"
                  value={integrations.googleClientId}
                  onChange={e => setIntegrations(p => ({ ...p, googleClientId: e.target.value }))}
                  placeholder="xxxxxx.apps.googleusercontent.com"
                />
              </div>
            </Section>

            <div className="flex justify-end">
              <button
                onClick={() => saveIntegrationsMutation.mutate()}
                disabled={saveIntegrationsMutation.isPending}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #C9A84C, #e8c66a)', color: '#1B2B5B' }}>
                {saveIntegrationsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : integSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {integSaved ? 'Salvo!' : 'Salvar tokens'}
              </button>
            </div>
          </div>
        )}

        {/* ── SISTEMA ─────────────────────────────────────────────────────── */}
        {activeTab === 'sistema' && (
          <div className="space-y-6">
            <SystemConfigPanel />

            {/* ── Importação de Dados ──────────────────────────── */}
            {['SUPER_ADMIN', 'ADMIN'].includes(user?.role ?? '') && (
              <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                <h3 className="text-sm font-bold text-white mb-1">Importação de Dados</h3>
                <p className="text-xs text-white/40 mb-4">
                  Migre seus imóveis e clientes de outro sistema. Aceita CSV ou JSON. O sistema identifica automaticamente os campos.
                </p>
                <input type="file" accept=".csv,.json" id="import-data-file" className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const fd = new FormData()
                    fd.append('file', file)
                    try {
                      const token = await getValidToken()
                      const res = await fetch(`${API_URL}/api/v1/users/import-data`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` },
                        body: fd,
                      })
                      const data = await res.json()
                      alert(data.message || JSON.stringify(data))
                    } catch (err: any) {
                      alert('Erro: ' + err.message)
                    }
                    e.target.value = ''
                  }}
                />
                <div className="flex gap-3">
                  <button onClick={() => document.getElementById('import-data-file')?.click()}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-[#1B2B5B]"
                    style={{ background: 'linear-gradient(135deg, #C9A84C, #e8c66a)' }}>
                    <Upload className="w-4 h-4" /> Upload CSV ou JSON
                  </button>
                </div>
                <div className="mt-3 text-[10px] text-white/30 leading-relaxed">
                  <p><strong>CSV:</strong> Primeira linha = cabeçalho. Campos aceitos: titulo, tipo, finalidade, preco, cidade, bairro, endereco, quartos, banheiros, vagas, area, descricao, referencia</p>
                  <p><strong>JSON:</strong> Array de objetos ou {`{ data: [...] }`}. Mesmos campos do CSV.</p>
                  <p><strong>Clientes:</strong> Se o arquivo contém campos como cpf, nomeCliente, telefoneCliente, eles são importados automaticamente.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

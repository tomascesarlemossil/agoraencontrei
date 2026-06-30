'use client'

import { useState, useEffect, useCallback } from 'react'
import { ShieldCheck, Save } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { locacaoFetch } from '@/lib/locacao-api'

type Perm = { module: string; canView: boolean; canEdit: boolean; canDelete: boolean }

export default function PermissoesPage() {
  const token = useAuthStore(s => s.accessToken)
  const [users, setUsers] = useState<any[]>([])
  const [modules, setModules] = useState<string[]>([])
  const [userId, setUserId] = useState('')
  const [perms, setPerms] = useState<Record<string, Perm>>({})
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!token) return
    ;(async () => {
      try {
        const [u, m] = await Promise.all([
          locacaoFetch(token, '/api/v1/users'),
          locacaoFetch(token, '/api/v1/permissions/modules'),
        ])
        setUsers(u.data ?? u ?? [])
        setModules(m.data ?? [])
      } catch (e: any) { setMsg({ type: 'error', text: e.message }) }
    })()
  }, [token])

  const loadUser = useCallback(async (id: string) => {
    setUserId(id); setMsg(null)
    const base: Record<string, Perm> = {}
    modules.forEach(mod => { base[mod] = { module: mod, canView: false, canEdit: false, canDelete: false } })
    if (!id) { setPerms(base); return }
    try {
      const r = await locacaoFetch(token, `/api/v1/permissions/users/${id}`)
      ;(r.data ?? []).forEach((p: any) => { base[p.module] = { module: p.module, canView: p.canView, canEdit: p.canEdit, canDelete: p.canDelete } })
      setPerms(base)
    } catch (e: any) { setMsg({ type: 'error', text: e.message }); setPerms(base) }
  }, [token, modules])

  function toggle(mod: string, field: keyof Omit<Perm, 'module'>) {
    setPerms(p => ({ ...p, [mod]: { ...p[mod], [field]: !p[mod][field] } }))
  }

  async function save() {
    setMsg(null)
    try {
      const permissions = Object.values(perms).filter(p => p.canView || p.canEdit || p.canDelete)
      await locacaoFetch(token, `/api/v1/permissions/users/${userId}`, { method: 'PUT', body: JSON.stringify({ permissions }) })
      setMsg({ type: 'success', text: 'Permissões salvas.' })
    } catch (e: any) { setMsg({ type: 'error', text: e.message }) }
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-1"><ShieldCheck size={24} /> Permissões por Módulo</h1>
      <p className="text-sm text-gray-500 mb-6">Acesso fino por usuário e módulo. Usuários sem nenhuma permissão cadastrada têm acesso liberado (opt-in). ADMIN/SUPER_ADMIN/MANAGER têm acesso total.</p>

      {msg && <div className={`mb-4 p-3 rounded-lg text-sm ${msg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{msg.text}</div>}

      <select value={userId} onChange={e => loadUser(e.target.value)} className="border rounded-lg px-3 py-2 text-sm mb-4 w-full md:w-80">
        <option value="">Selecione um usuário…</option>
        {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
      </select>

      {userId && (
        <>
          <div className="rounded-xl border bg-white overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500"><tr><th className="p-2">Módulo</th><th className="p-2 text-center">Ver</th><th className="p-2 text-center">Editar</th><th className="p-2 text-center">Excluir</th></tr></thead>
              <tbody>
                {modules.map(mod => (
                  <tr key={mod} className="border-t">
                    <td className="p-2 font-medium">{mod}</td>
                    <td className="p-2 text-center"><input type="checkbox" checked={perms[mod]?.canView ?? false} onChange={() => toggle(mod, 'canView')} /></td>
                    <td className="p-2 text-center"><input type="checkbox" checked={perms[mod]?.canEdit ?? false} onChange={() => toggle(mod, 'canEdit')} /></td>
                    <td className="p-2 text-center"><input type="checkbox" checked={perms[mod]?.canDelete ?? false} onChange={() => toggle(mod, 'canDelete')} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={save} className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm flex items-center gap-1"><Save size={16} /> Salvar permissões</button>
        </>
      )}
    </div>
  )
}

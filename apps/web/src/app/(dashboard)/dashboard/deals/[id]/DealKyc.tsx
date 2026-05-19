'use client'

import { useEffect, useState, useCallback } from 'react'
import { ShieldCheck, Loader2, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

const KYC_ITEMS: [string, string][] = [
  ['cpf', 'CPF válido'],
  ['identidade', 'Documento de identidade'],
  ['face_match', 'Selfie confere com o documento'],
  ['endereco', 'Comprovante de endereço'],
  ['restricoes', 'Sem protestos / restrições'],
  ['sancoes', 'Sem sanções'],
]
const ROLE_LABEL: Record<string, string> = { buyer: 'Comprador', seller: 'Vendedor', other: 'Outro' }
const STATUS: Record<string, { label: string; cls: string }> = {
  pending:  { label: 'Pendente',  cls: 'bg-yellow-500/20 text-yellow-400' },
  review:   { label: 'Revisar',   cls: 'bg-blue-500/20 text-blue-400' },
  approved: { label: 'Aprovado',  cls: 'bg-emerald-500/20 text-emerald-400' },
  rejected: { label: 'Reprovado', cls: 'bg-red-500/20 text-red-400' },
}
const RISK: Record<string, string> = {
  low: 'text-emerald-400', medium: 'text-yellow-400', high: 'text-red-400',
}

interface Kyc {
  id: string; subjectName: string; subjectRole: string; cpfCnpj: string | null
  status: string; riskLevel: string; checklist: Record<string, boolean>; notes: string | null
}

export function DealKyc({ dealId }: { dealId: string }) {
  const { getValidToken } = useAuth()
  const [checks, setChecks] = useState<Kyc[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [add, setAdd] = useState({ name: '', role: 'buyer', cpf: '' })

  const load = useCallback(async () => {
    try {
      const token = await getValidToken()
      const res = await fetch(`${API_URL}/api/v1/deals/${dealId}/kyc`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const j = await res.json().catch(() => ({ data: [] }))
      setChecks((j.data ?? []).map((c: any) => ({ ...c, checklist: c.checklist ?? {} })))
    } finally {
      setLoading(false)
    }
  }, [dealId, getValidToken])

  useEffect(() => { load() }, [load])

  async function createCheck() {
    if (add.name.trim().length < 2) return
    setBusy('add')
    try {
      const token = await getValidToken()
      await fetch(`${API_URL}/api/v1/deals/${dealId}/kyc`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectName: add.name, subjectRole: add.role, cpfCnpj: add.cpf || undefined }),
      })
      setAdd({ name: '', role: 'buyer', cpf: '' })
      await load()
    } finally { setBusy(null) }
  }

  async function saveCheck(c: Kyc) {
    setBusy(c.id)
    try {
      const token = await getValidToken()
      await fetch(`${API_URL}/api/v1/deals/${dealId}/kyc/${c.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: c.status, riskLevel: c.riskLevel, checklist: c.checklist }),
      })
      await load()
    } finally { setBusy(null) }
  }

  async function removeCheck(idc: string) {
    setBusy(idc)
    try {
      const token = await getValidToken()
      await fetch(`${API_URL}/api/v1/deals/${dealId}/kyc/${idc}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      await load()
    } finally { setBusy(null) }
  }

  const patch = (id: string, p: Partial<Kyc>) =>
    setChecks(cs => cs.map(c => c.id === id ? { ...c, ...p } : c))

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-4">
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="h-4 w-4 text-amber-400" />
        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">
          KYC — Verificação das partes
        </h3>
      </div>

      {loading ? (
        <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin text-white/40" /></div>
      ) : (
        <div className="space-y-2">
          {checks.length === 0 && <p className="text-xs text-white/40">Nenhuma verificação ainda.</p>}
          {checks.map(c => (
            <div key={c.id} className="rounded-lg border border-white/10 p-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-white">{c.subjectName}</span>
                  <span className="ml-1.5 text-[10px] text-white/40">{ROLE_LABEL[c.subjectRole]}</span>
                </div>
                <button onClick={() => removeCheck(c.id)} disabled={busy === c.id}
                  className="text-white/30 hover:text-red-400"><Trash2 size={13} /></button>
              </div>

              <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5">
                {KYC_ITEMS.map(([k, label]) => (
                  <label key={k} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={!!c.checklist[k]}
                      onChange={() => patch(c.id, { checklist: { ...c.checklist, [k]: !c.checklist[k] } })}
                      className="h-3 w-3 rounded border-white/20 bg-white/5 accent-amber-500" />
                    <span className={`text-[11px] ${c.checklist[k] ? 'text-white/40 line-through' : 'text-white/70'}`}>
                      {label}
                    </span>
                  </label>
                ))}
              </div>

              <div className="mt-2 flex items-center gap-2">
                <select value={c.status} onChange={(e) => patch(c.id, { status: e.target.value })}
                  className="rounded-md border border-white/10 bg-white/5 px-1.5 py-1 text-[11px] text-white">
                  {Object.entries(STATUS).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
                </select>
                <select value={c.riskLevel} onChange={(e) => patch(c.id, { riskLevel: e.target.value })}
                  className={`rounded-md border border-white/10 bg-white/5 px-1.5 py-1 text-[11px] ${RISK[c.riskLevel] ?? 'text-white'}`}>
                  <option value="low">Risco baixo</option>
                  <option value="medium">Risco médio</option>
                  <option value="high">Risco alto</option>
                </select>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${STATUS[c.status]?.cls ?? 'bg-white/10'}`}>
                  {STATUS[c.status]?.label ?? c.status}
                </span>
                <button onClick={() => saveCheck(c)} disabled={busy === c.id}
                  className="ml-auto rounded-md bg-amber-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-amber-500 disabled:opacity-50">
                  Salvar
                </button>
              </div>
            </div>
          ))}

          {/* Add */}
          <div className="flex items-end gap-1.5 pt-1">
            <input value={add.name} onChange={(e) => setAdd({ ...add, name: e.target.value })}
              placeholder="Nome da parte"
              className="flex-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white placeholder:text-white/30" />
            <select value={add.role} onChange={(e) => setAdd({ ...add, role: e.target.value })}
              className="rounded-md border border-white/10 bg-white/5 px-1.5 py-1 text-xs text-white">
              <option value="buyer">Comprador</option>
              <option value="seller">Vendedor</option>
              <option value="other">Outro</option>
            </select>
            <button onClick={createCheck} disabled={busy === 'add' || add.name.trim().length < 2}
              className="flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20 disabled:opacity-40">
              <Plus size={12} /> Add
            </button>
          </div>
        </div>
      )}
      <p className="mt-2 text-[10px] text-white/40">
        Fluxo assistido — integração com provedores (Unico, Idwall, Serasa) plugável depois.
      </p>
    </div>
  )
}

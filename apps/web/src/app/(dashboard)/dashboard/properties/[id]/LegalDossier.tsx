'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck, Loader2, Save } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

const DOC_ITEMS: [string, string][] = [
  ['matricula', 'Matrícula atualizada'],
  ['onus', 'Certidão de ônus reais'],
  ['iptu', 'IPTU em dia'],
  ['certidoes_vendedor', 'Certidões dos vendedores'],
  ['processos', 'Processos judiciais verificados'],
  ['habite_se', 'Habite-se / construção averbada'],
  ['area', 'Área conferida (matrícula × IPTU)'],
]

const RISK: Record<string, { label: string; cls: string }> = {
  green:  { label: 'Pronto para venda',   cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' },
  yellow: { label: 'Exige atenção',       cls: 'bg-amber-500/15 text-amber-300 border-amber-500/40' },
  red:    { label: 'Risco jurídico alto', cls: 'bg-red-500/15 text-red-300 border-red-500/40' },
  gray:   { label: 'Documentos incompletos', cls: 'bg-gray-500/15 text-gray-400 border-gray-500/40' },
}

export function LegalDossier({ propertyId }: { propertyId: string }) {
  const { getValidToken } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [riskLevel, setRiskLevel] = useState('gray')
  const [checklist, setChecklist] = useState<Record<string, boolean>>({})
  const [notes, setNotes] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const token = await getValidToken()
        const res = await fetch(`${API_URL}/api/v1/properties/${propertyId}/dossier`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const j = await res.json().catch(() => ({}))
        if (active && j?.data) {
          setRiskLevel(j.data.riskLevel ?? 'gray')
          setChecklist((j.data.checklist as Record<string, boolean>) ?? {})
          setNotes(j.data.notes ?? '')
        }
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [propertyId, getValidToken])

  // Sugestão de selo a partir do checklist.
  const doneCount = DOC_ITEMS.filter(([k]) => checklist[k]).length
  const suggested = doneCount === DOC_ITEMS.length ? 'green'
    : doneCount === 0 ? 'gray'
    : doneCount >= DOC_ITEMS.length - 2 ? 'yellow' : 'red'

  async function save() {
    setSaving(true); setMsg('')
    try {
      const token = await getValidToken()
      const res = await fetch(`${API_URL}/api/v1/properties/${propertyId}/dossier`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ riskLevel, checklist, notes }),
      })
      setMsg(res.ok ? 'Dossiê salvo.' : 'Falha ao salvar.')
    } catch {
      setMsg('Falha ao salvar.')
    } finally {
      setSaving(false)
      setTimeout(() => setMsg(''), 4000)
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-white/40" />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck className="h-4 w-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-white">Dossiê Jurídico</h3>
        <span className={`ml-auto rounded-full border px-2.5 py-0.5 text-xs font-medium ${RISK[riskLevel]?.cls ?? RISK.gray.cls}`}>
          {RISK[riskLevel]?.label ?? RISK.gray.label}
        </span>
      </div>

      <div className="space-y-1.5">
        {DOC_ITEMS.map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!checklist[key]}
              onChange={() => setChecklist(c => ({ ...c, [key]: !c[key] }))}
              className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 accent-amber-500"
            />
            <span className={`text-xs ${checklist[key] ? 'text-white/40 line-through' : 'text-white/70'}`}>
              {label}
            </span>
          </label>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <label className="text-xs text-white/50">Selo de risco</label>
        <select
          value={riskLevel}
          onChange={(e) => setRiskLevel(e.target.value)}
          className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white focus:border-amber-500 focus:outline-none"
        >
          {Object.entries(RISK).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        {suggested !== riskLevel && (
          <button onClick={() => setRiskLevel(suggested)}
            className="text-[11px] text-amber-400 hover:underline">
            sugerido: {RISK[suggested].label}
          </button>
        )}
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Observações jurídicas / pendências..."
        rows={2}
        className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-amber-500 focus:outline-none"
      />

      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-500 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          Salvar dossiê
        </button>
        {msg && <span className="text-xs text-white/50">{msg}</span>}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { FileText, History, Download, Landmark } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

function fmtCurrency(v: number | null | undefined): string {
  if (!v) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(v))
}
function fmtDateTime(d: string | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
const STATUS_LABEL: Record<string, string> = {
  UPCOMING: 'Em breve', OPEN: 'Aberto', FIRST_ROUND: '1ª Praça', SECOND_ROUND: '2ª Praça',
  SOLD: 'Arrematado', DESERTED: 'Deserto', SUSPENDED: 'Suspenso', CANCELLED: 'Cancelado', CLOSED: 'Encerrado',
}
const DOC_LABEL: Record<string, string> = {
  EDITAL: 'Edital', MATRICULA: 'Matrícula', LAUDO: 'Laudo de Avaliação', ATA: 'Ata do Leilão', OUTRO: 'Documento',
}

interface Snapshot {
  capturedAt: string; status: string | null
  appraisalValue: number | null; minimumBid: number | null
  currentBid: number | null; soldValue: number | null; discountPercent: number | null
}
interface Doc {
  type: string; sourceUrl: string; s3Url: string | null; mimeType: string | null; capturedAt: string
}

/**
 * Painel do arquivo histórico de um leilão: documentos públicos arquivados
 * (edital/matrícula/laudo) e a linha do tempo de preço/status (snapshots).
 * Consome GET /api/v1/auctions/:slug/documents e /history.
 */
export default function AuctionArchivePanel({ slug }: { slug: string }) {
  const [history, setHistory] = useState<Snapshot[]>([])
  const [documents, setDocuments] = useState<Doc[]>([])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const r = await fetch(`${API_URL}/api/v1/auctions/${slug}/documents`)
        if (r.ok && alive) setDocuments((await r.json()).documents || [])
      } catch { /* best-effort */ }
      try {
        const r = await fetch(`${API_URL}/api/v1/auctions/${slug}/history`)
        if (r.ok && alive) setHistory((await r.json()).history || [])
      } catch { /* best-effort */ }
    })()
    return () => { alive = false }
  }, [slug])

  if (!documents.length && history.length < 2) return null

  return (
    <>
      {documents.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" style={{ color: '#C9A84C' }} /> Documentos do Leilão
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {documents.map((d, i) => (
              <a key={i} href={d.s3Url || d.sourceUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between gap-2 px-4 py-3 bg-gray-50 rounded-lg text-sm hover:bg-gray-100 transition">
                <span className="flex items-center gap-2 font-medium text-gray-700">
                  {d.type === 'MATRICULA' ? <Landmark className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  {DOC_LABEL[d.type] || d.type}
                </span>
                <Download className="w-4 h-4 text-gray-400" />
              </a>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">Documentos públicos arquivados pelo AgoraEncontrei.</p>
        </div>
      )}

      {history.length >= 2 && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <History className="w-5 h-5" style={{ color: '#C9A84C' }} /> Histórico do Leilão
          </h3>
          <div className="space-y-3">
            {history.slice().reverse().map((s, i) => {
              const value = s.soldValue || s.currentBid || s.minimumBid
              return (
                <div key={i} className="flex items-center justify-between gap-3 pb-3 border-b last:border-0 text-sm">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${s.status === 'SOLD' ? 'bg-green-500' : s.status === 'DESERTED' ? 'bg-red-400' : 'bg-[#C9A84C]'}`} />
                    <div>
                      <div className="font-medium text-gray-700">{STATUS_LABEL[s.status || ''] || s.status || '—'}</div>
                      <div className="text-xs text-gray-400">{fmtDateTime(s.capturedAt)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-800">{fmtCurrency(value)}</div>
                    {s.discountPercent != null && <div className="text-xs text-green-600">{s.discountPercent}% off</div>}
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-gray-400 mt-3">Evolução de preço e status capturada automaticamente.</p>
        </div>
      )}
    </>
  )
}

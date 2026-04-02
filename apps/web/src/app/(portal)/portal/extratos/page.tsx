'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Loader2, ArrowLeft, FolderOpen, BarChart3 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

interface Doc {
  id: string
  name: string
  month: string
  year: number
  fileSize: number
  mimeType: string
}

function fmtMonth(m: string) {
  if (!m) return ''
  const [num, yr] = m.split('.')
  const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  return `${months[parseInt(num) - 1] || num} ${yr}`
}

function fmtSize(b?: number) {
  if (!b) return ''
  return b < 1024 * 1024 ? `${(b/1024).toFixed(0)} KB` : `${(b/1024/1024).toFixed(1)} MB`
}

export default function ExtratosPage() {
  const router = useRouter()
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('portal_auth')
    if (!stored) { router.push('/portal/login'); return }
    const auth = JSON.parse(stored)
    if (auth.expiresAt && Date.now() > auth.expiresAt) { localStorage.removeItem('portal_auth'); router.push('/portal/login'); return }

    fetch(`${API_URL}/api/v1/portal/extratos`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
      .then(r => r.ok ? r.json() : { documents: [] })
      .then(d => setDocs(d.documents ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [router])

  const getDownloadUrl = (id: string) => {
    const stored = localStorage.getItem('portal_auth')
    if (!stored) return '#'
    const auth = JSON.parse(stored)
    return `${API_URL}/api/v1/portal/documentos/${id}/download?token=${auth.token}`
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            Extratos
          </h1>
          <p className="text-sm text-gray-500">Histórico de repasses mensais</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#C9A84C' }} />
        </div>
      ) : docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <FolderOpen className="w-12 h-12 mb-3 opacity-30" />
          <p className="font-medium">Nenhum extrato disponível</p>
          <p className="text-sm mt-1">Os extratos serão disponibilizados mensalmente</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border divide-y" style={{ borderColor: '#ddd9d0' }}>
          {docs.map(doc => (
            <div key={doc.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#D1FAE5' }}>
                <BarChart3 className="w-5 h-5" style={{ color: '#059669' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{fmtMonth(doc.month)}</p>
                <p className="text-xs text-gray-400">{fmtSize(doc.fileSize)}</p>
              </div>
              <a
                href={`${API_URL}/api/v1/portal/documentos/${doc.id}/download`}
                target="_blank"
                rel="noreferrer"
                onClick={e => {
                  e.preventDefault()
                  const auth = JSON.parse(localStorage.getItem('portal_auth') || '{}')
                  fetch(`${API_URL}/api/v1/portal/documentos/${doc.id}/download`, {
                    headers: { Authorization: `Bearer ${auth.token}` },
                  }).then(r => r.blob()).then(blob => {
                    const url = URL.createObjectURL(blob)
                    window.open(url, '_blank')
                  })
                }}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

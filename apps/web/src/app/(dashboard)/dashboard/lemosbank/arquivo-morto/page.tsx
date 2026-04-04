'use client'

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import Link from 'next/link'
import {
  Archive, ArrowLeft, Search, Download, FileText, File,
  FileImage, FileSpreadsheet, Filter, ChevronLeft, ChevronRight,
  User, Calendar, FolderOpen, Eye, Loader2, X,
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

async function apiFetch(path: string, token: string) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message ?? 'Erro') }
  return res.json()
}

// Tipos de documentos mapeados das pastas do backup
const DOC_TYPES: Record<string, { label: string; color: string }> = {
  ARQUIVO_MORTO:    { label: 'Arquivo Morto',          color: 'bg-gray-100 text-gray-700' },
  ADITIVO:          { label: 'Aditivo',                 color: 'bg-blue-100 text-blue-700' },
  FINANCEIRO:       { label: 'Financeiro',              color: 'bg-green-100 text-green-700' },
  CONTRATO_SERVICO: { label: 'Contrato de Serviço',     color: 'bg-purple-100 text-purple-700' },
  SEGURO:           { label: 'Seguro / Folder',         color: 'bg-orange-100 text-orange-700' },
  IPTU:             { label: 'IPTU',                    color: 'bg-red-100 text-red-700' },
  JURIDICO:         { label: 'Jurídico',                color: 'bg-indigo-100 text-indigo-700' },
  CONTRATO:         { label: 'Contrato de Locação',     color: 'bg-teal-100 text-teal-700' },
  RECEPCAO:         { label: 'Recepção',                color: 'bg-pink-100 text-pink-700' },
  RESCISAO:         { label: 'Rescisão',                color: 'bg-rose-100 text-rose-700' },
  VENDA:            { label: 'Venda',                   color: 'bg-yellow-100 text-yellow-700' },
  VISTORIA:         { label: 'Vistoria',                color: 'bg-cyan-100 text-cyan-700' },
  DOCUMENTO:        { label: 'Documento',               color: 'bg-gray-100 text-gray-600' },
  BOLETO:           { label: 'Boleto',                  color: 'bg-emerald-100 text-emerald-700' },
  OUTROS:           { label: 'Outros',                  color: 'bg-slate-100 text-slate-600' },
}

function fileIcon(mimeType: string | null, name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (mimeType?.startsWith('image/') || ['jpg','jpeg','png','gif'].includes(ext))
    return <FileImage className="w-4 h-4 text-blue-400" />
  if (['xls','xlsx','csv'].includes(ext))
    return <FileSpreadsheet className="w-4 h-4 text-green-500" />
  if (['doc','docx'].includes(ext))
    return <FileText className="w-4 h-4 text-blue-600" />
  if (ext === 'pdf')
    return <FileText className="w-4 h-4 text-red-500" />
  return <File className="w-4 h-4 text-gray-400" />
}

function fmtBytes(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const MONTHS = [
  { value: '', label: 'Todos os meses' },
  { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },   { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },    { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },   { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },{ value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },{ value: '12', label: 'Dezembro' },
]

export default function ArquivoMortoPage() {
  const token = useAuthStore(s => s.accessToken)

  const [search, setSearch]     = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [type, setType]         = useState('')
  const [year, setYear]         = useState('')
  const [month, setMonth]       = useState('')
  const [page, setPage]         = useState(1)
  const [previewDoc, setPreviewDoc] = useState<any>(null)

  const params = new URLSearchParams({ page: String(page), limit: '50' })
  if (search) params.set('search', search)
  if (type)   params.set('type', type)
  if (year)   params.set('year', year)
  if (month)  params.set('month', month)

  const { data, isLoading } = useQuery({
    queryKey: ['arquivo-morto', page, search, type, year, month],
    queryFn: () => apiFetch(`/api/v1/documents?${params}`, token!),
    enabled: !!token,
  })

  const { data: stats } = useQuery({
    queryKey: ['arquivo-morto-stats'],
    queryFn: () => apiFetch(`/api/v1/documents/stats`, token!),
    enabled: !!token,
  })

  const docs = data?.data ?? []
  const meta = data?.meta

  // Anos disponíveis (2019–2026)
  const years = Array.from({ length: 8 }, (_, i) => String(2019 + i)).reverse()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  function clearFilters() {
    setSearch(''); setSearchInput(''); setType(''); setYear(''); setMonth(''); setPage(1)
  }

  const hasFilters = search || type || year || month

  // Agrupar stats por tipo
  const statsByType = (stats ?? []).reduce((acc: Record<string, number>, s: any) => {
    acc[s.type] = (acc[s.type] ?? 0) + Number(s._count ?? s.count ?? 1)
    return acc
  }, {})

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/dashboard/lemosbank" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="p-2 rounded-xl bg-gray-100">
          <Archive className="w-6 h-6 text-gray-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Arquivo Morto</h1>
          <p className="text-sm text-gray-500">
            Documentos históricos: contratos, aditivos, financeiros, jurídicos e mais
          </p>
        </div>
        {meta && (
          <span className="ml-auto text-sm text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
            {meta.total?.toLocaleString('pt-BR')} documentos
          </span>
        )}
      </div>

      {/* Stats por tipo */}
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(statsByType)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, 10)
            .map(([t, count]) => {
              const cfg = DOC_TYPES[t] ?? { label: t, color: 'bg-gray-100 text-gray-600' }
              return (
                <button
                  key={t}
                  onClick={() => { setType(type === t ? '' : t); setPage(1) }}
                  className={`p-3 rounded-xl border text-left transition-all hover:shadow-sm ${
                    type === t ? 'border-blue-400 bg-blue-50' : 'border-gray-100 bg-white'
                  }`}
                >
                  <p className="text-lg font-bold text-gray-900">{(count as number).toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{cfg.label}</p>
                </button>
              )
            })}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3">
          {/* Busca */}
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-60">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Buscar por nome do arquivo, cliente..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors"
            >
              Buscar
            </button>
          </form>

          {/* Tipo */}
          <select
            value={type}
            onChange={e => { setType(e.target.value); setPage(1) }}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Todos os tipos</option>
            {Object.entries(DOC_TYPES).map(([v, { label }]) => (
              <option key={v} value={v}>{label}</option>
            ))}
          </select>

          {/* Ano */}
          <select
            value={year}
            onChange={e => { setYear(e.target.value); setPage(1) }}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Todos os anos</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          {/* Mês */}
          <select
            value={month}
            onChange={e => { setMonth(e.target.value); setPage(1) }}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Tabela */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <Archive className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 font-medium">Nenhum documento encontrado</p>
          <p className="text-sm text-gray-400 mt-1">
            {hasFilters ? 'Tente outros filtros' : 'Os documentos aparecerão aqui após o upload do backup'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Arquivo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Cliente</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden xl:table-cell">Período</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden xl:table-cell">Tamanho</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {docs.map((doc: any) => {
                const typeCfg = DOC_TYPES[doc.type] ?? { label: doc.type, color: 'bg-gray-100 text-gray-600' }
                const meta = doc.metadata ?? {}
                return (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {fileIcon(doc.mimeType, doc.name)}
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate max-w-xs" title={doc.name}>
                            {doc.name}
                          </p>
                          {doc.legacyRef && (
                            <p className="text-xs text-gray-400 truncate max-w-xs" title={doc.legacyRef}>
                              <FolderOpen className="w-3 h-3 inline mr-0.5" />
                              {doc.legacyRef}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${typeCfg.color}`}>
                        {typeCfg.label}
                      </span>
                      {doc.category && doc.category !== doc.type && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-32">{doc.category}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {doc.client ? (
                        <Link
                          href={`/dashboard/clientes/${doc.clientId}`}
                          className="flex items-center gap-1.5 text-blue-600 hover:underline"
                        >
                          <User className="w-3.5 h-3.5" />
                          <span className="truncate max-w-40">{doc.client.name}</span>
                        </Link>
                      ) : (
                        <span className="text-gray-300 text-xs">Sem vínculo</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      {(doc.month || doc.year) ? (
                        <div className="flex items-center gap-1 text-gray-600 text-xs">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {doc.month && MONTHS.find(m => m.value === doc.month)?.label?.slice(0, 3)}
                          {doc.month && doc.year && '/'}
                          {doc.year}
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell text-xs text-gray-500">
                      {fmtBytes(doc.fileSize)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {/* Visualizar */}
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Visualizar detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {/* Download */}
                        <a
                          href={`${API_URL}/api/v1/documents/${doc.id}/download`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                          title="Baixar arquivo"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Página {meta.page} de {meta.totalPages} ({meta.total?.toLocaleString('pt-BR')} documentos)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>
            {/* Páginas próximas */}
            {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(meta.totalPages - 4, page - 2)) + i
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    p === page
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {p}
                </button>
              )
            })}
            <button
              onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Próxima
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal de preview */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {fileIcon(previewDoc.mimeType, previewDoc.name)}
                <div>
                  <h3 className="font-bold text-gray-900 break-all">{previewDoc.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{fmtBytes(previewDoc.fileSize)}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">Tipo</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${(DOC_TYPES[previewDoc.type] ?? DOC_TYPES.DOCUMENTO).color}`}>
                  {(DOC_TYPES[previewDoc.type] ?? DOC_TYPES.DOCUMENTO).label}
                </span>
              </div>
              {previewDoc.category && (
                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500">Pasta de origem</span>
                  <span className="text-gray-800 text-right max-w-48 truncate">{previewDoc.category}</span>
                </div>
              )}
              {previewDoc.client && (
                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500">Cliente</span>
                  <Link
                    href={`/dashboard/clientes/${previewDoc.clientId}`}
                    className="text-blue-600 hover:underline"
                    onClick={() => setPreviewDoc(null)}
                  >
                    {previewDoc.client.name}
                  </Link>
                </div>
              )}
              {(previewDoc.month || previewDoc.year) && (
                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500">Período</span>
                  <span className="text-gray-800">
                    {previewDoc.month && MONTHS.find(m => m.value === previewDoc.month)?.label}
                    {previewDoc.month && previewDoc.year && ' / '}
                    {previewDoc.year}
                  </span>
                </div>
              )}
              {previewDoc.legacyRef && (
                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500">Caminho original</span>
                  <span className="text-gray-600 text-xs text-right max-w-48 break-all">{previewDoc.legacyRef}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5">
                <span className="text-gray-500">Importado em</span>
                <span className="text-gray-800">
                  {new Date(previewDoc.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <a
                href={`${API_URL}/api/v1/documents/${previewDoc.id}/download`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Baixar arquivo
              </a>
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

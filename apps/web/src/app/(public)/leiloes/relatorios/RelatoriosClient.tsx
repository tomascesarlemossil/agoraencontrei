'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BarChart3, Search, MapPin, TrendingDown, Home, Clock3, Database, ShieldCheck, AlertTriangle, ExternalLink, Gavel, Download, Printer, Share2, Lightbulb } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

function fmt(v: number | null | undefined): string {
  if (v == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(v))
}

interface NumStats { count: number; min: number; avg: number; median: number; max: number }
interface Report {
  total: number
  truncated?: boolean
  generatedAt?: string
  message?: string
  counts?: { sold: number; occupied: number; byStatus: Record<string, number>; byPropertyType: Record<string, number>; bySource?: Record<string, number> }
  values?: {
    appraisalValue: NumStats | null; minimumBid: NumStats | null; soldValue: NumStats | null
    pricePerM2: NumStats | null; discountPercent: NumStats | null; opportunityScore: NumStats | null
  }
  regional?: {
    pricePerM2Auction: NumStats | null
    pricePerM2Market: NumStats | null
    m2SpreadPercent: number | null
    announcedDiscountMedian: number | null
    netDiscountMedian: number | null
    liquidityPercent: number
    occupiedPercent: number
  }
  topNeighborhoods?: { neighborhood: string; count: number; avgValue: number | null }[]
  dataQuality?: { withAppraisal: number; withMinimumBid: number; withSoldValue: number; withArea: number; withRegistry: number; withDocuments: number; withOccupation: number }
  opportunities?: { slug: string; title: string; city?: string; state?: string; neighborhood?: string; status: string; source: string; coverImage?: string; appraisalValue?: number; minimumBid?: number; discountPercent?: number; opportunityScore?: number; occupation?: string; auctionDate?: string }[]
}

const TYPE_LABEL: Record<string, string> = {
  HOUSE: 'Casas', APARTMENT: 'Apartamentos', LAND: 'Terrenos', COMMERCIAL: 'Comerciais', FARM: 'Rurais',
}

const STATUS_LABEL: Record<string, string> = {
  UPCOMING: 'Próximos', OPEN: 'Abertos', FIRST_ROUND: '1ª praça', SECOND_ROUND: '2ª praça',
  SOLD: 'Arrematados', DESERTED: 'Sem lances', SUSPENDED: 'Suspensos', CLOSED: 'Encerrados', CANCELLED: 'Cancelados',
}
const STATUS_COLORS: Record<string, string> = {
  UPCOMING: '#64748b', OPEN: '#16a34a', FIRST_ROUND: '#2563eb', SECOND_ROUND: '#7c3aed',
  SOLD: '#0f766e', DESERTED: '#d97706', SUSPENDED: '#dc2626', CLOSED: '#475569', CANCELLED: '#94a3b8',
}

function executiveSummary(report: Report, location: string): string[] {
  const sold = report.counts?.sold ?? 0
  const active = ['UPCOMING', 'OPEN', 'FIRST_ROUND', 'SECOND_ROUND'].reduce((sum, status) => sum + (report.counts?.byStatus?.[status] ?? 0), 0)
  const discount = report.values?.discountPercent?.median
  const coverage = report.dataQuality?.withDocuments != null ? Math.round(report.dataQuality.withDocuments / report.total * 100) : null
  return [
    `A amostra de ${location || 'todo o mercado pesquisado'} reúne ${report.total} ${report.total === 1 ? 'leilão' : 'leilões'}, sendo ${active} ${active === 1 ? 'oportunidade' : 'oportunidades'} em situação ativa.`,
    sold > 0 ? `${sold} arremates possuem resultado confirmado; a mediana observada foi ${fmt(report.values?.soldValue?.median)}.` : 'Ainda não há valor de arremate confirmado nesta seleção; os preços exibidos representam ofertas anunciadas.',
    discount != null ? `O desconto anunciado mediano é de ${Math.round(discount)}% sobre a avaliação.` : 'A amostra ainda não possui descontos suficientes para uma leitura estatística.',
    coverage != null ? `${coverage}% dos registros possuem edital ou documento associado, indicador importante para a diligência.` : '',
  ].filter(Boolean)
}

function StatRow({ label, stats, suffix }: { label: string; stats: NumStats | null; suffix?: string }) {
  if (!stats) return null
  const val = (n: number) => (suffix ? `${n}${suffix}` : fmt(n))
  return (
    <div className="grid grid-cols-5 gap-2 py-2 border-b text-sm items-center">
      <div className="col-span-1 text-gray-600">{label}</div>
      <div className="text-center"><div className="text-xs text-gray-400">mín</div><div className="font-medium">{val(stats.min)}</div></div>
      <div className="text-center"><div className="text-xs text-gray-400">médio</div><div className="font-medium">{val(stats.avg)}</div></div>
      <div className="text-center"><div className="text-xs text-gray-400">mediana</div><div className="font-bold text-gray-800">{val(stats.median)}</div></div>
      <div className="text-center"><div className="text-xs text-gray-400">máx</div><div className="font-medium">{val(stats.max)}</div></div>
    </div>
  )
}

export default function RelatoriosClient() {
  const [city, setCity] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [category, setCategory] = useState('')
  const [propertyType, setPropertyType] = useState('')
  const [soldOnly, setSoldOnly] = useState(false)
  const [sinceMonths, setSinceMonths] = useState('12')
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const run = async () => {
    setLoading(true)
    setReport(null)
    setError('')
    const p = new URLSearchParams()
    if (city) p.set('city', city)
    if (neighborhood) p.set('neighborhood', neighborhood)
    if (category) p.set('category', category)
    if (propertyType) p.set('propertyType', propertyType)
    if (soldOnly) p.set('soldOnly', 'true')
    if (sinceMonths) p.set('sinceMonths', sinceMonths)
    try {
      const r = await fetch(`${API_URL}/api/v1/auctions/report?${p.toString()}`)
      if (!r.ok) throw new Error('Não foi possível gerar o relatório agora.')
      setReport(await r.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível gerar o relatório agora.')
    }
    setLoading(false)
  }

  const exportCsv = () => {
    if (!report?.opportunities?.length) return
    const header = ['Imóvel', 'Bairro', 'Cidade', 'UF', 'Fonte', 'Situação', 'Lance mínimo', 'Avaliação', 'Desconto', 'URL']
    const rows = report.opportunities.map((item) => [item.title, item.neighborhood, item.city, item.state, item.source, STATUS_LABEL[item.status] || item.status, item.minimumBid, item.appraisalValue, item.discountPercent, `${window.location.origin}/leiloes/${item.slug}`])
    const csv = [header, ...rows].map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n')
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a'); link.href = url; link.download = `relatorio-leiloes-${city || 'geral'}.csv`; link.click(); URL.revokeObjectURL(url)
  }

  const shareReport = async () => {
    const data = { title: 'Relatório de Leilões | AgoraEncontrei', text: `Relatório com ${report?.total ?? 0} leilões analisados.`, url: window.location.href }
    if (navigator.share) await navigator.share(data).catch(() => undefined)
    else await navigator.clipboard.writeText(window.location.href).catch(() => undefined)
  }

  return (
    <div className="min-h-screen bg-[#f8f6f1]">
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <Link href="/leiloes" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800">
            <ArrowLeft className="w-4 h-4" /> Voltar aos Leilões
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-1">
          <BarChart3 className="w-6 h-6" style={{ color: '#C9A84C' }} /> Relatórios de Leilões
        </h1>
        <p className="text-gray-500 mb-6">Inteligência de mercado para comparar oferta, resultado, desconto e qualidade da amostra.</p>

        {/* Filtros */}
        <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cidade (ex.: Franca)"
              className="px-3 py-2 border rounded-lg text-base" />
            <input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Bairro (ex.: Centro)"
              className="px-3 py-2 border rounded-lg text-base" />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 border rounded-lg text-base bg-white">
              <option value="">Categoria (todas)</option>
              <option value="RESIDENTIAL">Residencial</option>
              <option value="COMMERCIAL">Comercial</option>
            </select>
            <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="px-3 py-2 border rounded-lg text-base bg-white">
              <option value="">Tipo (todos)</option>
              <option value="HOUSE">Casa</option>
              <option value="APARTMENT">Apartamento</option>
              <option value="LAND">Terreno</option>
              <option value="COMMERCIAL">Comercial</option>
            </select>
            <select value={sinceMonths} onChange={(e) => setSinceMonths(e.target.value)} className="px-3 py-2 border rounded-lg text-base bg-white">
              <option value="3">Últimos 3 meses</option><option value="6">Últimos 6 meses</option>
              <option value="12">Últimos 12 meses</option><option value="24">Últimos 24 meses</option><option value="">Todo o histórico</option>
            </select>
          </div>
          <div className="flex items-center justify-between mt-3">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={soldOnly} onChange={(e) => setSoldOnly(e.target.checked)} /> Só arrematados
            </label>
            <button onClick={run} disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-white font-medium disabled:opacity-60"
              style={{ background: '#1B2B5B' }}>
              <Search className="w-4 h-4" /> {loading ? 'Consultando…' : 'Gerar relatório'}
            </button>
          </div>
        </div>

        {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        {report && report.total === 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm text-center text-gray-500">
            {report.message || 'Nenhum leilão encontrado com esses filtros.'}
          </div>
        )}

        {report && report.total > 0 && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
              <div className="flex items-center gap-2 text-amber-950"><Clock3 className="h-4 w-4" /> Período: <b>{sinceMonths ? `últimos ${sinceMonths} meses` : 'todo o histórico'}</b></div>
              <div className="text-amber-800">Gerado em {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(report.generatedAt ? new Date(report.generatedAt) : new Date())}</div>
            </div>

            <div className="flex flex-wrap gap-2 print:hidden">
              <button onClick={exportCsv} disabled={!report.opportunities?.length} className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"><Download className="h-4 w-4" /> Exportar CSV</button>
              <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"><Printer className="h-4 w-4" /> Imprimir / PDF</button>
              <button onClick={shareReport} className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"><Share2 className="h-4 w-4" /> Compartilhar</button>
            </div>

            <section className="rounded-xl border border-[#C9A84C]/30 bg-gradient-to-br from-white to-amber-50 p-6 shadow-sm">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-900"><Lightbulb className="h-5 w-5 text-[#C9A84C]" /> Leitura executiva</h2>
              <div className="grid gap-3 md:grid-cols-2">{executiveSummary(report, [neighborhood, city].filter(Boolean).join(', ')).map((text, index) => <p key={index} className="rounded-lg bg-white/80 p-3 text-sm leading-relaxed text-gray-700">{text}</p>)}</div>
              <p className="mt-3 text-xs text-gray-500">Leitura automática baseada somente nos registros desta amostra. Não substitui análise jurídica, editalícia ou financeira individual.</p>
            </section>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                <div className="text-2xl font-bold text-gray-800">{report.total}</div>
                <div className="text-xs text-gray-500">leilões</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                <div className="text-2xl font-bold text-green-600">{report.counts?.sold ?? 0}</div>
                <div className="text-xs text-gray-500">arremates confirmados</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                <div className="text-2xl font-bold text-gray-800">{report.values?.discountPercent?.median ?? '—'}%</div>
                <div className="text-xs text-gray-500">desconto (mediana)</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                <div className="text-2xl font-bold text-gray-800">{report.values?.pricePerM2 ? fmt(report.values.pricePerM2.median) : '—'}</div>
                <div className="text-xs text-gray-500">preço/m² (mediana)</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                <div className="text-2xl font-bold text-gray-800">{report.counts?.occupied ?? 0}</div>
                <div className="text-xs text-gray-500">ocupados identificados</div>
              </div>
            </div>

            {(report.counts?.sold ?? 0) === 0 && (
              <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
                <AlertTriangle className="h-5 w-5 shrink-0 text-blue-600" />
                <div><b>Nenhum valor de arremate foi confirmado nesta amostra.</b><br />Os valores abaixo representam avaliação e lance mínimo anunciados; não devem ser interpretados como preço efetivo de venda.</div>
              </div>
            )}

            {/* Painel regional (plano §3): leilão x mercado, liquidez, desconto real */}
            {report.regional && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="mb-1 flex items-center gap-2 text-lg font-bold text-gray-800"><TrendingDown className="h-5 w-5 text-[#C9A84C]" /> Leilão x mercado na região</h3>
                <p className="mb-4 text-sm text-gray-500">O desconto anunciado usa a avaliação como base. Aqui comparamos o preço por m² do leilão com o de mercado e mostramos o desconto que sobra depois dos custos.</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                    <div className="text-xs text-gray-500">R$/m² em leilão</div>
                    <div className="text-xl font-bold text-[#143A1F]">{report.regional.pricePerM2Auction ? fmt(report.regional.pricePerM2Auction.median) : '—'}</div>
                    <div className="text-[11px] text-gray-400">mediana pelo lance mínimo</div>
                  </div>
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                    <div className="text-xs text-gray-500">R$/m² de mercado</div>
                    <div className="text-xl font-bold text-gray-700">{report.regional.pricePerM2Market ? fmt(report.regional.pricePerM2Market.median) : '—'}</div>
                    <div className="text-[11px] text-gray-400">mediana pela avaliação</div>
                  </div>
                  <div className="rounded-lg border border-green-100 bg-green-50 p-4">
                    <div className="text-xs text-gray-500">Abaixo do mercado por m²</div>
                    <div className="text-xl font-bold text-green-700">{report.regional.m2SpreadPercent != null ? `${report.regional.m2SpreadPercent}%` : '—'}</div>
                    <div className="text-[11px] text-gray-400">leilão vs mercado</div>
                  </div>
                  <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
                    <div className="text-xs text-gray-500">Desconto após custos</div>
                    <div className="text-xl font-bold text-amber-700">{report.regional.netDiscountMedian != null ? `${Math.round(report.regional.netDiscountMedian)}%` : '—'}</div>
                    <div className="text-[11px] text-gray-400">anunciado: {report.regional.announcedDiscountMedian != null ? `${Math.round(report.regional.announcedDiscountMedian)}%` : '—'}</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-gray-100 p-3">
                    <div className="mb-1 flex justify-between text-sm"><span className="text-gray-600">Liquidez (arrematados)</span><b>{report.regional.liquidityPercent}%</b></div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-teal-500" style={{ width: `${report.regional.liquidityPercent}%` }} /></div>
                  </div>
                  <div className="rounded-lg border border-gray-100 p-3">
                    <div className="mb-1 flex justify-between text-sm"><span className="text-gray-600">Imóveis ocupados</span><b>{report.regional.occupiedPercent}%</b></div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-red-400" style={{ width: `${report.regional.occupiedPercent}%` }} /></div>
                  </div>
                </div>
                <p className="mt-3 text-[11px] leading-4 text-gray-400">Estimativas: o R$/m² de mercado usa a avaliação como proxy (pode estar acima do praticado) e o desconto após custos aplica uma carga padrão de ~18% sobre o lance. Não substitui a análise de comparáveis reais e do edital.</p>
              </div>
            )}

            {report.counts?.byStatus && (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800"><BarChart3 className="h-5 w-5 text-[#C9A84C]" /> Situação dos leilões</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={Object.entries(report.counts.byStatus).map(([status, value]) => ({ status, name: STATUS_LABEL[status] || status, value }))} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>{Object.keys(report.counts.byStatus).map((status) => <Cell key={status} fill={STATUS_COLORS[status] || '#94a3b8'} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3 text-xs">{Object.entries(report.counts.byStatus).map(([status, value]) => <span key={status} className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLORS[status] || '#94a3b8' }} />{STATUS_LABEL[status] || status}: <b>{value}</b></span>)}</div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800"><ShieldCheck className="h-5 w-5 text-[#C9A84C]" /> Qualidade da amostra</h3>
                  <div className="space-y-4">{[
                    ['Com avaliação', report.dataQuality?.withAppraisal ?? report.values?.appraisalValue?.count ?? 0], ['Com lance mínimo', report.dataQuality?.withMinimumBid ?? report.values?.minimumBid?.count ?? 0],
                    ['Com valor de arremate', report.dataQuality?.withSoldValue ?? report.values?.soldValue?.count ?? 0], ['Com área informada', report.dataQuality?.withArea ?? report.values?.pricePerM2?.count ?? 0],
                    ['Com matrícula', report.dataQuality?.withRegistry ?? 0], ['Com documentos', report.dataQuality?.withDocuments ?? 0],
                  ].map(([label, count]) => { const pct = Math.round(Number(count) / report.total * 100); return <div key={String(label)}><div className="mb-1 flex justify-between text-sm"><span>{label}</span><b>{count} de {report.total} · {pct}%</b></div><div className="h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-[#C9A84C]" style={{ width: `${pct}%` }} /></div></div> })}</div>
                  {report.truncated && <p className="mt-4 text-xs text-amber-700"><Database className="mr-1 inline h-3.5 w-3.5" />Amostra limitada aos primeiros 5.000 registros.</p>}
                </div>
              </div>
            )}

            {report.opportunities && report.opportunities.length > 0 && (
              <section className="rounded-xl bg-white p-6 shadow-sm">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                  <div><h3 className="flex items-center gap-2 text-lg font-bold text-gray-800"><Gavel className="h-5 w-5 text-[#C9A84C]" /> Oportunidades ativas em destaque</h3><p className="mt-1 text-sm text-gray-500">Ordenadas pelo score de oportunidade e pelo desconto anunciado.</p></div>
                  <span className="text-xs text-gray-400">Confirme edital, ocupação e custos antes de decidir</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] text-left text-sm">
                    <thead><tr className="border-b text-xs uppercase tracking-wide text-gray-400"><th className="pb-3">Imóvel</th><th className="pb-3">Localização</th><th className="pb-3 text-right">Lance mínimo</th><th className="pb-3 text-right">Avaliação</th><th className="pb-3 text-center">Desconto</th><th className="pb-3 text-center">Situação</th><th className="pb-3" /></tr></thead>
                    <tbody>{report.opportunities.map((item) => <tr key={item.slug} className="border-b last:border-0 hover:bg-amber-50/40">
                      <td className="max-w-[260px] py-4 pr-4"><div className="line-clamp-2 font-semibold text-gray-800">{item.title}</div><div className="mt-1 text-xs text-gray-400">{item.source}</div></td>
                      <td className="py-4 pr-4 text-gray-600">{[item.neighborhood, item.city, item.state].filter(Boolean).join(' · ') || 'Não informada'}</td>
                      <td className="py-4 text-right font-semibold">{fmt(item.minimumBid)}</td><td className="py-4 text-right text-gray-600">{fmt(item.appraisalValue)}</td>
                      <td className="py-4 text-center"><span className="rounded-full bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700">{item.discountPercent != null ? `${Math.round(item.discountPercent)}%` : '—'}</span></td>
                      <td className="py-4 text-center text-xs text-gray-600">{STATUS_LABEL[item.status] || item.status}</td>
                      <td className="py-4 pl-4"><Link href={`/leiloes/${item.slug}`} className="inline-flex items-center gap-1 whitespace-nowrap font-semibold text-[#1B2B5B] hover:underline">Ver dossiê <ExternalLink className="h-3.5 w-3.5" /></Link></td>
                    </tr>)}</tbody>
                  </table>
                </div>
              </section>
            )}

            {report.counts?.bySource && Object.keys(report.counts.bySource).length > 0 && (
              <section className="rounded-xl bg-white p-6 shadow-sm"><h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-800"><Database className="h-5 w-5 text-[#C9A84C]" /> Fontes presentes na amostra</h3><div className="flex flex-wrap gap-2">{Object.entries(report.counts.bySource).map(([source, count]) => <span key={source} className="rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-600">{source}: <b className="text-gray-900">{count}</b></span>)}</div></section>
            )}

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <TrendingDown className="w-5 h-5" style={{ color: '#C9A84C' }} /> Valores
              </h3>
              <StatRow label="Arremate" stats={report.values?.soldValue ?? null} />
              <StatRow label="Lance mínimo" stats={report.values?.minimumBid ?? null} />
              <StatRow label="Avaliação" stats={report.values?.appraisalValue ?? null} />
              <StatRow label="Desconto" stats={report.values?.discountPercent ?? null} suffix="%" />
            </div>

            {report.counts?.byPropertyType && Object.keys(report.counts.byPropertyType).length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Home className="w-5 h-5" style={{ color: '#C9A84C' }} /> Por tipo
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(report.counts.byPropertyType).map(([t, n]) => (
                    <span key={t} className="px-3 py-1.5 bg-gray-50 rounded-lg text-sm">
                      {TYPE_LABEL[t] || t}: <b>{n}</b>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {report.topNeighborhoods && report.topNeighborhoods.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5" style={{ color: '#C9A84C' }} /> Por bairro
                </h3>
                <div className="mb-6 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.topNeighborhoods.slice(0, 8)} layout="vertical" margin={{ left: 8, right: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="neighborhood" width={145} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value) => [`${value} leilões`, 'Quantidade']} />
                      <Bar dataKey="count" fill="#C9A84C" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {report.topNeighborhoods.map((n, i) => (
                    <div key={i} className="flex items-center justify-between text-sm border-b last:border-0 py-1.5">
                      <span className="text-gray-700">{n.neighborhood}</span>
                      <span className="text-gray-500">{n.count} · valor anunciado médio <b className="text-gray-800">{fmt(n.avgValue)}</b>{n.count < 3 && <em className="ml-2 text-xs text-amber-700">amostra pequena</em>}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

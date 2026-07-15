'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MapPin, Clock, Star, Calculator, Bell, ArrowLeft, ExternalLink, FileText, DollarSign, Home, Building, AlertTriangle, CheckCircle, ChevronRight, Share2, TrendingUp, Shield, BarChart3 } from 'lucide-react'
import AuctionArchivePanel from '@/components/public/AuctionArchivePanel'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

function formatCurrency(value: number | null | undefined): string {
  if (!value) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(value))
}

function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function sourceLabel(source: string): string {
  const labels: Record<string, string> = {
    CAIXA: 'Caixa Econômica', BANCO_DO_BRASIL: 'Banco do Brasil',
    BRADESCO: 'Bradesco', ITAU: 'Itaú', SANTANDER: 'Santander',
    LEILOEIRO: 'Leiloeiro', JUDICIAL: 'Judicial', EXTRAJUDICIAL: 'Extrajudicial',
  }
  return labels[source] || source
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    UPCOMING: 'Em breve', OPEN: 'Aberto para Lances',
    FIRST_ROUND: '1ª Praça', SECOND_ROUND: '2ª Praça',
    SOLD: 'Arrematado', DESERTED: 'Deserto',
    CLOSED: 'Encerrado', SUSPENDED: 'Suspenso', CANCELLED: 'Cancelado',
  }
  return labels[status] || status
}

function modalityLabel(modality: string): string {
  const labels: Record<string, string> = {
    ONLINE: 'Online', PRESENTIAL: 'Presencial', HYBRID: 'Híbrido',
    DIRECT_SALE: 'Venda direta', OPEN_BID: 'Licitação aberta',
  }
  return labels[modality] || modality
}

const VERDICT_UI: Record<string, { label: string; cls: string; bar: string }> = {
  STRONG: { label: 'Oportunidade forte', cls: 'bg-green-50 text-green-800 border-green-200', bar: 'bg-green-500' },
  MODERATE: { label: 'Oportunidade moderada', cls: 'bg-yellow-50 text-yellow-800 border-yellow-200', bar: 'bg-yellow-500' },
  WEAK: { label: 'Margem apertada', cls: 'bg-orange-50 text-orange-800 border-orange-200', bar: 'bg-orange-500' },
  NEGATIVE: { label: 'Sem margem no lance atual', cls: 'bg-red-50 text-red-800 border-red-200', bar: 'bg-red-500' },
  INSUFFICIENT_DATA: { label: 'Dados insuficientes', cls: 'bg-gray-50 text-gray-700 border-gray-200', bar: 'bg-gray-400' },
}

function RealDiscountPanel({ rd }: { rd: any }) {
  const v = VERDICT_UI[rd.verdict] || VERDICT_UI.INSUFFICIENT_DATA
  const fmt = (n: number | null | undefined) => formatCurrency(n)
  const insufficient = rd.verdict === 'INSUFFICIENT_DATA' || !rd.marketValue

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-[#C9A84C]">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#C9A84C]" />
          <h2 className="text-lg font-bold text-gray-800">Desconto Real AE — vale a pena?</h2>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${v.cls}`}>{v.label}</span>
      </div>

      {insufficient ? (
        <p className="text-sm text-gray-500">
          Ainda não há dados suficientes (lance mínimo ou referência de mercado) para calcular a vantagem líquida real deste imóvel.
        </p>
      ) : (
        <>
          {/* Números-chave */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-[11px] text-gray-500">Lance mínimo</p>
              <p className="text-base font-bold text-gray-800">{fmt(rd.minimumBid)}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-[11px] text-gray-500">Investimento total</p>
              <p className="text-base font-bold text-gray-800">{fmt(rd.totalInvestment)}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-[11px] text-gray-500">Valor de mercado (conservador)</p>
              <p className="text-base font-bold text-gray-800">{fmt(rd.marketValue?.conservative)}</p>
            </div>
            <div className="rounded-lg bg-[#143A1F]/5 p-3">
              <p className="text-[11px] text-gray-500">Margem líquida</p>
              <p className={`text-base font-bold ${rd.netMargin >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                {fmt(rd.netMargin)} {rd.netMarginPercent != null && <span className="text-xs">({rd.netMarginPercent}%)</span>}
              </p>
            </div>
          </div>

          {/* Desconto anunciado x real */}
          <div className="flex flex-wrap gap-4 mb-4 text-sm">
            {rd.announcedDiscountPercent != null && (
              <span className="text-gray-500">Desconto anunciado: <b className="text-gray-700">{rd.announcedDiscountPercent}%</b></span>
            )}
            {rd.realDiscountPercent != null && (
              <span className="text-gray-500">Desconto real AE: <b className="text-[#143A1F]">{rd.realDiscountPercent}%</b></span>
            )}
            {rd.maxRecommendedBid != null && (
              <span className="text-gray-500">Lance máx. p/ {rd.targetReturnPercent}%: <b className="text-[#143A1F]">{fmt(rd.maxRecommendedBid)}</b></span>
            )}
          </div>

          {/* Procedência do valor de mercado (transparência) */}
          {rd.marketValue && (
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 mb-4">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-xs font-semibold text-gray-600">Origem do valor de mercado: {rd.marketValue.originLabel}</p>
                <span className="text-[11px] text-gray-500">confiança {rd.marketValue.confidence}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden mb-2">
                <div className={`h-full ${v.bar}`} style={{ width: `${rd.marketValue.confidence}%` }} />
              </div>
              <p className="text-[11px] leading-4 text-gray-500">{rd.marketValue.note}</p>
            </div>
          )}

          {/* Custos considerados */}
          {rd.costs && (
            <details className="text-sm">
              <summary className="cursor-pointer text-xs font-semibold text-gray-600 mb-2">Ver custos de arrematação considerados</summary>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 text-xs text-gray-600">
                <span>Comissão leiloeiro: <b>{fmt(rd.costs.auctioneerCommission)}</b></span>
                <span>ITBI: <b>{fmt(rd.costs.itbi)}</b></span>
                <span>Registro: <b>{fmt(rd.costs.registry)}</b></span>
                <span>Escritura: <b>{fmt(rd.costs.notary)}</b></span>
                <span>Advogado: <b>{fmt(rd.costs.lawyer)}</b></span>
                {rd.costs.eviction > 0 && <span>Desocupação: <b>{fmt(rd.costs.eviction)}</b></span>}
                <span>Reforma: <b>{fmt(rd.costs.reform)}</b></span>
                <span>Margem segurança: <b>{fmt(rd.costs.safetyMargin)}</b></span>
              </div>
            </details>
          )}

          {/* Premissas — evita "lucro garantido" */}
          {rd.assumptions?.length > 0 && (
            <p className="mt-3 text-[11px] leading-4 text-gray-400">
              Estimativa com premissas conservadoras: {rd.assumptions.join(' ')} Não substitui a análise do edital, da matrícula e uma visita técnica.
            </p>
          )}
        </>
      )}
    </div>
  )
}

export default function LeilaoDetailClient({ auction, initialAnalysis = null }: { auction: any; initialAnalysis?: any }) {
  const [analysis, setAnalysis] = useState<any>(initialAnalysis)

  useEffect(() => {
    if (initialAnalysis) return
    const controller = new AbortController()
    fetch(`${API_URL}/api/v1/auctions/${auction.slug}/analysis`, { signal: controller.signal })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setAnalysis(data) })
      .catch(() => {})
    return () => controller.abort()
  }, [auction.slug, initialAnalysis])

  const discount = auction.discountPercent || (
    auction.appraisalValue && auction.minimumBid
      ? ((Number(auction.appraisalValue) - Number(auction.minimumBid)) / Number(auction.appraisalValue) * 100).toFixed(1)
      : null
  )

  const officialDocuments = [
    ...(auction.documents || []).map((doc: any) => ({
      key: doc.id, type: doc.type, url: doc.s3Url || doc.sourceUrl,
      archived: Boolean(doc.s3Url),
    })),
    ...(auction.documentsUrls || []).map((url: string, index: number) => ({
      key: `source-${index}`, type: /matricula/i.test(url) ? 'MATRICULA' : 'DOCUMENTO', url, archived: false,
    })),
  ].filter((doc, index, all) => doc.url && all.findIndex(item => item.url === doc.url) === index)

  return (
    <div className="min-h-screen bg-[#f8f6f1]">
      {/* Top Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/leiloes" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800">
            <ArrowLeft className="w-4 h-4" /> Voltar aos Leilões
          </Link>
          <div className="flex items-center gap-3">
            {auction.sourceUrl && (
              <a href={auction.sourceUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                <ExternalLink className="w-3.5 h-3.5" /> Ver Original
              </a>
            )}
            <button
              onClick={() => navigator.share?.({ title: auction.title, url: window.location.href }).catch(() => {})}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800">
              <Share2 className="w-3.5 h-3.5" /> Compartilhar
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
              <div className="relative h-[400px] bg-gray-100">
                {/* Foto real quando existe; senão, o banner padrão de leilão
                    (imagem ilustrativa). onError cai no mesmo banner se a URL
                    da Caixa/leiloeiro quebrar. */}
                <img
                  src={auction.coverImage || '/leilao-cover-default.jpg'}
                  alt={auction.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement
                    if (!img.dataset.fallback) {
                      img.dataset.fallback = '1'
                      img.src = '/leilao-cover-default.jpg'
                    }
                  }}
                />
                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-white shadow">
                    {sourceLabel(auction.source)}
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-500 text-white">
                    {statusLabel(auction.status)}
                  </span>
                </div>
                {discount && Number(discount) > 0 && (
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-bold bg-red-500 text-white">
                    -{discount}% de desconto
                  </div>
                )}
                {/* Procedência da imagem — transparência: foto do leiloeiro x
                    fachada aproximada via Street View x banner ilustrativo. */}
                {auction.imageSource && (
                  <div className="absolute bottom-4 left-4 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-black/60 text-white backdrop-blur">
                    {auction.imageSource === 'AUCTIONEER'
                      ? '📷 Foto do leiloeiro'
                      : auction.imageSource === 'STREETVIEW'
                        ? '🗺️ Fachada (Street View) — aproximada'
                        : 'Imagem ilustrativa'}
                  </div>
                )}
              </div>

              {/* Extra images */}
              {auction.images?.length > 0 && (
                <div className="flex gap-1 p-2 overflow-x-auto">
                  {auction.images.slice(0, 6).map((img: string, i: number) => (
                    <img key={img} src={img} alt={`Foto ${i + 1}`} className="h-20 w-28 object-cover rounded cursor-pointer hover:opacity-80" />
                  ))}
                </div>
              )}

              {/* Fachada via Street View — mostra quando temos a fachada e ela
                  não é a própria capa (ex.: capa é foto do leiloeiro). Dá ao
                  usuário a vista de rua do endereço informado no leilão. */}
              {auction.streetViewUrl && auction.streetViewUrl !== auction.coverImage && (
                <div className="p-2 border-t border-gray-100">
                  <p className="px-1 pb-1 text-xs font-semibold text-gray-500">Fachada aproximada (Google Street View)</p>
                  <img
                    src={auction.streetViewUrl}
                    alt={`Fachada aproximada de ${auction.title}`}
                    loading="lazy"
                    className="h-40 w-full object-cover rounded-lg"
                  />
                </div>
              )}
            </div>

            {/* Desconto Real AE — vale a pena? (vantagem líquida real) */}
            {auction.realDiscount && <RealDiscountPanel rd={auction.realDiscount} />}

            {/* Title & Location */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h1 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                {auction.title}
              </h1>
              <div className="flex items-center gap-2 text-gray-500 mb-4">
                <MapPin className="w-4 h-4" />
                <span>{[auction.street, auction.neighborhood, auction.city, auction.state].filter(Boolean).join(', ')}</span>
              </div>

              {/* Characteristics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y">
                {auction.totalArea && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-800">{auction.totalArea}m²</div>
                    <div className="text-xs text-gray-500">Área Total</div>
                  </div>
                )}
                {auction.bedrooms > 0 && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-800">{auction.bedrooms}</div>
                    <div className="text-xs text-gray-500">Quartos</div>
                  </div>
                )}
                {auction.bathrooms > 0 && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-800">{auction.bathrooms}</div>
                    <div className="text-xs text-gray-500">Banheiros</div>
                  </div>
                )}
                {auction.parkingSpaces > 0 && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-800">{auction.parkingSpaces}</div>
                    <div className="text-xs text-gray-500">Vagas</div>
                  </div>
                )}
              </div>

              {/* Description */}
              {auction.description && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Descrição</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{auction.description}</p>
                </div>
              )}
            </div>

            {/* Legal Details */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" style={{ color: '#C9A84C' }} /> Informações Jurídicas
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {auction.processNumber && (
                  <div><span className="text-gray-500">Processo:</span> <span className="font-medium">{auction.processNumber}</span></div>
                )}
                {auction.court && (
                  <div><span className="text-gray-500">Vara/Foro:</span> <span className="font-medium">{auction.court}</span></div>
                )}
                {auction.registryNumber && (
                  <div><span className="text-gray-500">Matrícula:</span> <span className="font-medium">{auction.registryNumber}</span></div>
                )}
                {auction.registryOffice && (
                  <div><span className="text-gray-500">Cartório:</span> <span className="font-medium">{auction.registryOffice}</span></div>
                )}
                {auction.debtorName && (
                  <div><span className="text-gray-500">Devedor:</span> <span className="font-medium">{auction.debtorName}</span></div>
                )}
                {auction.creditorName && (
                  <div><span className="text-gray-500">Credor:</span> <span className="font-medium">{auction.creditorName}</span></div>
                )}
                <div>
                  <span className="text-gray-500">Ocupação:</span>{' '}
                  <span className={`font-medium ${auction.occupation === 'DESOCUPADO' ? 'text-green-600' : auction.occupation === 'OCUPADO' ? 'text-red-600' : 'text-gray-500'}`}>
                    {auction.occupation || 'Não informado'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Dívidas:</span>{' '}
                  <span className={`font-medium ${auction.hasDebts ? 'text-red-600' : 'text-green-600'}`}>
                    {auction.hasDebts === true ? 'Sim' : auction.hasDebts === false ? 'Não' : 'Não informado'}
                  </span>
                </div>
              </div>

              {auction.editalUrl && (
                <a href={auction.editalUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
                  <FileText className="w-4 h-4" /> Baixar Edital
                </a>
              )}

              {officialDocuments.length > 0 && (
                <div className="mt-5 border-t pt-4">
                  <h4 className="mb-3 text-sm font-semibold text-gray-700">Documentos oficiais encontrados</h4>
                  <div className="flex flex-wrap gap-2">
                    {officialDocuments.map(doc => (
                      <a key={doc.key} href={doc.url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100">
                        <FileText className="h-4 w-4" />
                        {doc.type === 'MATRICULA' ? 'Ver matrícula' : doc.type === 'EDITAL' ? 'Ver edital' : 'Ver documento'}
                        {doc.archived ? <span className="text-xs font-normal text-green-700">arquivado</span> : null}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Arquivo histórico: documentos + histórico de preço/status */}
            <AuctionArchivePanel slug={auction.slug} />

            {/* Market Comparison */}
            {analysis?.marketComparison?.similarProperties?.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" style={{ color: '#C9A84C' }} /> Comparação com o Mercado
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-500">Preço/m² Leilão</div>
                    <div className="text-lg font-bold text-green-600">
                      {analysis.marketComparison.auctionPricePerM2
                        ? formatCurrency(analysis.marketComparison.auctionPricePerM2)
                        : '—'}
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-500">Preço/m² Mercado</div>
                    <div className="text-lg font-bold text-blue-600">
                      {analysis.marketComparison.averagePricePerM2
                        ? formatCurrency(analysis.marketComparison.averagePricePerM2)
                        : '—'}
                    </div>
                  </div>
                </div>
                <h4 className="text-sm font-semibold text-gray-600 mb-2">Imóveis similares no mercado convencional:</h4>
                <div className="space-y-2">
                  {analysis.marketComparison.similarProperties.map((p: any) => (
                    <Link key={p.id} href={`/imoveis/${p.slug}`} className="flex justify-between items-center text-sm border-b pb-2 hover:text-[#143A1F]">
                      <div>
                        <div className="font-medium text-gray-700">{p.title}</div>
                        <div className="text-xs text-gray-400">
                          {[p.neighborhood, p.bedrooms ? `${p.bedrooms} quartos` : null, p.totalArea ? `${p.totalArea}m²` : null].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                      <div className="font-bold text-gray-800">{formatCurrency(Number(p.price))}</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {auction.relatedAuctions?.length > 0 && (
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h3 className="mb-1 flex items-center gap-2 text-lg font-bold text-gray-800">
                  <Home className="h-5 w-5 text-[#C9A84C]" /> Leilões semelhantes na região
                </h3>
                <p className="mb-4 text-sm text-gray-500">Compare desconto, lance mínimo e localização antes de decidir.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {auction.relatedAuctions.map((item: any) => (
                    <Link key={item.id} href={`/leiloes/${item.slug}`} className="rounded-xl border p-4 transition hover:border-[#C9A84C] hover:shadow-sm">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase text-[#143A1F]">{sourceLabel(item.source)}</span>
                        {item.discountPercent ? <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-bold text-red-600">-{Number(item.discountPercent).toFixed(0)}%</span> : null}
                      </div>
                      <h4 className="line-clamp-2 text-sm font-semibold text-gray-800">{item.title}</h4>
                      <p className="mt-2 text-xs text-gray-500">{item.neighborhood || item.city}, {item.state}</p>
                      <p className="mt-3 text-base font-bold text-[#143A1F]">{formatCurrency(Number(item.minimumBid))}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Price Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-20">
              {/* Dates */}
              <div className="space-y-2 mb-4">
                {auction.firstRoundDate && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 1ª Praça</span>
                    <span className="font-medium">{formatDate(auction.firstRoundDate)}</span>
                  </div>
                )}
                {auction.secondRoundDate && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 2ª Praça</span>
                    <span className="font-medium">{formatDate(auction.secondRoundDate)}</span>
                  </div>
                )}
                {auction.auctionDate && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Data do Leilão</span>
                    <span className="font-semibold">{formatDate(auction.auctionDate)}</span>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 space-y-3">
                {auction.appraisalValue && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Avaliação</span>
                    <span className="font-medium line-through text-gray-400">{formatCurrency(Number(auction.appraisalValue))}</span>
                  </div>
                )}
                {auction.firstRoundBid && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Lance 1ª Praça</span>
                    <span className="font-medium">{formatCurrency(Number(auction.firstRoundBid))}</span>
                  </div>
                )}
                {auction.secondRoundBid && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Lance 2ª Praça</span>
                    <span className="font-medium">{formatCurrency(Number(auction.secondRoundBid))}</span>
                  </div>
                )}
                <div className="flex justify-between items-end border-t pt-3">
                  <span className="text-gray-700 font-medium">Lance Mínimo</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold" style={{ color: '#143A1F' }}>
                      {formatCurrency(Number(auction.minimumBid))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Score */}
              {auction.opportunityScore && (
                <div className="mt-4 p-3 rounded-lg bg-gray-50 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500">Score de Oportunidade</div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-lg font-bold">{auction.opportunityScore}/100</span>
                    </div>
                  </div>
                  {auction.estimatedROI && (
                    <div className="text-right">
                      <div className="text-xs text-gray-500">ROI Estimado</div>
                      <div className="text-lg font-bold text-green-600">+{Number(auction.estimatedROI).toFixed(0)}%</div>
                    </div>
                  )}
                </div>
              )}

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mt-4">
                {auction.financingAvailable && (
                  <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Aceita Financiamento
                  </span>
                )}
                {auction.fgtsAllowed && (
                  <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Aceita FGTS
                  </span>
                )}
              </div>

              {/* CTA */}
              <div className="mt-6 space-y-2">
                <a href={`https://wa.me/5516981010004?text=Olá! Vi o leilão "${auction.title}" no AgoraEncontrei e gostaria de mais informações.`}
                  target="_blank" rel="noopener noreferrer"
                  className="block w-full px-4 py-3 text-center text-white rounded-lg font-semibold"
                  style={{ backgroundColor: '#25D366' }}>
                  Falar com Especialista
                </a>
                {auction.sourceUrl && (
                  <a href={auction.sourceUrl} target="_blank" rel="noopener noreferrer"
                    className="block w-full px-4 py-3 text-center rounded-lg font-semibold border-2"
                    style={{ borderColor: '#143A1F', color: '#143A1F' }}>
                    Ver no Site do Leiloeiro
                  </a>
                )}
              </div>

              {/* Financial Analysis */}
              {analysis?.financialAnalysis && (
                <div className="mt-4 border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" style={{ color: '#C9A84C' }} /> Análise Financeira
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Investimento Total</span>
                      <span className="font-semibold">{formatCurrency(analysis.financialAnalysis.totalInvestment)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Lucro Potencial</span>
                      <span className={`font-semibold ${analysis.financialAnalysis.potentialProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(analysis.financialAnalysis.potentialProfit)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">ROI</span>
                      <span className={`font-semibold ${analysis.financialAnalysis.roiPercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {analysis.financialAnalysis.roiPercent}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Lance Máx. Recomendado</span>
                      <span className="font-semibold" style={{ color: '#C9A84C' }}>
                        {formatCurrency(analysis.financialAnalysis.maxRecommendedBid)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Auctioneer Info */}
              {auction.auctioneerName && (
                <div className="mt-4 border-t pt-4 text-sm text-gray-500">
                  <div><strong>Leiloeiro:</strong> {auction.auctioneerName}</div>
                  {auction.bankName && <div><strong>Banco:</strong> {auction.bankName}</div>}
                  {auction.modality && <div><strong>Modalidade:</strong> {modalityLabel(auction.modality)}</div>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

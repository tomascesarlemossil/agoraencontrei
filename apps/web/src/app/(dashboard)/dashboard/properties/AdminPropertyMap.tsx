'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, MapPin, AlertCircle, RefreshCw } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui/button'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:   '#22c55e',
  INACTIVE: '#94a3b8',
  SOLD:     '#ef4444',
  RENTED:   '#f59e0b',
  PENDING:  '#3b82f6',
  DRAFT:    '#a855f7',
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE:   'Ativo',
  INACTIVE: 'Inativo',
  SOLD:     'Vendido',
  RENTED:   'Alugado',
  PENDING:  'Pendente',
  DRAFT:    'Rascunho',
}

const TYPE_LABELS: Record<string, string> = {
  HOUSE:     'Casa',
  APARTMENT: 'Apartamento',
  LAND:      'Terreno',
  FARM:      'Chácara/Sítio',
  RANCH:     'Fazenda',
  WAREHOUSE: 'Galpão',
  OFFICE:    'Escritório',
  STORE:     'Loja',
  STUDIO:    'Studio',
  PENTHOUSE: 'Cobertura',
  CONDO:     'Condomínio',
  KITNET:    'Kitnet',
}

const PURPOSE_LABELS: Record<string, string> = {
  SALE:   'Venda',
  RENT:   'Aluguel',
  BOTH:   'Venda/Aluguel',
  SEASON: 'Temporada',
}

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

const FAKE_IMAGE_PATTERNS = [
  'send.png', 'telefone.png', 'logotopo.png', 'foto_vazio.png',
  'foto-corretor.png', 'logo_uso.png', 'logo_rodape.png',
  '/images/logo', '/images/banner', 'whatsapp',
]

interface MapPin {
  id: string
  reference: string | null
  title: string
  slug: string
  type: string
  purpose: string
  status: string
  price: number | null
  priceRent: number | null
  neighborhood: string | null
  city: string | null
  state: string | null
  street: string | null
  number: string | null
  latitude: number | null
  longitude: number | null
  coverImage: string | null
  bedrooms: number | null
  bathrooms: number | null
  totalArea: number | null
  isFeatured: boolean
}

interface AdminPropertyMapProps {
  statusFilter?: string
  purposeFilter?: string
  searchFilter?: string
}

// Fetch ALL properties with pagination, return only those with lat/lng
async function fetchAllPins(accessToken: string, statusFilter?: string, purposeFilter?: string, searchFilter?: string): Promise<MapPin[]> {
  const allPins: MapPin[] = []
  let page = 1
  const limit = 200
  let totalPages = 1

  while (page <= totalPages) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(statusFilter && statusFilter !== 'ALL' ? { status: statusFilter } : {}),
      ...(purposeFilter && purposeFilter !== 'ALL' ? { purpose: purposeFilter } : {}),
      ...(searchFilter ? { search: searchFilter } : {}),
    })

    const res = await fetch(`${API_URL}/api/v1/properties?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!res.ok) throw new Error(`API error: ${res.status}`)

    const data = await res.json()
    const items: MapPin[] = data.data ?? []

    // Only keep properties with valid coordinates
    items.forEach(p => {
      if (p.latitude && p.longitude && !isNaN(Number(p.latitude)) && !isNaN(Number(p.longitude))) {
        allPins.push(p)
      }
    })

    totalPages = data.meta?.totalPages ?? 1
    page++

    // Safety break to avoid infinite loops
    if (page > 50) break
  }

  return allPins
}

function buildMarkers(L: any, clusterGroup: any, pins: MapPin[], router: any) {
  if (typeof window !== 'undefined') {
    (window as any).__adminMapNav = (id: string) => {
      router.push(`/dashboard/properties/${id}`)
    }
  }

  pins.forEach(p => {
    const statusColor = STATUS_COLORS[p.status?.toUpperCase()] ?? '#94a3b8'
    const lat = Number(p.latitude)
    const lng = Number(p.longitude)
    if (isNaN(lat) || isNaN(lng)) return

    const icon = L.divIcon({
      html: `<div style="width:26px;height:26px;background:${statusColor};border:2.5px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.35);${p.isFeatured ? 'outline:2px solid #C9A84C;outline-offset:1px;' : ''}"></div>`,
      className: '',
      iconSize: [26, 26],
      iconAnchor: [13, 26],
      popupAnchor: [0, -28],
    })

    const hasImage = p.coverImage && !FAKE_IMAGE_PATTERNS.some(pat => p.coverImage!.includes(pat))
    const priceStr = (p.purpose === 'RENT' || p.purpose === 'SEASON')
      ? (p.priceRent ? fmt.format(Number(p.priceRent)) + '/mês' : 'Consulte')
      : (p.price ? fmt.format(Number(p.price)) : (p.priceRent ? fmt.format(Number(p.priceRent)) + '/mês' : 'Consulte'))

    const address = [p.street, p.number, p.neighborhood, p.city].filter(Boolean).join(', ')
    const imgHtml = hasImage ? `<img src="${p.coverImage}" alt="" style="width:100%;height:110px;object-fit:cover;border-radius:6px 6px 0 0;display:block;" />` : ''
    const refHtml = p.reference ? `<div style="font-size:10px;color:#64748b;margin-bottom:2px;font-family:monospace;">Ref: ${p.reference}</div>` : ''
    const featHtml = p.isFeatured ? '<span style="background:#fef3c7;color:#b45309;font-size:10px;font-weight:600;padding:2px 8px;border-radius:999px;">⭐ Destaque</span>' : ''
    const addrHtml = address ? `<div style="font-size:11px;color:#64748b;margin-bottom:6px;">📍 ${address}</div>` : ''
    const bedsHtml = p.bedrooms ? `<span>🛏 ${p.bedrooms}</span>` : ''
    const bathHtml = p.bathrooms ? `<span>🚿 ${p.bathrooms}</span>` : ''
    const areaHtml = p.totalArea ? `<span>📐 ${p.totalArea}m²</span>` : ''

    const popupHtml = `
      <div style="width:240px;font-family:system-ui,sans-serif;border-radius:8px;overflow:hidden;">
        ${imgHtml}
        <div style="padding:10px 12px;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;flex-wrap:wrap;">
            <span style="background:${statusColor}22;color:${statusColor};font-size:10px;font-weight:600;padding:2px 8px;border-radius:999px;">${STATUS_LABELS[p.status?.toUpperCase()] ?? p.status}</span>
            ${featHtml}
          </div>
          ${refHtml}
          <div style="font-size:12px;font-weight:600;color:#1e293b;line-height:1.3;margin-bottom:4px;">${p.title}</div>
          <div style="font-size:11px;color:#64748b;margin-bottom:6px;">${TYPE_LABELS[p.type?.toUpperCase()] ?? p.type} · ${PURPOSE_LABELS[p.purpose?.toUpperCase()] ?? p.purpose}</div>
          ${addrHtml}
          <div style="display:flex;gap:8px;font-size:11px;color:#64748b;margin-bottom:8px;flex-wrap:wrap;">${bedsHtml}${bathHtml}${areaHtml}</div>
          <div style="font-size:14px;font-weight:700;color:#1B2B5B;margin-bottom:8px;">${priceStr}</div>
          <button onclick="window.__adminMapNav('${p.id}')" style="width:100%;background:linear-gradient(135deg,#1B2B5B,#2d4a8a);color:white;text-align:center;padding:8px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;border:none;">Abrir Cadastro →</button>
        </div>
      </div>`

    const marker = L.marker([lat, lng], { icon })
    marker.bindPopup(popupHtml, { maxWidth: 260 })
    clusterGroup.addLayer(marker)
  })
}

export default function AdminPropertyMap({ statusFilter, purposeFilter, searchFilter }: AdminPropertyMapProps) {
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const clusterGroupRef = useRef<any>(null)
  const [pins, setPins] = useState<MapPin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, sold: 0, rented: 0 })
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeMsg, setGeocodeMsg] = useState<string | null>(null)

  const loadPins = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAllPins(accessToken, statusFilter, purposeFilter, searchFilter)
      setPins(data)
      const s = { total: data.length, active: 0, inactive: 0, sold: 0, rented: 0 }
      data.forEach(p => {
        const st = p.status?.toUpperCase()
        if (st === 'ACTIVE')   s.active++
        if (st === 'INACTIVE') s.inactive++
        if (st === 'SOLD')     s.sold++
        if (st === 'RENTED')   s.rented++
      })
      setStats(s)
    } catch (e) {
      console.error('[AdminPropertyMap] loadPins error:', e)
      setError('Erro ao carregar imóveis do mapa. Verifique sua conexão.')
    } finally {
      setLoading(false)
    }
  }, [accessToken, statusFilter, purposeFilter, searchFilter])

  useEffect(() => {
    loadPins()
  }, [loadPins])

  // Update markers when filters change (without reinitializing map)
  useEffect(() => {
    if (!mapInstanceRef.current || !clusterGroupRef.current || loading) return
    const L = (window as any).__leafletInstance
    if (!L) return
    clusterGroupRef.current.clearLayers()
    buildMarkers(L, clusterGroupRef.current, pins, router)
  }, [pins, loading, router])

  // Initialize map once pins are loaded
  useEffect(() => {
    if (!mapRef.current || loading || pins.length === 0) return
    if (mapInstanceRef.current) {
      // Map already initialized — just update markers
      if (clusterGroupRef.current) {
        const L = (window as any).__leafletInstance
        if (L) {
          clusterGroupRef.current.clearLayers()
          buildMarkers(L, clusterGroupRef.current, pins, router)
        }
      }
      return
    }

    async function initMap() {
      const injectCss = (href: string, id: string) => {
        if (!document.getElementById(id)) {
          const link = document.createElement('link')
          link.id = id; link.rel = 'stylesheet'; link.href = href
          document.head.appendChild(link)
        }
      }
      injectCss('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', 'leaflet-css')
      injectCss('https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css', 'mc-css')
      injectCss('https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css', 'mc-default-css')

      const L = (await import('leaflet')).default
      await import('leaflet.markercluster');
      (window as any).__leafletInstance = L

      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!, { center: [-20.5386, -47.4008], zoom: 13 })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      mapInstanceRef.current = map

      const clusterGroup = (L as any).markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        iconCreateFunction: (cluster: any) => {
          const count = cluster.getChildCount()
          const size = count < 10 ? 36 : count < 50 ? 44 : 52
          return L.divIcon({
            html: `<div style="width:${size}px;height:${size}px;background:linear-gradient(135deg,#1B2B5B,#2d4a8a);border:3px solid #C9A84C;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:${count < 100 ? 13 : 11}px;box-shadow:0 2px 8px rgba(0,0,0,0.3);">${count}</div>`,
            className: '',
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
          })
        },
      })

      clusterGroupRef.current = clusterGroup
      map.addLayer(clusterGroup)

      buildMarkers(L, clusterGroup, pins, router)

      // Fit map to markers
      if (pins.length > 0) {
        try {
          const bounds = L.latLngBounds(pins.map(p => [Number(p.latitude), Number(p.longitude)]))
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 })
        } catch {}
      }
    }

    initMap().catch(e => {
      console.error('[AdminPropertyMap] initMap error:', e)
      setError('Erro ao inicializar o mapa.')
    })
  }, [pins, loading, router])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        clusterGroupRef.current = null
      }
    }
  }, [])

  const handleGeocoding = async () => {
    if (!accessToken || geocoding) return
    setGeocoding(true)
    setGeocodeMsg(null)
    try {
      const res = await fetch(`${API_URL}/api/v1/properties/geocode-batch`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await res.json()
      setGeocodeMsg(data.message ?? 'Geocoding iniciado!')
      setTimeout(() => { loadPins(); setGeocoding(false) }, 30000)
    } catch {
      setGeocodeMsg('Erro ao iniciar geocoding.')
      setGeocoding(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Stats bar */}
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="px-3 py-1 bg-slate-100 rounded-full font-medium">{stats.total} no mapa</span>
        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">{stats.active} ativos</span>
        <span className="px-3 py-1 bg-slate-200 text-slate-600 rounded-full">{stats.inactive} inativos</span>
        <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full">{stats.sold} vendidos</span>
        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full">{stats.rented} alugados</span>
      </div>

      {/* Geocoding message */}
      {geocodeMsg && (
        <div className="text-sm bg-blue-50 border border-blue-200 text-blue-700 rounded-lg px-4 py-2">
          {geocodeMsg}
        </div>
      )}

      {/* Map container */}
      <div className="relative rounded-xl overflow-hidden border border-slate-200" style={{ height: 600 }}>
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm text-slate-600">Carregando imóveis no mapa...</p>
          </div>
        )}

        {error && !loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white gap-4">
            <AlertCircle className="w-10 h-10 text-red-500" />
            <p className="text-sm text-slate-600 text-center max-w-xs">{error}</p>
            <Button variant="outline" size="sm" onClick={loadPins}>
              <RefreshCw className="w-4 h-4 mr-2" /> Tentar novamente
            </Button>
          </div>
        )}

        {!loading && !error && pins.length === 0 && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white gap-4">
            <MapPin className="w-10 h-10 text-slate-400" />
            <p className="text-sm text-slate-500 text-center max-w-xs">
              Nenhum imóvel com localização encontrado.<br />
              Use o botão abaixo para geocodificar automaticamente.
            </p>
            <Button variant="outline" size="sm" onClick={handleGeocoding} disabled={geocoding}>
              {geocoding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MapPin className="w-4 h-4 mr-2" />}
              {geocoding ? 'Geocodificando...' : 'Geocodificar imóveis'}
            </Button>
          </div>
        )}

        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      </div>

      {/* Geocoding action */}
      {!loading && !error && pins.length > 0 && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Imóveis sem localização não aparecem no mapa.</span>
          <Button variant="ghost" size="sm" onClick={handleGeocoding} disabled={geocoding} className="text-xs">
            {geocoding ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <MapPin className="w-3 h-3 mr-1" />}
            {geocoding ? 'Geocodificando...' : 'Geocodificar imóveis sem localização'}
          </Button>
        </div>
      )}
    </div>
  )
}

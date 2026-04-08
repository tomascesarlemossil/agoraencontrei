'use client'

import 'maplibre-gl/dist/maplibre-gl.css'
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

interface MapPinData {
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

async function fetchAllPins(accessToken: string, statusFilter?: string, purposeFilter?: string, searchFilter?: string): Promise<MapPinData[]> {
  const allPins: MapPinData[] = []
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
    const items: MapPinData[] = data.data ?? []

    items.forEach(p => {
      if (p.latitude && p.longitude && !isNaN(Number(p.latitude)) && !isNaN(Number(p.longitude))) {
        allPins.push(p)
      }
    })

    totalPages = data.meta?.totalPages ?? 1
    page++
    if (page > 50) break
  }

  return allPins
}

export default function AdminPropertyMap({ statusFilter, purposeFilter, searchFilter }: AdminPropertyMapProps) {
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [pins, setPins] = useState<MapPinData[]>([])
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

  // Initialize or update MapLibre map
  useEffect(() => {
    if (!mapRef.current || loading || pins.length === 0) return

    async function initOrUpdateMap() {
      const maplibregl = (await import('maplibre-gl')).default

      // Build GeoJSON features
      const features = pins.map(p => ({
        type: 'Feature' as const,
        properties: {
          id: p.id,
          title: p.title,
          slug: p.slug,
          type: p.type,
          purpose: p.purpose,
          status: p.status?.toUpperCase() ?? 'ACTIVE',
          price: p.price,
          priceRent: p.priceRent,
          neighborhood: p.neighborhood,
          city: p.city,
          street: p.street,
          number: p.number,
          reference: p.reference,
          coverImage: p.coverImage,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          totalArea: p.totalArea,
          isFeatured: p.isFeatured,
          statusColor: STATUS_COLORS[p.status?.toUpperCase()] ?? '#94a3b8',
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [Number(p.longitude), Number(p.latitude)],
        },
      }))

      const geojson = { type: 'FeatureCollection' as const, features }

      if (mapInstanceRef.current) {
        // Update existing source
        const source = mapInstanceRef.current.getSource('properties')
        if (source) {
          source.setData(geojson)
          return
        }
      }

      // Create new map
      const map = new maplibregl.Map({
        container: mapRef.current!,
        style: 'https://tiles.openfreemap.org/styles/bright',
        center: [-47.4008, -20.5386],
        zoom: 13,
        attributionControl: {},
      })

      map.addControl(new maplibregl.NavigationControl(), 'top-right')

      map.on('load', () => {
        map.addSource('properties', {
          type: 'geojson',
          data: geojson,
          cluster: true,
          clusterMaxZoom: 15,
          clusterRadius: 50,
        })

        // Cluster circles
        map.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'properties',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': '#1B2B5B',
            'circle-radius': ['step', ['get', 'point_count'], 18, 10, 22, 50, 28],
            'circle-stroke-width': 3,
            'circle-stroke-color': '#C9A84C',
          },
        })

        // Cluster count labels
        map.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'properties',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['Open Sans Bold'],
            'text-size': 13,
          },
          paint: { 'text-color': '#ffffff' },
        })

        // Individual markers — colored circles by status
        map.addLayer({
          id: 'unclustered-point',
          type: 'circle',
          source: 'properties',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': ['get', 'statusColor'],
            'circle-radius': 8,
            'circle-stroke-width': 2.5,
            'circle-stroke-color': '#ffffff',
          },
        })

        // Featured properties — outer glow
        map.addLayer({
          id: 'featured-glow',
          type: 'circle',
          source: 'properties',
          filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'isFeatured'], true]],
          paint: {
            'circle-radius': 12,
            'circle-color': 'transparent',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#C9A84C',
          },
        })

        // Click cluster → zoom in
        map.on('click', 'clusters', (e) => {
          const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] })
          if (!features.length) return
          const clusterId = features[0].properties.cluster_id
          const source = map.getSource('properties') as any
          source.getClusterExpansionZoom(clusterId).then((zoom: number) => {
            map.easeTo({ center: (features[0].geometry as any).coordinates, zoom })
          })
        })

        // Click property → show popup
        map.on('click', 'unclustered-point', (e) => {
          if (!e.features?.length) return
          const f = e.features[0]
          const coords = (f.geometry as any).coordinates.slice()
          const p = f.properties as any

          const statusColor = p.statusColor || '#94a3b8'
          const hasImage = p.coverImage && !FAKE_IMAGE_PATTERNS.some((pat: string) => p.coverImage.includes(pat))
          const priceStr = (p.purpose === 'RENT' || p.purpose === 'SEASON')
            ? (p.priceRent ? fmt.format(Number(p.priceRent)) + '/mês' : 'Consulte')
            : (p.price ? fmt.format(Number(p.price)) : (p.priceRent ? fmt.format(Number(p.priceRent)) + '/mês' : 'Consulte'))

          const address = [p.street, p.number, p.neighborhood, p.city].filter(Boolean).join(', ')

          const html = `
            <div style="width:240px;font-family:system-ui,sans-serif;">
              ${hasImage ? `<img src="${p.coverImage}" alt="" style="width:100%;height:110px;object-fit:cover;border-radius:6px 6px 0 0;display:block;" />` : ''}
              <div style="padding:10px 12px;">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;flex-wrap:wrap;">
                  <span style="background:${statusColor}22;color:${statusColor};font-size:10px;font-weight:600;padding:2px 8px;border-radius:999px;">${STATUS_LABELS[p.status] ?? p.status}</span>
                  ${p.isFeatured === true || p.isFeatured === 'true' ? '<span style="background:#fef3c7;color:#b45309;font-size:10px;font-weight:600;padding:2px 8px;border-radius:999px;">⭐ Destaque</span>' : ''}
                </div>
                ${p.reference ? `<div style="font-size:10px;color:#64748b;margin-bottom:2px;font-family:monospace;">Ref: ${p.reference}</div>` : ''}
                <div style="font-size:12px;font-weight:600;color:#1e293b;line-height:1.3;margin-bottom:4px;">${p.title}</div>
                <div style="font-size:11px;color:#64748b;margin-bottom:6px;">${TYPE_LABELS[p.type] ?? p.type} · ${PURPOSE_LABELS[p.purpose] ?? p.purpose}</div>
                ${address ? `<div style="font-size:11px;color:#64748b;margin-bottom:6px;">📍 ${address}</div>` : ''}
                <div style="display:flex;gap:8px;font-size:11px;color:#64748b;margin-bottom:8px;flex-wrap:wrap;">
                  ${p.bedrooms > 0 ? `<span>🛏 ${p.bedrooms}</span>` : ''}
                  ${p.bathrooms > 0 ? `<span>🚿 ${p.bathrooms}</span>` : ''}
                  ${p.totalArea > 0 ? `<span>📐 ${p.totalArea}m²</span>` : ''}
                </div>
                <div style="font-size:14px;font-weight:700;color:#1B2B5B;margin-bottom:8px;">${priceStr}</div>
                <a href="/dashboard/properties/${p.id}" style="display:block;width:100%;background:linear-gradient(135deg,#1B2B5B,#2d4a8a);color:white;text-align:center;padding:8px;border-radius:6px;font-size:12px;font-weight:600;text-decoration:none;">Abrir Cadastro →</a>
              </div>
            </div>`

          new maplibregl.Popup({ offset: 25, maxWidth: '280px' })
            .setLngLat(coords)
            .setHTML(html)
            .addTo(map)
        })

        // Cursor changes
        map.on('mouseenter', 'clusters', () => { map.getCanvas().style.cursor = 'pointer' })
        map.on('mouseleave', 'clusters', () => { map.getCanvas().style.cursor = '' })
        map.on('mouseenter', 'unclustered-point', () => { map.getCanvas().style.cursor = 'pointer' })
        map.on('mouseleave', 'unclustered-point', () => { map.getCanvas().style.cursor = '' })

        // Fit bounds to all pins
        if (pins.length > 0) {
          const bounds = new maplibregl.LngLatBounds()
          pins.forEach(p => bounds.extend([Number(p.longitude), Number(p.latitude)]))
          map.fitBounds(bounds, { padding: 40, maxZoom: 16 })
        }
      })

      mapInstanceRef.current = map
    }

    initOrUpdateMap().catch(e => {
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

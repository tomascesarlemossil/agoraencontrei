'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, MapPin, Building2, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'

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
  FARM:      'Chacara/Sitio',
  RANCH:     'Fazenda',
  WAREHOUSE: 'Galpao',
  OFFICE:    'Escritorio',
  STORE:     'Loja',
  STUDIO:    'Studio',
  PENTHOUSE: 'Cobertura',
  CONDO:     'Condominio',
  KITNET:    'Kitnet',
}

const PURPOSE_LABELS: Record<string, string> = {
  SALE:   'Venda',
  RENT:   'Aluguel',
  BOTH:   'Venda/Aluguel',
  SEASON: 'Temporada',
}

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

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
  latitude: number
  longitude: number
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

const FAKE_IMAGE_PATTERNS = [
  'send.png', 'telefone.png', 'logotopo.png', 'foto_vazio.png',
  'foto-corretor.png', 'logo_uso.png', 'logo_rodape.png',
  '/images/logo', '/images/banner', 'whatsapp',
]

function addMarkersToCluster(L: any, clusterGroup: any, pins: MapPin[], router: any) {
  if (typeof window !== 'undefined') {
    (window as any).__adminMapNav = (id: string) => {
      router.push(`/dashboard/properties/${id}`)
    }
  }

  pins.forEach(p => {
    const statusColor = STATUS_COLORS[p.status?.toUpperCase()] ?? '#94a3b8'

    const icon = L.divIcon({
      html: `<div style="width:28px;height:28px;background:${statusColor};border:2.5px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.35);${p.isFeatured ? 'outline:2px solid #C9A84C;outline-offset:1px;' : ''}"></div>`,
      className: '',
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -30],
    })

    const hasImage = p.coverImage && !FAKE_IMAGE_PATTERNS.some(pat => p.coverImage!.includes(pat))
    const priceStr = (p.purpose === 'RENT' || p.purpose === 'SEASON')
      ? (p.priceRent ? fmt.format(Number(p.priceRent)) + '/mes' : 'Consulte')
      : (p.price ? fmt.format(Number(p.price)) : (p.priceRent ? fmt.format(Number(p.priceRent)) + '/mes' : 'Consulte'))

    const address = [p.street, p.number, p.neighborhood, p.city].filter(Boolean).join(', ')

    const imgHtml = hasImage ? `<img src="${p.coverImage}" alt="" style="width:100%;height:120px;object-fit:cover;border-radius:6px 6px 0 0;display:block;" />` : ''
    const refHtml = p.reference ? `<div style="font-size:10px;color:#64748b;margin-bottom:2px;font-family:monospace;">Ref: ${p.reference}</div>` : ''
    const featHtml = p.isFeatured ? '<span style="background:#fef3c7;color:#b45309;font-size:10px;font-weight:600;padding:2px 8px;border-radius:999px;">Destaque</span>' : ''
    const addrHtml = address ? `<div style="font-size:11px;color:#64748b;margin-bottom:6px;">${address}</div>` : ''
    const bedsHtml = p.bedrooms ? `<span>${p.bedrooms} qts</span>` : ''
    const bathHtml = p.bathrooms ? `<span>${p.bathrooms} ban</span>` : ''
    const areaHtml = p.totalArea ? `<span>${p.totalArea}m2</span>` : ''

    const popupHtml = `<div style="width:240px;font-family:system-ui,sans-serif;">${imgHtml}<div style="padding:10px 12px;"><div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;flex-wrap:wrap;"><span style="background:${statusColor}22;color:${statusColor};font-size:10px;font-weight:600;padding:2px 8px;border-radius:999px;">${STATUS_LABELS[p.status?.toUpperCase()] ?? p.status}</span>${featHtml}</div>${refHtml}<div style="font-size:12px;font-weight:600;color:#1e293b;line-height:1.3;margin-bottom:4px;">${p.title}</div><div style="font-size:11px;color:#64748b;margin-bottom:6px;">${TYPE_LABELS[p.type?.toUpperCase()] ?? p.type} - ${PURPOSE_LABELS[p.purpose?.toUpperCase()] ?? p.purpose}</div>${addrHtml}<div style="display:flex;gap:8px;font-size:11px;color:#64748b;margin-bottom:8px;flex-wrap:wrap;">${bedsHtml}${bathHtml}${areaHtml}</div><div style="font-size:14px;font-weight:700;color:#1B2B5B;margin-bottom:8px;">${priceStr}</div><button onclick="window.__adminMapNav('${p.id}')" style="width:100%;background:linear-gradient(135deg,#1B2B5B,#2d4a8a);color:white;text-align:center;padding:7px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;border:none;">Abrir Cadastro</button></div></div>`

    const marker = L.marker([p.latitude, p.longitude], { icon })
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

  useEffect(() => {
    if (!accessToken) return
    setLoading(true)
    fetch(`${API_URL}/api/v1/properties/map-pins`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.json())
      .then((data: MapPin[]) => {
        setPins(data)
        const s = { total: data.length, active: 0, inactive: 0, sold: 0, rented: 0 }
        data.forEach(p => {
          if (p.status === 'ACTIVE')   s.active++
          if (p.status === 'INACTIVE') s.inactive++
          if (p.status === 'SOLD')     s.sold++
          if (p.status === 'RENTED')   s.rented++
        })
        setStats(s)
        setLoading(false)
      })
      .catch(() => {
        setError('Erro ao carregar imoveis do mapa.')
        setLoading(false)
      })
  }, [accessToken])

  useEffect(() => {
    if (!mapRef.current || loading || pins.length === 0) return
    if (mapInstanceRef.current) return

    async function initMap() {
      // Inject Leaflet CSS via link tags (avoids TS module resolution issues)
      const injectCss = (href: string, id: string) => {
        if (!document.getElementById(id)) {
          const link = document.createElement('link')
          link.id = id
          link.rel = 'stylesheet'
          link.href = href
          document.head.appendChild(link)
        }
      }
      injectCss('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', 'leaflet-css')
      injectCss('https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css', 'mc-css')
      injectCss('https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css', 'mc-default-css')

      const L = (await import('leaflet')).default
      await import('leaflet.markercluster')

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

      addMarkersToCluster(L, clusterGroup, pins, router)
      map.addLayer(clusterGroup)

      if (pins.length > 0) {
        const bounds = L.latLngBounds(pins.map((p: MapPin) => [p.latitude, p.longitude]))
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 })
      }
    }

    initMap().catch(console.error)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        clusterGroupRef.current = null
      }
    }
  }, [loading, pins, router])

  useEffect(() => {
    if (!mapInstanceRef.current || !clusterGroupRef.current || pins.length === 0) return

    import('leaflet').then(({ default: L }) => {
      const clusterGroup = clusterGroupRef.current
      clusterGroup.clearLayers()

      const filtered = pins.filter(p => {
        if (statusFilter && statusFilter !== '' && p.status !== statusFilter) return false
        if (purposeFilter && purposeFilter !== '' && p.purpose !== purposeFilter) return false
        if (searchFilter && searchFilter !== '') {
          const q = searchFilter.toLowerCase()
          return (
            p.title.toLowerCase().includes(q) ||
            (p.neighborhood ?? '').toLowerCase().includes(q) ||
            (p.city ?? '').toLowerCase().includes(q) ||
            (p.reference ?? '').toLowerCase().includes(q)
          )
        }
        return true
      })

      addMarkersToCluster(L, clusterGroup, filtered, router)
    })
  }, [statusFilter, purposeFilter, searchFilter, pins, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border bg-muted/30" style={{ height: 580 }}>
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Carregando mapa de imoveis...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center rounded-2xl border bg-muted/30" style={{ height: 580 }}>
        <div className="flex flex-col items-center gap-3 text-destructive">
          <AlertCircle className="h-8 w-8" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (pins.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-2xl border bg-muted/30" style={{ height: 580 }}>
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <MapPin className="h-8 w-8" />
          <p className="text-sm font-medium">Nenhum imovel com localizacao cadastrada</p>
          <p className="text-xs text-center max-w-xs">Para aparecer no mapa, o imovel precisa ter latitude e longitude preenchidas no cadastro.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted font-medium">
          <Building2 className="h-3.5 w-3.5" />
          {stats.total} no mapa
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium" style={{ background: '#dcfce7', color: '#15803d' }}>
          <span className="w-2 h-2 rounded-full bg-green-500" />
          {stats.active} ativos
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium" style={{ background: '#f1f5f9', color: '#475569' }}>
          <span className="w-2 h-2 rounded-full bg-slate-400" />
          {stats.inactive} inativos
        </span>
        {stats.sold > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium" style={{ background: '#fee2e2', color: '#b91c1c' }}>
            <span className="w-2 h-2 rounded-full bg-red-500" />
            {stats.sold} vendidos
          </span>
        )}
        {stats.rented > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium" style={{ background: '#fef3c7', color: '#b45309' }}>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {stats.rented} alugados
          </span>
        )}
      </div>

      <div
        ref={mapRef}
        className="rounded-2xl overflow-hidden border shadow-sm"
        style={{ height: 580, width: '100%', zIndex: 0 }}
      />

      <p className="text-xs text-muted-foreground text-center">
        Clique em um marcador para ver detalhes - Clique em "Abrir Cadastro" para editar o imovel
      </p>
    </div>
  )
}

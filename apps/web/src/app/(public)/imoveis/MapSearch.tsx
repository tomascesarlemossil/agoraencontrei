'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { X, PenLine, Trash2, Search, MapPin, BedDouble, Maximize } from 'lucide-react'
import type { Map as MapLibreMap, Marker as MapLibreMarker } from 'maplibre-gl'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oenbzvxcsgyzqjtlovdq.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const FRANCA_CENTER: [number, number] = [-20.5394, -47.4008]
// Default BBOX for Franca/SP region — used for SSR pre-fetch and initial load
const FRANCA_BBOX = { swLat: -20.65, swLng: -47.52, neLat: -20.40, neLng: -47.28 }

const FAKE_IMAGE_PATTERNS = [
  'send.png', 'telefone.png', 'logotopo.png', 'foto_vazio.png',
  'foto-corretor.png', 'logo_uso.png', 'logo_rodape.png',
  '/images/logo', '/images/banner', 'whatsapp',
]
function isRealImage(url: string | null | undefined): boolean {
  if (!url) return false
  return !FAKE_IMAGE_PATTERNS.some(pat => url.includes(pat))
}
const NOMINATIM_DELAY = 1100 // ms between geocoding requests

interface Cluster {
  neighborhood: string
  city: string | null
  state: string | null
  count: number
  lat: number | null
  lng: number | null
}

interface Property {
  id: string
  slug: string
  title: string
  neighborhood: string | null
  city: string | null
  coverImage: string | null
  price: number | null
  priceRent: number | null
  purpose: string
  type: string
  bedrooms: number
  totalArea: number | null
  bathrooms: number
}

interface AuctionPin {
  id: string
  slug: string
  title: string
  city: string | null
  state: string | null
  neighborhood: string | null
  latitude: number | null
  longitude: number | null
  minimumBid: number | null
  appraisalValue: number | null
  discountPercent: number | null
  opportunityScore: number | null
  propertyType: string
  source: string
  status: string
  totalArea: number | null
  bedrooms: number
  occupation: string | null
  financingAvailable: boolean
  coverImage: string | null
}

interface OwnerDirectPin {
  id: string
  slug: string
  title: string
  price: number | null
  neighborhood: string | null
  city: string | null
  lat: number | null
  lng: number | null
  type: string
  bedrooms: number
  totalArea: number | null
  isFeatured: boolean
  isOwnerDirect: true
}
function sourceLabel(s: string): string {
  const m: Record<string, string> = { CAIXA: 'Caixa', BANCO_DO_BRASIL: 'BB', BRADESCO: 'Bradesco', ITAU: 'Itaú', SANTANDER: 'Santander', JUDICIAL: 'Judicial', EXTRAJUDICIAL: 'Extrajudicial' }
  return m[s] || s
}

// Ray-casting point-in-polygon
function pointInPolygon(lat: number, lng: number, polygon: [number, number][]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1]
    const xj = polygon[j][0], yj = polygon[j][1]
    if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
      inside = !inside
    }
  }
  return inside
}

function fmt(price: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(price)
}

function purposeLabel(p: string) {
  if (p === 'SALE') return 'Venda'
  if (p === 'RENT') return 'Aluguel'
  if (p === 'AUCTION') return '🏛️ Leilão'
  return p
}

interface Props {
  initialPurpose?: string
  initialCity?: string
  initialMaxPrice?: string
  initialBedrooms?: string
  initialClusters?: Cluster[] // SSR pre-fetched clusters for immediate display
}

// Nominatim cache in module scope
const geocodeCache = new Map<string, [number, number] | null>()

async function geocodeNeighborhood(neighborhood: string, city: string): Promise<[number, number] | null> {
  const key = `${neighborhood}|${city}`
  if (geocodeCache.has(key)) return geocodeCache.get(key)!

  try {
    const q = encodeURIComponent(`${neighborhood}, ${city}, São Paulo, Brazil`)
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=br`,
      { headers: { 'Accept-Language': 'pt-BR', 'User-Agent': 'AgoraEncontrei/1.0 (contato@agoraencontrei.com.br)' } }
    )
    const data = await res.json()
    if (data.length > 0) {
      const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)]
      geocodeCache.set(key, coords)
      return coords
    }
  } catch {}
  geocodeCache.set(key, null)
  return null
}

export function MapSearch({ initialPurpose, initialCity, initialMaxPrice, initialBedrooms, initialClusters }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<MapLibreMap | null>(null)
  const markersRef = useRef<MapLibreMarker[]>([])
  const polygonRef = useRef<boolean>(false)
  const drawingPointsRef = useRef<[number, number][]>([])
  const drawingRef = useRef(false)
  const tempMarkersRef = useRef<MapLibreMarker[]>([])

  const [clusters, setClusters] = useState<(Cluster & { resolvedLat: number; resolvedLng: number })[]>(() => {
    if (!initialClusters) return []
    return initialClusters.map(c => ({ ...c, resolvedLat: c.lat ?? 0, resolvedLng: c.lng ?? 0 }))
  })
  const [auctions, setAuctions] = useState<AuctionPin[]>([])
  const [selectedAuction, setSelectedAuction] = useState<AuctionPin | null>(null)
  const auctionLookupRef = useRef<Map<string, AuctionPin>>(new Map())
  const [ownerDirectPins, setOwnerDirectPins] = useState<OwnerDirectPin[]>([])
  const ownerDirectMarkersRef = useRef<MapLibreMarker[]>([])

  // Layer toggles
  const [showSaleLayer, setShowSaleLayer] = useState(true)
  const [showAuctionLayer, setShowAuctionLayer] = useState(true)

  // ROI filter slider
  const [minROI, setMinROI] = useState(0) // 0 = sem filtro

  // Filtros de estilo de vida / qualidade
  const [lifeFilters, setLifeFilters] = useState<{ financing: boolean; vacant: boolean; highDiscount: boolean }>({
    financing: false,
    vacant: false,
    highDiscount: false,
  })

  // Neighborhood comparison data for selected auction
  const [neighbors, setNeighbors] = useState<{ title: string; price: number; area: number; priceM2: number; neighborhood: string }[]>([])
  const [loadingNeighbors, setLoadingNeighbors] = useState(false)

  const [drawing, setDrawing] = useState(false)
  const [polygon, setPolygon] = useState<[number, number][]>([])
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loadingProps, setLoadingProps] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const router = useRouter()

  // Load neighborhood comparison when auction is selected
  useEffect(() => {
    if (!selectedAuction?.city) { setNeighbors([]); return }
    setLoadingNeighbors(true)
    const params = new URLSearchParams({
      city: selectedAuction.city,
      limit: '10',
      sortBy: 'price',
      sortOrder: 'asc',
    })
    if (selectedAuction.neighborhood) params.set('neighborhood', selectedAuction.neighborhood)

    fetch(`${API_URL}/api/v1/public/properties?${params}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.data) { setNeighbors([]); return }
        const items = (data.data as any[])
          .filter((p: any) => p.price && p.totalArea && p.totalArea > 0)
          .map((p: any) => ({
            title: p.title,
            price: Number(p.price),
            area: p.totalArea,
            priceM2: Number(p.price) / p.totalArea,
            neighborhood: p.neighborhood || '',
          }))
        setNeighbors(items)
      })
      .catch(() => setNeighbors([]))
      .finally(() => setLoadingNeighbors(false))
  }, [selectedAuction?.id])

  // Filter auctions by ROI slider + filtros de estilo de vida
  const filteredAuctions = auctions.filter(a => {
    // ROI filter
    if (minROI > 0) {
      if (!a.minimumBid || !a.appraisalValue) return false
      const bid = Number(a.minimumBid)
      const appr = Number(a.appraisalValue)
      const costs = bid * 0.095 + (a.occupation === 'OCUPADO' ? Math.max(bid * 0.02, 5000) : 0)
      const profit = appr - bid - costs
      const roi = (profit / (bid + costs)) * 100
      if (roi < minROI) return false
    }
    // Filtro: financiamento aceito
    if (lifeFilters.financing && !a.financingAvailable) return false
    // Filtro: desocupado
    if (lifeFilters.vacant && a.occupation !== 'DESOCUPADO') return false
    // Filtro: Pérola (desconto > 40%)
    if (lifeFilters.highDiscount) {
      const disc = a.discountPercent ? Number(a.discountPercent) : 0
      if (disc < 40) return false
    }
    return true
  })

  // Load clusters from API
  useEffect(() => {
    async function loadClusters(bbox?: { swLat: number; swLng: number; neLat: number; neLng: number }) {
      try {
        const params = new URLSearchParams()
        if (initialPurpose) params.set('purpose', initialPurpose)
        // Use BBOX for targeted loading — default to Franca/SP area
        const b = bbox ?? FRANCA_BBOX
        params.set('swLat', b.swLat.toFixed(6))
        params.set('swLng', b.swLng.toFixed(6))
        params.set('neLat', b.neLat.toFixed(6))
        params.set('neLng', b.neLng.toFixed(6))
        const res = await fetch(`${API_URL}/api/v1/public/map-clusters?${params}`)
        if (!res.ok) return
        const data: Cluster[] = await res.json()
        // Start with null coords, geocode progressively
        const withCoords = data.map(c => ({
          ...c,
          resolvedLat: c.lat ?? 0,
          resolvedLng: c.lng ?? 0,
        }))
        setClusters(withCoords)

        // Geocode neighborhoods without coords
        const needsGeocode = data.filter(c => !c.lat || !c.lng)
        let delay = 0
        for (const c of needsGeocode) {
          setTimeout(async () => {
            const coords = await geocodeNeighborhood(c.neighborhood, c.city ?? 'Franca')
            if (coords) {
              setClusters(prev => prev.map(p =>
                p.neighborhood === c.neighborhood && p.city === c.city
                  ? { ...p, resolvedLat: coords[0], resolvedLng: coords[1] }
                  : p
              ))
            }
          }, delay)
          delay += NOMINATIM_DELAY
        }
      } catch {}
    }
     // Only fetch if no SSR clusters provided
    if (!initialClusters || initialClusters.length === 0) {
      loadClusters()
    }
  }, [initialPurpose]) // eslint-disable-line react-hooks/exhaustive-deps
  // Load owner-direct (green pins) properties from free-listing endpoint
  useEffect(() => {
    fetch(`${API_URL}/api/v1/public/free-listing/map-pins`)
      .then(r => r.ok ? r.json() : [])
      .then((data: OwnerDirectPin[]) => setOwnerDirectPins(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  // Load auction pins — bypass Railway, read directly from Supabase
  useEffect(() => {
    async function loadAuctions() {
      // Try API first
      try {
        const res = await fetch(`${API_URL}/api/v1/auctions/map?state=SP&limit=2000`)
        if (res.ok) {
          const data = await res.json()
          if (data.data?.length > 0) { setAuctions(data.data); return }
        }
      } catch {}

      // Fallback: Supabase direct
      if (!SUPABASE_ANON_KEY) return
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/auctions?select=id,slug,title,city,state,neighborhood,latitude,longitude,"minimumBid","appraisalValue","discountPercent","opportunityScore","propertyType",source,status,"totalArea",bedrooms,occupation,"financingAvailable","coverImage"&status=not.in.(CANCELLED,CLOSED)&limit=2000`,
          {
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
          }
        )
        if (res.ok) {
          const data = await res.json()
          setAuctions(data || [])
        }
      } catch {}
    }
    loadAuctions()
  }, [])

  // Inject MapLibre CSS + critical inline styles
  useEffect(() => {
    // Critical inline CSS for canvas positioning (no network needed)
    if (!document.getElementById('maplibre-critical-css')) {
      const style = document.createElement('style')
      style.id = 'maplibre-critical-css'
      style.textContent = `.maplibregl-map{font:12px/20px Helvetica Neue,Arial,Helvetica,sans-serif;overflow:hidden;position:relative;width:100%;height:100%;-webkit-tap-highlight-color:rgba(0,0,0,0)}.maplibregl-canvas{position:absolute;left:0;top:0}.maplibregl-canvas-container.maplibregl-interactive{cursor:grab;user-select:none}`
      document.head.appendChild(style)
    }
    // Full CSS from CDN
    if (!document.getElementById('maplibre-gl-css')) {
      const link = document.createElement('link')
      link.id = 'maplibre-gl-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.css'
      document.head.appendChild(link)
    }
  }, [])

  // Initialize MapLibre GL map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    import('maplibre-gl').then(mod => {
      const maplibregl: any = mod.default || mod
      if (typeof maplibregl?.Map !== 'function') {
        setMapError(`MapLibre não carregou. Keys: ${Object.keys(mod).join(',')}`)
        return
      }
      try {
        const map = new maplibregl.Map({
          container: mapRef.current!,
          style: 'https://tiles.openfreemap.org/styles/bright',
          center: [FRANCA_CENTER[1], FRANCA_CENTER[0]], // MapLibre uses [lng, lat]
          zoom: 14,
          pitch: 45,
          bearing: -17.6,
          maxPitch: 70,
          antialias: true,
        })

        map.addControl(new maplibregl.NavigationControl(), 'top-right')

        // Ensure canvas fills container after layout settles
        map.once('render', () => { map.resize() })
        setTimeout(() => { try { map.resize() } catch {} }, 200)

        map.on('load', () => {
          // Add 3D building extrusion layer
          try {
            const layers = map.getStyle().layers || []
            let labelLayerId: string | undefined
            for (const layer of layers) {
              if (layer.type === 'symbol' && layer.layout?.['text-field']) {
                labelLayerId = layer.id
                break
              }
            }

            // Check if vector source has 'building' layer
            map.addLayer({
              id: '3d-buildings',
              source: 'openmaptiles',
              'source-layer': 'building',
              filter: ['==', 'extrude', 'true'],
              type: 'fill-extrusion',
              minzoom: 14,
              paint: {
                'fill-extrusion-color': '#ddd',
                'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 14, 0, 14.5, ['get', 'render_height']],
                'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 14, 0, 14.5, ['get', 'render_min_height']],
                'fill-extrusion-opacity': 0.6,
              },
            }, labelLayerId)
          } catch (e) {
            console.warn('[MapSearch] 3D buildings layer not available:', e)
          }

          // Add auction GeoJSON source with clustering
          map.addSource('auctions-source', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 60,
          })

          map.addLayer({
            id: 'auction-clusters',
            type: 'circle',
            source: 'auctions-source',
            filter: ['has', 'point_count'],
            paint: {
              'circle-color': '#C9A84C',
              'circle-radius': ['step', ['get', 'point_count'], 20, 10, 24, 50, 30],
              'circle-stroke-width': 3,
              'circle-stroke-color': '#1B2B5B',
            },
          })

          map.addLayer({
            id: 'auction-cluster-count',
            type: 'symbol',
            source: 'auctions-source',
            filter: ['has', 'point_count'],
            layout: { 'text-field': '{point_count_abbreviated}', 'text-size': 12 },
            paint: { 'text-color': '#1B2B5B' },
          })

          map.addLayer({
            id: 'auction-unclustered',
            type: 'circle',
            source: 'auctions-source',
            filter: ['!', ['has', 'point_count']],
            paint: {
              'circle-color': '#C9A84C',
              'circle-radius': 10,
              'circle-stroke-width': 3,
              'circle-stroke-color': '#1B2B5B',
            },
          })

          // Polygon drawing source
          map.addSource('draw-polygon', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
          })
          map.addLayer({
            id: 'draw-polygon-fill',
            type: 'fill',
            source: 'draw-polygon',
            paint: { 'fill-color': '#C9A84C', 'fill-opacity': 0.15 },
          })
          map.addLayer({
            id: 'draw-polygon-line',
            type: 'line',
            source: 'draw-polygon',
            paint: { 'line-color': '#C9A84C', 'line-width': 2.5 },
          })

          // Drawing temp line source
          map.addSource('draw-temp-line', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
          })
          map.addLayer({
            id: 'draw-temp-line-layer',
            type: 'line',
            source: 'draw-temp-line',
            paint: { 'line-color': '#C9A84C', 'line-width': 2, 'line-dasharray': [3, 2] },
          })

          setIsLoaded(true)
        })

        // Click auction cluster → zoom in
        map.on('click', 'auction-clusters', (e: any) => {
          const features = map.queryRenderedFeatures(e.point, { layers: ['auction-clusters'] })
          if (!features.length) return
          const clusterId = features[0].properties.cluster_id
          ;(map.getSource('auctions-source') as any).getClusterExpansionZoom(clusterId).then((zoom: number) => {
            map.easeTo({ center: (features[0].geometry as any).coordinates, zoom })
          })
        })

        // Click individual auction → select it
        map.on('click', 'auction-unclustered', (e: any) => {
          if (!e.features?.length) return
          const id = e.features[0].properties?.id as string
          if (id) {
            const auction = auctionLookupRef.current.get(id)
            if (auction) setSelectedAuction(auction)
          }
        })

        map.on('mouseenter', 'auction-clusters', () => { map.getCanvas().style.cursor = 'pointer' })
        map.on('mouseleave', 'auction-clusters', () => { map.getCanvas().style.cursor = '' })
        map.on('mouseenter', 'auction-unclustered', () => { map.getCanvas().style.cursor = 'pointer' })
        map.on('mouseleave', 'auction-unclustered', () => { map.getCanvas().style.cursor = '' })

        mapInstance.current = map
      } catch (err) {
        console.error('[MapSearch] MapLibre init error:', err)
        setMapError('Não foi possível carregar o mapa. Tente recarregar a página.')
      }
    }).catch(err => {
      console.error('[MapSearch] MapLibre import error:', err)
      setMapError('Não foi possível carregar o mapa. Tente recarregar a página.')
    })

    return () => {
      if (mapInstance.current) {
        try { mapInstance.current.remove() } catch {}
        mapInstance.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Toggle sale layer visibility (markers)
  useEffect(() => {
    markersRef.current.forEach(m => {
      m.getElement().style.display = showSaleLayer ? '' : 'none'
    })
  }, [showSaleLayer])

  // Toggle auction layer visibility
  useEffect(() => {
    const map = mapInstance.current
    if (!map || !map.isStyleLoaded()) return
    const vis = showAuctionLayer ? 'visible' : 'none'
    try {
      map.setLayoutProperty('auction-clusters', 'visibility', vis)
      map.setLayoutProperty('auction-cluster-count', 'visibility', vis)
      map.setLayoutProperty('auction-unclustered', 'visibility', vis)
    } catch {}
  }, [showAuctionLayer])

  // Render cluster markers on map (blue — conventional properties) using MapLibre Markers
  useEffect(() => {
    if (!isLoaded || !mapInstance.current) return

    // Remove old markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    import('maplibre-gl').then(mod => {
      const maplibregl = mod.default || mod
      const map = mapInstance.current!

      clusters.forEach(c => {
        if (!c.resolvedLat || !c.resolvedLng) return

        const isSelected = selectedNeighborhoods.includes(c.neighborhood)
        const size = c.count > 99 ? 52 : 44

        const el = document.createElement('div')
        el.style.cssText = `display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:50%;background:${isSelected ? '#C9A84C' : '#1B2B5B'};color:white;font-size:13px;font-weight:700;border:3px solid ${isSelected ? '#e6c96a' : 'rgba(255,255,255,0.3)'};box-shadow:0 2px 8px rgba(0,0,0,0.3);cursor:pointer;transition:transform 0.15s;`
        el.textContent = String(c.count)
        el.style.display = showSaleLayer ? '' : 'none'

        el.addEventListener('click', () => {
          if (!drawingRef.current) {
            // Show popup
            new maplibregl.Popup({ offset: 25 })
              .setLngLat([c.resolvedLng, c.resolvedLat])
              .setHTML(`<div style="min-width:160px"><p style="font-weight:700;margin:0 0 4px">${c.neighborhood}</p><p style="color:#666;margin:0;font-size:12px">${c.city ?? ''}${c.state ? `, ${c.state}` : ''}</p><p style="color:#1B2B5B;font-weight:600;margin:4px 0 0;font-size:13px">${c.count} imóve${c.count !== 1 ? 'is' : 'l'}</p></div>`)
              .addTo(map)
            handleNeighborhoodClick(c.neighborhood, c.city)
          }
        })

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([c.resolvedLng, c.resolvedLat])
          .addTo(map)

        markersRef.current.push(marker)
      })
    })
  }, [clusters, isLoaded, selectedNeighborhoods, drawing, showSaleLayer])

  // Render auction pins by updating GeoJSON source data (MapLibre native clustering)
  useEffect(() => {
    const map = mapInstance.current
    if (!isLoaded || !map) return

    const source = map.getSource('auctions-source') as any
    if (!source) return

    // Update lookup for click handler
    const lookup = new Map<string, AuctionPin>()
    filteredAuctions.forEach(a => lookup.set(a.id, a))
    auctionLookupRef.current = lookup

    const features = filteredAuctions
      .filter(a => a.latitude && a.longitude)
      .map(a => ({
        type: 'Feature' as const,
        properties: { id: a.id },
        geometry: {
          type: 'Point' as const,
          coordinates: [a.longitude!, a.latitude!],
        },
      }))

    source.setData({ type: 'FeatureCollection', features })
  }, [filteredAuctions, isLoaded])

  // Render owner-direct green pins using MapLibre Markers
  useEffect(() => {
    if (!isLoaded || !mapInstance.current) return

    import('maplibre-gl').then(mod => {
      const maplibregl = mod.default || mod
      ownerDirectMarkersRef.current.forEach(m => { try { m.remove() } catch {} })
      ownerDirectMarkersRef.current = []
      if (ownerDirectPins.length === 0) return

      const map = mapInstance.current!

      for (const p of ownerDirectPins) {
        if (!p.lat || !p.lng) continue
        const priceStr = p.price ? fmt(p.price) : 'Consulte'

        const el = document.createElement('div')
        el.style.cssText = 'width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#22c55e,#16a34a);border:3px solid #fff;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 2px 10px rgba(34,197,94,0.5);cursor:pointer;'
        el.textContent = '\u{1F3E0}'

        el.addEventListener('click', () => {
          new maplibregl.Popup({ offset: 25 })
            .setLngLat([p.lng!, p.lat!])
            .setHTML(`<div style="min-width:200px;max-width:260px;font-family:system-ui"><div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#16a34a;font-weight:700;margin-bottom:4px">VENDA DIRETA - Proprietário</div><p style="font-weight:700;margin:0 0 4px;font-size:13px;color:#1B2B5B">${p.title}</p><p style="color:#666;margin:0 0 6px;font-size:11px">${p.neighborhood || ''} - ${p.city || ''}</p><p style="margin:2px 0;font-size:16px;font-weight:800;color:#1B2B5B">${priceStr}</p><div style="margin:6px 0"><span style="font-size:10px;background:#dcfce7;color:#16a34a;padding:2px 8px;border-radius:8px;font-weight:600">Sem comissão</span></div><a href="/imoveis/${p.slug}" style="display:block;text-align:center;margin-top:8px;padding:6px;background:#16a34a;color:white;border-radius:8px;font-size:12px;font-weight:600;text-decoration:none">Ver imóvel</a></div>`)
            .addTo(map)
        })

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([p.lng!, p.lat!])
          .addTo(map)

        ownerDirectMarkersRef.current.push(marker)
      }
    })
  }, [ownerDirectPins, isLoaded])

  // Sync drawingRef with drawing state for closures
  useEffect(() => {
    drawingRef.current = drawing
  }, [drawing])

  // Handle drawing mode map clicks (MapLibre events)
  useEffect(() => {
    if (!isLoaded || !mapInstance.current) return

    const map = mapInstance.current

    function onClick(e: any) {
      if (!drawingRef.current) return

      const pt: [number, number] = [e.lngLat.lat, e.lngLat.lng]
      drawingPointsRef.current = [...drawingPointsRef.current, pt]

      // Add vertex marker
      import('maplibre-gl').then(mod => {
        const maplibregl = mod.default || mod
        const el = document.createElement('div')
        el.style.cssText = 'width:10px;height:10px;border-radius:50%;background:#C9A84C;border:2px solid #C9A84C;'
        const vm = new maplibregl.Marker({ element: el })
          .setLngLat([e.lngLat.lng, e.lngLat.lat])
          .addTo(map)
        tempMarkersRef.current.push(vm)
      })

      // Update temp line via GeoJSON source
      const pts = drawingPointsRef.current
      if (pts.length >= 2) {
        const lineSource = map.getSource('draw-temp-line') as any
        if (lineSource) {
          lineSource.setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: pts.map(p => [p[1], p[0]]), // [lng, lat]
            },
          })
        }
      }

      // Auto-close polygon when clicking near first point
      if (pts.length >= 3) {
        const first = pts[0]
        const dx = Math.abs(first[0] - pt[0])
        const dy = Math.abs(first[1] - pt[1])
        if (dx < 0.001 && dy < 0.001) {
          closePolygon()
        }
      }
    }

    function onDblClick(e: any) {
      if (!drawingRef.current) return
      e.preventDefault?.()
      if (drawingPointsRef.current.length >= 3) {
        closePolygon()
      }
    }

    map.on('click', onClick)
    map.on('dblclick', onDblClick)

    return () => {
      map.off('click', onClick)
      map.off('dblclick', onDblClick)
    }
  }, [isLoaded]) // eslint-disable-line react-hooks/exhaustive-deps

  function closePolygon() {
    const pts = drawingPointsRef.current
    if (pts.length < 3) return

    const map = mapInstance.current
    if (!map) return

    // Clear temp elements
    const tempLineSource = map.getSource('draw-temp-line') as any
    if (tempLineSource) tempLineSource.setData({ type: 'FeatureCollection', features: [] })
    tempMarkersRef.current.forEach(m => m.remove())
    tempMarkersRef.current = []

    // Draw final polygon via GeoJSON source
    const coords = pts.map(p => [p[1], p[0]] as [number, number]) // [lng, lat]
    coords.push(coords[0]) // close the ring

    const polygonSource = map.getSource('draw-polygon') as any
    if (polygonSource) {
      polygonSource.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [coords],
        },
      })
    }

    polygonRef.current = true
    setPolygon(pts)
    setDrawing(false)
    drawingRef.current = false
    drawingPointsRef.current = []

    // Find clusters inside polygon
    const inside = clusters.filter(c =>
      c.resolvedLat && c.resolvedLng &&
      pointInPolygon(c.resolvedLat, c.resolvedLng, pts)
    )
    setSelectedNeighborhoods(inside.map(c => c.neighborhood))

    // Also find auctions inside polygon (instant results)
    const auctionsInside = auctions.filter(a =>
      a.latitude && a.longitude &&
      pointInPolygon(a.latitude, a.longitude, pts)
    )
    if (auctionsInside.length > 0) {
      // Convert auctions to property format for the results panel
      const auctionProps: Property[] = auctionsInside.map(a => ({
        id: a.id,
        slug: `../leiloes/${a.slug}`,
        title: `🏛️ ${a.title}`,
        neighborhood: a.neighborhood,
        city: a.city,
        coverImage: a.coverImage,
        price: a.minimumBid ? Number(a.minimumBid) : null,
        priceRent: null,
        purpose: 'AUCTION',
        type: a.propertyType,
        bedrooms: a.bedrooms || 0,
        totalArea: a.totalArea,
        bathrooms: 0,
      }))
      setProperties(prev => [...auctionProps, ...prev])
    }
  }

  function clearPolygon() {
    const map = mapInstance.current
    if (map) {
      const polygonSource = map.getSource('draw-polygon') as any
      if (polygonSource) polygonSource.setData({ type: 'FeatureCollection', features: [] })
      const tempLineSource = map.getSource('draw-temp-line') as any
      if (tempLineSource) tempLineSource.setData({ type: 'FeatureCollection', features: [] })
    }
    tempMarkersRef.current.forEach(m => m.remove())
    tempMarkersRef.current = []
    drawingPointsRef.current = []
    polygonRef.current = false
    setPolygon([])
    setSelectedNeighborhoods([])
    setProperties([])
    setDrawing(false)
    drawingRef.current = false
  }

  function startDrawing() {
    clearPolygon()
    setDrawing(true)
    drawingRef.current = true
    if (mapInstance.current) mapInstance.current.getContainer().style.cursor = 'crosshair'
  }

  useEffect(() => {
    if (!mapInstance.current) return
    mapInstance.current.getContainer().style.cursor = drawing ? 'crosshair' : ''
  }, [drawing])

  // Fetch properties when neighborhoods are selected
  useEffect(() => {
    if (selectedNeighborhoods.length === 0) {
      setProperties([])
      return
    }

    setLoadingProps(true)
    // Fetch all selected neighborhoods — use 'neighborhood' param for precise filtering
    Promise.all(
      selectedNeighborhoods.map(async n => {
        const params = new URLSearchParams({ limit: '20' })
        params.set('neighborhood', n) // precise neighborhood filter
        if (initialPurpose) params.set('purpose', initialPurpose)
        if (initialMaxPrice) params.set('maxPrice', initialMaxPrice)
        if (initialBedrooms) params.set('bedrooms', initialBedrooms)
        // Also add city to narrow results
        const cluster = clusters.find(c => c.neighborhood === n)
        if (cluster?.city) params.set('city', cluster.city)
        const res = await fetch(`${API_URL}/api/v1/public/properties?${params}`)
        if (!res.ok) return []
        const data = await res.json()
        return (data.data ?? []) as Property[]
      })
    ).then(results => {
      const all = results.flat()
      // Deduplicate
      const seen = new Set<string>()
      const unique = all.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true })
      setProperties(unique.slice(0, 60))
      setLoadingProps(false)
    }).catch(() => setLoadingProps(false))
  }, [selectedNeighborhoods, initialPurpose, initialMaxPrice, initialBedrooms])

  function handleNeighborhoodClick(neighborhood: string, city: string | null) {
    setSelectedNeighborhoods([neighborhood])
  }

  function goToListings() {
    const params = new URLSearchParams()
    if (initialPurpose) params.set('purpose', initialPurpose)
    if (selectedNeighborhoods.length === 1) {
      // Use neighborhood param for precise filtering
      params.set('neighborhood', selectedNeighborhoods[0])
    } else if (selectedNeighborhoods.length > 1) {
      // Multiple neighborhoods — use search with first one
      params.set('search', selectedNeighborhoods[0])
    }
    if (initialMaxPrice) params.set('maxPrice', initialMaxPrice)
    if (initialBedrooms) params.set('bedrooms', initialBedrooms)
    router.push(`/imoveis?${params}`)
  }

  const totalInPolygon = selectedNeighborhoods.reduce((acc, n) => {
    const c = clusters.find(c => c.neighborhood === n)
    return acc + (c?.count ?? 0)
  }, 0)

  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-xl" style={{ height: 580 }}>
      {/* Map container */}
      {mapError ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-50 gap-4">
          <MapPin className="w-12 h-12 text-gray-300" />
          <div className="text-center">
            <p className="text-base font-semibold text-gray-700 mb-1">Mapa indisponível</p>
            <p className="text-sm text-gray-500 max-w-xs px-4">{mapError}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => { setMapError(null); mapInstance.current = null; }}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#1B2B5B] text-white hover:opacity-90 transition-opacity"
            >
              Tentar novamente
            </button>
            <a
              href="/imoveis"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold border-2 border-[#1B2B5B] text-[#1B2B5B] hover:bg-blue-50 transition-colors text-center"
            >
              Ver listagem de imóveis
            </a>
          </div>
        </div>
      ) : null}
      <div ref={mapRef} className="absolute inset-0 z-0" />

      {/* Top controls */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-start gap-2 pointer-events-none">
        <div className="flex gap-2 pointer-events-auto">
          {!drawing && polygon.length === 0 && (
            <button
              onClick={startDrawing}
              className="group relative flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-bold shadow-2xl transition-all hover:scale-105 overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #1B2B5B 0%, #2d4a8a 100%)', color: 'white' }}
            >
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)' }} />
              <PenLine className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Desenhar minha área</span>
            </button>
          )}
          {drawing && (
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg"
                style={{ backgroundColor: '#C9A84C', color: '#1B2B5B' }}
              >
                <PenLine className="w-4 h-4" />
                Clique para desenhar · Duplo-clique para fechar
              </div>
              <button
                onClick={clearPolygon}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold shadow-lg bg-white text-gray-700 hover:bg-gray-50"
              >
                <X className="w-4 h-4" /> Cancelar
              </button>
            </div>
          )}
          {polygon.length > 0 && (
            <button
              onClick={clearPolygon}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg bg-white text-gray-700 hover:bg-gray-50"
            >
              <Trash2 className="w-4 h-4" />
              Limpar área
            </button>
          )}
        </div>

        {/* ROI Slider — hidden on small mobile */}
        {showAuctionLayer && (
          <div className="pointer-events-auto hidden sm:flex items-center gap-2 bg-white/95 backdrop-blur px-3 py-2 rounded-xl shadow-lg">
            <span className="text-[10px] font-semibold text-gray-500 whitespace-nowrap">ROI mín.</span>
            <input
              type="range"
              min={0} max={80} step={5}
              value={minROI}
              onChange={e => setMinROI(Number(e.target.value))}
              className="w-20 h-1.5 accent-[#C9A84C] cursor-pointer"
            />
            <span className="text-xs font-bold min-w-[36px] text-right" style={{ color: minROI > 0 ? '#C9A84C' : '#999' }}>
              {minROI > 0 ? `${minROI}%` : 'Todos'}
            </span>
            {minROI > 0 && (
              <span className="text-[10px] text-gray-400">
                ({filteredAuctions.length}/{auctions.length})
              </span>
            )}
          </div>
        )}

        {/* Heatmap Toggle + Filtros Estilo de Vida — hidden on small mobile */}
        {showAuctionLayer && (
          <div className="pointer-events-auto hidden sm:flex items-center gap-1.5 bg-white/95 backdrop-blur px-2 py-1.5 rounded-xl shadow-lg">
            <span className="text-[10px] font-semibold text-gray-500 whitespace-nowrap hidden sm:block">Filtros:</span>
            {([
              { key: 'financing', label: '\uD83C\uDFE6 Financ.', title: 'Financiamento aceito' },
              { key: 'vacant', label: '\uD83D\uDFE2 Livre', title: 'Imóvel desocupado' },
              { key: 'highDiscount', label: '\uD83D\uDC8E Pérola', title: 'Desconto > 40%' },
            ] as { key: string; label: string; title: string }[]).map(f => (
              <button
                key={f.key}
                title={f.title}
                onClick={() => setLifeFilters(prev => ({ ...prev, [f.key]: !prev[f.key as keyof typeof prev] }))}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  lifeFilters[f.key as keyof typeof lifeFilters]
                    ? 'bg-[#C9A84C] text-[#1B2B5B] shadow-md'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Layer Toggles */}
        <div className="ml-auto flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={() => setShowSaleLayer(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all ${
              showSaleLayer
                ? 'bg-[#1B2B5B] text-white'
                : 'bg-white/90 text-gray-400 border border-gray-200'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${showSaleLayer ? 'bg-blue-400' : 'bg-gray-300'}`} />
            🏠 Venda
          </button>
          <button
            onClick={() => setShowAuctionLayer(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all ${
              showAuctionLayer
                ? 'text-[#1B2B5B]'
                : 'bg-white/90 text-gray-400 border border-gray-200'
            }`}
            style={showAuctionLayer ? { background: 'linear-gradient(135deg, #C9A84C, #e6c96a)' } : {}}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${showAuctionLayer ? 'bg-yellow-600' : 'bg-gray-300'}`} />
            🔨 Leilão
            {auctions.length > 0 && showAuctionLayer && (
              <span className="ml-0.5 bg-[#1B2B5B] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{auctions.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* Auction Detail Card — shown when a golden pin is clicked */}
      {selectedAuction && (
        <div className="absolute top-0 right-0 bottom-0 z-20 w-80 bg-white shadow-2xl border-l overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 z-10 px-4 py-3 border-b" style={{ background: 'linear-gradient(135deg, #C9A84C, #e6c96a)' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1B2B5B] uppercase tracking-wide">🏛️ Leilão — {sourceLabel(selectedAuction.source)}</span>
              <button onClick={() => setSelectedAuction(null)} className="w-6 h-6 flex items-center justify-center rounded-full bg-[#1B2B5B]/20 text-[#1B2B5B] hover:bg-[#1B2B5B]/30">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Title */}
            <div>
              <h3 className="font-bold text-gray-800 text-sm leading-tight">{selectedAuction.title}</h3>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {selectedAuction.neighborhood && `${selectedAuction.neighborhood}, `}{selectedAuction.city}/{selectedAuction.state}
              </p>
            </div>

            {/* Valores */}
            <div className="bg-gray-50 rounded-xl p-3 space-y-2">
              {selectedAuction.appraisalValue && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Avaliação</span>
                  <span className="line-through text-gray-400">{fmt(Number(selectedAuction.appraisalValue))}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-gray-700 font-medium">Lance Mínimo</span>
                <span className="text-lg font-bold" style={{ color: '#1B2B5B' }}>{selectedAuction.minimumBid ? fmt(Number(selectedAuction.minimumBid)) : '—'}</span>
              </div>
              {selectedAuction.discountPercent && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Desconto</span>
                  <span className="font-bold text-red-600">-{selectedAuction.discountPercent}%</span>
                </div>
              )}
            </div>

            {/* Cálculo de ROI */}
            {selectedAuction.minimumBid && (
              <div className="rounded-xl p-3 space-y-2" style={{ backgroundColor: '#f0f7ff' }}>
                <h4 className="text-xs font-bold text-[#1B2B5B] uppercase tracking-wide">📊 Cálculo de ROI</h4>
                {(() => {
                  const bid = Number(selectedAuction.minimumBid)
                  const appr = selectedAuction.appraisalValue ? Number(selectedAuction.appraisalValue) : bid * 1.5
                  const itbi = bid * 0.03
                  const registry = bid * 0.015
                  const lawyer = bid * 0.05
                  const eviction = selectedAuction.occupation === 'OCUPADO' ? Math.max(bid * 0.02, 5000) : 0
                  const totalCost = itbi + registry + lawyer + eviction
                  const totalInvestment = bid + totalCost
                  const profit = appr - totalInvestment
                  const roi = (profit / totalInvestment * 100)
                  return (
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between"><span className="text-gray-600">ITBI (3%)</span><span>{fmt(itbi)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Registro</span><span>{fmt(registry)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Advogado</span><span>{fmt(lawyer)}</span></div>
                      {eviction > 0 && <div className="flex justify-between"><span className="text-gray-600">Desocupação</span><span>{fmt(eviction)}</span></div>}
                      <div className="flex justify-between border-t pt-1.5 font-semibold"><span>Investimento Total</span><span>{fmt(totalInvestment)}</span></div>
                      <div className="flex justify-between font-bold text-sm">
                        <span>Lucro Potencial</span>
                        <span className={profit > 0 ? 'text-green-600' : 'text-red-600'}>{fmt(profit)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-sm">
                        <span>ROI</span>
                        <span className={roi > 0 ? 'text-green-600' : 'text-red-600'}>{roi.toFixed(1)}%</span>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Score de Oportunidade */}
            {selectedAuction.opportunityScore && (
              <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                <div>
                  <div className="text-xs text-gray-500">Score de Oportunidade</div>
                  <div className={`text-xl font-bold ${
                    selectedAuction.opportunityScore >= 80 ? 'text-green-600' :
                    selectedAuction.opportunityScore >= 60 ? 'text-yellow-600' : 'text-red-500'
                  }`}>
                    {selectedAuction.opportunityScore}/100
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                  selectedAuction.opportunityScore >= 80 ? 'bg-green-100 text-green-700' :
                  selectedAuction.opportunityScore >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                }`}>
                  {selectedAuction.opportunityScore >= 80 ? 'Ótima' : selectedAuction.opportunityScore >= 60 ? 'Boa' : 'Risco'}
                </div>
              </div>
            )}

            {/* Risco Jurídico */}
            <div className="rounded-xl p-3 space-y-2" style={{ backgroundColor: '#fffbeb' }}>
              <h4 className="text-xs font-bold text-yellow-800 uppercase tracking-wide">⚖️ Risco Jurídico</h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${selectedAuction.occupation === 'DESOCUPADO' ? 'bg-green-500' : selectedAuction.occupation === 'OCUPADO' ? 'bg-red-500' : 'bg-gray-400'}`} />
                  <span className="text-gray-700">Ocupação: <strong>{selectedAuction.occupation === 'DESOCUPADO' ? 'Desocupado ✓' : selectedAuction.occupation === 'OCUPADO' ? 'Ocupado — risco de ação de despejo' : 'Não informado'}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${selectedAuction.financingAvailable ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className="text-gray-700">Financiamento: <strong>{selectedAuction.financingAvailable ? 'Aceita ✓' : 'Não aceita'}</strong></span>
                </div>
                <p className="text-[10px] text-yellow-700 mt-1 leading-relaxed">
                  Recomendamos consultar um advogado especializado antes de arrematar. Verifique ônus, dívidas de IPTU/condomínio e processos judiciais pendentes.
                </p>
              </div>
            </div>

            {/* Características */}
            <div className="flex gap-3 text-xs text-gray-600">
              {selectedAuction.totalArea && <span className="flex items-center gap-1"><Maximize className="w-3 h-3" />{selectedAuction.totalArea}m²</span>}
              {selectedAuction.bedrooms > 0 && <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" />{selectedAuction.bedrooms} quartos</span>}
            </div>

            {/* Comparador Visual de Vizinhança */}
            <div className="rounded-xl p-3 space-y-2 border border-blue-100" style={{ backgroundColor: '#f7faff' }}>
              <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wide">🏘️ Vizinhos no Mercado</h4>
              {loadingNeighbors ? (
                <div className="flex items-center justify-center py-3">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : neighbors.length === 0 ? (
                <p className="text-[10px] text-gray-400">Nenhum imóvel convencional encontrado neste bairro para comparação.</p>
              ) : (
                <>
                  {/* Preço/m² comparison */}
                  {(() => {
                    const avgM2 = neighbors.reduce((a, n) => a + n.priceM2, 0) / neighbors.length
                    const auctionM2 = selectedAuction.minimumBid && selectedAuction.totalArea && selectedAuction.totalArea > 0
                      ? Number(selectedAuction.minimumBid) / selectedAuction.totalArea
                      : null
                    const saving = auctionM2 && avgM2 ? ((avgM2 - auctionM2) / avgM2 * 100) : null
                    return (
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div className="bg-white rounded-lg p-2 text-center border">
                          <div className="text-[10px] text-gray-500">Leilão /m²</div>
                          <div className="text-sm font-bold" style={{ color: '#C9A84C' }}>
                            {auctionM2 ? fmt(auctionM2) : '—'}
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-2 text-center border">
                          <div className="text-[10px] text-gray-500">Mercado /m²</div>
                          <div className="text-sm font-bold text-blue-700">
                            {fmt(avgM2)}
                          </div>
                        </div>
                        {saving && saving > 0 && (
                          <div className="col-span-2 bg-green-50 rounded-lg p-1.5 text-center">
                            <span className="text-xs font-bold text-green-700">
                              Economia de {saving.toFixed(0)}% vs mercado convencional
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })()}

                  {/* Lista de vizinhos */}
                  <div className="space-y-1 max-h-28 overflow-y-auto">
                    {neighbors.slice(0, 5).map((n, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] border-b border-gray-100 pb-1">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                          <span className="truncate text-gray-600">{n.title}</span>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <span className="font-semibold text-gray-800">{fmt(n.price)}</span>
                          <span className="text-gray-400 ml-1">{fmt(n.priceM2)}/m²</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-blue-600 text-center">
                    {neighbors.length} imóveis à venda no mesmo bairro
                  </p>
                </>
              )}
            </div>

            {/* Spacer for sticky CTAs */}
            <div className="h-28 sm:h-0" />
          </div>

          {/* CTAs — sticky bottom for mobile thumb reach */}
          <div className="sticky bottom-0 bg-white border-t p-3 space-y-2 shadow-[0_-4px_12px_rgba(0,0,0,0.1)]">
            <a
              href={`/leiloes/${selectedAuction.slug}`}
              className="block w-full text-center px-4 py-3 rounded-xl font-bold text-sm text-white active:scale-[0.98] transition-transform"
              style={{ backgroundColor: '#1B2B5B' }}
            >
              Ver Detalhes + Edital Completo →
            </a>
            {/* Manual do Investidor via WhatsApp — mensagem personalizada com dados do leilão */}
            <a
              href={(() => {
                const bid = selectedAuction.minimumBid ? fmt(Number(selectedAuction.minimumBid)) : 'a consultar'
                const appr = selectedAuction.appraisalValue ? fmt(Number(selectedAuction.appraisalValue)) : 'não informado'
                const disc = selectedAuction.discountPercent ? `${selectedAuction.discountPercent}%` : 'não calculado'
                const score = selectedAuction.opportunityScore ? `${selectedAuction.opportunityScore}/100` : 'não calculado'
                const msg = `📚 *Manual do Investidor — AgoraEncontrei*\n\n` +
                  `Olá! Tenho interesse no seguinte leilão:\n\n` +
                  `🏠 *Imóvel:* ${selectedAuction.title}\n` +
                  `📍 *Local:* ${selectedAuction.neighborhood || ''}, ${selectedAuction.city}/${selectedAuction.state}\n` +
                  `💰 *Lance mínimo:* ${bid}\n` +
                  `📈 *Avaliação:* ${appr}\n` +
                  `📊 *Desconto real:* ${disc}\n` +
                  `⭐ *Score de oportunidade:* ${score}\n\n` +
                  `Gostaria de receber o Manual do Investidor com:\n` +
                  `• Cálculo completo de ROI\n` +
                  `• Custos de ITBI, registro e escritura\n` +
                  `• Análise de riscos jurídicos\n` +
                  `• Passo a passo para arrematação\n\n` +
                  `Link: https://agoraencontrei.com.br/leiloes/${selectedAuction.slug}`
                return `https://wa.me/5516981010004?text=${encodeURIComponent(msg)}`
              })()}
              target="_blank" rel="noopener noreferrer"
              className="block w-full text-center px-4 py-3.5 rounded-xl font-bold text-sm active:scale-[0.98] transition-transform"
              style={{ backgroundColor: '#25D366', color: 'white' }}
            >
              📚 Receber Manual do Investidor via WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* Results panel - shown when neighborhoods are selected */}
      {selectedNeighborhoods.length > 0 && (
        <div
          className="absolute bottom-0 left-0 right-0 z-10 bg-white rounded-t-2xl shadow-2xl"
          style={{ maxHeight: '55%', overflowY: 'auto' }}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                {totalInPolygon > 0 ? `${totalInPolygon} imóvel${totalInPolygon !== 1 ? 'is' : ''} na área` : 'Imóveis selecionados'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {selectedNeighborhoods.slice(0, 2).join(', ')}
                {selectedNeighborhoods.length > 2 ? ` +${selectedNeighborhoods.length - 2} bairros` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {properties.length > 0 && (
                <button
                  onClick={goToListings}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:scale-105 transition-all"
                  style={{ background: 'linear-gradient(135deg, #C9A84C, #e6c96a)', color: '#1B2B5B' }}
                >
                  <Search className="w-3.5 h-3.5" />
                  Ver todos os imóveis →
                </button>
              )}
              <button onClick={() => setSelectedNeighborhoods([])} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Properties grid */}
          {loadingProps ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#1B2B5B] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              Nenhum imóvel encontrado nesta área
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
              {properties.map(p => (
                <a
                  key={p.id}
                  href={`/imoveis/${p.slug}`}
                  className="group block bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all"
                >
                  <div className="relative h-28 overflow-hidden" style={{ backgroundColor: '#f0ece4' }}>
                    {isRealImage(p.coverImage) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.coverImage!}
                        alt={p.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center opacity-20">🏠</div>
                    )}
                    <span
                      className="absolute top-1.5 left-1.5 text-xs font-bold px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: p.purpose === 'RENT' ? '#1B2B5B' : p.purpose === 'AUCTION' ? '#C9A84C' : '#C9A84C', color: p.purpose === 'RENT' ? 'white' : '#1B2B5B' }}
                    >
                      {purposeLabel(p.purpose)}
                    </span>
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight">{p.title}</p>
                    {p.neighborhood && (
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-0.5">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {p.neighborhood}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
                      {p.bedrooms > 0 && <span className="flex items-center gap-0.5"><BedDouble className="w-3 h-3" />{p.bedrooms}</span>}
                      {p.totalArea && <span className="flex items-center gap-0.5"><Maximize className="w-3 h-3" />{p.totalArea}m²</span>}
                    </div>
                    <p className="text-sm font-bold mt-1.5" style={{ color: '#1B2B5B' }}>
                      {p.purpose === 'RENT' && p.priceRent
                        ? `${fmt(p.priceRent)}/mês`
                        : p.price
                        ? fmt(p.price)
                        : 'Consulte'}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Attribution */}
      <div className="absolute bottom-1 right-1 z-20 text-[10px] text-gray-500 bg-white/80 px-1 rounded">
        © OpenStreetMap contributors
      </div>
    </div>
  )
}

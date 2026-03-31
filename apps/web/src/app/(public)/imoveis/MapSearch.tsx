'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { X, PenLine, Trash2, Search, MapPin, BedDouble, Maximize } from 'lucide-react'
import Image from 'next/image'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'
const FRANCA_CENTER: [number, number] = [-20.5394, -47.4008]
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
  return p
}

interface Props {
  initialPurpose?: string
  initialCity?: string
  initialMaxPrice?: string
  initialBedrooms?: string
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

export function MapSearch({ initialPurpose, initialCity, initialMaxPrice, initialBedrooms }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const polygonRef = useRef<any>(null)
  const drawingPointsRef = useRef<[number, number][]>([])
  const tempLineRef = useRef<any>(null)
  const tempMarkersRef = useRef<any[]>([])

  const [clusters, setClusters] = useState<(Cluster & { resolvedLat: number; resolvedLng: number })[]>([])
  const [drawing, setDrawing] = useState(false)
  const [polygon, setPolygon] = useState<[number, number][]>([])
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loadingProps, setLoadingProps] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const router = useRouter()

  // Load clusters from API
  useEffect(() => {
    async function loadClusters() {
      try {
        const params = new URLSearchParams()
        if (initialPurpose) params.set('purpose', initialPurpose)
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
    loadClusters()
  }, [initialPurpose])

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    import('leaflet').then(L => {
      // Fix default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!, {
        center: FRANCA_CENTER,
        zoom: 13,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      mapInstance.current = map
      setIsLoaded(true)
    })

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [])

  // Render cluster markers on map
  useEffect(() => {
    if (!isLoaded || !mapInstance.current) return

    import('leaflet').then(L => {
      // Remove old markers
      markersRef.current.forEach(m => m.remove())
      markersRef.current = []

      clusters.forEach(c => {
        if (!c.resolvedLat || !c.resolvedLng) return

        // Custom cluster marker icon
        const isSelected = selectedNeighborhoods.includes(c.neighborhood)
        const icon = L.divIcon({
          className: '',
          html: `<div style="
            display:flex;align-items:center;justify-content:center;
            width:${c.count > 99 ? 52 : 44}px;height:${c.count > 99 ? 52 : 44}px;
            border-radius:50%;
            background:${isSelected ? '#C9A84C' : '#1B2B5B'};
            color:white;font-size:13px;font-weight:700;
            border:3px solid ${isSelected ? '#e6c96a' : 'rgba(255,255,255,0.3)'};
            box-shadow:0 2px 8px rgba(0,0,0,0.3);
            cursor:pointer;
            transition:transform 0.15s;
          ">${c.count}</div>`,
          iconSize: [c.count > 99 ? 52 : 44, c.count > 99 ? 52 : 44],
          iconAnchor: [c.count > 99 ? 26 : 22, c.count > 99 ? 26 : 22],
        })

        const marker = L.marker([c.resolvedLat, c.resolvedLng], { icon })
          .addTo(mapInstance.current)
          .bindPopup(`
            <div style="min-width:160px">
              <p style="font-weight:700;margin:0 0 4px">${c.neighborhood}</p>
              <p style="color:#666;margin:0;font-size:12px">${c.city ?? ''}${c.state ? `, ${c.state}` : ''}</p>
              <p style="color:#1B2B5B;font-weight:600;margin:4px 0 0;font-size:13px">${c.count} imóve${c.count !== 1 ? 'is' : 'l'}</p>
            </div>
          `)
          .on('click', () => {
            if (!drawing) {
              handleNeighborhoodClick(c.neighborhood, c.city)
            }
          })

        markersRef.current.push(marker)
      })
    })
  }, [clusters, isLoaded, selectedNeighborhoods, drawing])

  // Handle drawing mode map clicks
  useEffect(() => {
    if (!isLoaded || !mapInstance.current) return

    const map = mapInstance.current

    function onClick(e: any) {
      if (!drawing) return

      import('leaflet').then(L => {
        const pt: [number, number] = [e.latlng.lat, e.latlng.lng]
        drawingPointsRef.current = [...drawingPointsRef.current, pt]

        // Add vertex marker
        const vm = L.circleMarker(pt, {
          radius: 5,
          color: '#C9A84C',
          fillColor: '#C9A84C',
          fillOpacity: 1,
          weight: 2,
        }).addTo(map)
        tempMarkersRef.current.push(vm)

        // Update temp polyline
        if (tempLineRef.current) tempLineRef.current.remove()
        if (drawingPointsRef.current.length >= 2) {
          tempLineRef.current = L.polyline(drawingPointsRef.current, {
            color: '#C9A84C',
            weight: 2,
            dashArray: '6 4',
          }).addTo(map)
        }

        // Auto-close polygon when clicking near first point (within ~50px)
        if (drawingPointsRef.current.length >= 3) {
          const first = drawingPointsRef.current[0]
          const dx = Math.abs(first[0] - pt[0])
          const dy = Math.abs(first[1] - pt[1])
          if (dx < 0.001 && dy < 0.001) {
            closePolygon()
          }
        }
      })
    }

    function onDblClick(e: any) {
      if (!drawing) return
      e.originalEvent.preventDefault()
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
  }, [drawing, isLoaded])

  function closePolygon() {
    const pts = drawingPointsRef.current
    if (pts.length < 3) return

    import('leaflet').then(L => {
      const map = mapInstance.current
      // Clear temp elements
      if (tempLineRef.current) { tempLineRef.current.remove(); tempLineRef.current = null }
      tempMarkersRef.current.forEach(m => m.remove())
      tempMarkersRef.current = []

      // Remove old polygon
      if (polygonRef.current) { polygonRef.current.remove(); polygonRef.current = null }

      // Draw final polygon
      polygonRef.current = L.polygon(pts, {
        color: '#C9A84C',
        fillColor: '#C9A84C',
        fillOpacity: 0.15,
        weight: 2.5,
      }).addTo(map)

      setPolygon(pts)
      setDrawing(false)
      drawingPointsRef.current = []

      // Find clusters inside polygon
      const inside = clusters.filter(c =>
        c.resolvedLat && c.resolvedLng &&
        pointInPolygon(c.resolvedLat, c.resolvedLng, pts)
      )
      setSelectedNeighborhoods(inside.map(c => c.neighborhood))
    })
  }

  function clearPolygon() {
    if (polygonRef.current) { polygonRef.current.remove(); polygonRef.current = null }
    if (tempLineRef.current) { tempLineRef.current.remove(); tempLineRef.current = null }
    tempMarkersRef.current.forEach(m => m.remove())
    tempMarkersRef.current = []
    drawingPointsRef.current = []
    setPolygon([])
    setSelectedNeighborhoods([])
    setProperties([])
    setDrawing(false)
  }

  function startDrawing() {
    clearPolygon()
    setDrawing(true)
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
    // Fetch all selected neighborhoods
    Promise.all(
      selectedNeighborhoods.map(async n => {
        const params = new URLSearchParams({ search: n, limit: '20' })
        if (initialPurpose) params.set('purpose', initialPurpose)
        if (initialMaxPrice) params.set('maxPrice', initialMaxPrice)
        if (initialBedrooms) params.set('bedrooms', initialBedrooms)
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
    if (selectedNeighborhoods.length === 1) params.set('search', selectedNeighborhoods[0])
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
      {/* Leaflet CSS */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      {/* Map container */}
      <div ref={mapRef} className="absolute inset-0 z-0" />

      {/* Top controls */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-start gap-2 pointer-events-none">
        <div className="flex gap-2 pointer-events-auto">
          {!drawing && polygon.length === 0 && (
            <button
              onClick={startDrawing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg transition-all hover:brightness-110"
              style={{ backgroundColor: '#1B2B5B', color: 'white' }}
            >
              <PenLine className="w-4 h-4" />
              Desenhar área
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

        {/* Hint */}
        {!drawing && polygon.length === 0 && (
          <div
            className="ml-auto px-3 py-2 rounded-xl text-xs font-medium shadow"
            style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: '#666' }}
          >
            Clique em um bairro para ver imóveis
          </div>
        )}
      </div>

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
              <p className="text-xs text-gray-400 mt-0.5">
                {selectedNeighborhoods.slice(0, 2).join(', ')}
                {selectedNeighborhoods.length > 2 ? ` +${selectedNeighborhoods.length - 2} bairros` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {properties.length > 0 && (
                <button
                  onClick={goToListings}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:brightness-110"
                  style={{ backgroundColor: '#C9A84C', color: '#1B2B5B' }}
                >
                  <Search className="w-3.5 h-3.5" />
                  Ver todos
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
            <div className="text-center py-8 text-gray-400 text-sm">
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
                  <div className="relative h-28 bg-gray-100">
                    {p.coverImage ? (
                      <Image
                        src={p.coverImage}
                        alt={p.title}
                        fill
                        sizes="(max-width:640px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-2xl">🏠</div>
                    )}
                    <span
                      className="absolute top-1.5 left-1.5 text-xs font-bold px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: p.purpose === 'RENT' ? '#1B2B5B' : '#C9A84C', color: p.purpose === 'RENT' ? 'white' : '#1B2B5B' }}
                    >
                      {purposeLabel(p.purpose)}
                    </span>
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight">{p.title}</p>
                    {p.neighborhood && (
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-0.5">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {p.neighborhood}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
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

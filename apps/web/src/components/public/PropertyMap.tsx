'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'

interface Props {
  latitude?: number | null
  longitude?: number | null
  city?: string | null
  neighborhood?: string | null
  state?: string | null
  label?: string
  showExactLocation?: boolean
}

export function PropertyMap({ latitude, longitude, city, neighborhood, state, label, showExactLocation = false }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (mapInstance.current || !mapRef.current) return

    async function initMap() {
      try {
        const maplibregl = (await import('maplibre-gl')).default
        await import('maplibre-gl/dist/maplibre-gl.css')

        let lat = latitude
        let lng = longitude

        // Geocode from address if no coordinates
        if (!lat || !lng) {
          const q = [neighborhood, city, state, 'Brasil'].filter(Boolean).join(', ')
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
            { headers: { 'Accept-Language': 'pt-BR' } }
          )
          const data = await res.json()
          if (data?.[0]) {
            lat = parseFloat(data[0].lat)
            lng = parseFloat(data[0].lon)
          }
        }

        if (!lat || !lng || !mapRef.current) {
          setError(true)
          setLoading(false)
          return
        }

        if (mapInstance.current) return

        const map = new maplibregl.Map({
          container: mapRef.current,
          style: 'https://tiles.openfreemap.org/styles/bright',
          center: [lng, lat],
          zoom: showExactLocation ? 17 : 15,
          pitch: 0,
          attributionControl: true,
        })

        map.scrollZoom.disable()
        map.addControl(new maplibregl.NavigationControl(), 'top-right')

        map.on('load', () => {
          if (showExactLocation) {
            // Exact pin marker
            const el = document.createElement('div')
            el.style.cssText = 'width:28px;height:28px;background:#e07742;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);cursor:pointer;'

            new maplibregl.Marker({ element: el, anchor: 'bottom' })
              .setLngLat([lng, lat])
              .setPopup(new maplibregl.Popup({ offset: 25 }).setText(label ?? 'Localização do imóvel'))
              .addTo(map)
          } else {
            // Privacy circle — ~300m radius
            const center = [lng, lat] as [number, number]
            const points = 64
            const km = 0.3
            const coords: [number, number][] = []
            for (let i = 0; i < points; i++) {
              const angle = (i / points) * 2 * Math.PI
              const dx = km * Math.cos(angle)
              const dy = km * Math.sin(angle)
              coords.push([
                center[0] + (dx / (111.32 * Math.cos((center[1] * Math.PI) / 180))),
                center[1] + (dy / 110.574),
              ])
            }
            coords.push(coords[0]) // Close the circle

            map.addSource('privacy-circle', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: { type: 'Polygon', coordinates: [coords] },
              },
            })

            map.addLayer({
              id: 'privacy-circle-fill',
              type: 'fill',
              source: 'privacy-circle',
              paint: { 'fill-color': '#e07742', 'fill-opacity': 0.15 },
            })

            map.addLayer({
              id: 'privacy-circle-stroke',
              type: 'line',
              source: 'privacy-circle',
              paint: { 'line-color': '#e07742', 'line-width': 2 },
            })

            // Center dot
            map.addSource('center-point', {
              type: 'geojson',
              data: { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: center } },
            })

            map.addLayer({
              id: 'center-dot',
              type: 'circle',
              source: 'center-point',
              paint: {
                'circle-radius': 6,
                'circle-color': '#e07742',
                'circle-opacity': 0.9,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#e07742',
              },
            })
          }

          setLoading(false)
        })

        mapInstance.current = map
      } catch {
        setError(true)
        setLoading(false)
      }
    }

    initMap()

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [latitude, longitude, city, neighborhood, state, showExactLocation, label])

  if (error) {
    return (
      <div className="h-64 rounded-xl bg-gray-100 flex flex-col items-center justify-center gap-2 text-gray-500">
        <MapPin className="w-8 h-8" />
        <p className="text-sm">Localização não disponível</p>
      </div>
    )
  }

  return (
    <div className="relative rounded-xl overflow-hidden border" style={{ borderColor: '#e8e4dc' }}>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100">
          <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <div ref={mapRef} className="h-72 w-full" />
      {!loading && !showExactLocation && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm text-xs text-gray-500 px-3 py-1 rounded-full shadow-sm border border-gray-200 z-10">
          📍 Localização aproximada — {neighborhood ?? city}
        </div>
      )}
    </div>
  )
}

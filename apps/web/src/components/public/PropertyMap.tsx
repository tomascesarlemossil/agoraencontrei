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
}

export function PropertyMap({ latitude, longitude, city, neighborhood, state, label }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (mapInstance.current || !mapRef.current) return

    async function initMap() {
      try {
        // Inject Leaflet CSS via CDN (avoids Next.js CSS module issues)
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link')
          link.id = 'leaflet-css'
          link.rel = 'stylesheet'
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
          document.head.appendChild(link)
          await new Promise(r => setTimeout(r, 100))
        }

        // Dynamically import leaflet (client only)
        const L = (await import('leaflet')).default

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

        // Fix default icon paths for Next.js
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        })

        if (mapInstance.current) return

        const map = L.map(mapRef.current, {
          center: [lat, lng],
          zoom: 15,
          scrollWheelZoom: false,
          zoomControl: true,
        })

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map)

        // Fuzzy circle — ~300m radius to protect exact address
        L.circle([lat, lng], {
          radius: 300,
          color: '#e07742',
          fillColor: '#e07742',
          fillOpacity: 0.2,
          weight: 2,
        }).addTo(map)

        // Small dot at center
        L.circleMarker([lat, lng], {
          radius: 6,
          color: '#e07742',
          fillColor: '#e07742',
          fillOpacity: 0.9,
          weight: 2,
        }).addTo(map)

        mapInstance.current = map
        setLoading(false)
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
  }, [latitude, longitude, city, neighborhood, state])

  if (error) {
    return (
      <div className="h-64 rounded-xl bg-gray-100 flex flex-col items-center justify-center gap-2 text-gray-400">
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
    </div>
  )
}

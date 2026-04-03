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
          zoom: showExactLocation ? 17 : 15,
          scrollWheelZoom: false,
          zoomControl: true,
        })

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map)

        if (showExactLocation) {
          // Pin exato — endereço preciso autorizado pelo proprietário
          const icon = L.divIcon({
            html: `<div style="background:#e07742;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 28],
            className: '',
          })
          L.marker([lat, lng], { icon })
            .addTo(map)
            .bindPopup(label ?? 'Localização do imóvel')
        } else {
          // Círculo de privacidade — ~300m radius para proteger endereço exato
          L.circle([lat, lng], {
            radius: 300,
            color: '#e07742',
            fillColor: '#e07742',
            fillOpacity: 0.15,
            weight: 2,
          }).addTo(map)
          // Ponto central
          L.circleMarker([lat, lng], {
            radius: 6,
            color: '#e07742',
            fillColor: '#e07742',
            fillOpacity: 0.9,
            weight: 2,
          }).addTo(map)
        }

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
  }, [latitude, longitude, city, neighborhood, state, showExactLocation])

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
      {!loading && !showExactLocation && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm text-xs text-gray-500 px-3 py-1 rounded-full shadow-sm border border-gray-200">
          📍 Localização aproximada — {neighborhood ?? city}
        </div>
      )}
    </div>
  )
}

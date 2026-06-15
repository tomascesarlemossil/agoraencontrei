// Geolocalização do visitante (client-side).
// Usado para abrir os mapas (/imoveis e /leilões) já centrados na região de
// quem acessa e priorizar os imóveis/leilões mais próximos.

export interface UserGeo {
  lat: number
  lng: number
}

export interface UserRegion {
  city: string
  state: string // UF (ex.: "SP"), quando identificável
}

// Pede a posição atual ao navegador. Resolve null se indisponível, negado ou
// em timeout — nunca rejeita, para o chamador tratar como "sem localização".
export function getUserGeo(opts?: PositionOptions): Promise<UserGeo | null> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000, ...opts },
    )
  })
}

// Distância em km entre dois pontos (Haversine).
export function haversineKm(a: UserGeo, b: UserGeo): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return 2 * R * Math.asin(Math.sqrt(h))
}

// Coordenada → cidade/UF via Nominatim (reverse). Best-effort: null em falha.
export async function reverseGeocodeRegion(lat: number, lng: number): Promise<UserRegion | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10&accept-language=pt-BR`,
      { headers: { Accept: 'application/json' } },
    )
    if (!res.ok) return null
    const data = await res.json()
    const a = data?.address ?? {}
    const city: string =
      a.city || a.town || a.municipality || a.village || a.city_district || a.county || ''
    // Nominatim devolve o código ISO (ex.: "BR-SP") — extrai a UF.
    const iso: string = a['ISO3166-2-lvl4'] || ''
    const state = iso.includes('-') ? iso.split('-')[1] : ''
    if (!city) return null
    return { city, state }
  } catch {
    return null
  }
}

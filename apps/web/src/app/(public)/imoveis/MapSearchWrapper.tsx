'use client'

import { MapSearch } from './MapSearch'

interface Props {
  initialPurpose?: string
  initialCity?: string
  initialMaxPrice?: string
  initialBedrooms?: string
  initialClusters?: any[]
}

export default function MapSearchWrapper(props: Props) {
  return <MapSearch {...props} />
}

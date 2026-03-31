'use client'

import { MapSearch } from './MapSearch'

interface Props {
  initialPurpose?: string
  initialCity?: string
  initialMaxPrice?: string
  initialBedrooms?: string
}

export default function MapSearchWrapper(props: Props) {
  return <MapSearch {...props} />
}

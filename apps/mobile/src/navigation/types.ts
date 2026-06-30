import type { Property } from '../components/PropertyCard'

export type RootStackParamList = {
  Tabs: undefined
  PropertyDetail: { property: Property }
  Avaliacao: undefined
  Auth: { mode?: 'login' | 'register' } | undefined
}

// Re-export all database types
export type {
  Database,
  Profile,
  UserRole,
  Property,
  PropertyType,
  PropertyPurpose,
  PropertyStatus,
  Client,
  Negotiation,
  NegotiationStage,
  Lead,
  LeadTemperature,
  LeadSource,
  Appointment,
  AppointmentType,
  AppointmentStatus,
  Contract,
  ContractType,
  ContractStatus,
  Commission,
  CommissionStatus,
  Financing,
  FinancingType,
  FinancingStatus,
  MassMessage,
  MassMessageChannel,
  MassMessageStatus,
  MassMessageRecipient,
  PropertyRenewal,
  PropertyValuation,
  SocialMediaPost,
  SocialMediaPlatform,
  SocialMediaStatus,
  CmsBanner,
  CmsPage,
  CmsTestimonial,
  PortalPublication,
  PublicationPortal,
  PublicationStatus,
  ActivityLog,
  ActivityLogAction,
} from './database'

// ============================================================
// FRONTEND-SPECIFIC TYPES
// ============================================================

/** Generic pagination metadata */
export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

/** Paginated response wrapper */
export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

/** Generic API error */
export interface ApiError {
  message: string
  code?: string
  details?: string
  hint?: string
}

/** Select option for UI dropdowns */
export interface SelectOption<T = string> {
  value: T
  label: string
  disabled?: boolean
}

/** File attachment */
export interface FileAttachment {
  id: string
  name: string
  url: string
  size: number
  mime_type: string
  created_at: string
}

/** Notification */
export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  read: boolean
  action_url?: string
  created_at: string
}

/** Dashboard KPI card data */
export interface KPIData {
  title: string
  value: number | string
  change?: number
  changeLabel?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: string
  format?: 'currency' | 'number' | 'percent' | 'text'
}

/** Chart data point */
export interface ChartDataPoint {
  label: string
  value: number
  color?: string
}

/** Property search filters */
export interface PropertyFilters {
  purpose?: import('./database').PropertyPurpose
  type?: import('./database').PropertyType
  city?: string
  neighborhood?: string
  minPrice?: number
  maxPrice?: number
  minArea?: number
  maxArea?: number
  bedrooms?: number
  bathrooms?: number
  garages?: number
  hasPool?: boolean
  hasElevator?: boolean
  isFurnished?: boolean
  isPetFriendly?: boolean
  search?: string
  page?: number
  pageSize?: number
  sortBy?: 'price_asc' | 'price_desc' | 'area_asc' | 'area_desc' | 'newest' | 'oldest'
}

/** Auth user context */
export interface AuthUser {
  id: string
  email: string
  profile: import('./database').Profile | null
}

/** Sidebar navigation item */
export interface NavItem {
  label: string
  href: string
  icon?: string
  badge?: number | string
  children?: NavItem[]
  requiredRole?: import('./database').UserRole[]
}

/** Toast notification */
export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
  duration?: number
}

/** Map marker */
export interface MapMarker {
  id: string
  lat: number
  lng: number
  title: string
  price?: number
  type?: import('./database').PropertyType
}

/** Address from CEP lookup */
export interface CepAddress {
  cep: string
  street: string
  complement: string
  neighborhood: string
  city: string
  state: string
  ibge: string
  gia: string
  ddd: string
  siafi: string
}

/** Property card display data (subset of Property) */
export interface PropertyCard {
  id: string
  code: string
  title: string
  type: import('./database').PropertyType
  purpose: import('./database').PropertyPurpose
  status: import('./database').PropertyStatus
  sale_price: number | null
  rent_price: number | null
  neighborhood: string
  city: string
  state: string
  total_area: number | null
  built_area: number | null
  bedrooms: number | null
  bathrooms: number | null
  garages: number | null
  cover_image_url: string | null
  highlight: boolean
  slug: string | null
}

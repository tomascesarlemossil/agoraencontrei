// ============================================================
// ENUMS
// ============================================================

export type UserRole =
  | 'admin'
  | 'manager'
  | 'broker'
  | 'assistant'
  | 'client'

export type PropertyType =
  | 'house'
  | 'apartment'
  | 'commercial_room'
  | 'commercial_building'
  | 'land'
  | 'rural'
  | 'garage'
  | 'warehouse'
  | 'studio'
  | 'penthouse'
  | 'townhouse'
  | 'farm'
  | 'other'

export type PropertyPurpose =
  | 'sale'
  | 'rent'
  | 'sale_rent'
  | 'season_rent'

export type PropertyStatus =
  | 'available'
  | 'under_negotiation'
  | 'sold'
  | 'rented'
  | 'inactive'
  | 'pending_approval'
  | 'expired'

export type NegotiationStage =
  | 'contact'
  | 'visit_scheduled'
  | 'visit_done'
  | 'proposal'
  | 'counter_proposal'
  | 'accepted'
  | 'documentation'
  | 'signing'
  | 'closed_won'
  | 'closed_lost'
  | 'on_hold'

export type LeadTemperature =
  | 'cold'
  | 'warm'
  | 'hot'
  | 'qualified'
  | 'converted'
  | 'lost'

export type LeadSource =
  | 'website'
  | 'whatsapp'
  | 'phone'
  | 'referral'
  | 'portal_zap'
  | 'portal_viva'
  | 'portal_imovelweb'
  | 'social_instagram'
  | 'social_facebook'
  | 'walk_in'
  | 'email'
  | 'other'

export type ContractType =
  | 'sale'
  | 'rent'
  | 'season_rent'
  | 'intermediation'
  | 'authorization'
  | 'exclusivity'
  | 'administration'

export type ContractStatus =
  | 'draft'
  | 'sent_for_signing'
  | 'partially_signed'
  | 'fully_signed'
  | 'active'
  | 'expired'
  | 'cancelled'
  | 'terminated'

export type AppointmentType =
  | 'visit'
  | 'meeting'
  | 'signing'
  | 'delivery'
  | 'inspection'
  | 'evaluation'
  | 'other'

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'done'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled'

export type FinancingStatus =
  | 'simulation'
  | 'pre_approved'
  | 'documentation'
  | 'bank_analysis'
  | 'approved'
  | 'denied'
  | 'contracted'
  | 'cancelled'

export type FinancingType =
  | 'caixa_sbpe'
  | 'caixa_fgts'
  | 'bradesco'
  | 'itau'
  | 'santander'
  | 'bb'
  | 'inter'
  | 'construtora'
  | 'direct'
  | 'other'

export type CommissionStatus =
  | 'pending'
  | 'partial'
  | 'paid'
  | 'cancelled'

export type MassMessageStatus =
  | 'draft'
  | 'scheduled'
  | 'sending'
  | 'sent'
  | 'cancelled'
  | 'failed'

export type MassMessageChannel =
  | 'whatsapp'
  | 'email'
  | 'sms'

export type SocialMediaPlatform =
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'twitter'

export type SocialMediaStatus =
  | 'draft'
  | 'scheduled'
  | 'published'
  | 'failed'

export type PublicationPortal =
  | 'zap_imoveis'
  | 'viva_real'
  | 'imovelweb'
  | 'olx'
  | 'website'

export type PublicationStatus =
  | 'active'
  | 'paused'
  | 'expired'
  | 'error'

export type ActivityLogAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'view'
  | 'login'
  | 'logout'
  | 'export'
  | 'import'
  | 'send_message'
  | 'status_change'
  | 'assign'
  | 'upload'
  | 'download'

// ============================================================
// TABLE ROW TYPES
// ============================================================

export interface Profile {
  id: string
  user_id: string
  full_name: string
  email: string
  phone: string | null
  phone_whatsapp: string | null
  avatar_url: string | null
  role: UserRole
  creci: string | null
  bio: string | null
  is_active: boolean
  can_login: boolean
  notification_email: boolean
  notification_whatsapp: boolean
  notification_push: boolean
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export interface Property {
  id: string
  code: string
  title: string
  description: string | null
  type: PropertyType
  purpose: PropertyPurpose
  status: PropertyStatus

  // Pricing
  sale_price: number | null
  rent_price: number | null
  condo_fee: number | null
  iptu_annual: number | null
  iptu_monthly: number | null

  // Address
  street: string
  number: string | null
  complement: string | null
  neighborhood: string
  city: string
  state: string
  zip_code: string | null
  country: string
  latitude: number | null
  longitude: number | null

  // Dimensions
  total_area: number | null
  built_area: number | null
  land_area: number | null
  useful_area: number | null
  front_meters: number | null
  depth_meters: number | null

  // Rooms
  bedrooms: number | null
  suites: number | null
  bathrooms: number | null
  half_bathrooms: number | null
  living_rooms: number | null
  dining_rooms: number | null
  kitchens: number | null
  service_rooms: number | null
  offices: number | null
  garages: number | null
  covered_garages: number | null

  // Building details
  floor: number | null
  total_floors: number | null
  units_per_floor: number | null
  total_units: number | null
  year_built: number | null
  year_renovated: number | null

  // Features (booleans)
  has_pool: boolean
  has_garden: boolean
  has_barbecue: boolean
  has_balcony: boolean
  has_terrace: boolean
  has_elevator: boolean
  has_gym: boolean
  has_sauna: boolean
  has_game_room: boolean
  has_party_room: boolean
  has_playground: boolean
  has_sports_court: boolean
  has_tennis_court: boolean
  has_solar_panels: boolean
  has_generator: boolean
  has_security_24h: boolean
  has_concierge: boolean
  has_intercom: boolean
  has_cctv: boolean
  has_alarm: boolean
  has_electric_fence: boolean
  has_air_conditioning: boolean
  has_heating: boolean
  has_laundry: boolean
  has_service_entrance: boolean
  has_furnished: boolean
  has_semi_furnished: boolean
  is_pet_friendly: boolean
  is_accessible: boolean

  // Media
  cover_image_url: string | null
  images: string[]
  video_url: string | null
  virtual_tour_url: string | null
  floor_plan_url: string | null

  // SEO & portals
  slug: string | null
  seo_title: string | null
  seo_description: string | null
  portal_notes: string | null

  // Internal
  owner_id: string | null
  broker_id: string | null
  exclusive: boolean
  exclusive_until: string | null
  highlight: boolean
  notes: string | null
  internal_notes: string | null
  tags: string[]
  views_count: number
  leads_count: number
  visits_count: number

  // Timestamps
  listed_at: string | null
  sold_at: string | null
  rented_at: string | null
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  phone_whatsapp: string | null
  phone_secondary: string | null
  cpf: string | null
  rg: string | null
  cnpj: string | null
  birth_date: string | null
  nationality: string | null
  marital_status: string | null
  profession: string | null
  monthly_income: number | null
  notes: string | null
  tags: string[]
  source: LeadSource | null
  is_buyer: boolean
  is_tenant: boolean
  is_owner: boolean
  is_investor: boolean
  street: string | null
  number: string | null
  complement: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  assigned_broker_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Negotiation {
  id: string
  property_id: string
  client_id: string
  broker_id: string | null
  stage: NegotiationStage
  purpose: PropertyPurpose
  proposed_value: number | null
  counter_value: number | null
  final_value: number | null
  expected_close_date: string | null
  closed_at: string | null
  lost_reason: string | null
  notes: string | null
  internal_notes: string | null
  created_at: string
  updated_at: string
}

export interface Lead {
  id: string
  name: string
  email: string | null
  phone: string | null
  phone_whatsapp: string | null
  message: string | null
  source: LeadSource
  temperature: LeadTemperature
  property_id: string | null
  property_type_interest: PropertyType | null
  purpose_interest: PropertyPurpose | null
  min_price: number | null
  max_price: number | null
  min_area: number | null
  max_area: number | null
  bedrooms_interest: number | null
  neighborhood_interest: string | null
  city_interest: string | null
  notes: string | null
  assigned_broker_id: string | null
  converted_client_id: string | null
  converted_at: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  utm_term: string | null
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: string
  type: AppointmentType
  status: AppointmentStatus
  title: string
  description: string | null
  property_id: string | null
  client_id: string | null
  lead_id: string | null
  negotiation_id: string | null
  broker_id: string | null
  scheduled_at: string
  duration_minutes: number
  location: string | null
  google_calendar_event_id: string | null
  reminder_sent: boolean
  notes: string | null
  cancellation_reason: string | null
  rescheduled_from_id: string | null
  created_at: string
  updated_at: string
}

export interface Contract {
  id: string
  contract_number: string
  type: ContractType
  status: ContractStatus
  property_id: string
  client_id: string
  negotiation_id: string | null
  broker_id: string | null
  contract_value: number
  commission_percentage: number
  commission_value: number
  start_date: string | null
  end_date: string | null
  signed_at: string | null
  notes: string | null
  document_url: string | null
  clicksign_key: string | null
  created_at: string
  updated_at: string
}

export interface Commission {
  id: string
  contract_id: string
  broker_id: string
  total_value: number
  broker_percentage: number
  broker_value: number
  company_percentage: number
  company_value: number
  status: CommissionStatus
  due_date: string | null
  paid_at: string | null
  payment_proof_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Financing {
  id: string
  negotiation_id: string | null
  client_id: string
  property_id: string
  type: FinancingType
  status: FinancingStatus
  property_value: number
  entry_value: number
  financed_value: number
  installments: number | null
  monthly_installment: number | null
  interest_rate_monthly: number | null
  interest_rate_annual: number | null
  fgts_value: number | null
  bank_name: string | null
  bank_contact: string | null
  protocol_number: string | null
  requested_at: string | null
  pre_approved_at: string | null
  approved_at: string | null
  denied_at: string | null
  denial_reason: string | null
  notes: string | null
  documents: string[]
  created_at: string
  updated_at: string
}

export interface MassMessage {
  id: string
  title: string
  subject: string | null
  body: string
  channel: MassMessageChannel
  status: MassMessageStatus
  scheduled_at: string | null
  sent_at: string | null
  total_recipients: number
  sent_count: number
  delivered_count: number
  failed_count: number
  opened_count: number
  clicked_count: number
  segment: string | null
  segment_filters: Record<string, unknown> | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface MassMessageRecipient {
  id: string
  message_id: string
  client_id: string | null
  lead_id: string | null
  name: string
  contact: string
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'opened' | 'clicked'
  sent_at: string | null
  delivered_at: string | null
  opened_at: string | null
  error_message: string | null
  created_at: string
}

export interface PropertyRenewal {
  id: string
  property_id: string
  broker_id: string | null
  previous_expiry: string
  new_expiry: string
  renewal_notes: string | null
  created_at: string
}

export interface PropertyValuation {
  id: string
  property_id: string
  broker_id: string | null
  estimated_value: number
  methodology: string | null
  comparable_properties: string[]
  market_notes: string | null
  valuation_date: string
  valid_until: string | null
  document_url: string | null
  created_at: string
  updated_at: string
}

export interface SocialMediaPost {
  id: string
  platform: SocialMediaPlatform
  status: SocialMediaStatus
  caption: string
  hashtags: string[]
  image_url: string | null
  property_id: string | null
  scheduled_at: string | null
  published_at: string | null
  platform_post_id: string | null
  likes_count: number
  comments_count: number
  shares_count: number
  reach: number
  impressions: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface CmsBanner {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  image_url: string
  cta_text: string | null
  cta_url: string | null
  position: string
  is_active: boolean
  order_index: number
  starts_at: string | null
  ends_at: string | null
  created_at: string
  updated_at: string
}

export interface CmsPage {
  id: string
  slug: string
  title: string
  subtitle: string | null
  content: string | null
  seo_title: string | null
  seo_description: string | null
  og_image_url: string | null
  is_published: boolean
  published_at: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface CmsTestimonial {
  id: string
  author_name: string
  author_role: string | null
  author_avatar_url: string | null
  content: string
  rating: number
  property_id: string | null
  is_active: boolean
  order_index: number
  created_at: string
  updated_at: string
}

export interface PortalPublication {
  id: string
  property_id: string
  portal: PublicationPortal
  status: PublicationStatus
  external_id: string | null
  external_url: string | null
  published_at: string | null
  expires_at: string | null
  last_sync_at: string | null
  views_count: number
  leads_count: number
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface ActivityLog {
  id: string
  user_id: string | null
  user_name: string | null
  action: ActivityLogAction
  resource_type: string
  resource_id: string | null
  resource_label: string | null
  description: string | null
  metadata: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

// ============================================================
// SUPABASE DATABASE GENERIC INTERFACE
// ============================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
      }
      properties: {
        Row: Property
        Insert: Omit<Property, 'id' | 'created_at' | 'updated_at' | 'views_count' | 'leads_count' | 'visits_count'>
        Update: Partial<Omit<Property, 'id' | 'created_at' | 'updated_at'>>
      }
      clients: {
        Row: Client
        Insert: Omit<Client, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Client, 'id' | 'created_at' | 'updated_at'>>
      }
      negotiations: {
        Row: Negotiation
        Insert: Omit<Negotiation, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Negotiation, 'id' | 'created_at' | 'updated_at'>>
      }
      leads: {
        Row: Lead
        Insert: Omit<Lead, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Lead, 'id' | 'created_at' | 'updated_at'>>
      }
      appointments: {
        Row: Appointment
        Insert: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Appointment, 'id' | 'created_at' | 'updated_at'>>
      }
      contracts: {
        Row: Contract
        Insert: Omit<Contract, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Contract, 'id' | 'created_at' | 'updated_at'>>
      }
      commissions: {
        Row: Commission
        Insert: Omit<Commission, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Commission, 'id' | 'created_at' | 'updated_at'>>
      }
      financings: {
        Row: Financing
        Insert: Omit<Financing, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Financing, 'id' | 'created_at' | 'updated_at'>>
      }
      mass_messages: {
        Row: MassMessage
        Insert: Omit<MassMessage, 'id' | 'created_at' | 'updated_at' | 'sent_count' | 'delivered_count' | 'failed_count' | 'opened_count' | 'clicked_count'>
        Update: Partial<Omit<MassMessage, 'id' | 'created_at' | 'updated_at'>>
      }
      mass_message_recipients: {
        Row: MassMessageRecipient
        Insert: Omit<MassMessageRecipient, 'id' | 'created_at'>
        Update: Partial<Omit<MassMessageRecipient, 'id' | 'created_at'>>
      }
      property_renewals: {
        Row: PropertyRenewal
        Insert: Omit<PropertyRenewal, 'id' | 'created_at'>
        Update: Partial<Omit<PropertyRenewal, 'id' | 'created_at'>>
      }
      property_valuations: {
        Row: PropertyValuation
        Insert: Omit<PropertyValuation, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<PropertyValuation, 'id' | 'created_at' | 'updated_at'>>
      }
      social_media_posts: {
        Row: SocialMediaPost
        Insert: Omit<SocialMediaPost, 'id' | 'created_at' | 'updated_at' | 'likes_count' | 'comments_count' | 'shares_count' | 'reach' | 'impressions'>
        Update: Partial<Omit<SocialMediaPost, 'id' | 'created_at' | 'updated_at'>>
      }
      cms_banners: {
        Row: CmsBanner
        Insert: Omit<CmsBanner, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<CmsBanner, 'id' | 'created_at' | 'updated_at'>>
      }
      cms_pages: {
        Row: CmsPage
        Insert: Omit<CmsPage, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<CmsPage, 'id' | 'created_at' | 'updated_at'>>
      }
      cms_testimonials: {
        Row: CmsTestimonial
        Insert: Omit<CmsTestimonial, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<CmsTestimonial, 'id' | 'created_at' | 'updated_at'>>
      }
      portal_publications: {
        Row: PortalPublication
        Insert: Omit<PortalPublication, 'id' | 'created_at' | 'updated_at' | 'views_count' | 'leads_count'>
        Update: Partial<Omit<PortalPublication, 'id' | 'created_at' | 'updated_at'>>
      }
      activity_logs: {
        Row: ActivityLog
        Insert: Omit<ActivityLog, 'id' | 'created_at'>
        Update: never
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
      property_type: PropertyType
      property_purpose: PropertyPurpose
      property_status: PropertyStatus
      negotiation_stage: NegotiationStage
      lead_temperature: LeadTemperature
      lead_source: LeadSource
      contract_type: ContractType
      contract_status: ContractStatus
      appointment_type: AppointmentType
      appointment_status: AppointmentStatus
      financing_status: FinancingStatus
      financing_type: FinancingType
      commission_status: CommissionStatus
      mass_message_status: MassMessageStatus
      mass_message_channel: MassMessageChannel
      social_media_platform: SocialMediaPlatform
      social_media_status: SocialMediaStatus
      publication_portal: PublicationPortal
      publication_status: PublicationStatus
      activity_log_action: ActivityLogAction
    }
    CompositeTypes: Record<string, never>
  }
}

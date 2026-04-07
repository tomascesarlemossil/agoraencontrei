import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Client, LeadSource, PropertyType, PropertyPurpose, Property } from '@/types'

// ============================================================
// TYPES
// ============================================================

export interface ClientFilters {
  search?: string
  is_buyer?: boolean
  is_tenant?: boolean
  is_owner?: boolean
  is_investor?: boolean
  cidade?: string
  assigned_broker_id?: string
  page?: number
  limit?: number
  sort?: 'nome_asc' | 'nome_desc' | 'mais_recente' | 'mais_antigo'
}

export interface CreateClientData {
  full_name: string
  email?: string
  phone?: string
  phone_whatsapp?: string
  phone_secondary?: string
  cpf?: string
  rg?: string
  cnpj?: string
  birth_date?: string
  nationality?: string
  marital_status?: string
  profession?: string
  monthly_income?: number
  notes?: string
  tags?: string[]
  source?: LeadSource
  is_buyer?: boolean
  is_tenant?: boolean
  is_owner?: boolean
  is_investor?: boolean
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  zip_code?: string
  assigned_broker_id?: string
}

export type UpdateClientData = Partial<CreateClientData>

export interface ClientMatchResult {
  property: Property
  score: number
  matchReasons: string[]
}

// ============================================================
// QUERY KEYS
// ============================================================

export const clientKeys = {
  all: ['clients'] as const,
  lists: () => [...clientKeys.all, 'list'] as const,
  list: (filters: ClientFilters) => [...clientKeys.lists(), filters] as const,
  details: () => [...clientKeys.all, 'detail'] as const,
  detail: (id: string) => [...clientKeys.details(), id] as const,
  matches: (clientId: string) => [...clientKeys.all, 'matches', clientId] as const,
}

// ============================================================
// HOOKS
// ============================================================

/**
 * Fetches a paginated, filtered list of clients.
 */
export function useClients(filters: ClientFilters = {}) {
  return useQuery({
    queryKey: clientKeys.list(filters),
    queryFn: async () => {
      const {
        search,
        is_buyer,
        is_tenant,
        is_owner,
        is_investor,
        cidade,
        assigned_broker_id,
        page = 1,
        limit = 20,
        sort = 'mais_recente',
      } = filters

      let query = supabase
        .from('clients')
        .select('*', { count: 'exact' })
        .eq('is_active', true)

      // Text search across name, email, phone, CPF
      if (search) {
        query = query.or(
          `full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,cpf.ilike.%${search}%`
        )
      }

      if (is_buyer != null) query = query.eq('is_buyer', is_buyer)
      if (is_tenant != null) query = query.eq('is_tenant', is_tenant)
      if (is_owner != null) query = query.eq('is_owner', is_owner)
      if (is_investor != null) query = query.eq('is_investor', is_investor)
      if (cidade) query = query.ilike('city', `%${cidade}%`)
      if (assigned_broker_id) query = query.eq('assigned_broker_id', assigned_broker_id)

      // Sorting
      switch (sort) {
        case 'nome_asc':
          query = query.order('full_name', { ascending: true })
          break
        case 'nome_desc':
          query = query.order('full_name', { ascending: false })
          break
        case 'mais_antigo':
          query = query.order('created_at', { ascending: true })
          break
        case 'mais_recente':
        default:
          query = query.order('created_at', { ascending: false })
          break
      }

      // Pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {
        throw new Error(`Erro ao buscar clientes: ${error.message}`)
      }

      return {
        data: (data ?? []) as Client[],
        total: count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
      }
    },
    placeholderData: (prev) => prev,
  })
}

/**
 * Fetches a single client by ID.
 */
export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: clientKeys.detail(id ?? ''),
    enabled: Boolean(id),
    queryFn: async () => {
      if (!id) throw new Error('ID do cliente obrigatório')

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw new Error(`Cliente não encontrado: ${error.message}`)
      return data as Client
    },
  })
}

/**
 * Mutation to create a new client.
 */
export function useCreateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateClientData) => {
      const { data, error } = await supabase
        .from('clients')
        .insert({ ...payload, is_active: true })
        .select()
        .single()

      if (error) throw new Error(`Erro ao criar cliente: ${error.message}`)
      return data as Client
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() })
    },
  })
}

/**
 * Mutation to update an existing client.
 */
export function useUpdateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateClientData & { id: string }) => {
      const { data, error } = await supabase
        .from('clients')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw new Error(`Erro ao atualizar cliente: ${error.message}`)
      return data as Client
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() })
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(data.id) })
    },
  })
}

/**
 * Mutation to delete (soft-delete) a client.
 */
export function useDeleteClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clients')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw new Error(`Erro ao excluir cliente: ${error.message}`)
      return id
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() })
      queryClient.removeQueries({ queryKey: clientKeys.detail(id) })
    },
  })
}

/**
 * Fetches properties that match a client's preferences.
 * Reads the client's interest fields and queries matching properties.
 */
export function useClientMatches(clientId: string | undefined) {
  return useQuery({
    queryKey: clientKeys.matches(clientId ?? ''),
    enabled: Boolean(clientId),
    queryFn: async (): Promise<ClientMatchResult[]> => {
      if (!clientId) throw new Error('ID do cliente obrigatório')

      // Fetch client preferences
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select(
          'is_buyer, is_tenant, property_type_interest, min_price, max_price, min_area, max_area, bedrooms_interest, city_interest, neighborhood_interest'
        )
        .eq('id', clientId)
        .single()

      if (clientError) throw new Error(`Erro ao buscar cliente: ${clientError.message}`)

      // Build property query based on preferences
      let query = supabase
        .from('properties')
        .select('*')
        .eq('status', 'available')
        .limit(20)

      const typedClient = client as {
        is_buyer: boolean
        is_tenant: boolean
        property_type_interest: PropertyType | null
        min_price: number | null
        max_price: number | null
        min_area: number | null
        max_area: number | null
        bedrooms_interest: number | null
        city_interest: string | null
        neighborhood_interest: string | null
      }

      if (typedClient.is_buyer && !typedClient.is_tenant) {
        query = query.in('purpose', ['sale', 'sale_rent'])
      } else if (typedClient.is_tenant && !typedClient.is_buyer) {
        query = query.in('purpose', ['rent', 'sale_rent', 'season_rent'])
      }

      if (typedClient.property_type_interest) {
        query = query.eq('type', typedClient.property_type_interest)
      }

      if (typedClient.max_price != null) {
        query = query.or(
          `sale_price.lte.${typedClient.max_price},rent_price.lte.${typedClient.max_price}`
        )
      }

      if (typedClient.min_area != null) {
        query = query.gte('total_area', typedClient.min_area)
      }

      if (typedClient.bedrooms_interest != null) {
        query = query.gte('bedrooms', typedClient.bedrooms_interest)
      }

      if (typedClient.city_interest) {
        query = query.ilike('city', `%${typedClient.city_interest}%`)
      }

      const { data: properties, error: propError } = await query

      if (propError) throw new Error(`Erro ao buscar imóveis compatíveis: ${propError.message}`)

      // Score each property by how many preferences it matches
      return ((properties ?? []) as Property[]).map((property) => {
        const matchReasons: string[] = []
        let score = 0

        if (
          typedClient.property_type_interest &&
          property.type === typedClient.property_type_interest
        ) {
          score += 30
          matchReasons.push('Tipo de imóvel')
        }

        const price = property.sale_price ?? property.rent_price
        if (typedClient.min_price != null && typedClient.max_price != null && price != null) {
          if (price >= typedClient.min_price && price <= typedClient.max_price) {
            score += 25
            matchReasons.push('Faixa de preço')
          }
        }

        if (
          typedClient.bedrooms_interest != null &&
          property.bedrooms != null &&
          property.bedrooms >= typedClient.bedrooms_interest
        ) {
          score += 20
          matchReasons.push('Número de quartos')
        }

        if (
          typedClient.city_interest &&
          property.city.toLowerCase().includes(typedClient.city_interest.toLowerCase())
        ) {
          score += 15
          matchReasons.push('Cidade')
        }

        if (
          typedClient.neighborhood_interest &&
          property.neighborhood
            .toLowerCase()
            .includes(typedClient.neighborhood_interest.toLowerCase())
        ) {
          score += 10
          matchReasons.push('Bairro')
        }

        return { property, score, matchReasons }
      })
        .sort((a, b) => b.score - a.score)
    },
    staleTime: 1000 * 60 * 5,
  })
}

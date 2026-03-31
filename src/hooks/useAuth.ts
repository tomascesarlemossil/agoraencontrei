/**
 * Re-exports useAuth from AuthContext and adds focused helper hooks.
 * Import from here rather than directly from the context for a cleaner API.
 */

import { useAuth as useAuthContext } from '@/contexts/AuthContext'
import type { Profile, UserRole } from '@/types'
import type { User } from '@supabase/supabase-js'

// Re-export the main hook for convenience
export { useAuth } from '@/contexts/AuthContext'

// ============================================================
// TYPES
// ============================================================

export interface CurrentUser {
  user: User
  profile: Profile | null
  role: UserRole | null
}

// ============================================================
// HELPER HOOKS
// ============================================================

/**
 * Returns the authenticated user together with their profile and role.
 * Throws if called outside of <AuthProvider> or when no user is logged in.
 */
export function useCurrentUser(): CurrentUser {
  const { user, profile, role } = useAuthContext()

  if (!user) {
    throw new Error('useCurrentUser must be called inside a protected route (user is not authenticated)')
  }

  return { user, profile, role }
}

/**
 * Returns true when the current user has the "admin" role.
 * Safe to call even when no user is logged in (returns false).
 */
export function useIsAdmin(): boolean {
  const { isAdmin } = useAuthContext()
  return isAdmin
}

/**
 * Returns true when the current user has the "broker", "manager", or "admin" role.
 * Safe to call even when no user is logged in (returns false).
 */
export function useIsBroker(): boolean {
  const { isBroker } = useAuthContext()
  return isBroker
}

/**
 * Returns true when the current user has the "manager" or "admin" role.
 * Safe to call even when no user is logged in (returns false).
 */
export function useIsManager(): boolean {
  const { isManager } = useAuthContext()
  return isManager
}

/**
 * Returns true while the auth state is being initialized (e.g., on first load).
 */
export function useAuthLoading(): boolean {
  const { loading } = useAuthContext()
  return loading
}

/**
 * Returns true when a user is authenticated.
 */
export function useIsAuthenticated(): boolean {
  const { user } = useAuthContext()
  return user !== null
}

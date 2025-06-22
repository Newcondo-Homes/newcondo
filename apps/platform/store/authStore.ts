// apps/platform/store/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Role, VerificationStatus } from '@newcondo/db'

interface AuthState {
  user: User | null
  isLoading: boolean
  lastActivity: number
  
  // Actions
  setUser: (user: User) => void
  clearUser: () => void
  setLoading: (loading: boolean) => void
  updateUser: (updates: Partial<User>) => void
  updateLastActivity: () => void
  
  // Getters
  isAuthenticated: () => boolean
  hasRole: (role: Role) => boolean
  isVerified: () => boolean
  canListProperties: () => boolean
  canRentProperties: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      lastActivity: Date.now(),

      setUser: (user) => {
        set({ 
          user,
          lastActivity: Date.now()
        })
      },

      clearUser: () => {
        set({ 
          user: null,
          isLoading: false,
          lastActivity: Date.now()
        })
      },

      setLoading: (isLoading) => {
        set({ isLoading })
      },

      updateUser: (updates) => {
        const { user } = get()
        if (user) {
          set({ 
            user: { ...user, ...updates },
            lastActivity: Date.now()
          })
        }
      },

      updateLastActivity: () => {
        set({ lastActivity: Date.now() })
      },

      // Getters
      isAuthenticated: () => {
        const { user } = get()
        return !!user
      },

      hasRole: (role) => {
        const { user } = get()
        return user?.role === role
      },

      isVerified: () => {
        const { user } = get()
        return user?.verificationStatus === 'VERIFIED'
      },

      canListProperties: () => {
        const { user } = get()
        if (!user) return false
        
        // Must be verified to list properties
        const isVerified = user.verificationStatus === 'VERIFIED'
        
        // Must be OWNER or AGENT
        const hasListingRole = user.role === 'OWNER' || user.role === 'AGENT'
        
        return isVerified && hasListingRole
      },

      canRentProperties: () => {
        const { user } = get()
        if (!user) return false
        
        // Must be verified to rent properties
        const isVerified = user.verificationStatus === 'VERIFIED'
        
        // Any role can rent (RENTER, OWNER, AGENT)
        return isVerified
      }
    }),
    {
      name: 'newcondo-auth-storage',
      partialize: (state) => ({
        user: state.user,
        lastActivity: state.lastActivity
      }),
      // Clear store if data is older than 7 days
      onRehydrateStorage: () => (state) => {
        if (state?.lastActivity) {
          const daysSinceLastActivity = (Date.now() - state.lastActivity) / (1000 * 60 * 60 * 24)
          if (daysSinceLastActivity > 7) {
            state.clearUser()
          }
        }
      }
    }
  )
)
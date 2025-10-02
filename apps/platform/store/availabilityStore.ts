import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface PropertyAvailability {
  propertyId: string;
  unitId?: string;
  isAvailable: boolean;
  isPaymentLocked: boolean;
  paymentLockExpiry?: Date;
  lastChecked: Date;
  availableFrom?: Date;
  totalUnits?: number; // For multi-family
  availableUnits?: number; // For multi-family
}

export interface AvailabilityState {
  // Availability cache
  availabilityCache: Map<string, PropertyAvailability>;
  
  // UI state
  isCheckingAvailability: boolean;
  availabilityError: string | null;
  
  // Real-time updates
  lastGlobalUpdate: Date | null;
  subscriptions: Set<string>; // Property/unit IDs being watched
  
  // Actions
  setAvailability: (propertyId: string, unitId: string | undefined, availability: PropertyAvailability) => void;
  getAvailability: (propertyId: string, unitId?: string) => PropertyAvailability | null;
  updateAvailability: (propertyId: string, unitId: string | undefined, updates: Partial<PropertyAvailability>) => void;
  removeAvailability: (propertyId: string, unitId?: string) => void;
  setIsCheckingAvailability: (loading: boolean) => void;
  setAvailabilityError: (error: string | null) => void;
  subscribe: (propertyId: string, unitId?: string) => void;
  unsubscribe: (propertyId: string, unitId?: string) => void;
  clearSubscriptions: () => void;
  isSubscribed: (propertyId: string, unitId?: string) => boolean;
  invalidateCache: (propertyId: string, unitId?: string) => void;
  clearOldCache: (maxAge: number) => void;
  setLastGlobalUpdate: (date: Date) => void;
  getAvailabilityKey: (propertyId: string, unitId?: string) => string;
  reset: () => void;
}

const MAX_CACHE_AGE = 5 * 60 * 1000; // 5 minutes

export const useAvailabilityStore = create<AvailabilityState>()(
  devtools(
    persist(
      (set, get) => ({
        availabilityCache: new Map(),
        isCheckingAvailability: false,
        availabilityError: null,
        lastGlobalUpdate: null,
        subscriptions: new Set(),

        getAvailabilityKey: (propertyId: string, unitId?: string) => {
          return unitId ? `${propertyId}-${unitId}` : propertyId;
        },

        setAvailability: (propertyId: string, unitId: string | undefined, availability: PropertyAvailability) => {
          set((state) => {
            const key = get().getAvailabilityKey(propertyId, unitId);
            const newCache = new Map(state.availabilityCache);
            newCache.set(key, {
              ...availability,
              lastChecked: new Date(),
            });
            return {
              availabilityCache: newCache,
              availabilityError: null,
            };
          });
        },

        getAvailability: (propertyId: string, unitId?: string) => {
          const key = get().getAvailabilityKey(propertyId, unitId);
          const availability = get().availabilityCache.get(key);
          
          if (!availability) return null;
          
          // Check if cache is stale
          const now = new Date();
          const lastChecked = new Date(availability.lastChecked);
          const age = now.getTime() - lastChecked.getTime();
          
          if (age > MAX_CACHE_AGE) {
            get().invalidateCache(propertyId, unitId);
            return null;
          }
          
          return availability;
        },

        updateAvailability: (propertyId: string, unitId: string | undefined, updates: Partial<PropertyAvailability>) => {
          set((state) => {
            const key = get().getAvailabilityKey(propertyId, unitId);
            const existing = state.availabilityCache.get(key);
            
            if (!existing) return state;
            
            const newCache = new Map(state.availabilityCache);
            newCache.set(key, {
              ...existing,
              ...updates,
              lastChecked: new Date(),
            });
            
            return { availabilityCache: newCache };
          });
        },

        removeAvailability: (propertyId: string, unitId?: string) => {
          set((state) => {
            const key = get().getAvailabilityKey(propertyId, unitId);
            const newCache = new Map(state.availabilityCache);
            newCache.delete(key);
            return { availabilityCache: newCache };
          });
        },

        setIsCheckingAvailability: (loading: boolean) => {
          set({ isCheckingAvailability: loading });
        },

        setAvailabilityError: (error: string | null) => {
          set({ availabilityError: error });
        },

        subscribe: (propertyId: string, unitId?: string) => {
          set((state) => {
            const key = get().getAvailabilityKey(propertyId, unitId);
            const newSubscriptions = new Set(state.subscriptions);
            newSubscriptions.add(key);
            return { subscriptions: newSubscriptions };
          });
        },

        unsubscribe: (propertyId: string, unitId?: string) => {
          set((state) => {
            const key = get().getAvailabilityKey(propertyId, unitId);
            const newSubscriptions = new Set(state.subscriptions);
            newSubscriptions.delete(key);
            return { subscriptions: newSubscriptions };
          });
        },

        clearSubscriptions: () => {
          set({ subscriptions: new Set() });
        },

        isSubscribed: (propertyId: string, unitId?: string) => {
          const key = get().getAvailabilityKey(propertyId, unitId);
          return get().subscriptions.has(key);
        },

        invalidateCache: (propertyId: string, unitId?: string) => {
          set((state) => {
            const key = get().getAvailabilityKey(propertyId, unitId);
            const newCache = new Map(state.availabilityCache);
            newCache.delete(key);
            return { availabilityCache: newCache };
          });
        },

        clearOldCache: (maxAge: number = MAX_CACHE_AGE) => {
          set((state) => {
            const now = new Date();
            const newCache = new Map(state.availabilityCache);
            
            for (const [key, availability] of newCache.entries()) {
              const lastChecked = new Date(availability.lastChecked);
              const age = now.getTime() - lastChecked.getTime();
              
              if (age > maxAge) {
                newCache.delete(key);
              }
            }
            
            return { availabilityCache: newCache };
          });
        },

        setLastGlobalUpdate: (date: Date) => {
          set({ lastGlobalUpdate: date });
        },

        reset: () => {
          set({
            availabilityCache: new Map(),
            isCheckingAvailability: false,
            availabilityError: null,
            lastGlobalUpdate: null,
            subscriptions: new Set(),
          });
        },
      }),
      {
        name: 'AvailabilityStore',
        partialize: (state) => ({
          availabilityCache: Array.from(state.availabilityCache.entries()),
          lastGlobalUpdate: state.lastGlobalUpdate,
        }),
        onRehydrateStorage: () => (state) => {
          if (state && Array.isArray(state.availabilityCache)) {
            state.availabilityCache = new Map(state.availabilityCache as any);
          }
        },
      }
    ),
    { name: 'AvailabilityStore' }
  )
);
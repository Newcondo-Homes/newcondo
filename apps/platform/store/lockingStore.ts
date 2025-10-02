import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface PropertyLock {
  propertyId: string;
  unitId?: string;
  lockedAt: Date;
  expiresAt: Date;
  lockId: string;
  userId: string;
}

export interface LockingState {
  // Lock status tracking
  activeLocks: Map<string, PropertyLock>;
  lockAttempts: Map<string, number>;
  
  // UI state
  isAcquiringLock: boolean;
  lockError: string | null;
  
  // Actions
  setActiveLock: (propertyId: string, unitId: string | undefined, lock: PropertyLock) => void;
  removeLock: (propertyId: string, unitId?: string) => void;
  clearExpiredLocks: () => void;
  incrementLockAttempt: (propertyId: string, unitId?: string) => void;
  resetLockAttempts: (propertyId: string, unitId?: string) => void;
  setIsAcquiringLock: (loading: boolean) => void;
  setLockError: (error: string | null) => void;
  getLockKey: (propertyId: string, unitId?: string) => string;
  isLocked: (propertyId: string, unitId?: string) => boolean;
  getTimeRemaining: (propertyId: string, unitId?: string) => number | null;
  reset: () => void;
}

const LOCK_ATTEMPT_LIMIT = 3;

export const useLockingStore = create<LockingState>()(
  devtools(
    (set, get) => ({
      activeLocks: new Map(),
      lockAttempts: new Map(),
      isAcquiringLock: false,
      lockError: null,

      getLockKey: (propertyId: string, unitId?: string) => {
        return unitId ? `${propertyId}-${unitId}` : propertyId;
      },

      setActiveLock: (propertyId: string, unitId: string | undefined, lock: PropertyLock) => {
        set((state) => {
          const key = get().getLockKey(propertyId, unitId);
          const newLocks = new Map(state.activeLocks);
          newLocks.set(key, lock);
          return { activeLocks: newLocks, lockError: null };
        });
      },

      removeLock: (propertyId: string, unitId?: string) => {
        set((state) => {
          const key = get().getLockKey(propertyId, unitId);
          const newLocks = new Map(state.activeLocks);
          newLocks.delete(key);
          return { activeLocks: newLocks };
        });
      },

      clearExpiredLocks: () => {
        set((state) => {
          const now = new Date();
          const newLocks = new Map(state.activeLocks);
          
          for (const [key, lock] of newLocks.entries()) {
            if (new Date(lock.expiresAt) <= now) {
              newLocks.delete(key);
            }
          }
          
          return { activeLocks: newLocks };
        });
      },

      incrementLockAttempt: (propertyId: string, unitId?: string) => {
        set((state) => {
          const key = get().getLockKey(propertyId, unitId);
          const newAttempts = new Map(state.lockAttempts);
          const currentAttempts = newAttempts.get(key) || 0;
          
          if (currentAttempts >= LOCK_ATTEMPT_LIMIT) {
            return {
              lockAttempts: newAttempts,
              lockError: 'Maximum lock attempts reached. Please try again later.',
            };
          }
          
          newAttempts.set(key, currentAttempts + 1);
          return { lockAttempts: newAttempts };
        });
      },

      resetLockAttempts: (propertyId: string, unitId?: string) => {
        set((state) => {
          const key = get().getLockKey(propertyId, unitId);
          const newAttempts = new Map(state.lockAttempts);
          newAttempts.delete(key);
          return { lockAttempts: newAttempts };
        });
      },

      setIsAcquiringLock: (loading: boolean) => {
        set({ isAcquiringLock: loading });
      },

      setLockError: (error: string | null) => {
        set({ lockError: error });
      },

      isLocked: (propertyId: string, unitId?: string) => {
        const key = get().getLockKey(propertyId, unitId);
        const lock = get().activeLocks.get(key);
        
        if (!lock) return false;
        
        const now = new Date();
        const expiresAt = new Date(lock.expiresAt);
        
        if (expiresAt <= now) {
          get().removeLock(propertyId, unitId);
          return false;
        }
        
        return true;
      },

      getTimeRemaining: (propertyId: string, unitId?: string) => {
        const key = get().getLockKey(propertyId, unitId);
        const lock = get().activeLocks.get(key);
        
        if (!lock) return null;
        
        const now = new Date();
        const expiresAt = new Date(lock.expiresAt);
        const remaining = expiresAt.getTime() - now.getTime();
        
        return remaining > 0 ? remaining : null;
      },

      reset: () => {
        set({
          activeLocks: new Map(),
          lockAttempts: new Map(),
          isAcquiringLock: false,
          lockError: null,
        });
      },
    }),
    { name: 'LockingStore' }
  )
);
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface QueueItem {
  id: string;
  propertyId: string;
  unitId?: string;
  userId: string;
  position: number;
  estimatedWaitTime: number; // in seconds
  joinedAt: Date;
  expiresAt: Date;
  status: 'waiting' | 'processing' | 'completed' | 'expired' | 'cancelled';
}

export interface QueueState {
  // Queue data
  currentQueue: QueueItem[];
  userQueuePosition: Map<string, QueueItem>;
  
  // UI state
  isJoiningQueue: boolean;
  isLeavingQueue: boolean;
  queueError: string | null;
  
  // Actions
  addToQueue: (item: QueueItem) => void;
  removeFromQueue: (itemId: string) => void;
  updateQueueItem: (itemId: string, updates: Partial<QueueItem>) => void;
  updateQueuePositions: (items: QueueItem[]) => void;
  setIsJoiningQueue: (loading: boolean) => void;
  setIsLeavingQueue: (loading: boolean) => void;
  setQueueError: (error: string | null) => void;
  getUserQueueItem: (userId: string, propertyId: string, unitId?: string) => QueueItem | null;
  getQueueLength: (propertyId: string, unitId?: string) => number;
  getEstimatedWaitTime: (propertyId: string, unitId?: string) => number;
  clearExpiredItems: () => void;
  reset: () => void;
}

const AVERAGE_PROCESSING_TIME = 300; // 5 minutes in seconds

export const useQueueStore = create<QueueState>()(
  devtools(
    (set, get) => ({
      currentQueue: [],
      userQueuePosition: new Map(),
      isJoiningQueue: false,
      isLeavingQueue: false,
      queueError: null,

      addToQueue: (item: QueueItem) => {
        set((state) => {
          const key = `${item.userId}-${item.propertyId}${item.unitId ? `-${item.unitId}` : ''}`;
          const newUserQueue = new Map(state.userQueuePosition);
          newUserQueue.set(key, item);
          
          return {
            currentQueue: [...state.currentQueue, item].sort((a, b) => a.position - b.position),
            userQueuePosition: newUserQueue,
            queueError: null,
          };
        });
      },

      removeFromQueue: (itemId: string) => {
        set((state) => {
          const item = state.currentQueue.find((i) => i.id === itemId);
          const newQueue = state.currentQueue.filter((i) => i.id !== itemId);
          
          const newUserQueue = new Map(state.userQueuePosition);
          if (item) {
            const key = `${item.userId}-${item.propertyId}${item.unitId ? `-${item.unitId}` : ''}`;
            newUserQueue.delete(key);
          }
          
          return {
            currentQueue: newQueue,
            userQueuePosition: newUserQueue,
          };
        });
      },

      updateQueueItem: (itemId: string, updates: Partial<QueueItem>) => {
        set((state) => {
          const newQueue = state.currentQueue.map((item) =>
            item.id === itemId ? { ...item, ...updates } : item
          );
          
          const updatedItem = newQueue.find((i) => i.id === itemId);
          const newUserQueue = new Map(state.userQueuePosition);
          
          if (updatedItem) {
            const key = `${updatedItem.userId}-${updatedItem.propertyId}${updatedItem.unitId ? `-${updatedItem.unitId}` : ''}`;
            newUserQueue.set(key, updatedItem);
          }
          
          return {
            currentQueue: newQueue,
            userQueuePosition: newUserQueue,
          };
        });
      },

      updateQueuePositions: (items: QueueItem[]) => {
        set((state) => {
          const newUserQueue = new Map(state.userQueuePosition);
          
          items.forEach((item) => {
            const key = `${item.userId}-${item.propertyId}${item.unitId ? `-${item.unitId}` : ''}`;
            newUserQueue.set(key, item);
          });
          
          return {
            currentQueue: items.sort((a, b) => a.position - b.position),
            userQueuePosition: newUserQueue,
          };
        });
      },

      setIsJoiningQueue: (loading: boolean) => {
        set({ isJoiningQueue: loading });
      },

      setIsLeavingQueue: (loading: boolean) => {
        set({ isLeavingQueue: loading });
      },

      setQueueError: (error: string | null) => {
        set({ queueError: error });
      },

      getUserQueueItem: (userId: string, propertyId: string, unitId?: string) => {
        const key = `${userId}-${propertyId}${unitId ? `-${unitId}` : ''}`;
        return get().userQueuePosition.get(key) || null;
      },

      getQueueLength: (propertyId: string, unitId?: string) => {
        return get().currentQueue.filter(
          (item) =>
            item.propertyId === propertyId &&
            (unitId ? item.unitId === unitId : true) &&
            item.status === 'waiting'
        ).length;
      },

      getEstimatedWaitTime: (propertyId: string, unitId?: string) => {
        const queueLength = get().getQueueLength(propertyId, unitId);
        return queueLength * AVERAGE_PROCESSING_TIME;
      },

      clearExpiredItems: () => {
        set((state) => {
          const now = new Date();
          const activeQueue = state.currentQueue.filter((item) => {
            const expiresAt = new Date(item.expiresAt);
            return expiresAt > now;
          });
          
          const newUserQueue = new Map(state.userQueuePosition);
          state.currentQueue.forEach((item) => {
            if (new Date(item.expiresAt) <= now) {
              const key = `${item.userId}-${item.propertyId}${item.unitId ? `-${item.unitId}` : ''}`;
              newUserQueue.delete(key);
            }
          });
          
          return {
            currentQueue: activeQueue,
            userQueuePosition: newUserQueue,
          };
        });
      },

      reset: () => {
        set({
          currentQueue: [],
          userQueuePosition: new Map(),
          isJoiningQueue: false,
          isLeavingQueue: false,
          queueError: null,
        });
      },
    }),
    { name: 'QueueStore' }
  )
);
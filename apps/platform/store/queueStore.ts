







import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface ActiveJob {
  id: string;
  jobId: string;
  status: string;
  timeSlotStart?: string;
  timeSlotEnd?: string;
  property: {
    id?: string;
    title: string;
    address: string;
    city: string;
    state?: string;
  };
}

// Types
export interface QueueItem {
  id: string;
  jobId: string;
  agentId?: string;
  position: number;
  joinedAt: Date;
  timeSlotStart?: Date;
  timeSlotEnd?: Date;
  status: 'WAITING' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
  notificationSent?: boolean;
  property: {
    id?: string;
    title: string;
    address: string;
    city: string;
    state?: string;
  };
}

export interface AgentQueueStats {
  totalQueued: number;
  totalActive: number;
  totalCompleted: number;
  averageWaitTime?: number;
  currentPosition?: number;
}

export interface QueueNotification {
  id: string;
  type: 'NEW_JOB' | 'TIME_SLOT_STARTING' | 'TIME_SLOT_EXPIRING' | 'POSITION_CHANGED' | 'JOB_COMPLETED';
  jobId: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface QueueStore {
  // State
  queueItems: QueueItem[];
  myQueueItems: QueueItem[];
  activeJobs: ActiveJob[];
  stats: AgentQueueStats | null;
  notifications: QueueNotification[];
  isLoading: boolean;
  error: string | null;
  
  // Agent location settings
  agentLocation: {
    isAvailable: boolean;
    serviceAreas: string[];
    maxRadius?: number;
    coordinates?: { lat: number; lng: number };
  };
  
  // Actions
  setQueueItems: (items: QueueItem[]) => void;
  setMyQueueItems: (items: QueueItem[]) => void;
  setActiveJobs: (jobs: ActiveJob[]) => void;
  setStats: (stats: AgentQueueStats) => void;
  addQueueItem: (item: QueueItem) => void;
  updateQueueItem: (id: string, updates: Partial<QueueItem>) => void;
  removeQueueItem: (id: string) => void;
  
  // Notification actions
  addNotification: (notification: QueueNotification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  getUnreadCount: () => number;
  
  // Location actions
  setAgentLocation: (location: Partial<QueueStore['agentLocation']>) => void;
  toggleAvailability: () => void;
  
  // Utility actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  getMyPosition: (jobId: string) => number | null;
  isInQueue: (jobId: string) => boolean;
  getActiveTimeSlot: () => QueueItem | null;
  getUpcomingTimeSlot: () => QueueItem | null;
  reset: () => void;
}

const initialAgentLocation = {
  isAvailable: false,
  serviceAreas: [],
  maxRadius: 50, // km
};

export const useQueueStore = create<QueueStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        queueItems: [],
        myQueueItems: [],
        activeJobs: [],
        stats: null,
        notifications: [],
        isLoading: false,
        error: null,
        agentLocation: initialAgentLocation,
        
        // Actions
        setQueueItems: (items) => set({ queueItems: items }),
        
        setMyQueueItems: (items) => set({ myQueueItems: items }),
        
        setActiveJobs: (jobs) => set({ activeJobs: jobs }),
        
        setStats: (stats) => set({ stats }),
        
        addQueueItem: (item) => set((state) => ({
          queueItems: [...state.queueItems, item],
          myQueueItems: [...state.myQueueItems, item],
        })),
        
        updateQueueItem: (id, updates) => set((state) => ({
        queueItems: state.queueItems.map((item) =>
          item.id === id ? { ...item, ...updates } : item
        ),
        myQueueItems: state.myQueueItems.map((item) =>
          item.id === id ? { ...item, ...updates } : item
        ),
        activeJobs: state.activeJobs.map((item) =>
          item.id === id ? { ...item, ...updates } as ActiveJob : item
        ),
})),
  
  removeQueueItem: (id) => set((state) => ({
    queueItems: state.queueItems.filter((item) => item.id !== id),
    myQueueItems: state.myQueueItems.filter((item) => item.id !== id),
    activeJobs: state.activeJobs.filter((item) => item.id !== id),
  })),
  
  // Notification actions
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications].slice(0, 50), // Keep last 50
  })),
  
  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map((notif) =>
      notif.id === id ? { ...notif, read: true } : notif
  ),
})),
markAllNotificationsRead: () => set((state) => ({
  notifications: state.notifications.map((notif) => ({
    ...notif,
    read: true,
  })),
})),

clearNotifications: () => set({ notifications: [] }),

getUnreadCount: () => {
  return get().notifications.filter((n) => !n.read).length;
},

// Location actions
setAgentLocation: (location) => set((state) => ({
  agentLocation: { ...state.agentLocation, ...location },
})),

toggleAvailability: () => set((state) => ({
  agentLocation: {
    ...state.agentLocation,
            isAvailable: !state.agentLocation.isAvailable,
          },
        })),
        
        // Utility actions
        setLoading: (loading) => set({ isLoading: loading }),
        
        setError: (error) => set({ error }),
        
        clearError: () => set({ error: null }),
        
        getMyPosition: (jobId) => {
          const item = get().myQueueItems.find((item) => item.jobId === jobId);
          return item?.position ?? null;
        },
        
        isInQueue: (jobId) => {
          return get().myQueueItems.some((item) => item.jobId === jobId);
        },
        
        getActiveTimeSlot: () => {
          const now = new Date();
          return get().myQueueItems.find((item) => 
            item.status === 'ACTIVE' &&
          item.timeSlotStart &&
          item.timeSlotEnd &&
          new Date(item.timeSlotStart) <= now &&
          new Date(item.timeSlotEnd) > now
        ) ?? null;
      },
      
      getUpcomingTimeSlot: () => {
        const now = new Date();
          const upcoming = get().myQueueItems
          .filter((item) => 
            item.status === 'WAITING' &&
          item.timeSlotStart &&
          new Date(item.timeSlotStart) > now
        )
        .sort((a, b) => 
          new Date(a.timeSlotStart!).getTime() - new Date(b.timeSlotStart!).getTime()
      );
      
      return upcoming[0] ?? null;
    },
    
    reset: () => set({
      queueItems: [],
      myQueueItems: [],
      activeJobs: [],
      stats: null,
      notifications: [],
      isLoading: false,
      error: null,
      agentLocation: initialAgentLocation,
    }),
  }),
  {
    name: 'queue-store',
    partialize: (state) => ({
      agentLocation: state.agentLocation,
      notifications: state.notifications,
    }),
  }
),
{ name: 'QueueStore' }
)
);








// import { create } from 'zustand';
// import { devtools } from 'zustand/middleware';

// export interface QueueItem {
//   id: string;
//   propertyId: string;
//   unitId?: string;
//   userId: string;
//   position: number;
//   estimatedWaitTime: number; // in seconds
//   joinedAt: Date;
//   expiresAt: Date;
//   status: 'waiting' | 'processing' | 'completed' | 'expired' | 'cancelled';
// }

// export interface AgentLocation {
//   isAvailable: boolean;
//   serviceAreas: string[];
//   maxRadius?: number;
//   coordinates?: { lat: number; lng: number };
// }

// export interface QueueState {
//   // Queue data
//   currentQueue: QueueItem[];
//   userQueuePosition: Map<string, QueueItem>;
//   agentLocation: AgentLocation;
  
//   // UI state
//   isJoiningQueue: boolean;
//   isLeavingQueue: boolean;
//   queueError: string | null;
  
//   // Actions
//   addToQueue: (item: QueueItem) => void;
//   setAgentLocation: (location: Partial<AgentLocation>) => void;
//   removeFromQueue: (itemId: string) => void;
//   updateQueueItem: (itemId: string, updates: Partial<QueueItem>) => void;
//   updateQueuePositions: (items: QueueItem[]) => void;
//   setIsJoiningQueue: (loading: boolean) => void;
//   setIsLeavingQueue: (loading: boolean) => void;
//   setQueueError: (error: string | null) => void;
//   getUserQueueItem: (userId: string, propertyId: string, unitId?: string) => QueueItem | null;
//   getQueueLength: (propertyId: string, unitId?: string) => number;
//   getEstimatedWaitTime: (propertyId: string, unitId?: string) => number;
//   clearExpiredItems: () => void;
//   reset: () => void;
// }

// const AVERAGE_PROCESSING_TIME = 300; // 5 minutes in seconds

// export const useQueueStore = create<QueueState>()(
//   devtools(
//     (set, get) => ({
//       currentQueue: [],
//       userQueuePosition: new Map(),
//       isJoiningQueue: false,
//       isLeavingQueue: false,
//       queueError: null,
//       agentLocation: {
//         isAvailable: false,
//         serviceAreas: [],
//         maxRadius: 50,
//       },

//       addToQueue: (item: QueueItem) => {
//         set((state) => {
//           const key = `${item.userId}-${item.propertyId}${item.unitId ? `-${item.unitId}` : ''}`;
//           const newUserQueue = new Map(state.userQueuePosition);
//           newUserQueue.set(key, item);
          
//           return {
//             currentQueue: [...state.currentQueue, item].sort((a, b) => a.position - b.position),
//             userQueuePosition: newUserQueue,
//             queueError: null,
//           };
//         });
//       },

//       setAgentLocation: (location) =>
//         set((state) => ({
//           agentLocation: { ...state.agentLocation, ...location },
//         })),

//       removeFromQueue: (itemId: string) => {
//         set((state) => {
//           const item = state.currentQueue.find((i) => i.id === itemId);
//           const newQueue = state.currentQueue.filter((i) => i.id !== itemId);
          
//           const newUserQueue = new Map(state.userQueuePosition);
//           if (item) {
//             const key = `${item.userId}-${item.propertyId}${item.unitId ? `-${item.unitId}` : ''}`;
//             newUserQueue.delete(key);
//           }
          
//           return {
//             currentQueue: newQueue,
//             userQueuePosition: newUserQueue,
//           };
//         });
//       },

//       updateQueueItem: (itemId: string, updates: Partial<QueueItem>) => {
//         set((state) => {
//           const newQueue = state.currentQueue.map((item) =>
//             item.id === itemId ? { ...item, ...updates } : item
//           );
          
//           const updatedItem = newQueue.find((i) => i.id === itemId);
//           const newUserQueue = new Map(state.userQueuePosition);
          
//           if (updatedItem) {
//             const key = `${updatedItem.userId}-${updatedItem.propertyId}${updatedItem.unitId ? `-${updatedItem.unitId}` : ''}`;
//             newUserQueue.set(key, updatedItem);
//           }
          
//           return {
//             currentQueue: newQueue,
//             userQueuePosition: newUserQueue,
//           };
//         });
//       },

//       updateQueuePositions: (items: QueueItem[]) => {
//         set((state) => {
//           const newUserQueue = new Map(state.userQueuePosition);
          
//           items.forEach((item) => {
//             const key = `${item.userId}-${item.propertyId}${item.unitId ? `-${item.unitId}` : ''}`;
//             newUserQueue.set(key, item);
//           });
          
//           return {
//             currentQueue: items.sort((a, b) => a.position - b.position),
//             userQueuePosition: newUserQueue,
//           };
//         });
//       },

//       setIsJoiningQueue: (loading: boolean) => {
//         set({ isJoiningQueue: loading });
//       },

//       setIsLeavingQueue: (loading: boolean) => {
//         set({ isLeavingQueue: loading });
//       },

//       setQueueError: (error: string | null) => {
//         set({ queueError: error });
//       },

//       getUserQueueItem: (userId: string, propertyId: string, unitId?: string) => {
//         const key = `${userId}-${propertyId}${unitId ? `-${unitId}` : ''}`;
//         return get().userQueuePosition.get(key) || null;
//       },

//       getQueueLength: (propertyId: string, unitId?: string) => {
//         return get().currentQueue.filter(
//           (item) =>
//             item.propertyId === propertyId &&
//             (unitId ? item.unitId === unitId : true) &&
//             item.status === 'waiting'
//         ).length;
//       },

//       getEstimatedWaitTime: (propertyId: string, unitId?: string) => {
//         const queueLength = get().getQueueLength(propertyId, unitId);
//         return queueLength * AVERAGE_PROCESSING_TIME;
//       },

//       clearExpiredItems: () => {
//         set((state) => {
//           const now = new Date();
//           const activeQueue = state.currentQueue.filter((item) => {
//             const expiresAt = new Date(item.expiresAt);
//             return expiresAt > now;
//           });
          
//           const newUserQueue = new Map(state.userQueuePosition);
//           state.currentQueue.forEach((item) => {
//             if (new Date(item.expiresAt) <= now) {
//               const key = `${item.userId}-${item.propertyId}${item.unitId ? `-${item.unitId}` : ''}`;
//               newUserQueue.delete(key);
//             }
//           });
          
//           return {
//             currentQueue: activeQueue,
//             userQueuePosition: newUserQueue,
//           };
//         });
//       },

//       reset: () => {
//         set({
//           currentQueue: [],
//           userQueuePosition: new Map(),
//           isJoiningQueue: false,
//           isLeavingQueue: false,
//           queueError: null,
//         });
//       },
//     }),
//     { name: 'QueueStore' }
//   )
// );




        
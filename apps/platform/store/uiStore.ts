import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Toast notification types
interface Toast {
  id: string;
  title?: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean;
}

// Modal types
interface Modal {
  id: string;
  isOpen: boolean;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
  data?: any;
}

// Loading states for different operations
interface LoadingState {
  properties: boolean;
  search: boolean;
  favorites: boolean;
  comparison: boolean;
  propertyDetails: boolean;
  imageUpload: boolean;
  payment: boolean;
  auth: boolean;
  profile: boolean;
}

// Device and viewport information
interface ViewportState {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLandscape: boolean;
}

// Theme and appearance
interface ThemeState {
  theme: 'light' | 'dark' | 'system';
  primaryColor: string;
  fontSize: 'sm' | 'md' | 'lg';
  reducedMotion: boolean;
}

// Navigation and routing state
interface NavigationState {
  breadcrumbs: Array<{
    label: string;
    href?: string;
    current?: boolean;
  }>;
  previousRoute?: string;
  isNavigating: boolean;
}

// Property listing view preferences
interface PropertyViewPreferences {
  viewType: 'grid' | 'list' | 'map';
  itemsPerPage: 12 | 24 | 48;
  sortBy: 'price' | 'date' | 'popularity' | 'distance';
  sortOrder: 'asc' | 'desc';
  showMapOnSide: boolean;
  gridColumns: 2 | 3 | 4 | 6;
}

// Filter panel state
interface FilterPanelState {
  isOpen: boolean;
  isMobile: boolean;
  activeFilters: number;
  hasChanges: boolean;
}

interface UIState {
  // Loading states
  loading: LoadingState;
  
  // Toast notifications
  toasts: Toast[];
  
  // Modals
  modals: Record<string, Modal>;
  
  // Viewport information
  viewport: ViewportState;
  
  // Theme and appearance
  theme: ThemeState;
  
  // Navigation
  navigation: NavigationState;
  
  // Property view preferences
  propertyView: PropertyViewPreferences;
  
  // Filter panel
  filterPanel: FilterPanelState;
  
  // General UI flags
  sidebarCollapsed: boolean;
  searchFocused: boolean;
  isOnline: boolean;
  lastActivity: Date;
  
  // Actions - Loading
  setLoading: (key: keyof LoadingState, value: boolean) => void;
  setMultipleLoading: (updates: Partial<LoadingState>) => void;
  
  // Actions - Toasts
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  
  // Actions - Modals
  openModal: (id: string, props?: Partial<Modal>) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  isModalOpen: (id: string) => boolean;
  getModalData: (id: string) => any;
  
  // Actions - Viewport
  updateViewport: (viewport: Partial<ViewportState>) => void;
  
  // Actions - Theme
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setPrimaryColor: (color: string) => void;
  setFontSize: (size: 'sm' | 'md' | 'lg') => void;
  toggleReducedMotion: () => void;
  
  // Actions - Navigation
  setBreadcrumbs: (breadcrumbs: NavigationState['breadcrumbs']) => void;
  addBreadcrumb: (breadcrumb: NavigationState['breadcrumbs'][0]) => void;
  setNavigating: (isNavigating: boolean) => void;
  setPreviousRoute: (route: string) => void;
  
  // Actions - Property View
  setViewType: (type: PropertyViewPreferences['viewType']) => void;
  setItemsPerPage: (count: PropertyViewPreferences['itemsPerPage']) => void;
  setSortBy: (sortBy: PropertyViewPreferences['sortBy']) => void;
  setSortOrder: (order: PropertyViewPreferences['sortOrder']) => void;
  toggleMapOnSide: () => void;
  setGridColumns: (columns: PropertyViewPreferences['gridColumns']) => void;
  
  // Actions - Filter Panel
  openFilterPanel: () => void;
  closeFilterPanel: () => void;
  toggleFilterPanel: () => void;
  setFilterPanelMobile: (isMobile: boolean) => void;
  setActiveFiltersCount: (count: number) => void;
  setFilterChanges: (hasChanges: boolean) => void;
  
  // Actions - General
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setSearchFocused: (focused: boolean) => void;
  setOnlineStatus: (isOnline: boolean) => void;
  updateLastActivity: () => void;
  
  // Utility actions
  resetUI: () => void;
  getResponsiveValue: <T>(mobile: T, tablet: T, desktop: T) => T;
}

const initialViewport: ViewportState = {
  width: typeof window !== 'undefined' ? window.innerWidth : 1200,
  height: typeof window !== 'undefined' ? window.innerHeight : 800,
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  isLandscape: true,
};

const initialTheme: ThemeState = {
  theme: 'system',
  primaryColor: '#3B82F6',
  fontSize: 'md',
  reducedMotion: false,
};

const initialPropertyView: PropertyViewPreferences = {
  viewType: 'grid',
  itemsPerPage: 24,
  sortBy: 'date',
  sortOrder: 'desc',
  showMapOnSide: false,
  gridColumns: 6,
};

const initialLoading: LoadingState = {
  properties: false,
  search: false,
  favorites: false,
  comparison: false,
  propertyDetails: false,
  imageUpload: false,
  payment: false,
  auth: false,
  profile: false,
};

const initialNavigation: NavigationState = {
  breadcrumbs: [],
  isNavigating: false,
};

const initialFilterPanel: FilterPanelState = {
  isOpen: false,
  isMobile: false,
  activeFilters: 0,
  hasChanges: false,
};

export const useUIStore = create<UIState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      loading: initialLoading,
      
      toasts: [],
      modals: {},
      viewport: initialViewport,
      theme: initialTheme,
      
      navigation: initialNavigation,
      
      propertyView: initialPropertyView,
      
      filterPanel: initialFilterPanel,
      
      sidebarCollapsed: false,
      searchFocused: false,
      isOnline: true,
      lastActivity: new Date(),

      // Loading actions
      setLoading: (key, value) => {
        set((draft) => {
          draft.loading[key] = value;
        });
      },

      setMultipleLoading: (updates) => {
        set((draft) => {
          Object.assign(draft.loading, updates);
        });
      },

      // Toast actions
      addToast: (toast) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast: Toast = {
          id,
          duration: 5000,
          ...toast,
        };

        set((draft) => {
          draft.toasts.push(newToast);
        });

        // Auto-remove toast after duration (unless persistent)
        if (!newToast.persistent && newToast.duration) {
          setTimeout(() => {
            get().removeToast(id);
          }, newToast.duration);
        }

        return id;
      },

      removeToast: (id) => {
        set((draft) => {
          const index = draft.toasts.findIndex((toast) => toast.id === id);
          if (index > -1) {
            draft.toasts.splice(index, 1);
          }
        });
      },

      clearToasts: () => {
        set((draft) => {
          draft.toasts = [];
        });
      },

      // Modal actions
      openModal: (id, props = {}) => {
        set((draft) => {
          draft.modals[id] = {
            id,
            isOpen: true,
            size: 'md',
            closable: true,
            ...props,
          };
        });
      },

      closeModal: (id) => {
        set((draft) => {
          if (draft.modals[id]) {
            draft.modals[id].isOpen = false;
          }
        });
      },

      closeAllModals: () => {
        set((draft) => {
          Object.keys(draft.modals).forEach((id) => {
            draft.modals[id].isOpen = false;
          });
        });
      },

      isModalOpen: (id) => {
        const modal = get().modals[id];
        return modal?.isOpen || false;
      },

      getModalData: (id) => {
        const modal = get().modals[id];
        return modal?.data;
      },

      // Viewport actions
      updateViewport: (viewport) => {
        set((draft) => {
          Object.assign(draft.viewport, viewport);
          
          // Update device flags based on width
          const { width } = draft.viewport;
          draft.viewport.isMobile = width < 768;
          draft.viewport.isTablet = width >= 768 && width < 1024;
          draft.viewport.isDesktop = width >= 1024;
        });
      },

      // Theme actions
      setTheme: (theme) => {
        set((draft) => {
          draft.theme.theme = theme;
        });
      },

      setPrimaryColor: (color) => {
        set((draft) => {
          draft.theme.primaryColor = color;
        });
      },

      setFontSize: (size) => {
        set((draft) => {
          draft.theme.fontSize = size;
        });
      },

      toggleReducedMotion: () => {
        set((draft) => {
          draft.theme.reducedMotion = !draft.theme.reducedMotion;
        });
      },

      // Navigation actions
      setBreadcrumbs: (breadcrumbs) => {
        set((draft) => {
          draft.navigation.breadcrumbs = breadcrumbs;
        });
      },

      addBreadcrumb: (breadcrumb) => {
        set((draft) => {
          if (draft.navigation.breadcrumbs.length > 0) {
            draft.navigation.breadcrumbs[draft.navigation.breadcrumbs.length - 1].current = false;
          }
          draft.navigation.breadcrumbs.push({ ...breadcrumb, current: true });
        });
      },

      setNavigating: (isNavigating) => {
        set((draft) => {
          draft.navigation.isNavigating = isNavigating;
        });
      },

      setPreviousRoute: (route) => {
        set((draft) => {
          draft.navigation.previousRoute = route;
        });
      },
      
      // Property view actions
      setViewType: (viewType) => {
        set((draft) => {
          draft.propertyView.viewType = viewType;
        });
      },
      
      setItemsPerPage: (count) => {
        set((draft) => {
          draft.propertyView.itemsPerPage = count;
        });
      },
      
      setSortBy: (sortBy) => {
        set((draft) => {
          draft.propertyView.sortBy = sortBy;
        });
      },
      
      setSortOrder: (order) => {
        set((draft) => {
          draft.propertyView.sortOrder = order;
        });
      },
      
      toggleMapOnSide: () => {
        set((draft) => {
          draft.propertyView.showMapOnSide = !draft.propertyView.showMapOnSide;
        });
      },
      
      setGridColumns: (columns) => {
        set((draft) => {
          draft.propertyView.gridColumns = columns;
        });
      },
      
      // Filter panel actions
      openFilterPanel: () => {
        set((draft) => {
          draft.filterPanel.isOpen = true;
        });
      },
      
      closeFilterPanel: () => {
        set((draft) => {
          draft.filterPanel.isOpen = false;
        });
      },
      
      toggleFilterPanel: () => {
        set((draft) => {
          draft.filterPanel.isOpen = !draft.filterPanel.isOpen;
        });
      },
      
      setFilterPanelMobile: (isMobile) => {
        set((draft) => {
          draft.filterPanel.isMobile = isMobile;
        });
      },
      
      setActiveFiltersCount: (count) => {
        set((draft) => {
          draft.filterPanel.activeFilters = count;
        });
      },
      
      setFilterChanges: (hasChanges) => {
        set((draft) => {
          draft.filterPanel.hasChanges = hasChanges;
        });
      },
      
      // General actions
      setSidebarCollapsed: (collapsed) => {
        set((draft) => {
          draft.sidebarCollapsed = collapsed;
        });
      },
      
      toggleSidebar: () => {
        set((draft) => {
          draft.sidebarCollapsed = !draft.sidebarCollapsed;
        });
      },
      
      setSearchFocused: (focused) => {
        set((draft) => {
          draft.searchFocused = focused;
        });
      },
      
      setOnlineStatus: (isOnline) => {
        set((draft) => {
          draft.isOnline = isOnline;
        });
      },
      
      updateLastActivity: () => {
        set((draft) => {
          draft.lastActivity = new Date();
        });
      },
      
      // Utility actions
      resetUI: () => {
        set((draft) => {
          draft.loading = initialLoading;
          draft.toasts = [];
          draft.modals = {};
          draft.viewport = initialViewport;
          draft.theme = initialTheme;
          draft.navigation = initialNavigation;
          draft.propertyView = initialPropertyView;
          draft.filterPanel = initialFilterPanel;
          draft.sidebarCollapsed = false;
          draft.searchFocused = false;
          draft.isOnline = true;
          draft.lastActivity = new Date();
        });
      },
      
      getResponsiveValue: (mobile, tablet, desktop) => {
        const { isMobile, isTablet, isDesktop } = get().viewport;
        if (isMobile) return mobile;
        if (isTablet) return tablet;
        if (isDesktop) return desktop;
        return desktop; // Default to desktop if none match
      },
    }))
  , {
    name: 'newcondo-ui-storage',
    storage: createJSONStorage(() => localStorage),
    version: 1,
  })
);

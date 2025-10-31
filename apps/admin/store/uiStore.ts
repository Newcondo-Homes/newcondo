// apps/admin/src/store/uiStore.ts

import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface Modal {
  id: string;
  component: string;
  props?: Record<string, any>;
}

interface UIState {
  // Sidebar
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;
  
  // Toasts
  toasts: Toast[];
  
  // Modals
  modals: Modal[];
  
  // Loading overlays
  loadingOverlay: boolean;
  loadingMessage: string | null;
  
  // Confirmation dialogs
  confirmDialog: {
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: (() => void) | null;
    onCancel: (() => void) | null;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
  };
  
  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarMobile: () => void;
  setSidebarMobileOpen: (open: boolean) => void;
  
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  
  openModal: (component: string, props?: Record<string, any>) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  
  showLoadingOverlay: (message?: string) => void;
  hideLoadingOverlay: () => void;
  
  showConfirmDialog: (
    title: string,
    description: string,
    onConfirm: () => void,
    options?: {
      onCancel?: () => void;
      confirmText?: string;
      cancelText?: string;
      variant?: 'danger' | 'warning' | 'info';
    }
  ) => void;
  hideConfirmDialog: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  // Initial state
  sidebarCollapsed: false,
  sidebarMobileOpen: false,
  toasts: [],
  modals: [],
  loadingOverlay: false,
  loadingMessage: null,
  confirmDialog: {
    isOpen: false,
    title: '',
    description: '',
    onConfirm: null,
    onCancel: null
  },

  // Sidebar actions
  toggleSidebar: () => {
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
  },

  setSidebarCollapsed: (collapsed) => {
    set({ sidebarCollapsed: collapsed });
  },

  toggleSidebarMobile: () => {
    set((state) => ({ sidebarMobileOpen: !state.sidebarMobileOpen }));
  },

  setSidebarMobileOpen: (open) => {
    set({ sidebarMobileOpen: open });
  },

  // Toast actions
  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast = { ...toast, id };
    
    set((state) => ({
      toasts: [...state.toasts, newToast]
    }));

    // Auto-remove toast after duration
    const duration = toast.duration || 5000;
    setTimeout(() => {
      get().removeToast(id);
    }, duration);

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },

  // Modal actions
  openModal: (component, props) => {
    const id = `modal-${Date.now()}-${Math.random()}`;
    const newModal = { id, component, props };
    
    set((state) => ({
      modals: [...state.modals, newModal]
    }));

    return id;
  },

  closeModal: (id) => {
    set((state) => ({
      modals: state.modals.filter((m) => m.id !== id)
    }));
  },

  closeAllModals: () => {
    set({ modals: [] });
  },

  // Loading overlay actions
  showLoadingOverlay: (message) => {
    set({ 
      loadingOverlay: true,
      loadingMessage: message || null
    });
  },

  hideLoadingOverlay: () => {
    set({ 
      loadingOverlay: false,
      loadingMessage: null
    });
  },

  // Confirmation dialog actions
  showConfirmDialog: (title, description, onConfirm, options = {}) => {
    set({
      confirmDialog: {
        isOpen: true,
        title,
        description,
        onConfirm,
        onCancel: options.onCancel || null,
        confirmText: options.confirmText,
        cancelText: options.cancelText,
        variant: options.variant
      }
    });
  },

  hideConfirmDialog: () => {
    set({
      confirmDialog: {
        isOpen: false,
        title: '',
        description: '',
        onConfirm: null,
        onCancel: null
      }
    });
  }
}));

// Helper hooks for common UI patterns
export const useToast = () => {
  const addToast = useUIStore((state) => state.addToast);

  return {
    success: (title: string, description?: string, duration?: number) =>
      addToast({ type: 'success', title, description, duration }),
    
    error: (title: string, description?: string, duration?: number) =>
      addToast({ type: 'error', title, description, duration }),
    
    warning: (title: string, description?: string, duration?: number) =>
      addToast({ type: 'warning', title, description, duration }),
    
    info: (title: string, description?: string, duration?: number) =>
      addToast({ type: 'info', title, description, duration })
  };
};
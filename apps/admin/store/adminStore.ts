// apps/admin/src/store/adminStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  permissions: string[];
}

interface AdminState {
  // State
  admin: AdminUser | null;
  token: string | null;
  isLoading: boolean;
  lastActivity: number | null;
  
  // Actions
  setAdmin: (admin: AdminUser, token: string) => void;
  clearAdmin: () => void;
  setIsLoading: (loading: boolean) => void;
  updateLastActivity: () => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      // Initial state
      admin: null,
      token: null,
      isLoading: false,
      lastActivity: null,

      // Set admin and token
      setAdmin: (admin, token) => {
        set({ 
          admin, 
          token,
          lastActivity: Date.now()
        });
      },

      // Clear admin state (logout)
      clearAdmin: () => {
        set({ 
          admin: null, 
          token: null,
          lastActivity: null
        });
      },

      // Set loading state
      setIsLoading: (loading) => {
        set({ isLoading: loading });
      },

      // Update last activity timestamp
      updateLastActivity: () => {
        set({ lastActivity: Date.now() });
      },

      // Check if admin has a specific permission
      hasPermission: (permission) => {
        const { admin } = get();
        if (!admin) return false;
        return admin.permissions?.includes(permission) || false;
      },

      // Check if admin has any of the specified permissions
      hasAnyPermission: (permissions) => {
        const { admin } = get();
        if (!admin) return false;
        return permissions.some(permission => 
          admin.permissions?.includes(permission)
        );
      },

      // Check if admin has all of the specified permissions
      hasAllPermissions: (permissions) => {
        const { admin } = get();
        if (!admin) return false;
        return permissions.every(permission => 
          admin.permissions?.includes(permission)
        );
      }
    }),
    {
      name: 'admin-storage',
      partialize: (state) => ({
        admin: state.admin,
        token: state.token,
        lastActivity: state.lastActivity
      })
    }
  )
);
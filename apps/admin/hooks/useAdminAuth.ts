// apps/admin/src/hooks/useAdminAuth.ts

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api/admin';
import { useAdminStore } from '@/store/adminStore';

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  permissions: string[];
}

interface LoginCredentials {
  email: string;
  password: string;
}

export const useAdminAuth = () => {
  const router = useRouter();
  const { admin, setAdmin, clearAdmin, isLoading, setIsLoading } = useAdminStore();
  const [error, setError] = useState<string | null>(null);

  /**
   * Login admin user
   */
  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await adminApi.login(credentials);
      
      if (response.success && response.data) {
        setAdmin(response.data.admin, response.data.token);
        
        // Store token in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('adminToken', response.data.token);
        }

        router.push('/dashboard');
        return { success: true };
      } else {
        const errorMsg = response.error || 'Login failed';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Login failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [setAdmin, setIsLoading, router]);

  /**
   * Logout admin user
   */
  const logout = useCallback(async () => {
    setIsLoading(true);

    try {
      await adminApi.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      clearAdmin();
      
      // Clear token from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adminToken');
      }

      router.push('/login');
      setIsLoading(false);
    }
  }, [clearAdmin, setIsLoading, router]);

  /**
   * Check if admin is authenticated
   */
  const checkAuth = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('adminToken');
    
    if (!token) {
      clearAdmin();
      return;
    }

    setIsLoading(true);

    try {
      const response = await adminApi.getProfile();
      
      if (response.success && response.data) {
        setAdmin(response.data, token);
      } else {
        clearAdmin();
        localStorage.removeItem('adminToken');
      }
    } catch (err) {
      console.error('Auth check error:', err);
      clearAdmin();
      localStorage.removeItem('adminToken');
    } finally {
      setIsLoading(false);
    }
  }, [setAdmin, clearAdmin, setIsLoading]);

  /**
   * Check if admin has specific permission
   */
  const hasPermission = useCallback((permission: string): boolean => {
    if (!admin) return false;
    return admin.permissions?.includes(permission) || false;
  }, [admin]);

  /**
   * Check if admin has any of the specified permissions
   */
  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    if (!admin) return false;
    return permissions.some(permission => admin.permissions?.includes(permission));
  }, [admin]);

  /**
   * Check if admin has all of the specified permissions
   */
  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    if (!admin) return false;
    return permissions.every(permission => admin.permissions?.includes(permission));
  }, [admin]);

  /**
   * Refresh admin data
   */
  const refreshAdmin = useCallback(async () => {
    if (!admin) return;

    try {
      const response = await adminApi.getProfile();
      
      if (response.success && response.data) {
        const token = localStorage.getItem('adminToken');
        if (token) {
          setAdmin(response.data, token);
        }
      }
    } catch (err) {
      console.error('Refresh admin error:', err);
    }
  }, [admin, setAdmin]);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    admin,
    isLoading,
    error,
    isAuthenticated: !!admin,
    login,
    logout,
    checkAuth,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refreshAdmin,
    clearError: () => setError(null)
  };
};
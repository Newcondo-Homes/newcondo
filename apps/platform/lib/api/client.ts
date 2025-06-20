// apps/platform/lib/api/client.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { getSession } from '@newcondo/auth/client'

// Create axios instance with base configuration
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json'
    }
  })

  // Request interceptor to add auth token
  client.interceptors.request.use(
    async (config) => {
      try {
        // Get session for authenticated requests
        const session = await getSession()
        
        if (session?.accessToken) {
          config.headers.Authorization = `Bearer ${session.accessToken}`
        }
        
        // Add request timestamp for debugging
        config.headers['X-Request-Time'] = new Date().toISOString()
        
        return config
      } catch (error) {
        console.error('Request interceptor error:', error)
        return config
      }
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Response interceptor for error handling
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      return response
    },
    async (error) => {
      const originalRequest = error.config

      // Handle different error types
      if (error.response) {
        const { status, data } = error.response

        switch (status) {
          case 401:
            // Unauthorized - clear session and redirect to login
            if (typeof window !== 'undefined') {
              // Only redirect if not already on auth pages
              const authPages = ['/login', '/register', '/verify-otp', '/forgot-password']
              const currentPath = window.location.pathname
              
              if (!authPages.includes(currentPath)) {
                window.location.href = '/login'
              }
            }
            break

          case 403:
            // Forbidden - user doesn't have permission
            console.error('Permission denied:', data?.message)
            break

          case 404:
            // Not found
            console.error('Resource not found:', data?.message)
            break

          case 429:
            // Rate limit exceeded
            console.error('Rate limit exceeded:', data?.message)
            break

          case 500:
            // Server error
            console.error('Server error:', data?.message)
            break

          default:
            console
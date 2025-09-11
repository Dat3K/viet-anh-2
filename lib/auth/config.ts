/**
 * Authentication Configuration
 * 
 * This file contains configuration constants and types for the authentication system.
 */

export const AUTH_CONFIG = {
  // Azure OAuth Configuration
  azure: {
    provider: 'azure',
    scopes: ['email', 'profile', 'openid'],
    prompt: 'select_account',
    tenant: 'common',
  },

  // Session Configuration
  session: {
    // Session timeout in milliseconds (24 hours)
    timeout: 24 * 60 * 60 * 1000,
    // Refresh token threshold in milliseconds (1 hour before expiry)
    refreshThreshold: 60 * 60 * 1000,
  },

  // Redirect URLs
  redirects: {
    // Where to redirect after successful login
    loginSuccess: '/dashboard',
    // Where to redirect after logout
    logoutSuccess: '/',
    // Where to redirect if user is not authenticated
    notAuthenticated: '/',
    // Where to redirect if user doesn't have required permissions
    notAuthorized: '/unauthorized',
  },

  // User Roles
  roles: {
    admin: 'admin',
    manager: 'manager',
    employee: 'employee',
    viewer: 'viewer',
  },

  // Feature Flags
  features: {
    // Enable Azure OAuth login
    azureLogin: true,
    // Enable session persistence
    persistSession: true,
    // Enable automatic token refresh
    autoRefreshToken: true,
    // Enable debug logging
    debug: process.env.NODE_ENV === 'development',
  },
} as const

export type AuthConfig = typeof AUTH_CONFIG
export type UserRole = typeof AUTH_CONFIG.roles[keyof typeof AUTH_CONFIG.roles]

// Environment variable validation
export function validateEnvironmentVariables(): void {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ]

  const missing = required.filter(key => !process.env[key])

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    )
  }

  if (AUTH_CONFIG.features.azureLogin && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error(
      'Azure login is enabled but NEXT_PUBLIC_SUPABASE_URL is not configured'
    )
  }
}

// Helper function to get environment variable with fallback
export function getEnvVar(key: string, fallback?: string): string {
  const value = process.env[key]
  if (value === undefined) {
    if (fallback !== undefined) {
      return fallback
    }
    throw new Error(`Environment variable ${key} is not defined`)
  }
  return value
}

// Helper function to get boolean environment variable
export function getEnvBool(key: string, defaultValue: boolean = false): boolean {
  const value = process.env[key]
  if (value === undefined) {
    return defaultValue
  }
  return value.toLowerCase() === 'true' || value === '1'
}

// Helper function to get numeric environment variable
export function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key]
  if (value === undefined) {
    return defaultValue
  }
  const num = parseInt(value, 10)
  if (isNaN(num)) {
    return defaultValue
  }
  return num
}
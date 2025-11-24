import apiClient from './client'

/**
 * GET /auth/validate
 * Validate SSO session via eusuite_token cookie
 * Returns user data if authenticated, throws 401 if not
 * 
 * Dit is de ENIGE auth check die EUTYPE nodig heeft
 */
export const validateSession = async () => {
  try {
    const response = await apiClient.get('/auth/validate')
    return response.data
  } catch (error) {
    // 401/403 wordt afgehandeld door apiClient interceptor
    throw error
  }
}

/**
 * Get current authenticated user
 * Alias voor validateSession voor backward compatibility
 */
export const getCurrentUser = validateSession

/**
 * Backwards compatibility
 */
export const checkAuth = validateSession

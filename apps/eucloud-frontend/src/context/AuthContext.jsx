import React, { createContext, useState, useContext, useEffect } from 'react'

// SSO Authentication Context - EUsuite Single Sign-On
const AuthContext = createContext(null)

// Base URLs for SSO
const API_BASE_URL = 'http://192.168.124.50:30500'
const LOGIN_URL = 'http://192.168.124.50:30090/login'
const EUCLOUD_BASE_URL = 'http://192.168.124.50:30080'

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const getRedirectUrl = () => {
    // Build full URL with EUCloud base
    return EUCLOUD_BASE_URL + window.location.pathname + window.location.search
  }

  useEffect(() => {
    validateSession()
  }, [])

  const validateSession = async () => {
    try {
      console.log('🔐 Validating SSO session...')
      
      // Call /api/auth/validate with cookie credentials
      const response = await fetch(`${API_BASE_URL}/api/auth/validate`, {
        method: 'GET',
        credentials: 'include'
      })
      
      if (response.status === 401) {
        // Not authenticated - redirect to SSO login portal with full URL
        console.log('❌ No valid session, redirecting to login portal')
        const redirectUrl = getRedirectUrl()
        window.location.href = `${LOGIN_URL}?redirect=${encodeURIComponent(redirectUrl)}`
        return
      }
      
      if (response.status === 200) {
        const data = await response.json()
        if (data.valid && (data.user || data.username)) {
          // Handle both response formats (user object or username field)
          const userData = data.user || { username: data.username, email: data.email }
          setUser(userData)
          console.log('✅ SSO authentication successful:', userData.email || userData.username)
        } else {
          console.log('⚠️ Invalid session data, redirecting to login')
          const redirectUrl = getRedirectUrl()
          window.location.href = `${LOGIN_URL}?redirect=${encodeURIComponent(redirectUrl)}`
        }
      }
    } catch (error) {
      // Network error or other exception - just log, don't redirect
      console.error('💥 SSO validation error:', error)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      console.log('🚪 Logging out...')
      
      // Call logout endpoint to delete cookie
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      })
      
      // Clear local state
      setUser(null)
      
      // Redirect to login portal with EUCloud as redirect target
      window.location.href = `${LOGIN_URL}?redirect=${encodeURIComponent(EUCLOUD_BASE_URL)}`
    } catch (error) {
      console.error('Logout error:', error)
      // Redirect anyway on error
      window.location.href = `${LOGIN_URL}?redirect=${encodeURIComponent(EUCLOUD_BASE_URL)}`
    }
  }

  const value = {
    user,
    loading,
    logout,
    refreshUser: validateSession
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

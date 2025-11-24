import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import './Login.css'

const API_BASE_URL = 'http://192.168.124.50:30500/api/auth/login'
const DEFAULT_REDIRECT = 'http://192.168.124.50:30091/dashboard'

// App base URLs mapping
const APP_URLS = {
  eutype: 'http://192.168.124.50:30081',
  eucloud: 'http://192.168.124.50:30080',
  dashboard: 'http://192.168.124.50:30091',
  login: 'http://192.168.124.50:30090'
}

/**
 * Bepaal de finale redirect URL
 * @param {string} redirect - De redirect parameter uit de URL
 * @returns {string} - De volledige URL om naar te redirecten na login
 */
function getFinalRedirectUrl(redirect) {
  if (!redirect || redirect.trim() === '') {
    return DEFAULT_REDIRECT
  }

  // Als het al een volledige URL is, gebruik die direct
  // Maar filter login portal URLs om loops te voorkomen
  if (redirect.startsWith('http://') || redirect.startsWith('https://')) {
    try {
      const url = new URL(redirect)
      // Voorkom redirect loops naar login portal
      if (url.port === '30090' || url.pathname.includes('/login')) {
        return DEFAULT_REDIRECT
      }
      return redirect
    } catch (e) {
      return DEFAULT_REDIRECT
    }
  }

  // Relative path - bepaal de juiste app base URL
  const path = redirect.startsWith('/') ? redirect : `/${redirect}`
  
  // Check welke app op basis van path
  if (path.startsWith('/eutype')) {
    return APP_URLS.eutype + path.replace('/eutype', '')
  }
  if (path.startsWith('/eucloud') || path.startsWith('/cloud')) {
    return APP_URLS.eucloud + path.replace('/eucloud', '').replace('/cloud', '')
  }
  if (path.startsWith('/dashboard')) {
    return APP_URLS.dashboard + path
  }
  
  // Default: dashboard met de path
  return APP_URLS.dashboard + path
}

function Login() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Bepaal de finale redirect URL
      const rawRedirect = searchParams.get('redirect')
      const finalRedirectUrl = getFinalRedirectUrl(rawRedirect)
      
      console.log('🔐 Login attempt - redirect will go to:', finalRedirectUrl)
      
      // Stuur POST request naar backend
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // BELANGRIJK: zorgt dat SSO-cookie wordt teruggestuurd
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.detail || data.message || 'Login failed')
      }

      // Login succesvol! Redirect naar de finale URL
      console.log('✅ Login successful, redirecting to:', finalRedirectUrl)
      window.location.href = finalRedirectUrl;

    } catch (err) {
      setError(err.message || 'Er ging iets mis. Probeer opnieuw.')
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src="/logo.png" alt="EUsuite Logo" className="logo" />
          <h1>EUsuite</h1>
          <p>Centraal inloggen voor alle EUsuite apps</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">E-mailadres</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoComplete="email"
              placeholder="jouw@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Wachtwoord</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="current-password"
                placeholder="Voer je wachtwoord in"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                aria-label={showPassword ? "Verberg wachtwoord" : "Toon wachtwoord"}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Inloggen...' : 'Inloggen'}
          </button>

          <div className="switch-auth">
            <p>Nog geen account?</p>
            <button 
              type="button" 
              className="switch-button"
              onClick={() => {
                const redirect = searchParams.get('redirect')
                navigate(redirect ? `/register?redirect=${redirect}` : '/register')
              }}
              disabled={loading}
            >
              Registreren
            </button>
          </div>
        </form>

        <div className="login-footer">
          <p>© 2025 EUsuite Platform</p>
          <p className="version">v1.0.0</p>
        </div>
      </div>
    </div>
  )
}

export default Login

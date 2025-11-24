import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import './Register.css'

const API_URL = 'http://192.168.124.50:30500/api/auth/register'
const DEFAULT_REDIRECT = 'http://192.168.124.50:30080'

function Register() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validatie
    if (formData.password !== formData.confirmPassword) {
      setError('Wachtwoorden komen niet overeen')
      return
    }

    if (formData.password.length < 8) {
      setError('Wachtwoord moet minimaal 8 karakters zijn')
      return
    }

    // Check voor hoofdletter
    if (!/[A-Z]/.test(formData.password)) {
      setError('Wachtwoord moet minimaal 1 hoofdletter bevatten')
      return
    }

    // Check voor speciaal teken
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
      setError('Wachtwoord moet minimaal 1 speciaal teken bevatten (!@#$%^&*...)')
      return
    }

    // Check voor cijfer
    if (!/[0-9]/.test(formData.password)) {
      setError('Wachtwoord moet minimaal 1 cijfer bevatten')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Registratie mislukt')
      }

      // Registratie succesvol! Nu redirecten
      const redirectUrl = searchParams.get('redirect') || DEFAULT_REDIRECT
      window.location.href = redirectUrl

    } catch (err) {
      setError(err.message || 'Er ging iets mis. Probeer opnieuw.')
      setLoading(false)
    }
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <img src="/logo.png" alt="EUsuite Logo" className="logo" />
          <h1>EUsuite</h1>
          <p>Account aanmaken</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Gebruikersnaam</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={loading}
              autoComplete="username"
              placeholder="Kies een gebruikersnaam"
              minLength={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">E-mailadres</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
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
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete="new-password"
                placeholder="Min. 8 tekens, 1 hoofdletter, 1 cijfer, 1 speciaal teken"
                minLength={8}
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
            <div className="password-requirements">
              <small>• Minimaal 8 karakters</small>
              <small>• Minimaal 1 hoofdletter (A-Z)</small>
              <small>• Minimaal 1 cijfer (0-9)</small>
              <small>• Minimaal 1 speciaal teken (!@#$%...)</small>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Bevestig wachtwoord</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete="new-password"
                placeholder="Herhaal je wachtwoord"
                minLength={8}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
                aria-label={showConfirmPassword ? "Verberg wachtwoord" : "Toon wachtwoord"}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button type="submit" className="register-button" disabled={loading}>
            {loading ? 'Account aanmaken...' : 'Registreren'}
          </button>

          <div className="switch-auth">
            <p>Heb je al een account?</p>
            <button 
              type="button" 
              className="switch-button"
              onClick={() => {
                const redirect = searchParams.get('redirect')
                navigate(redirect ? `/login?redirect=${redirect}` : '/login')
              }}
              disabled={loading}
            >
              Inloggen
            </button>
          </div>
        </form>

        <div className="register-footer">
          <p>© 2025 EUsuite Platform</p>
          <p className="version">v1.0.0</p>
        </div>
      </div>
    </div>
  )
}

export default Register

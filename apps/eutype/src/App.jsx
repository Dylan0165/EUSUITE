import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import FilePicker from './components/FilePicker'
import EditorPage from './components/EditorPage'
import { useAuth } from './hooks/useAuth'
import './App.css'

/**
 * EUTYPE App - Pure SSO Client
 * 
 * Geen eigen login UI of auth logic
 * SSO validatie gebeurt via useAuth hook
 * Bij geen geldige sessie -> automatische redirect naar centraal loginportaal
 */
function App() {
  const { user, loading, error } = useAuth()

  // Loading state tijdens SSO validatie
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '1.5rem',
        background: 'linear-gradient(135deg, #722F37 0%, #5a252c 100%)',
        color: 'white'
      }}>
        <img src="/eusuite-logo.png" alt="EUsuite" style={{ height: '48px', marginBottom: '8px' }} />
        <div style={{ fontSize: '1.8rem', fontWeight: '700', letterSpacing: '2px' }}>EUTYPE</div>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid rgba(255,255,255,0.3)',
          borderTopColor: 'white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <div style={{ fontSize: '1rem', opacity: 0.9 }}>SSO authenticatie valideren...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // Geen user en geen loading -> redirect gebeurt in useAuth hook
  if (!user) {
    return null
  }

  // User is authenticated -> toon de app
  return (
    <Router>
      <Routes>
        {/* Alle routes zijn protected via useAuth SSO check */}
        <Route path="/" element={<FilePicker />} />
        <Route path="/editor" element={<EditorPage />} />
        
        {/* Redirect unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App

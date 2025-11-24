import React, { useState, useEffect } from 'react'
import './StatusBar.css'

function StatusBar({ editor }) {
  const [stats, setStats] = useState({
    words: 0,
    characters: 0,
    charactersNoSpaces: 0
  })

  useEffect(() => {
    if (!editor) return

    const updateStats = () => {
      const text = editor.getText()
      const words = text.trim() ? text.trim().split(/\s+/).length : 0
      const characters = text.length
      const charactersNoSpaces = text.replace(/\s/g, '').length

      setStats({ words, characters, charactersNoSpaces })
    }

    updateStats()
    editor.on('update', updateStats)

    return () => {
      editor.off('update', updateStats)
    }
  }, [editor])

  if (!editor) return null

  return (
    <div className="status-bar">
      <div className="status-item status-brand">
        <span className="status-label">EUTYPE</span>
      </div>
      <div className="status-divider"></div>
      <div className="status-item">
        <span className="status-label">Woorden:</span>
        <span className="status-value">{stats.words.toLocaleString('nl-NL')}</span>
      </div>
      <div className="status-divider"></div>
      <div className="status-item">
        <span className="status-label">Tekens (met spaties):</span>
        <span className="status-value">{stats.characters.toLocaleString('nl-NL')}</span>
      </div>
      <div className="status-divider"></div>
      <div className="status-item">
        <span className="status-label">Tekens (zonder spaties):</span>
        <span className="status-value">{stats.charactersNoSpaces.toLocaleString('nl-NL')}</span>
      </div>
    </div>
  )
}

export default StatusBar

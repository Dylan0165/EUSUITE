import React, { useState } from 'react'
import './SearchPanel.css'

function SearchPanel({ editor, onClose }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [replaceTerm, setReplaceTerm] = useState('')
  const [showReplace, setShowReplace] = useState(false)
  const [matchCase, setMatchCase] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)

  const handleSearch = () => {
    if (!editor || !searchTerm) return
    
    // Simple search implementation
    const text = editor.getText()
    const searchRegex = new RegExp(
      searchTerm,
      matchCase ? 'g' : 'gi'
    )
    
    const matches = text.match(searchRegex)
    if (matches) {
      alert(`${matches.length} resultaten gevonden`)
    } else {
      alert('Geen resultaten gevonden')
    }
  }

  const handleReplace = () => {
    if (!editor || !searchTerm) return
    
    const content = editor.getHTML()
    const flags = matchCase ? 'g' : 'gi'
    const newContent = content.replace(
      new RegExp(searchTerm, flags),
      replaceTerm
    )
    
    editor.commands.setContent(newContent)
  }

  const handleReplaceAll = () => {
    handleReplace()
  }

  return (
    <div className="search-panel">
      <div className="search-header">
        <h3>{showReplace ? 'Zoeken en vervangen' : 'Zoeken'}</h3>
        <button onClick={onClose} className="close-btn">✕</button>
      </div>
      
      <div className="search-body">
        <div className="search-input-group">
          <input
            type="text"
            placeholder="Zoeken naar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} className="search-btn">
            🔍 Volgende zoeken
          </button>
        </div>

        {showReplace && (
          <div className="search-input-group">
            <input
              type="text"
              placeholder="Vervangen door..."
              value={replaceTerm}
              onChange={(e) => setReplaceTerm(e.target.value)}
            />
            <div className="replace-buttons">
              <button onClick={handleReplace} className="replace-btn">
                Vervangen
              </button>
              <button onClick={handleReplaceAll} className="replace-all-btn">
                Alles vervangen
              </button>
            </div>
          </div>
        )}

        <div className="search-options">
          <label>
            <input
              type="checkbox"
              checked={matchCase}
              onChange={(e) => setMatchCase(e.target.checked)}
            />
            Hoofdlettergevoelig
          </label>
          <label>
            <input
              type="checkbox"
              checked={wholeWord}
              onChange={(e) => setWholeWord(e.target.checked)}
            />
            Alleen hele woorden
          </label>
        </div>

        <button
          onClick={() => setShowReplace(!showReplace)}
          className="toggle-replace-btn"
        >
          {showReplace ? '▲ Verbergen' : '▼ Vervangen'}
        </button>
      </div>
    </div>
  )
}

export default SearchPanel

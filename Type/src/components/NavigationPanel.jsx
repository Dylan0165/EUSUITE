import React, { useState } from 'react'
import TableOfContents from './TableOfContents'
import './NavigationPanel.css'

function NavigationPanel({ editor, onClose }) {
  const [activeTab, setActiveTab] = useState('headings')

  return (
    <div className="navigation-panel">
      <div className="nav-header">
        <div className="nav-tabs">
          <button
            className={activeTab === 'headings' ? 'nav-tab active' : 'nav-tab'}
            onClick={() => setActiveTab('headings')}
          >
            Koppen
          </button>
          <button
            className={activeTab === 'pages' ? 'nav-tab active' : 'nav-tab'}
            onClick={() => setActiveTab('pages')}
          >
            Pagina's
          </button>
          <button
            className={activeTab === 'results' ? 'nav-tab active' : 'nav-tab'}
            onClick={() => setActiveTab('results')}
          >
            Resultaten
          </button>
        </div>
        <button onClick={onClose} className="nav-close-btn">✕</button>
      </div>

      <div className="nav-content">
        {activeTab === 'headings' && (
          <TableOfContents editor={editor} />
        )}
        {activeTab === 'pages' && (
          <div className="nav-pages">
            <p>Pagina navigatie komt binnenkort...</p>
          </div>
        )}
        {activeTab === 'results' && (
          <div className="nav-results">
            <p>Zoekresultaten verschijnen hier...</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default NavigationPanel

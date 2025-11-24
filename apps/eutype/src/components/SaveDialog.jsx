import { useState } from 'react'
import './SaveDialog.css'

const EUCLOUD_URL = 'http://192.168.124.50:30080'

export default function SaveDialog({ 
  isOpen, 
  onClose, 
  onSaveToCloud, 
  onDownload,
  documentName,
  saving 
}) {
  const [selectedOption, setSelectedOption] = useState('cloud')

  if (!isOpen) return null

  const handleSave = () => {
    if (selectedOption === 'cloud') {
      onSaveToCloud()
    } else {
      onDownload()
    }
  }

  return (
    <div className="save-dialog-backdrop" onClick={onClose}>
      <div className="save-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="save-dialog-header">
          <h2>Document opslaan</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="save-dialog-body">
          <p className="save-dialog-subtitle">
            Kies waar je <strong>"{documentName}"</strong> wilt opslaan:
          </p>

          <div className="save-options">
            <label 
              className={`save-option ${selectedOption === 'cloud' ? 'selected' : ''}`}
              onClick={() => setSelectedOption('cloud')}
            >
              <div className="option-icon cloud">☁️</div>
              <div className="option-content">
                <h3>Opslaan in EUCloud</h3>
                <p>Bewaar in je persoonlijke cloud. Toegankelijk vanaf elk apparaat.</p>
              </div>
              <div className="option-check">
                {selectedOption === 'cloud' && <span>✓</span>}
              </div>
            </label>

            <label 
              className={`save-option ${selectedOption === 'download' ? 'selected' : ''}`}
              onClick={() => setSelectedOption('download')}
            >
              <div className="option-icon download">💾</div>
              <div className="option-content">
                <h3>Downloaden</h3>
                <p>Download het bestand naar je computer als .ty bestand.</p>
              </div>
              <div className="option-check">
                {selectedOption === 'download' && <span>✓</span>}
              </div>
            </label>
          </div>

          {selectedOption === 'cloud' && (
            <div className="cloud-info">
              <span className="info-icon">ℹ️</span>
              <span>Het document wordt opgeslagen in je EUType map in EUCloud</span>
            </div>
          )}
        </div>

        <div className="save-dialog-footer">
          <button className="btn-cancel" onClick={onClose} disabled={saving}>
            Annuleren
          </button>
          <button className="btn-save" onClick={handleSave} disabled={saving}>
            {saving ? 'Opslaan...' : (selectedOption === 'cloud' ? '☁️ Opslaan in cloud' : '💾 Downloaden')}
          </button>
        </div>
      </div>
    </div>
  )
}

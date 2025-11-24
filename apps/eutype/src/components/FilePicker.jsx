import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { listEuTypeDocuments, createDocument, deleteFile, renameFile } from '../api/files'
import { getCurrentUser } from '../api/auth'
import { useAuth } from '../hooks/useAuth'
import './FilePicker.css'

export default function FilePicker() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [files, setFiles] = useState([])
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showNewDocModal, setShowNewDocModal] = useState(false)
  const [newDocName, setNewDocName] = useState('')
  const [renamingFile, setRenamingFile] = useState(null)
  const [newFileName, setNewFileName] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState(null)

  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await listEuTypeDocuments()
      setFiles(data.files)
      setFolders(data.folders)
    } catch (err) {
      setError('Kan bestanden niet laden. Probeer het opnieuw.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDocument = async (template = 'blank') => {
    const name = newDocName.trim() || 'Naamloos document'

    try {
      let initialContent = {
        html: '<p>Start met typen...</p>',
        text: 'Start met typen...'
      }

      // Different templates
      if (template === 'letter') {
        initialContent = {
          html: `<p>Datum: ${new Date().toLocaleDateString('nl-NL')}</p><p><br></p><p>Geachte heer/mevrouw,</p><p><br></p><p>[Uw tekst hier]</p><p><br></p><p>Met vriendelijke groet,</p><p><br></p><p>[Uw naam]</p>`,
          text: ''
        }
      } else if (template === 'meeting') {
        initialContent = {
          html: `<h1>Notulen - ${new Date().toLocaleDateString('nl-NL')}</h1><p><br></p><h2>Aanwezigen</h2><ul><li>[Naam]</li></ul><p><br></p><h2>Agendapunten</h2><ol><li>[Punt 1]</li></ol><p><br></p><h2>Actiepunten</h2><ul><li>[Actie]</li></ul>`,
          text: ''
        }
      } else if (template === 'report') {
        initialContent = {
          html: `<h1>[Rapport Titel]</h1><p><br></p><h2>Samenvatting</h2><p>[Korte samenvatting]</p><p><br></p><h2>Inleiding</h2><p>[Inleiding tekst]</p><p><br></p><h2>Inhoud</h2><p>[Hoofdinhoud]</p><p><br></p><h2>Conclusie</h2><p>[Conclusie]</p>`,
          text: ''
        }
      }

      const result = await createDocument(name, initialContent)

      setShowNewDocModal(false)
      setNewDocName('')
      setSelectedTemplate(null)
      
      // Open het nieuwe document
      navigate(`/editor?file=${result.file.id}`)
    } catch (err) {
      alert('Kan document niet aanmaken: ' + (err.response?.data?.detail || err.message))
    }
  }

  const handleOpenDocument = (fileId) => {
    navigate(`/editor?file=${fileId}`)
  }

  const handleDeleteFile = async (fileId, filename) => {
    if (!confirm(`Weet je zeker dat je "${filename}" wilt verwijderen?`)) {
      return
    }

    try {
      await deleteFile(fileId)
      loadFiles()
    } catch (err) {
      alert('Kan bestand niet verwijderen: ' + (err.response?.data?.detail || err.message))
    }
  }

  const handleRenameFile = async (fileId) => {
    if (!newFileName.trim()) {
      alert('Voer een nieuwe naam in')
      return
    }

    try {
      await renameFile(fileId, newFileName)
      setRenamingFile(null)
      setNewFileName('')
      loadFiles()
    } catch (err) {
      alert('Kan bestand niet hernoemen: ' + (err.response?.data?.detail || err.message))
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Document templates for the startup screen
  const templates = [
    { id: 'blank', icon: '📄', name: 'Leeg document', description: 'Start met een leeg vel' },
    { id: 'letter', icon: '✉️', name: 'Brief', description: 'Formele brief template' },
    { id: 'meeting', icon: '📋', name: 'Notulen', description: 'Vergadering notities' },
    { id: 'report', icon: '📊', name: 'Rapport', description: 'Gestructureerd rapport' },
  ]

  return (
    <div className="filepicker-container">
      {/* Header */}
      <header className="filepicker-header">
        <div className="filepicker-header-content">
          <div className="filepicker-brand">
            <h1>
              📝 EUTYPE
              <span className="sso-badge">SSO</span>
            </h1>
            {user && (
              <span className="filepicker-user-info">
                Welkom, {user.username || user.email}
              </span>
            )}
          </div>
          <div className="filepicker-actions">
            <button
              onClick={() => setShowNewDocModal(true)}
              className="btn-new-doc"
            >
              <span>📝</span> Nieuw document
            </button>
            <button onClick={logout} className="btn-logout">
              Uitloggen
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="filepicker-main">
        {error && (
          <div className="error-banner">{error}</div>
        )}

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Documenten laden...</p>
          </div>
        ) : files.length === 0 ? (
          // Startup Screen - No Documents Yet
          <div className="startup-screen">
            <div className="startup-icon">📝</div>
            <h2>Welkom bij EUTYPE</h2>
            <p>
              Je hebt nog geen documenten. Kies een template om te beginnen of maak een leeg document aan.
            </p>
            
            <div className="template-grid">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="template-card"
                  onClick={() => {
                    setSelectedTemplate(template.id)
                    setShowNewDocModal(true)
                  }}
                >
                  <div className="icon">{template.icon}</div>
                  <h3>{template.name}</h3>
                  <p>{template.description}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Documents List
          <div className="documents-section">
            <div className="documents-header">
              <h2>📁 Mijn documenten</h2>
            </div>
            
            <table className="documents-table">
              <thead>
                <tr>
                  <th>Naam</th>
                  <th>Laatst gewijzigd</th>
                  <th>Grootte</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.id}>
                    <td>
                      {renamingFile === file.id ? (
                        <div className="rename-input-group">
                          <input
                            type="text"
                            value={newFileName}
                            onChange={(e) => setNewFileName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameFile(file.id)
                              if (e.key === 'Escape') {
                                setRenamingFile(null)
                                setNewFileName('')
                              }
                            }}
                            className="rename-input"
                            autoFocus
                          />
                          <button
                            onClick={() => handleRenameFile(file.id)}
                            className="btn-confirm"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => {
                              setRenamingFile(null)
                              setNewFileName('')
                            }}
                            className="btn-icon"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="file-name">
                          <div className="file-icon">📄</div>
                          <span>{file.filename}</span>
                        </div>
                      )}
                    </td>
                    <td className="file-meta">
                      {formatDate(file.modified_at || file.created_at)}
                    </td>
                    <td className="file-meta">
                      {formatFileSize(file.size)}
                    </td>
                    <td>
                      <div className="file-actions">
                        <button
                          onClick={() => handleOpenDocument(file.id)}
                          className="btn-open"
                        >
                          Openen
                        </button>
                        <button
                          onClick={() => {
                            setRenamingFile(file.id)
                            setNewFileName(file.filename.replace('.ty', ''))
                          }}
                          className="btn-rename"
                        >
                          Hernoemen
                        </button>
                        <button
                          onClick={() => handleDeleteFile(file.id, file.filename)}
                          className="btn-delete"
                        >
                          Verwijderen
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Template Grid below documents if there are documents */}
        {!loading && files.length > 0 && (
          <div style={{ marginTop: '32px' }}>
            <h3 style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '600' }}>
              Nieuw document starten
            </h3>
            <div className="template-grid" style={{ maxWidth: '100%' }}>
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="template-card"
                  onClick={() => {
                    setSelectedTemplate(template.id)
                    setShowNewDocModal(true)
                  }}
                >
                  <div className="icon">{template.icon}</div>
                  <h3>{template.name}</h3>
                  <p>{template.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* New Document Modal */}
      {showNewDocModal && (
        <div className="modal-backdrop" onClick={() => setShowNewDocModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>
              {selectedTemplate ? templates.find(t => t.id === selectedTemplate)?.name : 'Nieuw document'}
            </h2>
            <input
              type="text"
              value={newDocName}
              onChange={(e) => setNewDocName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateDocument(selectedTemplate || 'blank')}
              placeholder="Documentnaam (optioneel)"
              className="modal-input"
              autoFocus
            />
            <div className="modal-actions">
              <button
                onClick={() => {
                  setShowNewDocModal(false)
                  setNewDocName('')
                  setSelectedTemplate(null)
                }}
                className="btn-cancel"
              >
                Annuleren
              </button>
              <button
                onClick={() => handleCreateDocument(selectedTemplate || 'blank')}
                className="btn-create"
              >
                Aanmaken
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

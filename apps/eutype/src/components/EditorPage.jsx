import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getFileContent, updateFileContent, getFileMetadata } from '../api/files'
import { getCurrentUser } from '../api/auth'
import { useAuth } from '../hooks/useAuth'
import RibbonToolbar from './RibbonToolbar'
import Editor from './Editor'
import StatusBar from './StatusBar'
import NavigationPanel from './NavigationPanel'
import SearchPanel from './SearchPanel'
import SaveDialog from './SaveDialog'

const SSO_PORTAL_URL = 'http://192.168.124.50:30090'

export default function EditorPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fileId = searchParams.get('file')
  const { user, logout } = useAuth()

  const [editor, setEditor] = useState(null)
  const [documentName, setDocumentName] = useState('Laden...')
  const [documentContent, setDocumentContent] = useState(null)
  const [showNavigation, setShowNavigation] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Redirect als geen file ID
  useEffect(() => {
    if (!fileId) {
      navigate('/')
    }
  }, [fileId, navigate])

  // Load document
  useEffect(() => {
    if (fileId) {
      loadDocument()
    }
  }, [fileId])

  // Auto-save bij wijzigingen (debounced)
  useEffect(() => {
    if (!editor || !hasUnsavedChanges) return

    const timer = setTimeout(() => {
      handleAutoSave()
    }, 3000) // Auto-save na 3 seconden

    return () => clearTimeout(timer)
  }, [editor, hasUnsavedChanges])

  // Track editor changes
  useEffect(() => {
    if (!editor) return

    const handleUpdate = () => {
      setHasUnsavedChanges(true)
    }

    editor.on('update', handleUpdate)
    return () => {
      editor.off('update', handleUpdate)
    }
  }, [editor])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+F - Zoeken
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault()
        setShowSearch(true)
      }
      // Ctrl+S - Opslaan
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      // Ctrl+P - Printen
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault()
        handlePrint()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editor])

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  const loadDocument = async () => {
    setLoading(true)
    try {
      const data = await getFileContent(fileId)
      
      // Parse .ty content
      if (data.parsedContent) {
        setDocumentContent(data.parsedContent)
        setDocumentName(data.parsedContent.name || data.filename.replace('.ty', ''))
        
        // Load content into editor
        if (editor && data.parsedContent.html) {
          editor.commands.setContent(data.parsedContent.html)
        }
      } else {
        // Fallback voor andere bestanden
        setDocumentName(data.filename)
        if (editor) {
          editor.commands.setContent(data.content)
        }
      }
      
      setLastSaved(new Date(data.modified_at))
      setHasUnsavedChanges(false)
    } catch (err) {
      console.error('Load error:', err)
      alert('Kan document niet laden: ' + (err.response?.data?.detail || err.message))
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const handleAutoSave = async () => {
    if (!editor || saving) return
    await saveDocument(false)
  }

  const handleSave = async () => {
    await saveDocument(true)
  }

  const saveDocument = async (showFeedback = true) => {
    if (!editor || !fileId) return

    setSaving(true)
    try {
      const updatedContent = {
        version: '1.0',
        type: 'EUTYPE Document',
        name: documentName,
        created: documentContent?.created || new Date().toISOString(),
        modified: new Date().toISOString(),
        html: editor.getHTML(),
        text: editor.getText()
      }

      await updateFileContent(fileId, updatedContent)
      
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
      
      if (showFeedback) {
        // Toon korte feedback
        const statusMsg = document.createElement('div')
        statusMsg.textContent = '✓ Opgeslagen'
        statusMsg.style.cssText = 'position:fixed;top:20px;right:20px;background:#10b981;color:white;padding:12px 24px;border-radius:8px;z-index:9999;box-shadow:0 4px 6px rgba(0,0,0,0.1);'
        document.body.appendChild(statusMsg)
        setTimeout(() => statusMsg.remove(), 2000)
      }
    } catch (err) {
      console.error('Save error:', err)
      if (showFeedback) {
        alert('Opslaan mislukt: ' + (err.response?.data?.detail || err.message))
      }
    } finally {
      setSaving(false)
    }
  }

  const handleBackToFiles = () => {
    if (hasUnsavedChanges) {
      if (!confirm('Je hebt niet-opgeslagen wijzigingen. Toch sluiten?')) {
        return
      }
    }
    navigate('/')
  }

  const handleNewDocument = () => {
    if (hasUnsavedChanges) {
      if (!confirm('Je hebt niet-opgeslagen wijzigingen. Nieuw document maken?')) {
        return
      }
    }
    navigate('/')
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportPDF = () => {
    alert('PDF export: Gebruik Ctrl+P en selecteer "Opslaan als PDF"')
    window.print()
  }

  // Download document to local machine
  const handleDownload = () => {
    if (!editor) return

    const tyContent = JSON.stringify({
      version: '1.0',
      type: 'EUTYPE Document',
      name: documentName,
      created: documentContent?.created || new Date().toISOString(),
      modified: new Date().toISOString(),
      html: editor.getHTML(),
      text: editor.getText()
    }, null, 2)

    const blob = new Blob([tyContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${documentName}.ty`
    a.click()
    URL.revokeObjectURL(url)

    setShowSaveDialog(false)
    
    // Show feedback
    const statusMsg = document.createElement('div')
    statusMsg.textContent = '💾 Gedownload'
    statusMsg.style.cssText = 'position:fixed;top:20px;right:20px;background:#10b981;color:white;padding:12px 24px;border-radius:8px;z-index:9999;box-shadow:0 4px 6px rgba(0,0,0,0.1);'
    document.body.appendChild(statusMsg)
    setTimeout(() => statusMsg.remove(), 2000)
  }

  // Save to cloud (with dialog close)
  const handleSaveToCloud = async () => {
    await saveDocument(true)
    setShowSaveDialog(false)
  }

  // Show save dialog for "Save As"
  const handleSaveAs = () => {
    setShowSaveDialog(true)
  }

  const handleExport = (format) => {
    if (!editor) return

    let blob, filename
    const html = editor.getHTML()
    const text = editor.getText()

    if (format === 'html') {
      const htmlContent = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <title>${documentName}</title>
  <style>
    body { font-family: Calibri, Arial, sans-serif; max-width: 210mm; margin: 20mm auto; padding: 20mm; }
  </style>
</head>
<body>${html}</body>
</html>`
      blob = new Blob([htmlContent], { type: 'text/html' })
      filename = `${documentName}.html`
    } else if (format === 'txt') {
      blob = new Blob([text], { type: 'text/plain' })
      filename = `${documentName}.txt`
    } else {
      const tyContent = JSON.stringify({
        version: '1.0',
        type: 'EUTYPE Document',
        name: documentName,
        created: documentContent?.created || new Date().toISOString(),
        modified: new Date().toISOString(),
        html,
        text
      }, null, 2)
      blob = new Blob([tyContent], { type: 'application/json' })
      filename = `${documentName}.ty`
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleRenameDocument = () => {
    const newName = prompt('Voer nieuwe naam in:', documentName)
    if (newName && newName.trim()) {
      setDocumentName(newName.trim())
      setHasUnsavedChanges(true)
    }
  }

  const handleLogout = () => {
    if (hasUnsavedChanges) {
      if (!confirm('Je hebt niet-opgeslagen wijzigingen. Toch uitloggen?')) {
        return
      }
    }
    logout()
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '1.5rem',
        background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
        color: 'white'
      }}>
        <div style={{ fontSize: '2rem', fontWeight: '700', letterSpacing: '2px' }}>EUTYPE</div>
        <div className="loading-spinner" style={{
          width: '48px',
          height: '48px',
          border: '4px solid rgba(255,255,255,0.3)',
          borderTopColor: 'white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <div style={{ fontSize: '1rem', opacity: 0.9 }}>Document laden...</div>
      </div>
    )
  }

  return (
    <div className="app">
      {/* Top Bar */}
      <div style={{
        background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 10px rgba(124, 58, 237, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={handleBackToFiles}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ← Bestanden
          </button>
          <div style={{ 
            borderLeft: '1px solid rgba(255,255,255,0.2)', 
            paddingLeft: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontWeight: '600', color: 'white', fontSize: '15px' }}>{documentName}</span>
            {hasUnsavedChanges && <span style={{ color: '#fbbf24', fontSize: '20px' }}>●</span>}
            {lastSaved && !hasUnsavedChanges && (
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                Opgeslagen om {lastSaved.toLocaleTimeString('nl-NL')}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user && <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)' }}>{user.username || user.email}</span>}
          <button
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges}
            style={{
              background: 'white',
              color: '#7c3aed',
              border: 'none',
              padding: '8px 20px',
              borderRadius: '8px',
              cursor: saving || !hasUnsavedChanges ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              opacity: saving || !hasUnsavedChanges ? 0.5 : 1
            }}
          >
            {saving ? 'Opslaan...' : '☁️ Opslaan'}
          </button>
          <button
            onClick={handleSaveAs}
            style={{
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Opslaan als...
          </button>
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              color: 'rgba(255,255,255,0.8)',
              border: 'none',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Uitloggen
          </button>
        </div>
      </div>

      <RibbonToolbar
        editor={editor}
        onNew={handleNewDocument}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onExport={handleExport}
        onOpen={handleBackToFiles}
        onPrint={handlePrint}
        onExportPDF={handleExportPDF}
        currentFile={fileId}
        documentName={documentName}
        onRenameDocument={handleRenameDocument}
        onToggleNavigation={() => setShowNavigation(!showNavigation)}
      />
      
      <div className="app-content">
        {showNavigation && (
          <NavigationPanel editor={editor} onClose={() => setShowNavigation(false)} />
        )}
        <div className="editor-wrapper">
          <Editor onEditorReady={setEditor} />
        </div>
      </div>
      
      {showSearch && <SearchPanel editor={editor} onClose={() => setShowSearch(false)} />}
      <StatusBar editor={editor} />

      {/* Save Dialog */}
      <SaveDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSaveToCloud={handleSaveToCloud}
        onDownload={handleDownload}
        documentName={documentName}
        saving={saving}
      />
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getFileContent, updateFileContent, getFileMetadata } from '../api/files'
import { getCurrentUser } from '../api/auth'
import RibbonToolbar from './RibbonToolbar'
import Editor from './Editor'
import StatusBar from './StatusBar'
import NavigationPanel from './NavigationPanel'
import SearchPanel from './SearchPanel'

const SSO_PORTAL_URL = 'http://192.168.124.50:30090'

export default function EditorPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fileId = searchParams.get('file')

  const [editor, setEditor] = useState(null)
  const [documentName, setDocumentName] = useState('Laden...')
  const [documentContent, setDocumentContent] = useState(null)
  const [showNavigation, setShowNavigation] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [user, setUser] = useState(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Redirect als geen file ID
  useEffect(() => {
    if (!fileId) {
      navigate('/')
    }
  }, [fileId, navigate])

  // Load user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await getCurrentUser()
        setUser(userData)
      } catch (err) {
        console.error('Failed to load user:', err)
      }
    }
    loadUser()
  }, [])

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
    // Redirect to SSO portal for logout
    window.location.href = `${SSO_PORTAL_URL}/logout`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Document laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      {/* Top Bar */}
      <div className="bg-white border-b px-4 py-2 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToFiles}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            ← Terug naar bestanden
          </button>
          <div className="border-l pl-4">
            <span className="font-medium text-gray-700">{documentName}</span>
            {hasUnsavedChanges && <span className="ml-2 text-orange-500">●</span>}
            {lastSaved && !hasUnsavedChanges && (
              <span className="ml-2 text-xs text-gray-500">
                Opgeslagen om {lastSaved.toLocaleTimeString('nl-NL')}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user && <span className="text-sm text-gray-600">{user.username}</span>}
          <button
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges}
            className="bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {saving ? 'Opslaan...' : 'Opslaan'}
          </button>
          <button
            onClick={handleLogout}
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            Uitloggen
          </button>
        </div>
      </div>

      <RibbonToolbar
        editor={editor}
        onNew={handleNewDocument}
        onSave={handleSave}
        onSaveAs={() => handleExport('ty')}
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
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { listEuTypeDocuments, createDocument, deleteFile, renameFile } from '../api/files'
import { getCurrentUser } from '../api/auth'

const SSO_PORTAL_URL = 'http://192.168.124.50:30090'

export default function FilePicker() {
  const navigate = useNavigate()
  const [files, setFiles] = useState([])
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)
  const [showNewDocModal, setShowNewDocModal] = useState(false)
  const [newDocName, setNewDocName] = useState('')
  const [renamingFile, setRenamingFile] = useState(null)
  const [newFileName, setNewFileName] = useState('')

  useEffect(() => {
    loadFiles()
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const userData = await getCurrentUser()
      setUser(userData)
    } catch (err) {
      console.error('Failed to load user:', err)
    }
  }

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

  const handleCreateDocument = async () => {
    if (!newDocName.trim()) {
      alert('Voer een documentnaam in')
      return
    }

    try {
      const result = await createDocument(newDocName, {
        html: '<p>Start met typen...</p>',
        text: 'Start met typen...'
      })

      setShowNewDocModal(false)
      setNewDocName('')
      
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
      loadFiles() // Refresh lijst
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

  const handleLogout = () => {
    // Redirect to SSO portal for logout
    window.location.href = `${SSO_PORTAL_URL}/logout`
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              ☁️ EUTYPE <span style={{fontSize: '22px'}}>🚀</span>
              <span className="ml-2 px-2 py-1 rounded bg-white bg-opacity-20 text-xs font-semibold tracking-wide" style={{letterSpacing: '1px'}}>SSO actief</span>
            </h1>
            {user && <p className="text-sm text-blue-100 mt-1">Welkom terug, {user.username}</p>}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowNewDocModal(true)}
              className="bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-blue-50 flex items-center gap-2 font-semibold transition-colors"
            >
              <span>📝</span> Nieuw document
            </button>
            <button
              onClick={handleLogout}
              className="bg-blue-500 bg-opacity-30 text-white px-4 py-2 rounded-md hover:bg-opacity-40 transition-colors"
            >
              Uitloggen
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Documenten laden...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Geen documenten</h3>
            <p className="mt-2 text-gray-600">Maak je eerste EUTYPE document aan</p>
            <button
              onClick={() => setShowNewDocModal(true)}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Nieuw document
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Naam
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Laatst gewijzigd
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grootte
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {files.map((file) => (
                  <tr key={file.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {renamingFile === file.id ? (
                        <div className="flex gap-2">
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
                            className="px-2 py-1 border rounded"
                            autoFocus
                          />
                          <button
                            onClick={() => handleRenameFile(file.id)}
                            className="text-green-600 hover:text-green-800"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => {
                              setRenamingFile(null)
                              setNewFileName('')
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <svg className="h-5 w-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium text-gray-900">{file.filename}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(file.modified_at || file.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenDocument(file.id)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Openen
                      </button>
                      <button
                        onClick={() => {
                          setRenamingFile(file.id)
                          setNewFileName(file.filename.replace('.ty', ''))
                        }}
                        className="text-gray-600 hover:text-gray-900 mr-4"
                      >
                        Hernoemen
                      </button>
                      <button
                        onClick={() => handleDeleteFile(file.id, file.filename)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Verwijderen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* New Document Modal */}
      {showNewDocModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Nieuw document</h2>
            <input
              type="text"
              value={newDocName}
              onChange={(e) => setNewDocName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateDocument()}
              placeholder="Documentnaam"
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowNewDocModal(false)
                  setNewDocName('')
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Annuleren
              </button>
              <button
                onClick={handleCreateDocument}
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
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

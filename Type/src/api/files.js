import apiClient from './client'

/**
 * POST /files/upload
 * Upload a new file
 */
export const uploadFile = async (file, folderId = null, appType = 'eutype') => {
  const formData = new FormData()
  formData.append('file', file)
  if (folderId) {
    formData.append('folder_id', folderId)
  }
  formData.append('app_type', appType)
  
  const response = await apiClient.post('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  
  return response.data
}

/**
 * POST /files/upload (create new EuType document)
 * Create a new .ty document from JSON
 */
export const createDocument = async (documentName, content, folderId = null) => {
  const tyContent = {
    version: '1.0',
    type: 'EUTYPE Document',
    name: documentName,
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    html: content.html || '',
    text: content.text || ''
  }
  
  const blob = new Blob([JSON.stringify(tyContent, null, 2)], { 
    type: 'application/json' 
  })
  
  const file = new File([blob], `${documentName}.ty`, { 
    type: 'application/json' 
  })
  
  return uploadFile(file, folderId, 'eutype')
}

/**
 * GET /files/list
 * List files and folders
 */
export const listFiles = async (folderId = null) => {
  const params = folderId ? { folder_id: folderId } : {}
  const response = await apiClient.get('/files/list', { params })
  return response.data
}

/**
 * GET /files/list (filter for EuType documents only)
 */
export const listEuTypeDocuments = async (folderId = null) => {
  const data = await listFiles(folderId)
  
  // Filter voor .ty bestanden
  const euTypeFiles = data.files.filter(file => 
    file.filename.endsWith('.ty') || file.app_type === 'eutype'
  )
  
  return {
    files: euTypeFiles,
    folders: data.folders
  }
}

/**
 * GET /files/{file_id}
 * Get file metadata
 */
export const getFileMetadata = async (fileId) => {
  const response = await apiClient.get(`/files/${fileId}`)
  return response.data.file
}

/**
 * GET /files/{file_id}/download
 * Download file as binary
 */
export const downloadFile = async (fileId) => {
  const response = await apiClient.get(`/files/${fileId}/download`, {
    responseType: 'blob'
  })
  return response.data
}

/**
 * GET /files/{file_id}/content
 * Get raw text content (for editing)
 */
export const getFileContent = async (fileId) => {
  const response = await apiClient.get(`/files/${fileId}/content`)
  
  const { content, filename, modified_at } = response.data
  
  // Parse JSON if it's a .ty file
  try {
    const parsedContent = JSON.parse(content)
    return {
      ...response.data,
      parsedContent
    }
  } catch (e) {
    // Not JSON, return raw content
    return response.data
  }
}

/**
 * PUT /files/{file_id}/content
 * Update file content (save document)
 */
export const updateFileContent = async (fileId, content) => {
  const formData = new FormData()
  
  // Als content een object is, converteer naar JSON string
  const contentString = typeof content === 'object' 
    ? JSON.stringify(content, null, 2) 
    : content
  
  formData.append('content', contentString)
  
  const response = await apiClient.put(`/files/${fileId}/content`, formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
  
  return response.data
}

/**
 * PUT /files/{file_id}/rename
 * Rename a file
 */
export const renameFile = async (fileId, newName) => {
  const formData = new FormData()
  formData.append('new_name', newName)
  
  const response = await apiClient.put(`/files/${fileId}/rename`, formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
  
  return response.data
}

/**
 * DELETE /files/{file_id}
 * Delete (trash) a file
 */
export const deleteFile = async (fileId) => {
  const response = await apiClient.delete(`/files/${fileId}`)
  return response.data
}

/**
 * GET /storage/usage
 * Get storage usage stats
 */
export const getStorageUsage = async () => {
  const response = await apiClient.get('/storage/usage')
  return response.data
}

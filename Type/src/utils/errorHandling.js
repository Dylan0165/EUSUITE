/**
 * Format API error for display
 * Handles FastAPI validation errors (422) and other error formats
 */
export const formatApiError = (err) => {
  if (!err.response) {
    return 'Netwerkfout. Controleer je internetverbinding.'
  }

  const detail = err.response.data?.detail

  // FastAPI validation errors (array)
  if (Array.isArray(detail)) {
    return detail.map(e => e.msg || e.message || String(e)).join(', ')
  }

  // String error message
  if (typeof detail === 'string') {
    return detail
  }

  // Object error
  if (typeof detail === 'object' && detail.msg) {
    return detail.msg
  }

  // Fallback to HTTP status text
  if (err.response.status === 401) {
    return 'Niet geautoriseerd. Log opnieuw in.'
  }

  if (err.response.status === 403) {
    return 'Geen toegang tot deze resource.'
  }

  if (err.response.status === 404) {
    return 'Resource niet gevonden.'
  }

  if (err.response.status === 500) {
    return 'Server error. Probeer het later opnieuw.'
  }

  // Final fallback
  return err.message || 'Er is een onbekende fout opgetreden'
}

/**
 * Show a temporary success message
 */
export const showSuccessToast = (message, duration = 2000) => {
  const toast = document.createElement('div')
  toast.textContent = `✓ ${message}`
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #10b981;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    z-index: 9999;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
  `
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), duration)
}

/**
 * Show a temporary error message
 */
export const showErrorToast = (message, duration = 3000) => {
  const toast = document.createElement('div')
  toast.textContent = `✕ ${message}`
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ef4444;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    z-index: 9999;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
  `
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), duration)
}

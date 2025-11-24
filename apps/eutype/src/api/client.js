import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://192.168.124.50:30500/api'
const SSO_LOGIN_URL = 'http://192.168.124.50:30090/login'
const EUTYPE_BASE_URL = 'http://192.168.124.50:30081'

// Axios instance voor SSO-based authentication met Auth Core backend
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // KRITIEK: stuurt eusuite_token cookie mee
})

// Response interceptor - redirect naar SSO login bij 401/403
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Sessie verlopen of niet ingelogd - redirect naar centrale login
      // Build full redirect URL back to EUType
      const currentPath = window.location.pathname + window.location.search
      const redirectUrl = EUTYPE_BASE_URL + currentPath
      
      window.location.href = `${SSO_LOGIN_URL}?redirect=${encodeURIComponent(redirectUrl)}`
    }
    return Promise.reject(error)
  }
)

export default apiClient
export { API_BASE_URL, SSO_LOGIN_URL, EUTYPE_BASE_URL }

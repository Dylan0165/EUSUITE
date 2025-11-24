import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = "http://192.168.124.50:30500";
const LOGIN_URL = "http://192.168.124.50:30090/login";
const EUTYPE_BASE_URL = "http://192.168.124.50:30081";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const redirectToLogin = useCallback(() => {
    // Build full redirect URL back to EUType
    const currentPath = window.location.pathname + window.location.search;
    const redirectUrl = EUTYPE_BASE_URL + currentPath;
    window.location.href = `${LOGIN_URL}?redirect=${encodeURIComponent(redirectUrl)}`;
  }, []);

  const validateAuth = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/validate`, {
        method: "GET",
        credentials: "include", // Important: sends SSO cookie
      });

      if (response.status === 401) {
        // Not authenticated - redirect to login portal
        console.log('❌ EUType: No valid session, redirecting to login');
        redirectToLogin();
        return;
      }

      if (!response.ok) {
        // Other error (500, 502, etc) - don't redirect, show error
        console.error('EUType: Backend error', response.status);
        setError(`Backend error: ${response.status}`);
        setLoading(false);
        return;
      }

      const data = await response.json();
      
      // Handle both response formats (user object or top-level fields)
      if (data.valid) {
        const userData = data.user || { 
          username: data.username, 
          email: data.email,
          user_id: data.user_id 
        };
        
        if (userData.username || userData.email) {
          setUser(userData);
          console.log('✅ EUType: SSO authentication successful:', userData.email || userData.username);
        } else {
          console.log('⚠️ EUType: Invalid user data, redirecting');
          redirectToLogin();
          return;
        }
      } else {
        console.log('⚠️ EUType: Session not valid, redirecting');
        redirectToLogin();
        return;
      }

    } catch (err) {
      // Network error - don't redirect, might be temporary
      console.error("EUType: Auth validation network error:", err);
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [redirectToLogin]);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      setUser(null);
      // Redirect to login with EUType as target
      window.location.href = `${LOGIN_URL}?redirect=${encodeURIComponent(EUTYPE_BASE_URL)}`;
    }
  }, []);

  useEffect(() => {
    validateAuth();
  }, [validateAuth]);

  return { user, loading, error, logout, refetch: validateAuth };
};

import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = "http://192.168.124.50:30500";
const LOGIN_URL = "http://192.168.124.50:30090/login";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getRedirectPath = () => {
    let currentPath = window.location.pathname + window.location.search;
    // Fix: Remove /eutype if present (legacy path) to prevent loops
    if (currentPath.startsWith('/eutype')) {
      currentPath = currentPath.replace('/eutype', '');
    }
    return currentPath || "/";
  };

  const redirectToLogin = () => {
    const redirect = getRedirectPath();
    window.location.href = `${LOGIN_URL}?redirect=${encodeURIComponent(redirect)}`;
  };

  const validateAuth = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/validate`, {
        method: "GET",
        credentials: "include",
      });

      if (response.status === 401) {
        redirectToLogin();
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (data.valid && data.username) {
          setUser({ username: data.username, email: data.email });
        } else {
          redirectToLogin();
          return;
        }
      } else {
        redirectToLogin();
        return;
      }

    } catch (err) {
      console.error("Auth validation error:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      window.location.href = `${LOGIN_URL}?redirect=/`;
    }
  }, []);

  useEffect(() => {
    validateAuth();
  }, [validateAuth]);

  return { user, loading, error, logout, refetch: validateAuth };
};

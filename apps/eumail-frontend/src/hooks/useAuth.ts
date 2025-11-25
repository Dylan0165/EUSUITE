import { useState, useEffect, useCallback } from 'react';
import { CORE_VALIDATE_URL, LOGIN_URL } from '../config/constants';

interface User {
  user_id: string;
  email: string;
  username?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const validateSession = useCallback(async () => {
    try {
      const response = await fetch(CORE_VALIDATE_URL, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        setUser({
          user_id: userData.user_id || userData.id,
          email: userData.email,
          username: userData.username,
        });
      } else {
        // Not authenticated, redirect to login
        window.location.href = LOGIN_URL;
      }
    } catch (error) {
      console.error('Auth validation failed:', error);
      window.location.href = LOGIN_URL;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    validateSession();
  }, [validateSession]);

  return { user, loading, validateSession };
}

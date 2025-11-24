import { useState, useEffect } from 'react';
import { API_BASE_URL, LOGIN_URL } from '../config/constants';
import type { User } from '../types/auth';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const validateAuth = async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ Fetch naar backend op port 30500 (NIET 30091)
      const response = await fetch(`${API_BASE_URL}/api/auth/validate`, {
        method: 'GET',
        credentials: 'include', // ✅ Stuurt eusuite_token cookie mee
      });

      // ✅ ALLEEN bij 401 redirect naar login
      if (response.status === 401) {
        console.log('401 Unauthorized - Gebruiker niet ingelogd, redirect naar login');
        setUser(null);
        setError('Not authenticated');
        
        // Redirect naar login met current path als redirect parameter
        const redirectPath = window.location.pathname + window.location.search;
        const redirectUrl = redirectPath === '/' ? '/dashboard' : redirectPath;
        window.location.href = `${LOGIN_URL}?redirect=${encodeURIComponent(redirectUrl)}`;
        return; // Stop verdere verwerking
      }

      // ✅ Bij andere fouten (500, 502, 503, etc): GEEN redirect
      if (!response.ok) {
        const errorMsg = `Backend error: ${response.status} ${response.statusText}`;
        console.error(errorMsg);
        setError(errorMsg);
        setUser(null);
        setLoading(false);
        return; // Stop, maar GEEN redirect
      }

      // ✅ Response OK (200) - Parse JSON en valideer user data
      const data = await response.json();
      
      if (data.valid && data.username) {
        console.log('Auth validate succesvol:', data.username);
        setUser({ 
          username: data.username, 
          email: data.email || '' 
        });
        setError(null);
      } else {
        // Data is niet valid, maar response was 200
        // Dit is een backend inconsistentie - GEEN redirect
        console.warn('Validate response was 200 maar data.valid is false');
        setUser(null);
        setError('Invalid response from backend');
      }

    } catch (err) {
      // ✅ Network errors, timeouts, CORS, JSON parse errors
      // GEEN redirect - dit zijn technische fouten
      const errorMsg = err instanceof Error ? err.message : 'Network error';
      console.error('Validate request failed (network/timeout):', errorMsg);
      setError(errorMsg);
      setUser(null);
      // GEEN window.location.href hier!
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out...');
      
      // POST naar logout endpoint
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include', // ✅ Stuurt cookie mee voor invalidatie
      });
      
      setUser(null);
      
      // ✅ Na logout altijd redirect naar login
      window.location.href = `${LOGIN_URL}?redirect=${encodeURIComponent('/dashboard')}`;
    } catch (err) {
      console.error('Logout request failed:', err);
      
      // ✅ Ook bij logout fout: toch redirect naar login
      // (gebruiker wil uitloggen, dus stuur naar login)
      setUser(null);
      window.location.href = LOGIN_URL;
    }
  };

  useEffect(() => {
    // ✅ Validate bij mount
    validateAuth();
  }, []);

  return { 
    user, 
    loading, 
    error, 
    logout, 
    refetch: validateAuth 
  };
};

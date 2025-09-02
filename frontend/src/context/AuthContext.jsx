// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../lib/api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser(parsed);
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
        if (token && api?.defaults?.headers) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
      }
    } catch {}
  }, []);

  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,

    // Optional helper to set token+user from any place (we'll call this in login)
    loginWith: ({ token, user }) => {
      try {
        if (token) {
          localStorage.setItem('token', token);
          localStorage.setItem('accessToken', token);
          if (api?.defaults?.headers) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          }
        }
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
          setUser(user);
        }
      } catch {}
    },

    // Update profile and persist
    updateUser: (patch = {}) => {
      setUser(prev => {
        const next = { ...(prev || {}), ...patch };
        try { localStorage.setItem('user', JSON.stringify(next)); } catch {}
        return next;
      });
    },

    // Clear auth everywhere
    logout: () => {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        if (api?.defaults?.headers) {
          delete api.defaults.headers.common['Authorization'];
        }
      } catch {}
      setUser(null);
    },
  }), [user]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}

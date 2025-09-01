// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (raw) setUser(JSON.parse(raw));
  }, []);

  const value = useMemo(
    () => ({
      user,

      // Accepts { token, user } from login API
      login: ({ token, user }) => {
        if (token) localStorage.setItem('token', token);
        if (user) {
          // Normalize id shape so UI can use user._id everywhere
          const normalized = { ...user, _id: user._id || user.id };
          localStorage.setItem('user', JSON.stringify(normalized));
          setUser(normalized);
        }
      },

      // Merge updates into current user + persist
      updateUser: (patch = {}) => {
        setUser(prev => {
          const next = { ...(prev || {}), ...patch };
          localStorage.setItem('user', JSON.stringify(next));
          return next;
        });
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
    }),
    [user]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}

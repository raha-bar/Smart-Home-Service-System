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
      login: ({ token, user }) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
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

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import { useToast } from '../components/ui/Toast.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { push } = useToast() || { push: () => {} };
  const { loginWith } = useAuth() || {};
  const navigate = useNavigate();
  const location = useLocation();

  const login = useMutation({
    mutationFn: async ({ email, password }) => {
      const res = await api.post('/auth/login', { email, password });
      return res.data;
    },
    onSuccess: (data) => {
      const token = data?.token || data?.accessToken || data?.jwt || data?.access_token || null;
      const user  = data?.user || data?.profile || data?.data?.user || null;

      // Persist via context and set axios Authorization header
      loginWith?.({ token, user });

      try { push({ title: 'Welcome back!', variant: 'success' }); } catch {}

      // Always send users to Home after login
      const target = '/Home';

      try { navigate(target, { replace: true }); }
      catch { window.location.replace(target); }
    },
    onError: (e) => {
      const msg = e?.message || e?.response?.data?.message || 'Login failed';
      try { push({ title: msg, variant: 'error' }); } catch {}
    }
  });

  const onSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) return;
    login.mutate({ email, password });
  };

  return (
    <section
      className="container"
      style={{ display: 'grid', placeItems: 'start', minHeight: 'calc(100vh - 220px)' }}
    >
      <div className="card" style={{ maxWidth: 520, width: '100%', margin: '40px auto' }}>
        <h2 style={{ marginTop: 0 }}>Login</h2>

        <form onSubmit={onSubmit} className="form" style={{ display: 'grid', gap: 12 }}>
          <label>
            Email
            <input
              className="input"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          <button className="btn btn-primary" type="submit" disabled={login.isPending}>
            {login.isPending ? 'Signing in…' : 'Login'}
          </button>
        </form>

        <div className="muted" style={{ marginTop: 12 }}>
          No account? <Link to="/register">Create one</Link>
        </div>
        <div className="muted" style={{ marginTop: 6 }}>
          Want to work with us? <Link to="/become-provider">Become a provider</Link>
        </div>
      </div>
    </section>
  );
}

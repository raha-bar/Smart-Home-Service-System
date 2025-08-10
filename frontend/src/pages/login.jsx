import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const from = loc.state?.from?.pathname || '/';

  const mutation = useMutation({
    mutationFn: (payload) => api.post('/auth/login', payload).then((r) => r.data),
    onSuccess: (data) => {
      login(data);
      nav(from, { replace: true });
    }
  });

  function onSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    mutation.mutate({ email: form.get('email'), password: form.get('password') });
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8, maxWidth: 360 }}>
      <h2>Login</h2>
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />
      <button disabled={mutation.isPending}>{mutation.isPending ? 'Logging in…' : 'Login'}</button>
      {mutation.error && <p style={{ color: 'crimson' }}>{mutation.error.message}</p>}
    </form>
  );
}
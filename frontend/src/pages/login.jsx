import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext.jsx';
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
    <form onSubmit={onSubmit} className="form">
      <h2>Login</h2>
      <label>Email<input name="email" type="email" className="input" required /></label>
      <label>Password<input name="password" type="password" className="input" required /></label>
      <button className="btn btn-primary" disabled={mutation.isPending}>
        {mutation.isPending ? 'Logging in…' : 'Login'}
      </button>
      {mutation.error && <p className="mono" style={{color:'#ff9b9b'}}>{mutation.error.message}</p>}
    </form>
  );
}

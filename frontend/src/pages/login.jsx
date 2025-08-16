import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext.jsx';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

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
    <section className="container" style={{maxWidth:520}}>
      <form onSubmit={onSubmit} className="form card">
        <h2>Login</h2>
        <label>Email
          <Input name="email" type="email" required placeholder="name@example.com" />
        </label>
        <label>Password
          <Input name="password" type="password" required placeholder="••••••••" />
        </label>
        <Button variant="primary" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Logging in…' : 'Login'}
        </Button>
        {mutation.isError && <p className="error mono">{mutation.error.message}</p>}
        <p className="muted">No account? <Link to="/register">Create one</Link></p>
      </form>
    </section>
  );
}

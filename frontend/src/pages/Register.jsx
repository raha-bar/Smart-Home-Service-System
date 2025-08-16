import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function Register() {
  const { login } = useAuth();
  const nav = useNavigate();

  const mutation = useMutation({
    mutationFn: (payload) => api.post('/auth/register', payload).then((r) => r.data),
    onSuccess: (data) => {
      login(data);
      nav('/');
    }
  });

  function onSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = fd.get('name');
    const email = fd.get('email');
    const password = fd.get('password');
    mutation.mutate({ name, email, password });
  }

  return (
    <section className="container" style={{maxWidth:520}}>
      <form onSubmit={onSubmit} className="form card">
        <h2>Create account</h2>
        <label>Name
          <Input name="name" required placeholder="Your name" />
        </label>
        <label>Email
          <Input name="email" type="email" required placeholder="name@example.com" />
        </label>
        <label>Password
          <Input name="password" type="password" required minLength={6} placeholder="min 6 characters" />
        </label>
        <Button variant="primary" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Creating…' : 'Create account'}
        </Button>
        {mutation.isError && <p className="error mono">{mutation.error.message}</p>}
        <p className="muted">Already have an account? <Link to="/login">Login</Link></p>
      </form>
    </section>
  );
}

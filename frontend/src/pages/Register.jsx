import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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
    const form = new FormData(e.currentTarget);
    mutation.mutate({
      name: form.get('name'),
      email: form.get('email'),
      password: form.get('password')
    });
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8, maxWidth: 360 }}>
      <h2>Register</h2>
      <input name="name" placeholder="Name" required />
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password (min 6)" minLength={6} required />
      <button disabled={mutation.isPending}>{mutation.isPending ? 'Creating…' : 'Create account'}</button>
      {mutation.error && <p style={{ color: 'crimson' }}>{mutation.error.message}</p>}
    </form>
  );
}

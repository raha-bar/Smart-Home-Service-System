import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext.jsx';
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
    <form onSubmit={onSubmit} className="form">
      <h2>Create account</h2>
      <label>Name<input name="name" className="input" required /></label>
      <label>Email<input name="email" type="email" className="input" required /></label>
      <label>Password<input name="password" type="password" className="input" minLength={6} required /></label>
      <button className="btn btn-primary" disabled={mutation.isPending}>
        {mutation.isPending ? 'Creating…' : 'Create account'}
      </button>
      {mutation.error && <p className="mono" style={{color:'#ff9b9b'}}>{mutation.error.message}</p>}
    </form>
  );
}

import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

function toArray(v) {
  if (Array.isArray(v)) return v.filter(Boolean);
  return String(v || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function BecomeProvider() {
  const { login } = useAuth();
  const nav = useNavigate();

  const mutation = useMutation({
    // IMPORTANT: re-use the existing working endpoint
    mutationFn: (payload) => api.post('/auth/register', payload).then((r) => r.data),
    onSuccess: (data) => {
      // identical behavior to Register.jsx
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

    // provider fields
    const phone = fd.get('phone');
    const city = fd.get('city');
    const skills = toArray(fd.get('skills'));
    const experienceYears = Number(fd.get('experience') || 0) || 0;
    const bio = fd.get('bio');

    if (!name || !email || !password) return;

    // Same endpoint as Register, but with asProvider=true
    mutation.mutate({
      name,
      email,
      password,
      asProvider: true,        // <— tells backend to create provider user
      phone,
      city,
      skills,
      experienceYears,
      bio,
      categories: [],          // include if you later add fields
      serviceAreas: [],
    });
  }

  return (
    <section className="container" style={{ maxWidth: 520 }}>
      <form onSubmit={onSubmit} className="form card">
        <h2>Become a Provider</h2>

        <label>Full Name
          <Input name="name" required placeholder="Your name" />
        </label>
        <label>Email
          <Input name="email" type="email" required placeholder="name@example.com" />
        </label>
        <label>Password
          <Input name="password" type="password" required minLength={6} placeholder="min 6 characters" />
        </label>

        <label>Phone
          <Input name="phone" required placeholder="01XXXXXXXXX" />
        </label>
        <label>City
          <Input name="city" required placeholder="Your city" />
        </label>
        <label>Skills / Services
          <Input name="skills" placeholder="Cleaning, Plumbing (comma separated)" />
        </label>
        <label>Years of Experience
          <Input name="experience" placeholder="e.g., 3" />
        </label>
        <label>Short Bio
          <textarea className="input" name="bio" rows={4} placeholder="Tell customers about your background" />
        </label>

        <Button variant="primary" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Submitting…' : 'Submit & Join'}
        </Button>

        {mutation.isError && (
          <p className="error mono" style={{ whiteSpace: 'pre-wrap' }}>
            {mutation.error?.response?.data?.message ||
              mutation.error?.message ||
              'Failed to create provider account'}
          </p>
        )}
      </form>
    </section>
  );
}

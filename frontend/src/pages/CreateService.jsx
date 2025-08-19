import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext.jsx';

export default function CreateService() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const { user } = useAuth();

  // Only admin/manager/provider can create services
  const canCreate =
    !!user && ['admin', 'manager', 'provider'].includes(String(user.role || ''));

  const mutation = useMutation({
    mutationFn: (payload) => api.post('/services', payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      nav('/');
    }
  });

  if (!canCreate) {
    return (
      <section className="container" style={{ maxWidth: 720 }}>
        <h2>Create Service</h2>
        <p className="muted">Only admin or provider can create services.</p>
      </section>
    );
  }

  return (
    <section className="container" style={{ maxWidth: 720 }}>
      <h2>Create Service</h2>

      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const payload = {
            name: fd.get('name')?.trim(),
            category: fd.get('category')?.trim(),
            description: fd.get('description')?.trim(),
            price: Number(fd.get('price') || 0),
            durationMin: Number(fd.get('durationMin') || 60)
          };
          if (!payload.name || !payload.category) return;
          mutation.mutate(payload);
        }}
      >
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={{ gridColumn: '1 / -1' }}>
            Name
            <Input name="name" placeholder="e.g., AC deep cleaning" required />
          </label>

          <label>
            Category
            <Input name="category" placeholder="e.g., Cleaning" required />
          </label>

          <label>
            Price (USD)
            <Input name="price" type="number" step="0.01" required />
          </label>

          <label>
            Duration (minutes)
            <Input name="durationMin" type="number" defaultValue={60} />
          </label>

          <label style={{ gridColumn: '1 / -1' }}>
            Description
            <textarea
              name="description"
              className="input"
              rows={4}
              placeholder="Describe what is included"
            />
          </label>
        </div>

        <Button variant="primary" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : 'Create'}
        </Button>
      </form>
    </section>
  );
}

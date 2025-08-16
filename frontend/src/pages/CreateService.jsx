import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function CreateService() {
  const qc = useQueryClient();
  const nav = useNavigate();

  const mutation = useMutation({
    mutationFn: (payload) => api.post('/services', payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      nav('/');
    }
  });

  function onSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = fd.get('name');
    const description = fd.get('description');
    const category = fd.get('category');
    const price = Number(fd.get('price'));
    const durationMin = Number(fd.get('durationMin') || 60);
    mutation.mutate({ name, description, category, price, durationMin });
  }

  return (
    <section className="container" style={{maxWidth:640}}>
      <form onSubmit={onSubmit} className="form card">
        <h2>New Service</h2>
        <label>Name
          <Input name="name" required placeholder="e.g., AC Repair" />
        </label>
        <label>Description
          <textarea name="description" className="input" rows="4" required placeholder="What is included? Tools, parts, etc." />
        </label>
        <label>Category
          <select name="category" className="input" required>
            <option>Cleaning</option>
            <option>Electrical</option>
            <option>Plumbing</option>
            <option>HVAC</option>
            <option>Repair</option>
            <option>Other</option>
          </select>
        </label>
        <div className="row" style={{gap:12}}>
          <label style={{flex:1}}>Price (USD)
            <Input name="price" type="number" step="0.01" required />
          </label>
          <label style={{flex:1}}>Duration (minutes)
            <Input name="durationMin" type="number" defaultValue={60} />
          </label>
        </div>
        <Button variant="primary" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : 'Create'}
        </Button>
      </form>
    </section>
  );
}

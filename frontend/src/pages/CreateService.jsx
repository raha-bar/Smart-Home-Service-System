import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

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
    const price = parseFloat(fd.get('price'));
    const category = fd.get('category');
    mutation.mutate({ name, description, price, category });
  }

  return (
    <form onSubmit={onSubmit} className="form">
      <h2>Create Service</h2>
      <label>Name<input name="name" className="input" required /></label>
      <label>Description<textarea name="description" className="textarea" /></label>
      <label>Price<input name="price" type="number" step="0.01" min="0" className="input" required /></label>
      <label>Category<input name="category" className="input" /></label>
      <button className="btn btn-primary" disabled={mutation.isPending}>
        {mutation.isPending ? 'Creating…' : 'Create Service'}
      </button>
      {mutation.error && <p className="mono" style={{color:'#ff9b9b'}}>{mutation.error.message}</p>}
    </form>
  );
}

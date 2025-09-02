import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import ServiceForm from '../components/admin/ServiceForm.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function CreateService() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const { user } = useAuth();

  // Only admin/manager/provider can create services
  const canCreate = !!user && ['admin', 'manager', 'provider'].includes(String(user.role || ''));

  const mutation = useMutation({
    mutationFn: (payload) => api.post('/services', payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-services'] });
      nav('/admin/services');
    },
  });

  if (!canCreate) {
    return (
      <section className="container">
        <h2>Create Service</h2>
        <p className="muted">Only admin/manager/provider can create services.</p>
      </section>
    );
  }

  return (
    <section className="container" style={{ maxWidth: 720 }}>
      <h2>Create Service</h2>
      <ServiceForm
        pending={mutation.isPending}
        onSubmit={(payload) => {
          if (!payload?.name || payload.price == null) return;
          mutation.mutate(payload);
        }}
      />
      {mutation.isError && <p className="error mono" style={{ marginTop: 10 }}>{mutation.error.message}</p>}
    </section>
  );
}

import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api.js';
import Button from '../../components/ui/Button.jsx';
import { useToast } from '../../components/ui/Toast.jsx';

export default function ProviderDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { push } = useToast() || { push: () => {} };

  const { data, isLoading, error } = useQuery({
    queryKey: ['provider', id],
    queryFn: async () => (await api.get(`/providers/${id}`)).data
  });

  const setStatus = useMutation({
    mutationFn: async (status) => (await api.patch(`/providers/${id}`, { status })).data,
    onSuccess: () => {
      push({ title: 'Status updated' });
      qc.invalidateQueries({ queryKey: ['provider', id] });
      qc.invalidateQueries({ queryKey: ['providers'] });
    }
  });

  if (isLoading) return <div>Loading…</div>;
  if (error) return <div className="error">{error.message}</div>;
  const p = data;

  return (
    <div className="container">
      <h2>Provider Detail</h2>
      <div className="card">
        <div><strong>Name:</strong> {p?.name || '-'}</div>
        <div><strong>Phone:</strong> {p?.phone || '-'}</div>
        <div><strong>Email:</strong> {p?.email || '-'}</div>
        <div><strong>Status:</strong> {p?.status || '-'}</div>
        <div><strong>Rating:</strong> {typeof p?.rating === 'number' ? p.rating.toFixed(1) : '-'}</div>
        <div><strong>KYC:</strong> {p?.kycStatus || '-'}</div>
      </div>

      <div className="flex gap-2 mt-4">
        <Button onClick={() => setStatus.mutate('approved')} disabled={setStatus.isPending}>Approve</Button>
        <Button variant="secondary" onClick={() => setStatus.mutate('rejected')} disabled={setStatus.isPending}>Reject</Button>
      </div>

      <h3 className="mt-6">Recent Jobs</h3>
      {/* Optional: if backend exposes /bookings?provider=id */}
      {/* Render a table of recent bookings here when available */}
    </div>
  );
}

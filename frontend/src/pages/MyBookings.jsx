import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext.jsx';

export default function MyBookings() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isManager = user && (user.role === 'admin' || user.role === 'provider');

  const { data, isLoading, error } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => api.get('/bookings/me').then((r) => r.data)
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => api.put(`/bookings/${id}/status`, { status }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-bookings'] })
  });

  if (isLoading) return <p className="mono">Loading…</p>;
  if (error) return <p className="error mono">Failed to load: {error.message}</p>;

  return (
    <section className="section">
      <h2>My Bookings</h2>
      <div className="stack">
        {data?.length === 0 && <p className="muted">No bookings yet.</p>}
        {data?.map((b) => (
          <div key={b._id} className="card">
            <div className="row space-between">
              <div>
                <div className="mono">{new Date(b.scheduledAt).toLocaleString()}</div>
                <div className="muted">{b.address}</div>
              </div>
              <div className="chip">{b.status}</div>
            </div>
            <div className="row space-between">
              <div className="muted">Service: {b.service?.name || b.serviceName}</div>
              <div className="price">${Number(b.price || 0).toFixed(2)}</div>
            </div>
            {isManager && (
              <div className="row gap">
                <button className="btn" onClick={() => updateStatus.mutate({ id: b._id, status: 'confirmed' })}>Confirm</button>
                <button className="btn" onClick={() => updateStatus.mutate({ id: b._id, status: 'completed' })}>Complete</button>
                <button className="btn" onClick={() => updateStatus.mutate({ id: b._id, status: 'cancelled' })}>Cancel</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

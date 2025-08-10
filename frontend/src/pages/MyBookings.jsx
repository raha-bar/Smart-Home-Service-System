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
  if (error) return <p className="mono">Error: {error.message}</p>;

  return (
    <section className="section">
      <h2>My Bookings</h2>
      {data?.length === 0 && <p className="mono">No bookings yet.</p>}
      <div className="grid">
        {data?.map((b) => (
          <div key={b._id} className="card">
            <div className="row"><strong>{b.service?.name}</strong></div>
            <div className="mono">{new Date(b.scheduledAt).toLocaleString()}</div>
            <div className="mono">{b.address}</div>
            {b.notes && <div className="mono">Notes: {b.notes}</div>}
            <div className="row" style={{marginTop:8}}>
              <span className={`status ${b.status}`}>{b.status}</span>
              {isManager && (
                <select
                  className="select"
                  defaultValue={b.status}
                  onChange={(e) => updateStatus.mutate({ id: b._id, status: e.target.value })}
                >
                  <option value="pending">pending</option>
                  <option value="confirmed">confirmed</option>
                  <option value="completed">completed</option>
                  <option value="cancelled">cancelled</option>
                </select>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

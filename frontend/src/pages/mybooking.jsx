import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export default function MyBookings() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => api.get('/bookings/me').then((r) => r.data)
  });

  if (isLoading) return <p>Loading…</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <h2>My Bookings</h2>
      {data?.length === 0 && <p>No bookings yet.</p>}
      {data?.map((b) => (
        <div key={b._id} style={{ border: '1px solid #eee', padding: 8, borderRadius: 8 }}>
          <div><strong>{b.service?.name}</strong></div>
          <div>{new Date(b.scheduledAt).toLocaleString()}</div>
          <div>Status: {b.status}</div>
          <div>{b.address}</div>
          {b.notes && <div>Notes: {b.notes}</div>}
        </div>
      ))}
    </div>
  );
}
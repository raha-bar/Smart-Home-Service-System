import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import BookingForm from '../components/BookingForm';
import { useAuth } from '../context/AuthContext';

export default function ServiceDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['service', id],
    queryFn: () => api.get(`/services/${id}`).then((r) => r.data)
  });

  if (isLoading) return <p>Loading…</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (!data) return <p>Service not found</p>;

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <h2>{data.name}</h2>
      <p>{data.description}</p>
      <strong>${data.price.toFixed(2)}</strong>
      {user ? <BookingForm serviceId={id} /> : <p>Please login to book.</p>}
    </div>
  );
}
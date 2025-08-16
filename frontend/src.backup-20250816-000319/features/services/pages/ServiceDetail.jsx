import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import BookingForm from '../components/BookingForm.jsx';
import { useAuth } from "@/features/auth/hooks/AuthContext";

export default function ServiceDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['service', id],
    queryFn: () => api.get(`/services/${id}`).then((r) => r.data)
  });

  if (isLoading) return <p className="mono">Loading…</p>;
  if (error) return <p className="mono">Error: {error.message}</p>;
  if (!data) return <p className="mono">Service not found</p>;

  return (
    <section className="section">
      <div className="card">
        <h2>{data.name}</h2>
        <p>{data.description}</p>
        <div className="row">
          <span className="price">${data.price.toFixed(2)}</span>
          <span className="mono">{data.category}</span>
        </div>
      </div>

      {user ? (
        <BookingForm serviceId={id} />
      ) : (
        <p className="mono">Please login to book.</p>
      )}
    </section>
  );
}

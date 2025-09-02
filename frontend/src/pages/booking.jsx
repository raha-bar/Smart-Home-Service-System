import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import BookingForm from '../components/BookingForm.jsx';

export default function Book() {
  const { id } = useParams(); // service id

  const { data, isLoading, error } = useQuery({
    queryKey: ['service', id],
    queryFn: () => api.get(`/services/${id}`).then(r => r.data),
    keepPreviousData: true,
  });

  const service = data && (Array.isArray(data) ? data[0] : data);

  if (isLoading) {
    return (
      <section className="container">
        <h2>Book service</h2>
        <div className="card" style={{ height: 260 }} />
      </section>
    );
  }

  if (error || !service) {
    return (
      <section className="container">
        <h2>Book service</h2>
        <p className="muted">Failed to load service.</p>
      </section>
    );
  }

  return (
    <section className="container" style={{ display:'grid', gap:24, gridTemplateColumns:'1fr .85fr' }}>
      <div className="card">
        <h2 style={{ marginTop:0 }}>{service?.name || 'Service'}</h2>
        <p className="muted">{service?.description || '—'}</p>
      </div>

      <div className="card">
        <h3 style={{ marginTop:0 }}>Schedule & confirm</h3>
        <BookingForm serviceId={id} />
      </div>
    </section>
  );
}

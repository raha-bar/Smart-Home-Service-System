import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import ServiceCard from '../components/ServiceCard';

export default function Services() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['services'],
    queryFn: () => api.get('/services').then((r) => r.data)
  });

  if (isLoading) return <p>Loading services…</p>;
  if (error) return <p>Failed to load: {error.message}</p>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
      {data?.map((s) => (
        <ServiceCard key={s._id} service={s} />
      ))}
    </div>
  );
}
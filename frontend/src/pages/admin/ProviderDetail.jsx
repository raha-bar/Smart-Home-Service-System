import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import DataTable from '../../components/admin/DataTable.jsx';

export default function ProviderDetail() {
  const { id } = useParams();

  const { data: pData, isLoading: pLoading, error: pError } = useQuery({
    queryKey: ['provider', id],
    queryFn: () => api.get(`/providers/${id}`).then(r => r.data),
    keepPreviousData: true,
  });

  const provider = useMemo(() => pData?.provider || pData?.data?.provider || pData || null, [pData]);

  const { data: bData, isLoading: bLoading, error: bError } = useQuery({
    queryKey: ['provider-bookings', id],
    queryFn: () => api.get(`/bookings?provider=${id}`).then(r => r.data),
    keepPreviousData: true,
  });

  const bookings = useMemo(() => {
    if (!bData) return [];
    if (Array.isArray(bData)) return bData;
    if (Array.isArray(bData?.bookings)) return bData.bookings;
    return [];
  }, [bData]);

  const columns = [
    { key:'customer', header:'Customer', accessor: r => r.customer?.name || r.user?.name || '—' },
    { key:'service', header:'Service', accessor: r => r.service?.name || '—' },
    { key:'scheduledAt', header:'Scheduled', accessor: r => new Date(r.scheduledAt || r.date || 0), render: r =>
      <span className="muted">{r.scheduledAt ? new Date(r.scheduledAt).toLocaleString() : '—'}</span>, width: 180
    },
    { key:'status', header:'Status', accessor: r => r.status || '—', render: r => <span className="pill">{labelize(r.status)}</span>, width: 130 },
    { key:'payment', header:'Payment', accessor: r => r.paymentStatus || 'unpaid', render: r => <span className="pill">{labelize(r.paymentStatus || 'unpaid')}</span>, width: 120 },
  ];

  return (
    <section className="container">
      <h2 style={{ marginBottom: 8 }}>Provider</h2>
      {pLoading && <div className="card">Loading provider…</div>}
      {pError && <div className="card">Failed: {pError.message}</div>}
      {provider && (
        <div className="card" style={{ display:'grid', gap:8, marginBottom: 16 }}>
          <strong>{provider.name}</strong>
          <div className="muted">{provider.email} • {provider.phone}</div>
          <div className="muted">Status: <span className="pill">{labelize(provider.status || 'active')}</span></div>
        </div>
      )}

      <h3 style={{ margin: '8px 0' }}>Assigned bookings</h3>
      {bLoading && <div className="card">Loading bookings…</div>}
      {bError && <div className="card">Failed: {bError.message}</div>}
      {!bLoading && !bError && (
        <DataTable
          columns={columns}
          rows={bookings}
        />
      )}
    </section>
  );
}
function labelize(s){const t=String(s||'').replace(/[-_]/g,' ').trim();return t?t[0].toUpperCase()+t.slice(1):'—'}

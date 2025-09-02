import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import DataTable from '../../components/admin/DataTable.jsx';
import DensityToggle from '../../components/admin/DensityToggle.jsx';

export default function Assigned() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['provider-assigned'],
    queryFn: () => api.get('/bookings?assigned=me').then(r => r.data),
    keepPreviousData: true,
  });

  const rows = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.bookings)) return data.bookings;
    return [];
  }, [data]);

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('All');
  const [density, setDensity] = useState('comfortable');

  const statuses = useMemo(() => {
    const set = new Set();
    rows.forEach(b => { if (b.status) set.add(String(b.status).toLowerCase()); });
    const arr = Array.from(set);
    return arr.length ? ['All', ...arr] : ['All', 'pending', 'confirmed', 'in-progress', 'completed', 'cancelled'];
  }, [rows]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return rows.filter(b => {
      const svc = (b.service?.name || '').toLowerCase();
      const addr = (b.address || '').toLowerCase();
      const s = String(b.status || '').toLowerCase();
      const okQ = !qq || svc.includes(qq) || addr.includes(qq);
      const okS = status === 'All' || s === status.toLowerCase();
      return okQ && okS;
    });
  }, [rows, q, status]);

  const columns = [
    { key:'service', header:'Service', accessor: r => r.service?.name || '—' },
    { key:'when', header:'When', accessor: r => new Date(r.scheduledAt || r.date || 0), render: r =>
      <span className="muted">{r.scheduledAt ? new Date(r.scheduledAt).toLocaleString() : '—'}</span>, width: 180
    },
    { key:'address', header:'Address', accessor: r => r.address || '—' },
    { key:'status', header:'Status', accessor: r => r.status || '—', render: r => <span className="pill">{labelize(r.status)}</span>, width: 130 },
    { key:'payment', header:'Payment', accessor: r => r.paymentStatus || 'unpaid', render: r => <span className="pill">{labelize(r.paymentStatus || 'unpaid')}</span>, width: 120 },
  ];

  return (
    <section className="container">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap' }}>
        <div>
          <h2 style={{ margin: 0 }}>Assigned jobs</h2>
          <div className="muted">{filtered.length} jobs</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <input className="input" placeholder="Search service or address…" value={q} onChange={e=>setQ(e.target.value)} style={{ minWidth:260 }} />
          <select className="input" value={status} onChange={e=>setStatus(e.target.value)}>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <DensityToggle value={density} onChange={setDensity} />
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        {isLoading && <div className="card">Loading…</div>}
        {error && <div className="card">Failed: {error.message}</div>}
        {!isLoading && !error && (
          <DataTable
            columns={columns}
            rows={filtered}
            density={density}
          />
        )}
      </div>
    </section>
  );
}
function labelize(s){const t=String(s||'').replace(/[-_]/g,' ').trim();return t?t[0].toUpperCase()+t.slice(1):'—'}

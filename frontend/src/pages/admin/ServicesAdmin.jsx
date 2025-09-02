import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import DataTable from '../../components/admin/DataTable.jsx';
import DensityToggle from '../../components/admin/DensityToggle.jsx';
import CsvButton from '../../components/admin/CsvButton.jsx';

export default function ServicesAdmin() {
  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['admin-services'],
    queryFn: fetchServicesFlex,
    staleTime: 30_000,
    retry: 0,
    refetchOnWindowFocus: false,
  });

  const services = useMemo(() => normalizeServices(data), [data]);

  const [q, setQ] = useState('');
  const cats = useMemo(() => ['All', ...Array.from(new Set(services.map(s => s.category || 'Other')))], [services]);
  const [category, setCategory] = useState('All');
  const [density, setDensity] = useState('compact');

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return services.filter(s => {
      const matchQ = !qq || (s.name || '').toLowerCase().includes(qq) || (s.description || '').toLowerCase().includes(qq);
      const matchC = category === 'All' || (s.category || 'Other') === category;
      return matchQ && matchC;
    });
  }, [services, q, category]);

  const columns = [
    { key: 'name', header: 'Name', accessor: r => r.name },
    { key: 'category', header: 'Category', accessor: r => r.category || 'Other', width: 140 },
    { key: 'price', header: 'Price', accessor: r => Number(r.price || 0), render: r => <>${Number(r.price || 0).toFixed(2)}</>, width: 110, align:'right' },
    { key: 'active', header: 'Status', accessor: r => r.active ? 'Active' : 'Inactive', render: r => (
      <span className="pill">{r.active ? 'Active' : 'Inactive'}</span>
    ), width: 120 },
    { key: 'updatedAt', header: 'Updated', accessor: r => new Date(r.updatedAt || r.createdAt || 0), render: r => (
      <span className="muted">{timeAgo(r.updatedAt || r.createdAt)}</span>
    ), width: 140 }
  ];

  return (
    <section className="container">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap' }}>
        <div>
          <h2 style={{ margin: 0 }}>Services (Admin)</h2>
          <div className="muted">{filtered.length} services{isFetching ? ' • updating…' : ''}</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <input className="input" placeholder="Search…" value={q} onChange={e=>setQ(e.target.value)} style={{ minWidth:260 }} />
          <select className="input" value={category} onChange={e=>setCategory(e.target.value)}>
            {cats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <CsvButton filename="services.csv" rows={filtered} columns={columns} />
          <DensityToggle value={density} onChange={setDensity} />
          <Link to="/create-service" className="btn btn-primary">New service</Link>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        {isLoading && <div className="card">Loading…</div>}
        {isError && <div className="card" style={{ color: 'var(--danger)' }}>Failed: {error?.message || 'Request failed'}</div>}
        {!isLoading && !isError && (
          <DataTable
            columns={columns}
            rows={filtered}
            density={density}
            emptyMessage="No services found."
          />
        )}
      </div>
    </section>
  );
}

/* ------------- helpers ------------- */
async function fetchServicesFlex() {
  const tries = [
    () => api.get('/services', { params: { includeInactive: '1' } }),
    () => api.get('/admin/services', { params: { includeInactive: '1' } }),
  ];
  return firstOk(tries).then(r => r.data);
}
function normalizeServices(raw){
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(s => ({ active: s.active ?? s.isActive ?? true, ...s }));
  if (Array.isArray(raw.items)) return raw.items.map(s => ({ active: s.active ?? s.isActive ?? true, ...s }));
  if (Array.isArray(raw.services)) return raw.services.map(s => ({ active: s.active ?? s.isActive ?? true, ...s }));
  return [];
}
async function firstOk(tries){let err;for(const t of tries){try{return await t()}catch(e){err=e}}throw err||new Error('No working endpoint')}
function timeAgo(iso){if(!iso)return'—';const d=new Date(iso);const diff=Date.now()-d.getTime();const m=Math.floor(diff/6e4);if(m<60)return`${m}m ago`;const h=Math.floor(m/60);if(h<24)return`${h}h ago`;const a=Math.floor(h/24);if(a<30)return`${a}d ago`;const mo=Math.floor(a/30);if(mo<12)return`${mo}mo ago`;return`${Math.floor(mo/12)}y ago`}

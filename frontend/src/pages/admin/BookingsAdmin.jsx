import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import DataTable from '../../components/admin/DataTable.jsx';
import DensityToggle from '../../components/admin/DensityToggle.jsx';
import CsvButton from '../../components/admin/CsvButton.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Button from '../../components/ui/Button';

const STATUSES = ['All','pending','confirmed','on_the_way','completed','cancelled'];

export default function BookingsAdmin() {
  const qc = useQueryClient();

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: fetchAllBookingsFlex,
    staleTime: 30_000,
    retry: 0,           // show error instead of retry spinner forever
    refetchOnWindowFocus: false,
  });

  const bookings = useMemo(() => normalizeBookings(data), [data]);

  // filters
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('All');
  const [density, setDensity] = useState('comfortable');

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return bookings.filter(b => {
      const customer = (b.customer?.name || b.user?.name || '').toLowerCase();
      const provider = (b.provider?.name || '').toLowerCase();
      const service  = (b.service?.name || '').toLowerCase();
      const s = String(b.status || '').toLowerCase();
      const matchQ = !qq || customer.includes(qq) || provider.includes(qq) || service.includes(qq);
      const matchS = status === 'All' || s === status.toLowerCase();
      return matchQ && matchS;
    });
  }, [bookings, q, status]);

  // providers for assign
  const [providerQuery, setProviderQuery] = useState('');
  const { data: provData } = useQuery({
    queryKey: ['admin-providers-for-assign', providerQuery],
    queryFn: () => fetchProvidersFlex({ q: providerQuery, verified: '1' }),
    staleTime: 30_000,
    retry: 0,
  });
  const providers = Array.isArray(provData) ? provData : [];

  // assign modal
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState('');

  const assign = useMutation({
    mutationFn: ({ bookingId, providerUserId }) => assignProviderFlex({ bookingId, providerUserId }),
    onSuccess: () => {
      setAssignOpen(false);
      setSelectedBooking(null);
      setSelectedProvider('');
      qc.invalidateQueries({ queryKey: ['admin-bookings'] });
    }
  });

  const columns = [
    { key:'customer', header:'Customer', accessor: r => r.customer?.name || r.user?.name || '—', render: r => (
      <div style={{display:'grid'}}>
        <strong>{r.customer?.name || r.user?.name || '—'}</strong>
        <span className="muted" style={{fontSize:12}}>{r.customer?.email || r.user?.email || '—'}</span>
      </div>
    )},
    { key:'service', header:'Service', accessor: r => r.service?.name || '—' },
    { key:'scheduledAt', header:'Scheduled', accessor: r => new Date(r.scheduledAt || r.date || 0), render: r =>
      <span className="muted">{r.scheduledAt ? new Date(r.scheduledAt).toLocaleString() : '—'}</span>, width: 180
    },
    { key:'provider', header:'Provider', accessor: r => r.provider?.name || '—' },
    { key:'status', header:'Status', accessor: r => r.status || '—', render: r => (
      <span className="pill">{labelize(r.status)}</span>
    ), width: 130 },
    { key:'payment', header:'Payment', accessor: r => r.paymentStatus || r.payment?.status || 'unpaid', render: r => (
      <span className="pill">{labelize(r.paymentStatus || r.payment?.status || 'unpaid')}</span>
    ), width: 120 },
    { key:'actions', header:'Actions', accessor: () => '', render: r => (
      <Button
        variant="secondary"
        onClick={(e) => {
          e.stopPropagation();
          setSelectedBooking(r);
          setAssignOpen(true);
        }}
      >
        {r.provider ? 'Reassign' : 'Assign'}
      </Button>
    ), width: 120 }
  ];

  return (
    <section className="container">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap' }}>
        <div>
          <h2 style={{ margin: 0 }}>Bookings (Admin)</h2>
          <div className="muted">{filtered.length} bookings{isFetching ? ' • updating…' : ''}</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <input className="input" placeholder="Search customer, provider, or service…" value={q} onChange={e=>setQ(e.target.value)} style={{ minWidth:320 }} />
          <select className="input" value={status} onChange={e=>setStatus(e.target.value)}>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <CsvButton filename="bookings.csv" rows={filtered} columns={columns} />
          <DensityToggle value={density} onChange={setDensity} />
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
            emptyMessage="No bookings found."
          />
        )}
      </div>

      {/* Assign provider */}
      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title={`Assign provider${selectedBooking ? ` — ${selectedBooking.service?.name || ''}` : ''}`}>
        <div className="form" style={{ display:'grid', gap:12 }}>
          <input
            className="input"
            placeholder="Search provider by name, skill, or category"
            value={providerQuery}
            onChange={(e)=>setProviderQuery(e.target.value)}
          />
          <select
            className="input"
            value={selectedProvider}
            onChange={(e)=>setSelectedProvider(e.target.value)}
          >
            <option value="">Select a provider…</option>
            {providers.map(p => (
              <option key={p.user?._id || p.user || p._id} value={p.user?._id || p.user || p._id}>
                {p.displayName || p.user?.name || 'Unnamed'} {p.isVerified ? '' : '(unverified)'}
              </option>
            ))}
          </select>

          <div style={{ display:'flex', gap:8 }}>
            <Button
              variant="primary"
              disabled={!selectedProvider || !selectedBooking || assign.isPending}
              onClick={() => assign.mutate({ bookingId: selectedBooking._id, providerUserId: selectedProvider })}
            >
              {assign.isPending ? 'Assigning…' : 'Assign'}
            </Button>
            <Button onClick={() => setAssignOpen(false)} type="button">Close</Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}

/* ---------------- helpers ---------------- */

async function fetchAllBookingsFlex() {
  const tries = [
    () => api.get('/bookings', { params: { scope: 'all' } }),
    () => api.get('/admin/bookings'),
    () => api.get('/bookings'), // many backends return all when admin
  ];
  return firstOk(tries).then(r => r.data);
}

async function fetchProvidersFlex({ q = '', verified = 'all' }) {
  const params = { q, verified };
  const tries = [
    () => api.get('/providers/admin/list', { params }),
    () => api.get('/admin/providers', { params }),
    () => api.get('/providers', { params }),
  ];
  return firstOk(tries).then(r => r.data);
}

async function assignProviderFlex({ bookingId, providerUserId }) {
  const bodies = [
    { path: `/bookings/${bookingId}/assign-provider`, body: { provider: providerUserId } },
    { path: `/admin/bookings/${bookingId}/assign`, body: { provider: providerUserId } },
    { path: `/bookings/assign`, body: { bookingId, provider: providerUserId } },
  ];
  let lastErr;
  for (const { path, body } of bodies) {
    try {
      const r = await api.put(path, body);
      return r.data;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('Failed to assign provider');
}

function normalizeBookings(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.items)) return raw.items;
  if (Array.isArray(raw.bookings)) return raw.bookings;
  if (Array.isArray(raw.data)) return raw.data;
  return [];
}

async function firstOk(tries) {
  let lastErr;
  for (const t of tries) {
    try { return await t(); } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('No working endpoint');
}

function labelize(s){const t=String(s||'').replace(/[-_]/g,' ').trim();return t?t[0].toUpperCase()+t.slice(1):'—'}

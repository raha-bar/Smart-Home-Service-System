import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import DataTable from '../../components/admin/DataTable.jsx';
import DensityToggle from '../../components/admin/DensityToggle.jsx';
import CsvButton from '../../components/admin/CsvButton.jsx';
import Button from '../../components/ui/Button';

const STATUSES = ['All','Verified','Unverified'];

export default function ProviderAdmin() {
  const qc = useQueryClient();

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('All');
  const [density, setDensity] = useState('comfortable');

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['admin-providers', q, status],
    queryFn: () =>
      fetchProvidersFlex({
        q,
        verified: status === 'All' ? 'all' : (status === 'Verified' ? '1' : '0'),
      }),
    staleTime: 30_000,
    retry: 0,
    refetchOnWindowFocus: false,
  });

  const providers = useMemo(() => Array.isArray(data) ? data : [], [data]);

  const verify = useMutation({
    mutationFn: ({ userId, verified }) => verifyProviderFlex({ userId, verified }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-providers'] })
  });

  const columns = [
    { key:'name', header:'Name', accessor: r => r.user?.name || '—', render: r => (
      <div style={{ display:'grid' }}>
        <strong>{r.user?.name || '—'}</strong>
        <span className="muted" style={{ fontSize:12 }}>{r.user?.email || '—'}</span>
      </div>
    )},
    { key:'displayName', header:'Profile', accessor: r => r.displayName || '—' },
    { key:'categories', header:'Categories', accessor: r => (r.categories || []).join(', ') || '—' },
    { key:'isVerified', header:'Verified', accessor: r => r.isVerified ? 'Yes' : 'No', render: r => (
      <span className="pill">{r.isVerified ? 'Verified' : 'Unverified'}</span>
    ), width:120 },
    { key:'actions', header:'Actions', accessor: () => '', render: r => (
      r.isVerified
        ? <Button variant="ghost" onClick={() => verify.mutate({ userId: r.user?._id || r.user || r._id, verified: false })}>Unverify</Button>
        : <Button variant="primary" onClick={() => verify.mutate({ userId: r.user?._id || r.user || r._id, verified: true })}>Verify</Button>
    ), width:180 },
  ];

  return (
    <section className="container">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap' }}>
        <div>
          <h2 style={{ margin: 0 }}>Providers (Admin)</h2>
          <div className="muted">{providers.length} providers{isFetching ? ' • updating…' : ''}</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <input className="input" placeholder="Search name, skill, category…" value={q} onChange={e=>setQ(e.target.value)} style={{ minWidth:260 }} />
          <select className="input" value={status} onChange={e=>setStatus(e.target.value)}>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <CsvButton filename="providers.csv" rows={providers} columns={columns} />
          <DensityToggle value={density} onChange={setDensity} />
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        {isLoading && <div className="card">Loading…</div>}
        {isError && <div className="card" style={{ color: 'var(--danger)' }}>Failed: {error?.message || 'Request failed'}</div>}
        {!isLoading && !isError && (
          <DataTable
            columns={columns}
            rows={providers}
            density={density}
            emptyMessage="No providers yet."
          />
        )}
      </div>
    </section>
  );
}

/* ------------- helpers ------------- */
async function fetchProvidersFlex({ q = '', verified = 'all' }) {
  const params = { q, verified };
  // Try existing endpoints (no new routes)
  const tries = [
    () => api.get('/providers/admin/list', { params }),
    () => api.get('/admin/providers', { params }),
    () => api.get('/providers', { params }),
  ];

  const res = await firstOk(tries);
  const rows = toProviderRows(res.data);

  // Client-side fallback filtering if backend ignores ?verified
  const filteredByVerified = rows.filter(r => {
    if (verified === 'all') return true;
    const wantVerified = verified === '1';

    // Treat as verified if:
    // - explicit flags (isVerified/verified/approved) OR
    // - user.role === 'provider' AND user.providerStatus === 'approved'
    const role = (r.user?.role || r.role || '').toLowerCase();
    const pstat = (r.user?.providerStatus || r.providerStatus || '').toLowerCase();
    const legacy = Boolean(r.isVerified || r.verified || r.approved);
    const approvedNow = legacy || (role === 'provider' && pstat === 'approved');

    return wantVerified ? approvedNow : !approvedNow;
  });

  // Client-side search (name/email/categories)
  const qTrim = (q || '').trim().toLowerCase();
  const finalRows = !qTrim
    ? filteredByVerified
    : filteredByVerified.filter(r => {
        const name = (r.user?.name || '').toLowerCase();
        const email = (r.user?.email || '').toLowerCase();
        const cats = (r.categories || []).join(' ').toLowerCase();
        return name.includes(qTrim) || email.includes(qTrim) || cats.includes(qTrim);
      });

  return finalRows;
}

async function verifyProviderFlex({ userId, verified }) {
  const bodies = [
    () => api.put(`/providers/${userId}/verify`, { verified }),
    () => api.put(`/admin/providers/${userId}/verify`, { verified }),
    () => api.patch(`/providers/${userId}`, { isVerified: Boolean(verified) }),
  ];
  const res = await firstOk(bodies);
  return res.data;
}

function toProviderRows(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return normalizeRows(raw);
  if (Array.isArray(raw.items)) return normalizeRows(raw.items);
  if (Array.isArray(raw.providers)) return normalizeRows(raw.providers);
  if (Array.isArray(raw.data)) return normalizeRows(raw.data);
  return [];
}

function normalizeRows(arr) {
  return arr.map(x => {
    const user = x.user || (x.account
      ? { _id: x.account._id, name: x.account.name, email: x.account.email, role: x.account.role, providerStatus: x.account.providerStatus }
      : undefined);

    const role = (x.role || user?.role || '').toLowerCase();
    const providerStatus = (x.providerStatus || user?.providerStatus || '').toLowerCase();

    // unified verification flag
    const isVerified = Boolean(
      x.isVerified || x.verified || x.approved ||
      (role === 'provider' && providerStatus === 'approved')
    );

    return {
      ...x,
      user,
      role: role || undefined,
      providerStatus: providerStatus || undefined,
      isVerified,
      categories: Array.isArray(x.categories)
        ? x.categories
        : (Array.isArray(x.skills) ? x.skills : []),
      displayName: x.displayName || x.profileName || '',
    };
  });
}

async function firstOk(tries) {
  let lastErr;
  for (const t of tries) {
    try {
      return await t();
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('No working endpoint');
}

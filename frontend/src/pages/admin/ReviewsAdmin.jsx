import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import DataTable from '../../components/admin/DataTable.jsx';
import DensityToggle from '../../components/admin/DensityToggle.jsx';
import CsvButton from '../../components/admin/CsvButton.jsx';
import Button from '../../components/ui/Button';

const RATING_FILTERS = ['All', 5,4,3,2,1];

export default function ReviewsAdmin() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [rating, setRating] = useState('All');
  const [density, setDensity] = useState('comfortable');
  const [mode, setMode] = useState('moderation'); // 'moderation' | 'all'

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['admin-reviews', mode],
    queryFn: () => mode === 'moderation' ? fetchPendingFlex() : fetchAllFlex(),
    staleTime: 30_000,
    retry: 0,
    refetchOnWindowFocus: false,
  });

  const reviews = useMemo(() => normalizeReviews(data), [data]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return reviews.filter(r => {
      const user = (r.user?.name || '').toLowerCase();
      const service = (r.service?.name || '').toLowerCase();
      const comment = (r.comment || '').toLowerCase();
      const matchQ = !qq || user.includes(qq) || service.includes(qq) || comment.includes(qq);
      const rr = Number(r.rating || r.stars || 0);
      const matchR = rating === 'All' || rr === Number(rating);
      return matchQ && matchR;
    });
  }, [reviews, q, rating]);

  const approve = useMutation({
    mutationFn: (id) => moderateFlex(id, 'approved'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-reviews'] })
  });
  const reject = useMutation({
    mutationFn: (id) => moderateFlex(id, 'rejected'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-reviews'] })
  });

  const columns = [
    { key:'service', header:'Service', accessor: r => r.service?.name || '—' },
    { key:'user', header:'User', accessor: r => r.user?.name || '—' },
    { key:'rating', header:'Rating', accessor: r => Number(r.rating ?? r.stars ?? 0), render: r => (
      <>{Number(r.rating ?? r.stars ?? 0).toFixed(1)}★</>
    ), width: 110 },
    { key:'comment', header:'Comment', accessor: r => r.comment || r.text || '—', render: r =>
      <span className="muted">{(r.comment || r.text || '—').slice(0, 88)}</span>
    },
    ...(mode === 'moderation' ? [{
      key:'actions', header:'Actions', accessor: () => '', render: r => (
        <div className="row" style={{ gap:8 }}>
          <Button variant="primary" onClick={() => approve.mutate(r._id)}>Approve</Button>
          <Button variant="ghost" onClick={() => reject.mutate(r._id)}>Reject</Button>
        </div>
      ), width: 200
    }] : [])
  ];

  return (
    <section className="container">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap' }}>
        <div>
          <h2 style={{ margin: 0 }}>Reviews (Admin)</h2>
          <div className="muted">{mode === 'moderation' ? `${filtered.length} pending` : `${filtered.length} reviews`}{isFetching ? ' • updating…' : ''}</div>
        </div>
        <div className="row" style={{ gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <div className="row" style={{ gap:6, border:'1px solid var(--card-border)', borderRadius:10, padding:4 }}>
            <button className={`btn btn-sm ${mode==='moderation'?'btn-primary':'btn-ghost'}`} onClick={()=>setMode('moderation')}>Moderation</button>
            <button className={`btn btn-sm ${mode==='all'?'btn-primary':'btn-ghost'}`} onClick={()=>setMode('all')}>All reviews</button>
          </div>
          <input className="input" placeholder="Search comment, user, or service…" value={q} onChange={e=>setQ(e.target.value)} style={{ minWidth:320 }} />
          <select className="input" value={rating} onChange={e=>setRating(e.target.value)}>
            {RATING_FILTERS.map(r => <option key={r} value={r}>{r === 'All' ? 'All ratings' : `${r}★`}</option>)}
          </select>
          <CsvButton filename="reviews.csv" rows={filtered} columns={columns} />
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
            emptyMessage={mode==='moderation' ? 'No pending reviews.' : 'No reviews found.'}
          />
        )}
      </div>
    </section>
  );
}

/* ----------- helpers ----------- */
async function fetchPendingFlex() {
  const tries = [
    () => api.get('/reviews/moderation', { params: { status: 'pending' } }),
    () => api.get('/admin/reviews', { params: { status: 'pending' } }),
  ];
  return firstOk(tries).then(r => r.data);
}
async function fetchAllFlex() {
  const tries = [
    () => api.get('/reviews', { params: { includeAll: '1' } }),
    () => api.get('/admin/reviews', { params: { scope: 'all' } }),
  ];
  return firstOk(tries).then(r => r.data);
}
async function moderateFlex(id, status) {
  const tries = [
    () => api.put(`/reviews/${id}/moderate`, { status }),
    () => api.put(`/admin/reviews/${id}`, { status }),
  ];
  return firstOk(tries).then(r => r.data);
}
function normalizeReviews(raw){
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : (Array.isArray(raw.items) ? raw.items : (Array.isArray(raw.reviews) ? raw.reviews : []));
  return arr.map(x => ({
    ...x,
    rating: x.rating ?? x.stars ?? 0,
    comment: x.comment ?? x.text ?? '',
  }));
}
async function firstOk(tries){let err;for(const t of tries){try{return await t()}catch(e){err=e}}throw err||new Error('No working endpoint')}

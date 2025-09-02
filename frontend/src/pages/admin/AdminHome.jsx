import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

export default function AdminHome() {
  const { data: bookingsData } = useQuery({
    queryKey: ['admin-home-bookings'],
    queryFn: () => firstOk([
      () => api.get('/bookings', { params: { scope: 'all' } }),
      () => api.get('/admin/bookings'),
      () => api.get('/bookings'),
    ]).then(r => r.data),
    staleTime: 30_000,
    retry: 0,
  });

  const { data: providersData } = useQuery({
    queryKey: ['admin-home-providers'],
    queryFn: () => firstOk([
      () => api.get('/providers/admin/list', { params: { verified: 'all' } }),
      () => api.get('/admin/providers', { params: { verified: 'all' } }),
      () => api.get('/providers', { params: { verified: 'all' } }),
    ]).then(r => r.data),
    staleTime: 30_000,
    retry: 0,
  });

  const { data: servicesData } = useQuery({
    queryKey: ['admin-home-services'],
    queryFn: () => firstOk([
      () => api.get('/services', { params: { includeInactive: '1' } }),
      () => api.get('/admin/services', { params: { includeInactive: '1' } }),
    ]).then(r => r.data),
    staleTime: 30_000,
    retry: 0,
  });

  const { data: reviewsAll } = useQuery({
    queryKey: ['admin-home-reviews-all'],
    queryFn: () => firstOk([
      () => api.get('/reviews', { params: { includeAll: '1' } }),
      () => api.get('/admin/reviews', { params: { scope: 'all' } }),
    ]).then(r => r.data),
    staleTime: 30_000,
    retry: 0,
  });

  const { data: reviewsPending } = useQuery({
    queryKey: ['admin-home-reviews-pending'],
    queryFn: () => firstOk([
      () => api.get('/reviews/moderation', { params: { status: 'pending' } }),
      () => api.get('/admin/reviews', { params: { status: 'pending' } }),
    ]).then(r => r.data),
    staleTime: 30_000,
    retry: 0,
  });

  const bookingsCount  = countAny(bookingsData);
  const providersCount = countAny(providersData);
  const servicesCount  = countAny(servicesData);
  const reviewsCount   = countAny(reviewsAll);
  const pendingCount   = countAny(reviewsPending);

  return (
    <section className="container" style={{ display:'grid', gap:16 }}>
      <header>
        <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
        <p className="muted" style={{ marginTop: 6 }}>
          Quick access to bookings, providers, services, and reviews.
        </p>
      </header>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
        <Card title="Bookings"  subtitle={`${fmtCount(bookingsCount)} total`}  body="View every booking, filter by status, and assign providers." to="/admin/bookings"  cta="Open bookings" />
        <Card title="Providers" subtitle={`${fmtCount(providersCount)} profiles`} body="Verify/unverify providers and inspect their current jobs." to="/admin/providers" cta="Open providers" />
        <Card title="Services"  subtitle={`${fmtCount(servicesCount)} services`} body="Create, edit, activate/inactivate services in the catalog." to="/admin/services"  cta="Open services" />
        <Card title="Reviews"   subtitle={`${fmtCount(reviewsCount)} total • ${fmtCount(pendingCount)} pending`} body="Moderate new reviews and analyze overall ratings." to="/admin/reviews"   cta="Open reviews" />
      </div>
    </section>
  );
}

/* helpers */
function countAny(x){if(!x)return 0;if(Array.isArray(x))return x.length;if(Array.isArray(x?.items))return x.items.length;if(Array.isArray(x?.data))return x.data.length;if(typeof x?.total==='number')return x.total;return 0;}
function fmtCount(n){return typeof n==='number'?n.toLocaleString():'—';}
function Card({ title, subtitle, body, to, cta }){return(<div className="card" style={{ display:'grid', gap:8, alignContent:'start', minHeight:170 }}><div><h3 style={{ margin:0 }}>{title}</h3><div className="muted" style={{ fontSize:13 }}>{subtitle}</div></div><p className="muted" style={{ margin:'6px 0 10px' }}>{body}</p><Link className="btn btn-primary" to={to} style={{ justifySelf:'start' }}>{cta}</Link></div>);}
async function firstOk(tries){let err;for(const t of tries){try{return await t()}catch(e){err=e}}throw err||new Error('No working endpoint')}

import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import ServiceCard from '../components/ServiceCard';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function Services(){
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [cat, setCat] = useState(params.get('category') || 'All');

  useEffect(() => {
    const next = {};
    if (q) next.q = q;
    if (cat && cat !== 'All') next.category = cat;
    setParams(next, { replace: true });
  }, [q, cat, setParams]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['services'],
    queryFn: () => api.get('/services').then(r => r.data)
  });

  const categories = useMemo(() => {
    const set = new Set((data||[]).map(s => s.category || 'Other'));
    return ['All', ...Array.from(set)];
  }, [data]);

  const list = useMemo(() => {
    const items = data || [];
    return items.filter(s => {
      const matchesQ = !q || (s.name?.toLowerCase().includes(q.toLowerCase()) || s.description?.toLowerCase().includes(q.toLowerCase()));
      const matchesC = cat === 'All' || (s.category || 'Other') === cat;
      return matchesQ && matchesC;
    });
  }, [data, q, cat]);

  return (
    <section className="container">
      <div className="hero">
        <h1>Book trusted home services</h1>
        <p>Cleaning, electrical, plumbing, appliance repair and more — fast and reliable.</p>
        <div className="search">
          <Input placeholder="Search services (e.g., AC repair, cleaning…)" value={q} onChange={e=>setQ(e.target.value)} />
          <Button onClick={()=>setQ('')} className="btn-sm">Clear</Button>
        </div>
        <div className="pills" style={{marginTop:12}}>
          {categories.map(c => (
            <div key={c} className={['pill', c===cat?'active':''].join(' ')} onClick={()=>setCat(c)}>{c}</div>
          ))}
        </div>
      </div>

      <div className="grid">
        {isLoading && Array.from({length:6}).map((_,i)=>(
          <div className="card" key={i}>
            <div className="skeleton" style={{height:18, marginBottom:8}} />
            <div className="skeleton" style={{height:12, width:'80%', marginBottom:16}} />
            <div className="skeleton" style={{height:12, width:'60%'}} />
          </div>
        ))}

        {error && <p className="mono">Failed to load: {error.message}</p>}

        {!isLoading && !error && list.length === 0 && (
          <div className="card">
            <h3>No services found</h3>
            <p className="muted">Try a different keyword or category.</p>
          </div>
        )}

        {list.map(s => <ServiceCard key={s._id} service={s} />)}
      </div>
    </section>
  )
}

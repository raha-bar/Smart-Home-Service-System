import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import ServiceCard from '../components/ui/ServiceCard';

export default function Services() {
  // UI state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('popular'); // 'popular' | 'rating' | 'price_asc' | 'price_desc' | 'newest'

  const { data, isLoading, error } = useQuery({
    queryKey: ['services'],
    queryFn: () => api.get('/services').then(r => r.data),
    // keeps previous while reloading
    keepPreviousData: true,
  });

  // Normalize the server result into an array
  const services = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.services)) return data.services;
    return [];
  }, [data]);

  // Categories: derive from data; fallback to useful defaults
  const derivedCategories = useMemo(() => {
    const set = new Set();
    for (const s of services) {
      const c = (s.category || s.type || '').trim();
      if (c) set.add(c);
    }
    // sensible defaults if API has no categories
    const defaults = ['Cleaning', 'Plumbing', 'Electrical', 'Appliance', 'Painting', 'Pest'];
    const arr = Array.from(set);
    return arr.length ? ['All', ...arr] : ['All', ...defaults];
  }, [services]);

  // Filter + sort
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    let list = services.filter(s => {
      const name = (s.name || s.title || '').toLowerCase();
      const cat = (s.category || s.type || '').toLowerCase();
      const matchesText = !q || name.includes(q);
      const matchesCat = category === 'All' || cat === category.toLowerCase();
      return matchesText && matchesCat;
    });

    // read fields safely
    const getPrice = (s) => {
      const p = s.priceFrom ?? s.price ?? s.basePrice ?? 0;
      return Number(p) || 0;
    };
    const getRating = (s) => Number(s.rating ?? s.avgRating ?? 0) || 0;
    const getReviews = (s) => Number(s.reviews ?? s.reviewCount ?? 0) || 0;
    const getCreated = (s) => new Date(s.createdAt || s.created_at || s.updatedAt || 0).getTime() || 0;

    switch (sort) {
      case 'rating':
        list.sort((a, b) => getRating(b) - getRating(a));
        break;
      case 'price_asc':
        list.sort((a, b) => getPrice(a) - getPrice(b));
        break;
      case 'price_desc':
        list.sort((a, b) => getPrice(b) - getPrice(a));
        break;
      case 'newest':
        list.sort((a, b) => getCreated(b) - getCreated(a));
        break;
      case 'popular':
      default:
        // popularity: reviews desc, then rating desc
        list.sort((a, b) => {
          const r = getReviews(b) - getReviews(a);
          return r !== 0 ? r : getRating(b) - getRating(a);
        });
        break;
    }
    return list;
  }, [services, search, category, sort]);

  if (isLoading) {
    return (
      <section className="container">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:16}}>
          <h2 style={{margin:0}}>Services</h2>
          <div className="muted">Loading…</div>
        </div>
        <div className="grid" style={{marginTop:16}}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card" style={{height: 290, opacity:.7}}>
              <div style={{height:160, background:'#0f1a29', borderRadius:12, border:'1px solid var(--card-border)'}} />
              <div style={{height:16, marginTop:12, width:'40%', background:'#0f1a29', borderRadius:6}} />
              <div style={{height:12, marginTop:8, width:'65%', background:'#0f1a29', borderRadius:6}} />
              <div style={{display:'flex', gap:10, marginTop:12}}>
                <div className="btn" style={{opacity:.6}}>...</div>
                <div className="btn btn-primary" style={{opacity:.6}}>...</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="container">
        <h2>Services</h2>
        <p className="muted">Failed to load services: {error?.message}</p>
      </section>
    );
  }

  return (
    <section className="container">
      {/* Header + Controls */}
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, marginBottom:14, flexWrap:'wrap'}}>
        <div>
          <h2 style={{margin:'0 0 6px'}}>Services</h2>
          <div className="muted">{filtered.length} result{filtered.length === 1 ? '' : 's'}</div>
        </div>

        <div style={{display:'flex', alignItems:'center', gap:10, flexWrap:'wrap'}}>
          <div style={{position:'relative'}}>
            <input
              className="input"
              placeholder="Search services…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{minWidth:260}}
            />
          </div>

          <select
            className="input"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="popular">Sort: Popular</option>
            <option value="rating">Sort: Rating</option>
            <option value="price_asc">Sort: Price (low → high)</option>
            <option value="price_desc">Sort: Price (high → low)</option>
            <option value="newest">Sort: Newest</option>
          </select>

          <Link to="/my-bookings" className="btn">My bookings</Link>
        </div>
      </div>

      {/* Categories */}
      <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:16}}>
        {derivedCategories.map((c) => {
          const active = c === category;
          return (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`btn btn-sm ${active ? 'btn-primary' : 'btn-ghost'}`}
              aria-pressed={active}
              title={c}
            >
              {c}
            </button>
          );
        })}
      </div>

      {/* Services Grid */}
      {filtered.length === 0 ? (
        <div className="card" style={{padding:'24px'}}>
          <h3 style={{marginTop:0}}>No services found</h3>
          <p className="muted">Try clearing search or selecting a different category.</p>
        </div>
      ) : (
        <div className="grid">
          {filtered.map(s => (
            <ServiceCard key={s._id || s.id} service={s} />
          ))}
        </div>
      )}
    </section>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

/**
 * Service Detail / PDP
 * - Left: media gallery (thumbnails + keyboard nav)
 * - Right: sticky booking card with price, duration, CTA
 * - Uses existing classes: container, card, btn, btn-primary, muted, grid
 * - Robust field mapping for different API shapes
 */

export default function ServiceDetail() {
  const { id } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ['service', id],
    queryFn: () => api.get(`/services/${id}`).then(r => r.data),
    keepPreviousData: true,
  });

  // Normalize the service payload no matter the API shape
  const service = useMemo(() => {
    if (!data) return null;
    // common shapes: { service }, { data: { service } }, direct object
    const s = data?.service || data?.data?.service || data;
    return s;
  }, [data]);

  // Extract fields with fallbacks
  const {
    _id = id,
    name,
    title,
    description,
    details,
    summary,
    priceFrom,
    price,
    basePrice,
    currency = 'USD',
    rating,
    avgRating,
    reviews,
    reviewCount,
    duration,
    estimatedDuration,
    includes,
    features,
    whatsIncluded,
    gallery,
    images,
    photos,
    image,
    thumbnail,
    coverUrl,
    pictureUrl,
    category,
    updatedAt,
  } = service || {};

  const displayName = name || title || 'Service';
  const displayDesc = stringOrJoin(description, details, summary) || 'High-quality, vetted professionals. Materials and tools included where applicable.';
  const displayPrice = numberOr(priceFrom, price, basePrice, 0);
  const displayDuration = duration || estimatedDuration || 'Varies';
  const displayRating = numberOr(rating, avgRating, 0);
  const displayReviews = numberOr(reviews, reviewCount, 0);

  const imageList = useMemo(() => {
    const list = arrayCompact([
      ...(Array.isArray(gallery) ? gallery : []),
      ...(Array.isArray(images) ? images : []),
      ...(Array.isArray(photos) ? photos : []),
    ]);
    const singletons = arrayCompact([image, thumbnail, coverUrl, pictureUrl]);
    const fallback = [
      'https://images.unsplash.com/photo-1604881982949-3a4b1d76f0cb?q=80&w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1581093458791-9d09c3e9b8df?q=80&w=1600&auto=format&fit=crop',
    ];
    const deduped = dedupe(list.concat(singletons.length ? singletons : fallback));
    return deduped.slice(0, 8); // keep it tight
  }, [gallery, images, photos, image, thumbnail, coverUrl, pictureUrl]);

  // Gallery state
  const [activeIndex, setActiveIndex] = useState(0);
  const mainImgRef = useRef(null);

  useEffect(() => {
    setActiveIndex(0);
  }, [id]);

  function onKeyDown(e) {
    if (e.key === 'ArrowRight') setActiveIndex(i => (i + 1) % imageList.length);
    if (e.key === 'ArrowLeft') setActiveIndex(i => (i - 1 + imageList.length) % imageList.length);
  }

  if (isLoading) {
    return (
      <section className="container">
        <div style={{ display:'grid', gap:24, gridTemplateColumns:'1.25fr .75fr' }}>
          <div>
            <div className="card" style={{ height: 420 }} />
            <div style={{ display:'grid', gap:10, gridTemplateColumns:'repeat(5,1fr)', marginTop:10 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="card" style={{ height: 72 }} />
              ))}
            </div>
          </div>
          <div className="card" style={{ height: 420 }} />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="container">
        <h2>Service</h2>
        <p className="muted">Failed to load: {error?.message}</p>
        <Link to="/services" className="btn" style={{ marginTop: 8 }}>Back to services</Link>
      </section>
    );
  }

  if (!service) {
    return (
      <section className="container">
        <h2>Service not found</h2>
        <p className="muted">This service may have been removed or is unavailable.</p>
        <Link to="/services" className="btn" style={{ marginTop: 8 }}>Browse services</Link>
      </section>
    );
  }

  return (
    <section className="container">
      <div style={{ display:'grid', gap:24, gridTemplateColumns:'1.25fr .75fr' }}>
        {/* LEFT: MEDIA + DETAILS */}
        <div onKeyDown={onKeyDown} tabIndex={0} aria-label="Service media gallery">
          {/* Main image */}
          <div className="card" style={{ padding: 0, overflow:'hidden' }}>
            <img
              ref={mainImgRef}
              src={safeAt(imageList, activeIndex)}
              alt={displayName}
              style={{ width:'100%', height:420, objectFit:'cover', borderRadius: '16px' }}
            />
          </div>

          {/* Thumbnails */}
          {imageList.length > 1 && (
            <div style={{ display:'grid', gap:10, gridTemplateColumns:`repeat(${Math.min(imageList.length, 6)}, 1fr)`, marginTop:10 }}>
              {imageList.map((src, i) => {
                const active = i === activeIndex;
                return (
                  <button
                    key={src + i}
                    onClick={() => setActiveIndex(i)}
                    className="card"
                    aria-pressed={active}
                    style={{
                      padding: 0, overflow:'hidden', borderRadius: 12,
                      outline: active ? '3px solid rgba(34,197,94,.45)' : 'none'
                    }}
                    title={`Image ${i + 1}`}
                  >
                    <img
                      src={src}
                      alt={`${displayName} ${i + 1}`}
                      style={{ width:'100%', height:72, objectFit:'cover' }}
                    />
                  </button>
                );
              })}
            </div>
          )}

          {/* Text details */}
          <div style={{ marginTop: 18 }}>
            <h1 style={{ margin:'0 0 6px' }}>{displayName}</h1>
            <div className="muted" style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
              <span>⭐ {Number(displayRating).toFixed(1)} ({displayReviews})</span>
              {category ? <span>• {category}</span> : null}
              {updatedAt ? <span>• Updated {timeAgo(updatedAt)}</span> : null}
            </div>

            <p style={{ marginTop: 12, lineHeight: 1.6 }}>{displayDesc}</p>

            {/* What's included */}
            <div className="card" style={{ marginTop: 16 }}>
              <h3 style={{ marginTop: 0 }}>What’s included</h3>
              <ul style={{ margin: '8px 0 0 18px', lineHeight: 1.6 }}>
                {deriveIncludes(includes, features, whatsIncluded).map((item, i) => (
                  <li key={i} className="muted">{item}</li>
                ))}
              </ul>
            </div>

            {/* FAQs (optional) */}
            {Array.isArray(service?.faqs) && service.faqs.length > 0 && (
              <div className="card" style={{ marginTop: 16 }}>
                <h3 style={{ marginTop: 0 }}>FAQs</h3>
                <div style={{ display:'grid', gap:12, marginTop: 8 }}>
                  {service.faqs.map((f, i) => (
                    <div key={i}>
                      <strong>{f.q || f.question}</strong>
                      <p className="muted" style={{ margin: '6px 0 0' }}>{f.a || f.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: STICKY BOOKING CARD */}
        <aside>
          <div
            className="card"
            style={{
              position:'sticky',
              top: 84, // below sticky header
              padding: 16
            }}
          >
            <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
              <div style={{ fontSize: 24, fontWeight: 700 }}>
                {formatPrice(displayPrice, currency)}
              </div>
              <div className="muted">Duration: {displayDuration}</div>
            </div>

            <div style={{ display:'flex', gap:8, marginTop:12, flexWrap:'wrap' }}>
              <span className="pill">Secure payment</span>
              <span className="pill">Background-checked pros</span>
              <span className="pill">Reschedule anytime</span>
            </div>

            <div style={{ display:'grid', gap:10, marginTop: 16 }}>
              <Link to={`/book/${_id}`} className="btn btn-primary">Book now</Link>
              <Link to={`/services`} className="btn">Back to services</Link>
            </div>

            <hr />

            {/* Mini review row */}
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 9999,
                background:'#0f1a29', border:'1px solid var(--card-border)'
              }} />
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontWeight: 600 }}>Loved by {Math.max(50, displayReviews)}+ customers</div>
                <div className="muted">Average rating {Number(displayRating).toFixed(1)}★</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

/* ------------------------- helpers ------------------------- */

function arrayCompact(arr) {
  return (arr || []).filter(Boolean);
}
function dedupe(arr) {
  const seen = new Set(); const out = [];
  for (const x of arr) { if (!seen.has(x)) { out.push(x); seen.add(x); } }
  return out;
}
function safeAt(arr, i) {
  if (!arr || !arr.length) return '';
  const idx = Math.max(0, Math.min(arr.length - 1, i));
  return arr[idx];
}
function numberOr(...vals) {
  for (const v of vals) {
    const n = Number(v);
    if (!Number.isNaN(n) && Number.isFinite(n)) return n;
  }
  return 0;
}
function stringOrJoin(...vals) {
  const first = vals.find(v => typeof v === 'string' && v.trim());
  if (first) return first;
  const arr = vals.find(v => Array.isArray(v) && v.length);
  if (arr) return arr.join(' • ');
  return '';
}
function formatPrice(amount, currency = 'USD') {
  try {
    return new Intl.NumberFormat(undefined, { style:'currency', currency }).format(amount);
  } catch {
    return `$${Number(amount || 0).toFixed(0)}`;
  }
}
function deriveIncludes(includes, features, whatsIncluded) {
  const arr =
    (Array.isArray(includes) && includes.length && includes) ||
    (Array.isArray(features) && features.length && features) ||
    (Array.isArray(whatsIncluded) && whatsIncluded.length && whatsIncluded) ||
    [
      'Vetted, background-checked professional',
      'All tools and basic materials',
      'Upfront pricing — no hidden fees',
      'SMS and chat updates',
      'Satisfaction guarantee',
    ];
  return arr.slice(0, 8);
}
function timeAgo(iso) {
  const d = new Date(iso); const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000); if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60); if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24); if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30); if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12); return `${years}y ago`;
}

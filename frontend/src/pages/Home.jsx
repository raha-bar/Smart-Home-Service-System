import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import logo from '../images/logo2.png';

export default function Home() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // Map API record -> card props
  const toCard = (s) => ({
    _id: s._id ?? s.id,
    name: s.name ?? s.title ?? 'Service',
    priceFrom: s.priceFrom ?? s.startingPrice ?? s.price ?? 0,
    rating: s.rating ?? s.averageRating ?? 0,
    reviews: s.reviews ?? s.reviewCount ?? 0,
    thumbnail:
      s.thumbnail ??
      s.image ??
      (Array.isArray(s.images) ? s.images[0]?.url || s.images[0] : undefined),
  });

  useEffect(() => {
    (async () => {
      try {
        // With Vite proxy in place, this will hit your backend
        const res = await fetch('/api/services', {
          headers: { Accept: 'application/json' },
          credentials: 'include',
        });

        // If the proxy isn't working you'll get HTML (index.html)
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          const text = await res.text();
          throw new Error(
            `Expected JSON but received: ${contentType || 'unknown'}`
          );
        }

        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.services ?? data?.data ?? [];
        setServices(list.map(toCard));
      } catch (e) {
        console.error(e);
        setErr(e.message || 'Failed to load services');
        setServices([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="container" style={{ paddingTop: 60, paddingBottom: 36 }}>
          <div style={{ display: 'grid', gap: 28, gridTemplateColumns: '1.3fr 1fr' }}>
            <div>
              <h1>Your trusted home services, on demand.</h1>
              <p className="sub">
                Book vetted professionals for cleaning, repairs, installations and more.
                Track your booking, chat with pros, and pay securely—without stress.
              </p>
              <div className="hero-cta">
                <Link to="/services" className="btn btn-primary">Book a service</Link>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src={logo}
                alt="HomeService logo"
                style={{
                  borderRadius: 18,
                  width: '100%',
                  maxWidth: 320,
                  height: 200,
                  objectFit: 'contain',
                  boxShadow: '0 20px 50px rgba(0,0,0,.35)',
                  border: '1px solid var(--card-border)',
                  background: 'transparent',
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* POPULAR SERVICES */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Popular services</h2>

          {err && (
            <div className="card" style={{ marginBottom: 12, color: '#ffb4b4' }}>
              {err}
              <div className="muted" style={{ marginTop: 6 }}>
                Make sure the Vite <code>server.proxy</code> is set and your backend exposes <code>GET /api/services</code>.
              </div>
            </div>
          )}

          <div className="grid">
            {loading && <p className="muted">Loading services…</p>}

            {!loading && services.length === 0 && !err && (
              <p className="muted">No services found.</p>
            )}

            {!loading &&
              services.length > 0 &&
              services.map((s) => (
                <div
                  key={s._id}
                  className="card"
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    border: '1px solid var(--card-border)',
                    background: 'var(--card-bg, #111827)',
                  }}
                >
                  {s.thumbnail && (
                    <img
                      src={s.thumbnail}
                      alt={s.name}
                      style={{
                        width: '100%',
                        height: 160,
                        objectFit: 'cover',
                        borderRadius: 8,
                        marginBottom: 12,
                      }}
                    />
                  )}

                  <h3 style={{ margin: '0 0 6px' }}>{s.name}</h3>
                  <p className="muted" style={{ margin: '0 0 10px' }}>
                    From ${s.priceFrom}
                  </p>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link to={`/services/${s._id}`} className="btn btn-ghost">View</Link>
                    <Link to={`/book/${s._id}`} className="btn btn-primary">Book now</Link>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>
    </>
  );
}

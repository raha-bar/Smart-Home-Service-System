import { Link } from 'react-router-dom';

export default function ServiceCard({ service }) {
  const {
    _id,
    id,
    name = 'Service',
    title,
    priceFrom,
    price,
    rating,
    avgRating,
    reviews,
    reviewCount,
    thumbnail,
    image,
    images,
    coverUrl,
    pictureUrl,
    category
  } = service || {};

  const serviceId = _id || id || 'demo';
  const displayName = name || title || 'Service';
  const displayPrice = (priceFrom ?? price ?? 0);
  const displayRating = (rating ?? avgRating ?? 0);
  const displayReviews = (reviews ?? reviewCount ?? 0);

  // choose a decent image
  const fallback =
    'https://images.unsplash.com/photo-1581093458791-9d09c3e9b8df?q=80&w=1600&auto=format&fit=crop';
  const img =
    thumbnail || image || coverUrl || pictureUrl || (Array.isArray(images) && images[0]) || fallback;

  return (
    <div className="card">
      <div style={{position:'relative', overflow:'hidden', borderRadius:12}}>
        <img
          src={img}
          alt={displayName}
          style={{width:'100%', height:180, objectFit:'cover', border:'1px solid var(--card-border)'}}
        />
        {category && (
          <div style={{
            position:'absolute', top:10, left:10,
            background:'rgba(0,0,0,.35)', border:'1px solid var(--card-border)',
            backdropFilter:'blur(4px)', padding:'4px 10px', borderRadius:999
          }}>
            <small className="muted">{category}</small>
          </div>
        )}
      </div>

      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12}}>
        <h3 style={{margin:0}}>{displayName}</h3>
        <div className="pill">
          ⭐ {Number(displayRating).toFixed(1)} <span className="muted">({displayReviews})</span>
        </div>
      </div>

      <p className="muted" style={{margin:'6px 0 12px'}}>
        From <strong>${Number(displayPrice).toFixed(0)}</strong>
      </p>

      <div style={{display:'flex', gap:10}}>
        <Link to={`/services/${serviceId}`} className="btn">View</Link>
        <Link to={`/book/${serviceId}`} className="btn btn-primary">Book now</Link>
      </div>
    </div>
  );
}

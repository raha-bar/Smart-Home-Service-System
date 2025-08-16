import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import BookingForm from '../components/BookingForm.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Stars from '../components/ui/Stars';
import { useState } from 'react';

export default function ServiceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['service', id],
    queryFn: () => api.get(`/services/${id}`).then((r) => r.data)
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => api.get(`/services/${id}/reviews`).then(r => r.data),
    enabled: !!id
  });

  const [rating, setRating] = useState(5);
  const addReview = useMutation({
    mutationFn: (payload) => api.post(`/services/${id}/reviews`, payload).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews', id] })
  });

  if (isLoading) {
    return (
      <section className="container">
        <div className="card" style={{height:120, marginBottom:16}} />
        <div className="grid">
          <div className="card" style={{height:220}} />
          <div className="card" style={{height:220}} />
          <div className="card" style={{height:220}} />
        </div>
      </section>
    );
  }
  if (error) return <p className="mono container">Error: {error.message}</p>;
  if (!data) return <p className="mono container">Service not found</p>;

  const price = Number(data.price || 0).toFixed(2);
  const category = data.category || 'General';
  const avg = data.rating || (
    reviews && reviews.length
      ? (reviews.reduce((a,b)=>a+(b.rating||0),0) / reviews.length).toFixed(1)
      : 4.6
  );
  const images = Array.isArray(data.images) && data.images.length ? data.images : [];

  function submitReview(e){
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const comment = fd.get('comment');
    addReview.mutate({ rating, comment });
    e.currentTarget.reset();
    setRating(5);
  }

  return (
    <section className="container">
      <div className="card" style={{marginBottom:16}}>
        <div className="row space-between">
          <div>
            <h2 style={{margin:'0 0 6px'}}>{data.name}</h2>
            <div className="row" style={{gap:10}}>
              <Badge>{category}</Badge>
              <div className="row" style={{gap:6}}>
                <Stars value={avg} />
                <span className="muted">{avg} ({reviews?.length || 0})</span>
              </div>
            </div>
          </div>
          <div className="row" style={{gap:8}}>
            <div className="price">${price}</div>
            {user
              ? <Button as={Link} to={`/book/${data._id}`} variant="primary">Book now</Button>
              : <Button as={Link} to="/login" variant="primary">Login to book</Button>
            }
          </div>
        </div>
      </div>

      <div className="grid">
        {images.length === 0 ? (
          Array.from({length:3}).map((_,i)=>(<div key={i} className="card" style={{height:220}} />))
        ) : images.map((src, i) => (
          <div key={i} className="card" style={{padding:0, overflow:'hidden'}}>
            <img src={src} alt={data.name + ' image ' + (i+1)} style={{width:'100%', height:220, objectFit:'cover'}}/>
          </div>
        ))}
      </div>

      <div className="card" style={{marginTop:16}}>
        <h3>Description</h3>
        <p className="muted">{data.description}</p>
      </div>

      <div className="card" style={{marginTop:16}}>
        <h3 style={{marginBottom:10}}>Reviews</h3>
        <div className="stack">
          {(!reviews || reviews.length === 0) && <p className="muted">No reviews yet.</p>}
          {reviews?.map((r) => (
            <div key={r._id} className="row" style={{justifyContent:'space-between'}}>
              <div>
                <div className="row" style={{gap:8}}>
                  <Stars value={r.rating} size={14} />
                  <span className="mono">{r.user?.name || 'Anonymous'}</span>
                </div>
                {r.comment && <p style={{margin:'6px 0 0'}}>{r.comment}</p>}
              </div>
              <span className="muted">{new Date(r.createdAt || Date.now()).toLocaleDateString()}</span>
            </div>
          ))}
        </div>

        {user ? (
          <form onSubmit={submitReview} className="form" style={{marginTop:12}}>
            <div className="row" style={{gap:12, alignItems:'center'}}>
              <span className="muted">Your rating:</span>
              <Stars value={rating} onChange={setRating} />
            </div>
            <label>Comment (optional)
              <textarea name="comment" className="input" rows="3" placeholder="Share your experience…" />
            </label>
            <Button variant="primary" disabled={addReview.isPending}>
              {addReview.isPending ? 'Posting…' : 'Post review'}
            </Button>
            {addReview.isError && <p className="error mono">{addReview.error.message}</p>}
          </form>
        ) : (
          <p className="muted" style={{marginTop:10}}>Please <Link to="/login">login</Link> to write a review.</p>
        )}
      </div>

      {user && (
        <div className="card" style={{marginTop:16}}>
          <h3>Book this service</h3>
          <BookingForm serviceId={id} />
        </div>
      )}
    </section>
  );
}

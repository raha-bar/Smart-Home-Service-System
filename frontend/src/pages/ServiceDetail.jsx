import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import Button from '../components/ui/Button';
import Stars from '../components/ui/Stars';
import StarsInput from '../components/ui/StarsInput.jsx';
import { useState } from 'react';
import { useToast } from '../components/ui/Toast.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// Enforce "only users who completed a booking for this service can review"
const ALLOW_EVERYONE_TO_REVIEW = false;

export default function ServiceDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { push } = useToast() || { push: () => {} };

  // --- load service ---
  const { data: service, isLoading, error } = useQuery({
    queryKey: ['service', id],
    queryFn: () => api.get(`/services/${id}`).then((r) => r.data)
  });

  // --- load reviews (supports either endpoint style) ---
  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', id],
    queryFn: async () => {
      try {
        return (await api.get(`/services/${id}/reviews`)).data;
      } catch {
        try {
          return (await api.get(`/reviews?serviceId=${id}`)).data;
        } catch {
          return [];
        }
      }
    }
  });

  // --- eligibility: has this user completed a booking for THIS service? ---
  const { data: eligible } = useQuery({
    queryKey: ['review-eligibility', id, user?._id],
    enabled: !!user,
    queryFn: async () => {
      try {
        const r = await api.get(`/bookings/me?serviceId=${id}`);
        const list = Array.isArray(r.data) ? r.data : r.data?.items || [];
        const done = ['completed'];
        return list.some((b) => {
          const sid = String(b?.service?._id || b?.service || '');
          const st = String(b?.status || '').toLowerCase();
          return sid === id && done.includes(st);
        });
      } catch {
        return 'unknown';
      }
    }
  });

  // --- submit review ---
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const add = useMutation({
    mutationFn: async ({ rating, comment }) => {
      try {
        return (await api.post(`/services/${id}/reviews`, { rating, comment })).data;
      } catch {
        return (await api.post(`/reviews`, { serviceId: id, rating, comment })).data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews', id] });
      push('Thanks for your review!', 'success');
      setComment('');
      setRating(5);
    },
    onError: (e) => {
      const msg = e?.response?.data?.message || e?.message || 'Could not submit review';
      push(msg, 'error');
    }
  });

  function onSubmit(e) {
    e.preventDefault();
    if (!user) return nav('/login', { state: { from: `/services/${id}` } });
    add.mutate({ rating, comment });
  }

  const mustEnforceBooking = !ALLOW_EVERYONE_TO_REVIEW;
  const hasUser = !!user;
  // Only allow 'unknown' when enforcement is OFF
  const eligibleToReview =
    hasUser && (eligible === true || (!mustEnforceBooking && eligible === 'unknown'));

  if (isLoading) {
    return (
      <section className="container">
        <p>Loading…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="container">
        <p className="error mono">Failed to load service.</p>
      </section>
    );
  }

  if (!service) {
    return (
      <section className="container">
        <p>No service found.</p>
      </section>
    );
  }

  return (
    <section className="container" style={{ maxWidth: 980 }}>
      <div className="flex" style={{ gap: 24, alignItems: 'flex-start' }}>
        <div style={{ flex: 2 }}>
          <h2>{service.name}</h2>
          <p className="muted">{service.category}</p>
          <p style={{ marginTop: 8 }}>{service.description}</p>
        </div>

        <div
          className="card"
          style={{ flex: 1, padding: 16, border: '1px solid var(--border)',
            borderRadius: 12 }}
        >
          <div className="text-lg" style={{ marginBottom: 8 }}>
            ${Number(service.price || 0).toFixed(2)}
          </div>
          <div className="muted" style={{ marginBottom: 12 }}>
            Duration: {service.durationMin || service.durationMinutes || 60} min
          </div>
          <Button onClick={() => nav(`/book/${service._id}`)}>Book now</Button>
        </div>
      </div>

      <div style={{ marginTop: 28 }}>
        <h3>Reviews</h3>

        {reviews.length === 0 && <p className="muted">No reviews yet.</p>}

        {reviews.length > 0 && (
          <div className="stack" style={{ gap: 12 }}>
            {reviews.map((r) => (
              <div key={r._id} className="card" style={{ padding: 12 }}>
                <div className="flex" style={{ alignItems: 'center', gap: 8 }}>
                  <Stars value={r.rating} />
                  <span className="muted">{new Date(r.createdAt).toLocaleString()}</span>
                </div>
                <p style={{ marginTop: 6 }}>{r.comment}</p>
                {r.user?.name && (
                  <p className="muted" style={{ marginTop: 4 }}>
                    — {r.user.name}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {!user && (
          <div className="muted" style={{ marginTop: 16 }}>
            Please login to write a review.{' '}
            <Button onClick={() => nav('/login', { state: { from: `/services/${id}` } })}>
              Login
            </Button>
          </div>
        )}

        {user && !eligibleToReview && (
          <div className="muted" style={{ marginTop: 16 }}>
            You can review this service after you complete a booking for it.
          </div>
        )}

        {eligibleToReview && (
          <form onSubmit={onSubmit} className="form" style={{ marginTop: 16 }}>
            <label>
              Rating <StarsInput value={rating} onChange={setRating} />
            </label>
            <label>
              Comment
              <textarea
                className="input"
                rows={3}
                placeholder="Share your experience…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
              />
            </label>
            <Button variant="primary" disabled={add.isPending}>
              {add.isPending ? 'Submitting…' : 'Submit review'}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}

import { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import Modal from '../components/ui/Modal.jsx';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import useRealtimeBookings from '../hooks/useRealtimeBookings';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import Stars from '../components/ui/Stars.jsx';
import StarsInput from '../components/ui/StarsInput.jsx';

export default function MyBookings() {
  const { push } = useToast() || { push: () => {} };
  const qc = useQueryClient();
  const toast = (title, variant) => {
    try { push({ title, variant }); }
    catch { try { push(title, variant); } catch {} }
  };

  // Load my bookings
  const { data, isLoading, error } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => api.get('/bookings/me').then(r => r.data),
    keepPreviousData: true,
  });

  // Normalize list
  const list = useMemo(() => (Array.isArray(data) ? data : (data?.bookings || [])), [data]);

  // Realtime invalidation
  const bookingIds = useMemo(() => list.map(b => String(b._id)), [list]);
  useRealtimeBookings({
    bookingIds,
    queryKeysToInvalidate: [['my-bookings']],
    onEvent: ({ bookingId, status }) => {
      if (bookingId && status) toast(`Booking ${bookingId} → ${status}`);
    }
  });

  // Cancel booking
  const [cancelId, setCancelId] = useState(null);
  const cancel = useMutation({
    mutationFn: async (id) => (await api.post(`/bookings/${id}/cancel`)).data,
    onSuccess: () => {
      toast('Booking cancelled', 'success');
      qc.invalidateQueries({ queryKey: ['my-bookings'] });
    },
    onError: (e) => toast(e?.response?.data?.message || e.message || 'Failed to cancel', 'error'),
  });

  // Reschedule
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState(null);
  function openReschedule(b) { setTarget(b); setOpen(true); }
  const reschedule = useMutation({
    mutationFn: ({ id, scheduledAt }) => api.put(`/bookings/${id}`, { scheduledAt }).then(r => r.data),
    onSuccess: () => {
      toast('Rescheduled', 'success');
      qc.invalidateQueries({ queryKey: ['my-bookings'] });
    },
    onError: (e) => toast(e?.response?.data?.message || e.message || 'Failed to reschedule', 'error'),
  });

  // --- Reviews ---
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loadingMyReview, setLoadingMyReview] = useState(false);

  function openReview(b) {
    setReviewBooking(b);
    setRating(0);
    setComment('');
    setReviewOpen(true);
    // Preload existing my review for this service
    setLoadingMyReview(true);
    api.get(`/reviews/me`, { params: { service: b?.service?._id || b?.service } })
      .then(r => {
        const rev = r?.data;
        if (rev) {
          setRating(Number(rev.rating || rev.stars || 0));
          setComment(rev.comment || rev.text || '');
        }
      })
      .catch(() => {}) // 404 means "no review yet"—safe to ignore
      .finally(() => setLoadingMyReview(false));
  }

  const saveReview = useMutation({
    mutationFn: async () => {
      const service = reviewBooking?.service?._id || reviewBooking?.service;
      return (await api.post('/reviews', { service, rating, comment })).data;
    },
    onSuccess: () => {
      toast('Thanks for your review!', 'success');
      setReviewOpen(false);
      qc.invalidateQueries({ queryKey: ['my-bookings'] });
    },
    onError: (e) => toast(e?.response?.data?.message || e.message || 'Failed to save review', 'error'),
  });

  // UI
  if (isLoading) {
    return (
      <section className="container">
        <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:12}}>
          <div>
            <h2 style={{margin:0}}>My bookings</h2>
            <div className="muted">Loading your bookings…</div>
          </div>
          <Link to="/services" className="btn">Book a service</Link>
        </div>
        <div className="grid" style={{marginTop:16}}>
          {Array.from({length:6}).map((_,i)=>(
            <div key={i} className="card" style={{height:180, opacity:.7}} />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="container">
        <h2>My bookings</h2>
        <div className="card" style={{marginTop:12}}>
          <p className="muted">Failed to load: {error?.message}</p>
          <Link to="/services" className="btn">Book a service</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="container">
      <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:12}}>
        <h2 style={{margin:0}}>My bookings</h2>
        <Link to="/services" className="btn">Book a service</Link>
      </div>

      {/* Grid */}
      <div className="grid" style={{marginTop:16}}>
        {list.map(b => {
          const status = String(b.status || '').toLowerCase();
          const serviceName = b.service?.name || 'Service';
          const when = b.scheduledAt || b.date;
          const whenText = when ? new Date(when).toLocaleString() : '—';
          const paymentStatus = String(b?.payment?.status || b?.paymentStatus || '').toLowerCase();
          const canPay = paymentStatus !== 'paid' && status !== 'cancelled';
          const canInvoice = paymentStatus === 'paid' || status === 'completed';
          const canReview = status === 'completed';

          return (
            <div key={b._id} className="card" style={{display:'grid', gap:10}}>
              {/* Title + status */}
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:10}}>
                <div>
                  <div style={{fontWeight:600}}>{serviceName}</div>
                  <div className="muted" style={{fontSize:12}}>{whenText}</div>
                </div>
                <StatusBadge status={b.status} />
              </div>

              {/* Address */}
              {b.address && <div className="muted" style={{fontSize:13}}>{b.address}</div>}

              {/* Actions */}
              {status !== 'cancelled' && (
                <div className="row" style={{gap:8, flexWrap:'wrap', marginTop:4}}>
                  {status === 'pending' && (
                    <>
                      <Button onClick={() => openReschedule(b)} variant="secondary" disabled={reschedule.isPending}>
                        Reschedule
                      </Button>
                      <Button onClick={() => setCancelId(b._id)} variant="ghost" disabled={cancel.isPending}>
                        Cancel
                      </Button>
                    </>
                  )}

                  {canPay && (
                    <Link to={`/checkout/${b._id}`} className="btn btn-primary">
                      Pay now
                    </Link>
                  )}

                  {canInvoice && (
                    <Link to={`/invoice/${b._id}`} className="btn">
                      View invoice
                    </Link>
                  )}

                  {canReview && (
                    <Button onClick={() => openReview(b)} variant="secondary">
                      {/** we optimistically say "Edit review" only after fetch, but the modal will load current value */}
                      Leave / Edit review
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reschedule modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Reschedule">
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const raw = `${fd.get('date')}T${fd.get('time') || '09:00'}:00`;
            if (!raw) return;
            const iso = new Date(raw).toISOString();
            reschedule.mutate({ id: target._id, scheduledAt: iso });
            setOpen(false);
          }}
        >
          <label>
            Date
            <Input type="date" name="date" required />
          </label>
          <label>
            Time
            <Input type="time" name="time" required />
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="primary" type="submit" disabled={reschedule.isPending}>
              Confirm
            </Button>
            <Button onClick={() => setOpen(false)} type="button">Cancel</Button>
          </div>
        </form>
      </Modal>

      {/* Cancel confirm */}
      <ConfirmDialog
        open={Boolean(cancelId)}
        title="Cancel this booking?"
        message="If a provider is already assigned, they will be notified."
        askReason
        busy={cancel.isPending}
        confirmText="Cancel booking"
        onClose={() => setCancelId(null)}
        onConfirm={() => {
          const id = cancelId;
          setCancelId(null);
          cancel.mutate(id);
        }}
      />

      {/* Review modal */}
      <Modal open={reviewOpen} onClose={() => setReviewOpen(false)} title="Your review">
        {loadingMyReview ? (
          <div className="muted">Loading your existing review…</div>
        ) : (
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!rating) return toast('Please select a rating', 'error');
              saveReview.mutate();
            }}
          >
            <div>
              <div className="muted" style={{ marginBottom: 6 }}>
                Rate your experience
              </div>
              <StarsInput value={rating} onChange={setRating} />
            </div>

            <label style={{ marginTop: 10 }}>
              Comment (optional)
              <textarea
                className="input"
                rows={4}
                placeholder="What went well? What could be improved?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </label>

            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="primary" type="submit" disabled={saveReview.isPending}>
                {saveReview.isPending ? 'Saving…' : 'Save review'}
              </Button>
              <Button type="button" onClick={() => setReviewOpen(false)}>Close</Button>
            </div>
          </form>
        )}
      </Modal>
    </section>
  );
}

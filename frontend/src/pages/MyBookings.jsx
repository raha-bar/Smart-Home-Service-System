import { useMemo, useState } from 'react';
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

export default function MyBookings() {
  const { push } = useToast() || { push: () => {} };
  const qc = useQueryClient();

  // helper to support both push({title}) and push('title','success')
  const toast = (title, variant) => {
    try { push({ title, variant }); }
    catch { try { push(title, variant); } catch {} }
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => api.get('/bookings/me').then(r => r.data),
    keepPreviousData: true,
  });

  const list = useMemo(
    () => (Array.isArray(data) ? data : (data?.bookings || [])),
    [data]
  );

  // --- Realtime subscription: invalidate and toast on updates
  const bookingIds = useMemo(() => list.map(b => String(b._id)), [list]);
  useRealtimeBookings({
    bookingIds,
    queryKeysToInvalidate: [['my-bookings']],
    onEvent: ({ bookingId, status }) => {
      if (bookingId && status) toast(`Booking ${bookingId} → ${status}`);
    }
  });

  // --- Cancel flow with confirmation
  const [cancelId, setCancelId] = useState(null);
  const cancel = useMutation({
    // FIX: use PUT /bookings/:id/status instead of POST /cancel
    mutationFn: async (id) =>
      (await api.put(`/bookings/${id}/status`, { status: "cancelled" })).data,
    onSuccess: () => {
      toast('Booking cancelled', 'success');
      qc.invalidateQueries({ queryKey: ['my-bookings'] });
    },
    onError: (e) =>
      toast(e?.response?.data?.message || e.message || 'Failed to cancel', 'error'),
  });

  // --- Reschedule modal
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState(null);
  function openReschedule(b) { setTarget(b); setOpen(true); }

  const reschedule = useMutation({
    mutationFn: async ({ id, scheduledAt }) =>
      (await api.patch(`/bookings/${id}`, { scheduledAt })).data,
    onSuccess: () => {
      toast('Booking rescheduled', 'success');
      qc.invalidateQueries({ queryKey: ['my-bookings'] });
    },
    onError: (e) =>
      toast(e?.response?.data?.message || e.message || 'Failed to reschedule', 'error'),
  });

  function doReschedule(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw = fd.get('when'); // "YYYY-MM-DDTHH:mm"
    if (!raw) return;

    const iso = new Date(raw).toISOString();
    reschedule.mutate({ id: target._id, scheduledAt: iso });
    setOpen(false);
  }

  if (isLoading) return <div className="container"><p>Loading…</p></div>;
  if (error) return <div className="container"><p>Failed: {error.message}</p></div>;

  return (
    <section className="container">
      <h2>My bookings</h2>

      <div className="grid">
        {list.map(b => {
          const serviceName = b.service?.name || 'Service';
          const when = b.scheduledAt || b.date;
          const whenText = when ? new Date(when).toLocaleString() : '—';
          const canPay = b.paymentStatus !== 'paid';
          const canInvoice = b.paymentStatus === 'paid' || b.status === 'completed';

          return (
            <div key={b._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <strong>{serviceName}</strong>
                <span className="muted">{whenText}</span>
              </div>

              {b.address && <p className="muted" style={{ marginTop: 6 }}>{b.address}</p>}

              <div className="flex" style={{ gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <Button
                  onClick={() => openReschedule(b)}
                  variant="secondary"
                  disabled={reschedule.isPending}
                >
                  Reschedule
                </Button>

                <Button
                  onClick={() => setCancelId(b._id)}
                  variant="ghost"
                  disabled={cancel.isPending || b.status === 'cancelled'}
                >
                  Cancel
                </Button>

                {canPay && (
                  <Link to={`/checkout/${b._id}`} className="btn btn-primary">
                    Pay
                  </Link>
                )}

                {canInvoice && (
                  <Link to={`/invoice/${b._id}`} className="btn">
                    Invoice
                  </Link>
                )}

                <Link to={`/messages?bookingId=${b._id}`} className="btn">
                  Chat
                </Link>
              </div>

              <div className="muted" style={{ marginTop: 8 }}>
                Status: <StatusBadge status={b.status} />
                {b.paymentMethod ? <> &nbsp;·&nbsp; Method: <strong>{b.paymentMethod}</strong></> : null}
                {b.paymentStatus ? <> &nbsp;·&nbsp; Payment: <strong>{b.paymentStatus}</strong></> : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reschedule */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Reschedule — ${target?.service?.name || ''}`}
      >
        <form onSubmit={doReschedule} className="form">
          <label>
            New date & time
            <Input type="datetime-local" name="when" required />
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              variant="primary"
              type="submit"
              disabled={reschedule.isPending}
            >
              Save
            </Button>
            <Button onClick={() => setOpen(false)} type="button">
              Cancel
            </Button>
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
        onConfirm={({ reason }) => {
          const id = cancelId;
          setCancelId(null);
          cancel.mutate(id);
        }}
      />
    </section>
  );
}

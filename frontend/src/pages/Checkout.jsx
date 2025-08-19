import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast.jsx';

export default function Checkout() {
  const { bookingId } = useParams();
  const nav = useNavigate();
  const { push } = useToast() || { push: () => {} };
  const [method, setMethod] = useState('cash');

  const pay = useMutation({
    mutationFn: async () => (await api.post('/payments', { bookingId, method })).data,
    onSuccess: () => {
      push('Payment recorded', 'success');
      nav(`/invoice/${bookingId}`);
    },
    onError: (e) => {
      const msg = e?.response?.data?.message || e.message || 'Payment failed';
      push(msg, 'error');
    }
  });

  return (
    <section className="container" style={{ maxWidth: 640 }}>
      <h2>Payment</h2>
      <p className="muted">Booking ID: {bookingId}</p>

      <div className="card" style={{ padding: 16, marginTop: 12 }}>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="method"
            checked={method === 'cash'}
            onChange={() => setMethod('cash')}
          />
          Cash
        </label>
        <label className="flex items-center gap-2" style={{ marginTop: 8 }}>
          <input
            type="radio"
            name="method"
            checked={method === 'online'}
            onChange={() => setMethod('online')}
          />
          Online
        </label>

        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <Button onClick={() => pay.mutate()} disabled={pay.isPending}>
            {pay.isPending ? 'Processing…' : 'Confirm'}
          </Button>
          <Button variant="ghost" onClick={() => nav(-1)}>Back</Button>
        </div>
      </div>
    </section>
  );
}

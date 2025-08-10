import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export default function BookingForm({ serviceId }) {
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload) => api.post('/bookings', payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-bookings'] });
      alert('Booking created');
    }
  });

  function onSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const scheduledAt = form.get('scheduledAt');
    const address = form.get('address');
    const notes = form.get('notes');
    mutation.mutate({ service: serviceId, scheduledAt, address, notes });
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8, maxWidth: 420 }}>
      <label>
        When
        <input name="scheduledAt" type="datetime-local" required />
      </label>
      <label>
        Address
        <input name="address" placeholder="Street, City" required />
      </label>
      <label>
        Notes
        <textarea name="notes" placeholder="Optional" />
      </label>
      <button disabled={mutation.isPending}>
        {mutation.isPending ? 'Booking…' : 'Book Service'}
      </button>
    </form>
  );
}
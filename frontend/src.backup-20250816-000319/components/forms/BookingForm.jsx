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
    <form onSubmit={onSubmit} className="form">
      <label>
        When
        <input name="scheduledAt" type="datetime-local" className="input" required />
      </label>
      <label>
        Address
        <input name="address" className="input" placeholder="Street, City" required />
      </label>
      <label>
        Notes
        <textarea name="notes" className="textarea" placeholder="Optional" />
      </label>
      <button className="btn btn-primary" disabled={mutation.isPending}>
        {mutation.isPending ? 'Booking…' : 'Book Service'}
      </button>
    </form>
  );
}

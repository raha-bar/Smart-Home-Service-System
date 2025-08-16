import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import Input from './ui/Input';
import Button from './ui/Button';

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
      <label>Date & Time
        <Input type="datetime-local" name="scheduledAt" required />
      </label>
      <label>Address
        <Input name="address" placeholder="House, Street, City" required />
      </label>
      <label>Notes (optional)
        <textarea name="notes" className="input" rows="3" placeholder="Any special instructions?" />
      </label>
      <Button variant="primary" type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Booking…' : 'Confirm Booking'}
      </Button>
      {mutation.isError && <p className="error mono">{mutation.error.message}</p>}
    </form>
  );
}

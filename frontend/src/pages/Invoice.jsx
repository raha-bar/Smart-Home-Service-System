import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast.jsx';

function Row({ label, children }) {
  return (
    <div className="flex" style={{ justifyContent: 'space-between', margin: '4px 0' }}>
      <span className="muted">{label}</span>
      <span>{children}</span>
    </div>
  );
}

export default function Invoice() {
  const { bookingId } = useParams();
  const { push } = useToast() || { push: () => {} };

  const { data, isLoading, error } = useQuery({
    queryKey: ['invoice', bookingId],
    // Try getting booking info; if you expose a dedicated invoice JSON endpoint, swap here
    queryFn: async () => (await api.get(`/bookings/${bookingId}`)).data,
  });

  async function downloadPdf() {
    // Try two common paths: /invoices/:id.pdf OR /bookings/:id/invoice.pdf
    const candidates = [`/invoices/${bookingId}.pdf`, `/bookings/${bookingId}/invoice.pdf`];
    for (const path of candidates) {
      try {
        const res = await api.get(path, { responseType: 'blob' });
        const blob = new Blob([res.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${bookingId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      } catch { /* try next */ }
    }
    push('No PDF invoice endpoint found', 'error');
  }

  if (isLoading) return <section className="container"><p>Loading…</p></section>;
  if (error) return <section className="container"><p className="error mono">{error.message}</p></section>;

  const b = data || {};
  const c = b.customer || b.user || {};
  const s = b.service || {};
  const total = typeof s.price === 'number' ? s.price : b.totalAmount || 0;

  return (
    <section className="container" style={{ maxWidth: 720 }}>
      <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Invoice</h2>
        <Button onClick={downloadPdf}>Download PDF</Button>
      </div>
      <p className="muted">Booking ID: {bookingId}</p>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
        <div className="card">
          <h3>Customer</h3>
          <Row label="Name">{c.name || '-'}</Row>
          <Row label="Phone">{c.phone || '-'}</Row>
          <Row label="Email">{c.email || '-'}</Row>
          <Row label="Address">{b.address || '-'}</Row>
        </div>

        <div className="card">
          <h3>Service</h3>
          <Row label="Name">{s.name || '-'}</Row>
          <Row label="Duration">{s.durationMin ? `${s.durationMin} min` : '-'}</Row>
          <Row label="Scheduled at">
            {b.scheduledAt ? new Date(b.scheduledAt).toLocaleString() : '-'}
          </Row>
        </div>

        <div className="card">
          <h3>Payment</h3>
          <Row label="Method">{b.paymentMethod || '-'}</Row>
          <Row label="Status">{b.paymentStatus || '-'}</Row>
          <Row label="Subtotal">{typeof total === 'number' ? total.toFixed(2) : '-'}</Row>
          {/* If you add tax/discount on backend, mirror here */}
          <Row label="Total"><strong>{typeof total === 'number' ? total.toFixed(2) : '-'}</strong></Row>
        </div>

        <div className="card">
          <h3>Meta</h3>
          <Row label="Created">
            {b.createdAt ? new Date(b.createdAt).toLocaleString() : '-'}
          </Row>
          <Row label="Updated">
            {b.updatedAt ? new Date(b.updatedAt).toLocaleString() : '-'}
          </Row>
          <Row label="Status">{b.status || '-'}</Row>
        </div>
      </div>
    </section>
  );
}

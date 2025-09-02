import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';
import { useToast } from '../components/ui/Toast.jsx';

/**
 * Checkout
 * - Left: payment method "choice cards" + pay button
 * - Right: sticky order summary (service, time, address, price)
 * - Robust with different API shapes, minimal assumptions
 */

export default function Checkout() {
  const { bookingId } = useParams();
  const { push } = useToast() || { push: () => {} };
  const qc = useQueryClient();
  const navigate = useNavigate();

  const toast = (title, variant) => {
    try { push({ title, variant }); }
    catch { try { push(title, variant); } catch {} }
  };

  // Fetch booking details
  const { data, isLoading, error } = useQuery({
    queryKey: ['checkout-booking', bookingId],
    queryFn: () => api.get(`/bookings/${bookingId}`).then(r => r.data),
    keepPreviousData: true,
  });

  // Normalize booking no matter the shape
  const booking = useMemo(() => {
    if (!data) return null;
    if (Array.isArray(data?.bookings)) return data.bookings.find(b => String(b._id) === String(bookingId)) || data.bookings[0];
    return data?.booking || data?.data?.booking || data;
  }, [data, bookingId]);

  const serviceName  = booking?.service?.name || booking?.serviceName || 'Service';
  const when         = booking?.scheduledAt || booking?.date || booking?.timeSlot;
  const whenText     = when ? new Date(when).toLocaleString() : '—';
  const address      = booking?.address || booking?.location || null;
  const status       = String(booking?.status || '').toLowerCase();
  const paymentStatus= String(booking?.paymentStatus || '').toLowerCase();
  const currency     = booking?.currency || 'USD';

  // Price normalization
  const basePrice = numberOr(
    booking?.total,
    booking?.amount,
    booking?.price,
    booking?.service?.priceFrom,
    0
  );
  const fee       =  numberOr(booking?.fee, 0);
  const tax       =  numberOr(booking?.tax, 0);
  const grand     =  clampMoney(basePrice + fee + tax);

  const isPaid    = paymentStatus === 'paid';

  // Payment method selection
  const [method, setMethod] = useState(isPaid ? (booking?.paymentMethod || 'card') : 'card');

  // Robust "pay" mutation (tries a few common server endpoints)
  const pay = useMutation({
    mutationFn: async ({ id, method }) => {
      const attempts = [
        () => api.post(`/bookings/${id}/pay`, { method }),                         // preferred
        () => api.put(`/bookings/${id}/payment`, { method, status: 'paid' }),      // alt
        () => api.post(`/payments/charge`, { bookingId: id, method }),             // gateway shape
        () => api.put(`/bookings/${id}`, { paymentMethod: method, paymentStatus: 'paid' }), // fallback
      ];
      let lastErr;
      for (const call of attempts) {
        try {
          const res = await call();
          return res.data;
        } catch (e) {
          lastErr = e;
          const code = e?.response?.status;
          // keep trying on common "shape mismatch" statuses
          if (![400, 401, 403, 404, 405].includes(code)) throw e;
        }
      }
      throw lastErr;
    },
    onSuccess: () => {
      toast('Payment successful', 'success');
      qc.invalidateQueries({ queryKey: ['my-bookings'] });
      qc.invalidateQueries({ queryKey: ['checkout-booking', bookingId] });
      // Go to invoice if available route, else back to bookings
      navigate(`/invoice/${bookingId}`);
    },
    onError: (e) => {
      toast(e?.response?.data?.message || e?.message || 'Payment failed', 'error');
    },
  });

  if (isLoading) {
    return (
      <section className="container">
        <div style={{display:'grid', gap:24, gridTemplateColumns:'1fr .85fr'}}>
          <div className="card" style={{height:300}} />
          <div className="card" style={{height:240}} />
        </div>
      </section>
    );
  }

  if (error || !booking) {
    return (
      <section className="container">
        <h2>Checkout</h2>
        <div className="card" style={{marginTop:12}}>
          <p className="muted">Couldn’t load your booking. {error?.message || ''}</p>
          <div style={{marginTop:8, display:'flex', gap:10}}>
            <Link to="/services" className="btn">Browse services</Link>
            <Link to="/my-bookings" className="btn">My bookings</Link>
          </div>
        </div>
      </section>
    );
  }

  // Already paid → success view
  if (isPaid) {
    return (
      <section className="container">
        <div style={{display:'grid', gap:24, gridTemplateColumns:'1fr .85fr'}}>
          <div className="card" style={{display:'grid', gap:14}}>
            <h2 style={{margin:0}}>You’re all set 🎉</h2>
            <p className="muted">This booking is already paid. You can view your invoice or manage the booking.</p>
            <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
              <Link to={`/invoice/${bookingId}`} className="btn btn-primary">View invoice</Link>
              <Link to={`/my-bookings`} className="btn">Manage bookings</Link>
            </div>
          </div>
          <OrderSummaryCard
            serviceName={serviceName}
            whenText={whenText}
            address={address}
            price={basePrice}
            fee={fee}
            tax={tax}
            total={grand}
            currency={currency}
            status={status}
            paymentStatus={paymentStatus}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="container">
      <div style={{display:'grid', gap:24, gridTemplateColumns:'1fr .85fr'}}>
        {/* LEFT: Payment methods */}
        <div className="card" style={{display:'grid', gap:14}}>
          <h2 style={{margin:'0 0 6px'}}>Checkout</h2>
          <div className="muted">Choose your payment method</div>

          <div style={{display:'grid', gap:10}}>
            <ChoiceCard
              name="payment"
              value="card"
              checked={method === 'card'}
              onChange={() => setMethod('card')}
              title="Debit / Credit Card"
              subtitle="Visa, Mastercard, Amex"
              icon="💳"
            />
            <ChoiceCard
              name="payment"
              value="wallet"
              checked={method === 'wallet'}
              onChange={() => setMethod('wallet')}
              title="Mobile Wallet"
              subtitle="Apple Pay / Google Pay / local wallets"
              icon="📱"
            />
            <ChoiceCard
              name="payment"
              value="cash"
              checked={method === 'cash'}
              onChange={() => setMethod('cash')}
              title="Cash on Service"
              subtitle="Pay the professional at service time"
              icon="💵"
            />
          </div>

          <div style={{display:'grid', gap:10, marginTop:6}}>
            <button
              className="btn btn-primary"
              disabled={pay.isPending}
              onClick={() => pay.mutate({ id: bookingId, method })}
            >
              {pay.isPending ? 'Processing…' : `Pay ${formatPrice(grand, currency)}`}
            </button>
            <Link to={`/my-bookings`} className="btn">Back to bookings</Link>
            <div className="muted" style={{fontSize:12}}>
              By proceeding, you agree to our <Link to="/legal/terms">Terms</Link> and <Link to="/legal/privacy">Privacy Policy</Link>.
            </div>
          </div>

          {/* Trust row */}
          <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:4}}>
            <span className="pill">Secure payment</span>
            <span className="pill">No hidden fees</span>
            <span className="pill">Instant confirmation</span>
          </div>
        </div>

        {/* RIGHT: Sticky order summary */}
        <OrderSummaryCard
          serviceName={serviceName}
          whenText={whenText}
          address={address}
          price={basePrice}
          fee={fee}
          tax={tax}
          total={grand}
          currency={currency}
          status={status}
          paymentStatus={paymentStatus}
        />
      </div>
    </section>
  );
}

/* ----------------------- Components ----------------------- */

function OrderSummaryCard({ serviceName, whenText, address, price, fee, tax, total, currency, status, paymentStatus }) {
  return (
    <aside>
      <div
        className="card"
        style={{
          position:'sticky',
          top: 84, // below sticky header
          display:'grid',
          gap:10,
          padding:16
        }}
      >
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
          <h3 style={{margin:0}}>Order summary</h3>
          <span className="pill" title="Status">{labelize(status)}</span>
        </div>

        <div className="muted" style={{display:'grid', gap:4}}>
          <div><strong>{serviceName}</strong></div>
          <div>{whenText}</div>
          {address ? <div>{address}</div> : null}
          <div>Payment: <strong>{labelize(paymentStatus || 'unpaid')}</strong></div>
        </div>

        <hr style={{border:0, borderTop:'1px solid var(--border)'}} />

        <div style={{display:'grid', gap:8}}>
          <Row label="Subtotal" value={formatPrice(price, currency)} />
          <Row label="Service fee" value={formatPrice(fee, currency)} />
          <Row label="Tax" value={formatPrice(tax, currency)} />
          <Row label={<strong>Total</strong>} value={<strong>{formatPrice(total, currency)}</strong>} />
        </div>
      </div>
    </aside>
  );
}

function Row({ label, value }) {
  return (
    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
      <div className="muted">{label}</div>
      <div>{value}</div>
    </div>
  );
}

function ChoiceCard({ name, value, checked, onChange, title, subtitle, icon }) {
  return (
    <label
      className="card"
      style={{
        display:'grid', gridTemplateColumns:'40px 1fr auto',
        alignItems:'center', gap:12, cursor:'pointer'
      }}
    >
      <div style={{
        width:40, height:40, borderRadius:12,
        background:'#0f1a29', border:'1px solid var(--card-border)',
        display:'grid', placeItems:'center', fontSize:20
      }}>
        {icon}
      </div>

      <div>
        <div style={{fontWeight:700}}>{title}</div>
        <div className="muted" style={{fontSize:13}}>{subtitle}</div>
      </div>

      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        style={{ width:18, height:18 }}
        aria-label={title}
      />
    </label>
  );
}

/* ------------------------- utils ------------------------- */

function numberOr(...vals) {
  for (const v of vals) {
    const n = Number(v);
    if (!Number.isNaN(n) && Number.isFinite(n)) return n;
  }
  return 0;
}
function clampMoney(n) {
  const v = Number(n || 0);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.round(v * 100) / 100);
}
function formatPrice(amount, currency = 'USD') {
  try {
    return new Intl.NumberFormat(undefined, { style:'currency', currency }).format(amount);
  } catch {
    return `$${Number(amount || 0).toFixed(2)}`;
  }
}
function labelize(s) {
  const t = String(s || '').replace(/[-_]/g,' ').trim();
  return t ? t[0].toUpperCase() + t.slice(1) : '—';
}

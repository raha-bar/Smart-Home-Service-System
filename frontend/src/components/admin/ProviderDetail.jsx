import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../lib/api";
import Button from "../ui/Button";

export default function ProviderDetail() {
  const { id } = useParams(); // provider's user id
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState(null);
  const [error, setError] = useState("");

  const [bookings, setBookings] = useState([]);
  const isVerified = !!provider?.isVerified;

  async function load() {
    try {
      setLoading(true);
      setError("");
      // Correct endpoint (was /admin/providers/:id which doesn't exist)
      const res = await api.get(`/providers/${id}`);
      setProvider(res.data);
      // Admin bookings filtered by provider
      const bk = await api.get('/bookings', { params: { provider: id }});
      setBookings(Array.isArray(bk.data?.items) ? bk.data.items : (Array.isArray(bk.data) ? bk.data : []));
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const assignableBookings = useMemo(() => bookings.filter(b => !b.provider), [bookings]);

  async function toggleVerify(next) {
    await api.put(`/providers/${id}/verify`, { verified: next });
    await load();
  }

  if (loading) return <section className="container"><div className="card">Loading…</div></section>;
  if (error) return <section className="container"><div className="card">Failed: {error}</div></section>;
  if (!provider) return <section className="container"><div className="card">Provider not found</div></section>;

  return (
    <section className="container" style={{ display:'grid', gap:16 }}>
      <div className="card" style={{ display:'grid', gap:8 }}>
        <h2 style={{ margin: 0 }}>{provider.displayName || provider.user?.name || 'Provider'}</h2>
        <div className="muted">{provider.user?.email || '—'}</div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <span className="pill">{isVerified ? 'Verified' : 'Unverified'}</span>
          {isVerified
            ? <Button variant="ghost" onClick={() => toggleVerify(false)}>Unverify</Button>
            : <Button variant="primary" onClick={() => toggleVerify(true)}>Verify</Button>}
        </div>
      </div>

      <div className="card" style={{ display:'grid', gap:10 }}>
        <h3 style={{ margin: 0 }}>Current Bookings</h3>
        <div className="muted">Total: {bookings.length}</div>
        <div className="table-responsive">
          <table className="table" style={{ width:'100%' }}>
            <thead className="thead">
              <tr>
                <th className="th">Booking</th>
                <th className="th">Service</th>
                <th className="th">Customer</th>
                <th className="th">Scheduled</th>
                <th className="th">Status</th>
              </tr>
            </thead>
            <tbody className="tbody">
              {bookings.map(b => (
                <tr key={b._id} className="tr">
                  <td className="td mono">{b._id}</td>
                  <td className="td">{b.service?.name || '—'}</td>
                  <td className="td">{b.user?.name || '—'}</td>
                  <td className="td muted">{b.scheduledAt ? new Date(b.scheduledAt).toLocaleString() : '—'}</td>
                  <td className="td"><span className="pill">{labelize(b.status)}</span></td>
                </tr>
              ))}
              {!bookings.length && (
                <tr><td className="td" colSpan={5}>No bookings.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {!!assignableBookings.length && (
          <div className="muted">Tip: you can assign this provider from <Link to="/admin/bookings">Bookings (Admin)</Link>.</div>
        )}
      </div>
    </section>
  );
}

function labelize(s){const t=String(s||'').replace(/[-_]/g,' ').trim();return t?t[0].toUpperCase()+t.slice(1):'—'}

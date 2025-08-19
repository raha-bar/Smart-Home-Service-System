import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../lib/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import useRealtimeBookings from "../../hooks/useRealtimeBookings";

const STATUSES = ["pending", "confirmed", "on_the_way", "completed", "cancelled"];

export default function Assigned() {
  const { user } = useAuth() || {};
  const { push } = useToast() || { push: () => {} };
  const isProvider = !!user && String(user.role) === "provider";

  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get(
        "/bookings/provider/me?sortBy=scheduledAt&order=asc&limit=20"
      );
      const items = Array.isArray(res.data)
        ? res.data
        : res.data?.items || res.data?.bookings || [];
      setRows(items);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time subscription
  const bookingIds = useMemo(() => rows.map((r) => String(r._id)), [rows]);
  useRealtimeBookings({
    bookingIds,
    onEvent: ({ bookingId, status }) => {
      if (bookingId && status) {
        try {
          push({ title: `Booking ${bookingId} → ${status}` });
        } catch {
          try {
            push(`Booking ${bookingId} → ${status}`, "success");
          } catch {}
        }
        load();
      }
    },
  });

  async function setStatus(id, status) {
    if (!STATUSES.includes(status)) return;
    const prev = [...rows]; // clone rows
    setUpdatingId(id);
    setRows((rs) => rs.map((r) => (r._id === id ? { ...r, status } : r)));
    try {
      await api.put(`/bookings/${id}/status`, { status });
      push({ title: "Status updated" });
    } catch (e) {
      setRows(prev); // rollback safely
      push(
        e?.response?.data?.message || e.message || "Status update failed",
        "error"
      );
    } finally {
      setUpdatingId(null);
    }
  }

  if (!isProvider) {
    return (
      <section className="container" style={{ maxWidth: 980 }}>
        <h2>Assigned Bookings</h2>
        <p className="muted">Only providers can view this page.</p>
      </section>
    );
  }

  return (
    <section className="container" style={{ maxWidth: 980 }}>
      <h2>Assigned Bookings</h2>

      {err && <p className="error mono">{err}</p>}
      {loading && <p>Loading…</p>}

      {!loading && rows.length === 0 && (
        <p className="muted">No assigned bookings yet.</p>
      )}

      {!loading && rows.length > 0 && (
        <div className="table">
          <div className="thead">
            <div>When</div>
            <div>Customer</div>
            <div>Service</div>
            <div>Status</div>
            <div>Update</div>
            <div>Actions</div>
          </div>

          {rows.map((b) => {
            const whenText = b.scheduledAt
              ? new Date(b.scheduledAt).toLocaleString()
              : "—";
            return (
              <div className="tr" key={b._id}>
                <div>{whenText}</div>
                <div>{b.user?.name || b.userName || "—"}</div>
                <div>{b.service?.name || b.serviceName || "—"}</div>

                <div>
                  <StatusBadge status={b.status} />
                </div>

                <div>
                  <select
                    value={b.status}
                    onChange={(e) => setStatus(b._id, e.target.value)}
                    disabled={updatingId === b._id}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex" style={{ gap: 8 }}>
                  <Link
                    to={`/messages?bookingId=${b._id}`}
                    className="btn"
                    title="Open chat with customer"
                  >
                    Chat
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

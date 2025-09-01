import { useEffect, useMemo, useState } from "react";
import api from "../../lib/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import useRealtimeBookings from "../../hooks/useRealtimeBookings";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";

/** Admin bookings list with filters + assign provider + CSV export */
const STATUSES = ["pending", "confirmed", "on_the_way", "completed", "cancelled"];

export default function BookingsAdmin() {
  const { user } = useAuth() || {};
  const { push } = useToast() || { push: () => {} };
  const isAdmin = !!user && String(user.role) === "admin";

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [assigningId, setAssigningId] = useState(null);

  // modal state for assigning provider
  const [providerId, setProviderId] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [targetBooking, setTargetBooking] = useState(null);
  const [providers, setProviders] = useState([]);
  const [providersLoading, setProvidersLoading] = useState(false);

  const paramsQS = useMemo(() => {
    const p = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) p.set("status", status);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    if (q) p.set("q", q);
    return p.toString();
  }, [page, limit, status, from, to, q]);

  async function load(p = 1) {
    setLoading(true);
    setErr("");
    try {
      const search = new URLSearchParams({ page: String(p), limit: String(limit) });
      if (status) search.set("status", status);
      if (from) search.set("from", from);
      if (to) search.set("to", to);
      if (q) search.set("q", q);

      const res = await api.get(`/bookings?${search.toString()}`);
      const items = Array.isArray(res.data) ? res.data : res.data?.items || [];
      setRows(items);
      setTotal(Number(res.data?.total || items.length || 0));
      setPage(Number(res.data?.page || p));
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  // initial load
  useEffect(() => {
    load(1);
    // eslint-disable-next-line
  }, []);

  // realtime subscription (admin sees all updates)
  useRealtimeBookings({
    subscribeAll: true,
    onEvent: ({ bookingId, status: newStatus, booking }) => {
      setRows((prev) =>
        prev.map((r) =>
          String(r._id) === String(bookingId)
            ? { ...r, ...(booking || {}), status: newStatus ?? r.status }
            : r
        )
      );
    },
  });

  // open assign modal + fetch verified providers list (helper)
  async function openAssign(booking) {
    setAssignOpen(true);
    setTargetBooking(booking);
    setProviderId("");
    try {
      setProvidersLoading(true);
      const res = await api.get(`/providers?verified=1`);
      const list = Array.isArray(res.data?.items)
        ? res.data.items
        : Array.isArray(res.data)
        ? res.data
        : [];
      setProviders(list);
    } catch {
      // ignore; manual entry still works
    } finally {
      setProvidersLoading(false);
    }
  }

  async function assignProvider(id, provider) {
    if (!id || !provider) return;
    try {
      setAssigningId(id);
      await api.post(`/bookings/${id}/assign`, { providerId: provider });
      // Optimistic UI
      setRows((prev) =>
        prev.map((r) =>
          r._id === id ? { ...r, provider: { ...(r.provider || {}), _id: provider } } : r
        )
      );
      push({ title: "Provider assigned" });
      setAssignOpen(false);
      setProviderId("");
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Assign failed");
    } finally {
      setAssigningId(null);
      load(page); // ensure list refresh after action
    }
  }

  async function updateStatus(bookingId) {
    const next = prompt("Enter status (pending|confirmed|on_the_way|completed|cancelled):");
    if (!next) return;
    try {
      await api.patch(`/bookings/${bookingId}/status`, { status: next });
      push({ title: "Status updated" });
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Update failed");
    } finally {
      load(page); // ensure list refresh after action
    }
  }

  async function exportCsv() {
    try {
      const token = localStorage.getItem("token");
      const base = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const url = `${base}/bookings/export.csv?${paramsQS}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `bookings.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      alert(e?.message || "Export failed");
    }
  }

  if (!isAdmin) {
    return (
      <section className="container" style={{ maxWidth: 1100 }}>
        <h2>Admin — Bookings</h2>
        <p className="muted">Only admin can view this page.</p>
      </section>
    );
  }

  return (
    <section className="container" style={{ maxWidth: 1100 }}>
      <header className="flex between">
        <h2>Admin — Bookings</h2>
        <div className="flex gap">
          <Button onClick={() => load(page)} disabled={loading}>
            Refresh
          </Button>
          <Button onClick={exportCsv} disabled={loading}>
            Export CSV
          </Button>
        </div>
      </header>

      {/* Filters */}
      <div className="filters form" style={{ marginTop: 12 }}>
        <label>
          <div className="label">Status</div>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">(any)</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          <div className="label">From</div>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label>
          <div className="label">To</div>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <label className="grow">
          <div className="label">Search</div>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="name/email…" />
        </label>
        <Button variant="secondary" onClick={() => load(1)}>
          Apply
        </Button>
      </div>

      {loading && <p>Loading…</p>}

      {!loading && rows.length === 0 && <p className="muted">No bookings match your filters.</p>}

      {!loading && rows.length > 0 && (
        <div className="table">
          <div className="thead">
            <div>When</div>
            <div>User</div>
            <div>Provider</div>
            <div>Service</div>
            <div>Status</div>
            <div>Actions</div>
          </div>
          {rows.map((b) => (
            <div className="tr" key={b._id}>
              <div>{b.scheduledAt ? new Date(b.scheduledAt).toLocaleString() : "—"}</div>
              <div>
                {b.user?.name} {b.user?.email ? `(${b.user.email})` : ""}
              </div>
              <div>{b.provider?.name || b.providerName || b.provider?._id || "-"}</div>
              <div>{b.service?.name || b.serviceName || "-"}</div>
              <div>
                <StatusBadge status={b.status} />
              </div>
              <div className="flex gap">
                <Button variant="secondary" onClick={() => openAssign(b)}>
                  Assign
                </Button>
                <Button variant="ghost" onClick={() => updateStatus(b._id)}>
                  Update Status
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="pager" style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
        <button disabled={page <= 1 || loading} onClick={() => load(page - 1)}>
          Prev
        </button>
        <span>Page {page}</span>
        <button disabled={rows.length < limit || loading} onClick={() => load(page + 1)}>
          Next
        </button>
        <button className="ml-auto" disabled={loading} onClick={() => load(page)}>
          Refresh
        </button>
      </div>

      {/* Assign Provider Modal */}
      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title="Assign Provider">
        <div className="form" style={{ display: "grid", gap: 12 }}>
          <Input
            placeholder="Enter provider ID"
            value={providerId}
            onChange={(e) => setProviderId(e.target.value)}
          />

          {/* Verified providers helper (recommended) */}
          {providersLoading ? (
            <div>Loading verified providers…</div>
          ) : providers && providers.length > 0 ? (
            <select
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              className="w-full rounded-md border border-gray-700 bg-transparent p-2"
            >
              <option value="">Select verified provider</option>
              {providers.map((p) => {
                const val = p.user?._id || p.user || p._id;
                const label = p.displayName || p.user?.name || p.userName || val;
                const email = p.user?.email ? ` (${p.user.email})` : "";
                return (
                  <option key={val} value={val}>
                    {label}
                    {email}
                  </option>
                );
              })}
            </select>
          ) : (
            <div className="text-xs muted">No verified providers found.</div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => assignProvider(targetBooking._id, providerId)}
              disabled={assigningId === targetBooking?._id || !providerId}
            >
              {assigningId === targetBooking?._id ? "Assigning…" : "Assign"}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}

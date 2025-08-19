import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import api from "../lib/api";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

export default function Book() {
  const { id } = useParams();               // service id from the route
  const nav = useNavigate();

  // UI state
  const [service, setService] = useState(null);
  const [loadingSvc, setLoadingSvc] = useState(true);
  const [date, setDate] = useState("");          // YYYY-MM-DD
  const [timeSlot, setTimeSlot] = useState("");  // "HH", "H:mm", "HH:mm-HH:mm", "12.00-3.00", etc.
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  // ---- Helpers ----

  // Today in local YYYY-MM-DD for min attribute
  const today = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  // Normalize "10", "10:0", "10.30" -> "10:30"
  function normalizeTimePiece(piece) {
    if (!piece) return null;
    let t = String(piece).trim().replace(/\./g, ":"); // dots → colons
    // Allow "H", "HH", "H:mm", "HH:m", "HH:mm"
    if (/^\d{1,2}$/.test(t)) return `${t.padStart(2, "0")}:00`;
    if (/^\d{1,2}:\d{1,2}$/.test(t)) {
      let [h, m] = t.split(":");
      h = h.padStart(2, "0");
      m = m.padStart(2, "0");
      return `${h}:${m}`;
    }
    return null;
  }

  // Convert date + timeSlot into ISO string (start of slot) with validation
  function buildScheduledAtISO(d, slot) {
    if (!d || !slot) return { iso: null, error: "Pick a date and time." };

    // Split ranges like "10-11", "10:00-11:00", "12.00-3.00"
    const [startRaw] = String(slot).split("-").map(s => s.trim());
    const startNorm = normalizeTimePiece(startRaw);
    if (!startNorm) {
      return { iso: null, error: "Time must be like 10, 10:30, 10:00-11:00 or 12.00-3.00." };
    }

    // Build local datetime and ensure it's in the future
    const local = new Date(`${d}T${startNorm}:00`);
    if (isNaN(local.getTime())) {
      return { iso: null, error: "Invalid date/time. Please check your input." };
    }

    const now = new Date();
    if (local.getTime() < now.getTime()) {
      return { iso: null, error: "Choose a future time." };
    }

    return { iso: local.toISOString(), error: null };
  }

  // ---- Effects ----

  // Load service details for header context
  useEffect(() => {
    let alive = true;
    async function run() {
      if (!id) return;
      setLoadingSvc(true);
      try {
        const res = await api.get(`/services/${id}`);
        if (alive) setService(res.data?.service || res.data);
      } catch {
        if (alive) setService(null);
      } finally {
        if (alive) setLoadingSvc(false);
      }
    }
    run();
    return () => { alive = false; };
  }, [id]);

  // ---- Submit ----

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setOk("");

    if (!id) {
      setErr("Missing service id from the URL.");
      return;
    }
    if (!address.trim()) {
      setErr("Address is required.");
      return;
    }

    const { iso, error } = buildScheduledAtISO(date, timeSlot);
    if (error) {
      setErr(error);
      return;
    }

    setLoading(true);
    try {
      await api.post("/bookings", {
        service: id,            // ✅ your API expects 'service' with the id
        scheduledAt: iso,       // ✅ ISO timestamp (start of chosen slot)
        address: address.trim()
      });
      setOk("Booking created!");
      // Smooth redirect so the success message is visible briefly
      setTimeout(() => nav("/my-bookings"), 600);
    } catch (e2) {
      const msg = e2?.response?.data?.message || e2.message || "Failed to create booking.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  // ---- UI ----

  return (
    <section className="container" style={{ maxWidth: 560 }}>
      <form onSubmit={submit} className="form card">
        <h2 className="text-2xl font-semibold">Book Service</h2>

        <div className="text-sm text-slate-300 mt-1">
          {loadingSvc ? "Loading service…" : service ? (
            <>You are booking: <span className="font-medium">{service.name || service.title || "Service"}</span></>
          ) : (
            <>Service info unavailable.</>
          )}
        </div>

        <div className="grid gap-4 mt-4">
          <label className="block">
            <span className="block mb-1">Date</span>
            <Input
              type="date"
              min={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="block mb-1">Time slot</span>
            <Input
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              placeholder='e.g., 10, 10:30, 10:00-11:00 or 12.00-3.00'
              required
            />
            <p className="text-xs text-slate-400 mt-1">
              We’ll use the <em>start</em> of the slot as your appointment time.
            </p>
          </label>

          <label className="block">
            <span className="block mb-1">Address</span>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House, Street, City"
              required
            />
          </label>
        </div>

        <div className="mt-4">
          <Button variant="primary" disabled={loading}>
            {loading ? "Creating…" : "Create booking"}
          </Button>
        </div>

        {err && <p className="error mono mt-3">{err}</p>}
        {ok && <p className="success mono mt-3">{ok}</p>}

        <div className="mt-4 text-xs text-slate-500">
          Note: Times are interpreted in your local timezone and sent to the server as ISO.
        </div>
      </form>
    </section>
  );
}

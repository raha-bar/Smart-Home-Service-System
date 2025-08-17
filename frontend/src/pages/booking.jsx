import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../lib/api";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

export default function BookService() {
  const { id } = useParams();               // service id from the route
  const nav = useNavigate();

  const [date, setDate] = useState("");     // YYYY-MM-DD
  const [timeSlot, setTimeSlot] = useState(""); // e.g., "10:00-11:00" or "12.00-3.00" or "13:30"
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  // Convert date + timeSlot into ISO string acceptable by the API
  function buildScheduledAtISO(d, slot) {
    if (!d || !slot) return null;

    // take start of slot if a range "HH:mm-HH:mm" or "12.00-3.00"
    let start = String(slot).split("-")[0].trim();

    // normalize dots to colon -> "12:00"
    start = start.replace(/\./g, ":");

    // allow "H", "HH", "H:mm", "HH:mm"
    if (/^\d{1,2}$/.test(start)) start = `${start}:00`;
    if (/^\d{1,2}:\d{1,2}$/.test(start)) {
      let [hh, mm] = start.split(":");
      if (mm.length === 1) mm = `0${mm}`;
      if (hh.length === 1) hh = `0${hh}`;
      start = `${hh}:${mm}`;
    }

    // must now be HH:mm
    if (!/^\d{2}:\d{2}$/.test(start)) return null;

    const dt = new Date(`${d}T${start}:00`); // local time
    if (isNaN(dt.getTime())) return null;

    return dt.toISOString(); // send ISO to backend
  }

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr("");
    setOk("");

    if (!id) {
      setErr("Missing service id.");
      setLoading(false);
      return;
    }

    const scheduledAt = buildScheduledAtISO(date, timeSlot);
    if (!scheduledAt) {
      setErr('Pick a valid date and time (e.g., date "2025-08-19" and time slot "12:00-13:00" or "12.00-3.00").');
      setLoading(false);
      return;
    }

    if (!address.trim()) {
      setErr("Address is required.");
      setLoading(false);
      return;
    }

    try {
      await api.post("/bookings", {
        service: id,            // ✅ correct key
        scheduledAt,            // ✅ ISO timestamp
        address: address.trim() // ✅ required by API
      });

      setOk("Booking created!");
      setTimeout(() => nav("/my-bookings"), 600);
    } catch (e) {
      const msg = e?.response?.data?.message || e.message || "Failed";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container" style={{ maxWidth: 540 }}>
      <form onSubmit={submit} className="form card">
        <h2>Book Service</h2>

        <label>
          Date
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>

        <label>
          Time slot
          <Input
            value={timeSlot}
            onChange={(e) => setTimeSlot(e.target.value)}
            placeholder="e.g., 10:00-11:00 or 12.00-3.00"
            required
          />
        </label>

        <label>
          Address
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="House, Street, City"
            required
          />
        </label>

        <Button variant="primary" disabled={loading}>
          {loading ? "Creating…" : "Create booking"}
        </Button>

        {err && <p className="error mono" style={{ marginTop: 8 }}>{err}</p>}
        {ok && <p className="success mono" style={{ marginTop: 8 }}>{ok}</p>}
      </form>
    </section>
  );
}

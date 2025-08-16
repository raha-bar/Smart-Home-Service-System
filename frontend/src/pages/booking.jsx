import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../lib/api";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

export default function BookService() {
  const { id } = useParams();
  const nav = useNavigate();
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setErr(""); setOk("");
    try {
      await api.post("/bookings", { serviceID: id, date, timeSlot, address });
      setOk("Booking created!");
      setTimeout(()=> nav("/my-bookings"), 500);
    } catch (e) {
      setErr(e.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container" style={{maxWidth:540}}>
      <form onSubmit={submit} className="form card">
        <h2>Book Service</h2>
        <label>Date
          <Input type="date" value={date} onChange={e=>setDate(e.target.value)} required />
        </label>
        <label>Time slot
          <Input value={timeSlot} onChange={e=>setTimeSlot(e.target.value)} placeholder="e.g., 10:00-11:00" required />
        </label>
        <label>Address
          <Input value={address} onChange={e=>setAddress(e.target.value)} placeholder="House, Street, City" required />
        </label>
        <Button variant="primary" disabled={loading}>{loading ? "Creating…" : "Create booking"}</Button>
        {err && <p className="error mono">{err}</p>}
        {ok && <p className="success mono">{ok}</p>}
      </form>
    </section>
  );
}

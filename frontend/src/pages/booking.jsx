import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { api } from "../lib/api";

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
      const { data } = await api.post("/bookings", {
        serviceID: id, date, timeSlot, address
      });
      setOk("Booking created!");
      setTimeout(()=> nav("/bookings"), 600);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message);
    } finally { setLoading(false); }
  };

  return (
    <div style={{maxWidth:460, margin:"20px auto"}}>
      <h1>Book service</h1>
      {err && <div style={{color:"crimson"}}>{err}</div>}
      {ok && <div style={{color:"green"}}>{ok}</div>}
      <form onSubmit={submit} style={{display:"grid", gap:8}}>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} required />
        <input placeholder="Time slot e.g. 10:00-11:00" value={timeSlot} onChange={e=>setTimeSlot(e.target.value)} required />
        <input placeholder="Address" value={address} onChange={e=>setAddress(e.target.value)} required />
        <button disabled={loading}>{loading ? "…" : "Create Booking"}</button>
      </form>
    </div>
  );
}

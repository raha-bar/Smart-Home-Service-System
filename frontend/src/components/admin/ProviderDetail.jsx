import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../lib/api";

export default function ProviderDetail() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");
      // adjust endpoint to your backend route if different:
      const res = await api.get(`/admin/providers/${id}`);
      setProvider(res.data?.provider || res.data);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to load provider");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  if (loading) return <div className="p-6">Loading provider…</div>;
  if (error)   return <div className="p-6 text-red-600">{error}</div>;
  if (!provider) return <div className="p-6">No provider found.</div>;

  const {
    name,
    email,
    phone,
    status,           // e.g., verified/pending
    experience,
    skills = [],
    services = [],    // array of service objects or ids
    ratingsAverage,
    ratingsCount,
    currentBookings = []
  } = provider;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Provider Detail</h1>
        <Link to="/admin/providers" className="text-blue-600 hover:underline">← Back to Providers</Link>
      </div>

      <section className="rounded-lg border p-4">
        <h2 className="text-lg font-medium mb-2">Profile</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div><span className="text-slate-500">Name:</span> {name}</div>
          <div><span className="text-slate-500">Email:</span> {email}</div>
          <div><span className="text-slate-500">Phone:</span> {phone || "—"}</div>
          <div><span className="text-slate-500">Status:</span> {status || "—"}</div>
          <div><span className="text-slate-500">Experience:</span> {experience || "—"}</div>
          <div>
            <span className="text-slate-500">Rating:</span> {ratingsAverage ?? "—"} ({ratingsCount ?? 0})
          </div>
        </div>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="text-lg font-medium mb-2">Skills</h2>
        <div className="flex flex-wrap gap-2">
          {(skills.length ? skills : ["—"]).map((s, i) => (
            <span key={i} className="rounded-full border px-2 py-1 text-sm">{typeof s === "string" ? s : s?.name}</span>
          ))}
        </div>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="text-lg font-medium mb-2">Services</h2>
        <ul className="list-disc pl-6">
          {(services.length ? services : []).map((svc) => (
            <li key={svc._id || svc} className="my-1">
              {typeof svc === "string" ? svc : (svc.name || svc.title || svc._id)}
            </li>
          ))}
          {!services.length && <li>—</li>}
        </ul>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="text-lg font-medium mb-2">Current Bookings</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Booking</th>
                <th className="py-2 pr-4">Service</th>
                <th className="py-2 pr-4">User</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {(currentBookings.length ? currentBookings : []).map(b => (
                <tr key={b._id} className="border-b hover:bg-slate-50">
                  <td className="py-2 pr-4">{b._id}</td>
                  <td className="py-2 pr-4">{b.service?.name || b.serviceName || "—"}</td>
                  <td className="py-2 pr-4">{b.user?.name || b.userName || "—"}</td>
                  <td className="py-2 pr-4">{new Date(b.date || b.createdAt).toLocaleString()}</td>
                  <td className="py-2 pr-4">{b.status}</td>
                </tr>
              ))}
              {!currentBookings.length && (
                <tr><td className="py-2 pr-4" colSpan="5">No active bookings.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

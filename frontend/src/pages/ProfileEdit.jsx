import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProfileEdit() {
  const { user, setUser } = useAuth() || {};
  const nav = useNavigate();

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.put("/users/me", form);
      setUser(res.data); // update auth context
      nav("/profile");
    } catch (err) {
      setError(err.message || "Update failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="container" style={{ maxWidth: 720 }}>
      <h2>Edit Profile</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit} className="card" style={{ padding: 20, display: "grid", gap: 12 }}>
        <input
          className="input"
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
        />
        <input
          className="input"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
        />
        <input
          className="input"
          name="phone"
          placeholder="Phone"
          value={form.phone}
          onChange={handleChange}
        />
        <input
          className="input"
          name="address"
          placeholder="Address"
          value={form.address}
          onChange={handleChange}
        />
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </section>
  );
}

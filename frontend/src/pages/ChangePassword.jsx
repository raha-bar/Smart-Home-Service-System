import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api.js";

export default function ChangePassword() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      return setError("Passwords do not match");
    }
    setLoading(true);
    setError("");
    try {
      await api.put("/users/me/password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      nav("/profile");
    } catch (err) {
      setError(err.message || "Password change failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="container" style={{ maxWidth: 720 }}>
      <h2>Change Password</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit} className="card" style={{ padding: 20, display: "grid", gap: 12 }}>
        <input
          type="password"
          className="input"
          name="currentPassword"
          placeholder="Current Password"
          value={form.currentPassword}
          onChange={handleChange}
        />
        <input
          type="password"
          className="input"
          name="newPassword"
          placeholder="New Password"
          value={form.newPassword}
          onChange={handleChange}
        />
        <input
          type="password"
          className="input"
          name="confirmPassword"
          placeholder="Confirm New Password"
          value={form.confirmPassword}
          onChange={handleChange}
        />
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Changing…" : "Change Password"}
        </button>
      </form>
    </section>
  );
}

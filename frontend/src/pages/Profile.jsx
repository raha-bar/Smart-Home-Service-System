import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Profile() {
  const { user } = useAuth() || {};

  if (!user) {
    return (
      <section className="container" style={{ maxWidth: 720 }}>
        <h2>Profile</h2>
        <p className="muted">No user data available.</p>
      </section>
    );
  }

  return (
    <section className="container" style={{ maxWidth: 720 }}>
      <h2>My Profile</h2>

      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Phone:</strong> {user.phone || "—"}</p>
        <p><strong>Role:</strong> {user.role}</p>
        {user.address && <p><strong>Address:</strong> {user.address}</p>}
      </div>

      <div style={{ display: "flex", gap: "12px" }}>
        <Link to="/profile/edit" className="btn btn-primary">
          Edit Profile
        </Link>
        <Link to="/profile/change-password" className="btn">
          Change Password
        </Link>
      </div>
    </section>
  );
}

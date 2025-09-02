import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
// ⬇️ import your saved logo file
import logo from '../../images/logo2.png';

export default function SiteHeader() {
  const { user, logout } = useAuth() || {};
  const navigate = useNavigate();
  const role = String(user?.role || '').toLowerCase();
  const isAdmin = role === 'admin';

  const onLogout = () => {
    try { logout?.(); } catch {}
    try { navigate('/services', { replace: true }); } catch { window.location.href = '/services'; }
  };

  return (
    <header className="site-header">
      <div className="container navbar">
        {/* Left: brand + primary nav */}
        <div className="nav-left">
          <Link to="/" className="logo flex items-center gap-2">
            <img src={logo} alt="Home Service Logo" className="h-8 w-auto" />
            <strong>HomeService</strong>
          </Link>

          <nav className="nav">
            <NavLink to="/services">Services</NavLink>
            <NavLink to="/my-bookings">My bookings</NavLink>

            {/* Single Admin button → Admin Dashboard */}
            {isAdmin && (
              <NavLink to="/admin">Admin</NavLink>
            )}
          </nav>
        </div>

        {/* Right: auth controls */}
        <div className="nav-right">
          {user ? (
            <div className="row" style={{ gap: 8, alignItems: 'center' }}>
              <span className="muted" style={{ fontSize: 13 }}>
                Hi, {user.name || user.email || 'User'}
              </span>
              <Link to="/profile" className="btn">Profile</Link>
              <button className="btn btn-ghost" onClick={onLogout}>Logout</button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Log in</Link>
              <Link to="/register" className="btn btn-primary">Get started</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

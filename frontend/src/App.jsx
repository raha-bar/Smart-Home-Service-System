import { Routes, Route, Link, Navigate } from 'react-router-dom';
import Services from './pages/Services.jsx';
import ServiceDetail from './pages/ServiceDetail.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import MyBookings from './pages/MyBookings.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import CreateService from './pages/CreateService.jsx';
import { useAuth } from './context/AuthContext.jsx';

export default function App() {
  const { user, logout } = useAuth();
  const isManager = user && (user.role === 'admin' || user.role === 'provider');

  return (
    <div className="container">
      <header className="navbar">
        <div className="row">
          <Link to="/">Services</Link>
          {isManager && <Link to="/services/new" className="btn btn-primary">New Service</Link>}
        </div>
        <div className="spacer" />
        <div className="row">
          {user ? (
            <>
              <span className="mono">Hi, {user.name} {user.role !== 'user' && `(${user.role})`}</span>
              <Link to="/bookings" className="btn">My Bookings</Link>
              <button className="btn" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn">Login</Link>
              <Link to="/register" className="btn">Register</Link>
            </>
          )}
        </div>
      </header>

      <Routes>
        <Route path="/" element={<Services />} />
        <Route path="/services/new" element={
          <ProtectedRoute><CreateService /></ProtectedRoute>
        } />
        <Route path="/services/:id" element={<ServiceDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

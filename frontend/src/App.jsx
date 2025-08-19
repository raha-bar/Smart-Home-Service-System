import { Link, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import Services from './pages/Services.jsx';
import ServiceDetail from './pages/ServiceDetail.jsx';
import Book from './pages/booking.jsx';
import MyBookings from './pages/MyBookings.jsx';
import Login from './pages/login.jsx';
import Register from './pages/Register.jsx';
import CreateService from './pages/CreateService.jsx';
import Profile from './pages/Profile.jsx';
import ProfileEdit from './pages/ProfileEdit.jsx';          // NEW
import ChangePassword from './pages/ChangePassword.jsx';    // NEW
import Favorites from './pages/Favorites.jsx';
import Checkout from './pages/Checkout.jsx';
import Invoice from './pages/Invoice.jsx';
import Messages from './pages/Messages.jsx';

import ServicesAdmin from './pages/admin/ServicesAdmin.jsx';
import ReviewsAdmin from './pages/admin/ReviewsAdmin.jsx';
import BookingsAdmin from './pages/admin/BookingsAdmin.jsx';
import ProvidersAdmin from './pages/admin/ProviderAdmin.jsx';
import ProviderDetail from './pages/admin/ProviderDetail.jsx';
import Assigned from './pages/provider/Assigned.jsx';
import MessagesAdmin from './pages/admin/MessagesAdmin.jsx';

import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';

import { useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './components/ui/Toast.jsx';

export default function App() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const doLogout = () => {
    logout();
    nav('/');
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'manager';
  const isProvider = user?.role === 'provider';

  return (
    <ToastProvider>
      <div>
        <header className="header">
          <div className="container row">
            <Link to="/" className="btn">Services</Link>
            <Link to="/favorites" className="btn">Saved</Link>

            {isAdmin && (
              <>
                <Link to="/admin/services" className="btn">Admin</Link>
                <Link to="/admin/bookings" className="btn">Bookings</Link>
                <Link to="/admin/reviews" className="btn">Reviews</Link>
              </>
            )}

            {isProvider && (
              <Link to="/provider/assigned" className="btn">Assigned</Link>
            )}

            <div className="spacer" />

            {user ? (
              <>
                <span className="muted">Hi, {user?.name || 'User'}</span>
                <Link to="/my-bookings" className="btn">My Bookings</Link>
                <Link to="/profile" className="btn">Profile</Link>
                <button className="btn" onClick={doLogout}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn">Login</Link>
                <Link to="/register" className="btn btn-primary">Sign Up</Link>
              </>
            )}
          </div>
        </header>

        <main className="container" style={{ padding: '20px 0 60px' }}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Services />} />
            <Route path="/services/:id" element={<ServiceDetail />} />

            {/* Authenticated */}
            <Route
              path="/book/:id"
              element={
                <ProtectedRoute>
                  <Book />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-bookings"
              element={
                <ProtectedRoute>
                  <MyBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/edit"
              element={
                <ProtectedRoute>
                  <ProfileEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/change-password"
              element={
                <ProtectedRoute>
                  <ChangePassword />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout/:bookingId"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />

            <Route
              path="/invoice/:bookingId"
              element={
                <ProtectedRoute>
                  <Invoice />
                </ProtectedRoute>
              }
            />

            <Route
              path="/favorites"
              element={
                <ProtectedRoute>
                  <Favorites />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              }
            />

            {/* Admin */}
            <Route
              path="/admin/services"
              element={
                <AdminRoute>
                  <ServicesAdmin />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/providers"
              element={
                <AdminRoute>
                  <ProvidersAdmin />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/providers/:id"
              element={
                <AdminRoute>
                  <ProviderDetail />
                </AdminRoute>
              }
            />
            
            <Route
              path="/admin/messages"
              element={
                <AdminRoute>
                  <MessagesAdmin />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/reviews"
              element={
                <AdminRoute>
                  <ReviewsAdmin />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/bookings"
              element={
                <AdminRoute>
                  <BookingsAdmin />
                </AdminRoute>
              }
            />

            {/* Provider */}
            <Route
              path="/provider/assigned"
              element={
                <ProtectedRoute>
                  <Assigned />
                </ProtectedRoute>
              }
            />

            {/* Auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Create service (role-guarded inside the page as well) */}
            <Route
              path="/create-service"
              element={
                <ProtectedRoute>
                  <CreateService />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="footer">© Smart Home Service</footer>
      </div>
    </ToastProvider>
  );
}

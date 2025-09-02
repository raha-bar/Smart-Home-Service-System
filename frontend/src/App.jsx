import { Routes, Route, Navigate } from 'react-router-dom';

// Public pages
import Home from './pages/Home.jsx';
import Services from './pages/Services.jsx';
import ServiceDetail from './pages/ServiceDetail.jsx';
import BecomeProvider from './pages/BecomeProvider.jsx'; 

// Auth-required pages
import Book from './pages/booking.jsx';
import MyBookings from './pages/MyBookings.jsx';
import Favorites from './pages/Favorites.jsx';
import Messages from './pages/Messages.jsx';
import Checkout from './pages/Checkout.jsx';
import Invoice from './pages/Invoice.jsx';

// Auth pages
import Login from './pages/login.jsx';
import Register from './pages/Register.jsx';

// Profile / user settings
import Profile from './pages/Profile.jsx';
import ProfileEdit from './pages/ProfileEdit.jsx';
import ChangePassword from './pages/ChangePassword.jsx';

// Service authoring
import CreateService from './pages/CreateService.jsx';

// Admin pages
import AdminHome from './pages/admin/AdminHome.jsx';
import ServicesAdmin from './pages/admin/ServicesAdmin.jsx';
import ReviewsAdmin from './pages/admin/ReviewsAdmin.jsx';
import BookingsAdmin from './pages/admin/BookingsAdmin.jsx';
import ProvidersAdmin from './pages/admin/ProviderAdmin.jsx';
import ProviderDetail from './pages/admin/ProviderDetail.jsx';
import MessagesAdmin from './pages/admin/MessagesAdmin.jsx';

// Provider portal
import Assigned from './pages/provider/Assigned.jsx';

// Route guards
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';

// Shell
import SiteHeader from './components/layout/SiteHeader.jsx';
import SiteFooter from './components/layout/SiteFooter.jsx';

// Toasts
import { ToastProvider } from './components/ui/Toast.jsx';

export default function App() {
  return (
    <ToastProvider>
      <div className="app-shell">
        {/* Global header */}
        <SiteHeader />

        {/* Main content */}
        <main className="container" style={{ padding: '20px 0 60px' }}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:id" element={<ServiceDetail />} />
            <Route path="/become-provider" element={<BecomeProvider />} /> {/* ⬅️ NEW */}

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
              path="/profile/password"
              element={
                <ProtectedRoute>
                  <ChangePassword />
                </ProtectedRoute>
              }
            />

            {/* Create service (page also checks role) */}
            <Route
              path="/create-service"
              element={
                <ProtectedRoute>
                  <CreateService />
                </ProtectedRoute>
              }
            />

            {/* Provider portal */}
            <Route
              path="/provider/assigned"
              element={
                <ProtectedRoute>
                  <Assigned />
                </ProtectedRoute>
              }
            />

            {/* Admin */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminHome />
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
              path="/admin/services"
              element={
                <AdminRoute>
                  <ServicesAdmin />
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
              path="/admin/messages"
              element={
                <AdminRoute>
                  <MessagesAdmin />
                </AdminRoute>
              }
            />

            {/* Auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Global footer */}
        <SiteFooter />
      </div>
    </ToastProvider>
  );
}

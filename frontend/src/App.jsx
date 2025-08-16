import { Link, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Services from './pages/Services.jsx'
import ServiceDetail from './pages/ServiceDetail.jsx'
import Book from './pages/booking.jsx'
import MyBookings from './pages/MyBookings.jsx'
import Login from './pages/login.jsx'
import Register from './pages/Register.jsx'
import CreateService from './pages/CreateService.jsx'
import Profile from './pages/Profile.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { useAuth } from './context/AuthContext.jsx'

export default function App(){
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const doLogout = ()=>{ logout(); nav('/'); };

  return (
    <div>
      <header className="header">
        <div className="container row">
          <Link to="/" className="btn">Services</Link>
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

      <main className="container" style={{padding:'20px 0 60px'}}>
        <Routes>
          <Route path="/" element={<Services/>}/>
          <Route path="/services/:id" element={<ServiceDetail/>}/>
          <Route path="/book/:id" element={<ProtectedRoute><Book/></ProtectedRoute>}/>
          <Route path="/my-bookings" element={<ProtectedRoute><MyBookings/></ProtectedRoute>}/>
          <Route path="/profile" element={<ProtectedRoute><Profile/></ProtectedRoute>}/>
          <Route path="/login" element={<Login/>}/>
          <Route path="/register" element={<Register/>}/>
          <Route path="/create-service" element={<ProtectedRoute><CreateService/></ProtectedRoute>}/>
          <Route path="*" element={<Navigate to="/" replace/>}/>
        </Routes>
      </main>

      <footer className="footer">© Smart Home Service</footer>
    </div>
  )
}

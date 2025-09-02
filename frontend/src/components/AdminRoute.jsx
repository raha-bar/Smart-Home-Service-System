// frontend/src/components/AdminRoute.jsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminRoute({ children }) {
  const { user: ctxUser } = useAuth() || {};
  const loc = useLocation();

  // Also read persisted auth to avoid flicker/loops on first load
  const storedUser = getStoredUser();
  const token = getToken();
  const user = ctxUser || storedUser;

  const role = String(user?.role || '').toLowerCase();
  const isAdmin = role === 'admin'; // add more allowed roles if needed

  // Not logged in → send to login, preserve intended target
  if (!token || !user) {
    const redirect = encodeURIComponent(loc.pathname + loc.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  // Logged in but not admin → send to public area
  if (!isAdmin) {
    return <Navigate to="/services" replace />;
  }

  // Works for both:
  // 1) <AdminRoute><Page/></AdminRoute>
  // 2) <Route element={<AdminRoute/>}><Route ... element={<Page/>}/></Route>
  return children ?? <Outlet />;
}

/* ---------- helpers ---------- */
function getStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getToken() {
  try {
    return localStorage.getItem('token') || localStorage.getItem('accessToken') || '';
  } catch {
    return '';
  }
}

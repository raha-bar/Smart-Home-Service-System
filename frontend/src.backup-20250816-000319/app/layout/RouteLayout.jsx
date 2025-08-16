import { Outlet, NavLink } from "react-router-dom";

export default function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <nav className="container mx-auto flex gap-4 py-3">
          <NavLink to="/">Services</NavLink>
          <NavLink to="/my-bookings">My Bookings</NavLink>
          <div className="ml-auto flex gap-3">
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register">Sign Up</NavLink>
          </div>
        </nav>
      </header>
      <main className="container mx-auto flex-1 py-6">
        <Outlet />
      </main>
      <footer className="border-t py-4 text-center text-sm">© Smart Home Service</footer>
    </div>
  );
}

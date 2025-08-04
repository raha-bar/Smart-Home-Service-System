import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import ServiceList from './pages/ServiceList';
import BookingHistory from './pages/BookingHistory';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/services" element={<ServiceList />} />
        <Route path="/bookings" element={<BookingHistory />} />
        {/* Add more routes as needed */}
      </Routes>
    </Router>
  );
}

export default App;
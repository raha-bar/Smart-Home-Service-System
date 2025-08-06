import React, { useState, useEffect } from 'react';
import { getServices } from '../services/api';

function ServicesPage({ loggedInUserEmail, onLogout, showMessage }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Move fetchServices inside useEffect for cleaner dependency management
  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getServices();
        setServices(data);
        showMessage('Services loaded successfully!', 'success');
      } catch (err) {
        setError(err.message || 'Failed to fetch services.');
        showMessage(err.message || 'Failed to fetch services.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [showMessage]); // Added showMessage to dependencies, as it's a prop and could change.
                    // If showMessage is guaranteed to be stable, you could remove it.
                    // For simplicity and to avoid warnings, it's safer to include it.

  // The onClick for the button still calls the outer fetchServices, which is now gone.
  // We need to adjust the button's onClick to call the function defined inside useEffect,
  // or redefine fetchServices outside if it needs to be called by the button.
  // For the button, let's keep a separate, stable function.

  const handleRefreshServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getServices();
      setServices(data);
      showMessage('Services loaded successfully!', 'success');
    } catch (err) {
      setError(err.message || 'Failed to fetch services.');
      showMessage(err.message || 'Failed to fetch services.', 'error');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-700">Available Services</h2>
        <div className="flex items-center space-x-4">
          {loggedInUserEmail && (
            <span className="text-gray-700 font-medium">Welcome, {loggedInUserEmail}!</span>
          )}
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Logout
          </button>
        </div>
      </div>

      <button
        onClick={handleRefreshServices} // Changed to call the new stable function
        className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Refresh Services
      </button>

      {loading && <p className="text-center text-gray-600">Loading services...</p>}
      {error && <p className="text-center text-red-500">Error: {error}</p>}

      {!loading && !error && services.length === 0 && (
        <p className="text-center text-gray-600">No services available yet. Add some via backend API (e.g., Postman).</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div key={service._id} className="bg-gray-50 p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{service.title}</h3>
            <p className="text-gray-600 mb-1"><strong>Category:</strong> {service.category}</p>
            <p className="text-gray-600 mb-1"><strong>Price:</strong> {service.price} BDT</p>
            <p className="text-gray-600 mb-1"><strong>Estimated Time:</strong> {service.estimatedTime}</p>
            <p className="text-gray-700 text-sm mt-2">{service.description}</p>
            {/* You can add a "Book Now" button here later */}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ServicesPage;

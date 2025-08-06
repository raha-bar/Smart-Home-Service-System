const API_BASE_URL = 'http://localhost:5000/api'; // Ensure this matches your backend port

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    // If response is not OK, throw an error with the backend message
    throw new Error(data.message || data.error || 'Something went wrong');
  }
  return data;
};

export const registerUser = async (userData) => {
  const response = await fetch(`${API_BASE_URL}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  return handleResponse(response);
};

export const loginUser = async (credentials) => {
  const response = await fetch(`${API_BASE_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  return handleResponse(response);
};

export const getServices = async () => {
  const response = await fetch(`${API_BASE_URL}/services`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse(response);
};

// add more API calls here as needed for other features
// For example:
/*
export const createBooking = async (bookingData, token) => {
  const response = await fetch(`${API_BASE_URL}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // If you implement auth middleware
    },
    body: JSON.stringify(bookingData),
  });
  return handleResponse(response);
};
*/

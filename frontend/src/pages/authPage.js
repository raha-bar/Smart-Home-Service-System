import React, { useState } from 'react';
import { registerUser, loginUser } from '../services/api'; // API service calls

function AuthPage({ onLoginSuccess, showMessage }) {
  const [isRegistering, setIsRegistering] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        const data = await registerUser({ email, password, phone, address, role: 'user' }); // Default role for frontend registration
        showMessage(data.message, 'success');
        // Optionally, auto-login after registration
        // const loginData = await loginUser({ email, password });
        // onLoginSuccess(loginData.user.email);
      } else {
        const data = await loginUser({ email, password });
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('userEmail', data.user.email);
        onLoginSuccess(data.user.email);
      }
      // Clear form fields
      setEmail('');
      setPassword('');
      setPhone('');
      setAddress('');
    } catch (error) {
      showMessage(error.message || 'An error occurred', 'error');
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
      <h2 className="text-2xl font-bold text-center text-blue-700 mb-6">
        {isRegistering ? 'Register' : 'Login'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            id="email"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            id="password"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {isRegistering && (
          <>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="text"
                id="phone"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address (Optional)</label>
              <input
                type="text"
                id="address"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </>
        )}
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {isRegistering ? 'Register' : 'Login'}
        </button>
      </form>
      <div className="mt-6 text-center">
        <button
          onClick={() => setIsRegistering(!isRegistering)}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
        </button>
      </div>
    </div>
  );
}

export default AuthPage;

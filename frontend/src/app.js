import React, { useState, useEffect } from 'react';
import AuthPage from './pages/authPage';
import ServicesPage from './pages/servicesPage';
import Message from './components/message';

function App() {
  const [currentPage, setCurrentPage] = useState('auth'); // 'auth' or 'services'
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loggedInUserEmail, setLoggedInUserEmail] = useState(localStorage.getItem('userEmail'));

  useEffect(() => {
    // Check if user is already logged in on app load
    if (localStorage.getItem('token') && localStorage.getItem('userId') && localStorage.getItem('userEmail')) {
      setCurrentPage('services');
    }
  }, []);

  const handleLoginSuccess = (userEmail) => {
    setLoggedInUserEmail(userEmail);
    setCurrentPage('services');
    showMessage('Logged in successfully!', 'success');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    setLoggedInUserEmail(null);
    setCurrentPage('auth');
    showMessage('Logged out successfully!', 'success');
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
  };

  const clearMessage = () => {
    setMessage({ text: '', type: '' });
  };

  // Simple routing using a switch statement
  const renderPage = () => {
    switch (currentPage) {
      case 'auth':
        return <AuthPage onLoginSuccess={handleLoginSuccess} showMessage={showMessage} />;
      case 'services':
        return <ServicesPage loggedInUserEmail={loggedInUserEmail} onLogout={handleLogout} showMessage={showMessage} />;
      default:
        return <AuthPage onLoginSuccess={handleLoginSuccess} showMessage={showMessage} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      {message.text && (
        <Message text={message.text} type={message.type} onClose={clearMessage} />
      )}
      {renderPage()}
    </div>
  );
}

export default App;

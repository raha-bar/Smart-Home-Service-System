import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app';

// Create a root for React 18
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the App component into the root
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

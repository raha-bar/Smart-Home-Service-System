import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Create a root for React 18
const root = ReactDOM.createRoot(document.getElementById('root'));
// backend/index.js
const app = require('./App');           // or './server'
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API running on :${PORT}`));

// Render the App component into the root
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

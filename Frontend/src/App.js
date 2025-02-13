// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Signup from './Signup';
import Dashboard from './Dashboard';

function App() {
  const [token, setToken] = useState(null);

  // When the app loads, check for an existing token in localStorage.
  useEffect(() => {
    const savedToken = localStorage.getItem('accessToken');
    console.log("Token retrieved in App.js:", savedToken);
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  // Logout function: clears tokens and resets state.
  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setToken(null);
  };

  return (
    <Router>
      <Routes>
        {/* Login route: if token exists, redirect to Dashboard */}
        <Route
          path="/login"
          element={!token ? <Login setToken={setToken} /> : <Navigate to="/dashboard" replace />}
        />
        {/* Signup route */}
        <Route
          path="/signup"
          element={<Signup />}
        />
        {/* Protected Dashboard route: only accessible if token exists */}
        <Route
          path="/dashboard"
          element={token ? <Dashboard token={token} onLogout={logout} /> : <Navigate to="/login" replace />}
        />
        {/* Fallback route: redirect any unknown URL to /login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';


function App() {
  const [token, setToken] = useState(null);

  // On app load, check for an existing token in localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('accessToken');
    if (savedToken) {
    setToken(savedToken);
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={!token ? <Login setToken={setToken} /> : <Navigate to="/dashboard" />}
        />
        <Route
          path="/dashboard"
          element={token ? <Dashboard token={token} /> : <Navigate to="/login" />}
        />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;

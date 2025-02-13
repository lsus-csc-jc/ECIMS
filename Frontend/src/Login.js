// src/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './LoginPage.css'; // This should contain your custom styles (from Signup.css)

const Login = ({ setToken }) => {
  const [email, setEmail] = useState(''); // using email instead of username
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // React handleSubmit replaces the inline script from login.html
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Send a POST request to the backend API login endpoint
      const response = await fetch("/api/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (response.ok && data.access && data.refresh) {
        // Store tokens in localStorage
        localStorage.setItem('accessToken', data.access);
        localStorage.setItem('refreshToken', data.refresh);
        setToken(data.access);
        // Redirect to the dashboard
        navigate('/dashboard');
      } else {
        setError(data.detail || 'Invalid credentials!');
      }
    } catch (err) {
      setError('Failed to connect to the server!');
    }
  };

  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center">
      <div className="row w-100 g-0">
        {/* Left Section – Branding */}
        <div className="col-md-6 d-flex flex-column justify-content-center align-items-center text-white left-section">
          <h1 className="display-1 fw-bold ecims-title">ECIMS</h1>
          <p className="lead subtitle text-center px-3">
            Extensible Computerized Inventory Management System
          </p>
        </div>
        {/* Right Section – Login Form */}
        <div className="col-md-6 d-flex justify-content-center align-items-center right-section">
          <div className="w-100 p-4 login-container">
            <h2 className="mb-3">Log in to your account</h2>
            <form id="loginForm" onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="email" className="form-label">Email*</label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  placeholder="Enter your email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="password" className="form-label">Password*</label>
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary w-100 mb-3">
                Sign in
              </button>
              {error && (
                <p id="loginMessage" className="text-danger text-center">
                  {error}
                </p>
              )}
              <button type="button" className="btn btn-light w-100">
                <img
                  src="/images/google-icon.png"
                  alt="Google Logo"
                  className="me-2"
                  width="30"
                />{" "}
                Sign in with Google
              </button>
            </form>
            <div className="text-center mt-3">
              <span>Don't have an account?</span>
              <a href="/signup" className="text-primary">Sign up</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

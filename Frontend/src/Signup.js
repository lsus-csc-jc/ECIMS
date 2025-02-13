// src/Signup.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';


const Signup = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Build the signup payload
    const signupData = {
      email: email,
      password: password,
      first_name: name, // Using name as first_name; adjust if needed.
      last_name: ""     // If you need last_name, add another field.
    };

    console.log("Submitting signup data:", signupData);

    try {
      const response = await fetch("/api/signup/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupData)
      });

      const data = await response.json();
      console.log("Response data:", data);
      if (response.ok) {
        setSuccess("User created successfully. Please log in.");
        // Redirect to login after a short delay.
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.detail || "Signup failed. Please try again.");
      }
    } catch (err) {
      setError("An error occurred during signup.");
      console.error("Signup error:", err);
    }
  };

  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center">
      <div className="row w-100 g-0">
        {/* Left Section */}
        <div className="col-md-6 d-flex flex-column justify-content-center align-items-center text-white left-section">
          <h1 className="display-1 fw-bold ecims-title">ECIMS</h1>
          <p className="lead subtitle text-center px-3">
            Extensible Computerized Inventory Management System
          </p>
        </div>
        {/* Right Section (Signup Form) */}
        <div className="col-md-6 d-flex justify-content-center align-items-center right-section">
          <div className="w-100 p-4" style={{ maxWidth: '400px' }}>
            <h2 className="mb-3">Create an Account</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="name" className="form-label">Name*</label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  placeholder="Enter your name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
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
                <small className="text-muted">
                  Password must be at least 8 characters.
                </small>
              </div>
              <button type="submit" className="btn btn-primary w-100 mb-3">
                Get Started
              </button>
              {error && <p className="text-danger text-center">{error}</p>}
              {success && <p className="text-success text-center">{success}</p>}
              <button type="button" className="btn btn-light w-100">
                <img
                  src="/images/google-icon.png"
                  alt="Google Logo"
                  className="me-2"
                  width="30"
                />
                Sign in with Google
              </button>
            </form>
            <div className="text-center mt-3">
              <span>Already have an account?</span>
              <a href="/login" className="text-primary">Log in</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;

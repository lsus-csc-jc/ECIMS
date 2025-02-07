// src/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = ({ token, onLogout }) => {
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Log the token for debugging.
  useEffect(() => {
    console.log("Token in Dashboard:", token);
  }, [token]);

  // Fetch products and items when the token is available.
  useEffect(() => {
    if (!token) return; // Exit if token is missing

    const fetchProducts = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/products/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        console.log("Fetched products:", data);
        setProducts(data);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(err.message);
      }
    };

    const fetchItems = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/items/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        console.log("Fetched items:", data);
        setItems(data);
      } catch (err) {
        console.error("Error fetching items:", err);
        setError(err.message);
      }
    };

    fetchProducts();
    fetchItems();
  }, [token]);

  // Logout handler: calls onLogout and navigates to login.
  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <div>
      <h1>Dashboard</h1>
      <button onClick={handleLogout}>Logout</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <h2>Products</h2>
      {products.length > 0 ? (
        <ul>
          {products.map((product) => (
            <li key={product.id}>{product.name}</li>
          ))}
        </ul>
      ) : (
        <p>No products available.</p>
      )}
      <h2>Items</h2>
      {items.length > 0 ? (
        <ul>
          {items.map((item) => (
            <li key={item.id}>{item.name}</li>
          ))}
        </ul>
      ) : (
        <p>No items available.</p>
      )}
    </div>
  );
};

export default Dashboard;

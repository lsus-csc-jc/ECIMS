// src/Dashboard.js
import React, { useState, useEffect } from 'react';

const Dashboard = ({ token }) => {
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch products from the backend
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
        setProducts(data);
      } catch (err) {
        setError(err.message);
      }
    };

    // Fetch items from the backend
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
        setItems(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchProducts();
    fetchItems();
  }, [token]);

  return (
    <div>
      <h1>Dashboard</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <h2>Products</h2>
      {products && products.length > 0 ? (
        <ul>
          {products.map((product) => (
            <li key={product.id}>{product.name}</li>
          ))}
        </ul>
      ) : (
        <p>No products available.</p>
      )}
      <h2>Items</h2>
      {items && items.length > 0 ? (
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

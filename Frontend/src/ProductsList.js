// src/ProductsList.js
import { useState, useEffect } from "react";

const ProductsList = () => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        setError("No token found! Please log in.");
        return;
      }

      try {
        const response = await fetch("http://127.0.0.1:8000/api/products/", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
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

    fetchProducts();
  }, []);

  return (
    <div>
      <h2>Products</h2>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      <ul>
        {products.map((product) => (
          <li key={product.id}>
            {product.name} - {product.price}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProductsList;

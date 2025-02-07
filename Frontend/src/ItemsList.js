// src/ItemsList.js
import { useState, useEffect } from "react";

const ItemsList = () => {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchItems = async () => {
      const token = localStorage.getItem("accessToken");  // ✅ Get token

      if (!token) {
        setError("No token found! Please log in.");
        return;
      }

      try {
        const response = await fetch("http://127.0.0.1:8000/api/items/", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
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

    fetchItems();
  }, []);

  return (
    <div>
      <h2>Items</h2>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            {item.name} - {item.price}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ItemsList;

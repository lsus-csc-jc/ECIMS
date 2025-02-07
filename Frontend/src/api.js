import axios from "axios";
import API_BASE_URL from "./config";

const token = localStorage.getItem("access_token"); // Get token if authentication is required

export const getProducts = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}inventory/api/products/`, {
      headers: { Authorization: `Bearer ${token}` }, // Include authentication token if required
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

import axios from "axios";
import API_BASE_URL from "./config";
import { refreshToken } from "./auth"; // Import refreshToken function

const getToken = () => localStorage.getItem("access_token");

const getAuthHeaders = async () => {
  let token = getToken();
  if (!token) {
    token = await refreshToken(); // Refresh token if not available
  }
  return { Authorization: `Bearer ${token}` };
};

export const getProducts = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}inventory/api/products/`, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

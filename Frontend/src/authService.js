// src/services/authService.js

export const loginUser = async (username, password) => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/token/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
  
      if (!response.ok) {
        throw new Error("Login failed. Check your credentials.");
      }
  
      const data = await response.json();
      localStorage.setItem("access_token", data.access); // Store access token
      localStorage.setItem("refresh_token", data.refresh); // Store refresh token
      return data; // Return the token for further usage
    } catch (error) {
      console.error("Error logging in:", error.message);
      return null;
    }
  };
  
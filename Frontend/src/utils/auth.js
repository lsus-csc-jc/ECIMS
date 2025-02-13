export const refreshToken = async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      return null;
    }
  
    try {
      const response = await fetch(`${API_BASE_URL}api/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('access_token', data.access);
        return data.access;
      } else {
        console.error('Failed to refresh token:', data);
        return null;
      }
    } catch (err) {
      console.error('Failed to refresh token:', err);
      return null;
    }
  };
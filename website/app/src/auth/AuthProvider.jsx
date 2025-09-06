import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";

const authApiUrl = import.meta.env.VITE_AUTH_API_URL;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));

  const saveTokens = (accessToken, newRefreshToken) => {
    localStorage.setItem('token', accessToken);
    localStorage.setItem('refreshToken', newRefreshToken);
    setToken(accessToken);
    setRefreshToken(newRefreshToken);
  };

  const clearTokens = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setToken(null);
    setRefreshToken(null);
  };

  const refreshAccessToken = async () => {
    try {
      const response = await fetch(`${authApiUrl}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });
      const data = await response.json();
      if (data.token && data.refreshToken) {
        saveTokens(data.token, data.refreshToken);
        return data.token;
      } else {
        throw new Error('Failed to refresh token');
      }
    } catch (error) {
      clearTokens();
      throw error;
    }
  };

  const getToken = async () => {
    if (!token) return null;

    const decodedToken = jwtDecode(token);
    const currentTime = Date.now() / 1000;

    if (decodedToken.exp < currentTime) {
      // Token has expired, try to refresh it
      try {
        return await refreshAccessToken();
      } catch (error) {
        return null;
      }
    }

    return token;
  };

  const login = async ({ email, password }) => {
    const response = await fetch(`${authApiUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (data.token && data.refreshToken) {
      saveTokens(data.token, data.refreshToken);
    } else if (data.error) {
      throw new Error(data.error);
    } else {
      throw new Error('Unknown error');
    }
  };

  const register = async ({ email, password }) => {
    const response = await fetch(`${authApiUrl}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (data.token && data.refreshToken) {
      saveTokens(data.token, data.refreshToken);
    } else if (data.error) {
      throw new Error(data.error);
    } else {
      throw new Error('Unknown error');
    }
  };

  const logout = () => {
    clearTokens();
  };

  const isLoggedIn = () => {
    return !!token;
  };

  useEffect(() => {
    const checkTokenValidity = async () => {
      await getToken();
    };
    checkTokenValidity();
  }, []);

  const contextValue = {
    getToken,
    
    login,
    logout,
    register,
    isLoggedIn,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
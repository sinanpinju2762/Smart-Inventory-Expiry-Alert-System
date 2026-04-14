import { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    return JSON.parse(localStorage.getItem('user') || 'null');
  });
  const [loading, setLoading] = useState(false);

  // Refresh user data from server on every page load
  useEffect(() => {
    if (user?.token) {
      refreshUser();
    }
  }, []);

  const refreshUser = async () => {
    try {
      const { data } = await API.get('/auth/me');
      const updated = { ...user, ...data, token: user.token };
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
    } catch {
      // Token expired or invalid
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await API.post('/auth/login', { email, password });
      localStorage.setItem('user', JSON.stringify(data));
      setUser(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const { data } = await API.post('/auth/register', userData);
      localStorage.setItem('user', JSON.stringify(data));
      setUser(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = { user, login, register, logout, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

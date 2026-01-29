import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('pcu_cms_token'));
  const [loading, setLoading] = useState(true);

  // Configure global API defaults
  axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
  axios.defaults.headers.common['Content-Type'] = 'application/json';
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Check if user is already logged in on mount
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get('/user');
        // FIX 1: This now gets the user WITH roles from the updated api.php
        setUser(response.data);
      } catch (error) {
        console.error('Auth check failed', error);
        logout(); // Token invalid, force logout
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/login', { email, password });
      
      // FIX 2: Extract the FULL user object (which includes roles) 
      // instead of manually creating a partial one.
      const { token, user } = response.data.data; 
      
      localStorage.setItem('pcu_cms_token', token);
      setToken(token);
      
      // Save the full user object so Sidebar.jsx can read user.roles
      setUser(user); 
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      toast.success(`Welcome back, ${user.name}!`);
      return true;
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Login failed. Please check credentials.');
      return false;
    }
  };

  const logout = async () => {
    try {
      await axios.post('/logout');
    } catch (e) {
      // Ignore errors on logout
    }
    localStorage.removeItem('pcu_cms_token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    toast.success('Logged out successfully');
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path; 
    if (path.startsWith('data:')) return path; 
    
    const baseUrl = axios.defaults.baseURL.replace('/api', '');
    return `${baseUrl}${path}`;
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, getImageUrl }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
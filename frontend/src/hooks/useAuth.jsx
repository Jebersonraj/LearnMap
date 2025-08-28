import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Verify token and set user
        const decoded = jwtDecode(token);
        
        // Check if token is expired
        const currentTime = Date.now() / 1000;
        if (decoded.exp < currentTime) {
          // Token is expired
          localStorage.removeItem('token');
          setUser(null);
        } else {
          // Set user from token
          setUser({
            id: decoded.id,
            username: decoded.username,
            role: decoded.role
          });
          
          // Set default Authorization header for all requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Invalid token:', error);
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      setError(null);
      const response = await axios.post('http://localhost:5000/api/auth/login', credentials);
      const { token, user } = response.data;
      
      // Save token to localStorage
      localStorage.setItem('token', token);
      
      // Set default Authorization header for all requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Set user state
      setUser(user);
      
      return user;
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'Login failed. Please try again.');
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await axios.post('http://localhost:5000/api/auth/register', userData);
      const { token, user } = response.data;
      
      // Save token to localStorage
      localStorage.setItem('token', token);
      
      // Set default Authorization header for all requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Set user state
      setUser(user);
      
      return user;
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
      throw error;
    }
  };

  const logout = () => {
    // Remove token from localStorage
    localStorage.removeItem('token');
    
    // Remove Authorization header
    delete axios.defaults.headers.common['Authorization'];
    
    // Clear user state
    setUser(null);
  };

  const updateProfile = async (userData) => {
    try {
      setError(null);
      const response = await axios.put('http://localhost:5000/api/users/me', userData);
      
      // Update user state
      setUser(response.data.user);
      
      return response.data.user;
    } catch (error) {
      console.error('Profile update error:', error);
      setError(error.response?.data?.message || 'Profile update failed. Please try again.');
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
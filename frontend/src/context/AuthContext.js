import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const defaultPermissions = {
  can_manage_ministries: false,
  can_manage_news: false,
  can_manage_legislation: false,
  can_manage_roles: false,
  can_delete: false
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const response = await axios.post(`${API}/auth/login`, { username, password });
    const { access_token, user: userData } = response.data;
    localStorage.setItem('token', access_token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const registerWithCode = async (username, accessCode) => {
    const response = await axios.post(`${API}/auth/register`, { 
      username, 
      access_code: accessCode 
    });
    const { access_token, user: userData } = response.data;
    localStorage.setItem('token', access_token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const registerGovernor = async (username, password, governorSecret) => {
    const response = await axios.post(`${API}/auth/register-governor`, { 
      username, 
      password,
      governor_secret: governorSecret
    });
    const { access_token, user: userData } = response.data;
    localStorage.setItem('token', access_token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const checkGovernorExists = async () => {
    try {
      const response = await axios.get(`${API}/auth/check-governor`);
      return response.data.exists;
    } catch {
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.role === 'governor') return true;
    return user.permissions?.[permission] || false;
  };

  const isGovernor = user?.role === 'governor';
  const permissions = user?.permissions || defaultPermissions;

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      login, 
      registerWithCode,
      registerGovernor,
      checkGovernorExists,
      logout, 
      isAuthenticated: !!user,
      isGovernor,
      permissions,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

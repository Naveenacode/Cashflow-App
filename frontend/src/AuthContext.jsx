import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from './api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [family, setFamily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUserData = async () => {
    try {
      const [userRes, familyRes] = await Promise.all([
        authAPI.getMe(),
        authAPI.getFamily()
      ]);
      setUser(userRes.data);
      setFamily(familyRes.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const { access_token } = response.data;
    localStorage.setItem('token', access_token);
    setToken(access_token);
    await fetchUserData();
  };

  const register = async (name, email, password, profile_icon) => {
    const response = await authAPI.register({ name, email, password, profile_icon });
    const { access_token } = response.data;
    localStorage.setItem('token', access_token);
    setToken(access_token);
    await fetchUserData();
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setFamily(null);
  };

  const updateProfile = async (name, profile_icon) => {
    await authAPI.updateProfile({ name, profile_icon });
    await fetchUserData();
  };

  const value = {
    user,
    family,
    loading,
    token,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!token,
    isAdmin: family?.current_user_role === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

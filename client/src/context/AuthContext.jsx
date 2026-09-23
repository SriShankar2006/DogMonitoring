import React, { createContext, useContext } from 'react';
import PropTypes from 'prop-types';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const value = {
    currentUser: null,
    loading: false,
    login: async () => {},
    register: async () => {},
    logout: async () => {},
    resetPassword: async () => {},
    updateUserProfile: async () => {}
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

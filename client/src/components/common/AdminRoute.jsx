import React from 'react';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';

export default function AdminRoute({ children }) {
  const isAdmin = sessionStorage.getItem('dog_admin_session') === 'true';

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

AdminRoute.propTypes = {
  children: PropTypes.node
};

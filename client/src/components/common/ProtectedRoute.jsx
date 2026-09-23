import React from 'react';
import PropTypes from 'prop-types';

export default function ProtectedRoute({ children }) {
  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node
};

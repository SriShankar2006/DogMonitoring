import React from 'react';
import PropTypes from 'prop-types';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ProtectedRoute from '../components/common/ProtectedRoute';
import MainLayout from '../components/common/MainLayout';
import ErrorBoundary from '../components/common/ErrorBoundary';

import Dashboard from '../pages/Dashboard';
import MapPage from '../pages/MapPage';
import Heatmap from '../pages/Heatmap';
import Upload from '../pages/Upload';
import Search from '../pages/Search';
import DogDetails from '../pages/DogDetails';
import Statistics from '../pages/Statistics';
import Settings from '../pages/Settings';
import Admin from '../pages/Admin';
import AdminRoute from '../components/common/AdminRoute';
import NotFound from '../pages/NotFound';

function Protected({ title, children }) {
  const location = useLocation();
  return (
    <ProtectedRoute>
      <MainLayout title={title}>
        <ErrorBoundary resetKey={location.pathname}>{children}</ErrorBoundary>
      </MainLayout>
    </ProtectedRoute>
  );
}

Protected.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node
};

export default function AppRoutes() {
  const location = useLocation();

  return (
    <Routes>
      {/* Public app routes */}
      <Route
        path="/dashboard"
        element={
          <Protected title="Dashboard">
            <Dashboard />
          </Protected>
        }
      />
      <Route
        path="/map"
        element={
          <Protected title="Map">
            <MapPage />
          </Protected>
        }
      />
      <Route
        path="/heatmap"
        element={
          <Protected title="Dog Density Heatmap">
            <Heatmap />
          </Protected>
        }
      />
      <Route
        path="/upload"
        element={
          <Protected title="Upload Sighting">
            <Upload />
          </Protected>
        }
      />
      <Route
        path="/search"
        element={
          <Protected title="Search & Filters">
            <Search />
          </Protected>
        }
      />
      <Route
        path="/dogs/:dogId"
        element={
          <Protected title="Dog Details">
            <DogDetails />
          </Protected>
        }
      />
      <Route
        path="/statistics"
        element={
          <Protected title="Statistics">
            <Statistics />
          </Protected>
        }
      />
      <Route
        path="/settings"
        element={
          <Protected title="Settings">
            <Settings />
          </Protected>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <MainLayout title="Admin Panel">
              <ErrorBoundary resetKey={location.pathname}>
                <Admin />
              </ErrorBoundary>
            </MainLayout>
          </AdminRoute>
        }
      />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

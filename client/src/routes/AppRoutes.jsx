import React from 'react';
import PropTypes from 'prop-types';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ProtectedRoute from '../components/common/ProtectedRoute';
import MainLayout from '../components/common/MainLayout';
import ErrorBoundary from '../components/common/ErrorBoundary';

import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import Dashboard from '../pages/Dashboard';
import MapPage from '../pages/MapPage';
import Heatmap from '../pages/Heatmap';
import Upload from '../pages/Upload';
import Search from '../pages/Search';
import DogDetails from '../pages/DogDetails';
import Statistics from '../pages/Statistics';
import Profile from '../pages/Profile';
import Settings from '../pages/Settings';
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
  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected app routes */}
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
        path="/profile"
        element={
          <Protected title="Profile">
            <Profile />
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

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { TextField, Button, Box, Alert, InputAdornment, Link, Stack, Typography } from '@mui/material';
import EmailRounded from '@mui/icons-material/EmailRounded';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import AuthLayout from '../components/common/AuthLayout';
import { useAuth } from '../context/AuthContext';
import { validateEmail } from '../utils/validators';
import { mapAuthError } from './Login';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your account email and we'll send you a reset link."
    >
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2.5}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && (
            <Alert severity="success">
              Password reset email sent. Please check your inbox (and spam folder).
            </Alert>
          )}

          <TextField
            label="Email address"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailRounded fontSize="small" />
                </InputAdornment>
              )
            }}
          />

          <Button type="submit" variant="contained" size="large" disabled={loading} fullWidth>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>

          <Typography variant="body2" textAlign="center">
            <Link
              component={RouterLink}
              to="/login"
              underline="hover"
              fontWeight={600}
              sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
            >
              <ArrowBackRounded fontSize="small" /> Back to sign in
            </Link>
          </Typography>
        </Stack>
      </Box>
    </AuthLayout>
  );
}

import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  Divider,
  Chip
} from '@mui/material';
import EditRounded from '@mui/icons-material/EditRounded';
import SaveRounded from '@mui/icons-material/SaveRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import EmailRounded from '@mui/icons-material/EmailRounded';
import EventRounded from '@mui/icons-material/EventRounded';
import VerifiedRounded from '@mui/icons-material/VerifiedRounded';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/format';

export default function Profile() {
  const { currentUser, updateUserProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentUser?.displayName || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const initials = (currentUser?.displayName || currentUser?.email || '?')[0].toUpperCase();
  const memberSince = currentUser?.metadata?.creationTime
    ? formatDate(currentUser.metadata.creationTime)
    : '—';

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name cannot be empty.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      await updateUserProfile({ displayName: name.trim() });
      setSuccess(true);
      setEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(currentUser?.displayName || '');
    setEditing(false);
    setError('');
  };

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Avatar
                sx={{
                  width: 96,
                  height: 96,
                  bgcolor: 'primary.main',
                  fontSize: 36,
                  fontWeight: 700,
                  mx: 'auto',
                  mb: 2,
                  boxShadow: 3
                }}
              >
                {initials}
              </Avatar>
              <Typography variant="h6" fontWeight={700}>
                {currentUser?.displayName || 'Unnamed User'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {currentUser?.email}
              </Typography>
              <Chip
                icon={<VerifiedRounded />}
                label={currentUser?.emailVerified ? 'Email verified' : 'Email not verified'}
                color={currentUser?.emailVerified ? 'success' : 'default'}
                size="small"
                variant={currentUser?.emailVerified ? 'filled' : 'outlined'}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader
              title="Account Details"
              titleTypographyProps={{ fontWeight: 700 }}
              action={
                !editing && (
                  <Button size="small" startIcon={<EditRounded />} onClick={() => setEditing(true)}>
                    Edit
                  </Button>
                )
              }
            />
            <Divider />
            <CardContent>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Profile updated successfully.
                </Alert>
              )}

              <Stack spacing={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Full Name
                  </Typography>
                  {editing ? (
                    <TextField
                      fullWidth
                      size="small"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      sx={{ mt: 0.5 }}
                    />
                  ) : (
                    <Typography variant="body1" fontWeight={600}>
                      {currentUser?.displayName || '—'}
                    </Typography>
                  )}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <EmailRounded fontSize="small" color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Email Address
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {currentUser?.email}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <EventRounded fontSize="small" color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Member Since
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {memberSince}
                    </Typography>
                  </Box>
                </Box>

                {editing && (
                  <Stack direction="row" spacing={1.5}>
                    <Button
                      variant="contained"
                      startIcon={<SaveRounded />}
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button variant="outlined" startIcon={<CloseRounded />} onClick={handleCancel} disabled={saving}>
                      Cancel
                    </Button>
                  </Stack>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

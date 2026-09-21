import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Typography,
  Chip,
  Stack,
  Alert,
  Skeleton,
  Button,
  Divider,
  Snackbar,
  CircularProgress
} from '@mui/material';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import PetsRounded from '@mui/icons-material/PetsRounded';
import PlaceRounded from '@mui/icons-material/PlaceRounded';
import EventRounded from '@mui/icons-material/EventRounded';
import UpdateRounded from '@mui/icons-material/UpdateRounded';
import RepeatRounded from '@mui/icons-material/RepeatRounded';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import AccountCircleRounded from '@mui/icons-material/AccountCircleRounded';
import MyLocationRounded from '@mui/icons-material/MyLocationRounded';
import MapView from '../components/map/MapView';
import MovementTimeline from '../components/dogs/MovementTimeline';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { dogService } from '../services/dogService';
import { useAuth } from '../context/AuthContext';
import { getCurrentPosition, reverseGeocode } from '../utils/geolocation';
import { formatDate, formatDateTime } from '../utils/format';

function InfoRow({ icon, label, value }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Avatar sx={{ width: 34, height: 34, bgcolor: 'action.hover', color: 'text.secondary' }}>{icon}</Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={600} noWrap>
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}

InfoRow.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
};

export default function DogDetails() {
  const { dogId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [dog, setDog] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [relocating, setRelocating] = useState(false);
  const [relocateError, setRelocateError] = useState('');
  const [relocateSuccess, setRelocateSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    Promise.all([dogService.getDogById(dogId), dogService.getDogHistory(dogId)])
      .then(([dogRes, historyRes]) => {
        if (!active) return;
        setDog(dogRes.dog);
        setHistory(historyRes.history || []);
      })
      .catch((err) => active && setError(err.message || 'Failed to load this dog.'))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [dogId]);

  // Chronological (oldest -> newest) path for the movement polyline.
  const movementPath = useMemo(
    () =>
      [...history]
        .filter((s) => typeof s.latitude === 'number' && typeof s.longitude === 'number')
        .reverse()
        .map((s) => ({ lat: s.latitude, lng: s.longitude })),
    [history]
  );

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={40} width={140} sx={{ mb: 2, borderRadius: 2 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Skeleton variant="rounded" height={420} sx={{ borderRadius: 4 }} />
          </Grid>
          <Grid item xs={12} md={7}>
            <Skeleton variant="rounded" height={420} sx={{ borderRadius: 4 }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (error || !dog) {
    return (
      <Box>
        <Button startIcon={<ArrowBackRounded />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          Back
        </Button>
        <Alert severity="error">{error || `Dog ${dogId} could not be found.`}</Alert>
      </Box>
    );
  }

  const isRepeat = (dog.totalSightings || 0) > 1;
  const isOwner = Boolean(currentUser?.uid) && dog.uploadedBy === currentUser.uid;

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await dogService.deleteDog(dog.dogId);
      navigate('/search', { replace: true });
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete this dog.');
      setDeleting(false);
    }
  };

  // Captures the user's current GPS position and logs it as a fresh point
  // for this dog - the previous location stays intact in sighting_history,
  // so the movement timeline and trace-route polyline both grow instead of
  // being overwritten.
  const handleRelocate = async () => {
    setRelocating(true);
    setRelocateError('');
    try {
      const { latitude, longitude } = await getCurrentPosition();
      const address = await reverseGeocode(latitude, longitude);
      const capturedAt = new Date().toISOString();

      await dogService.relocateDog(dog.dogId, { latitude, longitude, address, capturedAt });

      const [dogRes, historyRes] = await Promise.all([
        dogService.getDogById(dogId),
        dogService.getDogHistory(dogId)
      ]);
      setDog(dogRes.dog);
      setHistory(historyRes.history || []);
      setRelocateSuccess(true);
    } catch (err) {
      setRelocateError(err.message || 'Failed to update this dog\'s location.');
    } finally {
      setRelocating(false);
    }
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <Button startIcon={<ArrowBackRounded />} onClick={() => navigate(-1)}>
          Back
        </Button>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={relocating ? <CircularProgress size={16} color="inherit" /> : <MyLocationRounded />}
            onClick={handleRelocate}
            disabled={relocating}
          >
            {relocating ? 'Locating...' : 'Relocate'}
          </Button>
          {isOwner && (
            <Button
              color="error"
              variant="outlined"
              startIcon={<DeleteRounded />}
              onClick={() => setConfirmOpen(true)}
            >
              Delete Dog
            </Button>
          )}
        </Stack>
      </Stack>

      {relocateError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setRelocateError('')}>
          {relocateError}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Card>
            <Box sx={{ position: 'relative' }}>
              {dog.imageUrl ? (
                <Box
                  component="img"
                  src={dog.imageUrl}
                  alt={dog.dogId}
                  sx={{ width: '100%', height: 300, objectFit: 'cover' }}
                />
              ) : (
                <Box
                  sx={{
                    height: 300,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'action.hover'
                  }}
                >
                  <PetsRounded sx={{ fontSize: 64, color: 'text.disabled' }} />
                </Box>
              )}
              <Chip
                icon={isRepeat ? <RepeatRounded /> : <PetsRounded />}
                label={isRepeat ? 'Repeat Dog' : 'New Dog'}
                color={isRepeat ? 'secondary' : 'success'}
                sx={{ position: 'absolute', top: 12, right: 12, fontWeight: 700 }}
              />
              {isOwner && (
                <Chip
                  icon={<AccountCircleRounded />}
                  label="Uploaded by you"
                  color="primary"
                  sx={{ position: 'absolute', top: 12, left: 12, fontWeight: 700 }}
                />
              )}
            </Box>
            <CardContent>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                {dog.dogId}
              </Typography>

              <Stack spacing={2} sx={{ mt: 2 }}>
                <InfoRow icon={<EventRounded fontSize="small" />} label="First Detected" value={formatDate(dog.firstDetected)} />
                <InfoRow icon={<UpdateRounded fontSize="small" />} label="Latest Detected" value={formatDateTime(dog.latestDetected)} />
                <InfoRow icon={<PlaceRounded fontSize="small" />} label="Latest Location" value={dog.latestAddress || 'Unknown location'} />
                <InfoRow icon={<RepeatRounded fontSize="small" />} label="Total Sightings" value={dog.totalSightings || 1} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Stack spacing={3}>
            <Card>
              <CardHeader title="Location & Movement" titleTypographyProps={{ fontWeight: 700 }} />
              <CardContent sx={{ pt: 0 }}>
                <MapView
                  dogs={[dog]}
                  movementPath={movementPath}
                  height={280}
                  onMarkerClick={() => {}}
                  onDogDeleted={() => navigate('/search', { replace: true })}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Movement History" titleTypographyProps={{ fontWeight: 700 }} />
              <Divider />
              <CardContent>
                <MovementTimeline history={history} />
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this dog?"
        message={`This will permanently remove ${dog.dogId} and all of its sighting history. This can't be undone.`}
        confirmLabel="Delete"
        loading={deleting}
        error={deleteError}
        onConfirm={handleDelete}
        onClose={() => (!deleting ? setConfirmOpen(false) : null)}
      />

      <Snackbar
        open={relocateSuccess}
        autoHideDuration={4000}
        onClose={() => setRelocateSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setRelocateSuccess(false)} sx={{ width: '100%' }}>
          Location updated - added to travel history.
        </Alert>
      </Snackbar>
    </Box>
  );
}

import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Alert, Skeleton, Chip, Stack, Typography } from '@mui/material';
import MapView from '../components/map/MapView';
import { dogService } from '../services/dogService';
import { getCurrentPosition } from '../utils/geolocation';

export default function MapPage() {
  const [dogs, setDogs] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDog, setSelectedDog] = useState(null);

  useEffect(() => {
    let active = true;

    dogService
      .getAllDogs()
      .then((res) => {
        if (active) setDogs(res.dogs || []);
      })
      .catch((err) => active && setError(err.message || 'Failed to load dogs.'))
      .finally(() => active && setLoading(false));

    getCurrentPosition()
      .then(({ latitude, longitude }) => {
        if (active) setCurrentLocation({ lat: latitude, lng: longitude });
      })
      .catch(() => {
        /* location permission optional on this page */
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <Chip label={`${dogs.length} dogs detected`} color="primary" sx={{ fontWeight: 700 }} />
        {selectedDog && (
          <Chip
            label={`Viewing: ${selectedDog.dogId}`}
            onDelete={() => setSelectedDog(null)}
            color="secondary"
            sx={{ fontWeight: 700 }}
          />
        )}
      </Stack>

      <Card>
        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
          {loading ? (
            <Skeleton variant="rounded" height={560} sx={{ borderRadius: 3 }} />
          ) : (
            <MapView
              dogs={dogs}
              currentLocation={currentLocation}
              height="calc(100vh - 260px)"
              onMarkerClick={setSelectedDog}
              onDogDeleted={(dogId) => {
                setDogs((prev) => prev.filter((d) => d.dogId !== dogId));
                setSelectedDog((prev) => (prev?.dogId === dogId ? null : prev));
              }}
            />
          )}
        </CardContent>
      </Card>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
        Tap a paw marker to preview a dog, or open its full profile from the info card.
      </Typography>
    </Box>
  );
}

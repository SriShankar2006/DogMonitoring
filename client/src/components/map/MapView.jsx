import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Typography, Avatar, Chip, IconButton, Tooltip } from '@mui/material';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import AccountCircleRounded from '@mui/icons-material/AccountCircleRounded';
import { useAuth } from '../../context/AuthContext';
import { dogService } from '../../services/dogService';
import ConfirmDialog from '../common/ConfirmDialog';

const DEFAULT_CENTER = { lat: 11.0168, lng: 76.9558 }; // Coimbatore, India
const DEFAULT_ZOOM = 12;

const dogIcon = new L.DivIcon({
  className: 'dog-marker-icon',
  html: `<div style="width: 36px; height: 36px; border-radius: 50%; background: #2E7D32; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 4px rgba(255,255,255,.8);">
      <span style="color: #fff; font-size: 18px; line-height: 1;">🐾</span>
    </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36]
});

function FitBounds({ bounds }) {
  const map = useMap();
  if (bounds.length > 0) {
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 14 });
  }
  return null;
}

// Content rendered inside each dog's marker popup - shows the same
// ownership badge and delete action as DogCard/DogDetails so a signed-in
// user can tell at a glance which dogs they uploaded and remove them
// straight from the map, without navigating to the full profile page.
function DogPopupContent({ dog, onDeleted }) {
  const { currentUser } = useAuth();
  const isOwner = Boolean(currentUser?.uid) && dog.uploadedBy === currentUser.uid;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await dogService.deleteDog(dog.dogId);
      setConfirmOpen(false);
      onDeleted?.(dog.dogId);
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete this dog.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', maxWidth: 220 }}>
      <Avatar src={dog.imageUrl} variant="rounded" />
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
          <Typography variant="subtitle2" fontWeight={700} noWrap>
            {dog.dogId}
          </Typography>
          {isOwner && (
            <Tooltip title="Uploaded by you">
              <Chip
                icon={<AccountCircleRounded />}
                label="Your upload"
                size="small"
                color="primary"
                sx={{ height: 20, '& .MuiChip-icon': { fontSize: 14 } }}
              />
            </Tooltip>
          )}
        </Box>
        <Typography variant="caption" color="text.secondary">
          {dog.totalSightings || 1} sighting(s)
        </Typography>
      </Box>
      {isOwner && (
        <Tooltip title="Delete this dog">
          <IconButton
            size="small"
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmOpen(true);
            }}
          >
            <DeleteRounded fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

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
    </Box>
  );
}

DogPopupContent.propTypes = {
  dog: PropTypes.shape({
    dogId: PropTypes.string,
    imageUrl: PropTypes.string,
    totalSightings: PropTypes.number,
    uploadedBy: PropTypes.string
  }).isRequired,
  onDeleted: PropTypes.func
};

export default function MapView({
  dogs = [],
  currentLocation = null,
  movementPath = null,
  height = 420,
  onMarkerClick,
  onDogDeleted
}) {
  const [activeDog, setActiveDog] = useState(null);

  // Only consider dogs that actually have usable coordinates - a dog record
  // with a missing/undefined lat or lng must never be used to set the map
  // center or rendered as a marker, otherwise Leaflet throws "Invalid LatLng".
  const validDogs = useMemo(
    () => dogs.filter((dog) => typeof dog.latestLatitude === 'number' && typeof dog.latestLongitude === 'number'),
    [dogs]
  );

  const center = useMemo(() => {
    if (currentLocation && typeof currentLocation.lat === 'number' && typeof currentLocation.lng === 'number') {
      return currentLocation;
    }
    if (validDogs[0]) return { lat: validDogs[0].latestLatitude, lng: validDogs[0].latestLongitude };
    return DEFAULT_CENTER;
  }, [validDogs, currentLocation]);

  const bounds = useMemo(() => {
    const points = [];
    if (currentLocation && typeof currentLocation.lat === 'number' && typeof currentLocation.lng === 'number') {
      points.push([currentLocation.lat, currentLocation.lng]);
    }
    validDogs.forEach((dog) => {
      points.push([dog.latestLatitude, dog.latestLongitude]);
    });
    return points;
  }, [validDogs, currentLocation]);

  const polylinePositions = useMemo(
    () => (movementPath || []).map((point) => [point.lat, point.lng]),
    [movementPath]
  );

  // Every point except the last is a past stop along the trail; the last
  // one is the dog's current location (already shown with the big paw
  // marker), so we only need small dots for the earlier points here.
  const pastStops = useMemo(
    () => (movementPath && movementPath.length > 1 ? movementPath.slice(0, -1) : []),
    [movementPath]
  );

  return (
    <Box sx={{ width: '100%', height, '& .leaflet-container': { height: '100%', borderRadius: 16 } }}>
      <MapContainer center={[center.lat, center.lng]} zoom={DEFAULT_ZOOM} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {bounds.length > 1 && <FitBounds bounds={bounds} />}

        {currentLocation && (
          <CircleMarker
            center={[currentLocation.lat, currentLocation.lng]}
            pathOptions={{ color: '#2196F3', fillColor: '#2196F3', fillOpacity: 0.7 }}
            radius={8}
          >
            <Popup>Your location</Popup>
          </CircleMarker>
        )}

        {validDogs.map((dog) => (
          <Marker
            key={dog.dogId || `${dog.latestLatitude}-${dog.latestLongitude}`}
            position={[dog.latestLatitude, dog.latestLongitude]}
            icon={dogIcon}
            eventHandlers={{
              click: () => {
                setActiveDog(dog);
                onMarkerClick?.(dog);
              }
            }}
          >
            <Popup>
              <DogPopupContent
                dog={dog}
                onDeleted={(dogId) => {
                  setActiveDog(null);
                  onDogDeleted?.(dogId);
                }}
              />
            </Popup>
          </Marker>
        ))}

        {polylinePositions.length > 1 && (
          <Polyline pathOptions={{ color: '#FF8F00', weight: 4, opacity: 0.85 }} positions={polylinePositions} />
        )}

        {pastStops.map((point, idx) => (
          <CircleMarker
            key={`stop-${idx}-${point.lat}-${point.lng}`}
            center={[point.lat, point.lng]}
            pathOptions={{ color: '#FF8F00', fillColor: '#FFFFFF', fillOpacity: 1, weight: 3 }}
            radius={6}
          >
            <Popup>Stop #{idx + 1}</Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </Box>
  );
}

MapView.propTypes = {
  dogs: PropTypes.arrayOf(
    PropTypes.shape({
      dogId: PropTypes.string,
      latestLatitude: PropTypes.number,
      latestLongitude: PropTypes.number,
      imageUrl: PropTypes.string,
      totalSightings: PropTypes.number
    })
  ),
  currentLocation: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number
  }),
  movementPath: PropTypes.arrayOf(
    PropTypes.shape({
      lat: PropTypes.number,
      lng: PropTypes.number
    })
  ),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onMarkerClick: PropTypes.func,
  onDogDeleted: PropTypes.func
};

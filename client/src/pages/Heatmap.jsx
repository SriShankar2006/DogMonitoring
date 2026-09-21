import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Alert,
  Skeleton,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Backdrop,
  CircularProgress
} from '@mui/material';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import PlaceRounded from '@mui/icons-material/PlaceRounded';
import PetsRounded from '@mui/icons-material/PetsRounded';
import HeatmapLayer from '../components/map/HeatmapLayer';
import { dogService } from '../services/dogService';
import { useAuth } from '../context/AuthContext';

const DEFAULT_CENTER = [11.0168, 76.9558]; // Coimbatore, India
const RANGES = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'all', label: 'All Time' }
];
const WEIGHT_MODES = [
  { value: 'dogs', label: 'Unique Dogs' },
  { value: 'sightings', label: 'Total Sightings' }
];

// Group sightings that fall within roughly the same ~110m x ~110m patch of
// ground into a single "hotspot" - that's what lets us say "N dogs were
// seen in this same place" instead of just plotting raw scattered points.
function clusterSightings(sightings, precision = 3) {
  const groups = new Map();
  sightings.forEach((s) => {
    if (typeof s.latitude !== 'number' || typeof s.longitude !== 'number') return;
    const key = `${s.latitude.toFixed(precision)}:${s.longitude.toFixed(precision)}`;
    if (!groups.has(key)) {
      groups.set(key, {
        lat: s.latitude,
        lng: s.longitude,
        dogIds: new Set(),
        sightingCount: 0,
        address: s.address || null
      });
    }
    const g = groups.get(key);
    g.dogIds.add(s.dogId);
    g.sightingCount += 1;
    if (!g.address && s.address) g.address = s.address;
  });

  return Array.from(groups.values())
    .map((g) => ({
      lat: g.lat,
      lng: g.lng,
      dogCount: g.dogIds.size,
      sightingCount: g.sightingCount,
      address: g.address || 'Unknown location'
    }))
    .sort((a, b) => b.dogCount - a.dogCount || b.sightingCount - a.sightingCount);
}

function rangeToFrom(range) {
  if (range === 'all') return undefined;
  const now = new Date();
  const days = range === 'week' ? 7 : range === 'month' ? 30 : 365;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

function heatmapTabStorageKey(uid) {
  return `heatmapRange:${uid || 'anonymous'}`;
}

// MapContainer's `center` prop only applies on the very first mount in
// react-leaflet v4 - it does NOT re-center the map on prop changes. Since
// we now keep MapContainer mounted permanently (see comment below on why),
// this small helper re-centers the existing map instance imperatively
// whenever the computed center moves, without ever remounting the map.
function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (Array.isArray(center) && Number.isFinite(center[0]) && Number.isFinite(center[1])) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
}

RecenterMap.propTypes = {
  center: PropTypes.arrayOf(PropTypes.number)
};

export default function Heatmap() {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid;

  const [sightings, setSightings] = useState([]);
  // `loading` drives the Backdrop spinner shown over an already-rendered
  // map on every filter change; `initialLoading` is only true once, for the
  // very first fetch, and is what decides whether we show the full-page
  // skeleton instead of the map. Keeping the map mounted across filter
  // changes (instead of swapping Skeleton <-> MapContainer) avoids
  // repeatedly tearing down and recreating the Leaflet map, which is what
  // was causing the blank white page when switching tabs.
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [range, setRange] = useState(() => {
    if (typeof window === 'undefined') return 'month';
    return window.localStorage.getItem(heatmapTabStorageKey(uid)) || 'month';
  });
  const [weightMode, setWeightMode] = useState('dogs');

  // Re-sync the selected tab whenever the logged-in user changes (e.g. one
  // user logs out and a different one logs in on the same browser), and
  // persist it so the same user sees the same tab next time they log in.
  useEffect(() => {
    if (!uid) return;
    const saved = window.localStorage.getItem(heatmapTabStorageKey(uid));
    if (saved) setRange(saved);
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    window.localStorage.setItem(heatmapTabStorageKey(uid), range);
  }, [range, uid]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    dogService
      .getAllSightings({ from: rangeToFrom(range) })
      .then((res) => {
        if (active) setSightings(res.sightings || []);
      })
      .catch((err) => active && setError(err.message || 'Failed to load sighting data.'))
      .finally(() => {
        if (active) {
          setLoading(false);
          setInitialLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [range]);

  const clusters = useMemo(() => clusterSightings(sightings), [sightings]);

  const points = useMemo(
    () =>
      clusters.map((c) => ({
        lat: c.lat,
        lng: c.lng,
        weight: weightMode === 'dogs' ? c.dogCount : c.sightingCount
      })),
    [clusters, weightMode]
  );

  const hotspots = useMemo(() => clusters.filter((c) => c.dogCount > 1).slice(0, 8), [clusters]);

  const mapCenter = clusters[0] ? [clusters[0].lat, clusters[0].lng] : DEFAULT_CENTER;

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        sx={{ mb: 2 }}
      >
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
          <Chip
            icon={<PetsRounded />}
            label={`${clusters.reduce((sum, c) => sum + c.dogCount, 0)} dog-location points`}
            color="primary"
            sx={{ fontWeight: 700 }}
          />
          <Chip
            label={`${hotspots.length} hotspot${hotspots.length !== 1 ? 's' : ''} (2+ dogs same place)`}
            color="secondary"
            sx={{ fontWeight: 700 }}
          />
        </Stack>

        <Stack direction="row" spacing={1}>
          <ToggleButtonGroup
            value={weightMode}
            exclusive
            size="small"
            onChange={(e, val) => val && setWeightMode(val)}
            sx={{ bgcolor: 'background.paper' }}
          >
            {WEIGHT_MODES.map((m) => (
              <ToggleButton key={m.value} value={m.value} sx={{ fontWeight: 600, textTransform: 'none', px: 1.5 }}>
                {m.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <ToggleButtonGroup
            value={range}
            exclusive
            size="small"
            onChange={(e, val) => val && setRange(val)}
            sx={{ bgcolor: 'background.paper' }}
          >
            {RANGES.map((r) => (
              <ToggleButton key={r.value} value={r.value} sx={{ fontWeight: 600, textTransform: 'none', px: 1.5 }}>
                {r.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>
      </Stack>

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
        <Card sx={{ flexGrow: 1, minWidth: 0 }}>
          <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
            {initialLoading ? (
              <Skeleton variant="rounded" height={520} sx={{ borderRadius: 3 }} />
            ) : (
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: 'calc(100vh - 300px)',
                  minHeight: 420,
                  '& .leaflet-container': { height: '100%', borderRadius: 16 }
                }}
              >
                <Backdrop
                  open={loading}
                  sx={{
                    position: 'absolute',
                    zIndex: 1000,
                    borderRadius: 2,
                    bgcolor: 'rgba(255,255,255,0.5)'
                  }}
                >
                  <CircularProgress />
                </Backdrop>
                <MapContainer center={mapCenter} zoom={12} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <RecenterMap center={mapCenter} />
                  <HeatmapLayer points={points} radius={32} blur={24} />
                </MapContainer>
              </Box>
            )}

            <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1.5, px: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Few
              </Typography>
              <Box
                sx={{
                  flexGrow: 1,
                  height: 8,
                  borderRadius: 4,
                  background: 'linear-gradient(90deg, #2196F3, #4CAF50, #FFEB3B, #FF9800, #F44336)'
                }}
              />
              <Typography variant="caption" color="text.secondary">
                Many {weightMode === 'dogs' ? 'dogs' : 'sightings'}
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ width: { xs: '100%', lg: 340 }, flexShrink: 0 }}>
          <CardHeader title="Top Hotspots" titleTypographyProps={{ fontWeight: 700 }} />
          <Divider />
          <CardContent sx={{ pt: 1 }}>
            {initialLoading ? (
              <Stack spacing={1.5}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} variant="rounded" height={56} sx={{ borderRadius: 2 }} />
                ))}
              </Stack>
            ) : hotspots.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                No location has multiple dogs yet for this range.
              </Typography>
            ) : (
              <List disablePadding>
                {hotspots.map((h, idx) => (
                  <ListItem key={`${h.lat}-${h.lng}`} sx={{ px: 0, alignItems: 'flex-start' }}>
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip label={`#${idx + 1}`} size="small" color="primary" sx={{ fontWeight: 700, height: 20 }} />
                          <Typography variant="subtitle2" fontWeight={700}>
                            {h.dogCount} dogs here
                          </Typography>
                        </Stack>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, color: 'text.secondary' }}>
                          <PlaceRounded fontSize="inherit" />
                          <Typography variant="caption" noWrap>
                            {h.address} · {h.sightingCount} sighting{h.sightingCount !== 1 ? 's' : ''}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}

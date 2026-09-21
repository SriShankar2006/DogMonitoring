import React, { useEffect, useState } from 'react';
import { Grid, Card, CardHeader, CardContent, Box, Button, Alert, Skeleton } from '@mui/material';
import PetsRounded from '@mui/icons-material/PetsRounded';
import VisibilityRounded from '@mui/icons-material/VisibilityRounded';
import RepeatRounded from '@mui/icons-material/RepeatRounded';
import FiberNewRounded from '@mui/icons-material/FiberNewRounded';
import MapRounded from '@mui/icons-material/MapRounded';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/dashboard/StatCard';
import RecentUploads from '../components/dashboard/RecentUploads';
import MapView from '../components/map/MapView';
import { dogService, statsService } from '../services/dogService';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [statsRes, uploadsRes, dogsRes] = await Promise.all([
          statsService.getDashboardStats(),
          dogService.getRecentUploads(6),
          dogService.getAllDogs()
        ]);
        if (!active) return;
        setStats(statsRes);
        setUploads(uploadsRes.sightings || []);
        setDogs(dogsRes.dogs || []);
      } catch (err) {
        if (active) setError(err.message || 'Failed to load dashboard data.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const statCards = [
    { icon: <PetsRounded />, label: 'Total Dogs', value: stats?.totalDogs ?? 0, color: 'primary' },
    { icon: <VisibilityRounded />, label: 'Total Sightings', value: stats?.totalSightings ?? 0, color: 'info' },
    { icon: <RepeatRounded />, label: 'Repeat Sightings', value: stats?.repeatSightings ?? 0, color: 'secondary' },
    { icon: <FiberNewRounded />, label: 'New Dogs Today', value: stats?.newDogsToday ?? 0, color: 'success' }
  ];

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statCards.map((card) => (
          <Grid item xs={12} sm={6} lg={3} key={card.label}>
            {loading ? (
              <Skeleton variant="rounded" height={92} sx={{ borderRadius: 4 }} />
            ) : (
              <StatCard {...card} />
            )}
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={7}>
          <Card>
            <CardHeader
              title="Map Preview"
              titleTypographyProps={{ fontWeight: 700 }}
              action={
                <Button
                  size="small"
                  endIcon={<MapRounded />}
                  onClick={() => navigate('/map')}
                  sx={{ mr: 1 }}
                >
                  Full Map
                </Button>
              }
            />
            <CardContent>
              {loading ? (
                <Skeleton variant="rounded" height={360} sx={{ borderRadius: 3 }} />
              ) : (
                <MapView
                  dogs={dogs}
                  height={360}
                  onMarkerClick={(dog) => navigate(`/dogs/${dog.dogId}`)}
                  onDogDeleted={(dogId) => setDogs((prev) => prev.filter((d) => d.dogId !== dogId))}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={5}>
          {loading ? (
            <Skeleton variant="rounded" height={440} sx={{ borderRadius: 4 }} />
          ) : (
            <RecentUploads uploads={uploads} />
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

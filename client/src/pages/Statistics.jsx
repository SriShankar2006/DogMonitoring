import React, { useEffect, useState } from 'react';
import { Box, Grid, Alert, Skeleton, ToggleButtonGroup, ToggleButton, Stack } from '@mui/material';
import PetsRounded from '@mui/icons-material/PetsRounded';
import VisibilityRounded from '@mui/icons-material/VisibilityRounded';
import FiberNewRounded from '@mui/icons-material/FiberNewRounded';
import RepeatRounded from '@mui/icons-material/RepeatRounded';
import StatCard from '../components/dashboard/StatCard';
import StatsCharts from '../components/stats/StatsCharts';
import { statsService } from '../services/dogService';

const RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' }
];

export default function Statistics() {
  const [range, setRange] = useState('month');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    statsService
      .getFullStats(range)
      .then((res) => active && setStats(res))
      .catch((err) => active && setError(err.message || 'Failed to load statistics.'))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [range]);

  const cards = [
    { icon: <PetsRounded />, label: 'Total Dogs', value: stats?.totalDogs ?? 0, color: 'primary' },
    { icon: <FiberNewRounded />, label: 'New Dogs', value: stats?.newDogs ?? 0, color: 'success' },
    { icon: <RepeatRounded />, label: 'Repeat Dogs', value: stats?.repeatDogs ?? 0, color: 'secondary' },
    { icon: <VisibilityRounded />, label: 'Total Sightings', value: stats?.totalSightings ?? 0, color: 'info' }
  ];

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 3 }}>
        <ToggleButtonGroup
          value={range}
          exclusive
          size="small"
          onChange={(e, val) => val && setRange(val)}
          sx={{ bgcolor: 'background.paper' }}
        >
          {RANGES.map((r) => (
            <ToggleButton key={r.value} value={r.value} sx={{ fontWeight: 600, textTransform: 'none', px: 2 }}>
              {r.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} lg={3} key={card.label}>
            {loading ? (
              <Skeleton variant="rounded" height={92} sx={{ borderRadius: 4 }} />
            ) : (
              <StatCard {...card} />
            )}
          </Grid>
        ))}
      </Grid>

      {loading ? (
        <Grid container spacing={3}>
          <Grid item xs={12} lg={7}>
            <Skeleton variant="rounded" height={360} sx={{ borderRadius: 4 }} />
          </Grid>
          <Grid item xs={12} lg={5}>
            <Skeleton variant="rounded" height={360} sx={{ borderRadius: 4 }} />
          </Grid>
        </Grid>
      ) : (
        <StatsCharts stats={stats} />
      )}
    </Box>
  );
}

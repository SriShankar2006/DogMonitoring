import React, { useEffect, useState } from 'react';
import { Box, Grid, Alert, Skeleton, Typography } from '@mui/material';
import PetsRounded from '@mui/icons-material/PetsRounded';
import { useLocation } from 'react-router-dom';
import SearchFilters from '../components/search/SearchFilters';
import DogCard from '../components/dogs/DogCard';
import { dogService } from '../services/dogService';

const EMPTY_FILTERS = { dogId: '', location: '', date: '', filter: '' };

export default function Search() {
  const location = useLocation();
  const [filters, setFilters] = useState(() => ({
    ...EMPTY_FILTERS,
    dogId: location.state?.dogId || ''
  }));
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    // Debounce so we don't fire a request on every keystroke.
    const timer = setTimeout(() => {
      dogService
        .searchDogs(filters)
        .then((res) => {
          if (active) setDogs(res.dogs || []);
        })
        .catch((err) => active && setError(err.message || 'Failed to search dogs.'))
        .finally(() => active && setLoading(false));
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [filters]);

  return (
    <Box>
      <SearchFilters filters={filters} onChange={setFilters} onReset={() => setFilters(EMPTY_FILTERS)} />

      <Box sx={{ mt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {dogs.length} result{dogs.length !== 1 ? 's' : ''} found
          </Typography>
        )}

        <Grid container spacing={3}>
          {loading
            ? Array.from({ length: 6 }).map((_, idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Skeleton variant="rounded" height={300} sx={{ borderRadius: 4 }} />
                </Grid>
              ))
            : dogs.map((dog) => (
                <Grid item xs={12} sm={6} md={4} key={dog.dogId}>
                  <DogCard dog={dog} onDeleted={(dogId) => setDogs((prev) => prev.filter((d) => d.dogId !== dogId))} />
                </Grid>
              ))}
        </Grid>

        {!loading && !error && dogs.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <PetsRounded sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
            <Typography variant="h6" color="text.secondary">
              No dogs match your search
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting the filters or clearing them to see all dogs.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

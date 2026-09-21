import React from 'react';
import {
  Paper,
  TextField,
  InputAdornment,
  Chip,
  Stack,
  Box,
  Typography,
  IconButton,
  Tooltip
} from '@mui/material';
import SearchRounded from '@mui/icons-material/SearchRounded';
import PlaceRounded from '@mui/icons-material/PlaceRounded';
import EventRounded from '@mui/icons-material/EventRounded';
import RefreshRounded from '@mui/icons-material/RefreshRounded';

const QUICK_FILTERS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'new', label: 'New Dogs' },
  { key: 'repeat', label: 'Repeat Dogs' }
];

export default function SearchFilters({ filters, onChange, onReset }) {
  const set = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 4 }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Dog ID"
            placeholder="e.g. DOG012"
            fullWidth
            value={filters.dogId}
            onChange={(e) => set('dogId', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRounded fontSize="small" />
                </InputAdornment>
              )
            }}
          />
          <TextField
            label="Location"
            placeholder="Street, area, city..."
            fullWidth
            value={filters.location}
            onChange={(e) => set('location', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PlaceRounded fontSize="small" />
                </InputAdornment>
              )
            }}
          />
          <TextField
            label="Date"
            type="date"
            fullWidth
            value={filters.date}
            onChange={(e) => set('date', e.target.value)}
            InputLabelProps={{ shrink: true }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EventRounded fontSize="small" />
                </InputAdornment>
              )
            }}
          />
          <Tooltip title="Reset filters">
            <IconButton onClick={onReset} sx={{ alignSelf: { xs: 'flex-end', sm: 'center' } }}>
              <RefreshRounded />
            </IconButton>
          </Tooltip>
        </Stack>

        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Quick filters
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {QUICK_FILTERS.map((qf) => (
              <Chip
                key={qf.key}
                label={qf.label}
                color={filters.filter === qf.key ? 'primary' : 'default'}
                variant={filters.filter === qf.key ? 'filled' : 'outlined'}
                onClick={() => set('filter', filters.filter === qf.key ? '' : qf.key)}
                sx={{ fontWeight: 600 }}
              />
            ))}
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}

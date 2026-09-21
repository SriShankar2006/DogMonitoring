import React from 'react';
import { Box, Typography, Avatar, Chip, Paper, Stack } from '@mui/material';
import PetsRounded from '@mui/icons-material/PetsRounded';
import PlaceRounded from '@mui/icons-material/PlaceRounded';
import { formatDateTime } from '../../utils/format';

/**
 * Renders a dog's sighting history as a vertical movement timeline.
 * Implemented with plain MUI primitives (no @mui/lab dependency).
 */
export default function MovementTimeline({ history = [] }) {
  if (history.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
        No movement history recorded yet.
      </Typography>
    );
  }

  return (
    <Stack spacing={0}>
      {history.map((sighting, idx) => (
        <Box key={sighting.sightingId || idx} sx={{ display: 'flex', gap: 2 }}>
          {/* Rail: dot + connecting line */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: sighting.isNewDog ? 'success.main' : 'secondary.main',
                color: '#fff',
                flexShrink: 0,
                boxShadow: 2
              }}
            >
              <PetsRounded fontSize="small" />
            </Box>
            {idx < history.length - 1 && (
              <Box sx={{ flexGrow: 1, width: 2, bgcolor: 'divider', minHeight: 32, my: 0.5 }} />
            )}
          </Box>

          {/* Content card */}
          <Box sx={{ flexGrow: 1, pb: 3, minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              {formatDateTime(sighting.capturedAt || sighting.date)}
            </Typography>
            <Paper
              variant="outlined"
              sx={{ p: 1.5, borderRadius: 3, display: 'flex', gap: 1.5, alignItems: 'center' }}
            >
              <Avatar src={sighting.imageUrl} variant="rounded" sx={{ width: 48, height: 48 }}>
                <PetsRounded />
              </Avatar>
              <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {sighting.isNewDog ? 'First detected' : 'Sighting recorded'}
                  </Typography>
                  <Chip label={`${sighting.confidence ?? '—'}% confidence`} size="small" sx={{ height: 20 }} />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                  <PlaceRounded fontSize="inherit" />
                  <Typography variant="caption" noWrap>
                    {sighting.address || 'Unknown location'}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Box>
      ))}
    </Stack>
  );
}

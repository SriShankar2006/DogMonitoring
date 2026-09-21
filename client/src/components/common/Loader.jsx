import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import PetsIcon from '@mui/icons-material/Pets';

export default function Loader({ fullScreen = false, label = 'Loading...' }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        height: fullScreen ? '100vh' : '100%',
        width: '100%',
        py: fullScreen ? 0 : 6
      }}
    >
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress size={56} thickness={4} color="primary" />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <PetsIcon color="primary" fontSize="small" />
        </Box>
      </Box>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}

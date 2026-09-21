import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import PetsIcon from '@mui/icons-material/PetsRounded';
import HomeRounded from '@mui/icons-material/HomeRounded';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 3,
        textAlign: 'center'
      }}
    >
      <PetsIcon sx={{ fontSize: 72, color: 'primary.main' }} />
      <Typography variant="h3" fontWeight={700}>
        404
      </Typography>
      <Typography variant="h6" color="text.secondary">
        This page has wandered off, like a stray.
      </Typography>
      <Button
        variant="contained"
        startIcon={<HomeRounded />}
        onClick={() => navigate('/dashboard')}
        sx={{ mt: 1 }}
      >
        Back to Dashboard
      </Button>
    </Box>
  );
}

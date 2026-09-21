import React from 'react';
import { Box, Paper, Typography, useTheme } from '@mui/material';
import PetsIcon from '@mui/icons-material/PetsRounded';

export default function AuthLayout({ title, subtitle, children }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        background:
          theme.palette.mode === 'light'
            ? 'linear-gradient(135deg, #E8F5E9 0%, #F4F6F5 60%, #FFF3E0 100%)'
            : 'linear-gradient(135deg, #0B1210 0%, #101312 60%, #1A1408 100%)'
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 440 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3, gap: 1 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'primary.main',
              boxShadow: 4
            }}
          >
            <PetsIcon sx={{ color: '#fff', fontSize: 34 }} />
          </Box>
          <Typography variant="h5" fontWeight={700} textAlign="center">
            Stray Dog AI
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Detection &amp; Monitoring System
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}
        >
          <Typography variant="h5" fontWeight={700} gutterBottom>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {subtitle}
            </Typography>
          )}
          {children}
        </Paper>

        <Typography
          variant="caption"
          color="text.secondary"
          textAlign="center"
          display="block"
          sx={{ mt: 3 }}
        >
          © {new Date().getFullYear()} Stray Dog AI · Powered by community reporting
        </Typography>
      </Box>
    </Box>
  );
}

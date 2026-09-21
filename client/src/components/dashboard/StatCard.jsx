import React from 'react';
import { Card, CardContent, Box, Typography, Avatar } from '@mui/material';

export default function StatCard({ icon, label, value, color = 'primary', trend }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar
          sx={{
            bgcolor: `${color}.main`,
            width: 52,
            height: 52,
            boxShadow: 2
          }}
        >
          {icon}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" fontWeight={700} noWrap>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {label}
          </Typography>
          {trend && (
            <Typography variant="caption" color="success.main" fontWeight={600}>
              {trend}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

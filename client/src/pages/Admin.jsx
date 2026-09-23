import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
  Button
} from '@mui/material';

export default function Admin() {
  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Typography variant="h4" fontWeight={700}>Admin Panel</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={700}>Access</Typography>
                <Typography color="text.secondary">
                  Admin access is open for this local deployment.
                </Typography>
                <Button variant="contained" onClick={() => window.location.href = '/dashboard'}>
                  Go to Dashboard
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={700}>Available admin views</Typography>
                <Button variant="outlined" onClick={() => window.location.href = '/heatmap'}>Heatmap</Button>
                <Button variant="outlined" onClick={() => window.location.href = '/statistics'}>Statistics</Button>
                <Button variant="outlined" onClick={() => window.location.href = '/search'}>Search</Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

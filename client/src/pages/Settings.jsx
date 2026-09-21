import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  Stack,
  Switch,
  FormControlLabel,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip
} from '@mui/material';
import SettingsRounded from '@mui/icons-material/SettingsRounded';
import DarkModeRounded from '@mui/icons-material/DarkModeRounded';
import NotificationsRounded from '@mui/icons-material/NotificationsRounded';
import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded';
import { useThemeMode } from '../context/ThemeModeContext';
import { useAuth } from '../context/AuthContext';

const STORAGE_KEY = 'stray-dog-settings';

export default function Settings() {
  const { mode, toggleMode } = useThemeMode();
  const { currentUser } = useAuth();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      setNotificationsEnabled(saved.notificationsEnabled ?? true);
      setCompactMode(saved.compactMode ?? false);
      setRefreshInterval(saved.refreshInterval ?? 30);
    } catch {
      // Ignore malformed storage values and fall back to defaults.
    }
  }, []);

  useEffect(() => {
    const payload = { notificationsEnabled, compactMode, refreshInterval };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [notificationsEnabled, compactMode, refreshInterval]);

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        Your preferences are saved locally in this browser and apply across the monitoring dashboard.
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardHeader
              title="Application Preferences"
              titleTypographyProps={{ fontWeight: 700 }}
              avatar={<SettingsRounded color="primary" />}
            />
            <Divider />
            <CardContent>
              <Stack spacing={3}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      Dark mode
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Switch the workspace to a darker visual theme for low-light monitoring.
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={<Switch checked={mode === 'dark'} onChange={toggleMode} />}
                    label={mode === 'dark' ? 'On' : 'Off'}
                  />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      Desktop notifications
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Receive in-app reminders when new sightings are processed.
                    </Typography>
                  </Box>
                  <Switch
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      Compact overview
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Reduce spacing in cards for a denser dashboard experience.
                    </Typography>
                  </Box>
                  <Switch checked={compactMode} onChange={(e) => setCompactMode(e.target.checked)} />
                </Box>

                <FormControl fullWidth>
                  <InputLabel id="refresh-interval-label">Refresh interval</InputLabel>
                  <Select
                    labelId="refresh-interval-label"
                    value={refreshInterval}
                    label="Refresh interval"
                    onChange={(e) => setRefreshInterval(e.target.value)}
                  >
                    <MenuItem value={15}>15 seconds</MenuItem>
                    <MenuItem value={30}>30 seconds</MenuItem>
                    <MenuItem value={60}>1 minute</MenuItem>
                    <MenuItem value={120}>2 minutes</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card>
            <CardHeader
              title="Monitoring Profile"
              titleTypographyProps={{ fontWeight: 700 }}
              avatar={<AutoAwesomeRounded color="secondary" />}
            />
            <Divider />
            <CardContent>
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Signed in as
                  </Typography>
                  <Typography variant="h6" fontWeight={700}>
                    {currentUser?.displayName || 'Operator'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {currentUser?.email || 'No email available'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Current setup
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                    <Chip icon={<DarkModeRounded />} label={mode === 'dark' ? 'Dark UI' : 'Light UI'} />
                    <Chip icon={<NotificationsRounded />} label={notificationsEnabled ? 'Alerts on' : 'Alerts off'} />
                    <Chip icon={<SettingsRounded />} label={compactMode ? 'Compact view' : 'Comfortable view'} />
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
